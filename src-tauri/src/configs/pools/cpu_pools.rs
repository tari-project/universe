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
use tari_common::configuration::Network;

use crate::configs::pools::{BasePoolData, PoolOrigin};

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

static DEFAULT_CPU_SUPPORTXTM_RANDOMX: LazyLock<BasePoolData<CpuPool>> =
    LazyLock::new(|| BasePoolData {
        pool_name: "SupportXTMPool [ RANDOMX ] ".to_string(),
        pool_url: global_tari_cpu_mining_pool_url(),
        stats_url: global_tari_cpu_mining_pool_status_url(),
        pool_type: CpuPool::SupportXTMPoolRANDOMX,
        pool_origin: PoolOrigin::SupportXTM,
    });

static DEFAULT_CPU_LUCKYPOOL_RANDOMX: LazyLock<BasePoolData<CpuPool>> =
    LazyLock::new(|| BasePoolData {
        pool_name: "LuckyPool [ RANDOMX ] ".to_string(),
        pool_url: "turx.luckypool.io:10118".to_string(),
        stats_url: "https://tarirx.luckypool.io/api/stats_address?address=%TARI_ADDRESS%"
            .to_string(),
        pool_type: CpuPool::LuckyPoolRANDOMX,
        pool_origin: PoolOrigin::LuckyPool,
    });

static DEFAULT_CPU_KRYPTEX_RANDOMX: LazyLock<BasePoolData<CpuPool>> =
    LazyLock::new(|| BasePoolData {
        pool_name: "KryptexPool [ RANDOMX ] ".to_string(),
        pool_url: "xtm-rx-tu.kryptex.network:7038".to_string(),
        stats_url: "https://pool.kryptex.com/xtm-rx/api/v1/miner/balance/%TARI_ADDRESS%"
            .to_string(),
        pool_type: CpuPool::KryptexPoolRANDOMX,
        pool_origin: PoolOrigin::Kryptex,
    });

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Hash, Default)]
pub enum CpuPool {
    SupportXTMPoolRANDOMX,
    #[default]
    LuckyPoolRANDOMX,
    KryptexPoolRANDOMX,
}

impl Display for CpuPool {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        let name = match self {
            CpuPool::SupportXTMPoolRANDOMX => "SupportXTMPoolRANDOMX",
            CpuPool::LuckyPoolRANDOMX => "LuckyPoolRANDOMX",
            CpuPool::KryptexPoolRANDOMX => "KryptexPoolRANDOMX",
        };
        write!(f, "{name}")
    }
}

impl CpuPool {
    pub fn from_string(pool_name: &str) -> Result<CpuPool, anyhow::Error> {
        match pool_name {
            "SupportXTMPoolRANDOMX" => Ok(CpuPool::SupportXTMPoolRANDOMX),
            "LuckyPoolRANDOMX" => Ok(CpuPool::LuckyPoolRANDOMX),
            "KryptexPoolRANDOMX" => Ok(CpuPool::KryptexPoolRANDOMX),
            _ => Err(anyhow::anyhow!("Invalid CPU pool name")),
        }
    }

    pub fn key_string(&self) -> String {
        match self {
            CpuPool::SupportXTMPoolRANDOMX => "SupportXTMPoolRANDOMX".to_string(),
            CpuPool::LuckyPoolRANDOMX => "LuckyPoolRANDOMX".to_string(),
            CpuPool::KryptexPoolRANDOMX => "KryptexPoolRANDOMX".to_string(),
        }
    }

    pub fn default_content(&self) -> BasePoolData<CpuPool> {
        match self {
            CpuPool::SupportXTMPoolRANDOMX => DEFAULT_CPU_SUPPORTXTM_RANDOMX.clone(),
            CpuPool::LuckyPoolRANDOMX => DEFAULT_CPU_LUCKYPOOL_RANDOMX.clone(),
            CpuPool::KryptexPoolRANDOMX => DEFAULT_CPU_KRYPTEX_RANDOMX.clone(),
        }
    }

    pub fn load_default_pools_data() -> HashMap<Self, BasePoolData<CpuPool>> {
        use CpuPool::*;
        let mut cpu_pools = HashMap::new();
        cpu_pools.insert(
            SupportXTMPoolRANDOMX,
            DEFAULT_CPU_SUPPORTXTM_RANDOMX.clone(),
        );
        cpu_pools.insert(LuckyPoolRANDOMX, DEFAULT_CPU_LUCKYPOOL_RANDOMX.clone());
        cpu_pools.insert(KryptexPoolRANDOMX, DEFAULT_CPU_KRYPTEX_RANDOMX.clone());
        cpu_pools
    }
}
