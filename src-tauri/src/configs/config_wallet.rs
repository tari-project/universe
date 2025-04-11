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

use std::{env::temp_dir, sync::LazyLock, time::SystemTime};

use anyhow::Error;
use dirs::config_dir;
use getset::{Getters, Setters};
use log::{info, warn};
use monero_address_creator::network::Mainnet;
use monero_address_creator::Seed as MoneroSeed;
use serde::{Deserialize, Serialize};
use tauri::AppHandle;
use tokio::sync::RwLock;

use crate::{
    consts::DEFAULT_MONERO_ADDRESS,
    credential_manager::{Credential, CredentialManager},
    AppConfig, APPLICATION_FOLDER_ID,
};

use super::trait_config::{ConfigContentImpl, ConfigImpl};

static LOG_TARGET: &str = "tari::universe::config_wallet";

static INSTANCE: LazyLock<RwLock<ConfigWallet>> =
    LazyLock::new(|| RwLock::new(ConfigWallet::new()));

#[derive(Serialize, Deserialize, Clone)]
#[serde(rename_all = "snake_case")]
#[serde(default)]
#[derive(Getters, Setters)]
pub struct ConfigWalletContent {
    #[getset(get = "pub", set = "pub")]
    was_config_migrated: bool,
    created_at: SystemTime,
    #[getset(get = "pub")]
    monero_address: String,
    #[getset(get = "pub")]
    monero_address_is_generated: bool,
    #[getset(get = "pub", set = "pub")]
    keyring_accessed: bool,
}

impl Default for ConfigWalletContent {
    fn default() -> Self {
        Self {
            was_config_migrated: false,
            created_at: SystemTime::now(),
            monero_address: "".to_string(),
            monero_address_is_generated: false,
            keyring_accessed: false,
        }
    }
}

impl ConfigContentImpl for ConfigWalletContent {}

impl ConfigWalletContent {
    pub fn set_user_monero_address(&mut self, address: String) -> &mut Self {
        self.monero_address = address;
        self.monero_address_is_generated = false;

        self
    }

    pub fn set_generated_monero_address(&mut self, address: String) -> &mut Self {
        self.monero_address = address;
        self.monero_address_is_generated = true;

        self
    }
}

pub struct ConfigWallet {
    content: ConfigWalletContent,
    app_handle: RwLock<Option<AppHandle>>,
}

impl ConfigWallet {
    pub async fn create_monereo_address() -> Result<String, Error> {
        let config_dir = config_dir()
            .unwrap_or_else(|| {
                warn!("Failed to get config directory, using temp dir");
                temp_dir()
            })
            .join(APPLICATION_FOLDER_ID);

        let cm = CredentialManager::default_with_dir(config_dir);

        if let Ok(cred) = cm.get_credentials().await {
            if let Some(seed) = cred.monero_seed {
                info!(target: LOG_TARGET, "Found monero seed in credential manager");
                let seed = MoneroSeed::new(seed);
                return Ok(seed
                    .to_address::<Mainnet>()
                    .unwrap_or(DEFAULT_MONERO_ADDRESS.to_string()));
            }
        }

        let monero_seed = MoneroSeed::generate()?;
        let cred = Credential {
            tari_seed_passphrase: None,
            monero_seed: Some(*monero_seed.inner()),
        };

        info!(target: LOG_TARGET, "Setting monero seed in credential manager");
        cm.set_credentials(&cred).await?;

        Ok(monero_seed
            .to_address::<Mainnet>()
            .unwrap_or(DEFAULT_MONERO_ADDRESS.to_string()))
    }
}

impl ConfigImpl for ConfigWallet {
    type Config = ConfigWalletContent;
    type OldConfig = AppConfig;

    fn current() -> &'static RwLock<Self> {
        &INSTANCE
    }

    fn new() -> Self {
        Self {
            content: ConfigWallet::_initialize_config_content(),
            app_handle: RwLock::new(None),
        }
    }

    async fn _get_app_handle(&self) -> Option<AppHandle> {
        self.app_handle.read().await.clone()
    }

    async fn load_app_handle(&mut self, app_handle: AppHandle) {
        *self.app_handle.write().await = Some(app_handle);
    }

    fn _get_name() -> String {
        "config_wallet".to_string()
    }

    fn _get_content(&self) -> &Self::Config {
        &self.content
    }

    fn _get_content_mut(&mut self) -> &mut Self::Config {
        &mut self.content
    }

    fn handle_old_config_migration(&mut self, old_config: Option<Self::OldConfig>) {
        if self.content.was_config_migrated {
            return;
        }

        if old_config.is_some() {
            let old_config = old_config.expect("Old config should be present");
            self.content = ConfigWalletContent {
                was_config_migrated: true,
                created_at: SystemTime::now(),
                keyring_accessed: old_config.keyring_accessed(),
                monero_address: old_config.monero_address().to_string(),
                monero_address_is_generated: old_config.monero_address_is_generated(),
            };
        } else {
            self.content.set_was_config_migrated(true);
        }
    }
}
