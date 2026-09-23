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

use std::collections::HashMap;

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

#[derive(Eq, Hash, PartialEq, Clone, Deserialize, Serialize, Debug, Default)]
pub enum GpuMinerType {
    #[default]
    LolMiner,
    /// The open source CUDA C29 miner: <https://github.com/tari-project/TARI.Miner>
    TariMiner,
}

impl GpuMinerType {
    /// Resolves a miner type from its persisted/display name.
    /// Unknown names (for example the miners that were removed together with SHA3) return `None`
    /// so callers can fall back to the default instead of failing.
    pub fn from_name(name: &str) -> Option<GpuMinerType> {
        match name {
            "LolMiner" => Some(GpuMinerType::LolMiner),
            "TariMiner" => Some(GpuMinerType::TariMiner),
            _ => None,
        }
    }

    pub fn get_expected_features(&self) -> Vec<GpuMinerFeature> {
        match self {
            GpuMinerType::LolMiner => vec![
                GpuMinerFeature::PoolMining,
                GpuMinerFeature::DeviceExclusion,
            ],
            GpuMinerType::TariMiner => vec![
                GpuMinerFeature::PoolMining,
                GpuMinerFeature::DeviceExclusion,
                GpuMinerFeature::SingleDeviceMining,
            ],
        }
    }

    pub fn main_algorithm(&self) -> GpuMiningAlgorithm {
        match self {
            GpuMinerType::LolMiner | GpuMinerType::TariMiner => GpuMiningAlgorithm::C29,
        }
    }

    pub fn supported_algorithms(&self) -> Vec<GpuMiningAlgorithm> {
        match self {
            GpuMinerType::LolMiner | GpuMinerType::TariMiner => vec![GpuMiningAlgorithm::C29],
        }
    }

    pub fn supported_platforms(&self) -> Vec<CurrentOperatingSystem> {
        match self {
            // TARI.Miner only ships NVIDIA CUDA backends for Windows and Linux
            GpuMinerType::LolMiner | GpuMinerType::TariMiner => vec![
                CurrentOperatingSystem::Windows,
                CurrentOperatingSystem::Linux,
            ],
        }
    }

    pub fn supported_pools(&self) -> Vec<GpuPool> {
        match self {
            GpuMinerType::LolMiner | GpuMinerType::TariMiner => {
                vec![GpuPool::KryptexPoolC29, GpuPool::LuckyPoolC29]
            }
        }
    }

    pub fn is_pool_supported(&self, pool: &GpuPool) -> bool {
        self.supported_pools().contains(pool)
    }

    pub fn default_pool(&self) -> Option<GpuPool> {
        match self {
            GpuMinerType::LolMiner | GpuMinerType::TariMiner => Some(GpuPool::LuckyPoolC29),
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
            GpuMinerType::TariMiner => "TariMiner",
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
    /// Support for excluding specific GPU devices
    DeviceExclusion,
    /// Mines on one device at a time. Device exclusion still applies, but it picks which single
    /// device is used rather than adding devices to the ones already mining.
    SingleDeviceMining,
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
pub const MINERS_PRIORITY: &[GpuMinerType] = &[GpuMinerType::LolMiner, GpuMinerType::TariMiner];

/// Resolves the miner that should actually be used, given the miner the user picked and the miners
/// that were successfully initialized on this machine.
/// The saved miner wins whenever it is available and healthy, otherwise the first healthy miner in
/// `MINERS_PRIORITY` is used. Returns `None` when there is nothing to fall back to.
pub fn resolve_selected_miner(
    saved_miner: &GpuMinerType,
    available_miners: &HashMap<GpuMinerType, GpuMiner>,
) -> Option<GpuMinerType> {
    if matches!(available_miners.get(saved_miner), Some(m) if m.is_healthy) {
        return Some(saved_miner.clone());
    }

    MINERS_PRIORITY
        .iter()
        .find(|miner_type| matches!(available_miners.get(miner_type), Some(m) if m.is_healthy))
        .cloned()
}

#[cfg(test)]
mod tests {
    use super::*;

    fn miner(miner_type: GpuMinerType, is_healthy: bool) -> (GpuMinerType, GpuMiner) {
        (
            miner_type.clone(),
            GpuMiner::new(miner_type, is_healthy, None),
        )
    }

    #[test]
    fn from_name_maps_known_miners_and_ignores_legacy_ones() {
        assert_eq!(
            GpuMinerType::from_name("LolMiner"),
            Some(GpuMinerType::LolMiner)
        );
        assert_eq!(
            GpuMinerType::from_name("TariMiner"),
            Some(GpuMinerType::TariMiner)
        );
        assert_eq!(GpuMinerType::from_name("Graxil"), None);
        assert_eq!(GpuMinerType::from_name(""), None);
    }

    #[test]
    fn from_name_round_trips_with_display() {
        for miner_type in MINERS_PRIORITY {
            assert_eq!(
                GpuMinerType::from_name(&miner_type.to_string()).as_ref(),
                Some(miner_type)
            );
        }
    }

    #[test]
    fn resolve_selected_miner_keeps_the_saved_miner_when_it_is_healthy() {
        let available = HashMap::from([
            miner(GpuMinerType::LolMiner, true),
            miner(GpuMinerType::TariMiner, true),
        ]);

        assert_eq!(
            resolve_selected_miner(&GpuMinerType::TariMiner, &available),
            Some(GpuMinerType::TariMiner)
        );
    }

    #[test]
    fn resolve_selected_miner_falls_back_when_the_saved_miner_is_unavailable() {
        let available = HashMap::from([miner(GpuMinerType::LolMiner, true)]);

        assert_eq!(
            resolve_selected_miner(&GpuMinerType::TariMiner, &available),
            Some(GpuMinerType::LolMiner)
        );
    }

    #[test]
    fn resolve_selected_miner_falls_back_when_the_saved_miner_is_unhealthy() {
        let available = HashMap::from([
            miner(GpuMinerType::LolMiner, false),
            miner(GpuMinerType::TariMiner, true),
        ]);

        assert_eq!(
            resolve_selected_miner(&GpuMinerType::LolMiner, &available),
            Some(GpuMinerType::TariMiner)
        );
    }

    #[test]
    fn resolve_selected_miner_returns_none_when_nothing_is_healthy() {
        let available = HashMap::from([miner(GpuMinerType::LolMiner, false)]);

        assert_eq!(
            resolve_selected_miner(&GpuMinerType::LolMiner, &available),
            None
        );
        assert_eq!(
            resolve_selected_miner(&GpuMinerType::LolMiner, &HashMap::new()),
            None
        );
    }
}
