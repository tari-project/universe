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

use crate::{
    initialize_frontend_updates, release_notes::ReleaseNotes, tasks_tracker::TasksTrackers,
    UniverseAppState,
};
use log::{error, info};
use std::{
    fmt::{Display, Formatter},
    sync::{Arc, LazyLock},
    time::Duration,
};
use tauri::{AppHandle, Manager};
use tokio::{
    select,
    sync::{watch::Sender, Mutex},
};

use super::{
    phase_core::CoreSetupPhase,
    phase_hardware::{HardwareSetupPhase, HardwareSetupPhaseOutput},
    phase_node::NodeSetupPhase,
    phase_unknown::UnknownSetupPhase,
    phase_wallet::WalletSetupPhase,
    trait_setup_phase::SetupPhaseImpl,
};

static LOG_TARGET: &str = "tari::universe::setup_manager";

static INSTANCE: LazyLock<SetupManager> = LazyLock::new(SetupManager::new);

#[derive(Clone, PartialEq, Eq, Hash)]
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

#[allow(dead_code)]
pub enum PhaseStatus {
    None,
    Initialized,
    AwaitingStart,
    InProgress,
    Failed,
    Success,
    SuccessWithWarnings,
}

impl Default for PhaseStatus {
    fn default() -> Self {
        PhaseStatus::None
    }
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
    #[allow(dead_code)]
    remote_node_phase_status: Sender<PhaseStatus>,
    wallet_phase_status: Sender<PhaseStatus>,
    unknown_phase_status: Sender<PhaseStatus>,
    is_app_unlocked: Mutex<bool>,
    is_wallet_unlocked: Mutex<bool>,
    is_mining_unlocked: Mutex<bool>,
    pub hardware_phase_output: Sender<HardwareSetupPhaseOutput>,
    app_handle: Mutex<Option<AppHandle>>,
}

