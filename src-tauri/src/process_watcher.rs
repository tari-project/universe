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
use crate::process_adapter::ProcessInstanceTrait;
use crate::process_adapter::{HealthStatus, ProcessAdapter, StatusMonitor};
use futures_util::future::FusedFuture;
use log::{error, info, warn};
use std::path::PathBuf;
use std::sync::atomic::AtomicBool;
use std::sync::Arc;
use std::time::{Duration, Instant};
use tari_shutdown::{Shutdown, ShutdownSignal};
use tauri::async_runtime::JoinHandle;
use tokio::select;
use tokio::sync::watch;
use tokio::time::MissedTickBehavior;
use tokio::time::{sleep, timeout};
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
}

impl<TAdapter: ProcessAdapter> ProcessWatcher<TAdapter> {
    pub fn new(adapter: TAdapter, stats_broadcast: watch::Sender<ProcessWatcherStats>) -> Self {
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

    pub async fn start(
        &mut self,
        base_path: PathBuf,
        config_path: PathBuf,
        log_path: PathBuf,
        binary: Binaries,
        global_shutdown_signal: ShutdownSignal,
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
        let mut inner_shutdown = self.internal_shutdown.to_signal();

        let poll_time = self.poll_time;
        let health_timeout = self.health_timeout;

        let binary_path = BinaryResolver::current()
            .read()
            .await
            .resolve_path_to_binary_files(binary)?;
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
        self.status_monitor = Some(status_monitor);

        let expected_startup_time = self.expected_startup_time;
        let mut global_shutdown_signal: ShutdownSignal = global_shutdown_signal.clone();
        let task_tracker = task_tracker.clone();
        let stop_on_exit_codes = self.stop_on_exit_codes.clone();
        let stats_broadcast = self.stats_broadcast.clone();
        self.watcher_task = Some(task_tracker.clone().spawn(async move {
            child.start(task_tracker.clone()).await?;
            let mut uptime = Instant::now();
            let mut stats = ProcessWatcherStats {
                current_uptime: Duration::from_secs(0),
                total_health_checks: 0,
                num_warnings: 0,
                num_failures: 0,
                num_restarts: 0,
                max_health_check_duration: Duration::from_secs(0),
                total_health_check_duration: Duration::from_secs(0),
            };
            // sleep(Duration::from_secs(10)).await;
            info!(target: LOG_TARGET, "Starting process watcher for {}", name);
            let mut watch_timer = tokio::time::interval(poll_time);
            watch_timer.set_missed_tick_behavior(MissedTickBehavior::Delay);
            let mut warning_count = 0;
            // read events such as stdout
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
                            task_tracker.clone(),
                            inner_shutdown.clone(),
                            &mut warning_count,
                            &stop_on_exit_codes,
                            &mut stats
                        ).await? {
                            return Ok(exit_code);
                        }
                    },
                    _ = inner_shutdown.wait() => {
                        return child.stop().await;

                    },
                    _ = global_shutdown_signal.wait() => {
                        return child.stop().await;
                    }
                }
                if let Err(_unused) = stats_broadcast.send(stats.clone()) {
                    warn!(target: LOG_TARGET, "Failed to broadcast process watcher stats");
                }
            }
        }));
        Ok(())
    }

    pub fn is_running(&self) -> bool {
        if let Some(task) = self.watcher_task.as_ref() {
            !task.inner().is_finished()
        } else {
            false
        }
    }

    pub fn is_pid_file_exists(&self, base_path: PathBuf) -> bool {
        self.adapter.pid_file_exisits(base_path)
    }

    pub async fn wait_ready(&self) -> Result<(), anyhow::Error> {
        if let Some(ref task) = self.watcher_task {
            if task.inner().is_finished() {
                //let exit_code = task.await??;

                return Err(anyhow::anyhow!("Process watcher task has already finished"));
            }
        }
        //TODO
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
    status_monitor3: TStatusMonitor,
    name: String,
    uptime: &mut Instant,
    expected_startup_time: Duration,
    health_timeout: Duration,
    global_shutdown_signal: ShutdownSignal,
    task_tracker: TaskTracker,
    inner_shutdown: ShutdownSignal,
    warning_count: &mut u32,
    stop_on_exit_codes: &[i32],
    stats: &mut ProcessWatcherStats,
) -> Result<Option<i32>, anyhow::Error> {
    let mut is_healthy = false;
    let mut ping_failed = false;

    stats.total_health_checks += 1;
    let health_timer = Instant::now();
    if child.ping() {
        let mut inner_shutdown2 = inner_shutdown.clone();
        let mut app_shutdown2 = global_shutdown_signal.clone();
        let current_uptime = uptime.elapsed();
        if let Ok(inner) = timeout(health_timeout, async {
            select! {
                r = status_monitor3.check_health(current_uptime) => r,
                // Watch for shutdown signals
                _ = inner_shutdown2.wait() => HealthStatus::Healthy,
                _ = app_shutdown2.wait() => HealthStatus::Healthy
            }
        })
        .await
        .inspect_err(
            |_| error!(target: LOG_TARGET, "{} is not healthy: health check timed out", name),
        ) {
            match inner {
                HealthStatus::Healthy => {
                    *warning_count = 0;
                    is_healthy = true;
                }
                HealthStatus::Warning => {
                    stats.num_warnings += 1;
                    *warning_count += 1;
                    if *warning_count > 10 {
                        error!(target: LOG_TARGET, "{} is not healthy. Health check returned warning", name);
                        *warning_count = 0;
                    } else {
                        is_healthy = true;
                    }
                }
                HealthStatus::Unhealthy => {
                    warn!(target: LOG_TARGET, "{} is not healthy. Health check returned false", name);
                }
            }
        }
    } else {
        ping_failed = true;
    }
    let health_check_duration = health_timer.elapsed();
    if health_check_duration > stats.max_health_check_duration {
        stats.max_health_check_duration = health_check_duration;
    }

    stats.total_health_check_duration += health_check_duration;

    if !is_healthy
        && !child.is_shutdown_triggered()
        && !global_shutdown_signal.is_triggered()
        && !inner_shutdown.is_triggered()
    {
        stats.num_failures += 1;
        if uptime.elapsed() < expected_startup_time && !ping_failed {
            warn!(target: LOG_TARGET, "{} is not healthy. Waiting for startup time to elapse", name);
        } else {
            match child.stop().await {
                Ok(exit_code) => {
                    if exit_code != 0 {
                        if stop_on_exit_codes.contains(&exit_code) {
                            return Ok(Some(exit_code));
                        }
                        warn!(target: LOG_TARGET, "{} exited with error code: {}, restarting because it is not a listed exit code to list for", name, exit_code);

                        // return Ok(exit_code);
                    } else {
                        info!(target: LOG_TARGET, "{} exited successfully", name);
                    }
                }
                Err(e) => {
                    error!(target: LOG_TARGET, "{} exited with error: {}", name, e);
                    //   return Err(e);
                }
            }
            // Restart dead app
            sleep(Duration::from_secs(1)).await;
            warn!(target: LOG_TARGET, "Restarting {} after health check failure", name);
            *uptime = Instant::now();
            stats.num_restarts += 1;
            stats.current_uptime = uptime.elapsed();
            child.start(task_tracker).await?;
            // Wait for a bit before checking health again
            // sleep(Duration::from_secs(10)).await;
        }
    } else {
        stats.current_uptime = uptime.elapsed();
    }
    Ok(None)
}
