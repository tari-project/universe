use crate::download_utils::{download_file, extract};
use crate::github;
use anyhow::{anyhow, Error};
use async_trait::async_trait;
use semver::Version;
use std::collections::HashMap;
use std::path::PathBuf;
use tauri::api::path::cache_dir;
use tokio::fs;

const TARI_SUITE_VERSION_URL: &str =
    "https://api.github.com/repos/tari-project/tari/releases/tags/v1.0.0-pre.18";

pub struct BinaryResolver {
    adapters: HashMap<Binaries, Box<dyn LatestVersionApiAdapter>>,
}

#[derive(Debug, Clone)]
pub struct VersionDownloadInfo {
    pub(crate) version: Version,
    pub(crate) assets: Vec<VersionAsset>,
}

#[derive(Debug, Clone)]
pub struct VersionAsset {
    pub(crate) url: String,
    pub(crate) name: String,
}

#[async_trait]
pub trait LatestVersionApiAdapter: Send + Sync + 'static {
    async fn fetch_latest_release(&self) -> Result<VersionDownloadInfo, Error>;

    fn get_binary_folder(&self) -> PathBuf;

    fn find_version_for_platform(
        &self,
        version: &VersionDownloadInfo,
    ) -> Result<VersionAsset, Error>;
}

pub struct XmrigVersionApiAdapter {}

#[async_trait]
impl LatestVersionApiAdapter for XmrigVersionApiAdapter {
    async fn fetch_latest_release(&self) -> Result<VersionDownloadInfo, Error> {
        todo!()
    }

    fn get_binary_folder(&self) -> PathBuf {
        todo!()
    }

    fn find_version_for_platform(
        &self,
        version: &VersionDownloadInfo,
    ) -> Result<VersionAsset, Error> {
        todo!()
    }
}

pub struct GithubReleasesAdapter {
    pub repo: String,
    pub owner: String,
}

#[async_trait]
impl LatestVersionApiAdapter for GithubReleasesAdapter {
    async fn fetch_latest_release(&self) -> Result<VersionDownloadInfo, Error> {
        let releases = github::list_releases(&self.owner, &self.repo).await?;
        // dbg!(&releases);
        let network = "pre";
        let version = releases
            .iter()
            .filter_map(|v| {
                if v.version.pre.starts_with(network) {
                    Some(&v.version)
                } else {
                    None
                }
            })
            .max()
            .ok_or_else(|| anyhow!("No pre release found"))?;

        let info = releases
            .iter()
            .find(|v| &v.version == version)
            .ok_or_else(|| anyhow!("No version found"))?;

        Ok(info.clone())
    }

    fn get_binary_folder(&self) -> PathBuf {
        cache_dir().unwrap().join("tari-universe").join(&self.repo)
    }

    fn find_version_for_platform(
        &self,
        version: &VersionDownloadInfo,
    ) -> Result<VersionAsset, Error> {
        // TODO: add platform specific logic
        #[cfg(target_os = "windows")]
        let name_suffix = "windows-x64.exe.zip";
        #[cfg(target_os = "macos")]
        let name_suffix = "macos-arm64.zip";
        #[cfg(target_os = "linux")]
        let name_suffix = "linux-x86_64.zip";

        let platform = version
            .assets
            .iter()
            .find(|a| a.name.ends_with(name_suffix))
            .ok_or(anyhow::anyhow!("Failed to get windows_x64 asset"))?;
        Ok(platform.clone())
    }
}

impl BinaryResolver {
    pub fn new() -> Self {
        let mut adapters = HashMap::<Binaries, Box<dyn LatestVersionApiAdapter>>::new();
        adapters.insert(Binaries::Xmrig, Box::new(XmrigVersionApiAdapter {}));
        adapters.insert(
            Binaries::MergeMiningProxy,
            Box::new(GithubReleasesAdapter {
                repo: "tari".to_string(),
                owner: "tari-project".to_string(),
            }),
        );
        adapters.insert(
            Binaries::MinotariNode,
            Box::new(GithubReleasesAdapter {
                repo: "tari".to_string(),
                owner: "tari-project".to_string(),
            }),
        );
        Self { adapters }
    }

