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

use crate::events_emitter::EventsEmitter;

use std::{sync::LazyLock, time::SystemTime};

use getset::{Getters, Setters};
use serde::{Deserialize, Serialize};
use sys_locale::get_locale;
use tauri::AppHandle;
use tokio::sync::RwLock;

use super::trait_config::{ConfigContentImpl, ConfigImpl};

static INSTANCE: LazyLock<RwLock<ConfigUI>> = LazyLock::new(|| RwLock::new(ConfigUI::new()));

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
    was_config_migrated: bool,
    created_at: SystemTime,
    display_mode: DisplayMode,
    has_system_language_been_proposed: bool,
    should_always_use_system_language: bool,
    application_language: String,
    paper_wallet_enabled: bool,
    custom_power_levels_enabled: bool,
    sharing_enabled: bool,
    visual_mode: bool,
    show_experimental_settings: bool,
    warmup_seen: bool,
    was_staged_security_modal_shown: bool,
}

impl Default for ConfigUIContent {
    fn default() -> Self {
        Self {
            was_config_migrated: false,
            created_at: SystemTime::now(),
            display_mode: DisplayMode::System,
            has_system_language_been_proposed: false,
            should_always_use_system_language: false,
            application_language: "en".to_string(),
            paper_wallet_enabled: true,
            custom_power_levels_enabled: true,
            sharing_enabled: true,
            visual_mode: true,
            show_experimental_settings: false,
            warmup_seen: false,
            was_staged_security_modal_shown: false,
        }
    }
}
impl ConfigContentImpl for ConfigUIContent {}

impl ConfigUIContent {
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
}
pub struct ConfigUI {
    content: ConfigUIContent,
    app_handle: RwLock<Option<AppHandle>>,
}

impl ConfigUI {
    pub async fn initialize(app_handle: AppHandle) {
        let mut config = Self::current().write().await;
        config.load_app_handle(app_handle.clone()).await;

        EventsEmitter::emit_ui_config_loaded(config.content.clone()).await;
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
