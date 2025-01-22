use std::time::Duration;

use log::{error, info, warn};
use tauri::Manager;
use tokio::time::Instant;

use crate::{gpu_miner_adapter::GpuNodeSource, UniverseAppState};

const LOG_TARGET: &str = "tari::universe::mining_operations";
const MAX_ACCEPTABLE_COMMAND_TIME: Duration = Duration::from_secs(1);

pub async fn stop_mining<'r>(state: tauri::State<'_, UniverseAppState>) -> Result<(), String> {
    let _lock = state.stop_start_mutex.lock().await;
    let timer = Instant::now();
    state
        .cpu_miner
        .write()
        .await
        .stop()
        .await
        .map_err(|e| e.to_string())?;
    info!(target:LOG_TARGET, "cpu miner stopped");

    state
        .gpu_miner
        .write()
        .await
        .stop()
        .await
        .map_err(|e| e.to_string())?;
    info!(target:LOG_TARGET, "gpu miner stopped");

    if timer.elapsed() > MAX_ACCEPTABLE_COMMAND_TIME {
        warn!(target: LOG_TARGET, "stop_mining took too long: {:?}", timer.elapsed());
    }
    Ok(())
}

pub async fn start_mining<'r>(
    state: tauri::State<'_, UniverseAppState>,
    app: tauri::AppHandle,
) -> Result<(), String> {
    let timer = Instant::now();
    let _lock = state.stop_start_mutex.lock().await;
    let config = state.config.read().await;
    let cpu_mining_enabled = config.cpu_mining_enabled();
    let gpu_mining_enabled = config.gpu_mining_enabled();
    let mode = config.mode();
    let custom_cpu_usage = config.custom_cpu_usage();
    let custom_gpu_usage = config.custom_gpu_usage();
    let cpu_miner_running = state.cpu_miner.read().await.is_running().await;
    let gpu_miner_running = state.gpu_miner.read().await.is_running().await;

    let cpu_miner_config = state.cpu_miner_config.read().await;
    let tari_address = cpu_miner_config.tari_address.clone();
    let p2pool_enabled = config.p2pool_enabled();
    let monero_address = config.monero_address().to_string();
    let mut telemetry_id = state
        .telemetry_manager
        .read()
        .await
        .get_unique_string()
        .await;

    if cpu_mining_enabled && !cpu_miner_running {
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
                app.path()
                    .app_local_data_dir()
                    .expect("Could not get data dir"),
                app.path()
                    .app_config_dir()
                    .expect("Could not get config dir"),
                app.path().app_log_dir().expect("Could not get log dir"),
                mode,
                custom_cpu_usage,
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
    info!(target: LOG_TARGET, "Gpu availability {:?} gpu_mining_enabled {}", gpu_available.clone(), gpu_mining_enabled);

    if gpu_mining_enabled && gpu_available && !gpu_miner_running {
        info!(target: LOG_TARGET, "1. Starting gpu miner");
        // let tari_address = state.cpu_miner_config.read().await.tari_address.clone();
        // let p2pool_enabled = state.config.read().await.p2pool_enabled();
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

        info!(target: LOG_TARGET, "2 Starting gpu miner");

        if telemetry_id.is_empty() {
            telemetry_id = "tari-universe".to_string();
        }

        info!(target: LOG_TARGET, "3. Starting gpu miner");
        let res = state
            .gpu_miner
            .write()
            .await
            .start(
                state.shutdown.to_signal(),
                tari_address,
                source,
                app.path()
                    .app_local_data_dir()
                    .expect("Could not get data dir"),
                app.path()
                    .app_config_dir()
                    .expect("Could not get config dir"),
                app.path().app_log_dir().expect("Could not get log dir"),
                mode,
                telemetry_id,
                custom_gpu_usage,
            )
            .await;

        info!(target: LOG_TARGET, "4. Starting gpu miner");
        if let Err(e) = res {
            error!(target: LOG_TARGET, "Could not start gpu mining: {:?}", e);
            drop(
                state.gpu_miner.write().await.stop().await.inspect_err(
                    |e| error!(target: LOG_TARGET, "Could not stop gpu miner: {:?}", e),
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
