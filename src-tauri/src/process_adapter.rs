use crate::process_killer::kill_process;
use crate::ProgressTracker;
use anyhow::Error;
use async_trait::async_trait;
use log::{info, warn};
use std::fs;
use std::path::PathBuf;

const LOG_TARGET: &str = "tari::universe::process_adapter";

pub trait ProcessAdapter {
    type Instance: ProcessInstance;
    type StatusMonitor: StatusMonitor;
    // fn spawn(&self) -> Result<(Receiver<()>, TInstance), anyhow::Error>;
    fn spawn_inner(
        &self,
        base_folder: PathBuf,
    ) -> Result<(Self::Instance, Self::StatusMonitor), anyhow::Error>;
    fn name(&self) -> &str;

    fn spawn(
        &self,
        base_folder: PathBuf,
    ) -> Result<(Self::Instance, Self::StatusMonitor), anyhow::Error> {
        self.spawn_inner(base_folder)
    }

    fn pid_file_name(&self) -> &str;

    fn kill_previous_instances(&self, base_folder: PathBuf) -> Result<(), Error> {
        info!(target: LOG_TARGET, "Killing previous instances of {}", self.name());
        match fs::read_to_string(base_folder.join(self.pid_file_name())) {
            Ok(pid) => {
                let pid = pid.trim().parse::<u32>()?;
                kill_process(pid)?;
            }
            Err(e) => {
                warn!(target: LOG_TARGET, "Could not read node's pid file: {}", e);
            }
        }
        Ok(())
    }
}

pub trait StatusMonitor {
    fn status(&self) -> Result<(), anyhow::Error>;
}

#[async_trait]
pub trait ProcessInstance: Send + Sync + 'static {
    fn ping(&self) -> bool;
    async fn stop(&mut self) -> Result<(), anyhow::Error>;
}
