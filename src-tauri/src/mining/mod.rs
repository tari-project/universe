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

/// Determines `(should_stop_first, should_start_after)` for a single miner (CPU or GPU)
/// when applying a mining mode.
///
/// - `enabled`: whether this miner type is enabled in `ConfigMining`.
/// - `was_running`: whether this miner process is currently running.
/// - `mode_changed`: whether the target mining mode differs from the currently selected mode.
/// - `start_enabled_miners`: `true` for a scheduled `Mine` window (which starts enabled miners
///   even if they were stopped prior to the window); `false` for a manual mode change (which only
///   restarts miners that were already running).
pub fn plan_miner_mode_transition(
    enabled: bool,
    was_running: bool,
    mode_changed: bool,
    start_enabled_miners: bool,
) -> (bool, bool) {
    let should_stop = was_running && mode_changed;
    let should_start = enabled
        && if start_enabled_miners {
            !was_running || mode_changed
        } else {
            was_running && mode_changed
        };
    (should_stop, should_start)
}

/// Shared backend helper that applies `mode` and coordinates stopping/restarting active miners.
///
/// Used by:
/// - `EventScheduler::handle_enter_callback` (`SchedulerEventType::Mine`, with `start_enabled_miners = true`)
/// - `commands::select_mining_mode` and `mcp::tools::mining::set_mining_mode` (`start_enabled_miners = false`)
pub async fn apply_mining_mode(
    mode: String,
    start_enabled_miners: bool,
) -> Result<(), anyhow::Error> {
    use crate::configs::config_mining::{ConfigMining, ConfigMiningContent, MiningModeType};
    use crate::configs::trait_config::ConfigImpl;
    use crate::constants::LOG_TARGET_APP_LOGIC;
    use crate::events_emitter::EventsEmitter;
    use crate::mining::cpu::manager::CpuManager;
    use crate::mining::gpu::manager::GpuManager;
    use crate::systemtray_manager::{SystemTrayEvents, SystemTrayManager};

    let previous_config = ConfigMining::content().await;
    let mode_changed = previous_config.selected_mining_mode() != &mode;

    let gpu_was_running = GpuManager::read().await.is_running();
    let cpu_was_running = CpuManager::read().await.is_running();

    let (stop_gpu, _) = plan_miner_mode_transition(
        *previous_config.gpu_mining_enabled(),
        gpu_was_running,
        mode_changed,
        start_enabled_miners,
    );
    let (stop_cpu, _) = plan_miner_mode_transition(
        *previous_config.cpu_mining_enabled(),
        cpu_was_running,
        mode_changed,
        start_enabled_miners,
    );

    if stop_gpu {
        if let Err(e) = GpuManager::write().await.stop_mining().await {
            log::error!(
                target: LOG_TARGET_APP_LOGIC,
                "Failed to stop GPU mining before switching to mode {mode:?}: {e}"
            );
        }
    }

    if stop_cpu {
        if let Err(e) = CpuManager::write().await.stop_mining().await {
            log::error!(
                target: LOG_TARGET_APP_LOGIC,
                "Failed to stop CPU mining before switching to mode {mode:?}: {e}"
            );
        }
    }

    ConfigMining::update_field(ConfigMiningContent::set_selected_mining_mode, mode.clone()).await?;

    if mode != "Eco" {
        ConfigMining::update_field(ConfigMiningContent::set_eco_alert_needed, false).await?;
    }

    SystemTrayManager::send_event(SystemTrayEvents::MiningMode(MiningModeType::from(
        mode.clone(),
    )))
    .await;

    let config = ConfigMining::content().await;
    EventsEmitter::emit_mining_config_loaded(&config).await;

    let (_, start_gpu) = plan_miner_mode_transition(
        *config.gpu_mining_enabled(),
        gpu_was_running,
        mode_changed,
        start_enabled_miners,
    );
    let (_, start_cpu) = plan_miner_mode_transition(
        *config.cpu_mining_enabled(),
        cpu_was_running,
        mode_changed,
        start_enabled_miners,
    );

    if start_gpu {
        if let Err(e) = GpuManager::write().await.start_mining().await {
            log::error!(
                target: LOG_TARGET_APP_LOGIC,
                "Failed to start GPU mining in mode {mode:?}: {e}"
            );
        }
    }

    if start_cpu {
        if let Err(e) = CpuManager::write().await.start_mining().await {
            log::error!(
                target: LOG_TARGET_APP_LOGIC,
                "Failed to start CPU mining in mode {mode:?}: {e}"
            );
        }
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::plan_miner_mode_transition;

    #[test]
    fn scheduled_window_restarts_running_enabled_miner_when_mode_changes() {
        let (should_stop, should_start) = plan_miner_mode_transition(true, true, true, true);
        assert!(should_stop);
        assert!(should_start);
    }

    #[test]
    fn scheduled_window_does_not_restart_running_miner_when_mode_is_unchanged() {
        let (should_stop, should_start) = plan_miner_mode_transition(true, true, false, true);
        assert!(!should_stop);
        assert!(!should_start);
    }

    #[test]
    fn scheduled_window_starts_stopped_enabled_miner_regardless_of_mode_change() {
        assert_eq!(plan_miner_mode_transition(true, false, true, true), (false, true));
        assert_eq!(plan_miner_mode_transition(true, false, false, true), (false, true));
    }

    #[test]
    fn scheduled_window_never_starts_disabled_miner() {
        assert_eq!(plan_miner_mode_transition(false, false, true, true), (false, false));
        assert_eq!(plan_miner_mode_transition(false, false, false, true), (false, false));
        assert_eq!(plan_miner_mode_transition(false, true, true, true), (true, false));
    }

    #[test]
    fn manual_mode_change_only_restarts_previously_running_enabled_miners() {
        assert_eq!(plan_miner_mode_transition(true, true, true, false), (true, true));
        assert_eq!(plan_miner_mode_transition(true, false, true, false), (false, false));
        assert_eq!(plan_miner_mode_transition(true, true, false, false), (false, false));
    }
}

