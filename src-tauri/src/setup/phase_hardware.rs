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
    binaries::{Binaries, BinaryResolver},
    configs::{config_mining::ConfigMining, trait_config::ConfigImpl},
    events_manager::EventsManager,
    gpu_miner::EngineType,
    hardware::hardware_status_monitor::HardwareStatusMonitor,
    progress_tracker_old::ProgressTracker,
    progress_trackers::{
        progress_plans::{ProgressPlans, ProgressSetupHardwarePlan},
        progress_stepper::ProgressStepperBuilder,
        ProgressStepper,
    },
    setup::setup_manager::SetupPhase,
    tasks_tracker::TasksTrackers,
    UniverseAppState,
};
use anyhow::Error;
use log::error;
use tari_shutdown::ShutdownSignal;
use tauri::{AppHandle, Manager};
use tokio::sync::{
    watch::{self, Receiver, Sender},
    Mutex,
};

use super::{
    setup_manager::PhaseStatus,
    trait_setup_phase::{SetupConfiguration, SetupPhaseImpl},
    utils::setup_default_adapter::SetupDefaultAdapter,
};

static LOG_TARGET: &str = "tari::universe::phase_hardware";
#[derive(Clone, Default)]
pub struct HardwareSetupPhaseOutput {}

#[derive(Clone, Default)]
pub struct HardwareSetupPhaseAppConfiguration {
    gpu_engine: EngineType,
}

pub struct HardwareSetupPhase {
    app_handle: AppHandle,
    progress_stepper: Mutex<ProgressStepper>,
    app_configuration: HardwareSetupPhaseAppConfiguration,
    setup_configuration: SetupConfiguration,
    status_sender: Sender<PhaseStatus>,
}

impl SetupPhaseImpl for HardwareSetupPhase {
    type AppConfiguration = HardwareSetupPhaseAppConfiguration;
    type SetupOutput = HardwareSetupPhaseOutput;

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

    fn get_max_soft_restarts(&self) -> u8 {
        self.setup_configuration.soft_retires.unwrap_or(0)
    }

    fn get_phase_dependencies(&self) -> Vec<Receiver<PhaseStatus>> {
        self.setup_configuration
            .listeners_for_required_phases_statuses
            .clone()
    }

    fn get_phase_name(&self) -> SetupPhase {
        SetupPhase::Hardware
    }

    async fn get_shutdown_signal(&self) -> ShutdownSignal {
        TasksTrackers::current().hardware_phase.get_signal().await
    }

    fn get_status_sender(&self) -> Sender<PhaseStatus> {
        self.status_sender.clone()
    }

    fn get_timeout_duration(&self) -> Duration {
        self.setup_configuration
            .setup_timeout_duration
            .unwrap_or(Duration::from_secs(0))
    }

    async fn get_task_tracker(&self) -> tokio_util::task::TaskTracker {
        TasksTrackers::current()
            .hardware_phase
            .get_task_tracker()
            .await
    }

    fn get_max_hard_restarts(&self) -> u8 {
        self.setup_configuration.hard_retires.unwrap_or(0)
    }

    fn create_progress_stepper(app_handle: AppHandle) -> ProgressStepper {
        ProgressStepperBuilder::new()
            .add_step(ProgressPlans::Hardware(
                ProgressSetupHardwarePlan::BinariesGpuMiner,
            ))
            .add_step(ProgressPlans::Hardware(
                ProgressSetupHardwarePlan::BinariesCpuMiner,
            ))
            .add_step(ProgressPlans::Hardware(
                ProgressSetupHardwarePlan::DetectGPU,
            ))
            .add_step(ProgressPlans::Hardware(
                ProgressSetupHardwarePlan::RunCpuBenchmark,
            ))
            .add_step(ProgressPlans::Hardware(ProgressSetupHardwarePlan::Done))
            .build(app_handle.clone())
    }

    async fn load_app_configuration() -> Result<Self::AppConfiguration, Error> {
        let gpu_engine = ConfigMining::content().await.gpu_engine().clone();

        Ok(HardwareSetupPhaseAppConfiguration { gpu_engine })
    }

    async fn hard_reset(&self) -> Result<(), anyhow::Error> {
        let state = self.app_handle.state::<UniverseAppState>();
        let binary_resolver = BinaryResolver::current().read().await;
        state.gpu_miner.read().await.clear_local_files().await?;
        state.cpu_miner.read().await.clear_local_files().await?;

        binary_resolver.remove_binary(Binaries::GpuMiner).await?;
        binary_resolver.remove_binary(Binaries::Xmrig).await?;

        Ok(())
    }
    async fn setup(self) {
        let _unused = SetupDefaultAdapter::setup(self).await;
    }

    async fn setup_inner(&self) -> Result<Option<HardwareSetupPhaseOutput>, Error> {
        let mut progress_stepper = self.progress_stepper.lock().await;
        let (data_dir, config_dir, log_dir) = self.get_app_dirs()?;
        let state = self.app_handle.state::<UniverseAppState>();

        // TODO Remove once not needed
        let (tx, rx) = watch::channel("".to_string());
        let progress = ProgressTracker::new(self.app_handle.clone(), Some(tx));

        let binary_resolver = BinaryResolver::current().read().await;

        progress_stepper
            .resolve_step(ProgressPlans::Hardware(
                ProgressSetupHardwarePlan::BinariesGpuMiner,
            ))
            .await;

        binary_resolver
            .initialize_binary_timeout(Binaries::GpuMiner, progress.clone(), rx.clone())
            .await?;

        progress_stepper
            .resolve_step(ProgressPlans::Hardware(
                ProgressSetupHardwarePlan::BinariesCpuMiner,
            ))
            .await;

        binary_resolver
            .initialize_binary_timeout(Binaries::Xmrig, progress.clone(), rx.clone())
            .await?;

        progress_stepper
            .resolve_step(ProgressPlans::Hardware(
                ProgressSetupHardwarePlan::DetectGPU,
            ))
            .await;

        let _unused = state
            .gpu_miner
            .write()
            .await
            .detect(
                self.app_handle.clone(),
                config_dir.clone(),
                self.app_configuration.gpu_engine.clone(),
            )
            .await
            .inspect_err(|e| error!(target: LOG_TARGET, "Could not detect gpu miner: {:?}", e));

        HardwareStatusMonitor::current().initialize().await?;

        progress_stepper
            .resolve_step(ProgressPlans::Hardware(
                ProgressSetupHardwarePlan::RunCpuBenchmark,
            ))
            .await;

        let mut cpu_miner = state.cpu_miner.write().await;
        cpu_miner
            .start_benchmarking(
                Duration::from_secs(30),
                data_dir.clone(),
                config_dir.clone(),
                log_dir.clone(),
            )
            .await?;
        drop(cpu_miner);

        Ok(Some(HardwareSetupPhaseOutput {}))
    }

    async fn finalize_setup(
        &self,
        sender: Sender<PhaseStatus>,
        _payload: Option<HardwareSetupPhaseOutput>,
    ) -> Result<(), Error> {
        sender.send(PhaseStatus::Success).ok();
        self.progress_stepper
            .lock()
            .await
            .resolve_step(ProgressPlans::Hardware(ProgressSetupHardwarePlan::Done))
            .await;

        EventsManager::handle_hardware_phase_finished(&self.app_handle, true).await;
        Ok(())
    }
}
