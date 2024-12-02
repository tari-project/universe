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
