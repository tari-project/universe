use std::sync::Arc;
use tokio::time;

use anyhow::anyhow;
use log::{error, info, warn};

use serde::{Deserialize, Serialize};
use tauri::{Emitter, Url};
use tauri_plugin_updater::{Update, UpdaterExt};
use tokio::sync::RwLock;

use crate::app_config::AppConfig;
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
pub struct AskForUpdatePayload {
    pub event_type: String,
    pub version: String,
}

impl AskForUpdatePayload {
    pub fn new(version: String) -> Self {
        Self {
            event_type: "ask_for_update".to_string(),
            version,
        }
    }
}

#[derive(Clone)]
pub struct UpdatesManager {
    config: Arc<RwLock<AppConfig>>,
    update: Arc<RwLock<Option<Update>>>,
}

impl UpdatesManager {
    pub fn new(config: Arc<RwLock<AppConfig>>) -> Self {
        Self {
            config,
            update: Arc::new(RwLock::new(None)),
        }
    }

    pub async fn init_periodic_updates(&self, app: tauri::AppHandle) -> Result<(), anyhow::Error> {
        let app_clone = app.clone();
        let self_clone = self.clone();
        tauri::async_runtime::spawn(async move {
            let mut interval = time::interval(Duration::from_secs(3600));
            loop {
                interval.tick().await;
                if let Err(e) = self_clone.try_update(app_clone.clone(), false).await {
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
    ) -> Result<(), anyhow::Error> {
        match self.check_for_update(app.clone()).await? {
            Some(update) => {
                let version = update.version.clone();
                info!(target: LOG_TARGET, "try_update: Update available: {:?}", version);
                *self.update.write().await = Some(update);
                let is_auto_update = self.config.read().await.auto_update();

                if force {
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
                println!("No updates available");
            }
        }

        Ok(())
    }

    pub async fn check_for_update(
        &self,
        app: tauri::AppHandle,
    ) -> Result<Option<Update>, anyhow::Error> {
        let is_pre_release = self.config.read().await.pre_release();
        let updates_url = self.get_updates_url(is_pre_release);

        let update = app
            .updater_builder()
            .version_comparator(|current, update| {
                // Needed for switching off the pre-release
                update.version != current
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
                    app.restart();
                },
            )
            .await?;

        Ok(())
    }
}
