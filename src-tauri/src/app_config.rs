use anyhow::anyhow;
use log::{info, warn};
use serde::{Deserialize, Serialize};
use std::{
    path::PathBuf,
    time::{Duration, SystemTime},
};
use tokio::fs;

use crate::internal_wallet::generate_password;

const LOG_TARGET: &str = "tari::universe::app_config";

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppConfigFromFile {
    pub version: u32,
    pub mode: String,
    pub auto_mining: bool,
    pub user_inactivity_timeout: Duration,
    pub last_binaries_update_timestamp: SystemTime,
    pub allow_analytics: bool,
    pub anon_id: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum MiningMode {
    Eco,
    Ludicrous,
}

impl MiningMode {
    pub fn from_str(s: &str) -> Option<MiningMode> {
        match s {
            "Eco" => Some(MiningMode::Eco),
            "Ludicrous" => Some(MiningMode::Ludicrous),
            _ => None,
        }
    }

    pub fn to_str(m: MiningMode) -> String {
        match m {
            MiningMode::Eco => String::from("Eco"),
            MiningMode::Ludicrous => String::from("Ludicrous"),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppConfig {
    config_file: Option<PathBuf>,
    pub version: u32,
    pub mode: MiningMode,
    pub auto_mining: bool,
    pub user_inactivity_timeout: Duration,
    pub last_binaries_update_timestamp: SystemTime,
    pub allow_analytics: bool,
    pub anon_id: String,
}

impl AppConfig {
    pub fn new() -> Self {
        Self {
            version: 1,
            config_file: None,
            mode: MiningMode::Eco,
            auto_mining: false,
            user_inactivity_timeout: Duration::from_secs(60),
            last_binaries_update_timestamp: SystemTime::now(),
            allow_analytics: true,
            anon_id: generate_password(20),
        }
    }

    pub async fn load_or_create(&mut self, config_path: PathBuf) -> Result<(), anyhow::Error> {
        let file: PathBuf = config_path.join("app_config.json");
        self.config_file = Some(file.clone());

        if file.exists() {
            info!(target: LOG_TARGET, "Loading app config from file: {:?}", file);
            let config = fs::read_to_string(&file).await?;
            match serde_json::from_str::<AppConfigFromFile>(&config) {
                Ok(config) => {
                    self.mode = MiningMode::from_str(&config.mode).unwrap_or(MiningMode::Eco);
                    self.auto_mining = config.auto_mining;
                    self.user_inactivity_timeout = config.user_inactivity_timeout;
                    self.last_binaries_update_timestamp = config.last_binaries_update_timestamp;
                    self.allow_analytics = config.allow_analytics;
                    self.anon_id = config.anon_id;
                    self.version = config.version;
                    if self.version == 0 {
                        // migrate
                        self.version = 1;
                        self.allow_analytics = true;
                        self.anon_id = generate_password(20);
                    }
                }
                Err(e) => {
                    warn!(target: LOG_TARGET, "Failed to parse app config: {}", e.to_string());
                }
            }
        }
        info!(target: LOG_TARGET, "App config does not exist or is corrupt. Creating new one");
        let config = &AppConfigFromFile {
            mode: MiningMode::to_str(self.mode.clone()),
            auto_mining: self.auto_mining,
            user_inactivity_timeout: self.user_inactivity_timeout,
            last_binaries_update_timestamp: self.last_binaries_update_timestamp,
            version: self.version,
            allow_analytics: self.allow_analytics,
            anon_id: self.anon_id.clone(),
        };
        let config = serde_json::to_string(&config)?;
        fs::write(file, config).await?;
        Ok(())
    }

    pub async fn set_mode(&mut self, mode: String) -> Result<(), anyhow::Error> {
        let new_mode = match mode.as_str() {
            "Eco" => MiningMode::Eco,
            "Ludicrous" => MiningMode::Ludicrous,
            _ => return Err(anyhow!("Invalid mode")),
        };
        self.mode = new_mode;
        self.update_config_file().await?;
        Ok(())
    }

    pub fn get_mode(&self) -> MiningMode {
        self.mode.clone()
    }

    pub async fn set_auto_mining(&mut self, auto_mining: bool) -> Result<(), anyhow::Error> {
        self.auto_mining = auto_mining;
        self.update_config_file().await?;
        Ok(())
    }

    pub fn get_auto_mining(&self) -> bool {
        self.auto_mining
    }

    pub fn get_user_inactivity_timeout(&self) -> Duration {
        self.user_inactivity_timeout
    }

    pub async fn set_user_inactivity_timeout(
        &mut self,
        timeout: Duration,
    ) -> Result<(), anyhow::Error> {
        self.user_inactivity_timeout = timeout;
        self.update_config_file().await?;
        Ok(())
    }

    pub fn get_last_binaries_update_timestamp(&self) -> SystemTime {
        self.last_binaries_update_timestamp
    }

    pub async fn set_last_binaries_update_timestamp(
        &mut self,
        timestamp: SystemTime,
    ) -> Result<(), anyhow::Error> {
        self.last_binaries_update_timestamp = timestamp;
        self.update_config_file().await?;
        Ok(())
    }

    pub async fn update_config_file(&mut self) -> Result<(), anyhow::Error> {
        let file = self.config_file.clone().unwrap();
        let config = &AppConfigFromFile {
            mode: MiningMode::to_str(self.mode.clone()),
            auto_mining: self.auto_mining,
            user_inactivity_timeout: self.user_inactivity_timeout,
            last_binaries_update_timestamp: self.last_binaries_update_timestamp,
            version: self.version,
            allow_analytics: self.allow_analytics,
            anon_id: self.anon_id.clone(),
        };
        let config = serde_json::to_string(config)?;
        info!(target: LOG_TARGET, "Updating config file: {:?} {:?}", file, self.clone());
        fs::write(file, config).await?;

        Ok(())
    }
}
