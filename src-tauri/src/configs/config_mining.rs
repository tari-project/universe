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

use crate::{events_manager::EventsManager, gpu_miner::EngineType, UniverseAppState};
use std::{sync::LazyLock, time::SystemTime};

use getset::{Getters, Setters};
use serde::{Deserialize, Serialize};
use tari_common::configuration::Network;
use tauri::{AppHandle, Manager};
use tokio::sync::RwLock;

use super::trait_config::{ConfigContentImpl, ConfigImpl};

static INSTANCE: LazyLock<RwLock<ConfigMining>> =
    LazyLock::new(|| RwLock::new(ConfigMining::new()));

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
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct GpuThreads {
    pub gpu_name: String,
    pub max_gpu_threads: u32,
}

#[derive(Serialize, Deserialize, Clone)]
#[serde(rename_all = "snake_case")]
#[serde(default)]
#[derive(Getters, Setters)]
#[getset(get = "pub", set = "pub")]
#[allow(clippy::struct_excessive_bools)]
pub struct ConfigMiningContent {
    was_config_migrated: bool,
    created_at: SystemTime,
    mode: MiningMode,
    eco_mode_cpu_threads: Option<u32>,
    mine_on_app_start: bool,
    ludicrous_mode_cpu_threads: Option<u32>,
    eco_mode_cpu_options: Vec<String>,
    ludicrous_mode_cpu_options: Vec<String>,
    custom_mode_cpu_options: Vec<String>,
    custom_max_cpu_usage: Option<u32>,
    custom_max_gpu_usage: Vec<GpuThreads>,
    gpu_mining_enabled: bool,
    cpu_mining_enabled: bool,
    gpu_engine: EngineType,
    squad_override: Option<String>,
    cpu_mining_pool_url: Option<String>,
    cpu_mining_pool_status_url: Option<String>,
    gpu_mining_pool_url: Option<String>,
    mining_time: u128,
}

impl Default for ConfigMiningContent {
    fn default() -> Self {
        Self {
            was_config_migrated: false,
            created_at: SystemTime::now(),
            mode: MiningMode::Eco,
            eco_mode_cpu_threads: None,
            mine_on_app_start: true,
            ludicrous_mode_cpu_threads: None,
            eco_mode_cpu_options: vec![],
            ludicrous_mode_cpu_options: vec![],
            custom_mode_cpu_options: vec![],
            custom_max_cpu_usage: None,
            custom_max_gpu_usage: vec![],
            gpu_mining_enabled: true,
            cpu_mining_enabled: true,
            gpu_engine: EngineType::OpenCL,
            squad_override: None,
            cpu_mining_pool_url: default_cpu_mining_pool_url(),
            cpu_mining_pool_status_url: default_cpu_mining_pool_status_url(),
            gpu_mining_pool_url: None,
            mining_time: 0,
        }
    }
}
impl ConfigContentImpl for ConfigMiningContent {}

fn default_cpu_mining_pool_url() -> Option<String> {
    match Network::get_current_or_user_setting_or_default() {
        Network::MainNet => Some("pool-global.tari.snipanet.com:3333".to_string()),
        Network::NextNet | Network::StageNet => Some("69.164.205.243:3333".to_string()),
        Network::LocalNet | Network::Igor | Network::Esmeralda => {
            Some("69.164.205.243:3333".to_string())
        }
    }
}

fn default_cpu_mining_pool_status_url() -> Option<String> {
    match Network::get_current_or_user_setting_or_default() {
        Network::MainNet => {
            Some("https://pool.rxt.tari.jagtech.io/api/miner/%TARI_ADDRESS%/stats".to_string())
        }
        Network::NextNet | Network::StageNet => {
            Some("http://69.164.205.243:3333/api/miner/%TARI_ADDRESS%/stats".to_string())
        }
        Network::LocalNet | Network::Igor | Network::Esmeralda => {
            Some("http://69.164.205.243:3333/api/miner/%TARI_ADDRESS%/stats".to_string())
        }
    }
}

pub struct ConfigMining {
    content: ConfigMiningContent,
    app_handle: RwLock<Option<AppHandle>>,
}

impl ConfigMining {
    pub async fn initialize(app_handle: AppHandle) {
        let state = app_handle.state::<UniverseAppState>();
        let mut config = Self::current().write().await;
        config.load_app_handle(app_handle.clone()).await;

        let mut cpu_config = state.cpu_miner_config.write().await;
        cpu_config.load_from_config_mining(config._get_content());
        drop(cpu_config);

        EventsManager::handle_config_mining_loaded(&app_handle, config.content.clone()).await;
    }
}

impl ConfigImpl for ConfigMining {
    type Config = ConfigMiningContent;

    fn current() -> &'static RwLock<Self> {
        &INSTANCE
    }

    fn new() -> Self {
        Self {
            content: ConfigMining::_load_or_create(),
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
        "config_mining".to_string()
    }

    fn _get_content(&self) -> &Self::Config {
        &self.content
    }

    fn _get_content_mut(&mut self) -> &mut Self::Config {
        &mut self.content
    }
}
