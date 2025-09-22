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

use crate::binaries::Binaries;
use crate::commands::{CpuMinerConnectionStatus, CpuMinerStatus};
use crate::configs::config_pools::ConfigPoolsContent;
use crate::configs::config_wallet::ConfigWalletContent;
use crate::configs::pools::cpu_pools::CpuPool;
use crate::configs::pools::BasePoolData;
use crate::mining::cpu::CpuMinerConnection;
use crate::mining::pools::cpu_pool_manager::CpuPoolManager;
use crate::mining::pools::PoolManagerInterfaceTrait;
use crate::process_stats_collector::ProcessStatsCollectorBuilder;
use crate::process_watcher::ProcessWatcher;
use crate::tasks_tracker::TasksTrackers;
use crate::utils::math_utils::estimate_earning;
use crate::xmrig::http_api::models::Summary;
use crate::xmrig_adapter::{XmrigAdapter, XmrigNodeConnection};
use crate::{mm_proxy_manager, BaseNodeStatus};
use log::{debug, error, info, warn};
use std::path::PathBuf;
use std::sync::Arc;
use std::thread;
use tari_common_types::tari_address::TariAddress;
use tari_shutdown::{Shutdown, ShutdownSignal};
use tari_transaction_components::tari_amount::MicroMinotari;
use tokio::sync::{watch, RwLock};
use tokio::{select, spawn};

const LOG_TARGET: &str = "tari::universe::cpu_miner";

pub struct CpuMinerConfig {
    pub node_connection: CpuMinerConnection,
    pub monero_address: String,
    pub pool_host_name: Option<String>,
    pub pool_port: Option<u16>,
    pub pool_status_url: Option<String>,
    pub worker_name: Option<String>,
}

impl CpuMinerConfig {
    fn split_url_to_hostname_port(pool_url: &str) -> Result<(String, u16), anyhow::Error> {
        let parts: Vec<&str> = pool_url.split(':').collect();
        if parts.len() == 2 {
            let host_name = parts[0].to_string();
            let port = parts[1].parse::<u16>().map_err(|error| {
                anyhow::anyhow!(
                    "Invalid port number in pool URL: {} : {} | error: {}",
                    pool_url,
                    parts[1],
                    error
                )
            })?;
            Ok((host_name, port))
        } else {
            Err(anyhow::anyhow!("Invalid pool URL format: {}", pool_url))
        }
    }

    fn resolve_pool_connection(
        &mut self,
        pool_data: BasePoolData<CpuPool>,
        tari_address: &TariAddress,
    ) {
        self.pool_status_url = Some(
            pool_data
                .stats_url
                .replace("%TARI_ADDRESS%", &tari_address.to_base58()),
        );
        let pool_url = pool_data.pool_url;

        if let Ok((host_name, port)) = Self::split_url_to_hostname_port(&pool_url) {
            self.pool_host_name = Some(host_name);
            self.pool_port = Some(port);
        } else {
            error!(target: LOG_TARGET, "Invalid pool URL format: {pool_url}");
        }

        match pool_data.pool_type {
            CpuPool::SupportXTMPoolRANDOMX => {
                self.worker_name = None;
            }
            CpuPool::LuckyPoolRANDOMX => {
                self.worker_name = Some(".Tari-universe".to_string());
            }
            CpuPool::KryptexPoolRANDOMX => {
                self.worker_name = Some("/Tari-universe".to_string());
            }
        }

        self.node_connection = CpuMinerConnection::Pool;
    }
    pub fn load_from_config_pools(
        &mut self,
        config_pools_content: ConfigPoolsContent,
        tari_address: &TariAddress,
    ) {
        let selected_cpu_pool_data = config_pools_content.current_cpu_pool().clone();

        if *config_pools_content.cpu_pool_enabled() {
            match selected_cpu_pool_data.pool_type {
                CpuPool::SupportXTMPoolRANDOMX => {
                    self.resolve_pool_connection(selected_cpu_pool_data, tari_address)
                }
                CpuPool::LuckyPoolRANDOMX => {
                    self.resolve_pool_connection(selected_cpu_pool_data, tari_address)
                }
                CpuPool::KryptexPoolRANDOMX => {
                    self.resolve_pool_connection(selected_cpu_pool_data, tari_address)
                }
            }
        } else {
            self.pool_status_url = None;
            self.pool_host_name = None;
            self.pool_port = None;
            self.node_connection = CpuMinerConnection::Local;
        }
    }

    pub fn load_from_config_wallet(&mut self, config_wallet_content: &ConfigWalletContent) {
        self.monero_address = config_wallet_content.monero_address().to_string();
    }
}

