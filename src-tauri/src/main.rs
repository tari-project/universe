// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod app_config;
mod binary_resolver;
mod consts;
mod cpu_miner;
mod download_utils;
mod github;
mod gpu_miner;
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
mod systemtray_manager;
mod telemetry_manager;
mod user_listener;
mod wallet_adapter;
mod wallet_manager;
mod xmrig;
mod xmrig_adapter;

use crate::cpu_miner::CpuMiner;
use crate::gpu_miner::GpuMiner;
use crate::internal_wallet::InternalWallet;
use crate::mm_proxy_adapter::MergeMiningProxyConfig;
use crate::mm_proxy_manager::{MmProxyManager, StartConfig};
use crate::node_manager::NodeManager;
use crate::p2pool::models::Stats;
use crate::p2pool_manager::{P2poolConfig, P2poolManager};
use crate::user_listener::UserListener;
use crate::wallet_adapter::WalletBalance;
use crate::wallet_manager::WalletManager;
use crate::xmrig_adapter::XmrigAdapter;
use app_config::{AppConfig, MiningMode};
use binary_resolver::{Binaries, BinaryResolver};
use futures_lite::future::block_on;
use gpu_miner_adapter::GpuMinerStatus;
use hardware_monitor::{HardwareMonitor, HardwareStatus};
use log::{debug, error, info, warn};
use node_manager::NodeManagerError;
use progress_tracker::ProgressTracker;
use serde::Serialize;
use setup_status_event::SetupStatusEvent;
use std::collections::HashMap;
use std::fs::remove_dir_all;
use std::sync::Arc;
use std::thread::sleep;
use std::time::{Duration, SystemTime};
use std::{panic, process};
use systemtray_manager::{SystemtrayManager, SystrayData};
use tari_common::configuration::Network;
use tari_common_types::tari_address::TariAddress;
use tari_core::proof_of_work::PowAlgorithm;
use tari_core::transactions::tari_amount::MicroMinotari;
use tari_shutdown::Shutdown;
use tauri::{AboutMetadata, Manager, Menu, MenuItem, RunEvent, UpdaterEvent};
use telemetry_manager::TelemetryManager;
use tokio::runtime::Handle;
use tokio::sync::RwLock;
use wallet_manager::WalletManagerError;

mod gpu_miner_adapter;
mod progress_tracker;
mod setup_status_event;

#[tauri::command]
async fn set_mode<'r>(
    mode: String,
    state: tauri::State<'r, UniverseAppState>,
) -> Result<(), String> {
    let _ = state.config.write().await.set_mode(mode).await;
    Ok(())
}

#[tauri::command]
async fn set_telemetry_mode<'r>(
    telemetry_mode: bool,
    _window: tauri::Window,
    state: tauri::State<'r, UniverseAppState>,
    _app: tauri::AppHandle,
) -> Result<(), String> {
    let _ = state
        .config
        .write()
        .await
        .set_allow_telemetry(telemetry_mode)
        .await
        .map_err(|e| e.to_string());
    Ok(())
}

#[tauri::command]
async fn set_airdrop_access_token<'r>(
    token: String,
    _window: tauri::Window,
    state: tauri::State<'r, UniverseAppState>,
    _app: tauri::AppHandle,
) -> Result<(), String> {
    let mut write_lock = state.airdrop_access_token.write().await;
    *write_lock = Some(token);
    Ok(())
}

#[tauri::command]
async fn set_monero_address<'r>(
    monero_address: String,
    state: tauri::State<'r, UniverseAppState>,
) -> Result<(), String> {
    let mut cpu_miner_config = state.config.write().await;
    cpu_miner_config
        .set_monero_address(monero_address)
        .await
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
async fn setup_application<'r>(
    window: tauri::Window,
    state: tauri::State<'r, UniverseAppState>,
    app: tauri::AppHandle,
) -> Result<(), String> {
    setup_inner(window, state, app).await.map_err(|e| {
        warn!(target: LOG_TARGET, "Error setting up application: {:?}", e);
        e.to_string()
    })
}

