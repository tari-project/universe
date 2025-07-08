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

use std::collections::HashMap;

use crate::setup::setup_manager::{PhaseStatus, SetupPhase};

use super::SetupFeaturesList;
use log::{debug, warn};
use tokio::sync::watch::{error::RecvError, Receiver};

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
    fn new() -> Self;
    fn current() -> &'static Self;
    async fn load_setup_features(&self, features: SetupFeaturesList);
    async fn start_listener(&self);
    async fn stop_listener(&self);
    async fn select_unlock_strategy(&self) -> Box<dyn UnlockStrategyTrait + Send + Sync>;
    async fn conditions_met_callback(&self);
    async fn handle_restart(&self);
    async fn add_status_channel(&self, key: SetupPhase, value: Receiver<PhaseStatus>);
}

pub trait UnlockStrategyTrait {
    fn required_channels(&self) -> Vec<SetupPhase>;
    fn is_disabled(&self) -> bool {
        self.required_channels().is_empty()
    }
    fn are_all_channels_loaded(&self, channels: &UnlockConditionsStatusChannels) -> bool {
        for phase in &self.required_channels() {
            if !channels.contains_key(phase) {
                warn!(target: LOG_TARGET, "Missing channel for phase: {:?}", phase);
                return false;
            }
        }
        true
    }
    fn check_conditions(
        &self,
        channels: &UnlockConditionsStatusChannels,
    ) -> Result<bool, anyhow::Error> {
        for phase in &self.required_channels() {
            let channel = channels.get(phase)?;
            let status = channel.borrow();
            if !status.is_success() {
                debug!(target: LOG_TARGET, "Phase {:?} is not ready", phase);
                return Ok(false);
            }
        }

        Ok(true)
    }

    fn is_any_phase_restarting(&self, channels: UnlockConditionsStatusChannels) -> bool {
        for phase in &self.required_channels() {
            if let Ok(channel) = channels.get(phase) {
                if channel.borrow().is_restarting() {
                    return true;
                }
            } else {
                warn!(target: LOG_TARGET, "Channel for phase {:?} not found", phase);
                return true;
            }
        }
        false
    }
}
