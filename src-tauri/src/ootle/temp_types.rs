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

use serde::{Deserialize, Serialize};

/** Accounts List */
#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct AccountsListRequest {
    pub offset: u64,
    pub limit: u64,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct Account {
    pub name: Option<String>,
    pub address: String,
    pub key_index: u64,
    pub is_default: bool,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct AccountInfo {
    pub account: Account,
    pub public_key: String,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct AccountsListResponse {
    pub accounts: Vec<AccountInfo>,
    pub total: u64,
}

/** Create Account */
#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct AccountsCreateRequest {
    pub account_name: Option<String>,
    pub max_fee: Option<u64>,
    pub is_default: bool,
    pub key_id: Option<u64>,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct AccountsCreateResponse {
    pub address: String,
    pub public_key: String,
    pub result: serde_json::Value,
}

/** Create Account with free test coins */
#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct AccountsCreateFreeTestCoinsRequest {
    pub account: Option<serde_json::Value>,
    pub amount: u64,
    pub max_fee: Option<u64>,
    pub key_id: Option<u64>,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct AccountsCreateFreeTestCoinsResponse {
    pub account: Account,
    pub transaction_id: String,
    pub amount: u64,
    pub fee: u64,
    pub result: serde_json::Value,
    pub public_key: String,
}

/** Get Balances */
#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct AccountsGetBalancesRequest {
    pub account: Option<String>,
    pub refresh: bool,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct AccountsGetBalancesResponse {
    pub address: String,
    pub balances: Vec<serde_json::Value>,
}

/** Auth Login */
#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct AuthLoginRequest {
    pub permissions: Vec<String>,
    pub duration: Option<serde_json::Value>,
    pub webauthn_finish_auth_request: Option<serde_json::Value>,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct AuthLoginResponse {
    pub auth_token: String,
    pub valid_for_secs: u64,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct AuthLoginAcceptRequest {
    pub auth_token: String,
    pub name: String,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct AuthLoginAcceptResponse {
    pub permissions_token: String,
}
