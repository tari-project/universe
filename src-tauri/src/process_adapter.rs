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

use anyhow::{Error, anyhow};
use async_trait::async_trait;
use futures_util::future::FusedFuture;
use log::{error, info, warn};
use std::collections::HashMap;
use std::ffi::OsStr;
use std::fs;
use std::path::{Path, PathBuf};
use std::time::Duration;
use sysinfo::{ProcessRefreshKind, ProcessesToUpdate, System, UpdateKind};
use tari_shutdown::Shutdown;
use tauri_plugin_sentry::sentry;
use tokio::runtime::Handle;
use tokio::select;
use tokio::task::JoinHandle;
use tokio_util::task::TaskTracker;

use crate::LOG_TARGET_APP_LOGIC;
use crate::download_utils::set_permissions;
use crate::events::CriticalProblemPayload;
use crate::events_emitter::EventsEmitter;
use crate::process_killer::kill_process;
use crate::process_utils::{graceful_kill, launch_child_process, write_pid_file};

const SPACE_ERROR_MESSAGE: &str = "No space left on device";

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
        is_first_start: bool,
    ) -> Result<(Self::ProcessInstance, Self::StatusMonitor), anyhow::Error>;
    fn name(&self) -> &str;

    fn spawn(
        &self,
        base_folder: PathBuf,
        config_folder: PathBuf,
        log_folder: PathBuf,
        binary_version_path: PathBuf,
        is_first_start: bool,
    ) -> Result<(Self::ProcessInstance, Self::StatusMonitor), anyhow::Error> {
        self.spawn_inner(
            base_folder,
            config_folder,
            log_folder,
            binary_version_path,
            is_first_start,
        )
    }

    fn pid_file_name(&self) -> &str;

    #[allow(dead_code)]
    fn pid_file_exisits(&self, base_folder: PathBuf) -> bool {
        std::path::Path::new(&base_folder)
            .join(self.pid_file_name())
            .exists()
    }

    fn pid_matches_binary_name(pid: u32, expected_name: &OsStr) -> bool {
        let sys_pid = sysinfo::Pid::from_u32(pid);
        let mut sys = System::new();
        sys.refresh_processes_specifics(
            ProcessesToUpdate::Some(&[sys_pid]),
            ProcessRefreshKind::new().with_exe(UpdateKind::Always),
        );

        let Some(process) = sys.process(sys_pid) else {
            return false;
        };

        let actual_name = process.name();
        if expected_name == actual_name {
            return true;
        }

        #[cfg(target_os = "linux")]
        {
            const TASK_COMM_LEN_VISIBLE: usize = 15;
            let expected_bytes = expected_name.as_encoded_bytes();
            if expected_bytes.len() > TASK_COMM_LEN_VISIBLE
                && actual_name.as_bytes() == &expected_bytes[..TASK_COMM_LEN_VISIBLE]
            {
                return true;
            }
        }

        process
            .exe()
            .and_then(|path| path.file_name())
            .map(|file_name| {
                file_name == expected_name || {
                    #[cfg(target_os = "windows")]
                    {
                        let file_name = file_name.to_string_lossy();
                        let expected_name = expected_name.to_string_lossy();
                        file_name.eq_ignore_ascii_case(&format!("{expected_name}.exe"))
                    }
                    #[cfg(not(target_os = "windows"))]
                    {
                        false
                    }
                }
            })
            .unwrap_or(false)
    }

    async fn ensure_no_hanging_processes_are_running(&self) -> Result<(), Error> {
        info!(
            target: LOG_TARGET_APP_LOGIC,
            "{}::ensure_no_hanging_processes_are_running: skipping process-name cleanup; cleanup must use a tracked PID file",
            self.name()
        );
        Ok(())
    }

    async fn kill_previous_instances(
        &self,
        base_folder: PathBuf,
        binary_path: &Path,
    ) -> Result<(), Error> {
        info!(target: LOG_TARGET_APP_LOGIC, "Killing previous instances of {}", self.name());
        let binary_name = binary_path
            .file_name()
            .expect("binary path must have a file name");
        let pid_file_path = base_folder.join(self.pid_file_name());
        match fs::read_to_string(&pid_file_path) {
            Ok(pid) => match pid.trim().parse::<u32>() {
                Ok(pid) => {
                    if Self::pid_matches_binary_name(pid, binary_name) {
                        match i32::try_from(pid) {
                            Ok(parsed_id) => {
                                warn!(target: LOG_TARGET_APP_LOGIC, "{} process did not shut down cleanly: PID {} from {} still matches {:?}; terminating", self.name(), pid, self.pid_file_name(), binary_name);
                                kill_process(parsed_id).await?;
                            }
                            Err(_) => {
                                error!(target: LOG_TARGET_APP_LOGIC, "Failed to parse process ID {} from u32 to i32", pid);
                            }
                        }
                    } else {
                        info!(target: LOG_TARGET_APP_LOGIC, "{} pid file points at PID {}, but no matching {:?} process is running; removing stale pid file", self.name(), pid, binary_name);
                    }
                    let _ = fs::remove_file(&pid_file_path);
                }
                Err(_) => {
                    warn!(target: LOG_TARGET_APP_LOGIC, "{} pid file at {:?} is not a valid integer ({:?}); removing it without scanning by process name", self.name(), pid_file_path, pid);
                    let _ = fs::remove_file(&pid_file_path);
                }
            },
            Err(e) => {
                if let Ok(true) = std::path::Path::new(&base_folder)
                    .join(self.pid_file_name())
                    .try_exists()
                {
                    warn!(target: LOG_TARGET_APP_LOGIC, "{} pid file exists, but the error occurred while killing: {}", self.name(), e);
                }
            }
        }
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::process;

    #[derive(Clone)]
    struct TestAdapter;

    #[derive(Clone)]
    struct TestStatusMonitor;

    struct TestProcessInstance;

    #[async_trait]
    impl StatusMonitor for TestStatusMonitor {
        async fn check_health(
            &self,
            _uptime: Duration,
            _timeout_duration: Duration,
        ) -> HealthStatus {
            HealthStatus::Healthy
        }
    }

    #[async_trait]
    impl ProcessInstanceTrait for TestProcessInstance {
        fn ping(&self) -> bool {
            false
        }

        async fn start(&mut self, _task_tracker: TaskTracker) -> Result<(), anyhow::Error> {
            Ok(())
        }

        async fn stop(&mut self) -> Result<i32, anyhow::Error> {
            Ok(0)
        }

        fn is_shutdown_triggered(&self) -> bool {
            false
        }

        async fn wait(&mut self) -> Result<i32, anyhow::Error> {
            Ok(0)
        }

        async fn start_and_wait_for_output(
            &mut self,
            _task_tracker: TaskTracker,
        ) -> Result<(i32, Vec<String>, Vec<String>), anyhow::Error> {
            Ok((0, vec![], vec![]))
        }
    }

    impl ProcessAdapter for TestAdapter {
        type StatusMonitor = TestStatusMonitor;
        type ProcessInstance = TestProcessInstance;

        fn spawn_inner(
            &self,
            _base_folder: PathBuf,
            _config_folder: PathBuf,
            _log_folder: PathBuf,
            _binary_version_path: PathBuf,
            _is_first_start: bool,
        ) -> Result<(Self::ProcessInstance, Self::StatusMonitor), anyhow::Error> {
            Ok((TestProcessInstance, TestStatusMonitor))
        }

        fn name(&self) -> &str {
            "test-process"
        }

        fn pid_file_name(&self) -> &str {
            "test-process.pid"
        }
    }

    #[tokio::test]
    async fn invalid_pid_file_is_removed_without_name_based_kill() {
        let temp_dir = tempfile::tempdir().expect("temp dir");
        let pid_file = temp_dir.path().join("test-process.pid");
        fs::write(&pid_file, "not-a-pid").expect("write pid file");

        TestAdapter
            .kill_previous_instances(
                temp_dir.path().to_path_buf(),
                Path::new("/bin/test-process"),
            )
            .await
            .expect("invalid pid cleanup should not fail");

        assert!(
            !pid_file.exists(),
            "invalid pid files are stale and should be removed"
        );
    }

    #[tokio::test]
    async fn stale_pid_file_is_removed_when_pid_is_not_matching_binary() {
        let temp_dir = tempfile::tempdir().expect("temp dir");
        let pid_file = temp_dir.path().join("test-process.pid");
        fs::write(&pid_file, process::id().to_string()).expect("write pid file");

        TestAdapter
            .kill_previous_instances(
                temp_dir.path().to_path_buf(),
                Path::new("/bin/test-process"),
            )
            .await
            .expect("stale pid cleanup should not fail");

        assert!(
            !pid_file.exists(),
            "pid files for unrelated processes should be removed as stale"
        );
    }
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub enum HealthStatus {
    Healthy,
    Warning,
    WarningWithReason(String),
    Unhealthy,
    UnhealthyWithReason(String),
    Initializing,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub enum HandleUnhealthyResult {
    Continue,
    Stop,
}

#[async_trait]
pub(crate) trait StatusMonitor: Clone + Sync + Send + 'static {
    async fn check_health(&self, uptime: Duration, timeout_duration: Duration) -> HealthStatus;
    async fn handle_unhealthy(
        &self,
        _duration_since_last_healthy_status: Duration,
    ) -> Result<HandleUnhealthyResult, anyhow::Error> {
        Ok(HandleUnhealthyResult::Continue)
    }
}

// TODO: Rename to ProcessInstance
#[async_trait]
pub(crate) trait ProcessInstanceTrait: Sync + Send + 'static {
    fn ping(&self) -> bool;
    async fn start(&mut self, task_tracker: TaskTracker) -> Result<(), anyhow::Error>;
    async fn stop(&mut self) -> Result<i32, anyhow::Error>;
    fn is_shutdown_triggered(&self) -> bool;
    async fn wait(&mut self) -> Result<i32, anyhow::Error>;
    async fn start_and_wait_for_output(
        &mut self,
        task_tracker: TaskTracker,
    ) -> Result<(i32, Vec<String>, Vec<String>), anyhow::Error>;
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

    async fn start(&mut self, task_tracker: TaskTracker) -> Result<(), anyhow::Error> {
        if self.handle.is_some() {
            warn!(target: LOG_TARGET_APP_LOGIC, "Process is already running");
            return Ok(());
        }
        info!(target: LOG_TARGET_APP_LOGIC, "Starting {} process with args: {}", self.startup_spec.name, self.startup_spec.args.join(" "));
        let spec = self.startup_spec.clone();
        // Reset the shutdown each time.
        self.shutdown = Shutdown::new();
        let shutdown_signal = self.shutdown.to_signal();

        if shutdown_signal.is_terminated() || shutdown_signal.is_triggered() {
            warn!(target: LOG_TARGET_APP_LOGIC, "Shutdown signal is triggered. Not starting process");
            return Ok(());
        };

        self.handle = Some(task_tracker.spawn(async move {
            if let Err(e) = set_permissions(&spec.file_path).await {
                error!(target: LOG_TARGET_APP_LOGIC, "{e}");
                sentry::capture_message(&e.to_string(), sentry::Level::Error);
                return Err(e);
            }
            // start
            info!(target: LOG_TARGET_APP_LOGIC, "Launching process for: {}", spec.name);
            let mut child = launch_child_process(
                &spec.file_path,
                spec.data_dir.as_path(),
                spec.envs.as_ref(),
                &spec.args,
                false
            )?;

            if let Some(id) = child.id() {
                let pid_file_res = write_pid_file(&spec, id);
                if let Err(e) = pid_file_res {
                    let error_msg = format!("Failed to write PID file: {e}");
                    error!(target: LOG_TARGET_APP_LOGIC, "{error_msg}");
                    let should_emit_critial_error = e.contains(SPACE_ERROR_MESSAGE) || e.contains("os error 28");

                    if should_emit_critial_error {
                        EventsEmitter::emit_critical_problem(CriticalProblemPayload {
                            title: Some("error.title.space".to_string()),
                            description: Some("error.description.space".to_string()),
                            error_message: Some(error_msg),
                        }).await;
                    }
                }
            }
            let exit_code;

            select! {
                _res = shutdown_signal =>{
                    graceful_kill(&mut child).await?;
                    exit_code = 0;
                },
                res2 = child.wait() => {
                    match res2
                     {
                        Ok(res) => {
                            exit_code = res.code().unwrap_or(0)
                            },
                        Err(e) => {
                            warn!(target: LOG_TARGET_APP_LOGIC, "Error in process instance {}:  {}", spec.name, e);
                            return Err(e.into());
                        }
                    }
                },
            }
            info!(target: LOG_TARGET_APP_LOGIC, "Stopping {} process with exit code: {}", spec.name, exit_code);

            if let Err(error) = fs::remove_file(spec.data_dir.join(spec.pid_file_name)) {
                warn!(target: LOG_TARGET_APP_LOGIC, "Could not clear {}'s pid file: {:?}", spec.name, error);
            }

            Ok(exit_code)
        }));
        Ok(())
    }

    async fn start_and_wait_for_output(
        &mut self,
        _task_tracker: TaskTracker,
    ) -> Result<(i32, Vec<String>, Vec<String>), anyhow::Error> {
        if self.handle.is_some() {
            warn!(target: LOG_TARGET_APP_LOGIC, "Process is already running");
            return Ok((0, vec![], vec![]));
        }
        info!(target: LOG_TARGET_APP_LOGIC, "Starting {} process with args: {}", self.startup_spec.name, self.startup_spec.args.join(" "));
        let spec = self.startup_spec.clone();
        self.shutdown = Shutdown::new();
        let shutdown_signal = self.shutdown.to_signal();

        if shutdown_signal.is_terminated() || shutdown_signal.is_triggered() {
            warn!(target: LOG_TARGET_APP_LOGIC, "Shutdown signal is triggered. Not starting process");
            return Ok((0, vec![], vec![]));
        };

        let child = launch_child_process(
            &spec.file_path,
            spec.data_dir.as_path(),
            spec.envs.as_ref(),
            &spec.args,
            true,
        )?;

        if let Some(id) = child.id() {
            fs::write(
                spec.data_dir.join(spec.pid_file_name.clone()),
                id.to_string(),
            )?;
        }
        let result = child.wait_with_output().await?;
        let exit_code = result.status.code().unwrap_or(0);
        let stdout_lines: Vec<String> = String::from_utf8_lossy(&result.stdout)
            .lines()
            .map(|line| line.to_string())
            .collect();
        let stderr_lines: Vec<String> = String::from_utf8_lossy(&result.stderr)
            .lines()
            .map(|line| line.to_string())
            .collect();

        info!(target: LOG_TARGET_APP_LOGIC, "Stopping {} process with exit code: {}", spec.name, exit_code);

        if let Err(error) = fs::remove_file(spec.data_dir.join(spec.pid_file_name)) {
            warn!(target: LOG_TARGET_APP_LOGIC, "Could not clear {}'s pid file: {:?}", spec.name, error);
        }

        Ok((exit_code, stdout_lines, stderr_lines))
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

    async fn wait(&mut self) -> Result<i32, anyhow::Error> {
        let handle = self.handle.take();

        match handle {
            Some(handle) => handle.await?,
            None => Err(anyhow!("No process handle available")),
        }
    }
}

impl Drop for ProcessInstance {
    fn drop(&mut self) {
        // Always trigger shutdown first
        self.shutdown.trigger();

        if let Some(handle) = self.handle.take() {
            // Check if we're in a tokio runtime context
            match Handle::try_current() {
                Ok(current_handle) => {
                    // We're in a tokio context, spawn a detached task for cleanup
                    let spec_name = self.startup_spec.name.clone();
                    current_handle.spawn(async move {
                    if let Err(e) = handle.await {
                        warn!(target: LOG_TARGET_APP_LOGIC, "Error during process cleanup for {spec_name}: {e}");
                    }
                });
                }
                _ => {
                    // We're not in a tokio context, we need to use block_on
                    // This is the fallback case - log it as it might indicate a design issue
                    warn!(target: LOG_TARGET_APP_LOGIC, "Process {} dropped outside tokio context, using block_on for cleanup", self.startup_spec.name);

                    // Use a timeout to prevent indefinite blocking
                    match tokio::runtime::Handle::try_current() {
                        Ok(rt) => {
                            rt.block_on(async move {
                        if let Err(e) = tokio::time::timeout(
                            Duration::from_secs(5),
                            handle
                        ).await {
                            warn!(target: LOG_TARGET_APP_LOGIC, "Timeout or error during emergency process cleanup: {e}");
                        }
                    });
                        }
                        _ => {
                            // Last resort: detach the handle and let the OS clean up
                            warn!(target: LOG_TARGET_APP_LOGIC, "Cannot properly clean up process {}, detaching handle", self.startup_spec.name);
                            std::mem::forget(handle);
                        }
                    }
                }
            }
        }
    }
}
