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
    process_watcher::{ProcessWatcher, ProcessWatcherStats},
    systemtray_manager::{SystemTrayEvents, SystemTrayManager},
    tasks_tracker::TasksTrackers,
    utils::math_utils::estimate_earning,
    UniverseAppState,
};

static LOG_TARGET: &str = "tari::mining::cpu::manager";
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
        info!(target: LOG_TARGET, "Starting cpu miner");
        EventsEmitter::emit_update_cpu_miner_state(MinerControlsState::Initiated).await;
        match self.start_mining_inner().await {
            Ok(_) => {
                info!(target: LOG_TARGET, "Started cpu miner");
                EventsEmitter::emit_update_cpu_miner_state(MinerControlsState::Started).await;
                let _unused = SystemTrayManager::get_channel_sender()
                    .await
                    .send(Some(SystemTrayEvents::CpuMiningActivity(true)));
                Ok(())
            }
            Err(e) => {
                let err_msg = format!("Could not start CPU mining: {e}");
                error!(target: LOG_TARGET, "{err_msg}");
                sentry::capture_message(&err_msg, sentry::Level::Error);

                EventsEmitter::emit_update_cpu_miner_state(MinerControlsState::Stopped).await;
                let _unused = SystemTrayManager::get_channel_sender()
                    .await
                    .send(Some(SystemTrayEvents::CpuMiningActivity(false)));
                Err(anyhow::anyhow!(err_msg))
            }
        }
    }

    async fn start_mining_inner(&mut self) -> Result<(), anyhow::Error> {
        let cpu_mining_enabled = *ConfigMining::content().await.cpu_mining_enabled();

        if !cpu_mining_enabled {
            return Err(anyhow::anyhow!("CPU mining is disabled"));
        }

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

            self.process_watcher.adapter.cpu_threads =
                Some(Self::determine_number_of_cores_to_use().await);

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

    async fn determine_number_of_cores_to_use() -> u32 {
        let cpu_usage_percentage = ConfigMining::content()
            .await
            .get_selected_cpu_usage_percentage();

        let max_cpu_available = thread::available_parallelism();
        let max_cpu_available = match max_cpu_available {
            Ok(available_cpus) => {
                info!(target:LOG_TARGET, "Available CPU cores: {available_cpus}");
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

        info!(target: LOG_TARGET, "Using {cpu_cores_to_use} CPU cores for mining");

        cpu_cores_to_use
    }

    pub async fn stop_mining(&mut self) -> Result<(), anyhow::Error> {
        info!(target: LOG_TARGET, "Stopping cpu miner");
        {
            self.process_watcher.status_monitor = None;
            self.process_watcher.stop().await?;
            self.status_thread_shutdown.trigger();
            let _res = self
                .cpu_external_status_channel
                .send(CpuMinerStatus::default());
        }
        // Mark mining as stopped in pool manager
        // It will handle stopping the stats watcher after 1 hour of grace period
        CpuPoolManager::handle_mining_status_change(false).await;
        EventsEmitter::emit_update_cpu_miner_state(MinerControlsState::Stopped).await;
        let _unused = SystemTrayManager::get_channel_sender()
            .await
            .send(Some(SystemTrayEvents::CpuMiningActivity(false)));
        info!(target: LOG_TARGET, "Stopped cpu miner");
        Ok(())
    }

    pub async fn initialize_status_updates(&mut self) {
        let mut cpu_internal_status_reciever = self.cpu_internal_status_channel.subscribe();
        let cpu_external_status_channel = self.cpu_external_status_channel.clone();
        let node_status_channel = self.node_status_channel.clone();
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
                        info!(target: LOG_TARGET, "Shutting down cpu miner status updates");
                        EventsEmitter::emit_cpu_mining_update(CpuMinerStatus::default()).await;
                        let _unused = SystemTrayManager::get_channel_sender().await.send(Some(SystemTrayEvents::CpuHashrate(0.0)));
                        break;
                    },
                    _ = global_shutdown_signal.wait() => {
                        info!(target: LOG_TARGET, "Shutting down cpu miner status updates");
                        break;
                    },
                    updated_status = cpu_internal_status_reciever.changed() => {
                        info!(target: LOG_TARGET, "Received cpu miner status update");
                        if updated_status.is_ok() {
                            let status = cpu_internal_status_reciever.borrow().clone();
                            let paresd_status = match connection_type {
                                CpuConnectionType::LocalMMProxy { .. } => Self::handle_local_mm_proxy_connection_type_status_change(status.clone(), node_status_channel.clone()).await,
                                CpuConnectionType::Pool { .. } => Self::handle_pool_connection_type_status_change(status.clone()).await,
                            };
                            let _res = cpu_external_status_channel.send(paresd_status.clone());
                            EventsEmitter::emit_cpu_mining_update(paresd_status.clone()).await;

                            let _unused = SystemTrayManager::get_channel_sender().await.send(Some(SystemTrayEvents::CpuHashrate(paresd_status.hash_rate)));
                        } else {
                            break;
                        }
                    }
                }
            }
        });
    }

    async fn handle_local_mm_proxy_connection_type_status_change(
        gpu_status: CpuMinerStatus,
        node_status_reciever: Option<Receiver<BaseNodeStatus>>,
    ) -> CpuMinerStatus {
        if let Some(node_status_reciever) = node_status_reciever {
            let node_status = node_status_reciever.borrow();
            let estimated_earnings = estimate_earning(
                node_status.monero_randomx_network_hashrate,
                gpu_status.hash_rate,
                node_status.block_reward,
            );

            CpuMinerStatus {
                estimated_earnings,
                ..gpu_status
            }
        } else {
            gpu_status
        }
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
