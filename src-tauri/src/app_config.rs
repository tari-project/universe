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

use crate::credential_manager::Credential;
use crate::gpu_miner::EngineType;
use semver::Version;
use std::{path::PathBuf, time::SystemTime};
use sys_locale::get_locale;
use tauri::{AppHandle, Manager};

use crate::credential_manager::CredentialManager;
use crate::node::node_manager::NodeType;
use crate::{consts::DEFAULT_MONERO_ADDRESS, internal_wallet::generate_password};
use anyhow::anyhow;
use chrono::{DateTime, Utc};
use log::{debug, info, warn};
use monero_address_creator::network::Mainnet;
use monero_address_creator::Seed as MoneroSeed;
use serde::{Deserialize, Serialize};
use tokio::fs;

const LOG_TARGET: &str = "tari::universe::app_config";

#[derive(Debug, Clone, Serialize, Deserialize)]
#[allow(clippy::struct_excessive_bools)]
pub struct AppConfigFromFile {
    #[serde(default = "default_version")]
    version: u32,
    #[serde(default = "default_mode")]
    mode: String,
    #[serde(default = "default_display_mode")]
    display_mode: String,
    #[serde(default = "default_true")]
    mine_on_app_start: bool,
    #[serde(default = "default_true")]
    p2pool_enabled: bool,
    #[serde(default = "default_system_time")]
    last_binaries_update_timestamp: SystemTime,
    #[serde(default = "default_false")]
    allow_telemetry: bool,
    #[serde(default = "default_anon_id")]
    anon_id: String,
    #[serde(default = "default_monero_address")]
    monero_address: String,
    #[serde(default = "default_false")]
    monero_address_is_generated: bool,
    #[serde(default = "default_true")]
    gpu_mining_enabled: bool,
    #[serde(default = "default_true")]
    cpu_mining_enabled: bool,
    #[serde(default = "default_false")]
    has_system_language_been_proposed: bool,
    #[serde(default = "default_false")]
    should_always_use_system_language: bool,
    #[serde(default = "default_false")]
    should_auto_launch: bool,
    #[serde(default = "default_application_language")]
    application_language: String,
    #[serde(default = "default_true")]
    use_tor: bool,
    #[serde(default = "default_true")]
    paper_wallet_enabled: bool,
    eco_mode_cpu_threads: Option<u32>,
    ludicrous_mode_cpu_threads: Option<u32>,
    #[serde(default = "default_vec_string")]
    eco_mode_cpu_options: Vec<String>,
    #[serde(default = "default_vec_string")]
    ludicrous_mode_cpu_options: Vec<String>,
    #[serde(default = "default_vec_string")]
    custom_mode_cpu_options: Vec<String>,
    #[serde(default = "default_false")]
    mmproxy_use_monero_fail: bool,
    #[serde(default = "default_monero_nodes")]
    mmproxy_monero_nodes: Vec<String>,
    #[serde(default = "default_custom_max_cpu_usage")]
    custom_max_cpu_usage: Option<u32>,
    #[serde(default = "default_custom_max_gpu_usage")]
    custom_max_gpu_usage: Option<Vec<GpuThreads>>,
    #[serde(default = "default_true")]
    auto_update: bool,
    #[serde(default = "default_false")]
    keyring_accessed: bool,
    #[serde(default = "default_true")]
    custom_power_levels_enabled: bool,
    #[serde(default = "default_true")]
    sharing_enabled: bool,
    #[serde(default = "default_true")]
    visual_mode: bool,
    #[serde(default = "default_window_settings")]
    window_settings: Option<WindowSettings>,
    #[serde(default = "default_false")]
    show_experimental_settings: bool,
    #[serde(default = "default_p2pool_stats_server_port")]
    p2pool_stats_server_port: Option<u16>,
    #[serde(default = "default_false")]
    pre_release: bool,
    #[serde(default = "default_changelog_version")]
    last_changelog_version: String,
    #[serde(default)]
    airdrop_tokens: Option<AirdropTokens>,
    #[serde(default = "default_gpu_engine")]
    gpu_engine: String,
    #[serde(default)]
    remote_base_node_address: Option<String>,
    #[serde(default = "default_node_type")]
    node_type: NodeType,
}

