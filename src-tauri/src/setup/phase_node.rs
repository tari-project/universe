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

use std::{collections::HashMap, time::Duration};

use crate::{
    binaries::{Binaries, BinaryResolver},
    configs::{config_core::ConfigCore, trait_config::ConfigImpl},
    events_emitter::EventsEmitter,
    events_manager::EventsManager,
    node::node_manager::{NodeManagerError, STOP_ON_ERROR_CODES},
    progress_trackers::{
        progress_plans::SetupStep,
        progress_stepper::{ProgressStepper, ProgressStepperBuilder},
    },
    setup::setup_manager::SetupPhase,
    tasks_tracker::TasksTrackers,
    wallet::minotari_wallet::MinotariWalletManager,
    UniverseAppState, LOG_TARGET_APP_LOGIC,
};
use anyhow::Error;
use log::{error, info, warn};
use tari_shutdown::ShutdownSignal;
use tauri::{AppHandle, Manager};
use tokio::{
    sync::{
        watch::{self, Sender},
        Mutex,
    },
    time::{interval, Interval},
};
use tokio_util::task::TaskTracker;

use super::{
    listeners::SetupFeaturesList,
    setup_manager::PhaseStatus,
    trait_setup_phase::{SetupConfiguration, SetupPhaseImpl},
    utils::{setup_default_adapter::SetupDefaultAdapter, timeout_watcher::TimeoutWatcher},
};

#[derive(Clone, Default)]
pub struct NodeSetupPhaseAppConfiguration {
    use_tor: bool,
    base_node_grpc_address: String,
}

pub struct NodeSetupPhase {
    app_handle: AppHandle,
    progress_stepper: Mutex<ProgressStepper>,
    setup_configuration: SetupConfiguration,
    status_sender: Sender<PhaseStatus>,
    #[allow(dead_code)]
    setup_features: SetupFeaturesList,
    timeout_watcher: TimeoutWatcher,
}

impl SetupPhaseImpl for NodeSetupPhase {
    type AppConfiguration = NodeSetupPhaseAppConfiguration;

    async fn new(
        app_handle: AppHandle,
        status_sender: Sender<PhaseStatus>,
        configuration: SetupConfiguration,
        setup_features: SetupFeaturesList,
    ) -> Self {
        let timeout_watcher = TimeoutWatcher::new(configuration.setup_timeout_duration);
        Self {
            app_handle: app_handle.clone(),
            progress_stepper: Mutex::new(Self::create_progress_stepper(
                app_handle,
                status_sender.clone(),
                timeout_watcher.get_sender(),
            )),
            setup_configuration: configuration,
            status_sender,
            setup_features,
            timeout_watcher,
        }
    }

    fn get_app_handle(&self) -> &AppHandle {
        &self.app_handle
    }

    fn get_status_sender(&self) -> &Sender<PhaseStatus> {
        &self.status_sender
    }

    async fn get_shutdown_signal(&self) -> ShutdownSignal {
        TasksTrackers::current().node_phase.get_signal().await
    }
    async fn get_task_tracker(&self) -> TaskTracker {
        TasksTrackers::current().node_phase.get_task_tracker().await
    }
    fn get_phase_dependencies(&self) -> Vec<tokio::sync::watch::Receiver<PhaseStatus>> {
        self.setup_configuration
            .listeners_for_required_phases_statuses
            .clone()
    }
    fn get_phase_id(&self) -> SetupPhase {
        SetupPhase::Node
    }
    fn get_timeout_watcher(&self) -> &TimeoutWatcher {
        &self.timeout_watcher
    }

    fn create_progress_stepper(
        app_handle: AppHandle,
        status_sender: Sender<PhaseStatus>,
        timeout_watcher_sender: Sender<u64>,
    ) -> ProgressStepper {
        ProgressStepperBuilder::new()
            .add_incremental_step(SetupStep::BinariesTor, true)
            .add_incremental_step(SetupStep::BinariesNode, true)
            .add_step(SetupStep::StartTor, true)
            .add_incremental_step(SetupStep::MigratingDatabase, true)
            .add_step(SetupStep::StartingNode, true)
            .add_incremental_step(SetupStep::StartingNode, true)
            .build(
                app_handle.clone(),
                timeout_watcher_sender,
                status_sender,
                SetupPhase::Node,
            )
    }

    async fn load_app_configuration() -> Result<Self::AppConfiguration, Error> {
        let config_core = ConfigCore::content().await;
        let use_tor = *config_core.use_tor();
        let base_node_grpc_address = config_core.remote_base_node_address().clone();

        Ok(NodeSetupPhaseAppConfiguration {
            use_tor,
            base_node_grpc_address,
        })
    }

    async fn setup(self) {
        SetupDefaultAdapter::setup(self).await;
    }

