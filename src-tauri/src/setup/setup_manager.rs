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

use super::listeners::listener_unlock_cpu_mining::ListenerUnlockCpuMining;
use super::listeners::listener_unlock_gpu_mining::ListenerUnlockGpuMining;
use super::listeners::listener_unlock_wallet::ListenerUnlockWallet;
use super::listeners::trait_listener::UnlockConditionsListenerTrait;
use super::listeners::{setup_listener, SetupFeature, SetupFeaturesList};
use super::trait_setup_phase::SetupPhaseImpl;
use super::utils::phase_builder::PhaseBuilder;
use crate::app_in_memory_config::{MinerType, DEFAULT_EXCHANGE_ID};
use crate::configs::config_core::ConfigCoreContent;
use crate::configs::config_database_listener::ConfigDatabaseListener;
use crate::configs::config_mining::ConfigMiningContent;
use crate::configs::config_pools::{ConfigPools, ConfigPoolsContent};
use crate::configs::config_ui::WalletUIMode;
use crate::configs::config_wallet::ConfigWalletContent;
use crate::event_scheduler::EventScheduler;
use crate::events::CriticalProblemPayload;
use crate::internal_wallet::InternalWallet;
use crate::mining::cpu::manager::CpuManager;
use crate::mining::gpu::consts::GpuMinerType;
use crate::mining::gpu::manager::GpuManager;
use crate::mining::pools::cpu_pool_manager::CpuPoolManager;
use crate::mining::pools::gpu_pool_manager::GpuPoolManager;
use crate::mining::pools::PoolManagerInterfaceTrait;
use crate::progress_trackers::progress_plans::SetupStep;
use crate::setup::{
    phase_core::CoreSetupPhase, phase_cpu_mining::CpuMiningSetupPhase,
    phase_gpu_mining::GpuMiningSetupPhase, phase_node::NodeSetupPhase,
    phase_wallet::WalletSetupPhase,
};
use crate::systemtray_manager::SystemTrayManager;
use crate::utils::platform_utils::PlatformUtils;
use crate::{
    configs::{
        config_core::ConfigCore, config_mining::ConfigMining, config_ui::ConfigUI,
        config_wallet::ConfigWallet, trait_config::ConfigImpl,
    },
    events_emitter::EventsEmitter,
    events_manager::EventsManager,
    tasks_tracker::TasksTrackers,
    utils::system_status::SystemStatus,
    websocket_manager::WebsocketMessage,
    UniverseAppState,
};
use log::{error, info};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::{
    fmt::{Display, Formatter},
    sync::LazyLock,
    time::Duration,
};
use tauri::{AppHandle, Listener, Manager};
use tokio::{
    select,
    sync::{watch::Sender, Mutex, RwLock},
};

static LOG_TARGET: &str = "tari::universe::setup_manager";

static INSTANCE: LazyLock<SetupManager> = LazyLock::new(SetupManager::new);

#[derive(Clone, Default)]
pub enum ExchangeModalStatus {
    #[default]
    None,
    WaitForCompletion,
    Completed,
}

impl Display for ExchangeModalStatus {
    fn fmt(&self, f: &mut Formatter<'_>) -> Result<(), std::fmt::Error> {
        match self {
            ExchangeModalStatus::None => write!(f, "None"),
            ExchangeModalStatus::WaitForCompletion => write!(f, "Wait For Completion"),
            ExchangeModalStatus::Completed => write!(f, "Completed"),
        }
    }
}

impl ExchangeModalStatus {
    #[allow(dead_code)]
    pub fn is_completed(&self) -> bool {
        matches!(self, ExchangeModalStatus::Completed) | matches!(self, ExchangeModalStatus::None)
    }
}

#[derive(Clone, PartialEq, Eq, Hash, Serialize, Deserialize, Debug)]
pub enum SetupPhase {
    Core,
    CpuMining,
    GpuMining,
    Wallet,
    Node,
}

impl Display for SetupPhase {
    fn fmt(&self, f: &mut Formatter<'_>) -> Result<(), std::fmt::Error> {
        match self {
            Self::Core => write!(f, "Core"),
            Self::CpuMining => write!(f, "CPU Mining"),
            Self::GpuMining => write!(f, "GPU Mining"),
            Self::Wallet => write!(f, "Wallet"),
            Self::Node => write!(f, "Node"),
        }
    }
}

