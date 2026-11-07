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

/// Whether a miner must be restarted for a mode change to take effect.
///
/// A miner reads its mode settings (CPU thread count, GPU intensity) only
/// when it starts, and `start_mining` on an already running miner returns
/// early without applying new settings. So a running miner keeps mining
/// with the old mode until it is stopped and started again. A stopped
/// miner needs no restart: the next `start_mining` picks the new mode up.
///
/// This is the single place that decides restarts on a mode change, shared
/// by the CPU and GPU paths (e.g. the event scheduler's `Mine` handler) so
/// the rule cannot drift between them.
pub fn mode_change_requires_restart(
    current_mode: &str,
    requested_mode: &str,
    is_running: bool,
) -> bool {
    is_running && current_mode != requested_mode
}

/// What a scheduled `Mine` event should do with one miner.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ScheduledMineAction {
    /// The miner is disabled: the scheduler must not turn it on.
    Skip,
    /// Call `start_mining`. Starts a stopped miner with the requested mode;
    /// a no-op for a miner already running with that mode.
    Start,
    /// Call `restart_mining`: the miner is running with a different mode, so
    /// it must be stopped and started again for the requested mode to apply.
    Restart,
}

/// Decides the action for one miner when a scheduled `Mine` event fires.
///
/// This is the whole per-miner decision of the scheduler's `Mine` handler,
/// kept pure so every combination is unit-testable: disabled miners are
/// never touched, running miners restart only on a real mode change, and
/// stopped miners simply start with the requested mode. The decision only
/// depends on the mode in config at the moment the event fires, so a mode
/// the user changed by hand while a window was active is taken into
/// account exactly like any other current mode.
pub fn scheduled_mine_action(
    miner_enabled: bool,
    is_running: bool,
    current_mode: &str,
    requested_mode: &str,
) -> ScheduledMineAction {
    if !miner_enabled {
        return ScheduledMineAction::Skip;
    }
    if mode_change_requires_restart(current_mode, requested_mode, is_running) {
        ScheduledMineAction::Restart
    } else {
        ScheduledMineAction::Start
    }
}

#[cfg(test)]
mod tests {
    use super::mode_change_requires_restart;

    #[test]
    fn test_mode_change_requires_restart_running_miner_with_different_mode() {
        assert!(mode_change_requires_restart("Eco", "Ludicrous", true));
    }

    #[test]
    fn test_mode_change_requires_restart_same_mode_keeps_miner_running() {
        assert!(!mode_change_requires_restart(
            "Ludicrous",
            "Ludicrous",
            true
        ));
    }

    #[test]
    fn test_mode_change_requires_restart_stopped_miner_starts_with_new_mode() {
        assert!(!mode_change_requires_restart("Eco", "Ludicrous", false));
    }

    #[test]
    fn test_mode_change_requires_restart_stopped_miner_same_mode() {
        assert!(!mode_change_requires_restart("Eco", "Eco", false));
    }
}

#[cfg(test)]
mod scheduled_mine_action_tests {
    use super::{ScheduledMineAction, scheduled_mine_action};

    // ----- Disabled miners are never touched (acceptance criterion 5) -----

    #[test]
    fn test_scheduled_mine_action_disabled_running_different_mode_skips() {
        assert_eq!(
            scheduled_mine_action(false, true, "Eco", "Ludicrous"),
            ScheduledMineAction::Skip
        );
    }

    #[test]
    fn test_scheduled_mine_action_disabled_running_same_mode_skips() {
        assert_eq!(
            scheduled_mine_action(false, true, "Eco", "Eco"),
            ScheduledMineAction::Skip
        );
    }

    #[test]
    fn test_scheduled_mine_action_disabled_stopped_different_mode_skips() {
        assert_eq!(
            scheduled_mine_action(false, false, "Eco", "Ludicrous"),
            ScheduledMineAction::Skip
        );
    }

    #[test]
    fn test_scheduled_mine_action_disabled_stopped_same_mode_skips() {
        assert_eq!(
            scheduled_mine_action(false, false, "Eco", "Eco"),
            ScheduledMineAction::Skip
        );
    }

    // ----- Enabled miners -----

    #[test]
    fn test_scheduled_mine_action_enabled_running_different_mode_restarts() {
        // Window fires while mining: the running miner must restart with the
        // scheduled mode's settings (acceptance criterion 1).
        assert_eq!(
            scheduled_mine_action(true, true, "Eco", "Ludicrous"),
            ScheduledMineAction::Restart
        );
    }

