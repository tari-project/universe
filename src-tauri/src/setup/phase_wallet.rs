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
        config_core::ConfigCore,
        config_ui::{ConfigUI, ConfigUIContent},
        trait_config::ConfigImpl,
    },
    events_emitter::EventsEmitter,
    events_manager::EventsManager,
    progress_tracker_old::ProgressTracker,
    progress_trackers::{
        progress_plans::{ProgressPlans, ProgressSetupWalletPlan},
        progress_stepper::ProgressStepperBuilder,
        ProgressStepper,
    },
    setup::{setup_manager::SetupPhase, utils::conditional_sleeper},
    tasks_tracker::TasksTrackers,
    UniverseAppState,
};
use anyhow::Error;
use log::{error, info, warn};
use tari_core::transactions::tari_amount::MicroMinotari;
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
    setup_manager::PhaseStatus,
    trait_setup_phase::{SetupConfiguration, SetupPhaseImpl},
};

static LOG_TARGET: &str = "tari::universe::phase_hardware";

#[derive(Clone, Default)]
pub struct WalletSetupPhaseOutput {}

#[derive(Clone, Default)]
pub struct WalletSetupPhaseAppConfiguration {
    use_tor: bool,
}

pub struct WalletSetupPhase {
    app_handle: AppHandle,
    progress_stepper: Mutex<ProgressStepper>,
    #[allow(dead_code)]
    app_configuration: WalletSetupPhaseAppConfiguration,
    setup_configuration: SetupConfiguration,
    status_sender: Sender<PhaseStatus>,
}

impl SetupPhaseImpl for WalletSetupPhase {
    type AppConfiguration = WalletSetupPhaseAppConfiguration;

    async fn new(
        app_handle: AppHandle,
        status_sender: Sender<PhaseStatus>,
        configuration: SetupConfiguration,
    ) -> Self {
        Self {
            app_handle: app_handle.clone(),
            progress_stepper: Mutex::new(Self::create_progress_stepper(app_handle.clone())),
            app_configuration: Self::load_app_configuration().await.unwrap_or_default(),
            setup_configuration: configuration,
            status_sender,
        }
    }

    fn get_app_handle(&self) -> &AppHandle {
        &self.app_handle
    }

    fn create_progress_stepper(app_handle: AppHandle) -> ProgressStepper {
        ProgressStepperBuilder::new()
            .add_step(ProgressPlans::Wallet(
                ProgressSetupWalletPlan::BinariesWallet,
            ))
            .add_step(ProgressPlans::Wallet(ProgressSetupWalletPlan::StartWallet))
            .add_step(ProgressPlans::Wallet(
                ProgressSetupWalletPlan::InitializeSpendingWallet,
            ))
            .add_step(ProgressPlans::Wallet(ProgressSetupWalletPlan::Done))
            .build(app_handle)
    }

    async fn load_app_configuration() -> Result<Self::AppConfiguration, Error> {
        let use_tor = *ConfigCore::content().await.use_tor();
        Ok(WalletSetupPhaseAppConfiguration { use_tor })
    }

