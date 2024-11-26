use anyhow::{anyhow, Error};
use async_trait::async_trait;
use log::{error, info, warn};
use sentry::protocol::Event;
use sentry_tauri::sentry;
use std::collections::HashMap;
use std::fs;
use std::path::PathBuf;
use tari_shutdown::Shutdown;
use tokio::runtime::Handle;
use tokio::select;
use tokio::task::JoinHandle;

use crate::process_killer::kill_process;
use crate::process_utils::launch_child_process;

const LOG_TARGET: &str = "tari::universe::process_adapter";

pub(crate) trait ProcessAdapter {
    type StatusMonitor: StatusMonitor;

    // fn spawn(&self) -> Result<(Receiver<()>, TInstance), anyhow::Error>;
    fn spawn_inner(
        &self,
        base_folder: PathBuf,
        config_folder: PathBuf,
        log_folder: PathBuf,
        binary_version_path: PathBuf,
    ) -> Result<(ProcessInstance, Self::StatusMonitor), anyhow::Error>;
    fn name(&self) -> &str;

    fn spawn(
        &self,
        base_folder: PathBuf,
        config_folder: PathBuf,
        log_folder: PathBuf,
        binary_version_path: PathBuf,
    ) -> Result<(ProcessInstance, Self::StatusMonitor), anyhow::Error> {
        self.spawn_inner(base_folder, config_folder, log_folder, binary_version_path)
    }

    fn pid_file_name(&self) -> &str;

    async fn kill_previous_instances(&self, base_folder: PathBuf) -> Result<(), Error> {
        info!(target: LOG_TARGET, "Killing previous instances of {}", self.name());
        match fs::read_to_string(base_folder.join(self.pid_file_name())) {
            Ok(pid) => match pid.trim().parse::<i32>() {
                Ok(pid) => {
                    warn!(target: LOG_TARGET, "{} process did not shut down cleanly: {} pid file was created", pid, self.pid_file_name());
                    kill_process(pid).await?;
                }
                Err(e) => {
                    let error_msg =
                        format!("Error parsing pid file: {}. Pid file content: {}", e, pid);
                    error!(target: LOG_TARGET, "{}", error_msg);
                    sentry::capture_event(Event {
                        message: Some(error_msg),
                        level: sentry::Level::Error,
                        culprit: Some("process-adapter".to_string()),
                        ..Default::default()
                    });
                }
            },
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

pub enum HealthStatus {
    Healthy,
    Warning,
    Unhealthy,
}

#[async_trait]
pub(crate) trait StatusMonitor: Clone + Sync + Send + 'static {
    async fn check_health(&self) -> HealthStatus;
}

#[derive(Clone)]
pub(crate) struct ProcessStartupSpec {
    pub file_path: PathBuf,
    pub envs: Option<HashMap<String, String>>,
    pub args: Vec<String>,
    pub pid_file_name: String,
    pub data_dir: PathBuf,
    pub name: String,
}

pub(crate) struct ProcessInstance {
    pub shutdown: Shutdown,
    pub handle: Option<JoinHandle<Result<i32, anyhow::Error>>>,
    pub startup_spec: ProcessStartupSpec,
}

impl ProcessInstance {
    pub fn ping(&self) -> bool {
        self.handle
            .as_ref()
            .map(|m| !m.is_finished())
            .unwrap_or_else(|| false)
    }

    pub async fn start(&mut self) -> Result<(), anyhow::Error> {
        if self.handle.is_some() {
            warn!(target: LOG_TARGET, "Process is already running");
            return Ok(());
        }
        info!(target: LOG_TARGET, "Starting {} process with args: {}, file_name: {}, data_dir: {}, file_path: {}", self.startup_spec.name, self.startup_spec.args.join(" "),self.startup_spec.pid_file_name,self.startup_spec.data_dir.display(),self.startup_spec.file_path.display());
        let spec = self.startup_spec.clone();
        // Reset the shutdown each time.
        self.shutdown = Shutdown::new();
        let shutdown_signal = self.shutdown.to_signal();
        self.handle = Some(tokio::spawn(async move {
            crate::download_utils::set_permissions(&spec.file_path).await?;
            // start
            info!(target: LOG_TARGET, "Launching {} node", spec.name);
            let mut child = launch_child_process(
                &spec.file_path,
                spec.data_dir.as_path(),
                spec.envs.as_ref(),
                &spec.args,
            )?;

            if let Some(id) = child.id() {
                fs::write(
                    spec.data_dir.join(spec.pid_file_name.clone()),
                    id.to_string(),
                )?;
            }
            let exit_code;

            select! {
                _res = shutdown_signal =>{
                    child.kill().await?;
                    exit_code = 0;
                    // res
                },
                res2 = child.wait() => {
                    match res2
                     {
                        Ok(res) => {
                            exit_code = res.code().unwrap_or(0)
                            },
                        Err(e) => {
                            warn!(target: LOG_TARGET, "Error in process instance {}:  {}", spec.name, e);
                            return Err(e.into());
                        }
                    }
                },
            };
            info!(target: LOG_TARGET, "Stopping {} node with exit code: {}", spec.name, exit_code);

            if let Err(error) = fs::remove_file(spec.data_dir.join(spec.pid_file_name)) {
                warn!(target: LOG_TARGET, "Could not clear {}'s pid file: {:?}", spec.name, error);
            }

            Ok(exit_code)
        }));
        Ok(())
    }

    pub async fn stop(&mut self) -> Result<i32, anyhow::Error> {
        self.shutdown.trigger();
        let handle = self.handle.take();
        handle
            .ok_or_else(|| anyhow!("Handle is not present"))?
            .await?
    }
}

impl Drop for ProcessInstance {
    fn drop(&mut self) {
        self.shutdown.trigger();
        if let Some(handle) = self.handle.take() {
            Handle::current().block_on(async move {
                if let Err(e) = handle.await {
                    warn!(target: LOG_TARGET, "Error in Process Adapter: {}", e);
                }
            });
        }
    }
}