pub(crate) struct CpuMiner {
    watcher: Arc<RwLock<ProcessWatcher<XmrigAdapter>>>,
    cpu_miner_status_watch_tx: watch::Sender<CpuMinerStatus>,
    summary_watch_rx: watch::Receiver<Option<Summary>>,
    node_status_watch_rx: watch::Receiver<BaseNodeStatus>,
    pub pool_status_shutdown_signal: Shutdown,
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
            pool_status_shutdown_signal: Shutdown::new(),
        }
    }

    #[allow(clippy::too_many_arguments)]
    #[allow(clippy::too_many_lines)]
    pub async fn start(
        &mut self,
        app_shutdown: ShutdownSignal,
        cpu_miner_config: &CpuMinerConfig,
        mm_proxy_manager: &mm_proxy_manager::MmProxyManager,
        base_path: PathBuf,
        config_path: PathBuf,
        log_dir: PathBuf,
        cpu_usage_percentage: u32,
        tari_address: &TariAddress,
    ) -> Result<(), anyhow::Error> {
        self.pool_status_shutdown_signal = Shutdown::new();

        let xmrig_node_connection = match cpu_miner_config.node_connection {
            CpuMinerConnection::Local => XmrigNodeConnection::LocalMmproxy {
                host_name: "127.0.0.1".to_string(),
                port: mm_proxy_manager.get_monero_port().await?,
                monero_address: cpu_miner_config.monero_address.clone(),
            },

            CpuMinerConnection::Pool => {
                let (pool_address, port) =
                    match (&cpu_miner_config.pool_host_name, cpu_miner_config.pool_port) {
                        (Some(ref host_name), Some(port)) => (host_name.clone(), port),
                        _ => {
                            return Err(anyhow::anyhow!(
                                "Pool host name and port must be provided for Pool connection"
                            ));
                        }
                    };

                let mut tari_address = tari_address.to_base58();

                // Append worker name if provided and pool supports it
                // Luckypool tari_address.worker_name
                // Kryptex tari_address/worker_name
                if let Some(worker_name) = &cpu_miner_config.worker_name {
                    if !worker_name.is_empty() {
                        tari_address = format!("{}{}", tari_address, worker_name);
                    }
                }

                XmrigNodeConnection::Pool {
                    host_name: pool_address,
                    port,
                    tari_address,
                }
            }
        };
        let max_cpu_available = thread::available_parallelism();
        let max_cpu_available = match max_cpu_available {
            Ok(available_cpus) => {
                debug!(target:LOG_TARGET, "Available CPUs: {available_cpus}");
                u32::try_from(available_cpus.get()).unwrap_or(1)
            }
            Err(err) => {
                error!("Available CPUs: Unknown, error: {err}");
                1
            }
        };

        let cpu_cores_to_use = max_cpu_available
            .saturating_mul(cpu_usage_percentage)
            .saturating_div(100)
            .clamp(1, max_cpu_available);

        info!(target: LOG_TARGET, "Using {cpu_cores_to_use} CPU cores for mining");

        {
            let mut lock = self.watcher.write().await;

            lock.adapter.node_connection = Some(xmrig_node_connection);
            lock.adapter.cpu_threads = Some(cpu_cores_to_use);

            let shutdown_signal = TasksTrackers::current().cpu_mining_phase.get_signal().await;
            let task_tracker = TasksTrackers::current()
                .cpu_mining_phase
                .get_task_tracker()
                .await;

            lock.start(
                base_path.clone(),
                config_path.clone(),
                log_dir.clone(),
                Binaries::Xmrig,
                shutdown_signal,
                task_tracker,
            )
            .await?;
        }

        self.initialize_status_updates(app_shutdown).await;

        // Start pool status watcher if mining to pool
        if cpu_miner_config
            .node_connection
            .eq(&CpuMinerConnection::Pool)
        {
            CpuPoolManager::start_stats_watcher().await;
        }

        Ok(())
    }

    pub async fn stop(&mut self) -> Result<(), anyhow::Error> {
        {
            let mut lock: tokio::sync::RwLockWriteGuard<'_, ProcessWatcher<XmrigAdapter>> =
                self.watcher.write().await;
            lock.stop().await?;
        }
        let _result = self
            .cpu_miner_status_watch_tx
            .send_replace(CpuMinerStatus::default());
        self.stop_status_updates().await?;
        // Mark mining as stopped in pool manager
        // It will handle stopping the stats watcher after 1 hour of grace period
        CpuPoolManager::handle_mining_status_change(false).await;
        Ok(())
    }

    pub async fn stop_status_updates(&mut self) -> Result<(), anyhow::Error> {
        info!(target: LOG_TARGET, "Stopping status updates");
        self.pool_status_shutdown_signal.trigger();
        Ok(())
    }

    pub async fn is_running(&self) -> bool {
        let lock = self.watcher.read().await;
        lock.is_running()
    }

    pub async fn get_port(&self) -> u16 {
        let lock = self.watcher.read().await;
        lock.adapter.http_api_port
    }
    #[allow(dead_code)]
    pub async fn is_pid_file_exists(&self, base_path: PathBuf) -> bool {
        let lock = self.watcher.read().await;
        lock.is_pid_file_exists(base_path)
    }

    async fn initialize_status_updates(&self, mut app_shutdown: ShutdownSignal) {
        let cpu_miner_status_watch_tx = self.cpu_miner_status_watch_tx.clone();
        let mut summary_watch_rx = self.summary_watch_rx.clone();
        let node_status_watch_rx = self.node_status_watch_rx.clone();
        let mut inner_shutdown_signal = self.pool_status_shutdown_signal.to_signal();

        spawn(async move {
            loop {
                select! {
                    _ = summary_watch_rx.changed() => {
                        let node_status = *node_status_watch_rx.borrow();
                        let xmrig_summary = summary_watch_rx.borrow().clone();

                        let cpu_status = match xmrig_summary {
                            Some(xmrig_status) => {
                                let hash_rate = xmrig_status.hashrate.total[0].unwrap_or_default();
                                let estimated_earnings =
                                    estimate_earning(node_status.monero_randomx_network_hashrate, hash_rate, node_status.block_reward);

                                // // UNUSED, commented for now
                                // let hasrate_sum = xmrig_status
                                //     .hashrate
                                //     .total
                                //     .iter()
                                //     .fold(0.0, |acc, x| acc + x.unwrap_or(0.0));
                                let is_connected = xmrig_status.connection.uptime > 0;
                                // dbg!(&last_pool_status);


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
                    _ = inner_shutdown_signal.wait() => {
                        info!(target: LOG_TARGET, "CpuMiner shutdown signal received, stopping...");
                        break;
                    },
                    _ = app_shutdown.wait() => {
                        info!(target: LOG_TARGET, "App shutdown signal received, stopping CpuMiner...");
                        break;
                    },
                }
            }
        });
    }
}
