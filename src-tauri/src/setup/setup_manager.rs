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

use super::{
    phase_core::CoreSetupPhase, phase_hardware::HardwareSetupPhase, phase_mining::MiningSetupPhase,
    phase_node::NodeSetupPhase, phase_wallet::WalletSetupPhase, trait_setup_phase::SetupPhaseImpl,
    utils::phase_builder::PhaseBuilder,
};
use crate::app_in_memory_config::MinerType;
use crate::configs::config_core::ConfigCoreContent;
use crate::{
    configs::{
        config_core::ConfigCore, config_mining::ConfigMining, config_ui::ConfigUI,
        config_wallet::ConfigWallet, trait_config::ConfigImpl,
    },
    events::ConnectionStatusPayload,
    events_emitter::EventsEmitter,
    events_manager::EventsManager,
    initialize_frontend_updates,
    release_notes::ReleaseNotes,
    tasks_tracker::TasksTrackers,
    utils::system_status::SystemStatus,
    websocket_manager::WebsocketMessage,
    UniverseAppState,
};
use log::{debug, error, info};
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
use tokio_util::sync::CancellationToken;

static LOG_TARGET: &str = "tari::universe::setup_manager";

static INSTANCE: LazyLock<SetupManager> = LazyLock::new(SetupManager::new);

#[derive(Clone, PartialEq, Eq, Debug)]
pub enum SetupFeature {
    SeedlessWallet,
    CentralizedPool,
}

impl Display for SetupFeature {
    fn fmt(&self, f: &mut Formatter<'_>) -> Result<(), std::fmt::Error> {
        match self {
            SetupFeature::SeedlessWallet => write!(f, "Seedless wallet"),
            SetupFeature::CentralizedPool => write!(f, "Centralized Pool"),
        }
    }
}

#[derive(Clone, Default, PartialEq, Eq, Debug)]
pub struct SetupFeaturesList(Vec<SetupFeature>);

impl SetupFeaturesList {
    pub fn add_feature(&mut self, feature: SetupFeature) {
        if !self.0.contains(&feature) {
            self.0.push(feature);
        }
    }

    pub fn get_features(&self) -> Vec<SetupFeature> {
        self.0.clone()
    }

    pub fn is_feature_enabled(&self, feature: SetupFeature) -> bool {
        self.0.contains(&feature)
    }

