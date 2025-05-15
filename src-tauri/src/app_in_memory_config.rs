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

use anyhow::anyhow;
use der::{self, asn1::BitString, oid::ObjectIdentifier, Encode};
use ring::signature::{Ed25519KeyPair, KeyPair};
use ring_compat::pkcs8::{spki::AlgorithmIdentifier, SubjectPublicKeyInfo};
use serde::{Deserialize, Serialize};

#[cfg(feature = "airdrop-env")]
const AIRDROP_BASE_URL: &str =
    std::env!("AIRDROP_BASE_URL", "AIRDROP_BASE_URL env var not defined");
#[cfg(feature = "airdrop-env")]
const AIRDROP_API_BASE_URL: &str = std::env!(
    "AIRDROP_API_BASE_URL",
    "AIRDROP_API_BASE_URL env var not defined"
);
#[cfg(feature = "telemetry-env")]
const TELEMETRY_API_URL: &str =
    std::env!("TELEMETRY_API_URL", "TELEMETRY_API_URL env var not defined");

pub const DEFAULT_EXCHANGE_ID: &str = "universal";
pub const EXCHANGE_ID: &str = match option_env!("EXCHANGE_ID") {
    Some(val) => val,
    None => DEFAULT_EXCHANGE_ID,
};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AppInMemoryConfig {
    pub airdrop_url: String,
    pub airdrop_api_url: String,
    pub telemetry_api_url: String,
    pub exchange_id: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct AirdropInMemoryConfig {
    pub airdrop_url: String,
    pub airdrop_api_url: String,
    pub exchange_id: Option<String>,
}

impl From<AppInMemoryConfig> for AirdropInMemoryConfig {
    fn from(app_config: AppInMemoryConfig) -> Self {
        AirdropInMemoryConfig {
            airdrop_url: app_config.airdrop_url,
            airdrop_api_url: app_config.airdrop_api_url,
            exchange_id: Some(app_config.exchange_id),
        }
    }
}

impl Default for AppInMemoryConfig {
    fn default() -> Self {
        AppInMemoryConfig {
            airdrop_url: "https://airdrop.tari.com".into(),
            airdrop_api_url: "https://ut.tari.com".into(),
            telemetry_api_url: "https://ut.tari.com/push".into(),
            exchange_id: EXCHANGE_ID.into(),
        }
    }
}

const AIRDROP_WEBSOCKET_CRYPTO_KEY: &str = match option_env!("AIRDROP_WEBSOCKET_CRYPTO_KEY") {
    Some(value) => value,
    None => "302e020100300506032b65700422042030f9f3e8ba7cac3d648b059f2fd5c5a6394caab46bdbb002e6989c883137b799",
};

pub fn get_websocket_key() -> anyhow::Result<Ed25519KeyPair> {
    let decoded_str = hex::decode(AIRDROP_WEBSOCKET_CRYPTO_KEY)?;
    match Ed25519KeyPair::from_pkcs8_maybe_unchecked(&decoded_str) {
        Ok(key) => Ok(key),
        Err(e) => Err(anyhow!(e.to_string())),
    }
}

pub fn get_der_encode_pub_key(key_pair: &Ed25519KeyPair) -> anyhow::Result<String> {
    let pub_key_bytes = key_pair.public_key().as_ref();

    let algorithm_identifier: AlgorithmIdentifier<()> = AlgorithmIdentifier {
        oid: ObjectIdentifier::new("1.3.101.112").map_err(|e| anyhow::anyhow!(e.to_string()))?,
        parameters: None, // No parameters for Ed25519
    };

    let subject_public_key =
        BitString::from_bytes(pub_key_bytes).map_err(|e| anyhow::anyhow!(e.to_string()))?;

    let spki = SubjectPublicKeyInfo {
        algorithm: algorithm_identifier,
        subject_public_key,
    };

    let der_encoded = spki.to_der().map_err(|e| anyhow::anyhow!(e.to_string()))?;
    Ok(hex::encode(der_encoded))
}

impl AppInMemoryConfig {
    pub fn init() -> Self {
        #[cfg(feature = "airdrop-env")]
        return AppInMemoryConfig {
            airdrop_url: AIRDROP_BASE_URL.into(),
            airdrop_api_url: AIRDROP_API_BASE_URL.into(),
            telemetry_api_url: TELEMETRY_API_URL.into(),
            exchange_id: EXCHANGE_ID.into(),
        };

        #[cfg(all(feature = "airdrop-local", not(feature = "airdrop-env")))]
        return AppInMemoryConfig {
            airdrop_url: "http://localhost:4000".into(),
            airdrop_api_url: "http://localhost:3004".into(),
            telemetry_api_url: "http://localhost:3004".into(),
            exchange_id: EXCHANGE_ID.into(),
        };

        #[cfg(not(any(
            feature = "airdrop-local",
            feature = "airdrop-env",
            feature = "telemetry-env",
        )))]
        AppInMemoryConfig::default()
    }
}
