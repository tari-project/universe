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

use std::sync::Arc;
use tokio::time;

use anyhow::anyhow;
use log::{error, info, warn};

use serde::{Deserialize, Serialize};
use tauri::{Emitter, Url};
use tauri_plugin_updater::{Update, UpdaterExt};
use tokio::sync::RwLock;

use crate::{app_config::AppConfig, utils::system_status::SystemStatus};
use tari_shutdown::ShutdownSignal;
use tokio::time::Duration;
const LOG_TARGET: &str = "tari::universe::updates_manager";
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct DownloadProgressPayload {
    pub event_type: String,
    pub downloaded: u64,
    pub total: u64,
}

impl DownloadProgressPayload {
    pub fn new(downloaded: u64, total: u64) -> Self {
        Self {
            event_type: "download_progress".to_string(),
            downloaded,
            total,
        }
    }
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct CouldNotUpdatePayload {
    pub event_type: String,
    pub version: String,
}

impl CouldNotUpdatePayload {
    pub fn new(version: String) -> Self {
        Self {
            event_type: "could_not_update".to_string(),
            version,
        }
    }
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct AskForUpdatePayload {
    pub event_type: String,
    pub version: String,
}

#[derive(Clone)]
pub struct UpdatesManager {
    config: Arc<RwLock<AppConfig>>,
    update: Arc<RwLock<Option<Update>>>,
    app_shutdown: ShutdownSignal,
}

impl UpdatesManager {
    pub fn new(config: Arc<RwLock<AppConfig>>, app_shutdown: ShutdownSignal) -> Self {
        Self {
            config,
            update: Arc::new(RwLock::new(None)),
            app_shutdown,
        }
    }

    pub async fn init_periodic_updates(&self, app: tauri::AppHandle) -> Result<(), anyhow::Error> {
        let app_clone = app.clone();
        let self_clone = self.clone();
        tauri::async_runtime::spawn(async move {
            let mut interval = time::interval(Duration::from_secs(3600));
            loop {
                if self_clone.app_shutdown.is_triggered() && self_clone.app_shutdown.is_triggered()
                {
                    break;
                };
                interval.tick().await;
                if let Err(e) = self_clone.try_update(app_clone.clone(), false, false).await {
                    error!(target: LOG_TARGET, "Error checking for updates: {:?}", e);
                }
            }
        });

        Ok(())
    }

    pub async fn try_update(
        &self,
        app: tauri::AppHandle,
        force: bool,
        enable_downgrade: bool,
    ) -> Result<(), anyhow::Error> {
        match self.check_for_update(app.clone(), enable_downgrade).await? {
            Some(update) => {
                let version = update.version.clone();
                info!(target: LOG_TARGET, "try_update: Update available: {:?}", version);
                *self.update.write().await = Some(update);
                let is_auto_update = self.config.read().await.auto_update();

                let is_screen_locked = SystemStatus::current().is_in_sleep_mode().await;

                if is_screen_locked && is_auto_update {
                    info!(target: LOG_TARGET, "try_update: Screen is locked. Displaying notification");
                    let payload = CouldNotUpdatePayload {
                        event_type: "could_not_update".to_string(),
                        version,
                    };
                    drop(app.emit("updates_event", payload).inspect_err(|e| {
                        warn!(target: LOG_TARGET, "Failed to emit 'updates-event' with CouldNotUpdatePayload: {}", e);
                    }));
                } else if force {
                    info!(target: LOG_TARGET, "try_update: Proceeding with force update");
                    self.proceed_with_update(app.clone()).await?;
                } else if is_auto_update {
                    info!(target: LOG_TARGET, "try_update: Auto update is enabled. Proceeding with update");
                    self.proceed_with_update(app.clone()).await?;
                } else {
                    info!(target: LOG_TARGET, "try_update: Auto update is disabled. Prompting user to update");
                    let payload = AskForUpdatePayload {
                        event_type: "ask_for_update".to_string(),
                        version,
                    };
                    drop(app.emit("updates_event", payload).inspect_err(|e| {
                        warn!(target: LOG_TARGET, "Failed to emit 'updates-event' with UpdateAvailablePayload: {}", e);
                    }));
                    // proceed_with_update will be trigger by the user
                }
            }
            None => {
                info!(target: LOG_TARGET, "No updates available");
            }
        }

        Ok(())
    }

    pub async fn check_for_update(
        &self,
        app: tauri::AppHandle,
        enable_downgrade: bool,
    ) -> Result<Option<Update>, anyhow::Error> {
        let is_pre_release = self.config.read().await.pre_release();
        let updates_url = self.get_updates_url(is_pre_release);

        let update = app
            .updater_builder()
            .version_comparator(move |current, update| {
                if enable_downgrade {
                    // Needed for switching off the pre-release
                    update.version != current
                } else {
                    update.version > current
                }
            })
            .endpoints(vec![updates_url])
            .expect("Failed to set update URL")
            .build()
            .expect("Failed to build updater")
            .check()
            .await
            .expect("Failed to check for updates");

        Ok(update)
    }

    fn get_updates_url(&self, is_pre_release: bool) -> Url {
        let updater_filename = if is_pre_release {
            "alpha-latest"
        } else {
            "latest"
        };

        let update_url_string = format!("https://raw.githubusercontent.com/tari-project/universe/main/.updater/{updater_filename}.json");
        Url::parse(&update_url_string).expect("Failed to parse update URL")
    }

    pub async fn proceed_with_update(&self, app: tauri::AppHandle) -> Result<(), anyhow::Error> {
        let mut downloaded: u64 = 0;
        let update = self
            .update
            .read()
            .await
            .clone()
            .ok_or_else(|| anyhow!("No update available"))?;

        let mut last_emit = std::time::Instant::now();
        update
            .download_and_install(
                |chunk_length, content_length| {
                    downloaded += chunk_length as u64;

                    let now = std::time::Instant::now();
                    let is_last_chunk = content_length.map(|cl| downloaded >= cl).unwrap_or(false);

                    if is_last_chunk || now.duration_since(last_emit) >= Duration::from_millis(100) {
                        last_emit = std::time::Instant::now();
                        let payload = DownloadProgressPayload::new(downloaded, content_length.unwrap_or(downloaded));
                        drop(app.emit("updates_event", payload).inspect_err(|e| {
                            warn!(target: LOG_TARGET, "Failed to emit 'updates_event' event: {}", e);
                        }));
                    }
                },
                || {
                    info!(target: LOG_TARGET, "Latest version download finished");
                },
            )
            .await?;

        app.restart();
    }
}
