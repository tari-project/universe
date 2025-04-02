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
    progress_trackers::{
        progress_plans::{ProgressPlans, ProgressSetupWalletPlan},
        progress_stepper::ProgressStepperBuilder,
        ProgressStepper,
    },
    setup::setup_manager::SetupPhase,
    tasks_tracker::TasksTrackers,
    UniverseAppState,
};
use anyhow::Error;
use log::{error, info,warn};
use tauri::{AppHandle, Manager};
use tauri_plugin_sentry::sentry;
use tokio::{select, sync::{
    watch::{Receiver, Sender},
    Mutex,
}};

use super::{setup_manager::PhaseStatus, trait_setup_phase::SetupPhaseImpl};

static LOG_TARGET: &str = "tari::universe::phase_hardware";
const SETUP_TIMEOUT_DURATION: Duration = Duration::from_secs(60 * 10); // 10 Minutes

#[derive(Clone, Default)]
pub struct WalletSetupPhaseOutput {}

#[derive(Clone, Default)]
pub struct WalletSetupPhaseAppConfiguration {}

pub struct WalletSetupPhase {
    app_handle: AppHandle,
    progress_stepper: Mutex<ProgressStepper>,
    #[allow(dead_code)]
    app_configuration: WalletSetupPhaseAppConfiguration,
}

impl SetupPhaseImpl for WalletSetupPhase {
    type AppConfiguration = WalletSetupPhaseAppConfiguration;
    type SetupOutput = WalletSetupPhaseOutput;

    async fn new(app_handle: AppHandle) -> Self {
        Self {
            app_handle: app_handle.clone(),
            progress_stepper: Mutex::new(Self::create_progress_stepper(app_handle.clone())),
            app_configuration: Self::load_app_configuration().await.unwrap_or_default(),
        }
    }

    fn get_app_handle(&self) -> &AppHandle {
        &self.app_handle
    }

    fn create_progress_stepper(app_handle: AppHandle) -> ProgressStepper {
        ProgressStepperBuilder::new()
            .add_step(ProgressPlans::Wallet(ProgressSetupWalletPlan::StartWallet))
            .add_step(ProgressPlans::Wallet(
                ProgressSetupWalletPlan::InitializeSpendingWallet,
            ))
            .add_step(ProgressPlans::Wallet(ProgressSetupWalletPlan::Done))
            .build(app_handle)
    }

    async fn load_app_configuration() -> Result<Self::AppConfiguration, Error> {
        Ok(WalletSetupPhaseAppConfiguration::default())
    }

    async fn setup(
        self: std::sync::Arc<Self>,
        status_sender: Sender<PhaseStatus>,
        mut flow_subscribers: Vec<Receiver<PhaseStatus>>,
    ) {
        info!(target: LOG_TARGET, "[ {} Phase ] Starting setup", SetupPhase::Wallet);

        TasksTrackers::current().wallet_phase.get_task_tracker().await.spawn(async move {
            let setup_timeout = tokio::time::sleep(SETUP_TIMEOUT_DURATION);
            let mut shutdown_signal = TasksTrackers::current().wallet_phase.get_signal().await;
            for subscriber in &mut flow_subscribers.iter_mut() {
                select! {
                    _ = subscriber.wait_for(|value| value.is_success()) => {}
                    _ = shutdown_signal.wait() => {
                        warn!(target: LOG_TARGET, "[ {} Phase ] Setup cancelled", SetupPhase::Wallet);
                        return;
                    }
                }
            };

            tokio::select! {
                _ = setup_timeout => {
                    error!(target: LOG_TARGET, "[ {} Phase ] Setup timed out", SetupPhase::Wallet);
                    let error_message = format!("[ {} Phase ] Setup timed out", SetupPhase::Wallet);
                    sentry::capture_message(&error_message, sentry::Level::Error);
                }
                result = self.setup_inner() => {
                    match result {
                        Ok(payload) => {
                            info!(target: LOG_TARGET, "[ {} Phase ] Setup completed successfully", SetupPhase::Wallet);
                            let _unused = self.finalize_setup(status_sender, payload).await;
                        }
                        Err(error) => {
                            error!(target: LOG_TARGET, "[ {} Phase ] Setup failed with error: {:?}", SetupPhase::Wallet,error);
                            let error_message = format!("[ {} Phase ] Setup failed with error: {:?}", SetupPhase::Wallet,error);
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

    async fn setup_inner(&self) -> Result<Option<WalletSetupPhaseOutput>, Error> {
        let mut progress_stepper = self.progress_stepper.lock().await;
        let (data_dir, config_dir, log_dir) = self.get_app_dirs()?;
        let state = self.app_handle.state::<UniverseAppState>();

        let _unused = progress_stepper
            .resolve_step(ProgressPlans::Wallet(ProgressSetupWalletPlan::StartWallet))
            .await;

        state
            .wallet_manager
            .ensure_started(
                TasksTrackers::current().wallet_phase.get_signal().await,
                data_dir.clone(),
                config_dir.clone(),
                log_dir.clone(),
            )
            .await?;

        let _unused = progress_stepper
            .resolve_step(ProgressPlans::Wallet(
                ProgressSetupWalletPlan::InitializeSpendingWallet,
            ))
            .await;

        let mut spend_wallet_manager = state.spend_wallet_manager.write().await;
        spend_wallet_manager
            .init(
                TasksTrackers::current().wallet_phase.get_signal().await.clone(),
                data_dir,
                config_dir,
                log_dir,
            )
            .await?;
        drop(spend_wallet_manager);

        Ok(None)
    }

    async fn finalize_setup(
        &self,
        sender: Sender<PhaseStatus>,
        _payload: Option<WalletSetupPhaseOutput>,
    ) -> Result<(), Error> {
        sender.send(PhaseStatus::Success).ok();
        let _unsed = self
            .progress_stepper
            .lock()
            .await
            .resolve_step(ProgressPlans::Wallet(ProgressSetupWalletPlan::Done))
            .await;

        let state = self.app_handle.state::<UniverseAppState>();
        state
            .events_manager
            .handle_wallet_phase_finished(&self.app_handle, true)
            .await;

        Ok(())
    }
}
