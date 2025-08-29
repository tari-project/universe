use serde::{Deserialize, Serialize};

use crate::mining::pools::{adapters::PoolApiAdapter, PoolStatus};

#[derive(Serialize, Deserialize, Debug)]
pub struct SupportXmrPoolStatusResponseBody {
    pub hash: u64,
    pub identifier: String,
    #[serde(rename = "lastHash")]
    pub last_hash: u64,
    #[serde(rename = "totalHashes")]
    pub total_hashes: u64,
    #[serde(rename = "validShares")]
    pub valid_shares: u64,
    #[serde(rename = "invalidShares")]
    pub invalid_shares: u64,
    pub expiry: u64,
    #[serde(rename = "amtPaid")]
    pub amt_paid: u64,
    #[serde(rename = "amtDue")]
    pub amt_due: u64,
    #[serde(rename = "txnCount")]
    pub txn_count: u32,
}

#[derive(Clone, Debug)]
pub struct SupportXmrPoolAdapter {}

impl PoolApiAdapter for SupportXmrPoolAdapter {
    fn convert_api_data(&self, data: &str) -> Result<PoolStatus, anyhow::Error> {
        let response: SupportXmrPoolStatusResponseBody = serde_json::from_str(data)?;
        let pool_status = PoolStatus {
            accepted_shares: response.valid_shares,
            unpaid: response.amt_due,
            balance: response.amt_paid + response.amt_due,
            min_payout: 0,
        };
        Ok(pool_status)
    }
}
