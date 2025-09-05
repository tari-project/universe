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

use log::info;
use std::{collections::HashMap, path::PathBuf, sync::LazyLock};

use tari_common_types::tari_address::TariAddress;
use tokio::sync::{
    watch::{Receiver, Sender},
    RwLock,
};

use crate::{
    binaries::Binaries,
    configs::{
        config_mining::ConfigMining,
        config_pools::ConfigPools,
        pools::{gpu_pools::GpuPool, PoolConfig},
        trait_config::ConfigImpl,
    },
    gpu_miner_adapter::GpuMinerStatus,
    mining::{
        gpu::{
            consts::{GpuConnectionType, GpuMiner, GpuMinerType},
            interface::{GpuMinerInterface, GpuMinerInterfaceTrait},
            miners::{graxil::GraxilGpuMiner, lolminer::LolMinerGpuMiner},
        },
        pools::{gpu_pool_manager::GpuPoolManager, PoolManagerInterfaceTrait},
    },
    node::node_adapter::BaseNodeStatus,
    process_watcher::{ProcessWatcher, ProcessWatcherStats},
    tasks_tracker::TasksTrackers,
};

static LOG_TARGET: &str = "tari::mining::gpu::manager";
static INSTANCE: LazyLock<RwLock<GpuManager>> = LazyLock::new(|| RwLock::new(GpuManager::new()));

pub struct GpuManager {
    // ======= Miner config =======
    selected_miner: GpuMinerType,
    available_miners: HashMap<GpuMinerType, GpuMiner>,
    // ======= Process watcher =======
    process_watcher: ProcessWatcher<GpuMinerInterface>,
    // ======= Parameters tracking =======
    process_stats_collector: Sender<ProcessWatcherStats>,
    status_channel: Sender<GpuMinerStatus>,
    node_status_channel: Option<Receiver<BaseNodeStatus>>,
    // ======= Cached config =======
    #[allow(dead_code)]
    tari_address: Option<String>,
    #[allow(dead_code)]
    pool: Option<GpuPool>,
    #[allow(dead_code)]
    intensity_percentage: Option<u32>,
    #[allow(dead_code)]
    worker_name: Option<String>,
}

impl GpuManager {
    pub fn new() -> Self {
        Self {
            // ======= Miner config =======
            selected_miner: GpuMinerType::LolMiner,
            available_miners: HashMap::new(),
            // ======= Process watcher =======
            process_watcher: ProcessWatcher::new(
                GpuMinerInterface::LolMiner(LolMinerGpuMiner::default()),
                Sender::new(ProcessWatcherStats::default()),
            ),
            // ======= Parameters tracking =======
            process_stats_collector: Sender::new(ProcessWatcherStats::default()),
            status_channel: Sender::new(GpuMinerStatus::default()),
            node_status_channel: None,
            // ======= Cached config =======
            tari_address: None,
            pool: None,
            intensity_percentage: None,
            worker_name: None,
        }
    }

    pub async fn initialize(
        process_stats_collector: Sender<ProcessWatcherStats>,
        status_channel: Sender<GpuMinerStatus>,
        node_status_channel: Option<Receiver<BaseNodeStatus>>,
    ) {
        let config_gpu_miner_type = ConfigMining::content().await.gpu_miner_type().clone();
        let mut instance = INSTANCE.write().await;
        instance.selected_miner = config_gpu_miner_type;
        instance.process_stats_collector = process_stats_collector;
        instance.status_channel = status_channel;
        instance.node_status_channel = node_status_channel;
    }

    pub async fn load_miner(miner: GpuMinerType) {
        let miner = GpuMiner::new(miner);
        INSTANCE
            .write()
            .await
            .available_miners
            .insert(miner.miner_type.clone(), miner);
    }

