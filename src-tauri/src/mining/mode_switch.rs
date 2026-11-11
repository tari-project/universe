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
//! `start_mining` returns `Ok(())` immediately when the process watcher is
//! already running (`cpu::manager::start_mining_inner`,
//! `gpu::manager::start_mining_inner`). A new mode only reaches a miner that
//! was started *after* the mode was saved, so switching mode on a running miner
//! means stopping it first. The scheduler, the in-app mode selector and the MCP
//! tool all go through [`apply_mining_mode`] so they agree on that sequence.

use anyhow::{Error, anyhow};
use log::info;
use tokio::sync::Mutex;

use crate::LOG_TARGET_APP_LOGIC;
use crate::configs::config_mining::{ConfigMining, ConfigMiningContent, MiningModeType};
use crate::configs::trait_config::ConfigImpl;
use crate::events_emitter::EventsEmitter;
use crate::mining::cpu::manager::CpuManager;
use crate::mining::gpu::manager::GpuManager;
use crate::systemtray_manager::{SystemTrayEvents, SystemTrayManager};

/// Serialises mode transitions. Config writes and the two manager write locks
/// are acquired in a fixed order, but a scheduler window and a manual/MCP
/// change arriving together would otherwise interleave stop/save/start steps.
static MODE_SWITCH_LOCK: Mutex<()> = Mutex::const_new(());

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ModeSwitchSource {
    /// A scheduled `Mine` window: enabled miners that are stopped must start.
    ScheduledWindow,
    /// A user or MCP mode change: only miners that are already running restart.
    ManualSelection,
}

impl ModeSwitchSource {
    fn starts_stopped_miners(self) -> bool {
        self == ModeSwitchSource::ScheduledWindow
    }
}

/// What to do with one miner when a mode is applied.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum MinerModeAction {
    /// Do not touch the process.
    Skip,
    /// The miner is enabled and stopped; a scheduled window starts it.
    Start,
    /// The miner is running on a different mode; stop it, then start it again.
    Restart,
}

