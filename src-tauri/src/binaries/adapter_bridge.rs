// Copyright 2024. The Tari Project
//
// Redistribution and use in source and tapplet forms, with or without modification, are permitted provided that the
// following conditions are met:
//
// 1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following
// disclaimer.
//
// 2. Redistributions in tapplet form must reproduce the above copyright notice, this list of conditions and the
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

use std::path::PathBuf;

use crate::{
    APPLICATION_FOLDER_ID, LOG_TARGET_APP_LOGIC,
    requests::{
        clients::http_file_client::HttpFileClient, get_gh_download_url, get_mirror_download_url,
    },
};
use anyhow::{Error, anyhow};
use async_trait::async_trait;
use log::{error, info};
use regex::Regex;
use tari_common::configuration::Network;
use tokio::{fs::File, io::AsyncReadExt};

use super::binaries_resolver::{BinaryDownloadInfo, LatestVersionApiAdapter};

pub struct BridgeTappletAdapter {
    pub repo: String,
    pub owner: String,
}

#[async_trait]
impl LatestVersionApiAdapter for BridgeTappletAdapter {
    async fn get_expected_checksum(
        &self,
        checksum_path: PathBuf,
        asset_name: &str,
    ) -> Result<String, Error> {
        let mut file_sha256 = File::open(checksum_path.clone()).await?;
        let mut buffer_sha256 = Vec::new();
        file_sha256.read_to_end(&mut buffer_sha256).await?;
        let contents =
            String::from_utf8(buffer_sha256).expect("Failed to read file contents as UTF-8");
        let mut expected_hash = "";
        let regex = Regex::new(&format!(r"([a-f0-9]+)\s.{asset_name}"))
            .map_err(|e| anyhow!("Failed to create regex: {}", e))?;

        for line in contents.lines() {
            if let Some(caps) = regex.captures(line) {
                expected_hash = caps
                    .get(1)
                    .map(|hash| hash.as_str())
                    .ok_or_else(|| anyhow!("Failed to extract hash from line: {}", line))?;
            }
        }
        Ok(expected_hash.to_string())
    }
    async fn download_and_get_checksum_path(
        &self,
        directory: PathBuf,
        download_info: BinaryDownloadInfo,
    ) -> Result<PathBuf, Error> {
        let checksum_url = format!("{}.sha256", download_info.main_url);

        match HttpFileClient::builder()
            .with_cloudflare_cache_check()
            .build(checksum_url.clone(), directory.clone())?
            .execute()
            .await
        {
            Ok(checksum_path) => Ok(checksum_path),
            Err(_) => {
                let checksum_fallback_url = format!("{}.sha256", download_info.fallback_url);
                info!(target: LOG_TARGET_APP_LOGIC, "Fallback URL: {checksum_fallback_url}");
                HttpFileClient::builder()
                    .build(checksum_fallback_url.clone(), directory.clone())?
                    .execute()
                    .await
            }
        }
    }

    fn get_binary_folder(&self) -> Result<PathBuf, Error> {
        let cache_path =
            dirs::cache_dir().ok_or_else(|| anyhow::anyhow!("Failed to get cache directory"))?;

        let tapplet_folder_path = cache_path
            .join(APPLICATION_FOLDER_ID)
            .join("tapplets")
            .join("bridge")
            .join(
                Network::get_current_or_user_setting_or_default()
                    .to_string()
                    .to_lowercase(),
            );

        if !tapplet_folder_path.exists() {
            std::fs::create_dir_all(&tapplet_folder_path).unwrap_or_else(|e| {
                error!(target: LOG_TARGET_APP_LOGIC, "Failed to create directory: {e}");
            });
        };

        Ok(tapplet_folder_path)
    }

    fn get_base_main_download_url(&self, version: &str) -> String {
        let base_url = get_mirror_download_url(&self.owner, &self.repo);
        format!("{base_url}/v{version}")
    }
    fn get_base_fallback_download_url(&self, version: &str) -> String {
        let base_url = get_gh_download_url(&self.owner, &self.repo);
        format!("{base_url}/v{version}")
    }
}
