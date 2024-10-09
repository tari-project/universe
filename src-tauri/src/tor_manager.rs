use std::{path::PathBuf, sync::Arc};
use tokio::sync::RwLock;

use crate::process_watcher::ProcessWatcher;
use crate::tor_adapter::TorAdapter;
use tari_shutdown::ShutdownSignal;

pub(crate) struct TorManager {
    watcher: Arc<RwLock<ProcessWatcher<TorAdapter>>>,
}

impl Clone for TorManager {
    fn clone(&self) -> Self {
        Self {
            watcher: self.watcher.clone(),
        }
    }
}

impl TorManager {
    pub fn new() -> Self {
        let adapter = TorAdapter::new();
        let process_watcher = ProcessWatcher::new(adapter);

        Self {
            watcher: Arc::new(RwLock::new(process_watcher)),
        }
    }

    pub async fn ensure_started(
        &self,
        app_shutdown: ShutdownSignal,
        base_path: PathBuf,
        config_path: PathBuf,
        log_path: PathBuf,
    ) -> Result<(), anyhow::Error> {
        {
            let mut process_watcher = self.watcher.write().await;
            process_watcher
                .start(app_shutdown, base_path, config_path, log_path)
                .await?;
        }
        self.wait_ready().await?;
        Ok(())
    }

    pub async fn wait_ready(&self) -> Result<(), anyhow::Error> {
        let process_watcher = self.watcher.read().await;
        match process_watcher.wait_ready().await {
            Ok(_) => {
                drop(process_watcher);
            }
            Err(e) => {
                drop(process_watcher);
                let mut write_lock = self.watcher.write().await;
                let _exit_code = write_lock.stop().await?;

                return Err(e);
            }
        }

        Ok(())
    }
}
