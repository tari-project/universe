// Copyright 2024. The Tari Project
//
// Redistribution and use in source and binary forms, with or without modification, are permitted provided that the
// following conditions are met:
//
// 1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following
// disclaimer.
//
// 2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the
// following disclaimer in the documentation and/or other materials provided with the distribution.
//
// 3. Neither the name of the copyright holder nor the names of its contributors may be used to endorse or promote
// products derived from this software without specific prior written permission.
//
// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES,
// INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
// DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
// SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
// SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
// WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE
// USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

use std::time::Duration;

use crate::{
    events::ResumingAllProcessesPayload,
    node_manager::{NodeManagerError, STOP_ON_ERROR_CODES},
    p2pool_manager::P2poolConfig,
    progress_tracker::ProgressTracker,
    StartConfig, UniverseAppState, APPLICATION_FOLDER_ID,
};
use anyhow::anyhow;
use log::{error, info, warn};
use tauri::{Emitter, Manager};
use tokio::sync::watch;

static LOG_TARGET: &str = "tari::universe::shutdown_utils";

pub async fn stop_all_processes(
    app_handle: tauri::AppHandle,
    should_shutdown: bool,
) -> Result<(), String> {
    info!(target: LOG_TARGET, "Stopping all miners");

    let state = app_handle.state::<UniverseAppState>().inner();

    if should_shutdown && !state.shutdown.is_triggered() {
        info!(target: LOG_TARGET, "Entering shutdown sequence");
        state.shutdown.clone().trigger();
    }

    let base_path = app_handle
        .path()
        .local_data_dir()
        .expect("Could not get data dir")
        .join(APPLICATION_FOLDER_ID);

    let mut cpu_miner = state.cpu_miner.write().await;
    let cpu_miner_pid_file_exists = cpu_miner.is_pid_file_exists(base_path.clone()).await;
    let cpu_miner_is_running = cpu_miner.is_running().await;

    info!(target: LOG_TARGET, "CPU Miner: pid file exists: {}, is running: {}", cpu_miner_pid_file_exists, cpu_miner_is_running);

    if cpu_miner_is_running || cpu_miner_pid_file_exists {
        cpu_miner.stop().await.map_err(|e| e.to_string())?;
    }
    drop(cpu_miner);

    let gpu_miner = state.gpu_miner.read().await;
    let gpu_miner_pid_file_exists = gpu_miner.is_pid_file_exists(base_path.clone()).await;
    let gpu_miner_is_running = gpu_miner.is_running().await;

    info!(target: LOG_TARGET, "GPU Miner: pid file exists: {}, is running: {}", gpu_miner_pid_file_exists, gpu_miner_is_running);

    if gpu_miner_is_running || gpu_miner_pid_file_exists {
        gpu_miner.stop().await.map_err(|e| e.to_string())?;
    }
    drop(gpu_miner);

    let wallet_manager = state.wallet_manager.clone();
    let wallet_manager_is_running = wallet_manager.is_running().await;
    let wallet_manager_pid_file_exists = wallet_manager.is_pid_file_exists(base_path.clone()).await;

    info!(target: LOG_TARGET, "Wallet Manager: pid file exists: {}, is running: {}", wallet_manager_pid_file_exists, wallet_manager_is_running);

    if wallet_manager_is_running || wallet_manager_pid_file_exists {
        wallet_manager.stop().await.map_err(|e| e.to_string())?;
    }

    let node_manager = state.node_manager.clone();
    let node_manager_is_running = node_manager.is_running().await;
    let node_manager_pid_file_exists = node_manager.is_pid_file_exists(base_path.clone()).await;

    info!(target: LOG_TARGET, "Node Manager: pid file exists: {}, is running: {}", node_manager_pid_file_exists, node_manager_is_running);

    if node_manager_is_running || node_manager_pid_file_exists {
        node_manager.stop().await.map_err(|e| e.to_string())?;
    }

    let mm_proxy_manager = state.mm_proxy_manager.clone();
    let mm_proxy_manager_is_running = mm_proxy_manager.is_running().await;
    let mm_proxy_manager_pid_file_exists =
        mm_proxy_manager.is_pid_file_exists(base_path.clone()).await;

    info!(target: LOG_TARGET, "MM Proxy Manager: pid file exists: {}, is running: {}", mm_proxy_manager_pid_file_exists, mm_proxy_manager_is_running);

    if mm_proxy_manager_is_running || mm_proxy_manager_pid_file_exists {
        mm_proxy_manager.stop().await.map_err(|e| e.to_string())?;
    }

    let p2pool_manager = state.p2pool_manager.clone();
    let p2pool_manager_is_running = p2pool_manager.is_running().await;
    let p2pool_manager_pid_file_exists = p2pool_manager.is_pid_file_exists(base_path.clone()).await;

    info!(target: LOG_TARGET, "P2Pool Manager: pid file exists: {}, is running: {}", p2pool_manager_pid_file_exists, p2pool_manager_is_running);

    if p2pool_manager_is_running || p2pool_manager_pid_file_exists {
        p2pool_manager.stop().await.map_err(|e| e.to_string())?;
    }

    let tor_manager = state.tor_manager.clone();
    let tor_manager_is_running = tor_manager.is_running().await;
    let tor_manager_pid_file_exists = tor_manager.is_pid_file_exists(base_path.clone()).await;

    info!(target: LOG_TARGET, "Tor Manager: pid file exists: {}, is running: {}", tor_manager_pid_file_exists, tor_manager_is_running);

    if tor_manager_is_running || tor_manager_pid_file_exists {
        tor_manager.stop().await.map_err(|e| e.to_string())?;
    }

    if should_shutdown && !state.shutdown.is_triggered() {
        state.shutdown.clone().trigger();
    }

    Ok(())
}