    async fn setup(mut self) {
        info!(target: LOG_TARGET, "[ {} Phase ] Starting setup", SetupPhase::Wallet);

        TasksTrackers::current().wallet_phase.get_task_tracker().await.spawn(async move {
            let mut shutdown_signal = TasksTrackers::current().wallet_phase.get_signal().await;
            for subscriber in &mut self.setup_configuration.listeners_for_required_phases_statuses.iter_mut() {
                select! {
                    _ = subscriber.wait_for(|value| value.is_success()) => {}
                    _ = shutdown_signal.wait() => {
                        warn!(target: LOG_TARGET, "[ {} Phase ] Setup cancelled", SetupPhase::Wallet);
                        return;
                    }
                }
            };

            tokio::select! {
                result = conditional_sleeper(self.setup_configuration.setup_timeout_duration) => {
                    if result.is_some() {
                        error!(target: LOG_TARGET, "[ {} Phase ] Setup timed out", SetupPhase::Wallet);
                        let error_message = format!("[ {} Phase ] Setup timed out", SetupPhase::Wallet);
                        sentry::capture_message(&error_message, sentry::Level::Error);
                        EventsManager::handle_critical_problem(&self.app_handle, Some(SetupPhase::Wallet.get_critical_problem_title()), Some(SetupPhase::Wallet.get_critical_problem_description()))
                        .await;
                    }
                }
                result = self.setup_inner() => {
                    match result {
                        Ok(_) => {
                            info!(target: LOG_TARGET, "[ {} Phase ] Setup completed successfully", SetupPhase::Wallet);
                            let _unused = self.finalize_setup().await;
                        }
                        Err(error) => {
                            error!(target: LOG_TARGET, "[ {} Phase ] Setup failed with error: {:?}", SetupPhase::Wallet,error);
                            let error_message = format!("[ {} Phase ] Setup failed with error: {:?}", SetupPhase::Wallet,error);
                            sentry::capture_message(&error_message, sentry::Level::Error);
                            EventsManager
                                ::handle_critical_problem(&self.app_handle, Some(SetupPhase::Wallet.get_critical_problem_title()), Some(SetupPhase::Wallet.get_critical_problem_description()))
                                .await;
                        }
                    }
                }
                _ = shutdown_signal.wait() => {
                    warn!(target: LOG_TARGET, "[ {} Phase ] Setup cancelled", SetupPhase::Wallet);
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
            .resolve_step(ProgressPlans::Wallet(
                ProgressSetupWalletPlan::BinariesWallet,
            ))
            .await;

        binary_resolver
            .initialize_binary_timeout(Binaries::Wallet, progress.clone(), rx.clone())
            .await?;

        progress_stepper
            .resolve_step(ProgressPlans::Wallet(ProgressSetupWalletPlan::StartWallet))
            .await;

        let app_state = self.get_app_handle().state::<UniverseAppState>().clone();
        let is_local_node = app_state.node_manager.is_local_current().await?;
        state
            .wallet_manager
            .ensure_started(
                TasksTrackers::current().wallet_phase.get_signal().await,
                data_dir.clone(),
                config_dir.clone(),
                log_dir.clone(),
                self.app_configuration.use_tor,
                is_local_node,
            )
            .await?;

        progress_stepper
            .resolve_step(ProgressPlans::Wallet(
                ProgressSetupWalletPlan::InitializeSpendingWallet,
            ))
            .await;

        let mut spend_wallet_manager = state.spend_wallet_manager.write().await;
        spend_wallet_manager
            .init(
                TasksTrackers::current()
                    .wallet_phase
                    .get_signal()
                    .await
                    .clone(),
                data_dir,
                config_dir,
                log_dir,
            )
            .await?;
        drop(spend_wallet_manager);

        let node_status_watch_rx = (*app_state.node_status_watch_rx).clone();
        state
            .wallet_manager
            .wait_for_initial_wallet_scan(self.get_app_handle(), node_status_watch_rx)
            .await?;

        Ok(())
    }

    async fn finalize_setup(&self) -> Result<(), Error> {
        self.status_sender.send(PhaseStatus::Success).ok();
        self.progress_stepper
            .lock()
            .await
            .resolve_step(ProgressPlans::Wallet(ProgressSetupWalletPlan::Done))
            .await;

        let app_handle = self.get_app_handle().clone();

        if !ConfigUI::content().await.was_staged_security_modal_shown() {
            TasksTrackers::current()
                .wallet_phase
                .get_task_tracker()
                .await
                .spawn(async move {
                    let wallet_state_watcher = app_handle
                        .state::<UniverseAppState>()
                        .wallet_state_watch_rx
                        .clone();

                    loop {
                        let wallet_state = wallet_state_watcher.borrow().clone();

                        if let Some(wallet_state) = wallet_state {
                            if let Some(balance) = wallet_state.balance {
                                let balance_sum = balance.available_balance
                                    + balance.pending_incoming_balance
                                    + balance.timelocked_balance;
                                if balance_sum.gt(&MicroMinotari::zero()) {
                                    EventsEmitter::show_staged_security_modal(&app_handle).await;
                                    let _unused = ConfigUI::update_field(
                                        ConfigUIContent::set_was_staged_security_modal_shown,
                                        true,
                                    )
                                    .await;
                                    break;
                                }
                            }
                        }

                        tokio::time::sleep(std::time::Duration::from_secs(5)).await;
                    }
                });
        }

        EventsManager::handle_wallet_phase_finished(&self.app_handle, true).await;

        Ok(())
    }
}
