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
    events_manager::EventsManager,
    node::node_manager::{NodeManagerError, STOP_ON_ERROR_CODES},
    progress_tracker_old::ProgressTracker,
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
use tauri::{AppHandle, Manager};
use tauri_plugin_sentry::sentry;
use tokio::{
    select,
    sync::{
        watch::{self, Receiver, Sender},
        Mutex,
    },
    time::{interval, Interval},
};

use super::{setup_manager::PhaseStatus, trait_setup_phase::SetupPhaseImpl};

static LOG_TARGET: &str = "tari::universe::phase_hardware";
const SETUP_TIMEOUT_DURATION: Duration = Duration::from_secs(60 * 10); // 10 Minutes

#[derive(Clone, Default)]
pub struct NodeSetupPhaseOutput {}

#[derive(Clone, Default)]
pub struct NodeSetupPhaseAppConfiguration {
    use_tor: bool,
    base_node_grpc_address: String,
}

pub struct NodeSetupPhase {
    app_handle: AppHandle,
    progress_stepper: Mutex<ProgressStepper>,
    app_configuration: NodeSetupPhaseAppConfiguration,
}

impl SetupPhaseImpl for NodeSetupPhase {
    type AppConfiguration = NodeSetupPhaseAppConfiguration;
    type SetupOutput = NodeSetupPhaseOutput;

    async fn new(app_handle: AppHandle) -> Self {
        Self {
            app_handle: app_handle.clone(),
            progress_stepper: Mutex::new(Self::create_progress_stepper(app_handle)),
            app_configuration: Self::load_app_configuration().await.unwrap_or_default(),
        }
    }

    fn get_app_handle(&self) -> &AppHandle {
        &self.app_handle
    }

    fn create_progress_stepper(app_handle: AppHandle) -> ProgressStepper {
        ProgressStepperBuilder::new()
            .add_step(ProgressPlans::Node(ProgressSetupNodePlan::BinariesTor))
            .add_step(ProgressPlans::Node(ProgressSetupNodePlan::BinariesNode))
            .add_step(ProgressPlans::Node(ProgressSetupNodePlan::StartTor))
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
            .build(app_handle.clone())
    }

    async fn load_app_configuration() -> Result<Self::AppConfiguration, Error> {
        let use_tor = *ConfigCore::content().await.use_tor();
        let base_node_grpc_address = ConfigCore::content()
            .await
            .remote_base_node_address()
            .clone();

        Ok(NodeSetupPhaseAppConfiguration {
            use_tor,
            base_node_grpc_address,
        })
    }

    async fn setup(
        self: std::sync::Arc<Self>,
        status_sender: Sender<PhaseStatus>,
        mut flow_subscribers: Vec<Receiver<PhaseStatus>>,
    ) {
        info!(target: LOG_TARGET, "[ {} Phase ] Starting setup", SetupPhase::Node);

        TasksTrackers::current().node_phase.get_task_tracker().await.spawn(async move {
            let setup_timeout = tokio::time::sleep(SETUP_TIMEOUT_DURATION);
            let mut shutdown_signal = TasksTrackers::current().node_phase.get_signal().await;
            for subscriber in &mut flow_subscribers.iter_mut() {
                select! {
                    _ = subscriber.wait_for(|value| value.is_success()) => {}
                    _ = shutdown_signal.wait() => {
                        warn!(target: LOG_TARGET, "[ {} Phase ] Setup cancelled", SetupPhase::Node);
                        return;
                    }
                }
            };
            tokio::select! {
                _ = setup_timeout => {
                    error!(target: LOG_TARGET, "[ {} Phase ] Setup timed out", SetupPhase::Node);
                    let error_message = format!("[ {} Phase ] Setup timed out", SetupPhase::Node);
                    sentry::capture_message(&error_message, sentry::Level::Error);
                    EventsManager::handle_critical_problem(&self.app_handle, Some(SetupPhase::Node.get_critical_problem_title()), Some(SetupPhase::Node.get_critical_problem_description()))
                        .await;
                }
                result = self.setup_inner() => {
                    match result {
                        Ok(payload) => {
                            info!(target: LOG_TARGET, "[ {} Phase ] Setup completed successfully", SetupPhase::Node);
                            let __unused = self.finalize_setup(status_sender,payload).await;
                        }
                        Err(error) => {
                            error!(target: LOG_TARGET, "[ {} Phase ] Setup failed with error: {:?}", SetupPhase::Node,error);
                            let error_message = format!("[ {} Phase ] Setup failed with error: {:?}", SetupPhase::Node,error);
                            sentry::capture_message(&error_message, sentry::Level::Error);
                            EventsManager
                                ::handle_critical_problem(&self.app_handle, Some(SetupPhase::Node.get_critical_problem_title()), Some(SetupPhase::Node.get_critical_problem_description()))
                                .await;
                        }
                    }
                }
                _ = shutdown_signal.wait() => {
                    warn!(target: LOG_TARGET, "[ {} Phase ] Setup cancelled", SetupPhase::Node);
                }
            };
        });
    }

