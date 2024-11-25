use crate::binaries::{Binaries, BinaryResolver};
use crate::process_adapter::{HealthStatus, ProcessAdapter, ProcessInstance, StatusMonitor};
use log::{error, info, warn};
use std::path::PathBuf;
use std::time::{Duration, Instant};
use tari_shutdown::{Shutdown, ShutdownSignal};
use tauri::async_runtime::JoinHandle;
use tokio::select;
use tokio::time::MissedTickBehavior;
use tokio::time::{sleep, timeout};

const LOG_TARGET: &str = "tari::universe::process_watcher";
pub struct ProcessWatcher<TAdapter: ProcessAdapter> {
    pub(crate) adapter: TAdapter,
    watcher_task: Option<JoinHandle<Result<i32, anyhow::Error>>>,
    internal_shutdown: Shutdown,
    pub poll_time: tokio::time::Duration,
    pub health_timeout: tokio::time::Duration,
    pub expected_startup_time: tokio::time::Duration,
    pub(crate) status_monitor: Option<TAdapter::StatusMonitor>,
    pub stop_on_exit_codes: Vec<i32>,
}

impl<TAdapter: ProcessAdapter> ProcessWatcher<TAdapter> {
    pub fn new(adapter: TAdapter) -> Self {
        Self {
            adapter,
            watcher_task: None,
            internal_shutdown: Shutdown::new(),
            poll_time: tokio::time::Duration::from_secs(5),
            health_timeout: tokio::time::Duration::from_secs(4),
            expected_startup_time: tokio::time::Duration::from_secs(20),
            status_monitor: None,
            stop_on_exit_codes: Vec::new(),
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
        app_shutdown: ShutdownSignal,
        base_path: PathBuf,
        config_path: PathBuf,
        log_path: PathBuf,
        binary: Binaries,
    ) -> Result<(), anyhow::Error> {
        let name = self.adapter.name().to_string();
        if self.watcher_task.is_some() {
            warn!(target: LOG_TARGET, "Tried to start process watcher for {} twice", name);
            return Ok(());
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
        let (mut child, status_monitor) =
            self.adapter
                .spawn(base_path, config_path, log_path, binary_path)?;
        let status_monitor2 = status_monitor.clone();
        self.status_monitor = Some(status_monitor);

        let expected_startup_time = self.expected_startup_time;
        let mut app_shutdown: ShutdownSignal = app_shutdown.clone();
        let stop_on_exit_codes = self.stop_on_exit_codes.clone();
        self.watcher_task = Some(tauri::async_runtime::spawn(async move {
            child.start().await?;
            let mut uptime = Instant::now();
            sleep(Duration::from_secs(10)).await;
            info!(target: LOG_TARGET, "Starting process watcher for {}", name);
            let mut watch_timer = tokio::time::interval(poll_time);
            watch_timer.set_missed_tick_behavior(MissedTickBehavior::Delay);
            let mut warning_count = 0;
            // read events such as stdout
            loop {
                select! {
                      _ = watch_timer.tick() => {
                        let status_monitor3 = status_monitor2.clone();

                        let exit_code = do_health_check(&mut child, status_monitor3, name.clone(), &mut uptime, expected_startup_time, health_timeout, app_shutdown.clone(), inner_shutdown.clone(), &mut warning_count).await?;
                        if exit_code != 0 {
                                if stop_on_exit_codes.contains(&exit_code) {
                                    return Ok(exit_code);
                                }
                                warn!(target: LOG_TARGET, "{} exited with error code: {}, restarting because it is not a listed exit code to list for", name, exit_code);

                        }
                            //    break;
                      },
                    _ = inner_shutdown.wait() => {
                        return child.stop().await;

                    },
                    _ = app_shutdown.wait() => {
                        return child.stop().await;
                    }
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
            return Ok(exit_code);
        }
        Ok(0)
    }
}

#[allow(clippy::too_many_arguments)]
async fn do_health_check<T: StatusMonitor>(
    child: &mut ProcessInstance,
    status_monitor3: T,
    name: String,
    uptime: &mut Instant,
    expected_startup_time: Duration,
    health_timeout: Duration,
    app_shutdown: ShutdownSignal,
    inner_shutdown: ShutdownSignal,
    warning_count: &mut u32,
) -> Result<i32, anyhow::Error> {
    let mut is_healthy = false;

    if child.ping() {
        let mut inner_shutdown2 = inner_shutdown.clone();
        let mut app_shutdown2 = app_shutdown.clone();
        if let Ok(inner) = timeout(health_timeout, async {
            select! {
                r = status_monitor3.check_health() => r,
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
                    *warning_count += 1;
                    if *warning_count > 10 {
                        error!(target: LOG_TARGET, "{} is not healthy. Health check returned warning", name);
                        *warning_count = 0;
                    } else {
                        is_healthy = true;
                    }
                }
                HealthStatus::Unhealthy => {
                    error!(target: LOG_TARGET, "{} is not healthy. Health check returned false", name);
                }
            }
        }
    }

    if !is_healthy
        && !child.shutdown.is_triggered()
        && !app_shutdown.is_triggered()
        && !inner_shutdown.is_triggered()
    {
        if uptime.elapsed() < expected_startup_time {
            warn!(target: LOG_TARGET, "{} is not healthy. Waiting for startup time to elapse", name);
        } else {
            match child.stop().await {
                Ok(exit_code) => {
                    if exit_code != 0 {
                        error!(target: LOG_TARGET, "{} exited with error code: {}", name, exit_code);
                        // Do not restart on non-zero exit code. This will just keep happening.
                        return Ok(exit_code);
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
            child.start().await?;
            // Wait for a bit before checking health again
            // sleep(Duration::from_secs(10)).await;
        }
    }
    Ok(0)
}
