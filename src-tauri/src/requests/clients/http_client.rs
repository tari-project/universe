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

use anyhow::anyhow;

use crate::requests::utils::create_user_agent;

pub struct HttpClient {
    pub client: reqwest_middleware::ClientWithMiddleware,
}

impl HttpClient {
    pub fn default() -> Self {
        let inner_client = reqwest::ClientBuilder::new()
            .user_agent(create_user_agent())
            .build()
            .expect("Failed to create reqwest client");
        let client = reqwest_middleware::ClientBuilder::new(inner_client).build();

        HttpClient { client }
    }

    #[allow(dead_code)]
    pub fn client(&self) -> &reqwest_middleware::ClientWithMiddleware {
        &self.client
    }

    #[allow(dead_code)]
    pub fn with_retries(retries: u32) -> Self {
        let retry_policy =
            reqwest_retry::policies::ExponentialBackoff::builder().build_with_max_retries(retries);

        let inner_client = reqwest::ClientBuilder::new()
            .user_agent(create_user_agent())
            .build()
            .expect("Failed to create reqwest client");

        let client = reqwest_middleware::ClientBuilder::new(inner_client)
            .with(reqwest_retry::RetryTransientMiddleware::new_with_policy(
                retry_policy,
            ))
            .build();

        HttpClient { client }
    }

    pub async fn send_head_request(&self, url: &str) -> Result<reqwest::Response, anyhow::Error> {
        let head_response = self.client.head(url).send().await;

        if let Ok(response) = head_response {
            if response.status().is_success() {
                return Ok(response);
            } else {
                return Err(anyhow!(
                    "HEAD request failed with status code: {}",
                    response.status()
                ));
            }
        };
        head_response.map_err(|e| anyhow!("HEAD request failed with error: {}", e))
    }

    #[allow(dead_code)]
    pub async fn send_get_request(&self, url: &str) -> Result<reqwest::Response, anyhow::Error> {
        let get_response = self.client.get(url).send().await;

        if let Ok(response) = get_response {
            if response.status().is_success() {
                return Ok(response);
            } else {
                return Err(anyhow!(
                    "GET request failed with status code: {}",
                    response.status()
                ));
            }
        };

        get_response.map_err(|e| anyhow!("GET request failed with error: {}", e))
    }
}
