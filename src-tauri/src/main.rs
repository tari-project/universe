// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod analytics;
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
mod process_adapter;
mod process_killer;
mod process_utils;
mod process_watcher;
mod user_listener;
mod wallet_adapter;
mod wallet_manager;
mod xmrig;
mod xmrig_adapter;

use crate::cpu_miner::CpuMiner;
use crate::gpu_miner::GpuMiner;
use crate::internal_wallet::InternalWallet;
use crate::mm_proxy_manager::MmProxyManager;
use crate::node_manager::NodeManager;
use crate::user_listener::UserListener;
use crate::wallet_adapter::WalletBalance;
use crate::wallet_manager::WalletManager;
use crate::xmrig_adapter::XmrigAdapter;
use analytics::AnalyticsManager;
use app_config::{AppConfig, MiningMode};
use binary_resolver::{Binaries, BinaryResolver};
use hardware_monitor::{HardwareMonitor, HardwareStatus};
use log::{debug, error, info, warn};
use node_manager::NodeManagerError;
use progress_tracker::ProgressTracker;
use serde::Serialize;
use setup_status_event::SetupStatusEvent;
use std::sync::Arc;
use std::thread::sleep;
use std::time::{Duration, SystemTime};
use std::{panic, process};
use tari_common_types::tari_address::TariAddress;
use tari_core::transactions::tari_amount::MicroMinotari;
use tari_shutdown::Shutdown;
use tauri::{Manager, RunEvent, UpdaterEvent};
use tokio::sync::RwLock;
use wallet_manager::WalletManagerError;

mod progress_tracker;
mod setup_status_event;

#[tauri::command]
async fn set_mode<'r>(
    mode: String,
    window: tauri::Window,
    state: tauri::State<'r, UniverseAppState>,
    app: tauri::AppHandle,
) -> Result<(), String> {
    match stop_mining(state.clone()).await {
        Ok(_) => {
            let _ = state.config.write().await.set_mode(mode).await;
            match start_mining(window, state.clone(), app).await {
                Ok(_) => {}
                Err(e) => warn!(target: LOG_TARGET, "Failed to start mining: {}", e.to_string()),
            };
        }
        Err(e) => warn!(target: LOG_TARGET, "Failed to stop mining: {}", e.to_string()),
    };

    Ok(())
}

