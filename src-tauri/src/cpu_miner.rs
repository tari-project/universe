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
use crate::process_stats_collector::ProcessStatsCollectorBuilder;
use crate::process_watcher::ProcessWatcher;
use crate::tasks_tracker::TasksTracker;
use crate::utils::math_utils::estimate_earning;
use crate::xmrig::http_api::models::Summary;
use crate::xmrig_adapter::{XmrigAdapter, XmrigNodeConnection};
use crate::{BaseNodeStatus, CpuMinerConfig};
use log::{debug, error, warn};
use std::path::PathBuf;
use std::sync::Arc;
use std::thread;
use std::time::{Duration, Instant};
use tari_core::transactions::tari_amount::MicroMinotari;
use tari_shutdown::ShutdownSignal;
use tokio::select;
use tokio::sync::{watch, RwLock};
use tokio::time::{sleep, timeout};

const LOG_TARGET: &str = "tari::universe::cpu_miner";
const ECO_MODE_CPU_USAGE: u32 = 30;

pub(crate) struct CpuMiner {
    watcher: Arc<RwLock<ProcessWatcher<XmrigAdapter>>>,
    cpu_miner_status_watch_tx: watch::Sender<CpuMinerStatus>,
    summary_watch_rx: watch::Receiver<Option<Summary>>,
    node_status_watch_rx: watch::Receiver<BaseNodeStatus>,
}

impl CpuMiner {
    pub fn new(
        stats_collector: &mut ProcessStatsCollectorBuilder,
        cpu_miner_status_watch_tx: watch::Sender<CpuMinerStatus>,
        node_status_watch_rx: watch::Receiver<BaseNodeStatus>,
    ) -> Self {
        let (summary_watch_tx, summary_watch_rx) = watch::channel::<Option<Summary>>(None);
        let xmrig_adapter = XmrigAdapter::new(summary_watch_tx);
        let process_watcher = ProcessWatcher::new(xmrig_adapter, stats_collector.take_cpu_miner());
        Self {
            watcher: Arc::new(RwLock::new(process_watcher)),
            cpu_miner_status_watch_tx,
            summary_watch_rx,
            node_status_watch_rx,
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
        {
            let mut lock = self.watcher.write().await;
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
        }

        self.initialize_status_updates(app_shutdown).await;

        Ok(())
    }

    pub async fn start_benchmarking(
        &mut self,
        app_shutdown: ShutdownSignal,
        duration: Duration,
        base_path: PathBuf,
        config_path: PathBuf,
        log_dir: PathBuf,
    ) -> Result<u64, anyhow::Error> {
        let max_cpu_available = thread::available_parallelism();
        let max_cpu_available = match max_cpu_available {
            Ok(available_cpus) => u32::try_from(available_cpus.get()).unwrap_or(1),
            Err(_) => 1,
        };

        {
            let mut lock = self.watcher.write().await;
            lock.adapter.node_connection = Some(XmrigNodeConnection::Benchmark);
            lock.adapter.monero_address = Some("44AFFq5kSiGBoZ4NMDwYtN18obc8AemS33DBLWs3H7otXft3XjrpDtQGv7SqSsaBYBb98uNbr2VBBEt7f2wfn3RVGQBEP3A".to_string());
            lock.adapter.cpu_threads = Some(Some(1));
            lock.adapter.extra_options = vec![];

            lock.start(
                app_shutdown.clone(),
                base_path.clone(),
                config_path.clone(),
                log_dir.clone(),
                Binaries::Xmrig,
            )
            .await?;
        }

        let status = {
            let mut status = None;
            for _ in 0..10 {
                let lock = self.watcher.read().await;
                if let Some(s) = lock.status_monitor.as_ref() {
                    status = Some(s.clone());
                    break;
                }
                drop(lock);
                sleep(Duration::from_secs(1)).await;
            }

            match status {
                Some(s) => s,
                None => {
                    error!(target: LOG_TARGET, "Failed to get status for xmrig for benchmarking");
                    // Stop the miner before returning
                    self.stop().await?;
                    return Ok(0);
                }
            }
        };

        let timeout_duration = duration + Duration::from_secs(10);
        let result = match timeout(timeout_duration, async move {
            let start_time = Instant::now();
            let mut max_hashrate = 0f64;

            loop {
                if app_shutdown.is_triggered() {
                    break;
                }

                sleep(Duration::from_secs(1)).await;

                if let Ok(stats) = status.summary().await {
                    let hash_rate = stats.hashrate.total[0].unwrap_or_default();
                    if hash_rate > max_hashrate {
                        max_hashrate = hash_rate;
                    }
                    if start_time.elapsed() > duration {
                        break;
                    }
                }
            }

            #[allow(clippy::cast_possible_truncation)]
            Ok::<u64, anyhow::Error>(max_hashrate.floor() as u64)
        })
        .await
        {
            Ok(res) => res? * u64::from(max_cpu_available),
            Err(_) => 0,
        };

        // Stop the miner
        self.stop().await?;

        Ok(result)
    }

    pub async fn stop(&mut self) -> Result<(), anyhow::Error> {
        let mut lock = self.watcher.write().await;
        lock.stop().await?;
        let _result = self
            .cpu_miner_status_watch_tx
            .send_replace(CpuMinerStatus::default());
        Ok(())
    }

    pub async fn is_running(&self) -> bool {
        let lock = self.watcher.read().await;
        lock.is_running()
    }

    async fn initialize_status_updates(&mut self, mut app_shutdown: ShutdownSignal) {
        let cpu_miner_status_watch_tx = self.cpu_miner_status_watch_tx.clone();
        let mut summary_watch_rx = self.summary_watch_rx.clone();
        let node_status_watch_rx = self.node_status_watch_rx.clone();

        TasksTracker::current().spawn(async move {
            loop {
                select! {
                    _ = summary_watch_rx.changed() => {
                        let node_status = node_status_watch_rx.borrow().clone();
                        let xmrig_summary = summary_watch_rx.borrow().clone();

                        let cpu_status = match xmrig_summary {
                            Some(xmrig_status) => {
                                let hash_rate = xmrig_status.hashrate.total[0].unwrap_or_default();
                                let estimated_earnings =
                                    estimate_earning(node_status.randomx_network_hashrate, hash_rate, node_status.block_reward);

                                // // UNUSED, commented for now
                                // let hasrate_sum = xmrig_status
                                //     .hashrate
                                //     .total
                                //     .iter()
                                //     .fold(0.0, |acc, x| acc + x.unwrap_or(0.0));
                                let is_connected = xmrig_status.connection.uptime > 0;

                                CpuMinerStatus {
                                    is_mining: true,
                                    hash_rate,
                                    estimated_earnings: MicroMinotari(estimated_earnings).as_u64(),
                                    connection: CpuMinerConnectionStatus { is_connected },
                                }
                            }
                            None => {
                                warn!(target: LOG_TARGET, "Failed to get xmrig summary");
                                CpuMinerStatus::default()
                            }
                        };

                        let _result = cpu_miner_status_watch_tx.send(cpu_status);
                    },
                    _ = app_shutdown.wait() => {
                        break;
                    },
                }
            }
        });
    }
}
