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

use crate::binaries::{Binaries, BinaryResolver};
use crate::events_manager::EventsManager;
use crate::process_adapter::ProcessInstanceTrait;
use crate::process_adapter::{HealthStatus, ProcessAdapter, StatusMonitor};
use futures_util::future::FusedFuture;
use log::{error, info, warn};
use std::path::PathBuf;
use std::sync::atomic::AtomicBool;
use std::sync::Arc;
use std::time::Duration;
use tari_shutdown::{Shutdown, ShutdownSignal};
use tauri::AppHandle;
use tokio::task::JoinHandle;

use tokio::select;
use tokio::sync::watch;
use tokio::time::{Instant, MissedTickBehavior};
use tokio_util::task::TaskTracker;

const LOG_TARGET: &str = "tari::universe::process_watcher";

#[derive(Debug, Clone, Default)]
pub(crate) struct ProcessWatcherStats {
    pub current_uptime: Duration,
    pub total_health_checks: u64,
    pub num_warnings: u64,
    pub num_failures: u64,
    pub num_restarts: u64,
    pub max_health_check_duration: Duration,
    pub total_health_check_duration: Duration,
}

pub struct ProcessWatcher<TAdapter: ProcessAdapter> {
    pub(crate) adapter: TAdapter,
    watcher_task: Option<JoinHandle<Result<i32, anyhow::Error>>>,
    internal_shutdown: Shutdown,
    pub poll_time: tokio::time::Duration,
    /// Health timeout should always be less than poll time otherwise you will have overlapping calls
    pub health_timeout: tokio::time::Duration,
    pub expected_startup_time: tokio::time::Duration,
    pub(crate) status_monitor: Option<TAdapter::StatusMonitor>,
    pub stop_on_exit_codes: Vec<i32>,
    stats_broadcast: watch::Sender<ProcessWatcherStats>,
    is_first_start: Arc<AtomicBool>,
    app_handle: AppHandle,
    // New fields for retry logic
    pub max_startup_attempts: u32,
    pub startup_retry_delay: Duration,
    pub max_runtime_restart_attempts: u32,
    pub runtime_restart_retry_delay: Duration,
}

impl<TAdapter: ProcessAdapter> ProcessWatcher<TAdapter> {
    pub fn new(
        adapter: TAdapter,
        stats_broadcast: watch::Sender<ProcessWatcherStats>,
        app_handle: AppHandle,
    ) -> Self {
        Self {
            adapter,
            watcher_task: None,
            internal_shutdown: Shutdown::new(),
            poll_time: tokio::time::Duration::from_secs(5),
            health_timeout: tokio::time::Duration::from_secs(4),
            expected_startup_time: tokio::time::Duration::from_secs(20),
            status_monitor: None,
            stop_on_exit_codes: Vec::new(),
            stats_broadcast,
            is_first_start: Arc::new(AtomicBool::new(true)),
            app_handle,
            // Initialize retry parameters
            max_startup_attempts: 10,
            startup_retry_delay: Duration::from_secs(5),
            max_runtime_restart_attempts: 3,
            runtime_restart_retry_delay: Duration::from_secs(10),
        }
    }
}

impl<TAdapter: ProcessAdapter> ProcessWatcher<TAdapter> {
    pub async fn kill_previous_instances(
        &mut self,
        base_path: PathBuf,
    ) -> Result<(), anyhow::Error> {
        self.adapter.kill_previous_instances(base_path).await?;
        Ok(())
    }

