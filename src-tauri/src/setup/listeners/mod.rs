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

pub mod listener_unlock_cpu_mining;
pub mod listener_unlock_gpu_mining;
pub mod listener_unlock_wallet;
pub mod trait_listener;

use std::{
    collections::HashMap,
    fmt::{Display, Formatter},
};

use serde::Serialize;
use tokio::sync::watch::Receiver;
use trait_listener::UnlockConditionsListenerTrait;

use super::setup_manager::{PhaseStatus, SetupPhase};

#[derive(Clone, Debug, Serialize)]
#[allow(unused)]
pub enum AppModule {
    CpuMining, // CPU mining
    GpuMining, // GPU mining
    Wallet,    // Wallet
}

impl Display for AppModule {
    fn fmt(&self, f: &mut Formatter<'_>) -> Result<(), std::fmt::Error> {
        match self {
            AppModule::CpuMining => write!(f, "CPU Mining"),
            AppModule::GpuMining => write!(f, "GPU Mining"),
            AppModule::Wallet => write!(f, "Wallet"),
        }
    }
}

/// Status that is communicated between modules listeners and frontend UI
/// This states representations is mainly used for frontend UI to display the current status of certain module
#[derive(Clone, Default, Debug, Serialize)]
#[allow(unused)]
pub enum AppModuleStatus {
    #[default]
    NotInitialized, // Default initial state
    Initializing, // Waiting for specified setup phases to complete
    Initialized,  // All required setup phases completed
    Failed(HashMap<SetupPhase, String>), // One of required setup phases failed, contains last error message for each phase that failed
}

impl AppModuleStatus {
    pub fn as_string(&self) -> String {
        match self {
            AppModuleStatus::NotInitialized => "NotInitialized".to_string(),
            AppModuleStatus::Initializing => "Initializing".to_string(),
            AppModuleStatus::Initialized => "Initialized".to_string(),
            AppModuleStatus::Failed(_) => "Failed".to_string(),
        }
    }
}

#[derive(Clone, PartialEq, Eq, Debug)]
pub enum SetupFeature {
    SeedlessWallet,
    CpuPool,
    GpuPool,
    Restarting,
}

impl Display for SetupFeature {
    fn fmt(&self, f: &mut Formatter<'_>) -> Result<(), std::fmt::Error> {
        match self {
            SetupFeature::SeedlessWallet => write!(f, "Seedless wallet"),
            SetupFeature::CpuPool => write!(f, "CPU Pool"),
            SetupFeature::GpuPool => write!(f, "GPU Pool"),
            SetupFeature::Restarting => write!(f, "Restarting"),
        }
    }
}

#[derive(Clone, Default, PartialEq, Eq, Debug)]
pub struct SetupFeaturesList(Vec<SetupFeature>);

impl SetupFeaturesList {
    pub fn add_feature(&mut self, feature: SetupFeature) {
        if !self.0.contains(&feature) {
            self.0.push(feature);
        }
    }

    #[allow(dead_code)]
    pub fn get_features(&self) -> Vec<SetupFeature> {
        self.0.clone()
    }

    pub fn clear(&mut self) {
        self.0.clear();
    }

    pub fn is_feature_enabled(&self, feature: SetupFeature) -> bool {
        self.0.contains(&feature)
    }

    pub fn is_feature_disabled(&self, feature: SetupFeature) -> bool {
        !self.0.contains(&feature)
    }
}

pub async fn setup_listener<T>(
    listener: &T,
    setup_features: &SetupFeaturesList,
    phase_status_map: HashMap<SetupPhase, Receiver<PhaseStatus>>,
) where
    T: UnlockConditionsListenerTrait + 'static,
{
    listener.load_setup_features(setup_features.clone()).await;

    for (phase, status) in phase_status_map {
        listener.add_status_channel(phase, status).await;
    }

    listener.start_listener().await;
}
