// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use external_dependencies::{ExternalDependencies, ExternalDependency, RequiredExternalDependency};
use log::trace;
use log::{debug, error, info, warn};
use sentry::protocol::Event;
use sentry_tauri::sentry;
use serde::Serialize;
use std::collections::HashMap;
use std::fs::{read_dir, remove_dir_all, remove_file};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use std::thread::sleep;
use std::time::{Duration, Instant, SystemTime};
use tari_common::configuration::Network;
use tari_common_types::tari_address::TariAddress;
use tari_core::transactions::tari_amount::MicroMinotari;
use tari_shutdown::Shutdown;
use tauri::async_runtime::block_on;
use tauri::{Manager, RunEvent, UpdaterEvent};
use tokio::sync::RwLock;
use wallet_adapter::TransactionInfo;

use app_config::AppConfig;
use app_in_memory_config::{AirdropInMemoryConfig, AppInMemoryConfig};
use binaries::{binaries_list::Binaries, binaries_resolver::BinaryResolver};
use gpu_miner_adapter::{GpuMinerStatus, GpuNodeSource};
use hardware_monitor::{HardwareMonitor, HardwareParameters};
use node_manager::NodeManagerError;
use progress_tracker::ProgressTracker;
use setup_status_event::SetupStatusEvent;
use systemtray_manager::{SystemtrayManager, SystrayData};
use telemetry_manager::TelemetryManager;
use wallet_manager::WalletManagerError;

use crate::cpu_miner::CpuMiner;
use crate::feedback::Feedback;
use crate::gpu_miner::GpuMiner;
use crate::internal_wallet::InternalWallet;
use crate::mm_proxy_manager::{MmProxyManager, StartConfig};
use crate::node_manager::NodeManager;
use crate::p2pool::models::Stats;
use crate::p2pool_manager::{P2poolConfig, P2poolManager};
use crate::tor_manager::TorManager;
use crate::wallet_adapter::WalletBalance;
use crate::wallet_manager::WalletManager;

mod app_config;
mod app_in_memory_config;
mod binaries;
mod consts;
mod cpu_miner;
mod download_utils;
mod external_dependencies;
mod feedback;
mod format_utils;
mod github;
mod gpu_miner;
mod gpu_miner_adapter;
mod hardware_monitor;
mod internal_wallet;
mod mm_proxy_adapter;
mod mm_proxy_manager;
mod network_utils;
mod node_adapter;
mod node_manager;
mod p2pool;
mod p2pool_adapter;
mod p2pool_manager;
mod process_adapter;
mod process_killer;
mod process_utils;
mod process_watcher;
mod progress_tracker;
mod setup_status_event;
mod systemtray_manager;
mod telemetry_manager;
mod tests;
mod tor_adapter;
mod tor_manager;
mod user_listener;
mod utils;
mod wallet_adapter;
mod wallet_manager;
mod xmrig;
mod xmrig_adapter;

const MAX_ACCEPTABLE_COMMAND_TIME: Duration = Duration::from_secs(1);

const LOG_TARGET: &str = "tari::universe::main";
const LOG_TARGET_WEB: &str = "tari::universe::web";

#[cfg(not(any(feature = "release-ci", feature = "release-ci-beta")))]
const APPLICATION_FOLDER_ID: &str = "com.tari.universe.alpha";
#[cfg(all(feature = "release-ci", feature = "release-ci-beta"))]
const APPLICATION_FOLDER_ID: &str = "com.tari.universe.other";
#[cfg(all(feature = "release-ci", not(feature = "release-ci-beta")))]
const APPLICATION_FOLDER_ID: &str = "com.tari.universe";
#[cfg(all(feature = "release-ci-beta", not(feature = "release-ci")))]
const APPLICATION_FOLDER_ID: &str = "com.tari.universe.beta";

#[derive(Debug, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
struct UpdateProgressRustEvent {
    chunk_length: usize,
    content_length: u64,
    downloaded: u64,
}

async fn stop_all_miners(state: UniverseAppState, sleep_secs: u64) -> Result<(), String> {
    state
        .cpu_miner
        .write()
        .await
        .stop()
        .await
        .map_err(|e| e.to_string())?;
    state
        .gpu_miner
        .write()
        .await
        .stop()
        .await
        .map_err(|e| e.to_string())?;
    let exit_code = state
        .wallet_manager
        .stop()
        .await
        .map_err(|e| e.to_string())?;
    info!(target: LOG_TARGET, "Wallet manager stopped with exit code: {}", exit_code);
    state
        .mm_proxy_manager
        .stop()
        .await
        .map_err(|e| e.to_string())?;
    let exit_code = state.node_manager.stop().await.map_err(|e| e.to_string())?;
    info!(target: LOG_TARGET, "Node manager stopped with exit code: {}", exit_code);
    let exit_code = state
        .p2pool_manager
        .stop()
        .await
        .map_err(|e| e.to_string())?;
    info!(target: LOG_TARGET, "P2Pool manager stopped with exit code: {}", exit_code);

    state.shutdown.clone().trigger();

    // TODO: Find a better way of knowing that all miners have stopped
    sleep(std::time::Duration::from_secs(sleep_secs));
    Ok(())
}

#[tauri::command]
async fn set_mode(mode: String, state: tauri::State<'_, UniverseAppState>) -> Result<(), String> {
    let timer = Instant::now();
    state
        .config
        .write()
        .await
        .set_mode(mode)
        .await
        .inspect_err(|e| error!(target: LOG_TARGET, "error at set_mode {:?}", e))
        .map_err(|e| e.to_string())?;
    if timer.elapsed() > MAX_ACCEPTABLE_COMMAND_TIME {
        warn!(target: LOG_TARGET, "set_mode took too long: {:?}", timer.elapsed());
    }

    Ok(())
}

#[tauri::command]
async fn set_use_tor(
    use_tor: bool,
    state: tauri::State<'_, UniverseAppState>,
) -> Result<(), String> {
    let timer = Instant::now();
    state
        .config
        .write()
        .await
        .set_use_tor(use_tor)
        .await
        .inspect_err(|e| error!(target: LOG_TARGET, "error at set_use_tor {:?}", e))
        .map_err(|e| e.to_string())?;
    if timer.elapsed() > MAX_ACCEPTABLE_COMMAND_TIME {
        warn!(target: LOG_TARGET, "set_use_tor took too long: {:?}", timer.elapsed());
    }

    Ok(())
}

#[tauri::command]
async fn send_feedback(
    feedback: String,
    include_logs: bool,
    _window: tauri::Window,
    state: tauri::State<'_, UniverseAppState>,
    app: tauri::AppHandle,
) -> Result<String, String> {
    let timer = Instant::now();
    let reference = state
        .feedback
        .read()
        .await
        .send_feedback(
            feedback,
            include_logs,
            app.path_resolver().app_log_dir().clone(),
        )
        .await
        .inspect_err(|e| error!("error at send_feedback {:?}", e))
        .map_err(|e| e.to_string())?;
    if timer.elapsed() > Duration::from_secs(60) {
        warn!(target: LOG_TARGET, "send_feedback took too long: {:?}", timer.elapsed());
    }
    Ok(reference)
}