async fn setup_inner<'r>(
    window: tauri::Window,
    state: tauri::State<'r, UniverseAppState>,
    app: tauri::AppHandle,
) -> Result<(), anyhow::Error> {
    let _ = window.emit(
        "message",
        SetupStatusEvent {
            event_type: "setup_status".to_string(),
            title: "starting-up".to_string(),
            title_params: None,
            progress: 0.0,
        },
    );
    let data_dir = app.path_resolver().app_local_data_dir().unwrap();
    let cache_dir = app.path_resolver().app_cache_dir().unwrap();
    let config_dir = app.path_resolver().app_config_dir().unwrap();
    let log_dir = app.path_resolver().app_log_dir().unwrap();

    let cpu_miner_config = state.cpu_miner_config.read().await;
    let mm_proxy_manager = state.mm_proxy_manager.clone();

    let progress = ProgressTracker::new(window.clone());

    let last_binaries_update_timestamp = state.config.read().await.last_binaries_update_timestamp;
    let now = SystemTime::now();

    state
        .telemetry_manager
        .write()
        .await
        .initialize(state.airdrop_access_token.clone())
        .await?;

    BinaryResolver::current()
        .read_current_highest_version(Binaries::MinotariNode, progress.clone())
        .await?;
    BinaryResolver::current()
        .read_current_highest_version(Binaries::MergeMiningProxy, progress.clone())
        .await?;
    BinaryResolver::current()
        .read_current_highest_version(Binaries::Wallet, progress.clone())
        .await?;
    BinaryResolver::current()
        .read_current_highest_version(Binaries::ShaP2pool, progress.clone())
        .await?;
    BinaryResolver::current()
        .read_current_highest_version(Binaries::GpuMiner, progress.clone())
        .await?;

    if now
        .duration_since(last_binaries_update_timestamp)
        .unwrap_or(Duration::from_secs(0))
        > Duration::from_secs(60 * 10)
    // 10 minutes
    {
        state
            .config
            .write()
            .await
            .set_last_binaries_update_timestamp(now)
            .await?;

        progress.set_max(10).await;
        progress
            .update("checking-latest-version-node".to_string(), None, 0)
            .await;
        BinaryResolver::current()
            .ensure_latest(Binaries::MinotariNode, progress.clone())
            .await?;
        sleep(Duration::from_secs(1));

        progress.set_max(15).await;
        progress
            .update("checking-latest-version-mmproxy".to_string(), None, 0)
            .await;
        sleep(Duration::from_secs(1));
        BinaryResolver::current()
            .ensure_latest(Binaries::MergeMiningProxy, progress.clone())
            .await?;
        progress.set_max(20).await;
        progress
            .update("checking-latest-version-wallet".to_string(), None, 0)
            .await;
        sleep(Duration::from_secs(1));
        BinaryResolver::current()
            .ensure_latest(Binaries::Wallet, progress.clone())
            .await?;

        sleep(Duration::from_secs(1));
        progress.set_max(25).await;
        progress
            .update(
                "Checking for latest version of gpu miner".to_string(),
                None,
                0,
            )
            .await;
        BinaryResolver::current()
            .ensure_latest(Binaries::GpuMiner, progress.clone())
            .await?;

        progress.set_max(30).await;
        progress
            .update("checking-latest-version-xmrig".to_string(), None, 0)
            .await;
        sleep(Duration::from_secs(1));
        XmrigAdapter::ensure_latest(cache_dir, false, progress.clone()).await?;

        progress.set_max(35).await;
        progress
            .update("checking-latest-version-sha-p2pool".to_string(), None, 0)
            .await;
        sleep(Duration::from_secs(1));
        BinaryResolver::current()
            .ensure_latest(Binaries::ShaP2pool, progress.clone())
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

    progress.set_max(85).await;
    progress
        .update("starting-p2pool".to_string(), None, 0)
        .await;
    state
        .p2pool_manager
        .ensure_started(state.shutdown.to_signal(), data_dir, config_dir, log_dir)
        .await?;

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

    mm_proxy_manager
        .start(StartConfig::new(
            state.shutdown.to_signal().clone(),
            app.path_resolver().app_local_data_dir().unwrap().clone(),
            app.path_resolver().app_config_dir().unwrap().clone(),
            app.path_resolver().app_log_dir().unwrap().clone(),
            cpu_miner_config.tari_address.clone(),
            base_node_grpc_port,
            telemetry_id,
        ))
        .await?;
    mm_proxy_manager.wait_ready().await?;

    _ = window.emit(
        "message",
        SetupStatusEvent {
            event_type: "setup_status".to_string(),
            title: "application-started".to_string(),
            title_params: None,
            progress: 1.0,
        },
    );

    Ok(())
}

#[tauri::command]
async fn set_p2pool_enabled<'r>(
    p2pool_enabled: bool,
    state: tauri::State<'r, UniverseAppState>,
) -> Result<(), String> {
    let _ = state
        .config
        .write()
        .await
        .set_p2pool_enabled(p2pool_enabled)
        .await;

    let origin_config = state.mm_proxy_manager.config().await;
    let p2pool_config = state.p2pool_manager.config();
    if origin_config.p2pool_enabled != p2pool_enabled {
        let config = if p2pool_enabled {
            MergeMiningProxyConfig::new_with_p2pool(
                origin_config.port,
                p2pool_config.grpc_port,
                None,
            )
        } else {
            let base_node_grpc_port = state
                .node_manager
                .get_grpc_port()
                .await
                .map_err(|error| error.to_string())?;
            MergeMiningProxyConfig::new(origin_config.port, base_node_grpc_port, None)
        };
        state
            .mm_proxy_manager
            .change_config(config)
            .await
            .map_err(|error| error.to_string())?;
    }

    Ok(())
}

