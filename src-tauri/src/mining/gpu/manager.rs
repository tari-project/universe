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
use std::{collections::HashMap, sync::LazyLock};
use tari_shutdown::Shutdown;
use tauri::{AppHandle, Manager};
use tauri_plugin_sentry::sentry;

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
        pools::{gpu_pools::GpuPool, PoolOrigin},
        trait_config::ConfigImpl,
    },
    events_emitter::EventsEmitter,
    internal_wallet::InternalWallet,
    mining::{
        gpu::{
            consts::{EngineType, GpuMiner, GpuMinerStatus, GpuMinerType, MINERS_PRIORITY},
            interface::{GpuMinerInterface, GpuMinerInterfaceTrait},
            miners::{glytex::GlytexGpuMiner, graxil::GraxilGpuMiner, lolminer::LolMinerGpuMiner},
        },
        pools::{gpu_pool_manager::GpuPoolManager, PoolManagerInterfaceTrait},
        GpuConnectionType, MinerControlsState,
    },
    node::node_adapter::BaseNodeStatus,
    process_adapter::ProcessAdapter,
    process_watcher::{ProcessWatcher, ProcessWatcherStats},
    systemtray_manager::{SystemTrayEvents, SystemTrayManager},
    tasks_tracker::TasksTrackers,
    utils::math_utils::estimate_earning,
    UniverseAppState,
};

static LOG_TARGET: &str = "tari::mining::gpu::manager";
static INSTANCE: LazyLock<RwLock<GpuManager>> = LazyLock::new(|| RwLock::new(GpuManager::new()));

pub struct GpuManager {
    app_handle: Option<AppHandle>,
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
            app_handle: None,
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

