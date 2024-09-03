use crate::download_utils::{download_file_with_retries, extract, validate_checksum};
use crate::ProgressTracker;
use anyhow::{anyhow, Error};
use async_trait::async_trait;
use log::{info, warn};
use semver::Version;
use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::{Arc, LazyLock};
use tokio::fs;
use tokio::sync::{Mutex, RwLock};

use super::adapter_github::GithubReleasesAdapter;
use super::adapter_xmrig::XmrigVersionApiAdapter;
use super::binaries::get_binary_path;
use super::Binaries;

pub const BINARY_RESOLVER_LOG_TARGET: &str = "tari::universe::binary_resolver";
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
        adapters.insert(
            Binaries::Wallet,
            Box::new(GithubReleasesAdapter {
                repo: "tari".to_string(),
                owner: "tari-project".to_string(),
            }),
        );
        adapters.insert(
            Binaries::ShaP2pool,
            Box::new(GithubReleasesAdapter {
                repo: "sha-p2pool".to_string(),
                owner: "tari-project".to_string(),
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

    // ================== Inner privet methods ================== //

    pub async fn resolve_path(&self, binary: Binaries) -> Result<PathBuf, Error> {
        let adapter = self
            .adapters
            .get(&binary)
            .ok_or_else(|| anyhow!("No latest version adapter for this binary"))?;
        let guard = self.latest_versions.read().await;
        let version = guard
            .get(&binary)
            .ok_or_else(|| anyhow!("No latest version found for binary {}", binary.name()))?;
        let base_dir = adapter.get_binary_folder().join(version.to_string());
        get_binary_path(binary, base_dir)
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
        info!(target: BINARY_RESOLVER_LOG_TARGET, "Latest version of {} is {}", binary.name(), version);
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
            println!("Cleaning up existing dir");
            let _ = fs::remove_dir_all(&bin_folder).await;
        }
        if !bin_folder.exists() || bin_folder.join("in_progress").exists() {
            info!(target: BINARY_RESOLVER_LOG_TARGET, "Creating {} dir", binary.name());
            info!("latest version is {}", latest_release.version);
            let in_progress_dir = bin_folder.join("in_progress");
            if in_progress_dir.exists() {
                info!(target: BINARY_RESOLVER_LOG_TARGET, "Trying to delete dir {:?}", in_progress_dir);
                match fs::remove_dir(&in_progress_dir).await {
                    Ok(_) => {}
                    Err(e) => {
                        warn!(target: BINARY_RESOLVER_LOG_TARGET, "Failed to delete dir {:?}. Continuing", e);
                    }
                }
            }

            let asset = adapter.find_version_for_platform(&latest_release)?;
            info!(target: BINARY_RESOLVER_LOG_TARGET, "Downloading file");
            info!(target: BINARY_RESOLVER_LOG_TARGET, "Downloading file from {}", &asset.url);
            //
            let in_progress_file_zip = in_progress_dir.join(&asset.name);
            match download_file_with_retries(
                &asset.url,
                &in_progress_file_zip,
                progress_tracker.clone(),
            )
            .await
            {
                Ok(_) => {}
                Err(_) => {
                    !todo!("Handle download error");
                    return Ok(BinaryResolver::current()
                        .get_latest_version(binary.clone())
                        .await);
                }
            };

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
                let mut executable_name = get_binary_path(binary, path.clone())?;

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
