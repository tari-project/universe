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
use std::time::Duration;
use tokio::fs;
use tokio::fs::File;
use tokio::io::AsyncWriteExt;
use tokio::sync::watch::Sender;

use anyhow::{anyhow, Error};
use log::info;
use log::warn;

const LOG_TARGET: &str = "tari::universe::request_client";
const MAX_DOWNLOAD_FILE_RETRIES: u8 = 3;
const TIME_BETWEEN_FILE_DOWNLOADS: Duration = Duration::from_secs(15);

// pub struct

pub struct RequestManager {
    user_agent: String,
}

impl RequestManager {
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
}
