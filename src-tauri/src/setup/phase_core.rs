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

use std::{
    sync::Arc,
    time::{Duration, SystemTime},
};

use log::{error, info};
use tauri::{AppHandle, Manager};
use tauri_plugin_sentry::sentry;
use tokio::sync::{watch, Mutex};

use crate::{
    auto_launcher::AutoLauncher,
    binaries::{Binaries, BinaryResolver},
    configs::{config_core::ConfigCore, trait_config::ConfigImpl},
    progress_tracker_old::ProgressTracker,
    progress_trackers::{
        progress_plans::ProgressPlans, progress_stepper::ProgressStepperBuilder,
        ProgressSetupCorePlan, ProgressStepper,
    },
    tasks_tracker::TasksTracker,
    utils::{network_status::NetworkStatus, platform_utils::PlatformUtils},
    UniverseAppState,
};

use super::{
    setup_manager::{SetupManager, SetupPhase},
    trait_setup_phase::SetupPhaseImpl,
};

static LOG_TARGET: &str = "tari::universe::phase_core";
const TIME_BETWEEN_BINARIES_UPDATES: Duration = Duration::from_secs(60 * 60 * 6);
const SETUP_TIMEOUT_DURATION: Duration = Duration::from_secs(60 * 10); // 10 Minutes

#[derive(Clone, Default)]
pub struct CoreSetupPhasePayload {}

#[derive(Clone, Default)]
pub struct CoreSetupPhaseSessionConfiguration {}

#[derive(Clone, Default)]
pub struct CoreSetupPhaseAppConfiguration {
    is_auto_launcher_enabled: bool,
    last_binaries_update_timestamp: Option<SystemTime>,
    use_tor: bool,
}

pub struct CoreSetupPhase {
    progress_stepper: Mutex<ProgressStepper>,
    app_configuration: CoreSetupPhaseAppConfiguration,
    session_configuration: CoreSetupPhaseSessionConfiguration,
}

impl SetupPhaseImpl<CoreSetupPhasePayload> for CoreSetupPhase {
    type Configuration = CoreSetupPhaseSessionConfiguration;

    fn new() -> Self {
        Self {
            progress_stepper: Mutex::new(ProgressStepper::new()),
            app_configuration: CoreSetupPhaseAppConfiguration::default(),
            session_configuration: CoreSetupPhaseSessionConfiguration::default(),
        }
    }

    async fn create_progress_stepper(&mut self, app_handle: Option<AppHandle>) {
        let progress_stepper = ProgressStepperBuilder::new()
            .add_step(ProgressPlans::SetupCore(
                ProgressSetupCorePlan::PlatformPrequisites,
            ))
            .add_step(ProgressPlans::SetupCore(
                ProgressSetupCorePlan::InitializeApplicationModules,
            ))
            .add_step(ProgressPlans::SetupCore(
                ProgressSetupCorePlan::NetworkSpeedTest,
            ))
            .add_step(ProgressPlans::SetupCore(ProgressSetupCorePlan::BinariesTor))
            .add_step(ProgressPlans::SetupCore(
                ProgressSetupCorePlan::BinariesNode,
            ))
            .add_step(ProgressPlans::SetupCore(
                ProgressSetupCorePlan::BinariesMergeMiningProxy,
            ))
            .add_step(ProgressPlans::SetupCore(
                ProgressSetupCorePlan::BinariesWallet,
            ))
            .add_step(ProgressPlans::SetupCore(
                ProgressSetupCorePlan::BinariesGpuMiner,
            ))
            .add_step(ProgressPlans::SetupCore(
                ProgressSetupCorePlan::BinariesCpuMiner,
            ))
            .add_step(ProgressPlans::SetupCore(
                ProgressSetupCorePlan::BinariesP2pool,
            ))
            .add_step(ProgressPlans::SetupCore(ProgressSetupCorePlan::StartTor))
            .add_step(ProgressPlans::SetupCore(ProgressSetupCorePlan::Done))
            .calculate_percentage_steps()
            .build(app_handle);

        *self.progress_stepper.lock().await = progress_stepper;
    }