impl SetupPhase {
    pub fn all() -> Vec<SetupPhase> {
        vec![
            Self::Core,
            Self::CpuMining,
            Self::GpuMining,
            Self::Node,
            Self::Wallet,
        ]
    }
    pub fn get_i18n_title_key(&self) -> String {
        match self {
            Self::Core => "setup-core".to_string(),
            Self::CpuMining => "setup-cpu-mining".to_string(),
            Self::GpuMining => "setup-gpu-mining".to_string(),
            Self::Node => "setup-node".to_string(),
            Self::Wallet => "setup-wallet".to_string(),
        }
    }
}

#[allow(dead_code)]
#[derive(Default)]
pub enum PhaseStatus {
    #[default]
    None,
    Initialized,
    AwaitingStart,
    InProgress,
    Cancelled,
    Failed(String),
    Success,
    SuccessWithWarnings(HashMap<SetupStep, String>),
}

impl Display for PhaseStatus {
    fn fmt(&self, f: &mut Formatter<'_>) -> Result<(), std::fmt::Error> {
        match self {
            PhaseStatus::None => write!(f, "None"),
            PhaseStatus::Initialized => write!(f, "Initialized"),
            PhaseStatus::AwaitingStart => write!(f, "Awaiting Start"),
            PhaseStatus::Cancelled => write!(f, "Cancelled"),
            PhaseStatus::InProgress => write!(f, "In Progress"),
            PhaseStatus::Success => write!(f, "Success"),
            PhaseStatus::SuccessWithWarnings(warnings) => {
                write!(f, "Success With Warnings: {warnings:?}")
            }
            PhaseStatus::Failed(reason) => write!(f, "Failed: {reason}",),
        }
    }
}

impl PhaseStatus {
    pub fn is_success(&self) -> bool {
        matches!(
            self,
            PhaseStatus::Success | PhaseStatus::SuccessWithWarnings(_)
        )
    }
    pub fn is_failed(&self) -> (bool, Option<String>) {
        match self {
            PhaseStatus::Failed(reason) => (true, Some(reason.clone())),
            _ => (false, None),
        }
    }
    pub fn is_restarting(&self) -> bool {
        matches!(self, PhaseStatus::None)
    }
}

#[derive(Default)]
pub struct SetupManager {
    pub features: RwLock<SetupFeaturesList>,
    core_phase_status: Sender<PhaseStatus>,
    cpu_mining_phase_status: Sender<PhaseStatus>,
    gpu_mining_phase_status: Sender<PhaseStatus>,
    node_phase_status: Sender<PhaseStatus>,
    wallet_phase_status: Sender<PhaseStatus>,
    exchange_modal_status: Sender<ExchangeModalStatus>,
    phases_to_restart_queue: Mutex<Vec<SetupPhase>>,
    app_handle: Mutex<Option<AppHandle>>,
    // Temporary to prevent multiple restarts within few seconds
    restart_safe_lock: Mutex<()>,
}

