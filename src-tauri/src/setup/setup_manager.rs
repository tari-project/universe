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
    phase_core::CoreSetupPhase, phase_hardware::HardwareSetupPhase, phase_node::NodeSetupPhase,
    phase_unknown::UnknownSetupPhase, phase_wallet::WalletSetupPhase,
    trait_setup_phase::SetupPhaseImpl,
};
use crate::{
    configs::{
        config_core::ConfigCore, config_mining::ConfigMining, config_portal::ConfigPortal,
        config_ui::ConfigUI, config_wallet::ConfigWallet,
    },
    events_manager::EventsManager,
    initialize_frontend_updates,
    release_notes::ReleaseNotes,
    tasks_tracker::TasksTrackers,
    utils::system_status::SystemStatus,
    UniverseAppState,
};
use log::{debug, error, info};
use serde::{Deserialize, Serialize};
use std::{
    fmt::{Display, Formatter},
    sync::{Arc, LazyLock},
};
use tauri::{AppHandle, Manager};
use tokio::{
    select,
    sync::{watch::Sender, Mutex},
};
use tokio_util::sync::CancellationToken;

static LOG_TARGET: &str = "tari::universe::setup_manager";

static INSTANCE: LazyLock<SetupManager> = LazyLock::new(SetupManager::new);

#[derive(Clone, PartialEq, Eq, Hash, Serialize, Deserialize, Debug)]
pub enum SetupPhase {
    Core,
    Wallet,
    Hardware,
    Node,
    Unknown,
}

impl Display for SetupPhase {
    fn fmt(&self, f: &mut Formatter<'_>) -> Result<(), std::fmt::Error> {
        match self {
            SetupPhase::Core => write!(f, "Core"),
            SetupPhase::Wallet => write!(f, "Wallet"),
            SetupPhase::Hardware => write!(f, "Hardware"),
            SetupPhase::Node => write!(f, "Node"),
            SetupPhase::Unknown => write!(f, "Unknown"),
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
            SetupPhase::Unknown,
        ]
    }
    pub fn get_critical_problem_title(&self) -> String {
        match self {
            SetupPhase::Core => "phase-core-critical-problem-title".to_string(),
            SetupPhase::Hardware => "phase-hardware-critical-problem-title".to_string(),
            SetupPhase::Node => "phase-node-critical-problem-title".to_string(),
            SetupPhase::Wallet => "phase-wallet-critical-problem-title".to_string(),
            SetupPhase::Unknown => "phase-unknown-critical-problem-title".to_string(),
        }
    }

