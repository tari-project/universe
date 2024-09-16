use std::fs;
use std::path::PathBuf;

use anyhow::Error;
use async_trait::async_trait;
use log::{info, warn};
use tari_shutdown::Shutdown;
use tokio::runtime::Handle;
use tokio::task::JoinHandle;

use crate::process_killer::kill_process;

const LOG_TARGET: &str = "tari::universe::process_adapter";

pub(crate) trait ProcessAdapter {
    type StatusMonitor: StatusMonitor;

    // fn spawn(&self) -> Result<(Receiver<()>, TInstance), anyhow::Error>;
    fn spawn_inner(
        &self,
        base_folder: PathBuf,
        config_folder: PathBuf,
        log_folder: PathBuf,
    ) -> Result<(ProcessInstance, Self::StatusMonitor), anyhow::Error>;
    fn name(&self) -> &str;

    fn spawn(
        &self,
        base_folder: PathBuf,
        config_folder: PathBuf,
        log_folder: PathBuf,
    ) -> Result<(ProcessInstance, Self::StatusMonitor), anyhow::Error> {
        self.spawn_inner(base_folder, config_folder, log_folder)
    }

    fn pid_file_name(&self) -> &str;

    fn kill_previous_instances(&self, base_folder: PathBuf) -> Result<(), Error> {
        info!(target: LOG_TARGET, "Killing previous instances of {}", self.name());
        match fs::read_to_string(base_folder.join(self.pid_file_name())) {
            Ok(pid) => {
                let pid = pid.trim().parse::<i32>()?;
                warn!(target: LOG_TARGET, "{} process did not shut down cleanly: {} pid file was created", pid, self.pid_file_name());
                kill_process(pid)?;
            }
            Err(e) => {
                if let Ok(true) = std::path::Path::new(&base_folder)
                    .join(self.pid_file_name())
                    .try_exists()
                {
                    warn!(target: LOG_TARGET, "{} pid file exists, but the error occurred while killing: {}", self.name(), e);
                }
            }
        }
        Ok(())
    }
}

#[async_trait]
pub(crate) trait StatusMonitor {
    type Status;
    async fn status(&self) -> Result<Self::Status, anyhow::Error>;
}

pub(crate) struct ProcessInstance {
    pub shutdown: Shutdown,
    pub handle: Option<JoinHandle<Result<i32, anyhow::Error>>>,
}

impl ProcessInstance {
    pub fn ping(&self) -> bool {
        self.handle
            .as_ref()
            .map(|m| !m.is_finished())
            .unwrap_or_else(|| false)
    }

    pub async fn stop(&mut self) -> Result<i32, anyhow::Error> {
        self.shutdown.trigger();
        let handle = self.handle.take();
        handle.unwrap().await?
    }
}

impl Drop for ProcessInstance {
    fn drop(&mut self) {
        self.shutdown.trigger();
        if let Some(handle) = self.handle.take() {
            Handle::current().block_on(async move {
                let _ = handle.await.unwrap().map_err(|e| {
                    warn!(target: LOG_TARGET, "Error in Process Adapter: {}", e);
                });
            });
        }
    }
}
