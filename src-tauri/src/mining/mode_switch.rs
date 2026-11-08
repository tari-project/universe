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

//! Applies a selected mining mode to the miner processes.
//!
//! A mode is not a live setting of a miner process: xmrig reads its `--threads`
//! value and the GPU miners read their intensity when they spawn. A process that
//! is already running therefore keeps the settings of the mode it was started
//! with, even after `selected_mining_mode` in the config has changed.
//!
//! [`apply_mining_mode`] is the single place that performs the stop-then-start
//! needed to make a mode change reach running miners. The scheduled-window
//! handler, the `select_mining_mode` command, and the MCP tool all use it, so
//! they cannot drift apart again.

use std::sync::LazyLock;

use anyhow::{Context, anyhow};
use log::info;
use tokio::sync::Mutex;

use crate::{
    LOG_TARGET_APP_LOGIC,
    configs::{
        config_mining::{ConfigMining, ConfigMiningContent, MiningModeType},
        trait_config::ConfigImpl,
    },
    events_emitter::EventsEmitter,
    mining::{cpu::manager::CpuManager, gpu::manager::GpuManager},
    systemtray_manager::{SystemTrayEvents, SystemTrayManager},
};

/// Serializes mode applications. The scheduler, the command, and the MCP tool
/// can otherwise interleave and leave the config and the miners on different
/// modes (for example two windows starting with different modes at once).
static MODE_SWITCH_LOCK: LazyLock<Mutex<()>> = LazyLock::new(|| Mutex::new(()));

/// Where a mode application came from. The source decides what to do with a
/// miner that is enabled but not running.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ModeSwitchSource {
    /// A scheduled mining window is starting. Starting the window from a
    /// stopped state has always started the enabled miners, so keep doing it.
    ScheduledWindow,
    /// A user or agent selected a mode. Selecting a mode does not start mining;
    /// only miners that are already running are restarted.
    ManualSelection,
}

/// What to do with one miner while applying a mode.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum MinerModeAction {
    /// Leave the process alone: it is disabled, stopped during a manual mode
    /// change, or already running with the requested settings.
    Keep,
    /// Start an enabled miner that a scheduled window found stopped.
    Start,
    /// Stop and start a running miner so it picks up the requested mode.
    Restart,
}

/// Decides what to do with one miner.
///
/// `applied_mode` is the mode the running process was started with, not the
/// mode currently saved in the config. Those differ exactly in the situation
/// this module exists for: the config has already been switched, but the
/// process still runs the old mode. Tracking the applied mode also lets a
/// failed restart recover on the next window instead of being masked by a
/// config that claims the new mode.
pub fn plan_miner_mode(
    source: ModeSwitchSource,
    enabled: bool,
    is_running: bool,
    applied_mode: Option<&str>,
    target_mode: &str,
) -> MinerModeAction {
    if !enabled {
        return MinerModeAction::Keep;
    }

    if !is_running {
        return match source {
            ModeSwitchSource::ScheduledWindow => MinerModeAction::Start,
            ModeSwitchSource::ManualSelection => MinerModeAction::Keep,
        };
    }

    if applied_mode == Some(target_mode) {
        // A manual Custom selection re-applies edited power levels even though
        // the mode name did not change. The dialog saves new percentages and
        // then selects Custom; keeping the process would ignore those values.
        if source == ModeSwitchSource::ManualSelection && target_mode == "Custom" {
            return MinerModeAction::Restart;
        }
        return MinerModeAction::Keep;
    }

    // Unknown applied mode (a process running without a recorded start, or a
    // failed earlier switch) is treated as a mismatch: restarting once is
    // safe, whereas keeping it could leave the miner on the wrong mode forever.
    MinerModeAction::Restart
}

