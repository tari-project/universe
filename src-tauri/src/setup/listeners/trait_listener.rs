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

use std::{collections::HashMap, future::Future, time::Duration};

use crate::{
    events::UpdateAppModuleStatusPayload,
    events_emitter::EventsEmitter,
    setup::{
        listeners::{AppModule, AppModuleStatus},
        setup_manager::{PhaseStatus, SetupPhase},
    },
    tasks_tracker::TasksTrackers,
};

use super::SetupFeaturesList;
use log::warn;
use tokio::{
    sync::{
        watch::{error::RecvError, Receiver},
        MutexGuard,
    },
    time::sleep,
};

static LOG_TARGET: &str = "tari::universe::unlock_conditions::listener_trait";

#[derive(Clone)]
pub struct UnlockConditionsStatusChannels(HashMap<SetupPhase, Receiver<PhaseStatus>>);
impl UnlockConditionsStatusChannels {
    pub fn new() -> Self {
        Self(HashMap::new())
    }

    pub fn insert(&mut self, key: SetupPhase, value: Receiver<PhaseStatus>) {
        self.0.insert(key, value);
    }

    pub fn get(&self, key: &SetupPhase) -> Result<&Receiver<PhaseStatus>, anyhow::Error> {
        self.0
            .get(key)
            .ok_or_else(|| anyhow::anyhow!("Channel for phase {:?} not found", key))
    }

    #[allow(dead_code)]
    pub fn get_mut(
        &mut self,
        key: &SetupPhase,
    ) -> Result<&mut Receiver<PhaseStatus>, anyhow::Error> {
        self.0
            .get_mut(key)
            .ok_or_else(|| anyhow::anyhow!("Channel for phase {:?} not found", key))
    }

    pub fn contains_key(&self, key: &SetupPhase) -> bool {
        self.0.contains_key(key)
    }

    #[allow(dead_code)]
    pub async fn changed(&mut self, key: &SetupPhase) -> Result<(), anyhow::Error> {
        if let Ok(receiver) = self.get_mut(key) {
            receiver.changed().await.map_err(|e: RecvError| {
                anyhow::anyhow!(
                    "Failed to receive change notification for phase {:?}: {}",
                    key,
                    e
                )
            })
        } else {
            Err(anyhow::anyhow!("Channel for phase {:?} not found", key))
        }
    }
}

pub trait UnlockConditionsListenerTrait {
    // Trait implemented methods
    fn conditions_met_callback(&self) -> impl Future<Output = ()> + Send + Sync {
        EventsEmitter::emit_update_app_module_status(UpdateAppModuleStatusPayload {
            module: self.get_module_type(),
            status: AppModuleStatus::Initialized.as_string(),
            error_messages: HashMap::new(),
        })
    }
    fn conditions_failed_callback(
        &self,
        failed_phases: HashMap<SetupPhase, String>,
    ) -> impl Future<Output = ()> + Send + Sync {
        EventsEmitter::emit_update_app_module_status(UpdateAppModuleStatusPayload {
            module: self.get_module_type(),
            status: AppModuleStatus::Failed(failed_phases.clone()).as_string(),
            error_messages: failed_phases,
        })
    }

    async fn stop_listener(&self) {
        if let Some(listener_task) = self.get_listener().await.take() {
            listener_task.abort();
        }
    }

    async fn start_listener(&self)
    where
        Self: 'static,
    {
        self.stop_listener().await;
        let shutdown_signal = TasksTrackers::current().common.get_signal().await;
        let unlock_strategy = self.select_unlock_strategy().await;
        let channels = self.get_status_channels().await.clone();

        if !unlock_strategy.are_all_channels_loaded(&channels) {
            return;
        }
        if !unlock_strategy.is_any_phase_restarting(channels.clone()) {
            return;
        }

        EventsEmitter::emit_update_app_module_status(UpdateAppModuleStatusPayload {
            module: self.get_module_type(),
            status: AppModuleStatus::Initializing.as_string(),
            error_messages: HashMap::new(),
        })
        .await;

        let listener_task = TasksTrackers::current()
            .common
            .get_task_tracker()
            .await
            .spawn(async move {
                loop {
                    if shutdown_signal.is_triggered() {
                        return;
                    }
                    if let Ok(status) = unlock_strategy.check_conditions(&channels) {
                        match status {
                            AppModuleStatus::Initialized => {
                                Self::current().conditions_met_callback().await;
                                break;
                            }
                            AppModuleStatus::Failed(failed_phases) => {
                                Self::current()
                                    .conditions_failed_callback(failed_phases)
                                    .await;
                                break;
                            }
                            _ => {}
                        }
                    } else {
                        warn!(target: LOG_TARGET, "Failed to check unlock conditions");
                    }
                    sleep(Duration::from_secs(5)).await;
                }
            });

        *self.get_listener().await = Some(listener_task);
    }

    // Methods added by the struct implementing this trait
    fn new() -> Self;
    fn current() -> &'static Self;
    async fn load_setup_features(&self, features: SetupFeaturesList);
    async fn add_status_channel(&self, key: SetupPhase, value: Receiver<PhaseStatus>);
    async fn select_unlock_strategy(&self) -> Box<dyn UnlockStrategyTrait + Send + Sync>;
    async fn handle_restart(&self) {}

    // Getters
    async fn get_listener(&self) -> MutexGuard<'_, Option<tokio::task::JoinHandle<()>>>;
    async fn get_status_channels(&self) -> MutexGuard<'_, UnlockConditionsStatusChannels>;
    fn get_module_type(&self) -> AppModule;
}

pub trait UnlockStrategyTrait {
    fn required_channels(&self) -> Vec<SetupPhase>;
    #[allow(dead_code)]
    fn is_disabled(&self) -> bool {
        self.required_channels().is_empty()
    }
    fn are_all_channels_loaded(&self, channels: &UnlockConditionsStatusChannels) -> bool {
        for phase in &self.required_channels() {
            if !channels.contains_key(phase) {
                warn!(target: LOG_TARGET, "Missing channel for phase: {phase:?}");
                return false;
            }
        }
        true
    }
    fn check_conditions(
        &self,
        channels: &UnlockConditionsStatusChannels,
    ) -> Result<AppModuleStatus, anyhow::Error> {
        let mut failed_phases: HashMap<SetupPhase, String> = HashMap::new();

        // Check for Initializated status
        if self.required_channels().iter().all(|phase| {
            channels
                .get(phase)
                .is_ok_and(|channel| channel.borrow().is_success())
        }) {
            return Ok(AppModuleStatus::Initialized);
        };

        // Check for Failed status
        if self.required_channels().iter().any(|phase| {
            let channel = channels.get(phase);
            if let Ok(channel) = channel {
                let (is_failed, reason) = channel.borrow().is_failed();
                if let Some(reason) = reason {
                    failed_phases.insert(phase.clone(), reason);
                }
                return is_failed;
            }
            false
        }) {
            return Ok(AppModuleStatus::Failed(failed_phases));
        }

        Ok(AppModuleStatus::Initializing)
    }

    fn is_any_phase_restarting(&self, channels: UnlockConditionsStatusChannels) -> bool {
        for phase in &self.required_channels() {
            if let Ok(channel) = channels.get(phase) {
                if channel.borrow().is_restarting() {
                    return true;
                }
            } else {
                warn!(target: LOG_TARGET, "Channel for phase {phase:?} not found");
                return true;
            }
        }
        false
    }
}
