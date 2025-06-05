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

use crate::configs::config_core::{ConfigCore, ConfigCoreContent};
use crate::configs::trait_config::ConfigImpl;
use crate::github::ReleaseSource;
use crate::progress_trackers::progress_stepper::ChanneledStepUpdate;
use anyhow::{anyhow, Error};
use async_trait::async_trait;
use regex::Regex;
use semver::Version;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::LazyLock;
use std::time::{Duration, SystemTime};
use tari_common::configuration::Network;
use tokio::sync::{Mutex, RwLock};

use super::adapter_bridge::BridgeTappletAdapter;
use super::adapter_github::GithubReleasesAdapter;
use super::adapter_tor::TorReleaseAdapter;
use super::adapter_xmrig::XmrigVersionApiAdapter;
use super::binaries_manager::BinaryManager;
use super::Binaries;

const TIME_BETWEEN_BINARIES_UPDATES: Duration = Duration::from_secs(60 * 60 * 6); // 6 hours

static INSTANCE: LazyLock<RwLock<BinaryResolver>> =
    LazyLock::new(|| RwLock::new(BinaryResolver::new()));

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VersionDownloadInfo {
    pub(crate) version: Version,
    pub(crate) assets: Vec<VersionAsset>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VersionAsset {
    pub(crate) url: String,
    pub(crate) fallback_url: Option<String>,
    pub(crate) name: String,
    pub(crate) source: ReleaseSource,
}

#[async_trait]
pub trait LatestVersionApiAdapter: Send + Sync + 'static {
    async fn fetch_releases_list(&self) -> Result<Vec<VersionDownloadInfo>, Error>;

    async fn get_expected_checksum(
        &self,
        checksum_path: PathBuf,
        asset_name: &str,
    ) -> Result<String, Error>;
    async fn download_and_get_checksum_path(
        &self,
        directory: PathBuf,
        download_info: VersionDownloadInfo,
    ) -> Result<PathBuf, Error>;

    fn get_binary_folder(&self) -> Result<PathBuf, Error>;

    fn find_version_for_platform(
        &self,
        version: &VersionDownloadInfo,
    ) -> Result<VersionAsset, Error>;
}

pub struct BinaryResolver {
    managers: HashMap<Binaries, Mutex<BinaryManager>>,
}

impl BinaryResolver {
    #[allow(clippy::too_many_lines)]
    pub fn new() -> Self {
        let mut binary_manager = HashMap::<Binaries, Mutex<BinaryManager>>::new();

        let mut gpu_miner_nextnet_regex = Regex::new(r"opencl.*nextnet").ok();
        let mut gpu_miner_testnet_regex = Regex::new(r"opencl.*testnet").ok();
        let mut gpu_miner_mainnet_regex = Regex::new(r"opencl.*mainnet").ok();

        if cfg!(target_os = "macos") && cfg!(target_arch = "aarch64") {
            gpu_miner_nextnet_regex = Regex::new(r"combined.*nextnet").ok();
            gpu_miner_testnet_regex = Regex::new(r"combined.*testnet").ok();
            gpu_miner_mainnet_regex = Regex::new(r"combined.*mainnet").ok();
        }

        let (tari_prerelease_prefix, gpuminer_specific_name) =
            match Network::get_current_or_user_setting_or_default() {
                Network::MainNet => ("", gpu_miner_mainnet_regex),
                Network::StageNet => ("", gpu_miner_nextnet_regex),
                Network::NextNet => ("rc", gpu_miner_nextnet_regex),
                Network::Esmeralda => ("pre", gpu_miner_testnet_regex),
                Network::Igor => ("pre", gpu_miner_testnet_regex),
                Network::LocalNet => ("pre", gpu_miner_testnet_regex),
            };

        binary_manager.insert(
            Binaries::BridgeTapplet,
            Mutex::new(BinaryManager::new(
                Binaries::BridgeTapplet.name().to_string(),
                None,
                Box::new(BridgeTappletAdapter {
                    repo: "wxtm-bridge-frontend".to_string(),
                    owner: "tari-project".to_string(),
                    specific_name: None,
                }),
                None,
                false,
            )),
        );

        binary_manager.insert(
            Binaries::Xmrig,
            Mutex::new(BinaryManager::new(
                Binaries::Xmrig.name().to_string(),
                // Some("xmrig-6.22.0".to_string()),
                None,
                Box::new(XmrigVersionApiAdapter {}),
                None,
                true,
            )),
        );

        binary_manager.insert(
            Binaries::GpuMiner,
            Mutex::new(BinaryManager::new(
                Binaries::GpuMiner.name().to_string(),
                None,
                Box::new(GithubReleasesAdapter {
                    repo: "glytex".to_string(),
                    owner: "tari-project".to_string(),
                    specific_name: gpuminer_specific_name,
                }),
                None,
                true,
            )),
        );

        binary_manager.insert(
            Binaries::MergeMiningProxy,
            Mutex::new(BinaryManager::new(
                Binaries::MergeMiningProxy.name().to_string(),
                None,
                Box::new(GithubReleasesAdapter {
                    repo: "tari".to_string(),
                    owner: "tari-project".to_string(),
                    specific_name: None,
                }),
                Some(tari_prerelease_prefix.to_string()),
                true,
            )),
        );

        binary_manager.insert(
            Binaries::MinotariNode,
            Mutex::new(BinaryManager::new(
                Binaries::MinotariNode.name().to_string(),
                None,
                Box::new(GithubReleasesAdapter {
                    repo: "tari".to_string(),
                    owner: "tari-project".to_string(),
                    specific_name: None,
                }),
                Some(tari_prerelease_prefix.to_string()),
                true,
            )),
        );

        binary_manager.insert(
            Binaries::Wallet,
            Mutex::new(BinaryManager::new(
                Binaries::Wallet.name().to_string(),
                None,
                Box::new(GithubReleasesAdapter {
                    repo: "tari".to_string(),
                    owner: "tari-project".to_string(),
                    specific_name: None,
                }),
                Some(tari_prerelease_prefix.to_string()),
                true,
            )),
        );

        binary_manager.insert(
            Binaries::ShaP2pool,
            Mutex::new(BinaryManager::new(
                Binaries::ShaP2pool.name().to_string(),
                None,
                Box::new(GithubReleasesAdapter {
                    repo: "sha-p2pool".to_string(),
                    owner: "tari-project".to_string(),
                    specific_name: None,
                }),
                None,
                true,
            )),
        );

        binary_manager.insert(
            Binaries::Tor,
            Mutex::new(BinaryManager::new(
                Binaries::Tor.name().to_string(),
                Some("tor".to_string()),
                Box::new(TorReleaseAdapter {}),
                None,
                true,
            )),
        );

        Self {
            managers: binary_manager,
        }
    }

