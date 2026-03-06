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
use anyhow::{Error, anyhow};
use log::{debug, error, info, warn};
use serde::{Deserialize, Serialize};
use std::{collections::HashMap, path::PathBuf};
use tari_common::configuration::Network;
use tari_shutdown::Shutdown;
use tauri_plugin_sentry::sentry;
use tokio::sync::watch::{Sender, channel};

use crate::{
    LOG_TARGET_APP_LOGIC,
    download_utils::validate_checksum,
    progress_trackers::progress_stepper::IncrementalProgressTracker,
    requests::clients::http_file_client::HttpFileClient,
    tasks_tracker::TasksTrackers,
    utils::platform_utils::{CurrentOperatingSystem, PlatformUtils},
};

use super::{
    Binaries,
    binaries_list::BinaryPlatformAssets,
    binaries_resolver::{BinaryDownloadError, BinaryDownloadInfo, LatestVersionApiAdapter},
};

#[derive(Deserialize, Serialize, Default)]
pub struct BinaryVersionsJsonContent {
    pub binaries: HashMap<String, String>,
}
pub(crate) struct BinaryManager {
    binary_name: String,
    binary_subfolder: Option<String>,
    selected_version: String,
    selected_hash: Option<String>,
    should_validate_checksum: bool,
    adapter: Box<dyn LatestVersionApiAdapter>,
}

impl BinaryManager {
    pub fn new(
        binary_name: String,
        binary_subfolder: Option<String>,
        adapter: Box<dyn LatestVersionApiAdapter>,
        should_validate_checksum: bool,
    ) -> Self {
        let versions_requirements_data = match Network::get_current_or_user_setting_or_default() {
            Network::NextNet => {
                include_str!("../../binaries-versions/binaries_versions_nextnet.json")
            }
            Network::Esmeralda => {
                include_str!("../../binaries-versions/binaries_versions_testnets.json")
            }
            Network::StageNet => {
                include_str!("../../binaries-versions/binaries_versions_mainnet.json")
            }
            Network::MainNet => {
                include_str!("../../binaries-versions/binaries_versions_mainnet.json")
            }
            Network::LocalNet => {
                include_str!("../../binaries-versions/binaries_versions_testnets.json")
            }
            Network::Igor => {
                include_str!("../../binaries-versions/binaries_versions_testnets.json")
            }
        };
        let (selected_version, selected_hash) =
            BinaryManager::read_version_from_file(binary_name.clone(), versions_requirements_data);

        Self {
            binary_name: binary_name.clone(),
            binary_subfolder,
            should_validate_checksum,
            selected_version,
            selected_hash,
            adapter,
        }
    }

    pub fn binary_subfolder(&self) -> Option<&String> {
        self.binary_subfolder.as_ref()
    }

    fn read_version_from_file(binary_name: String, data_str: &str) -> (String, Option<String>) {
        let json_content: BinaryVersionsJsonContent =
            serde_json::from_str(data_str).unwrap_or_default();
        // content string can be either 0.0.5 or 0.0.5 | hash
        let content_string = json_content.binaries.get(&binary_name).unwrap_or_else(|| {
            panic!("No version requirements found for binary: {binary_name} in the provided data")
        });

        let (version_requirement, hash) =
            if let Some((version, hash)) = content_string.split_once('|') {
                (version.trim().to_string(), Some(hash.trim().to_string()))
            } else {
                (content_string.trim().to_string(), None)
            };

        debug!(target: LOG_TARGET_APP_LOGIC, "Binary: {binary_name} version requirement: {version_requirement}, hash: {hash:?}");
        (version_requirement, hash)
    }

