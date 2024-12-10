// Copyright 2024. The Tari Project
//
// Redistribution and use in source and binary forms, with or without modification, are permitted provided that the
// following conditions are met:
//
// 1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following
// disclaimer.
//
// 2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the
// following disclaimer in the documentation and/or other materials provided with the distribution.
//
// 3. Neither the name of the copyright holder nor the names of its contributors may be used to endorse or promote
// products derived from this software without specific prior written permission.
//
// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES,
// INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
// DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
// SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
// SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
// WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE
// USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

use crate::ProgressTracker;
use anyhow::{anyhow, Error};
use async_trait::async_trait;
use log::error;
use regex::Regex;
use semver::Version;
use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::LazyLock;
use std::time::Duration;
use tari_common::configuration::Network;
use tauri_plugin_sentry::sentry;
use tokio::sync::watch::Receiver;
use tokio::sync::RwLock;
use tokio::time::timeout;

use super::adapter_github::GithubReleasesAdapter;
use super::adapter_tor::TorReleaseAdapter;
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

    fn get_binary_folder(&self) -> Result<PathBuf, Error>;

    fn find_version_for_platform(
        &self,
        version: &VersionDownloadInfo,
    ) -> Result<VersionAsset, Error>;
}

pub struct BinaryResolver {
    managers: HashMap<Binaries, BinaryManager>,
}

impl BinaryResolver {
    #[allow(clippy::too_many_lines)]
    pub fn new() -> Self {
        let mut binary_manager = HashMap::<Binaries, BinaryManager>::new();

        let gpu_miner_nextnet_regex = Regex::new(r"opencl.*nextnet").ok();

        let gpu_miner_testnet_regex = Regex::new(r"opencl.*testnet").ok();

        let (tari_prerelease_prefix, gpuminer_specific_nanme) =
            match Network::get_current_or_user_setting_or_default() {
                Network::NextNet => ("rc", gpu_miner_nextnet_regex),
                Network::Esmeralda => ("pre", gpu_miner_testnet_regex),
                _ => panic!("Unsupported network"),
            };

        binary_manager.insert(
            Binaries::Xmrig,
            BinaryManager::new(
                Binaries::Xmrig.name().to_string(),
                // Some("xmrig-6.22.0".to_string()),
                None,
                Box::new(XmrigVersionApiAdapter {}),
                None,
                true,
            ),
        );

        binary_manager.insert(
            Binaries::GpuMiner,
            BinaryManager::new(
                Binaries::GpuMiner.name().to_string(),
                None,
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
                None,
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
                None,
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
                None,
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
                None,
                Box::new(GithubReleasesAdapter {
                    repo: "sha-p2pool".to_string(),
                    owner: "tari-project".to_string(),
                    specific_name: None,
                }),
                None,
                true,
            ),
        );

        binary_manager.insert(
            Binaries::Tor,
            BinaryManager::new(
                Binaries::Tor.name().to_string(),
                Some("tor".to_string()),
                Box::new(TorReleaseAdapter {}),
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

    pub fn resolve_path_to_binary_files(&self, binary: Binaries) -> Result<PathBuf, Error> {
        let manager = self
            .managers
            .get(&binary)
            .ok_or_else(|| anyhow!("No latest version manager for this binary"))?;

        let version = manager
            .get_used_version()
            .ok_or_else(|| anyhow!("No version selected for binary {}", binary.name()))?;

        let base_dir = manager.get_base_dir().map_err(|error| {
            anyhow!(
                "No base directory for binary {}, Error: {}",
                binary.name(),
                error
            )
        })?;

        if let Some(sub_folder) = manager.binary_subfolder() {
            return Ok(base_dir
                .join(sub_folder)
                .join(binary.binary_file_name(version)));
        }
        Ok(base_dir.join(binary.binary_file_name(version)))
    }

    pub async fn initialize_binary_timeout(
        &mut self,
        binary: Binaries,
        progress_tracker: ProgressTracker,
        should_check_for_update: bool,
        timeout_channel: Receiver<String>,
    ) -> Result<(), Error> {
        match timeout(
            Duration::from_secs(60 * 5),
            self.initialize_binary(binary, progress_tracker.clone(), should_check_for_update),
        )
        .await
        {
            Err(_) => {
                let last_msg = timeout_channel.borrow().clone();
                error!(target: "tari::universe::main", "Setup took too long: {:?}", last_msg);
                let error_msg = format!("Setup took too long: {}", last_msg);
                sentry::capture_message(&error_msg, sentry::Level::Error);
                Err(anyhow!(error_msg))
            }
            Ok(result) => result,
        }
    }

    pub async fn initialize_binary(
        &mut self,
        binary: Binaries,
        progress_tracker: ProgressTracker,
        should_check_for_update: bool,
    ) -> Result<(), Error> {
        let manager = self
            .managers
            .get_mut(&binary)
            .ok_or_else(|| anyhow!("Couldn't find manager for binary: {}", binary.name()))?;

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
                .await?;
        }

        // Check if the files exist after download
        let check_if_files_exist =
            manager.check_if_files_for_version_exist(highest_version.clone());
        if !check_if_files_exist {
            manager
                .download_selected_version(highest_version.clone(), progress_tracker.clone())
                .await?;
        }

        // Throw error if files still do not exist
        let check_if_files_exist =
            manager.check_if_files_for_version_exist(highest_version.clone());
        if !check_if_files_exist {
            return Err(anyhow!("Failed to download binaries"));
        }

        match highest_version {
            Some(version) => manager.set_used_version(version),
            None => return Err(anyhow!("No version selected for binary {}", binary.name())),
        }

        Ok(())
    }

    pub async fn update_binary(
        &mut self,
        binary: Binaries,
        progress_tracker: ProgressTracker,
    ) -> Result<(), Error> {
        let manager = self
            .managers
            .get_mut(&binary)
            .ok_or_else(|| anyhow!("Couldn't find manager for binary: {}", binary.name()))?;

        manager.check_for_updates().await;
        let highest_version = manager.select_highest_version();

        progress_tracker
            .send_last_action(format!(
                "Checking if files exist before download: {} {}",
                binary.name(),
                highest_version.clone().unwrap_or(Version::new(0, 0, 0))
            ))
            .await;

        let check_if_files_exist =
            manager.check_if_files_for_version_exist(highest_version.clone());
        if !check_if_files_exist {
            manager
                .download_selected_version(highest_version.clone(), progress_tracker.clone())
                .await?;
        }

        progress_tracker
            .send_last_action(format!(
                "Checking if files exist after download: {} {}",
                binary.name(),
                highest_version.clone().unwrap_or(Version::new(0, 0, 0))
            ))
            .await;
        let check_if_files_exist =
            manager.check_if_files_for_version_exist(highest_version.clone());
        if !check_if_files_exist {
            return Err(anyhow!("Failed to download binaries"));
        }

        match highest_version {
            Some(version) => manager.set_used_version(version),
            None => return Err(anyhow!("No version selected for binary {}", binary.name())),
        }

        Ok(())
    }

    pub fn get_binary_version(&self, binary: Binaries) -> Option<Version> {
        self.managers
            .get(&binary)
            .and_then(|manager| manager.get_used_version())
    }

    pub async fn get_binary_version_string(&self, binary: Binaries) -> String {
        let version = self.get_binary_version(binary);
        version
            .map(|v| v.to_string())
            .unwrap_or_else(|| "Not Installed".to_string())
    }
}
