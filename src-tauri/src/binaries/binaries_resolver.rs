use crate::LOG_TARGET_APP_LOGIC;
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
use crate::progress_trackers::progress_stepper::IncrementalProgressTracker;
use anyhow::{Error, anyhow};
use async_trait::async_trait;
use log::debug;
use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::LazyLock;
use tokio::sync::Mutex as AsyncMutex;

use super::Binaries;
use super::adapter_bridge::BridgeTappletAdapter;
use super::adapter_github::GithubReleasesAdapter;
use super::adapter_tor::TorReleaseAdapter;
use super::adapter_xmrig::XmrigVersionApiAdapter;
use super::binaries_manager::BinaryManager;

static INSTANCE: LazyLock<BinaryResolver> = LazyLock::new(BinaryResolver::new);

// Lock to prevent concurrent downloads of tari suite binaries (MergeMiningProxy, MinotariNode, Wallet)
// that all come from the same zip file and would conflict when downloading in parallel
static TARI_SUITE_DOWNLOAD_LOCK: LazyLock<AsyncMutex<()>> = LazyLock::new(|| AsyncMutex::new(()));

#[derive(Debug, thiserror::Error)]
pub enum BinaryResolveError {
    /// Binary files missing, likely due to antivirus quarantine
    #[error("Binary missing due to antivirus: {error} at {}", expected_path.display())]
    AntivirusIssue {
        expected_path: PathBuf,
        error: String,
    },
    /// Other error occurred
    #[error(transparent)]
    Other(Error),
}

#[derive(Clone, Debug)]
pub struct BinaryDownloadInfo {
    pub name: String,
    pub main_url: String,
    pub fallback_url: String,
}

#[async_trait]
pub trait LatestVersionApiAdapter: Send + Sync + 'static {
    async fn get_expected_checksum(
        &self,
        checksum_path: PathBuf,
        asset_name: &str,
    ) -> Result<String, Error>;
    async fn download_and_get_checksum_path(
        &self,
        directory: PathBuf,
        download_info: BinaryDownloadInfo,
    ) -> Result<PathBuf, Error>;

    fn get_binary_folder(&self) -> Result<PathBuf, Error>;
    fn get_base_main_download_url(&self, version: &str) -> String;
    fn get_base_fallback_download_url(&self, version: &str) -> String;
}

pub struct BinaryResolver {
    managers: HashMap<Binaries, BinaryManager>,
}

impl BinaryResolver {
    #[allow(clippy::too_many_lines)]
    pub fn new() -> Self {
        let mut binary_manager = HashMap::<Binaries, BinaryManager>::new();

        binary_manager.insert(
            Binaries::BridgeTapplet,
            BinaryManager::new(
                Binaries::BridgeTapplet.name().to_string(),
                None,
                Box::new(BridgeTappletAdapter {
                    repo: "wxtm-bridge-frontend".to_string(),
                    owner: "tari-project".to_string(),
                }),
                false,
            ),
        );

        binary_manager.insert(
            Binaries::Xmrig,
            BinaryManager::new(
                Binaries::Xmrig.name().to_string(),
                None,
                Box::new(XmrigVersionApiAdapter {}),
                true,
            ),
        );

        binary_manager.insert(
            Binaries::LolMiner,
            BinaryManager::new(
                Binaries::LolMiner.name().to_string(),
                None,
                Box::new(GithubReleasesAdapter {
                    repo: "lolMiner-releases".to_string(),
                    owner: "Lolliedieb".to_string(),
                }),
                false,
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
                }),
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
                }),
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
                }),
                true,
            ),
        );

        binary_manager.insert(
            Binaries::Tor,
            BinaryManager::new(
                Binaries::Tor.name().to_string(),
                Some("tor".to_string()),
                Box::new(TorReleaseAdapter {}),
                true,
            ),
        );

        Self {
            managers: binary_manager,
        }
    }

    pub fn current() -> &'static BinaryResolver {
        &INSTANCE
    }

    async fn resolve_path_to_binary_files(
        &self,
        binary: Binaries,
    ) -> Result<PathBuf, BinaryResolveError> {
        let manager = self.managers.get(&binary).ok_or_else(|| {
            BinaryResolveError::Other(anyhow!("No latest version manager for this binary"))
        })?;

        let version = manager.get_selected_version();

        let base_dir: PathBuf = manager.get_base_dir().map_err(|error| {
            BinaryResolveError::Other(anyhow!(
                "No base directory for binary {}, Error: {}",
                binary.name(),
                error
            ))
        })?;

        // For bridge tapplet, we return the base dir as it's a folder, not a binary file
        // Skip the rest of the checks
        if binary.eq(&Binaries::BridgeTapplet) {
            return Ok(base_dir);
        }

        let binary_path = if let Some(sub_folder) = manager.binary_subfolder() {
            base_dir
                .join(sub_folder)
                .join(binary.binary_file_name(version.clone()))
        } else {
            base_dir.join(binary.binary_file_name(version.clone()))
        };

        if binary_path.exists() {
            debug!(target: LOG_TARGET_APP_LOGIC, "Binary found at: {}", binary_path.display());
            return Ok(binary_path);
        }

        Err(BinaryResolveError::AntivirusIssue {
            expected_path: binary_path,
            error: format!(
                "Binary files for {} are missing from expected location. This is typically caused by antivirus software quarantining the files.",
                binary.name()
            ),
        })
    }

    pub async fn get_binary_path(&self, binary: Binaries) -> Result<PathBuf, Error> {
        self.resolve_path_to_binary_files(binary)
            .await
            .map_err(|e| e.into())
    }

    pub async fn initialize_binary(
        &self,
        binary: Binaries,
        progress_channel: Option<IncrementalProgressTracker>,
    ) -> Result<(), Error> {
        let manager = self
            .managers
            .get(&binary)
            .ok_or_else(|| anyhow!("Couldn't find manager for binary: {}", binary.name()))?;

        if manager.check_if_files_for_version_exist() {
            // If files already exist, we can skip the download
            return Ok(());
        }

        // These 3 binaries are downloaded as one zip so processing them in parallel would cause file conflicts
        // To keep it safe, we lock the download for these binaries and then check again if files exist after acquiring the lock
        let needs_tari_suite_lock = matches!(
            binary,
            Binaries::MergeMiningProxy | Binaries::MinotariNode | Binaries::Wallet
        );

        if needs_tari_suite_lock {
            let _lock = TARI_SUITE_DOWNLOAD_LOCK.lock().await;

            if manager.check_if_files_for_version_exist() {
                return Ok(());
            }
            manager
                .download_version_with_retries(progress_channel.clone())
                .await?;
        } else {
            manager
                .download_version_with_retries(progress_channel.clone())
                .await?;
        }

        Ok(())
    }

    pub async fn get_binary_version(&self, binary: Binaries) -> String {
        self.managers
            .get(&binary)
            .unwrap_or_else(|| panic!("Couldn't find manager for binary: {}", binary.name()))
            .get_selected_version()
    }
}
