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
use super::{
    listeners::SetupFeaturesList,
    setup_manager::PhaseStatus,
    trait_setup_phase::{SetupConfiguration, SetupPhaseImpl},
    utils::{setup_default_adapter::SetupDefaultAdapter, timeout_watcher::TimeoutWatcher},
};
use crate::LOG_TARGET_APP_LOGIC;
use crate::ootle::OotleWalletManager;
use crate::wallet::minotari_wallet::MinotariWalletManager;
use crate::{
    binaries::{Binaries, BinaryResolver},
    configs::{
        config_wallet::{ConfigWallet, ConfigWalletContent},
        trait_config::ConfigImpl,
    },
    events_emitter::EventsEmitter,
    internal_wallet::InternalWallet,
    pin::PinManager,
    progress_trackers::{
        progress_plans::SetupStep,
        progress_stepper::{ProgressStepper, ProgressStepperBuilder},
    },
    setup::setup_manager::SetupPhase,
    tasks_tracker::TasksTrackers,
};
use anyhow::Error;
use log::info;
use tari_common::configuration::Network;
use tari_shutdown::ShutdownSignal;
use tauri::AppHandle;
use tokio::sync::{
    Mutex,
    watch::{Receiver, Sender},
};
use tokio_util::task::TaskTracker;

// Bump to run the wallet data migration on next start
const WALLET_MIGRATION_NONCE: u64 = 2;

#[derive(Clone, Default)]
pub struct WalletSetupPhaseAppConfiguration {}

pub struct WalletSetupPhase {
    app_handle: AppHandle,
    progress_stepper: Mutex<ProgressStepper>,
    #[allow(dead_code)]
    app_configuration: WalletSetupPhaseAppConfiguration,
    setup_configuration: SetupConfiguration,
    status_sender: Sender<PhaseStatus>,
    #[allow(dead_code)]
    setup_features: SetupFeaturesList,
    timeout_watcher: TimeoutWatcher,
}

impl SetupPhaseImpl for WalletSetupPhase {
    type AppConfiguration = WalletSetupPhaseAppConfiguration;

