use crate::app_config::MiningMode;
use crate::process_adapter::ProcessAdapter;
use crate::xmrig::http_api::XmrigHttpApiClient;
use crate::xmrig_adapter::{XmrigAdapter, XmrigNodeConnection};
use crate::{
    CpuMinerConfig, CpuMinerConnection, CpuMinerConnectionStatus, CpuMinerStatus, ProgressTracker,
};
use log::{error, info, warn};
use std::path::PathBuf;
use std::thread;
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
}

impl CpuMiner {
    pub fn new() -> Self {
        Self {
            watcher_task: None,
            miner_shutdown: Shutdown::new(),
            api_client: None,
        }
    }

    #[allow(clippy::too_many_arguments)]
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
        let max_cpu_available = thread::available_parallelism();
        let max_cpu_available = match max_cpu_available {
            Ok(available_cpus) => {
                dbg!("Available CPUs: {}", available_cpus);
                available_cpus.get()
            }
            Err(err) => {
                error!("Available CPUs: Unknown, error: {}", err);
                1
            }
        };
        let cpu_max_percentage = match mode {
            MiningMode::Eco => (30 * max_cpu_available) / 100,
            MiningMode::Ludicrous => max_cpu_available,
        };
        let xmrig = XmrigAdapter::new(
            xmrig_node_connection,
            "44AFFq5kSiGBoZ4NMDwYtN18obc8AemS33DBLWs3H7otXft3XjrpDtQGv7SqSsaBYBb98uNbr2VBBEt7f2wfn3RVGQBEP3A".to_string(),
            cache_dir,
            progress_tracker,
            cpu_max_percentage,
        );
        let (mut xmrig_child, _xmrig_status_monitor) =
            xmrig.spawn_inner(base_path.clone(), log_dir.clone())?;
        self.api_client = Some(xmrig.client);

        self.watcher_task = Some(tauri::async_runtime::spawn(async move {
            println!("Starting process");
            let mut watch_timer = tokio::time::interval(tokio::time::Duration::from_secs(1));
            watch_timer.set_missed_tick_behavior(MissedTickBehavior::Skip);
            // read events such as stdout
            loop {
                select! {
                              _ = watch_timer.tick() => {
                                    if !xmrig_child.ping()
                                    {
                                       warn!(target: LOG_TARGET, "xmrig is not running");
                                       match xmrig_child.stop().await {
                                           Ok(_) => {
                                              info!(target: LOG_TARGET, "xmrig exited successfully");
                                           }
                                           Err(e) => {
                                              error!(target: LOG_TARGET, "xmrig exited with error: {}", e);
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
        info!(target: LOG_TARGET, "Triggering shutdown");
        self.miner_shutdown.trigger();
        self.api_client = None;
        if let Some(task) = self.watcher_task.take() {
            task.await??;
            info!(target: LOG_TARGET, "Task finished");
        }
        // TODO: This doesn't seem to be called

        Ok(())
    }

    pub async fn status(
        &mut self,
        network_hash_rate: u64,
        block_reward: MicroMinotari,
    ) -> Result<CpuMinerStatus, anyhow::Error> {
        match &self.api_client {
            Some(client) => {
                let (hash_rate, hashrate_sum, estimated_earnings, is_connected) =
                    match client.summary().await {
                        Ok(xmrig_status) => {
                            println!("xmrig status: {:?}", xmrig_status.hashrate.total[0]);
                            let hash_rate = xmrig_status.hashrate.total[0].unwrap_or_default();
                            let estimated_earnings = ((block_reward.as_u64() as f64)
                                * ((hash_rate / (network_hash_rate as f64))
                                    * (RANDOMX_BLOCKS_PER_DAY as f64)))
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

                Ok(CpuMinerStatus {
                    is_mining: is_connected,
                    hash_rate,
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
