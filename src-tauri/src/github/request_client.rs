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

use futures::StreamExt;
use std::path::Path;
use std::path::PathBuf;
use std::sync::LazyLock;
use std::time::Duration;
use tokio::fs;
use tokio::fs::File;
use tokio::io::AsyncWriteExt;
use tokio::sync::watch::Sender;

use super::Release;
use anyhow::{anyhow, Error};
use log::debug;
use log::info;
use log::warn;
use reqwest::{self, Client, Response};
use reqwest_middleware::{ClientBuilder, ClientWithMiddleware};
use reqwest_retry::{policies::ExponentialBackoff, RetryTransientMiddleware};

const LOG_TARGET: &str = "tari::universe::request_client";
const MAX_DOWNLOAD_FILE_RETRIES: u8 = 3;
const TIME_BETWEEN_FILE_DOWNLOADS: Duration = Duration::from_secs(15);
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

    #[allow(dead_code)]
    pub fn is_non_existent(&self) -> bool {
        matches!(self, Self::NonExistent)
    }

    #[allow(dead_code)]
    pub fn is_hit(&self) -> bool {
        matches!(self, Self::Hit) || matches!(self, Self::Revalidated)
    }

    #[allow(dead_code)]
    pub fn is_miss(&self) -> bool {
        matches!(self, Self::Miss)
    }

    #[allow(dead_code)]
    pub fn should_log_warning(&self) -> bool {
        matches!(self, Self::Unknown)
            || matches!(self, Self::NonExistent)
            || matches!(self, Self::Dynamic)
            || matches!(self, Self::Bypass)
    }

    #[allow(dead_code)]
    pub fn log_warning_if_present(&self) {
        if self.should_log_warning() {
            warn!(target: LOG_TARGET, "Cloudflare cache status: {}", self.to_str());
        }
    }
}

static INSTANCE: LazyLock<RequestClient> = LazyLock::new(RequestClient::new);
pub struct RequestClient {
    client: ClientWithMiddleware,
    user_agent: String,
}

impl RequestClient {
    pub fn new() -> Self {
        let user_agent = format!(
            "universe {}({})",
            env!("CARGO_PKG_VERSION"),
            std::env::consts::OS
        );

        info!(target: LOG_TARGET, "RequestClient::new, user_agent: {}", user_agent);

        Self {
            client: Self::build_retry_reqwest_client(),
            user_agent,
        }
    }

    fn build_retry_reqwest_client() -> ClientWithMiddleware {
        debug!(target: LOG_TARGET, "[build_retry_reqwest_client]");
        let retry_policy = ExponentialBackoff::builder().build_with_max_retries(2);

        ClientBuilder::new(Client::new())
            .with(RetryTransientMiddleware::new_with_policy(retry_policy))
            .build()
    }

    #[allow(dead_code)]
    fn convert_content_length_to_mb(&self, content_length: u64) -> f64 {
        (content_length as f64) / 1024.0 / 1024.0
    }

    pub async fn send_head_request(&self, url: &str) -> Result<Response, Error> {
        let head_response = self
            .client
            .head(url)
            .header("User-Agent", self.user_agent.clone())
            .send()
            .await;

        if let Ok(response) = head_response {
            if response.status().is_success() {
                return Ok(response);
            } else {
                return Err(anyhow!(
                    "HEAD request failed with status code: {}",
                    response.status()
                ));
            }
        };
        head_response.map_err(|e| anyhow!("HEAD request failed with error: {}", e))
    }

    pub async fn send_get_request(&self, url: &str) -> Result<Response, Error> {
        let get_response = self
            .client
            .get(url)
            .header("User-Agent", self.user_agent.clone())
            .send()
            .await;

        if let Ok(response) = get_response {
            if response.status().is_success() {
                return Ok(response);
            } else {
                return Err(anyhow!(
                    "GET request failed with status code: {}",
                    response.status()
                ));
            }
        };

        get_response.map_err(|e| anyhow!("GET request failed with error: {}", e))
    }

