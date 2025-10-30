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

use std::path::PathBuf;

use anyhow::{anyhow, Error};
use async_trait::async_trait;
use log::{error, info};
use tari_common::configuration::Network;
use tokio::{fs::File, io::AsyncReadExt};

use crate::{
    requests::{
        clients::http_file_client::HttpFileClient, get_gh_download_url, get_mirror_download_url,
    },
    APPLICATION_FOLDER_ID, LOG_TARGET_APP_LOGIC,
};

use super::binaries_resolver::{BinaryDownloadInfo, LatestVersionApiAdapter};

pub struct XmrigVersionApiAdapter {}

#[async_trait]
impl LatestVersionApiAdapter for XmrigVersionApiAdapter {
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

        let xmrig_hash = contents
            .lines()
            .find(|line| line.contains(asset_name))
            .and_then(|line| line.split_whitespace().next())
            .map(|hash| hash.to_string());

        xmrig_hash.ok_or(anyhow!("No checksum was found for xmrig"))
    }

    async fn download_and_get_checksum_path(
        &self,
        directory: PathBuf,
        download_info: BinaryDownloadInfo,
    ) -> Result<PathBuf, Error> {
        let checksum_url = match download_info.main_url.rfind('/') {
            Some(pos) => format!("{}/{}", &download_info.main_url[..pos], "SHA256SUMS"),
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
                let checksum_fallback_url = match download_info.fallback_url.rfind('/') {
                    Some(pos) => format!("{}/{}", &download_info.fallback_url[..pos], "SHA256SUMS"),
                    None => download_info.fallback_url,
                };
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

        let binary_folder_path = cache_path
            .join(APPLICATION_FOLDER_ID)
            .join("binaries")
            .join("xmrig")
            .join(
                Network::get_current_or_user_setting_or_default()
                    .to_string()
                    .to_lowercase(),
            );

        if !binary_folder_path.exists() {
            std::fs::create_dir_all(&binary_folder_path).unwrap_or_else(|e| {
                error!(target: LOG_TARGET_APP_LOGIC, "Failed to create directory: {e}");
            });
        };

        Ok(binary_folder_path)
    }

    fn get_base_main_download_url(&self, version: &str) -> String {
        let base_url = get_mirror_download_url("xmrig", "xmrig");
        format!("{base_url}/v{version}")
    }
    fn get_base_fallback_download_url(&self, version: &str) -> String {
        let base_url = get_gh_download_url("xmrig", "xmrig");
        format!("{base_url}/v{version}")
    }
}
