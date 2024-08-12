use crate::app_config::MiningMode;
use crate::xmrig::http_api::XmrigHttpApiClient;
use crate::xmrig_adapter::{XmrigAdapter, XmrigNodeConnection};
use crate::{
    CpuCoreTemperature, CpuMinerConfig, CpuMinerConnection, CpuMinerConnectionStatus, CpuMinerStatus, ProgressTracker
};
use log::warn;
use std::ops::Deref;
use std::path::PathBuf;
use sysinfo::{Component, Components, CpuRefreshKind, RefreshKind, System};
use tari_core::transactions::tari_amount::MicroMinotari;
use tari_shutdown::{Shutdown, ShutdownSignal};
use tauri::async_runtime::JoinHandle;
use tokio::select;
use tokio::time::MissedTickBehavior;

const RANDOMX_BLOCKS_PER_DAY: u64 = 350;
const LOG_TARGET: &str = "tari::universe::cpu_miner";
pub enum CpuMinerEvent {}

pub(crate) struct CpuMiner {
    watcher_task: Option<JoinHandle<Result<(), anyhow::Error>>>,
    miner_shutdown: Shutdown,
    api_client: Option<XmrigHttpApiClient>,
    cpu_temperature_components: Components,
    cpu_temperatures: Vec<CpuCoreTemperature>,
}

impl CpuMiner {
    pub fn new() -> Self {
        Self {
            watcher_task: None,
            miner_shutdown: Shutdown::new(),
            api_client: None,
            cpu_temperature_components: Components::new_with_refreshed_list(),
            cpu_temperatures: Vec::new(),
        }
    }

    pub async fn start(
        &mut self,
        mut app_shutdown: ShutdownSignal,
        cpu_miner_config: &CpuMinerConfig,
        base_path: PathBuf,
        cache_dir: PathBuf,
        log_dir: PathBuf,
        progress_tracker: ProgressTracker,
        mode: MiningMode,
    ) -> Result<(), anyhow::Error> {
        if self.watcher_task.is_some() {
            warn!(target: LOG_TARGET, "Tried to start mining twice");
            return Ok(());
        }
        self.miner_shutdown = Shutdown::new();
        let mut inner_shutdown = self.miner_shutdown.to_signal();

        let xmrig_node_connection = match cpu_miner_config.node_connection {
            CpuMinerConnection::BuiltInProxy => {
                XmrigNodeConnection::LocalMmproxy {
                    host_name: "127.0.0.1".to_string(),
                    // port: local_mm_proxy.try_get_listening_port().await?
                    // TODO: Replace with actual port
                    port: 18081,
                }
            }
        };
        let cpu_max_percentage = match mode {
            MiningMode::Eco => 30,
            MiningMode::Ludicrous => 100,
        };
        let xmrig = XmrigAdapter::new(xmrig_node_connection, "44AFFq5kSiGBoZ4NMDwYtN18obc8AemS33DBLWs3H7otXft3XjrpDtQGv7SqSsaBYBb98uNbr2VBBEt7f2wfn3RVGQBEP3A".to_string()  );
        let (mut _rx, mut xmrig_child, client) = xmrig.spawn(
            cache_dir,
            log_dir,
            base_path,
            progress_tracker,
            cpu_max_percentage,
        )?;

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
        self.api_client = None;
        if let Some(task) = self.watcher_task.take() {
            task.await??;
            println!("Task finished");
        }
        // TODO: This doesn't seem to be called

        Ok(())
    }

    pub async fn status(
        &mut self,
        network_hash_rate: u64,
        block_reward: MicroMinotari,
    ) -> Result<CpuMinerStatus, anyhow::Error> {
        
        let components = &mut self.cpu_temperature_components;
        components.refresh();

        let cpu_components:Vec<&Component> = components.iter().filter(|component| component.label().contains("Core")).collect();
        let cpu_temperatures: Vec<CpuCoreTemperature> = cpu_components.iter().map(|component| {
                CpuCoreTemperature {
                    id: component.label().split(" ").last().unwrap().parse().unwrap(),
                    label: component.label().split(" ").skip(1).collect::<Vec<&str>>().join(" ").to_string(),
                    temperature: component.temperature(),
                    max_temperature: component.max(),
                }
            }).collect();

        if self.cpu_temperatures.is_empty() {
            self.cpu_temperatures = cpu_temperatures.clone()
        }else {
            for (i, component) in cpu_temperatures.clone().iter().enumerate() {
                let position = self.cpu_temperatures.iter().position(|x| x.id == component.id).unwrap();
                self.cpu_temperatures[position].temperature = component.temperature;
                if component.temperature > self.cpu_temperatures[position].max_temperature {
                    self.cpu_temperatures[position].max_temperature = self.cpu_temperatures[i].temperature;
                }
            }
        }

        let mut s =
            System::new_with_specifics(RefreshKind::new().with_cpu(CpuRefreshKind::everything()));

        // Wait a bit because CPU usage is based on diff.
        std::thread::sleep(sysinfo::MINIMUM_CPU_UPDATE_INTERVAL);
        // Refresh CPUs again.
        s.refresh_cpu_all();

        let cpu_brand = s.cpus().first().map(|cpu| cpu.brand()).unwrap_or("Unknown");

        let cpu_usage = s.global_cpu_usage() as u32;
        // let cpu_temperature = s.

        match &self.api_client {
            Some(client) => {
                let mut is_mining = false;
                let (hash_rate, hashrate_sum, estimated_earnings, is_connected) =
                    match client.summary().await {
                        Ok(xmrig_status) => {
                            let hash_rate = xmrig_status.hashrate.total[0].unwrap_or_default();
                            dbg!(hash_rate, network_hash_rate, block_reward);
                            let estimated_earnings = (block_reward.as_u64() as f64
                                * (hash_rate / network_hash_rate as f64
                                    * RANDOMX_BLOCKS_PER_DAY as f64))
                                as u64;
                            // Can't be more than the max reward for a day
                            let estimated_earnings = std::cmp::min(
                                estimated_earnings,
                                block_reward.as_u64() * RANDOMX_BLOCKS_PER_DAY,
                            );

                            // mining should be true if the hashrate is greater than 0

                            let hasrate_sum = xmrig_status
                                .hashrate
                                .total
                                .iter()
                                .fold(0.0, |acc, x| acc + x.unwrap_or(0.0));
                            (
                                hash_rate,
                                hasrate_sum,
                                estimated_earnings,
                                xmrig_status.connection.uptime > 0,
                            )
                        }
                        Err(e) => {
                            warn!(target: LOG_TARGET, "Failed to get xmrig summary: {}", e);
                            (0.0, 0.0, 0, false)
                        }
                    };

                if hashrate_sum > 0.0 {
                    is_mining = true;
                }

                Ok(CpuMinerStatus {
                    is_mining_enabled: true,
                    is_mining,
                    hash_rate,
                    cpu_usage: cpu_usage as u32,
                    cpu_brand: cpu_brand.to_string(),
                    estimated_earnings: MicroMinotari(estimated_earnings).as_u64(),
                    connection: CpuMinerConnectionStatus {
                        is_connected,
                        // error: if xmrig_status.connection.error_log.is_empty() {
                        //     None
                        // } else {
                        //     Some(xmrig_status.connection.error_log.join(";"))
                        // },
                    },
                })
            }
            None => Ok(CpuMinerStatus {
                is_mining_enabled: false,
                is_mining: false,
                hash_rate: 0.0,
                estimated_earnings: 0,
                connection: CpuMinerConnectionStatus {
                    is_connected: false,
                    // error: None,
                },
            }),
        }
    }
}
