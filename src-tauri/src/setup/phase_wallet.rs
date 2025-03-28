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
    tasks_tracker::TasksTracker,
    UniverseAppState,
};
use anyhow::Error;
use log::{error, info};
use tauri::{AppHandle, Manager};
use tauri_plugin_sentry::sentry;
use tokio::sync::Mutex;

use super::{
    setup_manager::{SetupManager, SetupPhase},
    trait_setup_phase::SetupPhaseImpl,
};

static LOG_TARGET: &str = "tari::universe::phase_hardware";
const SETUP_TIMEOUT_DURATION: Duration = Duration::from_secs(60 * 10); // 10 Minutes

#[derive(Clone, Default)]
pub struct WalletSetupPhasePayload {}

#[derive(Clone, Default)]
pub struct WalletSetupPhaseSessionConfiguration {}

#[derive(Clone, Default)]
pub struct WalletSetupPhaseAppConfiguration {}

pub struct WalletSetupPhase {
    #[allow(dead_code)]
    progress_stepper: Mutex<ProgressStepper>,
    #[allow(dead_code)]
    app_configuration: WalletSetupPhaseAppConfiguration,
    session_configuration: WalletSetupPhaseSessionConfiguration,
}

impl SetupPhaseImpl<WalletSetupPhasePayload> for WalletSetupPhase {
    type Configuration = WalletSetupPhaseSessionConfiguration;

    fn new() -> Self {
        WalletSetupPhase {
            progress_stepper: Mutex::new(ProgressStepper::new()),
            app_configuration: WalletSetupPhaseAppConfiguration::default(),
            session_configuration: WalletSetupPhaseSessionConfiguration::default(),
        }
    }

    async fn create_progress_stepper(&mut self, app_handle: Option<AppHandle>) {
        let progress_stepper = ProgressStepperBuilder::new()
            .add_step(ProgressPlans::Wallet(ProgressSetupWalletPlan::StartWallet))
            .add_step(ProgressPlans::Wallet(
                ProgressSetupWalletPlan::InitializeSpendingWallet,
            ))
            .add_step(ProgressPlans::Wallet(ProgressSetupWalletPlan::Done))
            .calculate_percentage_steps()
            .build(app_handle.clone());
        *self.progress_stepper.lock().await = progress_stepper;
    }

    async fn load_configuration(
        &mut self,
        configuration: Self::Configuration,
    ) -> Result<(), Error> {
        self.session_configuration = configuration;

        Ok(())
    }

    async fn setup(self: std::sync::Arc<Self>, app_handle: AppHandle) {
        info!(target: LOG_TARGET, "[ Wallet Phase ] Starting setup");

        TasksTracker::current().spawn(async move {
            let setup_timeout = tokio::time::sleep(SETUP_TIMEOUT_DURATION);
            tokio::select! {
                _ = setup_timeout => {
                    error!(target: LOG_TARGET, "[ Wallet Phase ] Setup timed out");
                    let error_message = "[ Wallet Phase ] Setup timed out";
                    sentry::capture_message(error_message, sentry::Level::Error);
                }
                result = self.setup_inner(app_handle.clone()) => {
                    match result {
                        Ok(payload) => {
                            info!(target: LOG_TARGET, "[ Wallet Phase ] Setup completed successfully");
                            let _unused = self.finalize_setup(app_handle.clone(), payload).await;
                        }
                        Err(error) => {
                            error!(target: LOG_TARGET, "[ Wallet Phase ] Setup failed with error: {:?}", error);
                            let error_message = format!("[ Wallet Phase ] Setup failed with error: {:?}", error);
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
    ) -> Result<Option<WalletSetupPhasePayload>, Error> {
        let mut progress_stepper = self.progress_stepper.lock().await;
        let (data_dir, config_dir, log_dir) = self.get_app_dirs(&app_handle)?;
        let state = app_handle.state::<UniverseAppState>();

        let _unused = progress_stepper
            .resolve_step(ProgressPlans::Wallet(ProgressSetupWalletPlan::StartWallet))
            .await;

        state
            .wallet_manager
            .ensure_started(
                state.shutdown.to_signal(),
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
                state.shutdown.to_signal().clone(),
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
        app_handle: AppHandle,
        _payload: Option<WalletSetupPhasePayload>,
    ) -> Result<(), Error> {
        SetupManager::get_instance()
            .lock()
            .await
            .handle_second_batch_callbacks(app_handle.clone(), SetupPhase::Wallet, true)
            .await;

        let _unsed = self
            .progress_stepper
            .lock()
            .await
            .resolve_step(ProgressPlans::Wallet(ProgressSetupWalletPlan::Done))
            .await;

        let state = app_handle.state::<UniverseAppState>();
        state
            .events_manager
            .handle_wallet_phase_finished(&app_handle, true)
            .await;

        Ok(())
    }
}