    fn construct_binary_download_info(&self) -> BinaryDownloadInfo {
        let selected_version = self.selected_version.clone();
        let selected_hash = self.selected_hash.clone();
        let binary = Binaries::from_name(&self.binary_name);
        let mut main_url = self.adapter.get_base_main_download_url(&selected_version);
        let mut fallback_url = self
            .adapter
            .get_base_fallback_download_url(&selected_version);

        if self.binary_name.eq(Binaries::LolMiner.name()) {
            // urls produces will be like:
            // https://github.com/Lolliedieb/lolMiner-releases/releases/download/v1.97/lolMiner_v1.97_Lin64.tar.gz
            // But real format for that specific binary is:
            // https://github.com/Lolliedieb/lolMiner-releases/releases/download/1.97/lolMiner_v1.97_Lin64.tar.gz
            main_url = main_url.replace("/v", "/");
            fallback_url = fallback_url.replace("/v", "/");
        }

        let network = match Network::get_current_or_user_setting_or_default() {
            Network::NextNet => "nextnet",
            Network::Esmeralda => "esme",
            Network::StageNet => "nextnet",
            Network::MainNet => "mainnet",
            Network::LocalNet => "testnet",
            Network::Igor => "testnet",
        };

        let platform = match PlatformUtils::detect_current_os() {
            CurrentOperatingSystem::Windows => BinaryPlatformAssets::WindowsX64,
            CurrentOperatingSystem::Linux => BinaryPlatformAssets::LinuxX64,
            CurrentOperatingSystem::MacOS => {
                if cfg!(target_arch = "aarch64") {
                    BinaryPlatformAssets::MacOSArm64
                } else {
                    BinaryPlatformAssets::MacOSX64
                }
            }
        };

        let name = binary.get_binary_platform_name(
            platform,
            selected_version,
            network.to_string(),
            selected_hash.unwrap_or("".to_string()),
        );

        BinaryDownloadInfo {
            name: name.clone(),
            main_url: format!("{}/{}", main_url, name.clone()),
            fallback_url: format!("{fallback_url}/{name}"),
        }
    }

    async fn validate_checksum(
        &self,
        download_info: BinaryDownloadInfo,
        destination_dir: PathBuf,
        in_progress_file_zip: PathBuf,
    ) -> Result<(), Error> {
        let selected_version = self.selected_version.clone();
        info!(target: LOG_TARGET_APP_LOGIC, "Validating checksum for binary: {} with version: {:?}", self.binary_name, selected_version);

        let checksum_file = self
            .adapter
            .download_and_get_checksum_path(destination_dir.clone(), download_info.clone())
            .await
            .map_err(|e| {
                std::fs::remove_dir_all(destination_dir.clone()).ok();
                anyhow!(
                    "Error downloading checksum file for version: {:?}. Error: {:?}",
                    selected_version,
                    e
                )
            })?;

        let expected_checksum = self
            .adapter
            .get_expected_checksum(checksum_file.clone(), &download_info.name)
            .await?;

        info!(target: LOG_TARGET_APP_LOGIC, "In-progress file zip path: {in_progress_file_zip:?}");

        // Debug: Check if the file actually exists before attempting validation
        if !in_progress_file_zip.exists() {
            error!(target: LOG_TARGET_APP_LOGIC, "Archive file does not exist at path: {in_progress_file_zip:?}");
            return Err(anyhow!(
                "Archive file not found at path: {:?}",
                in_progress_file_zip
            ));
        }

        match validate_checksum(in_progress_file_zip.clone(), expected_checksum).await {
            Ok(is_valid_checksum) => {
                if is_valid_checksum {
                    info!(target: LOG_TARGET_APP_LOGIC, "Checksum validation succeeded for binary: {} with version: {:?}", self.binary_name, selected_version);
                    Ok(())
                } else {
                    error!(target: LOG_TARGET_APP_LOGIC, "Checksum invalid for binary: {} with version: {:?}", self.binary_name, selected_version);
                    std::fs::remove_dir_all(destination_dir.clone()).ok();
                    Err(anyhow!("Checksums mismatched!"))
                }
            }
            Err(e) => {
                std::fs::remove_dir_all(destination_dir.clone()).ok();
                error!(target: LOG_TARGET_APP_LOGIC, "Checksum validation failed for binary: {} with version: {:?}. Error: {:?}", self.binary_name, selected_version, e);
                Err(anyhow!(
                    "Checksum validation failed for version: {:?}. Error: {:?}",
                    selected_version,
                    e
                ))
            }
        }
    }

    pub fn check_if_files_for_version_exist(&self) -> bool {
        debug!(target: LOG_TARGET_APP_LOGIC,"Checking if files for selected version exist: {:?}", self.selected_version);

        debug!(target: LOG_TARGET_APP_LOGIC, "Selected version: {:?}", self.selected_version);

        let binary_folder = match self.adapter.get_binary_folder() {
            Ok(path) => path,
            Err(e) => {
                error!(target: LOG_TARGET_APP_LOGIC, "Error getting binary folder. Error: {e:?}");
                return false;
            }
        };

        let mut version_folder = binary_folder.join(&self.selected_version);
        if let Some(subfolder) = self.binary_subfolder() {
            version_folder.push(subfolder);
        }
        let binary_file = version_folder.join(
            Binaries::from_name(&self.binary_name).binary_file_name(self.selected_version.clone()),
        );
        let binary_file_with_exe = binary_file.with_extension("exe");
        let binary_file_with_html = version_folder.join("index.html");

        debug!(target: LOG_TARGET_APP_LOGIC, "Binary folder path: {binary_folder:?}");
        debug!(target: LOG_TARGET_APP_LOGIC, "Version folder path: {version_folder:?}");
        debug!(target: LOG_TARGET_APP_LOGIC, "Binary file path: {binary_file:?}");

        let binary_file_exists = check_binary_exists(&binary_file)
            || check_binary_exists(&binary_file_with_exe)
            || check_binary_exists(&binary_file_with_html);

        debug!(target: LOG_TARGET_APP_LOGIC, "Binary file exists: {binary_file_exists:?}");

        binary_file_exists
    }

