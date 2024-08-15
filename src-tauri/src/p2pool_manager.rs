use crate::p2pool::models::Stats;
use crate::p2pool_adapter::P2poolAdapter;
use crate::process_adapter::StatusMonitor;
use crate::process_watcher::ProcessWatcher;
use anyhow::Error;
use std::path::PathBuf;
use std::sync::Arc;
use tari_shutdown::ShutdownSignal;
use tokio::sync::RwLock;

pub struct P2poolManager {
    watcher: Arc<RwLock<ProcessWatcher<P2poolAdapter>>>,
}

impl P2poolManager {
    pub fn new() -> Self {
        let adapter = P2poolAdapter::new(18145, 19000);
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
        if let Some(status_monitor) = &process_watcher.status_monitor {
            loop {
                if let Ok(stats) = status_monitor.status().await {
                    if stats.connected {
                        break;
                    }
                }
            } // wait until we won't have error
        }
        Ok(())
    }
}