#[tauri::command]
async fn set_allow_telemetry(
    allow_telemetry: bool,
    _window: tauri::Window,
    state: tauri::State<'_, UniverseAppState>,
    _app: tauri::AppHandle,
) -> Result<(), String> {
    state
        .config
        .write()
        .await
        .set_allow_telemetry(allow_telemetry)
        .await
        .inspect_err(|e| error!(target: LOG_TARGET, "error at set_allow_telemetry {:?}", e))
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
async fn get_app_id(
    _window: tauri::Window,
    state: tauri::State<'_, UniverseAppState>,
    _app: tauri::AppHandle,
) -> Result<String, ()> {
    let timer = Instant::now();
    let app_id = state.config.read().await.anon_id().to_string();
    if timer.elapsed() > MAX_ACCEPTABLE_COMMAND_TIME {
        warn!(target: LOG_TARGET, "get_app_id took too long: {:?}", timer.elapsed());
    }
    Ok(app_id)
}

#[tauri::command]
async fn set_airdrop_access_token(
    token: String,
    _window: tauri::Window,
    state: tauri::State<'_, UniverseAppState>,
    _app: tauri::AppHandle,
) -> Result<(), String> {
    let timer = Instant::now();
    let mut write_lock = state.airdrop_access_token.write().await;
    *write_lock = Some(token.clone());
    if timer.elapsed() > MAX_ACCEPTABLE_COMMAND_TIME {
        warn!(target: LOG_TARGET,
            "set_airdrop_access_token took too long: {:?}",
            timer.elapsed()
        );
    }
    let mut in_memory_app_config = state.in_memory_config.write().await;
    in_memory_app_config.airdrop_access_token = Some(token);
    Ok(())
}

#[tauri::command]
async fn get_app_in_memory_config(
    _window: tauri::Window,
    state: tauri::State<'_, UniverseAppState>,
    _app: tauri::AppHandle,
) -> Result<AirdropInMemoryConfig, ()> {
    let timer = Instant::now();
    let res = state.in_memory_config.read().await.clone().into();
    if timer.elapsed() > MAX_ACCEPTABLE_COMMAND_TIME {
        warn!(target: LOG_TARGET,
            "get_app_in_memory_config took too long: {:?}",
            timer.elapsed()
        );
    }
    Ok(res)
}

#[tauri::command]
async fn set_monero_address(
    monero_address: String,
    state: tauri::State<'_, UniverseAppState>,
) -> Result<(), String> {
    let timer = Instant::now();
    let mut app_config = state.config.write().await;
    app_config
        .set_monero_address(monero_address)
        .await
        .map_err(|e| e.to_string())?;
    if timer.elapsed() > MAX_ACCEPTABLE_COMMAND_TIME {
        warn!(target: LOG_TARGET, "set_monero_address took too long: {:?}", timer.elapsed());
    }
    Ok(())
}

#[tauri::command]
async fn restart_application(
    _window: tauri::Window,
    _state: tauri::State<'_, UniverseAppState>,
    app: tauri::AppHandle,
) -> Result<(), String> {
    // This restart doesn't need to shutdown all the miners
    app.restart();
    Ok(())
}

#[tauri::command]
async fn exit_application(
    _window: tauri::Window,
    state: tauri::State<'_, UniverseAppState>,
    app: tauri::AppHandle,
) -> Result<(), String> {
    stop_all_miners(state.inner().clone(), 5).await?;

    app.exit(0);
    Ok(())
}

#[tauri::command]
async fn set_should_always_use_system_language(
    should_always_use_system_language: bool,
    state: tauri::State<'_, UniverseAppState>,
) -> Result<(), String> {
    state
        .config
        .write()
        .await
        .set_should_always_use_system_language(should_always_use_system_language)
        .await
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
async fn set_application_language(
    state: tauri::State<'_, UniverseAppState>,
    application_language: String,
) -> Result<(), String> {
    state
        .config
        .write()
        .await
        .set_application_language(application_language.clone())
        .await
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
async fn resolve_application_language(
    state: tauri::State<'_, UniverseAppState>,
) -> Result<String, String> {
    let mut config = state.config.write().await;
    let _unused = config.propose_system_language().await;

    Ok(config.application_language().to_string())
}

#[tauri::command]
async fn get_external_dependencies() -> Result<RequiredExternalDependency, String> {
    let timer = Instant::now();
    let external_dependencies = ExternalDependencies::current()
        .get_external_dependencies()
        .await;
    if timer.elapsed() > MAX_ACCEPTABLE_COMMAND_TIME {
        warn!(target: LOG_TARGET,
            "get_external_dependencies took too long: {:?}",
            timer.elapsed()
        );
    }
    Ok(external_dependencies)
}

#[tauri::command]
async fn download_and_start_installer(
    _missing_dependency: ExternalDependency,
) -> Result<(), String> {
    let timer = Instant::now();

    #[cfg(target_os = "windows")]
    if cfg!(target_os = "windows") {
        ExternalDependencies::current()
            .install_missing_dependencies(_missing_dependency)
            .await
            .map_err(|e| {
                error!(target: LOG_TARGET, "Could not install missing dependency: {:?}", e);
                e.to_string()
            })?;
    }

    if timer.elapsed() > MAX_ACCEPTABLE_COMMAND_TIME {
        warn!(target: LOG_TARGET,
            "download_and_start_installer took too long: {:?}",
            timer.elapsed()
        );
    }
    Ok(())
}

#[tauri::command]
async fn setup_application(
    window: tauri::Window,
    state: tauri::State<'_, UniverseAppState>,
    app: tauri::AppHandle,
) -> Result<bool, String> {
    let timer = Instant::now();
    setup_inner(window, state.clone(), app).await.map_err(|e| {
        warn!(target: LOG_TARGET, "Error setting up application: {:?}", e);
        e.to_string()
    })?;

    let res = state.config.read().await.auto_mining();
    if timer.elapsed() > MAX_ACCEPTABLE_COMMAND_TIME {
        warn!(target: LOG_TARGET, "setup_application took too long: {:?}", timer.elapsed());
    }
    Ok(res)
}

#[allow(clippy::too_many_lines)]
async fn setup_inner(
    window: tauri::Window,
    state: tauri::State<'_, UniverseAppState>,
    app: tauri::AppHandle,
) -> Result<(), anyhow::Error> {
    window
        .emit(
            "message",
            SetupStatusEvent {
                event_type: "setup_status".to_string(),
                title: "starting-up".to_string(),
                title_params: None,
                progress: 0.0,
            },
        )
        .inspect_err(|e| error!(target: LOG_TARGET, "Could not emit event 'message': {:?}", e))?;

    let data_dir = app
        .path_resolver()
        .app_local_data_dir()
        .expect("Could not get data dir");
    let config_dir = app
        .path_resolver()
        .app_config_dir()
        .expect("Could not get config dir");
    let log_dir = app
        .path_resolver()
        .app_log_dir()
        .expect("Could not get log dir");

    #[cfg(target_os = "windows")]
    if cfg!(target_os = "windows") && !cfg!(dev) {
        ExternalDependencies::current()
            .read_registry_installed_applications()
            .await?;
        let is_missing = ExternalDependencies::current()
            .check_if_some_dependency_is_not_installed()
            .await;
        let external_dependencies = ExternalDependencies::current()
            .get_external_dependencies()
            .await;

        if is_missing {
            window
                .emit(
                    "missing-applications",
                    external_dependencies
                ).inspect_err(|e| error!(target: LOG_TARGET, "Could not emit event 'missing-applications': {:?}", e))?;
            return Ok(());
        }
    }

    let cpu_miner_config = state.cpu_miner_config.read().await;
    let app_config = state.config.read().await;
    let use_tor = app_config.use_tor();
    drop(app_config);
    let mm_proxy_manager = state.mm_proxy_manager.clone();

    let progress = ProgressTracker::new(window.clone());

    let last_binaries_update_timestamp = state.config.read().await.last_binaries_update_timestamp();
    let now = SystemTime::now();

    state
        .telemetry_manager
        .write()
        .await
        .initialize(state.airdrop_access_token.clone(), window.clone())
        .await?;

    let mut binary_resolver = BinaryResolver::current().write().await;
    let should_check_for_update = now
        .duration_since(last_binaries_update_timestamp)
        .unwrap_or(Duration::from_secs(0))
        > Duration::from_secs(60 * 60 * 6);

    if use_tor && cfg!(target_os = "windows") {
        progress.set_max(5).await;
        progress
            .update("checking-latest-version-tor".to_string(), None, 0)
            .await;
        binary_resolver
            .initalize_binary(Binaries::Tor, progress.clone(), should_check_for_update)
            .await?;
        sleep(Duration::from_secs(1));
    }
    progress.set_max(10).await;
    progress
        .update("checking-latest-version-node".to_string(), None, 0)
        .await;
    binary_resolver
        .initalize_binary(
            Binaries::MinotariNode,
            progress.clone(),
            should_check_for_update,
        )
        .await?;
    sleep(Duration::from_secs(1));

    progress.set_max(15).await;
    progress
        .update("checking-latest-version-mmproxy".to_string(), None, 0)
        .await;
    binary_resolver
        .initalize_binary(
            Binaries::MergeMiningProxy,
            progress.clone(),
            should_check_for_update,
        )
        .await?;
    sleep(Duration::from_secs(1));
    progress.set_max(20).await;
    progress
        .update("checking-latest-version-wallet".to_string(), None, 0)
        .await;
    binary_resolver
        .initalize_binary(Binaries::Wallet, progress.clone(), should_check_for_update)
        .await?;

    sleep(Duration::from_secs(1));
    progress.set_max(25).await;
    progress
        .update("checking-latest-version-gpuminer".to_string(), None, 0)
        .await;
    binary_resolver
        .initalize_binary(
            Binaries::GpuMiner,
            progress.clone(),
            should_check_for_update,
        )
        .await?;
    sleep(Duration::from_secs(1));

    progress.set_max(30).await;
    progress
        .update("checking-latest-version-xmrig".to_string(), None, 0)
        .await;
    binary_resolver
        .initalize_binary(Binaries::Xmrig, progress.clone(), should_check_for_update)
        .await?;
    sleep(Duration::from_secs(1));
    progress.set_max(35).await;
    progress
        .update("checking-latest-version-sha-p2pool".to_string(), None, 0)
        .await;
    binary_resolver
        .initalize_binary(
            Binaries::ShaP2pool,
            progress.clone(),
            should_check_for_update,
        )
        .await?;
    sleep(Duration::from_secs(1));
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

    let _unused = state
        .gpu_miner
        .write()
        .await
        .detect(config_dir.clone())
        .await
        .inspect_err(|e| error!(target: LOG_TARGET, "Could not detect gpu miner: {:?}", e));

    if use_tor && cfg!(target_os = "windows") {
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
    for _i in 0..2 {
        match state
            .node_manager
            .ensure_started(
                state.shutdown.to_signal(),
                data_dir.clone(),
                config_dir.clone(),
                log_dir.clone(),
                use_tor,
            )
            .await
        {
            Ok(_) => {}
            Err(e) => {
                if let NodeManagerError::ExitCode(code) = e {
                    if code == 114 {
                        warn!(target: LOG_TARGET, "Database for node is corrupt or needs a reset, deleting and trying again.");
                        state.node_manager.clean_data_folder(&data_dir).await?;
                        continue;
                    }
                }
                error!(target: LOG_TARGET, "Could not start node manager: {:?}", e);

                app.exit(-1);
                return Err(e.into());
            }
        }
    }

    info!(target: LOG_TARGET, "Node has started and is ready");

    progress.set_max(40).await;
    progress
        .update("waiting-for-wallet".to_string(), None, 0)
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

    progress.set_max(75).await;
    progress
        .update("preparing-for-initial-sync".to_string(), None, 0)
        .await;
    state.node_manager.wait_synced(progress.clone()).await?;

    if state.config.read().await.p2pool_enabled() {
        progress.set_max(85).await;
        progress
            .update("starting-p2pool".to_string(), None, 0)
            .await;

        let base_node_grpc = state.node_manager.get_grpc_port().await?;
        let p2pool_config = P2poolConfig::builder()
            .with_base_node(base_node_grpc)
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

    progress.set_max(100).await;
    progress
        .update("starting-mmproxy".to_string(), None, 0)
        .await;

    let base_node_grpc_port = state.node_manager.get_grpc_port().await?;

    let mut telemetry_id = state
        .telemetry_manager
        .read()
        .await
        .get_unique_string()
        .await;
    if telemetry_id.is_empty() {
        telemetry_id = "unknown_miner_tari_universe".to_string();
    }

    let config = state.config.read().await;
    let p2pool_port = state.p2pool_manager.grpc_port().await;
    mm_proxy_manager
        .start(StartConfig::new(
            state.shutdown.to_signal().clone(),
            data_dir.clone(),
            config_dir.clone(),
            log_dir.clone(),
            cpu_miner_config.tari_address.clone(),
            base_node_grpc_port,
            telemetry_id,
            config.p2pool_enabled(),
            p2pool_port,
        ))
        .await?;
    mm_proxy_manager.wait_ready().await?;
    *state.is_setup_finished.write().await = true;
    drop(
        window
            .emit(
                "message",
                SetupStatusEvent {
                    event_type: "setup_status".to_string(),
                    title: "application-started".to_string(),
                    title_params: None,
                    progress: 1.0,
                },
            )
            .inspect_err(|e| error!(target: LOG_TARGET, "Could not emit event 'message': {:?}", e)),
    );

    Ok(())
}

#[tauri::command]
async fn set_p2pool_enabled(
    p2pool_enabled: bool,
    state: tauri::State<'_, UniverseAppState>,
) -> Result<(), String> {
    let timer = Instant::now();
    state
        .config
        .write()
        .await
        .set_p2pool_enabled(p2pool_enabled)
        .await
        .inspect_err(|e| error!("error at set_p2pool_enabled {:?}", e))
        .map_err(|e| e.to_string())?;

    let origin_config = state.mm_proxy_manager.config().await;
    let p2pool_grpc_port = state.p2pool_manager.grpc_port().await;

    match origin_config {
        None => {
            warn!(target: LOG_TARGET, "Tried to set p2pool_enabled but mmproxy has not been initialized yet");
            return Ok(());
        }
        Some(mut origin_config) => {
            if origin_config.p2pool_enabled != p2pool_enabled {
                if p2pool_enabled {
                    origin_config.set_to_use_p2pool(p2pool_grpc_port);
                } else {
                    let base_node_grpc_port = state
                        .node_manager
                        .get_grpc_port()
                        .await
                        .map_err(|error| error.to_string())?;
                    origin_config.set_to_use_base_node(base_node_grpc_port);
                };
                state
                    .mm_proxy_manager
                    .change_config(origin_config)
                    .await
                    .map_err(|error| error.to_string())?;
            }
        }
    };

    if timer.elapsed() > MAX_ACCEPTABLE_COMMAND_TIME {
        warn!(target: LOG_TARGET, "set_p2pool_enabled took too long: {:?}", timer.elapsed());
    }
    Ok(())
}

#[tauri::command]
async fn set_cpu_mining_enabled<'r>(
    enabled: bool,
    state: tauri::State<'_, UniverseAppState>,
) -> Result<(), String> {
    let timer = Instant::now();
    let mut config = state.config.write().await;
    config
        .set_cpu_mining_enabled(enabled)
        .await
        .inspect_err(|e| error!("error at set_cpu_mining_enabled {:?}", e))
        .map_err(|e| e.to_string())?;
    if timer.elapsed() > MAX_ACCEPTABLE_COMMAND_TIME {
        warn!(target: LOG_TARGET,
            "set_cpu_mining_enabled took too long: {:?}",
            timer.elapsed()
        );
    }
    Ok(())
}

#[tauri::command]
async fn set_gpu_mining_enabled(
    enabled: bool,
    state: tauri::State<'_, UniverseAppState>,
) -> Result<(), String> {
    let timer = Instant::now();
    let mut config = state.config.write().await;
    config
        .set_gpu_mining_enabled(enabled)
        .await
        .inspect_err(|e| error!("error at set_gpu_mining_enabled {:?}", e))
        .map_err(|e| e.to_string())?;
    if timer.elapsed() > MAX_ACCEPTABLE_COMMAND_TIME {
        warn!(target: LOG_TARGET,
            "set_gpu_mining_enabled took too long: {:?}",
            timer.elapsed()
        );
    }

    Ok(())
}

#[tauri::command]
async fn get_seed_words(
    _window: tauri::Window,
    _state: tauri::State<'_, UniverseAppState>,
    app: tauri::AppHandle,
) -> Result<Vec<String>, String> {
    let timer = Instant::now();
    let config_path = app
        .path_resolver()
        .app_config_dir()
        .expect("Could not get config dir");
    let internal_wallet = InternalWallet::load_or_create(config_path)
        .await
        .map_err(|e| e.to_string())?;
    let seed_words = internal_wallet
        .decrypt_seed_words()
        .map_err(|e| e.to_string())?;
    let mut res = vec![];
    for i in 0..seed_words.len() {
        match seed_words.get_word(i) {
            Ok(word) => res.push(word.clone()),
            Err(error) => {
                error!(target: LOG_TARGET, "Could not get seed word: {:?}", error);
            }
        }
    }
    if timer.elapsed() > MAX_ACCEPTABLE_COMMAND_TIME {
        warn!(target: LOG_TARGET, "get_seed_words took too long: {:?}", timer.elapsed());
    }
    Ok(res)
}

#[allow(clippy::too_many_lines)]
#[tauri::command]
async fn start_mining<'r>(
    state: tauri::State<'_, UniverseAppState>,
    app: tauri::AppHandle,
) -> Result<(), String> {
    let timer = Instant::now();
    let config = state.config.read().await;
    let cpu_mining_enabled = config.cpu_mining_enabled();
    let gpu_mining_enabled = config.gpu_mining_enabled();
    let mode = config.mode();

    let cpu_miner_config = state.cpu_miner_config.read().await;
    let monero_address = config.monero_address().to_string();
    if cpu_mining_enabled {
        let mm_proxy_port = state
            .mm_proxy_manager
            .get_monero_port()
            .await
            .map_err(|e| e.to_string())?;

        let res = state
            .cpu_miner
            .write()
            .await
            .start(
                state.shutdown.to_signal(),
                &cpu_miner_config,
                monero_address.to_string(),
                mm_proxy_port,
                app.path_resolver()
                    .app_local_data_dir()
                    .expect("Could not get data dir"),
                app.path_resolver()
                    .app_config_dir()
                    .expect("Could not get config dir"),
                app.path_resolver()
                    .app_log_dir()
                    .expect("Could not get log dir"),
                mode,
            )
            .await;

        if let Err(e) = res {
            error!(target: LOG_TARGET, "Could not start mining: {:?}", e);
            state
                .cpu_miner
                .write()
                .await
                .stop()
                .await
                .inspect_err(|e| error!("error at stopping cpu miner {:?}", e))
                .ok();
            return Err(e.to_string());
        }
    }

    let gpu_available = state.gpu_miner.read().await.is_gpu_mining_available();
    info!(target: LOG_TARGET, "Gpu availability {:?}", gpu_available.clone());

    if gpu_mining_enabled && gpu_available {
        let tari_address = state.cpu_miner_config.read().await.tari_address.clone();
        let p2pool_enabled = state.config.read().await.p2pool_enabled();
        let source = if p2pool_enabled {
            let p2pool_port = state.p2pool_manager.grpc_port().await;
            GpuNodeSource::P2Pool { port: p2pool_port }
        } else {
            let grpc_port = state
                .node_manager
                .get_grpc_port()
                .await
                .map_err(|e| e.to_string())?;

            GpuNodeSource::BaseNode { port: grpc_port }
        };

        let mut telemetry_id = state
            .telemetry_manager
            .read()
            .await
            .get_unique_string()
            .await;
        if telemetry_id.is_empty() {
            telemetry_id = "tari-universe".to_string();
        }

        let res = state
            .gpu_miner
            .write()
            .await
            .start(
                state.shutdown.to_signal(),
                tari_address,
                source,
                app.path_resolver()
                    .app_local_data_dir()
                    .expect("Could not get data dir"),
                app.path_resolver()
                    .app_config_dir()
                    .expect("Could not get config dir"),
                app.path_resolver()
                    .app_log_dir()
                    .expect("Could not get log dir"),
                mode,
                telemetry_id,
            )
            .await;

        if let Err(e) = res {
            error!(target: LOG_TARGET, "Could not start gpu mining: {:?}", e);
            drop(
                state.cpu_miner.write().await.stop().await.inspect_err(
                    |e| error!(target: LOG_TARGET, "Could not stop cpu miner: {:?}", e),
                ),
            );
            return Err(e.to_string());
        }
    }
    if timer.elapsed() > MAX_ACCEPTABLE_COMMAND_TIME {
        warn!(target: LOG_TARGET, "start_mining took too long: {:?}", timer.elapsed());
    }
    Ok(())
}

#[tauri::command]
async fn stop_mining<'r>(state: tauri::State<'_, UniverseAppState>) -> Result<(), String> {
    let timer = Instant::now();
    state
        .cpu_miner
        .write()
        .await
        .stop()
        .await
        .map_err(|e| e.to_string())?;

    state
        .gpu_miner
        .write()
        .await
        .stop()
        .await
        .map_err(|e| e.to_string())?;
    if timer.elapsed() > MAX_ACCEPTABLE_COMMAND_TIME {
        warn!(target: LOG_TARGET, "stop_mining took too long: {:?}", timer.elapsed());
    }
    Ok(())
}

#[tauri::command]
fn open_log_dir(app: tauri::AppHandle) {
    let log_dir = app
        .path_resolver()
        .app_log_dir()
        .expect("Could not get log dir");
    if let Err(e) = open::that(log_dir) {
        error!(target: LOG_TARGET, "Could not open log dir: {:?}", e);
    }
}

#[tauri::command]
async fn get_applications_versions(app: tauri::AppHandle) -> Result<ApplicationsVersions, String> {
    let timer = Instant::now();
    let binary_resolver = BinaryResolver::current().read().await;

    let tari_universe_version = app.package_info().version.clone();
    let xmrig_version = binary_resolver
        .get_binary_version_string(Binaries::Xmrig)
        .await;

    let minotari_node_version = binary_resolver
        .get_binary_version_string(Binaries::MinotariNode)
        .await;
    let mm_proxy_version = binary_resolver
        .get_binary_version_string(Binaries::MergeMiningProxy)
        .await;
    let wallet_version = binary_resolver
        .get_binary_version_string(Binaries::Wallet)
        .await;
    let sha_p2pool_version = binary_resolver
        .get_binary_version_string(Binaries::ShaP2pool)
        .await;
    let xtrgpuminer_version = binary_resolver
        .get_binary_version_string(Binaries::GpuMiner)
        .await;

    if timer.elapsed() > MAX_ACCEPTABLE_COMMAND_TIME {
        warn!(target: LOG_TARGET,
            "get_applications_versions took too long: {:?}",
            timer.elapsed()
        );
    }

    drop(binary_resolver);

    Ok(ApplicationsVersions {
        tari_universe: tari_universe_version.to_string(),
        minotari_node: minotari_node_version,
        xmrig: xmrig_version,
        mm_proxy: mm_proxy_version,
        wallet: wallet_version,
        sha_p2pool: sha_p2pool_version,
        xtrgpuminer: xtrgpuminer_version,
    })
}

#[tauri::command]
async fn update_applications(
    app: tauri::AppHandle,
    state: tauri::State<'_, UniverseAppState>,
) -> Result<(), String> {
    let timer = Instant::now();
    let mut binary_resolver = BinaryResolver::current().write().await;

    state
        .config
        .write()
        .await
        .set_last_binaries_update_timestamp(SystemTime::now())
        .await
        .inspect_err(
            |e| error!(target: LOG_TARGET, "Could not set last binaries update timestamp: {:?}", e),
        )
        .map_err(|e| e.to_string())?;

    let progress_tracker = ProgressTracker::new(
        app.get_window("main")
            .expect("Could not get main window")
            .clone(),
    );
    binary_resolver
        .update_binary(Binaries::Xmrig, progress_tracker.clone())
        .await
        .map_err(|e| e.to_string())?;
    sleep(Duration::from_secs(1));
    binary_resolver
        .update_binary(Binaries::MinotariNode, progress_tracker.clone())
        .await
        .map_err(|e| e.to_string())?;
    sleep(Duration::from_secs(1));
    binary_resolver
        .update_binary(Binaries::MergeMiningProxy, progress_tracker.clone())
        .await
        .map_err(|e| e.to_string())?;
    sleep(Duration::from_secs(1));
    binary_resolver
        .update_binary(Binaries::Wallet, progress_tracker.clone())
        .await
        .map_err(|e| e.to_string())?;
    binary_resolver
        .update_binary(Binaries::ShaP2pool, progress_tracker.clone())
        .await
        .map_err(|e| e.to_string())?;
    sleep(Duration::from_secs(1));

    if timer.elapsed() > MAX_ACCEPTABLE_COMMAND_TIME {
        warn!(target: LOG_TARGET, "update_applications took too long: {:?}", timer.elapsed());
    }

    drop(binary_resolver);

    Ok(())
}

#[tauri::command]
async fn get_p2pool_stats(
    state: tauri::State<'_, UniverseAppState>,
) -> Result<HashMap<String, Stats>, String> {
    let timer = Instant::now();
    if state.is_getting_p2pool_stats.load(Ordering::SeqCst) {
        let read = state.cached_p2pool_stats.read().await;
        if let Some(stats) = &*read {
            warn!(target: LOG_TARGET, "Already getting p2pool stats, returning cached value");
            return Ok(stats.clone());
        }
        warn!(target: LOG_TARGET, "Already getting p2pool stats");
        return Err("Already getting p2pool stats".to_string());
    }
    state.is_getting_p2pool_stats.store(true, Ordering::SeqCst);
    let p2pool_stats = state.p2pool_manager.stats().await;

    if timer.elapsed() > MAX_ACCEPTABLE_COMMAND_TIME {
        warn!(target: LOG_TARGET, "get_p2pool_stats took too long: {:?}", timer.elapsed());
    }
    let mut lock = state.cached_p2pool_stats.write().await;
    *lock = Some(p2pool_stats.clone());
    state.is_getting_p2pool_stats.store(false, Ordering::SeqCst);
    Ok(p2pool_stats)
}

#[tauri::command]
async fn get_transaction_history(
    state: tauri::State<'_, UniverseAppState>,
) -> Result<Vec<TransactionInfo>, String> {
    let timer = Instant::now();
    if state.is_getting_transaction_history.load(Ordering::SeqCst) {
        warn!(target: LOG_TARGET, "Already getting transaction history");
        return Err("Already getting transaction history".to_string());
    }
    state
        .is_getting_transaction_history
        .store(true, Ordering::SeqCst);
    let transactions = match state.wallet_manager.get_transaction_history().await {
        Ok(t) => t,
        Err(e) => {
            if !matches!(e, WalletManagerError::WalletNotStarted) {
                warn!(target: LOG_TARGET, "Error getting transaction history: {}", e);
            }
            vec![]
        }
    };

    if timer.elapsed() > MAX_ACCEPTABLE_COMMAND_TIME {
        warn!(target: LOG_TARGET, "get_transaction_history took too long: {:?}", timer.elapsed());
    }

    state
        .is_getting_transaction_history
        .store(false, Ordering::SeqCst);
    Ok(transactions)
}

#[tauri::command]
async fn get_tari_wallet_details(
    state: tauri::State<'_, UniverseAppState>,
) -> Result<TariWalletDetails, String> {
    let timer = Instant::now();
    if state.is_getting_wallet_balance.load(Ordering::SeqCst) {
        let read = state.cached_wallet_details.read().await;
        if let Some(details) = &*read {
            warn!(target: LOG_TARGET, "Already getting wallet balance, returning cached value");
            return Ok(details.clone());
        }
        warn!(target: LOG_TARGET, "Already getting wallet balance");
        return Err("Already getting wallet balance".to_string());
    }
    state
        .is_getting_wallet_balance
        .store(true, Ordering::SeqCst);
    let wallet_balance = match state.wallet_manager.get_balance().await {
        Ok(w) => Some(w),
        Err(e) => {
            if !matches!(e, WalletManagerError::WalletNotStarted) {
                warn!(target: LOG_TARGET, "Error getting wallet balance: {}", e);
            }

            None
        }
    };
    let tari_address = state.tari_address.read().await;

    if timer.elapsed() > MAX_ACCEPTABLE_COMMAND_TIME {
        warn!(target: LOG_TARGET, "get_tari_wallet_details took too long: {:?}", timer.elapsed());
    }
    let result = TariWalletDetails {
        wallet_balance,
        tari_address_base58: tari_address.to_base58(),
        tari_address_emoji: tari_address.to_emoji_string(),
    };
    let mut lock = state.cached_wallet_details.write().await;
    *lock = Some(result.clone());
    state
        .is_getting_wallet_balance
        .store(false, Ordering::SeqCst);

    Ok(result)
}

#[tauri::command]
async fn get_app_config(
    _window: tauri::Window,
    state: tauri::State<'_, UniverseAppState>,
    _app: tauri::AppHandle,
) -> Result<AppConfig, String> {
    Ok(state.config.read().await.clone())
}

#[tauri::command]
async fn get_miner_metrics(
    state: tauri::State<'_, UniverseAppState>,
    app: tauri::AppHandle,
) -> Result<MinerMetrics, String> {
    let timer = Instant::now();
    if state.is_getting_miner_metrics.load(Ordering::SeqCst) {
        let read = state.cached_miner_metrics.read().await;
        if let Some(metrics) = &*read {
            warn!(target: LOG_TARGET, "Already getting miner metrics, returning cached value");
            return Ok(metrics.clone());
        }
        warn!(target: LOG_TARGET, "Already getting miner metrics");
        return Err("Already getting miner metrics".to_string());
    }
    state.is_getting_miner_metrics.store(true, Ordering::SeqCst);

    let mut cpu_miner = state.cpu_miner.write().await;
    let mut gpu_miner = state.gpu_miner.write().await;
    let (sha_hash_rate, randomx_hash_rate, block_reward, block_height, block_time, is_synced) =
        state
            .node_manager
            .get_network_hash_rate_and_block_reward()
            .await
            .unwrap_or_else(|e| {
                if !matches!(e, NodeManagerError::NodeNotStarted) {
                    warn!(target: LOG_TARGET, "Error getting network hash rate and block reward: {}", e);
                }
                (0, 0, MicroMinotari(0), 0, 0, false)
            });

    let cpu_mining_status = match cpu_miner
        .status(randomx_hash_rate, block_reward)
        .await
        .map_err(|e| e.to_string())
    {
        Ok(cpu) => cpu,
        Err(e) => {
            warn!(target: LOG_TARGET, "Error getting cpu miner status: {:?}", e);
            state
                .is_getting_miner_metrics
                .store(false, Ordering::SeqCst);
            return Err(e);
        }
    };

    let gpu_mining_status = match gpu_miner.status(sha_hash_rate, block_reward).await {
        Ok(gpu) => gpu,
        Err(e) => {
            warn!(target: LOG_TARGET, "Error getting gpu miner status: {:?}", e);
            state
                .is_getting_miner_metrics
                .store(false, Ordering::SeqCst);
            return Err(e.to_string());
        }
    };

    let hardware_status = HardwareMonitor::current()
        .write()
        .await
        .read_hardware_parameters();

    let new_systemtray_data: SystrayData = SystemtrayManager::current().create_systemtray_data(
        cpu_mining_status.hash_rate,
        gpu_mining_status.hash_rate as f64,
        hardware_status.clone(),
        cpu_mining_status.estimated_earnings as f64,
    );

    SystemtrayManager::current().update_systray(app, new_systemtray_data);

    let connected_peers = state
        .node_manager
        .list_connected_peers()
        .await
        .unwrap_or_default();

    if timer.elapsed() > MAX_ACCEPTABLE_COMMAND_TIME {
        warn!(target: LOG_TARGET, "get_miner_metrics took too long: {:?}", timer.elapsed());
    }

    let ret = MinerMetrics {
        cpu: CpuMinerMetrics {
            hardware: hardware_status.cpu,
            mining: cpu_mining_status,
        },
        gpu: GpuMinerMetrics {
            hardware: hardware_status.gpu,
            mining: gpu_mining_status,
        },
        base_node: BaseNodeStatus {
            block_height,
            block_time,
            is_synced,
            is_connected: !connected_peers.is_empty(),
            connected_peers,
        },
    };
    let mut lock = state.cached_miner_metrics.write().await;
    *lock = Some(ret.clone());

    state
        .is_getting_miner_metrics
        .store(false, Ordering::SeqCst);

    Ok(ret)
}

#[tauri::command]
fn log_web_message(level: String, message: Vec<String>, trace: Vec<String>) {
    match level.as_str() {
        "error" => {
            let joined_message = message.join(" ");
            let joined_stack = trace.join("\n");
            sentry::add_breadcrumb(sentry::Breadcrumb {
                message: Some(joined_stack.clone()),
                ..Default::default()
            });
            sentry::capture_event(Event {
                message: Some(joined_message.clone()),
                level: sentry::Level::Error,
                culprit: Some("universe-web".to_string()),
                ..Default::default()
            });

            error!(target: LOG_TARGET_WEB, "{}", joined_message)
        }
        _ => info!(target: LOG_TARGET_WEB, "{}", message.join(" ")),
    }
}

#[tauri::command]
async fn reset_settings<'r>(
    reset_wallet: bool,
    _window: tauri::Window,
    state: tauri::State<'_, UniverseAppState>,
    app: tauri::AppHandle,
) -> Result<(), String> {
    stop_all_miners(state.inner().clone(), 5).await?;
    let network = Network::get_current_or_user_setting_or_default().as_key_str();

    let app_config_dir = app.path_resolver().app_config_dir();
    let app_cache_dir = app.path_resolver().app_cache_dir();
    let app_data_dir = app.path_resolver().app_data_dir();
    let app_local_data_dir = app.path_resolver().app_local_data_dir();

    let dirs_to_remove = [
        app_config_dir,
        app_cache_dir,
        app_data_dir,
        app_local_data_dir,
    ];
    let valid_dir_paths: Vec<String> = dirs_to_remove
        .iter()
        .filter_map(|dir| {
            if let Some(path) = dir {
                path.to_str().map(|s| s.to_string())
            } else {
                None
            }
        })
        .collect();

    if valid_dir_paths.is_empty() {
        error!(target: LOG_TARGET, "Could not get app directories for {:?}", valid_dir_paths);
        return Err("Could not get app directories".to_string());
    }
    // Exclude EBWebView because it is still being used.
    let folder_block_list = vec!["EBWebView"];

    for dir_path in dirs_to_remove.iter().flatten() {
        if dir_path.exists() {
            for entry in read_dir(dir_path).map_err(|e| e.to_string())? {
                let entry = entry.map_err(|e| e.to_string())?;
                let path = entry.path();
                if path.is_dir() {
                    if let Some(file_name) = path.file_name().and_then(|name| name.to_str()) {
                        if folder_block_list.contains(&file_name) {
                            debug!(target: LOG_TARGET, "[reset_settings] Skipping {:?} directory", path);
                            continue;
                        }
                    }

                    let contains_wallet_config =
                        read_dir(&path)
                            .map_err(|e| e.to_string())?
                            .any(|inner_entry| {
                                inner_entry
                                    .map(|e| e.file_name() == "wallet_config.json")
                                    .unwrap_or(false)
                            });

                    let is_network_dir = path
                        .file_name()
                        .and_then(|name| name.to_str())
                        .map(|name| name == network)
                        .unwrap_or(false);

                    if !reset_wallet && contains_wallet_config {
                        debug!(target: LOG_TARGET, "[reset_settings] Skipping {:?} directory because it contains wallet_config.json and reset_wallet is false", path);
                        continue;
                    }
                    if reset_wallet && contains_wallet_config && !is_network_dir {
                        debug!(target: LOG_TARGET, "[reset_settings] Skipping {:?} directory because it contains wallet_config.json and does not matches network name", path);
                        continue;
                    }

                    debug!(target: LOG_TARGET, "[reset_settings] Removing {:?} directory", path);
                    remove_dir_all(path.clone()).map_err(|e| {
                        error!(target: LOG_TARGET, "[reset_settings] Could not remove {:?} directory: {:?}", path, e);
                        format!("Could not remove directory: {}", e)
                    })?;
                } else {
                    debug!(target: LOG_TARGET, "[reset_settings] Removing {:?} file", path);
                    remove_file(path.clone()).map_err(|e| {
                        error!(target: LOG_TARGET, "[reset_settings] Could not remove {:?} file: {:?}", path, e);
                        format!("Could not remove file: {}", e)
                    })?;
                }
            }
        }
    }
    info!(target: LOG_TARGET, "[reset_settings] Restarting the app");
    app.restart();

    Ok(())
}

#[derive(Debug, Serialize, Clone)]
pub struct CpuMinerMetrics {
    hardware: Option<HardwareParameters>,
    mining: CpuMinerStatus,
}

#[derive(Debug, Serialize, Clone)]
pub struct GpuMinerMetrics {
    hardware: Option<HardwareParameters>,
    mining: GpuMinerStatus,
}

#[derive(Debug, Serialize, Clone)]
pub struct MinerMetrics {
    cpu: CpuMinerMetrics,
    gpu: GpuMinerMetrics,
    base_node: BaseNodeStatus,
}

#[derive(Debug, Serialize, Clone)]
pub struct TariWalletDetails {
    wallet_balance: Option<WalletBalance>,
    tari_address_base58: String,
    tari_address_emoji: String,
}

#[derive(Debug, Serialize)]
pub struct ApplicationsVersions {
    tari_universe: String,
    xmrig: String,
    minotari_node: String,
    mm_proxy: String,
    wallet: String,
    sha_p2pool: String,
    xtrgpuminer: String,
}

#[derive(Debug, Serialize, Clone)]
pub struct BaseNodeStatus {
    block_height: u64,
    block_time: u64,
    is_synced: bool,
    is_connected: bool,
    connected_peers: Vec<String>,
}
#[derive(Debug, Serialize, Clone)]
pub struct CpuMinerStatus {
    pub is_mining: bool,
    pub hash_rate: f64,
    pub estimated_earnings: u64,
    pub connection: CpuMinerConnectionStatus,
}

#[derive(Debug, Serialize, Clone)]
pub struct CpuMinerConnectionStatus {
    pub is_connected: bool,
    // pub error: Option<String>,
}

pub enum CpuMinerConnection {
    BuiltInProxy,
}

struct CpuMinerConfig {
    node_connection: CpuMinerConnection,
    tari_address: TariAddress,
}

#[derive(Clone)]
struct UniverseAppState {
    is_getting_wallet_balance: Arc<AtomicBool>,
    is_getting_p2pool_stats: Arc<AtomicBool>,
    is_getting_miner_metrics: Arc<AtomicBool>,
    is_getting_transaction_history: Arc<AtomicBool>,
    is_setup_finished: Arc<RwLock<bool>>,
    config: Arc<RwLock<AppConfig>>,
    in_memory_config: Arc<RwLock<AppInMemoryConfig>>,
    shutdown: Shutdown,
    tari_address: Arc<RwLock<TariAddress>>,
    cpu_miner: Arc<RwLock<CpuMiner>>,
    gpu_miner: Arc<RwLock<GpuMiner>>,
    cpu_miner_config: Arc<RwLock<CpuMinerConfig>>,
    mm_proxy_manager: MmProxyManager,
    node_manager: NodeManager,
    wallet_manager: WalletManager,
    telemetry_manager: Arc<RwLock<TelemetryManager>>,
    feedback: Arc<RwLock<Feedback>>,
    airdrop_access_token: Arc<RwLock<Option<String>>>,
    p2pool_manager: P2poolManager,
    tor_manager: TorManager,
    cached_p2pool_stats: Arc<RwLock<Option<HashMap<String, Stats>>>>,
    cached_wallet_details: Arc<RwLock<Option<TariWalletDetails>>>,
    cached_miner_metrics: Arc<RwLock<Option<MinerMetrics>>>,
}

#[derive(Clone, serde::Serialize)]
struct Payload {
    args: Vec<String>,
    cwd: String,
}

#[allow(clippy::too_many_lines)]
fn main() {
    // TODO: Integrate sentry into logs. Because we are using Tari's logging infrastructure, log4rs
    // sets the logger and does not expose a way to add sentry into it.
    let client = sentry_tauri::sentry::init((
        "https://edd6b9c1494eb7fda6ee45590b80bcee@o4504839079002112.ingest.us.sentry.io/4507979991285760",
        sentry_tauri::sentry::ClientOptions {
            release: sentry_tauri::sentry::release_name!(),
            ..Default::default()
        },
    ));
    let _guard = sentry_tauri::minidump::init(&client);

    let mut shutdown = Shutdown::new();

    // NOTE: Nothing is started at this point, so ports are not known. You can only start settings ports
    // and addresses once the different services have been started.
    // A better way is to only provide the config when we start the service.
    let node_manager = NodeManager::new();
    let wallet_manager = WalletManager::new(node_manager.clone());
    let wallet_manager2 = wallet_manager.clone();
    let p2pool_manager = P2poolManager::new();

    let cpu_config = Arc::new(RwLock::new(CpuMinerConfig {
        node_connection: CpuMinerConnection::BuiltInProxy,
        tari_address: TariAddress::default(),
    }));

    let app_in_memory_config =
        Arc::new(RwLock::new(app_in_memory_config::AppInMemoryConfig::init()));

    let cpu_miner: Arc<RwLock<CpuMiner>> = Arc::new(CpuMiner::new().into());
    let gpu_miner: Arc<RwLock<GpuMiner>> = Arc::new(GpuMiner::new().into());

    let app_config_raw = AppConfig::new();
    let app_config = Arc::new(RwLock::new(app_config_raw.clone()));

    let telemetry_manager: TelemetryManager = TelemetryManager::new(
        node_manager.clone(),
        cpu_miner.clone(),
        gpu_miner.clone(),
        app_config.clone(),
        app_in_memory_config.clone(),
        Some(Network::default()),
        p2pool_manager.clone(),
    );

    let feedback = Feedback::new(app_in_memory_config.clone(), app_config.clone());
    // let mm_proxy_config = if app_config_raw.p2pool_enabled {
    //     MergeMiningProxyConfig::new_with_p2pool(mm_proxy_port, p2pool_config.grpc_port, None)
    // } else {
    //     MergeMiningProxyConfig::new(
    //         mm_proxy_port,
    //         p2pool_config.grpc_port,
    //         base_node_grpc_port,
    //         None,
    //     )
    // };
    let mm_proxy_manager = MmProxyManager::new();
    let app_state = UniverseAppState {
        is_getting_miner_metrics: Arc::new(AtomicBool::new(false)),
        is_getting_p2pool_stats: Arc::new(AtomicBool::new(false)),
        is_getting_wallet_balance: Arc::new(AtomicBool::new(false)),
        is_setup_finished: Arc::new(RwLock::new(false)),
        is_getting_transaction_history: Arc::new(AtomicBool::new(false)),
        config: app_config.clone(),
        in_memory_config: app_in_memory_config.clone(),
        shutdown: shutdown.clone(),
        tari_address: Arc::new(RwLock::new(TariAddress::default())),
        cpu_miner: cpu_miner.clone(),
        gpu_miner: gpu_miner.clone(),
        cpu_miner_config: cpu_config.clone(),
        mm_proxy_manager: mm_proxy_manager.clone(),
        node_manager,
        wallet_manager,
        p2pool_manager,
        telemetry_manager: Arc::new(RwLock::new(telemetry_manager)),
        feedback: Arc::new(RwLock::new(feedback)),
        airdrop_access_token: Arc::new(RwLock::new(None)),
        tor_manager: TorManager::new(),
        cached_p2pool_stats: Arc::new(RwLock::new(None)),
        cached_wallet_details: Arc::new(RwLock::new(None)),
        cached_miner_metrics: Arc::new(RwLock::new(None)),
    };

    let systray = SystemtrayManager::current().get_systray().clone();

    let app = tauri::Builder::default()
        .system_tray(systray)
        .on_system_tray_event(|app, event| {
            SystemtrayManager::current().handle_system_tray_event(app.clone(), event)
        })
        .plugin(tauri_plugin_single_instance::init(|app, argv, cwd| {
            println!("{}, {argv:?}, {cwd}", app.package_info().name);

            app.emit_all("single-instance", Payload { args: argv, cwd })
                .unwrap_or_else(
                    |e| error!(target: LOG_TARGET, "Could not emit single-instance event: {:?}", e),
                );
        }))
        .manage(app_state.clone())
        .setup(|app| {
            // TODO: Combine with sentry log
            tari_common::initialize_logging(
                &app.path_resolver()
                    .app_config_dir()
                    .expect("Could not get config dir")
                    .join("universe")
                    .join("log4rs_config_universe.yml"),
                &app.path_resolver()
                    .app_log_dir()
                    .expect("Could not get log dir"),
                include_str!("../log4rs_sample.yml"),
            )
            .expect("Could not set up logging");

            let config_path = app
                .path_resolver()
                .app_config_dir()
                .expect("Could not get config dir");
            let thread_config = tauri::async_runtime::spawn(async move {
                app_config.write().await.load_or_create(config_path).await
            });

            match tauri::async_runtime::block_on(thread_config) {
                Ok(_) => {}
                Err(e) => {
                    error!(target: LOG_TARGET, "Error setting up app state: {:?}", e);
                }
            };

            let config_path = app
                .path_resolver()
                .app_config_dir()
                .expect("Could not get config dir");
            let address = app.state::<UniverseAppState>().tari_address.clone();
            let thread = tauri::async_runtime::spawn(async move {
                match InternalWallet::load_or_create(config_path).await {
                    Ok(wallet) => {
                        cpu_config.write().await.tari_address = wallet.get_tari_address();
                        wallet_manager2
                            .set_view_private_key_and_spend_key(
                                wallet.get_view_key(),
                                wallet.get_spend_key(),
                            )
                            .await;
                        let mut lock = address.write().await;
                        *lock = wallet.get_tari_address();
                        Ok(())
                        //app.state::<UniverseAppState>().tari_address = wallet.get_tari_address();
                    }
                    Err(e) => {
                        error!(target: LOG_TARGET, "Error loading internal wallet: {:?}", e);
                        // TODO: If this errors, the application does not exit properly.
                        // So temporarily we are going to kill it here

                        Err(e)
                    }
                }
            });

            match tauri::async_runtime::block_on(thread).expect("Could not start task") {
                Ok(_) => {
                    // let mut lock = app.state::<UniverseAppState>().tari_address.write().await;
                    // *lock = address;
                    Ok(())
                }
                Err(e) => {
                    error!(target: LOG_TARGET, "Error setting up internal wallet: {:?}", e);
                    Err(e.into())
                }
            }
        })
        .invoke_handler(tauri::generate_handler![
            setup_application,
            start_mining,
            stop_mining,
            set_p2pool_enabled,
            set_mode,
            open_log_dir,
            get_seed_words,
            get_applications_versions,
            send_feedback,
            update_applications,
            log_web_message,
            set_allow_telemetry,
            set_airdrop_access_token,
            get_app_id,
            get_app_in_memory_config,
            set_monero_address,
            update_applications,
            reset_settings,
            set_gpu_mining_enabled,
            set_cpu_mining_enabled,
            restart_application,
            resolve_application_language,
            set_application_language,
            get_miner_metrics,
            get_app_config,
            get_p2pool_stats,
            get_tari_wallet_details,
            exit_application,
            set_should_always_use_system_language,
            download_and_start_installer,
            get_external_dependencies,
            set_use_tor,
            get_transaction_history
        ])
        .build(tauri::generate_context!())
        .inspect_err(
            |e| error!(target: LOG_TARGET, "Error while building tauri application: {:?}", e),
        )
        .expect("error while running tauri application");

    info!(
        target: LOG_TARGET,
        "Starting Tari Universe version: {}",
        app.package_info().version
    );

    let mut downloaded: u64 = 0;
    app.run(move |_app_handle, event| match event {
        tauri::RunEvent::Updater(updater_event) => match updater_event {
            UpdaterEvent::Error(e) => {
                error!(target: LOG_TARGET, "Updater error: {:?}", e);
            }
            UpdaterEvent::DownloadProgress { chunk_length, content_length } => {
                downloaded += chunk_length as u64;
                let content_length = content_length.unwrap_or_else(|| {
                    warn!(target: LOG_TARGET, "Unable to determine content length");
                    downloaded
                });

                info!(target: LOG_TARGET, "Chunk Length: {} | Download progress: {} / {}", chunk_length, downloaded, content_length);

                if let Some(window) = _app_handle.get_window("main") {
                    drop(window.emit("update-progress", UpdateProgressRustEvent { chunk_length, content_length, downloaded: downloaded.min(content_length) }).inspect_err(|e| error!(target: LOG_TARGET, "Could not emit event 'update-progress': {:?}", e))
                    );
                }
            }
            UpdaterEvent::Downloaded => {
                shutdown.trigger();
            }
            _ => {
                info!(target: LOG_TARGET, "Updater event: {:?}", updater_event);
            }
        },
        tauri::RunEvent::ExitRequested { api: _, .. } => {
            // api.prevent_exit();
            info!(target: LOG_TARGET, "App shutdown caught");
            let _unused = block_on(stop_all_miners(app_state.clone(), 2));
            info!(target: LOG_TARGET, "App shutdown complete");
        }
        tauri::RunEvent::Exit => {
            info!(target: LOG_TARGET, "App shutdown caught");
            let _unused = block_on(stop_all_miners(app_state.clone(), 2));
            info!(target: LOG_TARGET, "Tari Universe v{} shut down successfully", _app_handle.package_info().version);
        }
        RunEvent::MainEventsCleared => {
            // no need to handle
        }
        RunEvent::WindowEvent { label, event, .. } => {
            trace!(target: LOG_TARGET, "Window event: {:?} {:?}", label, event);
        }
        _ => {
            debug!(target: LOG_TARGET, "Unhandled event: {:?}", event);
        }
    });
}