    pub async fn send_get_file_request(
        &self,
        url: &str,
        file_destination_path: &Path,
        expected_size: u64,
        progress_status_sender: Option<Sender<f64>>,
    ) -> Result<(), Error> {
        info!(target: LOG_TARGET, "[ DOWNLOAD GET FILE ] Downloading from url: {:?} to dest: {:?}", &url, &file_destination_path);

        let mut file = match File::open(file_destination_path).await {
            Ok(file) => file,
            Err(e) => {
                warn!(target: LOG_TARGET, "Failed to open file for writing: {}", e);
                File::create(file_destination_path).await.map_err(|e| {
                    warn!(target: LOG_TARGET, "Failed to create file: {}", e);
                    e
                })?
            }
        };

        let get_response = self
            .client
            .get(url)
            .header("User-Agent", self.user_agent.clone())
            .header("Accept", "application/octet-stream")
            .send()
            .await;

        if let Ok(response) = get_response {
            let response_status = response.status();

            let mut stream = response.bytes_stream();
            while let Some(chunk) = stream.next().await {
                match chunk {
                    Ok(data) => {
                        if let Err(e) = file.write_all(&data).await {
                            warn!(target: LOG_TARGET, "Failed to write chunk to file: {}", e);
                            return Err(anyhow!("Failed to write chunk to file: {}", e));
                        }
                        if expected_size > 0 {
                            let progress_percentage = (file.metadata().await?.len() as f64
                                / expected_size as f64)
                                * 100.0;
                            if let Some(sender) = &progress_status_sender {
                                if let Err(e) = sender.send(progress_percentage.round()) {
                                    warn!(target: LOG_TARGET, "Failed to send progress update: {}", e);
                                }
                            }
                        }
                    }
                    Err(e) => {
                        warn!(target: LOG_TARGET, "Error reading chunk: {}", e);
                        return Err(anyhow!("Error reading chunk: {}", e));
                    }
                }
            }

            if response_status.is_success() {
                return Ok(());
            } else {
                return Err(anyhow!(
                    "GET request failed with status code: {}",
                    response_status
                ));
            }
        };

        Ok(())
        // get_response.map_err(|e| anyhow!("GET request failed with error: {}", e))
    }

    pub fn get_etag_from_head_response(&self, response: &Response) -> String {
        if response.status().is_server_error() || response.status().is_client_error() {
            return "".to_string();
        };
        response
            .headers()
            .get("etag")
            .map_or("", |v| v.to_str().unwrap_or_default())
            .to_string()
    }

    pub fn get_content_length_from_head_response(&self, response: &Response) -> u64 {
        if response.status().is_server_error() || response.status().is_client_error() {
            return 0;
        };
        response
            .headers()
            .get("content-length")
            .map_or(0, |v| v.to_str().unwrap_or_default().parse().unwrap_or(0))
    }