    pub fn get_critical_problem_description(&self) -> String {
        match self {
            SetupPhase::Core => "phase-core-critical-problem-description".to_string(),
            SetupPhase::Hardware => "phase-hardware-critical-problem-description".to_string(),
            SetupPhase::Node => "phase-node-critical-problem-description".to_string(),
            SetupPhase::Wallet => "phase-wallet-critical-problem-description".to_string(),
            SetupPhase::Unknown => "phase-unknown-critical-problem-description".to_string(),
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
    core_phase_status: Sender<PhaseStatus>,
    hardware_phase_status: Sender<PhaseStatus>,
    node_phase_status: Sender<PhaseStatus>,
    wallet_phase_status: Sender<PhaseStatus>,
    unknown_phase_status: Sender<PhaseStatus>,
    is_app_unlocked: Mutex<bool>,
    is_wallet_unlocked: Mutex<bool>,
    is_mining_unlocked: Mutex<bool>,
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

        let old_config_content = state
            .config
            .write()
            .await
            .initialize_for_migration(app_handle.clone())
            .await;

        ConfigCore::initialize(app_handle.clone(), old_config_content.clone()).await;
        ConfigWallet::initialize(app_handle.clone(), old_config_content.clone()).await;
        ConfigMining::initialize(app_handle.clone(), old_config_content.clone()).await;
        ConfigUI::initialize(app_handle.clone(), old_config_content.clone()).await;
        ConfigPortal::initialize(app_handle).await;

        info!(target: LOG_TARGET, "Pre Setup Finished");
    }

    async fn setup_core_phase(&self, app_handle: AppHandle) {
        let core_phase_setup = Arc::new(CoreSetupPhase::new(app_handle.clone()).await);
        core_phase_setup
            .setup(self.core_phase_status.clone(), vec![])
            .await;
    }

    async fn setup_hardware_phase(&self, app_handle: AppHandle) {
        let hardware_phase_setup = Arc::new(HardwareSetupPhase::new(app_handle.clone()).await);
        hardware_phase_setup
            .setup(self.hardware_phase_status.clone(), vec![])
            .await;
    }

    async fn setup_node_phase(&self, app_handle: AppHandle) {
        let node_phase_setup = Arc::new(NodeSetupPhase::new(app_handle.clone()).await);
        node_phase_setup
            .setup(self.node_phase_status.clone(), vec![])
            .await;
    }

    async fn setup_wallet_phase(&self, app_handle: AppHandle) {
        let wallet_phase_setup = Arc::new(WalletSetupPhase::new(app_handle.clone()).await);
        wallet_phase_setup
            .setup(
                self.wallet_phase_status.clone(),
                vec![self.node_phase_status.subscribe()],
            )
            .await;
    }

    async fn setup_unknown_phase(&self, app_handle: AppHandle) {
        let unknown_phase_setup = Arc::new(UnknownSetupPhase::new(app_handle.clone()).await);
        unknown_phase_setup
            .setup(
                self.unknown_phase_status.clone(),
                vec![
                    self.node_phase_status.subscribe(),
                    self.hardware_phase_status.subscribe(),
                ],
            )
            .await;
    }

    async fn wait_for_unlock_conditions(&self, app_handle: AppHandle) {
        let mut core_phase_status_subscriber = self.core_phase_status.subscribe();
        let mut hardware_phase_status_subscriber = self.hardware_phase_status.subscribe();
        let mut node_phase_status_subscriber = self.node_phase_status.subscribe();
        let mut wallet_phase_status_subscriber = self.wallet_phase_status.subscribe();
        let mut unknown_phase_status_subscriber = self.unknown_phase_status.subscribe();

        let cacellation_token = self.cancellation_token.lock().await.clone();

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
                    let is_unknown_phase_succeeded = unknown_phase_status_subscriber.borrow().is_success();

                    info!(target: LOG_TARGET, "Checking unlock conditions: Core: {}, Hardware: {}, Node: {}, Wallet: {}, Unknown: {}",
                        is_core_phase_succeeded,
                        is_hardware_phase_succeeded,
                        is_node_phase_succeeded,
                        is_wallet_phase_succeeded,
                        is_unknown_phase_succeeded);

                    let is_app_unlocked =
                        *SetupManager::get_instance().is_app_unlocked.lock().await;
                    let is_wallet_unlocked =
                        *SetupManager::get_instance().is_wallet_unlocked.lock().await;
                    let is_mining_unlocked =
                        *SetupManager::get_instance().is_mining_unlocked.lock().await;

                    if is_core_phase_succeeded
                        && is_hardware_phase_succeeded
                        && is_node_phase_succeeded
                        && is_unknown_phase_succeeded
                        && !is_app_unlocked
                    {
                        SetupManager::get_instance()
                            .unlock_app(app_handle.clone())
                            .await;
                    }

                    if is_core_phase_succeeded
                        && is_hardware_phase_succeeded
                        && is_node_phase_succeeded
                        && is_unknown_phase_succeeded
                        && !is_mining_unlocked
                    {
                        SetupManager::get_instance()
                            .unlock_mining(app_handle.clone())
                            .await;
                    }

                    if is_core_phase_succeeded
                        && is_node_phase_succeeded
                        && is_wallet_phase_succeeded
                        && is_unknown_phase_succeeded
                        && !is_wallet_unlocked
                    {
                        SetupManager::get_instance()
                            .unlock_wallet(app_handle.clone())
                            .await;
                    }

                    let is_app_unlocked =
                        *SetupManager::get_instance().is_app_unlocked.lock().await;
                    let is_wallet_unlocked =
                        *SetupManager::get_instance().is_wallet_unlocked.lock().await;
                    let is_mining_unlocked =
                        *SetupManager::get_instance().is_mining_unlocked.lock().await;
                    let is_initial_setup_finished = *SetupManager::get_instance()
                        .is_initial_setup_finished
                        .lock()
                        .await;

                    if is_app_unlocked
                        && is_wallet_unlocked
                        && is_mining_unlocked
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
                        _ = unknown_phase_status_subscriber.changed() => { continue; }
                    };
                }
            });
    }

    async fn shutdown_phases(&self, app_handle: AppHandle, phases: Vec<SetupPhase>) {
        // We are cancelling the wait_for_unlock_conditions listener to avoid it from triggering
        // As we are shutting down the phases one by one which could lead to unwanted unlocks
        self.cancellation_token.lock().await.cancel();

        for phase in phases {
            match phase {
                SetupPhase::Core => {
                    self.lock_mining(app_handle.clone()).await;
                    self.lock_wallet(app_handle.clone()).await;
                    TasksTrackers::current().core_phase.close().await;
                    TasksTrackers::current().core_phase.replace().await;
                    let _unused = self.core_phase_status.send_replace(PhaseStatus::None);
                }
                SetupPhase::Hardware => {
                    self.lock_mining(app_handle.clone()).await;
                    TasksTrackers::current().hardware_phase.close().await;
                    TasksTrackers::current().hardware_phase.replace().await;
                    let _unused = self.hardware_phase_status.send_replace(PhaseStatus::None);
                }
                SetupPhase::Node => {
                    self.lock_mining(app_handle.clone()).await;
                    self.lock_wallet(app_handle.clone()).await;
                    TasksTrackers::current().node_phase.close().await;
                    TasksTrackers::current().node_phase.replace().await;
                    let _unused = self.node_phase_status.send_replace(PhaseStatus::None);
                }
                SetupPhase::Wallet => {
                    self.lock_wallet(app_handle.clone()).await;
                    TasksTrackers::current().wallet_phase.close().await;
                    TasksTrackers::current().wallet_phase.replace().await;
                    let _unused = self.wallet_phase_status.send_replace(PhaseStatus::None);
                }
                SetupPhase::Unknown => {
                    self.lock_mining(app_handle.clone()).await;
                    TasksTrackers::current().unknown_phase.close().await;
                    TasksTrackers::current().unknown_phase.replace().await;
                    let _unused = self.unknown_phase_status.send_replace(PhaseStatus::None);
                }
            }
        }

        *self.cancellation_token.lock().await = CancellationToken::new();
        self.wait_for_unlock_conditions(app_handle.clone()).await;
    }

    async fn resume_phases(&self, app_handle: AppHandle, phases: Vec<SetupPhase>) {
        if !phases.is_empty() {
            EventsManager::handle_restarting_phases(&app_handle, phases.clone()).await;
        }

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
                SetupPhase::Unknown => {
                    self.setup_unknown_phase(app_handle.clone()).await;
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

        EventsManager::handle_unlock_app(&app_handle).await;
    }

    async fn unlock_wallet(&self, app_handle: AppHandle) {
        if *self.is_wallet_unlocked.lock().await {
            debug!(target: LOG_TARGET, "Wallet is already unlocked");
            return;
        }

        info!(target: LOG_TARGET, "Unlocking Wallet");
        *self.is_wallet_unlocked.lock().await = true;
        EventsManager::handle_unlock_wallet(&app_handle).await;
    }

    async fn unlock_mining(&self, app_handle: AppHandle) {
        if *self.is_mining_unlocked.lock().await {
            debug!(target: LOG_TARGET, "Mining is already unlocked");
            return;
        }
        info!(target: LOG_TARGET, "Unlocking Mining");
        *self.is_mining_unlocked.lock().await = true;
        EventsManager::handle_unlock_mining(&app_handle).await;
    }

    async fn lock_mining(&self, app_handle: AppHandle) {
        if !*self.is_mining_unlocked.lock().await {
            debug!(target: LOG_TARGET, "Mining is already locked");
            return;
        }

        info!(target: LOG_TARGET, "Locking Mining");

        *self.is_mining_unlocked.lock().await = false;
        EventsManager::handle_lock_mining(&app_handle).await;
    }

    async fn lock_wallet(&self, app_handle: AppHandle) {
        if !*self.is_wallet_unlocked.lock().await {
            debug!(target: LOG_TARGET, "Wallet is already locked");
            return;
        }
        info!(target: LOG_TARGET, "Locking Wallet");

        *self.is_wallet_unlocked.lock().await = false;
        EventsManager::handle_lock_wallet(&app_handle).await;
    }

    async fn handle_setup_finished(&self, app_handle: AppHandle) {
        info!(target: LOG_TARGET, "Setup Finished");
        let _unused = initialize_frontend_updates(&app_handle).await;
    }

    pub async fn start_setup(&self, app_handle: AppHandle) {
        self.pre_setup(app_handle.clone()).await;
        *self.app_handle.lock().await = Some(app_handle.clone());

        self.wait_for_unlock_conditions(app_handle.clone()).await;

        self.setup_core_phase(app_handle.clone()).await;
        self.setup_hardware_phase(app_handle.clone()).await;
        self.setup_node_phase(app_handle.clone()).await;
        self.setup_wallet_phase(app_handle.clone()).await;
        self.setup_unknown_phase(app_handle.clone()).await;
    }

    pub async fn handle_switch_to_local_node(&self) {
        if let Some(app_handle) = self.app_handle.lock().await.clone() {
            info!(target: LOG_TARGET, "Handle Switching to Local Node in Setup Manager");
            EventsManager::handle_node_type_update(&app_handle).await;

            info!(target: LOG_TARGET, "Restarting Phases");
            self.shutdown_phases(
                app_handle.clone(),
                vec![SetupPhase::Wallet, SetupPhase::Unknown],
            )
            .await;

            self.setup_wallet_phase(app_handle.clone()).await;
            self.setup_unknown_phase(app_handle.clone()).await;
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
