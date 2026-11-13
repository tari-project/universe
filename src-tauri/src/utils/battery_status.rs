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
extern crate starship_battery as battery;
use std::sync::{Arc, LazyLock, atomic::AtomicBool};

use log::{error, info};
use tokio::{sync::Mutex, task::JoinHandle};

use crate::{
    configs::{
        config_mining::{ConfigMining, ConfigMiningContent, PauseOnBatteryModeState},
        trait_config::ConfigImpl,
    },
    events_emitter::EventsEmitter,
    mining::{cpu::manager::CpuManager, gpu::manager::GpuManager},
    tasks_tracker::TasksTrackers,
};

const LOG_TARGET: &str = "tari::universe::battery_status";

static INSTANCE: LazyLock<BatteryStatus> = LazyLock::new(BatteryStatus::new);

#[derive(Debug, PartialEq, Eq, Clone, Copy)]
pub enum BatteryTransition {
    None,
    SwitchedToCharging,
    SwitchedToDischarging,
    NoBatteries,
}

/// Pure state-transition evaluator for battery charging/discharging changes.
/// Enables unit testing transition rules without physical battery hardware.
pub fn evaluate_battery_transition(
    count: usize,
    all_charging: bool,
    all_discharging: bool,
    last_state: battery::State,
) -> (battery::State, BatteryTransition) {
    if count == 0 {
        return (last_state, BatteryTransition::NoBatteries);
    }

    let was_charging = last_state == battery::State::Charging;
    let was_discharging = last_state == battery::State::Discharging;

    let should_switch_to_charge = all_charging || (was_discharging && !all_discharging);
    let should_switch_to_discharge = !was_discharging && all_discharging;

    if should_switch_to_charge && !was_charging {
        (
            battery::State::Charging,
            BatteryTransition::SwitchedToCharging,
        )
    } else if should_switch_to_discharge {
        (
            battery::State::Discharging,
            BatteryTransition::SwitchedToDischarging,
        )
    } else {
        (last_state, BatteryTransition::None)
    }
}

/// Scans all batteries in a single pass and computes the next state transition.
fn scan_battery_state(
    manager: &battery::Manager,
    last_state: battery::State,
) -> Result<(battery::State, BatteryTransition), ()> {
    let batteries = match manager.batteries() {
        Ok(b) => b,
        Err(e) => {
            error!(target: LOG_TARGET, "Failed to query batteries: {e}");
            return Err(());
        }
    };

    let mut count = 0;
    let mut all_charging = true;
    let mut all_discharging = true;

    for battery in batteries.flatten() {
        count += 1;
        match battery.state() {
            battery::State::Charging | battery::State::Full => {
                all_discharging = false;
            }
            battery::State::Discharging => {
                all_charging = false;
            }
            _ => {
                all_charging = false;
                all_discharging = false;
            }
        }
    }

    Ok(evaluate_battery_transition(
        count,
        all_charging,
        all_discharging,
        last_state,
    ))
}

pub struct BatteryStatus {
    battery_listener_thread: Mutex<Option<JoinHandle<()>>>,
    should_resume_mining_once_charging: AtomicBool,
}

impl BatteryStatus {
    pub fn new() -> Self {
        Self {
            battery_listener_thread: Mutex::new(None),
            should_resume_mining_once_charging: AtomicBool::new(false),
        }
    }

    async fn no_batteries_found_handler() {
        info!(target: LOG_TARGET, "No batteries found on the system.");
        let _unused = ConfigMining::update_field(
            ConfigMiningContent::set_pause_on_battery_mode,
            PauseOnBatteryModeState::NotSupported,
        )
        .await;
        EventsEmitter::emit_mining_config_loaded(&ConfigMining::content().await).await;

        Self::stop_battery_listener().await;
    }

    async fn switched_to_charging_handler() {
        info!(target: LOG_TARGET, "Handling switched to charging event.");
        if INSTANCE
            .should_resume_mining_once_charging
            .load(std::sync::atomic::Ordering::SeqCst)
            && ConfigMining::content()
                .await
                .pause_on_battery_mode()
                .is_enabled()
        {
            info!(target: LOG_TARGET, "Battery switched to charging state.");
            let config = ConfigMining::content().await;
            if *config.gpu_mining_enabled() {
                let _unused = GpuManager::write().await.start_mining().await;
            }
            if *config.cpu_mining_enabled() {
                let _unused = CpuManager::write().await.start_mining().await;
            }
            EventsEmitter::emit_set_show_battery_alert(false).await;
        }
        INSTANCE
            .should_resume_mining_once_charging
            .store(false, std::sync::atomic::Ordering::SeqCst);
    }

    async fn switched_to_discharging_handler() {
        info!(target: LOG_TARGET, "Handling switched to discharging event.");
        if ConfigMining::content()
            .await
            .pause_on_battery_mode()
            .is_enabled()
            && !INSTANCE
                .should_resume_mining_once_charging
                .load(std::sync::atomic::Ordering::SeqCst)
        {
            info!(target: LOG_TARGET, "Battery switched to discharging state.");
            if GpuManager::read().await.is_running() || CpuManager::read().await.is_running() {
                info!(target: LOG_TARGET, "Mining is running, pausing mining due to discharging battery.");
                let _unused = GpuManager::write().await.stop_mining().await;
                let _unused = CpuManager::write().await.stop_mining().await;
                EventsEmitter::emit_set_show_battery_alert(true).await;
                INSTANCE
                    .should_resume_mining_once_charging
                    .store(true, std::sync::atomic::Ordering::SeqCst);
            };
        }
    }

