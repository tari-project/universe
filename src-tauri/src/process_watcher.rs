use crate::process_adapter::{ProcessAdapter, ProcessInstance};
use std::path::PathBuf;
use tari_shutdown::{Shutdown, ShutdownSignal};
use tauri::async_runtime::JoinHandle;
use tokio::select;
use tokio::time::MissedTickBehavior;

pub struct ProcessWatcher<TAdapter> {
    adapter: TAdapter,
    watcher_task: Option<JoinHandle<Result<(), anyhow::Error>>>,
    internal_shutdown: Shutdown,
    poll_time: tokio::time::Duration,
}

impl<TAdapter: ProcessAdapter> ProcessWatcher<TAdapter> {
    pub fn new(adapter: TAdapter) -> Self {
        Self {
            adapter,
            watcher_task: None,
            internal_shutdown: Shutdown::new(),
            poll_time: tokio::time::Duration::from_secs(1),
        }
    }
}

impl<TAdapter: ProcessAdapter> ProcessWatcher<TAdapter> {
    pub async fn start(
        &mut self,
        app_shutdown: ShutdownSignal,
        base_path: PathBuf,
    ) -> Result<(), anyhow::Error> {
        let name = self.adapter.name().to_string();
        if self.watcher_task.is_some() {
            println!("Tried to start process watcher for {} twice", name);
            return Ok(());
        }
        self.internal_shutdown = Shutdown::new();
        let mut inner_shutdown = self.internal_shutdown.to_signal();

        let poll_time = self.poll_time;

        let mut child = self.adapter.spawn(base_path)?;

        let mut app_shutdown = app_shutdown.clone();
        self.watcher_task = Some(tauri::async_runtime::spawn(async move {
            println!("Starting process watcher for {}", name);
            let mut watch_timer = tokio::time::interval(poll_time);
            watch_timer.set_missed_tick_behavior(MissedTickBehavior::Skip);
            // read events such as stdout
            loop {
                select! {
                              _ = watch_timer.tick() => {
                                    println!("watching {}", name);
                                    if child.ping() {
                                       println!("{} is running", name);
                                    } else {
                                       println!("{} is not running", name);
                                       match child.stop().await {
                                           Ok(()) => {
                                              println!("{} exited successfully", name);
                                           }
                                           Err(e) => {
                                              println!("{} exited with error: {}", name, e);
                                           }
                                       }
                                       break;
                                    }
                              },
                                //   event = rx.recv() => {
                                //     if let Some(event) = event {
                                //
                                //   // if let CommandEvent::Stdout(line) = event {
                                //   //    window
                                //   //   .emit("message", Some(format!("'{}'", line)))
                                //   //   .expect("failed to emit event");
                                // // write to stdin
                                // //child.write("message from Rust\n".as_bytes()).unwrap();
                                //
                                //    }
                                // else {
                                //  break;
                                // }
                          //         },
                //
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
