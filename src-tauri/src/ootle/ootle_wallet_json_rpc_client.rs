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
use reqwest::{header::AUTHORIZATION, Client};
use serde::{de::DeserializeOwned, Deserialize, Serialize};
use serde_json::json;

use crate::ootle::temp_types::{
    AccountsCreateFreeTestCoinsRequest, AccountsCreateFreeTestCoinsResponse, AccountsCreateRequest,
    AccountsCreateResponse, AccountsGetBalancesRequest, AccountsGetBalancesResponse,
    AccountsListRequest, AccountsListResponse, AuthLoginAcceptRequest, AuthLoginAcceptResponse,
    AuthLoginRequest, AuthLoginResponse,
};

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
    token: Option<String>,
}

impl OotleWalletJsonRpcClient {
    pub fn new(json_rpc_port: u16) -> Self {
        Self {
            json_rpc_port,
            token: None,
        }
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
        let mut builder = client.post(rpc_url).json(&request_body);
        if let Some(token) = &self.token {
            builder = builder.header(AUTHORIZATION, format!("Bearer {}", token));
        }
        let response = builder.send().await?;
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

    pub async fn authenticate(&mut self) -> Result<(), Error> {
        let auth_login_request = AuthLoginRequest {
            permissions: vec!["Admin".to_string()],
            duration: None,
            webauthn_finish_auth_request: None,
        };
        let auth_login_request_value = serde_json::to_value(auth_login_request)?;
        let AuthLoginResponse { auth_token, .. } = self
            .json_rpc_request("auth.request", auth_login_request_value)
            .await?;

        let auth_login_accept = AuthLoginAcceptRequest {
            auth_token,
            name: "TU Token".to_string(),
        };
        let auth_login_accept_value = serde_json::to_value(auth_login_accept)?;
        let auth_response: AuthLoginAcceptResponse = self
            .json_rpc_request("auth.accept", auth_login_accept_value)
            .await?;

        self.token = Some(auth_response.permissions_token);

        Ok(())
    }

    pub async fn get_wallet_info(&self) -> Result<OotleWalletInfo, Error> {
        self.json_rpc_request("wallet.get_info", json!({})).await
    }

    pub async fn list_accounts(
        &self,
        request: AccountsListRequest,
    ) -> Result<AccountsListResponse, Error> {
        let value = serde_json::to_value(request)?;
        self.json_rpc_request("accounts.list", value).await
    }

    pub async fn create_account(
        &self,
        request: AccountsCreateRequest,
    ) -> Result<AccountsCreateResponse, Error> {
        let value = serde_json::to_value(request)?;
        self.json_rpc_request("accounts.create", value).await
    }

    pub async fn create_free_test_coins(
        &self,
        request: AccountsCreateFreeTestCoinsRequest,
    ) -> Result<AccountsCreateFreeTestCoinsResponse, Error> {
        let value = serde_json::to_value(request)?;
        self.json_rpc_request("accounts.create_free_test_coins", value)
            .await
    }

    pub async fn get_balances(
        &self,
        request: AccountsGetBalancesRequest,
    ) -> Result<AccountsGetBalancesResponse, Error> {
        let value = serde_json::to_value(request)?;
        self.json_rpc_request("accounts.get_balances", value).await
    }
}
