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

pub mod models;
use log::{debug, error};
const LOG_TARGET: &str = "tari::universe::xmrig::http_api";

#[derive(Debug, Clone)]
pub struct XmrigHttpApiClient {
    url: String,
    access_token: String,
}

impl XmrigHttpApiClient {
    pub fn new(url: String, access_token: String) -> Self {
        Self { url, access_token }
    }

    async fn get(&self, path: &str) -> Result<reqwest::Response, reqwest::Error> {
        let url = format!("{}/{}", self.url, path);
        reqwest::Client::new()
            .get(&url)
            .header("Authorization", format!("Bearer {}", self.access_token))
            .send()
            .await
    }

    pub async fn summary(&self) -> Result<models::Summary, anyhow::Error> {
        for _i in 0..3 {
            let response = self.get("2/summary").await?;

            let summary = response.text().await?;
            let summary: models::Summary = match serde_json::from_str(&summary) {
                Ok(summary) => summary,
                Err(e) => {
                    debug!(target: LOG_TARGET, "summary: {:?}", summary);
                    error!(target: LOG_TARGET, "Failed to parse xmrig summary: {}", e);
                    // Xmrig has a bug where it doesn't return valid json sometimes.
                    // https://github.com/xmrig/xmrig/issues/3363
                    continue;
                }
            };

            return Ok(summary);
        }
        Err(anyhow::anyhow!("Failed to get xmrig summary"))
    }
}
