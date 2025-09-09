// Copyright 2025. The Tari Project
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

use log::info;
use tauri::Manager;

use crate::{
    configs::{config_mining::ConfigMining, trait_config::ConfigImpl},
    mining::gpu::{consts::GpuMinerType, manager::GpuManager},
    setup::setup_manager::{SetupManager, SetupPhase},
    tasks_tracker::TasksTrackers,
    UniverseAppState,
};

const LOG_TARGET: &str = "tari::universe::fallback_gpu_miner";

pub async fn fallback_gpu_miner(app_handle: tauri::AppHandle) -> Result<(), anyhow::Error> {
    let config_gpu_miner_type = ConfigMining::content().await.gpu_miner_type().clone();
    if config_gpu_miner_type != GpuMinerType::Glytex {
        TasksTrackers::current()
            .node_phase
            .get_task_tracker()
            .await
            .spawn(async move {
                let mut zero_hash_rate_counter = 0;
                let mut shutdown_signal = TasksTrackers::current().gpu_mining_phase.get_signal().await;

                let app_state = app_handle.state::<UniverseAppState>().clone();
                let mut gpu_latest_miner_stats = app_state
                    .mining_status_manager
                    .read()
                    .await
                    .gpu_latest_miner_stats
                    .clone();

                loop {
                    tokio::select! {
                        _ = gpu_latest_miner_stats.changed() => {
                            let gpu_stats = gpu_latest_miner_stats.borrow().clone();
                            if gpu_stats.is_mining == false && zero_hash_rate_counter > 2 {
                                break;
                            }

                            if gpu_stats.hash_rate == 0.0 {
                                zero_hash_rate_counter += 1;
                            } else {
                                break;
                            }
                            // 1min of consecutive zero hashrate reported from start(12 status updates)
                            if zero_hash_rate_counter > 12 {
                                info!(target: LOG_TARGET, "Multiple zero hashrate reported with current setup, fallback restart to glytex");

                                let _unused = GpuManager::set_fallback_mode(true).await;
                                SetupManager::get_instance()
                                    .restart_phases(vec![SetupPhase::GpuMining])
                                    .await;
                                break;
                            }
                        },
                        _ = tokio::time::sleep(std::time::Duration::from_secs(60)) => {
                            info!(target: LOG_TARGET, "Gpu status not reported for 60secs, fallback restart to glytex");
                            let _unused = GpuManager::set_fallback_mode(true).await;
                            SetupManager::get_instance()
                                .restart_phases(vec![SetupPhase::GpuMining])
                                .await;
                            break;
                        },
                        _ = shutdown_signal.wait() => {
                            break;
                        }
                    }
                }
            });
    }
    Ok(())
}
