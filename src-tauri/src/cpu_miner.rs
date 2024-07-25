use crate::xmrig_adapter::{XmrigAdapter, XmrigNodeConnection};
use tari_shutdown::{Shutdown, ShutdownSignal};
use tauri::async_runtime::JoinHandle;
use tokio::select;
use tokio::time::MissedTickBehavior;
use crate::{CpuMinerConfig, CpuMinerConnection, CpuMinerConnectionStatus, CpuMinerStatus};
use crate::mm_proxy_manager::MmProxyManager;
use crate::xmrig::http_api::XmrigHttpApiClient;

pub enum CpuMinerEvent {
    Stdout(String),
    Stderr(String),
    Exit(i32),
}



pub(crate) struct CpuMiner {
    watcher_task: Option<JoinHandle<Result<(), anyhow::Error>>>,
    miner_shutdown: Shutdown,
    api_client: Option<XmrigHttpApiClient>
}

impl CpuMiner {
    pub fn new() -> Self {
        Self {
            watcher_task: None,
            miner_shutdown: Shutdown::new(),
            api_client: None
        }
    }

    pub async fn start(&mut self, mut app_shutdown: ShutdownSignal,  cpu_miner_config: &CpuMinerConfig, local_mm_proxy: &MmProxyManager) -> Result<(), anyhow::Error> {
        if self.watcher_task.is_some() {
            println!("Tried to start mining twice");
            return Ok(());
        }
        let mut inner_shutdown = self.miner_shutdown.to_signal();


        let xmrig_node_connection = match cpu_miner_config.node_connection {
            CpuMinerConnection::BuiltInProxy => {

                local_mm_proxy.start(app_shutdown.clone()).await?;
                local_mm_proxy.wait_ready().await?;
                XmrigNodeConnection::LocalMmproxy {
                    host_name: "127.0.0.1".to_string(),
                      // port: local_mm_proxy.try_get_listening_port().await?
                    // TODO: Replace with actual port
                    port: 18143,
                                 }
            }
        };
        let xmrig = XmrigAdapter::new(xmrig_node_connection, "44AFFq5kSiGBoZ4NMDwYtN18obc8AemS33DBLWs3H7otXft3XjrpDtQGv7SqSsaBYBb98uNbr2VBBEt7f2wfn3RVGQBEP3A".to_string()  );
        let (mut rx, mut xmrig_child, client) = xmrig.spawn()?;
        self.api_client = Some(client);

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
        self.api_client = None;

        Ok(())
    }

    pub async fn status(&self) -> Result<CpuMinerStatus, anyhow::Error> {
        match &self.api_client {
            Some(client) => {
                let xmrig_status =client.summary().await?;
                dbg!(&xmrig_status);
                Ok(CpuMinerStatus {
                    is_mining: xmrig_status.hashrate.total.len() > 0 && xmrig_status.hashrate.total[0].is_some()  && xmrig_status.hashrate.total[0].unwrap() > 0,
                    connection: CpuMinerConnectionStatus {
                        is_connected: xmrig_status.connection.uptime > 0,
                        error: if xmrig_status.connection.error_log.is_empty() { None } else {Some(xmrig_status.connection.error_log.join(";"))},
                    }
                })

            },
            None => {
                Ok(CpuMinerStatus {
                    is_mining: false,
                    connection: CpuMinerConnectionStatus {
                        is_connected: false,
                        error: None,
                    }
                })
            }
        }
    }
}