impl SetupManager {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn get_instance() -> &'static LazyLock<SetupManager> {
        &INSTANCE
    }

    pub async fn start_setup(&self, app_handle: AppHandle) {
        *self.app_handle.lock().await = Some(app_handle.clone());

        let core_phase_setup = Arc::new(CoreSetupPhase::new(app_handle.clone()).await);
        let hardware_phase_setup = Arc::new(HardwareSetupPhase::new(app_handle.clone()).await);
        let node_phase_setup = Arc::new(NodeSetupPhase::new(app_handle.clone()).await);
        let wallet_phase_setup = Arc::new(WalletSetupPhase::new(app_handle.clone()).await);
        let unknown_phase_setup = Arc::new(UnknownSetupPhase::new(app_handle.clone()).await);

        self.wait_for_unlock_conditions(app_handle.clone()).await;

        core_phase_setup
            .setup(self.core_phase_status.clone(), vec![])
            .await;
        hardware_phase_setup
            .setup(
                self.hardware_phase_status.clone(),
                vec![self.core_phase_status.subscribe()],
            )
            .await;
        node_phase_setup
            .setup(
                self.node_phase_status.clone(),
                vec![self.core_phase_status.subscribe()],
            )
            .await;
        wallet_phase_setup
            .setup(
                self.wallet_phase_status.clone(),
                vec![
                    self.core_phase_status.subscribe(),
                    self.node_phase_status.subscribe(),
                ],
            )
            .await;
        unknown_phase_setup
            .setup(
                self.unknown_phase_status.clone(),
                vec![
                    self.core_phase_status.subscribe(),
                    self.node_phase_status.subscribe(),
                    self.hardware_phase_status.subscribe(),
                ],
            )
            .await;
    }

    pub async fn wait_for_unlock_conditions(&self, app_handle: AppHandle) {
        let core_phase_status_subscriber = self.core_phase_status.subscribe();
        let hardware_phase_status_subscriber = self.hardware_phase_status.subscribe();
        let node_phase_status_subscriber = self.node_phase_status.subscribe();
        let wallet_phase_status_subscriber = self.wallet_phase_status.subscribe();
        let unknown_phase_status_subscriber = self.unknown_phase_status.subscribe();

        TasksTrackers::current()
            .common
            .get_task_tracker()
            .await.spawn(async move {
                    // Todo change it to use tokio stream and listien to changes on receivers
                let mut shutdown_signal = TasksTrackers::current().common.get_signal().await;
                loop {
                    select! {
                        _ = shutdown_signal.wait() => {
                            break;
                        }
                        _ = tokio::time::sleep(Duration::from_secs(1)) => {
                            let is_app_unlocked = SetupManager::get_instance()
                                .is_app_unlocked
                                .lock()
                                .await
                                .clone();
                            let is_wallet_unlocked = SetupManager::get_instance()
                                .is_wallet_unlocked
                                .lock()
                                .await
                                .clone();
                            let is_mining_unlocked = SetupManager::get_instance()
                                .is_mining_unlocked
                                .lock()
                                .await
                                .clone();

                            let core_phase_status = core_phase_status_subscriber.borrow().is_success();
                            let hardware_phase_status =
                                hardware_phase_status_subscriber.borrow().is_success();
                            let node_phase_status =
                                node_phase_status_subscriber.borrow().is_success();
                            let unknown_phase_status =
                                unknown_phase_status_subscriber.borrow().is_success();
                            let wallet_phase_status = wallet_phase_status_subscriber.borrow().is_success();

                            info!(target: LOG_TARGET, "Unlock conditions: app: {}, wallet: {}, mining: {}, core: {}, hardware: {}, node: {}, unknown: {}, wallet: {}",
                                is_app_unlocked,
                                is_wallet_unlocked,
                                is_mining_unlocked,
                                core_phase_status,
                                hardware_phase_status,
                                node_phase_status,
                                unknown_phase_status,
                                wallet_phase_status
                            );

                            if core_phase_status
                                && hardware_phase_status
                                && node_phase_status
                                && unknown_phase_status
                                && !is_app_unlocked
                            {
                                SetupManager::get_instance()
                                    .unlock_app(app_handle.clone())
                                    .await;
                            }

                            if core_phase_status
                                && hardware_phase_status
                                && node_phase_status
                                && unknown_phase_status
                                && !is_mining_unlocked
                            {
                                SetupManager::get_instance()
                                    .unlock_mining(app_handle.clone())
                                    .await;
                            }

                            if core_phase_status
                                && node_phase_status
                                && unknown_phase_status
                                && wallet_phase_status
                                && !is_wallet_unlocked
                            {
                                SetupManager::get_instance()
                                    .unlock_wallet(app_handle.clone())
                                    .await;
                            }

                            if is_app_unlocked && is_wallet_unlocked && is_mining_unlocked {
                                SetupManager::get_instance()
                                    .handle_setup_finished(app_handle.clone())
                                    .await;
                            }
                        }
                    }
                }
            });
    }

    async fn restart_phases(&self, app_handle: AppHandle, phases_queue: Vec<SetupPhase>) {
        for phase in phases_queue.clone() {
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
                SetupPhase::Unknown => {
                    TasksTrackers::current().unknown_phase.close().await;
                    TasksTrackers::current().unknown_phase.replace().await;
                    let _unused = self.unknown_phase_status.send_replace(PhaseStatus::None);
                }
            }
        }

        for phase in phases_queue {
            match phase {
                SetupPhase::Core => {
                    let core_phase_setup = Arc::new(CoreSetupPhase::new(app_handle.clone()).await);
                    core_phase_setup
                        .setup(self.core_phase_status.clone(), vec![])
                        .await;
                }
                SetupPhase::Hardware => {
                    let hardware_phase_setup =
                        Arc::new(HardwareSetupPhase::new(app_handle.clone()).await);
                    hardware_phase_setup
                        .setup(
                            self.hardware_phase_status.clone(),
                            vec![self.core_phase_status.subscribe()],
                        )
                        .await;
                }
                SetupPhase::Node => {
                    let local_node_phase_setup =
                        Arc::new(NodeSetupPhase::new(app_handle.clone()).await);
                    local_node_phase_setup
                        .setup(
                            self.node_phase_status.clone(),
                            vec![self.core_phase_status.subscribe()],
                        )
                        .await;
                }
                SetupPhase::Wallet => {
                    let wallet_phase_setup =
                        Arc::new(WalletSetupPhase::new(app_handle.clone()).await);
                    wallet_phase_setup
                        .setup(
                            self.wallet_phase_status.clone(),
                            vec![
                                self.core_phase_status.subscribe(),
                                self.node_phase_status.subscribe(),
                            ],
                        )
                        .await;
                }
                SetupPhase::Unknown => {
                    let unknown_phase_setup =
                        Arc::new(UnknownSetupPhase::new(app_handle.clone()).await);
                    unknown_phase_setup
                        .setup(
                            self.unknown_phase_status.clone(),
                            vec![
                                self.core_phase_status.subscribe(),
                                self.node_phase_status.subscribe(),
                                self.hardware_phase_status.subscribe(),
                            ],
                        )
                        .await;
                }
            }
        }

        info!(target: LOG_TARGET, "Spawning unlock conditions");
        self.wait_for_unlock_conditions(app_handle.clone()).await;
    }

    pub async fn handle_switch_to_local_node(&self) {
        if let Some(app_handle) = self.app_handle.lock().await.clone() {
            info!(target: LOG_TARGET, "Handle Switching to Local Node in Setup Manager");
            self.lock_mining(app_handle.clone()).await;
            self.lock_wallet(app_handle.clone()).await;
            info!(target: LOG_TARGET, "Restarting Phases");
            // self.restart_phases(
            //     app_handle.clone(),
            //     vec![SetupPhase::Wallet, SetupPhase::Unknown],
            // )
            // .await;

            TasksTrackers::current().wallet_phase.close().await;
            TasksTrackers::current().wallet_phase.replace().await;
            let _unused = self.wallet_phase_status.send_replace(PhaseStatus::None);

            TasksTrackers::current().unknown_phase.close().await;
            TasksTrackers::current().unknown_phase.replace().await;
            let _unused = self.unknown_phase_status.send_replace(PhaseStatus::None);

            let wallet_phase_setup = Arc::new(WalletSetupPhase::new(app_handle.clone()).await);
            wallet_phase_setup
                .setup(
                    self.wallet_phase_status.clone(),
                    vec![
                        self.core_phase_status.subscribe(),
                        self.node_phase_status.subscribe(),
                    ],
                )
                .await;

            let unknown_phase_setup = Arc::new(UnknownSetupPhase::new(app_handle.clone()).await);
            unknown_phase_setup
                .setup(
                    self.unknown_phase_status.clone(),
                    vec![
                        self.core_phase_status.subscribe(),
                        self.node_phase_status.subscribe(),
                        self.hardware_phase_status.subscribe(),
                    ],
                )
                .await;
        } else {
            error!(target: LOG_TARGET, "Failed to reset phases after switching to Local Node: app_handle not defined");
        }
    }

    async fn unlock_app(&self, app_handle: AppHandle) {
        info!(target: LOG_TARGET, "Unlocking App");
        *self.is_app_unlocked.lock().await = true;
        let state = app_handle.state::<UniverseAppState>();
        let _unused = ReleaseNotes::current()
            .handle_release_notes_event_emit(state.clone(), app_handle.clone())
            .await;

        let state = app_handle.state::<UniverseAppState>();
        state.events_manager.handle_unlock_app(&app_handle).await;
    }

    async fn unlock_wallet(&self, app_handle: AppHandle) {
        info!(target: LOG_TARGET, "Unlocking Wallet");
        *self.is_wallet_unlocked.lock().await = true;
        let state = app_handle.state::<UniverseAppState>();
        state.events_manager.handle_unlock_wallet(&app_handle).await;
    }

    async fn unlock_mining(&self, app_handle: AppHandle) {
        info!(target: LOG_TARGET, "Unlocking Mining");
        *self.is_mining_unlocked.lock().await = true;
        let state = app_handle.state::<UniverseAppState>();
        state.events_manager.handle_unlock_mining(&app_handle).await;
    }

    async fn lock_mining(&self, app_handle: AppHandle) {
        info!(target: LOG_TARGET, "Locking Mining");
        *self.is_mining_unlocked.lock().await = false;
        let state = app_handle.state::<UniverseAppState>();
        state.events_manager.handle_lock_mining(&app_handle).await;
    }

    async fn lock_wallet(&self, app_handle: AppHandle) {
        info!(target: LOG_TARGET, "Locking Wallet");
        *self.is_wallet_unlocked.lock().await = false;
        let state = app_handle.state::<UniverseAppState>();
        state.events_manager.handle_lock_wallet(&app_handle).await;
    }

    async fn handle_setup_finished(&self, app_handle: AppHandle) {
        info!(target: LOG_TARGET, "Setup Finished");
        let _unused = initialize_frontend_updates(&app_handle).await;
    }
}
