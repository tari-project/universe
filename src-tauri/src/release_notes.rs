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

use std::{
    ops::Deref,
    sync::LazyLock,
    time::{Duration, SystemTime},
};

use anyhow::{anyhow, Error};
use dirs::cache_dir;
use log::{debug, error, warn};
use reqwest::{self, Client, Response};
use reqwest_middleware::{ClientBuilder, ClientWithMiddleware};
use reqwest_retry::{policies::ExponentialBackoff, RetryTransientMiddleware};
use semver::Version;
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Emitter, State};
use tokio::sync::RwLock;

use crate::{
    events::ReleaseNotesHandlerEvent, updates_manager::UpdatesManager, UniverseAppState,
    APPLICATION_FOLDER_ID,
};

const LOG_TARGET: &str = "tari::universe::release_notes";
const CHANGELOG_URL: &str = "https://cdn.jsdelivr.net/gh/tari-project/universe@main/CHANGELOG.md";
const RELEASE_NOTES_FILE_NAME: &str = "CHANGELOG.json";
const TIME_BETWEEN_FETCHES: Duration = Duration::from_secs(1 * 1 * 1); // 1 hour
static INSTANCE: LazyLock<ReleaseNotes> = LazyLock::new(ReleaseNotes::new);

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ReleaseNotesFile {
    pub version: String,
    pub content: String,
    pub e_tag: String,
    pub timestamp: SystemTime,
}
pub struct ReleaseNotes {
    release_notes_file: RwLock<Option<ReleaseNotesFile>>,
}

impl ReleaseNotes {
    pub fn new() -> Self {
        Self {
            release_notes_file: RwLock::new(ReleaseNotes::read_release_notes_file().ok()),
        }
    }

