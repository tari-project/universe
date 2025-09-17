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

use crate::{
    configs::pools::PoolConfig,
    mining::gpu::consts::{GpuMinerType, GpuMiningAlgorithm},
};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SupportXTMGpuPoolConfig {
    pool_url: String,
    stats_url: String,
    pool_name: String,
    supported_algorithms: Vec<GpuMiningAlgorithm>,
}

impl Default for SupportXTMGpuPoolConfig {
    fn default() -> Self {
        Self {
            pool_url: "pool.sha3x.supportxtm.com:6118".to_string(),
            stats_url: "https://backend.sha3x.supportxtm.com/api/miner/%TARI_ADDRESS%/stats"
                .to_string(),
            pool_name: "SupportXTMPool".to_string(),
            supported_algorithms: vec![GpuMiningAlgorithm::SHA3X],
        }
    }
}

impl SupportXTMGpuPoolConfig {
    pub fn get_raw_stats_url(&self) -> String {
        self.stats_url.clone()
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
    supported_algorithms: Vec<GpuMiningAlgorithm>,
}

impl Default for LuckyPoolGpuConfig {
    fn default() -> Self {
        Self {
            pool_url: "tu.luckypool.io:5118".to_string(),
            stats_url: "https://api-tari.luckypool.io/stats_address?address=%TARI_ADDRESS%"
                .to_string(),
            pool_name: "LuckyPool".to_string(),
            supported_algorithms: vec![GpuMiningAlgorithm::SHA3X, GpuMiningAlgorithm::C29],
        }
    }
}

impl LuckyPoolGpuConfig {
    pub fn new(miner_type: GpuMinerType) -> Self {
        let pool_url = match miner_type {
            GpuMinerType::LolMiner => "taric29.luckypool.io:3111".to_string(),
            _ => LuckyPoolGpuConfig::default().get_pool_url(),
        };
        let stats_url = match miner_type {
            GpuMinerType::LolMiner => {
                "https://taric29.luckypool.io/api/stats_address?address=%TARI_ADDRESS%".to_string()
            }
            _ => LuckyPoolGpuConfig::default().get_raw_stats_url(),
        };
        Self {
            pool_url,
            stats_url,
            ..LuckyPoolGpuConfig::default()
        }
    }

    pub fn get_raw_stats_url(&self) -> String {
        self.stats_url.clone()
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

impl PoolConfig for GpuPool {
    fn name(&self) -> String {
        match self {
            GpuPool::LuckyPool(config) => config.pool_name.clone(),
            GpuPool::SupportXTMPool(config) => config.pool_name.clone(),
        }
    }

    fn default_from_name(name: &str) -> Result<Self, anyhow::Error> {
        match name {
            "LuckyPool" => Ok(GpuPool::LuckyPool(LuckyPoolGpuConfig::default())),
            "SupportXTMPool" => Ok(GpuPool::SupportXTMPool(SupportXTMGpuPoolConfig::default())),
            _ => Err(anyhow::anyhow!("Unknown GPU pool name: {}", name)),
        }
    }

    fn get_raw_stats_url(&self) -> String {
        match self {
            GpuPool::LuckyPool(config) => config.get_raw_stats_url(),
            GpuPool::SupportXTMPool(config) => config.get_raw_stats_url(),
        }
    }
    fn get_pool_url(&self) -> String {
        match self {
            GpuPool::LuckyPool(config) => config.get_pool_url(),
            GpuPool::SupportXTMPool(config) => config.get_pool_url(),
        }
    }
}

impl GpuPool {
    pub fn default_from_name_and_miner_type(name: &str, miner_type: GpuMinerType) -> Option<Self> {
        if miner_type.eq(&GpuMinerType::Glytex) {
            return None; // solo mining only
        }

        match name {
            "LuckyPool" => Some(GpuPool::LuckyPool(LuckyPoolGpuConfig::new(miner_type))),
            "SupportXTMPool" => Some(GpuPool::SupportXTMPool(SupportXTMGpuPoolConfig::default())),
            _ => None,
        }
    }

    pub fn default_for_miner_type(miner_type: GpuMinerType) -> Option<Self> {
        if miner_type.eq(&GpuMinerType::Glytex) {
            return None; // solo mining only
        }

        Some(GpuPool::LuckyPool(LuckyPoolGpuConfig::new(miner_type)))
    }

    pub fn get_supported_algorithms(&self) -> Vec<GpuMiningAlgorithm> {
        match self {
            GpuPool::LuckyPool(config) => config.supported_algorithms.clone(),
            GpuPool::SupportXTMPool(config) => config.supported_algorithms.clone(),
        }
    }

    pub fn is_miner_algorithms_supported(&self, miner_type: &GpuMinerType) -> bool {
        let is_supported = self
            .get_supported_algorithms()
            .iter()
            .any(|alg| miner_type.supported_algorithms().contains(alg));

        // LuckyPool with c29 algo requires specific pool URL for LolMiner
        if miner_type.eq(&GpuMinerType::LolMiner) {
            if self.get_pool_url().contains("c29") {
                println!("LolMiner requires specific pool URL for c29 algo, checking if current pool URL is correct...");
                return true;
            } else {
                println!("LolMiner requires specific pool URL for c29 algo, but current pool URL is not correct.");
                return false;
            }
        }

        if miner_type.eq(&GpuMinerType::Graxil) {
            if self.get_pool_url().contains("c29") {
                println!("Graxil does not support c29 algo, returning false.");
                return false;
            } else {
                println!("Graxil does not support c29 algo, returning true.");
                return true;
            }
        }

        is_supported
    }
}
