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

use serde::{Deserialize, Serialize};

use crate::LOG_TARGET_APP_LOGIC;
use crate::configs::config_mining::{ConfigMining, ConfigMiningContent, MiningModeType};
use crate::configs::trait_config::ConfigImpl;
use crate::events_emitter::EventsEmitter;
use crate::mining::cpu::manager::CpuManager;
use crate::mining::gpu::manager::GpuManager;
use crate::systemtray_manager::{SystemTrayEvents, SystemTrayManager};
use log::{error, info};

pub mod cpu;
pub mod gpu;
pub mod pools;

/// Updates the selected mining mode and restarts or starts miners according to the new mode.
///
/// If `start_if_stopped` is true (e.g. when triggered by a scheduled window), miners that were
/// stopped are started in the new mode if they are enabled.
/// If miners are already running and the mode changed, they are stopped and restarted with the
/// new mode settings. If the mode did not change, running miners are left undisturbed.
pub async fn apply_mining_mode(mode: String, start_if_stopped: bool) -> Result<(), anyhow::Error> {
    let current_config = ConfigMining::content().await;
    let old_mode = current_config.selected_mining_mode().clone();
    let mode_changed = old_mode != mode;

    let cpu_running = CpuManager::read().await.is_running();
    let gpu_running = GpuManager::read().await.is_running();
    let cpu_enabled = *current_config.cpu_mining_enabled();
    let gpu_enabled = *current_config.gpu_mining_enabled();

    let should_restart_cpu = cpu_running && mode_changed;
    let should_restart_gpu = gpu_running && mode_changed;

    if should_restart_cpu {
        info!(
            target: LOG_TARGET_APP_LOGIC,
            "Stopping running CPU miner to apply mode {mode} (was {old_mode})"
        );
        let _unused = CpuManager::write().await.stop_mining().await;
    }
    if should_restart_gpu {
        info!(
            target: LOG_TARGET_APP_LOGIC,
            "Stopping running GPU miner to apply mode {mode} (was {old_mode})"
        );
        let _unused = GpuManager::write().await.stop_mining().await;
    }

    ConfigMining::update_field(ConfigMiningContent::set_selected_mining_mode, mode.clone()).await?;

    if mode != "Eco" {
        ConfigMining::update_field(ConfigMiningContent::set_eco_alert_needed, false).await?;
    }

    let updated_config = ConfigMining::content().await;
    EventsEmitter::emit_mining_config_loaded(&updated_config).await;

    SystemTrayManager::send_event(SystemTrayEvents::MiningMode(MiningModeType::from(
        mode.clone(),
    )))
    .await;

    if cpu_enabled && (should_restart_cpu || (!cpu_running && start_if_stopped)) {
        info!(target: LOG_TARGET_APP_LOGIC, "Starting CPU miner in mode {mode}");
        if let Err(e) = CpuManager::write().await.start_mining().await {
            error!(target: LOG_TARGET_APP_LOGIC, "Failed to start CPU miner in mode {mode}: {e}");
        }
    }

    if gpu_enabled && (should_restart_gpu || (!gpu_running && start_if_stopped)) {
        info!(target: LOG_TARGET_APP_LOGIC, "Starting GPU miner in mode {mode}");
        if let Err(e) = GpuManager::write().await.start_mining().await {
            error!(target: LOG_TARGET_APP_LOGIC, "Failed to start GPU miner in mode {mode}: {e}");
        }
    }

    Ok(())
}

/// Errors that represent user-environment issues rather than application bugs.
/// These should never be reported to Sentry.
#[derive(Debug, thiserror::Error)]
pub enum MiningError {
    #[error("GPU mining is disabled")]
    GpuMiningDisabled,
    #[error("CPU mining is disabled")]
    CpuMiningDisabled,
    #[error("All GPU devices are excluded. Cannot start lolminer.")]
    AllDevicesExcluded,
}

impl MiningError {
    /// Returns true if the error is a user-environment issue rather than an application bug.
    pub fn is_user_environment_error(e: &anyhow::Error) -> bool {
        e.downcast_ref::<MiningError>().is_some()
            || e.downcast_ref::<crate::binaries::binaries_resolver::BinaryResolveError>()
                .is_some_and(|e| {
                    matches!(
                        e,
                        crate::binaries::binaries_resolver::BinaryResolveError::AntivirusIssue {
                            ..
                        }
                    )
                })
            || Self::is_insufficient_disk_space(e)
    }

    /// Detects an out-of-disk-space condition anywhere in the error chain. A full disk is the
    /// user's environment, not an application bug, so it must never be reported to Sentry.
    fn is_insufficient_disk_space(e: &anyhow::Error) -> bool {
        e.chain().any(|cause| {
            // Preferred: typed, cross-platform, locale-independent detection.
            if let Some(io_err) = cause.downcast_ref::<std::io::Error>()
                && io_err.kind() == std::io::ErrorKind::StorageFull
            {
                return true;
            }
            // Fallback for errors stringified before reaching us: std emits a raw, non-localized
            // "(os error N)" suffix. ENOSPC = 28 on Unix, ERROR_DISK_FULL = 112 on Windows.
            let msg = cause.to_string();
            msg.contains("(os error 28)") || msg.contains("(os error 112)")
        })
    }
}

#[derive(Debug, Clone, Copy, Deserialize, Serialize)]
pub enum MinerControlsState {
    Initiated,
    Started,
    Stopped,
    Restarting,
    Idle,
}

#[derive(Clone, Serialize, PartialEq, Eq, Deserialize, Debug)]
pub enum GpuConnectionType {
    Node { node_grpc_address: String },
    Pool { pool_url: String },
}

impl Default for GpuConnectionType {
    fn default() -> Self {
        GpuConnectionType::Pool {
            pool_url: String::new(),
        }
    }
}

#[derive(Clone, Serialize, PartialEq, Eq, Deserialize, Debug)]
pub enum CpuConnectionType {
    LocalMMProxy {
        local_proxy_url: String,
    },
    Pool {
        pool_url: String,
        worker_name: Option<String>,
    },
}

impl Default for CpuConnectionType {
    fn default() -> Self {
        CpuConnectionType::Pool {
            pool_url: String::new(),
            worker_name: None,
        }
    }
}