    async fn new(
        app_handle: AppHandle,
        status_sender: Sender<PhaseStatus>,
        configuration: SetupConfiguration,
        setup_features: SetupFeaturesList,
    ) -> Self {
        let timeout_watcher = TimeoutWatcher::new(configuration.setup_timeout_duration);
        Self {
            app_handle: app_handle.clone(),
            progress_stepper: Mutex::new(Self::create_progress_stepper(
                app_handle.clone(),
                status_sender.clone(),
                timeout_watcher.get_sender(),
            )),
            app_configuration: Self::load_app_configuration().await.unwrap_or_default(),
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
        TasksTrackers::current().wallet_phase.get_signal().await
    }
    async fn get_task_tracker(&self) -> TaskTracker {
        TasksTrackers::current()
            .wallet_phase
            .get_task_tracker()
            .await
    }
    fn get_phase_dependencies(&self) -> Vec<Receiver<PhaseStatus>> {
        self.setup_configuration
            .listeners_for_required_phases_statuses
            .clone()
    }
    fn get_phase_id(&self) -> SetupPhase {
        SetupPhase::Wallet
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
            .add_step(SetupStep::MinotariWallet, true)
            .add_step(SetupStep::OotleWallet, false)
            .add_incremental_step(SetupStep::SetupBridge, false)
            .build(
                app_handle,
                timeout_watcher_sender,
                status_sender,
                SetupPhase::Wallet,
            )
    }

    async fn load_app_configuration() -> Result<Self::AppConfiguration, Error> {
        Ok(WalletSetupPhaseAppConfiguration {})
    }

    async fn setup(self) {
        SetupDefaultAdapter::setup(self).await;
    }

    async fn setup_inner(&self) -> Result<(), Error> {
        let mut progress_stepper = self.progress_stepper.lock().await;
        let (data_dir, _config_dir, _log_dir) = self.get_app_dirs()?;

        let binary_resolver = BinaryResolver::current();

        let latest_wallet_migration_nonce = *ConfigWallet::content().await.wallet_migration_nonce();
        if latest_wallet_migration_nonce < WALLET_MIGRATION_NONCE {
            info!(target: LOG_TARGET_APP_LOGIC, "Wallet migration required(Nonce {latest_wallet_migration_nonce} => {WALLET_MIGRATION_NONCE})");
            // The console wallet sidecar is gone; drop its data folder, leave the minotari DB alone.
            let legacy_wallet_dir = data_dir
                .join("wallet")
                .join(Network::get_current().to_string().to_lowercase());
            match tokio::fs::remove_dir_all(&legacy_wallet_dir).await {
                Ok(()) => {
                    info!(target: LOG_TARGET_APP_LOGIC, "Removed legacy console wallet data folder {}", legacy_wallet_dir.display())
                }
                Err(e) if e.kind() == std::io::ErrorKind::NotFound => {}
                Err(e) => {
                    log::warn!(target: LOG_TARGET_APP_LOGIC, "Failed to remove legacy console wallet data folder {}: {e}", legacy_wallet_dir.display())
                }
            }
            if let Err(e) = ConfigWallet::update_field(
                ConfigWalletContent::set_wallet_migration_nonce,
                WALLET_MIGRATION_NONCE,
            )
            .await
            {
                log::warn!(target: LOG_TARGET_APP_LOGIC, "Failed to update wallet migration nonce: {e}");
            }
        }

        let app_handle_clone = self.get_app_handle().clone();
        progress_stepper
            .complete_step(SetupStep::MinotariWallet, || async {
                MinotariWalletManager::load_app_handle(app_handle_clone).await;
                if InternalWallet::is_internal().await {
                    // The account must exist before `initialize_wallet` looks it up by
                    // address. `init_with_view_key` refuses an account that already
                    // exists, which is the normal case after the first launch.
                    info!(target: LOG_TARGET_APP_LOGIC, "============================ Setting up Minotari Wallet");
                    if let Err(e) = MinotariWalletManager::import_view_key().await {
                        info!(target: LOG_TARGET_APP_LOGIC, "Minotari wallet account not imported (already present?): {e}");
                    }
                    MinotariWalletManager::initialize_wallet().await?;
                    info!(target: LOG_TARGET_APP_LOGIC, "============================ Scanning blocks for Minotari Wallet");
                    MinotariWalletManager::initialize_blockchain_scanning().await?;
                }

                Ok(())
            })
            .await?;

        progress_stepper
            .complete_step(SetupStep::OotleWallet, || {
                OotleWalletManager::initialize(&data_dir)
            })
            .await?;

        let bridge_binary_progress_tracker =
            progress_stepper.track_step_incrementally(SetupStep::SetupBridge);

        progress_stepper
            .complete_step(SetupStep::SetupBridge, || async {
                binary_resolver
                    .initialize_binary(Binaries::BridgeTapplet, bridge_binary_progress_tracker)
                    .await
            })
            .await?;

        Ok(())
    }

    async fn finalize_setup(&self) -> Result<(), Error> {
        let progress_stepper = self.progress_stepper.lock().await;
        let setup_warnings = progress_stepper.get_setup_warnings();
        if setup_warnings.is_empty() {
            self.status_sender.send(PhaseStatus::Success)?;
        } else {
            self.status_sender
                .send(PhaseStatus::SuccessWithWarnings(setup_warnings.clone()))?;
        }

        let config_wallet = ConfigWallet::content().await;
        let is_pin_locked = PinManager::pin_locked().await;
        EventsEmitter::emit_pin_locked(is_pin_locked).await;
        let is_seed_backed_up = *config_wallet.seed_backed_up();
        EventsEmitter::emit_seed_backed_up(is_seed_backed_up).await;

        Ok(())
    }
}
