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

use getset::{Getters, Setters};
use serde::{Deserialize, Serialize};
use std::{sync::LazyLock, time::SystemTime};
use tari_common::configuration::Network;
use tauri::{AppHandle, Manager};
use tokio::sync::RwLock;

use crate::{EventsEmitter, UniverseAppState};

use super::{
    config_wallet::ConfigWallet,
    trait_config::{ConfigContentImpl, ConfigImpl},
};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SupportXTMPoolConfig {
    pool_url: String,
    stats_url: String,
}

impl Default for SupportXTMPoolConfig {
    fn default() -> Self {
        Self {
            pool_url: "pool.sha3x.supportxtm.com:6118".to_string(),
            stats_url: "https://backend.sha3x.supportxtm.com/api/miner/%TARI_ADDRESS%/stats"
                .to_string(),
        }
    }
}

impl SupportXTMPoolConfig {
    pub fn get_stats_url(&self, tari_address: &str) -> String {
        self.stats_url.replace("%TARI_ADDRESS%", tari_address)
    }
    pub fn get_pool_url(&self) -> String {
        self.pool_url.clone()
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LuckyGpuPoolConfig {
    pool_url: String,
    stats_url: String,
}

impl Default for LuckyGpuPoolConfig {
    fn default() -> Self {
        Self {
            pool_url: "pl-eu.luckypool.io:6118".to_string(),
            stats_url: "https://api-tari.luckypool.io/stats_address?address=%TARI_ADDRESS%"
                .to_string(),
        }
    }
}

impl LuckyGpuPoolConfig {
    pub fn get_stats_url(&self, tari_address: &str) -> String {
        self.stats_url.replace("%TARI_ADDRESS%", tari_address)
    }
    pub fn get_pool_url(&self) -> String {
        self.pool_url.clone()
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum GpuPool {
    LuckyPool(LuckyGpuPoolConfig),
    SupportXTMPool(SupportXTMPoolConfig),
}

fn default_cpu_mining_pool_url() -> String {
    match Network::get_current_or_user_setting_or_default() {
        Network::MainNet => "pool-global.tari.snipanet.com:3333".to_string(),
        Network::NextNet | Network::StageNet => "69.164.205.243:3333".to_string(),
        Network::LocalNet | Network::Igor | Network::Esmeralda => "69.164.205.243:3333".to_string(),
    }
}

fn default_cpu_mining_pool_status_url() -> String {
    match Network::get_current_or_user_setting_or_default() {
        Network::MainNet => {
            "https://pool.rxt.tari.jagtech.io/api/miner/%TARI_ADDRESS%/stats".to_string()
        }
        Network::NextNet | Network::StageNet => {
            "http://69.164.205.243:3333/api/miner/%TARI_ADDRESS%/stats".to_string()
        }
        Network::LocalNet | Network::Igor | Network::Esmeralda => {
            "http://69.164.205.243:3333/api/miner/%TARI_ADDRESS%/stats".to_string()
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DefaultCpuPoolConfig {
    pool_url: String,
    stats_url: String,
}

impl Default for DefaultCpuPoolConfig {
    fn default() -> Self {
        Self {
            pool_url: default_cpu_mining_pool_url(),
            stats_url: default_cpu_mining_pool_status_url(),
        }
    }
}

impl DefaultCpuPoolConfig {
    pub fn get_stats_url(&self, tari_address: &str) -> String {
        self.stats_url.replace("%TARI_ADDRESS%", tari_address)
    }
    pub fn get_pool_url(&self) -> String {
        self.pool_url.clone()
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum CpuPool {
    DefaultPool(DefaultCpuPoolConfig),
}

static INSTANCE: LazyLock<RwLock<ConfigPools>> = LazyLock::new(|| RwLock::new(ConfigPools::new()));

#[allow(clippy::struct_excessive_bools)]
#[derive(Serialize, Deserialize, Clone)]
#[serde(rename_all = "snake_case")]
#[serde(default)]
#[derive(Getters, Setters)]
#[getset(get = "pub", set = "pub")]
pub struct ConfigPoolsContent {
    // ======= Config internals =======
    was_config_migrated: bool,
    created_at: SystemTime,
    // ======= Gpu Pool =======
    gpu_pool_enabled: bool,
    gpu_pool: GpuPool,
    // ======= Cpu Pool =======
    cpu_pool_enabled: bool,
    cpu_pool: CpuPool,
}

impl Default for ConfigPoolsContent {
    fn default() -> Self {
        Self {
            // ======= Config internals =======
            was_config_migrated: false,
            created_at: SystemTime::now(),
            // ======= Gpu Pool =======
            gpu_pool_enabled: true,
            gpu_pool: GpuPool::SupportXTMPool(SupportXTMPoolConfig::default()),
            // ======= Cpu Pool =======
            cpu_pool_enabled: true,
            cpu_pool: CpuPool::DefaultPool(DefaultCpuPoolConfig::default()),
        }
    }
}
impl ConfigContentImpl for ConfigPoolsContent {}

pub struct ConfigPools {
    content: ConfigPoolsContent,
    app_handle: RwLock<Option<AppHandle>>,
}

impl ConfigPools {
    pub async fn initialize(app_handle: AppHandle) {
        let state = app_handle.state::<UniverseAppState>();
        let mut config = Self::current().write().await;
        config.load_app_handle(app_handle.clone()).await;

        let mut cpu_config = state.cpu_miner_config.write().await;
        let tari_address = ConfigWallet::content().await.tari_address().clone();
        if let Some(address) = &tari_address {
            cpu_config.load_from_config_pools(config.content.clone(), address);
        }
        drop(cpu_config);

        EventsEmitter::emit_pools_config_loaded(config.content.clone()).await;
    }
}

impl ConfigImpl for ConfigPools {
    type Config = ConfigPoolsContent;

    fn current() -> &'static RwLock<Self> {
        &INSTANCE
    }

    fn new() -> Self {
        Self {
            content: ConfigPools::_load_or_create(),
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
        "config_pools".to_string()
    }

    fn _get_content(&self) -> &Self::Config {
        &self.content
    }

    fn _get_content_mut(&mut self) -> &mut Self::Config {
        &mut self.content
    }
}
