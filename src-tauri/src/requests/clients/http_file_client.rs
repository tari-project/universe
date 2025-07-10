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

use crate::download_utils::extract;
use crate::requests::utils::get_content_size_from_file;
use crate::requests::{
    cache::cloudflare::CloudFlareCache, utils::get_content_length_from_head_response,
};
use crate::utils::network_status::NetworkStatus;

use super::http_client::HttpClient;

const LOG_TARGET: &str = "tari::universe::clients::http_file_client";
const MAX_RETRIES: u32 = 5;

fn create_exponential_timeout(attempt: u32) -> tokio::time::Duration {
    let base_delay = 2; // seconds
    let max_delay = 60; // seconds
    let delay = base_delay * (2_u64.pow(attempt));
    tokio::time::Duration::from_secs(delay.min(max_delay))
}

struct FileClientConfig {
    progress_status_sender: Option<watch::Sender<f64>>,
    should_extract: bool,
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
                should_extract: false,
                should_use_range_header: false,
                should_check_cloudflare_cache: false,
            },
        }
    }

    pub fn with_progress_status_sender(mut self, sender: Option<watch::Sender<f64>>) -> Self {
        self.config.progress_status_sender = sender;
        self
    }

    pub fn with_file_extract(mut self) -> Self {
        self.config.should_extract = true;
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

    pub fn build(self, url: String, destination: PathBuf) -> HttpFileClient {
        let archive_destination = if self.config.should_extract {
            Some(destination.join("archive"))
        } else {
            None
        };

        let file_name = url
            .clone()
            .split('/')
            .next_back()
            .map(|s| s.to_string())
            .unwrap_or_else(|| "downloaded_file".to_string());

        HttpFileClient {
            url,
            destination,
            file_name,
            archive_destination,
            config: FileClientConfig {
                progress_status_sender: self.config.progress_status_sender,
                should_extract: self.config.should_extract,
                should_use_range_header: self.config.should_use_range_header,
                should_check_cloudflare_cache: self.config.should_check_cloudflare_cache,
            },
        }
    }
}

pub struct HttpFileClient {
    url: String,
    file_name: String,
    destination: PathBuf,
    archive_destination: Option<PathBuf>,
    config: FileClientConfig,
}

impl HttpFileClient {
    pub fn builder() -> FileClientBuilder {
        FileClientBuilder::new()
    }

    fn get_destination(&self) -> &PathBuf {
        if let Some(archive_destination) = &self.archive_destination {
            info!(target: LOG_TARGET, "Using archive destination: {}", archive_destination.display());
            archive_destination
        } else {
            info!(target: LOG_TARGET, "Using destination: {}", self.destination.display());
            &self.destination
        }
    }

    pub async fn execute(&self) -> Result<(PathBuf, Option<PathBuf>), anyhow::Error> {
        if self.config.should_check_cloudflare_cache {
            CloudFlareCache::check_if_cache_hits(&self.url).await?;
        }

        if self.config.should_use_range_header {
            self.handle_resume_flow().await?;
        } else {
            self.handle_default_flow().await?;
        }

        if self.config.should_extract {
            self.extract().await?;
        }

        Ok((self.destination.clone(), None))
    }

    pub async fn handle_default_flow(&self) -> Result<(), anyhow::Error> {
        let head_response = HttpClient::default().send_head_request(&self.url).await?;
        let expected_size = get_content_length_from_head_response(&head_response);

        let destination = self.get_destination();
        let destination_file = destination.join(&self.file_name);

        if self.destination.exists() {
            std::fs::remove_dir_all(&self.destination)?;
        }

        if !destination.exists() {
            create_dir_all(destination)
                .await
                .map_err(|e| anyhow::anyhow!("Failed to create directory: {}", e))?;
        }

        let mut file = File::create(destination_file)
            .await
            .map_err(|e| anyhow::anyhow!("Failed to create file: {}", e))?;

        self.download_file(expected_size, &mut file, false).await?;

        let file_size = get_content_size_from_file(destination.clone())
            .await
            .map_err(|e| anyhow::anyhow!("Failed to get file size: {}", e))?;

        if file_size != expected_size {
            return Err(anyhow::anyhow!(
                "File size mismatch: expected {}, got {}",
                expected_size,
                file_size
            ));
        }
        info!(target: LOG_TARGET, "File downloaded successfully to {}", destination.display());
        Ok(())
    }

