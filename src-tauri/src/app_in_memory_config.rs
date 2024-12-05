use anyhow::anyhow;
use base64::prelude::*;
use ring::signature::Ed25519KeyPair;
use serde::{Deserialize, Serialize};

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
    None => "4d43344341514177425159444b325677424349454943443235436e576b454f5a796833346a5479566c36484f4e396d4e31594248354374536f2f6439414f3145",
};

pub fn get_websocket_key() -> anyhow::Result<Ed25519KeyPair> {
    let decoded_str = hex::decode(AIRDROP_WEBSOCKET_CRYPTO_KEY)?;
    let utf8_str = String::from_utf8(decoded_str)?;
    let key_bytes = BASE64_STANDARD.decode(utf8_str)?;

    match Ed25519KeyPair::from_pkcs8_maybe_unchecked(&key_bytes) {
        Ok(key) => Ok(key),
        Err(e) => Err(anyhow!(e.to_string())),
    }
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
