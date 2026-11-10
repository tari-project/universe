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

//! One place that applies a mining mode to the CPU and GPU miners.
//!
//! `start_mining` returns immediately when a miner is already running, so a new mode never
//! reaches a process that was started earlier. Changing mode has to stop that process first.
//! The scheduler, the mode selector, and the MCP tool all go through here so they agree.

use log::{error, info};

use crate::LOG_TARGET_APP_LOGIC;
use crate::configs::config_mining::{ConfigMining, ConfigMiningContent};
use crate::configs::trait_config::ConfigImpl;
use crate::mining::cpu::manager::CpuManager;
use crate::mining::gpu::manager::GpuManager;

/// What to do with one miner when a mode is applied.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum MinerModeAction {
    /// Leave the process alone. A disabled miner is never started from here.
    Leave,
    /// The miner is enabled and stopped. Start it so it reads the mode just saved.
    Start,
    /// The miner is running on a different mode. Stop it, then start it again.
    Restart,
}

/// Decides one miner's action.
///
/// `start_if_stopped` is for a scheduled window, which should start an enabled miner that
/// is currently stopped. A manual change passes `false` so a miner the user turned off stays off.
pub fn miner_mode_action(
    enabled: bool,
    running: bool,
    mode_changed: bool,
    start_if_stopped: bool,
) -> MinerModeAction {
    if !enabled {
        return MinerModeAction::Leave;
    }
    if running {
        return if mode_changed {
            MinerModeAction::Restart
        } else {
            MinerModeAction::Leave
        };
    }
    if start_if_stopped {
        MinerModeAction::Start
    } else {
        MinerModeAction::Leave
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct MiningModePlan {
    pub previous_mode: String,
    pub mode: String,
    pub mode_changed: bool,
    pub cpu: MinerModeAction,
    pub gpu: MinerModeAction,
}

pub async fn plan_mining_mode_switch(mode: &str, start_if_stopped: bool) -> MiningModePlan {
    let config = ConfigMining::content().await;
    let previous_mode = config.selected_mining_mode().clone();
    let mode_changed = previous_mode != mode;
    let cpu_enabled = *config.cpu_mining_enabled();
    let gpu_enabled = *config.gpu_mining_enabled();
    let cpu_running = CpuManager::read().await.is_running();
    let gpu_running = GpuManager::read().await.is_running();
    MiningModePlan {
        previous_mode,
        mode: mode.to_string(),
        mode_changed,
        cpu: miner_mode_action(cpu_enabled, cpu_running, mode_changed, start_if_stopped),
        gpu: miner_mode_action(gpu_enabled, gpu_running, mode_changed, start_if_stopped),
    }
}

/// Saves `mode`, then starts or restarts only the miners [`plan_mining_mode_switch`] selected.
///
/// The mode is saved before any start, because the miner reads the selected mode while it
/// builds its arguments. A miner that fails to stop is not started: `start_mining` would
/// see it still running and return without applying the new settings.
pub async fn apply_mining_mode(mode: String, start_if_stopped: bool) -> Result<(), anyhow::Error> {
    let plan = plan_mining_mode_switch(&mode, start_if_stopped).await;
    info!(
        target: LOG_TARGET_APP_LOGIC,
        "Applying mining mode '{}' -> '{}' (changed={}): CPU {:?}, GPU {:?}",
        plan.previous_mode, plan.mode, plan.mode_changed, plan.cpu, plan.gpu
    );

    ConfigMining::update_field(ConfigMiningContent::set_selected_mining_mode, mode.clone()).await?;

    apply_cpu(plan.cpu, &plan.mode).await;
    apply_gpu(plan.gpu, &plan.mode).await;
    Ok(())
}

async fn apply_cpu(action: MinerModeAction, mode: &str) {
    match action {
        MinerModeAction::Leave => {
            info!(target: LOG_TARGET_APP_LOGIC, "CPU miner left unchanged for mode {mode}");
        }
        MinerModeAction::Start => {
            info!(target: LOG_TARGET_APP_LOGIC, "Starting CPU miner in mode {mode}");
            if let Err(e) = CpuManager::write().await.start_mining().await {
                error!(target: LOG_TARGET_APP_LOGIC, "Failed to start CPU miner in mode {mode}: {e}");
            }
        }
        MinerModeAction::Restart => {
            info!(target: LOG_TARGET_APP_LOGIC, "Restarting CPU miner to apply mode {mode}");
            if let Err(e) = CpuManager::write().await.stop_mining().await {
                error!(target: LOG_TARGET_APP_LOGIC, "Failed to stop CPU miner before applying mode {mode}: {e}");
                return;
            }
            if let Err(e) = CpuManager::write().await.start_mining().await {
                error!(target: LOG_TARGET_APP_LOGIC, "Failed to start CPU miner in mode {mode}: {e}");
            }
        }
    }
}

async fn apply_gpu(action: MinerModeAction, mode: &str) {
    match action {
        MinerModeAction::Leave => {
            info!(target: LOG_TARGET_APP_LOGIC, "GPU miner left unchanged for mode {mode}");
        }
        MinerModeAction::Start => {
            info!(target: LOG_TARGET_APP_LOGIC, "Starting GPU miner in mode {mode}");
            if let Err(e) = GpuManager::write().await.start_mining().await {
                error!(target: LOG_TARGET_APP_LOGIC, "Failed to start GPU miner in mode {mode}: {e}");
            }
        }
        MinerModeAction::Restart => {
            info!(target: LOG_TARGET_APP_LOGIC, "Restarting GPU miner to apply mode {mode}");
            if let Err(e) = GpuManager::write().await.stop_mining().await {
                error!(target: LOG_TARGET_APP_LOGIC, "Failed to stop GPU miner before applying mode {mode}: {e}");
                return;
            }
            if let Err(e) = GpuManager::write().await.start_mining().await {
                error!(target: LOG_TARGET_APP_LOGIC, "Failed to start GPU miner in mode {mode}: {e}");
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::{MinerModeAction, miner_mode_action};

    #[test]
    fn a_disabled_miner_is_never_started_or_restarted() {
        for running in [false, true] {
            for mode_changed in [false, true] {
                for start_if_stopped in [false, true] {
                    assert_eq!(
                        miner_mode_action(false, running, mode_changed, start_if_stopped),
                        MinerModeAction::Leave,
                        "running={running} changed={mode_changed} start_if_stopped={start_if_stopped}"
                    );
                }
            }
        }
    }

    #[test]
    fn a_running_miner_restarts_only_when_the_mode_changes() {
        assert_eq!(
            miner_mode_action(true, true, true, true),
            MinerModeAction::Restart
        );
        assert_eq!(
            miner_mode_action(true, true, true, false),
            MinerModeAction::Restart
        );
        assert_eq!(
            miner_mode_action(true, true, false, true),
            MinerModeAction::Leave
        );
        assert_eq!(
            miner_mode_action(true, true, false, false),
            MinerModeAction::Leave
        );
    }

    #[test]
    fn a_stopped_miner_starts_only_for_a_window_that_should_start_mining() {
        assert_eq!(
            miner_mode_action(true, false, true, true),
            MinerModeAction::Start
        );
        assert_eq!(
            miner_mode_action(true, false, false, true),
            MinerModeAction::Start
        );
        assert_eq!(
            miner_mode_action(true, false, true, false),
            MinerModeAction::Leave
        );
        assert_eq!(
            miner_mode_action(true, false, false, false),
            MinerModeAction::Leave
        );
    }
}