    #[allow(clippy::too_many_arguments)]
    async fn attempt_to_start_and_stabilize_child(
        &self,
        child: &mut TAdapter::ProcessInstance,
        status_monitor: &TAdapter::StatusMonitor,
        task_tracker: &TaskTracker,
        name: &str,
        global_shutdown_signal: &ShutdownSignal,
        inner_shutdown_signal: &ShutdownSignal,
        stats: &mut ProcessWatcherStats,
    ) -> Result<(), anyhow::Error> {
        let mut startup_attempts = 0;
        loop {
            if global_shutdown_signal.is_triggered() || inner_shutdown_signal.is_triggered() {
                info!(target: LOG_TARGET, "Shutdown triggered during initial startup of {}", name);
                return Err(anyhow::anyhow!(
                    "Shutdown during initial startup of {}",
                    name
                ));
            }

            startup_attempts += 1;
            info!(target: LOG_TARGET, "Attempting to start '{}' (Attempt {}/{})", name, startup_attempts, self.max_startup_attempts);
            EventsManager::emit_binary_startup_attempt(
                &self.app_handle,
                name.to_string(),
                startup_attempts,
                self.max_startup_attempts,
            )
            .await;

            if let Err(e) = child.start(task_tracker.clone()).await {
                warn!(target: LOG_TARGET, "child.start() failed for '{}': {:?}.", name, e);
            } else {
                info!(target: LOG_TARGET, "Process '{}' launched. Waiting {:?} for stabilization.", name, self.expected_startup_time);
                let stabilization_deadline = Instant::now() + self.expected_startup_time;
                let mut initial_health_passed = false;
                let mut consecutive_health_failures = 0;
                let mut grace_period_active = false;
                let mut grace_deadline = Instant::now(); // Will be set when needed

                while Instant::now() < stabilization_deadline {
                    if global_shutdown_signal.is_triggered() || inner_shutdown_signal.is_triggered()
                    {
                        warn!(target: LOG_TARGET, "Shutdown during stabilization for {}", name);
                        let _ = child.stop().await;
                        return Err(anyhow::anyhow!("Shutdown during stabilization of {}", name));
                    }
                    if !child.ping() {
                        warn!(target: LOG_TARGET, "Process '{}' died immediately after start (ping failed).", name);
                        break;
                    }

                    // Smart grace period: only skip health checks if grace period is active
                    if grace_period_active && Instant::now() < grace_deadline {
                        info!(target: LOG_TARGET, "Process '{}' in adaptive grace period due to previous failures", name);
                        tokio::time::sleep(Duration::from_secs(2)).await;
                        continue;
                    }

                    let health_status = status_monitor
                        .check_health(Duration::from_secs(0), self.health_timeout)
                        .await;
                    match health_status {
                        HealthStatus::Healthy => {
                            info!(target: LOG_TARGET, "Process '{}' stabilized and is healthy.", name);
                            initial_health_passed = true;
                            // Reset failure tracking on success - these values won't be used again since we're exiting
                            let _ = (consecutive_health_failures, grace_period_active);
                            break;
                        }
                        HealthStatus::Warning => {
                            consecutive_health_failures += 1;
                            if consecutive_health_failures >= 3 && !grace_period_active {
                                // Activate grace period after 3 consecutive warnings
                                let grace_duration = Duration::from_secs(
                                    5 + (consecutive_health_failures as u64 * 2),
                                );
                                grace_deadline = Instant::now() + grace_duration;
                                grace_period_active = true;
                                info!(target: LOG_TARGET, "Activating {:.1}s grace period for '{}' after {} warning failures", 
                                      grace_duration.as_secs_f32(), name, consecutive_health_failures);
                            }
                            info!(target: LOG_TARGET, "Process '{}' stabilizing (Warning status, {} consecutive failures).", name, consecutive_health_failures);
                        }
                        HealthStatus::Unhealthy => {
                            consecutive_health_failures += 1;
                            if consecutive_health_failures >= 2 && !grace_period_active {
                                // Activate grace period after 2 unhealthy checks
                                let grace_duration = Duration::from_secs(
                                    8 + (consecutive_health_failures as u64 * 3),
                                );
                                grace_deadline = Instant::now() + grace_duration;
                                grace_period_active = true;
                                info!(target: LOG_TARGET, "Activating {:.1}s grace period for '{}' after {} unhealthy failures", 
                                      grace_duration.as_secs_f32(), name, consecutive_health_failures);
                            }
                            warn!(target: LOG_TARGET, "Process '{}' became unhealthy during stabilization ({} consecutive failures).", name, consecutive_health_failures);

                            if consecutive_health_failures >= 6 {
                                // Give up after too many failures
                                warn!(target: LOG_TARGET, "Process '{}' failed too many consecutive health checks ({}), giving up on this attempt.", name, consecutive_health_failures);
                                break;
                            }
                        }
                    }
                    tokio::time::sleep(Duration::from_secs(2)).await;
                }

                if initial_health_passed {
                    info!(target: LOG_TARGET, "Process '{}' successfully started and stabilized.", name);
                    return Ok(());
                }

                warn!(target: LOG_TARGET, "Process '{}' did not stabilize or become healthy. Stopping before retry.", name);
                if let Err(e) = child.stop().await {
                    warn!(target: LOG_TARGET, "Error stopping child process '{}' after failed stabilization: {:?}", name, e);
                }
            }

            stats.num_restarts += 1;

            if startup_attempts >= self.max_startup_attempts {
                error!(target: LOG_TARGET, "Failed to start and stabilize process '{}' after {} attempts.", name, self.max_startup_attempts);
                EventsManager::emit_binary_permanent_failure(
                    &self.app_handle,
                    name.to_string(),
                    "startup".to_string(),
                )
                .await;
                return Err(anyhow::anyhow!(
                    "Failed to start '{}' after max startup retries",
                    name
                ));
            }

            warn!(target: LOG_TARGET, "Retrying startup for '{}' in {:?}.", name, self.startup_retry_delay);
            tokio::time::sleep(self.startup_retry_delay).await;
        }
    }

