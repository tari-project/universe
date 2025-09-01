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

use log::info;
use std::{path::PathBuf, sync::Arc, time::Duration};
use tari_common_types::tari_address::TariAddress;
use tokio::sync::{watch::Sender, RwLock};

use crate::{
    binaries::Binaries,
    configs::{config_pools::ConfigPools, pools::gpu_pools::GpuPool, trait_config::ConfigImpl},
    gpu_miner_sha_adapter::GpuMinerShaAdapter,
    mining::pools::{gpu_pool_manager::GpuPoolManager, PoolManagerInterfaceTrait},
    process_watcher::ProcessWatcher,
    tasks_tracker::TasksTrackers,
    GpuMinerStatus, ProcessStatsCollectorBuilder,
};

const LOG_TARGET: &str = "tari::universe::gpu_miner_sha";

pub struct GpuMinerSha {
    watcher: Arc<RwLock<ProcessWatcher<GpuMinerShaAdapter>>>,
    status_sender: Sender<GpuMinerStatus>,
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
        let shutdown_signal = TasksTrackers::current().gpu_mining_phase.get_signal().await;
        let task_tracker = TasksTrackers::current()
            .gpu_mining_phase
            .get_task_tracker()
            .await;

        let mut process_watcher = self.watcher.write().await;

        let pools_config = ConfigPools::content().await;
        if *pools_config.gpu_pool_enabled() {
            match pools_config.selected_gpu_pool() {
                GpuPool::LuckyPool(lucky_pool_config) => {
                    process_watcher.adapter.pool_url = Some(lucky_pool_config.get_pool_url());
                }
                GpuPool::SupportXTMPool(support_xtm_pool_config) => {
                    process_watcher.adapter.pool_url = Some(support_xtm_pool_config.get_pool_url());
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

        GpuPoolManager::start_stats_watcher().await;

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
        // Mark mining as stopped in pool manager
        // It will handle stopping the stats watcher after 1 hour of grace period
        GpuPoolManager::handle_mining_status_change(false).await;
        info!(target: LOG_TARGET, "graxil stopped");
        Ok(())
    }
}