    async fn resolve_progress_channel(
        &self,
        progress_channel: Option<IncrementalProgressTracker>,
    ) -> Result<(Option<Sender<f64>>, Option<Shutdown>), Error> {
        if let Some(step_update_channel) = progress_channel {
            let (sender, mut receiver) = channel::<f64>(0.0);
            let task_tacker = match Binaries::from_name(&self.binary_name) {
                Binaries::Xmrig => &TasksTrackers::current().cpu_mining_phase,
                Binaries::Wallet => &TasksTrackers::current().wallet_phase,
                Binaries::MinotariNode => &TasksTrackers::current().node_phase,
                Binaries::Tor => &TasksTrackers::current().node_phase,
                Binaries::MergeMiningProxy => &TasksTrackers::current().cpu_mining_phase,
                Binaries::BridgeTapplet => &TasksTrackers::current().wallet_phase,
                Binaries::LolMiner => &TasksTrackers::current().gpu_mining_phase,
            };
            let binary_name = self.binary_name.clone();
            let shutdown_signal = task_tacker.get_signal().await;
            let inner_shutdown = Shutdown::new();
            let inner_shutdown_signal = inner_shutdown.to_signal();
            task_tacker.get_task_tracker().await.spawn(async move {
                loop {
                    if shutdown_signal.is_triggered() || inner_shutdown_signal.is_triggered() {
                        info!(target: LOG_TARGET_APP_LOGIC, "Shutdown signal received. Stopping progress channel for binary: {binary_name:?}");
                        break;
                    }
                    let _unused = receiver.changed().await;

                    let last_percentage = *receiver.borrow();

                    let mut params = HashMap::new();
                    params.insert(
                        "progress".to_string(),
                        last_percentage.clone().to_string(),
                    );
                    step_update_channel
                        .send_update(params, last_percentage / 100.0)
                        .await;

                    tokio::time::sleep(std::time::Duration::from_millis(500)).await;

                    if last_percentage.ge(&100.0)  {
                        info!(target: LOG_TARGET_APP_LOGIC, "Progress channel completed for binary: {binary_name:?}");
                        break;
                    }
                }
            });

            Ok((Some(sender), Some(inner_shutdown)))
        } else {
            Ok((None, None))
        }
    }

    pub async fn download_version_with_retries(
        &self,
        progress_channel: Option<IncrementalProgressTracker>,
    ) -> Result<(), Error> {
        #[cfg(target_os = "windows")]
        {
            // Add Windows Defender exclusions before download to prevent interference
            if let Err(e) = self.add_windows_defender_exclusions().await {
                warn!(target: LOG_TARGET_APP_LOGIC, "Failed to add Windows Defender exclusions for {}: {}", self.binary_name, e);
            }
        }

        let mut last_error: Option<anyhow::Error> = None;
        for retry in 0..3 {
            match self
                .download_selected_version(progress_channel.clone())
                .await
            {
                Ok(_) => {
                    info!(target: LOG_TARGET_APP_LOGIC, "Successfully downloaded binary: {} on retry: {}", self.binary_name, retry);
                    return Ok(());
                }
                Err(error) => {
                    warn!(target: LOG_TARGET_APP_LOGIC, "Failed to download binary: {} at retry: {}", self.binary_name, retry);
                    last_error = Some(error);
                    continue;
                }
            }
        }
        let last_error = last_error.unwrap_or_else(|| anyhow!("Unknown download error"));
        let last_error_message = format!(
            "Failed to download binary: {}. Error: {:?}",
            self.binary_name, last_error
        );

        let is_user_env = last_error
            .chain()
            .any(|c| c.downcast_ref::<BinaryDownloadError>().is_some());

        if is_user_env {
            info!(target: LOG_TARGET_APP_LOGIC, "Binary download failed due to user environment issue: {last_error_message}");
        } else {
            sentry::capture_message(&last_error_message, sentry::Level::Error);
            error!(target: LOG_TARGET_APP_LOGIC, "{last_error_message}");
        }
        Err(last_error.context(format!("Failed to download binary: {}", self.binary_name)))
    }