    pub async fn start(
        &mut self,
        base_path: PathBuf,
        config_path: PathBuf,
        log_path: PathBuf,
        binary: Binaries,
        mut global_shutdown_signal: ShutdownSignal,
        task_tracker: TaskTracker,
    ) -> Result<(), anyhow::Error> {
        if global_shutdown_signal.is_terminated() || global_shutdown_signal.is_triggered() {
            return Ok(());
        }

        let name = self.adapter.name().to_string();
        if self.watcher_task.is_some() {
            warn!(target: LOG_TARGET, "Tried to start process watcher for {} twice", name);
            self.stop().await?;
        }
        info!(target: LOG_TARGET, "Starting process watcher for {}", name);
        self.kill_previous_instances(base_path.clone()).await?;

        self.internal_shutdown = Shutdown::new();
        let inner_shutdown_signal_for_startup = self.internal_shutdown.to_signal();
        let mut inner_shutdown_signal_for_monitoring = self.internal_shutdown.to_signal();

        let binary_path = BinaryResolver::current()
            .read()
            .await
            .resolve_path_to_binary_files(binary)
            .await?;
        info!(target: LOG_TARGET, "Using {:?} for {}", binary_path, name);
        let first_start = self
            .is_first_start
            .load(std::sync::atomic::Ordering::SeqCst);
        let (mut child, status_monitor) =
            self.adapter
                .spawn(base_path, config_path, log_path, binary_path, first_start)?;
        if first_start {
            self.is_first_start
                .store(false, std::sync::atomic::Ordering::SeqCst);
        }
        let status_monitor2 = status_monitor.clone();
        self.status_monitor = Some(status_monitor.clone());

        let mut stats = ProcessWatcherStats::default();

        // Call the new initial startup function
        self.attempt_to_start_and_stabilize_child(
            &mut child,
            &status_monitor,
            &task_tracker,
            &name,
            &global_shutdown_signal,
            &inner_shutdown_signal_for_startup,
            &mut stats,
        )
        .await?;

        info!(target: LOG_TARGET, "Process '{}' successfully started & stabilized. Entering main monitoring loop.", name);
        let mut uptime = Instant::now();
        let mut watch_timer = tokio::time::interval(self.poll_time);
        watch_timer.set_missed_tick_behavior(MissedTickBehavior::Delay);
        let mut warning_count = 0;

        let expected_startup_time = self.expected_startup_time;
        let health_timeout = self.health_timeout;
        let stop_on_exit_codes = self.stop_on_exit_codes.clone();
        let stats_broadcast = self.stats_broadcast.clone();
        let max_runtime_restart_attempts = self.max_runtime_restart_attempts;
        let runtime_restart_retry_delay = self.runtime_restart_retry_delay;
        let app_handle = self.app_handle.clone();

        self.watcher_task = Some(task_tracker.clone().spawn(async move {
            loop {
                select! {
                    _ = watch_timer.tick() => {
                        let status_monitor3 = status_monitor2.clone();

                        if let Some(exit_code) = do_health_check(
                            &mut child,
                            status_monitor3,
                            name.clone(),
                            &mut uptime,
                            expected_startup_time,
                            health_timeout,
                            global_shutdown_signal.clone(),
                            inner_shutdown_signal_for_monitoring.clone(),
                            task_tracker.clone(),
                            &mut warning_count,
                            &stop_on_exit_codes,
                            &mut stats,
                            max_runtime_restart_attempts,
                            runtime_restart_retry_delay,
                            &app_handle,
                        ).await? {
                            return Ok(exit_code);
                        }
                    },
                    _ = inner_shutdown_signal_for_monitoring.wait() => {
                        info!(target: LOG_TARGET, "Inner shutdown for '{}'", name);
                        return child.stop().await;
                    },
                    _ = global_shutdown_signal.wait() => {
                        info!(target: LOG_TARGET, "Global shutdown for '{}'", name);
                        return child.stop().await;
                    }
                }
                if let Err(_unused) = stats_broadcast.send(stats.clone()) {
                    warn!(target: LOG_TARGET, "Failed to broadcast process watcher stats for {}", name);
                }
            }
        }));
        Ok(())
    }

