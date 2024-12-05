use std::path::PathBuf;

use anyhow::Error;
use async_trait::async_trait;
use log::error;
use regex::Regex;
use tari_common::configuration::Network;

use crate::{github, progress_tracker::ProgressTracker, APPLICATION_FOLDER_ID};

use super::binaries_resolver::{LatestVersionApiAdapter, VersionAsset, VersionDownloadInfo};

const LOG_TARGET: &str = "tari::universe::adapter_xmrig";

pub struct XmrigVersionApiAdapter {}

#[async_trait]
impl LatestVersionApiAdapter for XmrigVersionApiAdapter {
    async fn fetch_releases_list(&self) -> Result<Vec<VersionDownloadInfo>, Error> {
        let releases = github::list_releases("xmrig", "xmrig").await?;
        Ok(releases.clone())
    }

    async fn download_and_get_checksum_path(
        &self,
        directory: PathBuf,
        download_info: VersionDownloadInfo,
        _: ProgressTracker,
    ) -> Result<PathBuf, Error> {
        // When xmrig is downloaded checksum will be already in its folder so there is no need to download it
        // directory parameter should point to folder where xmrig is extracted
        // file with checksum should be in the same folder as xmrig
        // file name is SHA256SUMS
        // let platform = self.find_version_for_platform(version)?;
        let checksum_path = directory
            .join(format!("xmrig-{}", download_info.version))
            .join("SHA256SUMS");

        Ok(checksum_path)
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
