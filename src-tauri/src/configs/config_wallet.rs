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
use tari_common_types::tari_address::TariAddress;
use tauri::{AppHandle, Manager};
use tokio::sync::RwLock;

use crate::{
    events_emitter::EventsEmitter, internal_wallet::InternalWallet,
    utils::wallet_utils::create_monereo_address, UniverseAppState,
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
    #[getset(get = "pub", set = "pub")]
    external_tari_address: Option<TariAddress>,
    #[getset(get = "pub", set = "pub")]
    tari_address: Option<TariAddress>,
    #[getset(get = "pub", set = "pub")]
    wallet_migration_nonce: u64,
}

impl Default for ConfigWalletContent {
    fn default() -> Self {
        Self {
            was_config_migrated: false,
            created_at: SystemTime::now(),
            monero_address: "".to_string(),
            monero_address_is_generated: false,
            keyring_accessed: false,
            external_tari_address: None,
            tari_address: None,
            wallet_migration_nonce: 0,
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

    pub fn get_current_used_tari_address(&self) -> TariAddress {
        if let Some(address) = &self.external_tari_address {
            address.clone()
        } else {
            self.tari_address
                .clone()
                .expect("No Tari address set in ConfigWalletContent")
        }
    }
}

pub struct ConfigWallet {
    content: ConfigWalletContent,
    app_handle: RwLock<Option<AppHandle>>,
}

impl ConfigWallet {
    pub async fn initialize(app_handle: AppHandle) {
        let mut config = Self::current().write().await;
        let state = app_handle.state::<UniverseAppState>();
        let old_config_path = app_handle
            .path()
            .app_config_dir()
            .expect("Could not get config dir");

        config.load_app_handle(app_handle.clone()).await;
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
        {
            let mut cpu_config = state.cpu_miner_config.write().await;
            cpu_config.load_from_config_wallet(&ConfigWallet::content().await);
        }

        match InternalWallet::load_or_create(old_config_path.clone()).await {
            Ok(wallet) => {
                state
                    .wallet_manager
                    .set_view_private_key_and_spend_key(
                        wallet.get_view_key(),
                        wallet.get_spend_key(),
                    )
                    .await;

                ConfigWallet::update_field(
                    ConfigWalletContent::set_tari_address,
                    Some(wallet.get_tari_address()),
                )
                .await
                .expect("Failed to set Tari address in ConfigWallet");

                // Currently it easier to send extra event then handle TariAddress in emit_wallet_config_loaded
                EventsEmitter::emit_base_tari_address_changed(wallet.get_tari_address().clone())
                    .await;
            }
            Err(e) => {
                error!(target: LOG_TARGET, "Error loading internal wallet: {:?}", e);
            }
        };
        // Currently it easier to send extra event then handle TariAddress in emit_wallet_config_loaded
        EventsEmitter::emit_external_tari_address_changed(
            ConfigWallet::content()
                .await
                .external_tari_address()
                .clone(),
        )
        .await;
        EventsEmitter::emit_wallet_config_loaded(Self::current().write().await.content.clone())
            .await;
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
