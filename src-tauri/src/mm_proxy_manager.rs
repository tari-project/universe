use std::path::PathBuf;
use std::sync::Arc;

use anyhow::anyhow;
use log::info;
use tari_common_types::tari_address::TariAddress;
use tari_shutdown::ShutdownSignal;
use tokio::sync::RwLock;
use tokio::time::sleep;

use crate::mm_proxy_adapter::{MergeMiningProxyAdapter, MergeMiningProxyConfig};
use crate::network_utils;
use crate::process_watcher::ProcessWatcher;

const LOG_TARGET: &str = "tari::universe::mm_proxy_manager";

#[derive(Clone)]
pub(crate) struct StartConfig {
    pub app_shutdown: ShutdownSignal,
    pub base_path: PathBuf,
    pub config_path: PathBuf,
    pub log_path: PathBuf,
    pub tari_address: TariAddress,
    pub base_node_grpc_port: u16,
    pub coinbase_extra: String,
    pub p2pool_enabled: bool,
    pub p2pool_port: u16,
}

// impl PartialEq for StartConfig {
//     fn eq(&self, other: &Self) -> bool {
//         self.base_path == other.base_path
//             && self.config_path == other.config_path
//             && self.log_path == other.log_path
//             && self.tari_address == other.tari_address
//             && self.base_node_grpc_port == other.base_node_grpc_port
//             && self.coinbase_extra == other.coinbase_extra
//             && self.p2pool_enabled == other.p2pool_enabled
//             && self.p2pool_port == other.p2pool_port
//     }
// }

impl StartConfig {
    #[allow(clippy::too_many_arguments)]
    pub fn new(
        app_shutdown: ShutdownSignal,
        base_path: PathBuf,
        config_path: PathBuf,
        log_path: PathBuf,
        tari_address: TariAddress,
        base_node_grpc_port: u16,
        coinbase_extra: String,
        p2pool_enabled: bool,
        p2pool_port: u16,
    ) -> Self {
        Self {
            app_shutdown,
            base_path,
            config_path,
            log_path,
            tari_address,
            base_node_grpc_port,
            coinbase_extra,
            p2pool_enabled,
            p2pool_port,
        }
    }
}

pub struct MmProxyManager {
    watcher: Arc<RwLock<ProcessWatcher<MergeMiningProxyAdapter>>>,
    start_config: Arc<RwLock<Option<StartConfig>>>,
}

impl Clone for MmProxyManager {
    fn clone(&self) -> Self {
        Self {
            watcher: self.watcher.clone(),
            start_config: self.start_config.clone(),
        }
    }
}

impl MmProxyManager {
    pub fn new() -> Self {
        let sidecar_adapter = MergeMiningProxyAdapter::new();
        let process_watcher = ProcessWatcher::new(sidecar_adapter);

        Self {
            watcher: Arc::new(RwLock::new(process_watcher)),
            start_config: Arc::new(RwLock::new(None)),
        }
    }

    pub async fn config(&self) -> Option<MergeMiningProxyConfig> {
        let lock = self.watcher.read().await;
        lock.adapter.config.clone()
    }

    pub async fn change_config(&self, config: MergeMiningProxyConfig) -> Result<(), anyhow::Error> {
        let mut lock = self.watcher.write().await;
        lock.stop().await?;
        lock.adapter.config = Some(config);
        let start_config_read = self.start_config.read().await;
        match start_config_read.as_ref() {
            Some(start_config) => {
                drop(lock);
                let config = start_config.clone();
                drop(start_config_read);
                self.start(config).await?;
                self.wait_ready().await?;
            }
            None => {
                return Err(anyhow!(
                    "Missing start config! MM proxy manager must be started at least once!"
                ));
            }
        }

        Ok(())
    }

    pub async fn start(&self, config: StartConfig) -> Result<(), anyhow::Error> {
        let mut current_start_config = self.start_config.write().await;
        *current_start_config = Some(config.clone());
        let mut process_watcher = self.watcher.write().await;
        let new_config = MergeMiningProxyConfig {
            tari_address: config.tari_address.clone(),
            base_node_grpc_port: config.base_node_grpc_port,
            coinbase_extra: config.coinbase_extra.clone(),
            p2pool_enabled: config.p2pool_enabled,
            port: network_utils::get_free_port().expect("Failed to get free port"),
            p2pool_grpc_port: config.p2pool_port,
        };
        process_watcher.adapter.config = Some(new_config.clone());
        info!(target: LOG_TARGET, "Starting mmproxy");
        process_watcher
            .start(
                config.app_shutdown,
                config.base_path,
                config.config_path,
                config.log_path,
            )
            .await?;

        Ok(())
    }

    pub async fn wait_ready(&self) -> Result<(), anyhow::Error> {
        // TODO: I'm ready when the http health service says so
        self.watcher.read().await.wait_ready().await?;
        // TODO: Currently the mmproxy takes a long time to connect to all the monero daemons. This should be changed to waiting for the http or grpc service to
        // say it is online
        sleep(std::time::Duration::from_secs(20)).await;
        Ok(())
    }

    pub async fn get_monero_port(&self) -> Result<u16, anyhow::Error> {
        let lock = self.watcher.read().await;
        match lock.adapter.config.clone() {
            Some(config) => Ok(config.port),
            None => Err(anyhow!("MM proxy not started")),
        }
    }

    pub async fn stop(&self) -> Result<(), anyhow::Error> {
        let mut process_watcher = self.watcher.write().await;
        process_watcher.stop().await?;
        Ok(())
    }
}
