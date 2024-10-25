use std::sync::LazyLock;

use anyhow::anyhow;
use log::warn;
use reqwest::{Client, Response};

use super::Release;
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
    Dynamic,
    NonExistent,
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
            "" => Self::NonExistent,
            _ => Self::Unknown,
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
            Self::NonExistent => "NONEXISTENT",
        }
    }

    pub fn is_non_existent(&self) -> bool {
        matches!(self, Self::NonExistent)
    }

    pub fn is_hit(&self) -> bool {
        matches!(self, Self::Hit) || matches!(self, Self::Revalidated)
    }

    pub fn is_miss(&self) -> bool {
        matches!(self, Self::Miss)
    }

    pub fn should_log_warning(&self) -> bool {
        matches!(self, Self::Unknown) || matches!(self, Self::NonExistent) || matches!(self, Self::Dynamic) || matches!(self, Self::Bypass)
    }

    pub fn log_warning(&self) {
        if self.should_log_warning() {
            warn!(target: LOG_TARGET, "Cloudflare cache status: {}", self.to_str());
        }
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
            std::env::consts::OS
        );

        Self {
            client: Client::new(),
            user_agent,
        }
    }

    pub async fn send_head_request(&self, url: &str) -> Result<Response, reqwest::Error> {
        self.client
            .head(url)
            .header("User-Agent", self.user_agent.clone())
            .send()
            .await
    }

    pub async fn send_get_request(&self, url: &str) -> Result<Response, reqwest::Error> {
        self.client
            .get(url)
            .header("User-Agent", self.user_agent.clone())
            .send()
            .await
    }

    pub fn get_etag_from_head_response(&self, response: &Response) -> String {
        response
            .headers()
            .get("etag")
            .map_or("", |v| v.to_str().unwrap_or_default())
            .to_string()
    }

    pub fn get_cf_cache_status_from_head_response(&self, response: &Response) -> CloudFlareCacheStatus {
        let cache_status = CloudFlareCacheStatus::from_str(
            response
                .headers()
                .get("cf-cache-status")
                .map_or("", |v| v.to_str().unwrap_or_default()),
        );

        cache_status.log_warning();
        cache_status
    }

    pub async fn fetch_head_etag(&self, url: &str) -> Result<String, anyhow::Error> {
        let head_response = self.send_head_request(url).await.map_err(|e| anyhow!(e))?;
        Ok(head_response
            .headers()
            .get("etag")
            .map_or("", |v| v.to_str().unwrap_or_default())
            .to_string())
    }

    pub async fn fetch_head_cf_cache_status(
        &self,
        url: &str,
    ) -> Result<CloudFlareCacheStatus, anyhow::Error> {
        let head_response = self.send_head_request(url).await.map_err(|e| anyhow!(e))?;
        Ok(CloudFlareCacheStatus::from_str(
            head_response
                .headers()
                .get("cf-cache-status")
                .map_or("", |v| v.to_str().unwrap_or_default()),
        ))
    }

    pub async fn fetch_get_versions_download_info(
        &self,
        url: &str,
    ) -> Result<(Vec<Release>, String), anyhow::Error> {
        let get_response = self.send_get_request(url).await.map_err(|e| anyhow!(e))?;
        let etag = get_response
            .headers()
            .get("etag")
            .map_or("", |v| v.to_str().unwrap_or_default())
            .to_string();
        let body = get_response.text().await.map_err(|e| anyhow!(e))?;

        Ok((serde_json::from_str(&body)?, etag))
    }

    pub async fn check_if_cache_hits(&self, url: &str) -> Result<bool, anyhow::Error> {
        const MAX_RETRIES: u8 = 5;
        let mut retries = 0;

        loop {
            if retries >= MAX_RETRIES {
                return Ok(false);
            }

            let head_response = self.fetch_head_cf_cache_status(&url).await?;
            head_response.log_warning();
            if head_response.is_hit() {
                break;
            }

            warn!(target: LOG_TARGET, "Cache miss. Retrying in 3 seconds. Try {}/{}", retries, MAX_RETRIES);
            retries += 1;
            tokio::time::sleep(std::time::Duration::from_secs(3)).await;
        }

        Ok(true)
    }

    pub fn current() -> &'static LazyLock<RequestClient> {
        &INSTANCE
    }
}
