use anyhow::anyhow;
use futures::StreamExt;
use log::{info, warn};
use std::path::PathBuf;
use tokio::sync::watch;
use tokio::{fs::File, io::AsyncWriteExt};

use crate::download_utils::extract;
use crate::requests::utils::get_content_size_from_file;
use crate::requests::{
    cache::cloudflare::CloudFlareCache, utils::get_content_length_from_head_response,
};

use super::http_client::HttpClient;

const LOG_TARGET: &str = "tari::universe::clients::http_file_client";

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
        HttpFileClient {
            url,
            destination,
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
    destination: PathBuf,
    config: FileClientConfig,
}

impl HttpFileClient {
    pub fn builder() -> FileClientBuilder {
        FileClientBuilder::new()
    }

    pub async fn execute(&self) -> Result<(), anyhow::Error> {
        if self.config.should_check_cloudflare_cache {
            CloudFlareCache::check_if_cache_hits(&self.url).await?;
        }

        if self.config.should_use_range_header {
            self.handle_resume_flow().await?;
        } else {
            self.handle_default_flow().await?;
        }

        // Extract the file if needed
        if self.config.should_extract {
            self.extract().await?;
        }

        Ok(())
    }

    pub async fn handle_default_flow(&self) -> Result<(), anyhow::Error> {
        let head_response = HttpClient::default().send_head_request(&self.url).await?;
        let expected_size = get_content_length_from_head_response(&head_response);

        // if self.destination exists then delete it and create a new file
        if self.destination.exists() {
            std::fs::remove_file(&self.destination)?;
        }

        let mut file = File::create(&self.destination)
            .await
            .map_err(|e| anyhow::anyhow!("Failed to create file: {}", e))?;

        self.download(expected_size, &mut file).await?;

        let file_size = get_content_size_from_file(self.destination.clone())
            .await
            .map_err(|e| anyhow::anyhow!("Failed to get file size: {}", e))?;

        if file_size != expected_size {
            return Err(anyhow::anyhow!(
                "File size mismatch: expected {}, got {}",
                expected_size,
                file_size
            ));
        }
        info!(target: LOG_TARGET, "File downloaded successfully to {}", self.destination.display());
        Ok(())
    }

    pub async fn download(&self, expected_size: u64, file: &mut File) -> Result<(), anyhow::Error> {
        let get_file_response = HttpClient::default()
            .client
            .get(&self.url)
            .header(reqwest::header::ACCEPT, "application/octet-stream")
            .send()
            .await?;

        let response_status = get_file_response.status();

        let mut stream = get_file_response.bytes_stream();
        while let Some(chunk) = stream.next().await {
            match chunk {
                Ok(data) => {
                    if let Err(e) = file.write_all(&data).await {
                        warn!(target: LOG_TARGET, "Failed to write chunk to file: {}", e);
                        return Err(anyhow!("Failed to write chunk to file: {}", e));
                    }
                    if expected_size > 0 {
                        let progress_percentage =
                            (file.metadata().await?.len() as f64 / expected_size as f64) * 100.0;
                        if let Some(sender) = &self.config.progress_status_sender {
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
            Ok(())
        } else {
            return Err(anyhow!(
                "GET request failed with status code: {}",
                response_status
            ));
        }
    }

    pub async fn handle_resume_flow(&self) -> Result<(), anyhow::Error> {
        let head_response = HttpClient::default().send_head_request(&self.url).await?;
        let expected_size = get_content_length_from_head_response(&head_response);

        const DOWNLOAD_CHUNK_SIZE: u64 = 1024 * 1024; // 1 MB

        info!(target: LOG_TARGET, "Starting download from {} to {}, expected size: {}", self.url, self.destination.display(), expected_size);

        if !self.destination.exists() {
            File::create(&self.destination)
                .await
                .map_err(|e| anyhow::anyhow!("Failed to create file: {}", e))?;
        }

        let mut file = File::options()
            .append(true)
            .open(&self.destination)
            .await
            .map_err(|e| anyhow::anyhow!("Failed to open file: {}", e))?;

        loop {
            let file_size = get_content_size_from_file(self.destination.clone())
                .await
                .map_err(|e| anyhow::anyhow!("Failed to get file size: {}", e))?;

            if file_size.eq(&expected_size) {
                info!(target: LOG_TARGET, "File already downloaded to {}, size: {}", self.destination.display(), file_size);
                break;
            }

            info!(target: LOG_TARGET, "Resuming download from {} to {}, current size: {}", self.url, self.destination.display(), file_size);
            let start = file_size;
            let end = if expected_size > 0 {
                std::cmp::min(file_size + DOWNLOAD_CHUNK_SIZE - 1, expected_size - 1)
            } else {
                file_size + DOWNLOAD_CHUNK_SIZE - 1
            };

            match self
                .download_with_resume(expected_size, &mut file, start, end)
                .await
            {
                Ok(_) => {
                    info!(target: LOG_TARGET, "Downloaded chunk from {} to {}, current size: {}", start, end, file_size + DOWNLOAD_CHUNK_SIZE);
                    continue;
                }
                Err(e) => {
                    warn!(target: LOG_TARGET, "Failed to resume download: {}", e);
                    tokio::time::sleep(tokio::time::Duration::from_secs(5)).await;
                }
            }
        }

        Ok(())
    }

    pub async fn download_with_resume(
        &self,
        expected_size: u64,
        file: &mut File,
        start: u64,
        end: u64,
    ) -> Result<(), anyhow::Error> {
        // Implement the download with resume logic here

        let get_file_response = HttpClient::default()
            .client
            .get(&self.url)
            .header(reqwest::header::RANGE, format!("bytes={}-{}", start, end))
            .send()
            .await?;
        let response_status = get_file_response.status();

        let mut stream = get_file_response.bytes_stream();
        while let Some(chunk) = stream.next().await {
            match chunk {
                Ok(data) => {
                    if let Err(e) = file.write_all(&data).await {
                        warn!(target: LOG_TARGET, "Failed to write chunk to file: {}", e);
                        return Err(anyhow!("Failed to write chunk to file: {}", e));
                    }
                    if expected_size > 0 {
                        let progress_percentage =
                            (file.metadata().await?.len() as f64 / expected_size as f64) * 100.0;
                        if let Some(sender) = &self.config.progress_status_sender {
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
            Ok(())
        } else {
            return Err(anyhow!(
                "GET request failed with status code: {}",
                response_status
            ));
        }
    }

    // It should extract file if the configuration is set to do so and file extension is supported
    // Then delete the original file
    pub async fn extract(&self) -> Result<(), anyhow::Error> {
        extract(&self.destination, &self.destination).await
    }
}