    async fn load_configuration(
        &mut self,
        configuration: Self::Configuration,
    ) -> Result<(), anyhow::Error> {
        self.session_configuration = configuration;

        let is_auto_launcher_enabled = *ConfigCore::current()
            .lock()
            .await
            .get_content()
            .should_auto_launch();

        let last_binaries_update_timestamp = *ConfigCore::current()
            .lock()
            .await
            .get_content()
            .last_binaries_update_timestamp();

        let use_tor = *ConfigCore::current().lock().await.get_content().use_tor();

        self.app_configuration = CoreSetupPhaseAppConfiguration {
            is_auto_launcher_enabled,
            last_binaries_update_timestamp,
            use_tor,
        };

        Ok(())
    }

    async fn setup(self: Arc<Self>, app_handle: tauri::AppHandle) {
        info!(target: LOG_TARGET, "[ Core Phase ] Starting setup");

        TasksTracker::current().spawn(async move {
            let setup_timeout = tokio::time::sleep(SETUP_TIMEOUT_DURATION);
            tokio::select! {
                _ = setup_timeout => {
                    error!(target: LOG_TARGET, "[ Core Phase ] Setup timed out");
                    let error_message = "[ Core Phase ] Setup timed out";
                    sentry::capture_message(error_message, sentry::Level::Error);
                }
                result = self.setup_inner(app_handle.clone()) => {
                    match result {
                        Ok(payload) => {
                            info!(target: LOG_TARGET, "[ Core Phase ] Setup completed successfully");
                            let _unused = self.finalize_setup(app_handle.clone(),payload).await;
                        }
                        Err(error) => {
                            error!(target: LOG_TARGET, "[ Core Phase ] Setup failed with error: {:?}", error);
                            let error_message = format!("[ Core Phase ] Setup failed with error: {:?}", error);
                            sentry::capture_message(&error_message, sentry::Level::Error);
                        }
                    }
                }
            };
        });
    }

