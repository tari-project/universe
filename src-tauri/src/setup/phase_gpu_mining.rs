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
    configs::{config_mining::ConfigMining, trait_config::ConfigImpl},
    events_emitter::EventsEmitter,
    gpu_devices::GpuDevices,
    gpu_miner::EngineType,
    gpu_miner_adapter::GpuMinerStatus,
    hardware::hardware_status_monitor::HardwareStatusMonitor,
    progress_trackers::{
        progress_plans::SetupStep,
        progress_stepper::{ProgressStepper, ProgressStepperBuilder},
    },
    setup::setup_manager::SetupPhase,
    systemtray_manager::SystemTrayGpuData,
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

static LOG_TARGET: &str = "tari::universe::phase_gpu_mining";

#[derive(Clone, Default)]
pub struct GpuMiningSetupPhaseAppConfiguration {
    gpu_engine: EngineType,
}

pub struct GpuMiningSetupPhase {
    app_handle: AppHandle,
    progress_stepper: Mutex<ProgressStepper>,
    app_configuration: GpuMiningSetupPhaseAppConfiguration,
    setup_configuration: SetupConfiguration,
    status_sender: Sender<PhaseStatus>,
    #[allow(dead_code)]
    setup_features: SetupFeaturesList,
    timeout_watcher: TimeoutWatcher,
}

impl SetupPhaseImpl for GpuMiningSetupPhase {
    type AppConfiguration = GpuMiningSetupPhaseAppConfiguration;

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
        TasksTrackers::current().gpu_mining_phase.get_signal().await
    }
    async fn get_task_tracker(&self) -> TaskTracker {
        TasksTrackers::current()
            .gpu_mining_phase
            .get_task_tracker()
            .await
    }
    fn get_phase_dependencies(&self) -> Vec<Receiver<PhaseStatus>> {
        self.setup_configuration
            .listeners_for_required_phases_statuses
            .clone()
    }
    fn get_phase_id(&self) -> SetupPhase {
        SetupPhase::GpuMining
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
            .add_step(SetupStep::BinariesGpuMiner, true)
            .add_step(SetupStep::DetectGpu, true)
            .add_step(SetupStep::InitializeGpuHardware, false)
            .build(
                app_handle.clone(),
                timeout_watcher_sender,
                status_sender,
                SetupPhase::GpuMining,
            )
    }

    async fn load_app_configuration() -> Result<Self::AppConfiguration, Error> {
        let gpu_engine = ConfigMining::content().await.gpu_engine().clone();

        Ok(GpuMiningSetupPhaseAppConfiguration { gpu_engine })
    }

    async fn setup(self) {
        let _unused = SetupDefaultAdapter::setup(self).await;
    }

    async fn setup_inner(&self) -> Result<(), Error> {
        let mut progress_stepper = self.progress_stepper.lock().await;
        let (data_dir, config_dir, _log_dir) = self.get_app_dirs()?;

        let binary_resolver = BinaryResolver::current();

        let graxil_binary_progress_tracker =
            progress_stepper.track_step_completion_over_time(SetupStep::BinariesGpuMiner);

        progress_stepper.mark_step_as_completed(SetupStep::BinariesGpuMiner, async move || {
            let graxil_initialization_result = binary_resolver
                .initialize_binary(Binaries::GpuMinerSHA3X, graxil_binary_progress_tracker)
                .await;
            let glytex_initialization_result = binary_resolver
                .initialize_binary(Binaries::GpuMiner, None)
                .await;

            if let (Err(graxil_err), Err(glytex_err)) =
                (graxil_initialization_result, glytex_initialization_result)
            {
                return Err(anyhow::anyhow!(
                    "Failed to initialize GPU miner binaries: Graxil: {graxil_err}, Glytex: {glytex_err}"
                ));
            }

            Ok(())
        }).await?;

        let state = self.app_handle.state::<UniverseAppState>();
        let gpu_miner_lock = state.gpu_miner.clone();

        let gpu_engine = self.app_configuration.gpu_engine.clone();

        progress_stepper
            .mark_step_as_completed(SetupStep::DetectGpu, async move || {
                gpu_miner_lock
                    .write()
                    .await
                    .detect(config_dir.clone(), gpu_engine.clone())
                    .await?;

                GpuDevices::current()
                    .write()
                    .await
                    .detect(data_dir.clone())
                    .await?;

                Ok(())
            })
            .await?;

        HardwareStatusMonitor::current()
            .initialize_gpu_devices()
            .await?;

        Ok(())
    }

    async fn finalize_setup(&self) -> Result<(), Error> {
        let progress_stepper = self.progress_stepper.lock().await;
        let setup_warnings = progress_stepper.get_setup_warnings();
        if !setup_warnings.is_empty() {
            self.status_sender.send(PhaseStatus::Success);
        } else {
            self.status_sender
                .send(PhaseStatus::SuccessWithWarnings(setup_warnings.clone()));
        }

        let app_handle_clone = self.app_handle.clone();
        TasksTrackers::current()
            .gpu_mining_phase
            .get_task_tracker()
            .await
            .spawn(async move {
                let app_state = app_handle_clone.state::<UniverseAppState>().clone();
                let mut gpu_status_watch_rx = (*app_state.gpu_latest_status).clone();
                let mut shutdown_signal =
                    TasksTrackers::current().gpu_mining_phase.get_signal().await;

                loop {
                    select! {
                        _ = gpu_status_watch_rx.changed() => {
                            let gpu_status: GpuMinerStatus = gpu_status_watch_rx.borrow().clone();
                            EventsEmitter::emit_gpu_mining_update(gpu_status.clone()).await;
                            let gpu_systemtray_data = SystemTrayGpuData {
                                gpu_hashrate: gpu_status.hash_rate,
                                estimated_earning: gpu_status.estimated_earnings
                            };

                            match try_write_with_retry(&app_state.systemtray_manager, 6).await {
                                Ok(mut sm) => {
                                    sm.update_tray_with_gpu_data(gpu_systemtray_data);
                                },
                                Err(e) => {
                                    let err_msg = format!("Failed to acquire systemtray_manager write lock: {e}");
                                    error!(target: LOG_TARGET, "{err_msg}");
                                }
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
