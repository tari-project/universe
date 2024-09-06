use std::path::PathBuf;
use std::sync::Arc;

use anyhow::anyhow;
use log::info;
use tari_common_types::tari_address::TariAddress;
use tari_shutdown::ShutdownSignal;
use tokio::sync::RwLock;
use tokio::time::sleep;

use crate::mm_proxy_adapter::{MergeMiningProxyAdapter, MergeMiningProxyConfig};
use crate::process_watcher::ProcessWatcher;

const LOG_TARGET: &str = "tari::universe::mm_proxy_manager";

#[derive(Clone)]
pub struct StartConfig {
    pub app_shutdown: ShutdownSignal,
    pub base_path: PathBuf,
    pub config_path: PathBuf,
    pub log_path: PathBuf,
    pub tari_address: TariAddress,
    pub base_node_grpc_port: u16,
    pub coinbase_extra: String,
    pub p2pool_enabled: bool,
}

impl PartialEq for StartConfig {
    fn eq(&self, other: &Self) -> bool {
        self.base_path == other.base_path
            && self.config_path == other.config_path
            && self.log_path == other.log_path
            && self.tari_address == other.tari_address
            && self.base_node_grpc_port == other.base_node_grpc_port
            && self.coinbase_extra == other.coinbase_extra
    }
}

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
    pub fn new(config: MergeMiningProxyConfig) -> Self {
        let sidecar_adapter = MergeMiningProxyAdapter::new(config);
        let process_watcher = ProcessWatcher::new(sidecar_adapter);

        Self {
            watcher: Arc::new(RwLock::new(process_watcher)),
            start_config: Arc::new(RwLock::new(None)),
        }
    }

    pub async fn config(&self) -> MergeMiningProxyConfig {
        let lock = self.watcher.read().await;
        lock.adapter.config.clone()
    }

    pub async fn change_config(&self, config: MergeMiningProxyConfig) -> Result<(), anyhow::Error> {
        let sidecar_adapter = MergeMiningProxyAdapter::new(config);
        let process_watcher = ProcessWatcher::new(sidecar_adapter);
        let mut lock = self.watcher.write().await;
        lock.stop().await?;
        *lock = process_watcher;
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
        process_watcher.adapter.tari_address = config.tari_address;
        process_watcher.adapter.config.base_node_grpc_port = config.base_node_grpc_port;
        process_watcher.adapter.config.coinbase_extra = config.coinbase_extra;
        process_watcher.adapter.config.p2pool_enabled = config.p2pool_enabled;
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

    pub async fn try_get_listening_port(&self) -> Result<u16, anyhow::Error> {
        // todo!()
        Ok(0)
    }

    pub async fn stop(&self) -> Result<(), anyhow::Error> {
        let mut process_watcher = self.watcher.write().await;
        process_watcher.stop().await?;
        Ok(())
    }
}
