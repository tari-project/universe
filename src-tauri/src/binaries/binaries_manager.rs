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
use anyhow::{anyhow, Error};
use log::{debug, error, info, warn};
use serde::{Deserialize, Serialize};
use std::{collections::HashMap, path::PathBuf};
use tari_common::configuration::Network;
use tauri_plugin_sentry::sentry;
use tokio::sync::watch::{channel, Sender};

use crate::{
    download_utils::{extract, validate_checksum},
    github::request_client::RequestClient,
    progress_trackers::progress_stepper::ChanneledStepUpdate,
    tasks_tracker::TasksTrackers,
    utils::platform_utils::{CurrentOperatingSystem, PlatformUtils},
};

use super::{
    binaries_list::BinaryPlatformAssets,
    binaries_resolver::{BinaryDownloadInfo, LatestVersionApiAdapter},
    Binaries,
};

pub const LOG_TARGET: &str = "tari::universe::binary_manager";

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
            panic!(
                "No version requirements found for binary: {} in the provided data",
                binary_name
            )
        });

        let (version_requirement, hash) =
            if let Some((version, hash)) = content_string.split_once('|') {
                (version.trim().to_string(), Some(hash.trim().to_string()))
            } else {
                (content_string.trim().to_string(), None)
            };

        debug!(target: LOG_TARGET, "Binary: {} version requirement: {}, hash: {:?}", binary_name, version_requirement, hash);
        (version_requirement, hash)
    }

    fn create_in_progress_folder_for_selected_version(&self) -> Result<PathBuf, Error> {
        debug!(target: LOG_TARGET,"Creating in progress folder for version: {:?}", self.selected_version);

        let binary_folder = self.adapter.get_binary_folder().map_err(|error| {
            error!(target: LOG_TARGET, "Error getting binary folder. Error: {:?}", error);
            anyhow!("Error getting binary folder: {:?}", error)
        })?;

        let in_progress_folder = binary_folder
            .join(self.selected_version.clone())
            .join("in_progress");

        if in_progress_folder.exists() {
            debug!(target: LOG_TARGET,"Removing in progress folder: {:?}", in_progress_folder);
            if let Err(error) = std::fs::remove_dir_all(&in_progress_folder) {
                error!(target: LOG_TARGET, "Error removing in progress folder: {:?}. Error: {:?}", in_progress_folder, error);
            }
        }

        debug!(target: LOG_TARGET,"Creating in progress folder: {:?}", in_progress_folder);
        std::fs::create_dir_all(&in_progress_folder)?;

        Ok(in_progress_folder)
    }

    async fn delete_in_progress_folder_for_selected_version(&self) -> Result<(), Error> {
        debug!(target: LOG_TARGET,"Deleting in progress folder for version: {:?}", self.selected_version);

        let binary_folder = self.adapter.get_binary_folder().map_err(|error| {
            error!(target: LOG_TARGET, "Error getting binary folder. Error: {:?}", error);
            anyhow!("Error getting binary folder: {:?}", error)
        })?;

        let in_progress_folder = binary_folder
            .join(self.selected_version.clone())
            .join("in_progress");

        if in_progress_folder.exists() {
            debug!(target: LOG_TARGET,"Removing in progress folder: {:?}", in_progress_folder);
            if let Err(error) = std::fs::remove_dir_all(&in_progress_folder) {
                error!(target: LOG_TARGET, "Error removing in progress folder: {:?}. Error: {:?}", in_progress_folder, error);
            }
        }

        Ok(())
    }

    fn ensure_empty_directory(&self, dir: PathBuf) -> Result<(), Error> {
        if dir.exists() {
            warn!(target: LOG_TARGET, "Destination dir exists. Removing all files from: {:?}", dir.clone());
            std::fs::remove_dir_all(dir.clone())
                .and_then(|_| std::fs::create_dir_all(dir.clone()))
                .map_err(|e| {
                    anyhow!(
                        "Error handling destination dir: {:?}. Error: {:?}",
                        dir.clone(),
                        e
                    )
                })
        } else {
            std::fs::create_dir_all(dir.clone()).map_err(|e| {
                anyhow!(
                    "Error creating destination dir: {:?}. Error: {:?}",
                    dir.clone(),
                    e
                )
            })
        }
    }

    fn construct_binary_download_info(&self) -> BinaryDownloadInfo {
        let selected_version = self.selected_version.clone();
        let selected_hash = self.selected_hash.clone();
        let binary = Binaries::from_name(&self.binary_name);
        let main_url = self.adapter.get_base_main_download_url(&selected_version);
        let fallback_url = self
            .adapter
            .get_base_fallback_download_url(&selected_version);

        let network = match Network::get_current_or_user_setting_or_default() {
            Network::NextNet => "nextnet",
            Network::Esmeralda => "testnet",
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
            selected_hash,
        );

        BinaryDownloadInfo {
            name: name.clone(),
            main_url: format!("{}/{}", main_url, name.clone()),
            fallback_url: format!("{}/{}", fallback_url, name),
        }
    }

    async fn validate_checksum(
        &self,
        download_info: BinaryDownloadInfo,
        destination_dir: PathBuf,
        in_progress_file_zip: PathBuf,
    ) -> Result<(), Error> {
        let selected_version = self.selected_version.clone();
        info!(target: LOG_TARGET, "Validating checksum for binary: {} with version: {:?}", self.binary_name, selected_version);

        let checksum_file = self
            .adapter
            .download_and_get_checksum_path(
                destination_dir.clone().to_path_buf(),
                download_info.clone(),
            )
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

        match validate_checksum(in_progress_file_zip.clone(), expected_checksum).await {
            Ok(validate_checksum) => {
                if validate_checksum {
                    info!(target: LOG_TARGET, "Checksum validation succeeded for binary: {} with version: {:?}", self.binary_name, selected_version);
                    Ok(())
                } else {
                    std::fs::remove_dir_all(destination_dir.clone()).ok();
                    Err(anyhow!("Checksums mismatched!"))
                }
            }
            Err(e) => {
                std::fs::remove_dir_all(destination_dir.clone()).ok();
                Err(anyhow!(
                    "Checksum validation failed for version: {:?}. Error: {:?}",
                    selected_version,
                    e
                ))
            }
        }
    }

    pub fn check_if_files_for_version_exist(&self) -> bool {
        debug!(target: LOG_TARGET,"Checking if files for selected version exist: {:?}", self.selected_version);

        debug!(target: LOG_TARGET, "Selected version: {:?}", self.selected_version);

        let binary_folder = match self.adapter.get_binary_folder() {
            Ok(path) => path,
            Err(e) => {
                error!(target: LOG_TARGET, "Error getting binary folder. Error: {:?}", e);
                return false;
            }
        };

        let version_folder = binary_folder.join(&self.selected_version);
        let binary_file = version_folder.join(
            Binaries::from_name(&self.binary_name).binary_file_name(self.selected_version.clone()),
        );
        let binary_file_with_exe = binary_file.with_extension("exe");
        let binary_file_with_html = version_folder.join("index.html");

        debug!(target: LOG_TARGET, "Binary folder path: {:?}", binary_folder);
        debug!(target: LOG_TARGET, "Version folder path: {:?}", version_folder);
        debug!(target: LOG_TARGET, "Binary file path: {:?}", binary_file);

        let binary_file_exists =
            binary_file.exists() || binary_file_with_exe.exists() || binary_file_with_html.exists();

        debug!(target: LOG_TARGET, "Binary file exists: {:?}", binary_file_exists);

        binary_file_exists
    }

    pub async fn download_version_with_retries(
        &self,
        progress_channel: Option<ChanneledStepUpdate>,
    ) -> Result<(), Error> {
        let mut last_error_message = String::new();
        for retry in 0..3 {
            match self
                .download_selected_version(progress_channel.clone())
                .await
            {
                Ok(_) => return Ok(()),
                Err(error) => {
                    last_error_message = format!(
                        "Failed to download binary: {}. Error: {:?}",
                        self.binary_name, error
                    );
                    warn!(target: LOG_TARGET, "Failed to download binary: {} at retry: {}", self.binary_name, retry);
                    continue;
                }
            }
        }
        sentry::capture_message(&last_error_message, sentry::Level::Error);
        error!(target: LOG_TARGET, "{}", last_error_message);
        Err(anyhow!(last_error_message))
    }

    async fn resolve_progress_channel(
        &self,
        progress_channel: Option<ChanneledStepUpdate>,
    ) -> Result<Option<Sender<f64>>, Error> {
        if let Some(step_update_channel) = progress_channel {
            let (sender, mut receiver) = channel::<f64>(0.0);
            let task_tacker = match Binaries::from_name(&self.binary_name) {
                Binaries::GpuMiner => &TasksTrackers::current().hardware_phase,
                Binaries::Xmrig => &TasksTrackers::current().hardware_phase,
                Binaries::Wallet => &TasksTrackers::current().wallet_phase,
                Binaries::MinotariNode => &TasksTrackers::current().node_phase,
                Binaries::Tor => &TasksTrackers::current().common,
                Binaries::MergeMiningProxy => &TasksTrackers::current().mining_phase,
                Binaries::ShaP2pool => &TasksTrackers::current().mining_phase,
                Binaries::BridgeTapplet => &TasksTrackers::current().wallet_phase,
            };
            let binary_name = self.binary_name.clone();
            let shutdown_signal = task_tacker.get_signal().await;
            task_tacker.get_task_tracker().await.spawn(async move {
                loop {
                    if shutdown_signal.is_triggered() {
                        info!(target: LOG_TARGET, "Shutdown signal received. Stopping progress channel for binary: {:?}", binary_name);
                        break;
                    }
                    receiver.changed().await.expect("Failed to receive progress update");

                    let last_percentage = *receiver.borrow();

                    let mut params = HashMap::new();
                    params.insert(
                        "progress".to_string(),
                        last_percentage.clone().to_string(),
                    );
                    step_update_channel
                        .send_update(params, (last_percentage / 100.0).round())
                        .await;

                    tokio::time::sleep(std::time::Duration::from_millis(10)).await;

                    if last_percentage.ge(&100.0)  {
                        info!(target: LOG_TARGET, "Progress channel completed for binary: {:?}", binary_name);
                        break;
                    }
                }
            });

            Ok(Some(sender))
        } else {
            Ok(None)
        }
    }

    #[allow(clippy::too_many_lines)]
    async fn download_selected_version(
        &self,
        progress_channel: Option<ChanneledStepUpdate>,
    ) -> Result<(), Error> {
        let version = self.selected_version.clone();

        let download_info = self.construct_binary_download_info();

        let binary_folder = self
            .adapter
            .get_binary_folder()
            .map_err(|e| anyhow!("Error getting binary folder: {:?}", e))?;

        let destination_dir = binary_folder.join(&version);

        // This is a safety check to ensure that the destination directory is empty
        // Its special case for tari repo, where zip will inclue mutliple binaries
        // So when one of them is deleted, and we need to download it again
        // We in fact will download zip with multiple binaries, and when other binaries are present in destination dir
        // extract will fail, so we need to remove all files from destination dir
        self.ensure_empty_directory(destination_dir.clone())?;

        let in_progress_dir = self
            .create_in_progress_folder_for_selected_version()
            .map_err(|e| anyhow!("Error creating in progress folder. Error: {:?}", e))?;
        let in_progress_file_zip = in_progress_dir.join(download_info.name.clone());

        let download_url = download_info.main_url.clone();
        let fallback_url = download_info.fallback_url.clone();

        info!(target: LOG_TARGET, "Downloading binary: {} from url: {}", self.binary_name, &download_url);

        let chunk_progress_sender = self
            .resolve_progress_channel(progress_channel.clone())
            .await
            .map_err(|e| anyhow!("Error resolving progress channel: {:?}", e))?;

        if RequestClient::current()
            .download_file(
                download_url.as_str(),
                &in_progress_file_zip,
                true,
                chunk_progress_sender.clone(),
            )
            .await
            .map_err(|e| anyhow!("Error downloading version: {:?}. Error: {:?}", version, e))
            .is_err()
        {
            info!(target: LOG_TARGET, "Downloading binary: {} from fallback url: {}", self.binary_name, fallback_url);

            let chunk_progress_sender = self
                .resolve_progress_channel(progress_channel.clone())
                .await
                .map_err(|e| anyhow!("Error resolving progress channel: {:?}", e))?;

            RequestClient::current()
                .download_file(
                    fallback_url.as_str(),
                    &in_progress_file_zip,
                    false,
                    chunk_progress_sender,
                )
                .await
                .map_err(|e| anyhow!("Error downloading version: {:?}. Error: {:?}", version, e))?;
        }

        extract(&in_progress_file_zip, &destination_dir)
            .await
            .map_err(|e| anyhow!("Error extracting version: {:?}. Error: {:?}", version, e))?;

        if self.should_validate_checksum {
            self.validate_checksum(download_info, destination_dir, in_progress_file_zip)
                .await?;
        }

        self.delete_in_progress_folder_for_selected_version()
            .await?;
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
}
