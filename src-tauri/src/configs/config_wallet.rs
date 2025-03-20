use crate::app_config::{GpuThreads, MiningMode};
use std::{
    sync::{LazyLock, Mutex},
    time::SystemTime,
};

use serde::{Deserialize, Serialize};

use crate::AppConfig;

use super::trait_config::{ConfigContentImpl, ConfigImpl};

static INSTANCE: LazyLock<Mutex<ConfigWallet>> = LazyLock::new(|| Mutex::new(ConfigWallet::new()));

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
#[serde(default)]
pub struct ConfigWalletContent {
    created_at: SystemTime,
    monero_address: String,            // Wallet
    monero_address_is_generated: bool, // Wallet
    keyring_accessed: bool,            // Wallet
}

impl Default for ConfigWalletContent {
    fn default() -> Self {
        Self {
            created_at: SystemTime::now(),
            monero_address: "".to_string(),
            monero_address_is_generated: false,
            keyring_accessed: false,
        }
    }
}

impl ConfigContentImpl for ConfigWalletContent {}

impl ConfigWalletContent {
    pub fn monero_address(&self) -> &str {
        &self.monero_address
    }

    pub fn monero_address_is_generated(&self) -> bool {
        self.monero_address_is_generated
    }

    pub fn keyring_accessed(&self) -> bool {
        self.keyring_accessed
    }

    pub fn set_monero_address(&mut self, monero_address: String) {
        self.monero_address = monero_address;
    }

    pub fn set_monero_address_is_generated(&mut self, monero_address_is_generated: bool) {
        self.monero_address_is_generated = monero_address_is_generated;
    }

    pub fn set_keyring_accessed(&mut self, keyring_accessed: bool) {
        self.keyring_accessed = keyring_accessed;
    }
}

pub struct ConfigWallet {
    content: ConfigWalletContent,
}

impl ConfigImpl for ConfigWallet {
    type Config = ConfigWalletContent;
    type OldConfig = AppConfig;

    fn current() -> &'static Mutex<Self> {
        &INSTANCE
    }

    fn new() -> Self {
        Self {
            content: ConfigWalletContent::default(),
        }
    }

    fn get_name() -> String {
        "wallet_config".to_string()
    }

    fn get_content(&self) -> &Self::Config {
        &self.content
    }

    fn get_content_mut(&mut self) -> &mut Self::Config {
        &mut self.content
    }

    fn migrate_old_config(&mut self, old_config: Self::OldConfig) -> Result<(), anyhow::Error> {
        self.content = ConfigWalletContent {
            created_at: SystemTime::now(),
            keyring_accessed: old_config.keyring_accessed(),
            monero_address: old_config.monero_address().to_string(),
            monero_address_is_generated: old_config.monero_address_is_generated(),
        };
        Ok(())
    }
}
