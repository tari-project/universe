use crate::app_config::DisplayMode;

use std::{
    sync::{LazyLock, Mutex},
    time::SystemTime,
};

use serde::{Deserialize, Serialize};

use crate::AppConfig;

use super::trait_config::{ConfigContentImpl, ConfigImpl};

static INSTANCE: LazyLock<Mutex<ConfigUI>> = LazyLock::new(|| Mutex::new(ConfigUI::new()));

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
#[serde(default)]
pub struct ConfigUIContent {
    created_at: SystemTime,
    display_mode: DisplayMode,               // UI
    mine_on_app_start: bool,                 // UI
    gpu_mining_enabled: bool,                // UI
    cpu_mining_enabled: bool,                // UI
    has_system_language_been_proposed: bool, // UI
    should_always_use_system_language: bool, // UI
    application_language: String,            // UI
    paper_wallet_enabled: bool,              // UI
    custom_power_levels_enabled: bool,       // UI
    sharing_enabled: bool,                   // UI
    visual_mode: bool,                       // UI
    show_experimental_settings: bool,        // UI
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

impl ConfigUIContent {
    pub fn display_mode(&self) -> DisplayMode {
        self.display_mode
    }

    pub fn mine_on_app_start(&self) -> bool {
        self.mine_on_app_start
    }

    pub fn gpu_mining_enabled(&self) -> bool {
        self.gpu_mining_enabled
    }

    pub fn cpu_mining_enabled(&self) -> bool {
        self.cpu_mining_enabled
    }

    pub fn has_system_language_been_proposed(&self) -> bool {
        self.has_system_language_been_proposed
    }

    pub fn should_always_use_system_language(&self) -> bool {
        self.should_always_use_system_language
    }

    pub fn application_language(&self) -> String {
        self.application_language.clone()
    }

    pub fn paper_wallet_enabled(&self) -> bool {
        self.paper_wallet_enabled
    }

    pub fn custom_power_levels_enabled(&self) -> bool {
        self.custom_power_levels_enabled
    }

    pub fn sharing_enabled(&self) -> bool {
        self.sharing_enabled
    }

    pub fn visual_mode(&self) -> bool {
        self.visual_mode
    }

    pub fn show_experimental_settings(&self) -> bool {
        self.show_experimental_settings
    }

    pub fn set_display_mode(&mut self, display_mode: DisplayMode) {
        self.display_mode = display_mode;
    }

    pub fn set_mine_on_app_start(&mut self, mine_on_app_start: bool) {
        self.mine_on_app_start = mine_on_app_start;
    }

    pub fn set_gpu_mining_enabled(&mut self, gpu_mining_enabled: bool) {
        self.gpu_mining_enabled = gpu_mining_enabled;
    }

    pub fn set_cpu_mining_enabled(&mut self, cpu_mining_enabled: bool) {
        self.cpu_mining_enabled = cpu_mining_enabled;
    }

    pub fn set_has_system_language_been_proposed(
        &mut self,
        has_system_language_been_proposed: bool,
    ) {
        self.has_system_language_been_proposed = has_system_language_been_proposed;
    }

    pub fn set_should_always_use_system_language(
        &mut self,
        should_always_use_system_language: bool,
    ) {
        self.should_always_use_system_language = should_always_use_system_language;
    }

    pub fn set_application_language(&mut self, application_language: String) {
        self.application_language = application_language;
    }

    pub fn set_paper_wallet_enabled(&mut self, paper_wallet_enabled: bool) {
        self.paper_wallet_enabled = paper_wallet_enabled;
    }

    pub fn set_custom_power_levels_enabled(&mut self, custom_power_levels_enabled: bool) {
        self.custom_power_levels_enabled = custom_power_levels_enabled;
    }

    pub fn set_sharing_enabled(&mut self, sharing_enabled: bool) {
        self.sharing_enabled = sharing_enabled;
    }

    pub fn set_visual_mode(&mut self, visual_mode: bool) {
        self.visual_mode = visual_mode;
    }

    pub fn set_show_experimental_settings(&mut self, show_experimental_settings: bool) {
        self.show_experimental_settings = show_experimental_settings;
    }
}

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

fn main() {
    // let mut config = ConfigUI::current().lock().
}
