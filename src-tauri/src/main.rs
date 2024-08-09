// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod cpu_miner;
mod mm_proxy_manager;
mod process_watcher;
mod user_listener;
mod xmrig;
mod xmrig_adapter;

mod app_config;
mod binary_resolver;
mod download_utils;
mod github;
mod internal_wallet;
mod merge_mining_adapter;
mod minotari_node_adapter;
mod node_manager;
mod process_adapter;
mod wallet_manager;

mod process_killer;
mod wallet_adapter;

use crate::cpu_miner::CpuMiner;
use crate::internal_wallet::InternalWallet;
use crate::mm_proxy_manager::MmProxyManager;
use crate::node_manager::NodeManager;
use crate::user_listener::UserListener;
use crate::wallet_adapter::WalletBalance;
use crate::wallet_manager::WalletManager;
use app_config::{AppConfig, MiningMode};
use futures_util::TryFutureExt;
use log::{debug, error, info, warn};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use std::thread::sleep;
use std::{panic, process};
use tari_common_types::tari_address::TariAddress;
use tari_core::transactions::tari_amount::MicroMinotari;
use tari_shutdown::Shutdown;
use tauri::{Manager, RunEvent, UpdaterEvent};
use tokio::sync::RwLock;
use tokio::try_join;

use crate::binary_resolver::{Binaries, BinaryResolver};
use crate::xmrig_adapter::XmrigAdapter;
use dirs_next::cache_dir;

#[derive(Debug, Serialize, Deserialize, Clone)]
struct SetupStatusEvent {
    event_type: String,
    title: String,
    progress: f64,
}

pub struct ProgressTracker {
    inner: Arc<RwLock<ProgressTrackerInner>>,
}

impl Clone for ProgressTracker {
    fn clone(&self) -> Self {
        Self {
            inner: self.inner.clone(),
        }
    }
}

impl ProgressTracker {
    pub fn new(window: tauri::Window) -> Self {
        Self {
            inner: Arc::new(RwLock::new(ProgressTrackerInner::new(window))),
        }
    }

    pub async fn set_max(&self, max: u64) {
        self.inner.write().await.set_next_max(max);
    }

    pub async fn update(&self, title: String, progress: u64) {
        self.inner.read().await.update(title, progress);
    }
}

pub struct ProgressTrackerInner {
    window: tauri::Window,
    min: u64,
    next_max: u64,
}

impl ProgressTrackerInner {
    pub fn new(window: tauri::Window) -> Self {
        Self {
            window,
            min: 0,
            next_max: 0,
        }
    }

    pub fn set_next_max(&mut self, max: u64) {
        self.min = self.next_max;
        self.next_max = max;
    }

    pub fn update(&self, title: String, progress: u64) {
        info!(target: LOG_TARGET, "Progress: {}% {}", progress, title);
        let _ = self.window.emit(
            "message",
            SetupStatusEvent {
                event_type: "setup_status".to_string(),
                title,
                progress: (self.min
                    + ((self.next_max - self.min) as f64 * (progress as f64 / 100.0)) as u64)
                    as f64
                    / 100.0,
            },
        );
    }
}

#[tauri::command]
async fn set_mode<'r>(
    mode: String,
    _window: tauri::Window,
    state: tauri::State<'r, UniverseAppState>,
    _app: tauri::AppHandle,
) -> Result<(), String> {
    let _ = state.config.write().await.set_mode(mode).await;

    Ok(())
}

