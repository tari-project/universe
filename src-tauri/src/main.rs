// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod cpu_miner;
mod mm_proxy_manager;
mod process_watcher;
mod user_listener;
mod xmrig;
mod xmrig_adapter;

mod binary_resolver;
mod download_utils;
mod github;
mod internal_wallet;
mod merge_mining_adapter;
mod minotari_node_adapter;
mod node_manager;
mod process_adapter;
mod wallet_manager;

mod wallet_adapter;

use crate::cpu_miner::CpuMiner;
use crate::internal_wallet::InternalWallet;
use crate::mm_proxy_manager::MmProxyManager;
use crate::node_manager::NodeManager;
use crate::user_listener::UserListener;
use crate::wallet_adapter::WalletBalance;
use crate::wallet_manager::WalletManager;
use futures_util::TryFutureExt;
use log::{debug, error, info, warn};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use std::thread::sleep;
use std::{panic, process};
use tari_common_types::tari_address::TariAddress;
use tari_core::transactions::tari_amount::MicroMinotari;
use tari_shutdown::Shutdown;
use tauri::{RunEvent, UpdaterEvent};
use tokio::sync::RwLock;
use tokio::try_join;

use crate::xmrig_adapter::XmrigAdapter;
use device_query::{DeviceQuery, DeviceState};
use dirs_next::cache_dir;

#[derive(Debug, Serialize, Deserialize, Clone)]
struct SetupStatusEvent {
    event_type: String,
    title: String,
    progress: f64,
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
    let task1 = state
        .node_manager
        .ensure_started(state.shutdown.to_signal(), data_dir.clone(), window.clone())
        .map_err(|e| {
            error!(target: LOG_TARGET, "Could not start node manager: {:?}", e);
            e.to_string()
        });

    let task2 = state
        .wallet_manager
        .ensure_started(state.shutdown.to_signal(), data_dir, window.clone())
        .map_err(|e| {
            error!(target: LOG_TARGET, "Could not start wallet manager: {:?}", e);
            e.to_string()
        });

    let task3 =
        XmrigAdapter::ensure_latest(cache_dir().unwrap(), false, window.clone()).map_err(|e| {
            error!(target: LOG_TARGET, "Could not download xmrig: {:?}", e);
            e.to_string()
        });

    match try_join!(task1, task2, task3) {
        Ok(_) => {
            debug!(target: LOG_TARGET, "Applications started");
        }
        Err(e) => {
            error!(target: LOG_TARGET, "Error starting applications: {:?}", e);
            // return Err(e.to_string());
        }
    }
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
async fn check_user_mouse_position<'r>(_window: tauri::Window) -> Result<(i32, i32), String> {
    let device_state = DeviceState::new();
    let mouse = device_state.get_mouse();

    Ok(mouse.coords)
}

#[tauri::command]
async fn start_listening_to_user_activity<'r>(
    window: tauri::Window,
    state: tauri::State<'r, UniverseAppState>,
) -> Result<(), String> {
    let mut user_listener = state.user_listener.write().await;
    user_listener.start_listening_to_mouse_poisition_change(window);
    Ok(())
}

#[tauri::command]
async fn stop_listening_to_user_activity<'r>(
    state: tauri::State<'r, UniverseAppState>,
) -> Result<(), String> {
    let mut user_listener = state.user_listener.write().await;
    user_listener.stop_listening_to_mouse_poisition_change();
    Ok(())
}

#[tauri::command]
async fn start_mining<'r>(
    window: tauri::Window,
    state: tauri::State<'r, UniverseAppState>,
    app: tauri::AppHandle,
) -> Result<(), String> {
    let config = state.cpu_miner_config.read().await;
    state
        .node_manager
        .ensure_started(
            state.shutdown.to_signal(),
            app.path_resolver().app_local_data_dir().unwrap(),
            window.clone(),
        )
        .await
        .map_err(|e| e.to_string())?;
    let mm_proxy_manager = state.mm_proxy_manager.read().await;
    state
        .cpu_miner
        .write()
        .await
        .start(
            state.shutdown.to_signal(),
            &config,
            &mm_proxy_manager,
            app.path_resolver().app_local_data_dir().unwrap(),
            window.clone(),
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
        .write()
        .await
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

    Ok(AppStatus {
        cpu,
        base_node: BaseNodeStatus {
            block_height,
            block_time,
            is_synced,
        },
        wallet_balance,
    })
}

#[derive(Debug, Serialize)]
pub struct AppStatus {
    // TODO: add each application version.
    cpu: CpuMinerStatus,
    base_node: BaseNodeStatus,
    wallet_balance: WalletBalance,
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
    shutdown: Shutdown,
    cpu_miner: RwLock<CpuMiner>,
    cpu_miner_config: Arc<RwLock<CpuMinerConfig>>,
    user_listener: Arc<RwLock<UserListener>>,
    mm_proxy_manager: Arc<RwLock<MmProxyManager>>,
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

    let mm_proxy_manager = Arc::new(RwLock::new(MmProxyManager::new()));
    let node_manager = NodeManager::new();
    let wallet_manager = WalletManager::new(node_manager.clone());
    let wallet_manager2 = wallet_manager.clone();

    let cpu_config = Arc::new(RwLock::new(CpuMinerConfig {
        node_connection: CpuMinerConnection::BuiltInProxy,
        tari_address: TariAddress::default(),
    }));
    let app_state = UniverseAppState {
        shutdown: shutdown.clone(),
        cpu_miner: CpuMiner::new().into(),
        cpu_miner_config: cpu_config.clone(),
        user_listener: Arc::new(RwLock::new(UserListener::new())),
        mm_proxy_manager: mm_proxy_manager.clone(),
        node_manager,
        wallet_manager,
    };

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
            check_user_mouse_position,
            start_listening_to_user_activity,
            stop_listening_to_user_activity
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

    app.run(move |_app_handle, event| {
        match event {
            tauri::RunEvent::Updater(updater_event) => match updater_event {
                UpdaterEvent::Error(e) => {
                    error!(target: LOG_TARGET, "Updater error: {:?}", e);
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
            RunEvent::MainEventsCleared => {
                // no need to handle
            }
            _ => {
                debug!(target: LOG_TARGET, "Unhandled event: {:?}", event);
            }
        }
    });
}
