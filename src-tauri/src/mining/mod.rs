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

use log::error;
use serde::{Deserialize, Serialize};

use crate::{
    LOG_TARGET_APP_LOGIC,
    configs::{
        config_mining::{ConfigMining, ConfigMiningContent, MiningModeType},
        trait_config::ConfigImpl,
    },
    events_emitter::EventsEmitter,
    systemtray_manager::{SystemTrayEvents, SystemTrayManager},
};

pub mod cpu;
pub mod gpu;
pub mod pools;

/// Action to take for a miner (CPU or GPU) when applying a mining mode.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ScheduledMineAction {
    /// Leave the miner as-is (disabled, stopped when `start_if_stopped` is false, or already running in target mode).
    Skip,
    /// Start the miner because it is enabled, not currently running, and `start_if_stopped` is true.
    Start,
    /// Stop and restart the miner so the new mode's thread count / intensity takes effect.
    Restart,
}

/// Pure decision helper determining whether a miner should be skipped, started, or restarted
/// when switching from `current_mode` to `target_mode`.
pub fn scheduled_mine_action(
    enabled: bool,
    is_running: bool,
    current_mode: &str,
    target_mode: &str,
    start_if_stopped: bool,
) -> ScheduledMineAction {
    if !enabled {
        return ScheduledMineAction::Skip;
    }
    if !is_running {
        return if start_if_stopped {
            ScheduledMineAction::Start
        } else {
            ScheduledMineAction::Skip
        };
    }
    if current_mode.trim().eq_ignore_ascii_case(target_mode.trim()) {
        ScheduledMineAction::Skip
    } else {
        ScheduledMineAction::Restart
    }
}

/// Updates the selected mining mode in [`ConfigMining`], notifies the frontend and system tray,
/// and starts or restarts enabled miners as determined by [`scheduled_mine_action`].
///
/// * When `start_if_stopped` is `true` (scheduled mining window), stopped enabled miners are started
///   and running miners in a different mode are restarted under `new_mode`.
/// * When `start_if_stopped` is `false` (manual or MCP mode change), stopped miners stay stopped
///   while running miners in a different mode are restarted under `new_mode`.
pub async fn apply_mining_mode(
    new_mode: &str,
    start_if_stopped: bool,
) -> Result<(), anyhow::Error> {
    let previous_config = ConfigMining::content().await;
    let previous_mode = previous_config.selected_mining_mode().clone();
    let cpu_enabled = *previous_config.cpu_mining_enabled();
    let gpu_enabled = *previous_config.gpu_mining_enabled();

    let cpu_running = cpu::manager::CpuManager::read().await.is_running();
    let gpu_running = gpu::manager::GpuManager::read().await.is_running();

    let cpu_action = scheduled_mine_action(
        cpu_enabled,
        cpu_running,
        &previous_mode,
        new_mode,
        start_if_stopped,
    );
    let gpu_action = scheduled_mine_action(
        gpu_enabled,
        gpu_running,
        &previous_mode,
        new_mode,
        start_if_stopped,
    );

    ConfigMining::update_field(
        ConfigMiningContent::set_selected_mining_mode,
        new_mode.to_string(),
    )
    .await?;

    if !new_mode.eq_ignore_ascii_case("Eco") {
        ConfigMining::update_field(ConfigMiningContent::set_eco_alert_needed, false).await?;
    }

    SystemTrayManager::send_event(SystemTrayEvents::MiningMode(MiningModeType::from(
        new_mode.to_string(),
    )))
    .await;

    let updated_config = ConfigMining::content().await;
    EventsEmitter::emit_mining_config_loaded(&updated_config).await;

    match gpu_action {
        ScheduledMineAction::Skip => {}
        ScheduledMineAction::Start => {
            if let Err(e) = gpu::manager::GpuManager::write().await.start_mining().await {
                error!(
                    target: LOG_TARGET_APP_LOGIC,
                    "Failed to start GPU mining when applying mode {new_mode:?}: {e}"
                );
            }
        }
        ScheduledMineAction::Restart => {
            if let Err(e) = gpu::manager::GpuManager::write()
                .await
                .restart_mining()
                .await
            {
                error!(
                    target: LOG_TARGET_APP_LOGIC,
                    "Failed to restart GPU mining when applying mode {new_mode:?}: {e}"
                );
            }
        }
    }

    match cpu_action {
        ScheduledMineAction::Skip => {}
        ScheduledMineAction::Start => {
            if let Err(e) = cpu::manager::CpuManager::write().await.start_mining().await {
                error!(
                    target: LOG_TARGET_APP_LOGIC,
                    "Failed to start CPU mining when applying mode {new_mode:?}: {e}"
                );
            }
        }
        ScheduledMineAction::Restart => {
            if let Err(e) = cpu::manager::CpuManager::write()
                .await
                .restart_mining()
                .await
            {
                error!(
                    target: LOG_TARGET_APP_LOGIC,
                    "Failed to restart CPU mining when applying mode {new_mode:?}: {e}"
                );
            }
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

#[cfg(test)]
mod tests {
    use super::{ScheduledMineAction, scheduled_mine_action};

    #[test]
    fn scheduled_window_restarts_running_miner_when_mode_differs() {
        assert_eq!(
            scheduled_mine_action(true, true, "Eco", "Ludicrous", true),
            ScheduledMineAction::Restart
        );
    }

    #[test]
    fn scheduled_window_skips_restart_when_already_running_in_target_mode() {
        assert_eq!(
            scheduled_mine_action(true, true, "Ludicrous", "Ludicrous", true),
            ScheduledMineAction::Skip
        );
        assert_eq!(
            scheduled_mine_action(true, true, "ludicrous", "Ludicrous", true),
            ScheduledMineAction::Skip
        );
    }

    #[test]
    fn scheduled_window_starts_miner_when_enabled_and_idle() {
        assert_eq!(
            scheduled_mine_action(true, false, "Eco", "Ludicrous", true),
            ScheduledMineAction::Start
        );
        assert_eq!(
            scheduled_mine_action(true, false, "Ludicrous", "Ludicrous", true),
            ScheduledMineAction::Start
        );
    }

    #[test]
    fn scheduled_window_respects_disabled_miner_flag() {
        assert_eq!(
            scheduled_mine_action(false, false, "Eco", "Ludicrous", true),
            ScheduledMineAction::Skip
        );
        assert_eq!(
            scheduled_mine_action(false, true, "Eco", "Ludicrous", true),
            ScheduledMineAction::Skip
        );
    }

    #[test]
    fn manual_mode_switch_restarts_running_miner_but_leaves_idle_miner_stopped() {
        assert_eq!(
            scheduled_mine_action(true, false, "Eco", "Balanced", false),
            ScheduledMineAction::Skip
        );
        assert_eq!(
            scheduled_mine_action(true, true, "Eco", "Balanced", false),
            ScheduledMineAction::Restart
        );
        assert_eq!(
            scheduled_mine_action(true, true, "Balanced", "Balanced", false),
            ScheduledMineAction::Skip
        );
    }
}
