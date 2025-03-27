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
    sync::{Arc, LazyLock},
    time::Duration,
};
use tauri::{AppHandle, Manager};
use tokio::{
    sync::Mutex,
    time::{interval, Interval},
};

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
        HardwareSetupPhase, HardwareSetupPhasePayload, HardwareSetupPhaseSessionConfiguration,
    },
    phase_local_node::{LocalNodeSetupPhase, LocalNodeSetupPhaseSessionConfiguration},
    // phase_remote_node::{RemoteNodeSetupPhase, RemoteNodeSetupPhaseSessionConfiguration},
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

#[derive(Getters, Setters)]

pub struct SetupManager {
    phase_statuses: HashMap<SetupPhase, bool>,
    #[getset(get = "pub", set = "pub")]
    hardware_status_output: Option<HardwareSetupPhasePayload>,
}

impl SetupManager {
    pub fn new() -> Self {
        let mut phase_statuses: HashMap<SetupPhase, bool> = HashMap::new();
        phase_statuses.insert(SetupPhase::Core, false);
        phase_statuses.insert(SetupPhase::Wallet, false);
        phase_statuses.insert(SetupPhase::Hardware, false);
        phase_statuses.insert(SetupPhase::LocalNode, false);
        phase_statuses.insert(SetupPhase::RemoteNode, false);
        Self {
            phase_statuses,
            hardware_status_output: None,
        }
    }

