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
use log::warn;
use serde::{Deserialize, Serialize};
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
            cpu_mining_pool_url: Some("104.161.20.146:1337".to_string()),
            cpu_mining_pool_status_url: Some(
                "http://104.161.20.146:1338/api/miner/%TARI_ADDRESS%/stats".to_string(),
            ),
            gpu_mining_pool_url: None,
            mining_time: 0,
        }
    }
}
impl ConfigContentImpl for ConfigMiningContent {}

pub struct ConfigMining {
    content: ConfigMiningContent,
    app_handle: RwLock<Option<AppHandle>>,
}

impl ConfigMining {
    pub async fn initialize(app_handle: AppHandle) {
        let state = app_handle.state::<UniverseAppState>();
        let mut config = Self::current().write().await;
        config.load_app_handle(app_handle.clone()).await;

        // TODO: Remove this when the migration is done
        // Can be removed before merging to main
        let old_cpu_mining_pool_url: Option<String> = Some("pool.supportxmr.com:3333".to_string());
        let old_cpu_mining_pool_status_url: Option<String> =
            Some("https://www.supportxmr.com/api/miner/%MONERO_ADDRESS%/stats".to_string());

        // force the default values for the pool urls in case they are not set
        let is_cpu_mining_pool_url_not_set = config.content.cpu_mining_pool_url.is_none();
        let is_old_cpu_mining_pool_url = config
            .content
            .cpu_mining_pool_url
            .eq(&old_cpu_mining_pool_url);
        if is_cpu_mining_pool_url_not_set || is_old_cpu_mining_pool_url {
            config.content.cpu_mining_pool_url = ConfigMiningContent::default().cpu_mining_pool_url;
        }

        // force the default values for the pool urls in case they are not set
        let is_cpu_mining_pool_status_url_not_set =
            config.content.cpu_mining_pool_status_url.is_none();
        let is_old_cpu_mining_pool_status_url = config
            .content
            .cpu_mining_pool_status_url
            .eq(&old_cpu_mining_pool_status_url);

        if is_cpu_mining_pool_status_url_not_set || is_old_cpu_mining_pool_status_url {
            config.content.cpu_mining_pool_status_url =
                ConfigMiningContent::default().cpu_mining_pool_status_url;
        }
        // update json file to reflect the default values
        if is_cpu_mining_pool_url_not_set
            || is_cpu_mining_pool_status_url_not_set
            || is_old_cpu_mining_pool_url
            || is_old_cpu_mining_pool_status_url
        {
            let _unused = ConfigMining::_save_config(config.content.clone()).inspect_err(
            |error| {
                warn!(target: crate::LOG_TARGET, "[{}] [save_config] error: {:?}", Self::_get_name(), error);
            },
        );
        }

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
