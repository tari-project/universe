use crate::download_utils::{download_file_with_retries, extract, validate_checksum};
use crate::{progress_tracker, ProgressTracker};
use anyhow::{anyhow, Error};
use async_trait::async_trait;
use log::{info, warn};
use semver::{Version, VersionReq};
use std::collections::HashMap;
use std::future::IntoFuture;
use std::path::{self, PathBuf};
use std::sync::{Arc, LazyLock};
use tokio::fs;
use tokio::sync::{Mutex, RwLock};

use super::adapter_github::GithubReleasesAdapter;
use super::adapter_xmrig::XmrigVersionApiAdapter;
use super::binaries_list::get_binary_path;
use super::binaries_manager::BinaryManager;
use super::Binaries;

pub const BINARY_RESOLVER_LOG_TARGET: &str = "tari::universe::binary_resolver";
static INSTANCE: LazyLock<RwLock<BinaryResolver>> =
    LazyLock::new(|| RwLock::new(BinaryResolver::new()));

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
    async fn fetch_releases_list(&self) -> Result<Vec<VersionDownloadInfo>, Error>;

    // async fn get_checksum_path(&self, version: &VersionDownloadInfo) -> Option<PathBuf>;

    // fn get_binary_file(&self, version: &VersionDownloadInfo) -> Option<PathBuf>;

    fn get_binary_folder(&self) -> PathBuf;

    fn find_version_for_platform(
        &self,
        version: &VersionDownloadInfo,
    ) -> Result<VersionAsset, Error>;
}

pub struct BinaryResolver {
    download_mutex: Mutex<()>,
    managers: HashMap<Binaries, BinaryManager>,
}

impl BinaryResolver {
    pub fn new() -> Self {
        let mut binary_manager = HashMap::<Binaries, BinaryManager>::new();
        let versions_requirements_path = path::absolute("./binaries_versions.json").unwrap();

        binary_manager.insert(
            Binaries::Xmrig,
            BinaryManager::new(
                Binaries::Xmrig.name().to_string(),
                Box::new(XmrigVersionApiAdapter {}),
                versions_requirements_path.clone(),
            ),
        );

        binary_manager.insert(
            Binaries::MergeMiningProxy,
            BinaryManager::new(
                Binaries::MergeMiningProxy.name().to_string(),
                Box::new(GithubReleasesAdapter {
                    repo: "tari".to_string(),
                    owner: "tari-project".to_string(),
                }),
                versions_requirements_path.clone(),
            ),
        );

        binary_manager.insert(
            Binaries::MinotariNode,
            BinaryManager::new(
                Binaries::MinotariNode.name().to_string(),
                Box::new(GithubReleasesAdapter {
                    repo: "tari".to_string(),
                    owner: "tari-project".to_string(),
                }),
                versions_requirements_path.clone(),
            ),
        );

        binary_manager.insert(
            Binaries::Wallet,
            BinaryManager::new(
                Binaries::Wallet.name().to_string(),
                Box::new(GithubReleasesAdapter {
                    repo: "tari".to_string(),
                    owner: "tari-project".to_string(),
                }),
                versions_requirements_path.clone(),
            ),
        );

        binary_manager.insert(
            Binaries::ShaP2pool,
            BinaryManager::new(
                Binaries::ShaP2pool.name().to_string(),
                Box::new(GithubReleasesAdapter {
                    repo: "sha-p2pool".to_string(),
                    owner: "tari-project".to_string(),
                }),
                versions_requirements_path.clone(),
            ),
        );

        Self {
            managers: binary_manager,
            download_mutex: Mutex::new(()),
        }
    }

    pub fn current() -> &'static RwLock<BinaryResolver> {
        &INSTANCE
    }

    pub async fn resolve_path_to_binary_files(&self, binary: Binaries) -> Result<PathBuf, Error> {
        let manager = self
            .managers
            .get(&binary)
            .ok_or_else(|| anyhow!("No latest version manager for this binary"))?;

        let version = manager
            .get_selected_version()
            .ok_or_else(|| anyhow!("No version selected for binary {}", binary.name()))?;
        let base_dir = manager.get_base_dir();
        Ok(PathBuf::from(
            base_dir.join(binary.binary_file_name(version)),
        ))
    }

    pub async fn initalize_binary(
        &mut self,
        binary: Binaries,
        progress_tracker: ProgressTracker,
        should_check_for_update: bool,
    ) -> Result<(), Error> {
        let manager = self.managers.get_mut(&binary).unwrap();
        let _lock = self.download_mutex.lock().await;

        manager.read_local_versions().await;

        if should_check_for_update {
            // Will populate Vec of downloaded versions that meet the requirements
            manager.check_for_updates().await;
        }

        let mut highest_version = manager.select_highest_version();

        println!("Highest version for binary: {:?} is: {:?}", binary.name(), highest_version);

        if !should_check_for_update && highest_version.is_none() {
            println!("No version selected => downloading");
            manager.check_for_updates().await;
            highest_version = manager.select_highest_version();
            manager
                .download_selected_version(progress_tracker.clone())
                .await;
        }

        if highest_version.is_none() {
            println!("No version selectedddd => downloading");
            manager
                .download_selected_version(progress_tracker.clone())
                .await;
        }

        let check_if_files_exist = manager.check_if_files_of_selected_version_exist(binary);
        if !check_if_files_exist {
            println!("Not existing => downloading");
            manager
                .download_selected_version(progress_tracker.clone())
                .await;
        }

        let check_if_files_exist = manager.check_if_files_of_selected_version_exist(binary);
        if !check_if_files_exist {
            return Err(anyhow!("Failed to download binaries"));
        }
        Ok(())
    }

    pub async fn update_binary(
        &mut self,
        binary: Binaries,
        progress_tracker: ProgressTracker,
    ) -> Result<(), Error> {
        let manager = self.managers.get_mut(&binary).unwrap();

        manager.check_for_updates().await;
        manager.select_highest_version();

        let check_if_files_exist = manager.check_if_files_of_selected_version_exist(binary);
        if !check_if_files_exist {
            manager
                .download_selected_version(progress_tracker.clone())
                .await;
        }

        Ok(())
    }

    pub async fn get_binary_version(&self, binary: Binaries) -> Version {
        let manager = self.managers.get(&binary).unwrap();
        manager.get_selected_version().unwrap()
    }
}
