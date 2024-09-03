use std::path::PathBuf;

use anyhow::{anyhow, Error};
use async_trait::async_trait;
use log::info;
use semver::Version;
use tauri::api::path::cache_dir;

use crate::{
    binary_resolver::resolver::BINARY_RESOLVER_LOG_TARGET, xmrig::latest_release::XmrigRelease,
};

use super::resolver::{LatestVersionApiAdapter, VersionAsset, VersionDownloadInfo};

pub struct XmrigVersionApiAdapter {}

#[async_trait]
impl LatestVersionApiAdapter for XmrigVersionApiAdapter {
    async fn fetch_latest_release(&self) -> Result<VersionDownloadInfo, Error> {
        let url = "https://api.xmrig.com/1/latest_release";
        let response = reqwest::get(url).await?;
        let latest_release: XmrigRelease = response.json().await?;
        let version_asset = VersionDownloadInfo {
            assets: latest_release
                .assets
                .iter()
                .map(|a| VersionAsset {
                    url: a.url.clone(),
                    name: a.name.clone(),
                })
                .collect(),
            version: Version::parse(&latest_release.version).unwrap(),
        };

        Ok(version_asset)
    }

    fn get_binary_folder(&self) -> PathBuf {
        cache_dir().unwrap().join("com.tari.universe").join("xmrig")
    }

    fn find_version_for_platform(
        &self,
        _version: &VersionDownloadInfo,
    ) -> Result<VersionAsset, anyhow::Error> {
        let mut name_suffix = "Unsupported platform";
        #[cfg(target_os = "windows")]
        {
            name_suffix = "msvc-win64.zip";
        }

        #[cfg(target_os = "macos")]
        {
            #[cfg(target_arch = "x86_64")]
            {
                name_suffix = "macos-x64.tar.gz";
            }

            #[cfg(target_arch = "aarch64")]
            {
                // the x64 seems to work better on the M1
                name_suffix = "macos-arm64.tar.gz";
                // name_suffix =  "macos-x64";
            }
        }

        #[cfg(target_os = "linux")]
        {
            name_suffix = "linux-static-x64.tar.gz";
        }

        #[cfg(target_os = "freebsd")]
        {
            name_suffix = "freebsd-static-x64.tar.gz";
        }

        info!(target: BINARY_RESOLVER_LOG_TARGET, "Looking for platform with suffix: {}", name_suffix);

        let platform = _version
            .assets
            .iter()
            .find(|a| a.name.ends_with(name_suffix))
            .ok_or(anyhow::anyhow!("Failed to get platform asset"))?;
        info!(target: BINARY_RESOLVER_LOG_TARGET, "Found platform: {:?}", platform);
        Ok(platform.clone())
    }
}
