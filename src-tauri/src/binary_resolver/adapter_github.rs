use std::path::PathBuf;

use anyhow::{anyhow, Error};
use async_trait::async_trait;
use log::info;
use tauri::api::path::cache_dir;

use crate::github;

use super::resolver::{
    LatestVersionApiAdapter, VersionAsset, VersionDownloadInfo, BINARY_RESOLVER_LOG_TARGET,
};

pub struct GithubReleasesAdapter {
    pub repo: String,
    pub owner: String,
}

#[async_trait]
impl LatestVersionApiAdapter for GithubReleasesAdapter {
    async fn fetch_releases_list(&self) -> Result<VersionDownloadInfo, Error> {
        let releases = github::list_releases(&self.owner, &self.repo).await?;
        // dbg!(&releases);
        let network = "pre";
        let version = releases
            .iter()
            .filter_map(|v| {
                if v.version.pre.starts_with(network) {
                    info!(target: BINARY_RESOLVER_LOG_TARGET, "Found candidate version: {}", v.version);
                    Some(&v.version)
                } else {
                    None
                }
            })
            .max()
            .ok_or_else(|| anyhow!("No pre release found"))?;

        info!(target: BINARY_RESOLVER_LOG_TARGET, "Selected version: {}", version);
        let info = releases
            .iter()
            .find(|v| &v.version == version)
            .ok_or_else(|| anyhow!("No version found"))?;

        Ok(info.clone())
    }

    async fn get_checksum_path(&self, version: &VersionDownloadInfo) -> Result<PathBuf, Error> {
        let platform = self.find_version_for_platform(version)?;
        let checksum_path = self.get_binary_folder().join(format!("{}.sha256", platform.name));
        Ok(checksum_path)
    }

    fn get_binary_folder(&self) -> PathBuf {
        cache_dir()
            .unwrap()
            .join("com.tari.universe")
            .join(&self.repo)
    }

    fn find_version_for_platform(
        &self,
        version: &VersionDownloadInfo,
    ) -> Result<VersionAsset, Error> {
        let mut name_suffix = "";
        // TODO: add platform specific logic
        if cfg!(target_os = "windows") {
            name_suffix = "windows-x64.exe.zip";
        }

        if cfg!(target_os = "macos") && cfg!(target_arch = "x86_64") {
            name_suffix = "macos-x86_64.zip";
        }

        if cfg!(target_os = "macos") && cfg!(target_arch = "aarch64") {
            name_suffix = "macos-arm64.zip";
        }
        if cfg!(target_os = "linux") {
            name_suffix = "linux-x86_64.zip";
        }

        info!(target: BINARY_RESOLVER_LOG_TARGET, "Looking for platform with suffix: {}", name_suffix);

        let platform = version
            .assets
            .iter()
            .find(|a| a.name.ends_with(name_suffix))
            .ok_or(anyhow::anyhow!("Failed to get platform asset"))?;
        info!(target: BINARY_RESOLVER_LOG_TARGET, "Found platform: {:?}", platform);
        Ok(platform.clone())
    }
}