#[tauri::command]
async fn set_cpu_mining_enabled<'r>(
    enabled: bool,
    state: tauri::State<'r, UniverseAppState>,
) -> Result<(), String> {
    let mut config = state.config.write().await;
    let _ = config.set_cpu_mining_enabled(enabled).await;
    Ok(())
}

#[tauri::command]
async fn set_gpu_mining_enabled<'r>(
    enabled: bool,
    state: tauri::State<'r, UniverseAppState>,
) -> Result<(), String> {
    let mut config = state.config.write().await;
    let _ = config.set_gpu_mining_enabled(enabled).await;
    Ok(())
}

#[tauri::command]
async fn get_seed_words<'r>(
    _window: tauri::Window,
    _state: tauri::State<'r, UniverseAppState>,
    app: tauri::AppHandle,
) -> Result<Vec<String>, String> {
    let config_path = app.path_resolver().app_config_dir().unwrap();
    let internal_wallet = InternalWallet::load_or_create(config_path)
        .await
        .map_err(|e| e.to_string())?;
    let seed_words = internal_wallet
        .decrypt_seed_words()
        .map_err(|e| e.to_string())?;
    let mut res = vec![];
    for i in 0..seed_words.len() {
        res.push(seed_words.get_word(i).unwrap().clone());
    }
    Ok(res)
}