    pub async fn stop_battery_listener() {
        let mut thread_lock = INSTANCE.battery_listener_thread.lock().await;
        match thread_lock.take() {
            Some(handle) => {
                handle.abort();
                log::info!(target: LOG_TARGET, "Battery listener thread stopped.");
            }
            _ => {
                log::info!(target: LOG_TARGET, "Battery listener thread is not running.");
            }
        }
    }

    pub async fn start_battery_listener() {
        if ConfigMining::content()
            .await
            .pause_on_battery_mode()
            .is_not_supported()
        {
            info!(target: LOG_TARGET, "Battery status monitoring is not supported, skipping battery listener startup.");
            return;
        }

        let mut thread_lock = INSTANCE.battery_listener_thread.lock().await;
        if thread_lock.is_some() {
            info!(target: LOG_TARGET, "Battery listener thread is already running.");
            return;
        }

        // Probe once via spawn_blocking whether any battery hardware is present
        let probe_result = tokio::task::spawn_blocking(|| {
            let manager = match battery::Manager::new() {
                Ok(m) => m,
                Err(e) => {
                    info!(target: LOG_TARGET, "Battery manager init failed or not supported on this platform: {e}");
                    return None;
                }
            };

            match manager.batteries() {
                Ok(batteries) => {
                    let count = batteries.flatten().count();
                    if count == 0 {
                        info!(target: LOG_TARGET, "No batteries found on the system (count == 0).");
                        None
                    } else {
                        info!(target: LOG_TARGET, "Battery hardware detected: found {count} battery device(s).");
                        Some(manager)
                    }
                }
                Err(e) => {
                    info!(target: LOG_TARGET, "Failed to enumerate batteries: {e}");
                    None
                }
            }
        })
        .await;

        let battery_manager = match probe_result {
            Ok(Some(manager)) => Arc::new(manager),
            _ => {
                info!(target: LOG_TARGET, "No batteries present; marking PauseOnBatteryModeState::NotSupported and skipping background listener.");
                let _unused = ConfigMining::update_field(
                    ConfigMiningContent::set_pause_on_battery_mode,
                    PauseOnBatteryModeState::NotSupported,
                )
                .await;
                EventsEmitter::emit_mining_config_loaded(&ConfigMining::content().await).await;
                return;
            }
        };

        let common_task_tracker = TasksTrackers::current().common.get_task_tracker().await;
        let mut common_shutdown_signal = TasksTrackers::current().common.get_signal().await;

        let handle = common_task_tracker.spawn(async move {
            let mut last_state = battery::State::Unknown;
            loop {
                let mgr = Arc::clone(&battery_manager);
                let scan_result =
                    tokio::task::spawn_blocking(move || scan_battery_state(&mgr, last_state)).await;

                match scan_result {
                    Ok(Ok((new_state, transition))) => {
                        last_state = new_state;
                        match transition {
                            BatteryTransition::SwitchedToCharging => {
                                Self::switched_to_charging_handler().await;
                            }
                            BatteryTransition::SwitchedToDischarging => {
                                Self::switched_to_discharging_handler().await;
                            }
                            BatteryTransition::NoBatteries => {
                                Self::no_batteries_found_handler().await;
                                break;
                            }
                            BatteryTransition::None => {}
                        }
                    }
                    Ok(Err(())) => {
                        // Error is already logged inside scan_battery_state
                    }
                    Err(e) => {
                        error!(target: LOG_TARGET, "Battery scan blocking task error: {e}");
                    }
                }

                tokio::select! {
                    _ = tokio::time::sleep(tokio::time::Duration::from_secs(15)) => {},
                    _ = &mut common_shutdown_signal => {
                        info!(target: LOG_TARGET, "Battery listener received shutdown signal.");
                        break;
                    }
                }
            }
        });

        *thread_lock = Some(handle);
        info!(target: LOG_TARGET, "Battery listener thread started with 15s interval.");
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_no_batteries_triggers_not_supported_transition() {
        let (state, transition) =
            evaluate_battery_transition(0, true, true, battery::State::Unknown);
        assert_eq!(transition, BatteryTransition::NoBatteries);
        assert_eq!(state, battery::State::Unknown);
    }

    #[test]
    fn test_initial_charging_transition() {
        let (state, transition) =
            evaluate_battery_transition(1, true, false, battery::State::Unknown);
        assert_eq!(transition, BatteryTransition::SwitchedToCharging);
        assert_eq!(state, battery::State::Charging);
    }

    #[test]
    fn test_initial_discharging_transition() {
        let (state, transition) =
            evaluate_battery_transition(1, false, true, battery::State::Unknown);
        assert_eq!(transition, BatteryTransition::SwitchedToDischarging);
        assert_eq!(state, battery::State::Discharging);
    }

    #[test]
    fn test_transition_from_charging_to_discharging() {
        let (state, transition) =
            evaluate_battery_transition(1, false, true, battery::State::Charging);
        assert_eq!(transition, BatteryTransition::SwitchedToDischarging);
        assert_eq!(state, battery::State::Discharging);
    }

    #[test]
    fn test_transition_from_discharging_to_charging() {
        let (state, transition) =
            evaluate_battery_transition(1, true, false, battery::State::Discharging);
        assert_eq!(transition, BatteryTransition::SwitchedToCharging);
        assert_eq!(state, battery::State::Charging);
    }

    #[test]
    fn test_steady_state_charging_no_transition() {
        let (state, transition) =
            evaluate_battery_transition(1, true, false, battery::State::Charging);
        assert_eq!(transition, BatteryTransition::None);
        assert_eq!(state, battery::State::Charging);
    }

    #[test]
    fn test_steady_state_discharging_no_transition() {
        let (state, transition) =
            evaluate_battery_transition(1, false, true, battery::State::Discharging);
        assert_eq!(transition, BatteryTransition::None);
        assert_eq!(state, battery::State::Discharging);
    }
}