pub async fn resume_all_processes(app_handle: tauri::AppHandle) -> Result<(), anyhow::Error> {
    match inner_resume_all_processes(app_handle.clone()).await {
        Ok(_) => Ok(()),
        Err(e) => {
            error!(target: LOG_TARGET, "Failed to resume processes: {:?}", e);
            if let Err(emit_err) = app_handle.emit(
                "resuming-all-processes",
                ResumingAllProcessesPayload {
                    title: "resume-failure".to_string(),
                    stage_progress: 0,
                    stage_total: 0,
                    is_resuming: false,
                },
            ) {
                error!(target: LOG_TARGET, "Failed to emit resume-failure event: {:?}", emit_err);
            }
            Err(e)
        }
    }
}

#[allow(clippy::too_many_lines)]
async fn inner_resume_all_processes(app_handle: tauri::AppHandle) -> Result<(), anyhow::Error> {
    let state = app_handle.state::<UniverseAppState>().inner();
    let (tx, _rx) = watch::channel("".to_string());
    let progress = ProgressTracker::new(app_handle.clone(), Some(tx));

    let data_dir = app_handle
        .path()
        .app_local_data_dir()
        .expect("Could not get data dir");
    let config_dir = app_handle
        .path()
        .app_config_dir()
        .expect("Could not get config dir");
    let log_dir = app_handle
        .path()
        .app_log_dir()
        .expect("Could not get log dir");

    let use_tor = state.config.read().await.use_tor();
    let p2pool_enabled = state.config.read().await.p2pool_enabled();
    let mut stage_total = 5;
    let mut stage_progress = 0;
    if use_tor {
        stage_total += 1;
    }

    if p2pool_enabled {
        stage_total += 1;
    }

    app_handle
        .emit(
            "resuming-all-processes",
            ResumingAllProcessesPayload {
                title: "resuming-all-processes".to_string(),
                stage_progress,
                stage_total,
                is_resuming: true,
            },
        )
        .map_err(|e| anyhow!(e))?;
    stage_progress += 1;

    let cpu_miner_config = state.cpu_miner_config.read().await;
    let mm_proxy_manager = state.mm_proxy_manager.clone();

    let mut tor_control_port = None;
    if use_tor && !cfg!(target_os = "macos") {
        app_handle
            .emit(
                "resuming-all-processes",
                ResumingAllProcessesPayload {
                    title: "resuming-tor".to_string(),
                    stage_progress,
                    stage_total,
                    is_resuming: true,
                },
            )
            .map_err(|e| anyhow!(e))?;
        stage_progress += 1;

        state
            .tor_manager
            .ensure_started(
                state.shutdown.to_signal(),
                data_dir.clone(),
                config_dir.clone(),
                log_dir.clone(),
            )
            .await?;
        tor_control_port = state.tor_manager.get_control_port().await?;
    }

    app_handle
        .emit(
            "resuming-all-processes",
            ResumingAllProcessesPayload {
                title: "resuming-node".to_string(),
                stage_progress,
                stage_total,
                is_resuming: true,
            },
        )
        .map_err(|e| anyhow!(e))?;
    stage_progress += 1;

    for _i in 0..2 {
        match state
            .node_manager
            .ensure_started(
                state.shutdown.to_signal(),
                data_dir.clone(),
                config_dir.clone(),
                log_dir.clone(),
                use_tor,
                tor_control_port,
            )
            .await
        {
            Ok(_) => {}
            Err(e) => {
                if let NodeManagerError::ExitCode(code) = e {
                    if STOP_ON_ERROR_CODES.contains(&code) {
                        warn!(target: LOG_TARGET, "Database for node is corrupt or needs a reset, deleting and trying again.");
                        state.node_manager.clean_data_folder(&data_dir).await?;
                        continue;
                    }
                }
                error!(target: LOG_TARGET, "Could not start node manager: {:?}", e);

                app_handle.exit(-1);
                return Err(e.into());
            }
        }
    }
    info!(target: LOG_TARGET, "Node has started and is ready");

    app_handle
        .emit(
            "resuming-all-processes",
            ResumingAllProcessesPayload {
                title: "resuming-wallet".to_string(),
                stage_progress,
                stage_total,
                is_resuming: true,
            },
        )
        .map_err(|e| anyhow!(e))?;
    stage_progress += 1;

    state
        .wallet_manager
        .ensure_started(
            state.shutdown.to_signal(),
            data_dir.clone(),
            config_dir.clone(),
            log_dir.clone(),
        )
        .await?;

    app_handle
        .emit(
            "resuming-all-processes",
            ResumingAllProcessesPayload {
                title: "syncing-node".to_string(),
                stage_progress,
                stage_total,
                is_resuming: true,
            },
        )
        .map_err(|e| anyhow!(e))?;
    stage_progress += 1;

    state.node_manager.wait_synced(progress.clone()).await?;

    let mut cpu_miner = state.cpu_miner.write().await;
    let benchmarked_hashrate = cpu_miner
        .start_benchmarking(
            state.shutdown.to_signal(),
            Duration::from_secs(30),
            data_dir.clone(),
            config_dir.clone(),
            log_dir.clone(),
        )
        .await?;
    drop(cpu_miner);

    if p2pool_enabled {
        app_handle
            .emit(
                "resuming-all-processes",
                ResumingAllProcessesPayload {
                    title: "resuming-p2pool".to_string(),
                    stage_progress,
                    stage_total,
                    is_resuming: true,
                },
            )
            .map_err(|e| anyhow!(e))?;
        stage_progress += 1;

        let base_node_grpc = state.node_manager.get_grpc_port().await?;
        let p2pool_config = P2poolConfig::builder()
            .with_base_node(base_node_grpc)
            .with_stats_server_port(state.config.read().await.p2pool_stats_server_port())
            .with_cpu_benchmark_hashrate(Some(benchmarked_hashrate))
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

    app_handle
        .emit(
            "resuming-all-processes",
            ResumingAllProcessesPayload {
                title: "resuming-mm-proxy".to_string(),
                stage_progress,
                stage_total,
                is_resuming: true,
            },
        )
        .map_err(|e| anyhow!(e))?;
    stage_progress += 1;

    let config = state.config.read().await;
    let p2pool_port = state.p2pool_manager.grpc_port().await;
    mm_proxy_manager
        .start(StartConfig {
            base_node_grpc_port,
            p2pool_port,
            app_shutdown: state.shutdown.to_signal().clone(),
            base_path: data_dir.clone(),
            config_path: config_dir.clone(),
            log_path: log_dir.clone(),
            tari_address: cpu_miner_config.tari_address.clone(),
            coinbase_extra: "".to_string(),
            p2pool_enabled,
            monero_nodes: config.mmproxy_monero_nodes().clone(),
            use_monero_fail: config.mmproxy_use_monero_fail(),
        })
        .await?;
    mm_proxy_manager.wait_ready().await?;
    drop(config);

    app_handle
        .emit(
            "resuming-all-processes",
            ResumingAllProcessesPayload {
                title: "finishing-resume".to_string(),
                stage_progress,
                stage_total,
                is_resuming: false,
            },
        )
        .map_err(|e| anyhow!(e))?;

    Ok(())
}
