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

use anyhow::anyhow;
use futures::StreamExt;
use log::{debug, info, warn};
use std::path::PathBuf;
use tokio::fs::create_dir_all;
use tokio::sync::watch;
use tokio::{fs::File, io::AsyncWriteExt};

use crate::LOG_TARGET_APP_LOGIC;
use crate::binaries::binaries_resolver::BinaryDownloadError;
use crate::requests::utils::{create_exponential_timeout, get_content_size_from_file};
use crate::requests::{
    cache::cloudflare::CloudFlareCache, utils::get_content_length_from_head_response,
};
use crate::utils::network_status::NetworkStatus;

use super::http_client::{HttpClient, classify_status_error};

const MAX_RETRIES: u32 = 5;

struct FileClientConfig {
    progress_status_sender: Option<watch::Sender<f64>>,
    exclusive_create: bool,
    should_use_range_header: bool,
    should_check_cloudflare_cache: bool,
}
pub struct FileClientBuilder {
    config: FileClientConfig,
}

impl FileClientBuilder {
    pub fn new() -> Self {
        FileClientBuilder {
            config: FileClientConfig {
                progress_status_sender: None,
                exclusive_create: false,
                should_use_range_header: false,
                should_check_cloudflare_cache: false,
            },
        }
    }

    pub fn with_progress_status_sender(mut self, sender: Option<watch::Sender<f64>>) -> Self {
        self.config.progress_status_sender = sender;
        self
    }

    #[cfg(target_os = "windows")]
    pub fn with_exclusive_create(mut self) -> Self {
        self.config.exclusive_create = true;
        self
    }

    pub fn with_download_resume(mut self) -> Self {
        self.config.should_use_range_header = true;
        self
    }

    pub fn with_cloudflare_cache_check(mut self) -> Self {
        self.config.should_check_cloudflare_cache = true;
        self
    }

    pub fn build(self, url: String, destination: PathBuf) -> Result<HttpFileClient, anyhow::Error> {
        if self.config.exclusive_create {
            crate::private_directory::validate_https_source(&url)?;
            if self.config.should_use_range_header {
                return Err(anyhow!("Exclusive installer downloads cannot resume"));
            }
        }
        if destination.exists() && !destination.is_dir() {
            return Err(anyhow!(
                "Destination path already exists and is not a directory: {}",
                destination.display()
            ));
        }

        let file_name = url
            .clone()
            .split('/')
            .next_back()
            .map(|s| s.to_string())
            .unwrap_or_else(|| "downloaded_file".to_string());

        Ok(HttpFileClient {
            url,
            destination,
            file_name,
            config: self.config,
        })
    }
}

pub struct HttpFileClient {
    url: String,
    file_name: String,
    destination: PathBuf,
    config: FileClientConfig,
}

impl HttpFileClient {
    pub fn builder() -> FileClientBuilder {
        FileClientBuilder::new()
    }

    pub async fn download(&self) -> Result<PathBuf, anyhow::Error> {
        if self.config.should_check_cloudflare_cache {
            CloudFlareCache::check_if_cache_hits(&self.url).await?;
        }

        if self.config.should_use_range_header {
            self.handle_resume_flow().await?;
        } else {
            self.handle_default_flow().await?;
        }

        Ok(self.destination.join(&self.file_name))
    }

    pub async fn execute(&self) -> Result<PathBuf, anyhow::Error> {
        self.download().await
    }

    pub async fn handle_default_flow(&self) -> Result<(), anyhow::Error> {
        let head_response = HttpClient::default().send_head_request(&self.url).await?;
        let expected_size = get_content_length_from_head_response(&head_response);

        let destination = &self.destination;
        let destination_file = destination.join(&self.file_name);

        if !self.config.exclusive_create && destination_file.exists() {
            std::fs::remove_file(destination_file.clone())
                .map_err(|e| Self::classify_fs_error("Failed to remove file", &e))?;
        }

        if !destination.exists() {
            create_dir_all(destination)
                .await
                .map_err(|e| Self::classify_fs_error("Failed to create directory", &e))?;
        }

        let mut file = if self.config.exclusive_create {
            File::from_std(
                crate::private_directory::create_new_file(&destination_file)
                    .map_err(|e| Self::classify_fs_error("Failed to create fresh installer", &e))?,
            )
        } else {
            File::options()
                .write(true)
                .create(true)
                .truncate(true)
                .open(destination_file)
                .await
                .map_err(|e| Self::classify_fs_error("Failed to create file", &e))?
        };

        self.download_file(expected_size, &mut file, false).await?;

        file.flush().await?;
        file.sync_all().await?;

        let file_size = get_content_size_from_file(&file)
            .await
            .map_err(|e| anyhow::anyhow!("Failed to get file size: {}", e))?;

        if file_size != expected_size {
            return Err(anyhow::anyhow!(
                "File size mismatch: expected {}, got {}",
                expected_size,
                file_size
            ));
        }
        info!(target: LOG_TARGET_APP_LOGIC, "File downloaded successfully to {}", destination.display());
        Ok(())
    }

