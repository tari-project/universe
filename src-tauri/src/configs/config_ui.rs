use crate::app_config::DisplayMode;

use std::{
    sync::{LazyLock, Mutex},
    time::SystemTime,
};

use getset::{Getters, Setters};
use serde::{Deserialize, Serialize};

use crate::AppConfig;

use super::trait_config::{ConfigContentImpl, ConfigImpl};

static INSTANCE: LazyLock<Mutex<ConfigUI>> = LazyLock::new(|| Mutex::new(ConfigUI::new()));

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
#[serde(default)]
#[derive(Getters, Setters)]
#[getset(get = "pub", set = "pub")]
pub struct ConfigUIContent {
    created_at: SystemTime,
    display_mode: DisplayMode,
    mine_on_app_start: bool,
    gpu_mining_enabled: bool,
    cpu_mining_enabled: bool,
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
            gpu_mining_enabled: false,
            cpu_mining_enabled: false,
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

    fn current() -> &'static Mutex<Self> {
        &INSTANCE
    }

    fn new() -> Self {
        Self {
            content: ConfigUIContent::default(),
        }
    }

    fn get_name() -> String {
        "ui_config".to_string()
    }

    fn get_content(&self) -> &Self::Config {
        &self.content
    }

    fn get_content_mut(&mut self) -> &mut Self::Config {
        &mut self.content
    }

    fn migrate_old_config(&mut self, old_config: Self::OldConfig) -> Result<(), anyhow::Error> {
        self.content = ConfigUIContent {
            created_at: SystemTime::now(),
            display_mode: old_config.display_mode(),
            mine_on_app_start: old_config.mine_on_app_start(),
            gpu_mining_enabled: old_config.gpu_mining_enabled(),
            cpu_mining_enabled: old_config.cpu_mining_enabled(),
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