#[tauri::command]
async fn set_user_inactivity_timeout<'r>(
    timeout: u64,
    _window: tauri::Window,
    state: tauri::State<'r, UniverseAppState>,
    _app: tauri::AppHandle,
) -> Result<(), String> {
    let _ = state
        .config
        .write()
        .await
        .set_user_inactivity_timeout(Duration::from_secs(timeout))
        .await;

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
            title: "Starting up".to_string(),
            progress: 0.0,
        },
    );
    let data_dir = app.path_resolver().app_local_data_dir().unwrap();
    let log_dir = app.path_resolver().app_log_dir().unwrap();
    let cache_dir = app.path_resolver().app_cache_dir().unwrap();

    let cpu_miner_config = state.cpu_miner_config.read().await;
    let mm_proxy_manager = state.mm_proxy_manager.clone();

    let progress = ProgressTracker::new(window.clone());

    let last_binaries_update_timestamp = state.config.read().await.last_binaries_update_timestamp;
    let now = SystemTime::now();

    BinaryResolver::current()
        .read_current_highest_version(Binaries::MinotariNode, progress.clone())
        .await?;
    BinaryResolver::current()
        .read_current_highest_version(Binaries::MergeMiningProxy, progress.clone())
        .await?;
    BinaryResolver::current()
        .read_current_highest_version(Binaries::Wallet, progress.clone())
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
            .update("Checking for latest version of node".to_string(), 0)
            .await;
        BinaryResolver::current()
            .ensure_latest(Binaries::MinotariNode, progress.clone())
            .await?;
        sleep(Duration::from_secs(1));

        progress.set_max(15).await;
        progress
            .update("Checking for latest version of mmproxy".to_string(), 0)
            .await;
        sleep(Duration::from_secs(1));
        BinaryResolver::current()
            .ensure_latest(Binaries::MergeMiningProxy, progress.clone())
            .await?;
        progress.set_max(20).await;
        progress
            .update("Checking for latest version of wallet".to_string(), 0)
            .await;
        sleep(Duration::from_secs(1));
        BinaryResolver::current()
            .ensure_latest(Binaries::Wallet, progress.clone())
            .await?;

        progress.set_max(30).await;
        progress
            .update("Checking for latest version of xmrig".to_string(), 0)
            .await;
        sleep(Duration::from_secs(1));
        XmrigAdapter::ensure_latest(cache_dir, false, progress.clone()).await?;
    }

    for _i in 0..2 {
        match state
            .node_manager
            .ensure_started(
                state.shutdown.to_signal(),
                data_dir.clone(),
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
    progress.update("Waiting for wallet".to_string(), 0).await;
    state
        .wallet_manager
        .ensure_started(state.shutdown.to_signal(), data_dir, log_dir)
        .await?;

    progress.set_max(55).await;
    progress
        .update("Waiting for node to sync".to_string(), 0)
        .await;
    state.node_manager.wait_synced(progress.clone()).await?;

    progress.set_max(75).await;
    progress
        .update("Starting merge mining proxy".to_string(), 0)
        .await;

    let base_node_grpc_port = state.node_manager.get_grpc_port().await?;

    let mut analytics_id = state.analytics_manager.get_unique_string().await;
    if analytics_id.is_empty() {
        analytics_id = "unknown_miner_tari_universe".to_string();
    }
    mm_proxy_manager
        .start(
            state.shutdown.to_signal().clone(),
            app.path_resolver().app_local_data_dir().unwrap().clone(),
            app.path_resolver().app_log_dir().unwrap().clone(),
            cpu_miner_config.tari_address.clone(),
            base_node_grpc_port,
            analytics_id,
        )
        .await?;
    mm_proxy_manager.wait_ready().await?;

    _ = window.emit(
        "message",
        SetupStatusEvent {
            event_type: "setup_status".to_string(),
            title: "Applications started".to_string(),
            progress: 1.0,
        },
    );

    Ok(())
}

#[tauri::command]
async fn set_auto_mining<'r>(
    auto_mining: bool,
    window: tauri::Window,
    state: tauri::State<'r, UniverseAppState>,
) -> Result<(), String> {
    let mut config = state.config.write().await;
    let _ = config.set_auto_mining(auto_mining).await;
    let timeout = config.get_user_inactivity_timeout();
    let mut user_listener = state.user_listener.write().await;

    if auto_mining {
        user_listener.start_listening_to_mouse_poisition_change(timeout, window);
    } else {
        user_listener.stop_listening_to_mouse_poisition_change();
    }

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
    let config = state.cpu_miner_config.read().await;
    let progress_tracker = ProgressTracker::new(window.clone());
    state
        .cpu_miner
        .write()
        .await
        .start(
            state.shutdown.to_signal(),
            &config,
            app.path_resolver().app_local_data_dir().unwrap(),
            app.path_resolver().app_cache_dir().unwrap(),
            app.path_resolver().app_log_dir().unwrap(),
            progress_tracker,
            state.config.read().await.get_mode(),
        )
        .await
        .map_err(|e| {
            dbg!(e.to_string());
            e.to_string()
        })?;
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

    Ok(ApplicationsVersions {
        xmrig: xmrig_version,
        minotari_node: minotari_node_version.to_string(),
        mm_proxy: mm_proxy_version.to_string(),
        wallet: wallet_version.to_string(),
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
    Ok(())
}

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command]
async fn status(state: tauri::State<'_, UniverseAppState>) -> Result<AppStatus, String> {
    let mut cpu_miner = state.cpu_miner.write().await;
    let gpu_miner = state.gpu_miner.write().await;
    let (_sha_hash_rate, randomx_hash_rate, block_reward, block_height, block_time, is_synced) =
        state
            .node_manager
            .get_network_hash_rate_and_block_reward()
            .await
            .unwrap_or_else(|e| {
                warn!(target: LOG_TARGET, "Error getting network hash rate and block reward: {}", e);
                (0, 0, MicroMinotari(0), 0, 0, false)
            });

    info!(target: LOG_TARGET, "Network hash rate: {}", randomx_hash_rate);

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

    let config_guard = state.config.read().await;

    Ok(AppStatus {
        cpu,
        hardware_status,
        base_node: BaseNodeStatus {
            block_height,
            block_time,
            is_synced,
        },
        wallet_balance,
        mode: config_guard.mode.clone(),
        auto_mining: config_guard.auto_mining,
        user_inactivity_timeout: config_guard.user_inactivity_timeout.as_secs(),
    })
}

#[derive(Debug, Serialize)]
pub struct AppStatus {
    cpu: CpuMinerStatus,
    hardware_status: HardwareStatus,
    base_node: BaseNodeStatus,
    wallet_balance: WalletBalance,
    mode: MiningMode,
    auto_mining: bool,
    user_inactivity_timeout: u64,
}

#[derive(Debug, Serialize)]
pub struct ApplicationsVersions {
    xmrig: String,
    minotari_node: String,
    mm_proxy: String,
    wallet: String,
}

#[derive(Debug, Serialize)]
pub struct BaseNodeStatus {
    block_height: u64,
    block_time: u64,
    is_synced: bool,
}
#[derive(Debug, Serialize)]
pub struct CpuMinerStatus {
    pub is_mining_enabled: bool,
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
    cpu_miner: RwLock<CpuMiner>,
    gpu_miner: RwLock<GpuMiner>,
    cpu_miner_config: Arc<RwLock<CpuMinerConfig>>,
    user_listener: Arc<RwLock<UserListener>>,
    mm_proxy_manager: MmProxyManager,
    node_manager: NodeManager,
    wallet_manager: WalletManager,
    analytics_manager: AnalyticsManager,
}

#[derive(Clone, serde::Serialize)]
struct Payload {
    args: Vec<String>,
    cwd: String,
}

pub const LOG_TARGET: &str = "tari::universe::main";

fn main() {
    let default_hook = panic::take_hook();
    panic::set_hook(Box::new(move |info| {
        default_hook(info);
        process::exit(1);
    }));
    let mut shutdown = Shutdown::new();

    let mm_proxy_manager = MmProxyManager::new();
    let node_manager = NodeManager::new();
    let wallet_manager = WalletManager::new(node_manager.clone());
    let wallet_manager2 = wallet_manager.clone();

    let cpu_config = Arc::new(RwLock::new(CpuMinerConfig {
        node_connection: CpuMinerConnection::BuiltInProxy,
        tari_address: TariAddress::default(),
    }));
    let app_config = Arc::new(RwLock::new(AppConfig::new()));
    let analytics = AnalyticsManager::new(app_config.clone());
    let app_state = UniverseAppState {
        config: app_config.clone(),
        shutdown: shutdown.clone(),
        cpu_miner: CpuMiner::new().into(),
        gpu_miner: GpuMiner::new().into(),
        cpu_miner_config: cpu_config.clone(),
        user_listener: Arc::new(RwLock::new(UserListener::new())),
        mm_proxy_manager: mm_proxy_manager.clone(),
        node_manager,
        wallet_manager,
        analytics_manager: analytics,
    };

    let app = tauri::Builder::default()
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
            set_auto_mining,
            set_mode,
            open_log_dir,
            get_seed_words,
            get_applications_versions,
            set_user_inactivity_timeout,
            update_applications
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
        tauri::RunEvent::ExitRequested { api: _, .. } | tauri::RunEvent::Exit => {
            // api.prevent_exit();
            info!(target: LOG_TARGET, "App shutdown caught");
            shutdown.trigger();
            // TODO: Find a better way of knowing that all miners have stopped
            sleep(std::time::Duration::from_secs(5));
            info!(target: LOG_TARGET, "App shutdown complete");
        }
        RunEvent::MainEventsCleared => {
            // no need to handle
        }
        _ => {
            debug!(target: LOG_TARGET, "Unhandled event: {:?}", event);
        }
    });
}
