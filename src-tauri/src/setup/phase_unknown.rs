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
    p2pool_manager::P2poolConfig,
    progress_trackers::{
        progress_plans::{ProgressPlans, ProgressSetupUnknownPlan},
        progress_stepper::ProgressStepperBuilder,
        ProgressStepper,
    },
    setup::setup_manager::SetupPhase,
    tasks_tracker::TasksTrackers,
    StartConfig, UniverseAppState,
};
use anyhow::Error;
use log::{error, info};
use tauri::{AppHandle, Manager};
use tauri_plugin_sentry::sentry;
use tokio::sync::{
    watch::{Receiver, Sender},
    Mutex,
};

use super::{
    setup_manager::{PhaseStatus, SetupManager},
    trait_setup_phase::SetupPhaseImpl,
};

static LOG_TARGET: &str = "tari::universe::phase_hardware";
const SETUP_TIMEOUT_DURATION: Duration = Duration::from_secs(60 * 10); // 10 Minutes

#[derive(Clone, Default)]
pub struct UnknownSetupPhaseOutput {}
#[derive(Clone, Default)]
pub struct UnknownSetupPhaseSessionConfiguration {
    pub cpu_benchmarked_hashrate: u64,
}

#[derive(Clone, Default)]
pub struct UnknownSetupPhaseAppConfiguration {
    p2pool_enabled: bool,
}

pub struct UnknownSetupPhase {
    app_handle: AppHandle,
    progress_stepper: Mutex<ProgressStepper>,
    app_configuration: UnknownSetupPhaseAppConfiguration,
}

impl UnknownSetupPhase {
    pub fn load_session_configuration() -> UnknownSetupPhaseSessionConfiguration {
        let hardware_phase_output = SetupManager::get_instance()
            .hardware_phase_output
            .subscribe()
            .borrow()
            .clone();

        UnknownSetupPhaseSessionConfiguration {
            cpu_benchmarked_hashrate: hardware_phase_output.cpu_benchmarked_hashrate,
        }
    }
}

impl SetupPhaseImpl for UnknownSetupPhase {
    type AppConfiguration = UnknownSetupPhaseAppConfiguration;
    type SetupOutput = UnknownSetupPhaseOutput;

    async fn new(app_handle: AppHandle) -> Self {
        Self {
            app_handle: app_handle.clone(),
            progress_stepper: Mutex::new(Self::create_progress_stepper(app_handle.clone())),
            app_configuration: Self::load_app_configuration().await.unwrap_or_default(),
        }
    }

    fn get_app_handle(&self) -> &AppHandle {
        &self.app_handle
    }

    fn create_progress_stepper(app_handle: AppHandle) -> ProgressStepper {
        ProgressStepperBuilder::new()
            .add_step(ProgressPlans::Unknown(ProgressSetupUnknownPlan::P2Pool))
            .add_step(ProgressPlans::Unknown(ProgressSetupUnknownPlan::MMProxy))
            .add_step(ProgressPlans::Unknown(ProgressSetupUnknownPlan::Done))
            .build(app_handle.clone())
    }

    async fn load_app_configuration() -> Result<Self::AppConfiguration, Error> {
        let p2pool_enabled = *ConfigCore::current()
            .lock()
            .await
            .get_content()
            .is_p2pool_enabled();

        Ok(UnknownSetupPhaseAppConfiguration { p2pool_enabled })
    }

