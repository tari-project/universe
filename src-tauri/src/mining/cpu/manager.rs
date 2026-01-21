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

use std::{sync::LazyLock, thread};

use log::{error, info};
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
    configs::{
        config_mining::ConfigMining,
        config_pools::ConfigPools,
        config_wallet::ConfigWallet,
        pools::{cpu_pools::CpuPool, PoolOrigin},
        trait_config::ConfigImpl,
    },
    events_emitter::EventsEmitter,
    internal_wallet::InternalWallet,
    mining::{
        cpu::{miners::xmrig::XmrigAdapter, CpuMinerStatus},
        pools::{cpu_pool_manager::CpuPoolManager, PoolManagerInterfaceTrait},
        CpuConnectionType, MinerControlsState,
    },
    node::node_adapter::BaseNodeStatus,
    process_adapter::ProcessAdapter,
    process_watcher::{ProcessWatcher, ProcessWatcherStats},
    systemtray_manager::{SystemTrayEvents, SystemTrayManager},
    tasks_tracker::TasksTrackers,
    UniverseAppState, LOG_TARGET_APP_LOGIC, LOG_TARGET_STATUSES,
};

static INSTANCE: LazyLock<RwLock<CpuManager>> = LazyLock::new(|| RwLock::new(CpuManager::new()));

pub struct CpuManager {
    app_handle: Option<AppHandle>,
    // ======= Process watcher =======
    process_watcher: ProcessWatcher<XmrigAdapter>,
    // ======= Parameters tracking =======
    status_thread_shutdown: Shutdown,
    process_stats_collector: Sender<ProcessWatcherStats>,
    cpu_internal_status_channel: Sender<CpuMinerStatus>,
    cpu_external_status_channel: Sender<CpuMinerStatus>,
    node_status_channel: Option<Receiver<BaseNodeStatus>>, // Optional, only if connected to a node
    // ======= Cached config =======
    connection_type: CpuConnectionType,
    #[allow(dead_code)]
    tari_address: Option<String>,
    #[allow(dead_code)]
    pool: Option<CpuPool>,
    #[allow(dead_code)]
    intensity_percentage: Option<u32>,
}

impl CpuManager {
    pub fn new() -> Self {
        Self {
            app_handle: None,
            // ======= Process watcher =======
            process_watcher: ProcessWatcher::new(
                XmrigAdapter::new(Sender::new(CpuMinerStatus::default())),
                Sender::new(ProcessWatcherStats::default()),
            ),
            // ======= Parameters tracking =======
            status_thread_shutdown: Shutdown::new(),
            process_stats_collector: Sender::new(ProcessWatcherStats::default()),
            cpu_external_status_channel: Sender::new(CpuMinerStatus::default()),
            cpu_internal_status_channel: Sender::new(CpuMinerStatus::default()),
            node_status_channel: None,
            // ======= Cached config =======
            connection_type: CpuConnectionType::default(),
            tari_address: None,
            pool: None,
            intensity_percentage: None,
        }
    }

