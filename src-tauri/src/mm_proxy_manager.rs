use crate::merge_mining_adapter::MergeMiningProxyAdapter;
use crate::process_watcher::ProcessWatcher;
use log::info;
use std::path::PathBuf;
use std::sync::Arc;
use tari_shutdown::ShutdownSignal;
use tokio::sync::RwLock;
use tokio::time::sleep;

const LOG_TARGET: &str = "tari::universe::mm_proxy_manager";

pub struct MmProxyManager {
    watcher: Arc<RwLock<ProcessWatcher<MergeMiningProxyAdapter>>>,
}

impl MmProxyManager {
    pub fn new() -> Self {
        let sidecar_adapter = MergeMiningProxyAdapter::new();
        let process_watcher = ProcessWatcher::new(sidecar_adapter);

        Self {
            watcher: Arc::new(RwLock::new(process_watcher)),
        }
    }

    pub async fn start(
        &self,
        app_shutdown: ShutdownSignal,
        base_path: PathBuf,
    ) -> Result<(), anyhow::Error> {
        let mut process_watcher = self.watcher.write().await;
        info!(target: LOG_TARGET, "Starting mmproxy");
        process_watcher.start(app_shutdown, base_path).await?;

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
