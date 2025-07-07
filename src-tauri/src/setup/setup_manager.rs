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

use super::listeners::listener_setup_finished::ListenerSetupFinished;
use super::listeners::listener_unlock_app::ListenerUnlockApp;
use super::listeners::listener_unlock_cpu_mining::ListenerUnlockCpuMining;
use super::listeners::listener_unlock_gpu_mining::ListenerUnlockGpuMining;
use super::listeners::listener_unlock_wallet::ListenerUnlockWallet;
use super::listeners::trait_listener::UnlockConditionsListenerTrait;
use super::listeners::{setup_listener, SetupFeature, SetupFeaturesList};
use super::trait_setup_phase::SetupPhaseImpl;
use super::{
    phase_core::CoreSetupPhase, phase_hardware::HardwareSetupPhase, phase_mining::MiningSetupPhase,
    phase_node::NodeSetupPhase, phase_wallet::WalletSetupPhase, utils::phase_builder::PhaseBuilder,
};
use crate::app_in_memory_config::{MinerType, DEFAULT_EXCHANGE_ID};
use crate::configs::config_core::ConfigCoreContent;
use crate::configs::config_ui::WalletUIMode;
use crate::events::CriticalProblemPayload;
use crate::internal_wallet::InternalWallet;
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
    Wallet,
    Hardware,
    Node,
    Mining,
}

impl Display for SetupPhase {
    fn fmt(&self, f: &mut Formatter<'_>) -> Result<(), std::fmt::Error> {
        match self {
            SetupPhase::Core => write!(f, "Core"),
            SetupPhase::Wallet => write!(f, "Wallet"),
            SetupPhase::Hardware => write!(f, "Hardware"),
            SetupPhase::Node => write!(f, "Node"),
            SetupPhase::Mining => write!(f, "Mining"),
        }
    }
}

impl SetupPhase {
    pub fn all() -> Vec<SetupPhase> {
        vec![
            SetupPhase::Core,
            SetupPhase::Hardware,
            SetupPhase::Node,
            SetupPhase::Wallet,
            SetupPhase::Mining,
        ]
    }
    pub fn get_critical_problem_title(&self) -> String {
        match self {
            SetupPhase::Core => "phase-core-critical-problem-title".to_string(),
            SetupPhase::Hardware => "phase-hardware-critical-problem-title".to_string(),
            SetupPhase::Node => "phase-node-critical-problem-title".to_string(),
            SetupPhase::Wallet => "phase-wallet-critical-problem-title".to_string(),
            SetupPhase::Mining => "phase-mining-critical-problem-title".to_string(),
        }
    }

