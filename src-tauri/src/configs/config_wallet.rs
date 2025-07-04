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

use std::{collections::HashMap, sync::LazyLock, time::SystemTime};

use getset::{Getters, Setters};
use serde::{Deserialize, Serialize};
use tari_common_types::tari_address::TariAddress;
use tauri::AppHandle;
use tokio::sync::RwLock;

use crate::internal_wallet::TariWalletDetails;

use super::trait_config::{ConfigContentImpl, ConfigImpl};

static EXCHANGES_RECORD_NAME_FOR_EXTERNAL_ADDRESS_BOOK: &str = "Exchanges";

static LOG_TARGET: &str = "tari::universe::config_wallet";

static INSTANCE: LazyLock<RwLock<ConfigWallet>> =
    LazyLock::new(|| RwLock::new(ConfigWallet::new()));

pub const WALLET_VERSION: i32 = 2;

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct ExternalTariAddressBookRecord {
    pub name: String,
    pub address: TariAddress,
}

#[derive(Serialize, Deserialize, Clone)]
#[serde(rename_all = "snake_case")]
#[serde(default)]
#[derive(Getters, Setters)]
pub struct ConfigWalletContent {
    #[getset(get = "pub", set = "pub")]
    version: i32,
    #[getset(get = "pub", set = "pub")]
    tari_wallets: Vec<String>,
    #[getset(get = "pub")]
    monero_address: String,
    #[getset(get = "pub")]
    monero_address_is_generated: bool,
    #[getset(get = "pub", set = "pub")]
    keyring_accessed: bool, // backward compatibility
    #[getset(get = "pub", set = "pub")]
    wallet_migration_nonce: u64,
    created_at: SystemTime,
    #[getset(get = "pub", set = "pub")]
    external_tari_addresses_book: HashMap<String, ExternalTariAddressBookRecord>,
    #[getset(get = "pub", set = "pub")]
    selected_external_tari_address: Option<TariAddress>,
    #[getset(get = "pub", set = "pub")]
    tari_wallet_details: Option<TariWalletDetails>,
    #[getset(get = "pub", set = "pub")]
    pin_locked: bool,
}

impl Default for ConfigWalletContent {
    fn default() -> Self {
        Self {
            version: 0,
            tari_wallets: Vec::new(),
            monero_address: "".to_string(),
            monero_address_is_generated: false,
            keyring_accessed: false,
            wallet_migration_nonce: 0,
            created_at: SystemTime::now(),
            selected_external_tari_address: None,
            external_tari_addresses_book: HashMap::new(),
            pin_locked: false,
            tari_wallet_details: None,
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

    pub fn update_external_tari_address_book(&mut self, address: TariAddress) -> &mut Self {
        self.external_tari_addresses_book.insert(
            EXCHANGES_RECORD_NAME_FOR_EXTERNAL_ADDRESS_BOOK.to_string(),
            ExternalTariAddressBookRecord {
                name: EXCHANGES_RECORD_NAME_FOR_EXTERNAL_ADDRESS_BOOK.to_string(),
                address,
            },
        );

        self
    }
}

pub struct ConfigWallet {
    content: ConfigWalletContent,
    app_handle: RwLock<Option<AppHandle>>,
}

impl ConfigWallet {
    pub async fn initialize(app_handle: AppHandle) {
        let mut config = Self::current().write().await;
        config.load_app_handle(app_handle.clone()).await;
        drop(config);
    }

    pub async fn migrate() -> Result<(), anyhow::Error> {
        let config = ConfigWallet::content().await;
        let current_version = *config.version();

        if current_version < WALLET_VERSION {
            log::info!(
                "Wallet Config needs migration {:?} => {}",
                current_version,
                WALLET_VERSION
            );

            ConfigWallet::update_field(ConfigWalletContent::set_version, WALLET_VERSION.clone())
                .await?;

            return Ok(());
        }

        log::info!(
            "Skipped migration for wallet config version {:?}",
            current_version,
        );

        Ok(())
    }
}

impl ConfigImpl for ConfigWallet {
    type Config = ConfigWalletContent;

    fn current() -> &'static RwLock<Self> {
        &INSTANCE
    }

    fn new() -> Self {
        Self {
            content: ConfigWallet::_load_or_create(),
            app_handle: RwLock::new(None),
        }
    }

    fn _load_or_create() -> Self::Config {
        match Self::_load_config() {
            Ok(config_content) => {
                log::info!(target: LOG_TARGET, "[{}] [load_config] loaded config content", Self::_get_name());
                config_content
            }
            Err(_) => {
                log::debug!(target: LOG_TARGET, "[{}] [load_config] creating new config content", Self::_get_name());
                let config_content = Self::Config::default();
                let _unused = Self::_save_config(config_content.clone()).inspect_err(|error| {
                    log::warn!(target: LOG_TARGET, "[{}] [save_config] error: {:?}", Self::_get_name(), error);
                });
                config_content
            }
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
}
