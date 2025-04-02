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

use std::{
    sync::Arc,
    time::{Duration, SystemTime},
};

use log::{error, info, warn};
use tauri::{AppHandle, Manager};
use tauri_plugin_sentry::sentry;
use tokio::{
    select,
    sync::{
        watch::{self, Receiver, Sender},
        Mutex,
    },
};

use crate::{
    auto_launcher::AutoLauncher,
    binaries::{Binaries, BinaryResolver},
    configs::{config_core::ConfigCore, trait_config::ConfigImpl},
    progress_tracker_old::ProgressTracker,
    progress_trackers::{
        progress_plans::ProgressPlans, progress_stepper::ProgressStepperBuilder,
        ProgressSetupCorePlan, ProgressStepper,
    },
    setup::setup_manager::SetupPhase,
    tasks_tracker::TasksTrackers,
    utils::{
        network_status::NetworkStatus, platform_utils::PlatformUtils,
        shutdown_utils::resume_all_processes, system_status::SystemStatus,
    },
    UniverseAppState,
};

use super::{setup_manager::PhaseStatus, trait_setup_phase::SetupPhaseImpl};

static LOG_TARGET: &str = "tari::universe::phase_core";
const TIME_BETWEEN_BINARIES_UPDATES: Duration = Duration::from_secs(60 * 60 * 6);
const SETUP_TIMEOUT_DURATION: Duration = Duration::from_secs(60 * 10); // 10 Minutes

#[derive(Clone, Default)]
pub struct CoreSetupPhaseOutput {}

#[derive(Clone, Default)]
pub struct CoreSetupPhaseAppConfiguration {
    is_auto_launcher_enabled: bool,
    last_binaries_update_timestamp: Option<SystemTime>,
    use_tor: bool,
}

pub struct CoreSetupPhase {
    app_handle: AppHandle,
    progress_stepper: Mutex<ProgressStepper>,
    app_configuration: CoreSetupPhaseAppConfiguration,
}

impl SetupPhaseImpl for CoreSetupPhase {
    type AppConfiguration = CoreSetupPhaseAppConfiguration;
    type SetupOutput = CoreSetupPhaseOutput;

    async fn new(app_handle: AppHandle) -> Self {
        Self {
            app_handle: app_handle.clone(),
            progress_stepper: Mutex::new(CoreSetupPhase::create_progress_stepper(app_handle)),
            app_configuration: CoreSetupPhase::load_app_configuration()
                .await
                .unwrap_or_default(),
        }
    }

    fn get_app_handle(&self) -> &AppHandle {
        &self.app_handle
    }

    fn create_progress_stepper(app_handle: AppHandle) -> ProgressStepper {
        ProgressStepperBuilder::new()
            .add_step(ProgressPlans::Core(
                ProgressSetupCorePlan::PlatformPrequisites,
            ))
            .add_step(ProgressPlans::Core(
                ProgressSetupCorePlan::InitializeApplicationModules,
            ))
            .add_step(ProgressPlans::Core(ProgressSetupCorePlan::NetworkSpeedTest))
            .add_step(ProgressPlans::Core(ProgressSetupCorePlan::BinariesTor))
            .add_step(ProgressPlans::Core(ProgressSetupCorePlan::BinariesNode))
            .add_step(ProgressPlans::Core(
                ProgressSetupCorePlan::BinariesMergeMiningProxy,
            ))
            .add_step(ProgressPlans::Core(ProgressSetupCorePlan::BinariesWallet))
            .add_step(ProgressPlans::Core(ProgressSetupCorePlan::BinariesGpuMiner))
            .add_step(ProgressPlans::Core(ProgressSetupCorePlan::BinariesCpuMiner))
            .add_step(ProgressPlans::Core(ProgressSetupCorePlan::BinariesP2pool))
            .add_step(ProgressPlans::Core(ProgressSetupCorePlan::StartTor))
            .add_step(ProgressPlans::Core(ProgressSetupCorePlan::Done))
            .build(app_handle)
    }

    async fn load_app_configuration() -> Result<Self::AppConfiguration, anyhow::Error> {
        let is_auto_launcher_enabled = *ConfigCore::current()
            .lock()
            .await
            .get_content()
            .should_auto_launch();

        let last_binaries_update_timestamp = *ConfigCore::current()
            .lock()
            .await
            .get_content()
            .last_binaries_update_timestamp();

        let use_tor = *ConfigCore::current().lock().await.get_content().use_tor();

        Ok(CoreSetupPhaseAppConfiguration {
            is_auto_launcher_enabled,
            last_binaries_update_timestamp,
            use_tor,
        })
    }

