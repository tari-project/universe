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
    configs::{config_core::ConfigCore, trait_config::ConfigImpl},
    events_emitter::EventsEmitter,
    internal_wallet::InternalWallet,
    ootle::ootle_wallet_manager::OotleWalletStartupConfig,
    pin::PinManager,
    progress_trackers::{
        progress_plans::{ProgressPlans, ProgressSetupOotleWalletPlan},
        progress_stepper::ProgressStepperBuilder,
        ProgressStepper,
    },
    setup::setup_manager::SetupPhase,
    tasks_tracker::TasksTrackers,
    UniverseAppState,
};
use anyhow::{Context, Error};
use log::info;
use reqwest::Url;
use tari_key_manager::mnemonic::{Mnemonic, MnemonicLanguage};
use tari_shutdown::ShutdownSignal;
use tari_utilities::Hidden;
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

static LOG_TARGET: &str = "tari::universe::phase_ootle_wallet";

#[derive(Clone, Default)]
pub struct OotleWalletSetupPhaseOutput {}

#[derive(Clone, Default)]
pub struct OotleWalletSetupPhaseAppConfiguration {
    indexer_urls: Vec<Url>,
}

pub struct OotleWalletSetupPhase {
    app_handle: AppHandle,
    progress_stepper: Mutex<ProgressStepper>,
    app_configuration: OotleWalletSetupPhaseAppConfiguration,
    setup_configuration: SetupConfiguration,
    status_sender: Sender<PhaseStatus>,
    _setup_features: SetupFeaturesList,
    timeout_watcher: TimeoutWatcher,
}

impl OotleWalletSetupPhase {
    async fn get_seed_words(&self, app_handle: &AppHandle) -> Result<String, Error> {
        let pin_password = PinManager::get_validated_pin_if_defined(app_handle)
            .await
            .context("Failed to validate PIN")?;
        let tari_cipher_seed = InternalWallet::get_tari_seed(pin_password)
            .await
            .context("Failed to get Tari seed")?;
        let seed_words = tari_cipher_seed
            .to_mnemonic(MnemonicLanguage::English, None)
            .context("Failed to convert seed to mnemonic")?;

        Ok(seed_words.join(" ").reveal().to_string())
    }
}

impl SetupPhaseImpl for OotleWalletSetupPhase {
    type AppConfiguration = OotleWalletSetupPhaseAppConfiguration;

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
            _setup_features: setup_features,
            timeout_watcher,
        }
    }

    fn get_app_handle(&self) -> &AppHandle {
        &self.app_handle
    }

    async fn get_shutdown_signal(&self) -> ShutdownSignal {
        TasksTrackers::current()
            .ootle_wallet_phase
            .get_signal()
            .await
    }

    async fn get_task_tracker(&self) -> TaskTracker {
        TasksTrackers::current()
            .ootle_wallet_phase
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
            .add_step(ProgressPlans::Ootle(
                ProgressSetupOotleWalletPlan::BinariesWallet,
            ))
            .add_step(ProgressPlans::Ootle(
                ProgressSetupOotleWalletPlan::StartWallet,
            ))
            .add_step(ProgressPlans::Ootle(
                ProgressSetupOotleWalletPlan::Initialize,
            ))
            .add_step(ProgressPlans::Ootle(ProgressSetupOotleWalletPlan::Done))
            .build(app_handle, timeout_watcher_sender)
    }

    async fn load_app_configuration() -> Result<Self::AppConfiguration, Error> {
        Ok(OotleWalletSetupPhaseAppConfiguration {
            indexer_urls: ConfigCore::content().await.ootle_indexer_urls().clone(),
        })
    }

    async fn setup(self) {
        let _unused = SetupDefaultAdapter::setup(self).await;
    }

    async fn setup_inner(&self) -> Result<(), Error> {
        let mut progress_stepper = self.progress_stepper.lock().await;
        let (data_dir, config_dir, log_dir) = self.get_app_dirs()?;
        let state = self.app_handle.state::<UniverseAppState>();

        let binary_resolver = BinaryResolver::current();

        let wallet_binary_progress_tracker = progress_stepper.channel_step_range_updates(
            ProgressPlans::Ootle(ProgressSetupOotleWalletPlan::BinariesWallet),
            Some(ProgressPlans::Ootle(
                ProgressSetupOotleWalletPlan::StartWallet,
            )),
        );

        binary_resolver
            .initialize_binary(Binaries::OotleWallet, wallet_binary_progress_tracker)
            .await?;

        progress_stepper
            .resolve_step(ProgressPlans::Ootle(
                ProgressSetupOotleWalletPlan::StartWallet,
            ))
            .await;

        info!(target: LOG_TARGET, "Starting Ootle wallet");
        let seed_words = self.get_seed_words(&self.app_handle).await?;
        let ootle_wallet_config = OotleWalletStartupConfig {
            base_path: data_dir.clone(),
            config_path: config_dir.clone(),
            log_path: log_dir.clone(),
            indexer_urls: self.app_configuration.indexer_urls.clone(),
            seed_words: Hidden::hide(seed_words),
        };
        state
            .ootle_wallet_manager
            .ensure_started(
                TasksTrackers::current()
                    .ootle_wallet_phase
                    .get_signal()
                    .await,
                ootle_wallet_config,
            )
            .await?;

        progress_stepper
            .resolve_step(ProgressPlans::Ootle(
                ProgressSetupOotleWalletPlan::Initialize,
            ))
            .await;

        Ok(())
    }

    async fn finalize_setup(&self) -> Result<(), Error> {
        self.status_sender.send(PhaseStatus::Success).ok();
        self.progress_stepper
            .lock()
            .await
            .resolve_step(ProgressPlans::Ootle(ProgressSetupOotleWalletPlan::Done))
            .await;

        EventsEmitter::emit_ootle_wallet_phase_finished(true).await;

        Ok(())
    }
}