    #[allow(clippy::too_many_lines)]
    pub async fn handle_resume_flow(&self) -> Result<(), anyhow::Error> {
        let head_response = HttpClient::default().send_head_request(&self.url).await?;
        let expected_size = get_content_length_from_head_response(&head_response);
        let destination = &self.destination;
        let destination_file = destination.join(&self.file_name);

        info!(target: LOG_TARGET_APP_LOGIC, "Destination directory: {}", destination.display());
        info!(target: LOG_TARGET_APP_LOGIC, "Destination file: {}", destination_file.display());

        if !destination.exists() {
            create_dir_all(destination)
                .await
                .map_err(|e| Self::classify_fs_error("Failed to create directory", &e))?;
        }

        if !destination_file.exists() {
            info!(target: LOG_TARGET_APP_LOGIC, "File does not exist, creating new file at {}", destination_file.display());
            File::create(&destination_file)
                .await
                .map_err(|e| Self::classify_fs_error("Failed to create file", &e))?;
        }

        let file_size = get_content_size_from_file(
            &File::options().append(true).open(&destination_file).await?,
        )
        .await?;

        if file_size > expected_size {
            warn!(target: LOG_TARGET_APP_LOGIC, "File is probably corrupted, expected size: {expected_size}, but got: {file_size}");
            info!(target: LOG_TARGET_APP_LOGIC, "Removing corrupted file: {}", destination_file.display());
            std::fs::remove_file(&destination_file)
                .map_err(|e| Self::classify_fs_error("Failed to remove corrupted file", &e))?;
            info!(target: LOG_TARGET_APP_LOGIC, "Creating new file at {}", destination_file.display());
            File::create(&destination_file)
                .await
                .map_err(|e| Self::classify_fs_error("Failed to create file", &e))?;
        }

        let mut file = File::options()
            .append(true)
            .open(&destination_file)
            .await
            .map_err(|e| Self::classify_fs_error("Failed to open file", &e))?;

        let mut internet_connection_check_attempt_count = 0;
        let mut file_download_attempt_count = 0;
        let mut last_registered_file_size = 0;
        // Retained so a classified `BinaryDownloadError` from the last attempt
        // stays in the error chain and is not reported to Sentry.
        let mut last_error: Option<anyhow::Error> = None;

        loop {
            file_download_attempt_count += 1;
            let file_size = get_content_size_from_file(&file).await?;
            info!(target: LOG_TARGET_APP_LOGIC, "Expected file size: {expected_size} vs Current file size: {file_size}");
            // Check if file is already complete
            if file_size.eq(&expected_size) {
                info!(target: LOG_TARGET_APP_LOGIC, "File downloaded to {}, size: {}", destination_file.display(), file_size);
                break;
            }
            if file_size.ne(&last_registered_file_size) {
                last_registered_file_size = file_size;
                file_download_attempt_count = 0;
            }
            if file_download_attempt_count > MAX_RETRIES {
                warn!(target: LOG_TARGET_APP_LOGIC, "Max download attempts reached, giving up on downloading file.");
                let message = format!(
                    "Max download attempts reached for file: {}",
                    destination_file.display()
                );
                return Err(match last_error {
                    Some(e) => e.context(message),
                    None => anyhow::anyhow!(message),
                });
            }

            if file_size.eq(&0) {
                info!(target: LOG_TARGET_APP_LOGIC, "File is empty, starting download from the beginning.");
            } else {
                info!(target: LOG_TARGET_APP_LOGIC, "Resuming download from {} to {}, current size: {}", self.url, destination_file.display(), file_size);
            }

            match self.download_file(expected_size, &mut file, true).await {
                Ok(_) => {
                    info!(target: LOG_TARGET_APP_LOGIC, "Downloaded successfully");
                    break;
                }
                Err(e) => {
                    // If download return 404 [ Not Found ] we don't want to retry
                    if e.to_string().contains("404") {
                        warn!(target: LOG_TARGET_APP_LOGIC, "Unable to resume download, assets under this URL are not available: {}", self.url);
                        return Err(anyhow::anyhow!(
                            "Unable to resume download, assets under this URL are not available: {}",
                            self.url
                        ));
                    }
                    // If download timeouts so it returns 408 [ Request Timeout ] or 400 [ Bad Request ] we want to check if internet connection is available - We include 400 because some servers return 400 instead of 408 as far as I understand
                    if e.to_string().contains("408") || e.to_string().contains("400") {
                        loop {
                            internet_connection_check_attempt_count += 1;
                            warn!(target: LOG_TARGET_APP_LOGIC, "Failed to resume download: {e}");
                            if NetworkStatus::check_internet_connection().await {
                                info!(target: LOG_TARGET_APP_LOGIC, "Internet connection is available, retrying download...");
                                break;
                            } else {
                                warn!(target: LOG_TARGET_APP_LOGIC, "No internet connection, retrying in 5 seconds...");
                                tokio::time::sleep(create_exponential_timeout(
                                    internet_connection_check_attempt_count,
                                ))
                                .await;
                            }

                            if internet_connection_check_attempt_count > MAX_RETRIES {
                                break;
                            }
                        }
                    }
                    last_error = Some(e);
                }
            }
        }
        Ok(())
    }

