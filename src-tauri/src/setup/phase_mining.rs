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
    configs::{
        config_core::ConfigCore, config_mining::ConfigMining, config_wallet::ConfigWallet,
        trait_config::ConfigImpl,
    },
    events_emitter::EventsEmitter,
    p2pool_manager::P2poolConfig,
    progress_tracker_old::ProgressTracker,
    progress_trackers::{
        progress_plans::{ProgressPlans, ProgressSetupMiningPlan},
        progress_stepper::ProgressStepperBuilder,
        ProgressStepper,
    },
    setup::setup_manager::{SetupFeature, SetupPhase},
    tasks_tracker::TasksTrackers,
    StartConfig, UniverseAppState,
};
use anyhow::Error;
use log::info;
use tari_common_types::tari_address::TariAddress;
use tari_shutdown::ShutdownSignal;
use tauri::{AppHandle, Manager};
use tokio::sync::{
    watch::{self, Receiver, Sender},
    Mutex,
};
use tokio_util::task::TaskTracker;

use super::{
    setup_manager::{PhaseStatus, SetupFeaturesList},
    trait_setup_phase::{SetupConfiguration, SetupPhaseImpl},
    utils::{setup_default_adapter::SetupDefaultAdapter, timeout_watcher::TimeoutWatcher},
};

static LOG_TARGET: &str = "tari::universe::phase_hardware";

#[derive(Clone, Default)]
pub struct MiningSetupPhaseOutput {}
#[derive(Clone, Default)]
pub struct MiningSetupPhaseSessionConfiguration {}

#[derive(Clone, Default)]
pub struct MiningSetupPhaseAppConfiguration {
    tari_address: TariAddress,
    p2pool_enabled: bool,
    p2pool_stats_server_port: Option<u16>,
    mmproxy_monero_nodes: Vec<String>,
    mmproxy_use_monero_fail: bool,
    squad_override: Option<String>,
}

pub struct MiningSetupPhase {
    app_handle: AppHandle,
    progress_stepper: Mutex<ProgressStepper>,
    app_configuration: MiningSetupPhaseAppConfiguration,
    setup_configuration: SetupConfiguration,
    status_sender: Sender<PhaseStatus>,
    setup_features: SetupFeaturesList,
    timeout_watcher: TimeoutWatcher,
}

