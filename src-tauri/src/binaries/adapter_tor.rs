use crate::binaries::binaries_resolver::{
    LatestVersionApiAdapter, VersionAsset, VersionDownloadInfo,
};
use crate::download_utils::download_file_with_retries;
use crate::progress_tracker::ProgressTracker;
use crate::APPLICATION_FOLDER_ID;
use anyhow::Error;
use async_trait::async_trait;
use log::{error, info};
use regex::Regex;
use std::path::PathBuf;
use tari_common::configuration::Network;
use tauri::api::path::cache_dir;
pub const LOG_TARGET: &str = "tari::universe::adapter_tor";
pub(crate) struct TorReleaseAdapter {}

#[async_trait]
impl LatestVersionApiAdapter for TorReleaseAdapter {
    async fn fetch_releases_list(&self) -> Result<Vec<VersionDownloadInfo>, Error> {
        let cdn_tor_bundle_url = "https://cdn-universe.tari.com/torbrowser/13.5.6/tor-expert-bundle-windows-x86_64-13.5.6.tar.gz";
        let mut cdn_responded = false;

        for _ in 0..3 {
            let response = reqwest::get(cdn_tor_bundle_url).await;
            if let Ok(resp) = response {
                if resp.status().is_success() {
                    cdn_responded = true;
                    break;
                }
            }
        }

        if cdn_responded {
            let version = VersionDownloadInfo {
                version: "13.5.6".parse().expect("Bad tor version"),
                assets: vec![VersionAsset {
                    url: cdn_tor_bundle_url.to_string(),
                    name: "tor-expert-bundle-windows-x86_64-13.5.6.tar.gz".to_string(),
                }],
            };
            return Ok(vec![version]);
        }

        // Tor doesn't have a nice API for this so just return specific ones
        let version = VersionDownloadInfo {
            version: "13.5.6".parse().expect("Bad tor version"),
            assets: vec![VersionAsset {
                url: "https://dist.torproject.org/torbrowser/13.5.6/tor-expert-bundle-windows-x86_64-13.5.6.tar.gz".to_string(),
                name: "tor-expert-bundle-windows-x86_64-13.5.6.tar.gz".to_string(),
            }]
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
            cache_dir().ok_or_else(|| anyhow::anyhow!("Failed to get cache directory"))?;

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
            panic!("Unsupported OS");
        }

        if cfg!(target_os = "macos") && cfg!(target_arch = "aarch64") {
            panic!("Unsupported OS");
        }
        if cfg!(target_os = "linux") {
            panic!("Unsupported OS");
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
