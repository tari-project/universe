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

use tokio::{
    sync::{watch::Receiver, Mutex},
    time::sleep,
};

use crate::{
    setup::setup_manager::{PhaseStatus, SetupPhase},
    tasks_tracker::TasksTrackers,
    EventsEmitter,
};

use log::{debug, info};

use super::{
    trait_listener::{
        UnlockConditionsListenerTrait, UnlockConditionsStatusChannels, UnlockStrategyTrait,
    },
    SetupFeature, SetupFeaturesList,
};

static LOG_TARGET: &str = "tari::universe::unlock_conditions::listener_unlock_cpu_mining";
static INSTANCE: LazyLock<ListenerUnlockCpuMining> = LazyLock::new(ListenerUnlockCpuMining::new);

pub struct ListenerUnlockCpuMining {
    listener: Mutex<Option<tokio::task::JoinHandle<()>>>,
    status_channels: Mutex<UnlockConditionsStatusChannels>,
    features_list: Mutex<SetupFeaturesList>,
}

impl UnlockConditionsListenerTrait for ListenerUnlockCpuMining {
    fn new() -> Self {
        Self {
            listener: Mutex::new(None),
            status_channels: Mutex::new(UnlockConditionsStatusChannels::new()),
            features_list: Mutex::new(SetupFeaturesList::default()),
        }
    }

    fn current() -> &'static Self {
        &INSTANCE
    }

    async fn add_status_channel(&self, key: SetupPhase, value: Receiver<PhaseStatus>) {
        let mut channels = self.status_channels.lock().await;
        channels.insert(key, value);
    }

    async fn stop_listener(&self) {
        if let Some(listener_task) = self.listener.lock().await.take() {
            info!(target: LOG_TARGET, "Stopping listener task");
            listener_task.abort();
        } else {
            info!(target: LOG_TARGET, "No listener task to stop");
        }
    }

    async fn start_listener(&self) {
        self.stop_listener().await;
        let shutdown_signal = TasksTrackers::current().common.get_signal().await;
        let unlock_strategy = self.select_unlock_strategy().await;
        let channels = self.status_channels.lock().await.clone();

        if !unlock_strategy.are_all_channels_loaded(&channels) {
            info!(target: LOG_TARGET, "Not all listeners are ready, skipping listener start");
            return;
        }
        let unlock_cpu_mining_listener = ListenerUnlockCpuMining::current();

        let listener_task = TasksTrackers::current()
            .common
            .get_task_tracker()
            .await
            .spawn(async move {
                loop {
                    if shutdown_signal.is_triggered() {
                        info!(target: LOG_TARGET, "Shutdown signal already triggered, stopping listener");
                        return;
                    }
                    if unlock_strategy.check_conditions(&channels).unwrap_or(false) {
                        debug!(target: LOG_TARGET, "Conditions met, proceeding with unlock");
                        unlock_cpu_mining_listener.conditions_met_callback().await;
                        break;
                    } else {
                        debug!(target: LOG_TARGET, "Conditions not met, waiting for next check");
                    }
                    sleep(Duration::from_secs(5)).await;
                }
            });

        *self.listener.lock().await = Some(listener_task);
    }

    async fn conditions_met_callback(&self) {
        info!(target: LOG_TARGET, "Unlocking Mining");
        EventsEmitter::emit_unlock_cpu_mining().await;
    }

    async fn handle_restart(&self) {
        let unlock_strategy = self.select_unlock_strategy().await;
        let channels = self.status_channels.lock().await.clone();

        let is_any_phase_restarting = unlock_strategy.is_any_phase_restarting(channels.clone());
        if is_any_phase_restarting {
            self.lock().await;
        }
    }

    async fn load_setup_features(&self, features: SetupFeaturesList) {
        *self.features_list.lock().await = features;
    }
    async fn select_unlock_strategy(&self) -> Box<dyn UnlockStrategyTrait + Send + Sync> {
        let features = self.features_list.lock().await.clone();
        if features.is_feature_enabled(SetupFeature::CentralizedPool) {
            info!(target: LOG_TARGET, "Using CentralizedPoolStrategy for unlocking");
            Box::new(CentralizedPoolStrategy)
        } else {
            info!(target: LOG_TARGET, "Using DefaultStrategy for unlocking");
            Box::new(DefaultStrategy)
        }
    }
}

impl ListenerUnlockCpuMining {
    async fn lock(&self) {
        info!(target: LOG_TARGET, "Locking Mining");
        EventsEmitter::emit_lock_cpu_mining().await;
    }
}

struct DefaultStrategy;
impl UnlockStrategyTrait for DefaultStrategy {
    fn required_channels(&self) -> Vec<SetupPhase> {
        vec![
            SetupPhase::Core,
            SetupPhase::Hardware,
            SetupPhase::Node,
            SetupPhase::Mining,
        ]
    }
}
struct CentralizedPoolStrategy;
impl UnlockStrategyTrait for CentralizedPoolStrategy {
    fn required_channels(&self) -> Vec<SetupPhase> {
        vec![SetupPhase::Core, SetupPhase::Hardware]
    }
}
