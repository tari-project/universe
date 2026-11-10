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

use crate::LOG_TARGET_APP_LOGIC;
use crate::configs::config_mining::{ConfigMining, ConfigMiningContent, MiningModeType};
use crate::configs::trait_config::ConfigImpl;
use crate::events_emitter::EventsEmitter;
use crate::mining::cpu::manager::CpuManager;
use crate::mining::gpu::manager::GpuManager;
use crate::systemtray_manager::{SystemTrayEvents, SystemTrayManager};

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

/// Lifecycle action required for an individual miner when a mining mode transition occurs.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum MinerModeAction {
    Skip,
    Start,
    Restart,
}

/// Snapshot of a single miner's state used to decide how a mode change should be applied.
#[derive(Debug, Clone, Copy)]
pub struct MinerModeTransition<'a> {
    pub enabled: bool,
    pub is_running: bool,
    pub current_mode: &'a str,
    pub target_mode: &'a str,
    pub start_if_stopped: bool,
}

/// Pure decision helper shared by scheduled mining windows and manual mode switches.
///
/// - Disabled miners are never started or restarted.
/// - Stopped miners start only when `start_if_stopped` is true (scheduled `Mine` window).
/// - Running miners restart when switching to a different mode, or when `Custom` mode is
///   re-applied manually after updating custom CPU/GPU percentages.
pub fn miner_mode_action(transition: MinerModeTransition<'_>) -> MinerModeAction {
    if !transition.enabled {
        return MinerModeAction::Skip;
    }
    if !transition.is_running {
        return if transition.start_if_stopped {
            MinerModeAction::Start
        } else {
            MinerModeAction::Skip
        };
    }
    let custom_reapplied_manually =
        !transition.start_if_stopped && transition.target_mode == "Custom";
    if transition.current_mode != transition.target_mode || custom_reapplied_manually {
        return MinerModeAction::Restart;
    }
    MinerModeAction::Skip
}

async fn persist_mining_mode_selection(new_mode: &str) -> Result<(), anyhow::Error> {
    ConfigMining::update_field(
        ConfigMiningContent::set_selected_mining_mode,
        new_mode.to_string(),
    )
    .await?;

    if new_mode != "Eco" {
        ConfigMining::update_field(ConfigMiningContent::set_eco_alert_needed, false).await?;
    }

    let config = ConfigMining::content().await;
    EventsEmitter::emit_mining_config_loaded(&config).await;
    SystemTrayManager::send_event(SystemTrayEvents::MiningMode(MiningModeType::from(
        new_mode.to_string(),
    )))
    .await;
    Ok(())
}

#[derive(Debug, Clone, Copy)]
enum MinerDevice {
    Gpu,
    Cpu,
}

impl MinerDevice {
    const fn label(self) -> &'static str {
        match self {
            Self::Gpu => "GPU",
            Self::Cpu => "CPU",
        }
    }

    async fn is_running(self) -> bool {
        match self {
            Self::Gpu => GpuManager::read().await.is_running(),
            Self::Cpu => CpuManager::read().await.is_running(),
        }
    }

    async fn start(self) -> Result<(), anyhow::Error> {
        match self {
            Self::Gpu => GpuManager::write().await.start_mining().await,
            Self::Cpu => CpuManager::write().await.start_mining().await,
        }
    }

    async fn restart(self) -> Result<(), anyhow::Error> {
        match self {
            Self::Gpu => GpuManager::write().await.restart_mining().await,
            Self::Cpu => CpuManager::write().await.restart_mining().await,
        }
    }
}

async fn run_miner_transition(device: MinerDevice, transition: MinerModeTransition<'_>) {
    let label = device.label();
    let target = transition.target_mode;
    match miner_mode_action(transition) {
        MinerModeAction::Skip => {}
        MinerModeAction::Start => {
            if let Err(e) = device.start().await {
                error!(
                    target: LOG_TARGET_APP_LOGIC,
                    "Failed to start {label} mining in mode {target}: {e}"
                );
            }
        }
        MinerModeAction::Restart => {
            let current = transition.current_mode;
            info!(
                target: LOG_TARGET_APP_LOGIC,
                "Restarting {label} miner to switch mode from '{current}' to '{target}'"
            );
            if let Err(e) = device.restart().await {
                error!(
                    target: LOG_TARGET_APP_LOGIC,
                    "Failed to restart {label} mining in mode {target}: {e}"
                );
            }
        }
    }
}