    #[test]
    fn test_scheduled_mine_action_enabled_running_same_mode_starts() {
        // `Start` is a no-op for a running miner, so it is not interrupted
        // (acceptance criterion 2).
        assert_eq!(
            scheduled_mine_action(true, true, "Ludicrous", "Ludicrous"),
            ScheduledMineAction::Start
        );
    }

    #[test]
    fn test_scheduled_mine_action_enabled_stopped_different_mode_starts() {
        // Window fires from a stopped state: plain start, no stop first
        // (acceptance criterion 3).
        assert_eq!(
            scheduled_mine_action(true, false, "Eco", "Ludicrous"),
            ScheduledMineAction::Start
        );
    }

    #[test]
    fn test_scheduled_mine_action_enabled_stopped_same_mode_starts() {
        assert_eq!(
            scheduled_mine_action(true, false, "Eco", "Eco"),
            ScheduledMineAction::Start
        );
    }

    // ----- Sequence: several windows and a manual change in between -----

    /// Minimal simulation of one miner across scheduler events. It mirrors
    /// the `Mine` handler: on each event the action is decided from the
    /// selected mode in config, applied, and the selected mode becomes the
    /// requested one. A manual mode change is modelled the way the frontend
    /// performs it: it sets the selected mode and restarts a running miner
    /// onto it, so config and miner stay consistent.
    #[derive(Debug)]
    struct SimulatedMiner {
        enabled: bool,
        running: bool,
        selected_mode: String,
        running_mode: String,
    }

    impl SimulatedMiner {
        fn on_mine_event(&mut self, requested_mode: &str) {
            match scheduled_mine_action(
                self.enabled,
                self.running,
                &self.selected_mode,
                requested_mode,
            ) {
                ScheduledMineAction::Skip => {}
                ScheduledMineAction::Start => {
                    if !self.running {
                        self.running = true;
                        self.running_mode = requested_mode.to_string();
                    }
                }
                ScheduledMineAction::Restart => {
                    self.running = true;
                    self.running_mode = requested_mode.to_string();
                }
            }
            self.selected_mode = requested_mode.to_string();
        }

        fn on_manual_mode_change(&mut self, mode: &str) {
            self.selected_mode = mode.to_string();
            if self.running {
                self.running_mode = mode.to_string();
            }
        }

        fn on_window_end(&mut self) {
            self.running = false;
        }
    }

    #[test]
    fn test_scheduled_mine_action_sequence_windows_and_manual_change() {
        let mut miner = SimulatedMiner {
            enabled: true,
            running: false,
            selected_mode: "Eco".to_string(),
            running_mode: String::new(),
        };

        // Window fires from a stopped state: plain start with its mode.
        miner.on_mine_event("Eco");
        assert!(miner.running);
        assert_eq!(miner.running_mode, "Eco");

        // A Ludicrous window fires while mining in Eco: restart into the
        // scheduled mode (the bug scenario from the issue).
        miner.on_mine_event("Ludicrous");
        assert_eq!(miner.running_mode, "Ludicrous");

        // A second Ludicrous window fires while the first is still active:
        // same mode as selected, the running miner is left alone.
        miner.on_mine_event("Ludicrous");
        assert_eq!(miner.running_mode, "Ludicrous");

        // Mid-window the user switches back to Eco by hand; the manual path
        // restarts the miner onto Eco and updates the selected mode.
        miner.on_manual_mode_change("Eco");
        assert_eq!(miner.running_mode, "Eco");

        // The next Ludicrous window compares against the *current* selected
        // mode (Eco after the manual change), so it restarts again.
        miner.on_mine_event("Ludicrous");
        assert_eq!(miner.running_mode, "Ludicrous");

        // Window end stops mining, as the exit callback does today.
        miner.on_window_end();
        assert!(!miner.running);

        // A later Eco window starts the stopped miner fresh with Eco.
        miner.on_mine_event("Eco");
        assert!(miner.running);
        assert_eq!(miner.running_mode, "Eco");
    }

    #[test]
    fn test_scheduled_mine_action_sequence_disabled_miner_never_starts() {
        let mut miner = SimulatedMiner {
            enabled: false,
            running: false,
            selected_mode: "Eco".to_string(),
            running_mode: String::new(),
        };

        miner.on_mine_event("Ludicrous");
        assert!(!miner.running);

        miner.on_mine_event("Eco");
        assert!(!miner.running);
    }
}