    #[allow(dead_code)]
    pub async fn read() -> tokio::sync::RwLockReadGuard<'static, CpuManager> {
        INSTANCE.read().await
    }

    pub async fn write() -> tokio::sync::RwLockWriteGuard<'static, CpuManager> {
        INSTANCE.write().await
    }

    pub async fn load_app_handle(&mut self, app_handle: AppHandle) {
        self.app_handle = Some(app_handle);
    }

    pub async fn initialize(
        process_stats_collector: Sender<ProcessWatcherStats>,
        status_channel: Sender<CpuMinerStatus>,
        node_status_channel: Option<Receiver<BaseNodeStatus>>,
    ) {
        let mut instance = INSTANCE.write().await;

        instance.process_stats_collector = process_stats_collector;
        instance.cpu_external_status_channel = status_channel;
        instance.node_status_channel = node_status_channel;

        instance.process_watcher.adapter.summary_broadcast =
            instance.cpu_internal_status_channel.clone();
    }
    pub async fn start_mining(&mut self) -> Result<(), anyhow::Error> {
        info!(target: LOG_TARGET_APP_LOGIC, "Starting cpu miner");
        match self.start_mining_inner().await {
            Ok(_) => {
                info!(target: LOG_TARGET_APP_LOGIC, "Started cpu miner");
                EventsEmitter::emit_update_cpu_miner_state(MinerControlsState::Started).await;
                SystemTrayManager::send_event(SystemTrayEvents::CpuMiningActivity(true)).await;
                Ok(())
            }
            Err(e) => {
                let err_msg = format!("Could not start CPU mining: {e}");
                error!(target: LOG_TARGET_APP_LOGIC, "{err_msg}");
                sentry::capture_message(&err_msg, sentry::Level::Error);

                EventsEmitter::emit_update_cpu_miner_state(MinerControlsState::Stopped).await;
                SystemTrayManager::send_event(SystemTrayEvents::CpuMiningActivity(false)).await;
                Err(anyhow::anyhow!(err_msg))
            }
        }
    }

    async fn start_mining_inner(&mut self) -> Result<(), anyhow::Error> {
        let cpu_mining_enabled = *ConfigMining::content().await.cpu_mining_enabled();

        if !cpu_mining_enabled {
            return Err(anyhow::anyhow!("CPU mining is disabled"));
        }

        if self.process_watcher.is_running() {
            info!(target: LOG_TARGET_APP_LOGIC, "CPU miner is already running");
            return Ok(());
        }

        EventsEmitter::emit_update_cpu_miner_state(MinerControlsState::Initiated).await;

        if let Some(app_handle) = &self.app_handle {
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
                TasksTrackers::current().cpu_mining_phase.get_signal().await;
            self.status_thread_shutdown = Shutdown::new();
            let task_tracker = TasksTrackers::current()
                .cpu_mining_phase
                .get_task_tracker()
                .await;

            let app_state = app_handle.state::<UniverseAppState>();
            let mmproxy_manager = &app_state.mm_proxy_manager;

            if *ConfigPools::content().await.cpu_pool_enabled() {
                let pool_url = ConfigPools::content()
                    .await
                    .current_cpu_pool()
                    .pool_url
                    .clone();
                let tari_address = InternalWallet::tari_address().await;

                // Worker name format depends on the pool
                // LuckyPool: .Tari-Universe
                // Kryptex: /Tari-Universe
                // SupportXTM: Not specified so we use None
                let worker_name = match ConfigPools::content().await.current_cpu_pool().pool_origin
                {
                    PoolOrigin::LuckyPool => Some(".Tari-universe"),
                    PoolOrigin::SupportXTM => None,
                    PoolOrigin::Kryptex => Some("/Tari-universe"),
                };

                self.process_watcher.adapter.connection_type = CpuConnectionType::Pool {
                    pool_url,
                    worker_name: worker_name.map(|s| s.to_string()),
                };
                self.process_watcher.adapter.address = tari_address.to_base58();
            } else {
                let host_name = "127.0.0.1".to_string();
                let mmproxy_port = mmproxy_manager.get_monero_port().await?;
                let local_proxy_url = format!("{host_name}:{mmproxy_port}");
                let monero_address = ConfigWallet::content().await.monero_address().clone();

                self.process_watcher.adapter.connection_type =
                    CpuConnectionType::LocalMMProxy { local_proxy_url };
                self.process_watcher.adapter.address = monero_address.to_string();
            }

            let binary = crate::binaries::Binaries::Xmrig;

            let cpu_usage_percentage = ConfigMining::content()
                .await
                .get_selected_cpu_usage_percentage();

            if cpu_usage_percentage <= 1 {
                self.process_watcher.adapter.cpu_threads =
                    Some(Self::determine_number_of_cores_to_use(10).await);

                self.process_watcher.adapter.extra_options =
                    vec!["--randomx-mode=light".to_string()]
            } else {
                self.process_watcher.adapter.cpu_threads =
                    Some(Self::determine_number_of_cores_to_use(cpu_usage_percentage).await);

                self.process_watcher.adapter.extra_options = vec!["--randomx-mode=fast".to_string()]
            }

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
                CpuPoolManager::start_stats_watcher().await;
            }

            self.initialize_status_updates().await;
        }

        Ok(())
    }

    pub fn is_running(&self) -> bool {
        self.process_watcher.is_running()
    }

    async fn determine_number_of_cores_to_use(cpu_usage_percentage: u32) -> u32 {
        let max_cpu_available = thread::available_parallelism();
        let max_cpu_available = match max_cpu_available {
            Ok(available_cpus) => {
                info!(target:LOG_TARGET_APP_LOGIC, "Available CPU cores: {available_cpus}");
                u32::try_from(available_cpus.get()).unwrap_or(1)
            }
            Err(err) => {
                error!("Available CPU cores: Unknown, error: {err}");
                1
            }
        };

        let cpu_cores_to_use = max_cpu_available
            .saturating_mul(cpu_usage_percentage)
            .saturating_div(100)
            .clamp(1, max_cpu_available);

        info!(target: LOG_TARGET_APP_LOGIC, "Using {cpu_cores_to_use} CPU cores for mining");

        cpu_cores_to_use
    }

    pub async fn stop_mining(&mut self) -> Result<(), anyhow::Error> {
        info!(target: LOG_TARGET_APP_LOGIC, "Stopping cpu miner");
        {
            self.process_watcher.status_monitor = None;
            self.process_watcher.stop().await?;
            self.status_thread_shutdown.trigger();
            let _res = self
                .cpu_external_status_channel
                .send(CpuMinerStatus::default());
        }
        info!(target: LOG_TARGET_APP_LOGIC, "Stopped cpu miner process");
        // Mark mining as stopped in pool manager
        // It will handle stopping the stats watcher after 1 hour of grace period
        CpuPoolManager::handle_mining_status_change(false).await;
        info!(target: LOG_TARGET_APP_LOGIC, "Marked mining as stopped in pool manager");
        EventsEmitter::emit_update_cpu_miner_state(MinerControlsState::Stopped).await;
        SystemTrayManager::send_event(SystemTrayEvents::CpuMiningActivity(false)).await;
        info!(target: LOG_TARGET_APP_LOGIC, "Stopped cpu miner");
        Ok(())
    }

    pub async fn on_app_exit(&self) {
        match self
            .process_watcher
            .adapter
            .ensure_no_hanging_processes_are_running()
            .await
        {
            Ok(_) => {
                info!(target: LOG_TARGET_APP_LOGIC, "CpuMiner processes cleaned up successfully on app exit");
            }
            Err(e) => {
                error!(target: LOG_TARGET_APP_LOGIC, "Failed to clean up CpuMiner processes on app exit: {}", e);
            }
        }
    }

    pub async fn initialize_status_updates(&mut self) {
        let mut cpu_internal_status_reciever = self.cpu_internal_status_channel.subscribe();
        let cpu_external_status_channel = self.cpu_external_status_channel.clone();
        let connection_type = self.connection_type.clone();

        let mut internal_shutdown_signal = self.status_thread_shutdown.to_signal();
        let mut global_shutdown_signal =
            TasksTrackers::current().cpu_mining_phase.get_signal().await;
        let task_tracker = TasksTrackers::current()
            .cpu_mining_phase
            .get_task_tracker()
            .await;

        task_tracker.spawn(async move {
            loop {
                select! {
                    _ = internal_shutdown_signal.wait() => {
                        info!(target: LOG_TARGET_STATUSES, "Shutting down cpu miner status updates");
                        EventsEmitter::emit_cpu_mining_update(CpuMinerStatus::default()).await;
                        SystemTrayManager::send_event(SystemTrayEvents::CpuHashrate(0.0)).await;
                        break;
                    },
                    _ = global_shutdown_signal.wait() => {
                        info!(target: LOG_TARGET_STATUSES, "Shutting down cpu miner status updates");
                        break;
                    },
                    updated_status = cpu_internal_status_reciever.changed() => {
                        info!(target: LOG_TARGET_STATUSES, "Received cpu miner status update");
                        if updated_status.is_ok() {
                            let status = cpu_internal_status_reciever.borrow().clone();
                            let paresd_status = match connection_type {
                                CpuConnectionType::LocalMMProxy { .. } => status.clone(),
                                CpuConnectionType::Pool { .. } => Self::handle_pool_connection_type_status_change(status.clone()).await,
                            };
                            let _res = cpu_external_status_channel.send(paresd_status.clone());
                            EventsEmitter::emit_cpu_mining_update(paresd_status.clone()).await;

                            SystemTrayManager::send_event(SystemTrayEvents::CpuHashrate(paresd_status.hash_rate)).await;
                        } else {
                            break;
                        }
                    }
                }
            }
        });
    }

    async fn handle_pool_connection_type_status_change(
        gpu_status: CpuMinerStatus,
    ) -> CpuMinerStatus {
        gpu_status
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
