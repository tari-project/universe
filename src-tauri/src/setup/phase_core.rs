use std::{
    sync::Arc,
    time::{Duration, SystemTime},
};

use log::{error, info};
use serde_json::json;
use tauri::Manager;
use tauri_plugin_sentry::sentry;
use tokio::sync::{watch, Mutex};

use crate::{
    auto_launcher::AutoLauncher,
    binaries::{Binaries, BinaryResolver},
    configs::{config_core::ConfigCore, trait_config::ConfigImpl},
    events::SetupStatusPayload,
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

impl SetupPhaseImpl for CoreSetupPhase {
    type Configuration = CoreSetupPhaseSessionConfiguration;

    fn new() -> Self {
        Self {
            progress_stepper: Mutex::new(Self::create_progress_stepper()),
            app_configuration: CoreSetupPhaseAppConfiguration::default(),
            session_configuration: CoreSetupPhaseSessionConfiguration::default(),
        }
    }

    fn create_progress_stepper() -> ProgressStepper {
        let progress_tracker = ProgressStepperBuilder::new()
            .add_step(ProgressPlans::SetupCore(
                ProgressSetupCorePlan::PlatformPrequisites,
            ))
            .add_step(ProgressPlans::SetupCore(
                ProgressSetupCorePlan::InitializeApplicationModules,
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
            .calculate_percentage_steps()
            .build();
        progress_tracker
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
                    sentry::capture_message(&error_message, sentry::Level::Error);
                }
                result = self.setup_inner(app_handle.clone()) => {
                    match result {
                        Ok(_) => {
                            info!(target: LOG_TARGET, "[ Core Phase ] Setup completed successfully");
                            self.finalize_setup(app_handle.clone()).await;
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

    async fn setup_inner(&self, app_handle: tauri::AppHandle) -> Result<(), anyhow::Error> {
        let state = app_handle.state::<UniverseAppState>();
        state
            .events_manager
            .handle_app_config_loaded(&app_handle)
            .await;
        state
            .events_manager
            .handle_setup_status(
                &app_handle,
                SetupStatusPayload {
                    event_type: "setup_status".to_string(),
                    title: "starting-up".to_string(),
                    title_params: None,
                    progress: 0.0,
                },
            )
            .await;

        // TODO Remove once not needed
        let (tx, rx) = watch::channel("".to_string());
        let progress = ProgressTracker::new(app_handle.clone(), Some(tx));

        PlatformUtils::initialize_preqesities(app_handle.clone()).await?;
        self.progress_stepper
            .lock()
            .await
            .resolve_step(
                Some(app_handle.clone()),
                ProgressPlans::SetupCore(ProgressSetupCorePlan::PlatformPrequisites),
            )
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
        let telemetry_service = state.telemetry_service.clone();
        let telemetry_service = &telemetry_service.read().await;

        let mut binary_resolver = BinaryResolver::current().write().await;
        let should_check_for_update = now
            .duration_since(
                self.app_configuration
                    .last_binaries_update_timestamp
                    .unwrap_or(SystemTime::UNIX_EPOCH),
            )
            .unwrap_or(Duration::from_secs(0))
            .gt(&TIME_BETWEEN_BINARIES_UPDATES);

        self.progress_stepper
            .lock()
            .await
            .resolve_step(
                Some(app_handle.clone()),
                ProgressPlans::SetupCore(ProgressSetupCorePlan::InitializeApplicationModules),
            )
            .await;

        telemetry_service
            .send(
                "benchmarking-network".to_string(),
                json!({
                    "service": "speedtest",
                    "percentage": 0,
                }),
            )
            .await?;

        NetworkStatus::current()
            .run_speed_test_with_timeout(&app_handle)
            .await;

        self.progress_stepper
            .lock()
            .await
            .resolve_step(
                Some(app_handle.clone()),
                ProgressPlans::SetupCore(ProgressSetupCorePlan::NetworkSpeedTest),
            )
            .await;

        if self.app_configuration.use_tor && !cfg!(target_os = "macos") {
            telemetry_service
                .send(
                    "checking-latest-version-tor".to_string(),
                    json!({
                        "service": "tor_manager",
                        "percentage": 5,
                    }),
                )
                .await?;

            binary_resolver
                .initialize_binary_timeout(
                    Binaries::Tor,
                    progress.clone(),
                    should_check_for_update,
                    rx.clone(),
                )
                .await?;
            self.progress_stepper
                .lock()
                .await
                .resolve_step(
                    Some(app_handle.clone()),
                    ProgressPlans::SetupCore(ProgressSetupCorePlan::BinariesTor),
                )
                .await;
        } else {
            self.progress_stepper
                .lock()
                .await
                .skip_step(ProgressPlans::SetupCore(ProgressSetupCorePlan::BinariesTor));
        }

        let _unused = telemetry_service
            .send(
                "checking-latest-version-node".to_string(),
                json!({
                    "service": "node_manager",
                    "percentage": 10,
                }),
            )
            .await;
        binary_resolver
            .initialize_binary_timeout(
                Binaries::MinotariNode,
                progress.clone(),
                should_check_for_update,
                rx.clone(),
            )
            .await?;
        self.progress_stepper
            .lock()
            .await
            .resolve_step(
                Some(app_handle.clone()),
                ProgressPlans::SetupCore(ProgressSetupCorePlan::BinariesNode),
            )
            .await;

        let _unused = telemetry_service
            .send(
                "checking-latest-version-mmproxy".to_string(),
                json!({
                    "service": "mmproxy",
                    "percentage": 15,
                }),
            )
            .await;
        binary_resolver
            .initialize_binary_timeout(
                Binaries::MergeMiningProxy,
                progress.clone(),
                should_check_for_update,
                rx.clone(),
            )
            .await?;
        self.progress_stepper
            .lock()
            .await
            .resolve_step(
                Some(app_handle.clone()),
                ProgressPlans::SetupCore(ProgressSetupCorePlan::BinariesMergeMiningProxy),
            )
            .await;

        let _unused = telemetry_service
            .send(
                "checking-latest-version-wallet".to_string(),
                json!({
                    "service": "wallet",
                    "percentage": 20,
                }),
            )
            .await;

        binary_resolver
            .initialize_binary_timeout(
                Binaries::Wallet,
                progress.clone(),
                should_check_for_update,
                rx.clone(),
            )
            .await?;
        self.progress_stepper
            .lock()
            .await
            .resolve_step(
                Some(app_handle.clone()),
                ProgressPlans::SetupCore(ProgressSetupCorePlan::BinariesWallet),
            )
            .await;

        let _unused = telemetry_service
            .send(
                "checking-latest-version-gpuminer".to_string(),
                json!({
                    "service": "gpuminer",
                    "percentage":25,
                }),
            )
            .await;
        binary_resolver
            .initialize_binary_timeout(
                Binaries::GpuMiner,
                progress.clone(),
                should_check_for_update,
                rx.clone(),
            )
            .await?;
        self.progress_stepper
            .lock()
            .await
            .resolve_step(
                Some(app_handle.clone()),
                ProgressPlans::SetupCore(ProgressSetupCorePlan::BinariesGpuMiner),
            )
            .await;

        let _unused = telemetry_service
            .send(
                "checking-latest-version-xmrig".to_string(),
                json!({
                    "service": "xmrig",
                    "percentage":30,
                }),
            )
            .await;
        self.progress_stepper
            .lock()
            .await
            .resolve_step(
                Some(app_handle.clone()),
                ProgressPlans::SetupCore(ProgressSetupCorePlan::BinariesCpuMiner),
            )
            .await;
        binary_resolver
            .initialize_binary_timeout(
                Binaries::Xmrig,
                progress.clone(),
                should_check_for_update,
                rx.clone(),
            )
            .await?;

        let _unused = telemetry_service
            .send(
                "checking-latest-version-sha-p2pool".to_string(),
                json!({
                    "service": "sha_p2pool",
                    "percentage":35,
                }),
            )
            .await;
        binary_resolver
            .initialize_binary_timeout(
                Binaries::ShaP2pool,
                progress.clone(),
                should_check_for_update,
                rx.clone(),
            )
            .await?;
        self.progress_stepper
            .lock()
            .await
            .resolve_step(
                Some(app_handle.clone()),
                ProgressPlans::SetupCore(ProgressSetupCorePlan::BinariesP2pool),
            )
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

        Ok(())
    }

    async fn finalize_setup(&self, app_handle: tauri::AppHandle) -> Result<(), anyhow::Error> {
        SetupManager::get_instance()
            .lock()
            .await
            .set_phase_status(SetupPhase::Core, true);

        // Todo: send event
        Ok(())
    }
}