/// Persists `new_mode`, broadcasts the updated config and tray state, and starts or restarts
/// enabled miners according to [`miner_mode_action`].
pub async fn apply_mining_mode(
    new_mode: &str,
    start_if_stopped: bool,
) -> Result<(), anyhow::Error> {
    let before_config = ConfigMining::content().await;
    let current_mode = before_config.selected_mining_mode().clone();
    let gpu_enabled = *before_config.gpu_mining_enabled();
    let cpu_enabled = *before_config.cpu_mining_enabled();
    drop(before_config);

    persist_mining_mode_selection(new_mode).await?;

    for (device, enabled) in [(MinerDevice::Gpu, gpu_enabled), (MinerDevice::Cpu, cpu_enabled)] {
        let is_running = device.is_running().await;
        run_miner_transition(
            device,
            MinerModeTransition {
                enabled,
                is_running,
                current_mode: &current_mode,
                target_mode: new_mode,
                start_if_stopped,
            },
        )
        .await;
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn disabled_miner_is_always_skipped() {
        assert_eq!(
            miner_mode_action(MinerModeTransition {
                enabled: false,
                is_running: false,
                current_mode: "Eco",
                target_mode: "Ludicrous",
                start_if_stopped: true,
            }),
            MinerModeAction::Skip
        );
        assert_eq!(
            miner_mode_action(MinerModeTransition {
                enabled: false,
                is_running: true,
                current_mode: "Eco",
                target_mode: "Ludicrous",
                start_if_stopped: true,
            }),
            MinerModeAction::Skip
        );
    }

    #[test]
    fn scheduled_window_restarts_running_miner_when_mode_changes() {
        assert_eq!(
            miner_mode_action(MinerModeTransition {
                enabled: true,
                is_running: true,
                current_mode: "Eco",
                target_mode: "Ludicrous",
                start_if_stopped: true,
            }),
            MinerModeAction::Restart
        );
    }

    #[test]
    fn scheduled_window_does_not_restart_running_miner_when_mode_is_unchanged() {
        for mode in ["Ludicrous", "Custom"] {
            assert_eq!(
                miner_mode_action(MinerModeTransition {
                    enabled: true,
                    is_running: true,
                    current_mode: mode,
                    target_mode: mode,
                    start_if_stopped: true,
                }),
                MinerModeAction::Skip
            );
        }
    }

    #[test]
    fn scheduled_window_starts_enabled_miner_when_stopped() {
        for (current, target) in [("Eco", "Ludicrous"), ("Ludicrous", "Ludicrous")] {
            assert_eq!(
                miner_mode_action(MinerModeTransition {
                    enabled: true,
                    is_running: false,
                    current_mode: current,
                    target_mode: target,
                    start_if_stopped: true,
                }),
                MinerModeAction::Start
            );
        }
    }

    #[test]
    fn manual_mode_switch_restarts_only_running_miners_and_leaves_stopped_miners_idle() {
        assert_eq!(
            miner_mode_action(MinerModeTransition {
                enabled: true,
                is_running: true,
                current_mode: "Eco",
                target_mode: "Ludicrous",
                start_if_stopped: false,
            }),
            MinerModeAction::Restart
        );
        assert_eq!(
            miner_mode_action(MinerModeTransition {
                enabled: true,
                is_running: true,
                current_mode: "Ludicrous",
                target_mode: "Ludicrous",
                start_if_stopped: false,
            }),
            MinerModeAction::Skip
        );
        assert_eq!(
            miner_mode_action(MinerModeTransition {
                enabled: true,
                is_running: true,
                current_mode: "Custom",
                target_mode: "Custom",
                start_if_stopped: false,
            }),
            MinerModeAction::Restart
        );
        assert_eq!(
            miner_mode_action(MinerModeTransition {
                enabled: true,
                is_running: false,
                current_mode: "Eco",
                target_mode: "Ludicrous",
                start_if_stopped: false,
            }),
            MinerModeAction::Skip
        );
    }
}
