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
        config_mining::{ConfigMining, ConfigMiningContent},
        trait_config::ConfigImpl,
    },
    hardware::hardware_status_monitor::HardwareStatusMonitor,
    mining::gpu::{consts::GpuMinerType, manager::GpuManager},
    progress_trackers::{
        progress_plans::SetupStep,
        progress_stepper::{ProgressStepper, ProgressStepperBuilder},
    },
    setup::setup_manager::SetupPhase,
    tasks_tracker::TasksTrackers,
    LOG_TARGET_APP_LOGIC,
};
use anyhow::Error;
use log::{error, info};
use tari_shutdown::ShutdownSignal;
use tauri::AppHandle;
use tokio::sync::{
    watch::{Receiver, Sender},
    Mutex,
};
use tokio_util::task::TaskTracker;

use super::{
    listeners::SetupFeaturesList,
    setup_manager::PhaseStatus,
    trait_setup_phase::{SetupConfiguration, SetupPhaseImpl},
    utils::{setup_default_adapter::SetupDefaultAdapter, timeout_watcher::TimeoutWatcher},
};
#[derive(Clone, Default)]
pub struct GpuMiningSetupPhaseAppConfiguration {}

pub struct GpuMiningSetupPhase {
    app_handle: AppHandle,
    progress_stepper: Mutex<ProgressStepper>,
    #[allow(dead_code)]
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
            .add_incremental_step(SetupStep::BinariesGpuMiner, true)
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
        Ok(GpuMiningSetupPhaseAppConfiguration {})
    }

    async fn setup(self) {
        SetupDefaultAdapter::setup(self).await;
    }

    #[allow(clippy::too_many_lines)]
    async fn setup_inner(&self) -> Result<(), Error> {
        // Check if any GPU miner is supported on this platform
        // If not (e.g., macOS), disable GPU mining and skip the entire phase
        if !GpuMinerType::LolMiner.is_supported_on_current_platform() {
            info!(target: LOG_TARGET_APP_LOGIC, "GPU mining not supported on this platform, disabling GPU mining");
            ConfigMining::update_field(ConfigMiningContent::set_gpu_mining_enabled, false).await?;
            ConfigMining::update_field(ConfigMiningContent::set_is_gpu_mining_recommended, false)
                .await?;
            return Ok(());
        }

        let mut progress_stepper = self.progress_stepper.lock().await;

        let binary_resolver = BinaryResolver::current();

        let lolminer_binary_progress_tracker =
            progress_stepper.track_step_incrementally(SetupStep::BinariesGpuMiner);

        progress_stepper
            .complete_step(SetupStep::BinariesGpuMiner, || async {
                let mut is_any_miner_succeeded = false;

                // LolMiner is supported on Windows | Linux
                if GpuMinerType::LolMiner.is_supported_on_current_platform() {
                    let lolminer_initialization_result = binary_resolver
                        .initialize_binary(Binaries::LolMiner, lolminer_binary_progress_tracker)
                        .await;

                    let lolminer_err = lolminer_initialization_result.as_ref().err();

                    if lolminer_initialization_result.is_ok() {
                        is_any_miner_succeeded = true;
                    }else {
                        error!(target: LOG_TARGET_APP_LOGIC, "LolMiner initialization error: {:?}", lolminer_err);
                    }

                    GpuManager::write()
                        .await
                        .load_miner(
                            GpuMinerType::LolMiner,
                            lolminer_initialization_result.is_ok(),
                            lolminer_err.map(|e| e.to_string()),
                        )
                        .await;
                }

                if !is_any_miner_succeeded {
                    return Err(anyhow::anyhow!(
                        "Failed to initialize GPU miner binary: LolMiner"
                    ));
                }

                Ok(())
            })
            .await?;

        progress_stepper
            .complete_step(SetupStep::DetectGpu, || async {
                let mut gpu_manager = GpuManager::write().await;
                let detection_result = gpu_manager.detect_devices().await;

                let Err(original_error) = detection_result else {
                    return Ok(());
                };

                #[cfg(target_os = "windows")]
                {
                    use crate::system_dependencies::system_dependencies_manager::SystemDependenciesManager;

                    // Try to add GPU drivers as dependencies and retry
                    let drivers_added = SystemDependenciesManager::get_instance()
                        .get_windows_dependencies_resolver()
                        .add_gpu_drivers_as_dependencies()
                        .await
                        .is_ok()
                        && SystemDependenciesManager::get_instance()
                            .validate_dependencies()
                            .await
                            .is_ok();

                    if drivers_added {
                        if gpu_manager.detect_devices().await.is_ok() {
                            return Ok(());
                        }

                        // Try adding Khronos OpenCL as a fallback
                        let opencl_added = SystemDependenciesManager::get_instance()
                            .get_windows_dependencies_resolver()
                            .add_khronos_opencl_as_dependency()
                            .await
                            .is_ok()
                            && SystemDependenciesManager::get_instance()
                                .validate_dependencies()
                                .await
                                .is_ok();

                        if opencl_added && gpu_manager.detect_devices().await.is_ok() {
                            return Ok(());
                        }
                    }
                }

                // Detection failed after all retries - disable GPU mining
                info!(target: LOG_TARGET_APP_LOGIC, "No compatible GPU devices found, disabling GPU mining: {original_error}");
                ConfigMining::update_field(ConfigMiningContent::set_gpu_mining_enabled, false)
                    .await?;
                ConfigMining::update_field(ConfigMiningContent::set_is_gpu_mining_recommended, false)
                    .await?;
                Ok(())
            })
            .await?;

        progress_stepper
            .complete_step(SetupStep::InitializeGpuHardware, || async {
                HardwareStatusMonitor::current()
                    .initialize_gpu_devices()
                    .await
            })
            .await?;

        let _unused = HardwareStatusMonitor::current()
            .decide_if_gpu_mining_is_recommended()
            .await;
        GpuManager::write().await.load_saved_miner().await?;

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

        Ok(())
    }
}
