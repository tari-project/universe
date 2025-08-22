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

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SupportXTMGpuPoolConfig {
    pool_url: String,
    stats_url: String,
    pool_name: String,
}

impl Default for SupportXTMGpuPoolConfig {
    fn default() -> Self {
        Self {
            pool_url: "pool.sha3x.supportxtm.com:6118".to_string(),
            stats_url: "https://backend.sha3x.supportxtm.com/api/miner/%TARI_ADDRESS%/stats"
                .to_string(),
            pool_name: "SupportXTMPool".to_string(),
        }
    }
}

impl SupportXTMGpuPoolConfig {
    pub fn get_stats_url(&self, tari_address: &str) -> String {
        self.stats_url.replace("%TARI_ADDRESS%", tari_address)
    }
    pub fn get_pool_url(&self) -> String {
        self.pool_url.clone()
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LuckyPoolGpuConfig {
    pool_url: String,
    stats_url: String,
    pool_name: String,
}

impl Default for LuckyPoolGpuConfig {
    fn default() -> Self {
        Self {
            pool_url: "tu.luckypool.io:5118".to_string(),
            stats_url: "https://api-tari.luckypool.io/stats_address?address=%TARI_ADDRESS%"
                .to_string(),
            pool_name: "LuckyPool".to_string(),
        }
    }
}

impl LuckyPoolGpuConfig {
    pub fn get_stats_url(&self, tari_address: &str) -> String {
        self.stats_url.replace("%TARI_ADDRESS%", tari_address)
    }
    pub fn get_pool_url(&self) -> String {
        self.pool_url.clone()
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum GpuPool {
    LuckyPool(LuckyPoolGpuConfig),
    SupportXTMPool(SupportXTMGpuPoolConfig),
}

impl Default for GpuPool {
    fn default() -> Self {
        GpuPool::LuckyPool(LuckyPoolGpuConfig::default())
    }
}

impl GpuPool {
    pub fn name(&self) -> String {
        match self {
            GpuPool::LuckyPool(config) => config.pool_name.clone(),
            GpuPool::SupportXTMPool(config) => config.pool_name.clone(),
        }
    }
    pub fn default_from_name(name: &str) -> Result<Self, anyhow::Error> {
        match name {
            "LuckyPool" => Ok(GpuPool::LuckyPool(LuckyPoolGpuConfig::default())),
            "SupportXTMPool" => Ok(GpuPool::SupportXTMPool(SupportXTMGpuPoolConfig::default())),
            _ => Err(anyhow::anyhow!("Unknown GPU pool name: {}", name)),
        }
    }
}
