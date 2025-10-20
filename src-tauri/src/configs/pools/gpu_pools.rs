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

use std::{collections::HashMap, fmt::Display, sync::LazyLock};

use serde::{Deserialize, Serialize};

use crate::configs::pools::{BasePoolData, PoolOrigin};

static DEFAULT_GPU_LUCKYPOOL_SHA3X: LazyLock<BasePoolData<GpuPool>> =
    LazyLock::new(|| BasePoolData {
        pool_name: "LuckyPool [ SHA3X ]".to_string(),
        pool_url: "tu.luckypool.io:5118".to_string(),
        stats_url: "https://api-tari.luckypool.io/stats_address?address=%TARI_ADDRESS%".to_string(),
        pool_type: GpuPool::LuckyPoolSHA3X,
        pool_origin: PoolOrigin::LuckyPool,
    });

static DEFAULT_GPU_LUCKYPOOL_C29: LazyLock<BasePoolData<GpuPool>> =
    LazyLock::new(|| BasePoolData {
        pool_name: "LuckyPool [ C29 ]".to_string(),
        pool_url: "taric29.luckypool.io:3111".to_string(),
        stats_url: "https://taric29.luckypool.io/api/stats_address?address=%TARI_ADDRESS%"
            .to_string(),
        pool_type: GpuPool::LuckyPoolC29,
        pool_origin: PoolOrigin::LuckyPool,
    });

static DEFAULT_GPU_SUPPORTXTM_SHA3X: LazyLock<BasePoolData<GpuPool>> =
    LazyLock::new(|| BasePoolData {
        pool_name: "SupportXTMPool [ SHA3X ]".to_string(),
        pool_url: "pool.sha3x.supportxtm.com:6118".to_string(),
        stats_url: "https://backend.sha3x.supportxtm.com/api/miner/%TARI_ADDRESS%/stats"
            .to_string(),
        pool_type: GpuPool::SupportXTMPoolSHA3X,
        pool_origin: PoolOrigin::SupportXTM,
    });

static DEFAULT_GPU_KRYPTEX_SHA3X: LazyLock<BasePoolData<GpuPool>> =
    LazyLock::new(|| BasePoolData {
        pool_name: "KryptexPool [ SHA3X ]".to_string(),
        pool_url: "xtm-sha3x-tu.kryptex.network:7039".to_string(),
        stats_url: "https://pool.kryptex.com/xtm-sha3x/api/v1/miner/balance/%TARI_ADDRESS%"
            .to_string(),
        pool_type: GpuPool::KryptexPoolSHA3X,
        pool_origin: PoolOrigin::Kryptex,
    });

static DEFAULT_GPU_KRYPTEX_C29: LazyLock<BasePoolData<GpuPool>> = LazyLock::new(|| BasePoolData {
    pool_name: "KryptexPool [ C29 ]".to_string(),
    pool_url: "xtm-c29-tu.kryptex.network:7040".to_string(),
    stats_url: "https://pool.kryptex.com/xtm-c29/api/v1/miner/balance/%TARI_ADDRESS%".to_string(),
    pool_type: GpuPool::KryptexPoolC29,
    pool_origin: PoolOrigin::Kryptex,
});

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Hash, Default)]
pub enum GpuPool {
    #[default]
    LuckyPoolSHA3X,
    LuckyPoolC29,
    SupportXTMPoolSHA3X,
    KryptexPoolSHA3X,
    KryptexPoolC29,
}

impl Display for GpuPool {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        let name = match self {
            GpuPool::LuckyPoolSHA3X => "LuckyPoolSHA3X",
            GpuPool::LuckyPoolC29 => "LuckyPoolC29",
            GpuPool::SupportXTMPoolSHA3X => "SupportXTMPoolSHA3X",
            GpuPool::KryptexPoolSHA3X => "KryptexPoolSHA3X",
            GpuPool::KryptexPoolC29 => "KryptexPoolC29",
        };
        write!(f, "{name}")
    }
}

impl GpuPool {
    pub fn from_string(pool_name: &str) -> Result<GpuPool, anyhow::Error> {
        match pool_name {
            "LuckyPoolSHA3X" => Ok(GpuPool::LuckyPoolSHA3X),
            "LuckyPoolC29" => Ok(GpuPool::LuckyPoolC29),
            "SupportXTMPoolSHA3X" => Ok(GpuPool::SupportXTMPoolSHA3X),
            "KryptexPoolSHA3X" => Ok(GpuPool::KryptexPoolSHA3X),
            "KryptexPoolC29" => Ok(GpuPool::KryptexPoolC29),
            _ => Err(anyhow::anyhow!("Invalid GPU pool name")),
        }
    }

    pub fn key_string(&self) -> String {
        match self {
            GpuPool::LuckyPoolSHA3X => "LuckyPoolSHA3X".to_string(),
            GpuPool::LuckyPoolC29 => "LuckyPoolC29".to_string(),
            GpuPool::SupportXTMPoolSHA3X => "SupportXTMPoolSHA3X".to_string(),
            GpuPool::KryptexPoolSHA3X => "KryptexPoolSHA3X".to_string(),
            GpuPool::KryptexPoolC29 => "KryptexPoolC29".to_string(),
        }
    }

    pub fn default_content(&self) -> BasePoolData<GpuPool> {
        match self {
            GpuPool::LuckyPoolSHA3X => DEFAULT_GPU_LUCKYPOOL_SHA3X.clone(),
            GpuPool::LuckyPoolC29 => DEFAULT_GPU_LUCKYPOOL_C29.clone(),
            GpuPool::SupportXTMPoolSHA3X => DEFAULT_GPU_SUPPORTXTM_SHA3X.clone(),
            GpuPool::KryptexPoolSHA3X => DEFAULT_GPU_KRYPTEX_SHA3X.clone(),
            GpuPool::KryptexPoolC29 => DEFAULT_GPU_KRYPTEX_C29.clone(),
        }
    }

    pub fn load_default_pools_data() -> HashMap<Self, BasePoolData<GpuPool>> {
        use GpuPool::*;
        let mut gpu_pools = HashMap::new();
        gpu_pools.insert(LuckyPoolSHA3X, DEFAULT_GPU_LUCKYPOOL_SHA3X.clone());
        gpu_pools.insert(LuckyPoolC29, DEFAULT_GPU_LUCKYPOOL_C29.clone());
        gpu_pools.insert(SupportXTMPoolSHA3X, DEFAULT_GPU_SUPPORTXTM_SHA3X.clone());
        gpu_pools.insert(KryptexPoolSHA3X, DEFAULT_GPU_KRYPTEX_SHA3X.clone());
        gpu_pools.insert(KryptexPoolC29, DEFAULT_GPU_KRYPTEX_C29.clone());
        gpu_pools
    }
}
