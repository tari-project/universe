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
    tasks_tracker::TasksTrackers,
    StartConfig, UniverseAppState,
};
use log::{error, info, warn};
use tauri::Manager;

static LOG_TARGET: &str = "tari::universe::shutdown_utils";

#[allow(clippy::too_many_lines)]
pub async fn resume_all_processes(app_handle: tauri::AppHandle) -> Result<(), anyhow::Error> {
    let state = app_handle.state::<UniverseAppState>().inner();

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

    let config = state.config.read().await;
    let use_tor = config.use_tor();
    let p2pool_enabled = config.p2pool_enabled();
    let remote_node_grpc_address = config.remote_base_node_address();
    drop(config);

    let mut stage_total = 5;
    let mut stage_progress = 0;
    if use_tor {
        stage_total += 1;
    }

    if p2pool_enabled {
        stage_total += 1;
    }

    state
        .events_manager
        .handle_resuming_all_processes(
            &app_handle,
            ResumingAllProcessesPayload {
                title: "resuming-all-processes".to_string(),
                stage_progress,
                stage_total,
                is_resuming: true,
            },
        )
        .await;
    stage_progress += 1;

    let cpu_miner_config = state.cpu_miner_config.read().await;
    let mm_proxy_manager = state.mm_proxy_manager.clone();

    let mut tor_control_port = None;
    if use_tor && !cfg!(target_os = "macos") {
        state
            .events_manager
            .handle_resuming_all_processes(
                &app_handle,
                ResumingAllProcessesPayload {
                    title: "resuming-tor".to_string(),
                    stage_progress,
                    stage_total,
                    is_resuming: true,
                },
            )
            .await;
        stage_progress += 1;

        state
            .tor_manager
            .ensure_started(data_dir.clone(), config_dir.clone(), log_dir.clone())
            .await?;
        tor_control_port = state.tor_manager.get_control_port().await?;
    }

    state
        .events_manager
        .handle_resuming_all_processes(
            &app_handle,
            ResumingAllProcessesPayload {
                title: "resuming-node".to_string(),
                stage_progress,
                stage_total,
                is_resuming: true,
            },
        )
        .await;
    stage_progress += 1;

    for _i in 0..2 {
        match state
            .node_manager
            .ensure_started(
                data_dir.clone(),
                config_dir.clone(),
                log_dir.clone(),
                use_tor,
                tor_control_port,
                remote_node_grpc_address.clone(),
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

    state
        .events_manager
        .handle_resuming_all_processes(
            &app_handle,
            ResumingAllProcessesPayload {
                title: "resuming-wallet".to_string(),
                stage_progress,
                stage_total,
                is_resuming: true,
            },
        )
        .await;
    stage_progress += 1;

    state
        .wallet_manager
        .ensure_started(
            TasksTrackers::current().wallet_phase.get_signal().await,
            data_dir.clone(),
            config_dir.clone(),
            log_dir.clone(),
        )
        .await?;

    state
        .events_manager
        .handle_resuming_all_processes(
            &app_handle,
            ResumingAllProcessesPayload {
                title: "syncing-node".to_string(),
                stage_progress,
                stage_total,
                is_resuming: true,
            },
        )
        .await;
    stage_progress += 1;

    // !todo resume_all_processes will be replaced by new setup
    // state.node_manager.wait_synced(progress.clone()).await?;

    let mut cpu_miner = state.cpu_miner.write().await;
    let benchmarked_hashrate = cpu_miner
        .start_benchmarking(
            TasksTrackers::current().hardware_phase.get_signal().await,
            Duration::from_secs(30),
            data_dir.clone(),
            config_dir.clone(),
            log_dir.clone(),
        )
        .await?;
    drop(cpu_miner);

    if p2pool_enabled {
        state
            .events_manager
            .handle_resuming_all_processes(
                &app_handle,
                ResumingAllProcessesPayload {
                    title: "resuming-p2pool".to_string(),
                    stage_progress,
                    stage_total,
                    is_resuming: true,
                },
            )
            .await;
        stage_progress += 1;

        let base_node_grpc = state.node_manager.get_grpc_address().await?;
        let p2pool_config = P2poolConfig::builder()
            .with_base_node(base_node_grpc)
            .with_stats_server_port(state.config.read().await.p2pool_stats_server_port())
            .with_cpu_benchmark_hashrate(Some(benchmarked_hashrate))
            .build()?;

        state
            .p2pool_manager
            .ensure_started(
                p2pool_config,
                data_dir.clone(),
                config_dir.clone(),
                log_dir.clone(),
            )
            .await?;
    }

    let base_node_grpc_address = state.node_manager.get_grpc_address().await?;
    state
        .events_manager
        .handle_resuming_all_processes(
            &app_handle,
            ResumingAllProcessesPayload {
                title: "resuming-mm-proxy".to_string(),
                stage_progress,
                stage_total,
                is_resuming: true,
            },
        )
        .await;
    stage_progress += 1;

    let config = state.config.read().await;
    let p2pool_port = state.p2pool_manager.grpc_port().await;
    mm_proxy_manager
        .start(StartConfig {
            base_node_grpc_address,
            p2pool_port,
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

    state
        .events_manager
        .handle_resuming_all_processes(
            &app_handle,
            ResumingAllProcessesPayload {
                title: "finishing-resume".to_string(),
                stage_progress,
                stage_total,
                is_resuming: false,
            },
        )
        .await;

    Ok(())
}