#[tauri::command]
async fn start_mining<'r>(
    window: tauri::Window,
    state: tauri::State<'r, UniverseAppState>,
    app: tauri::AppHandle,
) -> Result<(), String> {
    let config = state.config.read().await;
    let cpu_mining_enabled = config.cpu_mining_enabled;
    let gpu_mining_enabled = config.gpu_mining_enabled;
    let mode = config.mode;

    let cpu_miner_config = state.cpu_miner_config.read().await;
    let monero_address = state.config.read().await.monero_address.clone();
    let progress_tracker = ProgressTracker::new(window.clone());
    if cpu_mining_enabled {
        let res = state
            .cpu_miner
            .write()
            .await
            .start(
                state.shutdown.to_signal(),
                &cpu_miner_config,
                monero_address,
                app.path_resolver().app_local_data_dir().unwrap(),
                app.path_resolver().app_cache_dir().unwrap(),
                app.path_resolver().app_config_dir().unwrap(),
                app.path_resolver().app_log_dir().unwrap(),
                progress_tracker,
                mode,
            )
            .await;

        if let Err(e) = res {
            error!(target: LOG_TARGET, "Could not start mining: {:?}", e);
            let _ = state.cpu_miner.write().await.stop().await;
            return Err(e.to_string());
        }
    }

    if gpu_mining_enabled {
        let tari_address = state.cpu_miner_config.read().await.tari_address.clone();
        let grpc_port = state
            .node_manager
            .get_grpc_port()
            .await
            .map_err(|e| e.to_string())?;

        let res = state
            .gpu_miner
            .write()
            .await
            .start(
                state.shutdown.to_signal(),
                tari_address,
                grpc_port,
                config.p2pool_enabled,
                app.path_resolver().app_local_data_dir().unwrap(),
                app.path_resolver().app_config_dir().unwrap(),
                app.path_resolver().app_log_dir().unwrap(),
                mode,
            )
            .await;

        if let Err(e) = res {
            error!(target: LOG_TARGET, "Could not start gpu mining: {:?}", e);
            let _ = state.cpu_miner.write().await.stop().await;
            return Err(e.to_string());
        }
    }
    Ok(())
}

#[tauri::command]
async fn stop_mining<'r>(state: tauri::State<'r, UniverseAppState>) -> Result<(), String> {
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
    // stop the mmproxy. TODO: change it so that the cpu miner stops this dependency.
    // state
    //     .mm_proxy_manager
    //     .stop()
    //     .await
    //     .map_err(|e| e.to_string())?;

    // state.node_manager.stop().await.map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn open_log_dir(app: tauri::AppHandle) {
    let log_dir = app.path_resolver().app_log_dir().unwrap();
    if let Err(e) = open::that(log_dir) {
        error!(target: LOG_TARGET, "Could not open log dir: {:?}", e);
    }
}

#[tauri::command]
async fn get_applications_versions(app: tauri::AppHandle) -> Result<ApplicationsVersions, String> {
    //TODO could be move to status command when XmrigAdapter will be implemented in BinaryResolver

    let default_message = "Failed to read version".to_string();

    let progress_tracker = ProgressTracker::new(app.get_window("main").unwrap().clone());

    let cache_dir = app.path_resolver().app_cache_dir().unwrap();

    let tari_universe_version = app.package_info().version.clone();
    let xmrig_version: String =
        XmrigAdapter::ensure_latest(cache_dir, false, progress_tracker.clone())
            .await
            .unwrap_or(default_message.clone());

    let minotari_node_version: semver::Version = BinaryResolver::current()
        .get_latest_version(Binaries::MinotariNode)
        .await;
    let mm_proxy_version: semver::Version = BinaryResolver::current()
        .get_latest_version(Binaries::MergeMiningProxy)
        .await;
    let wallet_version: semver::Version = BinaryResolver::current()
        .get_latest_version(Binaries::Wallet)
        .await;
    let sha_p2pool_version: semver::Version = BinaryResolver::current()
        .get_latest_version(Binaries::ShaP2pool)
        .await;

    Ok(ApplicationsVersions {
        tari_universe: tari_universe_version.to_string(),
        xmrig: xmrig_version,
        minotari_node: minotari_node_version.to_string(),
        mm_proxy: mm_proxy_version.to_string(),
        wallet: wallet_version.to_string(),
        sha_p2pool: sha_p2pool_version.to_string(),
    })
}

