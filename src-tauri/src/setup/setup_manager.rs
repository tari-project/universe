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

use getset::{Getters, Setters};
use log::{error, info};
use std::{
    collections::HashMap,
    fmt::{Display, Formatter},
    sync::{Arc, LazyLock},
    time::Duration,
};
use tauri::{AppHandle, Manager};
use tokio::{
    sync::{watch::Sender, Mutex},
    time::{interval, Interval},
};
use tokio_util::task::TaskTracker;

use crate::{
    initialize_frontend_updates,
    release_notes::ReleaseNotes,
    tasks_tracker::TasksTracker,
    utils::{shutdown_utils::resume_all_processes, system_status::SystemStatus},
    UniverseAppState,
};

use super::{
    phase_core::{CoreSetupPhase, CoreSetupPhaseSessionConfiguration},
    phase_hardware::{
        HardwareSetupPhase, HardwareSetupPhaseOutput, HardwareSetupPhaseSessionConfiguration,
    },
    phase_local_node::{LocalNodeSetupPhase, LocalNodeSetupPhaseSessionConfiguration},
    phase_remote_node::{RemoteNodeSetupPhase, RemoteNodeSetupPhaseSessionConfiguration},
    phase_unknown::{UnknownSetupPhase, UnknownSetupPhaseSessionConfiguration},
    phase_wallet::{WalletSetupPhase, WalletSetupPhaseSessionConfiguration},
    trait_setup_phase::SetupPhaseImpl,
};

static LOG_TARGET: &str = "tari::universe::setup_manager";

static INSTANCE: LazyLock<Mutex<SetupManager>> = LazyLock::new(|| Mutex::new(SetupManager::new()));

#[derive(Clone, PartialEq, Eq, Hash)]
pub enum SetupPhase {
    Core,
    Wallet,
    Hardware,
    LocalNode,
    RemoteNode,
    Unknown,
}

impl Display for SetupPhase {
    fn fmt(&self, f: &mut Formatter<'_>) -> Result<(), std::fmt::Error> {
        match self {
            SetupPhase::Core => write!(f, "Core"),
            SetupPhase::Wallet => write!(f, "Wallet"),
            SetupPhase::Hardware => write!(f, "Hardware"),
            SetupPhase::LocalNode => write!(f, "Local Node"),
            SetupPhase::RemoteNode => write!(f, "Remote Node"),
            SetupPhase::Unknown => write!(f, "Unknown"),
        }
    }
}

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
    local_node_phase_status: Sender<PhaseStatus>,
    remote_node_phase_status: Sender<PhaseStatus>,
    wallet_phase_status: Sender<PhaseStatus>,
    unknown_phase_status: Sender<PhaseStatus>,
    is_app_unlocked: Mutex<bool>,
    is_wallet_unlocked: Mutex<bool>,
    is_mining_unlocked: Mutex<bool>,
    pub hardware_phase_output: Sender<HardwareSetupPhaseOutput>,
}

