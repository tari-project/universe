use serde::{Deserialize, Serialize};
use tari_common::configuration::Network;

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
            pool_url: "pl-tarirx.luckypool.io:9118".to_string(),
            stats_url: "https://tarirx.luckypool.io/api/stats_address?address=%TARI_ADDRESS%"
                .to_string(),
            pool_name: "LuckyPool".to_string(),
        }
    }
}

impl LuckyPoolCpuConfig {
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

impl CpuPool {
    pub fn name(&self) -> String {
        match self {
            CpuPool::SupportXTMPool(config) => config.pool_name.clone(),
            CpuPool::LuckyPool(config) => config.pool_name.clone(),
        }
    }
}
