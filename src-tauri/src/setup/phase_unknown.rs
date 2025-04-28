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
    binaries::{Binaries, BinaryResolver},
    configs::{config_core::ConfigCore, trait_config::ConfigImpl},
    events_manager::EventsManager,
    p2pool_manager::P2poolConfig,
    progress_tracker_old::ProgressTracker,
    progress_trackers::{
        progress_plans::{ProgressPlans, ProgressSetupUnknownPlan},
        progress_stepper::ProgressStepperBuilder,
        ProgressStepper,
    },
    setup::{setup_manager::SetupPhase, utils::conditional_sleeper},
    tasks_tracker::TasksTrackers,
    StartConfig, UniverseAppState,
};
use anyhow::Error;
use log::{error, info, warn};
use tauri::{AppHandle, Manager};
use tauri_plugin_sentry::sentry;
use tokio::{
    select,
    sync::{
        watch::{self, Sender},
        Mutex,
    },
};

use super::{
    setup_manager::PhaseStatus,
    trait_setup_phase::{SetupConfiguration, SetupPhaseImpl},
};

static LOG_TARGET: &str = "tari::universe::phase_hardware";

#[derive(Clone, Default)]
pub struct UnknownSetupPhaseOutput {}
#[derive(Clone, Default)]
pub struct UnknownSetupPhaseSessionConfiguration {}

#[derive(Clone, Default)]
pub struct UnknownSetupPhaseAppConfiguration {
    p2pool_enabled: bool,
    p2pool_stats_server_port: Option<u16>,
    mmproxy_monero_nodes: Vec<String>,
    mmproxy_use_monero_fail: bool,
}

pub struct UnknownSetupPhase {
    app_handle: AppHandle,
    progress_stepper: Mutex<ProgressStepper>,
    app_configuration: UnknownSetupPhaseAppConfiguration,
    setup_configuration: SetupConfiguration,
    status_sender: Sender<PhaseStatus>,
}

impl SetupPhaseImpl for UnknownSetupPhase {
    type AppConfiguration = UnknownSetupPhaseAppConfiguration;

    async fn new(
        app_handle: AppHandle,
        status_sender: Sender<PhaseStatus>,
        configuration: SetupConfiguration,
    ) -> Self {
        Self {
            app_handle: app_handle.clone(),
            progress_stepper: Mutex::new(Self::create_progress_stepper(app_handle.clone())),
            app_configuration: Self::load_app_configuration().await.unwrap_or_default(),
            setup_configuration: configuration,
            status_sender,
        }
    }

    fn get_app_handle(&self) -> &AppHandle {
        &self.app_handle
    }

    fn create_progress_stepper(app_handle: AppHandle) -> ProgressStepper {
        ProgressStepperBuilder::new()
            .add_step(ProgressPlans::Unknown(
                ProgressSetupUnknownPlan::BinariesMergeMiningProxy,
            ))
            .add_step(ProgressPlans::Unknown(
                ProgressSetupUnknownPlan::BinariesP2pool,
            ))
            .add_step(ProgressPlans::Unknown(ProgressSetupUnknownPlan::P2Pool))
            .add_step(ProgressPlans::Unknown(ProgressSetupUnknownPlan::MMProxy))
            .add_step(ProgressPlans::Unknown(ProgressSetupUnknownPlan::Done))
            .build(app_handle.clone())
    }

    async fn load_app_configuration() -> Result<Self::AppConfiguration, Error> {
        let p2pool_enabled = *ConfigCore::content().await.is_p2pool_enabled();
        let p2pool_stats_server_port = *ConfigCore::content().await.p2pool_stats_server_port();
        let mmproxy_monero_nodes = ConfigCore::content().await.mmproxy_monero_nodes().clone();
        let mmproxy_use_monero_fail = *ConfigCore::content().await.mmproxy_use_monero_failover();

        Ok(UnknownSetupPhaseAppConfiguration {
            p2pool_enabled,
            mmproxy_use_monero_fail,
            mmproxy_monero_nodes,
            p2pool_stats_server_port,
        })
    }

