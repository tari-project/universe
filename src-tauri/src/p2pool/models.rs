use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use tari_core::transactions::tari_amount::MicroMinotari;
use tari_utilities::epoch_time::EpochTime;

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct StatsBlock {
    pub hash: String,
    pub height: u64,
    pub timestamp: EpochTime,
    pub miner_wallet_address: Option<String>,
}

#[derive(Serialize, Deserialize, Debug, Default, Clone)]
pub struct TribeDetails {
    pub id: String,
    pub name: String,
}

#[derive(Serialize, Deserialize, Debug, Default, Clone)]
pub struct Stats {
    pub connected: bool,
    pub connected_since: Option<EpochTime>,
    pub tribe: TribeDetails,
    pub num_of_miners: usize,
    pub last_block_won: Option<StatsBlock>,
    pub share_chain_height: u64,
    pub pool_hash_rate: String,
    pub pool_total_earnings: MicroMinotari,
    pub pool_total_estimated_earnings: EstimatedEarnings,
    pub total_earnings: HashMap<String, u64>,
    pub estimated_earnings: HashMap<String, EstimatedEarnings>,
    pub miner_block_stats: BlockStats,
    pub p2pool_block_stats: BlockStats,
}

#[derive(Serialize, Deserialize, Debug, Default, Clone)]
pub struct BlockStats {
    pub accepted: u64,
    pub rejected: u64,
    pub submitted: u64,
}

#[derive(Serialize, Deserialize, Debug, Default, Clone)]
pub struct EstimatedEarnings {
    #[serde(rename = "1min")]
    pub one_minute: MicroMinotari,
    #[serde(rename = "1h")]
    pub one_hour: MicroMinotari,
    #[serde(rename = "1d")]
    pub one_day: MicroMinotari,
    #[serde(rename = "1w")]
    pub one_week: MicroMinotari,
    #[serde(rename = "30d")]
    pub one_month: MicroMinotari,
}
