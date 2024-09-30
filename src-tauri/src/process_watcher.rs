use crate::process_adapter::ProcessAdapter;
use log::{debug, error, info, warn};
use std::path::PathBuf;
use tari_shutdown::{Shutdown, ShutdownSignal};
use tauri::async_runtime::JoinHandle;
use tokio::select;
use tokio::time::MissedTickBehavior;

const LOG_TARGET: &str = "tari::universe::process_watcher";
pub struct ProcessWatcher<TAdapter: ProcessAdapter> {
    pub(crate) adapter: TAdapter,
    watcher_task: Option<JoinHandle<Result<i32, anyhow::Error>>>,
    internal_shutdown: Shutdown,
    poll_time: tokio::time::Duration,
    pub(crate) status_monitor: Option<TAdapter::StatusMonitor>,
}

impl<TAdapter: ProcessAdapter> ProcessWatcher<TAdapter> {
    pub fn new(adapter: TAdapter) -> Self {
        Self {
            adapter,
            watcher_task: None,
            internal_shutdown: Shutdown::new(),
            poll_time: tokio::time::Duration::from_secs(1),
            status_monitor: None,
        }
    }
}

impl<TAdapter: ProcessAdapter> ProcessWatcher<TAdapter> {
    pub async fn kill_previous_instances(
        &mut self,
        base_path: PathBuf,
    ) -> Result<(), anyhow::Error> {
        self.adapter.kill_previous_instances(base_path)?;
        Ok(())
    }

    pub async fn start(
        &mut self,
        app_shutdown: ShutdownSignal,
        base_path: PathBuf,
        config_path: PathBuf,
        log_path: PathBuf,
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

        let (mut child, status_monitor) = self.adapter.spawn(base_path, config_path, log_path)?;
        self.status_monitor = Some(status_monitor);

        let mut app_shutdown = app_shutdown.clone();
        self.watcher_task = Some(tauri::async_runtime::spawn(async move {
            info!(target: LOG_TARGET, "Starting process watcher for {}", name);
            let mut watch_timer = tokio::time::interval(poll_time);
            watch_timer.set_missed_tick_behavior(MissedTickBehavior::Skip);
            // read events such as stdout
            loop {
                select! {
                      _ = watch_timer.tick() => {
                            if child.ping() {
                            } else {
                               debug!(target: LOG_TARGET, "{} is not running", name);
                               match child.stop().await {
                                   Ok(exit_code) => {
                                      if exit_code != 0 {
                                          error!(target: LOG_TARGET, "{} exited with error code: {}", name, exit_code);
                                          return Ok(exit_code);
                                      }
                                      else {
                                        info!(target: LOG_TARGET, "{} exited successfully", name);
                                      }
                                   }
                                   Err(e) => {
                                      error!(target: LOG_TARGET, "{} exited with error: {}", name, e);
                                      return Err(e);
                                   }
                               }
                               break;
                            }
                      },
                    _ = inner_shutdown.wait() => {
                        return child.stop().await;

                    },
                    _ = app_shutdown.wait() => {
                        return child.stop().await;
                    }
                }
            }
            Ok(0)
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