    #[allow(clippy::too_many_lines)]
    async fn setup_inner(&self) -> Result<Option<NodeSetupPhaseOutput>, Error> {
        let mut progress_stepper = self.progress_stepper.lock().await;
        let (data_dir, config_dir, log_dir) = self.get_app_dirs()?;
        let state = self.app_handle.state::<UniverseAppState>();

        // TODO Remove once not needed
        let (tx, rx) = watch::channel("".to_string());
        let progress = ProgressTracker::new(self.app_handle.clone(), Some(tx));
        let binary_resolver = BinaryResolver::current().read().await;

        if self.app_configuration.use_tor && !cfg!(target_os = "macos") {
            tokio::time::sleep(Duration::from_secs(10)).await;
            progress_stepper
                .resolve_step(ProgressPlans::Node(ProgressSetupNodePlan::BinariesTor))
                .await;
            binary_resolver
                .initialize_binary_timeout(Binaries::Tor, progress.clone(), rx.clone())
                .await?;
        } else {
            progress_stepper.skip_step(ProgressPlans::Node(ProgressSetupNodePlan::BinariesTor));
        };

        progress_stepper
            .resolve_step(ProgressPlans::Node(ProgressSetupNodePlan::BinariesNode))
            .await;
        binary_resolver
            .initialize_binary_timeout(Binaries::MinotariNode, progress.clone(), rx.clone())
            .await?;

        if self.app_configuration.use_tor && !cfg!(target_os = "macos") {
            progress_stepper
                .resolve_step(ProgressPlans::Node(ProgressSetupNodePlan::StartTor))
                .await;
            state
                .tor_manager
                .ensure_started(data_dir.clone(), config_dir.clone(), log_dir.clone())
                .await?;
        }

        let tor_control_port = state.tor_manager.get_control_port().await?;
        progress_stepper
            .resolve_step(ProgressPlans::Node(ProgressSetupNodePlan::StartingNode))
            .await;

        info!(target: LOG_TARGET, "Starting node manager, grpc address: {}", self.app_configuration.base_node_grpc_address);

        // Note: it starts 2 processes of node
        for _i in 0..2 {
            match state
                .node_manager
                .ensure_started(
                    data_dir.clone(),
                    config_dir.clone(),
                    log_dir.clone(),
                    self.app_configuration.use_tor,
                    tor_control_port,
                    Some(self.app_configuration.base_node_grpc_address.clone()),
                    self.app_handle.clone(),
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
                        }
                        continue;
                    }
                    if let NodeManagerError::UnknownError(error) = e {
                        warn!(target: LOG_TARGET, "NodeManagerError::UnknownError({:?}) needs a restart.", error);
                        continue;
                    }
                    error!(target: LOG_TARGET, "Could not start node manager after restart: {:?} | Exitting the app", e);
                    self.app_handle.exit(-1);
                    return Err(e.into());
                }
            }
        }

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
            None,
        );

        TasksTrackers::current()
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
                                        warn!("Unknown step: {}", step);
                                        continue;
                                    }
                                };

                                if let Some(tracker) = tracker {
                                    tracker.send_update(progress_params.clone(), percentage).await;
                                    if step == "Block" && percentage == 1.0 {
                                        break;
                                    }
                                } else {
                                    warn!("Progress tracker not found for step: {}", step);
                                }
                                tokio::time::sleep(Duration::from_secs(1)).await;
                            }
                        },
                        _ = shutdown_signal.wait() => {
                            break;
                        }
                    }
                }
            });

        state
            .node_manager
            .wait_synced(&progress_params_tx, &progress_percentage_tx)
            .await?;

        Ok(None)
    }

    async fn finalize_setup(
        &self,
        sender: Sender<PhaseStatus>,
        _payload: Option<NodeSetupPhaseOutput>,
    ) -> Result<(), Error> {
        sender.send(PhaseStatus::Success).ok();
        self.progress_stepper
            .lock()
            .await
            .resolve_step(ProgressPlans::Node(ProgressSetupNodePlan::Done))
            .await;

        EventsManager::handle_node_phase_finished(&self.app_handle, true).await;

        let app_handle_clone: tauri::AppHandle = self.app_handle.clone();
        let mut shutdown_signal = TasksTrackers::current().node_phase.get_signal().await;
        TasksTrackers::current().node_phase.get_task_tracker().await.spawn(async move {
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
                                EventsManager::handle_stuck_on_orphan_chain(&app_handle_clone, is_stuck)
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

        Ok(())
    }
}
