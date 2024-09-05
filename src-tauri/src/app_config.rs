use std::{path::PathBuf, time::SystemTime};

use anyhow::anyhow;
use log::{info, warn};
use serde::{Deserialize, Serialize};
use tokio::fs;

use crate::{consts::DEFAULT_MONERO_ADDRESS, internal_wallet::generate_password};

const LOG_TARGET: &str = "tari::universe::app_config";

#[derive(Debug, Clone, Serialize, Deserialize)]
#[allow(clippy::struct_excessive_bools)]
pub struct AppConfigFromFile {
    #[serde(default = "default_mode")]
    mode: String,
    #[serde(default = "default_false")]
    auto_mining: bool,
    #[serde(default = "default_true")]
    p2pool_enabled: bool,
    #[serde(default = "default_0")]
    last_binaries_update_timestamp: SystemTime,
    #[serde(default = "default_false")]
    allow_telemetry: bool,
    #[serde(default = "default_anon_id")]
    anon_id: String,
    #[serde(default = "default_monero_address")]
    monero_address: String,
    #[serde(default = "default_true")]
    gpu_mining_enabled: bool,
    #[serde(default = "default_true")]
    cpu_mining_enabled: bool,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq)]
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

#[allow(clippy::struct_excessive_bools)]
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppConfig {
    config_file: Option<PathBuf>,
    pub mode: MiningMode,
    pub auto_mining: bool,
    pub p2pool_enabled: bool,
    pub last_binaries_update_timestamp: SystemTime,
    pub allow_telemetry: bool,
    pub anon_id: String,
    pub monero_address: String,
    pub gpu_mining_enabled: bool,
    pub cpu_mining_enabled: bool,
}

impl AppConfig {
    pub fn new() -> Self {
        Self {
            config_file: None,
            mode: MiningMode::Eco,
            auto_mining: false,
            p2pool_enabled: false,
            last_binaries_update_timestamp: SystemTime::now(),
            allow_telemetry: true,
            anon_id: generate_password(20),
            monero_address: DEFAULT_MONERO_ADDRESS.to_string(),
            gpu_mining_enabled: true,
            cpu_mining_enabled: true,
        }
    }

    pub async fn load_or_create(&mut self, config_path: PathBuf) -> Result<(), anyhow::Error> {
        let file: PathBuf = config_path.join("app_config.json");
        self.config_file = Some(file.clone());

        if file.exists() {
            info!(target: LOG_TARGET, "Loading app config from file: {:?}", file);
            let config = fs::read_to_string(&file).await?;
            self.apply_loaded_config(config);
        }
        info!(target: LOG_TARGET, "App config does not exist or is corrupt. Creating new one");
        self.update_config_file().await?;
        Ok(())
    }

    pub fn apply_loaded_config(&mut self, config: String) {
        match serde_json::from_str::<AppConfigFromFile>(&config) {
            Ok(config) => {
                info!("Loaded config from file {:?}", config);
                self.mode = MiningMode::from_str(&config.mode).unwrap_or(MiningMode::Eco);
                self.auto_mining = config.auto_mining;
                self.p2pool_enabled = config.p2pool_enabled;
                self.last_binaries_update_timestamp = config.last_binaries_update_timestamp;
                self.allow_telemetry = config.allow_telemetry;
                self.anon_id = config.anon_id;
                self.monero_address = config.monero_address;
                self.gpu_mining_enabled = config.gpu_mining_enabled;
                self.cpu_mining_enabled = config.cpu_mining_enabled;
            }
            Err(e) => {
                warn!(target: LOG_TARGET, "Failed to parse app config: {}", e.to_string());
            }
        }
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
        self.mode
    }

    pub async fn set_auto_mining(&mut self, auto_mining: bool) -> Result<(), anyhow::Error> {
        self.auto_mining = auto_mining;
        self.update_config_file().await?;
        Ok(())
    }

    pub async fn set_cpu_mining_enabled(&mut self, enabled: bool) -> Result<(), anyhow::Error> {
        self.cpu_mining_enabled = enabled;
        self.update_config_file().await?;
        Ok(())
    }

    pub async fn set_gpu_mining_enabled(&mut self, enabled: bool) -> Result<(), anyhow::Error> {
        self.gpu_mining_enabled = enabled;
        self.update_config_file().await?;
        Ok(())
    }

    pub fn get_cpu_mining_enabled(&self) -> bool {
        self.cpu_mining_enabled
    }

    pub fn get_gpu_mining_enabled(&self) -> bool {
        self.gpu_mining_enabled
    }

    pub async fn set_p2pool_enabled(&mut self, p2pool_enabled: bool) -> Result<(), anyhow::Error> {
        self.p2pool_enabled = p2pool_enabled;
        self.update_config_file().await?;
        Ok(())
    }

    pub fn get_auto_mining(&self) -> bool {
        self.auto_mining
    }

    pub async fn set_allow_telemetry(
        &mut self,
        allow_telemetry: bool,
    ) -> Result<(), anyhow::Error> {
        self.allow_telemetry = allow_telemetry;
        self.update_config_file().await?;
        Ok(())
    }

    pub fn get_allow_telemetry(&self) -> bool {
        self.allow_telemetry
    }

    pub async fn set_monero_address(&mut self, address: String) -> Result<(), anyhow::Error> {
        self.monero_address = address;
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
            mode: MiningMode::to_str(self.mode),
            auto_mining: self.auto_mining,
            p2pool_enabled: self.p2pool_enabled,
            last_binaries_update_timestamp: self.last_binaries_update_timestamp,
            allow_telemetry: self.allow_telemetry,
            anon_id: self.anon_id.clone(),
            monero_address: self.monero_address.clone(),
            gpu_mining_enabled: self.gpu_mining_enabled,
            cpu_mining_enabled: self.cpu_mining_enabled,
        };
        let config = serde_json::to_string(config)?;
        info!(target: LOG_TARGET, "Updating config file: {:?} {:?}", file, self.clone());
        fs::write(file, config).await?;

        Ok(())
    }
}

fn default_mode() -> String {
    "Eco".to_string()
}

fn default_false() -> bool {
    false
}

fn default_true() -> bool {
    true
}

fn default_anon_id() -> String {
    generate_password(20)
}

fn default_system_time() -> SystemTime {
    SystemTime::now()
}

fn default_monero_address() -> String {
    DEFAULT_MONERO_ADDRESS.to_string()
}
