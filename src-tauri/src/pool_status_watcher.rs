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
use log::warn;
use serde::{Deserialize, Serialize};

#[allow(dead_code)]
const LOG_TARGET: &str = "tari::universe::pool_status_watcher";
#[derive(Clone, Debug, Serialize, Default)]
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
pub(crate) struct PoolStatusWatcher<T: PoolApiAdapter> {
    pub url: String,
    pub adapter: T,
}

impl<T: PoolApiAdapter> PoolStatusWatcher<T> {
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
pub enum LuckyPoolNumber {
    String(String),
    Number(u64),
}

impl Default for LuckyPoolNumber {
    fn default() -> Self {
        LuckyPoolNumber::Number(0)
    }
}

impl std::fmt::Display for LuckyPoolNumber {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            LuckyPoolNumber::String(s) => write!(f, "{s}"),
            LuckyPoolNumber::Number(n) => write!(f, "{n}"),
        }
    }
}

impl LuckyPoolNumber {
    pub fn get_number(&self) -> u64 {
        match self {
            LuckyPoolNumber::String(s) => s.parse().unwrap_or(0),
            LuckyPoolNumber::Number(n) => *n,
        }
    }
}

fn parse_lucky_pool_number<'de, D>(deserializer: D) -> Result<LuckyPoolNumber, D::Error>
where
    D: serde::Deserializer<'de>,
{
    use serde::de::{self, Visitor};
    use std::fmt;

    struct LuckyPoolNumberVisitor;

    impl<'de> Visitor<'de> for LuckyPoolNumberVisitor {
        type Value = LuckyPoolNumber;

        fn expecting(&self, formatter: &mut fmt::Formatter) -> fmt::Result {
            formatter.write_str("a string or integer")
        }

        fn visit_str<E>(self, value: &str) -> Result<Self::Value, E>
        where
            E: de::Error,
        {
            if let Ok(n) = value.parse::<u64>() {
                Ok(LuckyPoolNumber::Number(n))
            } else {
                Ok(LuckyPoolNumber::String(value.to_string()))
            }
        }

        fn visit_u64<E>(self, value: u64) -> Result<Self::Value, E>
        where
            E: de::Error,
        {
            Ok(LuckyPoolNumber::Number(value))
        }
    }

    deserializer.deserialize_any(LuckyPoolNumberVisitor)
}

#[derive(Serialize, Deserialize, Debug, Default)]
#[serde(default)]
pub struct LuckyPoolStats {
    pub wallet: String,
    #[serde(
        rename = "rejectedShares",
        deserialize_with = "parse_lucky_pool_number"
    )]
    pub rejected_shares: LuckyPoolNumber,
    #[serde(
        rename = "acceptedShares",
        deserialize_with = "parse_lucky_pool_number"
    )]
    pub accepted_shares: LuckyPoolNumber,
    #[serde(deserialize_with = "parse_lucky_pool_number")]
    pub hashrate: LuckyPoolNumber,
    pub email: Option<String>,
    #[serde(deserialize_with = "parse_lucky_pool_number")]
    pub paid: LuckyPoolNumber,
    #[serde(rename = "paymentEnabled")]
    pub payment_enabled: bool,
    #[serde(
        rename = "paymentThreshold",
        deserialize_with = "parse_lucky_pool_number"
    )]
    pub payment_threshold: LuckyPoolNumber,
    #[serde(deserialize_with = "parse_lucky_pool_number")]
    pub unlocked: LuckyPoolNumber,
    #[serde(deserialize_with = "parse_lucky_pool_number")]
    pub locked: LuckyPoolNumber,
}

#[derive(Serialize, Deserialize, Debug, Default)]