    pub fn is_feature_disabled(&self, feature: SetupFeature) -> bool {
        !self.0.contains(&feature)
    }
}

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
    is_app_unlocked: Mutex<bool>,
    is_wallet_unlocked: Mutex<bool>,
    is_cpu_mining_unlocked: Mutex<bool>,
    is_gpu_mining_unlocked: Mutex<bool>,
    is_initial_setup_finished: Mutex<bool>,
    phases_to_restart_queue: Mutex<Vec<SetupPhase>>,
    app_handle: Mutex<Option<AppHandle>>,
    cancellation_token: Mutex<CancellationToken>,
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

        info!("[DEBUG] Acquiring read lock for in_memory_config");
        let build_in_exchange_id = in_memory_config.read().await.exchange_id.clone();
        let is_on_exchange_miner_build =
            MinerType::from_str(&build_in_exchange_id).is_exchange_mode();
        let node_type = ConfigCore::content().await.node_type().clone();
        info!(target: LOG_TARGET, "Retrieved initial node type: {:?}", node_type);
        state.node_manager.set_node_type(node_type).await;
        EventsManager::handle_node_type_update(&app_handle).await;

        let last_config_exchange_id = ConfigCore::content().await.exchange_id().clone();

        let does_not_have_external_tari_address = ConfigWallet::content()
            .await
            .external_tari_address()
            .is_none();

        // If we open different specific exchange miner build then previous one we always want to prompt user to provide tari address
        if let Some(config_exchange_id) = &last_config_exchange_id {
            if is_on_exchange_miner_build
                && build_in_exchange_id.ne(config_exchange_id)
                && !does_not_have_external_tari_address
            {
                info!(target: LOG_TARGET, "Exchange ID changed from {} to {}", config_exchange_id, build_in_exchange_id);
                self.exchange_modal_status
                    .send_replace(ExchangeModalStatus::WaitForCompletion);
                EventsEmitter::emit_should_show_exchange_miner_modal().await;
            }
        }

        // If we are on exchange miner build we require external tari address to be set
        if is_on_exchange_miner_build && does_not_have_external_tari_address {
            self.exchange_modal_status
                .send_replace(ExchangeModalStatus::WaitForCompletion);
            EventsEmitter::emit_should_show_exchange_miner_modal().await;
        }

        if is_on_exchange_miner_build {
            let _unused = ConfigCore::update_field(
                ConfigCoreContent::set_exchange_id,
                Some(build_in_exchange_id.clone()),
            )
            .await;
            EventsEmitter::emit_exchange_id_changed(build_in_exchange_id).await;
        }

        info!(target: LOG_TARGET, "[DEBUG] releasing read lock on in_memory_config at {}:{}", file!(), line!());
        info!(target: LOG_TARGET, "Pre Setup Finished");
    }

    pub async fn resolve_setup_features(&self) -> Result<(), anyhow::Error> {
        let mut features = self.features.write().await;
        let cpu_mining_pool_url = ConfigMining::content().await.cpu_mining_pool_url().clone();
        let cpu_mining_pool_status_url = ConfigMining::content()
            .await
            .cpu_mining_pool_status_url()
            .clone();

        let external_tari_address = ConfigWallet::content()
            .await
            .external_tari_address()
            .clone();

        info!(target: LOG_TARGET, "Resolving setup features");
        // clear existing features
        features.0.clear();

        if cpu_mining_pool_url.is_some() && cpu_mining_pool_status_url.is_some() {
            info!(target: LOG_TARGET, "Centralized pool feature enabled");
            features.add_feature(SetupFeature::CentralizedPool);
        }
        if external_tari_address.is_some() {
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

    #[allow(clippy::too_many_lines)]
    async fn wait_for_unlock_conditions(&self, app_handle: AppHandle) {
        let mut core_phase_status_subscriber = self.core_phase_status.subscribe();
        let mut hardware_phase_status_subscriber = self.hardware_phase_status.subscribe();
        let mut node_phase_status_subscriber = self.node_phase_status.subscribe();
        let mut wallet_phase_status_subscriber = self.wallet_phase_status.subscribe();
        let mut mining_phase_status_subscriber = self.mining_phase_status.subscribe();
        let mut exchange_modal_status_subscriber = self.exchange_modal_status.subscribe();

        let cacellation_token = self.cancellation_token.lock().await.clone();
        let setup_features = self.features.read().await.clone();
        info!(target: LOG_TARGET, "Features: {:?}", setup_features.get_features());

        TasksTrackers::current()
            .common
            .get_task_tracker()
            .await
            .spawn(async move {
                let mut shutdown_signal = TasksTrackers::current().common.get_signal().await;

                loop {
                    let is_core_phase_succeeded = core_phase_status_subscriber.borrow().is_success();
                    let is_hardware_phase_succeeded = hardware_phase_status_subscriber.borrow().is_success();
                    let is_node_phase_succeeded = node_phase_status_subscriber.borrow().is_success();
                    let is_wallet_phase_succeeded = wallet_phase_status_subscriber.borrow().is_success();
                    let is_mining_phase_succeeded = mining_phase_status_subscriber.borrow().is_success();
                    let is_exchange_modal_completed = exchange_modal_status_subscriber.borrow().is_completed();

                    info!(target: LOG_TARGET, "Checking unlock conditions: Core: {}, Hardware: {}, Node: {}, Wallet: {}, Mining: {}",
                        is_core_phase_succeeded,
                        is_hardware_phase_succeeded,
                        is_node_phase_succeeded,
                        is_wallet_phase_succeeded,
                        is_mining_phase_succeeded);

                    let is_app_unlocked =
                        *SetupManager::get_instance().is_app_unlocked.lock().await;
                    let is_wallet_unlocked =
                        *SetupManager::get_instance().is_wallet_unlocked.lock().await;
                    let is_cpu_mining_unlocked =
                        *SetupManager::get_instance().is_cpu_mining_unlocked.lock().await;
                    let is_gpu_mining_unlocked =
                        *SetupManager::get_instance().is_gpu_mining_unlocked.lock().await;

                    // ============= DEFAULT UNLOCK CONDITIONS =============

                    if is_core_phase_succeeded
                        && is_hardware_phase_succeeded
                        && is_node_phase_succeeded
                        && is_mining_phase_succeeded
                        && is_exchange_modal_completed
                        && !is_app_unlocked
                        && setup_features.is_feature_disabled(SetupFeature::CentralizedPool)
                        && setup_features.is_feature_disabled(SetupFeature::SeedlessWallet)
                    {
                        SetupManager::get_instance()
                            .unlock_app(app_handle.clone())
                            .await;
                    }

                    if is_hardware_phase_succeeded
                        && is_node_phase_succeeded
                        && is_mining_phase_succeeded
                        && !is_cpu_mining_unlocked
                        && !is_gpu_mining_unlocked
                        && setup_features.is_feature_disabled(SetupFeature::CentralizedPool)
                        && setup_features.is_feature_disabled(SetupFeature::SeedlessWallet)
                    {
                        SetupManager::get_instance()
                            .unlock_cpu_mining()
                            .await;
                        SetupManager::get_instance()
                            .unlock_gpu_mining()
                            .await;
                    }

                    if is_node_phase_succeeded
                        && is_wallet_phase_succeeded
                        && !is_wallet_unlocked
                        && setup_features.is_feature_disabled(SetupFeature::CentralizedPool)
                        && setup_features.is_feature_disabled(SetupFeature::SeedlessWallet)
                    {
                        SetupManager::get_instance()
                            .unlock_wallet()
                            .await;
                    }

                    // ============= ######################### =============

                    // ============= EXCHANGE MINER UNLOCK CONDITIONS =============

                    if is_core_phase_succeeded
                        && is_hardware_phase_succeeded
                        && is_node_phase_succeeded
                        && is_mining_phase_succeeded
                        && is_exchange_modal_completed
                        && !is_app_unlocked
                        && setup_features.is_feature_disabled(SetupFeature::CentralizedPool)
                        && setup_features.is_feature_enabled(SetupFeature::SeedlessWallet)
                    {
                        SetupManager::get_instance()
                            .unlock_app(app_handle.clone())
                            .await;
                    }

                    if is_core_phase_succeeded
                        && is_hardware_phase_succeeded
                        && is_node_phase_succeeded
                        && is_mining_phase_succeeded
                        && !is_cpu_mining_unlocked
                        && !is_gpu_mining_unlocked
                        && setup_features.is_feature_disabled(SetupFeature::CentralizedPool)
                        && setup_features.is_feature_enabled(SetupFeature::SeedlessWallet)
                    {
                        SetupManager::get_instance()
                            .unlock_cpu_mining()
                            .await;
                        SetupManager::get_instance()
                            .unlock_gpu_mining()
                            .await;
                    }

                    // ============= CENTRALIZED POOL UNLOCK CONDITIONS =============

                    if is_core_phase_succeeded
                        && is_hardware_phase_succeeded
                        && !is_app_unlocked
                        && setup_features.is_feature_enabled(SetupFeature::CentralizedPool)
                        && setup_features.is_feature_disabled(SetupFeature::SeedlessWallet)
                    {
                        SetupManager::get_instance()
                            .unlock_app(app_handle.clone())
                            .await;
                    }

                    if is_core_phase_succeeded
                        && is_hardware_phase_succeeded
                        && !is_cpu_mining_unlocked
                        && setup_features.is_feature_enabled(SetupFeature::CentralizedPool)
                        && setup_features.is_feature_disabled(SetupFeature::SeedlessWallet)
                    {
                        SetupManager::get_instance()
                            .unlock_cpu_mining()
                            .await;
                    }
                    if is_core_phase_succeeded
                        && is_hardware_phase_succeeded
                        && is_node_phase_succeeded
                        && is_mining_phase_succeeded
                        && !is_gpu_mining_unlocked
                        && setup_features.is_feature_enabled(SetupFeature::CentralizedPool)
                        && setup_features.is_feature_disabled(SetupFeature::SeedlessWallet)
                    {
                        SetupManager::get_instance()
                            .unlock_gpu_mining()
                            .await;
                    }

                    if is_node_phase_succeeded
                        && is_wallet_phase_succeeded
                        && !is_wallet_unlocked
                        && setup_features.is_feature_enabled(SetupFeature::CentralizedPool)
                        && setup_features.is_feature_disabled(SetupFeature::SeedlessWallet)
                    {
                        SetupManager::get_instance()
                            .unlock_wallet()
                            .await;
                    }

                    // ============= ######################### =============

                    // ============= CENTRALIZED POOL AND EXCHANGE MINER UNLOCK CONDITIONS =============

                    if is_core_phase_succeeded
                        && is_hardware_phase_succeeded
                        && is_exchange_modal_completed
                        && !is_app_unlocked
                        && setup_features.is_feature_enabled(SetupFeature::CentralizedPool)
                        && setup_features.is_feature_enabled(SetupFeature::SeedlessWallet)
                    {
                        SetupManager::get_instance()
                            .unlock_app(app_handle.clone())
                            .await;
                    }

                    if is_core_phase_succeeded
                        && is_hardware_phase_succeeded
                        && !is_cpu_mining_unlocked
                        && setup_features.is_feature_enabled(SetupFeature::CentralizedPool)
                        && setup_features.is_feature_enabled(SetupFeature::SeedlessWallet)
                    {
                        SetupManager::get_instance()
                            .unlock_cpu_mining()
                            .await;
                    }
                    if is_core_phase_succeeded
                        && is_hardware_phase_succeeded
                        && is_node_phase_succeeded
                        && is_mining_phase_succeeded
                        && !is_gpu_mining_unlocked
                        && setup_features.is_feature_enabled(SetupFeature::CentralizedPool)
                        && setup_features.is_feature_enabled(SetupFeature::SeedlessWallet)
                    {
                        SetupManager::get_instance()
                            .unlock_gpu_mining()
                            .await;
                    }

                    // ============= ######################### =============


                    let is_app_unlocked =
                        *SetupManager::get_instance().is_app_unlocked.lock().await;
                    let is_wallet_unlocked =
                        *SetupManager::get_instance().is_wallet_unlocked.lock().await;
                    let is_cpu_mining_unlocked =
                        *SetupManager::get_instance().is_cpu_mining_unlocked.lock().await;
                    let is_gpu_mining_unlocked =
                        *SetupManager::get_instance().is_gpu_mining_unlocked.lock().await;
                    let is_initial_setup_finished = *SetupManager::get_instance()
                        .is_initial_setup_finished
                        .lock()
                        .await;

                    if is_app_unlocked
                        // Exchange miner won't have wallet unlocked as we are not using the wallet
                        && (is_wallet_unlocked || setup_features.is_feature_enabled(SetupFeature::SeedlessWallet))
                        && is_cpu_mining_unlocked
                        && is_gpu_mining_unlocked
                        && !is_initial_setup_finished
                    {
                        *SetupManager::get_instance()
                            .is_initial_setup_finished
                            .lock()
                            .await = true;
                        SetupManager::get_instance()
                            .handle_setup_finished(app_handle.clone())
                            .await;
                    }

                    if is_app_unlocked
                    && is_wallet_unlocked
                    && is_cpu_mining_unlocked
                    && is_gpu_mining_unlocked
                    && is_initial_setup_finished {
                        SetupManager::get_instance().handle_restart_finished().await;
                    }
                        select! {
                        _ = cacellation_token.cancelled() => {
                            info!(target: LOG_TARGET, "Cancellation token triggered, exiting unlock conditions loop");
                            break;
                        }
                        _ = shutdown_signal.wait() => { break; }
                        _ = core_phase_status_subscriber.changed() => { continue; }
                        _ = hardware_phase_status_subscriber.changed() => { continue; }
                        _ = node_phase_status_subscriber.changed() => { continue; }
                        _ = wallet_phase_status_subscriber.changed() => { continue; }
                        _ = mining_phase_status_subscriber.changed() => { continue; }
                        _ = exchange_modal_status_subscriber.changed() => { continue; }
                    }
                }
            });
    }

    pub async fn shutdown_phases(&self, app_handle: AppHandle, phases: Vec<SetupPhase>) {
        // We are cancelling the wait_for_unlock_conditions listener to avoid it from triggering
        // As we are shutting down the phases one by one which could lead to unwanted unlocks
        self.cancellation_token.lock().await.cancel();
        let features = self.features.read().await.clone();

        for phase in phases {
            match phase {
                SetupPhase::Core => {
                    TasksTrackers::current().core_phase.close().await;
                    TasksTrackers::current().core_phase.replace().await;
                    let _unused = self.core_phase_status.send_replace(PhaseStatus::None);
                }
                SetupPhase::Hardware => {
                    self.lock_cpu_mining().await;
                    self.lock_gpu_mining().await;
                    TasksTrackers::current().hardware_phase.close().await;
                    TasksTrackers::current().hardware_phase.replace().await;
                    let _unused = self.hardware_phase_status.send_replace(PhaseStatus::None);
                }
                SetupPhase::Node => {
                    self.lock_wallet().await;
                    if features.is_feature_enabled(SetupFeature::CentralizedPool) {
                        self.lock_gpu_mining().await;
                    } else {
                        self.lock_gpu_mining().await;
                        self.lock_cpu_mining().await;
                    }

                    TasksTrackers::current().node_phase.close().await;
                    TasksTrackers::current().node_phase.replace().await;
                    let _unused = self.node_phase_status.send_replace(PhaseStatus::None);
                }
                SetupPhase::Wallet => {
                    self.lock_wallet().await;
                    TasksTrackers::current().wallet_phase.close().await;
                    TasksTrackers::current().wallet_phase.replace().await;
                    let _unused = self.wallet_phase_status.send_replace(PhaseStatus::None);
                }
                SetupPhase::Mining => {
                    if features.is_feature_enabled(SetupFeature::CentralizedPool) {
                        self.lock_gpu_mining().await;
                    } else {
                        self.lock_gpu_mining().await;
                        self.lock_cpu_mining().await;
                    }
                    TasksTrackers::current().mining_phase.close().await;
                    TasksTrackers::current().mining_phase.replace().await;
                    let _unused = self.mining_phase_status.send_replace(PhaseStatus::None);
                }
            }
        }

        let _unused = self.resolve_setup_features().await;
        *self.cancellation_token.lock().await = CancellationToken::new();
        self.wait_for_unlock_conditions(app_handle.clone()).await;
    }

    pub async fn resume_phases(&self, app_handle: AppHandle, phases: Vec<SetupPhase>) {
        if !phases.is_empty() {
            EventsEmitter::emit_restarting_phases(phases.clone()).await;
        }

        let features = self.features.read().await.clone();

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
                    if features.is_feature_enabled(SetupFeature::SeedlessWallet) {
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

    async fn unlock_app(&self, app_handle: AppHandle) {
        if *self.is_app_unlocked.lock().await {
            debug!(target: LOG_TARGET, "App is already unlocked");
            return;
        }

        info!(target: LOG_TARGET, "Unlocking App");
        *self.is_app_unlocked.lock().await = true;
        let state = app_handle.state::<UniverseAppState>();
        let _unused = ReleaseNotes::current()
            .handle_release_notes_event_emit(state.clone(), app_handle.clone())
            .await;

        EventsEmitter::emit_unlock_app().await;
    }

    async fn unlock_wallet(&self) {
        if *self.is_wallet_unlocked.lock().await {
            debug!(target: LOG_TARGET, "Wallet is already unlocked");
            return;
        }

        info!(target: LOG_TARGET, "Unlocking Wallet");
        *self.is_wallet_unlocked.lock().await = true;
        EventsEmitter::emit_unlock_wallet().await;
    }

    async fn unlock_cpu_mining(&self) {
        if *self.is_cpu_mining_unlocked.lock().await {
            debug!(target: LOG_TARGET, "Mining is already unlocked");
            return;
        }
        info!(target: LOG_TARGET, "Unlocking Mining");
        *self.is_cpu_mining_unlocked.lock().await = true;
        EventsEmitter::emit_unlock_cpu_mining().await;
    }
    async fn unlock_gpu_mining(&self) {
        if *self.is_gpu_mining_unlocked.lock().await {
            debug!(target: LOG_TARGET, "Mining is already unlocked");
            return;
        }
        info!(target: LOG_TARGET, "Unlocking Mining");
        *self.is_gpu_mining_unlocked.lock().await = true;
        EventsEmitter::emit_unlock_gpu_mining().await;
    }

    async fn lock_cpu_mining(&self) {
        if !*self.is_cpu_mining_unlocked.lock().await {
            debug!(target: LOG_TARGET, "Mining is already locked");
            return;
        }

        info!(target: LOG_TARGET, "Locking Mining");

        *self.is_cpu_mining_unlocked.lock().await = false;
        EventsEmitter::emit_lock_cpu_mining().await;
    }
    async fn lock_gpu_mining(&self) {
        if !*self.is_gpu_mining_unlocked.lock().await {
            debug!(target: LOG_TARGET, "Mining is already locked");
            return;
        }

        info!(target: LOG_TARGET, "Locking Mining");

        *self.is_gpu_mining_unlocked.lock().await = false;
        EventsEmitter::emit_lock_gpu_mining().await;
    }

    async fn lock_wallet(&self) {
        if !*self.is_wallet_unlocked.lock().await {
            debug!(target: LOG_TARGET, "Wallet is already locked");
            return;
        }
        info!(target: LOG_TARGET, "Locking Wallet");

        *self.is_wallet_unlocked.lock().await = false;
        EventsEmitter::emit_lock_wallet().await;
    }

    async fn handle_setup_finished(&self, app_handle: AppHandle) {
        info!(target: LOG_TARGET, "Setup Finished");
        EventsEmitter::emit_initial_setup_finished().await;
        let _unused = initialize_frontend_updates(&app_handle).await;
    }

    async fn handle_restart_finished(&self) {
        info!(target: LOG_TARGET, "Restart Finished");
        EventsEmitter::emit_connection_status_changed(ConnectionStatusPayload::Succeed).await;
    }

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

        let _unused = self.resolve_setup_features()
            .await
            .inspect_err(|e| error!(target: LOG_TARGET, "Failed to set setup features during start_setup: {}", e));
        *self.app_handle.lock().await = Some(app_handle.clone());

        self.wait_for_unlock_conditions(app_handle.clone()).await;

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
