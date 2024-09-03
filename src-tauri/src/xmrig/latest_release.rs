use crate::binary_resolver::{VersionAsset, VersionDownloadInfo};
use crate::github;
use anyhow::{anyhow, Error};
use log::info;
use regex::Regex;

const LOG_TARGET: &str = "tari::universe::xmrig::latest_release";
#[derive(Debug, Deserialize)]
pub struct Asset {
    id: String,
    pub(crate) name: String,
    pub url: String,
}

#[derive(Debug, Deserialize)]
pub struct XmrigRelease {
    pub(crate) version: String,
    pub(crate) assets: Vec<Asset>,
}

impl XmrigRelease {
    pub fn get_asset(&self, id: &str) -> Option<&Asset> {
        for asset in &self.assets {
            info!(target: LOG_TARGET, "Checking asset {:?}", asset);
            if asset.id == id {
                return Some(asset);
            }
        }
        None
    }
}

pub fn find_version_for_platform(version: &VersionDownloadInfo) -> Result<VersionAsset, Error> {
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

    info!(target: LOG_TARGET, "Looking for platform with suffix: {}", name_suffix);
    let reg = Regex::new(name_suffix).unwrap();
    let platform = version
        .assets
        .iter()
        .find(|a| reg.is_match(&a.name))
        .ok_or(anyhow::anyhow!("Failed to get platform asset"))?;
    info!(target: LOG_TARGET, "Found platform: {:?}", platform);
    Ok(platform.clone())
}