    pub async fn start_mining(
        tari_address: TariAddress,
        telemetry_id: String,
        gpu_usage_percentage: u32,
        base_path: PathBuf,
        config_path: PathBuf,
        log_path: PathBuf,
        grpc_node_address: String,
    ) -> Result<(), anyhow::Error> {
        let mut instance = INSTANCE.write().await;
        info!(target: LOG_TARGET, "Starting gpu miner: {}", instance.selected_miner);
        let shutdown_signal = TasksTrackers::current().gpu_mining_phase.get_signal().await;
        let task_tracker = TasksTrackers::current()
            .gpu_mining_phase
            .get_task_tracker()
            .await;
        let binary = match instance.selected_miner {
            GpuMinerType::Graxil => Binaries::GpuMinerSHA3X,
            GpuMinerType::LolMiner => Binaries::LolMiner,
            GpuMinerType::Glytex => Binaries::GpuMiner,
        };

        if *ConfigPools::content().await.gpu_pool_enabled()
            && instance.selected_miner.is_pool_mining_supported()
        {
            let current_selected_pool = ConfigPools::content().await.selected_gpu_pool().clone();
            let current_selected_pool_url = current_selected_pool.get_pool_url();
            instance
                .process_watcher
                .adapter
                .load_connection_type(GpuConnectionType::Pool {
                    pool_url: current_selected_pool_url,
                })
                .await?;
        } else {
            instance
                .process_watcher
                .adapter
                .load_connection_type(GpuConnectionType::Node {
                    node_grpc_address: grpc_node_address,
                })
                .await?;
        }

        info!(target: LOG_TARGET, "Heeere 3");

        instance
            .process_watcher
            .adapter
            .load_tari_address(&tari_address.to_base58())
            .await?;
        instance
            .process_watcher
            .adapter
            .load_worker_name(&telemetry_id)
            .await?;
        instance
            .process_watcher
            .adapter
            .load_intensity_percentage(gpu_usage_percentage)
            .await?;

        instance
            .process_watcher
            .start(
                base_path,
                config_path,
                log_path,
                binary,
                shutdown_signal,
                task_tracker,
            )
            .await
    }

    pub async fn stop_mining() -> Result<(), anyhow::Error> {
        info!(target: LOG_TARGET, "Stopping gpu miner");
        {
            let mut instance = INSTANCE.write().await;
            instance.process_watcher.status_monitor = None;
            instance.process_watcher.stop().await?;
            let _res = instance.status_channel.send(GpuMinerStatus::default());
        }
        // Mark mining as stopped in pool manager
        // It will handle stopping the stats watcher after 1 hour of grace period
        GpuPoolManager::handle_mining_status_change(false).await;
        Ok(())
    }

    pub async fn switch_miner(new_miner: GpuMinerType) -> Result<(), anyhow::Error> {
        info!(target: LOG_TARGET, "Switching gpu miner to: {}", new_miner);
        if let Some(miner) = INSTANCE.read().await.available_miners.get(&new_miner) {
            let miner_type = miner.miner_type.clone();
            let adapter = {
                let instance = INSTANCE.read().await;
                instance.resolve_miner_interface(&miner_type)
            };
            let mut instance = INSTANCE.write().await;
            instance.selected_miner = miner_type;
            instance.process_watcher.adapter = adapter;
        } else {
            return Err(anyhow::anyhow!("Selected gpu miner is not available"));
        }
        Ok(())
    }

    fn resolve_miner_interface(&self, miner_type: &GpuMinerType) -> GpuMinerInterface {
        match miner_type {
            GpuMinerType::Graxil => {
                GpuMinerInterface::Graxil(GraxilGpuMiner::new(self.status_channel.clone()))
            }
            GpuMinerType::LolMiner => {
                GpuMinerInterface::LolMiner(LolMinerGpuMiner::new(self.status_channel.clone()))
            }
            GpuMinerType::Glytex => {
                GpuMinerInterface::LolMiner(LolMinerGpuMiner::new(self.status_channel.clone()))
            }
        }
    }

    #[allow(dead_code)]
    pub async fn handle_selected_miner_not_available() {
        todo!()
    }
    #[allow(dead_code)]
    pub fn handle_mining_address_change(_new_address: &str) {
        todo!()
    }
    #[allow(dead_code)]
    pub fn handle_mining_pool_change(_enabled: bool) {
        todo!()
    }
}