    pub fn current() -> &'static RwLock<BinaryResolver> {
        &INSTANCE
    }

    async fn should_check_for_update() -> bool {
        let now = SystemTime::now();

        let should_check_for_update = now
            .duration_since(*ConfigCore::content().await.last_binaries_update_timestamp())
            .unwrap_or(Duration::from_secs(0))
            .gt(&TIME_BETWEEN_BINARIES_UPDATES);

        if should_check_for_update {
            let _unused = ConfigCore::update_field(
                ConfigCoreContent::set_last_binaries_update_timestamp,
                now,
            )
            .await;
        }

        should_check_for_update
    }

    pub async fn resolve_path_to_binary_files(&self, binary: Binaries) -> Result<PathBuf, Error> {
        let manager = self
            .managers
            .get(&binary)
            .ok_or_else(|| anyhow!("No latest version manager for this binary"))?;

        let version = manager
            .lock()
            .await
            .get_used_version()
            .ok_or_else(|| anyhow!("No version selected for binary {}", binary.name()))?;

        let base_dir = manager.lock().await.get_base_dir().map_err(|error| {
            anyhow!(
                "No base directory for binary {}, Error: {}",
                binary.name(),
                error
            )
        })?;

        if let Some(sub_folder) = manager.lock().await.binary_subfolder() {
            return Ok(base_dir
                .join(sub_folder)
                .join(binary.binary_file_name(version)));
        }
        Ok(base_dir.join(binary.binary_file_name(version)))
    }

    pub async fn initialize_binary(
        &self,
        binary: Binaries,
        progress_channel: Option<ChanneledStepUpdate>,
    ) -> Result<(), Error> {
        let mut manager = self
            .managers
            .get(&binary)
            .ok_or_else(|| anyhow!("Couldn't find manager for binary: {}", binary.name()))?
            .lock()
            .await;

        #[allow(unused_variables)]
        // We will remove this logic in next PR's
        let should_check_for_update = Self::should_check_for_update().await;

        manager.read_local_versions().await;
        manager.check_for_updates().await;

        // Selects the highest version from the Vec of downloaded versions and local versions
        let mut highest_version = manager.select_highest_version();

        // This covers case when we do not check newest version and there is no local version
        if highest_version.is_none() {
            highest_version = manager.select_highest_version();
            manager
                .download_version_with_retries(highest_version.clone(), progress_channel.clone())
                .await?;
        }

        // Check if the files exist after download
        let check_if_files_exist =
            manager.check_if_files_for_version_exist(highest_version.clone());
        if !check_if_files_exist {
            manager
                .download_version_with_retries(highest_version.clone(), progress_channel)
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

    pub async fn get_binary_version(&self, binary: Binaries) -> Option<Version> {
        self.managers
            .get(&binary)
            .unwrap_or_else(|| panic!("Couldn't find manager for binary: {}", binary.name()))
            .lock()
            .await
            .get_used_version()
    }

    pub async fn get_binary_version_string(&self, binary: Binaries) -> String {
        let version = self.get_binary_version(binary).await;
        version
            .map(|v| v.to_string())
            .unwrap_or_else(|| "Not Installed".to_string())
    }
}