    pub fn get_critical_problem_description(&self) -> String {
        match self {
            SetupPhase::Core => "phase-core-critical-problem-description".to_string(),
            SetupPhase::Hardware => "phase-hardware-critical-problem-description".to_string(),
            SetupPhase::Node => "phase-node-critical-problem-description".to_string(),
            SetupPhase::Wallet => "phase-wallet-critical-problem-description".to_string(),
            SetupPhase::Mining => "phase-mining-critical-problem-description".to_string(),
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
    Failed,
    Success,
    SuccessWithWarnings,
}

impl Display for PhaseStatus {
    fn fmt(&self, f: &mut Formatter<'_>) -> Result<(), std::fmt::Error> {
        match self {
            PhaseStatus::None => write!(f, "None"),
            PhaseStatus::Initialized => write!(f, "Initialized"),
            PhaseStatus::AwaitingStart => write!(f, "Awaiting Start"),
            PhaseStatus::InProgress => write!(f, "In Progress"),
            PhaseStatus::Failed => write!(f, "Failed"),
            PhaseStatus::Success => write!(f, "Success"),
            PhaseStatus::SuccessWithWarnings => write!(f, "Success With Warnings"),
        }
    }
}

impl PhaseStatus {
    pub fn is_success(&self) -> bool {
        matches!(
            self,
            PhaseStatus::Success | PhaseStatus::SuccessWithWarnings
        )
    }
    pub fn is_restarting(&self) -> bool {
        matches!(self, PhaseStatus::None)
    }
}

#[derive(Default)]
pub struct SetupManager {
    pub features: RwLock<SetupFeaturesList>,
    core_phase_status: Sender<PhaseStatus>,
    hardware_phase_status: Sender<PhaseStatus>,
    node_phase_status: Sender<PhaseStatus>,
    wallet_phase_status: Sender<PhaseStatus>,
    mining_phase_status: Sender<PhaseStatus>,
    exchange_modal_status: Sender<ExchangeModalStatus>,
    phases_to_restart_queue: Mutex<Vec<SetupPhase>>,
    app_handle: Mutex<Option<AppHandle>>,
}

impl SetupManager {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn get_instance() -> &'static LazyLock<SetupManager> {
        &INSTANCE
    }

    #[allow(clippy::too_many_lines)]
    async fn pre_setup(&self, app_handle: AppHandle) {
        info!(target: LOG_TARGET, "Pre Setup");
        let state = app_handle.state::<UniverseAppState>();
        let in_memory_config = state.in_memory_config.clone();

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

        let mut websocket_events_manager_guard = state.websocket_event_manager.write().await;
        websocket_events_manager_guard.set_app_handle(app_handle.clone());
        drop(websocket_events_manager_guard);

        let mut websocket_manager_write = state.websocket_manager.write().await;
        websocket_manager_write.set_app_handle(app_handle.clone());
        drop(websocket_manager_write);

        let webview = app_handle
            .get_webview_window("main")
            .expect("main window must exist");
        let websocket_tx = state.websocket_message_tx.clone();
        webview.listen("ws-tx", move |event: tauri::Event| {
            let event_cloned = event.clone();
            let websocket_tx_clone = websocket_tx.clone();

            tauri::async_runtime::spawn(async move {
                let message = event_cloned.payload();
                if let Ok(message) = serde_json::from_str::<WebsocketMessage>(message)
                    .inspect_err(|e| error!("websocket malformatted: {}", e))
                {
                    if websocket_tx_clone
                        .send(message.clone())
                        .await
                        .inspect_err(|e| error!("too many messages in websocket send queue {}", e))
                        .is_ok()
                    {
                        log::trace!("websocket message sent {:?}", message);
                    }
                }
            });
        });
        EventsManager::handle_node_type_update(&app_handle).await;

        ConfigCore::initialize(app_handle.clone()).await;
        ConfigWallet::initialize(app_handle.clone()).await;
        ConfigMining::initialize(app_handle.clone()).await;
        ConfigUI::initialize(app_handle.clone()).await;

        let node_type = ConfigCore::content().await.node_type().clone();
        info!(target: LOG_TARGET, "Retrieved initial node type: {:?}", node_type);
        state.node_manager.set_node_type(node_type).await;
        EventsManager::handle_node_type_update(&app_handle).await;

        let build_in_exchange_id = in_memory_config.read().await.exchange_id.clone();
        let is_on_exchange_miner_build =
            MinerType::from_str(&build_in_exchange_id).is_exchange_mode();
        let last_config_exchange_id = ConfigCore::content().await.exchange_id().clone();

        if is_on_exchange_miner_build {
            let _unused = ConfigCore::update_field(
                ConfigCoreContent::set_exchange_id,
                build_in_exchange_id.clone(),
            )
            .await;
        }

        EventsEmitter::emit_core_config_loaded(&ConfigCore::content().await).await;
        EventsEmitter::emit_wallet_config_loaded(&ConfigWallet::content().await).await;
        EventsEmitter::emit_mining_config_loaded(&ConfigMining::content().await).await;
        EventsEmitter::emit_ui_config_loaded(&ConfigUI::content().await).await;

        let is_on_exchange_specific_variant = ConfigCore::content()
            .await
            .is_on_exchange_specific_variant();
        let is_external_address_selected = ConfigWallet::content()
            .await
            .selected_external_tari_address()
            .is_some();
        // Default app variant (when build in exchange ID is DEFAULT_EXCHANGE_ID) can have either seedless wallet or standard wallet

        // If there is exchange id set in config_core that is different from DEFAULT_EXCHANGE_ID and external address is provided we want to display seedless wallet UI
        // This can happen when user was using dedicated exchange miner build before and now is using default app variant
        // Or user selected exchange on default app variant and reopened the app
        // In other cases we want to display standard wallet UI
        if build_in_exchange_id.eq(DEFAULT_EXCHANGE_ID) {
            if is_external_address_selected && is_on_exchange_specific_variant {
                let _unused = ConfigUI::set_wallet_ui_mode(WalletUIMode::Seedless).await;
                if let Err(e) = InternalWallet::initialize_seedless(&app_handle, None).await {
                    EventsEmitter::emit_critical_problem(CriticalProblemPayload {
                        title: Some("Wallet not initialized!".to_string()),
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
                                title: Some("Wallet migration failed!".to_string()),
                                description: Some(
                                    "Encountered an error while migrating the wallet.".to_string(),
                                ),
                                error_message: Some(e.to_string()),
                            })
                            .await
                        }
                    }
                    Err(e) => {
                        // Handle this as critical error
                        error!(target: LOG_TARGET, "Error loading internal wallet: {:?}", e);
                    }
                };
            }
        }

        // If we open different specific exchange miner build then previous one we always want to prompt user to provide tari address
        if is_on_exchange_miner_build
            && build_in_exchange_id.ne(&last_config_exchange_id)
            && !is_external_address_selected
        {
            info!(target: LOG_TARGET, "Exchange ID changed from {} to {}", last_config_exchange_id, build_in_exchange_id);
            self.exchange_modal_status
                .send_replace(ExchangeModalStatus::WaitForCompletion);
            EventsEmitter::emit_should_show_exchange_miner_modal().await;
        }