    async fn setup(
        self: std::sync::Arc<Self>,
        status_sender: Sender<PhaseStatus>,
        mut flow_subscribers: Vec<Receiver<PhaseStatus>>,
    ) {
        info!(target: LOG_TARGET, "[ {} Phase ] Starting setup", SetupPhase::Unknown);

        TasksTrackers::current().unknown_phase.get_task_tracker().spawn(async move {
            for subscriber in &mut flow_subscribers.iter_mut() {
                let _unused = subscriber.wait_for(|value| value.is_success()).await;
            };

            let setup_timeout = tokio::time::sleep(SETUP_TIMEOUT_DURATION);
            tokio::select! {
                _ = setup_timeout => {
                    error!(target: LOG_TARGET, "[ {} Phase ] Setup timed out", SetupPhase::Unknown);
                    let error_message = format!("[ {} Phase ] Setup timed out", SetupPhase::Unknown);
                    sentry::capture_message(&error_message, sentry::Level::Error);
                }
                result = self.setup_inner() => {
                    match result {
                        Ok(payload) => {
                            info!(target: LOG_TARGET, "[ {} Phase ] Setup completed successfully", SetupPhase::Unknown);
                            let _unused = self.finalize_setup(status_sender,payload).await;
                        }
                        Err(error) => {
                            error!(target: LOG_TARGET, "[ {} Phase ] Setup failed with error: {:?}", SetupPhase::Unknown,error);
                            let error_message = format!("[ {} Phase ] Setup failed with error: {:?}", SetupPhase::Unknown,error);
                            sentry::capture_message(&error_message, sentry::Level::Error);
                        }
                    }
                }
            };
        });
    }

    async fn setup_inner(&self) -> Result<Option<UnknownSetupPhaseOutput>, Error> {
        let session_configuration = Self::load_session_configuration();
        let mut progress_stepper = self.progress_stepper.lock().await;
        let (data_dir, config_dir, log_dir) = self.get_app_dirs()?;
        let state = self.app_handle.state::<UniverseAppState>();
        let tari_address = state.cpu_miner_config.read().await.tari_address.clone();
        let telemetry_id = state
            .telemetry_manager
            .read()
            .await
            .get_unique_string()
            .await;

        if self.app_configuration.p2pool_enabled {
            let _unused = progress_stepper
                .resolve_step(ProgressPlans::Unknown(ProgressSetupUnknownPlan::P2Pool))
                .await;

            let base_node_grpc = state.node_manager.get_grpc_address().await?;
            let p2pool_config = P2poolConfig::builder()
                .with_base_node(base_node_grpc)
                .with_stats_server_port(state.config.read().await.p2pool_stats_server_port())
                .with_cpu_benchmark_hashrate(Some(session_configuration.cpu_benchmarked_hashrate))
                .build()?;

            state
                .p2pool_manager
                .ensure_started(
                    p2pool_config,
                    data_dir.clone(),
                    config_dir.clone(),
                    log_dir.clone(),
                )
                .await?;
        } else {
            let _unused = progress_stepper
                .skip_step(ProgressPlans::Unknown(ProgressSetupUnknownPlan::P2Pool));
        }

        let _unused = progress_stepper
            .resolve_step(ProgressPlans::Unknown(ProgressSetupUnknownPlan::MMProxy))
            .await;

        let base_node_grpc_address = state.node_manager.get_grpc_address().await?;

        let config = state.config.read().await;
        let p2pool_port = state.p2pool_manager.grpc_port().await;
        state
            .mm_proxy_manager
            .start(StartConfig {
                base_node_grpc_address,
                p2pool_port,
                base_path: data_dir.clone(),
                config_path: config_dir.clone(),
                log_path: log_dir.clone(),
                tari_address,
                coinbase_extra: telemetry_id,
                p2pool_enabled: self.app_configuration.p2pool_enabled,
                monero_nodes: config.mmproxy_monero_nodes().clone(),
                use_monero_fail: config.mmproxy_use_monero_fail(),
            })
            .await?;
        state.mm_proxy_manager.wait_ready().await?;

        Ok(None)
    }

    async fn finalize_setup(
        &self,
        sender: Sender<PhaseStatus>,
        _payload: Option<UnknownSetupPhaseOutput>,
    ) -> Result<(), Error> {
        sender.send(PhaseStatus::Success).ok();
        let _unused = self
            .progress_stepper
            .lock()
            .await
            .resolve_step(ProgressPlans::Unknown(ProgressSetupUnknownPlan::Done))
            .await;

        let state = self.app_handle.state::<UniverseAppState>();
        state
            .events_manager
            .handle_unknown_phase_finished(&self.app_handle, true)
            .await;

        Ok(())
    }
}