/// Applies `target_mode` and restarts the miners that need it.
///
/// The config is updated first so a start reads the new mode's settings, then
/// each enabled miner is started or restarted according to
/// [`plan_miner_mode`]. Disabled miners are never touched, and a scheduled
/// window still starts an enabled miner that was stopped, exactly as before.
///
/// Returns an error if the mode could not be saved or if a miner failed to
/// start. Both miners are attempted even when one fails, so a GPU problem does
/// not also leave a CPU miner on the old mode. The caller decides whether to
/// log (scheduler) or propagate (command/MCP) the error.
pub async fn apply_mining_mode(
    target_mode: &str,
    source: ModeSwitchSource,
) -> Result<(), anyhow::Error> {
    let _mode_switch = MODE_SWITCH_LOCK.lock().await;

    let config = ConfigMining::content().await;
    let previous_mode = config.selected_mining_mode().clone();
    let cpu_enabled = *config.cpu_mining_enabled();
    let gpu_enabled = *config.gpu_mining_enabled();

    info!(
        target: LOG_TARGET_APP_LOGIC,
        "Applying mining mode '{target_mode}' (source {source:?}, previous '{previous_mode}', cpu_enabled {cpu_enabled}, gpu_enabled {gpu_enabled})"
    );

    ConfigMining::update_field(
        ConfigMiningContent::set_selected_mining_mode,
        target_mode.to_string(),
    )
    .await
    .context("saving the selected mining mode")?;

    if target_mode != "Eco" {
        ConfigMining::update_field(ConfigMiningContent::set_eco_alert_needed, false)
            .await
            .context("clearing the Eco alert")?;
    }

    SystemTrayManager::send_event(SystemTrayEvents::MiningMode(MiningModeType::from(
        target_mode.to_string(),
    )))
    .await;

    EventsEmitter::emit_mining_config_loaded(&ConfigMining::content().await).await;

    let mut errors = Vec::new();
    if let Err(e) = apply_to_gpu_miner(target_mode, source, gpu_enabled).await {
        errors.push(format!("GPU miner: {e:#}"));
    }
    if let Err(e) = apply_to_cpu_miner(target_mode, source, cpu_enabled).await {
        errors.push(format!("CPU miner: {e:#}"));
    }

    if errors.is_empty() {
        Ok(())
    } else {
        Err(anyhow!(
            "Failed to apply mining mode '{target_mode}': {}",
            errors.join("; ")
        ))
    }
}

async fn apply_to_gpu_miner(
    target_mode: &str,
    source: ModeSwitchSource,
    enabled: bool,
) -> Result<(), anyhow::Error> {
    if !enabled {
        info!(target: LOG_TARGET_APP_LOGIC, "GPU mining is disabled; leaving the GPU miner untouched");
        return Ok(());
    }

    let mut manager = GpuManager::write().await;
    let action = plan_miner_mode(
        source,
        enabled,
        manager.is_running(),
        manager.applied_mining_mode(),
        target_mode,
    );

    match action {
        MinerModeAction::Keep => {
            info!(target: LOG_TARGET_APP_LOGIC, "GPU miner already has the requested mode or stays stopped");
            Ok(())
        }
        MinerModeAction::Start => {
            info!(target: LOG_TARGET_APP_LOGIC, "Starting stopped GPU miner in mode '{target_mode}'");
            manager
                .start_mining()
                .await
                .context("starting the GPU miner")
        }
        MinerModeAction::Restart => {
            info!(
                target: LOG_TARGET_APP_LOGIC,
                "Restarting GPU miner for mode '{target_mode}' (was '{}')",
                manager.applied_mining_mode().unwrap_or("unknown")
            );
            manager
                .restart_mining()
                .await
                .context("restarting the GPU miner")
        }
    }
}

async fn apply_to_cpu_miner(
    target_mode: &str,
    source: ModeSwitchSource,
    enabled: bool,
) -> Result<(), anyhow::Error> {
    if !enabled {
        info!(target: LOG_TARGET_APP_LOGIC, "CPU mining is disabled; leaving the CPU miner untouched");
        return Ok(());
    }

    let mut manager = CpuManager::write().await;
    let action = plan_miner_mode(
        source,
        enabled,
        manager.is_running(),
        manager.applied_mining_mode(),
        target_mode,
    );

    match action {
        MinerModeAction::Keep => {
            info!(target: LOG_TARGET_APP_LOGIC, "CPU miner already has the requested mode or stays stopped");
            Ok(())
        }
        MinerModeAction::Start => {
            info!(target: LOG_TARGET_APP_LOGIC, "Starting stopped CPU miner in mode '{target_mode}'");
            manager
                .start_mining()
                .await
                .context("starting the CPU miner")
        }
        MinerModeAction::Restart => {
            info!(
                target: LOG_TARGET_APP_LOGIC,
                "Restarting CPU miner for mode '{target_mode}' (was '{}')",
                manager.applied_mining_mode().unwrap_or("unknown")
            );
            manager
                .restart_mining()
                .await
                .context("restarting the CPU miner")
        }
    }
}

