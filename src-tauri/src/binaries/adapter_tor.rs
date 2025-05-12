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

use crate::binaries::binaries_resolver::{
    LatestVersionApiAdapter, VersionAsset, VersionDownloadInfo,
};
use crate::github::request_client::RequestClient;
use crate::github::ReleaseSource;
use crate::APPLICATION_FOLDER_ID;
use anyhow::{anyhow, Error};
use async_trait::async_trait;
use log::{error, info};
use regex::Regex;
use std::path::PathBuf;
use tari_common::configuration::Network;
use tokio::fs::File;
use tokio::io::AsyncReadExt;

pub const LOG_TARGET: &str = "tari::universe::adapter_tor";
pub(crate) struct TorReleaseAdapter {}

#[async_trait]
impl LatestVersionApiAdapter for TorReleaseAdapter {
    async fn fetch_releases_list(&self) -> Result<Vec<VersionDownloadInfo>, Error> {
        let platform = get_platform_name();
        let cdn_tor_bundle_url: String = format!(
            "https://cdn-universe.tari.com/tor-package-archive/torbrowser/14.5.1/tor-expert-bundle-{}-14.5.1.tar.gz",
            platform
        );
        let original_tor_bundle_url: String = format!(
            "https://dist.torproject.org/torbrowser/14.5.1/tor-expert-bundle-{}-14.5.1.tar.gz",
            platform
        );

        info!(target: LOG_TARGET, "Checking if CDN is available");

        let cdn_responded = match RequestClient::current()
            .send_head_request(&cdn_tor_bundle_url)
            .await
        {
            Ok(response) => response.status().is_success(),
            Err(e) => {
                error!(target: LOG_TARGET, "Failed to check CDN availability: {}", e);
                false
            }
        };

        info!(target: LOG_TARGET, "CDN responded: {}", cdn_responded);

        if cdn_responded {
            let version = VersionDownloadInfo {
                version: "14.5.1".parse().expect("Bad tor version"),
                assets: vec![VersionAsset {
                    url: cdn_tor_bundle_url.to_string(),
                    fallback_url: Some(original_tor_bundle_url),
                    name: format!("tor-expert-bundle-{}-14.5.1.tar.gz", platform),
                    source: ReleaseSource::Mirror,
                }],
            };
            return Ok(vec![version]);
        }

        // Tor doesn't have a nice API for this so just return specific ones
        let version = VersionDownloadInfo {
            version: "14.5.1".parse().expect("Bad tor version"),
            assets: vec![VersionAsset {
                url: original_tor_bundle_url,
                fallback_url: None,
                name: format!("tor-expert-bundle-{}-14.5.1.tar.gz", platform),
                source: ReleaseSource::Github,
            }],
        };
        Ok(vec![version])
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
        download_info: VersionDownloadInfo,
    ) -> Result<PathBuf, Error> {
        let asset = self.find_version_for_platform(&download_info)?;
        let checksum_path = directory
            .join("in_progress")
            .join("sha256sums-signed-build.txt");
        let checksum_url = match asset.url.rfind('/') {
            Some(pos) => format!("{}/{}", &asset.url[..pos], "sha256sums-signed-build.txt"),
            None => asset.url,
        };

        match RequestClient::current()
            .download_file_with_retries(&checksum_url, &checksum_path, asset.source.is_mirror())
            .await
        {
            Ok(_) => Ok(checksum_path),
            Err(e) => {
                if let Some(fallback_url) = asset.fallback_url {
                    let checksum_fallback_url = format!("{}.asc", fallback_url);
                    info!(target: LOG_TARGET, "Fallback URL: {}", checksum_fallback_url);
                    RequestClient::current()
                        .download_file_with_retries(&checksum_fallback_url, &checksum_path, false)
                        .await?;
                    Ok(checksum_path)
                } else {
                    Err(anyhow::anyhow!("Failed to download checksum file: {}", e))
                }
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
                error!(target: LOG_TARGET, "Failed to create directory: {}", e);
            });
        };

        Ok(binary_folder_path)
    }

    fn find_version_for_platform(
        &self,
        version: &VersionDownloadInfo,
    ) -> Result<VersionAsset, Error> {
        let mut name_suffix = "";
        if cfg!(target_os = "windows") {
            name_suffix = r"windows-x86_64.*\.gz";
        }

        if cfg!(target_os = "macos") && cfg!(target_arch = "x86_64") {
            name_suffix = r"macos-x86_64.*\.gz";
        }

        if cfg!(target_os = "macos") && cfg!(target_arch = "aarch64") {
            name_suffix = r"macos-aarch64.*\.gz";
        }
        if cfg!(target_os = "linux") {
            name_suffix = r"linux-x86_64.*\.gz";
        }
        if name_suffix.is_empty() {
            panic!("Unsupported OS");
        }

        info!(target: LOG_TARGET, "Looking for platform with suffix: {}", name_suffix);

        let name_sufix_regex = Regex::new(name_suffix)
            .map_err(|error| anyhow::anyhow!("Failed to create regex: {}", error))?;

        let platform = version
            .assets
            .iter()
            .find(|a| name_sufix_regex.is_match(&a.name))
            .ok_or(anyhow::anyhow!("Failed to get platform asset"))?;
        info!(target: LOG_TARGET, "Found platform: {:?}", platform);
        Ok(platform.clone())
    }
}

fn get_platform_name() -> String {
    if cfg!(target_os = "windows") {
        return "windows-x86_64".to_string();
    }
    if cfg!(target_os = "macos") && cfg!(target_arch = "x86_64") {
        return "macos-x86_64".to_string();
    }
    if cfg!(target_os = "macos") && cfg!(target_arch = "aarch64") {
        return "macos-aarch64".to_string();
    }
    if cfg!(target_os = "linux") {
        return "linux-x86_64".to_string();
    }
    panic!("Unsupported OS");
}
