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

use log::error;
use tari_shutdown::ShutdownSignal;
use tauri::{AppHandle, Manager};
use tokio::sync::{
    watch::{Receiver, Sender},
    Mutex,
};

use crate::{
    auto_launcher::AutoLauncher,
    configs::{config_core::ConfigCore, trait_config::ConfigImpl},
    events_manager::EventsManager,
    progress_trackers::{
        progress_plans::ProgressPlans, progress_stepper::ProgressStepperBuilder,
        ProgressSetupCorePlan, ProgressStepper,
    },
    setup::setup_manager::SetupPhase,
    tasks_tracker::TasksTrackers,
    utils::{network_status::NetworkStatus, platform_utils::PlatformUtils},
    UniverseAppState,
};

use super::{
    setup_manager::PhaseStatus,
    trait_setup_phase::{SetupConfiguration, SetupPhaseImpl},
    utils::setup_default_adapter::SetupDefaultAdapter,
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
    type SetupOutput = CoreSetupPhaseOutput;

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

    fn get_max_soft_restarts(&self) -> u8 {
        self.setup_configuration.soft_retires.unwrap_or(0)
    }

    fn get_phase_dependencies(&self) -> Vec<Receiver<PhaseStatus>> {
        self.setup_configuration
            .listeners_for_required_phases_statuses
            .clone()
    }

    fn get_phase_name(&self) -> SetupPhase {
        SetupPhase::Core
    }

    async fn get_shutdown_signal(&self) -> ShutdownSignal {
        TasksTrackers::current().core_phase.get_signal().await
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
        TasksTrackers::current().core_phase.get_task_tracker().await
    }

    fn get_max_hard_restarts(&self) -> u8 {
        self.setup_configuration.hard_retires.unwrap_or(0)
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

    async fn hard_reset(&self) -> Result<(), anyhow::Error> {
        Ok(())
    }

    async fn setup(self) {
        let _unused = SetupDefaultAdapter::setup(self).await;
    }

    #[allow(clippy::too_many_lines)]
    async fn setup_inner(&self) -> Result<Option<CoreSetupPhaseOutput>, anyhow::Error> {
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

        progress_stepper
            .resolve_step(ProgressPlans::Core(ProgressSetupCorePlan::NetworkSpeedTest))
            .await;

        NetworkStatus::current()
            .run_speed_test_with_timeout(&self.app_handle)
            .await;

        Ok(None)
    }

    async fn finalize_setup(
        &self,
        sender: Sender<PhaseStatus>,
        _payload: Option<CoreSetupPhaseOutput>,
    ) -> Result<(), anyhow::Error> {
        sender.send(PhaseStatus::Success).ok();

        self.progress_stepper
            .lock()
            .await
            .resolve_step(ProgressPlans::Core(ProgressSetupCorePlan::Done))
            .await;

        EventsManager::handle_core_phase_finished(&self.app_handle, true).await;

        Ok(())
    }
}
