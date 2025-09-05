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

use log::{error, info};
use std::{
    collections::HashMap,
    path::PathBuf,
    sync::{Arc, LazyLock},
};
use tari_shutdown::Shutdown;

use tari_common_types::tari_address::TariAddress;
use tokio::{
    select,
    sync::{
        watch::{Receiver, Sender},
        RwLock,
    },
};

use crate::{
    binaries::Binaries,
    configs::{
        config_mining::{ConfigMining, ConfigMiningContent},
        config_pools::ConfigPools,
        pools::{gpu_pools::GpuPool, PoolConfig},
        trait_config::ConfigImpl,
    },
    events_emitter::EventsEmitter,
    mining::{
        gpu::{
            consts::{EngineType, GpuConnectionType, GpuMiner, GpuMinerStatus, GpuMinerType},
            interface::{GpuMinerInterface, GpuMinerInterfaceTrait},
            miners::{graxil::GraxilGpuMiner, lolminer::LolMinerGpuMiner},
        },
        pools::{gpu_pool_manager::GpuPoolManager, PoolManagerInterfaceTrait},
    },
    node::node_adapter::BaseNodeStatus,
    process_watcher::{ProcessWatcher, ProcessWatcherStats},
    systemtray_manager::{SystemTrayGpuData, SystemTrayManager},
    tasks_tracker::TasksTrackers,
    utils::{locks_utils::try_write_with_retry, math_utils::estimate_earning},
};

static LOG_TARGET: &str = "tari::mining::gpu::manager";
static INSTANCE: LazyLock<RwLock<GpuManager>> = LazyLock::new(|| RwLock::new(GpuManager::new()));

pub struct GpuManager {
    systray_manager: Option<Arc<RwLock<SystemTrayManager>>>,
    // ======= Miner config =======
    selected_miner: GpuMinerType,
    available_miners: HashMap<GpuMinerType, GpuMiner>,
    // ======= Process watcher =======
    process_watcher: ProcessWatcher<GpuMinerInterface>,
    // ======= Parameters tracking =======
    status_thread_shutdown: Shutdown,
    process_stats_collector: Sender<ProcessWatcherStats>,
    gpu_internal_status_channel: Sender<GpuMinerStatus>,
    gpu_external_status_channel: Sender<GpuMinerStatus>,
    node_status_channel: Option<Receiver<BaseNodeStatus>>, // Optional, only if connected to a node
    // ======= Cached config =======
    connection_type: GpuConnectionType,
    #[allow(dead_code)]
    tari_address: Option<String>,
    #[allow(dead_code)]
    pool: Option<GpuPool>,
    #[allow(dead_code)]
    intensity_percentage: Option<u32>,
    #[allow(dead_code)]
    worker_name: Option<String>,
    #[allow(dead_code)]
    selected_engine: Option<EngineType>,
}

impl GpuManager {
    pub fn new() -> Self {
        Self {
            systray_manager: None,
            // ======= Miner config =======
            selected_miner: GpuMinerType::LolMiner,
            available_miners: HashMap::new(),
            // ======= Process watcher =======
            process_watcher: ProcessWatcher::new(
                GpuMinerInterface::LolMiner(LolMinerGpuMiner::default()),
                Sender::new(ProcessWatcherStats::default()),
            ),
            // ======= Parameters tracking =======
            status_thread_shutdown: Shutdown::new(),
            process_stats_collector: Sender::new(ProcessWatcherStats::default()),
            gpu_external_status_channel: Sender::new(GpuMinerStatus::default()),
            gpu_internal_status_channel: Sender::new(GpuMinerStatus::default()),
            node_status_channel: None,
            // ======= Cached config =======
            connection_type: GpuConnectionType::default(),
            tari_address: None,
            pool: None,
            intensity_percentage: None,
            worker_name: None,
            selected_engine: None,
        }
    }

    pub async fn initialize(
        process_stats_collector: Sender<ProcessWatcherStats>,
        status_channel: Sender<GpuMinerStatus>,
        node_status_channel: Option<Receiver<BaseNodeStatus>>,
        systray_manager: Option<Arc<RwLock<SystemTrayManager>>>,
    ) {
        let selected_engine = ConfigMining::content().await.gpu_engine().clone();
        let mut instance = INSTANCE.write().await;

        instance.process_stats_collector = process_stats_collector;
        instance.gpu_external_status_channel = status_channel;
        instance.node_status_channel = node_status_channel;
        instance.systray_manager = systray_manager;
        instance.selected_engine = Some(selected_engine);
    }

