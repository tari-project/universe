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

use crate::binaries::binaries_resolver::LatestVersionApiAdapter;
use crate::requests::clients::http_file_client::HttpFileClient;
use crate::APPLICATION_FOLDER_ID;
use anyhow::{anyhow, Error};
use async_trait::async_trait;
use log::{error, info};
use std::path::PathBuf;
use tari_common::configuration::Network;
use tokio::fs::File;
use tokio::io::AsyncReadExt;

use super::binaries_resolver::BinaryDownloadInfo;

pub const LOG_TARGET: &str = "tari::universe::adapter_tor";
pub(crate) struct TorReleaseAdapter {}

#[async_trait]
impl LatestVersionApiAdapter for TorReleaseAdapter {
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

        let tor_hash = contents
            .lines()
            .find(|line| line.contains(asset_name))
            .and_then(|line| line.split_whitespace().next())
            .map(|hash| hash.to_string());

        tor_hash.ok_or(anyhow!("No checksum was found for xmrig"))
    }

    async fn download_and_get_checksum_path(
        &self,
        directory: PathBuf,
        download_info: BinaryDownloadInfo,
    ) -> Result<PathBuf, Error> {
        let checksum_url = match download_info.main_url.rfind('/') {
            Some(pos) => format!(
                "{}/{}",
                &download_info.main_url[..pos],
                "sha256sums-signed-build.txt"
            ),
            None => download_info.main_url,
        };

        match HttpFileClient::builder()
            .with_cloudflare_cache_check()
            .build(checksum_url.clone(), directory.clone())?
            .execute()
            .await
        {
            Ok(checksum_path) => Ok(checksum_path),
            Err(_) => {
                let checksum_fallback_url = format!("{}.asc", download_info.fallback_url);
                info!(target: LOG_TARGET, "Fallback URL: {checksum_fallback_url}");
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

        let binary_folder_path = cache_path
            .join(APPLICATION_FOLDER_ID)
            .join("binaries")
            .join("tor-binaries")
            .join(
                Network::get_current_or_user_setting_or_default()
                    .to_string()
                    .to_lowercase(),
            );

        if !binary_folder_path.exists() {
            std::fs::create_dir_all(&binary_folder_path).unwrap_or_else(|e| {
                error!(target: LOG_TARGET, "Failed to create directory: {e}");
            });
        };

        Ok(binary_folder_path)
    }

    fn get_base_main_download_url(&self, version: &str) -> String {
        let base_url = "https://cdn-universe.tari.com/tor-package-archive/torbrowser".to_string();
        format!("{base_url}/{version}")
    }
    fn get_base_fallback_download_url(&self, version: &str) -> String {
        let base_url = "https://archive.torproject.org/tor-package-archive/torbrowser".to_string();
        format!("{base_url}/{version}")
    }
}
