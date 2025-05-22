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
    setup::{setup_manager::SetupPhase, utils::conditional_sleeper},
    systemtray_manager::SystemTrayData,
    tasks_tracker::TasksTrackers,
    utils::locks_utils::try_write_with_retry,
    GpuMinerStatus, UniverseAppState,
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
    setup_manager::{PhaseStatus, SetupFeaturesList},
    trait_setup_phase::{SetupConfiguration, SetupPhaseImpl},
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
    setup_features: SetupFeaturesList,
}

impl SetupPhaseImpl for HardwareSetupPhase {
    type AppConfiguration = HardwareSetupPhaseAppConfiguration;

    async fn new(
        app_handle: AppHandle,
        status_sender: Sender<PhaseStatus>,
        configuration: SetupConfiguration,
        setup_features: SetupFeaturesList,
    ) -> Self {
        Self {
            app_handle: app_handle.clone(),
            progress_stepper: Mutex::new(Self::create_progress_stepper(app_handle.clone())),
            app_configuration: Self::load_app_configuration().await.unwrap_or_default(),
            setup_configuration: configuration,
            status_sender,
            setup_features,
        }
    }

    fn get_app_handle(&self) -> &AppHandle {
        &self.app_handle
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

    async fn setup(mut self) {
        info!(target: LOG_TARGET, "[ {} Phase ] Starting setup", SetupPhase::Hardware);

        TasksTrackers::current().hardware_phase.get_task_tracker().await.spawn(async move {
            let mut shutdown_signal = TasksTrackers::current().hardware_phase.get_signal().await;
            for subscriber in &mut self.setup_configuration.listeners_for_required_phases_statuses.iter_mut() {
                select! {
                    _ = subscriber.wait_for(|value| value.is_success()) => {}
                    _ = shutdown_signal.wait() => {
                        warn!(target: LOG_TARGET, "[ {} Phase ] Setup cancelled", SetupPhase::Hardware);
                        return;
                    }
                }
            };
            tokio::select! {
                result = conditional_sleeper(self.setup_configuration.setup_timeout_duration) => {
                    if result.is_some() {
                        error!(target: LOG_TARGET, "[ {} Phase ] Setup timed out", SetupPhase::Hardware);
                        let error_message = format!("[ {} Phase ] Setup timed out", SetupPhase::Hardware);
                        sentry::capture_message(&error_message, sentry::Level::Error);
                        EventsManager::handle_critical_problem(&self.app_handle, Some(SetupPhase::Hardware.get_critical_problem_title()), Some(SetupPhase::Hardware.get_critical_problem_description()),Some(error_message))
                        .await;
                    }
                }
                result = self.setup_inner() => {
                    match result {
                        Ok(_) => {
                            info!(target: LOG_TARGET, "[ {} Phase ] Setup completed successfully", SetupPhase::Hardware);
                            let _unused = self.finalize_setup().await;
                        }
                        Err(error) => {
                            error!(target: LOG_TARGET, "[ {} Phase ] Setup failed with error: {:?}", SetupPhase::Hardware,error);
                            let error_message = format!("[ {} Phase ] Setup failed with error: {:?}", SetupPhase::Hardware,error);
                            sentry::capture_message(&error_message, sentry::Level::Error);
                            EventsManager
                                ::handle_critical_problem(&self.app_handle, Some(SetupPhase::Hardware.get_critical_problem_title()), Some(SetupPhase::Hardware.get_critical_problem_description()),Some(error_message))
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

        Ok(())
    }

    async fn finalize_setup(&self) -> Result<(), Error> {
        self.status_sender.send(PhaseStatus::Success).ok();
        self.progress_stepper
            .lock()
            .await
            .resolve_step(ProgressPlans::Hardware(ProgressSetupHardwarePlan::Done))
            .await;

        let app_handle_clone = self.app_handle.clone();
        TasksTrackers::current().hardware_phase.get_task_tracker().await.spawn(async move {
            let app_state = app_handle_clone.state::<UniverseAppState>().clone();
            let mut gpu_status_watch_rx = (*app_state.gpu_latest_status).clone();
            let mut cpu_miner_status_watch_rx = (*app_state.cpu_miner_status_watch_rx).clone();
            let mut shutdown_signal = TasksTrackers::current().hardware_phase.get_signal().await;

            loop {
                select! {
                    _ = gpu_status_watch_rx.changed() => {
                        let gpu_status: GpuMinerStatus = gpu_status_watch_rx.borrow().clone();
                        let _ = EventsManager::handle_gpu_mining_update(&app_handle_clone, gpu_status).await;
                    },
                    _ = cpu_miner_status_watch_rx.changed() => {
                        let cpu_status = cpu_miner_status_watch_rx.borrow().clone();
                        let _ = EventsManager::handle_cpu_mining_update(&app_handle_clone, cpu_status.clone()).await;

                        // Update systemtray data
                        let gpu_status: GpuMinerStatus = gpu_status_watch_rx.borrow().clone();
                        let systray_data = SystemTrayData {
                            cpu_hashrate: cpu_status.hash_rate,
                            gpu_hashrate: gpu_status.hash_rate,
                            estimated_earning: (cpu_status.estimated_earnings
                                + gpu_status.estimated_earnings) as f64,
                        };

                        match try_write_with_retry(&app_state.systemtray_manager, 6).await {
                            Ok(mut sm) => {
                                sm.update_tray(systray_data);
                            },
                            Err(e) => {
                                let err_msg = format!("Failed to acquire systemtray_manager write lock: {}", e);
                                error!(target: LOG_TARGET, "{}", err_msg);
                                sentry::capture_message(&err_msg, sentry::Level::Error);
                            }
                        }
                    }
                    _ = shutdown_signal.wait() => {
                        break;
                    },
                }
            }
        });

        EventsManager::handle_hardware_phase_finished(&self.app_handle, true).await;
        Ok(())
    }
}
