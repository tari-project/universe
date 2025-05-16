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

use std::{env, path::PathBuf};

use anyhow::Error;
use async_trait::async_trait;
use log::error;
use tari_common::configuration::Network;

use crate::APPLICATION_FOLDER_ID;

use super::tapplets_resolver::TappletApiAdapter;

const LOG_TARGET: &str = "tari::universe::tapplet_bridge";

pub struct BridgeTappletAdapter {}

#[async_trait]
impl TappletApiAdapter for BridgeTappletAdapter {
    fn get_tapplet_source_file(&self) -> Result<PathBuf, Error> {
        // cwd path is '/src-tauri'
        let cwd = env::current_dir().expect("Failed to get current directory");

        let tapplet_source_file = cwd
            .join("tapplets")
            .join("bridge")
            .join("bridge-v0.1.0.zip");
        Ok(tapplet_source_file)
    }
    fn get_tapplet_dest_dir(&self) -> Result<PathBuf, Error> {
        let cache_path =
            dirs::cache_dir().ok_or_else(|| anyhow::anyhow!("Failed to get cache directory"))?;

        let tapplet_folder_path = cache_path
            .join(APPLICATION_FOLDER_ID)
            .join("tapplets")
            .join("bridge")
            .join(
                Network::get_current_or_user_setting_or_default()
                    .to_string()
                    .to_lowercase(),
            );

        if !tapplet_folder_path.exists() {
            std::fs::create_dir_all(&tapplet_folder_path).unwrap_or_else(|e| {
                error!(target: LOG_TARGET, "Failed to create directory: {}", e);
            });
        };

        Ok(tapplet_folder_path)
    }
}
