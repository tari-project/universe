// Copyright 2024. The Tari Project
//
// Redistribution and use in source and tapplet forms, with or without modification, are permitted provided that the
// following conditions are met:
//
// 1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following
// disclaimer.
//
// 2. Redistributions in tapplet form must reproduce the above copyright notice, this list of conditions and the
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

use crate::{
    download_utils::extract,
    github::request_client::RequestClient,
    progress_tracker_old::ProgressTracker,
    tapplets::tapp_consts::{TAPP_REGISTRY_FALLBACK_URL, TAPP_REGISTRY_URL},
};
use anyhow::{anyhow, Error};
use log::{debug, error, info, warn};
use semver::Version;
use serde::{Deserialize, Serialize};
use std::{collections::HashMap, path::PathBuf};
use tauri_plugin_sentry::sentry;

use super::tapplets_resolver::TappletApiAdapter;

pub const LOG_TARGET: &str = "tari::universe::tapplet_manager";

#[derive(Deserialize, Serialize, Default)]
pub struct TappletVersionsJsonContent {
    pub tapplets: HashMap<String, String>,
}
pub(crate) struct TappletManager {
    tapplet_name: String,
    adapter: Box<dyn TappletApiAdapter>,
}

impl TappletManager {
    pub fn new(tapplet_name: String, adapter: Box<dyn TappletApiAdapter>) -> Self {
        Self {
            tapplet_name: tapplet_name.clone(),

            adapter,
        }
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

    pub fn get_dest_dir(&self) -> Result<PathBuf, Error> {
        self.adapter
            .get_tapplet_dest_dir()
            .map_err(|e| anyhow!("Error getting tapplet folder. Error: {:?}", e))
    }

    pub async fn download_version_with_retries(
        &self,
        selected_version: Option<Version>,
        progress_tracker: ProgressTracker,
    ) -> Result<(), Error> {
        let mut last_error_message = String::new();
        for retry in 0..3 {
            match self
                .download_selected_version(selected_version.clone(), progress_tracker.clone())
                .await
            {
                Ok(_) => return Ok(()),
                Err(error) => {
                    last_error_message = format!(
                        "Failed to download tapplet: {}. Error: {:?}",
                        self.tapplet_name, error
                    );
                    warn!(target: LOG_TARGET, "Failed to download tapplet: {} at retry: {}", self.tapplet_name, retry);
                    continue;
                }
            }
        }
        sentry::capture_message(&last_error_message, sentry::Level::Error);
        error!(target: LOG_TARGET, "{}", last_error_message);
        Err(anyhow!(last_error_message))
    }

    #[allow(clippy::too_many_lines)]
    async fn download_selected_version(
        &self,
        selected_version: Option<Version>,
        progress_tracker: ProgressTracker,
    ) -> Result<(), Error> {
        debug!(target: LOG_TARGET,"Downloading version: {:?}", selected_version);

        let version = match selected_version {
            Some(version) => version,
            None => {
                warn!(target: LOG_TARGET, "No version selected for tapplet: {:?}", self.tapplet_name);
                return Err(anyhow!(format!(
                    "No version selected for tapplet: {:?}",
                    self.tapplet_name
                )));
            }
        };

        let tapplet_dir = self
            .adapter
            .get_tapplet_dest_dir()
            .map_err(|e| anyhow!("Error getting tapplet folder: {:?}", e))?;

        // This is a safety check to ensure that the destination directory is empty
        let destination_dir = tapplet_dir.join(version.to_string());

        self.ensure_empty_directory(destination_dir.clone())?;

        let in_progress_dir = self
            .create_in_progress_folder_for_selected_version(version.clone())
            .map_err(|e| anyhow!("Error creating in progress folder. Error: {:?}", e))?;
        let tapp_archieve = format!("{}.{}", self.tapplet_name, "tgz");
        let in_progress_file_zip = in_progress_dir.join(tapp_archieve);

        let download_url = TAPP_REGISTRY_URL; //TODO temporary hardcoded
        let fallback_url = TAPP_REGISTRY_FALLBACK_URL;

        info!(target: LOG_TARGET, "Downloading tapplet: {} from url: {}", self.tapplet_name, download_url);
        progress_tracker
            .send_last_action(format!(
                "Downloading tapplet: {} with version: {}",
                self.tapplet_name, version
            ))
            .await;

        if RequestClient::current()
            .download_file(download_url, &in_progress_file_zip, false)
            .await
            .map_err(|e| anyhow!("Error downloading version: {:?}. Error: {:?}", version, e))
            .is_err()
        {
            if let Some(fallback_url) = fallback_url {
                info!(target: LOG_TARGET, "Downloading tapplet: {} from fallback url: {}", self.tapplet_name, fallback_url);
                progress_tracker
                    .send_last_action(format!(
                        "Downloading tapplet: {} with version: {} from fallback url",
                        self.tapplet_name, version
                    ))
                    .await;

                RequestClient::current()
                    .download_file(fallback_url.as_str(), &in_progress_file_zip, false)
                    .await
                    .map_err(|e| {
                        anyhow!("Error downloading version: {:?}. Error: {:?}", version, e)
                    })?;
            } else {
                return Err(anyhow!(
                    "Error downloading version: {:?}. No fallback url provided",
                    version
                ));
            }
        }
        warn!(
            "Extracting file: {} to dest: {}",
            in_progress_file_zip.to_str().unwrap_or_default(),
            destination_dir.to_str().unwrap_or_default()
        );
        progress_tracker
            .send_last_action(format!(
                "Extracting file: {} to dest: {}",
                in_progress_file_zip.to_str().unwrap_or_default(),
                destination_dir.to_str().unwrap_or_default()
            ))
            .await;
        extract(&in_progress_file_zip, &destination_dir)
            .await
            .map_err(|e| anyhow!("Error extracting version: {:?}. Error: {:?}", version, e))?;

        //TODO validate checksum
        // if self.should_validate_checksum {
        //     self.validate_checksum(
        //         &version,
        //         asset,
        //         destination_dir,
        //         in_progress_file_zip,
        //         progress_tracker.clone(),
        //     )
        //     .await?;
        // }

        self.delete_in_progress_folder_for_selected_version(
            version.clone(),
            progress_tracker.clone(),
        )
        .await?;
        Ok(())
    }

    fn create_in_progress_folder_for_selected_version(
        &self,
        selected_version: Version,
    ) -> Result<PathBuf, Error> {
        debug!(target: LOG_TARGET,"Creating in progress folder for version: {:?}", selected_version);

        let tapplet_folder = self.adapter.get_tapplet_dest_dir().map_err(|error| {
            error!(target: LOG_TARGET, "Error getting tapplet folder. Error: {:?}", error);
            anyhow!("Error getting tapplet folder: {:?}", error)
        })?;

        let in_progress_folder = tapplet_folder
            .join(selected_version.to_string())
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

    async fn delete_in_progress_folder_for_selected_version(
        &self,
        selected_version: Version,
        progress_tracker: ProgressTracker,
    ) -> Result<(), Error> {
        debug!(target: LOG_TARGET,"Deleting in progress folder for version: {:?}", selected_version);

        let tapplet_folder = self.adapter.get_tapplet_dest_dir().map_err(|error| {
            error!(target: LOG_TARGET, "Error getting tapplet folder. Error: {:?}", error);
            anyhow!("Error getting tapplet folder: {:?}", error)
        })?;

        let in_progress_folder = tapplet_folder
            .join(selected_version.to_string())
            .join("in_progress");

        progress_tracker
            .send_last_action(format!(
                "Removing in progress folder: {:?}",
                in_progress_folder
            ))
            .await;
        if in_progress_folder.exists() {
            debug!(target: LOG_TARGET,"Removing in progress folder: {:?}", in_progress_folder);
            if let Err(error) = std::fs::remove_dir_all(&in_progress_folder) {
                error!(target: LOG_TARGET, "Error removing in progress folder: {:?}. Error: {:?}", in_progress_folder, error);
            }
        }

        Ok(())
    }

    pub fn select_highest_local_version(&mut self) -> Option<Version> {
        debug!(target: LOG_TARGET,"Selecting highest local version for tapplet: {:?}", self.tapplet_name);

        // TODO implement the same solution as for binaries
        let selected_local_version = Some(Version::new(0, 1, 2));

        debug!(target: LOG_TARGET,"Selected local version: {:?}", selected_local_version);
        selected_local_version.clone()
    }
}
