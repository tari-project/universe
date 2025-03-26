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
    configs::{config_core::ConfigCore, trait_config::ConfigImpl},
    node_manager::{NodeManagerError, STOP_ON_ERROR_CODES},
    progress_tracker_old::ProgressTracker,
    progress_trackers::{progress_stepper::ProgressStepperBuilder, ProgressStepper},
    tasks_tracker::TasksTracker,
    UniverseAppState,
};
use anyhow::Error;
use log::{error, info, warn};
use tauri::{AppHandle, Manager};
use tauri_plugin_sentry::sentry;
use tokio::sync::watch;

use super::{
    setup_manager::{SetupManager, SetupPhase},
    trait_setup_phase::SetupPhaseImpl,
};

static LOG_TARGET: &str = "tari::universe::phase_hardware";
const SETUP_TIMEOUT_DURATION: Duration = Duration::from_secs(60 * 10); // 10 Minutes

#[derive(Clone, Default)]
pub struct LocalNodeSetupPhasePayload {}

#[derive(Clone, Default)]
pub struct LocalNodeSetupPhaseSessionConfiguration {}

#[derive(Clone, Default)]
pub struct LocalNodeSetupPhaseAppConfiguration {
    use_tor: bool,
}

pub struct LocalNodeSetupPhase {
    #[allow(dead_code)]
    progress_stepper: ProgressStepper,
    app_configuration: LocalNodeSetupPhaseAppConfiguration,
    session_configuration: LocalNodeSetupPhaseSessionConfiguration,
}

impl SetupPhaseImpl<LocalNodeSetupPhasePayload> for LocalNodeSetupPhase {
    type Configuration = LocalNodeSetupPhaseSessionConfiguration;

    fn new() -> Self {
        LocalNodeSetupPhase {
            progress_stepper: Self::create_progress_stepper(),
            app_configuration: LocalNodeSetupPhaseAppConfiguration::default(),
            session_configuration: LocalNodeSetupPhaseSessionConfiguration::default(),
        }
    }

    fn create_progress_stepper() -> ProgressStepper {
        ProgressStepperBuilder::new().build()
    }

    async fn load_configuration(
        &mut self,
        configuration: Self::Configuration,
    ) -> Result<(), Error> {
        self.session_configuration = configuration;

        let use_tor = *ConfigCore::current().lock().await.get_content().use_tor();
        self.app_configuration = LocalNodeSetupPhaseAppConfiguration { use_tor };

        Ok(())
    }

    async fn setup(self: std::sync::Arc<Self>, app_handle: AppHandle) {
        info!(target: LOG_TARGET, "[ Local Node Phase ] Starting setup");

        TasksTracker::current().spawn(async move {
            let setup_timeout = tokio::time::sleep(SETUP_TIMEOUT_DURATION);
            tokio::select! {
                _ = setup_timeout => {
                    error!(target: LOG_TARGET, "[ Local Node Phase ] Setup timed out");
                    let error_message = "[ Local Node Phase ] Setup timed out";
                    sentry::capture_message(error_message, sentry::Level::Error);
                }
                result = self.setup_inner(app_handle.clone()) => {
                    match result {
                        Ok(payload) => {
                            info!(target: LOG_TARGET, "[ Local Node Phase ] Setup completed successfully");
                            let __unused = self.finalize_setup(app_handle.clone(), payload).await;
                        }
                        Err(error) => {
                            error!(target: LOG_TARGET, "[ Local Node Phase ] Setup failed with error: {:?}", error);
                            let error_message = format!("[ Local Node Phase ] Setup failed with error: {:?}", error);
                            sentry::capture_message(&error_message, sentry::Level::Error);
                        }
                    }
                }
            };
        });
    }

    async fn setup_inner(
        &self,
        app_handle: AppHandle,
    ) -> Result<Option<LocalNodeSetupPhasePayload>, Error> {
        let (data_dir, config_dir, log_dir) = self.get_app_dirs(&app_handle)?;
        let state = app_handle.state::<UniverseAppState>();

        // TODO Remove once not needed
        let (tx, _rx) = watch::channel("".to_string());
        let progress = ProgressTracker::new(app_handle.clone(), Some(tx));

        let mut tor_control_port = None;
        if self.app_configuration.use_tor && !cfg!(target_os = "macos") {
            state
                .tor_manager
                .ensure_started(
                    state.shutdown.to_signal(),
                    data_dir.clone(),
                    config_dir.clone(),
                    log_dir.clone(),
                )
                .await?;
            tor_control_port = state.tor_manager.get_control_port().await?;
        }

        let remote_node_address = state.config.read().await.remote_base_node_address();

        for _i in 0..2 {
            match state
                .node_manager
                .ensure_started(
                    state.shutdown.to_signal(),
                    data_dir.clone(),
                    config_dir.clone(),
                    log_dir.clone(),
                    self.app_configuration.use_tor,
                    tor_control_port,
                    remote_node_address.clone(),
                )
                .await
            {
                Ok(_) => {}
                Err(e) => {
                    if let NodeManagerError::ExitCode(code) = e {
                        if STOP_ON_ERROR_CODES.contains(&code) {
                            warn!(target: LOG_TARGET, "Database for node is corrupt or needs a reset, deleting and trying again.");
                            state.node_manager.clean_data_folder(&data_dir).await?;
                            continue;
                        }
                    }
                    error!(target: LOG_TARGET, "Could not start node manager: {:?}", e);

                    app_handle.exit(-1);
                    return Err(e.into());
                }
            }
        }

        state.node_manager.wait_synced(progress.clone()).await?;

        Ok(None)
    }

    async fn finalize_setup(
        &self,
        app_handle: AppHandle,
        _payload: Option<LocalNodeSetupPhasePayload>,
    ) -> Result<(), Error> {
        SetupManager::get_instance()
            .lock()
            .await
            .handle_first_batch_callbacks(app_handle.clone(), SetupPhase::LocalNode, true)
            .await;

        let state = app_handle.state::<UniverseAppState>();
        state
            .events_manager
            .handle_local_node_phase_finished(&app_handle, true)
            .await;

        Ok(())
    }
}
