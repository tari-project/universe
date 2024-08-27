use std::path::PathBuf;
use std::sync::Arc;
use std::time::Duration;

use anyhow::anyhow;
use tari_shutdown::ShutdownSignal;
use tokio::sync::RwLock;
use tokio::time::sleep;

use crate::p2pool::models::Stats;
use crate::p2pool_adapter::P2poolAdapter;
use crate::process_adapter::StatusMonitor;
use crate::process_watcher::ProcessWatcher;

#[derive(Clone)]
pub struct P2poolConfig {
    pub grpc_port: u16,
    pub stats_server_port: u16,
    pub base_node_address: String,
}

pub struct P2poolConfigBuilder {
    config: P2poolConfig,
}

impl P2poolConfigBuilder {
    pub fn new() -> Self {
        Self {
            config: P2poolConfig::default(),
        }
    }

    pub fn with_base_node_address(&mut self, base_node_address: String) -> &mut Self {
        self.config.base_node_address = base_node_address;
        self
    }

    pub fn build(&self) -> P2poolConfig {
        self.config.clone()
    }
}

impl P2poolConfig {
    pub fn builder() -> P2poolConfigBuilder {
        P2poolConfigBuilder::new()
    }
}

impl Default for P2poolConfig {
    fn default() -> Self {
        Self {
            grpc_port: 18145,
            stats_server_port: 19000,
            base_node_address: String::from("http://127.0.0.1:18142"),
        }
    }
}

pub struct P2poolManager {
    config: Arc<P2poolConfig>,
    watcher: Arc<RwLock<ProcessWatcher<P2poolAdapter>>>,
}

impl P2poolManager {
    pub fn new(config: Arc<P2poolConfig>) -> Self {
        let adapter = P2poolAdapter::new(config.clone());
        let process_watcher = ProcessWatcher::new(adapter);

        Self {
            config,
            watcher: Arc::new(RwLock::new(process_watcher)),
        }
    }

    pub async fn stats(&self) -> Result<Stats, anyhow::Error> {
        let process_watcher = self.watcher.read().await;
        if let Some(status_monitor) = &process_watcher.status_monitor {
            return status_monitor.status().await;
        }
        Err(anyhow!("Failed to get stats"))
    }

    pub fn config(&self) -> Arc<P2poolConfig> {
        self.config.clone()
    }

    pub async fn ensure_started(
        &self,
        app_shutdown: ShutdownSignal,
        base_path: PathBuf,
        log_path: PathBuf,
    ) -> Result<(), anyhow::Error> {
        let mut process_watcher = self.watcher.write().await;
        process_watcher
            .start(app_shutdown, base_path, log_path)
            .await?;
        process_watcher.wait_ready().await?;
        if let Some(status_monitor) = &process_watcher.status_monitor {
            loop {
                sleep(Duration::from_secs(5)).await;
                if let Ok(_stats) = status_monitor.status().await {
                    break;
                }
            } // wait until we have stats from p2pool, so its started
        }
        Ok(())
    }
}
