use crate::process_killer::kill_process;
use anyhow::Error;
use log::warn;
use tokio::runtime::Handle;
use std::fs;
use std::path::PathBuf;
use tari_shutdown::Shutdown;
use tokio::task::JoinHandle;

const LOG_TARGET: &str = "tari::universe::process_adapter";

pub trait ProcessAdapter {
    type StatusMonitor: StatusMonitor;
    // fn spawn(&self) -> Result<(Receiver<()>, TInstance), anyhow::Error>;
    fn spawn_inner(
        &self,
        base_folder: PathBuf,
    ) -> Result<(ProcessInstance, Self::StatusMonitor), anyhow::Error>;
    fn name(&self) -> &str;

    fn spawn(
        &self,
        base_folder: PathBuf,
    ) -> Result<(ProcessInstance, Self::StatusMonitor), anyhow::Error> {
        self.spawn_inner(base_folder)
    }

    fn pid_file_name(&self) -> &str;

    fn kill_previous_instances(&self, base_folder: PathBuf) -> Result<(), Error> {
        match fs::read_to_string(base_folder.join(self.pid_file_name())) {
            Ok(pid) => {
                let pid = pid.trim().parse::<u32>()?;
                kill_process(pid)?;
            }
            Err(e) => {
                warn!(target: LOG_TARGET, "Could not read {} pid file: {}", self.pid_file_name(), e);
            }
        }
        Ok(())
    }
}

pub trait StatusMonitor {
    fn status(&self) -> Result<(), anyhow::Error>;
}

pub struct ProcessInstance {
    pub shutdown: Shutdown,
    pub handle: Option<JoinHandle<Result<(), anyhow::Error>>>,
}

impl ProcessInstance {
    pub fn ping(&self) -> bool {
        self
            .handle
            .as_ref()
            .map(|m| !m.is_finished())
            .unwrap_or_else(|| false)
    }

    pub async fn stop(&mut self) -> Result<(), anyhow::Error> {
        self.shutdown.trigger();
        let handle = self.handle.take();
        handle.unwrap().await?
    }
}

impl Drop for ProcessInstance {
    fn drop(&mut self) {
        println!("Drop being called");
        self.shutdown.trigger();
        if let Some(handle) = self.handle.take() {
            Handle::current().block_on(async move {
                let _ = handle.await.unwrap();
            });
        }
    }
}