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

const AIRDROP_API_BASE_URL: &str = env!(
    "AIRDROP_API_BASE_URL",
    "AIRDROP_API_BASE_URL env var not defined"
);
const AIRDROP_BASE_URL: &str = env!("AIRDROP_BASE_URL", "AIRDROP_BASE_URL env var not defined");

const TELEMETRY_API_URL: &str = env!("TELEMETRY_API_URL", "TELEMETRY_API_URL env var not defined");

pub const DEFAULT_EXCHANGE_ID: &str = "universal";
pub const EXCHANGE_ID: &str = env!("EXCHANGE_ID");

const BRIDGE_BACKEND_API_URL: &str = env!("BRIDGE_BACKEND_API_URL");
pub const WALLET_CONNECT_PROJECT_ID: &str = env!("BRIDGE_WALLET_CONNECT_PROJECT_ID");

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AppInMemoryConfig {
    pub airdrop_url: String,
    pub airdrop_api_url: String,
    pub telemetry_api_url: String,
    pub exchange_id: String,
    pub bridge_backend_api_url: String,
    pub wallet_connect_project_id: String,
}

impl Default for AppInMemoryConfig {
    fn default() -> Self {
        AppInMemoryConfig {
            airdrop_url: AIRDROP_BASE_URL.into(),
            airdrop_api_url: AIRDROP_API_BASE_URL.into(),
            telemetry_api_url: TELEMETRY_API_URL.into(),
            exchange_id: EXCHANGE_ID.into(),
            bridge_backend_api_url: BRIDGE_BACKEND_API_URL.into(),
            wallet_connect_project_id: WALLET_CONNECT_PROJECT_ID.into(),
        }
    }
}

#[derive(Default, Serialize, Deserialize, Clone, Debug)]
pub struct ExchangeMiner {
    pub id: String,
    pub name: String,
    pub slug: String,
}

#[derive(Debug)]
pub enum MinerType {
    Universal,
    ExchangeMode,
}
impl MinerType {
    pub fn from_str(string: &str) -> Self {
        match string {
            DEFAULT_EXCHANGE_ID => MinerType::Universal,
            _ => MinerType::ExchangeMode,
        }
    }
    pub fn is_exchange_mode(&self) -> bool {
        matches!(self, MinerType::ExchangeMode)
    }
}
