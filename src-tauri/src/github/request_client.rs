use std::sync::LazyLock;

use reqwest::{ Client, Response };
use anyhow::anyhow;

use crate::binaries::binaries_resolver::VersionDownloadInfo;
const LOG_TARGET: &str = "tari::universe::request_client";


pub enum CloudFlareCacheStatus {
    Hit,
    Miss,
    Unknown,
    Expired,
    Stale,
    Bypass,
    Revalidated,
    Updating,
    Dynamic
}

impl CloudFlareCacheStatus {
    pub fn from_str(s: &str) -> Self {
        match s {
            "HIT" => Self::Hit,
            "MISS" => Self::Miss,
            "EXPIRED" => Self::Expired,
            "STALE" => Self::Stale,
            "BYPASS" => Self::Bypass,
            "REVALIDATED" => Self::Revalidated,
            "UPDATING" => Self::Updating,
            "DYNAMIC" => Self::Dynamic,
            "UNKNOWN" => Self::Unknown,
            "NONE" => Self::Unknown,
            "NONE/UNKNOWN" => Self::Unknown,
            _ => Self::Unknown
        }
    }
    pub fn to_str(&self) -> &str {
        match self {
            Self::Hit => "HIT",
            Self::Miss => "MISS",
            Self::Unknown => "UNKNOWN",
            Self::Expired => "EXPIRED",
            Self::Stale => "STALE",
            Self::Bypass => "BYPASS",
            Self::Revalidated => "REVALIDATED",
            Self::Updating => "UPDATING",
            Self::Dynamic => "DYNAMIC",
        }
    }

    pub fn is_hit(&self) -> bool {
        matches!(self, Self::Hit)
    }

    pub fn is_miss(&self) -> bool {
        matches!(self, Self::Miss)
    }
}

static INSTANCE: LazyLock<RequestClient> = LazyLock::new(RequestClient::new);
pub struct RequestClient {
    client: Client,
    user_agent: String,
}

impl RequestClient {
    pub fn new() -> Self {

        let user_agent = format!(
            "universe {}({})",
            env!("CARGO_PKG_VERSION"),
            std::env::consts::OS);

        Self {
            client: Client::new(),
            user_agent
        }
    }

    async fn send_head_request(&self, url: &str) -> Result<Response, reqwest::Error> {
        self.client.head(url).header("User-Agent", self.user_agent.clone()).send().await
    }

    async fn send_get_request(&self, url: &str) -> Result<Response, reqwest::Error> {
        self.client.get(url).header("User-Agent", self.user_agent.clone()).send().await
    }

    pub async fn fetch_head_etag(&self, url: &str) -> Result<String, anyhow::Error> {
        let head_response = self.send_head_request(url).await.map_err(|e| anyhow!(e))?;
        Ok(head_response.headers().get("etag").map_or("", |v| v.to_str().unwrap_or_default()).to_string())
    }

    pub async fn fetch_head_cf_cache_status(&self, url: &str) -> Result<CloudFlareCacheStatus, anyhow::Error> {
        let head_response = self.send_head_request(url).await.map_err(|e| anyhow!(e))?;
        Ok(CloudFlareCacheStatus::from_str(head_response.headers().get("cf-cache-status").map_or("", |v| v.to_str().unwrap_or_default())))
    }

    pub async fn fetch_get_versions_download_info(&self, url: &str) -> Result<(Vec<VersionDownloadInfo>, String), anyhow::Error> {
        let get_response = self.send_get_request(url).await.map_err(|e| anyhow!(e))?;
        let etag = get_response.headers().get("etag").map_or("", |v| v.to_str().unwrap_or_default()).to_string();
        let body = get_response.text().await.map_err(|e| anyhow!(e))?;

        Ok((serde_json::from_str(&body)?, etag))
    }

    pub fn current() -> &'static LazyLock<RequestClient> {
        &INSTANCE
    }
}