    pub fn get_cf_cache_status_from_head_response(
        &self,
        response: &Response,
    ) -> CloudFlareCacheStatus {
        debug!(target: LOG_TARGET, "get_cf_cache_status_from_head_response, response status: {}, url: {}", response.status(), response.url());
        if response.status().is_server_error() || response.status().is_client_error() {
            info!(target: LOG_TARGET, "get_cf_cache_status_from_head_response, error");
            return CloudFlareCacheStatus::Unknown;
        };
        let cache_status = CloudFlareCacheStatus::from_str(
            response
                .headers()
                .get("cf-cache-status")
                .map_or("", |v| v.to_str().unwrap_or_default()),
        );

        debug!(target: LOG_TARGET, "get_cf_cache_status_from_head_response, cache status: {:?}", cache_status.to_str());
        debug!(target: LOG_TARGET, "get_cf_cache_status_from_head_response_raw, cache status: {:?}", response.headers().get("cf-cache-status"));

        cache_status.log_warning_if_present();
        cache_status
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

    #[allow(dead_code)]
    pub async fn check_if_cache_hits(&self, url: &str) -> Result<bool, anyhow::Error> {
        const MAX_RETRIES: u8 = 3;
        const MAX_WAIT_TIME: u64 = 30;
        const MIN_WAIT_TIME: u64 = 2;
        let mut retries = 0;

        loop {
            if retries >= MAX_RETRIES {
                return Ok(false);
            }

            let head_response = self.send_head_request(url).await?;

            let cf_cache_status = self.get_cf_cache_status_from_head_response(&head_response);
            cf_cache_status.log_warning_if_present();

            let content_length = self.get_content_length_from_head_response(&head_response);

            let mut sleep_time = std::time::Duration::from_secs(MIN_WAIT_TIME);

            if !content_length.eq(&0) {
                sleep_time = std::time::Duration::from_secs(
                    #[allow(clippy::cast_possible_truncation)]
                    ((self.convert_content_length_to_mb(content_length) / 10.0).trunc() as u64)
                        .clamp(MIN_WAIT_TIME, MAX_WAIT_TIME),
                );
            }

            if cf_cache_status.is_hit() {
                break;
            }

            retries += 1;
            warn!(target: LOG_TARGET, "Cache miss. Retrying in {} seconds. Try {}/{}", sleep_time.as_secs().to_string() ,retries, MAX_RETRIES);
            tokio::time::sleep(sleep_time).await;
        }

        Ok(true)
    }

    #[allow(dead_code)]
    pub async fn lookup_content_size(&self, url: &str) -> Result<u64, anyhow::Error> {
        let head_response = self.send_head_request(url).await?;
        let content_length = self.get_content_length_from_head_response(&head_response);
        Ok(content_length)
    }

    pub async fn get_content_size_from_file(&self, path: PathBuf) -> Result<u64, anyhow::Error> {
        let file = File::open(path).await?;
        let metadata = file.metadata().await?;
        Ok(metadata.len())
    }

    pub async fn download_file(
        &self,
        url: &str,
        destination: &Path,
        check_cache: bool,
        chunk_progress_sender: Option<Sender<f64>>,
    ) -> Result<(), anyhow::Error> {
        if check_cache {
            //TODO (2/2) bring it back once cloudflare stops returning dynamic status
            // self.check_if_cache_hits(url).await?;
        }
        let head_response = self.send_head_request(url).await?;
        let head_reponse_content_length =
            self.get_content_length_from_head_response(&head_response);

        self.send_get_file_request(
            url,
            destination,
            head_reponse_content_length,
            chunk_progress_sender,
        )
        .await?;

        let destination_file_size = self
            .get_content_size_from_file(destination.to_path_buf())
            .await?;

        if check_cache {
            let head_reposnse_cache_status =
                self.get_cf_cache_status_from_head_response(&head_response);
            info!(target: LOG_TARGET, "Cloudflare cache status: {:?}", head_reposnse_cache_status.to_str());
        };

        info!(target: LOG_TARGET, "Expected downloaded file size: {}", head_reponse_content_length);
        info!(target: LOG_TARGET, "Downloaded file size: {}", destination_file_size);

        if head_reponse_content_length != 0 && head_reponse_content_length != destination_file_size
        {
            return Err(anyhow!(
                "Downloaded file size does not match expected size. Expected: {}, Actual: {}",
                head_reponse_content_length,
                destination_file_size
            ));
        };

        info!(target: LOG_TARGET, "Finished downloading: {}", url);

        Ok(())
    }

    pub async fn download_file_with_retries(
        &self,
        url: &str,
        destination: &Path,
        check_cache: bool,
        chunk_progress_sender: Option<Sender<f64>>,
    ) -> Result<(), anyhow::Error> {
        info!(target: LOG_TARGET, "Downloading file: {}", url);

        let mut retries = 0;
        let mut last_error_message = String::new();

        loop {
            if retries >= MAX_DOWNLOAD_FILE_RETRIES {
                return Err(anyhow!(
                    "Failed to download file after {} retries. Last error: {}",
                    MAX_DOWNLOAD_FILE_RETRIES,
                    last_error_message
                ));
            }

            match self
                .download_file(url, destination, check_cache, chunk_progress_sender.clone())
                .await
            {
                Ok(_) => break,
                Err(e) => {
                    last_error_message = e.to_string();
                    warn!(target: LOG_TARGET, "Failed to download file: {}", e);
                    info!(target: LOG_TARGET, "Deleting file: {}", destination.display());
                    if destination.exists() {
                        let _unused = fs::remove_file(destination).await.inspect_err(|e| {
                            warn!(target: LOG_TARGET, "Failed to delete file: {}", e);
                        });
                    }
                    tokio::time::sleep(TIME_BETWEEN_FILE_DOWNLOADS).await;
                }
            }
            retries += 1;
        }

        Ok(())
    }

    pub fn current() -> &'static LazyLock<RequestClient> {
        &INSTANCE
    }
}
