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

use std::sync::LazyLock;

use anyhow::{anyhow, Error};
use log::info;
use psp::monitor::{PowerMonitor, PowerState};
use tokio::sync::watch;

const LOG_TARGET: &str = "tari::universe::external_dependencies";

static INSTANCE: LazyLock<SystemStatus> = LazyLock::new(SystemStatus::new);

pub struct SystemStatus {
    sleep_mode_watcher_sender: watch::Sender<bool>,
    sleep_mode_watcher_receiver: watch::Receiver<bool>,
}

impl SystemStatus {
    fn new() -> Self {
        let (sleep_mode_watcher_sender, sleep_mode_watcher_receiver) = watch::channel(false);

        Self {
            sleep_mode_watcher_sender,
            sleep_mode_watcher_receiver,
        }
    }

    pub fn start_listener(&self) -> Result<PowerMonitor, Error> {
        let power_monitor = PowerMonitor::new();
        power_monitor.start_listening().map_err(|e| anyhow!(e))?;
        Ok(power_monitor)
    }

    pub fn recive_power_event(&self, power_monitor: &PowerMonitor) -> Result<(), Error> {
        info!(target: LOG_TARGET, "Reciving power event");
        if let Ok(event) = power_monitor.event_receiver().try_recv() {
            info!(target: LOG_TARGET, "Power event: {:?}", event);
            match event {
                PowerState::ScreenLocked => {
                    info!(target: LOG_TARGET, "Screen locked");
                    self.sleep_mode_watcher_sender.send(true);
                }
                PowerState::Suspend => {
                    info!(target: LOG_TARGET, "Suspend");
                    self.sleep_mode_watcher_sender.send(true);
                }
                PowerState::Resume => {
                    info!(target: LOG_TARGET, "Resume");
                    self.sleep_mode_watcher_sender.send(false);
                }
                PowerState::ScreenUnlocked => {
                    info!(target: LOG_TARGET, "Screen unlocked");
                    self.sleep_mode_watcher_sender.send(false);
                }
                _ => {
                    info!(target: LOG_TARGET, "Other event");
                    self.sleep_mode_watcher_sender.send(false);
                }
            }
        }

        Ok(())
    }

    pub fn get_sleep_mode_watcher(&self) -> watch::Receiver<bool> {
        self.sleep_mode_watcher_receiver.clone()
    }

    pub fn current() -> &'static SystemStatus {
        &INSTANCE
    }
}
