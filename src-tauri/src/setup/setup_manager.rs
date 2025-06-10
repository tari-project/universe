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
use super::listeners::{SetupFeature, SetupFeaturesList};
use super::trait_setup_phase::SetupPhaseImpl;
use super::{
    phase_core::CoreSetupPhase, phase_hardware::HardwareSetupPhase, phase_mining::MiningSetupPhase,
    phase_node::NodeSetupPhase, phase_wallet::WalletSetupPhase, utils::phase_builder::PhaseBuilder,
};
use crate::app_in_memory_config::EXCHANGE_ID;
use crate::configs::config_core::ConfigCoreContent;
use crate::{
    app_in_memory_config::{DynamicMemoryConfig, ExchangeMiner, DEFAULT_EXCHANGE_ID},
    configs::{
        config_core::ConfigCore, config_mining::ConfigMining, config_ui::ConfigUI,
        config_wallet::ConfigWallet, trait_config::ConfigImpl,
    },
    events_emitter::EventsEmitter,
    events_manager::EventsManager,
    internal_wallet::InternalWallet,
    tasks_tracker::TasksTrackers,
    utils::system_status::SystemStatus,
    websocket_manager::WebsocketMessage,
    UniverseAppState,
};
use log::{error, info};
use serde::{Deserialize, Serialize};
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
    features: RwLock<SetupFeaturesList>,
    core_phase_status: Sender<PhaseStatus>,
    hardware_phase_status: Sender<PhaseStatus>,
    node_phase_status: Sender<PhaseStatus>,
    wallet_phase_status: Sender<PhaseStatus>,
    mining_phase_status: Sender<PhaseStatus>,
    exchange_modal_status: Sender<ExchangeModalStatus>,
    universal_modal_status: Sender<ExchangeMiner>,
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

        let config_path = app_handle
            .path()
            .app_config_dir()
            .expect("Could not get config dir");
        let internal_wallet = InternalWallet::load_or_create(config_path, state)
            .await
            .expect("Could not load or create internal wallet");
        let is_address_generated = internal_wallet.get_is_tari_address_generated();
        let is_on_exchange_miner_build =
            in_memory_config.read().await.exchange_id != DEFAULT_EXCHANGE_ID;

        if is_on_exchange_miner_build {
            EventsEmitter::emit_disabled_phases_changed(vec![SetupPhase::Wallet]).await;
        }

        if is_on_exchange_miner_build && is_address_generated {
            self.exchange_modal_status
                .send_replace(ExchangeModalStatus::WaitForCompletion);
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

        if cpu_mining_pool_url.is_some() && cpu_mining_pool_status_url.is_some() {
            features.add_feature(SetupFeature::CentralizedPool);
        }
        if EXCHANGE_ID.ne(DEFAULT_EXCHANGE_ID) {
            features.add_feature(SetupFeature::ExternalWalletAddress);
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
        let state = app_handle.state::<UniverseAppState>();
        let in_memory_config = state.in_memory_config.clone();
        if in_memory_config.read().await.exchange_id != DEFAULT_EXCHANGE_ID {
            // TODO: Add option to disable specific phases and handle it properly on frontend
            // self.unlock_wallet().await;
            return;
        }
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

    pub async fn shutdown_phases(&self, app_handle: AppHandle, phases: Vec<SetupPhase>) {
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
            self.features
                .write()
                .await
                .add_feature(SetupFeature::Restarting);
            let _unused = self.resolve_setup_features().await;
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
                    self.setup_wallet_phase(app_handle.clone()).await;
                }
                SetupPhase::Mining => {
                    self.setup_mining_phase(app_handle.clone()).await;
                }
            }
        }
    }

    pub async fn start_setup(&self, app_handle: AppHandle) {
        self.await_selected_exchange_miner(app_handle.clone()).await;
        self.pre_setup(app_handle.clone()).await;
        let _unused = self.resolve_setup_features()
            .await
            .inspect_err(|e| error!(target: LOG_TARGET, "Failed to set setup features during start_setup: {}", e));
        *self.app_handle.lock().await = Some(app_handle.clone());

        let setup_features = self.features.read().await.clone();
        let core_phase_status = self.core_phase_status.subscribe();
        let hardware_phase_status = self.hardware_phase_status.subscribe();
        let node_phase_status = self.node_phase_status.subscribe();
        let wallet_phase_status = self.wallet_phase_status.subscribe();
        let unknown_phase_status = self.mining_phase_status.subscribe();

        ListenerUnlockApp::current()
            .load_app_handle(app_handle.clone())
            .await;
        ListenerUnlockApp::current()
            .load_setup_features(setup_features.clone())
            .await;
        ListenerUnlockApp::current()
            .add_status_channel(SetupPhase::Core, core_phase_status.clone())
            .await;
        ListenerUnlockApp::current()
            .add_status_channel(SetupPhase::Hardware, hardware_phase_status.clone())
            .await;
        ListenerUnlockApp::current()
            .add_status_channel(SetupPhase::Node, node_phase_status.clone())
            .await;
        ListenerUnlockApp::current()
            .add_status_channel(SetupPhase::Wallet, wallet_phase_status.clone())
            .await;
        ListenerUnlockApp::current()
            .add_status_channel(SetupPhase::Mining, unknown_phase_status.clone())
            .await;
        ListenerUnlockApp::current().start_listener().await;

        ListenerSetupFinished::current()
            .load_setup_features(setup_features.clone())
            .await;
        ListenerSetupFinished::current()
            .add_status_channel(SetupPhase::Core, core_phase_status.clone())
            .await;
        ListenerSetupFinished::current()
            .add_status_channel(SetupPhase::Hardware, hardware_phase_status.clone())
            .await;
        ListenerSetupFinished::current()
            .add_status_channel(SetupPhase::Node, node_phase_status.clone())
            .await;
        ListenerSetupFinished::current()
            .add_status_channel(SetupPhase::Wallet, wallet_phase_status.clone())
            .await;
        ListenerSetupFinished::current()
            .add_status_channel(SetupPhase::Mining, unknown_phase_status.clone())
            .await;
        ListenerSetupFinished::current().start_listener().await;

        ListenerUnlockCpuMining::current()
            .load_setup_features(setup_features.clone())
            .await;
        ListenerUnlockCpuMining::current()
            .add_status_channel(SetupPhase::Core, core_phase_status.clone())
            .await;
        ListenerUnlockCpuMining::current()
            .add_status_channel(SetupPhase::Hardware, hardware_phase_status.clone())
            .await;
        ListenerUnlockCpuMining::current()
            .add_status_channel(SetupPhase::Node, node_phase_status.clone())
            .await;
        ListenerUnlockCpuMining::current()
            .add_status_channel(SetupPhase::Mining, unknown_phase_status.clone())
            .await;
        ListenerUnlockCpuMining::current().start_listener().await;

        ListenerUnlockGpuMining::current()
            .load_setup_features(setup_features.clone())
            .await;
        ListenerUnlockGpuMining::current()
            .add_status_channel(SetupPhase::Core, core_phase_status.clone())
            .await;
        ListenerUnlockGpuMining::current()
            .add_status_channel(SetupPhase::Hardware, hardware_phase_status.clone())
            .await;
        ListenerUnlockGpuMining::current()
            .add_status_channel(SetupPhase::Node, node_phase_status.clone())
            .await;
        ListenerUnlockGpuMining::current()
            .add_status_channel(SetupPhase::Mining, unknown_phase_status.clone())
            .await;
        ListenerUnlockGpuMining::current().start_listener().await;

        ListenerUnlockWallet::current()
            .load_setup_features(setup_features.clone())
            .await;
        ListenerUnlockWallet::current()
            .add_status_channel(SetupPhase::Core, core_phase_status.clone())
            .await;
        ListenerUnlockWallet::current()
            .add_status_channel(SetupPhase::Node, node_phase_status.clone())
            .await;
        ListenerUnlockWallet::current()
            .add_status_channel(SetupPhase::Wallet, wallet_phase_status.clone())
            .await;
        ListenerUnlockWallet::current().start_listener().await;

        self.setup_core_phase(app_handle.clone()).await;
        self.setup_hardware_phase(app_handle.clone()).await;
        self.setup_node_phase(app_handle.clone()).await;
        self.setup_wallet_phase(app_handle.clone()).await;
        self.setup_mining_phase(app_handle.clone()).await;
    }

    async fn await_selected_exchange_miner(&self, app_handle: AppHandle) {
        let state = app_handle.state::<UniverseAppState>();
        let memory_config = state.in_memory_config.read().await;
        let universal_miner_initialized_exchange_id = ConfigCore::content()
            .await
            .universal_miner_initialized_exchange_id()
            .clone();
        if !memory_config.is_universal_miner() || universal_miner_initialized_exchange_id.is_some()
        {
            return;
        }
        drop(memory_config);
        let _unused = self.universal_modal_status.subscribe().changed().await;
    }

    pub async fn select_exchange_miner(
        &self,
        selected_miner: ExchangeMiner,
        app_handle: AppHandle,
    ) -> Result<(), String> {
        let state = app_handle.state::<UniverseAppState>();
        let mut config = state.in_memory_config.write().await;
        let new_config = DynamicMemoryConfig::init_universal(&selected_miner);
        let new_config_cloned = new_config.clone();
        *config = new_config;

        EventsEmitter::emit_app_in_memory_config_changed(new_config_cloned, true).await;
        let _unused = ConfigCore::update_field(
            ConfigCoreContent::set_universal_miner_initialized_exchange_id,
            Some(selected_miner.id.clone()),
        )
        .await;
        EventsEmitter::emit_universal_miner_initialized_exchange_id_changed(
            selected_miner.id.clone(),
        )
        .await;
        self.universal_modal_status
            .send(selected_miner.clone())
            .map_err(|e| e.to_string())?;
        Ok(())
    }

    pub async fn handle_switch_to_local_node(&self) {
        if let Some(app_handle) = self.app_handle.lock().await.clone() {
            info!(target: LOG_TARGET, "Handle Switching to Local Node in Setup Manager");
            EventsManager::handle_node_type_update(&app_handle).await;

            info!(target: LOG_TARGET, "Restarting Phases");
            self.shutdown_phases(
                app_handle.clone(),
                vec![SetupPhase::Wallet, SetupPhase::Mining],
            )
            .await;

            self.setup_wallet_phase(app_handle.clone()).await;
            self.setup_mining_phase(app_handle.clone()).await;
        } else {
            error!(target: LOG_TARGET, "Failed to reset phases after switching to Local Node: app_handle not defined");
        }
    }

    pub async fn spawn_sleep_mode_handler(app_handle: AppHandle) {
        info!(target: LOG_TARGET, "Spawning Sleep Mode Handler");
        TasksTrackers::current().common.get_task_tracker().await.spawn(async move {
            let mut receiver = SystemStatus::current().get_sleep_mode_watcher();
            let mut last_state = *receiver.borrow();
            let mut shutdown_signal = TasksTrackers::current().common.get_signal().await;
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
                            SetupManager::get_instance().shutdown_phases(app_handle.clone(),SetupPhase::all()).await;
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
        self.shutdown_phases(app_handle.clone(), queue.clone())
            .await;
        self.resume_phases(app_handle.clone(), queue.clone()).await;
        queue.clear();
    }
}
