// Copyright 2025. The Tari Project
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

use log::{error, info, warn};
use std::{path::PathBuf, sync::Arc, time::Duration};
use tari_common_types::tari_address::TariAddress;
use tari_shutdown::Shutdown;
use tokio::{
    select,
    sync::{watch::Sender, RwLock},
    time::interval,
};

use crate::{
    binaries::Binaries,
    configs::{config_pools::ConfigPools, pools::gpu_pools::GpuPool, trait_config::ConfigImpl},
    gpu_miner_sha_adapter::GpuMinerShaAdapter,
    pool_status_watcher::{LuckyPoolAdapter, PoolApiAdapters, SupportXmrPoolAdapter},
    process_watcher::ProcessWatcher,
    tasks_tracker::TasksTrackers,
    EventsEmitter, GpuMinerStatus, PoolStatusWatcher, ProcessStatsCollectorBuilder,
};

const LOG_TARGET: &str = "tari::universe::gpu_miner_sha";

pub struct GpuMinerSha {
    watcher: Arc<RwLock<ProcessWatcher<GpuMinerShaAdapter>>>,
    status_sender: Sender<GpuMinerStatus>,
    status_updates_thread: RwLock<Option<tokio::task::JoinHandle<()>>>,
    status_updates_shutdown: Shutdown,
    pool_status_watcher: Option<PoolStatusWatcher<PoolApiAdapters>>,
    pub pool_status_shutdown_signal: Shutdown,
}

impl GpuMinerSha {
    pub fn new(
        stats_collector: &mut ProcessStatsCollectorBuilder,
        status_sender: Sender<GpuMinerStatus>,
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
            status_updates_shutdown: Shutdown::new(),
            pool_status_watcher: None,
            pool_status_shutdown_signal: Shutdown::new(),
        }
    }

    pub async fn start(
        &mut self,
        tari_address: TariAddress,
        telemetry_id: String,
        gpu_usage_percentage: u32,
        base_path: PathBuf,
        config_path: PathBuf,
        log_path: PathBuf,
    ) -> Result<(), anyhow::Error> {
        self.pool_status_shutdown_signal = Shutdown::new();
        let shutdown_signal = TasksTrackers::current().hardware_phase.get_signal().await;
        let task_tracker = TasksTrackers::current()
            .hardware_phase
            .get_task_tracker()
            .await;

        let mut process_watcher = self.watcher.write().await;

        let pools_config = ConfigPools::content().await;
        if *pools_config.gpu_pool_enabled() {
            match pools_config.selected_gpu_pool() {
                GpuPool::LuckyPool(lucky_pool_config) => {
                    process_watcher.adapter.pool_url = Some(lucky_pool_config.get_pool_url());
                    self.pool_status_watcher = Some(PoolStatusWatcher::new(
                        lucky_pool_config.get_stats_url(tari_address.to_base58().as_str()),
                        PoolApiAdapters::LuckyPool(LuckyPoolAdapter {}),
                    ));
                }
                GpuPool::SupportXTMPool(support_xtm_pool_config) => {
                    process_watcher.adapter.pool_url = Some(support_xtm_pool_config.get_pool_url());
                    self.pool_status_watcher = Some(PoolStatusWatcher::new(
                        support_xtm_pool_config.get_stats_url(tari_address.to_base58().as_str()),
                        PoolApiAdapters::SupportXmrPool(SupportXmrPoolAdapter {}),
                    ));
                }
            }
        }

        process_watcher.adapter.tari_address = Some(tari_address);
        process_watcher.adapter.worker_name = Some(telemetry_id.to_string());
        process_watcher.adapter.batch_size = None; // Its better to allow miner to calculate batch size dynamically
        process_watcher.adapter.intensity = Some(gpu_usage_percentage);
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

    pub async fn stop(&mut self) -> Result<(), anyhow::Error> {
        info!(target: LOG_TARGET, "Stopping sha miner");
        {
            let mut process_watcher = self.watcher.write().await;
            process_watcher.status_monitor = None;
            process_watcher.stop().await?;
            let _res = self.status_sender.send(GpuMinerStatus::default());
        }
        self.stop_status_updates().await?;
        info!(target: LOG_TARGET, "graxil stopped");
        Ok(())
    }

    pub async fn stop_status_updates(&mut self) -> Result<(), anyhow::Error> {
        info!(target: LOG_TARGET, "Stopping status updates");
        let mut status_updates_thread_guard = self.status_updates_thread.write().await;
        if let Some(status_updates_thread) = status_updates_thread_guard.take() {
            info!(target: LOG_TARGET, "Aborting status updates thread");
            status_updates_thread.abort();
            self.status_updates_shutdown.trigger();
        }
        Ok(())
    }

    pub async fn initialize_status_updates(&self) -> Result<(), anyhow::Error> {
        let mut status_updates_thread_guard = self.status_updates_thread.write().await;
        if status_updates_thread_guard.is_some() {
            warn!(target: LOG_TARGET, "Status updates thread is already running");
            return Ok(());
        }

        let pool_status_watcher = self.pool_status_watcher.clone();
        let mut pool_status_check = interval(Duration::from_secs(60));
        pool_status_check.set_missed_tick_behavior(tokio::time::MissedTickBehavior::Skip);
        let mut pool_shutdown_signal = self.pool_status_shutdown_signal.to_signal();

        let mut shutdown_signal = TasksTrackers::current().hardware_phase.get_signal().await;
        let mut status_updates_signal = self.status_updates_shutdown.to_signal();

        let status_updates_thread = TasksTrackers::current()
            .hardware_phase
            .get_task_tracker()
            .await
            .spawn(async move {
                loop {
                    info!(target: LOG_TARGET, "Checking pool status");
                    select! {
                        _ = pool_status_check.tick() => {
                            let last_pool_status = match pool_status_watcher {
                                Some(ref watcher) => {
                                    match watcher.get_pool_status().await {
                                        Ok(status) => Some(status),
                                        Err(e) => {
                                            error!(target: LOG_TARGET, "Error fetching pool status: {e}" );
                                            None
                                        }
                                    }
                                },
                                None => None,
                            };
                            info!(target: LOG_TARGET, "Pool status update: {last_pool_status:?}");
                            EventsEmitter::emit_gpu_pool_status_update(last_pool_status.clone()).await;
                        }
                        _ = status_updates_signal.wait() => {
                            info!(target: LOG_TARGET, "Status updates shutdown signal received, stopping updates");
                            break;
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
