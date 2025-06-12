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
use crate::binaries::binaries_resolver::{VersionAsset, VersionDownloadInfo};
use crate::configs::config_core::{ConfigCore, ConfigCoreContent};
use crate::configs::trait_config::ConfigImpl;
use crate::ProgressTracker;
use anyhow::{anyhow, Error};
use async_trait::async_trait;
use log::error;
use regex::Regex;
use semver::Version;
use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::LazyLock;
use std::time::{Duration, SystemTime};
use tari_common::configuration::Network;
use tauri_plugin_sentry::sentry;
use tokio::sync::watch::Receiver;
use tokio::sync::{Mutex, RwLock};
use tokio::time::timeout;

use super::bridge_adapter::BridgeTappletAdapter;
use super::tapplets_manager::TappletManager;
use super::Tapplets;

const TIME_BETWEEN_TAPPLETS_UPDATES: Duration = Duration::from_secs(60 * 60 * 6); // 6 hours

static INSTANCE: LazyLock<RwLock<TappletResolver>> =
    LazyLock::new(|| RwLock::new(TappletResolver::new()));

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

    fn get_tapplet_folder(&self) -> Result<PathBuf, Error>;

    fn find_version_for_platform(
        &self,
        version: &VersionDownloadInfo,
    ) -> Result<VersionAsset, Error>;
}

pub struct TappletResolver {
    managers: HashMap<Tapplets, Mutex<TappletManager>>,
}

impl TappletResolver {
    #[allow(clippy::too_many_lines)]
    pub fn new() -> Self {
        let mut tapplet_manager = HashMap::<Tapplets, Mutex<TappletManager>>::new();

        let mut bridge_nextnet_regex = Regex::new(r"tapplet.*nextnet").ok();
        let mut bridge_testnet_regex = Regex::new(r"tapplet.*testnet").ok();
        let mut bridge_mainnet_regex = Regex::new(r"tapplet.*mainnet").ok();

        if cfg!(target_os = "macos") && cfg!(target_arch = "aarch64") {
            bridge_nextnet_regex = Regex::new(r"combined.*nextnet").ok();
            bridge_testnet_regex = Regex::new(r"combined.*testnet").ok();
            bridge_mainnet_regex = Regex::new(r"combined.*mainnet").ok();
        }

        let (_tari_prerelease_prefix, _bridge_specific_name) =
            match Network::get_current_or_user_setting_or_default() {
                Network::MainNet => ("", bridge_mainnet_regex),
                Network::StageNet => ("", bridge_nextnet_regex),
                Network::NextNet => ("rc", bridge_nextnet_regex),
                Network::Esmeralda => ("pre", bridge_testnet_regex),
                Network::Igor => ("pre", bridge_testnet_regex),
                Network::LocalNet => ("pre", bridge_testnet_regex),
            };

        tapplet_manager.insert(
            Tapplets::Bridge,
            Mutex::new(TappletManager::new(
                Tapplets::Bridge.name().to_string(),
                None,
                Box::new(BridgeTappletAdapter {
                    repo: "wxtm-bridge-frontend".to_string(),
                    owner: "tari-project".to_string(),
                    specific_name: None,
                }),
                None,
                true,
            )),
        );

        Self {
            managers: tapplet_manager,
        }
    }