#[tauri::command]
async fn update_applications(
    app: tauri::AppHandle,
    state: tauri::State<'_, UniverseAppState>,
) -> Result<(), String> {
    let _ = state
        .config
        .write()
        .await
        .set_last_binaries_update_timestamp(SystemTime::now())
        .await;
    let progress_tracker = ProgressTracker::new(app.get_window("main").unwrap().clone());
    let cache_dir = app.path_resolver().app_cache_dir().unwrap();
    XmrigAdapter::ensure_latest(cache_dir, true, progress_tracker.clone())
        .await
        .map_err(|e| e.to_string())?;
    sleep(Duration::from_secs(1));
    BinaryResolver::current()
        .ensure_latest(Binaries::MinotariNode, progress_tracker.clone())
        .await
        .map_err(|e| e.to_string())?;
    sleep(Duration::from_secs(1));
    BinaryResolver::current()
        .ensure_latest(Binaries::MergeMiningProxy, progress_tracker.clone())
        .await
        .map_err(|e| e.to_string())?;
    sleep(Duration::from_secs(1));
    BinaryResolver::current()
        .ensure_latest(Binaries::Wallet, progress_tracker.clone())
        .await
        .map_err(|e| e.to_string())?;
    sleep(Duration::from_secs(1));
    BinaryResolver::current()
        .ensure_latest(Binaries::GpuMiner, progress_tracker.clone())
        .await
        .map_err(|e| e.to_string())?;
    sleep(Duration::from_secs(1));
    Ok(())
}

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command]
async fn status(
    state: tauri::State<'_, UniverseAppState>,
    app: tauri::AppHandle,
) -> Result<AppStatus, String> {
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

    let cpu = match cpu_miner
        .status(randomx_hash_rate, block_reward)
        .await
        .map_err(|e| e.to_string())
    {
        Ok(cpu) => cpu,
        Err(e) => {
            warn!(target: LOG_TARGET, "Error getting cpu miner status: {:?}", e);
            return Err(e);
        }
    };

    let gpu_status = match gpu_miner.status(sha_hash_rate, block_reward).await {
        Ok(gpu) => gpu,
        Err(e) => {
            warn!(target: LOG_TARGET, "Error getting gpu miner status: {:?}", e);
            return Err(e.to_string());
        }
    };

    let wallet_balance = match state.wallet_manager.get_balance().await {
        Ok(w) => w,
        Err(e) => {
            if matches!(e, WalletManagerError::WalletNotStarted) {
                WalletBalance {
                    available_balance: MicroMinotari(0),
                    pending_incoming_balance: MicroMinotari(0),
                    pending_outgoing_balance: MicroMinotari(0),
                    timelocked_balance: MicroMinotari(0),
                }
            } else {
                warn!(target: LOG_TARGET, "Error getting wallet balance: {}", e);
                WalletBalance {
                    available_balance: MicroMinotari(0),
                    pending_incoming_balance: MicroMinotari(0),
                    pending_outgoing_balance: MicroMinotari(0),
                    timelocked_balance: MicroMinotari(0),
                }
            }
        }
    };

    let hardware_status = HardwareMonitor::current()
        .write()
        .await
        .read_hardware_parameters();

    let mut p2pool_stats = HashMap::with_capacity(2);
    p2pool_stats.insert(
        PowAlgorithm::Sha3x.to_string().to_lowercase(),
        Stats::default(),
    );
    p2pool_stats.insert(
        PowAlgorithm::RandomX.to_string().to_lowercase(),
        Stats::default(),
    );

    let config_guard = state.config.read().await;

    let new_systemtray_data: SystrayData = SystemtrayManager::current().create_systemtray_data(
        cpu.hash_rate,
        0.0,
        hardware_status.clone(),
        cpu.estimated_earnings as f64,
    );

    SystemtrayManager::current().update_systray(app, new_systemtray_data);

    Ok(AppStatus {
        cpu,
        gpu: gpu_status,
        hardware_status: hardware_status.clone(),
        base_node: BaseNodeStatus {
            block_height,
            block_time,
            is_synced,
        },
        wallet_balance,
        mode: config_guard.mode.clone(),
        p2pool_enabled: config_guard.p2pool_enabled,
        p2pool_stats,
        auto_mining: config_guard.auto_mining,
        monero_address: config_guard.monero_address.clone(),
        cpu_mining_enabled: config_guard.cpu_mining_enabled,
        gpu_mining_enabled: config_guard.gpu_mining_enabled,
    })
}

