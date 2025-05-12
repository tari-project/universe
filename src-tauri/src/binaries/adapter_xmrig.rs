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
use log::error;
use regex::Regex;
use tari_common::configuration::Network;
use tokio::{fs::File, io::AsyncReadExt};

use crate::{
    github::{self, request_client::RequestClient},
    APPLICATION_FOLDER_ID,
};

use super::binaries_resolver::{LatestVersionApiAdapter, VersionAsset, VersionDownloadInfo};

const LOG_TARGET: &str = "tari::universe::adapter_xmrig";

pub struct XmrigVersionApiAdapter {}

#[async_trait]
impl LatestVersionApiAdapter for XmrigVersionApiAdapter {
    async fn fetch_releases_list(&self) -> Result<Vec<VersionDownloadInfo>, Error> {
        let releases = github::list_releases("xmrig", "xmrig").await?;
        Ok(releases.clone())
    }

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
        download_info: VersionDownloadInfo,
    ) -> Result<PathBuf, Error> {
        let asset = self.find_version_for_platform(&download_info)?;
        let checksum_path = directory.join("in_progress").join("SHA256SUMS");
        let checksum_url = match asset.url.rfind('/') {
            Some(pos) => format!("{}/{}", &asset.url[..pos], "SHA256SUMS"),
            None => asset.url,
        };

        match RequestClient::current()
            .download_file_with_retries(&checksum_url, &checksum_path, false)
            .await
        {
            Ok(_) => Ok(checksum_path),
            Err(e) => {
                error!(target: LOG_TARGET, "Failed to download checksum file: {}", e);
                Err(e)
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
                error!(target: LOG_TARGET, "Failed to create directory: {}", e);
            });
        };

        Ok(binary_folder_path)
    }

    fn find_version_for_platform(
        &self,
        _version: &VersionDownloadInfo,
    ) -> Result<VersionAsset, anyhow::Error> {
        let mut name_suffix = "";
        if cfg!(target_os = "windows") {
            name_suffix = r".*msvc-win64\.zip";
        }
        if cfg!(target_os = "macos") && cfg!(target_arch = "x86_64") {
            name_suffix = r".*macos-x64\.tar.gz";
        }
        if cfg!(target_os = "macos") && cfg!(target_arch = "aarch64") {
            // the x64 seems to work better on the M1
            name_suffix = r".*macos-arm64\.tar.gz";
        }
        if cfg!(target_os = "linux") {
            name_suffix = r".*linux-static-x64\.tar.gz";
        }
        if cfg!(target_os = "freebsd") {
            name_suffix = r".*freebsd-static-x64\.tar.gz";
        }
        if name_suffix.is_empty() {
            panic!("Unsupported OS");
        }

        let name_sufix_regex = Regex::new(name_suffix)
            .map_err(|error| anyhow::anyhow!("Failed to create regex: {}", error))?;

        let platform = _version
            .assets
            .iter()
            .find(|a| name_sufix_regex.is_match(&a.name))
            .ok_or(anyhow::anyhow!("Failed to get platform asset"))?;
        Ok(platform.clone())
    }
}
