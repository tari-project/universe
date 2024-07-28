// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod cpu_miner;
mod xmrig;
mod xmrig_adapter;
mod mm_proxy_manager;
mod process_watcher;

mod process_adapter;
mod merge_mining_adapter;
mod binary_resolver;
mod github;
mod download_utils;


use crate::cpu_miner::CpuMiner;
use std::thread::sleep;
use std::{panic, process};
use std::sync::Arc;
use serde::Serialize;
use tari_shutdown::Shutdown;
use tokio::sync::RwLock;
use crate::mm_proxy_manager::MmProxyManager;

#[tauri::command]
async fn start_mining<'r>(
    window: tauri::Window,
    state: tauri::State<'r, UniverseAppState>,
) -> Result<(), String> {
    let config = state.cpu_miner_config.read().await;
    let mm_proxy_manager = state.mm_proxy_manager.read().await;
    state
        .cpu_miner
        .write()
        .await
        .start(state.shutdown.to_signal(),  &config, &mm_proxy_manager).await
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
    state.mm_proxy_manager.write().await.stop().await.map_err(|e| e.to_string())?;
    Ok(())
}

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command]
async fn status(
state: tauri::State<'_, UniverseAppState>

) -> Result<AppStatus, String> {
    let cpu_miner = state.cpu_miner.read().await;
    let cpu = cpu_miner.status().await.map_err(|e| e.to_string())?;
    Ok(AppStatus {cpu})
}


#[derive(Debug, Serialize)]
pub struct AppStatus {
    cpu: CpuMinerStatus
}

#[derive(Debug, Serialize)]
pub struct CpuMinerStatus {
    pub is_mining: bool,
    pub connection: CpuMinerConnectionStatus
}


#[derive(Debug, Serialize)]
pub struct CpuMinerConnectionStatus {
    pub is_connected: bool,
    pub error: Option<String>
}

pub enum CpuMinerConnection {
    BuiltInProxy
}

struct CpuMinerConfig {
    node_connection: CpuMinerConnection
}

struct UniverseAppState {
    shutdown: Shutdown,
    cpu_miner: RwLock<CpuMiner>,
    cpu_miner_config: RwLock<CpuMinerConfig>,
    mm_proxy_manager: Arc<RwLock<MmProxyManager>>
}

fn main() {
    let default_hook = panic::take_hook();
    panic::set_hook(Box::new(move |info| {
        default_hook(info);
        process::exit(1);
    }));

    let mut shutdown = Shutdown::new();
    let mm_proxy_manager = Arc::new(RwLock::new(MmProxyManager::new()));
    let app_state = UniverseAppState {
        shutdown: shutdown.clone(),
        cpu_miner: CpuMiner::new().into(),
        cpu_miner_config: RwLock::new(CpuMinerConfig {
            node_connection: CpuMinerConnection::BuiltInProxy
        }),
        mm_proxy_manager: mm_proxy_manager.clone()
    };

    let app = tauri::Builder::default()
        .manage(app_state)
        .invoke_handler(tauri::generate_handler![status, start_mining, stop_mining])
        .build(tauri::generate_context!())
        .expect("error while running tauri application");

    app.run(move |_app_handle, event| match event {
        tauri::RunEvent::ExitRequested { api, .. } => {
            // api.prevent_exit();
            println!("App shutdown caught");
            shutdown.trigger();
            // TODO: Find a better way of knowing that all miners have stopped
            sleep(std::time::Duration::from_secs(3));
        }
        _ => {}
    });
}
