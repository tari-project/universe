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
            pool_url: "pl-eu.luckypool.io:6118".to_string(),
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
}
