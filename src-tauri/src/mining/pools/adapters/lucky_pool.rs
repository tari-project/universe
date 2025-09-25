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

use crate::{
    mining::pools::{adapters::PoolApiAdapter, PoolStatus},
    requests::clients::http_client::HttpClient,
};
use log::info;
use serde::{Deserialize, Serialize};

static LOG_TARGET: &str = "universe::mining::pools::adapters::lucky_pool";

// LuckyPool API can sometimes return field values as either strings or numbers.
// This enum helps to handle both cases during deserialization and retriveve the value as a f64.
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
    pub paid: LuckyPoolNumber,
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

#[derive(Serialize, Deserialize, Debug)]
pub struct LuckyPoolStatusResponseBody {
    pub stats: LuckyPoolStats,
}

#[derive(Clone, Debug)]
pub struct LuckyPoolAdapter {
    name: String,
    stats_url: String,
}

impl LuckyPoolAdapter {
    pub fn new(name: String, stats_url: String) -> Self {
        Self { stats_url, name }
    }
}

impl PoolApiAdapter for LuckyPoolAdapter {
    fn name(&self) -> &str {
        &self.name
    }

    fn convert_api_data(&self, data: &str) -> Result<PoolStatus, anyhow::Error> {
        // For first time users, LuckyPool may return "Address not found" if the address has no mining history.
        // In this case, we return a default PoolStatus with all fields set to zero.
        if data.contains("Address not found") {
            return Ok(PoolStatus::default());
        };

        let converted_data: LuckyPoolStatusResponseBody = serde_json::from_str(data)?;
        let pool_status = PoolStatus {
            accepted_shares: converted_data.stats.accepted_shares.get_number(),
            unpaid: (converted_data.stats.unlocked.get_number()
                + converted_data.stats.locked.get_number()) as f64,
            balance: converted_data.stats.paid.get_number() as f64,
            min_payout: converted_data.stats.payment_threshold.get_number(),
        };
        Ok(pool_status)
    }
    async fn request_pool_status(&self, address: String) -> Result<PoolStatus, anyhow::Error> {
        let url = self
            .stats_url
            .replace("%TARI_ADDRESS%", &address.to_string());
        info!(target: LOG_TARGET, "Requesting lucky pool status from: {url}");
        let pool_status_response = HttpClient::with_retries(3).send_get_request(&url).await?;
        let response_text = pool_status_response.text().await?;
        let pool_status = self.convert_api_data(response_text.as_str())?;
        Ok(pool_status)
    }
}
