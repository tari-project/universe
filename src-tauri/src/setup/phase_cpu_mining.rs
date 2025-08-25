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
    events_emitter::EventsEmitter,
    hardware::hardware_status_monitor::HardwareStatusMonitor,
    internal_wallet::InternalWallet,
    mm_proxy_manager::StartConfig,
    progress_trackers::{
        progress_plans::SetupStep,
        progress_stepper::{ProgressStepper, ProgressStepperBuilder},
    },
    setup::{listeners::SetupFeature, setup_manager::SetupPhase},
    systemtray_manager::SystemTrayCpuData,
    tasks_tracker::TasksTrackers,
    utils::locks_utils::try_write_with_retry,
    UniverseAppState,
};
use anyhow::Error;
use log::error;
use tari_shutdown::ShutdownSignal;
use tauri::{AppHandle, Manager};
use tokio::{
    select,
    sync::{
        watch::{Receiver, Sender},
        Mutex,
    },
};
use tokio_util::task::TaskTracker;

use super::{
    listeners::SetupFeaturesList,
    setup_manager::PhaseStatus,
    trait_setup_phase::{SetupConfiguration, SetupPhaseImpl},
    utils::{setup_default_adapter::SetupDefaultAdapter, timeout_watcher::TimeoutWatcher},
};

static LOG_TARGET: &str = "tari::universe::phase_cpu_mining";

#[derive(Clone, Default)]
pub struct CpuMiningSetupPhaseAppConfiguration {
    mmproxy_monero_nodes: Vec<String>,
    mmproxy_use_monero_fail: bool,
}

pub struct CpuMiningSetupPhase {
    app_handle: AppHandle,
    progress_stepper: Mutex<ProgressStepper>,
    app_configuration: CpuMiningSetupPhaseAppConfiguration,
    setup_configuration: SetupConfiguration,
    status_sender: Sender<PhaseStatus>,
    #[allow(dead_code)]
    setup_features: SetupFeaturesList,
    timeout_watcher: TimeoutWatcher,
}

impl SetupPhaseImpl for CpuMiningSetupPhase {
    type AppConfiguration = CpuMiningSetupPhaseAppConfiguration;

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
                status_sender.clone(),
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
    fn get_status_sender(&self) -> &Sender<PhaseStatus> {
        &self.status_sender
    }

    async fn get_shutdown_signal(&self) -> ShutdownSignal {
        TasksTrackers::current().cpu_mining_phase.get_signal().await
    }
    async fn get_task_tracker(&self) -> TaskTracker {
        TasksTrackers::current()
            .cpu_mining_phase
            .get_task_tracker()
            .await
    }
    fn get_phase_dependencies(&self) -> Vec<Receiver<PhaseStatus>> {
        self.setup_configuration
            .listeners_for_required_phases_statuses
            .clone()
    }
    fn get_phase_id(&self) -> SetupPhase {
        SetupPhase::CpuMining
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
            .add_incremental_step(SetupStep::BinariesCpuMiner, true)
            .add_incremental_step(SetupStep::BinariesMergeMiningProxy, true)
            .add_step(SetupStep::MMProxy, true)
            .add_step(SetupStep::InitializeCpuHardware, false)
            .build(
                app_handle.clone(),
                timeout_watcher_sender,
                status_sender,
                SetupPhase::CpuMining,
            )
    }

    async fn load_app_configuration() -> Result<Self::AppConfiguration, Error> {
        let mmproxy_monero_nodes = ConfigCore::content().await.mmproxy_monero_nodes().clone();
        let mmproxy_use_monero_fail = *ConfigCore::content().await.mmproxy_use_monero_failover();

        Ok(CpuMiningSetupPhaseAppConfiguration {
            mmproxy_monero_nodes,
            mmproxy_use_monero_fail,
        })
    }

    async fn setup(self) {
        SetupDefaultAdapter::setup(self).await;
    }

    async fn setup_inner(&self) -> Result<(), Error> {
        let mut progress_stepper = self.progress_stepper.lock().await;
        let (data_dir, config_dir, log_dir) = self.get_app_dirs()?;
        let state = self.app_handle.state::<UniverseAppState>();

        let binary_resolver = BinaryResolver::current();

        let cpu_miner_binary_progress_tracker =
            progress_stepper.track_step_incrementally(SetupStep::BinariesCpuMiner);

        progress_stepper
            .complete_step(SetupStep::BinariesCpuMiner, || async {
                binary_resolver
                    .initialize_binary(Binaries::Xmrig, cpu_miner_binary_progress_tracker)
                    .await
            })
            .await?;

        let is_cpu_pool_enabled: bool = self
            .setup_features
            .is_feature_enabled(SetupFeature::CpuPool);

        let mmproxy_binary_progress_tracker =
            progress_stepper.track_step_incrementally(SetupStep::BinariesMergeMiningProxy);

        progress_stepper
            .complete_step(SetupStep::BinariesMergeMiningProxy, || async {
                if is_cpu_pool_enabled {
                    return Ok(());
                }

                binary_resolver
                    .initialize_binary(Binaries::MergeMiningProxy, mmproxy_binary_progress_tracker)
                    .await
            })
            .await?;

        progress_stepper
            .complete_step(SetupStep::MMProxy, || async {
                if is_cpu_pool_enabled {
                    return Ok(());
                }

                let tari_address = InternalWallet::tari_address().await;
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
                Ok(())
            })
            .await?;

        progress_stepper
            .complete_step(SetupStep::InitializeCpuHardware, || async {
                HardwareStatusMonitor::current()
                    .initialize_cpu_devices()
                    .await
            })
            .await?;

        Ok(())
    }

    async fn finalize_setup(&self) -> Result<(), Error> {
        let progress_stepper = self.progress_stepper.lock().await;
        let setup_warnings = progress_stepper.get_setup_warnings();
        if setup_warnings.is_empty() {
            self.status_sender.send(PhaseStatus::Success)?;
        } else {
            self.status_sender
                .send(PhaseStatus::SuccessWithWarnings(setup_warnings.clone()))?;
        }

        let app_handle_clone = self.app_handle.clone();
        TasksTrackers::current()
            .cpu_mining_phase
            .get_task_tracker()
            .await
            .spawn(async move {
                let app_state = app_handle_clone.state::<UniverseAppState>().clone();
                let mut cpu_miner_status_watch_rx = (*app_state.cpu_miner_status_watch_rx).clone();
                let mut shutdown_signal =
                    TasksTrackers::current().cpu_mining_phase.get_signal().await;

                loop {
                    select! {
                        _ = cpu_miner_status_watch_rx.changed() => {
                            let cpu_status = cpu_miner_status_watch_rx.borrow().clone();
                            EventsEmitter::emit_cpu_mining_update(cpu_status.clone()).await;

                        let cpu_systemtray_data = SystemTrayCpuData {
                            cpu_hashrate: cpu_status.hash_rate,
                            estimated_earning: cpu_status.estimated_earnings,
                        };

                        match try_write_with_retry(&app_state.systemtray_manager, 6).await {
                            Ok(mut sm) => {
                                sm.update_tray_with_cpu_data(cpu_systemtray_data);
                            },
                            Err(error) => {
                                error!(target: LOG_TARGET, "Failed to acquire systemtray_manager write lock: {error}");
                            }
                        }

                        }
                        _ = shutdown_signal.wait() => {
                            break;
                        },
                    }
                }
            });

        Ok(())
    }
}
