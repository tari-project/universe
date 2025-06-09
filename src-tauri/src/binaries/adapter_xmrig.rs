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
use log::{error, info, warn};
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
        info!(target: LOG_TARGET, "Reading SHA256SUMS file from: {:?}", checksum_path);
        info!(target: LOG_TARGET, "Looking for checksum for asset: {}", asset_name);

        let mut file_sha256 = File::open(checksum_path.clone()).await?;
        let mut buffer_sha256 = Vec::new();
        file_sha256.read_to_end(&mut buffer_sha256).await?;
        let contents =
            String::from_utf8(buffer_sha256).expect("Failed to read file contents as UTF-8");

        info!(target: LOG_TARGET, "SHA256SUMS file contents:\n{}", contents);

        // Log all lines to understand the format
        for (i, line) in contents.lines().enumerate() {
            info!(target: LOG_TARGET, "SHA256SUMS line {}: {}", i + 1, line);
        }

        // First, try to find the exact asset name in SHA256SUMS (most common case)
        let mut xmrig_hash = contents
            .lines()
            .find(|line| {
                // Handle both "*filename" and "filename" formats in SHA256SUMS
                line.contains(asset_name) || line.contains(&format!("*{}", asset_name))
            })
            .and_then(|line| {
                info!(target: LOG_TARGET, "Found exact match for asset '{}' in line: {}", asset_name, line);
                line.split_whitespace().next()
            })
            .map(|hash| hash.to_string());

        if let Some(ref hash) = xmrig_hash {
            info!(target: LOG_TARGET, "Successfully found checksum for exact asset name '{}': {}", asset_name, hash);
        } else {
            warn!(target: LOG_TARGET, "Could not find exact match for asset '{}', trying alternative patterns", asset_name);

            // Fallback: try alternative binary name patterns (for edge cases)
            let potential_binary_names = [
                "xmrig",                                                          // Generic pattern
                "xmrig.exe", // Windows executable
                &format!("xmrig-{}", asset_name.split('-').nth(1).unwrap_or("")), // versioned binary
            ];

            info!(target: LOG_TARGET, "Looking for xmrig binary checksums with potential names: {:?}", potential_binary_names);

            for binary_name in &potential_binary_names {
                for line in contents.lines() {
                    let parts: Vec<&str> = line.split_whitespace().collect();
                    if parts.len() >= 2 {
                        let hash = parts[0];
                        let filename = parts[1];

                        // Only match if the filename ends with the binary name (to avoid cross-platform matches)
                        if filename.ends_with(binary_name) {
                            info!(target: LOG_TARGET, "Found alternative match for '{}' in SHA256SUMS: {}", filename, hash);
                            xmrig_hash = Some(hash.to_string());
                            break;
                        }
                    }
                }

                if xmrig_hash.is_some() {
                    info!(target: LOG_TARGET, "Successfully found checksum using alternative pattern: {}", binary_name);
                    break;
                }
            }
        }

        xmrig_hash.ok_or(anyhow!(
            "No checksum was found for xmrig asset: {}",
            asset_name
        ))
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
        info!(target: LOG_TARGET, "Finding platform asset for xmrig version: {}", _version.version);

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

        info!(target: LOG_TARGET, "Using platform pattern: {}", name_suffix);

        let name_sufix_regex = Regex::new(name_suffix)
            .map_err(|error| anyhow::anyhow!("Failed to create regex: {}", error))?;

        // Log all available assets for debugging
        info!(target: LOG_TARGET, "Available assets for xmrig version {}:", _version.version);
        for (i, asset) in _version.assets.iter().enumerate() {
            info!(target: LOG_TARGET, "  Asset {}: {}", i + 1, asset.name);
        }

        let platform = _version
            .assets
            .iter()
            .find(|a| {
                let matches = name_sufix_regex.is_match(&a.name);
                info!(target: LOG_TARGET, "Checking asset '{}' against pattern '{}': {}", a.name, name_suffix, matches);
                matches
            })
            .ok_or(anyhow::anyhow!("Failed to get platform asset for pattern: {}", name_suffix))?;

        info!(target: LOG_TARGET, "Selected platform asset: {}", platform.name);
        Ok(platform.clone())
    }
}
