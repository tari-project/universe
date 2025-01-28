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
use log::{debug, error, info, warn};
use reqwest::{self, Client, Response};
use reqwest_middleware::{ClientBuilder, ClientWithMiddleware};
use reqwest_retry::{policies::ExponentialBackoff, RetryTransientMiddleware};
use semver::Version;
use serde::{Deserialize, Serialize};
use tokio::sync::RwLock;

use crate::APPLICATION_FOLDER_ID;

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
        let release_notes_path = ReleaseNotes::get_release_notes_path();
        debug!(target: LOG_TARGET, "Reading release notes from {}", release_notes_path);
        let content = std::fs::read_to_string(release_notes_path).map_err(|e| {
            error!(target: LOG_TARGET, "Failed to read release notes file: {}", e);
            anyhow!("Failed to read release notes file")
        })?;

        Ok(serde_json::from_str(&content)?)
    }

    fn save_release_notes_file(&self, content: &str, e_tag: String) -> Result<(), Error> {
        let release_notes_path = ReleaseNotes::get_release_notes_path();
        let version = ReleaseNotes::get_latest_version_from_changelog(content)
            .unwrap_or_else(|| "Unknown".to_string());
        let content_to_save = ReleaseNotesFile {
            version,
            content: content.to_string(),
            e_tag,
            timestamp: SystemTime::now(),
        };
        debug!(target: LOG_TARGET, "Saving release notes to {}", release_notes_path);
        let content = serde_json::to_string(&content_to_save)?;
        std::fs::write(release_notes_path, content).map_err(|e| {
            error!(target: LOG_TARGET, "Failed to save release notes file: {}", e);
            anyhow!("Failed to save release notes file")
        })?;

        Ok(())
    }

    fn build_retry_reqwest_client() -> ClientWithMiddleware {
        let retry_policy = ExponentialBackoff::builder().build_with_max_retries(5);

        ClientBuilder::new(Client::new())
            .with(RetryTransientMiddleware::new_with_policy(retry_policy))
            .build()
    }

    pub fn get_etag_from_response(response: &Response) -> Result<String, Error> {
        response
            .headers()
            .get("etag")
            .ok_or_else(|| {
                warn!(target: LOG_TARGET, "Failed to get ETag header");
                anyhow!("Failed to get ETag header")
            })?
            .to_str()
            .map_err(|e| {
                warn!(target: LOG_TARGET, "Failed to convert ETag header to string: {}", e);
                anyhow!("Failed to convert ETag header to string")
            })
            .map(|s| s.to_string())
    }

    async fn fetch_release_notes_header(&self) -> Result<String, Error> {
        debug!(target: LOG_TARGET, "Fetching release notes header from {}", CHANGELOG_URL);
        let client = ReleaseNotes::build_retry_reqwest_client();

        let response = client.head(CHANGELOG_URL).send().await?;
        if response.status().is_success() {
            let e_tag = ReleaseNotes::get_etag_from_response(&response)?;
            Ok(e_tag)
        } else {
            warn!(target: LOG_TARGET, "Failed to fetch release notes header: {}", response.status());
            Err(anyhow!("Failed to fetch release notes header"))
        }
    }

    async fn fetch_release_notes(&self) -> Result<(String, String), Error> {
        debug!(target: LOG_TARGET, "Fetching release notes from {}", CHANGELOG_URL);
        let client = ReleaseNotes::build_retry_reqwest_client();

        let response = client.get(CHANGELOG_URL).send().await?;
        if response.status().is_success() {
            let e_tag = ReleaseNotes::get_etag_from_response(&response)?;
            let body = &response.text().await?;
            Ok((body.clone(), e_tag))
        } else {
            warn!(target: LOG_TARGET, "Failed to fetch release notes: {}", response.status());
            Err(anyhow!("Failed to fetch release notes"))
        }
    }

    async fn handle_fetching_and_saving(&self) -> Result<ReleaseNotesFile, Error> {
        debug!(target: LOG_TARGET, "Fetching and saving release notes");
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

        self.release_notes_file
            .write()
            .await
            .replace(new_release_notes.clone());

        debug!(target: LOG_TARGET, "Release notes fetched and saved");

        Ok(new_release_notes)
    }

    pub async fn get_release_notes(&self, force_fetch: bool) -> Result<ReleaseNotesFile, Error> {
        let release_notes_file_lock = self.release_notes_file.read().await;
        let file = release_notes_file_lock.deref().clone();
        drop(release_notes_file_lock);

        if force_fetch {
            debug!(target: LOG_TARGET, "Forcing release notes fetch");
            return Ok(self.handle_fetching_and_saving().await?);
        };

        if let Some(release_notes_file) = file {
            let did_expire = SystemTime::now()
                .duration_since(release_notes_file.timestamp)
                .map(|d| d.gt(&TIME_BETWEEN_FETCHES))
                .unwrap_or(true);

            if !did_expire {
                debug!(target: LOG_TARGET, "Using cached release notes");
                return Ok(release_notes_file.clone());
            };

            let e_tag = self.fetch_release_notes_header().await?;
            if e_tag == release_notes_file.e_tag {
                debug!(target: LOG_TARGET, "Found matching ETag, using cached release notes");
                Ok(release_notes_file.clone())
            } else {
                debug!(target: LOG_TARGET, "Found different ETag, fetching release notes");
                Ok(self.handle_fetching_and_saving().await?)
            }
        } else {
            debug!(target: LOG_TARGET, "Didn't find cached release notes, fetching");
            Ok(self.handle_fetching_and_saving().await?)
        }
    }

    pub async fn get_current_release_notes_version(&self) -> Option<Version> {
        let release_notes_file_lock = self.release_notes_file.read().await;
        let file = release_notes_file_lock.deref().clone();
        drop(release_notes_file_lock);

        file.map(|f| Version::parse(f.version.as_str()).ok())
            .flatten()
    }
}
