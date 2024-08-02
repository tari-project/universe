use crate::minotari_node_adapter::MinotariNodeAdapter;
use crate::process_watcher::ProcessWatcher;
use std::path::PathBuf;
use std::sync::Arc;
use tari_core::transactions::tari_amount::MicroMinotari;
use tari_shutdown::ShutdownSignal;
use tokio::sync::RwLock;

const LOG_TARGET: &str = "tari::universe::node_manager";

pub struct NodeManager {
    watcher: Arc<RwLock<ProcessWatcher<MinotariNodeAdapter>>>,
}

impl NodeManager {
    pub fn new() -> Self {
        // TODO: wire up to front end
        let mut use_tor = true;

        // Unix systems have built in tor.
        // TODO: Add tor service for windows.
        #[cfg(target_os = "windows")]
        {
            use_tor = false;
        }

        let adapter = MinotariNodeAdapter::new(use_tor);
        let process_watcher = ProcessWatcher::new(adapter);

        Self {
            watcher: Arc::new(RwLock::new(process_watcher)),
        }
    }

    pub async fn ensure_started(
        &self,
        app_shutdown: ShutdownSignal,
        base_path: PathBuf,
    ) -> Result<(), anyhow::Error> {
        let mut process_watcher = self.watcher.write().await;
        process_watcher.start(app_shutdown, base_path).await?;
        process_watcher.wait_ready().await?;
        Ok(())
    }

    pub async fn start(
        &self,
        app_shutdown: ShutdownSignal,
        base_path: PathBuf,
    ) -> Result<(), anyhow::Error> {
        let mut process_watcher = self.watcher.write().await;
        process_watcher.start(app_shutdown, base_path).await?;

        Ok(())
    }

    pub async fn wait_ready(&self) -> Result<(), anyhow::Error> {
        // I'm ready when the http health service says so
        self.watcher.read().await.wait_ready().await?;
        Ok(())
    }

    pub async fn try_get_listening_port(&self) -> Result<u16, anyhow::Error> {
        // todo!()
        Ok(0)
    }

    /// Returns Sha hashrate, Rx hashrate and block reward
    pub async fn get_network_hash_rate_and_block_reward(&self) -> Result<(u64, u64, MicroMinotari), anyhow::Error> {
        let status_monitor_lock = self.watcher.read().await;
        let status_monitor = status_monitor_lock.status_monitor.as_ref().ok_or_else(|| anyhow::anyhow!("Node not started"))?;
        status_monitor.get_network_hash_rate_and_block_reward().await
    }

    pub async fn stop(&self) -> Result<(), anyhow::Error> {
        let mut process_watcher = self.watcher.write().await;
        process_watcher.stop().await?;
        Ok(())
    }
}
