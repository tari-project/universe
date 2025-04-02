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

use std::time::Duration;

use crate::{
    configs::{config_core::ConfigCore, trait_config::ConfigImpl},
    node_manager::{NodeManagerError, STOP_ON_ERROR_CODES},
    progress_trackers::{
        progress_plans::{ProgressPlans, ProgressSetupLocalNodePlan},
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
        watch::{Receiver, Sender},
        Mutex,
    },
    time::{interval, Interval},
};

use super::{setup_manager::PhaseStatus, trait_setup_phase::SetupPhaseImpl};

static LOG_TARGET: &str = "tari::universe::phase_hardware";
const SETUP_TIMEOUT_DURATION: Duration = Duration::from_secs(60 * 10); // 10 Minutes

#[derive(Clone, Default)]
pub struct LocalNodeSetupPhaseOutput {}

#[derive(Clone, Default)]
pub struct LocalNodeSetupPhaseAppConfiguration {
    use_tor: bool,
    base_node_grpc_address: String,
}

pub struct LocalNodeSetupPhase {
    app_handle: AppHandle,
    progress_stepper: Mutex<ProgressStepper>,
    app_configuration: LocalNodeSetupPhaseAppConfiguration,
}

impl SetupPhaseImpl for LocalNodeSetupPhase {
    type AppConfiguration = LocalNodeSetupPhaseAppConfiguration;
    type SetupOutput = LocalNodeSetupPhaseOutput;

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
            .add_step(ProgressPlans::LocalNode(
                ProgressSetupLocalNodePlan::StartingLocalNode,
            ))
            .add_step(ProgressPlans::LocalNode(
                ProgressSetupLocalNodePlan::WaitingForInitialSync,
            ))
            .add_step(ProgressPlans::LocalNode(
                ProgressSetupLocalNodePlan::WaitingForHeaderSync,
            ))
            .add_step(ProgressPlans::LocalNode(
                ProgressSetupLocalNodePlan::WaitingForBlockSync,
            ))
            .add_step(ProgressPlans::LocalNode(ProgressSetupLocalNodePlan::Done))
            .build(app_handle.clone())
    }

    async fn load_app_configuration() -> Result<Self::AppConfiguration, Error> {
        let use_tor = *ConfigCore::current().lock().await.get_content().use_tor();
        let base_node_grpc_address = ConfigCore::current()
            .lock()
            .await
            .get_content()
            .remote_base_node_address()
            .clone();

        Ok(LocalNodeSetupPhaseAppConfiguration {
            use_tor,
            base_node_grpc_address,
        })
    }

    async fn setup(
        self: std::sync::Arc<Self>,
        status_sender: Sender<PhaseStatus>,
        mut flow_subscribers: Vec<Receiver<PhaseStatus>>,
    ) {
        info!(target: LOG_TARGET, "[ {} Phase ] Starting setup", SetupPhase::LocalNode);

        TasksTrackers::current().node_phase.get_task_tracker().await.spawn(async move {
            let setup_timeout = tokio::time::sleep(SETUP_TIMEOUT_DURATION);
            let mut shutdown_signal = TasksTrackers::current().node_phase.get_signal().await;
            for subscriber in &mut flow_subscribers.iter_mut() {
                select! {
                    _ = subscriber.wait_for(|value| value.is_success()) => {}
                    _ = shutdown_signal.wait() => {
                        warn!(target: LOG_TARGET, "[ {} Phase ] Setup cancelled", SetupPhase::LocalNode);
                        return;
                    }
                }
            };
            tokio::select! {
                _ = setup_timeout => {
                    error!(target: LOG_TARGET, "[ {} Phase ] Setup timed out", SetupPhase::LocalNode);
                    let error_message = format!("[ {} Phase ] Setup timed out", SetupPhase::LocalNode);
                    sentry::capture_message(&error_message, sentry::Level::Error);
                }
                result = self.setup_inner() => {
                    match result {
                        Ok(payload) => {
                            info!(target: LOG_TARGET, "[ {} Phase ] Setup completed successfully", SetupPhase::LocalNode);
                            let __unused = self.finalize_setup(status_sender,payload).await;
                        }
                        Err(error) => {
                            error!(target: LOG_TARGET, "[ {} Phase ] Setup failed with error: {:?}", SetupPhase::LocalNode,error);
                            let error_message = format!("[ {} Phase ] Setup failed with error: {:?}", SetupPhase::LocalNode,error);
                            sentry::capture_message(&error_message, sentry::Level::Error);
                        }
                    }
                }
                _ = shutdown_signal.wait() => {
                    warn!(target: LOG_TARGET, "[ {} Phase ] Setup cancelled", SetupPhase::Core);
                }
            };
        });
    }

    async fn setup_inner(&self) -> Result<Option<LocalNodeSetupPhaseOutput>, Error> {
        let mut progress_stepper = self.progress_stepper.lock().await;
        let (data_dir, config_dir, log_dir) = self.get_app_dirs()?;
        let state = self.app_handle.state::<UniverseAppState>();

        info!(target: LOG_TARGET, "Starting node manager with base node address: {}", self.app_configuration.base_node_grpc_address);

        let tor_control_port = state.tor_manager.get_control_port().await?;
        let _unused = progress_stepper
            .resolve_step(ProgressPlans::LocalNode(
                ProgressSetupLocalNodePlan::StartingLocalNode,
            ))
            .await;

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
                )
                .await
            {
                Ok(_) => {}
                Err(e) => {
                    if let NodeManagerError::ExitCode(code) = e {
                        if STOP_ON_ERROR_CODES.contains(&code) {
                            warn!(target: LOG_TARGET, "Database for node is corrupt or needs a reset, deleting and trying again.");
                            state.node_manager.clean_data_folder(&data_dir).await?;
                            continue;
                        }
                    }
                    error!(target: LOG_TARGET, "Could not start node manager: {:?}", e);

                    self.app_handle.exit(-1);
                    return Err(e.into());
                }
            }
        }

        let wait_for_initial_sync_tracker = progress_stepper.channel_step_range_updates(
            ProgressPlans::LocalNode(ProgressSetupLocalNodePlan::WaitingForInitialSync),
            Some(ProgressPlans::LocalNode(
                ProgressSetupLocalNodePlan::WaitingForHeaderSync,
            )),
        );

        let wait_for_header_sync_tracker = progress_stepper.channel_step_range_updates(
            ProgressPlans::LocalNode(ProgressSetupLocalNodePlan::WaitingForHeaderSync),
            Some(ProgressPlans::LocalNode(
                ProgressSetupLocalNodePlan::WaitingForBlockSync,
            )),
        );

        let wait_for_block_sync_tracker = progress_stepper.channel_step_range_updates(
            ProgressPlans::LocalNode(ProgressSetupLocalNodePlan::WaitingForBlockSync),
            None,
        );

        state
            .node_manager
            .wait_synced(vec![
                wait_for_initial_sync_tracker,
                wait_for_header_sync_tracker,
                wait_for_block_sync_tracker,
            ])
            .await?;

        Ok(None)
    }

    async fn finalize_setup(
        &self,
        sender: Sender<PhaseStatus>,
        _payload: Option<LocalNodeSetupPhaseOutput>,
    ) -> Result<(), Error> {
        sender.send(PhaseStatus::Success).ok();
        let _unused = self
            .progress_stepper
            .lock()
            .await
            .resolve_step(ProgressPlans::LocalNode(ProgressSetupLocalNodePlan::Done))
            .await;

        let state = self.app_handle.state::<UniverseAppState>();
        state
            .events_manager
            .handle_local_node_phase_finished(&self.app_handle, true)
            .await;

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

        Ok(())
    }
}
