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
    pub cdn_path: String,
    pub asset_name: String,
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

        let client = reqwest::Client::new();
        for _ in 0..3 {
            let cdn_path_cloned = self.cdn_path.clone();
            let response = client.head(cdn_path_cloned).send().await;

            if let Ok(resp) = response {
                if resp.status().is_success() {
                    cdn_responded = true;
                    break;
                }
            }
        }

        if !cdn_responded {}

        let version = VersionDownloadInfo {
            version: Self::read_version(self.binary_name.clone().name().to_string()),
            assets: vec![VersionAsset {
                url: self.cdn_path.clone().to_string(),
                name: self.asset_name.clone(),
            }],
        };
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