    #[allow(clippy::too_many_lines)]
    async fn setup_inner(&self) -> Result<(), Error> {
        let app_configuration = Self::load_app_configuration().await.unwrap_or_default();
        let (data_dir, config_dir, log_dir) = self.get_app_dirs()?;

        let state = self.app_handle.state::<UniverseAppState>();
        let node_type = state.node_manager.get_node_type().await;
        // Tor is not needed for a remote node
        let use_tor = app_configuration.use_tor && node_type.is_local();

        let binary_resolver = BinaryResolver::current();
        let mut progress_stepper = self.progress_stepper.lock().await;

        let tor_binary_progress_tracker =
            progress_stepper.track_step_incrementally(SetupStep::BinariesTor);
        // MacOS uses built-in libtor
        let skip_tor_binary = !use_tor || cfg!(target_os = "macos");

        progress_stepper
            .complete_step(SetupStep::BinariesTor, || async {
                if skip_tor_binary {
                    return Ok(());
                }
                binary_resolver
                    .initialize_binary(Binaries::Tor, tor_binary_progress_tracker)
                    .await
            })
            .await?;

        let node_binary_progress_tracker =
            progress_stepper.track_step_incrementally(SetupStep::BinariesNode);

        progress_stepper
            .complete_step(SetupStep::BinariesNode, || async {
                binary_resolver
                    .initialize_binary(Binaries::MinotariNode, node_binary_progress_tracker)
                    .await
            })
            .await?;

        progress_stepper
            .complete_step(SetupStep::StartTor, || async {
                if skip_tor_binary {
                    return Ok(());
                }
                state
                    .tor_manager
                    .ensure_started(data_dir.clone(), config_dir.clone(), log_dir.clone())
                    .await
            })
            .await?;

        progress_stepper.complete_step(SetupStep::StartingNode, || async {
            for _i in 0..2 {
                let tor_control_port = state.tor_manager.get_control_port().await?;
                match
                    state.node_manager.ensure_started(
                        data_dir.clone(),
                        config_dir.clone(),
                        log_dir.clone(),
                        use_tor,
                        tor_control_port,
                        Some(app_configuration.base_node_grpc_address.clone())
                    ).await
                {
                    Ok(_) => {
                        EventsManager::handle_node_type_update(&self.app_handle).await;
                        break;
                    }
                    Err(e) => {
                        if let NodeManagerError::ExitCode(code) = e {
                            if STOP_ON_ERROR_CODES.contains(&code) {
                                warn!(target: LOG_TARGET_APP_LOGIC, "Database for node is corrupt or needs a restart, deleting and trying again.");
                                state.node_manager.clean_data_folder(&data_dir).await?;
                                state.wallet_manager.clean_data_folder(&data_dir).await?;
                            }
                            continue;
                        }
                        if let NodeManagerError::UnknownError(error) = e {
                            warn!(target: LOG_TARGET_APP_LOGIC, "NodeManagerError::UnknownError({error:?}) needs a restart.");
                            continue;
                        }
                        error!(target: LOG_TARGET_APP_LOGIC, "Could not start node manager after restart: {e:?} | Exiting the app");
                        self.app_handle.exit(-1);
                        return Err(e.into());
                    }
                }
            }
            Ok(())
        }).await?;

        let migration_tracker =
            progress_stepper.track_step_incrementally(SetupStep::MigratingDatabase);
        progress_stepper
            .complete_step(SetupStep::MigratingDatabase, || async {
                if node_type.is_remote() {
                    return Ok(());
                }
                if let Some(tracker) = migration_tracker {
                    state
                        .node_manager
                        .wait_migration(Some(tracker))
                        .await
                        .map_err(|e| anyhow::anyhow!("Failed to wait for node migration: {e}"))?;
                }
                Ok(())
            })
            .await?;

        Ok(())
    }

