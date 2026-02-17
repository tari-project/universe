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

use tari_shutdown::ShutdownSignal;
use tauri::{AppHandle, Manager};
use tokio::sync::{
    Mutex,
    watch::{Receiver, Sender},
};
use tokio_util::task::TaskTracker;

use crate::{
    UniverseAppState,
    auto_launcher::AutoLauncher,
    configs::{config_core::ConfigCore, trait_config::ConfigImpl},
    progress_trackers::{
        progress_plans::SetupStep,
        progress_stepper::{ProgressStepper, ProgressStepperBuilder},
    },
    setup::setup_manager::SetupPhase,
    tasks_tracker::TasksTrackers,
    utils::network_status::NetworkStatus,
};

use super::{
    listeners::SetupFeaturesList,
    setup_manager::PhaseStatus,
    trait_setup_phase::{SetupConfiguration, SetupPhaseImpl},
    utils::{setup_default_adapter::SetupDefaultAdapter, timeout_watcher::TimeoutWatcher},
};

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
    #[allow(dead_code)]
    setup_features: SetupFeaturesList,
    timeout_watcher: TimeoutWatcher,
}

impl SetupPhaseImpl for CoreSetupPhase {
    type AppConfiguration = CoreSetupPhaseAppConfiguration;

    async fn new(
        app_handle: AppHandle,
        status_sender: Sender<PhaseStatus>,
        configuration: SetupConfiguration,
        setup_features: SetupFeaturesList,
    ) -> Self {
        let timeout_watcher = TimeoutWatcher::new(configuration.setup_timeout_duration);
        Self {
            app_handle: app_handle.clone(),
            progress_stepper: Mutex::new(CoreSetupPhase::create_progress_stepper(
                app_handle,
                status_sender.clone(),
                timeout_watcher.get_sender(),
            )),
            app_configuration: CoreSetupPhase::load_app_configuration()
                .await
                .unwrap_or_default(),
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
        TasksTrackers::current().core_phase.get_signal().await
    }
    async fn get_task_tracker(&self) -> TaskTracker {
        TasksTrackers::current().core_phase.get_task_tracker().await
    }
    fn get_phase_dependencies(&self) -> Vec<Receiver<PhaseStatus>> {
        self.setup_configuration
            .listeners_for_required_phases_statuses
            .clone()
    }
    fn get_phase_id(&self) -> SetupPhase {
        SetupPhase::Core
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
            .add_step(SetupStep::InitializeApplicationModules, false)
            .add_step(SetupStep::NetworkSpeedTest, false)
            .build(
                app_handle,
                timeout_watcher_sender,
                status_sender,
                SetupPhase::Core,
            )
    }

    async fn load_app_configuration() -> Result<Self::AppConfiguration, anyhow::Error> {
        let is_auto_launcher_enabled = *ConfigCore::content().await.should_auto_launch();

        Ok(CoreSetupPhaseAppConfiguration {
            is_auto_launcher_enabled,
        })
    }

    async fn setup(self) {
        SetupDefaultAdapter::setup(self).await;
    }

    #[allow(clippy::too_many_lines)]
    async fn setup_inner(&self) -> Result<(), anyhow::Error> {
        let mut progress_stepper = self.progress_stepper.lock().await;

        progress_stepper
            .complete_step(SetupStep::InitializeApplicationModules, || async {
                let state = self.app_handle.state::<UniverseAppState>();

                state
                    .updates_manager
                    .init_periodic_updates(&self.app_handle)
                    .await?;

                AutoLauncher::current()
                    .initialize_auto_launcher(self.app_configuration.is_auto_launcher_enabled)
                    .await?;

                state
                    .mining_status_manager
                    .write()
                    .await
                    .set_app_handle(&self.app_handle);

                Ok(())
            })
            .await?;

        progress_stepper
            .complete_step(SetupStep::NetworkSpeedTest, || async {
                NetworkStatus::current().run_speed_test_with_timeout().await;
                Ok(())
            })
            .await?;

        Ok(())
    }

    async fn finalize_setup(&self) -> Result<(), anyhow::Error> {
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