    // Loads the saved miner from config or the first available one
    pub async fn load_saved_miner() {
        let config_gpu_miner_type = ConfigMining::content().await.gpu_miner_type().clone();
        let mut instance = INSTANCE.write().await;

        if instance
            .available_miners
            .contains_key(&config_gpu_miner_type)
        {
            info!(target: LOG_TARGET, "Loaded saved gpu miner: {config_gpu_miner_type}");
            let adapter = instance.resolve_miner_interface(&config_gpu_miner_type);
            instance.process_watcher.adapter = adapter;
            instance.selected_miner = config_gpu_miner_type;
        } else if let Some((first_miner_type, _)) = instance.available_miners.iter().next() {
            info!(target: LOG_TARGET, "Saved gpu miner {config_gpu_miner_type} is not available, loaded first available miner: {first_miner_type}");
            let _unused = ConfigMining::update_field(
                ConfigMiningContent::set_gpu_miner_type,
                first_miner_type.clone(),
            )
            .await;
            let adapter = instance.resolve_miner_interface(first_miner_type);
            instance.selected_miner = first_miner_type.clone();
            instance.process_watcher.adapter = adapter;
        }
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
        selected_engine: EngineType,
        base_path: PathBuf,
        config_path: PathBuf,
        log_path: PathBuf,
        grpc_node_address: String,
    ) -> Result<(), anyhow::Error> {
        let mut instance = INSTANCE.write().await;
        info!(target: LOG_TARGET, "Starting gpu miner: {}", instance.selected_miner);
        let global_shutdown_signal = TasksTrackers::current().gpu_mining_phase.get_signal().await;
        instance.status_thread_shutdown = Shutdown::new();
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
            .adapter
            .load_gpu_engine(selected_engine)
            .await?;

        instance
            .process_watcher
            .start(
                base_path,
                config_path,
                log_path,
                binary,
                global_shutdown_signal,
                task_tracker,
            )
            .await?;

        instance.initialize_status_updates().await;

        Ok(())
    }

    pub async fn stop_mining() -> Result<(), anyhow::Error> {
        info!(target: LOG_TARGET, "Stopping gpu miner");
        {
            let mut instance = INSTANCE.write().await;
            instance.process_watcher.status_monitor = None;
            instance.process_watcher.stop().await?;
            instance.status_thread_shutdown.trigger();
            let _res = instance
                .gpu_external_status_channel
                .send(GpuMinerStatus::default());
        }
        // Mark mining as stopped in pool manager
        // It will handle stopping the stats watcher after 1 hour of grace period
        GpuPoolManager::handle_mining_status_change(false).await;
        Ok(())
    }