#[tauri::command]
fn log_web_message(level: String, message: Vec<String>) {
    match level.as_str() {
        "error" => error!(target: LOG_TARGET_WEB, "{}", message.join(" ")),
        _ => info!(target: LOG_TARGET_WEB, "{}", message.join(" ")),
    }
}

#[tauri::command]
async fn reset_settings<'r>(
    _window: tauri::Window,
    state: tauri::State<'r, UniverseAppState>,
    app: tauri::AppHandle,
) -> Result<(), String> {
    state.shutdown.clone().trigger();
    // TODO: Find a better way of knowing that all miners have stopped
    sleep(std::time::Duration::from_secs(5));

    let app_config_dir = app.path_resolver().app_config_dir();
    let app_cache_dir = app.path_resolver().app_cache_dir();
    let app_data_dir = app.path_resolver().app_data_dir();
    let app_local_data_dir = app.path_resolver().app_local_data_dir();

    let dirs_to_remove = vec![
        app_config_dir,
        app_cache_dir,
        app_data_dir,
        app_local_data_dir,
    ];
    let missing_dirs: Vec<String> = dirs_to_remove
        .iter()
        .filter(|dir| dir.is_none())
        .map(|dir| dir.clone().unwrap().to_str().unwrap().to_string())
        .collect();

    if missing_dirs.clone().len() > 0 {
        error!("Could not get app directories for {:?}", missing_dirs);
        return Err("Could not get app directories".to_string());
    }

    dirs_to_remove.iter().for_each(|dir| {
        // check if dir exists
        if dir.clone().unwrap().exists() {
            info!(target: LOG_TARGET, "[reset_settings] Removing {:?} directory", dir);
            remove_dir_all(dir.clone().unwrap()).unwrap();
        }
    });

    info!(target: LOG_TARGET, "[reset_settings] Restarting the app");
    app.restart();

    Ok(())
}

#[derive(Debug, Serialize)]
pub struct AppStatus {
    cpu: CpuMinerStatus,
    gpu: GpuMinerStatus,
    hardware_status: HardwareStatus,
    base_node: BaseNodeStatus,
    wallet_balance: WalletBalance,
    mode: MiningMode,
    auto_mining: bool,
    p2pool_enabled: bool,
    p2pool_stats: HashMap<String, Stats>,
    monero_address: String,
    cpu_mining_enabled: bool,
    gpu_mining_enabled: bool,
}

#[derive(Debug, Serialize)]
pub struct ApplicationsVersions {
    tari_universe: String,
    xmrig: String,
    minotari_node: String,
    mm_proxy: String,
    wallet: String,
    sha_p2pool: String,
}

#[derive(Debug, Serialize)]
pub struct BaseNodeStatus {
    block_height: u64,
    block_time: u64,
    is_synced: bool,
}
#[derive(Debug, Serialize)]
pub struct CpuMinerStatus {
    pub is_mining: bool,
    pub hash_rate: f64,
    pub estimated_earnings: u64,
    pub connection: CpuMinerConnectionStatus,
}

#[derive(Debug, Serialize)]
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

