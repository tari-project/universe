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
        progress_plans::{ProgressPlans, ProgressSetupNodePlan},
        progress_stepper::ProgressStepperBuilder,
        ProgressStepper,
    },
    setup::setup_manager::SetupPhase,
    tasks_tracker::TasksTrackers,
    UniverseAppState,
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

static LOG_TARGET: &str = "tari::universe::phase_hardware";

#[derive(Clone, Default)]
pub struct NodeSetupPhaseAppConfiguration {
    use_tor: bool,
    base_node_grpc_address: String,
}

pub struct NodeSetupPhase {
    app_handle: AppHandle,
    progress_stepper: Mutex<ProgressStepper>,
    app_configuration: NodeSetupPhaseAppConfiguration,
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
                timeout_watcher.get_sender(),
            )),
            app_configuration: Self::load_app_configuration().await.unwrap_or_default(),
            setup_configuration: configuration,
            status_sender,
            setup_features,
            timeout_watcher,
        }
    }

    fn get_app_handle(&self) -> &AppHandle {
        &self.app_handle
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
        timeout_watcher_sender: Sender<u64>,
    ) -> ProgressStepper {
        ProgressStepperBuilder::new()
            .add_step(ProgressPlans::Node(ProgressSetupNodePlan::BinariesTor))
            .add_step(ProgressPlans::Node(ProgressSetupNodePlan::BinariesNode))
            .add_step(ProgressPlans::Node(ProgressSetupNodePlan::BinariesWallet))
            .add_step(ProgressPlans::Node(
                ProgressSetupNodePlan::BinariesMergeMiningProxy,
            ))
            .add_step(ProgressPlans::Node(ProgressSetupNodePlan::StartTor))
            .add_step(ProgressPlans::Node(
                ProgressSetupNodePlan::MigratingDatabase,
            ))
            .add_step(ProgressPlans::Node(ProgressSetupNodePlan::StartingNode))
            .add_step(ProgressPlans::Node(
                ProgressSetupNodePlan::WaitingForInitialSync,
            ))
            .add_step(ProgressPlans::Node(
                ProgressSetupNodePlan::WaitingForHeaderSync,
            ))
            .add_step(ProgressPlans::Node(
                ProgressSetupNodePlan::WaitingForBlockSync,
            ))
            .add_step(ProgressPlans::Node(ProgressSetupNodePlan::Done))
            .build(app_handle.clone(), timeout_watcher_sender)
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
        let _unused = SetupDefaultAdapter::setup(self).await;
    }

    #[allow(clippy::too_many_lines)]
    async fn setup_inner(&self) -> Result<(), Error> {
        let (data_dir, config_dir, log_dir) = self.get_app_dirs()?;
        let state = self.app_handle.state::<UniverseAppState>();
        let node_type = state.node_manager.get_node_type().await;
        log::info!(target: LOG_TARGET, "Phase Node Setup for {node_type:?}");

        let binary_resolver = BinaryResolver::current();
        let mut progress_stepper = self.progress_stepper.lock().await;

        if self.app_configuration.use_tor && node_type.is_local() && !cfg!(target_os = "macos") {
            let tor_binary_progress_tracker = progress_stepper.channel_step_range_updates(
                ProgressPlans::Node(ProgressSetupNodePlan::BinariesTor),
                Some(ProgressPlans::Node(ProgressSetupNodePlan::BinariesNode)),
            );
            binary_resolver
                .initialize_binary(Binaries::Tor, tor_binary_progress_tracker)
                .await?;
        } else {
            progress_stepper.skip_step(ProgressPlans::Node(ProgressSetupNodePlan::BinariesTor));
        };

        if node_type.is_local() {
            let node_binary_progress_tracker = progress_stepper.channel_step_range_updates(
                ProgressPlans::Node(ProgressSetupNodePlan::BinariesNode),
                Some(ProgressPlans::Node(ProgressSetupNodePlan::BinariesWallet)),
            );
            binary_resolver
                .initialize_binary(Binaries::MinotariNode, node_binary_progress_tracker)
                .await?;
        } else {
            info!(target: LOG_TARGET, "Skipping node binary installation for remote node");
            progress_stepper.skip_step(ProgressPlans::Node(ProgressSetupNodePlan::BinariesNode));
        }

        let wallet_binary_progress_tracker = progress_stepper.channel_step_range_updates(
            ProgressPlans::Node(ProgressSetupNodePlan::BinariesWallet),
            Some(ProgressPlans::Node(
                ProgressSetupNodePlan::BinariesMergeMiningProxy,
            )),
        );

        binary_resolver
            .initialize_binary(Binaries::Wallet, wallet_binary_progress_tracker)
            .await?;

        let mmproxy_binary_progress_tracker = progress_stepper.channel_step_range_updates(
            ProgressPlans::Node(ProgressSetupNodePlan::BinariesMergeMiningProxy),
            Some(ProgressPlans::Node(ProgressSetupNodePlan::StartTor)),
        );

        binary_resolver
            .initialize_binary(Binaries::MergeMiningProxy, mmproxy_binary_progress_tracker)
            .await?;

        if self.app_configuration.use_tor && node_type.is_local() && !cfg!(target_os = "macos") {
            progress_stepper
                .resolve_step(ProgressPlans::Node(ProgressSetupNodePlan::StartTor))
                .await;
            state
                .tor_manager
                .ensure_started(data_dir.clone(), config_dir.clone(), log_dir.clone())
                .await?;
        }

        // Set up migration progress tracking
        let migration_tracker = progress_stepper.channel_step_range_updates(
            ProgressPlans::Node(ProgressSetupNodePlan::MigratingDatabase),
            Some(ProgressPlans::Node(ProgressSetupNodePlan::StartingNode)),
        );

        progress_stepper
            .resolve_step(ProgressPlans::Node(
                ProgressSetupNodePlan::MigratingDatabase,
            ))
            .await;

        for _i in 0..2 {
            let tor_control_port = state.tor_manager.get_control_port().await?;
            info!(target: LOG_TARGET, "Starting node manager, grpc address: {}", self.app_configuration.base_node_grpc_address);
            match state
                .node_manager
                .ensure_started(
                    data_dir.clone(),
                    config_dir.clone(),
                    log_dir.clone(),
                    self.app_configuration.use_tor,
                    tor_control_port,
                    Some(self.app_configuration.base_node_grpc_address.clone()),
                    migration_tracker.clone(),
                )
                .await
            {
                Ok(_) => {
                    EventsManager::handle_node_type_update(&self.app_handle).await;
                    break;
                }
                Err(e) => {
                    if let NodeManagerError::ExitCode(code) = e {
                        if STOP_ON_ERROR_CODES.contains(&code) {
                            warn!(target: LOG_TARGET, "Database for node is corrupt or needs a restart, deleting and trying again.");
                            state.node_manager.clean_data_folder(&data_dir).await?;
                            state.wallet_manager.clean_data_folder(&data_dir).await?;
                        }
                        continue;
                    }
                    if let NodeManagerError::UnknownError(error) = e {
                        warn!(target: LOG_TARGET, "NodeManagerError::UnknownError({error:?}) needs a restart.");
                        continue;
                    }
                    error!(target: LOG_TARGET, "Could not start node manager after restart: {e:?} | Exitting the app");
                    self.app_handle.exit(-1);
                    return Err(e.into());
                }
            }
        }

        progress_stepper
            .resolve_step(ProgressPlans::Node(ProgressSetupNodePlan::StartingNode))
            .await;

        if node_type.is_local() {
            self.wait_node_synced_with_progress(progress_stepper)
                .await?;
        } else {
            info!(target: LOG_TARGET, "Skipping syncing condition for remote node");
            // Assume remote node is already synced
            progress_stepper.skip_step(ProgressPlans::Node(
                ProgressSetupNodePlan::WaitingForInitialSync,
            ));
            progress_stepper.skip_step(ProgressPlans::Node(
                ProgressSetupNodePlan::WaitingForHeaderSync,
            ));
            progress_stepper.skip_step(ProgressPlans::Node(
                ProgressSetupNodePlan::WaitingForBlockSync,
            ));
        }

        Ok(())
    }

    async fn finalize_setup(&self) -> Result<(), Error> {
        self.status_sender.send(PhaseStatus::Success).ok();
        self.progress_stepper
            .lock()
            .await
            .resolve_step(ProgressPlans::Node(ProgressSetupNodePlan::Done))
            .await;

        EventsEmitter::emit_node_phase_finished(true).await;

        let app_handle_clone: tauri::AppHandle = self.app_handle.clone();
        let mut shutdown_signal = TasksTrackers::current().node_phase.get_signal().await;

        TasksTrackers::current().common.get_task_tracker().await.spawn(async move {
        let app_state = app_handle_clone.state::<UniverseAppState>().clone();

        let mut node_status_watch_rx = (*app_state.node_status_watch_rx).clone();
        let mut shutdown_signal = TasksTrackers::current().common.get_signal().await;

        let init_node_status = *node_status_watch_rx.borrow();
        EventsEmitter::emit_base_node_update(init_node_status).await;

        let mut latest_updated_block_height = init_node_status.block_height;
        loop {
            tokio::select! {
                _ = node_status_watch_rx.changed() => {
                    let node_status = *node_status_watch_rx.borrow();
                    let initial_sync_finished = app_state.wallet_manager.is_initial_scan_completed();

                    if node_status.block_height > latest_updated_block_height && initial_sync_finished {
                        while latest_updated_block_height < node_status.block_height {
                            latest_updated_block_height += 1;
                            let _ = EventsManager::handle_new_block_height(&app_handle_clone, latest_updated_block_height).await;
                        }
                    }
                    if node_status.block_height > latest_updated_block_height && !initial_sync_finished {
                        EventsEmitter::emit_base_node_update(node_status).await;
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
        TasksTrackers::current()
            .node_phase
            .get_task_tracker()
            .await
            .spawn(async move {
                let mut interval: Interval = interval(Duration::from_secs(30));
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
                                    error!(target: LOG_TARGET, "{e}");
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

        let app_handle_clone: tauri::AppHandle = self.app_handle.clone();
        TasksTrackers::current().node_phase.get_task_tracker().await.spawn(async move {
        let app_state = app_handle_clone.state::<UniverseAppState>().clone();
        let mut shutdown_signal = TasksTrackers::current().node_phase.get_signal().await;
        let mut interval = interval(Duration::from_secs(10));
        interval.set_missed_tick_behavior(tokio::time::MissedTickBehavior::Skip);

        loop {
            tokio::select! {
                _ = interval.tick() => {
                    if let Ok(connected_peers) = app_state
                        .node_manager
                        .list_connected_peers()
                        .await {
                            EventsEmitter::emit_connected_peers_update(connected_peers.clone()).await;
                        } else {
                            let err_msg = "Error getting connected peers";
                            error!(target: LOG_TARGET, "{err_msg}");
                        }
                },
                _ = shutdown_signal.wait() => {
                    break;
                },
            }
        }
    });

        Ok(())
    }
}

impl NodeSetupPhase {
    async fn wait_node_synced_with_progress(
        &self,
        mut progress_stepper: tokio::sync::MutexGuard<'_, ProgressStepper>,
    ) -> Result<(), anyhow::Error> {
        let (progress_params_tx, mut progress_params_rx) =
            watch::channel(HashMap::<String, String>::new());
        let (progress_percentage_tx, progress_percentage_rx) = watch::channel(0f64);
        let mut shutdown_signal = TasksTrackers::current().node_phase.get_signal().await;

        let wait_for_initial_sync_tracker = progress_stepper.channel_step_range_updates(
            ProgressPlans::Node(ProgressSetupNodePlan::WaitingForInitialSync),
            Some(ProgressPlans::Node(
                ProgressSetupNodePlan::WaitingForHeaderSync,
            )),
        );
        let wait_for_header_sync_tracker = progress_stepper.channel_step_range_updates(
            ProgressPlans::Node(ProgressSetupNodePlan::WaitingForHeaderSync),
            Some(ProgressPlans::Node(
                ProgressSetupNodePlan::WaitingForBlockSync,
            )),
        );
        let wait_for_block_sync_tracker = progress_stepper.channel_step_range_updates(
            ProgressPlans::Node(ProgressSetupNodePlan::WaitingForBlockSync),
            Some(ProgressPlans::Node(ProgressSetupNodePlan::Done)),
        );

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
                                let tracker = match step.as_str() {
                                    "Startup" => &wait_for_initial_sync_tracker,
                                    "Header" => &wait_for_header_sync_tracker,
                                    "Block" => &wait_for_block_sync_tracker,
                                    _ => {
                                        warn!("Unknown step: {step}");
                                        continue;
                                    }
                                };

                                if let Some(tracker) = tracker {
                                    tracker.send_update(progress_params.clone(), percentage).await;
                                    if step == "Block" && percentage == 1.0 {
                                        break;
                                    }
                                } else {
                                    warn!("Progress tracker not found for step: {step}");
                                }
                            }
                            tokio::time::sleep(Duration::from_secs(1)).await;
                        },
                        _ = shutdown_signal.wait() => {
                            break;
                        }
                    }
                }
            });

        let state = self.app_handle.state::<UniverseAppState>();
        state
            .node_manager
            .wait_synced(&progress_params_tx, &progress_percentage_tx)
            .await?;
        progress_handle.abort();
        let _unused = progress_handle.await;

        Ok(())
    }
}