impl SetupManager {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn get_instance() -> &'static LazyLock<SetupManager> {
        &INSTANCE
    }

    pub async fn app_handle(&self) -> AppHandle {
        self.app_handle
            .lock()
            .await
            .clone()
            .expect("App handle is not initialized")
    }

    #[allow(clippy::too_many_lines)]
    async fn pre_setup(&self, app_handle: AppHandle) {
        info!(target: LOG_TARGET, "Pre Setup");
        let state = app_handle.state::<UniverseAppState>();
        let in_memory_config = state.in_memory_config.clone();

        let mut websocket_manager_write = state.websocket_manager.write().await;
        websocket_manager_write.set_app_handle(app_handle.clone());
        drop(websocket_manager_write);

        let webview = app_handle
            .get_webview_window("main")
            .expect("main window must exist");

        let mut websocket_events_manager_guard = state.websocket_event_manager.write().await;
        if let Err(e) = websocket_events_manager_guard
            .set_app_handle(app_handle.clone(), state.websocket_manager.clone())
            .await
        {
            error!(target: LOG_TARGET, "Failed to start websocket events manager: {e}");
        }

        drop(websocket_events_manager_guard);

        GpuManager::write()
            .await
            .load_app_handle(app_handle.clone())
            .await;
        CpuManager::write()
            .await
            .load_app_handle(app_handle.clone())
            .await;

        // Listen for websocket reconnection events to restart events manager
        let websocket_event_manager_clone = state.websocket_event_manager.clone();
        let websocket_manager_clone = state.websocket_manager.clone();
        let app_handle_clone = app_handle.clone();
        webview.listen("websocket-reconnected", move |_event| {
            let websocket_event_manager_clone = websocket_event_manager_clone.clone();
            let websocket_manager_clone = websocket_manager_clone.clone();
            let app_handle_clone = app_handle_clone.clone();

            tauri::async_runtime::spawn(async move {
                info!(target: LOG_TARGET, "Restarting websocket events manager after reconnection");
                let mut events_manager_guard = websocket_event_manager_clone.write().await;
                if let Err(e) = events_manager_guard
                    .set_app_handle(app_handle_clone, websocket_manager_clone)
                    .await
                {
                    error!(target: LOG_TARGET, "Failed to restart websocket events manager: {e}");
                } else {
                    info!(target: LOG_TARGET, "Websocket events manager restarted successfully");
                }
            });
        });
        let websocket_tx = state.websocket_message_tx.clone();
        webview.listen("ws-tx", move |event: tauri::Event| {
            let event_cloned = event.clone();
            let websocket_tx_clone = websocket_tx.clone();

            tauri::async_runtime::spawn(async move {
                let message = event_cloned.payload();
                if let Ok(message) = serde_json::from_str::<WebsocketMessage>(message)
                    .inspect_err(|e| error!("websocket malformatted: {e}"))
                {
                    if websocket_tx_clone
                        .send(message.clone())
                        .await
                        .inspect_err(|e| error!("too many messages in websocket send queue {e}"))
                        .is_ok()
                    {
                        log::trace!("websocket message sent {message:?}");
                    }
                }
            });
        });
        EventsManager::handle_node_type_update(&app_handle).await;

        ConfigCore::initialize(app_handle.clone()).await;
        ConfigWallet::initialize(app_handle.clone()).await;
        ConfigMining::initialize(app_handle.clone()).await;
        ConfigUI::initialize(app_handle.clone()).await;
        ConfigPools::initialize(app_handle.clone()).await;
        ConfigDatabaseListener::initialize(app_handle.clone()).await;

        // Initialize after configs are loaded as its reads mining mode from config
        SystemTrayManager::write()
            .await
            .initialize_tray(&app_handle)
            .await;

        let node_type = ConfigCore::content().await.node_type().clone();
        info!(target: LOG_TARGET, "Retrieved initial node type: {node_type:?}");
        state.node_manager.set_node_type(node_type).await;
        EventsManager::handle_node_type_update(&app_handle).await;

        let built_in_exchange_id = in_memory_config.read().await.exchange_id.clone();
        let is_on_exchange_miner_build =
            MinerType::from_str(&built_in_exchange_id).is_exchange_mode();
        let last_config_exchange_id = ConfigCore::content().await.exchange_id().clone();

        if is_on_exchange_miner_build {
            let _unused = ConfigCore::update_field(
                ConfigCoreContent::set_exchange_id,
                built_in_exchange_id.clone(),
            )
            .await;
        }

        let config_minig = ConfigMining::content().await.clone();
        if !*config_minig.is_lolminer_tested() {
            let _unused =
                ConfigMining::update_field(ConfigMiningContent::set_is_lolminer_tested, true).await;
            let _unused = ConfigMining::update_field(
                ConfigMiningContent::set_gpu_miner_type,
                GpuMinerType::LolMiner,
            )
            .await;
        }

        EventsEmitter::emit_core_config_loaded(&ConfigCore::content().await).await;
        EventsEmitter::emit_mining_config_loaded(&ConfigMining::content().await).await;
        EventsEmitter::emit_ui_config_loaded(&ConfigUI::content().await).await;
        EventsEmitter::emit_pools_config_loaded(&ConfigPools::content().await).await;

        let is_on_exchange_specific_variant = ConfigCore::content()
            .await
            .is_on_exchange_specific_variant();
        let is_external_address_selected = ConfigWallet::content()
            .await
            .selected_external_tari_address()
            .is_some();
        // Default app variant (when built-in exchange ID is DEFAULT_EXCHANGE_ID) can have either seedless wallet or standard wallet

        info!(target: LOG_TARGET, "Is on exchange miner build: {is_on_exchange_miner_build}");
        info!(target: LOG_TARGET, "Built-in exchange ID: {built_in_exchange_id}");
        info!(target: LOG_TARGET, "Last config exchange ID: {last_config_exchange_id}");
        info!(target: LOG_TARGET, "Is on exchange specific variant: {is_on_exchange_specific_variant}");
        info!(target: LOG_TARGET, "Is external address selected: {is_external_address_selected}");

        // If there is exchange id set in config_core that is different from DEFAULT_EXCHANGE_ID and external address is provided we want to display seedless wallet UI
        // This can happen when user was using dedicated exchange miner build before and now is using default app variant
        // Or user selected exchange on default app variant and reopened the app
        // In other cases we want to display standard wallet UI
        if built_in_exchange_id.eq(DEFAULT_EXCHANGE_ID) {
            if is_external_address_selected && is_on_exchange_specific_variant {
                let _unused = ConfigUI::set_wallet_ui_mode(WalletUIMode::Seedless).await;
                if let Err(e) = InternalWallet::initialize_seedless(&app_handle, None).await {
                    EventsEmitter::emit_critical_problem(CriticalProblemPayload {
                        title: Some("Wallet(Seedless) not initialized!".to_string()),
                        description: Some(
                            "Encountered an error while initializing the wallet.".to_string(),
                        ),
                        error_message: Some(e.to_string()),
                    })
                    .await;
                }
            } else {
                let _unused = ConfigUI::set_wallet_ui_mode(WalletUIMode::Standard).await;
                match InternalWallet::initialize_with_seed(&app_handle).await {
                    Ok(()) => {
                        if let Err(e) = ConfigWallet::migrate().await {
                            EventsEmitter::emit_critical_problem(CriticalProblemPayload {
                                title: Some("Wallet config migration failed!".to_string()),
                                description: Some(
                                    "Encountered an error while migrating the wallet.".to_string(),
                                ),
                                error_message: Some(e.to_string()),
                            })
                            .await
                        }
                    }
                    Err(e) => {
                        error!(target: LOG_TARGET, "Error loading internal wallet: {e:?}");
                        EventsEmitter::emit_critical_problem(CriticalProblemPayload {
                            title: Some("Wallet(seed) not initialized!".to_string()),
                            description: Some(
                                "Encountered an error while initializing the wallet.".to_string(),
                            ),
                            error_message: Some(e.to_string()),
                        })
                        .await;
                    }
                };
            }
        }

        // Case when we are on exchange miner build and already selected external tari address ( Second time we open app )
        if is_on_exchange_miner_build
            && is_external_address_selected
            && built_in_exchange_id.eq(&last_config_exchange_id)
        {
            let external_tari_address = ConfigWallet::content()
                .await
                .selected_external_tari_address()
                .clone();
            info!(target: LOG_TARGET, "External address selected on exchange miner build");
            let _unused = ConfigUI::set_wallet_ui_mode(WalletUIMode::Seedless).await;
            if let Err(e) =
                InternalWallet::initialize_seedless(&app_handle, external_tari_address).await
            {
                EventsEmitter::emit_critical_problem(CriticalProblemPayload {
                    title: Some("Wallet(Seedless) not initialized!".to_string()),
                    description: Some(
                        "Encountered an error while initializing the wallet.".to_string(),
                    ),
                    error_message: Some(e.to_string()),
                })
                .await;
            }
        }

        // Trigger it here so we can update UI when new wallet is created
        // We should probably change events to be loaded from internal wallet directly
        EventsEmitter::emit_wallet_config_loaded(&ConfigWallet::content().await).await;

        {
            let _unused = state
                .telemetry_manager
                .write()
                .await
                .initialize(app_handle.clone())
                .await;
            let mut telemetry_id = state
                .telemetry_manager
                .read()
                .await
                .get_unique_string()
                .await;
            if telemetry_id.is_empty() {
                telemetry_id = "unknown_miner_tari_universe".to_string();
            }
            let app_version = app_handle.package_info().version.clone();
            let _unused = state
                .telemetry_service
                .write()
                .await
                .init(app_version.to_string(), telemetry_id.clone())
                .await;
        }

        let _unused = PlatformUtils::initialize_preqesities().await;

        // If we open different specific exchange miner build then previous one we always want to prompt user to provide tari address
        if is_on_exchange_miner_build && built_in_exchange_id.ne(&last_config_exchange_id) {
            info!(target: LOG_TARGET, "Exchange ID changed from {last_config_exchange_id} to {built_in_exchange_id}");
            self.exchange_modal_status
                .send_replace(ExchangeModalStatus::WaitForCompletion);
            EventsEmitter::emit_should_show_exchange_miner_modal().await;
            let _unused = ConfigWallet::update_field(
                ConfigWalletContent::set_selected_external_tari_address,
                None,
            )
            .await;
        }

        // If we are on exchange miner build we require external tari address to be set
        if is_on_exchange_miner_build && !is_external_address_selected {
            self.exchange_modal_status
                .send_replace(ExchangeModalStatus::WaitForCompletion);
            EventsEmitter::emit_should_show_exchange_miner_modal().await;
        }

        EventScheduler::instance()
            .spawn_listener()
            .await
            .unwrap_or_else(|e| {
                error!(target: LOG_TARGET, "Failed to start event scheduler listener: {e}");
            });

        info!(target: LOG_TARGET, "Pre Setup Finished");
    }

    pub async fn resolve_setup_features(&self) -> Result<(), anyhow::Error> {
        let mut features = self.features.write().await;

        info!(target: LOG_TARGET, "Resolving setup features");
        // clear existing features
        features.clear();

        let exchange_id = ConfigCore::content().await.exchange_id().clone();
        let is_exchange_miner_build = exchange_id.ne(DEFAULT_EXCHANGE_ID);

        let is_cpu_pool_enabled = *ConfigPools::content().await.cpu_pool_enabled();
        let is_gpu_pool_enabled = *ConfigPools::content().await.gpu_pool_enabled();

        if is_cpu_pool_enabled {
            info!(target: LOG_TARGET, "Cpu Pool feature enabled");
            features.add_feature(SetupFeature::CpuPool);
        }

        if is_gpu_pool_enabled {
            info!(target: LOG_TARGET, "Gpu Pool feature enabled");
            features.add_feature(SetupFeature::GpuPool);
        }

        let external_tari_address = ConfigWallet::content()
            .await
            .selected_external_tari_address()
            .clone();
        // Seedless Wallet feature
        if external_tari_address.is_some() || is_exchange_miner_build {
            info!(target: LOG_TARGET, "Seedless wallet feature enabled");
            features.add_feature(SetupFeature::SeedlessWallet);
            EventsEmitter::emit_disabled_phases(vec![SetupPhase::Wallet]).await;
        } else {
            EventsEmitter::emit_disabled_phases(vec![]).await;
        }

        Ok(())
    }

    async fn setup_core_phase(&self) {
        let app_handle = self.app_handle().await;
        let setup_features = self.features.read().await.clone();
        let core_phase_setup = PhaseBuilder::new()
            .with_setup_timeout_duration(Duration::from_secs(60 * 10)) // 10 minutes
            .build::<CoreSetupPhase>(
                app_handle.clone(),
                self.core_phase_status.clone(),
                setup_features,
            )
            .await;
        core_phase_setup.setup().await;
    }

    async fn setup_cpu_mining_phase(&self) {
        let app_handle = self.app_handle().await;
        let setup_features = self.features.read().await.clone();
        let mut listeners = vec![self.core_phase_status.subscribe()];

        // If CPU Pool feature is disabled, we need to listen for Node phase status as mmproxy requires node
        if setup_features.is_feature_disabled(SetupFeature::CpuPool) {
            listeners.push(self.node_phase_status.subscribe());
        }

        let cpu_mining_phase_setup = PhaseBuilder::new()
            .with_setup_timeout_duration(Duration::from_secs(60 * 10)) // 10 minutes
            .with_listeners_for_required_phases_statuses(listeners)
            .build::<CpuMiningSetupPhase>(
                app_handle.clone(),
                self.cpu_mining_phase_status.clone(),
                setup_features,
            )
            .await;
        cpu_mining_phase_setup.setup().await;
    }

    async fn setup_gpu_mining_phase(&self) {
        let app_handle = self.app_handle().await;
        let setup_features = self.features.read().await.clone();
        let gpu_mining_phase_setup = PhaseBuilder::new()
            .with_setup_timeout_duration(Duration::from_secs(60 * 15)) // 10 minutes
            .with_listeners_for_required_phases_statuses(vec![self.core_phase_status.subscribe()])
            .build::<GpuMiningSetupPhase>(
                app_handle.clone(),
                self.gpu_mining_phase_status.clone(),
                setup_features,
            )
            .await;
        gpu_mining_phase_setup.setup().await;
    }

    async fn setup_node_phase(&self) {
        let app_handle = self.app_handle().await;
        let setup_features = self.features.read().await.clone();

        let node_phase_setup = PhaseBuilder::new()
            .with_setup_timeout_duration(Duration::from_secs(60 * 30))
            .with_listeners_for_required_phases_statuses(vec![self.core_phase_status.subscribe()])
            .build::<NodeSetupPhase>(
                app_handle.clone(),
                self.node_phase_status.clone(),
                setup_features,
            )
            .await;
        node_phase_setup.setup().await;
    }

    async fn setup_wallet_phase(&self) {
        let app_handle = self.app_handle().await;
        let setup_features = self.features.read().await.clone();
        let wallet_phase_setup = PhaseBuilder::new()
            .with_setup_timeout_duration(Duration::from_secs(60 * 10)) // 10 minutes
            .with_listeners_for_required_phases_statuses(vec![self.node_phase_status.subscribe()])
            .build::<WalletSetupPhase>(
                app_handle.clone(),
                self.wallet_phase_status.clone(),
                setup_features,
            )
            .await;
        wallet_phase_setup.setup().await;
    }

    pub async fn mark_exchange_modal_as_completed(&self) -> Result<(), anyhow::Error> {
        self.exchange_modal_status
            .send(ExchangeModalStatus::Completed)?;
        Ok(())
    }

    pub async fn shutdown_phases(&self, phases: Vec<SetupPhase>) {
        for phase in phases {
            match phase {
                SetupPhase::Core => {
                    TasksTrackers::current().core_phase.close().await;
                    TasksTrackers::current().core_phase.replace().await;
                    let _unused = self.core_phase_status.send_replace(PhaseStatus::None);
                }
                SetupPhase::CpuMining => {
                    TasksTrackers::current().cpu_mining_phase.close().await;
                    TasksTrackers::current().cpu_mining_phase.replace().await;
                    let _unused = self.cpu_mining_phase_status.send_replace(PhaseStatus::None);
                }
                SetupPhase::GpuMining => {
                    TasksTrackers::current().gpu_mining_phase.close().await;
                    TasksTrackers::current().gpu_mining_phase.replace().await;
                    let _unused = self.gpu_mining_phase_status.send_replace(PhaseStatus::None);
                }
                SetupPhase::Node => {
                    TasksTrackers::current().node_phase.close().await;
                    TasksTrackers::current().node_phase.replace().await;
                    let _unused = self.node_phase_status.send_replace(PhaseStatus::None);
                }
                SetupPhase::Wallet => {
                    TasksTrackers::current().wallet_phase.close().await;
                    TasksTrackers::current().wallet_phase.replace().await;
                    let _unused = self.wallet_phase_status.send_replace(PhaseStatus::None);
                }
            }
        }
    }

    pub async fn resume_phases(&self, phases: Vec<SetupPhase>) {
        if phases.is_empty() {
            return;
        }

        EventsEmitter::emit_restarting_phases(phases.clone()).await;
        let _unused = self.resolve_setup_features().await;
        self.features
            .write()
            .await
            .add_feature(SetupFeature::Restarting);

        let setup_features = self.features.read().await.clone();

        ListenerUnlockCpuMining::current()
            .load_setup_features(setup_features.clone())
            .await;

        ListenerUnlockGpuMining::current()
            .load_setup_features(setup_features.clone())
            .await;

        ListenerUnlockWallet::current()
            .load_setup_features(setup_features.clone())
            .await;

        ListenerUnlockCpuMining::current().handle_restart().await;
        ListenerUnlockGpuMining::current().handle_restart().await;
        ListenerUnlockWallet::current().handle_restart().await;

        ListenerUnlockCpuMining::current().start_listener().await;
        ListenerUnlockGpuMining::current().start_listener().await;
        ListenerUnlockWallet::current().start_listener().await;

        for phase in phases {
            match phase {
                SetupPhase::Core => {
                    self.setup_core_phase().await;
                }
                SetupPhase::CpuMining => {
                    self.setup_cpu_mining_phase().await;
                }
                SetupPhase::GpuMining => {
                    self.setup_gpu_mining_phase().await;
                }

                SetupPhase::Node => {
                    self.setup_node_phase().await;
                }
                SetupPhase::Wallet => {
                    if setup_features.is_feature_enabled(SetupFeature::SeedlessWallet) {
                        info!(target: LOG_TARGET, "Skipping Wallet Phase as Seedless Wallet is enabled");
                        continue;
                    }
                    self.setup_wallet_phase().await;
                }
            }
        }
    }

    pub async fn restart_phases(&self, phases: Vec<SetupPhase>) {
        info!(target: LOG_TARGET, "Restarting phases: {phases:?}");
        let _lock = self.restart_safe_lock.lock().await;
        self.shutdown_phases(phases.clone()).await;
        self.resume_phases(phases).await;
    }

    #[allow(clippy::too_many_lines)]
    pub async fn start_setup(&self, app_handle: AppHandle) {
        *self.app_handle.lock().await = Some(app_handle.clone());
        self.pre_setup(app_handle.clone()).await;

        let shutdown_signal = TasksTrackers::current().common.get_signal().await;
        let modal_status_subscriber = self.exchange_modal_status.subscribe();
        let task = TasksTrackers::current()
            .common
            .get_task_tracker()
            .await
            .spawn(async move {
                loop {
                    if shutdown_signal.is_triggered() {
                        info!(target: LOG_TARGET, "Shutdown signal received, exiting start_setup loop");
                        break;
                    }

                    if modal_status_subscriber.borrow().is_completed() {
                        info!(target: LOG_TARGET, "Exchange modal completed, exiting start_setup loop");
                        break;
                    }

                    tokio::time::sleep(Duration::from_secs(2)).await;
                }
            });

        let _unused = task
            .await
            .inspect_err(|e| error!(target: LOG_TARGET, "Error in start_setup task: {e}"));

        let shutdown_signal = TasksTrackers::current().common.get_signal().await;
        if shutdown_signal.is_triggered() {
            info!(target: LOG_TARGET, "Shutdown signal already triggered, exiting start_setup");
            return;
        }

        let _unused = self.resolve_setup_features().await.inspect_err(
            |e| error!(target: LOG_TARGET, "Failed to set setup features during start_setup: {e}"),
        );

        let setup_features = self.features.read().await.clone();
        let core_phase_status = self.core_phase_status.subscribe();
        let cpu_mining_phase_status = self.cpu_mining_phase_status.subscribe();
        let gpu_mining_phase_status = self.gpu_mining_phase_status.subscribe();
        let node_phase_status = self.node_phase_status.subscribe();
        let wallet_phase_status = self.wallet_phase_status.subscribe();

        let mut phase_status_channels = HashMap::new();
        phase_status_channels.insert(SetupPhase::Core, core_phase_status.clone());
        phase_status_channels.insert(SetupPhase::CpuMining, cpu_mining_phase_status.clone());
        phase_status_channels.insert(SetupPhase::GpuMining, gpu_mining_phase_status.clone());
        phase_status_channels.insert(SetupPhase::Node, node_phase_status.clone());
        phase_status_channels.insert(SetupPhase::Wallet, wallet_phase_status.clone());

        setup_listener(
            ListenerUnlockCpuMining::current(),
            &setup_features,
            phase_status_channels.clone(),
        )
        .await;

        setup_listener(
            ListenerUnlockGpuMining::current(),
            &setup_features,
            phase_status_channels.clone(),
        )
        .await;

        setup_listener(
            ListenerUnlockWallet::current(),
            &setup_features,
            phase_status_channels.clone(),
        )
        .await;

        self.setup_core_phase().await;
        self.setup_cpu_mining_phase().await;
        self.setup_gpu_mining_phase().await;
        self.setup_node_phase().await;
        self.setup_wallet_phase().await;
    }

    /// Used in handle_unhealthy for graxil miner
    /// Should be triggered after x amount of time passed of graxil being unhealthy
    pub async fn turn_off_gpu_pool_feature(&self) -> Result<(), anyhow::Error> {
        info!(target: LOG_TARGET, "Turning off GPU Pool feature");

        // We want to stop the stats watcher as its not needed when solo mining
        // Normal flow would monitor the status for extra hour but in case of disabling pool mining we want to stop it right away
        GpuPoolManager::stop_stats_watcher().await;

        // Updates the config to disable GPU Pool feature in next resolve_setup_features call
        ConfigPools::update_field(ConfigPoolsContent::set_gpu_pool_enabled, false).await?;
        // TODO Implement solution for telling frontend about one field updates in configs without emitting full config or adding event per field
        EventsEmitter::emit_pools_config_loaded(&ConfigPools::content().await).await;

        Ok(())
    }

    pub async fn turn_on_gpu_pool_feature(&self) -> Result<(), anyhow::Error> {
        info!(target: LOG_TARGET, "Turning on GPU Pool feature");
        ConfigPools::update_field(ConfigPoolsContent::set_gpu_pool_enabled, true).await?;
        // TODO Implement solution for telling frontend about one field updates in configs without emitting full config or adding event per field
        EventsEmitter::emit_pools_config_loaded(&ConfigPools::content().await).await;

        Ok(())
    }

    /// Used in handle_unhealthy for xmrig miner
    /// Should be triggered after x amount of time passed of xmrig being unhealthy
    /// It will make only difference in case of pool connection issues as we do not use other cpu miner
    pub async fn turn_off_cpu_pool_feature(&self) -> Result<(), anyhow::Error> {
        info!(target: LOG_TARGET, "Turning off CPU Pool feature");
        // We want to stop the stats watcher as its not needed when solo mining
        // Normal flow would monitor the status for extra hour but in case of disabling pool mining we want to stop it right away
        CpuPoolManager::stop_stats_watcher().await;

        // Updates the config to disable CPU Pool feature in next resolve_setup_features call
        ConfigPools::update_field(ConfigPoolsContent::set_cpu_pool_enabled, false).await?;
        // TODO Implement solution for telling frontend about one field updates in configs without emitting full config or adding event per field
        EventsEmitter::emit_pools_config_loaded(&ConfigPools::content().await).await;

        // Solo mining will require mmproxy to be running
        self.restart_phases(vec![SetupPhase::CpuMining]).await;

        Ok(())
    }

    // Currently used in case when mmproxy fails to start
    // It throws error in mmproxy_manager.wait_ready() which breaks cpu mining for solo mode
    pub async fn turn_on_cpu_pool_feature(&self) -> Result<(), anyhow::Error> {
        info!(target: LOG_TARGET, "Turning on CPU Pool feature");
        ConfigPools::update_field(ConfigPoolsContent::set_cpu_pool_enabled, true).await?;
        // TODO Implement solution for telling frontend about one field updates in configs without emitting full config or adding event per field
        EventsEmitter::emit_pools_config_loaded(&ConfigPools::content().await).await;

        self.restart_phases(vec![SetupPhase::CpuMining]).await;

        Ok(())
    }

    pub async fn handle_switch_to_local_node(&self) {
        let app_handle = self.app_handle().await;
        info!(target: LOG_TARGET, "Handle Switching to Local Node in Setup Manager");
        EventsManager::handle_node_type_update(&app_handle).await;

        info!(target: LOG_TARGET, "Restarting Phases");
        self.restart_phases(vec![SetupPhase::Wallet]).await;
    }

    pub async fn spawn_sleep_mode_handler() {
        info!(target: LOG_TARGET, "Spawning Sleep Mode Handler");
        let mut shutdown_signal = TasksTrackers::current().common.get_signal().await;
        if shutdown_signal.is_triggered() {
            info!(target: LOG_TARGET, "Shutdown signal already triggered, exiting sleep mode handler");
            return;
        }

        TasksTrackers::current().common.get_task_tracker().await.spawn(async move {
            let mut receiver = SystemStatus::current().get_sleep_mode_watcher();
            let mut last_state = *receiver.borrow();
            loop {
                select! {
                    _ = receiver.changed() => {
                        let current_state = *receiver.borrow();
                        if last_state && !current_state {
                            info!(target: LOG_TARGET, "System is no longer in sleep mode");
                            SetupManager::get_instance().resume_phases(SetupPhase::all()).await;
                        }
                        if !last_state && current_state {
                            info!(target: LOG_TARGET, "System entered sleep mode");
                            SetupManager::get_instance().shutdown_phases(SetupPhase::all()).await;
                        }
                        last_state = current_state;
                    }
                    _ = shutdown_signal.wait() => {
                        break;
                    }
                }
            }
        });
    }

    pub async fn add_phases_to_restart_queue(&self, phases: Vec<SetupPhase>) {
        let mut queue = self.phases_to_restart_queue.lock().await;
        for phase in phases {
            if !queue.contains(&phase) {
                queue.push(phase);
            }
        }
        info!(target: LOG_TARGET, "Phases to restart queue: {queue:?}");
    }

    pub async fn restart_phases_from_queue(&self) {
        let mut queue = self.phases_to_restart_queue.lock().await;
        if queue.is_empty() {
            return;
        }
        info!(target: LOG_TARGET, "Restarting phases from queue: {queue:?}");
        self.restart_phases(queue.clone()).await;
        queue.clear();
    }
}