#[cfg(test)]
mod tests {
    use super::{MinerModeAction, ModeSwitchSource, plan_miner_mode};

    #[test]
    fn a_scheduled_window_restarts_a_running_miner_on_a_different_mode() {
        assert_eq!(
            plan_miner_mode(
                ModeSwitchSource::ScheduledWindow,
                true,
                true,
                Some("Eco"),
                "Ludicrous"
            ),
            MinerModeAction::Restart
        );
    }

    #[test]
    fn a_scheduled_window_leaves_a_running_miner_on_the_same_mode_alone() {
        assert_eq!(
            plan_miner_mode(
                ModeSwitchSource::ScheduledWindow,
                true,
                true,
                Some("Ludicrous"),
                "Ludicrous"
            ),
            MinerModeAction::Keep
        );
    }

    #[test]
    fn a_scheduled_window_starts_an_enabled_stopped_miner() {
        assert_eq!(
            plan_miner_mode(
                ModeSwitchSource::ScheduledWindow,
                true,
                false,
                None,
                "Ludicrous"
            ),
            MinerModeAction::Start
        );
    }

    #[test]
    fn a_manual_mode_change_restarts_a_running_miner_on_a_different_mode() {
        assert_eq!(
            plan_miner_mode(
                ModeSwitchSource::ManualSelection,
                true,
                true,
                Some("Eco"),
                "Ludicrous"
            ),
            MinerModeAction::Restart
        );
    }

    #[test]
    fn a_manual_mode_change_does_not_start_a_stopped_miner() {
        assert_eq!(
            plan_miner_mode(
                ModeSwitchSource::ManualSelection,
                true,
                false,
                None,
                "Ludicrous"
            ),
            MinerModeAction::Keep
        );
    }

    #[test]
    fn a_disabled_miner_is_never_started_or_restarted() {
        for is_running in [false, true] {
            for source in [
                ModeSwitchSource::ScheduledWindow,
                ModeSwitchSource::ManualSelection,
            ] {
                assert_eq!(
                    plan_miner_mode(source, false, is_running, Some("Eco"), "Ludicrous"),
                    MinerModeAction::Keep
                );
            }
        }
    }

    #[test]
    fn a_running_miner_with_an_unknown_applied_mode_is_restarted() {
        assert_eq!(
            plan_miner_mode(
                ModeSwitchSource::ScheduledWindow,
                true,
                true,
                None,
                "Ludicrous"
            ),
            MinerModeAction::Restart
        );
    }

    #[test]
    fn a_manual_custom_selection_reapplies_edited_power_levels() {
        assert_eq!(
            plan_miner_mode(
                ModeSwitchSource::ManualSelection,
                true,
                true,
                Some("Custom"),
                "Custom"
            ),
            MinerModeAction::Restart
        );
    }

    #[test]
    fn a_scheduled_custom_window_does_not_restart_a_matching_miner() {
        assert_eq!(
            plan_miner_mode(
                ModeSwitchSource::ScheduledWindow,
                true,
                true,
                Some("Custom"),
                "Custom"
            ),
            MinerModeAction::Keep
        );
    }

    #[test]
    fn a_manual_non_custom_selection_does_not_restart_a_matching_miner() {
        assert_eq!(
            plan_miner_mode(
                ModeSwitchSource::ManualSelection,
                true,
                true,
                Some("Ludicrous"),
                "Ludicrous"
            ),
            MinerModeAction::Keep
        );
    }
}
