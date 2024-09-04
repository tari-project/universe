use crate::download_utils::{download_file_with_retries, extract, validate_checksum};
use crate::{github, ProgressTracker};
use anyhow::{anyhow, Error};
use async_trait::async_trait;
use log::{info, warn};
use regex::Regex;
use semver::Version;
use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::{Arc, LazyLock};
use tauri::api::path::cache_dir;
use tokio::fs;
use tokio::sync::{Mutex, RwLock};

const LOG_TARGET: &str = "tari::universe::binary_resolver";
static INSTANCE: LazyLock<BinaryResolver> = LazyLock::new(BinaryResolver::new);

pub struct BinaryResolver {
    download_mutex: Mutex<()>,
    adapters: HashMap<Binaries, Box<dyn LatestVersionApiAdapter>>,
    latest_versions: Arc<RwLock<HashMap<Binaries, Version>>>,
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
        _version: &VersionDownloadInfo,
    ) -> Result<VersionAsset, Error> {
        todo!()
    }
}

pub struct GithubReleasesAdapter {
    pub repo: String,
    pub owner: String,
    pub specific_name: Option<Regex>,
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
                    info!(target: LOG_TARGET, "Found candidate version: {}", v.version);
                    Some(&v.version)
                } else {
                    None
                }
            })
            .max()
            .ok_or_else(|| anyhow!("No pre release found"))?;

        info!(target: LOG_TARGET, "Selected version: {}", version);
        let info = releases
            .iter()
            .find(|v| &v.version == version)
            .ok_or_else(|| anyhow!("No version found"))?;

        Ok(info.clone())
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
            name_suffix = r"windows-x64.*\.zip";
        }

        if cfg!(target_os = "macos") && cfg!(target_arch = "x86_64") {
            name_suffix = r"macos-x86_64.*\.zip";
        }

        if cfg!(target_os = "macos") && cfg!(target_arch = "aarch64") {
            name_suffix = r"macos-arm64.*\.zip";
        }
        if cfg!(target_os = "linux") {
            name_suffix = r"linux-x86_64.*\.zip";
        }

        info!(target: LOG_TARGET, "Looking for platform with suffix: {}", name_suffix);

        let reg = Regex::new(name_suffix).unwrap();

        let platform = version
            .assets
            .iter()
            .find(|a| {
                if let Some(ref specific) = self.specific_name {
                    specific.is_match(&a.name) && reg.is_match(&a.name)
                } else {
                    reg.is_match(&a.name)
                }
            })
            .ok_or(anyhow::anyhow!("Failed to get platform asset"))?;
        info!(target: LOG_TARGET, "Found platform: {:?}", platform);
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
                specific_name: None,
            }),
        );
        adapters.insert(
            Binaries::MinotariNode,
            Box::new(GithubReleasesAdapter {
                repo: "tari".to_string(),
                owner: "tari-project".to_string(),
                specific_name: None,
            }),
        );
        adapters.insert(
            Binaries::Wallet,
            Box::new(GithubReleasesAdapter {
                repo: "tari".to_string(),
                owner: "tari-project".to_string(),
                specific_name: None,
            }),
        );
        adapters.insert(
            Binaries::GpuMiner,
            Box::new(GithubReleasesAdapter {
                repo: "tarigpuminer".to_string(),
                owner: "stringhandler".to_string(),
                specific_name: Some("opencl.*testnet".parse().expect("Bad regex string")),
            }),
        );
        adapters.insert(
            Binaries::ShaP2pool,
            Box::new(GithubReleasesAdapter {
                repo: "sha-p2pool".to_string(),
                owner: "tari-project".to_string(),
                specific_name: None,
            }),
        );

        Self {
            adapters,
            download_mutex: Mutex::new(()),
            latest_versions: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    pub fn current() -> &'static Self {
        &INSTANCE
    }

    pub async fn resolve_path(&self, binary: Binaries) -> Result<PathBuf, anyhow::Error> {
        let adapter = self
            .adapters
            .get(&binary)
            .ok_or_else(|| anyhow!("No latest version adapter for this binary"))?;
        let guard = self.latest_versions.read().await;
        let version = guard
            .get(&binary)
            .ok_or_else(|| anyhow!("No latest version found for binary {}", binary.name()))?;
        let base_dir = adapter.get_binary_folder().join(version.to_string());
        get_binary_name(binary, base_dir)
    }

    pub async fn ensure_latest(
        &self,
        binary: Binaries,
        progress_tracker: ProgressTracker,
    ) -> Result<Version, anyhow::Error> {
        let version = self
            .ensure_latest_inner(binary, false, progress_tracker)
            .await?;
        self.latest_versions
            .write()
            .await
            .insert(binary, version.clone());
        info!(target: LOG_TARGET, "Latest version of {} is {}", binary.name(), version);
        Ok(version)
    }

    async fn ensure_latest_inner(
        &self,
        binary: Binaries,
        force_download: bool,
        progress_tracker: ProgressTracker,
    ) -> Result<Version, Error> {
        let adapter = self
            .adapters
            .get(&binary)
            .ok_or_else(|| anyhow!("No latest version adapter for this binary"))?;
        let latest_release = adapter.fetch_latest_release().await?;
        // TODO: validate that version doesn't have any ".." or "/" in it

        let bin_folder = adapter
            .get_binary_folder()
            .join(latest_release.version.to_string());
        let _lock = self.download_mutex.lock().await;

        if force_download {
            info!(target: LOG_TARGET, "Cleaning up existing dir");
            let _ = fs::remove_dir_all(&bin_folder).await;
        }
        if !bin_folder.exists() || bin_folder.join("in_progress").exists() {
            info!(target: LOG_TARGET, "Creating {} dir", binary.name());
            info!("latest version is {}", latest_release.version);
            let in_progress_dir = bin_folder.join("in_progress");
            if in_progress_dir.exists() {
                info!(target: LOG_TARGET, "Trying to delete dir {:?}", in_progress_dir);
                match fs::remove_dir(&in_progress_dir).await {
                    Ok(_) => {}
                    Err(e) => {
                        warn!(target: LOG_TARGET, "Failed to delete dir {:?}. Continuing", e);
                    }
                }
            }

            let asset = adapter.find_version_for_platform(&latest_release)?;
            info!(target: LOG_TARGET, "Downloading file");
            info!(target: LOG_TARGET, "Downloading file from {}", &asset.url);
            //
            let in_progress_file_zip = in_progress_dir.join(&asset.name);
            download_file_with_retries(&asset.url, &in_progress_file_zip, progress_tracker.clone())
                .await?;
            info!(target: LOG_TARGET, "Renaming file");
            info!(target: LOG_TARGET, "Extracting file");

            let in_progress_file_sha256 = in_progress_dir
                .clone()
                .join(format!("{}.sha256", asset.name));
            let asset_sha256_url = format!("{}.sha256", asset.url.clone());
            download_file_with_retries(
                &asset_sha256_url,
                &in_progress_file_sha256,
                progress_tracker.clone(),
            )
            .await?;

            let is_sha_validated = validate_checksum(
                in_progress_file_zip.clone(),
                in_progress_file_sha256.clone(),
                asset.name.clone(),
            )
            .await?;
            if is_sha_validated {
                println!("ZIP file integrity verified successfully!");
                println!("Renaming & Extracting file");
                let bin_dir = adapter
                    .get_binary_folder()
                    .join(&latest_release.version.to_string());
                dbg!(&bin_dir);

                extract(&in_progress_file_zip, &bin_dir).await?;
            } else {
                return Err(anyhow!("ZIP file integrity verification failed!"));
            }
            fs::remove_dir_all(in_progress_dir).await?;
        }
        Ok(latest_release.version)
    }

    pub async fn read_current_highest_version(
        &self,
        binary: Binaries,
        progress_tracker: ProgressTracker,
    ) -> Result<Version, Error> {
        let adapter = self
            .adapters
            .get(&binary)
            .ok_or_else(|| anyhow!("No latest version adapter for this binary"))?;
        let bin_folder = adapter.get_binary_folder();
        let version_folders_list = match std::fs::read_dir(&bin_folder) {
            Ok(list) => list,
            Err(_) => match std::fs::create_dir_all(&bin_folder) {
                Ok(_) => std::fs::read_dir(&bin_folder).unwrap(),
                Err(e) => {
                    return Err(anyhow!("Failed to create dir: {}", e));
                }
            },
        };
        let mut versions = vec![];
        for entry in version_folders_list {
            let entry = match entry {
                Ok(entry) => entry,
                Err(_) => continue,
            };
            let path = entry.path();
            if path.is_dir() {
                // Check for actual binary existing. It can happen that the folder is there,
                // for in_progress downloads or perhaps the antivirus has quarantined the file
                let mut executable_name = get_binary_name(binary, path.clone())?;

                if cfg!(target_os = "windows") {
                    executable_name = executable_name.with_extension("exe");
                }

                if !executable_name.exists() {
                    continue;
                }

                let version = path.file_name().unwrap().to_str().unwrap();
                versions.push(Version::parse(version).unwrap());
            }
        }

        if versions.is_empty() {
            match self
                .ensure_latest_inner(binary, true, progress_tracker)
                .await
            {
                Ok(version) => {
                    self.latest_versions
                        .write()
                        .await
                        .insert(binary, version.clone());
                    return Ok(version);
                }
                Err(e) => {
                    return Err(e);
                }
            }
        }

        versions.sort();
        let cached_version = versions.pop().unwrap();
        let current_version = self.get_latest_version(binary).await;

        let highest_version = cached_version.max(current_version);

        self.latest_versions
            .write()
            .await
            .insert(binary, highest_version.clone());

        Ok(highest_version.clone())
    }

    pub async fn get_latest_version(&self, binary: Binaries) -> Version {
        let guard = self.latest_versions.read().await;
        guard.get(&binary).cloned().unwrap_or(Version::new(0, 0, 0))
    }
}

fn get_binary_name(binary: Binaries, base_dir: PathBuf) -> Result<PathBuf, Error> {
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
        Binaries::Wallet => {
            let wallet_bin = base_dir.join("minotari_console_wallet");
            Ok(wallet_bin)
        }
        Binaries::GpuMiner => {
            let xtrgpu_bin = base_dir.join("xtrgpuminer");

            Ok(xtrgpu_bin)
        }
        Binaries::ShaP2pool => {
            let sha_p2pool_bin = base_dir.join("sha_p2pool");
            Ok(sha_p2pool_bin)
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum Binaries {
    Xmrig,
    MergeMiningProxy,
    MinotariNode,
    Wallet,
    GpuMiner,
    ShaP2pool,
}

impl Binaries {
    pub fn name(&self) -> &str {
        match self {
            Binaries::Xmrig => "xmrig",
            Binaries::MergeMiningProxy => "mmproxy",
            Binaries::MinotariNode => "minotari_node",
            Binaries::Wallet => "wallet",
            Binaries::GpuMiner => "xtrgpuminer",
            Binaries::ShaP2pool => "sha-p2pool",
        }
    }
}
