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

use crate::app_config::DisplayMode;

use std::{sync::LazyLock, time::SystemTime};

use getset::{Getters, Setters};
use serde::{Deserialize, Serialize};
use tokio::sync::RwLock;

use crate::AppConfig;

use super::trait_config::{ConfigContentImpl, ConfigImpl};

static INSTANCE: LazyLock<RwLock<ConfigUI>> = LazyLock::new(|| RwLock::new(ConfigUI::new()));
#[allow(clippy::struct_excessive_bools)]
#[derive(Serialize, Deserialize, Clone)]
#[serde(rename_all = "snake_case")]
#[serde(default)]
#[derive(Getters, Setters)]
#[getset(get = "pub", set = "pub")]
pub struct ConfigUIContent {
    created_at: SystemTime,
    display_mode: DisplayMode,
    mine_on_app_start: bool,
    has_system_language_been_proposed: bool,
    should_always_use_system_language: bool,
    application_language: String,
    paper_wallet_enabled: bool,
    custom_power_levels_enabled: bool,
    sharing_enabled: bool,
    visual_mode: bool,
    show_experimental_settings: bool,
}

impl Default for ConfigUIContent {
    fn default() -> Self {
        Self {
            created_at: SystemTime::now(),
            display_mode: DisplayMode::System,
            mine_on_app_start: false,
            has_system_language_been_proposed: false,
            should_always_use_system_language: false,
            application_language: "en".to_string(),
            paper_wallet_enabled: false,
            custom_power_levels_enabled: false,
            sharing_enabled: false,
            visual_mode: false,
            show_experimental_settings: false,
        }
    }
}
impl ConfigContentImpl for ConfigUIContent {}

pub struct ConfigUI {
    content: ConfigUIContent,
}

impl ConfigImpl for ConfigUI {
    type Config = ConfigUIContent;
    type OldConfig = AppConfig;

    fn current() -> &'static RwLock<Self> {
        &INSTANCE
    }

    fn new() -> Self {
        Self {
            content: ConfigUIContent::default(),
        }
    }

    fn _get_name() -> String {
        "ui_config".to_string()
    }

    fn _get_content(&self) -> &Self::Config {
        &self.content
    }

    fn _get_content_mut(&mut self) -> &mut Self::Config {
        &mut self.content
    }

    fn migrate_old_config(&mut self, old_config: Self::OldConfig) -> Result<(), anyhow::Error> {
        self.content = ConfigUIContent {
            created_at: SystemTime::now(),
            display_mode: old_config.display_mode(),
            mine_on_app_start: old_config.mine_on_app_start(),

            has_system_language_been_proposed: old_config.has_system_language_been_proposed(),
            should_always_use_system_language: old_config.should_always_use_system_language(),
            application_language: old_config.application_language().to_string(),
            paper_wallet_enabled: old_config.paper_wallet_enabled(),
            custom_power_levels_enabled: old_config.custom_power_levels_enabled(),
            sharing_enabled: old_config.sharing_enabled(),
            visual_mode: old_config.visual_mode(),
            show_experimental_settings: old_config.show_experimental_settings(),
        };
        Ok(())
    }
}
