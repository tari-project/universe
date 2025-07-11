use log::{info, warn, error};
use std::{path::PathBuf, sync::Arc, time::Duration};
use tari_common_types::tari_address::TariAddress;
use tari_shutdown::Shutdown;
use tokio::{
    select,
    sync::{watch::Sender, RwLock},
    time::interval,
};

use crate::{
    binaries::Binaries, configs::config_mining::MiningMode, gpu_miner_sha_adapter::GpuMinerShaAdapter, pool_status_watcher::LuckyPoolAdapter, process_watcher::ProcessWatcher, tasks_tracker::TasksTrackers, GpuMinerStatus, PoolStatusWatcher, ProcessStatsCollectorBuilder
};

const LOG_TARGET: &str = "tari::universe::gpu_miner_sha";

pub struct GpuMinerSha {
    watcher: Arc<RwLock<ProcessWatcher<GpuMinerShaAdapter>>>,
    status_sender: Sender<Option<GpuMinerStatus>>,
    status_updates_thread: RwLock<Option<tokio::task::JoinHandle<()>>>,
    pool_status_watcher: Option<PoolStatusWatcher<LuckyPoolAdapter>>,
    pub pool_status_shutdown_signal: Shutdown,
}

impl GpuMinerSha {
    pub fn new(
        stats_collector: &mut ProcessStatsCollectorBuilder,
        status_sender: Sender<Option<GpuMinerStatus>>,
    ) -> Self {
        let adapter = GpuMinerShaAdapter::new(status_sender.clone());
        let mut process_watcher =
            ProcessWatcher::new(adapter, stats_collector.take_gpu_miner_sha());
        process_watcher.health_timeout = Duration::from_secs(15);
        process_watcher.poll_time = Duration::from_secs(10);

        Self {
            watcher: Arc::new(RwLock::new(process_watcher)),
            status_sender,
            status_updates_thread: RwLock::new(None),
            pool_status_watcher: None,
            pool_status_shutdown_signal: Shutdown::new(),
        }
    }

    pub async fn start(
        &mut self,
        tari_address: TariAddress,
        telemetry_id: String,
        mode: MiningMode,
        base_path: PathBuf,
        config_path: PathBuf,
        log_path: PathBuf,
    ) -> Result<(), anyhow::Error> {
        let shutdown_signal = TasksTrackers::current().hardware_phase.get_signal().await;
        let task_tracker = TasksTrackers::current()
            .hardware_phase
            .get_task_tracker()
            .await;

        self.pool_status_watcher = Some(PoolStatusWatcher::new(
            format!(
                "https://api-tari.luckypool.io/stats_address?address={}",
                tari_address.to_base58()
            ),
            LuckyPoolAdapter {},
        ));

        let mut process_watcher = self.watcher.write().await;

        process_watcher.adapter.tari_address = Some(tari_address);
        process_watcher.adapter.worker_name = Some(telemetry_id.to_string());
        process_watcher.adapter.batch_size = Some(10000);
        process_watcher.adapter.intensity = Some(100);
        info!(target: LOG_TARGET, "Starting sha miner");
        process_watcher
            .start(
                base_path,
                config_path,
                log_path,
                Binaries::GpuMinerSHA3X,
                shutdown_signal.clone(),
                task_tracker,
            )
            .await?;
        info!(target: LOG_TARGET, "sha miner started");

        self.initialize_status_updates().await?;

        Ok(())
    }

    pub async fn stop(&self) -> Result<(), anyhow::Error> {
        info!(target: LOG_TARGET, "Stopping sha miner");
        {
            let mut process_watcher = self.watcher.write().await;
            process_watcher.status_monitor = None;
            process_watcher.stop().await?;
            if let Some(status_updates_thread) = self.status_updates_thread.write().await.take() {
                status_updates_thread.abort();
            }
        }
        info!(target: LOG_TARGET, "xtrgpuminer stopped");
        Ok(())
    }

    pub async fn initialize_status_updates(&self) -> Result<(), anyhow::Error> {
        let mut status_updates_thread_guard = self.status_updates_thread.write().await;
        if status_updates_thread_guard.is_some() {
            warn!(target: LOG_TARGET, "Status updates thread is already running");
            return Ok(());
        }

        let gpu_status_sender = self.status_sender.clone();
        let mut gpu_status_receiver = self.status_sender.subscribe();
        
        let pool_status_watcher = self.pool_status_watcher.clone();
        let mut pool_status_check = interval(Duration::from_secs(20));
        pool_status_check.set_missed_tick_behavior(tokio::time::MissedTickBehavior::Skip);
        let mut pool_shutdown_signal = self.pool_status_shutdown_signal.to_signal();

        let mut shutdown_signal = TasksTrackers::current().hardware_phase.get_signal().await;

        let status_updates_thread = TasksTrackers::current()
            .hardware_phase
            .get_task_tracker()
            .await
            .spawn(async move {
                let mut last_pool_status = None;
                loop {
                    select! {
                        _ = pool_status_check.tick() => {
                            last_pool_status = match pool_status_watcher {
                                Some(ref watcher) => {
                                    match watcher.get_pool_status().await {
                                        Ok(status) => Some(status),
                                        Err(e) => {
                                            error!(target: LOG_TARGET, "Error fetching pool status: {}", e);
                                            None
                                        }
                                    }
                                },
                                None => None,
                            };
                        
                            info!(target: LOG_TARGET, "Current pool status: {:?}", last_pool_status);
                        
                        }
                        _ = gpu_status_receiver.changed() => {
                            let gpu_status = gpu_status_receiver.borrow().clone();

                            let gpu_status = match gpu_status {
                                Some(gpu_raw_status) => {

                                    GpuMinerStatus {
                                        estimated_earnings: 0,
                                        ..gpu_raw_status
                                    }
                                }
                                None => {
                                    warn!(target: LOG_TARGET, "Failed to get gpu miner status");
                                    GpuMinerStatus::default()
                                }
                            };

                            let _result = gpu_status_sender.send(Some(gpu_status));
                        },
                        _ = shutdown_signal.wait() => {
                            break;
                        },
                        _ = pool_shutdown_signal.wait() => {
                            info!(target: LOG_TARGET, "Pool status watcher shutdown signal received, stopping updates");
                            break;
                        }
                    }
                }
            });

        *status_updates_thread_guard = Some(status_updates_thread);

        Ok(())
    }
}
