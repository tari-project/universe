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

use crate::binaries::binaries_resolver::{VersionAsset, VersionDownloadInfo};
use crate::ProgressTracker;
use anyhow::{anyhow, Error};
use async_trait::async_trait;
use log::error;
use regex::Regex;
use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::LazyLock;
use std::time::Duration;
use tari_common::configuration::Network;
use tauri_plugin_sentry::sentry;
use tokio::sync::watch::Receiver;
use tokio::sync::{Mutex, RwLock};
use tokio::time::timeout;

use super::bridge_adapter::BridgeTappletAdapter;
use super::tapp_consts::TAPPLET_SOURCE_DIR;
use super::tapplets_manager::TappletManager;
use super::Tapplets;

static INSTANCE: LazyLock<RwLock<TappletResolver>> =
    LazyLock::new(|| RwLock::new(TappletResolver::new()));

#[async_trait]
pub trait TappletApiAdapter: Send + Sync + 'static {
    fn get_tapplet_dest_dir(&self) -> Result<PathBuf, Error>;
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

        let (tari_prerelease_prefix, bridge_specific_name) =
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
                Some(tari_prerelease_prefix.to_string()),
                Box::new(BridgeTappletAdapter {
                    repo: "wxtm-bridge-frontend".to_string(),
                    owner: "tari-project".to_string(),
                    specific_name: bridge_specific_name,
                }),
            )),
        );

        Self {
            managers: tapplet_manager,
        }
    }

    pub fn current() -> &'static RwLock<TappletResolver> {
        &INSTANCE
    }

    pub async fn resolve_path_to_tapplet_dest_dir(
        &self,
        tapplet: Tapplets,
    ) -> Result<PathBuf, Error> {
        let manager = self
            .managers
            .get(&tapplet)
            .ok_or_else(|| anyhow!("No latest version manager for this tapplet"))?;

        let dest_dir = manager.lock().await.get_dest_dir().map_err(|error| {
            anyhow!(
                "No dest directory for tapplet {}, Error: {}",
                tapplet.name(),
                error
            )
        })?;

        let ver = manager
            .lock()
            .await
            .select_highest_local_version()
            .ok_or_else(|| anyhow!("No version found for tapplet {}", tapplet.name()))?;

        // should return /.cache/com.tari.universe.alpha/tapplets/bridge/<network>/<ver>/package/out
        let tapp_path = dest_dir.join(ver.to_string());
        // TODO download zip
        // .join("package");
        // .join(TAPPLET_SOURCE_DIR);

        Ok(tapp_path)
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
        let ver = manager.select_highest_local_version();
        manager
            .download_version_with_retries(ver, progress_tracker.clone())
            .await?;

        Ok(())
    }
}
