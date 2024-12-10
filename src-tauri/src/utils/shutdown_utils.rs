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

use crate::{UniverseAppState, APPLICATION_FOLDER_ID};
use log::info;
use tauri::Manager;

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
