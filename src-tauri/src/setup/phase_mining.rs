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

use super::{
    listeners::SetupFeaturesList,
    setup_manager::PhaseStatus,
    trait_setup_phase::{SetupConfiguration, SetupPhaseImpl},
    utils::{setup_default_adapter::SetupDefaultAdapter, timeout_watcher::TimeoutWatcher},
};
use crate::{
    configs::{config_core::ConfigCore, trait_config::ConfigImpl},
    events_emitter::EventsEmitter,
    internal_wallet::InternalWallet,
    progress_trackers::{
        progress_plans::{ProgressPlans, ProgressSetupMiningPlan},
        progress_stepper::ProgressStepperBuilder,
        ProgressStepper,
    },
    setup::{listeners::SetupFeature, setup_manager::SetupPhase},
    tasks_tracker::TasksTrackers,
    StartConfig, UniverseAppState,
};
use anyhow::Error;
use log::info;
use tari_shutdown::ShutdownSignal;
use tauri::{AppHandle, Manager};
use tokio::sync::{
    watch::{Receiver, Sender},
    Mutex,
};
use tokio_util::task::TaskTracker;

static LOG_TARGET: &str = "tari::universe::phase_hardware";

#[derive(Clone, Default)]
pub struct MiningSetupPhaseAppConfiguration {
    mmproxy_monero_nodes: Vec<String>,
    mmproxy_use_monero_fail: bool,
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
            .add_step(ProgressPlans::Mining(ProgressSetupMiningPlan::MMProxy))
            .add_step(ProgressPlans::Mining(ProgressSetupMiningPlan::Done))
            .build(app_handle.clone(), timeout_watcher_sender)
    }

    async fn load_app_configuration() -> Result<Self::AppConfiguration, Error> {
        let mmproxy_monero_nodes = ConfigCore::content().await.mmproxy_monero_nodes().clone();
        let mmproxy_use_monero_fail = *ConfigCore::content().await.mmproxy_use_monero_failover();

        Ok(MiningSetupPhaseAppConfiguration {
            mmproxy_use_monero_fail,
            mmproxy_monero_nodes,
        })
    }

    async fn setup(self) {
        let _unused = SetupDefaultAdapter::setup(self).await;
    }

    #[allow(clippy::too_many_lines)]
    async fn setup_inner(&self) -> Result<(), Error> {
        info!(target: LOG_TARGET, "[ {} Phase ] Starting setup inner", SetupPhase::Mining);
        let mut progress_stepper = self.progress_stepper.lock().await;
        if self
            .setup_features
            .is_feature_disabled(SetupFeature::CpuPool)
        {
            progress_stepper
                .resolve_step(ProgressPlans::Mining(ProgressSetupMiningPlan::MMProxy))
                .await;
            let (data_dir, config_dir, log_dir) = self.get_app_dirs()?;
            let tari_address = InternalWallet::tari_address().await;
            let state = self.app_handle.state::<UniverseAppState>();
            let telemetry_id = state
                .telemetry_manager
                .read()
                .await
                .get_unique_string()
                .await;
            let base_node_grpc_address = state.node_manager.get_grpc_address().await?;

            state
                .mm_proxy_manager
                .start(StartConfig {
                    base_node_grpc_address,
                    base_path: data_dir.clone(),
                    config_path: config_dir.clone(),
                    log_path: log_dir.clone(),
                    tari_address: tari_address.clone(),
                    coinbase_extra: telemetry_id,
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
