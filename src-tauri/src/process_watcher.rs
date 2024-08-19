use crate::process_adapter::{ProcessAdapter, ProcessInstance};
use log::{debug, error, info};
use std::path::PathBuf;
use tari_shutdown::{Shutdown, ShutdownSignal};
use tauri::async_runtime::JoinHandle;
use tokio::select;
use tokio::time::MissedTickBehavior;

const LOG_TARGET: &str = "tari::universe::process_watcher";
pub struct ProcessWatcher<TAdapter: ProcessAdapter> {
    pub(crate) adapter: TAdapter,
    watcher_task: Option<JoinHandle<Result<(), anyhow::Error>>>,
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
        log_path: PathBuf,
    ) -> Result<(), anyhow::Error> {
        let name = self.adapter.name().to_string();
        if self.watcher_task.is_some() {
            println!("Tried to start process watcher for {} twice", name);
            return Ok(());
        }
        info!(target: LOG_TARGET, "Starting process watcher for {}", name);
        self.kill_previous_instances(base_path.clone()).await?;

        self.internal_shutdown = Shutdown::new();
        let mut inner_shutdown = self.internal_shutdown.to_signal();

        let poll_time = self.poll_time;

        let (mut child, status_monitor) = self.adapter.spawn(base_path, log_path)?;
        self.status_monitor = Some(status_monitor);

        let mut app_shutdown = app_shutdown.clone();
        self.watcher_task = Some(tauri::async_runtime::spawn(async move {
            println!("Starting process watcher for {}", name);
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
                                   Ok(()) => {
                                      info!(target: LOG_TARGET, "{} exited successfully", name);
                                   }
                                   Err(e) => {
                                      error!(target: LOG_TARGET, "{} exited with error: {}", name, e);
                                   }
                               }
                               break;
                            }
                      },
                    _ = inner_shutdown.wait() => {
                        child.stop().await?;
                        break;
                    },
                    _ = app_shutdown.wait() => {
                        child.stop().await?;
                        break;
                    }
                }
            }
            Ok(())
        }));
        Ok(())
    }

    pub async fn wait_ready(&self) -> Result<(), anyhow::Error> {
        //TODO
        Ok(())
    }

    pub async fn stop(&mut self) -> Result<(), anyhow::Error> {
        self.internal_shutdown.trigger();
        if let Some(task) = self.watcher_task.take() {
            task.await??;
        }
        Ok(())
    }
}
