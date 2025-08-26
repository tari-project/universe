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
        config_wallet::{ConfigWallet, ConfigWalletContent},
        trait_config::ConfigImpl,
    },
    events_emitter::EventsEmitter,
    internal_wallet::InternalWallet,
    pin::PinManager,
    progress_trackers::{
        progress_plans::{ProgressPlans, ProgressSetupWalletPlan},
        progress_stepper::ProgressStepperBuilder,
        ProgressStepper,
    },
    setup::setup_manager::SetupPhase,
    tasks_tracker::TasksTrackers,
    wallet::wallet_manager::WalletStartupConfig,
    UniverseAppState,
};
use anyhow::Error;
use tari_shutdown::ShutdownSignal;
use tauri::{AppHandle, Manager};
use tokio::sync::{
    watch::{Receiver, Sender},
    Mutex,
};
use tokio_util::task::TaskTracker;

use super::{
    listeners::SetupFeaturesList,
    setup_manager::PhaseStatus,
    trait_setup_phase::{SetupConfiguration, SetupPhaseImpl},
    utils::{setup_default_adapter::SetupDefaultAdapter, timeout_watcher::TimeoutWatcher},
};

static LOG_TARGET: &str = "tari::universe::phase_wallet";

// Bump to force wallet full scan
const WALLET_MIGRATION_NONCE: u64 = 1;

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
        timeout_watcher_sender: Sender<u64>,
    ) -> ProgressStepper {
        ProgressStepperBuilder::new()
            .add_step(ProgressPlans::Wallet(ProgressSetupWalletPlan::StartWallet))
            .add_step(ProgressPlans::Wallet(ProgressSetupWalletPlan::SetupBridge))
            .add_step(ProgressPlans::Wallet(ProgressSetupWalletPlan::Done))
            .build(app_handle, timeout_watcher_sender)
    }

    async fn load_app_configuration() -> Result<Self::AppConfiguration, Error> {
        let use_tor = *ConfigCore::content().await.use_tor();
        Ok(WalletSetupPhaseAppConfiguration { use_tor })
    }

    async fn setup(self) {
        let _unused = SetupDefaultAdapter::setup(self).await;
    }

    async fn setup_inner(&self) -> Result<(), Error> {
        let mut progress_stepper = self.progress_stepper.lock().await;
        let (data_dir, config_dir, log_dir) = self.get_app_dirs()?;
        let state = self.app_handle.state::<UniverseAppState>();

        let binary_resolver = BinaryResolver::current();

        progress_stepper
            .resolve_step(ProgressPlans::Wallet(ProgressSetupWalletPlan::StartWallet))
            .await;

        let latest_wallet_migration_nonce = *ConfigWallet::content().await.wallet_migration_nonce();
        if latest_wallet_migration_nonce < WALLET_MIGRATION_NONCE {
            log::info!(target: LOG_TARGET, "Wallet migration required(Nonce {latest_wallet_migration_nonce} => {WALLET_MIGRATION_NONCE})");
            if let Err(e) = state.wallet_manager.clean_data_folder(&data_dir).await {
                log::warn!(target: LOG_TARGET, "Failed to clean wallet data folder: {e}");
            }
            if let Err(e) = ConfigWallet::update_field(
                ConfigWalletContent::set_wallet_migration_nonce,
                WALLET_MIGRATION_NONCE,
            )
            .await
            {
                log::warn!(target: LOG_TARGET, "Failed to update wallet migration nonce: {e}");
            }
        }

        let app_state = self.get_app_handle().state::<UniverseAppState>().clone();
        let is_local_node = app_state.node_manager.is_local_current().await;
        let wallet_config = WalletStartupConfig {
            base_path: data_dir.clone(),
            config_path: config_dir.clone(),
            log_path: log_dir.clone(),
            use_tor: self.app_configuration.use_tor && is_local_node && !cfg!(target_os = "macos"),
            connect_with_local_node: is_local_node,
        };
        state
            .wallet_manager
            .ensure_started(
                TasksTrackers::current().wallet_phase.get_signal().await,
                wallet_config,
            )
            .await?;

        let bridge_binary_progress_tracker = progress_stepper.channel_step_range_updates(
            ProgressPlans::Wallet(ProgressSetupWalletPlan::SetupBridge),
            Some(ProgressPlans::Wallet(ProgressSetupWalletPlan::Done)),
        );

        binary_resolver
            .initialize_binary(Binaries::BridgeTapplet, bridge_binary_progress_tracker)
            .await?;

        Ok(())
    }

    async fn finalize_setup(&self) -> Result<(), Error> {
        let app_state = self.get_app_handle().state::<UniverseAppState>().clone();
        let node_status_watch_rx = (*app_state.node_status_watch_rx).clone();
        if InternalWallet::is_internal().await {
            app_state
                .wallet_manager
                .wait_for_initial_wallet_scan(node_status_watch_rx)
                .await?;
        }

        self.status_sender.send(PhaseStatus::Success).ok();
        self.progress_stepper
            .lock()
            .await
            .resolve_step(ProgressPlans::Wallet(ProgressSetupWalletPlan::Done))
            .await;

        let config_wallet = ConfigWallet::content().await;
        let is_pin_locked = PinManager::pin_locked().await;
        EventsEmitter::emit_pin_locked(is_pin_locked).await;
        let is_seed_backed_up = *config_wallet.seed_backed_up();
        EventsEmitter::emit_seed_backed_up(is_seed_backed_up).await;

        EventsEmitter::emit_wallet_phase_finished(true).await;

        Ok(())
    }
}
