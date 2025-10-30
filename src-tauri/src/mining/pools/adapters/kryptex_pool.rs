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
    LOG_TARGET_STATUSES,
};
use log::info;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug)]
pub struct KryptexPoolStatusResponseBody {
    pub total: f64,
    pub unconfirmed: f64,
    pub confirmed: f64,
    pub threshold: f64,
    pub reached_pct: f64,
    pub last_active: u64,
}

#[derive(Clone, Debug)]
pub struct KryptexPoolAdapter {
    name: String,
    stats_url: String,
}

impl KryptexPoolAdapter {
    pub fn new(name: String, stats_url: String) -> Self {
        Self { name, stats_url }
    }
}

impl PoolApiAdapter for KryptexPoolAdapter {
    fn name(&self) -> &str {
        &self.name
    }

    #[allow(clippy::cast_possible_truncation)]
    fn convert_api_data(&self, data: &str) -> Result<PoolStatus, anyhow::Error> {
        let response: KryptexPoolStatusResponseBody = serde_json::from_str(data)?;
        let pool_status = PoolStatus {
            accepted_shares: 0,                 // Kryptex API does not provide this info
            unpaid: response.total * 1000000.0, // kryptex provides already formatted value so we need to revert it
            balance: 0.0,                       // Kryptex API does not provide this info
            min_payout: (response.threshold * 1000000.0) as u64, // kryptex provides already formatted value so we need to revert it
        };
        Ok(pool_status)
    }
    async fn request_pool_status(&self, address: String) -> Result<PoolStatus, anyhow::Error> {
        let url = self
            .stats_url
            .replace("%TARI_ADDRESS%", &address.to_string());
        info!(target: LOG_TARGET_STATUSES, "Requesting Kryptex pool status from: {url}");
        let pool_status_response = HttpClient::with_retries(3).send_get_request(&url).await?;
        let response_text = pool_status_response.text().await?;
        let pool_status = self.convert_api_data(response_text.as_str())?;
        Ok(pool_status)
    }
}