    async fn setup(mut self) {
        info!(target: LOG_TARGET, "[ {} Phase ] Starting setup", SetupPhase::Unknown);

        TasksTrackers::current().unknown_phase.get_task_tracker().await.spawn(async move {
            let mut shutdown_signal = TasksTrackers::current().unknown_phase.get_signal().await;
            for subscriber in &mut self.setup_configuration.listeners_for_required_phases_statuses.iter_mut() {
                select! {
                    _ = subscriber.wait_for(|value| value.is_success()) => {}
                    _ = shutdown_signal.wait() => {
                        warn!(target: LOG_TARGET, "[ {} Phase ] Setup cancelled", SetupPhase::Unknown);
                        return;
                    }
                }
            };
            tokio::select! {
                result = conditional_sleeper(self.setup_configuration.setup_timeout_duration) => {
                    if let Some(_) = result {
                        error!(target: LOG_TARGET, "[ {} Phase ] Setup timed out", SetupPhase::Unknown);
                        let error_message = format!("[ {} Phase ] Setup timed out", SetupPhase::Unknown);
                        sentry::capture_message(&error_message, sentry::Level::Error);
                        EventsManager::handle_critical_problem(&self.app_handle, Some(SetupPhase::Unknown.get_critical_problem_title()), Some(SetupPhase::Unknown.get_critical_problem_description()))
                        .await;
                    }
                }
                result = self.setup_inner() => {
                    match result {
                        Ok(_) => {
                            info!(target: LOG_TARGET, "[ {} Phase ] Setup completed successfully", SetupPhase::Unknown);
                            let _unused = self.finalize_setup().await;
                        }
                        Err(error) => {
                            error!(target: LOG_TARGET, "[ {} Phase ] Setup failed with error: {:?}", SetupPhase::Unknown,error);
                            let error_message = format!("[ {} Phase ] Setup failed with error: {:?}", SetupPhase::Unknown,error);
                            sentry::capture_message(&error_message, sentry::Level::Error);
                            EventsManager
                                ::handle_critical_problem(&self.app_handle, Some(SetupPhase::Unknown.get_critical_problem_title()), Some(SetupPhase::Unknown.get_critical_problem_description()))
                                .await;
                        }
                    }
                }
                _ = shutdown_signal.wait() => {
                    warn!(target: LOG_TARGET, "[ {} Phase ] Setup cancelled", SetupPhase::Core);
                }
            };
        });
    }

    async fn setup_inner(&self) -> Result<(), Error> {
        info!(target: LOG_TARGET, "[ {} Phase ] Starting setup inner", SetupPhase::Unknown);
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

        // TODO Remove once not needed
        let (tx, rx) = watch::channel("".to_string());
        let progress = ProgressTracker::new(self.app_handle.clone(), Some(tx));

        let binary_resolver = BinaryResolver::current().read().await;

        progress_stepper
            .resolve_step(ProgressPlans::Unknown(
                ProgressSetupUnknownPlan::BinariesMergeMiningProxy,
            ))
            .await;

        binary_resolver
            .initialize_binary_timeout(Binaries::MergeMiningProxy, progress.clone(), rx.clone())
            .await?;

        progress_stepper
            .resolve_step(ProgressPlans::Unknown(
                ProgressSetupUnknownPlan::BinariesP2pool,
            ))
            .await;

        binary_resolver
            .initialize_binary_timeout(Binaries::ShaP2pool, progress.clone(), rx.clone())
            .await?;

        let base_node_grpc_address = state.node_manager.get_grpc_address().await?;
        if self.app_configuration.p2pool_enabled {
            progress_stepper
                .resolve_step(ProgressPlans::Unknown(ProgressSetupUnknownPlan::P2Pool))
                .await;

            let p2pool_config = P2poolConfig::builder()
                .with_base_node(base_node_grpc_address.clone())
                .with_stats_server_port(self.app_configuration.p2pool_stats_server_port)
                .with_cpu_benchmark_hashrate(Some(
                    state.cpu_miner.read().await.benchmarked_hashrate,
                ))
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
            progress_stepper.skip_step(ProgressPlans::Unknown(ProgressSetupUnknownPlan::P2Pool));
        }

        progress_stepper
            .resolve_step(ProgressPlans::Unknown(ProgressSetupUnknownPlan::MMProxy))
            .await;

        let use_local_p2pool_node = state.node_manager.is_local_current().await.unwrap_or(false);
        let p2pool_node_grpc_address = state
            .p2pool_manager
            .get_grpc_address(use_local_p2pool_node)
            .await;
        state
            .mm_proxy_manager
            .start(StartConfig {
                base_node_grpc_address,
                p2pool_node_grpc_address,
                base_path: data_dir.clone(),
                config_path: config_dir.clone(),
                log_path: log_dir.clone(),
                tari_address,
                coinbase_extra: telemetry_id,
                p2pool_enabled: self.app_configuration.p2pool_enabled,
                monero_nodes: self.app_configuration.mmproxy_monero_nodes.clone(),
                use_monero_fail: self.app_configuration.mmproxy_use_monero_fail,
            })
            .await?;

        state.mm_proxy_manager.wait_ready().await?;

        Ok(())
    }

    async fn finalize_setup(&self) -> Result<(), Error> {
        self.status_sender.send(PhaseStatus::Success).ok();
        self.progress_stepper
            .lock()
            .await
            .resolve_step(ProgressPlans::Unknown(ProgressSetupUnknownPlan::Done))
            .await;

        EventsManager::handle_unknown_phase_finished(&self.app_handle, true).await;

        Ok(())
    }
}