    pub async fn download_file(
        &self,
        expected_size: u64,
        file: &mut File,
        resume: bool,
    ) -> Result<(), anyhow::Error> {
        let client = if self.config.exclusive_create {
            // Also reject a vendor redirect that downgrades the installer transfer to HTTP.
            reqwest_middleware::ClientBuilder::new(
                reqwest::Client::builder().https_only(true).build()?,
            )
            .build()
        } else {
            HttpClient::default().client
        };
        let mut request = client
            .get(&self.url)
            .header(reqwest::header::ACCEPT, "application/octet-stream");

        if resume {
            let current_size = file.metadata().await?.len();

            // If file is already complete, no need to download
            if current_size >= expected_size {
                info!(target: LOG_TARGET_APP_LOGIC, "File already complete, skipping download");
                return Ok(());
            }

            // Only add range header if we have partial content
            if current_size > 0 {
                request = request.header(reqwest::header::RANGE, format!("bytes={current_size}-"));
            }
        }

        let response = request.send().await.map_err(|e| {
            BinaryDownloadError::NetworkError(format!("GET request failed with error: {}", e))
        })?;
        let response_status = response.status();

        if !response_status.is_success() {
            return Err(classify_status_error("GET", response_status));
        }

        let mut stream = response.bytes_stream();
        while let Some(chunk) = stream.next().await {
            match chunk {
                Ok(data) => {
                    if let Err(e) = file.write_all(&data).await {
                        warn!(target: LOG_TARGET_APP_LOGIC, "Failed to write chunk to file: {e}");
                        return Err(Self::classify_fs_error("Failed to write chunk to file", &e));
                    }
                    self.update_progress(file, expected_size).await?;
                }
                Err(e) => {
                    // A stream error mid-transfer is a dropped/reset connection.
                    warn!(target: LOG_TARGET_APP_LOGIC, "Error reading chunk: {e}");
                    return Err(BinaryDownloadError::NetworkError(format!(
                        "Error reading chunk: {}",
                        e
                    ))
                    .into());
                }
            }
        }

        Ok(())
    }

    async fn update_progress(&self, file: &File, expected_size: u64) -> Result<(), anyhow::Error> {
        if expected_size > 0 {
            let progress_percentage =
                (file.metadata().await?.len() as f64 / expected_size as f64) * 100.0;
            if let Some(sender) = &self.config.progress_status_sender
                && let Err(e) = sender.send(progress_percentage.round())
            {
                debug!(target: LOG_TARGET_APP_LOGIC, "Failed to send progress update: {e}");
            }
        }
        Ok(())
    }

    /// Classify a filesystem error hit while preparing download targets
    /// (creating directories/files, removing stale files). Permission denied
    /// (AV quarantine, Windows file locks) and already-exists (concurrent
    /// instance or leftover partial download) are user-environment issues that
    /// must not be reported to Sentry; the download retry path recovers from
    /// them. Any other kind stays a plain error so real bugs still surface.
    fn classify_fs_error(context: &str, e: &std::io::Error) -> anyhow::Error {
        match e.kind() {
            std::io::ErrorKind::PermissionDenied | std::io::ErrorKind::AlreadyExists => {
                BinaryDownloadError::FileAccessDenied(format!("{context}: {e}")).into()
            }
            _ => anyhow::anyhow!("{context}: {e}"),
        }
    }
}
