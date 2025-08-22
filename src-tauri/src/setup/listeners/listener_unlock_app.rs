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

use tauri::{AppHandle, Manager};
use tokio::{
    sync::{watch::Receiver, Mutex},
    time::sleep,
};

use crate::{
    release_notes::ReleaseNotes,
    setup::setup_manager::{PhaseStatus, SetupPhase},
    tasks_tracker::TasksTrackers,
    EventsEmitter, UniverseAppState,
};

use log::{debug, info, warn};

use super::{
    trait_listener::{
        UnlockConditionsListenerTrait, UnlockConditionsStatusChannels, UnlockStrategyTrait,
    },
    SetupFeature, SetupFeaturesList,
};

static LOG_TARGET: &str = "tari::universe::unlock_conditions::listener_unlock_app";
static INSTANCE: LazyLock<ListenerUnlockApp> = LazyLock::new(ListenerUnlockApp::new);

pub struct ListenerUnlockApp {
    listener: Mutex<Option<tokio::task::JoinHandle<()>>>,
    status_channels: Mutex<UnlockConditionsStatusChannels>,
    features_list: Mutex<SetupFeaturesList>,
    app_handle: Mutex<Option<AppHandle>>,
}

impl UnlockConditionsListenerTrait for ListenerUnlockApp {
    fn new() -> Self {
        Self {
            listener: Mutex::new(None),
            status_channels: Mutex::new(UnlockConditionsStatusChannels::new()),
            features_list: Mutex::new(SetupFeaturesList::default()),
            app_handle: Mutex::new(None),
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
        if !unlock_strategy.is_any_phase_restarting(channels.clone()) {
            info!(target: LOG_TARGET, "All phases are marked as completed, no need to start listener");
            return;
        }

        let unlock_app_listener = ListenerUnlockApp::current();

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
                        unlock_app_listener.conditions_met_callback().await;
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
        info!(target: LOG_TARGET, "Unlocking App");
        EventsEmitter::emit_unlock_app().await;

        if let Some(app_handle) = self.app_handle.lock().await.as_ref() {
            info!(target: LOG_TARGET, "AppHandle is available, showing release notes");
            let state = app_handle.state::<UniverseAppState>();
            let _unused = ReleaseNotes::current()
                .handle_release_notes_event_emit(state.clone(), app_handle.clone())
                .await;
        } else {
            warn!(target: LOG_TARGET, "No AppHandle available, cannot show release notes");
        }
    }

    async fn handle_restart(&self) {}

    async fn load_setup_features(&self, features: SetupFeaturesList) {
        *self.features_list.lock().await = features;
    }
    async fn select_unlock_strategy(&self) -> Box<dyn UnlockStrategyTrait + Send + Sync> {
        let features = self.features_list.lock().await.clone();
        let is_cpu_pool_enabled = features.is_feature_enabled(SetupFeature::CpuPool);
        let is_gpu_pool_enabled = features.is_feature_enabled(SetupFeature::GpuPool);
        if is_cpu_pool_enabled || is_gpu_pool_enabled {
            info!(target: LOG_TARGET, "Using PoolStrategy for app unlocking");
            Box::new(PoolStrategy)
        } else {
            info!(target: LOG_TARGET, "Using DefaultStrategy for app unlocking");
            Box::new(DefaultStrategy)
        }
    }
}

impl ListenerUnlockApp {
    pub async fn load_app_handle(&self, app_handle: AppHandle) {
        *self.app_handle.lock().await = Some(app_handle.clone());
    }
}

struct DefaultStrategy;
impl UnlockStrategyTrait for DefaultStrategy {
    fn required_channels(&self) -> Vec<SetupPhase> {
        vec![
            SetupPhase::Core,
            SetupPhase::Hardware,
            SetupPhase::Node,
            SetupPhase::Wallet,
            SetupPhase::Mining,
        ]
    }
}
struct PoolStrategy;
impl UnlockStrategyTrait for PoolStrategy {
    fn required_channels(&self) -> Vec<SetupPhase> {
        vec![SetupPhase::Core, SetupPhase::Hardware]
    }
}
