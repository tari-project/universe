// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod cpu_miner;
mod xmrig_adapter;
mod xmrig;

use std::{panic, process};
use std::thread::sleep;
use tari_shutdown::Shutdown;
use tokio::sync::Mutex;
use crate::cpu_miner::CpuMiner;

#[tauri::command]
async fn start_mining<'r>(window: tauri::Window, state: tauri::State<'r, UniverseAppState>) -> Result<(), String> {
    state.cpu_miner.lock().await.start(state.shutdown.to_signal()).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
async fn stop_mining<'r>(state: tauri::State<'r, UniverseAppState>) -> Result<(), String> {
    state.cpu_miner.lock().await.stop().await.map_err(|e| e.to_string())?;
    Ok(())
}

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command]
fn greet(name: &str ) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

struct UniverseAppState {
    shutdown: Shutdown,
    cpu_miner: Mutex<CpuMiner>
}

fn main() {
    let default_hook = panic::take_hook();
    panic::set_hook(Box::new(move |info| {
        default_hook(info);
        process::exit(1);
    }));



    let mut shutdown = Shutdown::new();
    let app_state = UniverseAppState {
        shutdown: shutdown.clone(),
        cpu_miner: CpuMiner::new().into()
    };

    let app = tauri::Builder::default()
        .manage(app_state)
        .invoke_handler(tauri::generate_handler![greet, start_mining, stop_mining])
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