pub struct HashrateAvg {
    #[serde(rename = "1h", deserialize_with = "parse_lucky_pool_number")]
    pub one_hour: LuckyPoolNumber,
    #[serde(rename = "6h", deserialize_with = "parse_lucky_pool_number")]
    pub six_hours: LuckyPoolNumber,
    #[serde(rename = "24h", deserialize_with = "parse_lucky_pool_number")]
    pub twenty_four_hours: LuckyPoolNumber,
}
#[derive(Serialize, Deserialize, Debug, Default)]
#[serde(default)]
pub struct LuckyPoolWorker {
    pub name: String,
    #[serde(rename = "minerAgent")]
    pub miner_agent: String,
    #[serde(rename = "loginTime")]
    pub login_time: String,
    pub region: String,
    pub port: String,
    #[serde(rename = "firstConnect")]
    pub first_connect: String,
    #[serde(rename = "lastJobDiff")]
    pub last_job_diff: String,
    #[serde(
        rename = "rejectedShares",
        deserialize_with = "parse_lucky_pool_number"
    )]
    pub rejected_shares: LuckyPoolNumber,
    #[serde(deserialize_with = "parse_lucky_pool_number")]
    pub hashrate: LuckyPoolNumber,
    #[serde(rename = "hashrateAvg")]
    pub hashrate_avg: HashrateAvg,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct LuckyPoolCharts {
    #[serde(rename = "hashrate")]
    pub hashrate: Option<String>,
}
#[derive(Serialize, Deserialize, Debug)]
pub struct LuckyPoolPayment {}
#[derive(Serialize, Deserialize, Debug)]
pub struct LuckyPoolReward {}

#[derive(Serialize, Deserialize, Debug)]
pub struct LuckyPoolRewardStats {
    pub period: String,
    #[serde(deserialize_with = "parse_lucky_pool_number")]
    pub blocks: LuckyPoolNumber,
    #[serde(deserialize_with = "parse_lucky_pool_number")]
    pub amount: LuckyPoolNumber,
    #[serde(rename = "startTime", deserialize_with = "parse_lucky_pool_number")]
    pub start_time: LuckyPoolNumber,
    #[serde(rename = "endTime", deserialize_with = "parse_lucky_pool_number")]
    pub end_time: LuckyPoolNumber,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct LuckyPoolStatusResponseBody {
    pub stats: LuckyPoolStats,
    #[serde(skip)]
    pub _workers: Vec<LuckyPoolWorker>,
    #[serde(skip)]
    pub _charts: Option<LuckyPoolCharts>,
    #[serde(skip)]
    pub _payments: Vec<LuckyPoolPayment>,
    #[serde(skip)]
    pub _rewards: Vec<LuckyPoolReward>,
    #[serde(rename = "rewardStats", skip)]
    pub _reward_stats: Vec<LuckyPoolRewardStats>,
}

#[derive(Clone, Debug)]
pub struct LuckyPoolAdapter {}

impl PoolApiAdapter for LuckyPoolAdapter {
    fn convert_api_data(&self, data: &str) -> Result<PoolStatus, Error> {
        if data.contains("Address not found") {
            warn!(target: LOG_TARGET, "Received 'Address not found' error from LuckyPool API");
            return Ok(PoolStatus::default());
        };

        let converted_data: LuckyPoolStatusResponseBody = serde_json::from_str(data)?;
        let pool_status = PoolStatus {
            accepted_shares: converted_data.stats.accepted_shares.get_number(),
            unpaid: converted_data.stats.unlocked.get_number()
                + converted_data.stats.locked.get_number(),
            balance: converted_data.stats.paid.get_number(),
            min_payout: converted_data.stats.payment_threshold.get_number(),
        };
        Ok(pool_status)
    }
}

#[derive(Clone)]
pub enum PoolApiAdapters {
    LuckyPool(LuckyPoolAdapter),
    SupportXmrPool(SupportXmrPoolAdapter),
}

impl PoolApiAdapter for PoolApiAdapters {
    fn convert_api_data(&self, data: &str) -> Result<PoolStatus, Error> {
        match self {
            PoolApiAdapters::LuckyPool(adapter) => adapter.convert_api_data(data),
            PoolApiAdapters::SupportXmrPool(adapter) => adapter.convert_api_data(data),
        }
    }
}