    #[allow(clippy::too_many_lines)]
    async fn setup_inner(
        &self,
        app_handle: tauri::AppHandle,
    ) -> Result<Option<CoreSetupPhasePayload>, anyhow::Error> {
        let mut progress_stepper = self.progress_stepper.lock().await;
        let state = app_handle.state::<UniverseAppState>();
        state
            .events_manager
            .handle_app_config_loaded(&app_handle)
            .await;

        // TODO Remove once not needed
        let (tx, rx) = watch::channel("".to_string());
        let progress = ProgressTracker::new(app_handle.clone(), Some(tx));

        PlatformUtils::initialize_preqesities(app_handle.clone()).await?;
        let _unused = progress_stepper
            .resolve_step(ProgressPlans::SetupCore(
                ProgressSetupCorePlan::PlatformPrequisites,
            ))
            .await;

        state
            .updates_manager
            .init_periodic_updates(app_handle.clone())
            .await?;

        let _unused = state
            .systemtray_manager
            .write()
            .await
            .initialize_tray(app_handle.clone());

        let _unused = AutoLauncher::current()
            .initialize_auto_launcher(self.app_configuration.is_auto_launcher_enabled)
            .await
            .inspect_err(
                |e| error!(target: LOG_TARGET, "Could not initialize auto launcher: {:?}", e),
            );

        let now = SystemTime::now();

        state
            .telemetry_manager
            .write()
            .await
            .initialize(app_handle.clone())
            .await?;

        let mut telemetry_id = state
            .telemetry_manager
            .read()
            .await
            .get_unique_string()
            .await;
        if telemetry_id.is_empty() {
            telemetry_id = "unknown_miner_tari_universe".to_string();
        }

        let app_version = app_handle.package_info().version.clone();
        state
            .telemetry_service
            .write()
            .await
            .init(app_version.to_string(), telemetry_id.clone())
            .await?;

        let mut binary_resolver = BinaryResolver::current().write().await;
        let should_check_for_update = now
            .duration_since(
                self.app_configuration
                    .last_binaries_update_timestamp
                    .unwrap_or(SystemTime::UNIX_EPOCH),
            )
            .unwrap_or(Duration::from_secs(0))
            .gt(&TIME_BETWEEN_BINARIES_UPDATES);

        let _unused = progress_stepper
            .resolve_step(ProgressPlans::SetupCore(
                ProgressSetupCorePlan::InitializeApplicationModules,
            ))
            .await;

        NetworkStatus::current()
            .run_speed_test_with_timeout(&app_handle)
            .await;

        let _unused = progress_stepper
            .resolve_step(ProgressPlans::SetupCore(
                ProgressSetupCorePlan::NetworkSpeedTest,
            ))
            .await;

        if self.app_configuration.use_tor && !cfg!(target_os = "macos") {
            binary_resolver
                .initialize_binary_timeout(
                    Binaries::Tor,
                    progress.clone(),
                    should_check_for_update,
                    rx.clone(),
                )
                .await?;
            let _unused = progress_stepper
                .resolve_step(ProgressPlans::SetupCore(ProgressSetupCorePlan::BinariesTor))
                .await;
        } else {
            let _unused = progress_stepper
                .skip_step(ProgressPlans::SetupCore(ProgressSetupCorePlan::BinariesTor));
        };

        binary_resolver
            .initialize_binary_timeout(
                Binaries::MinotariNode,
                progress.clone(),
                should_check_for_update,
                rx.clone(),
            )
            .await?;
        let _unused = progress_stepper
            .resolve_step(ProgressPlans::SetupCore(
                ProgressSetupCorePlan::BinariesNode,
            ))
            .await;

        binary_resolver
            .initialize_binary_timeout(
                Binaries::MergeMiningProxy,
                progress.clone(),
                should_check_for_update,
                rx.clone(),
            )
            .await?;
        let _unused = progress_stepper
            .resolve_step(ProgressPlans::SetupCore(
                ProgressSetupCorePlan::BinariesMergeMiningProxy,
            ))
            .await;

        binary_resolver
            .initialize_binary_timeout(
                Binaries::Wallet,
                progress.clone(),
                should_check_for_update,
                rx.clone(),
            )
            .await?;
        let _unused = progress_stepper
            .resolve_step(ProgressPlans::SetupCore(
                ProgressSetupCorePlan::BinariesWallet,
            ))
            .await;

        binary_resolver
            .initialize_binary_timeout(
                Binaries::GpuMiner,
                progress.clone(),
                should_check_for_update,
                rx.clone(),
            )
            .await?;
        let _unused = progress_stepper
            .resolve_step(ProgressPlans::SetupCore(
                ProgressSetupCorePlan::BinariesGpuMiner,
            ))
            .await;

        let _unused = progress_stepper
            .resolve_step(ProgressPlans::SetupCore(
                ProgressSetupCorePlan::BinariesCpuMiner,
            ))
            .await;
        binary_resolver
            .initialize_binary_timeout(
                Binaries::Xmrig,
                progress.clone(),
                should_check_for_update,
                rx.clone(),
            )
            .await?;

        binary_resolver
            .initialize_binary_timeout(
                Binaries::ShaP2pool,
                progress.clone(),
                should_check_for_update,
                rx.clone(),
            )
            .await?;
        let _unused = progress_stepper
            .resolve_step(ProgressPlans::SetupCore(
                ProgressSetupCorePlan::BinariesP2pool,
            ))
            .await;

        if should_check_for_update {
            state
                .config
                .write()
                .await
                .set_last_binaries_update_timestamp(now)
                .await?;
        }

        //drop binary resolver to release the lock
        drop(binary_resolver);

        let _uunused = progress_stepper
            .resolve_step(ProgressPlans::SetupCore(ProgressSetupCorePlan::StartTor))
            .await;

        let (data_dir, config_dir, log_dir) = self.get_app_dirs(&app_handle)?;

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
        }

        Ok(None)
    }

    async fn finalize_setup(
        &self,
        app_handle: tauri::AppHandle,
        _payload: Option<CoreSetupPhasePayload>,
    ) -> Result<(), anyhow::Error> {
        SetupManager::get_instance()
            .lock()
            .await
            .handle_start_setup_callbacks(app_handle.clone(), SetupPhase::Core, true)
            .await;

        let _unused = self
            .progress_stepper
            .lock()
            .await
            .resolve_step(ProgressPlans::SetupCore(ProgressSetupCorePlan::Done))
            .await;

        let state = app_handle.state::<UniverseAppState>();
        state
            .events_manager
            .handle_core_phase_finished(&app_handle, true)
            .await;

        Ok(())
    }
}
