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

use crate::{download_utils::extract, progress_tracker_old::ProgressTracker};
use anyhow::{anyhow, Error};
use log::{debug, error, info, warn};
use semver::Version;
use serde::{Deserialize, Serialize};
use std::{collections::HashMap, path::PathBuf};

use super::{tapplets_resolver::TappletApiAdapter, Tapplets};

pub const LOG_TARGET: &str = "tari::universe::tapplet_manager";

#[derive(Deserialize, Serialize, Default)]
pub struct TappletVersionsJsonContent {
    pub tapplets: HashMap<String, String>,
}
pub(crate) struct TappletManager {
    tapplet_name: String,
    tapplet_subfolder: Option<String>,
    should_validate_checksum: bool,
    local_aviailable_versions_list: Vec<Version>,
    used_version: Option<Version>,
    adapter: Box<dyn TappletApiAdapter>,
}

impl TappletManager {
    pub fn new(
        tapplet_name: String,
        tapplet_subfolder: Option<String>,
        adapter: Box<dyn TappletApiAdapter>,
        should_validate_checksum: bool,
    ) -> Self {
        Self {
            tapplet_name: tapplet_name.clone(),
            tapplet_subfolder,
            should_validate_checksum,
            local_aviailable_versions_list: Vec::new(),
            used_version: None,
            adapter,
        }
    }

    pub fn tapplet_subfolder(&self) -> Option<&String> {
        self.tapplet_subfolder.as_ref()
    }

    fn select_highest_local_version(&mut self) -> Option<Version> {
        debug!(target: LOG_TARGET,"Selecting highest local version for tapplet: {:?}", self.tapplet_name);

        if self.local_aviailable_versions_list.is_empty() {
            warn!(target: LOG_TARGET,"No local versions found for tapplet: {:?}", self.tapplet_name);
            return None;
        }

        let selected_local_version = Some(self.local_aviailable_versions_list[0].clone());

        debug!(target: LOG_TARGET,"Selected local version: {:?}", selected_local_version);
        selected_local_version.clone()
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

    pub fn check_if_files_exist(&self) -> bool {
        debug!(target: LOG_TARGET,"Checking if files exist");
        let tapplet_folder = match self.adapter.get_tapplet_folder() {
            Ok(path) => path,
            Err(e) => {
                error!(target: LOG_TARGET, "Error getting tapplet folder. Error: {:?}", e);
                return false;
            }
        };

        let tapplet_file = Tapplets::from_name(&self.tapplet_name).tapplet_file_name();
        // let tapplet_file_with_exe = tapplet_file.with_extension("exe"); TODO extra check?

        debug!(target: LOG_TARGET, "Tapplet folder path: {:?}", tapplet_folder);
        debug!(target: LOG_TARGET, "Tapplet file path: {:?}", tapplet_file);

        let tapplet_file_exists = tapplet_file.exists();

        debug!(target: LOG_TARGET, "Tapplet file exists: {:?}", tapplet_file_exists);

        return tapplet_file_exists;
    }

    pub fn get_base_dir(&self) -> Result<PathBuf, Error> {
        self.adapter
            .get_tapplet_folder()
            .and_then(|path| {
                self.used_version
                    .clone()
                    .map(|version| path.join(version.to_string()))
                    .ok_or_else(|| anyhow!("No version selected"))
            })
            .map_err(|e| anyhow!("Error getting tapplet folder. Error: {:?}", e))
    }

    pub async fn extract_tapplet(&self, progress_tracker: ProgressTracker) -> Result<(), Error> {
        info!(target: LOG_TARGET,"Extracting tapplet");

        let tapplet_folder = self
            .adapter
            .get_tapplet_folder()
            .map_err(|e| anyhow!("Error getting tapplet folder: {:?}", e))?;

        self.ensure_empty_directory(tapplet_folder.clone())?;
        info!(target: LOG_TARGET,"Extracting tapplet to folder: {:?}", &tapplet_folder);
        //TODO !!! set path
        let tapplet_file_zip = PathBuf::from(
            "/home/oski/Projects/tari/forked/universe/public/tapplets/hello-ootle-0.2.2.zip",
        );

        progress_tracker
            .send_last_action(format!(
                "Extracting tapplet: {} to dest: {}",
                tapplet_file_zip.to_str().unwrap_or_default(),
                tapplet_folder.to_str().unwrap_or_default()
            ))
            .await;

        extract(&tapplet_file_zip, &tapplet_folder)
            .await
            .map_err(|e| anyhow!("Error extracting tapplet: {:?}", e))?;

        info!(target: LOG_TARGET,"Extracting tapplet done.");
        Ok(())
    }
}
