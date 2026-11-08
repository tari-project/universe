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

use log::{error, info};
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

/// Action to take for a single miner when applying a mining mode transition.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum MinerModeAction {
    /// Leave the miner untouched (disabled, stopped during a manual mode change, or already
    /// running in the target mode).
    Skip,
    /// Start a stopped miner (used when entering a scheduled mining window).
    Start,
    /// Stop and restart a running miner so the new mode's settings take effect.
    Restart,
}

/// Pure decision function for a single miner during a mode change or scheduled `Mine` window.
///
/// - Disabled miners (`!enabled`) are never started or restarted (`Skip`).
/// - Running miners (`is_running`):
///   - When the mode changes (`current_mode != target_mode`), or when re-applying `"Custom"`
///     during a manual change (`!start_if_stopped && target_mode == "Custom"`), restart so the
///     updated thread count / GPU intensity takes effect (`Restart`).
///   - When the scheduled or selected mode already matches the running mode, keep the miner
///     running uninterrupted (`Skip`).
/// - Stopped miners (`!is_running`):
///   - Start if `start_if_stopped` is `true` (entering a scheduled window) (`Start`).
///   - Stay stopped on a manual mode change (`Skip`).
pub fn miner_mode_action(
    enabled: bool,
    is_running: bool,
    current_mode: &str,
    target_mode: &str,
    start_if_stopped: bool,
) -> MinerModeAction {
    if !enabled {
        return MinerModeAction::Skip;
    }
    if is_running {
        if current_mode != target_mode || (!start_if_stopped && target_mode == "Custom") {
            MinerModeAction::Restart
        } else {
            MinerModeAction::Skip
        }
    } else if start_if_stopped {
        MinerModeAction::Start
    } else {
        MinerModeAction::Skip
    }
}

/// Applies a mining mode change and starts or restarts enabled miners as required.
///
/// Shared by:
/// - `EventScheduler`'s `Mine` handler (`start_if_stopped = true`),
/// - `commands::select_mining_mode` (`start_if_stopped = false`), and
/// - `mcp::tools::mining::set_mining_mode` (`start_if_stopped = false`).
pub async fn apply_mining_mode(
    new_mode: &str,
    start_if_stopped: bool,
) -> Result<(), anyhow::Error> {
    let current_mode = ConfigMining::content().await.selected_mining_mode().clone();

    ConfigMining::update_field(
        ConfigMiningContent::set_selected_mining_mode,
        new_mode.to_string(),
    )
    .await?;

    if new_mode != "Eco" {
        ConfigMining::update_field(ConfigMiningContent::set_eco_alert_needed, false).await?;
    }

    SystemTrayManager::send_event(SystemTrayEvents::MiningMode(MiningModeType::from(
        new_mode.to_string(),
    )))
    .await;

    let config = ConfigMining::content().await;
    EventsEmitter::emit_mining_config_loaded(&config).await;

    let gpu_enabled = *config.gpu_mining_enabled();
    let cpu_enabled = *config.cpu_mining_enabled();

    {
        let mut gpu_manager = gpu::manager::GpuManager::write().await;
        let gpu_running = gpu_manager.is_running();
        let gpu_action = miner_mode_action(
            gpu_enabled,
            gpu_running,
            &current_mode,
            new_mode,
            start_if_stopped,
        );
        match gpu_action {
            MinerModeAction::Skip => {}
            MinerModeAction::Start => {
                info!(
                    target: LOG_TARGET_APP_LOGIC,
                    "Starting stopped GPU miner in mode '{new_mode}'"
                );
                if let Err(e) = gpu_manager.start_mining().await {
                    error!(
                        target: LOG_TARGET_APP_LOGIC,
                        "Failed to start GPU mining in mode '{new_mode}': {e}"
                    );
                }
            }
            MinerModeAction::Restart => {
                info!(
                    target: LOG_TARGET_APP_LOGIC,
                    "Restarting GPU miner to switch mode from '{current_mode}' to '{new_mode}'"
                );
                if let Err(e) = gpu_manager.restart_mining().await {
                    error!(
                        target: LOG_TARGET_APP_LOGIC,
                        "Failed to restart GPU mining for mode '{new_mode}': {e}"
                    );
                }
            }
        }
    }

    {
        let mut cpu_manager = cpu::manager::CpuManager::write().await;
        let cpu_running = cpu_manager.is_running();
        let cpu_action = miner_mode_action(
            cpu_enabled,
            cpu_running,
            &current_mode,
            new_mode,
            start_if_stopped,
        );
        match cpu_action {
            MinerModeAction::Skip => {}
            MinerModeAction::Start => {
                info!(
                    target: LOG_TARGET_APP_LOGIC,
                    "Starting stopped CPU miner in mode '{new_mode}'"
                );
                if let Err(e) = cpu_manager.start_mining().await {
                    error!(
                        target: LOG_TARGET_APP_LOGIC,
                        "Failed to start CPU mining in mode '{new_mode}': {e}"
                    );
                }
            }
            MinerModeAction::Restart => {
                info!(
                    target: LOG_TARGET_APP_LOGIC,
                    "Restarting CPU miner to switch mode from '{current_mode}' to '{new_mode}'"
                );
                if let Err(e) = cpu_manager.restart_mining().await {
                    error!(
                        target: LOG_TARGET_APP_LOGIC,
                        "Failed to restart CPU mining for mode '{new_mode}': {e}"
                    );
                }
            }
        }
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::{MinerModeAction, miner_mode_action};

    #[test]
    fn disabled_miner_is_never_started_or_restarted() {
        for is_running in [false, true] {
            for start_if_stopped in [false, true] {
                assert_eq!(
                    miner_mode_action(false, is_running, "Eco", "Ludicrous", start_if_stopped),
                    MinerModeAction::Skip
                );
                assert_eq!(
                    miner_mode_action(false, is_running, "Eco", "Eco", start_if_stopped),
                    MinerModeAction::Skip
                );
            }
        }
    }

    #[test]
    fn scheduled_window_restarts_running_miner_when_mode_changes() {
        assert_eq!(
            miner_mode_action(true, true, "Eco", "Ludicrous", true),
            MinerModeAction::Restart
        );
    }

    #[test]
    fn scheduled_window_keeps_running_miner_when_mode_matches() {
        assert_eq!(
            miner_mode_action(true, true, "Ludicrous", "Ludicrous", true),
            MinerModeAction::Skip
        );
        assert_eq!(
            miner_mode_action(true, true, "Custom", "Custom", true),
            MinerModeAction::Skip
        );
    }

    #[test]
    fn scheduled_window_starts_stopped_enabled_miner() {
        assert_eq!(
            miner_mode_action(true, false, "Eco", "Ludicrous", true),
            MinerModeAction::Start
        );
        assert_eq!(
            miner_mode_action(true, false, "Eco", "Eco", true),
            MinerModeAction::Start
        );
    }

    #[test]
    fn manual_mode_change_restarts_running_miner_and_leaves_stopped_miner_stopped() {
        assert_eq!(
            miner_mode_action(true, true, "Eco", "Ludicrous", false),
            MinerModeAction::Restart
        );
        assert_eq!(
            miner_mode_action(true, true, "Custom", "Custom", false),
            MinerModeAction::Restart
        );
        assert_eq!(
            miner_mode_action(true, true, "Eco", "Eco", false),
            MinerModeAction::Skip
        );
        assert_eq!(
            miner_mode_action(true, false, "Eco", "Ludicrous", false),
            MinerModeAction::Skip
        );
    }
}
