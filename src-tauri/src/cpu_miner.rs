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

use crate::app_config::MiningMode;
use crate::binaries::Binaries;
use crate::commands::{CpuMinerConnection, CpuMinerConnectionStatus, CpuMinerStatus};
use crate::process_watcher::ProcessWatcher;
use crate::utils::math_utils::estimate_earning;
use crate::xmrig_adapter::{XmrigAdapter, XmrigNodeConnection};
use crate::CpuMinerConfig;
use log::{debug, error, warn};
use std::path::PathBuf;
use std::sync::Arc;
use std::thread;
use tari_core::transactions::tari_amount::MicroMinotari;
use tari_shutdown::ShutdownSignal;
use tokio::sync::RwLock;

const LOG_TARGET: &str = "tari::universe::cpu_miner";
const ECO_MODE_CPU_USAGE: u32 = 30;

pub(crate) struct CpuMiner {
    watcher: Arc<RwLock<ProcessWatcher<XmrigAdapter>>>,
}

impl CpuMiner {
    pub fn new() -> Self {
        let xmrig_adapter = XmrigAdapter::new();
        let process_watcher = ProcessWatcher::new(xmrig_adapter);
        Self {
            watcher: Arc::new(RwLock::new(process_watcher)),
        }
    }

    #[allow(clippy::too_many_arguments)]
    pub async fn start(
        &mut self,
        app_shutdown: ShutdownSignal,
        cpu_miner_config: &CpuMinerConfig,
        monero_address: String,
        monero_port: u16,
        base_path: PathBuf,
        config_path: PathBuf,
        log_dir: PathBuf,
        mode: MiningMode,
        custom_cpu_threads: Option<u32>,
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
                u32::try_from(available_cpus.get()).unwrap_or(1)
            }
            Err(err) => {
                error!("Available CPUs: Unknown, error: {}", err);
                1
            }
        };

        let eco_mode_threads = cpu_miner_config
            .eco_mode_cpu_percentage
            .unwrap_or((ECO_MODE_CPU_USAGE * max_cpu_available) / 100u32);

        let cpu_max_percentage = match mode {
            MiningMode::Eco => Some(eco_mode_threads),
            MiningMode::Custom => {
                if custom_cpu_threads.unwrap_or(0) == max_cpu_available {
                    None
                } else {
                    custom_cpu_threads
                }
            }
            MiningMode::Ludicrous => None,
        };

        lock.adapter.node_connection = Some(xmrig_node_connection);
        lock.adapter.monero_address = Some(monero_address.clone());
        lock.adapter.cpu_threads = Some(cpu_max_percentage);
        lock.adapter.extra_options = match mode {
            MiningMode::Eco => cpu_miner_config.eco_mode_xmrig_options.clone(),
            MiningMode::Ludicrous => cpu_miner_config.ludicrous_mode_xmrig_options.clone(),
            MiningMode::Custom => cpu_miner_config.custom_mode_xmrig_options.clone(),
        };

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

    pub async fn is_running(&self) -> bool {
        let lock = self.watcher.read().await;
        lock.is_running()
    }

    pub async fn is_pid_file_exists(&self, base_path: PathBuf) -> bool {
        let lock = self.watcher.read().await;
        lock.is_pid_file_exists(base_path)
    }

    pub async fn status(
        &self,
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
                        let estimated_earnings =
                            estimate_earning(network_hash_rate, hash_rate, block_reward);

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