struct UniverseAppState {
    config: Arc<RwLock<AppConfig>>,
    shutdown: Shutdown,
    cpu_miner: Arc<RwLock<CpuMiner>>,
    gpu_miner: Arc<RwLock<GpuMiner>>,
    cpu_miner_config: Arc<RwLock<CpuMinerConfig>>,
    user_listener: Arc<RwLock<UserListener>>,
    mm_proxy_manager: MmProxyManager,
    node_manager: NodeManager,
    wallet_manager: WalletManager,
    telemetry_manager: Arc<RwLock<TelemetryManager>>,
    airdrop_access_token: Arc<RwLock<Option<String>>>,
    p2pool_manager: P2poolManager,
}

#[derive(Clone, serde::Serialize)]
struct Payload {
    args: Vec<String>,
    cwd: String,
}

pub const LOG_TARGET: &str = "tari::universe::main";
pub const LOG_TARGET_WEB: &str = "tari::universe::web";

fn main() {
    let default_hook = panic::take_hook();
    panic::set_hook(Box::new(move |info| {
        default_hook(info);
        process::exit(1);
    }));
    let mut shutdown = Shutdown::new();

    let node_manager = NodeManager::new();
    let base_node_grpc_port = block_on(node_manager.get_grpc_port()).unwrap();
    let wallet_manager = WalletManager::new(node_manager.clone());
    let wallet_manager2 = wallet_manager.clone();
    let p2pool_config = Arc::new(
        P2poolConfig::builder()
            .with_base_node_address(format!("http://127.0.0.1:{base_node_grpc_port}"))
            .build(),
    );
    let p2pool_manager = P2poolManager::new(p2pool_config.clone());

    let cpu_config = Arc::new(RwLock::new(CpuMinerConfig {
        node_connection: CpuMinerConnection::BuiltInProxy,
        tari_address: TariAddress::default(),
    }));

    let app_config = Arc::new(RwLock::new(AppConfig::new()));

    let cpu_miner: Arc<RwLock<CpuMiner>> = Arc::new(CpuMiner::new().into());
    let gpu_miner: Arc<RwLock<GpuMiner>> = Arc::new(GpuMiner::new(p2pool_config.clone()).into());

    let telemetry_manager: TelemetryManager = TelemetryManager::new(
        node_manager.clone(),
        cpu_miner.clone(),
        gpu_miner.clone(),
        app_config.clone(),
        Some(Network::default()),
    );

    let app_config_raw = AppConfig::new();
    let app_config = Arc::new(RwLock::new(app_config_raw.clone()));
    let mm_proxy_port = 18081u16;
    let mm_proxy_config = if app_config_raw.p2pool_enabled {
        MergeMiningProxyConfig::new_with_p2pool(mm_proxy_port, p2pool_config.grpc_port, None)
    } else {
        MergeMiningProxyConfig::new(mm_proxy_port, base_node_grpc_port, None)
    };
    let mm_proxy_manager = MmProxyManager::new(mm_proxy_config);
    let app_state = UniverseAppState {
        config: app_config.clone(),
        shutdown: shutdown.clone(),
        cpu_miner: cpu_miner.clone(),
        gpu_miner: gpu_miner.clone(),
        cpu_miner_config: cpu_config.clone(),
        user_listener: Arc::new(RwLock::new(UserListener::new())),
        mm_proxy_manager: mm_proxy_manager.clone(),
        node_manager,
        wallet_manager,
        p2pool_manager,
        telemetry_manager: Arc::new(RwLock::new(telemetry_manager)),
        airdrop_access_token: Arc::new(RwLock::new(None)),
    };

    let systray = SystemtrayManager::current().get_systray().clone();
    let mut metadata = AboutMetadata::new();
    metadata.version = Some("Tari Labs".to_string());
    metadata.authors = Some(vec!["Tari Labs".to_string()]);
    metadata.license = Some("Tari Labs".to_string());
    metadata.comments = Some("Tari Labs".to_string());
    metadata.website = Some("Tari Labs".to_string());
    metadata.copyright = Some("Tari Labs".to_string());
    metadata.website_label = Some("Tari Labs".to_string());
    let menu_item = MenuItem::About("Tari Universe".to_string(), metadata);
    let menu = Menu::new().add_native_item(menu_item);

    let app = tauri::Builder::default()
        .menu(menu)
        .system_tray(systray)
        .plugin(tauri_plugin_single_instance::init(|app, argv, cwd| {
            println!("{}, {argv:?}, {cwd}", app.package_info().name);

            app.emit_all("single-instance", Payload { args: argv, cwd })
                .unwrap();
        }))
        .manage(app_state)
        .setup(|app| {
            tari_common::initialize_logging(
                &app.path_resolver()
                    .app_config_dir()
                    .unwrap()
                    .join("log4rs_config.yml"),
                &app.path_resolver().app_log_dir().unwrap(),
                include_str!("../log4rs_sample.yml"),
            )
            .expect("Could not set up logging");

            let config_path = app.path_resolver().app_config_dir().unwrap();
            let thread_config = tauri::async_runtime::spawn(async move {
                app_config.write().await.load_or_create(config_path).await
            });

            match tauri::async_runtime::block_on(thread_config).unwrap() {
                Ok(_) => {}
                Err(e) => {
                    error!(target: LOG_TARGET, "Error setting up app state: {:?}", e);
                }
            };

            let config_path = app.path_resolver().app_config_dir().unwrap();
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
                    }
                    Err(e) => {
                        error!(target: LOG_TARGET, "Error loading internal wallet: {:?}", e);
                        // TODO: If this errors, the application does not exit properly.
                        // So temporarily we are going to kill it here

                        return Err(e);
                    }
                }
                Ok(())
            });
            // let mut metadata = AboutMetadata::new();
            // metadata.version= Some("Tari Labs".to_string());
            // metadata.authors= Some(vec!["Tari Labs".to_string()]);
            // metadata.license= Some("Tari Labs".to_string());
            // metadata.comments=Some("Tari Labs".to_string());
            // metadata.website= Some("Tari Labs".to_string());
            // metadata.copyright= Some("Tari Labs".to_string());
            // metadata.website_label= Some("Tari Labs".to_string());
            // let menu = MenuItem::About("Tari Universe".to_string(), metadata);

            match tauri::async_runtime::block_on(thread).unwrap() {
                Ok(_) => Ok(()),
                Err(e) => {
                    error!(target: LOG_TARGET, "Error setting up internal wallet: {:?}", e);
                    Err(e.into())
                }
            }
        })
        .invoke_handler(tauri::generate_handler![
            setup_application,
            status,
            start_mining,
            stop_mining,
            set_p2pool_enabled,
            set_mode,
            open_log_dir,
            get_seed_words,
            get_applications_versions,
            update_applications,
            log_web_message,
            set_telemetry_mode,
            set_airdrop_access_token,
            set_monero_address,
            update_applications,
            reset_settings,
            set_gpu_mining_enabled,
            set_cpu_mining_enabled
        ])
        .build(tauri::generate_context!())
        .expect("error while running tauri application");

    info!(
        target: LOG_TARGET,
        "Starting Tari Universe version: {}",
        app.package_info().version
    );

    println!(
        "Logs stored at {:?}",
        app.path_resolver().app_log_dir().unwrap()
    );

    app.run(move |_app_handle, event| match event {
        tauri::RunEvent::Updater(updater_event) => match updater_event {
            UpdaterEvent::Error(e) => {
                error!(target: LOG_TARGET, "Updater error: {:?}", e);
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
            shutdown.trigger();
            // TODO: Find a better way of knowing that all miners have stopped
            sleep(std::time::Duration::from_secs(5));
            info!(target: LOG_TARGET, "App shutdown complete");
        }
        tauri::RunEvent::Exit => {
            info!(target: LOG_TARGET, "Tari Universe v{} shut down successfully", _app_handle.package_info().version);
        }
        RunEvent::MainEventsCleared => {
            // no need to handle
        }

        _ => {
            debug!(target: LOG_TARGET, "Unhandled event: {:?}", event);
        }
    });
}
