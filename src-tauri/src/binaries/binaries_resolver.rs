use crate::ProgressTracker;
use anyhow::{anyhow, Error};
use async_trait::async_trait;
use regex::Regex;
use semver::Version;
use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::LazyLock;
use tari_common::configuration::Network;
use tokio::sync::RwLock;

use super::adapter_github::GithubReleasesAdapter;
use super::adapter_xmrig::XmrigVersionApiAdapter;
use super::binaries_manager::BinaryManager;
use super::Binaries;

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

    async fn download_and_get_checksum_path(
        &self,
        directory: PathBuf,
        download_info: VersionDownloadInfo,
        progress_tracker: ProgressTracker,
    ) -> Result<PathBuf, Error>;

    fn get_binary_folder(&self) -> PathBuf;

    fn find_version_for_platform(
        &self,
        version: &VersionDownloadInfo,
    ) -> Result<VersionAsset, Error>;
}

pub struct BinaryResolver {
    managers: HashMap<Binaries, BinaryManager>,
}

impl BinaryResolver {
    pub fn new() -> Self {
        let mut binary_manager = HashMap::<Binaries, BinaryManager>::new();

        let (tari_prerelease_prefix, gpuminer_specific_nanme) =
            match Network::get_current_or_user_setting_or_default() {
                Network::NextNet => ("rc", Some(Regex::new(r"opencl.*nextnet").unwrap())),
                Network::Esmeralda => ("pre", Some(Regex::new(r"opencl.*testnet").unwrap())),
                _ => panic!("Unsupported network"),
            };

        binary_manager.insert(
            Binaries::Xmrig,
            BinaryManager::new(
                Binaries::Xmrig.name().to_string(),
                Box::new(XmrigVersionApiAdapter {}),
                None,
                true,
            ),
        );

        binary_manager.insert(
            Binaries::GpuMiner,
            BinaryManager::new(
                Binaries::GpuMiner.name().to_string(),
                Box::new(GithubReleasesAdapter {
                    repo: "tarigpuminer".to_string(),
                    owner: "stringhandler".to_string(),
                    specific_name: gpuminer_specific_nanme,
                }),
                None,
                true,
            ),
        );

        binary_manager.insert(
            Binaries::MergeMiningProxy,
            BinaryManager::new(
                Binaries::MergeMiningProxy.name().to_string(),
                Box::new(GithubReleasesAdapter {
                    repo: "tari".to_string(),
                    owner: "tari-project".to_string(),
                    specific_name: None,
                }),
                Some(tari_prerelease_prefix.to_string()),
                true,
            ),
        );

        binary_manager.insert(
            Binaries::MinotariNode,
            BinaryManager::new(
                Binaries::MinotariNode.name().to_string(),
                Box::new(GithubReleasesAdapter {
                    repo: "tari".to_string(),
                    owner: "tari-project".to_string(),
                    specific_name: None,
                }),
                Some(tari_prerelease_prefix.to_string()),
                true,
            ),
        );

        binary_manager.insert(
            Binaries::Wallet,
            BinaryManager::new(
                Binaries::Wallet.name().to_string(),
                Box::new(GithubReleasesAdapter {
                    repo: "tari".to_string(),
                    owner: "tari-project".to_string(),
                    specific_name: None,
                }),
                Some(tari_prerelease_prefix.to_string()),
                true,
            ),
        );

        binary_manager.insert(
            Binaries::ShaP2pool,
            BinaryManager::new(
                Binaries::ShaP2pool.name().to_string(),
                Box::new(GithubReleasesAdapter {
                    repo: "sha-p2pool".to_string(),
                    owner: "tari-project".to_string(),
                    specific_name: None,
                }),
                None,
                true,
            ),
        );

        Self {
            managers: binary_manager,
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
            .get_used_version()
            .ok_or_else(|| anyhow!("No version selected for binary {}", binary.name()))?;
        let base_dir = manager.get_base_dir();
        Ok(base_dir.join(binary.binary_file_name(version)))
    }

    pub async fn initalize_binary(
        &mut self,
        binary: Binaries,
        progress_tracker: ProgressTracker,
        should_check_for_update: bool,
    ) -> Result<(), Error> {
        let manager = self.managers.get_mut(&binary).unwrap();

        manager.read_local_versions().await;

        if should_check_for_update {
            // Will populate Vec of downloaded versions that meet the requirements
            manager.check_for_updates().await;
        }

        // Selects the highest version from the Vec of downloaded versions and local versions
        let mut highest_version = manager.select_highest_version();

        // This covers case when we do not check newest version and there is no local version
        if !should_check_for_update && highest_version.is_none() {
            manager.check_for_updates().await;
            highest_version = manager.select_highest_version();
            manager
                .download_selected_version(highest_version.clone(), progress_tracker.clone())
                .await;
        }

        // Check if the files exist after download
        let check_if_files_exist =
            manager.check_if_files_for_version_exist(highest_version.clone());
        if !check_if_files_exist {
            manager
                .download_selected_version(highest_version.clone(), progress_tracker.clone())
                .await;
        }

        // Throw error if files still do not exist
        let check_if_files_exist =
            manager.check_if_files_for_version_exist(highest_version.clone());
        if !check_if_files_exist {
            return Err(anyhow!("Failed to download binaries"));
        }

        manager.set_used_version(highest_version.clone().unwrap());

        Ok(())
    }

    pub async fn update_binary(
        &mut self,
        binary: Binaries,
        progress_tracker: ProgressTracker,
    ) -> Result<(), Error> {
        let manager = self.managers.get_mut(&binary).unwrap();

        manager.check_for_updates().await;
        let highest_version = manager.select_highest_version();

        let check_if_files_exist =
            manager.check_if_files_for_version_exist(highest_version.clone());
        if !check_if_files_exist {
            manager
                .download_selected_version(highest_version.clone(), progress_tracker.clone())
                .await;
        }

        let check_if_files_exist =
            manager.check_if_files_for_version_exist(highest_version.clone());
        if !check_if_files_exist {
            return Err(anyhow!("Failed to download binaries"));
        }

        manager.set_used_version(highest_version.clone().unwrap());

        Ok(())
    }

    pub async fn get_binary_version(&self, binary: Binaries) -> Option<Version> {
        let manager = self.managers.get(&binary).unwrap();
        manager.get_used_version()
    }

    pub async fn get_binary_version_string(&self, binary: Binaries) -> String {
        let version = self.get_binary_version(binary).await;
        version
            .map(|v| v.to_string())
            .unwrap_or_else(|| "Not Installed".to_string())
    }
}
