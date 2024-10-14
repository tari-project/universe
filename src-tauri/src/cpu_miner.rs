use crate::app_config::MiningMode;
use crate::binaries::{Binaries, BinaryResolver};
use crate::process_adapter::ProcessAdapter;
use crate::process_watcher::ProcessWatcher;
use crate::xmrig::http_api::XmrigHttpApiClient;
use crate::xmrig_adapter::{XmrigAdapter, XmrigNodeConnection};
use crate::{CpuMinerConfig, CpuMinerConnection, CpuMinerConnectionStatus, CpuMinerStatus};
use log::{debug, error, info, warn};
use std::path::PathBuf;
use std::sync::Arc;
use std::thread;
use sysinfo::Process;
use tari_core::transactions::tari_amount::MicroMinotari;
use tari_shutdown::{Shutdown, ShutdownSignal};
use tauri::async_runtime::JoinHandle;
use tokio::select;
use tokio::sync::RwLock;
use tokio::time::MissedTickBehavior;

const RANDOMX_BLOCKS_PER_DAY: u64 = 360;
const LOG_TARGET: &str = "tari::universe::cpu_miner";

pub(crate) struct CpuMiner {
    watcher: Arc<RwLock<ProcessWatcher<XmrigAdapter>>>,
    miner_shutdown: Shutdown,
}

impl CpuMiner {
    pub fn new() -> Self {
        let xmrig_adapter = XmrigAdapter::new();
        let process_watcher = ProcessWatcher::new(xmrig_adapter);
        Self {
            watcher: Arc::new(RwLock::new(process_watcher)),
            miner_shutdown: Shutdown::new(),
        }
    }

    #[allow(clippy::too_many_arguments)]
    pub async fn start(
        &mut self,
        mut app_shutdown: ShutdownSignal,
        cpu_miner_config: &CpuMinerConfig,
        monero_address: String,
        monero_port: u16,
        base_path: PathBuf,
        config_path: PathBuf,
        log_dir: PathBuf,
        mode: MiningMode,
    ) -> Result<(), anyhow::Error> {
        let mut lock = self.watcher.write().await;

        let xmrig_node_connection = match cpu_miner_config.node_connection {
            CpuMinerConnection::BuiltInProxy => {
                XmrigNodeConnection::LocalMmproxy {
                    host_name: "127.0.0.1".to_string(),
                    // port: local_mm_proxy.try_get_listening_port().await?
                    // TODO: Replace with actual port
                    port: monero_port,
                }
            }
        };
        let max_cpu_available = thread::available_parallelism();
        let max_cpu_available = match max_cpu_available {
            Ok(available_cpus) => {
                debug!(target:LOG_TARGET, "Available CPUs: {}", available_cpus);
                isize::try_from(available_cpus.get()).unwrap_or(1)
            }
            Err(err) => {
                error!("Available CPUs: Unknown, error: {}", err);
                1
            }
        };
        let cpu_max_percentage = match mode {
            MiningMode::Eco => (30 * max_cpu_available) / 100isize,
            MiningMode::Ludicrous => -1, // Use all
        };

        lock.adapter.node_connection = Some(xmrig_node_connection);
        lock.adapter.monero_address = Some(monero_address.clone());
        lock.adapter.cpu_max_percentage = Some(cpu_max_percentage);

        lock.start(
            app_shutdown.clone(),
            base_path.clone(),
            config_path.clone(),
            log_dir.clone(),
            Binaries::Xmrig,
        )
        .await?;
        Ok(())
    }

    pub async fn stop(&mut self) -> Result<(), anyhow::Error> {
        let mut lock = self.watcher.write().await;
        lock.stop().await?;
        Ok(())
    }

    pub async fn status(
        &mut self,
        network_hash_rate: u64,
        block_reward: MicroMinotari,
    ) -> Result<CpuMinerStatus, anyhow::Error> {
        let lock = self.watcher.read().await;
        if !lock.is_running() {
            return Ok(CpuMinerStatus {
                is_mining: false,
                hash_rate: 0.0,
                estimated_earnings: 0,
                connection: CpuMinerConnectionStatus {
                    is_connected: false,
                    // error: None,
                },
            });
        }

        let client = &lock.status_monitor;

        if let Some(client) = client.as_ref() {
            let (hash_rate, _hashrate_sum, estimated_earnings, is_connected) =
                match client.summary().await {
                    Ok(xmrig_status) => {
                        let hash_rate = xmrig_status.hashrate.total[0].unwrap_or_default();
                        let estimated_earnings = if network_hash_rate == 0 {
                            0
                        } else {
                            #[allow(clippy::cast_possible_truncation)]
                            {
                                ((block_reward.as_u64() as f64)
                                    * ((hash_rate / (network_hash_rate as f64))
                                        * (RANDOMX_BLOCKS_PER_DAY as f64)))
                                    .floor() as u64
                            }
                        };
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
                is_mining: true,
                hash_rate,
                estimated_earnings: MicroMinotari(estimated_earnings).as_u64(),
                connection: CpuMinerConnectionStatus { is_connected },
            })
        } else {
            Ok(CpuMinerStatus {
                is_mining: false,
                hash_rate: 0.0,
                estimated_earnings: 0,
                connection: CpuMinerConnectionStatus {
                    is_connected: false,
                    // error: None,
                },
            })
        }
    }
}
