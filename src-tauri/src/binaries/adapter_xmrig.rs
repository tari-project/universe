use std::path::PathBuf;

use anyhow::Error;
use async_trait::async_trait;
use regex::Regex;
use tauri::api::path::cache_dir;

use crate::github;

use super::binaries_resolver::{LatestVersionApiAdapter, VersionAsset, VersionDownloadInfo};

pub struct XmrigVersionApiAdapter {}

#[async_trait]
impl LatestVersionApiAdapter for XmrigVersionApiAdapter {
    async fn fetch_releases_list(&self) -> Result<Vec<VersionDownloadInfo>, Error> {
        let releases = github::list_releases("xmrig", "xmrig").await?;
        Ok(releases.clone())
    }

    // fn get_checksum_path(&self, _version: &VersionDownloadInfo) -> Option<PathBuf> {
    //     let bin_folder = self.get_binary_folder().join(_version.version.to_string());
    // }

    fn get_binary_folder(&self) -> PathBuf {
        let binary_folder_path = cache_dir().unwrap().join("com.tari.universe").join("xmrig");

        if !binary_folder_path.exists() {
            std::fs::create_dir_all(&binary_folder_path);
        }

        binary_folder_path
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

        let reg = Regex::new(name_suffix).unwrap();
        let platform = _version
            .assets
            .iter()
            .find(|a| reg.is_match(&a.name))
            .ok_or(anyhow::anyhow!("Failed to get platform asset"))?;
        Ok(platform.clone())
    }
}
