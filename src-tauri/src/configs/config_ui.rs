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

use crate::{
    configs::config_core::ConfigCore, events_emitter::EventsEmitter,
    internal_wallet::TariAddressType,
};

use getset::{Getters, Setters};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::{sync::LazyLock, time::SystemTime};
use sys_locale::get_locale;
use tauri::AppHandle;
use tokio::sync::RwLock;

use super::trait_config::{ConfigContentImpl, ConfigImpl};

pub const UI_CONFIG_VERSION: u32 = 0;
static INSTANCE: LazyLock<RwLock<ConfigUI>> = LazyLock::new(|| RwLock::new(ConfigUI::new()));

#[derive(Serialize, Deserialize, Clone, Copy)]
pub struct FeedbackPrompt {
    feedback_sent: bool,
    last_dismissed: Option<SystemTime>,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq)]
pub enum WalletUIMode {
    Standard = 0,
    Seedless = 1,
    ExchangeSpecificMiner = 2,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Default)]
pub enum DisplayMode {
    #[default]
    System,
    Dark,
    Light,
}

impl DisplayMode {
    pub fn from_str(s: &str) -> Option<DisplayMode> {
        match s {
            "system" => Some(DisplayMode::System),
            "dark" => Some(DisplayMode::Dark),
            "light" => Some(DisplayMode::Light),
            _ => None,
        }
    }
}

#[allow(clippy::struct_excessive_bools)]
#[derive(Serialize, Deserialize, Clone)]
#[serde(rename_all = "snake_case")]
#[serde(default)]
#[derive(Getters, Setters)]
#[getset(get = "pub", set = "pub")]
pub struct ConfigUIContent {
    version_counter: u32,
    created_at: SystemTime,
    display_mode: DisplayMode,
    has_system_language_been_proposed: bool,
    should_always_use_system_language: bool,
    application_language: String,
    sharing_enabled: bool,
    visual_mode: bool,
    show_experimental_settings: bool,
    was_staged_security_modal_shown: bool, // TODO: Migrated to ConfigWallet, remove after some time
    wallet_ui_mode: WalletUIMode,
    feedback: HashMap<String, FeedbackPrompt>,
    shutdown_mode_selected: bool,
}

impl Default for ConfigUIContent {
    fn default() -> Self {
        Self {
            version_counter: UI_CONFIG_VERSION,
            created_at: SystemTime::now(),
            display_mode: DisplayMode::System,
            has_system_language_been_proposed: false,
            should_always_use_system_language: false,
            application_language: "en".to_string(),
            sharing_enabled: true,
            visual_mode: true,
            show_experimental_settings: false,
            was_staged_security_modal_shown: false,
            wallet_ui_mode: WalletUIMode::Standard,
            feedback: HashMap::from([
                (
                    "early_close".to_string(),
                    FeedbackPrompt {
                        feedback_sent: false,
                        last_dismissed: None,
                    },
                ),
                (
                    "long_time_miner".to_string(),
                    FeedbackPrompt {
                        feedback_sent: false,
                        last_dismissed: None,
                    },
                ),
            ]),
            shutdown_mode_selected: false,
        }
    }
}
impl ConfigContentImpl for ConfigUIContent {}
impl ConfigUIContent {
    pub fn set_should_always_use_system_language_and_resolve_language(
        &mut self,
        payload: (bool, String),
    ) -> &mut Self {
        let (should_use_system_language, fallback_language) = payload;
        self.should_always_use_system_language = should_use_system_language;

        if should_use_system_language {
            self.application_language = get_locale().unwrap_or(fallback_language);
            self.has_system_language_been_proposed = true;
        }

        self
    }

    pub fn propose_system_language(&mut self, fallback_language: String) -> &mut Self {
        if self.has_system_language_been_proposed() | !self.should_always_use_system_language() {
            self
        } else {
            let system_language = get_locale().unwrap_or(fallback_language);
            self.application_language = system_language;
            self.has_system_language_been_proposed = true;
            self
        }
    }
    pub fn update_feedback_sent(&mut self, feedback_type: String) -> &mut Self {
        if let Some(feedback_item) = self.feedback.get_mut(&feedback_type) {
            feedback_item.feedback_sent = true;
        }
        self
    }

    pub fn update_feedback_dismissed(&mut self, feedback_type: String) -> &mut Self {
        if let Some(feedback_item) = self.feedback.get_mut(&feedback_type) {
            feedback_item.last_dismissed = Some(SystemTime::now());
        }
        self
    }
    pub fn was_feedback_sent(&self) -> bool {
        self.feedback.values().any(|item| item.feedback_sent)
    }
}
pub struct ConfigUI {
    content: ConfigUIContent,
    app_handle: RwLock<Option<AppHandle>>,
}

impl ConfigUI {
    pub async fn handle_wallet_type_update(
        tari_address_type: TariAddressType,
    ) -> Result<(), anyhow::Error> {
        let is_on_exchange_miner_specific_variant = ConfigCore::content()
            .await
            .is_on_exchange_specific_variant();
        let mode = match tari_address_type {
            TariAddressType::Internal => WalletUIMode::Standard,
            TariAddressType::External => {
                if is_on_exchange_miner_specific_variant {
                    WalletUIMode::ExchangeSpecificMiner
                } else {
                    WalletUIMode::Seedless
                }
            }
        };

        Self::set_wallet_ui_mode(mode).await?;

        Ok(())
    }

    pub async fn set_wallet_ui_mode(mode: WalletUIMode) -> Result<(), anyhow::Error> {
        Self::update_field(ConfigUIContent::set_wallet_ui_mode, mode).await?;
        EventsEmitter::emit_wallet_ui_mode_changed(mode).await;

        Ok(())
    }

    pub async fn initialize(app_handle: AppHandle) {
        let mut config = Self::current().write().await;
        config.load_app_handle(app_handle.clone()).await;

        drop(config);

        let _unused = Self::update_field(
            ConfigUIContent::propose_system_language,
            "en-US".to_string(),
        )
        .await;
    }
}

impl ConfigImpl for ConfigUI {
    type Config = ConfigUIContent;

    fn current() -> &'static RwLock<Self> {
        &INSTANCE
    }

    fn new() -> Self {
        Self {
            content: ConfigUI::_load_or_create(),
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
        "config_ui".to_string()
    }

    fn _get_content(&self) -> &Self::Config {
        &self.content
    }

    fn _get_content_mut(&mut self) -> &mut Self::Config {
        &mut self.content
    }
}