    #[allow(clippy::too_many_lines)]
    async fn finalize_setup(&self) -> Result<(), Error> {
        let app_handle_clone: tauri::AppHandle = self.app_handle.clone();
        TasksTrackers::current()
            .node_phase.get_task_tracker().await
            .spawn(async move {
                let app_state = app_handle_clone.state::<UniverseAppState>().clone();
                let mut node_status_watch_rx = (*app_state.node_status_watch_rx).clone();
                let mut shutdown_signal = TasksTrackers::current().node_phase.get_signal().await;

                let init_node_status = *node_status_watch_rx.borrow();
                EventsEmitter::emit_base_node_update(init_node_status).await;

                let mut latest_updated_block_height = init_node_status.block_height;


                loop {
                    tokio::select! {
                _ = node_status_watch_rx.changed() => {
                    let node_status = *node_status_watch_rx.borrow();
                    let node_synced = node_status.is_synced;
                    let is_syncing = MinotariWalletManager::is_syncing().await;



                    if !is_syncing && node_synced && latest_updated_block_height == 0 {
                        latest_updated_block_height = node_status.block_height;
                    }

                    if node_status.block_height > latest_updated_block_height && !is_syncing && node_synced {
                        while latest_updated_block_height < node_status.block_height {
                            latest_updated_block_height += 1;
                        }
                        EventsEmitter::emit_new_block_mined(latest_updated_block_height).await;
                    }
                    EventsEmitter::emit_base_node_update(node_status).await;
                    if node_status.block_height > latest_updated_block_height && is_syncing {
                        latest_updated_block_height = node_status.block_height;
                    }
                },
                _ = shutdown_signal.wait() => {
                    break;
                },
            }
                }
            });

        let app_handle_clone: tauri::AppHandle = self.app_handle.clone();
        let mut shutdown_signal = TasksTrackers::current().node_phase.get_signal().await;
        let state: tauri::State<'_, UniverseAppState> =
            app_handle_clone.state::<UniverseAppState>();
        let node_type = state.node_manager.get_node_type().await;
        let app_configuration = Self::load_app_configuration().await.unwrap_or_default();
        let use_tor =
            app_configuration.use_tor && node_type.is_local() && !cfg!(target_os = "macos");

        if use_tor {
            let tor_guards = state.tor_manager.get_entry_guards().await;
            if let Ok(tor_guards) = tor_guards {
                EventsEmitter::emit_tor_entry_guards(tor_guards).await;
            }
        }

        let mut shutdown_signal_clone = shutdown_signal.clone();
        let app_handle_clone: tauri::AppHandle = self.app_handle.clone();
        if node_type.is_local() {
            TasksTrackers::current()
                .node_phase
                .get_task_tracker()
                .await
                .spawn(async move {
                    tokio::select! {
                        _ = wait_node_synced_with_progress(app_handle_clone) => {
                            info!(target: LOG_TARGET_APP_LOGIC, "wait_node_synced_with_progress completed")
                        },
                        _ = shutdown_signal_clone.wait() => {
                            info!(target: LOG_TARGET_APP_LOGIC, "wait_node_synced_with_progress stopped")
                        }
                    }
                });
        }

        let app_handle_clone: tauri::AppHandle = self.app_handle.clone();
        TasksTrackers::current()
            .node_phase
            .get_task_tracker()
            .await
            .spawn(async move {
                let mut interval: Interval = interval(Duration::from_secs(60));
                interval.set_missed_tick_behavior(tokio::time::MissedTickBehavior::Skip);

                loop {
                    tokio::select! {
                        _ = interval.tick() => {
                            let state = app_handle_clone.state::<UniverseAppState>().inner();
                            let check_if_orphan = state
                                .node_manager
                                .check_if_is_orphan_chain()
                                .await;
                            match check_if_orphan {
                                Ok(is_stuck) => {
                                    EventsEmitter::emit_stuck_on_orphan_chain(is_stuck).await;
                                }
                                Err(ref e) => {
                                    error!(target: LOG_TARGET_APP_LOGIC, "{e}");
                                }
                            }
                        },
                        _ = shutdown_signal.wait() => {
                            info!(target: LOG_TARGET_APP_LOGIC, "Stopping periodic orphan chain checks");
                            break;
                        }
                    }
                }
            });

        let progress_stepper = self.progress_stepper.lock().await;
        let setup_warnings = progress_stepper.get_setup_warnings();
        if setup_warnings.is_empty() {
            self.status_sender.send(PhaseStatus::Success)?;
        } else {
            self.status_sender
                .send(PhaseStatus::SuccessWithWarnings(setup_warnings.clone()))?;
        }

        Ok(())
    }
}

async fn wait_node_synced_with_progress(app_handle: tauri::AppHandle) -> Result<(), anyhow::Error> {
    let (progress_params_tx, mut progress_params_rx) =
        watch::channel(HashMap::<String, String>::new());
    let (progress_percentage_tx, progress_percentage_rx) = watch::channel(0f64);
    let mut shutdown_signal = TasksTrackers::current().node_phase.get_signal().await;

    let progress_handle = TasksTrackers::current()
            .node_phase
            .get_task_tracker()
            .await
            .spawn(async move {
                loop {
                    tokio::select! {
                        _ = progress_params_rx.changed() => {
                            let progress_params = progress_params_rx.borrow().clone();
                            let percentage = *progress_percentage_rx.borrow();
                            if let Some(step) = progress_params.get("step").cloned() {
                                EventsEmitter::emit_background_node_sync_update(progress_params.clone()).await;
                                if step == "Done" || (step == "Block" && percentage == 1.0) {
                                    break;
                                }
                            }
                        },
                        _ = shutdown_signal.wait() => {
                            break;
                        }
                    }
                }
            });

    let state = app_handle.state::<UniverseAppState>();
    let _unused = state
        .node_manager
        .wait_synced(&progress_params_tx, &progress_percentage_tx)
        .await
        .err();
    progress_handle.abort();
    let _unused = progress_handle.await;

    Ok(())
}