    pub fn current() -> &'static ReleaseNotes {
        &INSTANCE
    }

    fn get_latest_version_from_changelog(changelog: &str) -> Option<String> {
        let version_regex =
            regex::Regex::new(r"v(\d+\.\d+\.\d+)").expect("Failed to create version regex");
        if let Some(captures) = version_regex.captures(changelog) {
            captures.get(1).map(|m| m.as_str().to_string())
        } else {
            None
        }
    }

    fn get_release_notes_path() -> String {
        let cache_dir = cache_dir().expect("Failed to get cache directory");
        cache_dir
            .join(APPLICATION_FOLDER_ID)
            .join(RELEASE_NOTES_FILE_NAME)
            .to_str()
            .expect("Failed to convert release notes path to string")
            .to_string()
    }

    fn read_release_notes_file() -> Result<ReleaseNotesFile, Error> {
        debug!(target: LOG_TARGET, "[read_release_notes_file]");
        let release_notes_path = ReleaseNotes::get_release_notes_path();
        debug!(target: LOG_TARGET, "[read_release_notes_file] Reading release notes from {}", release_notes_path);
        let content = std::fs::read_to_string(release_notes_path).map_err(|e| {
            error!(target: LOG_TARGET, "Failed to read release notes file: {}", e);
            anyhow!("Failed to read release notes file")
        })?;

        Ok(serde_json::from_str(&content)?)
    }

    fn save_release_notes_file(&self, content: &str, e_tag: String) -> Result<(), Error> {
        debug!(target: LOG_TARGET, "[save_release_notes_file]");
        let release_notes_path = ReleaseNotes::get_release_notes_path();
        let version = ReleaseNotes::get_latest_version_from_changelog(content)
            .unwrap_or_else(|| "Unknown".to_string());
        let content_to_save = ReleaseNotesFile {
            version,
            content: content.to_string(),
            e_tag,
            timestamp: SystemTime::now(),
        };
        debug!(target: LOG_TARGET, "[save_release_notes_file] Saving release notes to {}", release_notes_path);
        let content = serde_json::to_string(&content_to_save)?;
        debug!(target: LOG_TARGET, "[save_release_notes_file] Content: {}", content);
        std::fs::write(release_notes_path, content).map_err(|e| {
            error!(target: LOG_TARGET, "Failed to save release notes file: {}", e);
            anyhow!("Failed to save release notes file")
        })?;

        Ok(())
    }

    fn build_retry_reqwest_client() -> ClientWithMiddleware {
        debug!(target: LOG_TARGET, "[build_retry_reqwest_client]");
        let retry_policy = ExponentialBackoff::builder().build_with_max_retries(5);

        ClientBuilder::new(Client::new())
            .with(RetryTransientMiddleware::new_with_policy(retry_policy))
            .build()
    }

    pub fn get_etag_from_response(response: &Response) -> Result<String, Error> {
        debug!(target: LOG_TARGET, "[get_etag_from_response]");
        let etag = response.headers().get("etag").ok_or_else(|| {
            warn!(target: LOG_TARGET, "Failed to get ETag header");
            anyhow!("Failed to get ETag header")
        })?;
        let etag_str = etag.to_str().map_err(|e| {
            warn!(target: LOG_TARGET, "Failed to convert ETag header to string: {}", e);
            anyhow!("Failed to convert ETag header to string")
        })?;
        Ok(etag_str.to_string())
    }

    async fn fetch_release_notes_header(&self) -> Result<String, Error> {
        debug!(target: LOG_TARGET, "[fetch_release_notes_header]");
        let client = ReleaseNotes::build_retry_reqwest_client();

        debug!(target: LOG_TARGET, "[fetch_release_notes_header] Fetching release notes header from {}", CHANGELOG_URL);
        let response = client.head(CHANGELOG_URL).send().await?;
        if response.status().is_success() {
            debug!(target: LOG_TARGET, "[fetch_release_notes_header] Successfully fetched release notes header");
            let e_tag = ReleaseNotes::get_etag_from_response(&response)?;
            Ok(e_tag)
        } else {
            warn!(target: LOG_TARGET, "Failed to fetch release notes header: {}", response.status());
            Err(anyhow!("Failed to fetch release notes header"))
        }
    }

    async fn fetch_release_notes(&self) -> Result<(String, String), Error> {
        debug!(target: LOG_TARGET, "[fetch_release_notes]");
        let client = ReleaseNotes::build_retry_reqwest_client();

        debug!(target: LOG_TARGET, "[fetch_release_notes] Fetching release notes from {}", CHANGELOG_URL);
        let response = client.get(CHANGELOG_URL).send().await?;
        if response.status().is_success() {
            debug!(target: LOG_TARGET, "[fetch_release_notes] Successfully fetched release notes");
            let e_tag = ReleaseNotes::get_etag_from_response(&response)?;
            let body = &response.text().await?;
            Ok((body.clone(), e_tag))
        } else {
            warn!(target: LOG_TARGET, "[fetch_release_notes] Failed to fetch release notes: {}", response.status());
            Err(anyhow!("Failed to fetch release notes"))
        }
    }

    async fn handle_fetching_and_saving(&self) -> Result<ReleaseNotesFile, Error> {
        debug!(target: LOG_TARGET, "[handle_fetching_and_saving]");
        let (release_notes, e_tag) = self.fetch_release_notes().await?;
        self.save_release_notes_file(&release_notes, e_tag.clone())?;
        let version = ReleaseNotes::get_latest_version_from_changelog(&release_notes)
            .unwrap_or_else(|| "Unknown".to_string());

        let new_release_notes = ReleaseNotesFile {
            content: release_notes,
            version,
            e_tag,
            timestamp: SystemTime::now(),
        };

        debug!(target: LOG_TARGET, "[handle_fetching_and_saving] Saving release notes to struct");
        self.release_notes_file
            .write()
            .await
            .replace(new_release_notes.clone());

        debug!(target: LOG_TARGET, "[handle_fetching_and_saving] Returning release notes");

        Ok(new_release_notes)
    }

    pub async fn get_release_notes(&self, force_fetch: bool) -> Result<ReleaseNotesFile, Error> {
        debug!(target: LOG_TARGET, "[get_release_notes]");

        debug!(target: LOG_TARGET, "[get_release_notes] Getting release notes file lock");
        let release_notes_file_lock = self.release_notes_file.read().await;
        let file = release_notes_file_lock.deref().clone();
        drop(release_notes_file_lock);
        debug!(target: LOG_TARGET, "[get_release_notes] Realising release notes file lock");

        if force_fetch {
            debug!(target: LOG_TARGET, "[get_release_notes] Forcing release notes fetch");
            return self.handle_fetching_and_saving().await;
        };

        if let Some(release_notes_file) = file {
            let did_expire = SystemTime::now()
                .duration_since(release_notes_file.timestamp)
                .map(|d| d.gt(&TIME_BETWEEN_FETCHES))
                .unwrap_or(true);

            if !did_expire {
                debug!(target: LOG_TARGET, "[get_release_notes] Using cached release notes");
                return Ok(release_notes_file.clone());
            };

            let e_tag = self.fetch_release_notes_header().await?;
            if e_tag == release_notes_file.e_tag {
                debug!(target: LOG_TARGET, "[get_release_notes] Found matching ETag, using cached release notes");
                Ok(release_notes_file.clone())
            } else {
                debug!(target: LOG_TARGET, "[get_release_notes] Found different ETag, fetching release notes");
                self.handle_fetching_and_saving().await
            }
        } else {
            debug!(target: LOG_TARGET, "[get_release_notes] Didn't find cached release notes, fetching");
            self.handle_fetching_and_saving().await
        }
    }

    pub async fn should_show_release_notes(
        &self,
        state: State<'_, UniverseAppState>,
        app: AppHandle,
    ) -> Result<bool, Error> {
        debug!(target: LOG_TARGET, "[should_show_release_notes]");
        let release_notes_version = ReleaseNotes::current()
            .get_release_notes(UpdatesManager::read_update_finished_from_file())
            .await?
            .version;
        let release_notes_version = Version::parse(&release_notes_version)?;
        let current_app_version = app.package_info().version.clone();

        debug!(target: LOG_TARGET, "[should_show_release_notes] Getting config lock");
        let config_lock = state.config.read().await;
        let last_release_notes_version_shown = config_lock.last_changelog_version().to_string();
        drop(config_lock);
        debug!(target: LOG_TARGET, "[should_show_release_notes] Realising config lock");

        let last_release_notes_version_shown = Version::parse(&last_release_notes_version_shown)?;

        debug!(target: LOG_TARGET, "[should_show_release_notes] Release notes version: {}", release_notes_version);
        debug!(target: LOG_TARGET, "[should_show_release_notes] Last release notes version shown: {}", last_release_notes_version_shown);
        debug!(target: LOG_TARGET, "[should_show_release_notes] Current app version: {}", current_app_version);

        let was_release_notes_updated = release_notes_version.gt(&last_release_notes_version_shown);
        let is_app_on_latest_release_notes_version_or_higher =
            current_app_version.ge(&release_notes_version);

        debug!(target: LOG_TARGET, "[should_show_release_notes] Was release notes updated: {}", was_release_notes_updated);
        debug!(target: LOG_TARGET, "[should_show_release_notes] Is app on latest release notes version or higher: {}", is_app_on_latest_release_notes_version_or_higher);

        Ok(was_release_notes_updated && is_app_on_latest_release_notes_version_or_higher)
    }

    pub async fn handle_release_notes_event_emit(
        &self,
        state: State<'_, UniverseAppState>,
        app: AppHandle,
    ) -> Result<(), Error> {
        debug!(target: LOG_TARGET, "[handle_release_notes_event_emit]");

        let config_lock = state.config.read().await;
        let last_release_notes_version_shown = config_lock.last_changelog_version().to_string();
        let last_release_notes_version_shown = Version::parse(&last_release_notes_version_shown)?;
        drop(config_lock);

        let release_notes = ReleaseNotes::current()
            .get_release_notes(UpdatesManager::read_update_finished_from_file())
            .await?;

        let release_notes_version = Version::parse(&release_notes.version)?;
        let current_app_version = app.package_info().version.clone();

        debug!(target: LOG_TARGET, "[handle_release_notes_event_emit] Release notes version: {}", release_notes_version);
        debug!(target: LOG_TARGET, "[handle_release_notes_event_emit] Last release notes version shown: {}", last_release_notes_version_shown);
        debug!(target: LOG_TARGET, "[handle_release_notes_event_emit] Current app version: {}", current_app_version);

        let was_release_notes_updated = release_notes_version.gt(&last_release_notes_version_shown);
        let is_app_on_latest_release_notes_version_or_higher =
            current_app_version.ge(&release_notes_version);

        debug!(target: LOG_TARGET, "[handle_release_notes_event_emit] Was release notes updated: {}", was_release_notes_updated);
        debug!(target: LOG_TARGET, "[handle_release_notes_event_emit] Is app on latest release notes version or higher: {}", is_app_on_latest_release_notes_version_or_higher);

        let should_show_release_notes =
            was_release_notes_updated && is_app_on_latest_release_notes_version_or_higher;

        let is_app_update_available: bool = state
            .updates_manager
            .check_for_update(app.clone(), false)
            .await
            .map(|update| update.is_some())
            .unwrap_or(false);

        debug!(target: LOG_TARGET, "[handle_release_notes_event_emit] Is app update available: {}", is_app_update_available);

        app.emit(
            "release_notes_handler",
            ReleaseNotesHandlerEvent {
                release_notes: release_notes.content,
                is_app_update_available,
                should_show_dialog: should_show_release_notes,
            },
        )
        .map_err(|e| anyhow::anyhow!(e))?;
        debug!(target: LOG_TARGET, "[handle_release_notes_event_emit] Emitted release notes event");

        if should_show_release_notes {
            debug!(target: LOG_TARGET, "[handle_release_notes_event_emit] Setting last changelog version to {}", release_notes.version);
            state
                .config
                .write()
                .await
                .set_last_changelog_version(release_notes.version)
                .await?;
        }

        debug!(target: LOG_TARGET, "[handle_release_notes_event_emit] Done");
        Ok(())
    }
}