impl SetupManager {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn get_instance() -> &'static LazyLock<Mutex<SetupManager>> {
        &INSTANCE
    }

    pub async fn start_setup(&self, app_handle: AppHandle) {
        // UnknownSetupPhaseSessionConfiguration {
        //     cpu_benchmarked_hashrate: self
        //         .hardware_status_output
        //         .clone()
        //         .unwrap_or_default()
        //         .cpu_benchmarked_hashrate,
        // },

        let core_phase_setup = Arc::new(CoreSetupPhase::new(app_handle.clone()).await);
        let hardware_phase_setup = Arc::new(HardwareSetupPhase::new(app_handle.clone()).await);
        let local_node_phase_setup = Arc::new(LocalNodeSetupPhase::new(app_handle.clone()).await);
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
        local_node_phase_setup
            .setup(
                self.local_node_phase_status.clone(),
                vec![self.core_phase_status.subscribe()],
            )
            .await;
        wallet_phase_setup
            .setup(
                self.wallet_phase_status.clone(),
                vec![
                    self.core_phase_status.subscribe(),
                    self.local_node_phase_status.subscribe(),
                ],
            )
            .await;
        unknown_phase_setup
            .setup(
                self.unknown_phase_status.clone(),
                vec![
                    self.core_phase_status.subscribe(),
                    self.local_node_phase_status.subscribe(),
                    self.hardware_phase_status.subscribe(),
                ],
            )
            .await;
    }

    pub async fn wait_for_unlock_conditions(&self, app_handle: AppHandle) {
        let core_phase_status_subscriber = self.core_phase_status.subscribe();
        let hardware_phase_status_subscriber = self.hardware_phase_status.subscribe();
        let local_node_phase_status_subscriber = self.local_node_phase_status.subscribe();
        let wallet_phase_status_subscriber = self.wallet_phase_status.subscribe();
        let unknown_phase_status_subscriber = self.unknown_phase_status.subscribe();

        TasksTracker::current().spawn(async move {
            let setup_manager = SetupManager::get_instance().lock().await;
            loop {
                // Todo change it to use tokio stream and listien to changes on receivers
                tokio::time::sleep(Duration::from_secs(1)).await;
                info!(target: LOG_TARGET, "Waiting for unlock app conditions");
                let is_app_unlocked = setup_manager.is_app_unlocked.lock().await.clone();
                let is_wallet_unlocked = setup_manager.is_wallet_unlocked.lock().await.clone();
                let is_mining_unlocked = setup_manager.is_mining_unlocked.lock().await.clone();

                let core_phase_status = core_phase_status_subscriber.borrow().is_success();
                let hardware_phase_status = hardware_phase_status_subscriber.borrow().is_success();
                let local_node_phase_status =
                    local_node_phase_status_subscriber.borrow().is_success();
                let unknown_phase_status = unknown_phase_status_subscriber.borrow().is_success();
                let wallet_phase_status = wallet_phase_status_subscriber.borrow().is_success();

                if core_phase_status
                    && hardware_phase_status
                    && local_node_phase_status
                    && unknown_phase_status
                    && !is_app_unlocked
                {
                    setup_manager.unlock_app(app_handle.clone()).await;
                }

                if core_phase_status
                    && hardware_phase_status
                    && local_node_phase_status
                    && unknown_phase_status
                    && !is_mining_unlocked
                {
                    setup_manager.unlock_mining(app_handle.clone()).await;
                }

                if core_phase_status
                    && local_node_phase_status
                    && unknown_phase_status
                    && wallet_phase_status
                    && !is_wallet_unlocked
                {
                    setup_manager.unlock_wallet(app_handle.clone()).await;
                }

                if is_app_unlocked && is_wallet_unlocked && is_mining_unlocked {
                    setup_manager
                        .handle_setup_finished(app_handle.clone())
                        .await;
                    break;
                }
            }
        });
    }

    async fn unlock_app(&self, app_handle: AppHandle) {
        *self.is_app_unlocked.lock().await = true;
        let state = app_handle.state::<UniverseAppState>();
        let _unused = ReleaseNotes::current()
            .handle_release_notes_event_emit(state.clone(), app_handle.clone())
            .await;

        let state = app_handle.state::<UniverseAppState>();
        state.events_manager.handle_unlock_app(&app_handle).await;
    }

    async fn unlock_wallet(&self, app_handle: AppHandle) {
        *self.is_wallet_unlocked.lock().await = true;
        let state = app_handle.state::<UniverseAppState>();
        state.events_manager.handle_unlock_wallet(&app_handle).await;
    }

    async fn unlock_mining(&self, app_handle: AppHandle) {
        *self.is_mining_unlocked.lock().await = true;
        let state = app_handle.state::<UniverseAppState>();
        state.events_manager.handle_unlock_mining(&app_handle).await;
    }

    async fn handle_setup_finished(&self, app_handle: AppHandle) {
        let _unused = initialize_frontend_updates(&app_handle).await;
    }
}