#[tauri::command]
async fn setup_application<'r>(
    window: tauri::Window,
    state: tauri::State<'r, UniverseAppState>,
    app: tauri::AppHandle,
) -> Result<(), String> {
    let _ = window.emit(
        "message",
        SetupStatusEvent {
            event_type: "setup_status".to_string(),
            title: "Starting up".to_string(),
            progress: 0.0,
        },
    );
    let data_dir = app.path_resolver().app_local_data_dir().unwrap();
    let cache_dir = app.path_resolver().app_cache_dir().unwrap();

    let mut progress = ProgressTracker::new(window.clone());

    progress.set_max(10).await;
    progress
        .update("Checking for latest version of node".to_string(), 0)
        .await;
    BinaryResolver::current()
        .ensure_latest(Binaries::MinotariNode, progress.clone())
        .await
        .map_err(|e| {
            error!(target: LOG_TARGET, "Could not download node: {:?}", e);
            e.to_string()
        })?;

    progress.set_max(15).await;
    progress
        .update("Checking for latest version of mmproxy".to_string(), 0)
        .await;
    BinaryResolver::current()
        .ensure_latest(Binaries::MergeMiningProxy, progress.clone())
        .await
        .map_err(|e| {
            error!(target: LOG_TARGET, "Could not download mmproxy: {:?}", e);
            e.to_string()
        })?;
    progress.set_max(20).await;
    progress
        .update("Checking for latest version of wallet".to_string(), 0)
        .await;
    BinaryResolver::current()
        .ensure_latest(Binaries::Wallet, progress.clone())
        .await
        .map_err(|e| e.to_string())?;

    progress.set_max(30).await;
    progress
        .update("Checking for latest version of xmrig".to_string(), 0)
        .await;
    XmrigAdapter::ensure_latest(cache_dir, false, progress.clone())
        .await
        .map_err(|e| {
            error!(target: LOG_TARGET, "Could not download xmrig: {:?}", e);
            e.to_string()
        })?;

    state
        .node_manager
        .ensure_started(state.shutdown.to_signal(), data_dir.clone())
        .await
        .map_err(|e| {
            error!(target: LOG_TARGET, "Could not start node manager: {:?}", e);
            e.to_string()
        })?;

    progress.set_max(40).await;
    progress
        .update("Waiting for node to sync".to_string(), 0)
        .await;
    state
        .node_manager
        .wait_synced(progress.clone())
        .await
        .map_err(|e| e.to_string())?;

    progress.set_max(80).await;
    progress.update("Waiting for wallet".to_string(), 0).await;
    state
        .wallet_manager
        .ensure_started(state.shutdown.to_signal(), data_dir)
        .await
        .map_err(|e| {
            error!(target: LOG_TARGET, "Could not start wallet manager: {:?}", e);
            e.to_string()
        })?;

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
    let _ = state
        .config
        .write()
        .await
        .set_auto_mining(auto_mining)
        .await;
    let mut user_listener = state.user_listener.write().await;

    if auto_mining {
        user_listener.start_listening_to_mouse_poisition_change(window);
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
    let mm_proxy_manager = state.mm_proxy_manager.clone();
    let progress_tracker = ProgressTracker::new(window.clone());
    state
        .cpu_miner
        .write()
        .await
        .start(
            state.shutdown.to_signal(),
            &config,
            &mm_proxy_manager,
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
    state
        .mm_proxy_manager
        .stop()
        .await
        .map_err(|e| e.to_string())?;

    // state.node_manager.stop().await.map_err(|e| e.to_string())?;
    Ok(())
}

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command]
async fn status(state: tauri::State<'_, UniverseAppState>) -> Result<AppStatus, String> {
    let cpu_miner = state.cpu_miner.read().await;
    let (_sha_hash_rate, randomx_hash_rate, block_reward, block_height, block_time, is_synced) =
        state
            .node_manager
            .get_network_hash_rate_and_block_reward()
            .await
            .unwrap_or_else(|e| {
                //  warn!(target: LOG_TARGET, "Error getting network hash rate and block reward: {:?}", e);
                (0, 0, MicroMinotari(0), 0, 0, false)
            });
    let cpu = match cpu_miner
        .status(randomx_hash_rate, block_reward)
        .await
        .map_err(|e| e.to_string())
    {
        Ok(cpu) => cpu,
        Err(e) => {
            eprintln!("Error getting cpu miner status: {:?}", e);
            return Err(e);
        }
    };

    let wallet_balance = match state.wallet_manager.get_balance().await {
        Ok(w) => w,
        Err(e) => {
            warn!(target: LOG_TARGET, "Error getting wallet balance: {}", e);
            WalletBalance {
                available_balance: MicroMinotari(0),
                pending_incoming_balance: MicroMinotari(0),
                pending_outgoing_balance: MicroMinotari(0),
                timelocked_balance: MicroMinotari(0),
            }
        }
    };

    let config_guard = state.config.read().await;

    Ok(AppStatus {
        cpu,
        base_node: BaseNodeStatus {
            block_height,
            block_time,
            is_synced,
        },
        wallet_balance,
        mode: config_guard.mode.clone(),
        auto_mining: config_guard.auto_mining.clone(),
    })
}

#[derive(Debug, Serialize)]
pub struct AppStatus {
    // TODO: add each application version.
    cpu: CpuMinerStatus,
    base_node: BaseNodeStatus,
    wallet_balance: WalletBalance,
    mode: MiningMode,
    auto_mining: bool,
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
    pub cpu_usage: u32,
    pub cpu_brand: String,
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
    cpu_miner_config: Arc<RwLock<CpuMinerConfig>>,
    user_listener: Arc<RwLock<UserListener>>,
    mm_proxy_manager: MmProxyManager,
    node_manager: NodeManager,
    wallet_manager: WalletManager,
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
    let app_state = UniverseAppState {
        config: app_config.clone(),
        shutdown: shutdown.clone(),
        cpu_miner: CpuMiner::new().into(),
        cpu_miner_config: cpu_config.clone(),
        user_listener: Arc::new(RwLock::new(UserListener::new())),
        mm_proxy_manager: mm_proxy_manager.clone(),
        node_manager,
        wallet_manager,
    };

    let user_listener = app_state.user_listener.clone();

    let app = tauri::Builder::default()
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

            let app_config_clone = app_config.clone();

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

            // let auto_mining = app_config.read().auto_mining;
            // let user_listener = app_state.user_listener.write();

            // let user_listener = app_state.user_listener.clone();
            let app_window = app.get_window("main").unwrap().clone();
            let auto_miner_thread = tauri::async_runtime::spawn(async move {
                let auto_mining = app_config_clone.read().await.auto_mining;
                let mut user_listener = user_listener.write().await;

                if auto_mining {
                    user_listener.start_listening_to_mouse_poisition_change(app_window);
                }
            });

            match tauri::async_runtime::block_on(auto_miner_thread) {
                Ok(_) => {}
                Err(e) => {
                    error!(target: LOG_TARGET, "Error setting up auto mining: {:?}", e);
                }
            }

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
            get_seed_words
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
