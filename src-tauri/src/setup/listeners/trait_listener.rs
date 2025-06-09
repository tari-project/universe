use std::collections::HashMap;

use crate::setup::setup_manager::{PhaseStatus, SetupPhase};

use super::SetupFeaturesList;
use log::warn;
use tokio::{
    sync::{
        watch::{error::RecvError, Receiver},
        Mutex,
    },
    task::JoinHandle,
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
        let required_channels = self.required_channels();

        for phase in required_channels.iter() {
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
        for phase in self.required_channels().iter() {
            let channel = channels.get(phase)?;
            let status = channel.borrow();
            if !status.is_success() {
                warn!(target: LOG_TARGET, "Phase {:?} is not ready", phase);
                return Ok(false);
            }
        }

        Ok(true)
    }
}