    pub fn current() -> &'static RwLock<TappletResolver> {
        &INSTANCE
    }

    async fn should_check_for_update() -> bool {
        let now = SystemTime::now();

        let should_check_for_update = now
            .duration_since(*ConfigCore::content().await.last_binaries_update_timestamp())
            .unwrap_or(Duration::from_secs(0))
            .gt(&TIME_BETWEEN_TAPPLETS_UPDATES);

        if should_check_for_update {
            let _unused = ConfigCore::update_field(
                ConfigCoreContent::set_last_binaries_update_timestamp,
                now,
            )
            .await;
        }

        should_check_for_update
    }

    pub async fn resolve_path_to_tapplet_files(&self, tapplet: Tapplets) -> Result<PathBuf, Error> {
        let manager = self.managers.get(&tapplet).ok_or_else(|| {
            anyhow!(
                "No latest version manager for the {} tapplet",
                tapplet.name()
            )
        })?;

        let version = manager
            .lock()
            .await
            .get_used_version()
            .ok_or_else(|| anyhow!("No version found for the {} tapplet", tapplet.name()))?;

        let base_dir = manager.lock().await.get_base_dir().map_err(|error| {
            anyhow!(
                "No base directory for tapplet {}, Error: {}",
                tapplet.name(),
                error
            )
        })?;

        if let Some(sub_folder) = manager.lock().await.tapplet_subfolder() {
            return Ok(base_dir
                .join(sub_folder)
                .join(tapplet.tapplet_file_name(version)));
        }
        Ok(base_dir)
    }

    pub async fn initialize_tapplet_timeout(
        &self,
        tapplet: Tapplets,
        progress_tracker: ProgressTracker,
        timeout_channel: Receiver<String>,
    ) -> Result<(), Error> {
        match timeout(
            Duration::from_secs(60 * 5),
            self.initialize_tapplet(tapplet, progress_tracker.clone()),
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

    pub async fn initialize_tapplet(
        &self,
        tapplet: Tapplets,
        progress_tracker: ProgressTracker,
    ) -> Result<(), Error> {
        let mut manager = self
            .managers
            .get(&tapplet)
            .ok_or_else(|| anyhow!("Couldn't find manager for tapplet: {}", tapplet.name()))?
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
                .download_version_with_retries(highest_version.clone(), progress_tracker.clone())
                .await?;
        }

        // Check if the files exist after download
        let check_if_files_exist =
            manager.check_if_files_for_version_exist(highest_version.clone());
        if !check_if_files_exist {
            manager
                .download_version_with_retries(highest_version.clone(), progress_tracker.clone())
                .await?;
        }

        // Throw error if files still do not exist
        let check_if_files_exist =
            manager.check_if_files_for_version_exist(highest_version.clone());
        if !check_if_files_exist {
            return Err(anyhow!(
                "Failed to download tapplets while initializing: files for version {:?} does not exist",
                highest_version.clone()
            ));
        }

        match highest_version {
            Some(version) => manager.set_used_version(version),
            None => {
                return Err(anyhow!(
                    "Initialize {} tapplet version: no version selected",
                    tapplet.name()
                ))
            }
        }

        Ok(())
    }

    pub async fn update_tapplet(
        &self,
        tapplet: Tapplets,
        progress_tracker: ProgressTracker,
    ) -> Result<(), Error> {
        let mut manager = self
            .managers
            .get(&tapplet)
            .ok_or_else(|| anyhow!("Couldn't find manager for tapplet: {}", tapplet.name()))?
            .lock()
            .await;

        manager.check_for_updates().await;
        let highest_version = manager.select_highest_version();

        progress_tracker
            .send_last_action(format!(
                "Checking if files exist before download: {} {}",
                tapplet.name(),
                highest_version.clone().unwrap_or(Version::new(0, 0, 0))
            ))
            .await;

        let check_if_files_exist =
            manager.check_if_files_for_version_exist(highest_version.clone());
        if !check_if_files_exist {
            manager
                .download_version_with_retries(highest_version.clone(), progress_tracker.clone())
                .await?;
        }

        progress_tracker
            .send_last_action(format!(
                "Checking if files exist after download: {} {}",
                tapplet.name(),
                highest_version.clone().unwrap_or(Version::new(0, 0, 0))
            ))
            .await;
        let check_if_files_exist =
            manager.check_if_files_for_version_exist(highest_version.clone());
        if !check_if_files_exist {
            return Err(anyhow!(
                "Failed to download tapplet while updating: files for version {:?} does not exist",
                highest_version.clone()
            ));
        }

        match highest_version {
            Some(version) => manager.set_used_version(version),
            None => {
                return Err(anyhow!(
                    "Update {} tapplet version: no version selected",
                    tapplet.name()
                ))
            }
        }

        Ok(())
    }

    pub async fn get_tapplet_version(&self, tapplet: Tapplets) -> Option<Version> {
        self.managers
            .get(&tapplet)
            .unwrap_or_else(|| panic!("Couldn't find manager for tapplet: {}", tapplet.name()))
            .lock()
            .await
            .get_used_version()
    }

    pub async fn get_tapplet_version_string(&self, tapplet: Tapplets) -> String {
        let version = self.get_tapplet_version(tapplet).await;
        version
            .map(|v| v.to_string())
            .unwrap_or_else(|| "Not Installed".to_string())
    }
}