impl Default for AppConfigFromFile {
    fn default() -> Self {
        Self {
            version: default_version(),
            mode: default_mode(),
            display_mode: default_display_mode(),
            mine_on_app_start: true,
            p2pool_enabled: true,
            last_binaries_update_timestamp: default_system_time(),
            allow_telemetry: false,
            anon_id: default_anon_id(),
            monero_address: default_monero_address(),
            monero_address_is_generated: false,
            gpu_mining_enabled: true,
            cpu_mining_enabled: true,
            has_system_language_been_proposed: false,
            should_always_use_system_language: false,
            should_auto_launch: false,
            application_language: default_application_language(),
            custom_max_cpu_usage: None,
            custom_max_gpu_usage: Some(vec![]),
            paper_wallet_enabled: true,
            use_tor: true,
            eco_mode_cpu_options: Vec::new(),
            ludicrous_mode_cpu_options: Vec::new(),
            custom_mode_cpu_options: Vec::new(),
            eco_mode_cpu_threads: None,
            ludicrous_mode_cpu_threads: None,
            mmproxy_monero_nodes: default_monero_nodes(),
            mmproxy_use_monero_fail: false,
            keyring_accessed: false,
            auto_update: true,
            custom_power_levels_enabled: true,
            sharing_enabled: true,
            visual_mode: true,
            window_settings: default_window_settings(),
            show_experimental_settings: false,
            p2pool_stats_server_port: default_p2pool_stats_server_port(),
            pre_release: false,
            last_changelog_version: default_changelog_version(),
            airdrop_tokens: None,
            gpu_engine: default_gpu_engine(),
            remote_base_node_address: None,
            node_type: default_node_type(),
        }
    }
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Default)]
pub enum DisplayMode {
    #[default]
    System,
    Dark,
    Light,
}

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq)]
pub struct AirdropTokens {
    pub token: String,
    pub refresh_token: String,
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

    pub fn to_str(t: DisplayMode) -> String {
        match t {
            DisplayMode::System => String::from("system"),
            DisplayMode::Dark => String::from("dark"),
            DisplayMode::Light => String::from("light"),
        }
    }
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq)]
pub enum MiningMode {
    Eco,
    Ludicrous,
    Custom,
}

impl MiningMode {
    pub fn from_str(s: &str) -> Option<MiningMode> {
        match s {
            "Eco" => Some(MiningMode::Eco),
            "Ludicrous" => Some(MiningMode::Ludicrous),
            "Custom" => Some(MiningMode::Custom),
            _ => None,
        }
    }

