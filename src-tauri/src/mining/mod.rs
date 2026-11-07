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

pub mod cpu;
pub mod gpu;
pub mod pools;

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

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ScheduledMineAction {
    Skip,
    Start,
    Restart,
}

/// Helper that determines the per-miner action required when applying a scheduled mining mode.
///
/// Returns:
/// - `ScheduledMineAction::Skip` if the miner is disabled, or if it is already running in the target mode.
/// - `ScheduledMineAction::Restart` if the miner is currently running and the mode changed.
/// - `ScheduledMineAction::Start` if the miner is enabled, currently stopped, and `start_if_stopped` is true.
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
    if is_running {
        if current_mode == target_mode {
            ScheduledMineAction::Skip
        } else {
            ScheduledMineAction::Restart
        }
    } else if start_if_stopped {
        ScheduledMineAction::Start
    } else {
        ScheduledMineAction::Skip
    }
}

/// Helper to apply a mining mode change.
///
/// If miners are already running and the mode changed, stops and restarts them
/// so that the new mode's settings (e.g. xmrig thread count, GPU power levels) take effect.
/// If `start_if_stopped` is true (e.g. when entering a scheduled mining window),
/// miners that are enabled in config but currently stopped will be started.
pub async fn switch_mining_mode(new_mode: &str, start_if_stopped: bool) -> Result<(), anyhow::Error> {
    let current_mode = crate::configs::config_mining::ConfigMining::content()
        .await
        .selected_mining_mode()
        .clone();
    let mode_changed = current_mode.as_str() != new_mode;

    let cpu_running = cpu::manager::CpuManager::read().await.is_running();
    let gpu_running = gpu::manager::GpuManager::read().await.is_running();

    if mode_changed {
        log::info!(
            target: crate::consts::LOG_TARGET_APP_LOGIC,
            "Switching mining mode from '{current_mode}' to '{new_mode}' (cpu_running={cpu_running}, gpu_running={gpu_running})"
        );

        crate::configs::config_mining::ConfigMining::update_field(
            crate::configs::config_mining::ConfigMiningContent::set_selected_mining_mode,
            new_mode.to_string(),
        )
        .await?;

        if new_mode != "Eco" {
            crate::configs::config_mining::ConfigMining::update_field(
                crate::configs::config_mining::ConfigMiningContent::set_eco_alert_needed,
                false,
            )
            .await?;
        }

        crate::system_tray::SystemTrayManager::send_event(
            crate::system_tray::SystemTrayEvents::MiningMode(
                crate::types::configs::MiningModeType::from(new_mode.to_string()),
            ),
        )
        .await;

        let config = crate::configs::config_mining::ConfigMining::content().await;
        crate::events_emitter::EventsEmitter::emit_mining_config_loaded(&config).await;
    } else {
        log::info!(
            target: crate::consts::LOG_TARGET_APP_LOGIC,
            "Mining mode is already '{new_mode}' (cpu_running={cpu_running}, gpu_running={gpu_running})"
        );
    }

    let config = crate::configs::config_mining::ConfigMining::content().await;
    let cpu_action = scheduled_mine_action(
        *config.cpu_mining_enabled(),
        cpu_running,
        &current_mode,
        new_mode,
        start_if_stopped,
    );
    let gpu_action = scheduled_mine_action(
        *config.gpu_mining_enabled(),
        gpu_running,
        &current_mode,
        new_mode,
        start_if_stopped,
    );

    log::info!(
        target: crate::consts::LOG_TARGET_APP_LOGIC,
        "Mining mode switch evaluation: cpu_action={cpu_action:?}, gpu_action={gpu_action:?}"
    );

    match cpu_action {
        ScheduledMineAction::Restart => {
            log::info!(
                target: crate::consts::LOG_TARGET_APP_LOGIC,
                "Restarting CPU miner for new mode: {new_mode}"
            );
            let mut cpu_mgr = cpu::manager::CpuManager::write().await;
            if let Err(e) = cpu_mgr.stop_mining().await {
                log::error!(
                    target: crate::consts::LOG_TARGET_APP_LOGIC,
                    "Failed to stop CPU miner during mode switch: {e}"
                );
            }
            if let Err(e) = cpu_mgr.start_mining().await {
                log::error!(
                    target: crate::consts::LOG_TARGET_APP_LOGIC,
                    "Failed to restart CPU miner during mode switch: {e}"
                );
            }
        }
        ScheduledMineAction::Start => {
            log::info!(
                target: crate::consts::LOG_TARGET_APP_LOGIC,
                "Starting stopped CPU miner for scheduled window"
            );
            if let Err(e) = cpu::manager::CpuManager::write().await.start_mining().await {
                log::error!(
                    target: crate::consts::LOG_TARGET_APP_LOGIC,
                    "Failed to start CPU miner during scheduled window: {e}"
                );
            }
        }
        ScheduledMineAction::Skip => {}
    }

    match gpu_action {
        ScheduledMineAction::Restart => {
            log::info!(
                target: crate::consts::LOG_TARGET_APP_LOGIC,
                "Restarting GPU miner for new mode: {new_mode}"
            );
            let mut gpu_mgr = gpu::manager::GpuManager::write().await;
            if let Err(e) = gpu_mgr.stop_mining().await {
                log::error!(
                    target: crate::consts::LOG_TARGET_APP_LOGIC,
                    "Failed to stop GPU miner during mode switch: {e}"
                );
            }
            if let Err(e) = gpu_mgr.start_mining().await {
                log::error!(
                    target: crate::consts::LOG_TARGET_APP_LOGIC,
                    "Failed to restart GPU miner during mode switch: {e}"
                );
            }
        }
        ScheduledMineAction::Start => {
            log::info!(
                target: crate::consts::LOG_TARGET_APP_LOGIC,
                "Starting stopped GPU miner for scheduled window"
            );
            if let Err(e) = gpu::manager::GpuManager::write().await.start_mining().await {
                log::error!(
                    target: crate::consts::LOG_TARGET_APP_LOGIC,
                    "Failed to start GPU miner during scheduled window: {e}"
                );
            }
        }
        ScheduledMineAction::Skip => {}
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_scheduled_action_skip_when_disabled() {
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
    fn test_scheduled_action_start_when_stopped() {
        assert_eq!(
            scheduled_mine_action(true, false, "Eco", "Ludicrous", true),
            ScheduledMineAction::Start
        );
        assert_eq!(
            scheduled_mine_action(true, false, "Eco", "Ludicrous", false),
            ScheduledMineAction::Skip
        );
    }

    #[test]
    fn test_scheduled_action_restart_when_running_mode_differs() {
        assert_eq!(
            scheduled_mine_action(true, true, "Eco", "Ludicrous", true),
            ScheduledMineAction::Restart
        );
        assert_eq!(
            scheduled_mine_action(true, true, "Eco", "Ludicrous", false),
            ScheduledMineAction::Restart
        );
    }

    #[test]
    fn test_scheduled_action_skip_when_running_mode_matches() {
        assert_eq!(
            scheduled_mine_action(true, true, "Ludicrous", "Ludicrous", true),
            ScheduledMineAction::Skip
        );
        assert_eq!(
            scheduled_mine_action(true, true, "Ludicrous", "Ludicrous", false),
            ScheduledMineAction::Skip
        );
    }
}

