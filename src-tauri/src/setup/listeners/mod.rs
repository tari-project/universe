pub mod listener_setup_finished;
pub mod listener_unlock_app;
pub mod listener_unlock_cpu_mining;
pub mod listener_unlock_gpu_mining;
pub mod listener_unlock_wallet;
pub mod trait_listener;

use std::fmt::{Display, Formatter};

#[derive(Clone, PartialEq, Eq, Debug)]
pub enum SetupFeature {
    ExternalWalletAddress,
    CentralizedPool,
    Restarting,
}

impl Display for SetupFeature {
    fn fmt(&self, f: &mut Formatter<'_>) -> Result<(), std::fmt::Error> {
        match self {
            SetupFeature::ExternalWalletAddress => write!(f, "External Wallet Address"),
            SetupFeature::CentralizedPool => write!(f, "Centralized Pool"),
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

    pub fn get_features(&self) -> Vec<SetupFeature> {
        self.0.clone()
    }

    pub fn is_feature_enabled(&self, feature: SetupFeature) -> bool {
        self.0.contains(&feature)
    }

    pub fn is_feature_disabled(&self, feature: SetupFeature) -> bool {
        !self.0.contains(&feature)
    }
}