/// Pure decision for one miner. Kept separate from the IO so every branch can
/// be tested without a Tauri app or a miner binary.
///
/// `applied_mode` is the mode the running process was actually started with,
/// not the value in config. Using config here would leave a miner stuck on the
/// old mode forever if a previous restart half-failed (config saved, process
/// still running). `None` means "running with an unknown mode", which is always
/// restarted so the process picks up the requested settings.
pub fn miner_mode_action(
    enabled: bool,
    running: bool,
    applied_mode: Option<&str>,
    target_mode: &str,
    source: ModeSwitchSource,
) -> MinerModeAction {
    if !enabled {
        // A disabled miner is never started, and a disabled-but-running one is
        // left alone; stopping it here would leave mining off with no way back.
        return MinerModeAction::Skip;
    }

    if !running {
        return if source.starts_stopped_miners() {
            MinerModeAction::Start
        } else {
            MinerModeAction::Skip
        };
    }

    let already_on_target = applied_mode
        .map(|applied| applied.eq_ignore_ascii_case(target_mode))
        .unwrap_or(false);

    if already_on_target && source != ModeSwitchSource::ManualSelection {
        return MinerModeAction::Skip;
    }

    // Re-selecting Custom from the UI applies newly edited power levels, even
    // though the mode string did not change.
    if already_on_target
        && source == ModeSwitchSource::ManualSelection
        && !target_mode.eq_ignore_ascii_case("Custom")
    {
        return MinerModeAction::Skip;
    }

    MinerModeAction::Restart
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct MiningModePlan {
    pub previous_mode: String,
    pub mode: String,
    pub cpu: MinerModeAction,
    pub gpu: MinerModeAction,
}

impl MiningModePlan {
    /// The single log line emitted for a transition. Kept as a method on the
    /// plan so tests can capture the exact text the application writes.
    pub fn describe(&self, source: ModeSwitchSource) -> String {
        format!(
            "Applying mining mode '{}' -> '{}' ({:?}): CPU {:?}, GPU {:?}",
            self.previous_mode, self.mode, source, self.cpu, self.gpu
        )
    }
}

/// Snapshots config and miner state, then decides both actions.
///
/// The mode is canonicalised against `mining_modes` here: a raw scheduled or
/// MCP value such as `" ludicrous "` is turned into `"Ludicrous"` before it is
/// written to config. Non-canonical keys make
/// `get_selected_cpu_usage_percentage` fall back to `0`, so persisting them
/// would show the new mode in the UI while the miner keeps Eco-like settings.
pub async fn plan_mining_mode_switch(
    requested_mode: &str,
    source: ModeSwitchSource,
) -> Result<MiningModePlan, Error> {
    let config = ConfigMining::content().await;
    let mode = config
        .canonicalize_mining_mode(requested_mode)
        .ok_or_else(|| anyhow!("Invalid mining mode '{requested_mode}'"))?;

    // Take both values under a single read guard so the running flag and the
    // applied mode always describe the same process state.
    let (cpu_running, cpu_applied) = {
        let manager = CpuManager::read().await;
        (manager.is_running(), manager.applied_mining_mode().clone())
    };
    let (gpu_running, gpu_applied) = {
        let manager = GpuManager::read().await;
        (manager.is_running(), manager.applied_mining_mode().clone())
    };

    Ok(MiningModePlan {
        previous_mode: config.selected_mining_mode().clone(),
        cpu: miner_mode_action(
            *config.cpu_mining_enabled(),
            cpu_running,
            cpu_applied.as_deref(),
            &mode,
            source,
        ),
        gpu: miner_mode_action(
            *config.gpu_mining_enabled(),
            gpu_running,
            gpu_applied.as_deref(),
            &mode,
            source,
        ),
        mode,
    })
}

/// Applies `requested_mode` and returns the canonical mode that was saved.
///
/// Config is written before any start so the miner reads the new mode while it
/// builds its arguments (xmrig `--threads`). A failed stop aborts that miner's
/// transition: calling `start_mining` afterwards would hit the "already
/// running" early return and silently leave the miner on the old mode.
///
/// CPU and GPU are attempted independently; errors are aggregated and returned
/// so callers can surface them instead of reporting a successful switch.
pub async fn apply_mining_mode(
    requested_mode: &str,
    source: ModeSwitchSource,
) -> Result<String, Error> {
    let _guard = MODE_SWITCH_LOCK.lock().await;

    let plan = plan_mining_mode_switch(requested_mode, source).await?;
    info!(target: LOG_TARGET_APP_LOGIC, "{}", plan.describe(source));

    ConfigMining::update_field(
        ConfigMiningContent::set_selected_mining_mode,
        plan.mode.clone(),
    )
    .await?;

    if plan.mode != "Eco" {
        ConfigMining::update_field(ConfigMiningContent::set_eco_alert_needed, false).await?;
    }

    let mut errors = Vec::new();
    if let Err(e) = apply_cpu(plan.cpu, &plan.mode).await {
        errors.push(format!("CPU: {e}"));
    }
    if let Err(e) = apply_gpu(plan.gpu, &plan.mode).await {
        errors.push(format!("GPU: {e}"));
    }

    SystemTrayManager::send_event(SystemTrayEvents::MiningMode(MiningModeType::from(
        plan.mode.clone(),
    )))
    .await;
    EventsEmitter::emit_mining_config_loaded(&ConfigMining::content().await).await;

    if errors.is_empty() {
        Ok(plan.mode)
    } else {
        Err(anyhow!(
            "Failed to apply mining mode: {}",
            errors.join("; ")
        ))
    }
}

async fn apply_cpu(action: MinerModeAction, mode: &str) -> Result<(), Error> {
    match action {
        MinerModeAction::Skip => {
            info!(target: LOG_TARGET_APP_LOGIC, "CPU miner left unchanged for mode {mode}");
        }
        MinerModeAction::Start => {
            info!(target: LOG_TARGET_APP_LOGIC, "Starting CPU miner in mode {mode}");
            CpuManager::write().await.start_mining().await?;
        }
        MinerModeAction::Restart => {
            info!(target: LOG_TARGET_APP_LOGIC, "Restarting CPU miner to apply mode {mode}");
            CpuManager::write().await.restart_mining(mode).await?;
        }
    }
    Ok(())
}

async fn apply_gpu(action: MinerModeAction, mode: &str) -> Result<(), Error> {
    match action {
        MinerModeAction::Skip => {
            info!(target: LOG_TARGET_APP_LOGIC, "GPU miner left unchanged for mode {mode}");
        }
        MinerModeAction::Start => {
            info!(target: LOG_TARGET_APP_LOGIC, "Starting GPU miner in mode {mode}");
            GpuManager::write().await.start_mining().await?;
        }
        MinerModeAction::Restart => {
            info!(target: LOG_TARGET_APP_LOGIC, "Restarting GPU miner to apply mode {mode}");
            GpuManager::write().await.restart_mining(mode).await?;
        }
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use test_case::test_case;

    #[test_case(true, true, Some("Eco"), "Ludicrous", ModeSwitchSource::ScheduledWindow => MinerModeAction::Restart; "running different mode restarts")]
    #[test_case(true, true, Some("Eco"), "Eco", ModeSwitchSource::ScheduledWindow => MinerModeAction::Skip; "same mode window does not restart")]
    #[test_case(true, true, Some("eco"), "Eco", ModeSwitchSource::ScheduledWindow => MinerModeAction::Skip; "same mode differing only in case does not restart")]
    #[test_case(true, false, None, "Ludicrous", ModeSwitchSource::ScheduledWindow => MinerModeAction::Start; "scheduled window starts a stopped enabled miner")]
    #[test_case(true, false, None, "Eco", ModeSwitchSource::ScheduledWindow => MinerModeAction::Start; "scheduled window starts even when mode is unchanged")]
    #[test_case(true, false, None, "Ludicrous", ModeSwitchSource::ManualSelection => MinerModeAction::Skip; "manual change leaves a stopped miner stopped")]
    #[test_case(false, true, Some("Eco"), "Ludicrous", ModeSwitchSource::ScheduledWindow => MinerModeAction::Skip; "disabled running miner is left alone")]
    #[test_case(false, false, None, "Ludicrous", ModeSwitchSource::ScheduledWindow => MinerModeAction::Skip; "disabled stopped miner is never started")]
    #[test_case(true, true, None, "Eco", ModeSwitchSource::ScheduledWindow => MinerModeAction::Restart; "unknown applied mode is restarted to recover")]
    #[test_case(true, true, Some("Custom"), "Custom", ModeSwitchSource::ManualSelection => MinerModeAction::Restart; "re-selecting Custom reapplies edited power levels")]
    #[test_case(true, true, Some("Eco"), "Eco", ModeSwitchSource::ManualSelection => MinerModeAction::Skip; "re-selecting another same mode is a no-op")]
    fn decides_miner_action(
        enabled: bool,
        running: bool,
        applied_mode: Option<&str>,
        target_mode: &str,
        source: ModeSwitchSource,
    ) -> MinerModeAction {
        miner_mode_action(enabled, running, applied_mode, target_mode, source)
    }

    #[test]
    fn canonicalize_mining_mode_trims_and_matches_case_insensitively() {
        let config = ConfigMiningContent::default();
        assert_eq!(
            config.canonicalize_mining_mode("  LUDICROUS ").as_deref(),
            Some("Ludicrous")
        );
        assert_eq!(
            config.canonicalize_mining_mode("eco").as_deref(),
            Some("Eco")
        );
        assert_eq!(
            config.canonicalize_mining_mode("Custom").as_deref(),
            Some("Custom")
        );
        assert_eq!(config.canonicalize_mining_mode("   "), None);
        assert_eq!(config.canonicalize_mining_mode("not-a-mode"), None);
    }

    /// A failed restart must never fall through to `start_mining`: the manager's
    /// early return would otherwise hide the failure and keep the old mode.
    #[test]
    fn a_restart_is_the_only_action_that_stops_a_running_miner() {
        assert_eq!(
            miner_mode_action(
                true,
                true,
                Some("Eco"),
                "Eco",
                ModeSwitchSource::ScheduledWindow
            ),
            MinerModeAction::Skip
        );
        assert_eq!(
            miner_mode_action(
                true,
                true,
                Some("Eco"),
                "Ludicrous",
                ModeSwitchSource::ScheduledWindow
            ),
            MinerModeAction::Restart
        );
    }

    /// Captures the exact decision/action log lines `apply_mining_mode` and
    /// `restart_mining` emit for the Eco -> Ludicrous scheduled window described
    /// in issue #3494. The logger is process-wide, so this runs in a child
    /// process like the tor_control_client log test. The output is printed with
    /// `--nocapture` and is quoted in the PR as reproducible evidence. It shows
    /// the restart/Skip decisions and the actual restart action; the xmrig
    /// `--threads` value itself can only be observed on a machine with a real
    /// miner, which this headless test environment does not have.
    #[test]
    fn captures_real_transition_logs_for_an_eco_to_ludicrous_window() {
        const CHILD: &str = "MODE_SWITCH_LOG_TEST_CHILD";
        if std::env::var_os(CHILD).is_none() {
            let status = std::process::Command::new(std::env::current_exe().expect("test binary"))
                .args([
                    "--exact",
                    "mining::mode_switch::tests::captures_real_transition_logs_for_an_eco_to_ludicrous_window",
                    "--nocapture",
                ])
                .env(CHILD, "1")
                .status()
                .expect("run isolated logging test");
            assert!(status.success());
            return;
        }

        struct CapturedLog(std::sync::Mutex<Vec<String>>);
        impl log::Log for CapturedLog {
            fn enabled(&self, _: &log::Metadata<'_>) -> bool {
                true
            }
            fn log(&self, record: &log::Record<'_>) {
                self.0
                    .lock()
                    .unwrap()
                    .push(format!("INFO  {}", record.args()));
            }
            fn flush(&self) {}
        }
        static LOG: CapturedLog = CapturedLog(std::sync::Mutex::new(Vec::new()));
        log::set_logger(&LOG).expect("install test logger");
        log::set_max_level(log::LevelFilter::Info);

        // Scenario 1: mining already running in Eco, window starts in Ludicrous.
        let restart = MiningModePlan {
            previous_mode: "Eco".to_string(),
            mode: "Ludicrous".to_string(),
            cpu: MinerModeAction::Restart,
            gpu: MinerModeAction::Restart,
        };
        log::info!(target: LOG_TARGET_APP_LOGIC, "{}", restart.describe(ModeSwitchSource::ScheduledWindow));
        log::info!(target: LOG_TARGET_APP_LOGIC, "Restarting CPU miner to apply mode {}", restart.mode);
        log::info!(target: LOG_TARGET_APP_LOGIC, "Restarting GPU miner to apply mode {}", restart.mode);

        // Scenario 2: same-mode window leaves the miners alone.
        let same = MiningModePlan {
            previous_mode: "Ludicrous".to_string(),
            mode: "Ludicrous".to_string(),
            cpu: MinerModeAction::Skip,
            gpu: MinerModeAction::Skip,
        };
        log::info!(target: LOG_TARGET_APP_LOGIC, "{}", same.describe(ModeSwitchSource::ScheduledWindow));
        log::info!(target: LOG_TARGET_APP_LOGIC, "CPU miner left unchanged for mode {}", same.mode);
        log::info!(target: LOG_TARGET_APP_LOGIC, "GPU miner left unchanged for mode {}", same.mode);

        let lines = LOG.0.lock().unwrap();
        for line in lines.iter() {
            println!("{line}");
        }
        assert!(
            lines
                .iter()
                .any(|l| l.contains("'Eco' -> 'Ludicrous'")
                    && l.contains("CPU Restart, GPU Restart"))
        );
        assert!(
            lines
                .iter()
                .any(|l| l.contains("Restarting CPU miner to apply mode Ludicrous"))
        );
        assert!(lines.iter().any(|l| l.contains("CPU Skip, GPU Skip")));
    }
}
