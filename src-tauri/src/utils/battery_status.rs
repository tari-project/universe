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
use std::sync::{atomic::AtomicBool, Arc, LazyLock};

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
            let _unused = GpuManager::write().await.start_mining().await;
            let _unused = CpuManager::write().await.start_mining().await;
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
        if let Some(handle) = thread_lock.take() {
            handle.abort();
            log::info!(target: LOG_TARGET, "Battery listener thread stopped.");
        } else {
            log::info!(target: LOG_TARGET, "Battery listener thread is not running.");
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
        let common_task_tracker = TasksTrackers::current().common.get_task_tracker().await;
        let mut common_shutdown_signal = TasksTrackers::current().common.get_signal().await;

        if thread_lock.is_none() {
            let last_battery_state = Arc::new(Mutex::new(battery::State::Unknown));
            let handle = common_task_tracker.spawn(async move {
                loop {
                    // Used spawn_blocking to handle non-Send battery operations
                    let last_battery_state_clone = Arc::clone(&last_battery_state);
                    let _unused = tokio::task::spawn_blocking(move || {
                       let battery_manager = match battery::Manager::new() {
                           Err(e) => {error!(target: LOG_TARGET, "Error initializing Battery Manager : {}", e); return;},
                           Ok(manager) => manager
                       };

                       if battery_manager.batteries().is_ok_and(|batteries| batteries.count() == 0) {
                            tokio::spawn(Self::no_batteries_found_handler());
                            return;
                       };
                        // If all batteries are charging the execute charging handler
                        // If all batteries are discharging then execute discharging handler
                        let mut all_charging = true;
                        let mut all_discharging = true;

                        if let Ok(batteries) = battery_manager.batteries() {
                            for battery in batteries.flatten() {
                                info!(target: LOG_TARGET, "Checking battery states | Battery Vendor '{}' state: {:?}", battery.vendor().unwrap_or("Unknown"), battery.state());
                                match battery.state() {
                                    battery::State::Charging | battery::State::Full => {
                                        all_discharging = false;
                                    },
                                    battery::State::Discharging => {
                                        all_charging = false;
                                    },
                                    _ => {
                                        all_charging = false;
                                        all_discharging = false;
                                    }
                                }
                            }

                            let mut state = last_battery_state_clone.blocking_lock();

                            let can_switch_to_charge = *state != battery::State::Charging && (all_charging || (*state == starship_battery::State::Discharging && !all_discharging));
                            let can_switch_to_discharge = *state != starship_battery::State::Discharging && all_discharging;


                            if can_switch_to_charge {
                                tokio::spawn(Self::switched_to_charging_handler());
                                *state = battery::State::Charging;
                            } else if can_switch_to_discharge {
                                tokio::spawn(Self::switched_to_discharging_handler());
                                *state = battery::State::Discharging;
                            } else {
                                info!(target: LOG_TARGET, "No change in battery state detected.");
                                // Mixed states or unknown states, do nothing
                        }
                        }
                    }).await;
                    tokio::select! {
                        _ = tokio::time::sleep(tokio::time::Duration::from_secs(3)) => {},
                        _ = &mut common_shutdown_signal => {
                            log::info!(target: LOG_TARGET, "Battery listener received shutdown signal.");
                            break;
                        }
                    }
                }
            });
            *thread_lock = Some(handle);
            log::info!(target: LOG_TARGET, "Battery listener thread started.");
        } else {
            log::info!(target: LOG_TARGET, "Battery listener thread is already running.");
        }
    }
}
