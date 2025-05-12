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

use log::{error, info, warn};
use tauri::{AppHandle, Manager};
use tauri_plugin_sentry::sentry;
use tokio::{
    select,
    sync::{watch::Sender, Mutex},
};

use crate::{
    auto_launcher::AutoLauncher,
    configs::{config_core::ConfigCore, trait_config::ConfigImpl},
    events_manager::EventsManager,
    progress_trackers::{
        progress_plans::ProgressPlans, progress_stepper::ProgressStepperBuilder,
        ProgressSetupCorePlan, ProgressStepper,
    },
    setup::{setup_manager::SetupPhase, utils::conditional_sleeper},
    tasks_tracker::TasksTrackers,
    utils::{network_status::NetworkStatus, platform_utils::PlatformUtils},
    UniverseAppState,
};

use super::{
    setup_manager::PhaseStatus,
    trait_setup_phase::{SetupConfiguration, SetupPhaseImpl},
};

static LOG_TARGET: &str = "tari::universe::phase_core";

#[derive(Clone, Default)]
pub struct CoreSetupPhaseOutput {}

#[derive(Clone, Default)]
pub struct CoreSetupPhaseAppConfiguration {
    is_auto_launcher_enabled: bool,
}

pub struct CoreSetupPhase {
    app_handle: AppHandle,
    progress_stepper: Mutex<ProgressStepper>,
    app_configuration: CoreSetupPhaseAppConfiguration,
    setup_configuration: SetupConfiguration,
    status_sender: Sender<PhaseStatus>,
}

impl SetupPhaseImpl for CoreSetupPhase {
    type AppConfiguration = CoreSetupPhaseAppConfiguration;

    async fn new(
        app_handle: AppHandle,
        status_sender: Sender<PhaseStatus>,
        configuration: SetupConfiguration,
    ) -> Self {
        Self {
            app_handle: app_handle.clone(),
            progress_stepper: Mutex::new(CoreSetupPhase::create_progress_stepper(app_handle)),
            app_configuration: CoreSetupPhase::load_app_configuration()
                .await
                .unwrap_or_default(),
            setup_configuration: configuration,
            status_sender,
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
            .add_step(ProgressPlans::Core(ProgressSetupCorePlan::Done))
            .build(app_handle)
    }

    async fn load_app_configuration() -> Result<Self::AppConfiguration, anyhow::Error> {
        let is_auto_launcher_enabled = *ConfigCore::content().await.should_auto_launch();

        Ok(CoreSetupPhaseAppConfiguration {
            is_auto_launcher_enabled,
        })
    }

    async fn setup(mut self) {
        info!(target: LOG_TARGET, "[ {} Phase ] Starting setup", SetupPhase::Core);
        TasksTrackers::current().core_phase.get_task_tracker().await.spawn(async move {
            let mut shutdown_signal = TasksTrackers::current().core_phase.get_signal().await;
            for subscriber in &mut self.setup_configuration.listeners_for_required_phases_statuses.iter_mut() {
                select! {
                    _ = subscriber.wait_for(|value| value.is_success()) => {}
                    _ = shutdown_signal.wait() => {
                        warn!(target: LOG_TARGET, "[ {} Phase ] Setup cancelled", SetupPhase::Core);
                        return;
                    }
                }
            };
            tokio::select! {
                result = conditional_sleeper(self.setup_configuration.setup_timeout_duration) => {
                    if result.is_some() {
                        error!(target: LOG_TARGET, "[ {} Phase ] Setup timed out", SetupPhase::Core);
                        let error_message = format!("[ {} Phase ] Setup timed out", SetupPhase::Core);
                        sentry::capture_message(&error_message, sentry::Level::Error);
                        EventsManager::handle_critical_problem(&self.app_handle, Some(SetupPhase::Core.get_critical_problem_title()), Some(SetupPhase::Core.get_critical_problem_description()))
                        .await;
                    }
                }
                result = self.setup_inner() => {
                    match result {
                        Ok(_) => {
                            info!(target: LOG_TARGET, "[ {} Phase ] Setup completed successfully", SetupPhase::Core);
                            let _unused = self.finalize_setup().await;
                        }
                        Err(error) => {
                            error!(target: LOG_TARGET, "[ {} Phase ] Setup failed with error: {:?}", SetupPhase::Core,error);
                            let error_message = format!("[ {} Phase ] Setup failed with error: {:?}", SetupPhase::Core,error);
                            sentry::capture_message(&error_message, sentry::Level::Error);
                            EventsManager::handle_critical_problem(&self.app_handle, Some(SetupPhase::Core.get_critical_problem_title()), Some(SetupPhase::Core.get_critical_problem_description()))
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

    #[allow(clippy::too_many_lines)]
    async fn setup_inner(&self) -> Result<(), anyhow::Error> {
        let mut progress_stepper = self.progress_stepper.lock().await;
        let state = self.app_handle.state::<UniverseAppState>();

        progress_stepper
            .resolve_step(ProgressPlans::Core(
                ProgressSetupCorePlan::PlatformPrequisites,
            ))
            .await;
        PlatformUtils::initialize_preqesities(self.app_handle.clone()).await?;

        progress_stepper
            .resolve_step(ProgressPlans::Core(
                ProgressSetupCorePlan::InitializeApplicationModules,
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

        state
            .mining_status_manager
            .write()
            .await
            .set_app_handle(self.app_handle.clone());

        progress_stepper
            .resolve_step(ProgressPlans::Core(ProgressSetupCorePlan::NetworkSpeedTest))
            .await;

        NetworkStatus::current()
            .run_speed_test_with_timeout(&self.app_handle)
            .await;

        Ok(())
    }

    async fn finalize_setup(&self) -> Result<(), anyhow::Error> {
        self.status_sender.send(PhaseStatus::Success).ok();

        self.progress_stepper
            .lock()
            .await
            .resolve_step(ProgressPlans::Core(ProgressSetupCorePlan::Done))
            .await;

        EventsManager::handle_core_phase_finished(&self.app_handle, true).await;

        Ok(())
    }
}
