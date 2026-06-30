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
#[cfg(test)]
use std::ffi::OsString;
use std::fs;
use std::path::{Path, PathBuf};
use std::time::Duration;
use sysinfo::{Pid, ProcessesToUpdate, System};
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
use crate::process_wrapper;

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

    fn canonicalized_or_original_path(path: &Path) -> PathBuf {
        fs::canonicalize(path).unwrap_or_else(|_| path.to_path_buf())
    }

    #[cfg(windows)]
    fn paths_are_equivalent(left: &Path, right: &Path) -> bool {
        left.as_os_str()
            .to_string_lossy()
            .eq_ignore_ascii_case(&right.as_os_str().to_string_lossy())
    }

    #[cfg(not(windows))]
    fn paths_are_equivalent(left: &Path, right: &Path) -> bool {
        left == right
    }

    #[cfg(test)]
    fn process_executable_matches(
        expected_executable: &Path,
        process_executable: Option<&Path>,
    ) -> bool {
        let expected = Self::canonicalized_or_original_path(expected_executable);
        Self::process_executable_matches_canonicalized(&expected, process_executable)
    }

    fn process_executable_matches_canonicalized(
        expected_executable: &Path,
        process_executable: Option<&Path>,
    ) -> bool {
        let Some(process_executable) = process_executable else {
            return false;
        };

        if expected_executable.as_os_str().is_empty() || process_executable.as_os_str().is_empty() {
            return false;
        }

        let actual = Self::canonicalized_or_original_path(process_executable);
        Self::paths_are_equivalent(expected_executable, &actual)
    }

    #[cfg(test)]
    fn command_contains_executable_arg(command: &[OsString], expected_executable: &Path) -> bool {
        let expected = Self::canonicalized_or_original_path(expected_executable);
        command.iter().any(|arg| {
            Self::process_executable_matches_canonicalized(&expected, Some(Path::new(arg)))
        })
    }

    /// Parse a pid file. Supports the legacy single-line `<pid>` format and the
    /// newer `<pid>\n<start_time>` format. Returns the parsed PID (if any) and
    /// the recorded process start time (if present).
    fn parse_pid_file(contents: &str) -> (Option<i32>, Option<u64>) {
        let mut lines = contents.lines();
        let pid = lines
            .next()
            .and_then(|line| line.trim().parse::<i32>().ok());
        let start_time = lines
            .next()
            .and_then(|line| line.trim().parse::<u64>().ok());
        (pid, start_time)
    }

    fn process_pid_matches_executable(
        pid_to_match: i32,
        expected_executable: &Path,
        expected_start_time: Option<u64>,
    ) -> bool {
        let Ok(pid_to_match) = u32::try_from(pid_to_match) else {
            return false;
        };
        let pid_to_match = Pid::from_u32(pid_to_match);
        let pids_to_update = [pid_to_match];

        let mut sys = System::new();
        if sys.refresh_processes(ProcessesToUpdate::Some(&pids_to_update)) == 0 {
            return false;
        }

        let Some(process) = sys.process(pid_to_match) else {
            return false;
        };

        let expected = Self::canonicalized_or_original_path(expected_executable);
        let expected_file_name = expected.file_name();
        let executable_matches =
            Self::process_executable_matches_canonicalized(&expected, process.exe())
                || process_wrapper::get_wrapper_path().is_some_and(|wrapper_path| {
                    let wrapper_path = Self::canonicalized_or_original_path(&wrapper_path);
                    Self::process_executable_matches_canonicalized(&wrapper_path, process.exe())
                        && process.cmd().iter().any(|arg| {
                            let arg_path = Path::new(arg);
                            // Cheap file-name pre-filter so we only pay for the
                            // canonicalize syscall on arguments that could match.
                            let (Some(expected_file_name), Some(arg_file_name)) =
                                (expected_file_name, arg_path.file_name())
                            else {
                                return false;
                            };
                            Self::paths_are_equivalent(
                                Path::new(expected_file_name),
                                Path::new(arg_file_name),
                            ) && Self::process_executable_matches_canonicalized(
                                &expected,
                                Some(arg_path),
                            )
                        })
                });

        if !executable_matches {
            return false;
        }

        // If the pid file recorded the process start time, require it to match.
        // This rejects a PID that was recycled to a different process (even one
        // running from the same path) after the pid file was written.
        match expected_start_time {
            Some(expected_start_time) => process.start_time() == expected_start_time,
            None => true,
        }
    }

    fn find_process_pid_by_name_and_executable(
        binary_name: &OsStr,
        expected_executable: &Path,
    ) -> Option<u32> {
        let mut sys = System::new();
        sys.refresh_processes(ProcessesToUpdate::All);
        let expected = Self::canonicalized_or_original_path(expected_executable);

        for (pid, process) in sys.processes() {
            // Case-insensitive name pre-filter on Windows (process/file names
            // are case-insensitive there); exact elsewhere. The authoritative
            // check remains the canonicalized executable-path comparison.
            if Self::paths_are_equivalent(Path::new(process.name()), Path::new(binary_name))
                && Self::process_executable_matches_canonicalized(&expected, process.exe())
            {
                return Some(pid.as_u32());
            }
        }
        None
    }

    async fn ensure_no_hanging_processes_are_running(&self) -> Result<(), Error> {
        info!(
            target: LOG_TARGET_APP_LOGIC,
            "Skipping name-only cleanup for {}; process cleanup requires a PID file or exact executable path match",
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
        match fs::read_to_string(base_folder.join(self.pid_file_name())) {
            Ok(contents) => {
                let (pid, expected_start_time) = Self::parse_pid_file(&contents);
                match pid {
                    Some(pid) => {
                        warn!(target: LOG_TARGET_APP_LOGIC, "{} process did not shut down cleanly: {} pid file was created", pid, self.pid_file_name());
                        if Self::process_pid_matches_executable(
                            pid,
                            binary_path,
                            expected_start_time,
                        ) {
                            kill_process(pid).await?;
                        } else {
                            warn!(
                                target: LOG_TARGET_APP_LOGIC,
                                "Pid file for {} points to PID {}, but that process is not running from {:?} (or the PID was recycled); leaving it untouched",
                                self.name(),
                                pid,
                                binary_path
                            );
                        }
                    }
                    None => {
                        warn!(target: LOG_TARGET_APP_LOGIC, "pid file is not a valid integer: {contents:?}. Attempting path-scoped process lookup");
                        let pid_by_name =
                            Self::find_process_pid_by_name_and_executable(binary_name, binary_path);
                        if let Some(process) = pid_by_name {
                            match i32::try_from(process) {
                                Ok(parsed_id) => kill_process(parsed_id).await?,
                                Err(_) => warn!(
                                    target: LOG_TARGET_APP_LOGIC,
                                    "Found process PID {process} for {} but it does not fit into i32; skipping kill",
                                    self.name()
                                ),
                            }
                        } else {
                            warn!(
                                target: LOG_TARGET_APP_LOGIC,
                                "No process found for {} at {:?}",
                                binary_name.to_str().unwrap_or_default(),
                                binary_path
                            );
                        }
                    }
                }
            }
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

#[cfg(test)]
mod tests {
    use super::*;
    use crate::testing::mocks::process_mocks::{MockProcessInstance, MockStatusMonitor};

    struct TestAdapter;

    impl ProcessAdapter for TestAdapter {
        type StatusMonitor = MockStatusMonitor;
        type ProcessInstance = MockProcessInstance;

        fn spawn_inner(
            &self,
            _base_folder: PathBuf,
            _config_folder: PathBuf,
            _log_folder: PathBuf,
            _binary_version_path: PathBuf,
            _is_first_start: bool,
        ) -> Result<(Self::ProcessInstance, Self::StatusMonitor), anyhow::Error> {
            Ok((MockProcessInstance::new(), MockStatusMonitor::new()))
        }

        fn name(&self) -> &str {
            "test-process"
        }

        fn pid_file_name(&self) -> &str {
            "test-process.pid"
        }
    }

    #[test]
    fn executable_match_rejects_missing_process_path() {
        assert!(
            !<TestAdapter as ProcessAdapter>::process_executable_matches(
                Path::new("app/bin/xmrig"),
                None,
            )
        );
    }

    #[test]
    fn executable_match_rejects_same_name_in_different_folder() {
        assert!(
            !<TestAdapter as ProcessAdapter>::process_executable_matches(
                Path::new("app/bin/xmrig"),
                Some(Path::new("external/bin/xmrig")),
            )
        );
    }

    #[test]
    fn executable_match_accepts_same_path() {
        assert!(<TestAdapter as ProcessAdapter>::process_executable_matches(
            Path::new("app/bin/xmrig"),
            Some(Path::new("app/bin/xmrig")),
        ));
    }

    #[test]
    fn command_match_accepts_wrapped_binary_path_arg() {
        let command = vec![
            OsString::from("12345"),
            OsString::from("app/bin/xmrig"),
            OsString::from("--config"),
        ];

        assert!(
            <TestAdapter as ProcessAdapter>::command_contains_executable_arg(
                &command,
                Path::new("app/bin/xmrig"),
            )
        );
    }

    #[cfg(windows)]
    #[test]
    fn executable_match_is_case_insensitive_on_windows() {
        assert!(<TestAdapter as ProcessAdapter>::process_executable_matches(
            Path::new(r"C:\App\Bin\xmrig.exe"),
            Some(Path::new(r"c:\app\bin\XMRIG.EXE")),
        ));
    }

    #[test]
    fn parse_pid_file_reads_legacy_single_line() {
        let (pid, start) = <TestAdapter as ProcessAdapter>::parse_pid_file("12345");
        assert_eq!(pid, Some(12345));
        assert_eq!(start, None);
    }

    #[test]
    fn parse_pid_file_reads_pid_and_start_time() {
        let (pid, start) = <TestAdapter as ProcessAdapter>::parse_pid_file("12345\n1699999999");
        assert_eq!(pid, Some(12345));
        assert_eq!(start, Some(1699999999));
    }

    #[test]
    fn parse_pid_file_trims_whitespace_and_trailing_newline() {
        let (pid, start) =
            <TestAdapter as ProcessAdapter>::parse_pid_file("  12345  \n  1699999999  \n");
        assert_eq!(pid, Some(12345));
        assert_eq!(start, Some(1699999999));
    }

    #[test]
    fn parse_pid_file_rejects_garbage() {
        let (pid, start) = <TestAdapter as ProcessAdapter>::parse_pid_file("not-a-pid");
        assert_eq!(pid, None);
        assert_eq!(start, None);
    }
}
