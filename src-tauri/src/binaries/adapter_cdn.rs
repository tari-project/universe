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

use std::{collections::HashMap, path::PathBuf, str::FromStr};

use anyhow::Error;
use async_trait::async_trait;
use log::{debug, error, info};
use regex::Regex;
use semver::Version;
use serde::{Deserialize, Serialize};
use tari_common::configuration::Network;

use crate::{
    binaries::binaries_manager::BinaryVersionsJsonContent,
    download_utils::download_file_with_retries, progress_tracker_old::ProgressTracker,
    APPLICATION_FOLDER_ID,
};

use super::{
    binaries_resolver::{LatestVersionApiAdapter, VersionAsset, VersionDownloadInfo},
    Binaries,
};

static LOG_TARGET: &str = "tari::universe::adapter_cdn";

#[derive(Deserialize, Serialize, Default, Debug)]
struct CDNBinaryVersionsJsonContent {
    binaries: HashMap<String, String>,
}

pub struct CDNReleaseAdapter {
    pub specific_name: Option<Regex>,
    pub binary_name: Binaries,
    pub cdn_versions_list_path: String,
}

impl CDNReleaseAdapter {
    pub fn read_version(binary_name: String) -> Version {
        let json_content: BinaryVersionsJsonContent = serde_json::from_str(include_str!(
            "../../binaries-versions/binaries_versions_mainnet_cdn.json"
        ))
        .unwrap_or_default();

        let selected_version = json_content
            .binaries
            .get(&binary_name)
            .and_then(|version| {
                info!(target: LOG_TARGET, "Version for binary: {:?}", version);
                let parsed_version = Version::from_str(version.as_str());
                if let Err(e) = parsed_version {
                    error!(target: LOG_TARGET, "Error parsing version: {:?}", e);
                };
                Version::from_str(version.as_str()).ok()
            })
            .unwrap_or_else(|| {
                error!(target: LOG_TARGET, "Error parsing version for binary: {:?}", binary_name);
                Version::new(0, 0, 0)
            });

        debug!(target: LOG_TARGET, "Version requirements for {:?}: {:?}", binary_name, selected_version);

        selected_version
    }
}

#[async_trait]
impl LatestVersionApiAdapter for CDNReleaseAdapter {
    async fn fetch_releases_list(&self) -> Result<Vec<VersionDownloadInfo>, Error> {
        let mut cdn_responded = false;

        let client: reqwest::Client = reqwest::Client::new();
        for _ in 0..3 {
            let cdn_versions_list_path_cloned = self.cdn_versions_list_path.clone();
            let response = client.head(cdn_versions_list_path_cloned).send().await;

            if let Ok(resp) = response {
                if resp.status().is_success() {
                    cdn_responded = true;
                    break;
                }
            }
        }

        if !cdn_responded {}

        let mut asset_urls = Vec::new();
        match reqwest::get(&self.cdn_versions_list_path).await {
            Ok(response) => {
                if response.status().is_success() {
                    match response.text().await {
                        Ok(content) => {
                            // Process each line
                            let mut parsed_lines: Vec<Vec<String>> = Vec::new();
                            for line in content.lines() {
                                // Split the line by whitespace
                                let parts: Vec<&str> = line.split_whitespace().collect();

                                // Save the parts
                                if parts.len() >= 2 {
                                    parsed_lines
                                        .push(vec![parts[0].to_string(), parts[1].to_string()]);
                                } else {
                                    println!("Invalid line: {}", line);
                                }
                            }
                            for line in parsed_lines {
                                asset_urls.push(line[1].clone());
                            }
                        }
                        Err(e) => {
                            error!(target: LOG_TARGET, "Failed to read content from glytex file: {}", e);
                        }
                    }
                } else {
                    error!(target: LOG_TARGET, "Failed to fetch glytex file. HTTP Status: {}", response.status());
                }
            }
            Err(e) => {
                error!(target: LOG_TARGET, "Error occurred while fetching glytex file: {}", e);
            }
        }

        info!(target: LOG_TARGET, "Asset URLs: {:?}", asset_urls);

        let base_url = format!(
            "https://cdn-universe.tari.com/tari-project/tari/releases/download/v{}/",
            Self::read_version(self.binary_name.name().to_string())
        );
        let base_url_path = PathBuf::from_str(&base_url).expect("parsing failed");
        let version = VersionDownloadInfo {
            version: Self::read_version(self.binary_name.clone().name().to_string()),
            assets: asset_urls
                .iter()
                .map(|name: &String| VersionAsset {
                    name: name.clone(),
                    url: base_url_path.join(name).to_string_lossy().to_string(),
                })
                .collect(),
        };

        info!(target: LOG_TARGET, "Version: {:?}", version);
        Ok(vec![version])
    }

    async fn download_and_get_checksum_path(
        &self,
        directory: PathBuf,
        download_info: VersionDownloadInfo,
        progress_tracker: ProgressTracker,
    ) -> Result<PathBuf, Error> {
        let asset = self.find_version_for_platform(&download_info)?;
        let checksum_path = directory
            .join("in_progress")
            .join(format!("{}.asc", asset.name));
        let checksum_url = format!("{}.asc", asset.url);

        match download_file_with_retries(&checksum_url, &checksum_path, progress_tracker).await {
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
            .join(self.binary_name.clone().name())
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
            name_suffix = r"windows-x64.zip";
        }

        if cfg!(target_os = "macos") && cfg!(target_arch = "x86_64") {
            name_suffix = r"macos-x86_64.zip";
        }

        if cfg!(target_os = "macos") && cfg!(target_arch = "aarch64") {
            name_suffix = r"macos-arm64.zip";
        }
        if cfg!(target_os = "linux") {
            name_suffix = r"linux-x86_64.zip";
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
            .find(|a| {
                if let Some(ref specific) = self.specific_name {
                    specific.is_match(&a.name) && name_sufix_regex.is_match(&a.name)
                } else {
                    name_sufix_regex.is_match(&a.name)
                }
            })
            .ok_or(anyhow::anyhow!("Failed to get platform asset"))?;

        info!(target: LOG_TARGET, "Found platform: {:?}", platform);
        Ok(platform.clone())
    }
}
