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

use anyhow::{anyhow, Error};
use reqwest::Client;
use serde::{de::DeserializeOwned, Deserialize, Serialize};
use serde_json::json;

#[derive(Debug, Serialize, Deserialize, Clone, Default)]
#[allow(dead_code)]
pub struct OotleWalletInfo {
    pub network: String,
    pub network_byte: u8,
    pub version: String,
}

#[derive(Debug, Clone)]
pub struct OotleWalletJsonRpcClient {
    json_rpc_port: u16,
}

impl OotleWalletJsonRpcClient {
    pub fn new(json_rpc_port: u16) -> Self {
        Self { json_rpc_port }
    }

    async fn json_rpc_request<T: DeserializeOwned>(
        &self,
        method: &str,
        params: serde_json::Value,
    ) -> Result<T, Error> {
        let rpc_url = format!("http://127.0.0.1:{}/json_rpc", self.json_rpc_port);
        let request_body = json!({
            "jsonrpc": "2.0",
            "id": 1,
            "method": method,
            "params": params
        });

        let client = Client::new();
        let response = client.post(rpc_url).json(&request_body).send().await?;
        let response_text = response.text().await?;
        let response_json: serde_json::Value = serde_json::from_str(&response_text)?;
        if let Some(error) = response_json.get("error") {
            return Err(anyhow!("Jsonrpc error: {}", error));
        }
        let result = response_json
            .get("result")
            .ok_or_else(|| anyhow!("No result in response"))?;
        Ok(serde_json::from_value(result.clone())?)
    }

    pub async fn get_wallet_info(&self) -> Result<OotleWalletInfo, Error> {
        self.json_rpc_request("wallet.get_info", json!({})).await
    }

    pub async fn get_default_account(&self) -> Result<Option<String>, Error> {
        let result: serde_json::Value = self
            .json_rpc_request("accounts.get_default", json!({}))
            .await?;
        Ok(result
            .get("account")
            .and_then(|acc| acc.get("name"))
            .and_then(|v| v.as_str())
            .map(|s| s.to_string()))
    }

    pub async fn create_account(&self, name: &str) -> Result<(), Error> {
        let _: serde_json::Value = self
            .json_rpc_request(
                "accounts.create",
                json!({
                    "account_name": name,
                    "is_default": true
                }),
            )
            .await?;
        Ok(())
    }
}
