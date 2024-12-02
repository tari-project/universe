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

use base64::prelude::*;
use ring::signature::Ed25519KeyPair;
use serde::{Deserialize, Serialize};
use tari_utilities::message_format::MessageFormat;

#[cfg(feature = "airdrop-env")]
const AIRDROP_BASE_URL: &str =
    std::env!("AIRDROP_BASE_URL", "AIRDROP_BASE_URL env var not defined");
#[cfg(feature = "airdrop-env")]
const AIRDROP_API_BASE_URL: &str = std::env!(
    "AIRDROP_API_BASE_URL",
    "AIRDROP_API_BASE_URL env var not defined"
);
#[cfg(feature = "airdrop-env")]
const AIRDROP_TWITTER_AUTH_URL: &str = std::env!(
    "AIRDROP_TWITTER_AUTH_URL",
    "AIRDROP_TWITTER_AUTH_URL env var not defined"
);

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AppInMemoryConfig {
    pub airdrop_url: String,
    pub airdrop_api_url: String,
    pub airdrop_twitter_auth_url: String,
    pub airdrop_access_token: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct AirdropInMemoryConfig {
    pub airdrop_url: String,
    pub airdrop_api_url: String,
    pub airdrop_twitter_auth_url: String,
}

impl From<AppInMemoryConfig> for AirdropInMemoryConfig {
    fn from(app_config: AppInMemoryConfig) -> Self {
        AirdropInMemoryConfig {
            airdrop_url: app_config.airdrop_url,
            airdrop_api_url: app_config.airdrop_api_url,
            airdrop_twitter_auth_url: app_config.airdrop_twitter_auth_url,
        }
    }
}

impl Default for AppInMemoryConfig {
    fn default() -> Self {
        AppInMemoryConfig {
            airdrop_url: "https://airdrop.tari.com".into(),
            airdrop_api_url: "https://ut.tari.com".into(),
            airdrop_twitter_auth_url: "https://airdrop.tari.com/auth".into(),
            airdrop_access_token: None,
        }
    }
}

const AIRDROP_WEBSOCKET_CRYPTO_KEY: &str = match option_env!("AIRDROP_WEBSOCKET_CRYPTO_KEY") {
    Some(value) => value,
    None => "default_crypto_key",
};

pub fn get_websocket_key() -> Ed25519KeyPair {
    let binary = AIRDROP_WEBSOCKET_CRYPTO_KEY
        .to_owned()
        .to_binary()
        .expect("airdrop websocket crypto key cannot be converted to binary");
    let bytes = BASE64_STANDARD
        .decode(&binary)
        .expect("airdrop websocket crypto key cannot be decoded");

    Ed25519KeyPair::from_pkcs8(&bytes).expect("airdrop websocket crypto key is invalid")
}

impl AppInMemoryConfig {
    pub fn init() -> Self {
        #[cfg(feature = "airdrop-env")]
        return AppInMemoryConfig {
            airdrop_url: AIRDROP_BASE_URL.into(),
            airdrop_api_url: AIRDROP_API_BASE_URL.into(),
            airdrop_twitter_auth_url: AIRDROP_TWITTER_AUTH_URL.into(),
            airdrop_access_token: None,
        };

        #[cfg(feature = "airdrop-local")]
        return AppInMemoryConfig {
            airdrop_url: "http://localhost:4000".into(),
            airdrop_api_url: "http://localhost:3004".into(),
            airdrop_twitter_auth_url: "http://localhost:3004/auth/twitter".into(),
            airdrop_access_token: None,
        };

        #[cfg(not(any(feature = "airdrop-local", feature = "airdrop-env")))]
        AppInMemoryConfig::default()
    }
}
