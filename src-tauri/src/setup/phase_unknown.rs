use std::time::{Duration, SystemTime};

use crate::{
    configs::{config_core::ConfigCore, trait_config::ConfigImpl},
    p2pool_manager::P2poolConfig,
    progress_trackers::{progress_stepper::ProgressStepperBuilder, ProgressStepper},
    tasks_tracker::TasksTracker,
    StartConfig, UniverseAppState,
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
pub struct UnknownSetupPhasePayload {}
#[derive(Clone, Default)]
pub struct UnknownSetupPhaseSessionConfiguration {
    pub cpu_benchmarked_hashrate: u64,
}

#[derive(Clone, Default)]
pub struct UnknownSetupPhaseAppConfiguration {
    p2pool_enabled: bool,
}

pub struct UnknownSetupPhase {
    progress_stepper: ProgressStepper,
    app_configuration: UnknownSetupPhaseAppConfiguration,
    session_configuration: UnknownSetupPhaseSessionConfiguration,
}

impl SetupPhaseImpl<UnknownSetupPhasePayload> for UnknownSetupPhase {
    type Configuration = UnknownSetupPhaseSessionConfiguration;

    fn new() -> Self {
        UnknownSetupPhase {
            progress_stepper: Self::create_progress_stepper(),
            app_configuration: UnknownSetupPhaseAppConfiguration::default(),
            session_configuration: UnknownSetupPhaseSessionConfiguration::default(),
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

        let p2pool_enabled = *ConfigCore::current()
            .lock()
            .await
            .get_content()
            .is_p2pool_enabled();

        self.app_configuration = UnknownSetupPhaseAppConfiguration { p2pool_enabled };

        Ok(())
    }

    async fn setup(self: std::sync::Arc<Self>, app_handle: AppHandle) {
        info!(target: LOG_TARGET, "[ Unknown Phase ] Starting setup");

        TasksTracker::current().spawn(async move {
            let setup_timeout = tokio::time::sleep(SETUP_TIMEOUT_DURATION);
            tokio::select! {
                _ = setup_timeout => {
                    error!(target: LOG_TARGET, "[ Unknown Phase ] Setup timed out");
                    let error_message = "[ Unknown Phase ] Setup timed out";
                    sentry::capture_message(&error_message, sentry::Level::Error);
                }
                result = self.setup_inner(app_handle.clone()) => {
                    match result {
                        Ok(payload) => {
                            info!(target: LOG_TARGET, "[ Unknown Phase ] Setup completed successfully");
                            self.finalize_setup(app_handle.clone(),payload).await;
                        }
                        Err(error) => {
                            error!(target: LOG_TARGET, "[ Unknown Phase ] Setup failed with error: {:?}", error);
                            let error_message = format!("[ Unknown Phase ] Setup failed with error: {:?}", error);
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
    ) -> Result<Option<UnknownSetupPhasePayload>, Error> {
        let (data_dir, config_dir, log_dir) = self.get_app_dirs(&app_handle)?;
        let state = app_handle.state::<UniverseAppState>();
        let tari_address = state.cpu_miner_config.read().await.tari_address.clone();
        let telemetry_id = state
            .telemetry_manager
            .read()
            .await
            .get_unique_string()
            .await;

        if self.app_configuration.p2pool_enabled {
            let base_node_grpc = state.node_manager.get_grpc_port().await?;
            let p2pool_config = P2poolConfig::builder()
                .with_base_node(base_node_grpc)
                .with_stats_server_port(state.config.read().await.p2pool_stats_server_port())
                .with_cpu_benchmark_hashrate(Some(
                    self.session_configuration.cpu_benchmarked_hashrate,
                ))
                .build()?;

            state
                .p2pool_manager
                .ensure_started(
                    state.shutdown.to_signal(),
                    p2pool_config,
                    data_dir.clone(),
                    config_dir.clone(),
                    log_dir.clone(),
                )
                .await?;
        }
        let base_node_grpc_port = state.node_manager.get_grpc_port().await?;

        let config = state.config.read().await;
        let p2pool_port = state.p2pool_manager.grpc_port().await;
        state
            .mm_proxy_manager
            .start(StartConfig {
                base_node_grpc_port,
                p2pool_port,
                app_shutdown: state.shutdown.to_signal().clone(),
                base_path: data_dir.clone(),
                config_path: config_dir.clone(),
                log_path: log_dir.clone(),
                tari_address,
                coinbase_extra: telemetry_id,
                p2pool_enabled: self.app_configuration.p2pool_enabled,
                monero_nodes: config.mmproxy_monero_nodes().clone(),
                use_monero_fail: config.mmproxy_use_monero_fail(),
            })
            .await?;
        state.mm_proxy_manager.wait_ready().await?;

        Ok(None)
    }

    async fn finalize_setup(
        &self,
        app_handle: AppHandle,
        payload: Option<UnknownSetupPhasePayload>,
    ) -> Result<(), Error> {
        SetupManager::get_instance()
            .lock()
            .await
            .set_phase_status_second(app_handle, SetupPhase::Unknown, true)
            .await;

        // Todo: send event
        Ok(())
    }
}
