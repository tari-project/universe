// Copyright 2025. The Tari Project
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

use anyhow::Error;
use log::info;
use serde::{Deserialize, Serialize};

const LOG_TARGET: &str = "tari::universe::pool_status_watcher";
#[derive(Clone, Debug, Serialize)]
pub(crate) struct PoolStatus {
    pub accepted_shares: u64,
    pub unpaid: u64,
    pub balance: u64,
    pub min_payout: u64,
}

pub(crate) trait PoolApiAdapter: Clone {
    fn convert_api_data(&self, data: &str) -> Result<PoolStatus, Error>;
}

#[derive(Clone, Debug)]
pub(crate) struct PoolStatusWatcher<T: Clone> {
    pub url: String,
    pub adapter: T,
}

impl<T: Clone> PoolStatusWatcher<T> {
    pub fn new(url: String, adapter: T) -> Self {
        Self { url, adapter }
    }
}

impl<T: PoolApiAdapter + Send + Sync + 'static> PoolStatusWatcher<T> {
    pub async fn get_pool_status(&self) -> Result<PoolStatus, Error> {
        let response = reqwest::get(&self.url).await?;
        let data = response.text().await?;
        let pool_status = self.adapter.convert_api_data(&data)?;
        Ok(pool_status)
    }
}

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
    fn convert_api_data(&self, data: &str) -> Result<PoolStatus, Error> {
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

#[derive(Serialize, Deserialize, Debug)]
pub struct LuckyPoolStatusResponseBody {}
#[derive(Clone, Debug)]
pub struct LuckyPoolAdapter {}

impl PoolApiAdapter for LuckyPoolAdapter {
    fn convert_api_data(&self, data: &str) -> Result<PoolStatus, Error> {
        let pool_status = PoolStatus {
            accepted_shares: 0,
            unpaid: 0,
            balance: 0,
            min_payout: 0,
        };
        Ok(pool_status)
    }
}