    pub fn is_running(&self) -> bool {
        if let Some(task) = self.watcher_task.as_ref() {
            !task.is_finished()
        } else {
            false
        }
    }

    #[allow(dead_code)]
    pub fn is_pid_file_exists(&self, base_path: PathBuf) -> bool {
        self.adapter.pid_file_exisits(base_path)
    }

    pub async fn wait_ready(&self) -> Result<(), anyhow::Error> {
        if let Some(ref task) = self.watcher_task {
            if task.is_finished() {
                return Err(anyhow::anyhow!("Process watcher task has already finished"));
            }
        }
        Ok(())
    }

    pub async fn stop(&mut self) -> Result<i32, anyhow::Error> {
        self.internal_shutdown.trigger();
        if let Some(task) = self.watcher_task.take() {
            let exit_code = task.await??;
            self.watcher_task = None;
            return Ok(exit_code);
        }
        Ok(0)
    }
}

#[allow(clippy::too_many_arguments)]
async fn do_health_check<TStatusMonitor: StatusMonitor, TProcessInstance: ProcessInstanceTrait>(
    child: &mut TProcessInstance,
    status_monitor: TStatusMonitor,
    name: String,
    uptime: &mut Instant,
    expected_startup_time: Duration,
    health_timeout: Duration,
    global_shutdown_signal: ShutdownSignal,
    inner_shutdown: ShutdownSignal,
    task_tracker: TaskTracker,
    warning_count: &mut u32,
    stop_on_exit_codes: &[i32],
    stats: &mut ProcessWatcherStats,
    max_runtime_restart_attempts: u32,
    runtime_restart_retry_delay: Duration,
    app_handle: &AppHandle,
) -> Result<Option<i32>, anyhow::Error> {
    let mut is_healthy = false;
    let mut ping_failed = false;

    stats.total_health_checks += 1;
    let health_timer = Instant::now();
    if child.ping() {
        let mut inner_shutdown2 = inner_shutdown.clone();
        let mut app_shutdown2 = global_shutdown_signal.clone();
        let current_uptime = uptime.elapsed();

        match select! {
            r = status_monitor.check_health(current_uptime, health_timeout) => r,
            _ = inner_shutdown2.wait() => {
                info!(target: LOG_TARGET, "Inner shutdown during health check for '{}'", name);
                return Ok(Some(0));
            },
            _ = app_shutdown2.wait() => {
                info!(target: LOG_TARGET, "Global shutdown during health check for '{}'", name);
                return Ok(Some(0));
            }
        } {
            HealthStatus::Healthy => {
                *warning_count = 0;
                is_healthy = true;
            }
            HealthStatus::Warning => {
                stats.num_warnings += 1;
                *warning_count += 1;
                if *warning_count > 10 {
                    error!(target: LOG_TARGET, "'{}' is not healthy. Health check returned warning {} times.", name, *warning_count);
                    // Don't assign to is_healthy here since it's not used after this
                } else {
                    is_healthy = true;
                }
            }
            HealthStatus::Unhealthy => {
                warn!(target: LOG_TARGET, "'{}' is not healthy. Health check returned Unhealthy status.", name);
                // Don't assign to is_healthy here since it's not used after this
            }
        }
    } else {
        ping_failed = true;
        warn!(target: LOG_TARGET, "Process '{}' ping failed, process is not running.", name);
    }

    let health_check_duration = health_timer.elapsed();
    if health_check_duration > stats.max_health_check_duration {
        stats.max_health_check_duration = health_check_duration;
    }
    stats.total_health_check_duration += health_check_duration;

    if !is_healthy {
        stats.num_failures += 1;
        if uptime.elapsed() < expected_startup_time && !ping_failed {
            warn!(target: LOG_TARGET, "'{}' is not healthy but still within expected startup time. Waiting...", name);
        } else {
            warn!(target: LOG_TARGET, "Process '{}' died or became unhealthy. Stopping current instance.", name);
            match child.stop().await {
                Ok(exit_code) => {
                    if stop_on_exit_codes.contains(&exit_code) {
                        warn!(target: LOG_TARGET,"Process '{}' exited with code {} which is in stop_on_exit_codes. Not restarting.",name,exit_code);
                        return Ok(Some(exit_code));
                    }
                }
                Err(e) => {
                    warn!(target: LOG_TARGET, "Error stopping unhealthy process '{}': {:?}. Attempting restart regardless.", name, e)
                }
            }

            if let Err(e) = status_monitor.handle_unhealthy().await {
                error!(target: LOG_TARGET, "Failed to handle unhealthy status for '{}': {}. Proceeding with restart attempt.", name, e);
            }

            // Runtime Restart Loop
            let mut runtime_restart_attempts = 0;
            loop {
                if global_shutdown_signal.is_triggered()
                    || inner_shutdown.is_triggered()
                    || child.is_shutdown_triggered()
                {
                    info!(target: LOG_TARGET, "Shutdown triggered during runtime restart of '{}'.", name);
                    return Ok(Some(0));
                }

                runtime_restart_attempts += 1;

                info!(target: LOG_TARGET, "Restarting '{}' (Runtime attempt {}/{})", name, runtime_restart_attempts, max_runtime_restart_attempts);
                EventsManager::emit_binary_runtime_restart_attempt(
                    app_handle,
                    name.to_string(),
                    runtime_restart_attempts,
                    max_runtime_restart_attempts,
                )
                .await;
                stats.num_restarts += 1;

                match child.start(task_tracker.clone()).await {
                    Ok(_) => {
                        tokio::time::sleep(Duration::from_secs(2)).await;
                        if child.ping() {
                            let health_after_restart = status_monitor
                                .check_health(Duration::from_secs(0), health_timeout)
                                .await;
                            if health_after_restart == HealthStatus::Healthy {
                                info!(target: LOG_TARGET, "Process '{}' restarted successfully.", name);
                                *warning_count = 0;
                                *uptime = Instant::now();
                                return Ok(None);
                            } else {
                                warn!(target: LOG_TARGET, "Process '{}' restarted but failed immediate health check (Status: {:?})", name, health_after_restart);
                                let _ = child.stop().await;
                            }
                        } else {
                            warn!(target: LOG_TARGET, "Process '{}' restarted but died immediately (ping failed).", name);
                        }
                    }
                    Err(e) => {
                        warn!(target: LOG_TARGET, "Error during runtime restart of '{}': {:?}", name, e);
                    }
                }

                if runtime_restart_attempts >= max_runtime_restart_attempts {
                    error!(target: LOG_TARGET, "Failed to restart process '{}' after {} runtime attempts.", name, max_runtime_restart_attempts);
                    EventsManager::emit_binary_permanent_failure(
                        app_handle,
                        name.to_string(),
                        "runtime".to_string(),
                    )
                    .await;
                    return Err(anyhow::anyhow!(
                        "Failed to restart '{}' after max runtime retries",
                        name
                    ));
                }

                warn!(target: LOG_TARGET, "Retrying runtime restart for '{}' in {:?}.", name, runtime_restart_retry_delay);
                tokio::time::sleep(runtime_restart_retry_delay).await;
            }
        }
    } else {
        stats.current_uptime = uptime.elapsed();
    }
    Ok(None)
}
