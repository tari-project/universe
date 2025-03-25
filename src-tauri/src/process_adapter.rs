// Copyright 2024. The Tari Project
//
// Redistribution and use in source and binary forms, with or without modification, are permitted provided that the
// following conditions are met:
//
// 1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following
// disclaimer.
//
// 2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the
// following disclaimer in the documentation and/or other materials provided with the distribution.
//
// 3. Neither the name of the copyright holder nor the names of its contributors may be used to endorse or promote
// products derived from this software without specific prior written permission.
//
// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES,
// INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
// DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
// SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
// SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
// WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE
// USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

use anyhow::{anyhow, Error};
use async_trait::async_trait;
use futures_util::future::FusedFuture;
use log::{error, info, warn};
use sentry::protocol::Event;
use std::collections::HashMap;
use std::fs;
use std::path::PathBuf;
use tari_shutdown::Shutdown;
use tauri_plugin_sentry::sentry;
use tokio::runtime::Handle;
use tokio::select;
use tokio::task::JoinHandle;

use crate::process_killer::kill_process;
use crate::process_utils::launch_child_process;
use crate::tasks_tracker::TasksTracker;

const LOG_TARGET: &str = "tari::universe::process_adapter";

pub(crate) trait ProcessAdapter {
    type StatusMonitor: StatusMonitor;
    type ProcessInstance: ProcessInstanceTrait;

    // fn spawn(&self) -> Result<(Receiver<()>, TInstance), anyhow::Error>;
    fn spawn_inner(
        &self,
        base_folder: PathBuf,
        config_folder: PathBuf,
        log_folder: PathBuf,
        binary_version_path: PathBuf,
    ) -> Result<(Self::ProcessInstance, Self::StatusMonitor), anyhow::Error>;
    fn name(&self) -> &str;

    fn spawn(
        &self,
        base_folder: PathBuf,
        config_folder: PathBuf,
        log_folder: PathBuf,
        binary_version_path: PathBuf,
    ) -> Result<(Self::ProcessInstance, Self::StatusMonitor), anyhow::Error> {
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

// TODO: Rename to ProcessInstance
#[async_trait]
pub(crate) trait ProcessInstanceTrait: Sync + Send + 'static {
    fn ping(&self) -> bool;
    async fn start(&mut self) -> Result<(), anyhow::Error>;
    async fn stop(&mut self) -> Result<i32, anyhow::Error>;
    fn is_shutdown_triggered(&self) -> bool;
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

#[async_trait]
impl ProcessInstanceTrait for ProcessInstance {
    fn ping(&self) -> bool {
        self.handle
            .as_ref()
            .map(|m| !m.is_finished())
            .unwrap_or_else(|| false)
    }

    async fn start(&mut self) -> Result<(), anyhow::Error> {
        if self.handle.is_some() {
            warn!(target: LOG_TARGET, "Process is already running");
            return Ok(());
        }
        info!(target: LOG_TARGET, "Starting {} process with args: {}", self.startup_spec.name, self.startup_spec.args.join(" "));
        let spec = self.startup_spec.clone();
        // Reset the shutdown each time.
        self.shutdown = Shutdown::new();
        let shutdown_signal = self.shutdown.to_signal();

        if shutdown_signal.is_terminated() || shutdown_signal.is_triggered() {
            warn!(target: LOG_TARGET, "Shutdown signal is triggered. Not starting process");
            return Ok(());
        };

        self.handle = Some(TasksTracker::current().spawn(async move {
            crate::download_utils::set_permissions(&spec.file_path).await?;
            // start
            info!(target: LOG_TARGET, "Launching process for: {}", spec.name);
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
            info!(target: LOG_TARGET, "Stopping {} process with exit code: {}", spec.name, exit_code);

            if let Err(error) = fs::remove_file(spec.data_dir.join(spec.pid_file_name)) {
                warn!(target: LOG_TARGET, "Could not clear {}'s pid file: {:?}", spec.name, error);
            }

            Ok(exit_code)
        }));
        Ok(())
    }

    async fn stop(&mut self) -> Result<i32, anyhow::Error> {
        self.shutdown.trigger();
        let handle = self.handle.take();
        handle
            .ok_or_else(|| anyhow!("Handle is not present"))?
            .await?
    }

    fn is_shutdown_triggered(&self) -> bool {
        self.shutdown.is_triggered()
    }

    pub async fn wait(&mut self) -> Result<i32, anyhow::Error> {
        let handle = self.handle.take();

        match handle {
            Some(handle) => handle.await?,
            None => Err(anyhow!("No process handle available")),
        }
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
