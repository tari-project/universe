use std::path::PathBuf;
use std::sync::Arc;
use std::time::Duration;

use anyhow::anyhow;
use log::warn;
use tari_shutdown::ShutdownSignal;
use tokio::sync::RwLock;
use tokio::time::sleep;

use crate::network_utils;
use crate::p2pool::models::Stats;
use crate::p2pool_adapter::P2poolAdapter;
use crate::process_watcher::ProcessWatcher;

const LOG_TARGET: &str = "tari::universe::p2pool_manager";
// const P2POOL_STATS_UPDATE_INTERVAL: Duration = Duration::from_secs(10);

#[derive(Clone)]
pub struct P2poolConfig {
    pub grpc_port: u16,
    pub stats_server_port: u16,
    pub base_node_address: String,
    pub auto_select_squad: bool,
    pub squad: Option<String>,
}

impl P2poolConfig {
    pub fn try_create() -> Result<Self, anyhow::Error> {
        let grpc_port =
            network_utils::get_free_port().ok_or_else(|| anyhow!("Could not assign free port"))?;
        let stats_server_port = network_utils::get_free_port()
            .ok_or_else(|| anyhow!("Could not assign free port for stats server"))?;
        Ok(P2poolConfig {
            grpc_port,
            stats_server_port,
            base_node_address: String::from("http://127.0.0.1:18142"),
            auto_select_squad: true,
            squad: None,
        })
    }

    pub fn with_base_node(mut self, grpc_port: u16) -> Self {
        self.base_node_address = format!("http://127.0.0.1:{}", grpc_port);
        self
    }

    pub fn with_auto_select_squad(mut self, auto_select_squad: bool) -> Self {
        self.auto_select_squad = auto_select_squad;
        self
    }

    pub fn with_squad(mut self, squad: String) -> Self {
        self.squad = Some(squad);
        self
    }
}

impl Clone for P2poolManager {
    fn clone(&self) -> Self {
        Self {
            watcher: self.watcher.clone(),
        }
    }
}

pub struct P2poolManager {
    watcher: Arc<RwLock<ProcessWatcher<P2poolAdapter>>>,
}

impl P2poolManager {
    pub fn new() -> Self {
        let adapter = P2poolAdapter::new();
        let process_watcher = ProcessWatcher::new(adapter);

        Self {
            watcher: Arc::new(RwLock::new(process_watcher)),
        }
    }

    pub async fn get_stats(&self) -> Result<Option<Stats>, anyhow::Error> {
        let process_watcher = self.watcher.read().await;
        if let Some(status_monitor) = &process_watcher.status_monitor {
            Ok(Some(status_monitor.status().await?))
        } else {
            Ok(None)
        }
    }

    pub async fn is_running(&self) -> Result<bool, anyhow::Error> {
        let process_watcher = self.watcher.read().await;
        if process_watcher.is_running() {
            return Ok(true);
        }
        Ok(false)
    }

    pub async fn ensure_started(
        &self,
        app_shutdown: ShutdownSignal,
        config: P2poolConfig,
        base_path: PathBuf,
        config_path: PathBuf,
        log_path: PathBuf,
    ) -> Result<(), anyhow::Error> {
        let mut process_watcher = self.watcher.write().await;
        if process_watcher.is_running() {
            return Ok(());
        }
        process_watcher.adapter.config = Some(config);
        process_watcher.health_timeout = Duration::from_secs(28);
        process_watcher.poll_time = Duration::from_secs(30);
        process_watcher
            .start(
                app_shutdown,
                base_path,
                config_path,
                log_path,
                crate::binaries::Binaries::ShaP2pool,
            )
            .await?;
        process_watcher.wait_ready().await?;
        if let Some(status_monitor) = &process_watcher.status_monitor {
            loop {
                sleep(Duration::from_secs(5)).await;
                if let Ok(_stats) = status_monitor.status().await {
                    break;
                } else {
                    warn!(target: LOG_TARGET, "P2pool stats not available yet");
                }
            } // wait until we have stats from p2pool, so its started
        }
        Ok(())
    }

    pub async fn stop(&self) -> Result<i32, anyhow::Error> {
        let mut process_watcher = self.watcher.write().await;
        let exit_code = process_watcher.stop().await?;
        if exit_code != 0 {
            warn!(target: LOG_TARGET, "P2pool process exited with code {}", exit_code);
        }
        Ok(exit_code)
    }

    pub async fn grpc_port(&self) -> u16 {
        let process_watcher = self.watcher.read().await;
        process_watcher
            .adapter
            .config
            .as_ref()
            .map(|c| c.grpc_port)
            .unwrap_or_default()
    }
}
