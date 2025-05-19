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
use log::{info, warn};
use serde::{Deserialize, Serialize};
use std::{collections::HashMap, path::PathBuf};
use tauri::AppHandle;

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
    pub async fn extract_tapplet(
        &self,
        progress_tracker: ProgressTracker,
        app_handle: AppHandle,
    ) -> Result<(), Error> {
        info!(target: LOG_TARGET,"Extracting {:?} tapplet", self.tapplet_name);
        let tapplet_source_file = self
            .adapter
            .get_tapplet_source_file(app_handle)
            .map_err(|e| anyhow!("Error getting tapplet source file: {:?}", e))?;
        info!(target: LOG_TARGET,"{:?} tapplet source file path: {:?}", self.tapplet_name, &tapplet_source_file);

        let tapplet_dest_dir = self
            .adapter
            .get_tapplet_dest_dir()
            .map_err(|e| anyhow!("Error getting tapplet dest dir: {:?}", e))?;

        info!(target: LOG_TARGET,"{:?} tapplet dest dir: {:?}", self.tapplet_name, &tapplet_dest_dir);
        self.ensure_empty_directory(tapplet_dest_dir.clone())?;

        progress_tracker
            .send_last_action(format!(
                "Extracting tapplet: {} to dest: {}",
                tapplet_source_file.to_str().unwrap_or_default(),
                tapplet_dest_dir.to_str().unwrap_or_default()
            ))
            .await;

        extract(&tapplet_source_file, &tapplet_dest_dir)
            .await
            .map_err(|e| anyhow!("Error extracting tapplet: {:?}", e))?;

        info!(target: LOG_TARGET,"Extracting {:?} tapplet to {:?} done.", self.tapplet_name, &tapplet_dest_dir);
        Ok(())
    }
}
