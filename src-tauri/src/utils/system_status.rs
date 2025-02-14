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

use std::{sync::LazyLock, time::Duration};

use anyhow::{anyhow, Error};
use log::info;
use psp::monitor::{PowerMonitor, PowerState};
use tokio::sync::{watch, RwLock};
use tokio_util::sync::CancellationToken;

const LOG_TARGET: &str = "tari::universe::external_dependencies";

static INSTANCE: LazyLock<SystemStatus> = LazyLock::new(SystemStatus::new);

pub struct SystemStatus {
    power_monitor: PowerMonitor,
    cancelation_token: RwLock<Option<CancellationToken>>,
    sleep_mode_watcher_sender: watch::Sender<bool>,
    sleep_mode_watcher_receiver: watch::Receiver<bool>,
}

impl SystemStatus {
    fn new() -> Self {
        let power_monitor = PowerMonitor::new();
        SystemStatus::start_listener(&power_monitor).expect("Error starting listener");
        let (sleep_mode_watcher_sender, sleep_mode_watcher_receiver) = watch::channel(false);

        Self {
            power_monitor,
            cancelation_token: RwLock::new(None),
            sleep_mode_watcher_sender,
            sleep_mode_watcher_receiver,
        }
    }

    fn start_listener(power_monitor: &PowerMonitor) -> Result<(), Error> {
        power_monitor.start_listening().map_err(|e| anyhow!(e))?;
        Ok(())
    }

    async fn recive_power_event(&self) -> Result<(), Error> {
        if let Ok(event) = self.power_monitor.event_receiver().try_recv() {
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

    pub async fn spawn_listener(&self) -> Result<(), Error> {
        let cancelation_token = CancellationToken::new();
        *self.cancelation_token.write().await = Some(cancelation_token.clone());

        tokio::spawn(async move {
            tokio::select! {
                _ = cancelation_token.cancelled() => {
                    info!(target: LOG_TARGET, "Listener canceled");
                },
                _ = async {
                    loop {
                        SystemStatus::current().recive_power_event().await.expect("Error reciving power event");
                        tokio::time::sleep(Duration::from_secs(5)).await;
                    }
                } => {
                    info!(target: LOG_TARGET, "Listener finished");
                }
            }
        });

        Ok(())
    }

    pub async fn stop_listener(&self) -> Result<(), Error> {
        info!(target: LOG_TARGET, "Stopping listener");
        if let Some(cancelation_token) = self.cancelation_token.read().await.as_ref() {
            cancelation_token.cancel();
            info!(target: LOG_TARGET, "Listener canceled");
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
