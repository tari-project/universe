// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod cpu_miner;
mod mm_proxy_manager;
mod process_watcher;
mod xmrig;
mod xmrig_adapter;

mod binary_resolver;
mod download_utils;
mod github;
mod merge_mining_adapter;
mod minotari_node_adapter;
mod node_manager;
mod process_adapter;

use crate::cpu_miner::CpuMiner;
use crate::mm_proxy_manager::MmProxyManager;
use crate::node_manager::NodeManager;
use log::{debug, error, info};
use serde::Serialize;
use std::sync::Arc;
use std::thread::sleep;
use std::{panic, process};
use tari_shutdown::Shutdown;
use tauri::{RunEvent, UpdaterEvent};
use tokio::sync::RwLock;

#[tauri::command]
async fn start_mining<'r>(
    _window: tauri::Window,
    state: tauri::State<'r, UniverseAppState>,
    app: tauri::AppHandle,
) -> Result<(), String> {
    let config = state.cpu_miner_config.read().await;
    state
        .node_manager
        .ensure_started(
            state.shutdown.to_signal(),
            app.path_resolver().app_local_data_dir().unwrap(),
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
        )
        .await
        .map_err(|e| {
            dbg!(e.to_string());
            e.to_string()
        })?;
    dbg!("command start finished");
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

    state.node_manager.stop().await.map_err(|e| e.to_string())?;
    Ok(())
}

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command]
async fn status(state: tauri::State<'_, UniverseAppState>) -> Result<AppStatus, String> {
    let cpu_miner = state.cpu_miner.read().await;
    let cpu = match cpu_miner.status().await.map_err(|e| e.to_string()) {
        Ok(cpu) => cpu,
        Err(e) => {
            eprintln!("Error getting cpu miner status: {:?}", e);
            return Err(e);
        }
    };
    Ok(AppStatus { cpu })
}

#[derive(Debug, Serialize)]
pub struct AppStatus {
    // TODO: add each application version.
    cpu: CpuMinerStatus,
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
}

struct UniverseAppState {
    shutdown: Shutdown,
    cpu_miner: RwLock<CpuMiner>,
    cpu_miner_config: RwLock<CpuMinerConfig>,
    mm_proxy_manager: Arc<RwLock<MmProxyManager>>,
    node_manager: NodeManager,
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
    let app_state = UniverseAppState {
        shutdown: shutdown.clone(),
        cpu_miner: CpuMiner::new().into(),
        cpu_miner_config: RwLock::new(CpuMinerConfig {
            node_connection: CpuMinerConnection::BuiltInProxy,
        }),
        mm_proxy_manager: mm_proxy_manager.clone(),
        node_manager,
    };

    let app = tauri::Builder::default()
        .manage(app_state)
        .invoke_handler(tauri::generate_handler![status, start_mining, stop_mining])
        .build(tauri::generate_context!())
        .expect("error while running tauri application");

    tari_common::initialize_logging(
        &app.path_resolver()
            .app_config_dir()
            .unwrap()
            .join("log4rs_config.yml"),
        &app.path_resolver().app_log_dir().unwrap(),
        include_str!("../log4rs_sample.yml"),
    )
    .expect("Could not set up logging");
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
        tauri::RunEvent::ExitRequested { api: _, .. } => {
            // api.prevent_exit();
            info!(target: LOG_TARGET, "App shutdown caught");
            shutdown.trigger();
            // TODO: Find a better way of knowing that all miners have stopped
            sleep(std::time::Duration::from_secs(3));
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