    pub async fn switch_miner(new_miner: GpuMinerType) -> Result<(), anyhow::Error> {
        info!(target: LOG_TARGET, "Switching gpu miner to: {new_miner}");
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

    // Should iterate over available miners and detect devices for each of them
    // If at least one miner detects devices, we consider the detection successful
    // If detection fails for some of the miners we need to remove them from available miners
    // If no miners are left, we return an error
    pub async fn detect_devices() -> Result<(), anyhow::Error> {
        let mut instance = INSTANCE.write().await;
        let mut successful_detection = false;
        let mut miners_to_remove = vec![];

        for miner_type in instance.available_miners.keys() {
            let mut adapter = instance.resolve_miner_interface(miner_type);
            let detection_result = adapter.detect_devices().await;
            match detection_result {
                Ok(_) => {
                    successful_detection = true;
                    info!(target: LOG_TARGET, "Devices detected with miner: {miner_type}");
                }
                Err(e) => {
                    error!(target: LOG_TARGET, "Device detection failed for miner {miner_type}: {e}");
                    miners_to_remove.push(miner_type.clone());
                }
            }
        }

        for miner_type in miners_to_remove {
            instance.available_miners.remove(&miner_type);
            info!(target: LOG_TARGET, "Removed miner {miner_type} from available miners due to detection failure");
        }

        if !successful_detection {
            return Err(anyhow::anyhow!("No miners detected any devices"));
        }
        Ok(())
    }

    fn resolve_miner_interface(&self, miner_type: &GpuMinerType) -> GpuMinerInterface {
        match miner_type {
            GpuMinerType::Graxil => GpuMinerInterface::Graxil(GraxilGpuMiner::new(
                self.gpu_internal_status_channel.clone(),
            )),
            GpuMinerType::LolMiner => GpuMinerInterface::LolMiner(LolMinerGpuMiner::new(
                self.gpu_internal_status_channel.clone(),
            )),
            GpuMinerType::Glytex => GpuMinerInterface::LolMiner(LolMinerGpuMiner::new(
                self.gpu_internal_status_channel.clone(),
            )),
        }
    }

    pub async fn initialize_status_updates(&mut self) {
        let mut gpu_internal_status_reciever = self.gpu_internal_status_channel.subscribe();
        let gpu_external_status_channel = self.gpu_external_status_channel.clone();
        let node_status_channel = self.node_status_channel.clone();
        let connection_type = self.connection_type.clone();
        let systray_manager = self.systray_manager.clone();

        let mut internal_shutdown_signal = self.status_thread_shutdown.to_signal();
        let mut global_shutdown_signal =
            TasksTrackers::current().gpu_mining_phase.get_signal().await;
        let task_tracker = TasksTrackers::current()
            .gpu_mining_phase
            .get_task_tracker()
            .await;

        task_tracker.spawn(async move {
            loop {
                select! {
                    _ = internal_shutdown_signal.wait() => {
                        info!(target: LOG_TARGET, "Shutting down gpu miner status updates");
                        EventsEmitter::emit_gpu_mining_update(GpuMinerStatus::default()).await;
                        break;
                    },
                    _ = global_shutdown_signal.wait() => {
                        info!(target: LOG_TARGET, "Shutting down gpu miner status updates");
                        break;
                    },
                    updated_status = gpu_internal_status_reciever.changed() => {
                        if updated_status.is_ok() {
                            let status = gpu_internal_status_reciever.borrow().clone();
                            let paresd_status = match connection_type {
                                GpuConnectionType::Node { .. } => Self::handle_node_connection_type_status_change(status.clone(), node_status_channel.clone()).await,
                                GpuConnectionType::Pool { .. } => Self::handle_pool_connection_type_status_change(status.clone()).await,
                            };
                            let _res = gpu_external_status_channel.send(paresd_status.clone());
                            EventsEmitter::emit_gpu_mining_update(paresd_status.clone()).await;

                            if let Some(systray_manager) = systray_manager.clone() {
                                let gpu_systemtray_data = SystemTrayGpuData {
                                    gpu_hashrate: paresd_status.hash_rate,
                                    estimated_earning: paresd_status.estimated_earnings
                                };

                            match try_write_with_retry(&systray_manager, 6).await {
                                Ok(mut systemtray_manager) => {
                                        systemtray_manager.update_tray_with_gpu_data(gpu_systemtray_data);

                                },
                                Err(e) => {
                                    let err_msg = format!("Failed to acquire systemtray_manager write lock: {e}");
                                    error!(target: LOG_TARGET, "{err_msg}");
                                }
                            }
                            }
                        } else {
                            break;
                        }
                    }
                }
            }
        });
    }

    async fn handle_node_connection_type_status_change(
        gpu_status: GpuMinerStatus,
        node_status_reciever: Option<Receiver<BaseNodeStatus>>,
    ) -> GpuMinerStatus {
        if let Some(node_status_reciever) = node_status_reciever {
            let node_status = node_status_reciever.borrow();
            let estimated_earnings = estimate_earning(
                node_status.sha_network_hashrate,
                gpu_status.hash_rate,
                node_status.block_reward,
            );

            GpuMinerStatus {
                estimated_earnings,
                ..gpu_status
            }
        } else {
            gpu_status
        }
    }

    async fn handle_pool_connection_type_status_change(
        gpu_status: GpuMinerStatus,
    ) -> GpuMinerStatus {
        gpu_status
    }

    #[allow(dead_code)]
    pub async fn handle_engine_change(_new_engine: EngineType) -> Result<(), anyhow::Error> {
        todo!()
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