impl SetupPhaseImpl for MiningSetupPhase {
    type AppConfiguration = MiningSetupPhaseAppConfiguration;

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
                app_handle.clone(),
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
        TasksTrackers::current().mining_phase.get_signal().await
    }
    async fn get_task_tracker(&self) -> TaskTracker {
        TasksTrackers::current()
            .mining_phase
            .get_task_tracker()
            .await
    }
    fn get_phase_dependencies(&self) -> Vec<Receiver<PhaseStatus>> {
        self.setup_configuration
            .listeners_for_required_phases_statuses
            .clone()
    }
    fn get_phase_id(&self) -> SetupPhase {
        SetupPhase::Mining
    }
    fn get_timeout_watcher(&self) -> &TimeoutWatcher {
        &self.timeout_watcher
    }

    fn create_progress_stepper(
        app_handle: AppHandle,
        timeout_watcher_sender: Sender<u64>,
    ) -> ProgressStepper {
        ProgressStepperBuilder::new()
            .add_step(ProgressPlans::Mining(
                ProgressSetupMiningPlan::BinariesMergeMiningProxy,
            ))
            .add_step(ProgressPlans::Mining(
                ProgressSetupMiningPlan::BinariesP2pool,
            ))
            .add_step(ProgressPlans::Mining(ProgressSetupMiningPlan::P2Pool))
            .add_step(ProgressPlans::Mining(ProgressSetupMiningPlan::MMProxy))
            .add_step(ProgressPlans::Mining(ProgressSetupMiningPlan::Done))
            .build(app_handle.clone(), timeout_watcher_sender)
    }

    async fn load_app_configuration() -> Result<Self::AppConfiguration, Error> {
        let p2pool_enabled = *ConfigCore::content().await.is_p2pool_enabled();
        let p2pool_stats_server_port = *ConfigCore::content().await.p2pool_stats_server_port();
        let mmproxy_monero_nodes = ConfigCore::content().await.mmproxy_monero_nodes().clone();
        let mmproxy_use_monero_fail = *ConfigCore::content().await.mmproxy_use_monero_failover();
        let squad_override = ConfigMining::content().await.squad_override().clone();
        let tari_address = ConfigWallet::content()
            .await
            .get_current_used_tari_address();

        Ok(MiningSetupPhaseAppConfiguration {
            p2pool_enabled,
            mmproxy_use_monero_fail,
            mmproxy_monero_nodes,
            p2pool_stats_server_port,
            squad_override,
            tari_address,
        })
    }

    async fn setup(self) {
        let _unused = SetupDefaultAdapter::setup(self).await;
    }

    #[allow(clippy::too_many_lines)]
    async fn setup_inner(&self) -> Result<(), Error> {
        info!(target: LOG_TARGET, "[ {} Phase ] Starting setup inner", SetupPhase::Mining);
        let mut progress_stepper = self.progress_stepper.lock().await;
        let (data_dir, config_dir, log_dir) = self.get_app_dirs()?;
        let state = self.app_handle.state::<UniverseAppState>();
        let tari_address = self.app_configuration.tari_address.clone();
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
            .resolve_step(ProgressPlans::Mining(
                ProgressSetupMiningPlan::BinariesMergeMiningProxy,
            ))
            .await;

        binary_resolver
            .initialize_binary_timeout(Binaries::MergeMiningProxy, progress.clone(), rx.clone())
            .await?;

        progress_stepper
            .resolve_step(ProgressPlans::Mining(
                ProgressSetupMiningPlan::BinariesP2pool,
            ))
            .await;

        binary_resolver
            .initialize_binary_timeout(Binaries::ShaP2pool, progress.clone(), rx.clone())
            .await?;

        let base_node_grpc_address = state.node_manager.get_grpc_address().await?;
        if self.app_configuration.p2pool_enabled {
            progress_stepper
                .resolve_step(ProgressPlans::Mining(ProgressSetupMiningPlan::P2Pool))
                .await;

            let p2pool_config = P2poolConfig::builder()
                .with_base_node(base_node_grpc_address.clone())
                .with_squad_override(self.app_configuration.squad_override.clone())
                .with_stats_server_port(self.app_configuration.p2pool_stats_server_port)
                .with_cpu_benchmark_hashrate(Some(
                    state.cpu_miner.read().await.benchmarked_hashrate,
                ))
                .with_randomx_disabled(
                    self.setup_features
                        .is_feature_enabled(SetupFeature::CentralizedPool),
                )
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
            progress_stepper.skip_step(ProgressPlans::Mining(ProgressSetupMiningPlan::P2Pool));
        }

        if self
            .setup_features
            .is_feature_disabled(SetupFeature::CentralizedPool)
        {
            progress_stepper
                .resolve_step(ProgressPlans::Mining(ProgressSetupMiningPlan::MMProxy))
                .await;

            let use_local_p2pool_node =
                state.node_manager.is_local_current().await.unwrap_or(false);
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
                    tari_address: tari_address.clone(),
                    coinbase_extra: telemetry_id,
                    p2pool_enabled: self.app_configuration.p2pool_enabled,
                    monero_nodes: self.app_configuration.mmproxy_monero_nodes.clone(),
                    use_monero_fail: self.app_configuration.mmproxy_use_monero_fail,
                })
                .await?;

            state.mm_proxy_manager.wait_ready().await?;
        } else {
            progress_stepper.skip_step(ProgressPlans::Mining(ProgressSetupMiningPlan::MMProxy));
        }

        Ok(())
    }

    async fn finalize_setup(&self) -> Result<(), Error> {
        self.status_sender.send(PhaseStatus::Success).ok();
        self.progress_stepper
            .lock()
            .await
            .resolve_step(ProgressPlans::Mining(ProgressSetupMiningPlan::Done))
            .await;

        EventsEmitter::emit_mining_phase_finished(true).await;

        Ok(())
    }
}