    async fn setup(
        self: Arc<Self>,
        status_sender: Sender<PhaseStatus>,
        mut flow_subscribers: Vec<Receiver<PhaseStatus>>,
    ) {
        info!(target: LOG_TARGET, "[ {} Phase ] Starting setup", SetupPhase::Core);
        TasksTrackers::current().core_phase.get_task_tracker().await.spawn(async move {
            let setup_timeout = tokio::time::sleep(SETUP_TIMEOUT_DURATION);
            let mut shutdown_signal = TasksTrackers::current().core_phase.get_signal().await;
            for subscriber in &mut flow_subscribers.iter_mut() {
                select! {
                    _ = subscriber.wait_for(|value| value.is_success()) => {}
                    _ = shutdown_signal.wait() => {
                        warn!(target: LOG_TARGET, "[ {} Phase ] Setup cancelled", SetupPhase::Core);
                        return;
                    }
                }
            };
            tokio::select! {
                _ = setup_timeout => {
                    error!(target: LOG_TARGET, "[ {} Phase ] Setup timed out", SetupPhase::Core);
                    let error_message = format!("[ {} Phase ] Setup timed out", SetupPhase::Core);
                    sentry::capture_message(&error_message, sentry::Level::Error);
                }
                result = self.setup_inner() => {
                    match result {
                        Ok(payload) => {
                            info!(target: LOG_TARGET, "[ {} Phase ] Setup completed successfully", SetupPhase::Core);
                            let _unused = self.finalize_setup(status_sender,payload).await;
                        }
                        Err(error) => {
                            error!(target: LOG_TARGET, "[ {} Phase ] Setup failed with error: {:?}", SetupPhase::Core,error);
                            let error_message = format!("[ {} Phase ] Setup failed with error: {:?}", SetupPhase::Core,error);
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

    #[allow(clippy::too_many_lines)]
    async fn setup_inner(&self) -> Result<Option<CoreSetupPhaseOutput>, anyhow::Error> {
        let mut progress_stepper = self.progress_stepper.lock().await;
        let state = self.app_handle.state::<UniverseAppState>();
        state
            .events_manager
            .handle_app_config_loaded(&self.app_handle)
            .await;

        // TODO Remove once not needed
        let (tx, rx) = watch::channel("".to_string());
        let progress = ProgressTracker::new(self.app_handle.clone(), Some(tx));

        PlatformUtils::initialize_preqesities(self.app_handle.clone()).await?;
        let _unused = progress_stepper
            .resolve_step(ProgressPlans::Core(
                ProgressSetupCorePlan::PlatformPrequisites,
            ))
            .await;

        state
            .updates_manager
            .init_periodic_updates(self.app_handle.clone())
            .await?;

        let _unused = state
            .systemtray_manager
            .write()
            .await
            .initialize_tray(self.app_handle.clone());

        let _unused = AutoLauncher::current()
            .initialize_auto_launcher(self.app_configuration.is_auto_launcher_enabled)
            .await
            .inspect_err(
                |e| error!(target: LOG_TARGET, "Could not initialize auto launcher: {:?}", e),
            );

        let now = SystemTime::now();

        state
            .telemetry_manager
            .write()
            .await
            .initialize(self.app_handle.clone())
            .await?;

        let mut telemetry_id = state
            .telemetry_manager
            .read()
            .await
            .get_unique_string()
            .await;
        if telemetry_id.is_empty() {
            telemetry_id = "unknown_miner_tari_universe".to_string();
        }

        let app_version = self.app_handle.package_info().version.clone();
        state
            .telemetry_service
            .write()
            .await
            .init(app_version.to_string(), telemetry_id.clone())
            .await?;

        let mut binary_resolver = BinaryResolver::current().write().await;
        let should_check_for_update = now
            .duration_since(
                self.app_configuration
                    .last_binaries_update_timestamp
                    .unwrap_or(SystemTime::UNIX_EPOCH),
            )
            .unwrap_or(Duration::from_secs(0))
            .gt(&TIME_BETWEEN_BINARIES_UPDATES);

        let _unused = progress_stepper
            .resolve_step(ProgressPlans::Core(
                ProgressSetupCorePlan::InitializeApplicationModules,
            ))
            .await;

        NetworkStatus::current()
            .run_speed_test_with_timeout(&self.app_handle)
            .await;

        let _unused = progress_stepper
            .resolve_step(ProgressPlans::Core(ProgressSetupCorePlan::NetworkSpeedTest))
            .await;

        if self.app_configuration.use_tor && !cfg!(target_os = "macos") {
            binary_resolver
                .initialize_binary_timeout(
                    Binaries::Tor,
                    progress.clone(),
                    should_check_for_update,
                    rx.clone(),
                )
                .await?;
            let _unused = progress_stepper
                .resolve_step(ProgressPlans::Core(ProgressSetupCorePlan::BinariesTor))
                .await;
        } else {
            let _unused =
                progress_stepper.skip_step(ProgressPlans::Core(ProgressSetupCorePlan::BinariesTor));
        };

        binary_resolver
            .initialize_binary_timeout(
                Binaries::MinotariNode,
                progress.clone(),
                should_check_for_update,
                rx.clone(),
            )
            .await?;
        let _unused = progress_stepper
            .resolve_step(ProgressPlans::Core(ProgressSetupCorePlan::BinariesNode))
            .await;

        binary_resolver
            .initialize_binary_timeout(
                Binaries::MergeMiningProxy,
                progress.clone(),
                should_check_for_update,
                rx.clone(),
            )
            .await?;
        let _unused = progress_stepper
            .resolve_step(ProgressPlans::Core(
                ProgressSetupCorePlan::BinariesMergeMiningProxy,
            ))
            .await;

        binary_resolver
            .initialize_binary_timeout(
                Binaries::Wallet,
                progress.clone(),
                should_check_for_update,
                rx.clone(),
            )
            .await?;
        let _unused = progress_stepper
            .resolve_step(ProgressPlans::Core(ProgressSetupCorePlan::BinariesWallet))
            .await;

        binary_resolver
            .initialize_binary_timeout(
                Binaries::GpuMiner,
                progress.clone(),
                should_check_for_update,
                rx.clone(),
            )
            .await?;
        let _unused = progress_stepper
            .resolve_step(ProgressPlans::Core(ProgressSetupCorePlan::BinariesGpuMiner))
            .await;

        let _unused = progress_stepper
            .resolve_step(ProgressPlans::Core(ProgressSetupCorePlan::BinariesCpuMiner))
            .await;
        binary_resolver
            .initialize_binary_timeout(
                Binaries::Xmrig,
                progress.clone(),
                should_check_for_update,
                rx.clone(),
            )
            .await?;

        binary_resolver
            .initialize_binary_timeout(
                Binaries::ShaP2pool,
                progress.clone(),
                should_check_for_update,
                rx.clone(),
            )
            .await?;
        let _unused = progress_stepper
            .resolve_step(ProgressPlans::Core(ProgressSetupCorePlan::BinariesP2pool))
            .await;

        if should_check_for_update {
            state
                .config
                .write()
                .await
                .set_last_binaries_update_timestamp(now)
                .await?;
        }

        //drop binary resolver to release the lock
        drop(binary_resolver);

        let _uunused = progress_stepper
            .resolve_step(ProgressPlans::Core(ProgressSetupCorePlan::StartTor))
            .await;

        let (data_dir, config_dir, log_dir) = self.get_app_dirs()?;

        if self.app_configuration.use_tor && !cfg!(target_os = "macos") {
            state
                .tor_manager
                .ensure_started(data_dir.clone(), config_dir.clone(), log_dir.clone())
                .await?;
        }

        Ok(None)
    }

    async fn finalize_setup(
        &self,
        sender: Sender<PhaseStatus>,
        _payload: Option<CoreSetupPhaseOutput>,
    ) -> Result<(), anyhow::Error> {
        sender.send(PhaseStatus::Success).ok();

        let _unused = self
            .progress_stepper
            .lock()
            .await
            .resolve_step(ProgressPlans::Core(ProgressSetupCorePlan::Done))
            .await;

        let state = self.app_handle.state::<UniverseAppState>();
        state
            .events_manager
            .handle_core_phase_finished(&self.app_handle, true)
            .await;

        let app_handle_clone: tauri::AppHandle = self.app_handle.clone();
        TasksTrackers::current().common.get_task_tracker().await.spawn(async move {
            let mut receiver = SystemStatus::current().get_sleep_mode_watcher();
            let mut last_state = *receiver.borrow();
            let mut shutdown_signal = TasksTrackers::current().common.get_signal().await;
            loop {
                select! {
                    _ = receiver.changed() => {
                        let current_state = *receiver.borrow();
                        if last_state && !current_state {
                            info!(target: LOG_TARGET, "System is no longer in sleep mode");
                            let _unused = resume_all_processes(app_handle_clone.clone()).await;
                        }
                        if !last_state && current_state {
                            info!(target: LOG_TARGET, "System entered sleep mode");
                            TasksTrackers::current().stop_all_processes().await;
                        }
                        last_state = current_state;
                    }
                    _ = shutdown_signal.wait() => {
                    break;
                }
            }

            }

            // loop {
            //     if receiver.changed().await.is_ok() {
            //         let current_state = *receiver.borrow();

            //         if last_state && !current_state {
            //             info!(target: LOG_TARGET, "System is no longer in sleep mode");
            //             let _unused = resume_all_processes(app_handle_clone.clone()).await;
            //         }

            //         if !last_state && current_state {
            //             info!(target: LOG_TARGET, "System entered sleep mode");
            //             TasksTrackers::current().stop_all_processes().await;
            //         }

            //         last_state = current_state;
            //     } else {
            //         error!(target: LOG_TARGET, "Failed to receive sleep mode change");
            //     }
            // }
        });

        Ok(())
    }
}
