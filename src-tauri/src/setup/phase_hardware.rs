use std::time::{Duration, SystemTime};

use crate::{
    hardware::hardware_status_monitor::HardwareStatusMonitor,
    progress_trackers::{progress_stepper::ProgressStepperBuilder, ProgressStepper},
    tasks_tracker::TasksTracker,
    UniverseAppState,
};
use anyhow::Error;
use log::{error, info};
use tauri::{AppHandle, Manager};
use tauri_plugin_sentry::sentry;

use super::{
    setup_manager::{SetupManager, SetupPhase},
    trait_setup_phase::SetupPhaseImpl,
};

static LOG_TARGET: &str = "tari::universe::phase_hardware";
const SETUP_TIMEOUT_DURATION: Duration = Duration::from_secs(60 * 10); // 10 Minutes

#[derive(Clone, Default)]
pub struct HardwareSetupPhasePayload {
    pub cpu_benchmarked_hashrate: u64,
}

#[derive(Clone, Default)]
pub struct HardwareSetupPhaseSessionConfiguration {}

#[derive(Clone, Default)]
pub struct HardwareSetupPhaseAppConfiguration {}

pub struct HardwareSetupPhase {
    progress_stepper: ProgressStepper,
    app_configuration: HardwareSetupPhaseAppConfiguration,
    session_configuration: HardwareSetupPhaseSessionConfiguration,
}

impl SetupPhaseImpl<HardwareSetupPhasePayload> for HardwareSetupPhase {
    type Configuration = HardwareSetupPhaseSessionConfiguration;

    fn new() -> Self {
        HardwareSetupPhase {
            progress_stepper: Self::create_progress_stepper(),
            app_configuration: HardwareSetupPhaseAppConfiguration::default(),
            session_configuration: HardwareSetupPhaseSessionConfiguration::default(),
        }
    }

    fn create_progress_stepper() -> ProgressStepper {
        let progress_stepper = ProgressStepperBuilder::new().build();

        progress_stepper
    }

    async fn load_configuration(
        &mut self,
        configuration: Self::Configuration,
    ) -> Result<(), Error> {
        self.session_configuration = configuration;

        Ok(())
    }

    async fn setup(self: std::sync::Arc<Self>, app_handle: AppHandle) {
        info!(target: LOG_TARGET, "[ Hardware Phase ] Starting setup");

        TasksTracker::current().spawn(async move {
            let setup_timeout = tokio::time::sleep(SETUP_TIMEOUT_DURATION);
            tokio::select! {
                _ = setup_timeout => {
                    error!(target: LOG_TARGET, "[ Hardware Phase ] Setup timed out");
                    let error_message = "[ Hardware Phase ] Setup timed out";
                    sentry::capture_message(&error_message, sentry::Level::Error);
                }
                result = self.setup_inner(app_handle.clone()) => {
                    match result {
                        Ok(payload) => {
                            info!(target: LOG_TARGET, "[ Hardware Phase ] Setup completed successfully");
                            self.finalize_setup(app_handle.clone(), payload).await;
                        }
                        Err(error) => {
                            error!(target: LOG_TARGET, "[ Hardware Phase ] Setup failed with error: {:?}", error);
                            let error_message = format!("[ Hardware Phase ] Setup failed with error: {:?}", error);
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
    ) -> Result<Option<HardwareSetupPhasePayload>, Error> {
        let (data_dir, config_dir, log_dir) = self.get_app_dirs(&app_handle)?;
        let state = app_handle.state::<UniverseAppState>();

        let _unused = state
            .gpu_miner
            .write()
            .await
            .detect(
                app_handle.clone(),
                config_dir.clone(),
                state.config.read().await.gpu_engine(),
            )
            .await
            .inspect_err(|e| error!(target: LOG_TARGET, "Could not detect gpu miner: {:?}", e));

        HardwareStatusMonitor::current().initialize().await?;

        let mut cpu_miner = state.cpu_miner.write().await;
        let benchmarked_hashrate = cpu_miner
            .start_benchmarking(
                state.shutdown.to_signal(),
                Duration::from_secs(30),
                data_dir.clone(),
                config_dir.clone(),
                log_dir.clone(),
            )
            .await?;
        drop(cpu_miner);

        Ok(Some(HardwareSetupPhasePayload {
            cpu_benchmarked_hashrate: benchmarked_hashrate,
        }))
    }

    async fn finalize_setup(
        &self,
        app_handle: AppHandle,
        payload: Option<HardwareSetupPhasePayload>,
    ) -> Result<(), Error> {
        SetupManager::get_instance()
            .lock()
            .await
            .set_phase_status(app_handle, SetupPhase::Hardware, true)
            .await;

        SetupManager::get_instance()
            .lock()
            .await
            .set_hardware_status_output(payload);

        // Todo: send event
        Ok(())
    }
}
