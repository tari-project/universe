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
    progress_trackers::{progress_stepper::ProgressStepperBuilder, ProgressStepper},
    setup::setup_manager::SetupPhase,
    tasks_tracker::TasksTracker,
    UniverseAppState,
};
use anyhow::Error;
use log::{error, info};
use tauri::{AppHandle, Manager};
use tauri_plugin_sentry::sentry;
use tokio::sync::{
    watch::{Receiver, Sender},
    Mutex,
};

use super::{setup_manager::PhaseStatus, trait_setup_phase::SetupPhaseImpl};

static LOG_TARGET: &str = "tari::universe::phase_hardware";
const SETUP_TIMEOUT_DURATION: Duration = Duration::from_secs(60 * 10); // 10 Minutes

#[derive(Clone, Default)]
pub struct RemoteNodeSetupPhaseOutput {}

#[derive(Clone, Default)]
pub struct RemoteNodeSetupPhaseAppConfiguration {}

pub struct RemoteNodeSetupPhase {
    app_handle: AppHandle,
    #[allow(dead_code)]
    progress_stepper: Mutex<ProgressStepper>,
    #[allow(dead_code)]
    app_configuration: RemoteNodeSetupPhaseAppConfiguration,
}

impl SetupPhaseImpl for RemoteNodeSetupPhase {
    type AppConfiguration = RemoteNodeSetupPhaseAppConfiguration;
    type SetupOutput = RemoteNodeSetupPhaseOutput;

    async fn new(app_handle: AppHandle) -> Self {
        RemoteNodeSetupPhase {
            app_handle: app_handle.clone(),
            progress_stepper: Mutex::new(Self::create_progress_stepper(app_handle.clone())),
            app_configuration: Self::load_app_configuration().await.unwrap_or_default(),
        }
    }

    fn get_app_handle(&self) -> &AppHandle {
        &self.app_handle
    }

    fn create_progress_stepper(app_handle: AppHandle) -> ProgressStepper {
        ProgressStepperBuilder::new().build(app_handle)
    }

    async fn load_app_configuration() -> Result<Self::AppConfiguration, Error> {
        Ok(RemoteNodeSetupPhaseAppConfiguration::default())
    }

    async fn setup(
        self: std::sync::Arc<Self>,
        status_sender: Sender<PhaseStatus>,
        mut flow_subscribers: Vec<Receiver<PhaseStatus>>,
    ) {
        info!(target: LOG_TARGET, "[ {} Phase ] Starting setup", SetupPhase::RemoteNode);

        TasksTracker::current().spawn(async move {
            for subscriber in &mut flow_subscribers.iter_mut() {
                let _unused = subscriber.wait_for(|value| value.is_success()).await;
            };

            let setup_timeout = tokio::time::sleep(SETUP_TIMEOUT_DURATION);
            tokio::select! {
                _ = setup_timeout => {
                    error!(target: LOG_TARGET, "[ {} Phase ] Setup timed out", SetupPhase::RemoteNode);
                    let error_message = format!("[ {} Phase ] Setup timed out", SetupPhase::RemoteNode);
                    sentry::capture_message(&error_message, sentry::Level::Error);
                }
                result = self.setup_inner() => {
                    match result {
                        Ok(payload) => {
                            info!(target: LOG_TARGET, "[ {} Phase ] Setup completed successfully", SetupPhase::RemoteNode);
                            let _unused = self.finalize_setup(status_sender,payload).await;
                        }
                        Err(error) => {
                            error!(target: LOG_TARGET, "[ {} Phase ] Setup failed with error: {:?}", SetupPhase::RemoteNode,error);
                            let error_message = format!("[ {} Phase ] Setup failed with error: {:?}", SetupPhase::RemoteNode,error);
                            sentry::capture_message(&error_message, sentry::Level::Error);
                        }
                    }
                }
            };
        });
    }

    async fn setup_inner(&self) -> Result<Option<RemoteNodeSetupPhaseOutput>, Error> {
        todo!()
    }

    async fn finalize_setup(
        &self,
        sender: Sender<PhaseStatus>,
        _payload: Option<RemoteNodeSetupPhaseOutput>,
    ) -> Result<(), Error> {
        sender.send(PhaseStatus::Success).ok();
        let state = self.app_handle.state::<UniverseAppState>();
        state
            .events_manager
            .handle_remote_node_phase_finished(&self.app_handle, true)
            .await;

        Ok(())
    }
}
