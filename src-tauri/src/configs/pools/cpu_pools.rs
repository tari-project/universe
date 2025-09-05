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

use serde::{Deserialize, Serialize};
use tari_common::configuration::Network;

use crate::configs::pools::PoolConfig;

fn global_tari_cpu_mining_pool_url() -> String {
    match Network::get_current_or_user_setting_or_default() {
        Network::MainNet => "pool-global.tari.snipanet.com:3333".to_string(),
        Network::NextNet | Network::StageNet => "69.164.205.243:3333".to_string(),
        Network::LocalNet | Network::Igor | Network::Esmeralda => "69.164.205.243:3333".to_string(),
    }
}

fn global_tari_cpu_mining_pool_status_url() -> String {
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
pub struct SupportXTMCpuPoolConfig {
    pool_url: String,
    stats_url: String,
    pool_name: String,
}

impl Default for SupportXTMCpuPoolConfig {
    fn default() -> Self {
        Self {
            pool_url: global_tari_cpu_mining_pool_url(),
            stats_url: global_tari_cpu_mining_pool_status_url(),
            pool_name: "SupportXTMPool".to_string(),
        }
    }
}

impl SupportXTMCpuPoolConfig {
    pub fn get_raw_stats_url(&self) -> String {
        self.stats_url.clone()
    }
    pub fn get_stats_url(&self, tari_address: &str) -> String {
        self.stats_url.replace("%TARI_ADDRESS%", tari_address)
    }
    pub fn get_pool_url(&self) -> String {
        self.pool_url.clone()
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LuckyPoolCpuConfig {
    pool_url: String,
    stats_url: String,
    pool_name: String,
}

impl Default for LuckyPoolCpuConfig {
    fn default() -> Self {
        Self {
            pool_url: "turx.luckypool.io:10118".to_string(),
            stats_url: "https://tarirx.luckypool.io/api/stats_address?address=%TARI_ADDRESS%"
                .to_string(),
            pool_name: "LuckyPool".to_string(),
        }
    }
}

impl LuckyPoolCpuConfig {
    pub fn get_raw_stats_url(&self) -> String {
        self.stats_url.clone()
    }

    pub fn get_stats_url(&self, tari_address: &str) -> String {
        self.stats_url.replace("%TARI_ADDRESS%", tari_address)
    }
    pub fn get_pool_url(&self) -> String {
        self.pool_url.clone()
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum CpuPool {
    SupportXTMPool(SupportXTMCpuPoolConfig),
    LuckyPool(LuckyPoolCpuConfig),
}

impl Default for CpuPool {
    fn default() -> Self {
        CpuPool::LuckyPool(LuckyPoolCpuConfig::default())
    }
}

impl PoolConfig for CpuPool {
    fn name(&self) -> String {
        match self {
            CpuPool::SupportXTMPool(config) => config.pool_name.clone(),
            CpuPool::LuckyPool(config) => config.pool_name.clone(),
        }
    }

    fn default_from_name(name: &str) -> Result<Self, anyhow::Error> {
        match name {
            "LuckyPool" => Ok(CpuPool::LuckyPool(LuckyPoolCpuConfig::default())),
            "SupportXTMPool" => Ok(CpuPool::SupportXTMPool(SupportXTMCpuPoolConfig::default())),
            _ => Err(anyhow::anyhow!("Unknown CPU pool name: {}", name)),
        }
    }
    fn get_raw_stats_url(&self) -> String {
        match self {
            CpuPool::SupportXTMPool(config) => config.get_raw_stats_url(),
            CpuPool::LuckyPool(config) => config.get_raw_stats_url(),
        }
    }
    fn get_pool_url(&self) -> String {
        match self {
            CpuPool::SupportXTMPool(config) => config.get_pool_url(),
            CpuPool::LuckyPool(config) => config.get_pool_url(),
        }
    }
}
