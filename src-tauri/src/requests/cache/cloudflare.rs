// Copyright 2025. The Tari Project
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

use log::info;
use reqwest::Response;

use crate::{
    LOG_TARGET_APP_LOGIC,
    requests::{
        clients::http_client::HttpClient,
        utils::{convert_content_length_to_mb, get_content_length_from_head_response},
    },
};

pub enum CloudFlareCacheStatusHandlingOptions {
    Success,
    Retry,
    Skip,
}
#[allow(dead_code)]
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

#[allow(dead_code)]
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

    pub fn resolve_handling_option(&self) -> CloudFlareCacheStatusHandlingOptions {
        match self {
            Self::Hit => CloudFlareCacheStatusHandlingOptions::Success,
            Self::Revalidated => CloudFlareCacheStatusHandlingOptions::Success,
            Self::Stale => CloudFlareCacheStatusHandlingOptions::Success,
            Self::Miss => CloudFlareCacheStatusHandlingOptions::Retry,
            Self::Expired => CloudFlareCacheStatusHandlingOptions::Retry,
            Self::Updating => CloudFlareCacheStatusHandlingOptions::Retry,
            Self::Bypass => CloudFlareCacheStatusHandlingOptions::Skip,
            Self::Unknown => CloudFlareCacheStatusHandlingOptions::Skip,
            Self::Dynamic => CloudFlareCacheStatusHandlingOptions::Skip,
            Self::NonExistent => CloudFlareCacheStatusHandlingOptions::Skip,
        }
    }

    #[allow(dead_code)]
    pub fn should_log_warning(&self) -> bool {
        matches!(self, Self::Unknown)
            || matches!(self, Self::Stale)
            || matches!(self, Self::NonExistent)
    }
}

pub struct CloudFlareCache;

impl CloudFlareCache {
    fn get_cf_cache_status_from_head_response(response: &Response) -> CloudFlareCacheStatus {
        if response.status().is_server_error() || response.status().is_client_error() {
            info!(target: LOG_TARGET_APP_LOGIC, "get_cf_cache_status_from_head_response, error");
            return CloudFlareCacheStatus::Unknown;
        };

        CloudFlareCacheStatus::from_str(
            response
                .headers()
                .get("cf-cache-status")
                .map_or("", |v| v.to_str().unwrap_or_default()),
        )
    }

    #[allow(dead_code)]
    pub async fn check_if_cache_hits(url: &str) -> Result<(), anyhow::Error> {
        const MAX_RETRIES: u8 = 3;
        const MAX_WAIT_TIME: u64 = 30;
        const MIN_WAIT_TIME: u64 = 2;
        let mut retries = 0;

        let http_client = HttpClient::default();

        loop {
            if retries >= MAX_RETRIES {
                return Ok(());
            }
            retries += 1;

            let head_response = http_client.send_head_request(url).await?;

            let cf_cache_status =
                CloudFlareCache::get_cf_cache_status_from_head_response(&head_response);

            match cf_cache_status.resolve_handling_option() {
                CloudFlareCacheStatusHandlingOptions::Retry => {
                    info!(target: LOG_TARGET_APP_LOGIC, "Cache status is {}, retrying. Try {}/{}.", cf_cache_status.to_str(), retries, MAX_RETRIES);
                }
                CloudFlareCacheStatusHandlingOptions::Skip => {
                    info!(target: LOG_TARGET_APP_LOGIC, "Cache status is {}, skipping retry.", cf_cache_status.to_str());
                    return Ok(());
                }
                CloudFlareCacheStatusHandlingOptions::Success => {
                    info!(target: LOG_TARGET_APP_LOGIC, "Cache hit with status: {}", cf_cache_status.to_str());
                    return Ok(());
                }
            }

            let content_length = get_content_length_from_head_response(&head_response);

            let mut sleep_time = std::time::Duration::from_secs(MIN_WAIT_TIME);

            #[allow(clippy::cast_possible_truncation)]
            let content_length_in_mb: u64 =
                (convert_content_length_to_mb(content_length) / 10.0).trunc() as u64;

            if !content_length.eq(&0) {
                sleep_time = std::time::Duration::from_secs(
                    content_length_in_mb.clamp(MIN_WAIT_TIME, MAX_WAIT_TIME),
                );
            }

            tokio::time::sleep(sleep_time).await;
        }
    }
}