    pub async fn download_selected_version(
        &self,
        progress_channel: Option<IncrementalProgressTracker>,
    ) -> Result<(), Error> {
        let version = self.selected_version.clone();

        let download_info = self.construct_binary_download_info();

        let binary_folder = self
            .adapter
            .get_binary_folder()
            .map_err(|e| anyhow!("Error getting binary folder: {:?}", e))?;

        let destination_dir = binary_folder.join(&version);

        let download_url = download_info.main_url.clone();
        let fallback_url = download_info.fallback_url.clone();

        info!(target: LOG_TARGET_APP_LOGIC, "Downloading binary: {} from url: {}", self.binary_name, &download_url);
        let archive_destination_path: PathBuf;

        let (chunk_progress_sender, main_progress_sender_shutdown) = self
            .resolve_progress_channel(progress_channel.clone())
            .await
            .map_err(|e| anyhow!("Error resolving progress channel: {:?}", e))?;

        let main_file_download_result = HttpFileClient::builder()
            .with_cloudflare_cache_check()
            .with_file_extract()
            .with_progress_status_sender(chunk_progress_sender.clone())
            .with_download_resume()
            .build(download_url.clone(), destination_dir.clone())?
            .execute()
            .await;

        if main_file_download_result.is_err() {
            info!(target: LOG_TARGET_APP_LOGIC, "Downloading binary: {} from fallback url: {}", self.binary_name, fallback_url);
            if let Some(mut progress_sender_shutdown) = main_progress_sender_shutdown {
                progress_sender_shutdown.trigger();
            }

            let (chunk_progress_sender, fallback_progress_sender_shutdown) = self
                .resolve_progress_channel(progress_channel.clone())
                .await
                .map_err(|e| anyhow!("Error resolving progress channel: {:?}", e))?;

            archive_destination_path = HttpFileClient::builder()
                .with_file_extract()
                .with_progress_status_sender(chunk_progress_sender.clone())
                .with_download_resume()
                .build(fallback_url.clone(), destination_dir.clone())?
                .execute()
                .await
                .inspect_err(|_| {
                    if let Some(mut progress_sender_shutdown) = fallback_progress_sender_shutdown {
                        progress_sender_shutdown.trigger();
                    }
                })?;
        } else {
            archive_destination_path = main_file_download_result?;
        }

        if self.should_validate_checksum {
            self.validate_checksum(
                download_info,
                destination_dir.clone(),
                archive_destination_path,
            )
            .await?;
        }

        Ok(())
    }

    pub fn get_selected_version(&self) -> String {
        self.selected_version.clone()
    }

    pub fn get_base_dir(&self) -> Result<PathBuf, Error> {
        let selected_version = self.selected_version.clone();
        let binary_folder_path = self.adapter.get_binary_folder()?;
        Ok(binary_folder_path.join(selected_version))
    }

    /// Add Windows Defender exclusions for the downloaded binary
    #[cfg(target_os = "windows")]
    async fn add_windows_defender_exclusions(&self) -> Result<(), Error> {
        use crate::binaries::windows_defender::WindowsDefenderExclusions;

        // Only proceed on Windows
        if !matches!(
            PlatformUtils::detect_current_os(),
            CurrentOperatingSystem::Windows
        ) {
            return Ok(());
        }

        let binary_from_name = Binaries::from_name(&self.binary_name);
        let base_dir = self.get_base_dir()?;
        let binary_path = if let Some(sub_folder) = self.binary_subfolder() {
            base_dir
                .join(sub_folder)
                .join(binary_from_name.binary_file_name(self.selected_version.clone()))
        } else {
            base_dir.join(binary_from_name.binary_file_name(self.selected_version.clone()))
        };

        // Add comprehensive exclusions (both file and directory)
        WindowsDefenderExclusions::add_comprehensive_exclusions(&binary_path)?;

        info!(target: LOG_TARGET_APP_LOGIC, "Added Windows Defender exclusions for binary: {} at path: {}", self.binary_name, binary_path.display());
        Ok(())
    }
}

fn check_binary_exists(path: &std::path::Path) -> bool {
    path.try_exists().unwrap_or_else(|e| {
        warn!(target: LOG_TARGET_APP_LOGIC, "Error checking if binary file exists at path: {:?}. Error: {:?}", path, e);
        false
    })
}
