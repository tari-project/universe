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
    configs::pools::gpu_pools::GpuPool,
    utils::platform_utils::{CurrentOperatingSystem, PlatformUtils},
};

#[derive(Debug, Serialize, Clone, Default)]
pub(crate) struct GpuMinerStatus {
    pub is_mining: bool,
    pub hash_rate: f64,
    pub estimated_earnings: u64, // Only for node connections
    pub algorithm: GpuMiningAlgorithm,
}

impl GpuMinerStatus {
    pub fn default_with_algorithm(algorithm: GpuMiningAlgorithm) -> Self {
        Self {
            is_mining: false,
            hash_rate: 0.0,
            estimated_earnings: 0,
            algorithm,
        }
    }
}

#[derive(Eq, Hash, PartialEq, Clone, Deserialize, Serialize, Debug)]
pub enum GpuMinerType {
    LolMiner,
}

impl GpuMinerType {
    pub fn get_expected_features(&self) -> Vec<GpuMinerFeature> {
        match self {
            GpuMinerType::LolMiner => vec![GpuMinerFeature::PoolMining],
        }
    }

    pub fn main_algorithm(&self) -> GpuMiningAlgorithm {
        match self {
            GpuMinerType::LolMiner => GpuMiningAlgorithm::C29,
        }
    }

    pub fn supported_algorithms(&self) -> Vec<GpuMiningAlgorithm> {
        match self {
            GpuMinerType::LolMiner => vec![GpuMiningAlgorithm::C29],
        }
    }

    pub fn supported_platforms(&self) -> Vec<CurrentOperatingSystem> {
        match self {
            GpuMinerType::LolMiner => vec![
                CurrentOperatingSystem::Windows,
                CurrentOperatingSystem::Linux,
            ],
        }
    }

    pub fn supported_pools(&self) -> Vec<GpuPool> {
        match self {
            GpuMinerType::LolMiner => vec![GpuPool::KryptexPoolC29, GpuPool::LuckyPoolC29],
        }
    }

    pub fn is_pool_supported(&self, pool: &GpuPool) -> bool {
        self.supported_pools().contains(pool)
    }

    pub fn default_pool(&self) -> Option<GpuPool> {
        match self {
            GpuMinerType::LolMiner => Some(GpuPool::LuckyPoolC29),
        }
    }

    pub fn is_supported_on_current_platform(&self) -> bool {
        let current_os = PlatformUtils::detect_current_os();
        self.supported_platforms().contains(&current_os)
    }
    pub fn is_pool_mining_supported(&self) -> bool {
        self.get_expected_features()
            .contains(&GpuMinerFeature::PoolMining)
    }
    pub fn is_solo_mining_supported(&self) -> bool {
        self.get_expected_features()
            .contains(&GpuMinerFeature::SoloMining)
    }
}

impl std::fmt::Display for GpuMinerType {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        let s = match self {
            GpuMinerType::LolMiner => "LolMiner",
        };
        write!(f, "{s}")
    }
}

#[derive(Debug, Eq, Hash, PartialEq, Clone, Serialize, Deserialize, Default)]
pub enum GpuMiningAlgorithm {
    #[default]
    C29,
}

#[derive(Eq, Hash, PartialEq, Clone, Serialize)]
pub enum GpuMinerFeature {
    /// Support for solo mining
    SoloMining,
    /// Support for mining in a pool
    PoolMining,
}

#[derive(Clone, Serialize)]
pub struct GpuMiner {
    pub miner_type: GpuMinerType,
    pub is_healthy: bool,
    pub last_error: Option<String>,
    pub features: Vec<GpuMinerFeature>,
    pub supported_algorithms: Vec<GpuMiningAlgorithm>,
}

impl GpuMiner {
    pub fn new(miner_type: GpuMinerType, is_healthy: bool, last_error: Option<String>) -> Self {
        Self {
            miner_type: miner_type.clone(),
            features: miner_type.get_expected_features(),
            supported_algorithms: miner_type.supported_algorithms(),
            is_healthy,
            last_error,
        }
    }
}

/// Defines priority of miners to be used when multiple miners are available
/// The first miner in the list has the highest priority
/// Used for selecting default or fallback miner
pub const MINERS_PRIORITY: &[GpuMinerType] = &[GpuMinerType::LolMiner];
