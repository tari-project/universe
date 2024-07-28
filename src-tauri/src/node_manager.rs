use crate::merge_mining_adapter::MergeMiningProxyAdapter;
use crate::minotari_node_adapter::MinotariNodeAdapter;
use crate::process_watcher::ProcessWatcher;
use std::sync::Arc;
use tari_shutdown::ShutdownSignal;
use tokio::sync::RwLock;

pub struct NodeManager {
    watcher: Arc<RwLock<ProcessWatcher<MinotariNodeAdapter>>>,
}

impl NodeManager {
    pub fn new() -> Self {
        let sidecar_adapter = MinotariNodeAdapter::new();
        let process_watcher = ProcessWatcher::new(sidecar_adapter);

        Self {
            watcher: Arc::new(RwLock::new(process_watcher)),
        }
    }

    pub async fn ensure_started(&self, app_shutdown: ShutdownSignal) -> Result<(), anyhow::Error> {
        let mut process_watcher = self.watcher.write().await;
        process_watcher.start(app_shutdown).await?;
        process_watcher.wait_ready().await?;
        Ok(())
    }

    pub async fn start(&self, app_shutdown: ShutdownSignal) -> Result<(), anyhow::Error> {
        dbg!("Starting node");
        let mut process_watcher = self.watcher.write().await;
        process_watcher.start(app_shutdown).await?;

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

    pub async fn stop(&self) -> Result<(), anyhow::Error> {
        let mut process_watcher = self.watcher.write().await;
        process_watcher.stop().await?;
        Ok(())
    }
}