    pub async fn read() -> tokio::sync::RwLockReadGuard<'static, GpuManager> {
        INSTANCE.read().await
    }

    pub async fn write() -> tokio::sync::RwLockWriteGuard<'static, GpuManager> {
        INSTANCE.write().await
    }

    pub async fn load_app_handle(&mut self, app_handle: AppHandle) {
        self.app_handle = Some(app_handle);
    }

    pub fn get_raw_graxil_miner(&self) -> Result<GraxilGpuMiner, anyhow::Error> {
        if self.available_miners.contains_key(&GpuMinerType::Graxil) {
            Ok(GraxilGpuMiner::new(
                self.gpu_internal_status_channel.clone(),
            ))
        } else {
            Err(anyhow::anyhow!("Graxil miner is not available"))
        }
    }

    pub async fn initialize(
        process_stats_collector: Sender<ProcessWatcherStats>,
        status_channel: Sender<GpuMinerStatus>,
        node_status_channel: Option<Receiver<BaseNodeStatus>>,
    ) {
        let selected_engine = ConfigMining::content().await.gpu_engine().clone();
        let mut instance = INSTANCE.write().await;

        instance.process_stats_collector = process_stats_collector;
        instance.gpu_external_status_channel = status_channel;
        instance.node_status_channel = node_status_channel;
        instance.selected_engine = Some(selected_engine);
    }

    // Loads the saved miner from config or the first available one
    pub async fn load_saved_miner(&mut self) -> Result<(), anyhow::Error> {
        let mut selected_gpu_miner_type = ConfigMining::content().await.gpu_miner_type().clone();

        if self.available_miners.contains_key(&selected_gpu_miner_type) {
            info!(target: LOG_TARGET, "Loaded saved gpu miner: {selected_gpu_miner_type}");
        } else if !self.available_miners.is_empty() {
            if let Some(fallback_miner_type) = MINERS_PRIORITY.iter().find(|miner_type| {
                matches!(self.available_miners.get(miner_type), Some(m) if m.is_healthy)
            }) {
                selected_gpu_miner_type = fallback_miner_type.clone();
            }
        } else {
            return Err(anyhow::anyhow!("No available gpu miners to load"));
        }

        self.switch_miner(selected_gpu_miner_type).await?;

        Ok(())
    }

    pub async fn load_miner(
        &mut self,
        miner: GpuMinerType,
        is_healthy: bool,
        last_error: Option<String>,
    ) {
        let miner = GpuMiner::new(miner, is_healthy, last_error);
        self.available_miners
            .insert(miner.miner_type.clone(), miner);
    }

    /// Handles loading the pool connection for the selected miner.
    /// If the selected miner does not support pool mining, it attempts to switch to a fallback miner that does.
    /// If no suitable miner is found, an error is returned.
    async fn handle_pool_connection_load(&mut self) -> Result<(), anyhow::Error> {
        let current_pool_data = ConfigPools::content().await.current_gpu_pool().clone();
        if self.selected_miner.is_pool_mining_supported()
            && self
                .selected_miner
                .is_pool_supported(&current_pool_data.pool_type)
        {
            self.process_watcher
                .adapter
                .load_connection_type(GpuConnectionType::Pool {
                    pool_url: current_pool_data.pool_url,
                })
                .await?;
        } else {
            // check if there is other minre that supports pool mining and switch to it if yes and then load pool connection to adapter
            let fallback_miner = MINERS_PRIORITY
                .iter()
                .find(|miner_type| {
                    let is_healthy = self
                        .available_miners
                        .get(miner_type)
                        .map(|m| m.is_healthy)
                        .unwrap_or(false);

                    is_healthy
                        && *miner_type != &self.selected_miner
                        && miner_type.is_pool_mining_supported()
                        && miner_type.is_pool_supported(&current_pool_data.pool_type)
                })
                .cloned();

            if let Some(fallback_miner) = fallback_miner {
                info!(target: LOG_TARGET, "Selected gpu miner does not support pool mining, switching to fallback miner: {fallback_miner}");
                self.switch_miner(fallback_miner).await?;
                let current_pool_data = ConfigPools::content().await.current_gpu_pool().clone();

                self.process_watcher
                    .adapter
                    .load_connection_type(GpuConnectionType::Pool {
                        pool_url: current_pool_data.pool_url,
                    })
                    .await?;
            } else {
                return Err(anyhow::anyhow!("Selected gpu miner does not support pool mining and no other miners are available"));
            }
        }
        Ok(())
    }

    /// Handles loading the node connection for the selected miner.
    /// If the selected miner does not support solo mining, it attempts to switch to a fallback miner that does.
    /// If no suitable miner is found, an error is returned.
    async fn handle_node_connection_load(
        &mut self,
        grpc_node_address: String,
    ) -> Result<(), anyhow::Error> {
        if self.selected_miner.is_solo_mining_supported() {
            self.process_watcher
                .adapter
                .load_connection_type(GpuConnectionType::Node {
                    node_grpc_address: grpc_node_address,
                })
                .await?;
        } else {
            // check if there is other minre that supports solo mining and switch to it if yes and then load node connection to adapter
            let fallback_miner = MINERS_PRIORITY
                .iter()
                .find(|miner_type| {
                    let is_healthy = self
                        .available_miners
                        .get(miner_type)
                        .map(|m| m.is_healthy)
                        .unwrap_or(false);

                    is_healthy
                        && *miner_type != &self.selected_miner
                        && miner_type.is_solo_mining_supported()
                })
                .cloned();

            if let Some(fallback_miner) = fallback_miner {
                info!(target: LOG_TARGET, "Selected gpu miner does not support solo mining, switching to fallback miner: {fallback_miner}");
                self.switch_miner(fallback_miner).await?;
                self.process_watcher
                    .adapter
                    .load_connection_type(GpuConnectionType::Node {
                        node_grpc_address: grpc_node_address,
                    })
                    .await?;
            } else {
                return Err(anyhow::anyhow!("Selected gpu miner does not support solo mining and no other miners are available"));
            }
        }

        Ok(())
    }

    #[allow(clippy::too_many_arguments)]
    pub async fn start_mining(&mut self) -> Result<(), anyhow::Error> {
        info!(target: LOG_TARGET, "Starting gpu miner: {}", self.selected_miner);
        info!(target: LOG_TARGET, "Adapter miner type: {}", self.process_watcher.adapter.name());
        EventsEmitter::emit_update_gpu_miner_state(MinerControlsState::Initiated).await;

        match self.start_mining_inner().await {
            Ok(_) => {
                info!(target: LOG_TARGET, "Started gpu miner: {}", self.selected_miner);
                EventsEmitter::emit_update_gpu_miner_state(MinerControlsState::Started).await;
                SystemTrayManager::send_event(SystemTrayEvents::GpuMiningActivity(true)).await;
                Ok(())
            }
            Err(e) => {
                let err_msg = format!("Could not start GPU mining: {e}");
                error!(target: LOG_TARGET, "{err_msg}", );
                sentry::capture_message(&err_msg, sentry::Level::Error);

                EventsEmitter::emit_update_gpu_miner_state(MinerControlsState::Stopped).await;
                SystemTrayManager::send_event(SystemTrayEvents::GpuMiningActivity(false)).await;
                Err(anyhow::anyhow!("{err_msg}"))
            }
        }
    }

    async fn start_mining_inner(&mut self) -> Result<(), anyhow::Error> {
        let gpu_mining_enabled = *ConfigMining::content().await.gpu_mining_enabled();

        if !gpu_mining_enabled {
            info!(target: LOG_TARGET, "GPU mining is disabled, not starting GPU miner.");
            return Ok(());
        }

        if let Some(app_handle) = self.app_handle.clone() {
            let base_path = app_handle
                .path()
                .app_local_data_dir()
                .expect("Could not get data dir");
            let config_path = app_handle
                .path()
                .app_config_dir()
                .expect("Could not get config dir");
            let log_path = app_handle
                .path()
                .app_log_dir()
                .expect("Could not get log dir");

            let global_shutdown_signal =
                TasksTrackers::current().gpu_mining_phase.get_signal().await;
            self.status_thread_shutdown = Shutdown::new();
            let task_tracker = TasksTrackers::current()
                .gpu_mining_phase
                .get_task_tracker()
                .await;

            let tari_address = InternalWallet::tari_address().await;
            let gpu_usage_percentage = ConfigMining::content()
                .await
                .get_selected_gpu_usage_percentage();
            let selected_engine = ConfigMining::content().await.gpu_engine().clone();

            if *ConfigPools::content().await.gpu_pool_enabled() {
                self.handle_pool_connection_load().await?;
            } else {
                let app_state = app_handle.state::<UniverseAppState>();
                let grpc_node_address = app_state.node_manager.get_grpc_address().await?;
                self.handle_node_connection_load(grpc_node_address).await?;
            }

            let binary = match self.selected_miner {
                GpuMinerType::Graxil => Binaries::GpuMinerSHA3X,
                GpuMinerType::LolMiner => Binaries::LolMiner,
                GpuMinerType::Glytex => Binaries::GpuMiner,
            };

            // Worker name format depends on the pool
            // LuckyPool: .Tari-Universe
            // Kryptex: /Tari-Universe
            // SupportXTM: Not specified so we use None
            let worker_name = match ConfigPools::content().await.current_gpu_pool().pool_origin {
                PoolOrigin::LuckyPool => Some(".Tari-universe"),
                PoolOrigin::SupportXTM => None,
                PoolOrigin::Kryptex => Some("/Tari-universe"),
            };

            let excluded_devices = ConfigMining::content().await.get_excluded_devices();

            self.process_watcher
                .adapter
                .load_tari_address(&tari_address.to_base58())
                .await?;
            self.process_watcher
                .adapter
                .load_worker_name(worker_name)
                .await?;
            self.process_watcher
                .adapter
                .load_intensity_percentage(gpu_usage_percentage)
                .await?;
            self.process_watcher
                .adapter
                .load_gpu_engine(selected_engine)
                .await?;
            self.process_watcher
                .adapter
                .load_excluded_devices(excluded_devices)
                .await?;

            self.process_watcher
                .start(
                    base_path,
                    config_path,
                    log_path,
                    binary,
                    global_shutdown_signal,
                    task_tracker,
                )
                .await?;

            if self.connection_type.is_pool() {
                GpuPoolManager::start_stats_watcher().await;
            }
            self.initialize_status_updates().await;
        } else {
            return Err(anyhow::anyhow!("App handle is not set"));
        }

        Ok(())
    }

    pub async fn stop_mining(&mut self) -> Result<(), anyhow::Error> {
        info!(target: LOG_TARGET, "Stopping gpu miner");
        {
            self.process_watcher.status_monitor = None;
            self.process_watcher.stop().await?;
            self.status_thread_shutdown.trigger();
            let _res = self
                .gpu_external_status_channel
                .send(GpuMinerStatus::default());
        }
        // Mark mining as stopped in pool manager
        // It will handle stopping the stats watcher after 1 hour of grace period
        GpuPoolManager::handle_mining_status_change(false).await;
        EventsEmitter::emit_update_gpu_miner_state(MinerControlsState::Stopped).await;
        SystemTrayManager::send_event(SystemTrayEvents::GpuMiningActivity(false)).await;
        info!(target: LOG_TARGET, "Stopped gpu miner");
        Ok(())
    }

    pub async fn switch_miner(&mut self, new_miner: GpuMinerType) -> Result<(), anyhow::Error> {
        info!(target: LOG_TARGET, "Switching gpu miner to: {new_miner}");
        if let Some(miner) = self.available_miners.get(&new_miner) {
            info!(target: LOG_TARGET, "Found selected gpu miner in available miners");
            let miner_type = miner.miner_type.clone();
            let mut adapter = self.resolve_miner_interface(&miner_type);
            adapter.detect_devices().await?;
            let miner_cloned = miner.clone();
            info!(target: LOG_TARGET, "Resolved selected gpu miner interface");
            self.selected_miner = miner_type.clone();
            self.process_watcher.adapter = adapter;
            info!(target: LOG_TARGET, "Set selected gpu miner interface in process watcher");
            EventsEmitter::emit_update_selected_gpu_miner(miner_cloned.miner_type).await;
            ConfigMining::update_field(ConfigMiningContent::set_gpu_miner_type, miner_type.clone())
                .await?;
            GpuPoolManager::handle_miner_switch(new_miner.clone()).await;
        } else {
            return Err(anyhow::anyhow!("Selected gpu miner is not available"));
        }
        info!(target: LOG_TARGET, "Switched gpu miner to: {new_miner}");
        Ok(())
    }

    /// Will need to mark current seleceted miner as unhealthy and switch to another one based on priority
    /// If no other miners are available, we will just mark the current one as unhealthy and emit the status
    pub async fn handle_unhealthy_miner(&mut self) -> Result<(), anyhow::Error> {
        info!(target: LOG_TARGET, "Handling unhealthy gpu miner");

        // mark current miner as unhealthy
        if let Some(current_miner) = self.available_miners.get_mut(&self.selected_miner) {
            current_miner.is_healthy = false;
            current_miner.last_error =
                Some("Miner process crashed or became unresponsive".to_string());
        }

        let fallback_miner = MINERS_PRIORITY
            .iter()
            .find(|miner_type| {
                let is_healthy = self
                    .available_miners
                    .get(miner_type)
                    .map(|m| m.is_healthy)
                    .unwrap_or(false);

                is_healthy && *miner_type != &self.selected_miner
            })
            .cloned();

        if let Some(fallback_miner) = fallback_miner {
            info!(target: LOG_TARGET, "Switching to fallback gpu miner: {fallback_miner}");
            self.switch_miner(fallback_miner).await?;
            self.start_mining().await?;
        } else {
            error!(target: LOG_TARGET, "No healthy gpu miners left to switch to");
            //TODO Probably we will need to handle it better in the future, app modules maybe need to know that no miners are healthy ?
        }

        EventsEmitter::emit_available_gpu_miners(self.available_miners.clone()).await;

        Ok(())
    }

    pub async fn is_current_miner_healthy(&self) -> bool {
        self.available_miners
            .get(&self.selected_miner)
            .map(|m| m.is_healthy)
            .unwrap_or(false)
    }

    /// Will need to mark current seleceted miner as healthy if it was unhealthy before
    /// If the miner was healthy before, we do nothing
    /// Mainly for cases when the miner was unhealthy and user want to try again and this time it works
    pub async fn handle_healthy_miner(&mut self) -> Result<(), anyhow::Error> {
        // mark current miner as healthy
        if let Some(current_miner) = self.available_miners.get_mut(&self.selected_miner) {
            if !current_miner.is_healthy {
                current_miner.is_healthy = true;
                current_miner.last_error = None;
            }
            EventsEmitter::emit_update_selected_gpu_miner(current_miner.miner_type.clone()).await;
        }

        EventsEmitter::emit_available_gpu_miners(self.available_miners.clone()).await;

        Ok(())
    }

    /// Should iterate over available miners and detect devices for each of them
    /// If at least one miner detects devices, we consider the detection successful
    ///  If detection fails for some of the miners we need to remove them from available miners
    /// If no miners are left, we return an error
    pub async fn detect_devices(&mut self) -> Result<(), anyhow::Error> {
        let mut successful_detection = false;
        let mut unhealthy_miners = vec![];

        for miner_type in self.available_miners.keys() {
            let mut adapter = self.resolve_miner_interface(miner_type);
            let detection_result = adapter.detect_devices().await;
            match detection_result {
                Ok(_) => {
                    successful_detection = true;
                    info!(target: LOG_TARGET, "Devices detected with miner: {miner_type}");
                }
                Err(e) => {
                    error!(target: LOG_TARGET, "Device detection failed for miner {miner_type}: {e}");
                    unhealthy_miners.push(miner_type.clone());
                }
            }
        }

        for miner_type in unhealthy_miners {
            if let Some(miner) = self.available_miners.get_mut(&miner_type) {
                miner.is_healthy = false;
                miner.last_error = Some("Device detection failed".to_string());
            }
            info!(target: LOG_TARGET, "Marked miner {miner_type} as unhealthy due to detection failure");
        }

        if !successful_detection {
            return Err(anyhow::anyhow!("No miners detected any devices"));
        }
        EventsEmitter::emit_available_gpu_miners(self.available_miners.clone()).await;

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
            GpuMinerType::Glytex => GpuMinerInterface::Glytex(GlytexGpuMiner::new(
                self.gpu_internal_status_channel.clone(),
            )),
        }
    }

    pub async fn initialize_status_updates(&mut self) {
        let mut gpu_internal_status_reciever = self.gpu_internal_status_channel.subscribe();
        let gpu_external_status_channel = self.gpu_external_status_channel.clone();
        let node_status_channel = self.node_status_channel.clone();
        let connection_type = self.connection_type.clone();

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
                        SystemTrayManager::send_event(SystemTrayEvents::GpuHashrate(0.0)).await;
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

                            info!(target: LOG_TARGET, "Gpu hashrate: {}", paresd_status.hash_rate);
                            SystemTrayManager::send_event(SystemTrayEvents::GpuHashrate(paresd_status.hash_rate)).await;
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
