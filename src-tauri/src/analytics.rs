use std::sync::Arc;

use tokio::sync::RwLock;

use crate::app_config::{self, AppConfig, MiningMode};

pub struct AnalyticsManager {
    config: Arc<RwLock<AppConfig>>,
}

impl AnalyticsManager {
    pub fn new(config: Arc<RwLock<AppConfig>>) -> Self {
        Self { config }
    }

    pub async fn get_unique_string(&self) -> String {
        let config = self.config.read().await;
        if !config.allow_analytics {
            return "".to_string();
        }
        let os = std::env::consts::OS;
        let anon_id = config.anon_id.clone();
        let version = env!("CARGO_PKG_VERSION");
        let mode = MiningMode::to_str(config.mode.clone());
        let auto_mining = config.auto_mining;
        let unique_string = format!("v0,{},{},{},{},{}", anon_id, mode, auto_mining, os, version,);
        unique_string
    }
}
