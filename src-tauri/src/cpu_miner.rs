use tari_shutdown::{Shutdown, ShutdownSignal};
use tauri::api::process::{Command};
use tauri::async_runtime::JoinHandle;
use tokio::select;
use tokio::time::MissedTickBehavior;
use crate::xmrig_adapter::XmrigAdapter;


pub enum CpuMinerEvent{
    Stdout(String),
    Stderr(String),
    Exit(i32)
}

pub(crate) struct CpuMiner {
    watcher_task : Option<JoinHandle<Result<(), anyhow::Error>>>,
    miner_shutdown: Shutdown
}

impl CpuMiner {
    pub fn new() -> Self {
        Self {
            watcher_task: None,
            miner_shutdown: Shutdown::new(),
        }
    }

    pub fn start(&mut self, mut app_shutdown: ShutdownSignal) -> Result<(), anyhow::Error> {
        if self.watcher_task.is_some() {
            println!("Tried to start mining twice");
            return Ok(());
        }
        let mut inner_shutdown = self.miner_shutdown.to_signal();

        // let (mut rx, mut child) = Command::new_sidecar("minotari_node")
        //     .expect("failed to create `minotari_node` binary command")
        //     .spawn()
        //     .expect("Failed to spawn sidecar");

        let xmrig = XmrigAdapter::new();
        let (mut rx, mut xmrig_child) = xmrig.spawn()?;

        self.watcher_task = Some(tauri::async_runtime::spawn(async move {
            println!("Starting process");
            let mut watch_timer = tokio::time::interval(tokio::time::Duration::from_secs(1));
            watch_timer.set_missed_tick_behavior(MissedTickBehavior::Skip);
            // read events such as stdout
            loop {
               select! {
                      _ = watch_timer.tick() => {
                        println!("watching");
                       if xmrig_child.ping().expect("idk") {
                           println!("xmrig is running");
                       } else {
                           println!("xmrig is not running");
                           match xmrig_child.stop().await {
                                 Ok(()) => {
                                      println!("xmrig exited successfully");
                                 }
                                 Err(e) => {
                                      println!("xmrig exited with error: {}", e);
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
                    xmrig_child.stop().await?;
                    break;
                },
                _ = app_shutdown.wait() => {
                    xmrig_child.stop().await?;
                    break;
                }
            }


        }
        Ok(())
        }));
            Ok(())
    }

    pub async fn stop(&mut self) -> Result<(), anyhow::Error> {
        println!("Triggering shutdown");
        self.miner_shutdown.trigger();
        if let Some(task) = self.watcher_task.take() {
            task.await?;
            println!("Task finished");
        }

        Ok(())
    }
}