    pub fn get_instance() -> &'static LazyLock<Mutex<SetupManager>> {
        &INSTANCE
    }

    pub async fn start_setup(&self, app_handle: AppHandle) {
        let mut core_phase_setup = CoreSetupPhase::new();
        let _unused = core_phase_setup
            .load_configuration(CoreSetupPhaseSessionConfiguration {})
            .await;
        core_phase_setup
            .create_progress_stepper(Some(app_handle.clone()))
            .await;
        let core_phase_setup = Arc::new(core_phase_setup);
        core_phase_setup.setup(app_handle.clone()).await;
    }

    pub async fn spawn_first_batch_of_setup_phases(&self, app_handle: AppHandle) {
        let mut hardware_phase_setup = HardwareSetupPhase::new();
        let _unused = hardware_phase_setup
            .load_configuration(HardwareSetupPhaseSessionConfiguration {})
            .await;
        hardware_phase_setup.create_progress_stepper(None).await;
        let hardware_phase_setup = Arc::new(hardware_phase_setup);
        hardware_phase_setup.setup(app_handle.clone()).await;

        let mut local_node_phase_setup = LocalNodeSetupPhase::new();
        let _unused = local_node_phase_setup
            .load_configuration(LocalNodeSetupPhaseSessionConfiguration {})
            .await;
        local_node_phase_setup
            .create_progress_stepper(Some(app_handle.clone()))
            .await;
        let local_node_phase_setup = Arc::new(local_node_phase_setup);
        local_node_phase_setup.setup(app_handle.clone()).await;

        // let mut remote_node_phase_setup = RemoteNodeSetupPhase::new();
        // let _unused = remote_node_phase_setup
        //     .load_configuration(RemoteNodeSetupPhaseSessionConfiguration {})
        //     .await;
        // let remote_node_phase_setup = Arc::new(remote_node_phase_setup);
        // remote_node_phase_setup.setup(app_handle.clone()).await;
    }

    pub async fn spawn_second_batch_of_setup_phases(&self, app_handle: AppHandle) {
        let mut wallet_phase_setup = WalletSetupPhase::new();
        let _unused = wallet_phase_setup
            .load_configuration(WalletSetupPhaseSessionConfiguration {})
            .await;
        wallet_phase_setup.create_progress_stepper(None).await;
        let wallet_phase_setup = Arc::new(wallet_phase_setup);
        wallet_phase_setup.setup(app_handle.clone()).await;

        let mut unknown_phase_setup = UnknownSetupPhase::new();
        let cpu_benchmarked_hashrate = self
            .hardware_status_output
            .clone()
            .unwrap_or_default()
            .cpu_benchmarked_hashrate;
        let _unused = unknown_phase_setup
            .load_configuration(UnknownSetupPhaseSessionConfiguration {
                cpu_benchmarked_hashrate,
            })
            .await;
        unknown_phase_setup.create_progress_stepper(None).await;
        let unknown_phase_setup = Arc::new(unknown_phase_setup);
        unknown_phase_setup.setup(app_handle.clone()).await;
    }

    pub async fn handle_start_setup_callbacks(
        &mut self,
        app_handle: AppHandle,
        phase: SetupPhase,
        status: bool,
    ) {
        self.phase_statuses.insert(phase, status);

        let core_phase_status = *self.phase_statuses.get(&SetupPhase::Core).unwrap_or(&false);
        if core_phase_status {
            self.spawn_first_batch_of_setup_phases(app_handle.clone())
                .await;
        };
    }

    pub async fn handle_first_batch_callbacks(
        &mut self,
        app_handle: AppHandle,
        phase: SetupPhase,
        status: bool,
    ) {
        self.phase_statuses.insert(phase, status);

        let hardware_phase_status = *self
            .phase_statuses
            .get(&SetupPhase::Hardware)
            .unwrap_or(&false);
        let local_node_phase_status = *self
            .phase_statuses
            .get(&SetupPhase::LocalNode)
            .unwrap_or(&false);
        let remote_node_phase_status = *self
            .phase_statuses
            .get(&SetupPhase::RemoteNode)
            .unwrap_or(&false);

        if local_node_phase_status || remote_node_phase_status {
            self.unlock_app(app_handle.clone()).await;
        }

        if hardware_phase_status && (local_node_phase_status || remote_node_phase_status) {
            self.spawn_second_batch_of_setup_phases(app_handle.clone())
                .await;
        }
    }

    pub async fn handle_second_batch_callbacks(
        &mut self,
        app_handle: AppHandle,
        phase: SetupPhase,
        status: bool,
    ) {
        self.phase_statuses.insert(phase, status);

        let wallet_phase_status = *self
            .phase_statuses
            .get(&SetupPhase::Wallet)
            .unwrap_or(&false);
        let unknown_phase_status = *self
            .phase_statuses
            .get(&SetupPhase::Unknown)
            .unwrap_or(&false);

        if unknown_phase_status {
            self.unlock_mining(app_handle.clone()).await;
        }

        if wallet_phase_status {
            self.unlock_wallet(app_handle.clone()).await;
        }

        if wallet_phase_status && unknown_phase_status {
            // todo move it out from here
            let state = app_handle.state::<UniverseAppState>();
            let _unused = initialize_frontend_updates(&app_handle).await;

            let app_handle_clone: tauri::AppHandle = app_handle.clone();
            let mut shutdown_signal = state.shutdown.to_signal();
            TasksTracker::current().spawn(async move {
        let mut interval: Interval = interval(Duration::from_secs(30));
        let mut has_send_error = false;

        loop {
            tokio::select! {
                _ = interval.tick() => {
                    let state = app_handle_clone.state::<UniverseAppState>().inner();
                    let check_if_orphan = state
                        .node_manager
                        .check_if_is_orphan_chain(!has_send_error)
                        .await;
                    match check_if_orphan {
                        Ok(is_stuck) => {
                            if is_stuck {
                                error!(target: LOG_TARGET, "Miner is stuck on orphan chain");
                            }
                            if is_stuck && !has_send_error {
                                has_send_error = true;
                            }
                            state
                        .events_manager
                        .handle_stuck_on_orphan_chain(&app_handle_clone, is_stuck)
                        .await;
                        }
                        Err(ref e) => {
                            error!(target: LOG_TARGET, "{}", e);
                        }
                    }
                },
                _ = shutdown_signal.wait() => {
                    info!(target: LOG_TARGET, "Stopping periodic orphan chain checks");
                    break;
                }
            }
        }
    });

            let app_handle_clone: tauri::AppHandle = app_handle.clone();
            tauri::async_runtime::spawn(async move {
                let mut receiver = SystemStatus::current().get_sleep_mode_watcher();
                let mut last_state = *receiver.borrow();
                loop {
                    if receiver.changed().await.is_ok() {
                        let current_state = *receiver.borrow();

                        if last_state && !current_state {
                            info!(target: LOG_TARGET, "System is no longer in sleep mode");
                            let _unused = resume_all_processes(app_handle_clone.clone()).await;
                        }

                        if !last_state && current_state {
                            info!(target: LOG_TARGET, "System entered sleep mode");
                            TasksTracker::stop_all_processes(app_handle_clone.clone()).await;
                        }

                        last_state = current_state;
                    } else {
                        error!(target: LOG_TARGET, "Failed to receive sleep mode change");
                    }
                }
            });

            let _unused = ReleaseNotes::current()
                .handle_release_notes_event_emit(state.clone(), app_handle.clone())
                .await;
        }
    }

    async fn unlock_app(&self, app_handle: AppHandle) {
        let state = app_handle.state::<UniverseAppState>();
        state.events_manager.handle_unlock_app(&app_handle).await;
    }

    async fn unlock_wallet(&self, app_handle: AppHandle) {
        let state = app_handle.state::<UniverseAppState>();
        state.events_manager.handle_unlock_wallet(&app_handle).await;
    }

    async fn unlock_mining(&self, app_handle: AppHandle) {
        let state = app_handle.state::<UniverseAppState>();
        state.events_manager.handle_unlock_mining(&app_handle).await;
    }
}
