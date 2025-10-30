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

use std::{collections::HashMap, sync::LazyLock};

use tokio::sync::{watch::Receiver, Mutex};

use crate::{
    events::UpdateAppModuleStatusPayload,
    setup::{
        listeners::{AppModule, AppModuleStatus},
        setup_manager::{PhaseStatus, SetupPhase},
    },
    EventsEmitter, LOG_TARGET_APP_LOGIC,
};

use log::info;

use super::{
    trait_listener::{
        UnlockConditionsListenerTrait, UnlockConditionsStatusChannels, UnlockStrategyTrait,
    },
    SetupFeature, SetupFeaturesList,
};

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

    fn get_module_type(&self) -> super::AppModule {
        AppModule::CpuMining
    }

    async fn add_status_channel(&self, key: SetupPhase, value: Receiver<PhaseStatus>) {
        let mut channels = self.status_channels.lock().await;
        channels.insert(key, value);
    }

    async fn get_listener(
        &self,
    ) -> tokio::sync::MutexGuard<'_, Option<tokio::task::JoinHandle<()>>> {
        self.listener.lock().await
    }

    async fn get_status_channels(
        &self,
    ) -> tokio::sync::MutexGuard<'_, UnlockConditionsStatusChannels> {
        self.status_channels.lock().await
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
        info!(target: LOG_TARGET_APP_LOGIC, "Selecting strategy for CpuMining Module");
        let features = self.features_list.lock().await.clone();
        if features.is_feature_enabled(SetupFeature::CpuPool) {
            info!(target: LOG_TARGET_APP_LOGIC, "Using CpuPoolStrategy");
            Box::new(CpuPoolStrategy)
        } else {
            info!(target: LOG_TARGET_APP_LOGIC, "Using DefaultStrategy");
            Box::new(DefaultStrategy)
        }
    }
}

impl ListenerUnlockCpuMining {
    async fn lock(&self) {
        EventsEmitter::emit_update_app_module_status(UpdateAppModuleStatusPayload {
            module: AppModule::CpuMining,
            status: AppModuleStatus::NotInitialized.as_string(),
            error_messages: HashMap::new(),
        })
        .await;
    }
}

struct DefaultStrategy;
impl UnlockStrategyTrait for DefaultStrategy {
    fn required_channels(&self) -> Vec<SetupPhase> {
        vec![SetupPhase::CpuMining, SetupPhase::Node]
    }
}
struct CpuPoolStrategy;
impl UnlockStrategyTrait for CpuPoolStrategy {
    fn required_channels(&self) -> Vec<SetupPhase> {
        vec![SetupPhase::CpuMining]
    }
}