    pub fn to_str(m: MiningMode) -> String {
        match m {
            MiningMode::Eco => String::from("Eco"),
            MiningMode::Ludicrous => String::from("Ludicrous"),
            MiningMode::Custom => String::from("Custom"),
        }
    }
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct WindowSettings {
    pub width: u32,
    pub height: u32,
    pub x: i32,
    pub y: i32,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct GpuThreads {
    pub gpu_name: String,
    pub max_gpu_threads: u32,
}

#[allow(clippy::struct_excessive_bools)]
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppConfig {
    config_version: u32,                        // PER CONFIG
    config_file: Option<PathBuf>,               // REMOVE
    created_at: Option<DateTime<Utc>>,          // PER CONFIG
    mode: MiningMode,                           // Mining
    display_mode: DisplayMode,                  // UI
    mine_on_app_start: bool,                    // UI
    p2pool_enabled: bool,                       // Core
    last_binaries_update_timestamp: SystemTime, // Core
    allow_telemetry: bool,                      // CORE
    anon_id: String,                            // CORE
    monero_address: String,                     // Wallet
    monero_address_is_generated: bool,          // Wallet
    gpu_mining_enabled: bool,                   // UI
    cpu_mining_enabled: bool,                   // UI
    has_system_language_been_proposed: bool,    // UI
    should_always_use_system_language: bool,    // UI
    should_auto_launch: bool,                   // Core
    application_language: String,               // UI
    paper_wallet_enabled: bool,                 // UI
    use_tor: bool,                              // CORE
    eco_mode_cpu_threads: Option<u32>,          // Mining
    ludicrous_mode_cpu_threads: Option<u32>,    // Mining
    eco_mode_cpu_options: Vec<String>,          // Mining
    ludicrous_mode_cpu_options: Vec<String>,    // Mining
    custom_mode_cpu_options: Vec<String>,       // Mining
    mmproxy_use_monero_fail: bool,              // CORE
    mmproxy_monero_nodes: Vec<String>,          // CORE
    custom_max_cpu_usage: Option<u32>,          // Mining
    custom_max_gpu_usage: Vec<GpuThreads>,      // Mining
    auto_update: bool,                          // CORE
    keyring_accessed: bool,                     // Wallet
    custom_power_levels_enabled: bool,          // UI
    sharing_enabled: bool,                      // UI
    visual_mode: bool,                          // UI
    window_settings: Option<WindowSettings>,    // CORE
    show_experimental_settings: bool,           // UI
    p2pool_stats_server_port: Option<u16>,      // CORE
    pre_release: bool,                          // CORE
    last_changelog_version: String,             // CORE
    airdrop_tokens: Option<AirdropTokens>,      // CORE
    gpu_engine: String,                         // Mining
    remote_base_node_address: Option<String>,   // CORE
    pub node_type: NodeType,                    // CORE
}

#[allow(dead_code)]
impl AppConfig {
    pub fn new() -> Self {
        Self {
            config_version: default_version(),
            config_file: None,
            created_at: None,
            mode: MiningMode::Eco,
            display_mode: DisplayMode::System,
            mine_on_app_start: true,
            p2pool_enabled: true,
            last_binaries_update_timestamp: default_system_time(),
            allow_telemetry: true,
            anon_id: generate_password(20),
            monero_address: default_monero_address(),
            monero_address_is_generated: false,
            gpu_mining_enabled: true,
            cpu_mining_enabled: true,
            has_system_language_been_proposed: false,
            should_always_use_system_language: false,
            should_auto_launch: false,
            application_language: default_application_language(),
            use_tor: true,
            custom_max_cpu_usage: None,
            custom_max_gpu_usage: vec![],
            paper_wallet_enabled: true,
            eco_mode_cpu_options: Vec::new(),
            ludicrous_mode_cpu_options: Vec::new(),
            custom_mode_cpu_options: Vec::new(),
            eco_mode_cpu_threads: None,
            ludicrous_mode_cpu_threads: None,
            mmproxy_use_monero_fail: false,
            mmproxy_monero_nodes: default_monero_nodes(),
            custom_power_levels_enabled: true,
            auto_update: true,
            sharing_enabled: true,
            visual_mode: true,
            window_settings: default_window_settings(),
            show_experimental_settings: false,
            keyring_accessed: false,
            p2pool_stats_server_port: default_p2pool_stats_server_port(),
            pre_release: false,
            last_changelog_version: default_changelog_version(),
            airdrop_tokens: None,
            gpu_engine: EngineType::OpenCL.to_string(),
            remote_base_node_address: None,
            node_type: NodeType::Local,
        }
    }

    pub async fn move_out_of_original_location(&self, config_path: PathBuf) {
        let file = config_path.join("app_config.json");
        if file.exists() {
            let destination_dir = config_path.join("old");
            if !destination_dir.exists() {
                fs::create_dir_all(&destination_dir)
                    .await
                    .expect("Failed to create old directory");
            }
            let new_file = config_path.join("old").join("app_config.json");
            let _unused = fs::rename(file, new_file).await.inspect_err(|e| {
                warn!(target: LOG_TARGET, "Failed to move app_config.json: {}", e);
            });
        }
    }

    pub fn is_file_exists(&self, config_path: PathBuf) -> bool {
        let file = config_path.join("app_config.json");
        if file.exists() {
            return true;
        }
        false
    }

    pub async fn initialize_for_migration(&mut self, app_handle: AppHandle) -> Option<AppConfig> {
        let old_config_path = app_handle
            .path()
            .app_config_dir()
            .expect("Could not get config dir");

        let _unused = self
            .load_or_create(old_config_path.clone())
            .await
            .map_err(|e| {
                warn!(target: LOG_TARGET, "Failed to load or create app config: {}", e);
            });

        let old_config_content = if self.is_file_exists(old_config_path.clone()) {
            Some(self.clone())
        } else {
            None
        };

        self.move_out_of_original_location(old_config_path).await;

        old_config_content
    }

    pub async fn load_or_create(&mut self, config_path: PathBuf) -> Result<(), anyhow::Error> {
        let file: PathBuf = config_path.join("app_config.json");
        self.config_file = Some(file.clone());

        if file.exists() {
            debug!(target: LOG_TARGET, "Loading app config from file: {:?}", file);
            let config = fs::read_to_string(&file).await?;
            self.created_at = Some(file.clone().metadata()?.created()?.into());
            self.apply_loaded_config(config);
        }
        // else {
        //     info!(target: LOG_TARGET, "App config does not exist or is corrupt. Creating new one");
        //     if let Ok(address) = create_monereo_address(config_path).await {
        //         self.monero_address = address;
        //         self.monero_address_is_generated = true;
        //     }

        //     if self.update_config_file().await.is_ok() {
        //         self.created_at = Some(file.clone().metadata()?.created()?.into());
        //     }
        // }
        // self.update_config_file().await?;
        Ok(())
    }

    pub fn apply_loaded_config(&mut self, config: String) {
        match serde_json::from_str::<AppConfigFromFile>(&config) {
            Ok(config) => {
                debug!("Loaded config from file {:?}", config);
                self.config_version = config.version;
                self.mode = MiningMode::from_str(&config.mode).unwrap_or(MiningMode::Eco);
                self.display_mode =
                    DisplayMode::from_str(&config.display_mode).unwrap_or(DisplayMode::System);
                self.mine_on_app_start = config.mine_on_app_start;
                self.p2pool_enabled = config.p2pool_enabled;
                self.last_binaries_update_timestamp = config.last_binaries_update_timestamp;
                self.allow_telemetry = config.allow_telemetry;
                self.anon_id = config.anon_id;
                self.monero_address = config.monero_address;
                self.monero_address_is_generated = config.monero_address_is_generated;
                self.gpu_mining_enabled = config.gpu_mining_enabled;
                self.cpu_mining_enabled = config.cpu_mining_enabled;
                self.has_system_language_been_proposed = config.has_system_language_been_proposed;
                self.should_always_use_system_language = config.should_always_use_system_language;
                self.should_auto_launch = config.should_auto_launch;
                self.application_language = config.application_language;
                self.use_tor = config.use_tor;
                self.paper_wallet_enabled = config.paper_wallet_enabled;
                self.eco_mode_cpu_options = config.eco_mode_cpu_options;
                self.eco_mode_cpu_threads = config.eco_mode_cpu_threads;
                self.ludicrous_mode_cpu_options = config.ludicrous_mode_cpu_options;
                self.ludicrous_mode_cpu_threads = config.ludicrous_mode_cpu_threads;
                self.custom_mode_cpu_options = config.custom_mode_cpu_options;
                self.mmproxy_monero_nodes = config.mmproxy_monero_nodes;
                self.mmproxy_use_monero_fail = config.mmproxy_use_monero_fail;
                self.custom_max_cpu_usage = config.custom_max_cpu_usage;
                self.custom_max_gpu_usage = config.custom_max_gpu_usage.unwrap_or(vec![]);
                self.auto_update = config.auto_update;
                self.custom_power_levels_enabled = config.custom_power_levels_enabled;
                self.sharing_enabled = config.sharing_enabled;
                self.visual_mode = config.visual_mode;
                self.window_settings = config.window_settings;
                self.show_experimental_settings = config.show_experimental_settings;
                self.p2pool_stats_server_port = config.p2pool_stats_server_port;
                self.pre_release = config.pre_release;
                self.last_changelog_version = config.last_changelog_version;
                self.airdrop_tokens = config.airdrop_tokens;
                self.gpu_engine = config.gpu_engine;
                self.remote_base_node_address = config.remote_base_node_address;
                self.node_type = config.node_type;

                // KEYRING_ACCESSED.store(
                //     config.keyring_accessed,
                //     std::sync::atomic::Ordering::Relaxed,
                // );
            }
            Err(e) => {
                warn!(target: LOG_TARGET, "Failed to parse app config: {}", e.to_string());
            }
        }

        // Migrate
        if self.config_version <= 6 {
            // Change the default value of p2pool_enabled to false in version 7
            self.config_version = 7;
            self.p2pool_enabled = true;
        }
        if self.config_version <= 7 {
            self.config_version = 8;
        }
        if self.config_version <= 8 {
            self.config_version = 9;
            self.mine_on_app_start = true;
        }

        if self.config_version <= 9 {
            self.auto_update = true;
            self.config_version = 10;
        }

        if self.config_version <= 10 {
            self.custom_power_levels_enabled = true;
            self.sharing_enabled = true;
            self.config_version = 11;
        }

        if self.config_version <= 11 {
            self.visual_mode = true;
            self.config_version = 12;
        }

        if self.config_version <= 12 {
            self.paper_wallet_enabled = true;
            self.config_version = 13;
        }

        if self.config_version <= 13 {
            if self.mmproxy_monero_nodes.len() == 1
                && self.mmproxy_monero_nodes.first().map(|s| s.as_str())
                    == Some("https://xmr-01.tari.com")
            {
                self.mmproxy_monero_nodes = default_monero_nodes();
            }
            self.config_version = 14;
        }
    }

    pub fn mmproxy_monero_nodes(&self) -> &Vec<String> {
        warn!(target: LOG_TARGET, "Accessed Old config | mmproxy_monero_nodes");
        &self.mmproxy_monero_nodes
    }

    pub fn mmproxy_use_monero_fail(&self) -> bool {
        warn!(target: LOG_TARGET, "Accessed Old config | mmproxy_use_monero_fail");
        self.mmproxy_use_monero_fail
    }

    pub fn eco_mode_cpu_options(&self) -> &Vec<String> {
        warn!(target: LOG_TARGET, "Accessed Old config | eco_mode_cpu_options");
        &self.eco_mode_cpu_options
    }

    pub fn ludicrous_mode_cpu_options(&self) -> &Vec<String> {
        warn!(target: LOG_TARGET, "Accessed Old config | ludicrous_mode_cpu_options");
        &self.ludicrous_mode_cpu_options
    }

    pub fn created_at(&self) -> Option<DateTime<Utc>> {
        warn!(target: LOG_TARGET, "Accessed Old config | created_at");
        self.created_at
    }

    pub fn custom_mode_cpu_options(&self) -> &Vec<String> {
        warn!(target: LOG_TARGET, "Accessed Old config | custom_mode_cpu_options");
        &self.custom_mode_cpu_options
    }

    pub fn eco_mode_cpu_threads(&self) -> Option<u32> {
        warn!(target: LOG_TARGET, "Accessed Old config | eco_mode_cpu_threads");
        self.eco_mode_cpu_threads
    }

    pub fn ludicrous_mode_cpu_threads(&self) -> Option<u32> {
        warn!(target: LOG_TARGET, "Accessed Old config | ludicrous_mode_cpu_threads");
        self.ludicrous_mode_cpu_threads
    }

    pub fn anon_id(&self) -> &str {
        warn!(target: LOG_TARGET, "Accessed Old config | anon_id");
        &self.anon_id
    }

    pub fn last_changelog_version(&self) -> &str {
        warn!(target: LOG_TARGET, "Accessed Old config | last_changelog_version");
        &self.last_changelog_version
    }

    pub fn gpu_engine(&self) -> EngineType {
        warn!(target: LOG_TARGET, "Accessed Old config | gpu_engine");
        match EngineType::from_string(&self.gpu_engine) {
            Ok(engine) => engine,
            Err(_) => EngineType::OpenCL,
        }
    }

    pub async fn set_mode(
        &mut self,
        mode: String,
        custom_max_cpu_usage: Option<u32>,
        custom_max_gpu_usage: Vec<GpuThreads>,
    ) -> Result<(), anyhow::Error> {
        debug!(target: LOG_TARGET, "Setting mode to {}", mode);
        let new_mode = match mode.as_str() {
            "Eco" => MiningMode::Eco,
            "Ludicrous" => MiningMode::Ludicrous,
            "Custom" => MiningMode::Custom,
            _ => return Err(anyhow!("Invalid mode")),
        };
        self.mode = new_mode;
        self.update_config_file().await?;
        if let Some(custom_max_cpu_usage) = custom_max_cpu_usage {
            self.set_max_cpu_usage(custom_max_cpu_usage).await?;
        };
        self.set_max_gpu_usage(custom_max_gpu_usage).await?;
        Ok(())
    }
    pub async fn set_display_mode(&mut self, display_mode: String) -> Result<(), anyhow::Error> {
        debug!(target: LOG_TARGET, "Setting display mode to {}", display_mode);
        let new_display_mode = match display_mode.as_str() {
            "system" => DisplayMode::System,
            "dark" => DisplayMode::Dark,
            "light" => DisplayMode::Light,
            _ => return Err(anyhow!("Invalid display_mode")),
        };
        self.display_mode = new_display_mode;
        self.update_config_file().await?;
        Ok(())
    }

    pub fn display_mode(&self) -> DisplayMode {
        warn!(target: LOG_TARGET, "Accessed Old config | display_mode");
        self.display_mode
    }

    pub fn mode(&self) -> MiningMode {
        warn!(target: LOG_TARGET, "Accessed Old config | mode");
        self.mode
    }

    pub fn keyring_accessed(&self) -> bool {
        warn!(target: LOG_TARGET, "Accessed Old config | keyring_accessed");
        self.keyring_accessed
    }

    pub fn custom_gpu_usage(&self) -> Vec<GpuThreads> {
        warn!(target: LOG_TARGET, "Accessed Old config | custom_gpu_usage");
        self.custom_max_gpu_usage.clone()
    }

    pub fn airdrop_tokens(&self) -> Option<AirdropTokens> {
        warn!(target: LOG_TARGET, "Accessed Old config | airdrop_tokens");
        self.airdrop_tokens.clone()
    }

    pub async fn set_airdrop_tokens(
        &mut self,
        airdrop_tokens: Option<AirdropTokens>,
    ) -> Result<(), anyhow::Error> {
        warn!(target: LOG_TARGET, "Accessed Old config | set_airdrop_tokens");
        self.airdrop_tokens = airdrop_tokens;
        self.update_config_file().await?;
        Ok(())
    }

    pub async fn set_max_gpu_usage(
        &mut self,
        custom_max_gpu_usage: Vec<GpuThreads>,
    ) -> Result<(), anyhow::Error> {
        warn!(target: LOG_TARGET, "Accessed Old config | set_max_gpu_usage");
        self.custom_max_gpu_usage = custom_max_gpu_usage.clone();
        self.update_config_file().await?;
        Ok(())
    }

    pub fn custom_cpu_usage(&self) -> Option<u32> {
        warn!(target: LOG_TARGET, "Accessed Old config | custom_cpu_usage");
        self.custom_max_cpu_usage
    }

    pub async fn set_max_cpu_usage(
        &mut self,
        custom_max_cpu_usage: u32,
    ) -> Result<(), anyhow::Error> {
        warn!(target: LOG_TARGET, "Accessed Old config | set_max_cpu_usage");
        self.custom_max_cpu_usage = Some(custom_max_cpu_usage);
        self.update_config_file().await?;
        Ok(())
    }

    pub async fn set_cpu_mining_enabled(&mut self, enabled: bool) -> Result<bool, anyhow::Error> {
        warn!(target: LOG_TARGET, "Accessed Old config | set_cpu_mining_enabled");
        self.cpu_mining_enabled = enabled;
        self.update_config_file().await?;
        Ok(self.cpu_mining_enabled)
    }

    pub async fn set_gpu_mining_enabled(&mut self, enabled: bool) -> Result<bool, anyhow::Error> {
        warn!(target: LOG_TARGET, "Accessed Old config | set_gpu_mining_enabled");
        self.gpu_mining_enabled = enabled;
        self.update_config_file().await?;
        Ok(self.gpu_mining_enabled)
    }

    pub fn cpu_mining_enabled(&self) -> bool {
        warn!(target: LOG_TARGET, "Accessed Old config | cpu_mining_enabled");
        self.cpu_mining_enabled
    }

    pub fn gpu_mining_enabled(&self) -> bool {
        warn!(target: LOG_TARGET, "Accessed Old config | gpu_mining_enabled");
        self.gpu_mining_enabled
    }

    pub fn p2pool_enabled(&self) -> bool {
        warn!(target: LOG_TARGET, "Accessed Old config | p2pool_enabled");
        self.p2pool_enabled
    }

    pub async fn set_p2pool_enabled(&mut self, p2pool_enabled: bool) -> Result<(), anyhow::Error> {
        warn!(target: LOG_TARGET, "Accessed Old config | set_p2pool_enabled");
        self.p2pool_enabled = p2pool_enabled;
        self.update_config_file().await?;
        Ok(())
    }

    pub async fn set_visual_mode(&mut self, visual_mode: bool) -> Result<(), anyhow::Error> {
        warn!(target: LOG_TARGET, "Accessed Old config | set_visual_mode");
        self.visual_mode = visual_mode;
        self.update_config_file().await?;
        Ok(())
    }

    // TODO: BRING BACK AFTER RESOLVING WINDOWS SIZING PERSISTENCE
    // pub async fn set_window_settings(
    //     &mut self,
    //     window_settings: WindowSettings,
    // ) -> Result<(), anyhow::Error> {
    //     self.window_settings = Some(window_settings);
    //     self.update_config_file().await?;
    //     Ok(())
    // }

    // pub fn window_settings(&self) -> &Option<WindowSettings> {
    //     &self.window_settings
    // }

    pub async fn set_show_experimental_settings(
        &mut self,
        show_experimental_settings: bool,
    ) -> Result<(), anyhow::Error> {
        warn!(target: LOG_TARGET, "Accessed Old config | set_show_experimental_settings");
        self.show_experimental_settings = show_experimental_settings;
        self.update_config_file().await?;
        Ok(())
    }

    pub fn should_auto_launch(&self) -> bool {
        warn!(target: LOG_TARGET, "Accessed Old config | should_auto_launch");
        self.should_auto_launch
    }

    pub async fn set_should_auto_launch(
        &mut self,
        should_auto_launch: bool,
    ) -> Result<(), anyhow::Error> {
        warn!(target: LOG_TARGET, "Accessed Old config | set_should_auto_launch");
        self.should_auto_launch = should_auto_launch;
        self.update_config_file().await?;
        Ok(())
    }

    pub async fn set_mine_on_app_start(
        &mut self,
        mine_on_app_start: bool,
    ) -> Result<(), anyhow::Error> {
        warn!(target: LOG_TARGET, "Accessed Old config | set_mine_on_app_start");
        self.mine_on_app_start = mine_on_app_start;
        self.update_config_file().await?;
        Ok(())
    }

    pub fn mine_on_app_start(&self) -> bool {
        warn!(target: LOG_TARGET, "Accessed Old config | mine_on_app_start");
        self.mine_on_app_start
    }

    pub async fn set_allow_telemetry(
        &mut self,
        allow_telemetry: bool,
    ) -> Result<(), anyhow::Error> {
        warn!(target: LOG_TARGET, "Accessed Old config | set_allow_telemetry");
        self.allow_telemetry = allow_telemetry;
        self.update_config_file().await?;
        Ok(())
    }

    pub fn allow_telemetry(&self) -> bool {
        warn!(target: LOG_TARGET, "Accessed Old config | allow_telemetry");
        self.allow_telemetry
    }

    pub fn monero_address(&self) -> &str {
        warn!(target: LOG_TARGET, "Accessed Old config | monero_address");
        &self.monero_address
    }

    pub async fn set_monero_address(&mut self, address: String) -> Result<(), anyhow::Error> {
        warn!(target: LOG_TARGET, "Accessed Old config | set_monero_address");
        self.monero_address_is_generated = false;
        self.monero_address = address;
        self.update_config_file().await?;
        Ok(())
    }

    pub fn monero_address_is_generated(&self) -> bool {
        warn!(target: LOG_TARGET, "Accessed Old config | monero_address_is_generated");
        self.monero_address_is_generated
    }

    pub fn last_binaries_update_timestamp(&self) -> SystemTime {
        warn!(target: LOG_TARGET, "Accessed Old config | last_binaries_update_timestamp");
        self.last_binaries_update_timestamp
    }

    pub async fn set_last_binaries_update_timestamp(
        &mut self,
        timestamp: SystemTime,
    ) -> Result<(), anyhow::Error> {
        warn!(target: LOG_TARGET, "Accessed Old config | set_last_binaries_update_timestamp");
        self.last_binaries_update_timestamp = timestamp;
        self.update_config_file().await?;
        Ok(())
    }

    pub async fn set_application_language(
        &mut self,
        language: String,
    ) -> Result<(), anyhow::Error> {
        warn!(target: LOG_TARGET, "Accessed Old config | set_application_language");
        self.application_language = language;
        self.update_config_file().await?;
        Ok(())
    }

    pub fn application_language(&self) -> String {
        warn!(target: LOG_TARGET, "Accessed Old config | application_language");
        self.application_language.clone()
    }

    pub async fn set_should_always_use_system_language(
        &mut self,
        should_always_use_system_language: bool,
    ) -> Result<(), anyhow::Error> {
        warn!(target: LOG_TARGET, "Accessed Old config | set_should_always_use_system_language");
        self.should_always_use_system_language = should_always_use_system_language;
        self.update_config_file().await?;
        Ok(())
    }

    pub async fn propose_system_language(&mut self) -> Result<(), anyhow::Error> {
        warn!(target: LOG_TARGET, "Accessed Old config | propose_system_language");
        if self.has_system_language_been_proposed | !self.should_always_use_system_language {
            Ok(())
        } else {
            let system_language = get_locale().unwrap_or_else(|| String::from("en-US"));
            info!(target: LOG_TARGET, "Proposing system language: {}", system_language);
            self.application_language = system_language;
            self.has_system_language_been_proposed = true;
            self.update_config_file().await?;
            Ok(())
        }
    }

    pub fn should_always_use_system_language(&self) -> bool {
        warn!(target: LOG_TARGET, "Accessed Old config | should_always_use_system_language");
        self.should_always_use_system_language
    }

    pub fn has_system_language_been_proposed(&self) -> bool {
        warn!(target: LOG_TARGET, "Accessed Old config | has_system_language_been_proposed");
        self.has_system_language_been_proposed
    }

    pub fn paper_wallet_enabled(&self) -> bool {
        warn!(target: LOG_TARGET, "Accessed Old config | paper_wallet_enabled");
        self.paper_wallet_enabled
    }

    pub fn custom_power_levels_enabled(&self) -> bool {
        warn!(target: LOG_TARGET, "Accessed Old config | custom_power_levels_enabled");
        self.custom_power_levels_enabled
    }

    pub fn sharing_enabled(&self) -> bool {
        warn!(target: LOG_TARGET, "Accessed Old config | sharing_enabled");
        self.sharing_enabled
    }

    pub fn visual_mode(&self) -> bool {
        warn!(target: LOG_TARGET, "Accessed Old config | visual_mode");
        self.visual_mode
    }

    pub fn show_experimental_settings(&self) -> bool {
        warn!(target: LOG_TARGET, "Accessed Old config | show_experimental_settings");
        self.show_experimental_settings
    }

    pub fn use_tor(&self) -> bool {
        warn!(target: LOG_TARGET, "Accessed Old config | use_tor");
        self.use_tor
    }

    pub async fn set_use_tor(&mut self, use_tor: bool) -> Result<(), anyhow::Error> {
        warn!(target: LOG_TARGET, "Accessed Old config | set_use_tor");
        self.use_tor = use_tor;
        self.update_config_file().await?;
        Ok(())
    }

    pub fn auto_update(&self) -> bool {
        warn!(target: LOG_TARGET, "Accessed Old config | auto_update");
        self.auto_update
    }

    pub async fn set_auto_update(&mut self, auto_update: bool) -> Result<(), anyhow::Error> {
        warn!(target: LOG_TARGET, "Accessed Old config | set_auto_update");
        self.auto_update = auto_update;
        self.update_config_file().await?;
        Ok(())
    }

    pub async fn set_monerod_config(
        &mut self,
        use_monero_fail: bool,
        monero_nodes: Vec<String>,
    ) -> Result<(), anyhow::Error> {
        warn!(target: LOG_TARGET, "Accessed Old config | set_monerod_config");
        self.mmproxy_use_monero_fail = use_monero_fail;
        self.mmproxy_monero_nodes = monero_nodes;
        self.update_config_file().await?;
        Ok(())
    }

    pub fn p2pool_stats_server_port(&self) -> Option<u16> {
        warn!(target: LOG_TARGET, "Accessed Old config | p2pool_stats_server_port");
        self.p2pool_stats_server_port
    }

    pub async fn set_p2pool_stats_server_port(
        &mut self,
        port: Option<u16>,
    ) -> Result<(), anyhow::Error> {
        warn!(target: LOG_TARGET, "Accessed Old config | set_p2pool_stats_server_port");
        self.p2pool_stats_server_port = port;
        self.update_config_file().await?;
        Ok(())
    }

    pub fn pre_release(&self) -> bool {
        warn!(target: LOG_TARGET, "Accessed Old config | pre_release");
        self.pre_release
    }

    pub async fn set_pre_release(&mut self, pre_release: bool) -> Result<(), anyhow::Error> {
        warn!(target: LOG_TARGET, "Accessed Old config | set_pre_release");
        self.pre_release = pre_release;
        self.update_config_file().await?;
        Ok(())
    }

    pub async fn set_last_changelog_version(
        &mut self,
        version: String,
    ) -> Result<(), anyhow::Error> {
        warn!(target: LOG_TARGET, "Accessed Old config | set_last_changelog_version");
        self.last_changelog_version = version;
        self.update_config_file().await?;
        Ok(())
    }

    pub async fn set_gpu_engine(&mut self, engine: &str) -> Result<(), anyhow::Error> {
        warn!(target: LOG_TARGET, "Accessed Old config | set_gpu_engine");
        self.gpu_engine = engine.to_string();
        self.update_config_file().await?;
        Ok(())
    }

    pub fn remote_base_node_address(&self) -> Option<String> {
        warn!(target: LOG_TARGET, "Accessed Old config | remote_base_node_address");
        self.remote_base_node_address.clone()
    }

    // Allow needless update because in future there may be fields that are
    // missing
    #[allow(clippy::needless_update)]
    pub async fn update_config_file(&mut self) -> Result<(), anyhow::Error> {
        let file = self
            .config_file
            .clone()
            .ok_or_else(|| anyhow!("Config file not set"))?;

        let config = &AppConfigFromFile {
            version: self.config_version,
            mode: MiningMode::to_str(self.mode),
            display_mode: DisplayMode::to_str(self.display_mode),
            mine_on_app_start: self.mine_on_app_start,
            p2pool_enabled: self.p2pool_enabled,
            last_binaries_update_timestamp: self.last_binaries_update_timestamp,
            allow_telemetry: self.allow_telemetry,
            anon_id: self.anon_id.clone(),
            monero_address: self.monero_address.clone(),
            monero_address_is_generated: self.monero_address_is_generated,
            gpu_mining_enabled: self.gpu_mining_enabled,
            cpu_mining_enabled: self.cpu_mining_enabled,
            has_system_language_been_proposed: self.has_system_language_been_proposed,
            should_always_use_system_language: self.should_always_use_system_language,
            should_auto_launch: self.should_auto_launch,
            application_language: self.application_language.clone(),
            paper_wallet_enabled: self.paper_wallet_enabled,
            custom_max_cpu_usage: self.custom_max_cpu_usage,
            custom_max_gpu_usage: Some(self.custom_max_gpu_usage.clone()),
            use_tor: self.use_tor,
            eco_mode_cpu_options: self.eco_mode_cpu_options.clone(),
            ludicrous_mode_cpu_options: self.ludicrous_mode_cpu_options.clone(),
            custom_mode_cpu_options: self.custom_mode_cpu_options.clone(),
            eco_mode_cpu_threads: self.eco_mode_cpu_threads,
            ludicrous_mode_cpu_threads: self.ludicrous_mode_cpu_threads,
            mmproxy_monero_nodes: self.mmproxy_monero_nodes.clone(),
            mmproxy_use_monero_fail: self.mmproxy_use_monero_fail,
            // keyring_accessed: KEYRING_ACCESSED.load(std::sync::atomic::Ordering::Relaxed),
            keyring_accessed: false, // placeholder
            auto_update: self.auto_update,
            custom_power_levels_enabled: self.custom_power_levels_enabled,
            sharing_enabled: self.sharing_enabled,
            visual_mode: self.visual_mode,
            window_settings: self.window_settings.clone(),
            show_experimental_settings: self.show_experimental_settings,
            p2pool_stats_server_port: self.p2pool_stats_server_port,
            pre_release: self.pre_release,
            last_changelog_version: self.last_changelog_version.clone(),
            airdrop_tokens: self.airdrop_tokens.clone(),
            gpu_engine: self.gpu_engine.clone(),
            remote_base_node_address: self.remote_base_node_address.clone(),
            node_type: self.node_type.clone(),
        };
        let config = serde_json::to_string(config)?;
        debug!(target: LOG_TARGET, "Updating config file: {:?} {:?}", file, self.clone());
        fs::write(file, config).await?;

        Ok(())
    }
}

fn default_version() -> u32 {
    13
}

fn default_custom_max_cpu_usage() -> Option<u32> {
    None
}

fn default_custom_max_gpu_usage() -> Option<Vec<GpuThreads>> {
    Some(vec![])
}

fn default_mode() -> String {
    "Eco".to_string()
}

fn default_display_mode() -> String {
    "system".to_string()
}

fn default_false() -> bool {
    false
}

fn default_true() -> bool {
    true
}

fn default_anon_id() -> String {
    generate_password(20)
}

fn default_system_time() -> SystemTime {
    SystemTime::UNIX_EPOCH
}

fn default_monero_address() -> String {
    DEFAULT_MONERO_ADDRESS.to_string()
}

fn default_gpu_engine() -> String {
    EngineType::OpenCL.to_string()
}

#[allow(dead_code)]
async fn create_monereo_address(path: PathBuf) -> Result<String, anyhow::Error> {
    let cm = CredentialManager::default_with_dir(path);

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

fn default_vec_string() -> Vec<String> {
    vec![]
}

fn default_application_language() -> String {
    "en".to_string()
}

fn default_monero_nodes() -> Vec<String> {
    vec![
        "https://xmr-01.tari.com".to_string(),
        "https://xmr-waw.tari.com".to_string(),
        "https://xmr-sbg.tari.com".to_string(),
        "https://xmr-gra.tari.com".to_string(),
        "https://xmr-bhs.tari.com".to_string(),
    ]
}

fn default_window_settings() -> Option<WindowSettings> {
    None
}

fn default_p2pool_stats_server_port() -> Option<u16> {
    None
}

fn default_changelog_version() -> String {
    Version::new(0, 0, 0).to_string()
}

fn default_node_type() -> NodeType {
    NodeType::Local
}