    pub async fn handle_resume_flow(&self) -> Result<(), anyhow::Error> {
        let head_response = HttpClient::default().send_head_request(&self.url).await?;
        let expected_size = get_content_length_from_head_response(&head_response);

        let destination = self.get_destination();
        let destination_file = destination.join(&self.file_name);

        if !destination.exists() {
            create_dir_all(destination)
                .await
                .map_err(|e| anyhow::anyhow!("Failed to create directory: {}", e))?;
        }

        if !destination_file.exists() {
            info!(target: LOG_TARGET, "File does not exist, creating new file at {}", destination_file.display());
            File::create(&destination_file)
                .await
                .map_err(|e| anyhow::anyhow!("Failed to create file: {}", e))?;
        }

        let mut file = File::options()
            .append(true)
            .open(&destination_file)
            .await
            .map_err(|e| anyhow::anyhow!("Failed to open file: {}", e))?;

        let mut internet_connection_check_attempt_count = 0;
        let mut file_download_attempt_count = 0;
        let mut last_registered_file_size = 0;

        loop {
            file_download_attempt_count += 1;

            let file_size = get_content_size_from_file(destination_file.clone())
                .await
                .map_err(|e| anyhow::anyhow!("Failed to get file size: {}", e))?;

            if file_size.eq(&expected_size) {
                info!(target: LOG_TARGET, "File already downloaded to {}, size: {}", destination_file.display(), file_size);
                break;
            }

            if file_size.ne(&last_registered_file_size) {
                last_registered_file_size = file_size;
                file_download_attempt_count = 0;
            }

            if file_download_attempt_count > MAX_RETRIES {
                warn!(target: LOG_TARGET, "Max download attempts reached, giving up on downloading file.");
                return Err(anyhow::anyhow!(
                    "Max download attempts reached for file: {}",
                    destination_file.display()
                ));
            }

            if file_size.eq(&0) {
                info!(target: LOG_TARGET, "File is empty, starting download from the beginning.");
            } else {
                info!(target: LOG_TARGET, "Resuming download from {} to {}, current size: {}", self.url, destination_file.display(), file_size);
            }

            let start = file_size;
            let end: u64 = expected_size.saturating_sub(1);

            match self.download_file(expected_size, &mut file, true).await {
                Ok(_) => {
                    info!(target: LOG_TARGET, "Downloaded chunk from {start} to {end}");
                    internet_connection_check_attempt_count = 0;
                    continue;
                }
                Err(e) => loop {
                    internet_connection_check_attempt_count += 1;
                    warn!(target: LOG_TARGET, "Failed to resume download: {e}");
                    if NetworkStatus::check_internet_connection().await {
                        info!(target: LOG_TARGET, "Internet connection is available, retrying download...");
                        break;
                    } else {
                        warn!(target: LOG_TARGET, "No internet connection, retrying in 5 seconds...");
                        tokio::time::sleep(create_exponential_timeout(
                            internet_connection_check_attempt_count,
                        ))
                        .await;
                    }

                    if internet_connection_check_attempt_count > MAX_RETRIES {
                        break;
                    }
                },
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
        let mut request = HttpClient::default()
            .client
            .get(&self.url)
            .header(reqwest::header::ACCEPT, "application/octet-stream");

        if resume {
            let current_size = file.metadata().await?.len();
            request = request.header(reqwest::header::RANGE, format!("bytes={current_size}-"));
        }

        let response = request.send().await?;
        let response_status = response.status();

        if !response_status.is_success() {
            return Err(anyhow!(
                "GET request failed with status code: {}",
                response_status
            ));
        }

        let mut stream = response.bytes_stream();
        while let Some(chunk) = stream.next().await {
            match chunk {
                Ok(data) => {
                    if let Err(e) = file.write_all(&data).await {
                        warn!(target: LOG_TARGET, "Failed to write chunk to file: {e}");
                        return Err(anyhow!("Failed to write chunk to file: {}", e));
                    }
                    self.update_progress(file, expected_size).await?;
                }
                Err(e) => {
                    warn!(target: LOG_TARGET, "Error reading chunk: {e}");
                    return Err(anyhow!("Error reading chunk: {}", e));
                }
            }
        }

        Ok(())
    }

    async fn update_progress(&self, file: &File, expected_size: u64) -> Result<(), anyhow::Error> {
        if expected_size > 0 {
            let progress_percentage =
                (file.metadata().await?.len() as f64 / expected_size as f64) * 100.0;
            if let Some(sender) = &self.config.progress_status_sender {
                if let Err(e) = sender.send(progress_percentage.round()) {
                    debug!(target: LOG_TARGET, "Failed to send progress update: {e}");
                }
            }
        }
        Ok(())
    }

    pub async fn extract(&self) -> Result<(), anyhow::Error> {
        if let Some(archive_destination) = &self.archive_destination {
            if archive_destination.exists() {
                let archive_file = archive_destination.join(&self.file_name);
                // There can be case where extracted dir already exists on this stage and windows will throw an error if we try to extract to it
                if self.destination.exists() {
                    for entry in std::fs::read_dir(&self.destination)? {
                        let entry = entry?;
                        let path = entry.path();
                        if path != *archive_destination {
                            std::fs::remove_dir_all(path)?;
                        }
                    }
                }
                extract(&archive_file, &self.destination).await?;
            } else {
                return Err(anyhow::anyhow!(
                    "Archive destination does not exist: {}",
                    archive_destination.display()
                ));
            }
        }

        Ok(())
    }
}