        // If we are on exchange miner build we require external tari address to be set
        if is_on_exchange_miner_build && !is_external_address_selected {
            self.exchange_modal_status
                .send_replace(ExchangeModalStatus::WaitForCompletion);
            EventsEmitter::emit_should_show_exchange_miner_modal().await;
        }

        info!(target: LOG_TARGET, "Pre Setup Finished");
    }

    pub async fn resolve_setup_features(&self) -> Result<(), anyhow::Error> {
        let mut features = self.features.write().await;
        let cpu_mining_pool_url = ConfigMining::content().await.cpu_mining_pool_url().clone();
        let cpu_mining_pool_status_url = ConfigMining::content()
            .await
            .cpu_mining_pool_status_url()
            .clone();
        let is_cpu_mining_enabled = *ConfigMining::content().await.cpu_mining_enabled();

        info!(target: LOG_TARGET, "Resolving setup features");
        // clear existing features
        features.clear();

        let exchange_id = ConfigCore::content().await.exchange_id().clone();
        let is_exchange_miner_build = exchange_id.ne(DEFAULT_EXCHANGE_ID);

        // Centralized Pool feature
        if cpu_mining_pool_url.is_some()
            && cpu_mining_pool_status_url.is_some()
            && is_cpu_mining_enabled
        {
            info!(target: LOG_TARGET, "Centralized pool feature enabled");
            features.add_feature(SetupFeature::CentralizedPool);
        }

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

    async fn setup_core_phase(&self, app_handle: AppHandle) {
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

    async fn setup_hardware_phase(&self, app_handle: AppHandle) {
        let setup_features = self.features.read().await.clone();
        let hardware_phase_setup = PhaseBuilder::new()
            .with_setup_timeout_duration(Duration::from_secs(60 * 10)) // 10 minutes
            .with_listeners_for_required_phases_statuses(vec![self.core_phase_status.subscribe()])
            .build::<HardwareSetupPhase>(
                app_handle.clone(),
                self.hardware_phase_status.clone(),
                setup_features,
            )
            .await;
        hardware_phase_setup.setup().await;
    }

    async fn setup_node_phase(&self, app_handle: AppHandle) {
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

    async fn setup_wallet_phase(&self, app_handle: AppHandle) {
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

    async fn setup_mining_phase(&self, app_handle: AppHandle) {
        let setup_features = self.features.read().await.clone();
        let mining_phase_setup = PhaseBuilder::new()
            .with_setup_timeout_duration(Duration::from_secs(60 * 10)) // 10 minutes
            .with_listeners_for_required_phases_statuses(vec![
                self.node_phase_status.subscribe(),
                self.hardware_phase_status.subscribe(),
            ])
            .build::<MiningSetupPhase>(
                app_handle.clone(),
                self.mining_phase_status.clone(),
                setup_features,
            )
            .await;
        mining_phase_setup.setup().await;
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
                SetupPhase::Hardware => {
                    TasksTrackers::current().hardware_phase.close().await;
                    TasksTrackers::current().hardware_phase.replace().await;
                    let _unused = self.hardware_phase_status.send_replace(PhaseStatus::None);
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
                SetupPhase::Mining => {
                    TasksTrackers::current().mining_phase.close().await;
                    TasksTrackers::current().mining_phase.replace().await;
                    let _unused = self.mining_phase_status.send_replace(PhaseStatus::None);
                }
            }
        }
        ListenerUnlockCpuMining::current().handle_restart().await;
        ListenerUnlockGpuMining::current().handle_restart().await;
        ListenerUnlockWallet::current().handle_restart().await;
    }

    pub async fn resume_phases(&self, app_handle: AppHandle, phases: Vec<SetupPhase>) {
        if !phases.is_empty() {
            EventsEmitter::emit_restarting_phases(phases.clone()).await;
            let _unused = self.resolve_setup_features().await;
            self.features
                .write()
                .await
                .add_feature(SetupFeature::Restarting);
        }

        let setup_features = self.features.read().await.clone();
        ListenerUnlockApp::current()
            .load_setup_features(setup_features.clone())
            .await;
        ListenerUnlockApp::current().start_listener().await;

        ListenerSetupFinished::current()
            .load_setup_features(setup_features.clone())
            .await;
        ListenerSetupFinished::current().start_listener().await;

        ListenerUnlockCpuMining::current()
            .load_setup_features(setup_features.clone())
            .await;
        ListenerUnlockCpuMining::current().start_listener().await;

        ListenerUnlockGpuMining::current()
            .load_setup_features(setup_features.clone())
            .await;
        ListenerUnlockGpuMining::current().start_listener().await;

        ListenerUnlockWallet::current()
            .load_setup_features(setup_features.clone())
            .await;
        ListenerUnlockWallet::current().start_listener().await;

        for phase in phases {
            match phase {
                SetupPhase::Core => {
                    self.setup_core_phase(app_handle.clone()).await;
                }
                SetupPhase::Hardware => {
                    self.setup_hardware_phase(app_handle.clone()).await;
                }
                SetupPhase::Node => {
                    self.setup_node_phase(app_handle.clone()).await;
                }
                SetupPhase::Wallet => {
                    if setup_features.is_feature_enabled(SetupFeature::SeedlessWallet) {
                        info!(target: LOG_TARGET, "Skipping Wallet Phase as Seedless Wallet is enabled");
                        continue;
                    }
                    self.setup_wallet_phase(app_handle.clone()).await;
                }
                SetupPhase::Mining => {
                    self.setup_mining_phase(app_handle.clone()).await;
                }
            }
        }
    }

    pub async fn restart_phases(&self, app_handle: AppHandle, phases: Vec<SetupPhase>) {
        info!(target: LOG_TARGET, "Restarting phases: {:?}", phases);
        self.shutdown_phases(phases.clone()).await;
        self.resume_phases(app_handle, phases).await;
    }

    #[allow(clippy::too_many_lines)]
    pub async fn start_setup(&self, app_handle: AppHandle) {
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
            .inspect_err(|e| error!(target: LOG_TARGET, "Error in start_setup task: {}", e));

        let shutdown_signal = TasksTrackers::current().common.get_signal().await;
        if shutdown_signal.is_triggered() {
            info!(target: LOG_TARGET, "Shutdown signal already triggered, exiting start_setup");
            return;
        }

        let _unused = self.resolve_setup_features()
            .await
            .inspect_err(|e| error!(target: LOG_TARGET, "Failed to set setup features during start_setup: {}", e));
        *self.app_handle.lock().await = Some(app_handle.clone());

        let setup_features = self.features.read().await.clone();
        let core_phase_status = self.core_phase_status.subscribe();
        let hardware_phase_status = self.hardware_phase_status.subscribe();
        let node_phase_status = self.node_phase_status.subscribe();
        let wallet_phase_status = self.wallet_phase_status.subscribe();
        let mining_phase_status = self.mining_phase_status.subscribe();

        let mut phase_status_channels = HashMap::new();
        phase_status_channels.insert(SetupPhase::Core, core_phase_status.clone());
        phase_status_channels.insert(SetupPhase::Hardware, hardware_phase_status.clone());
        phase_status_channels.insert(SetupPhase::Node, node_phase_status.clone());
        phase_status_channels.insert(SetupPhase::Wallet, wallet_phase_status.clone());
        phase_status_channels.insert(SetupPhase::Mining, mining_phase_status.clone());

        ListenerUnlockApp::current()
            .load_app_handle(app_handle.clone())
            .await;
        setup_listener(
            ListenerUnlockApp::current(),
            &setup_features,
            phase_status_channels.clone(),
        )
        .await;

        setup_listener(
            ListenerSetupFinished::current(),
            &setup_features,
            phase_status_channels.clone(),
        )
        .await;

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

        self.setup_core_phase(app_handle.clone()).await;
        self.setup_hardware_phase(app_handle.clone()).await;
        self.setup_node_phase(app_handle.clone()).await;
        self.setup_wallet_phase(app_handle.clone()).await;
        self.setup_mining_phase(app_handle.clone()).await;
    }

    pub async fn handle_switch_to_local_node(&self) {
        if let Some(app_handle) = self.app_handle.lock().await.clone() {
            info!(target: LOG_TARGET, "Handle Switching to Local Node in Setup Manager");
            EventsManager::handle_node_type_update(&app_handle).await;

            info!(target: LOG_TARGET, "Restarting Phases");
            self.restart_phases(
                app_handle.clone(),
                vec![SetupPhase::Wallet, SetupPhase::Mining],
            )
            .await;
        } else {
            error!(target: LOG_TARGET, "Failed to reset phases after switching to Local Node: app_handle not defined");
        }
    }

    pub async fn spawn_sleep_mode_handler(app_handle: AppHandle) {
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
                            SetupManager::get_instance().resume_phases(app_handle.clone(), SetupPhase::all()).await;
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
        info!(target: LOG_TARGET, "Phases to restart queue: {:?}", queue);
    }

    pub async fn restart_phases_from_queue(&self, app_handle: AppHandle) {
        let mut queue = self.phases_to_restart_queue.lock().await;
        if queue.is_empty() {
            return;
        }
        info!(target: LOG_TARGET, "Restarting phases from queue: {:?}", queue);
        self.restart_phases(app_handle.clone(), queue.clone()).await;
        queue.clear();
    }
}
