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

use std::{sync::LazyLock, time::SystemTime};

use getset::{Getters, Setters};
use log::error;
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Manager};
use tokio::sync::RwLock;

use crate::{
    events_emitter::EventsEmitter, events_manager::EventsManager, internal_wallet::InternalWallet,
    utils::wallet_utils::create_monereo_address, AppConfig, UniverseAppState,
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
    pub async fn initialize(app_handle: AppHandle, old_config: Option<AppConfig>) {
        let mut config = Self::current().write().await;
        let state = app_handle.state::<UniverseAppState>();
        let old_config_path = app_handle
            .path()
            .app_config_dir()
            .expect("Could not get config dir");

        config.handle_old_config_migration(old_config);
        config.load_app_handle(app_handle.clone()).await;

        EventsManager::handle_config_wallet_loaded(&app_handle, config.content.clone()).await;
        drop(config);
        // Think about better place for this
        // This must happend before InternalWallet::load_or_create !!!
        if ConfigWallet::content().await.monero_address().is_empty() {
            if let Ok(monero_address) = create_monereo_address().await {
                let _unused = ConfigWallet::update_field(
                    ConfigWalletContent::set_generated_monero_address,
                    monero_address,
                )
                .await;
            }
        }

        match InternalWallet::load_or_create(old_config_path.clone()).await {
            Ok(wallet) => {
                state.cpu_miner_config.write().await.tari_address = wallet.get_tari_address();
                state
                    .wallet_manager
                    .set_view_private_key_and_spend_key(
                        wallet.get_view_key(),
                        wallet.get_spend_key(),
                    )
                    .await;
                let tari_address = wallet.get_tari_address();
                *state.tari_address.write().await = tari_address.clone();
                EventsEmitter::emit_wallet_address_update(&app_handle, tari_address).await;
            }
            Err(e) => {
                error!(target: LOG_TARGET, "Error loading internal wallet: {:?}", e);
            }
        };
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
            content: ConfigWallet::_load_or_create(),
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
