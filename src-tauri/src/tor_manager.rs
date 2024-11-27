use crate::process_watcher::ProcessWatcher;
use crate::tor_adapter::{TorAdapter, TorConfig};
use futures_util::future::FusedFuture;
use log::info;
use std::{path::PathBuf, sync::Arc};
use tari_shutdown::ShutdownSignal;
use tokio::sync::RwLock;

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

            // if process_watcher.is_running()
            //     || app_shutdown.is_terminated()
            //     || app_shutdown.is_triggered()
            // {
            //     return Ok(());
            // }

            process_watcher
                .adapter
                .load_or_create_config(config_path.clone())
                .await?;
            process_watcher
                .start(
                    app_shutdown,
                    base_path,
                    config_path,
                    log_path,
                    crate::binaries::Binaries::Tor,
                )
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

    pub async fn get_tor_config(&self) -> TorConfig {
        self.watcher.read().await.adapter.get_tor_config()
    }

    pub async fn set_tor_config(&self, config: TorConfig) -> Result<TorConfig, anyhow::Error> {
        self.watcher
            .write()
            .await
            .adapter
            .set_tor_config(config)
            .await
    }

    pub async fn get_control_port(&self) -> Result<Option<u16>, anyhow::Error> {
        let process_watcher = self.watcher.read().await;
        Ok(process_watcher
            .status_monitor
            .as_ref()
            .map(|m| m.control_port))
    }

    pub async fn get_entry_guards(&self) -> Result<Vec<String>, anyhow::Error> {
        self.watcher.read().await.adapter.get_entry_guards().await
    }

    pub async fn stop(&self) -> Result<i32, anyhow::Error> {
        let mut process_watcher = self.watcher.write().await;
        let exit_code = process_watcher.stop().await?;
        Ok(exit_code)
    }

    pub async fn is_running(&self) -> bool {
        let process_watcher = self.watcher.read().await;
        process_watcher.is_running()
    }

    pub async fn is_pid_file_exists(&self, base_path: PathBuf) -> bool {
        let lock = self.watcher.read().await;
        lock.is_pid_file_exists(base_path)
    }
}