    pub fn current() -> Self {
        Self::new()
    }
    pub fn resolve_path(
        &self,
        binary: Binaries,
        version: &Version,
    ) -> Result<PathBuf, anyhow::Error> {
        let adapter = self
            .adapters
            .get(&binary)
            .ok_or_else(|| anyhow!("No latest version adapter for this binary"))?;
        let base_dir = adapter.get_binary_folder().join(&version.to_string());
        match binary {
            Binaries::Xmrig => {
                let xmrig_bin = base_dir.join("xmrig");
                Ok(xmrig_bin)
            }
            Binaries::MergeMiningProxy => {
                let mmproxy_bin = base_dir.join("minotari_merge_mining_proxy");
                Ok(mmproxy_bin)
            }
            Binaries::MinotariNode => {
                let minotari_node_bin = base_dir.join("minotari_node");
                Ok(minotari_node_bin)
            }
        }
    }

    pub async fn ensure_latest(&self, binary: Binaries) -> Result<Version, anyhow::Error> {
        let version = self.ensure_latest_inner(binary, false).await?;
        Ok(version)
    }

    async fn ensure_latest_inner(
        &self,
        binary: Binaries,
        force_download: bool,
    ) -> Result<Version, Error> {
        let adapter = self
            .adapters
            .get(&binary)
            .ok_or_else(|| anyhow!("No latest version adapter for this binary"))?;
        let latest_release = adapter.fetch_latest_release().await?;
        // TODO: validate that version doesn't have any ".." or "/" in it

        let bin_folder = adapter
            .get_binary_folder()
            .join(&latest_release.version.to_string());
        if force_download {
            println!("Cleaning up existing dir");
            let _ = fs::remove_dir_all(&bin_folder).await;
        }
        if !bin_folder.exists() {
            println!("Creating {} dir", binary.name());
            println!("latest version is {}", latest_release.version);
            let in_progress_dir = bin_folder.join("in_progress");
            if in_progress_dir.exists() {
                println!("Trying to delete dir {:?}", in_progress_dir);
                match fs::remove_dir(&in_progress_dir).await {
                    Ok(_) => {}
                    Err(e) => {
                        println!("Failed to delete dir {:?}", e);
                        // return Err(e.into());
                    }
                }
            }

            let asset = adapter.find_version_for_platform(&latest_release)?;
            // let platform = latest_release
            //     .get_asset(&::get_os_string())
            //     .ok_or(anyhow::anyhow!("Failed to get windows_x64 asset"))?;
            println!("Downloading file");
            println!("Downloading file from {}", &asset.url);
            //
            let in_progress_file = in_progress_dir.join(&asset.name);
            download_file(&asset.url, &in_progress_file).await?;
            println!("Renaming file");
            println!("Extracting file");
            let bin_dir = adapter
                .get_binary_folder()
                .join(&latest_release.version.to_string());
            dbg!(&bin_dir);
            extract(&in_progress_file, &bin_dir).await?;

            fs::remove_dir_all(in_progress_dir).await?;
        }
        Ok(latest_release.version)
    }

    fn get_os_string() -> String {
        #[cfg(target_os = "windows")]
        {
            return "windows-x64".to_string();
        }

        #[cfg(target_os = "macos")]
        {
            return "macos-x64".to_string();
        }

        #[cfg(target_os = "linux")]
        {
            return "linux-x64".to_string();
        }

        #[cfg(target_os = "freebsd")]
        {
            return "freebsd-x64".to_string();
        }

        panic!("Unsupported OS");
    }
}

#[derive(Debug, Clone, PartialEq, Eq, Hash)]
pub enum Binaries {
    Xmrig,
    MergeMiningProxy,
    MinotariNode,
}

impl Binaries {
    pub fn name(&self) -> &str {
        match self {
            Binaries::Xmrig => "xmrig",
            Binaries::MergeMiningProxy => "mmproxy",
            Binaries::MinotariNode => "minotari_node",
        }
    }
}
