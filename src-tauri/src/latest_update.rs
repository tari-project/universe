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
use reqwest::{self, Client};
use reqwest_middleware::{ClientBuilder, ClientWithMiddleware};
use reqwest_retry::{policies::ExponentialBackoff, RetryTransientMiddleware};
use serde::{Deserialize, Serialize};
use tokio::sync::RwLock;

use crate::{
    events::LatestUpdatePayload, EventsEmitter, APPLICATION_FOLDER_ID, LOG_TARGET_APP_LOGIC,
};

/// The URL of the Tari updates listing page.
///
/// CAVEAT: This feature assumes the Tari newsletter is published as a new entry on this page
/// (in the `_updates/` collection of the tari-dot-com website repo, deployed to tari.com).
/// The banner links to the newest entry on this page, so a newsletter that is published
/// anywhere else (e.g. only via email or on a different page) will NOT be picked up.
///
/// NOTE: The listing page is ordered newest-first, so the first `/updates/<slug>` link
/// is always the latest published update. The page is served with `cache-control: no-store`
/// and no ETag header, so freshness is tracked via a timestamp instead.
const UPDATES_URL: &str = "https://tari.com/updates";
const LATEST_UPDATE_FILE_NAME: &str = "latest_update.json";
const TIME_BETWEEN_FETCHES: Duration = Duration::from_secs(60 * 60); // 1 hour
static INSTANCE: LazyLock<LatestUpdate> = LazyLock::new(LatestUpdate::new);

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct LatestUpdateFile {
    pub url: String,
    pub title: String,
    pub timestamp: SystemTime,
}

pub struct LatestUpdate {
    latest_update_file: RwLock<Option<LatestUpdateFile>>,
}

impl LatestUpdate {
    pub fn new() -> Self {
        Self {
            latest_update_file: RwLock::new(LatestUpdate::read_latest_update_file().ok()),
        }
    }

    pub fn current() -> &'static LatestUpdate {
        &INSTANCE
    }

    /// Extracts the slug and title of the newest update from the updates listing HTML.
    fn parse_latest_update(html: &str) -> Option<(String, String)> {
        let update_regex = regex::Regex::new(r#"href="/updates/([^"]+)"[^>]*>([^<]+)<"#)
            .expect("Failed to create update regex");
        let captures = update_regex.captures(html)?;
        let slug = captures.get(1)?.as_str().to_string();
        let title = LatestUpdate::decode_html_entities(captures.get(2)?.as_str());
        Some((slug, title))
    }

    fn decode_html_entities(title: &str) -> String {
        title
            .replace("&amp;", "&")
            .replace("&quot;", "\"")
            .replace("&#x27;", "'")
            .replace("&#39;", "'")
            .replace("&lt;", "<")
            .replace("&gt;", ">")
    }

    fn get_latest_update_path() -> String {
        let cache_dir = cache_dir().expect("Failed to get cache directory");
        cache_dir
            .join(APPLICATION_FOLDER_ID)
            .join(LATEST_UPDATE_FILE_NAME)
            .to_str()
            .expect("Failed to convert latest update path to string")
            .to_string()
    }

    fn read_latest_update_file() -> Result<LatestUpdateFile, Error> {
        debug!(target: LOG_TARGET_APP_LOGIC, "[read_latest_update_file]");
        let latest_update_path = LatestUpdate::get_latest_update_path();
        debug!(target: LOG_TARGET_APP_LOGIC, "[read_latest_update_file] Reading latest update from {latest_update_path}");
        let content = std::fs::read_to_string(latest_update_path)?;

        Ok(serde_json::from_str(&content)?)
    }

    fn save_latest_update_file(
        &self,
        url: String,
        title: String,
        timestamp: SystemTime,
    ) -> Result<(), Error> {
        debug!(target: LOG_TARGET_APP_LOGIC, "[save_latest_update_file]");
        let latest_update_path = LatestUpdate::get_latest_update_path();
        let content_to_save = LatestUpdateFile {
            url,
            title,
            timestamp,
        };
        debug!(target: LOG_TARGET_APP_LOGIC, "[save_latest_update_file] Saving latest update to {latest_update_path}");
        let content = serde_json::to_string(&content_to_save)?;
        if let Some(parent) = std::path::Path::new(&latest_update_path).parent() {
            std::fs::create_dir_all(parent)?;
        }
        std::fs::write(latest_update_path, content).map_err(|e| {
            error!(target: LOG_TARGET_APP_LOGIC, "Failed to save latest update file: {e}");
            anyhow!("Failed to save latest update file")
        })?;

        Ok(())
    }

    fn build_retry_reqwest_client() -> ClientWithMiddleware {
        debug!(target: LOG_TARGET_APP_LOGIC, "[build_retry_reqwest_client]");
        let retry_policy = ExponentialBackoff::builder().build_with_max_retries(5);

        ClientBuilder::new(Client::new())
            .with(RetryTransientMiddleware::new_with_policy(retry_policy))
            .build()
    }

    async fn fetch_latest_update(&self) -> Result<LatestUpdateFile, Error> {
        debug!(target: LOG_TARGET_APP_LOGIC, "[fetch_latest_update]");
        let client = LatestUpdate::build_retry_reqwest_client();

        debug!(target: LOG_TARGET_APP_LOGIC, "[fetch_latest_update] Fetching latest update from {UPDATES_URL}");
        let response = client.get(UPDATES_URL).send().await?;
        if response.status().is_success() {
            debug!(target: LOG_TARGET_APP_LOGIC, "[fetch_latest_update] Successfully fetched latest update");
            let html = &response.text().await?;
            let (slug, title) = LatestUpdate::parse_latest_update(html).ok_or_else(|| {
                warn!(target: LOG_TARGET_APP_LOGIC, "Failed to parse latest update from {UPDATES_URL}");
                anyhow!("Failed to parse latest update")
            })?;
            Ok(LatestUpdateFile {
                url: format!("https://tari.com/updates/{slug}"),
                title,
                timestamp: SystemTime::now(),
            })
        } else {
            warn!(target: LOG_TARGET_APP_LOGIC, "Failed to fetch latest update: {}", response.status());
            Err(anyhow!("Failed to fetch latest update"))
        }
    }

    async fn handle_fetching_and_saving(&self) -> Result<LatestUpdateFile, Error> {
        debug!(target: LOG_TARGET_APP_LOGIC, "[handle_fetching_and_saving]");
        let latest_update = self.fetch_latest_update().await?;
        self.save_latest_update_file(
            latest_update.url.clone(),
            latest_update.title.clone(),
            latest_update.timestamp,
        )?;

        debug!(target: LOG_TARGET_APP_LOGIC, "[handle_fetching_and_saving] Saving latest update to struct");
        self.latest_update_file
            .write()
            .await
            .replace(latest_update.clone());

        debug!(target: LOG_TARGET_APP_LOGIC, "[handle_fetching_and_saving] Returning latest update");

        Ok(latest_update)
    }

    /// Returns the latest published update, re-fetching it if the cached value is stale.
    /// If the re-fetched content is unchanged, only the timestamp is refreshed so we don't
    /// emit redundant events for the same update.
    pub async fn get_latest_update(&self) -> Result<LatestUpdateFile, Error> {
        debug!(target: LOG_TARGET_APP_LOGIC, "[get_latest_update]");

        debug!(target: LOG_TARGET_APP_LOGIC, "[get_latest_update] Getting latest update file lock");
        let latest_update_file_lock = self.latest_update_file.read().await;
        let file = latest_update_file_lock.deref().clone();
        drop(latest_update_file_lock);
        debug!(target: LOG_TARGET_APP_LOGIC, "[get_latest_update] Releasing latest update file lock");

        if let Some(latest_update_file) = file {
            let did_expire = SystemTime::now()
                .duration_since(latest_update_file.timestamp)
                .map(|d| d.gt(&TIME_BETWEEN_FETCHES))
                .unwrap_or(true);

            if !did_expire {
                debug!(target: LOG_TARGET_APP_LOGIC, "[get_latest_update] Using cached latest update");
                return Ok(latest_update_file.clone());
            };

            match self.fetch_latest_update().await {
                Ok(fetched) => {
                    if fetched.url == latest_update_file.url
                        && fetched.title == latest_update_file.title
                    {
                        debug!(target: LOG_TARGET_APP_LOGIC, "[get_latest_update] Latest update is unchanged, refreshing cache timestamp");
                        self.save_latest_update_file(
                            latest_update_file.url.clone(),
                            latest_update_file.title.clone(),
                            SystemTime::now(),
                        )?;
                        self.latest_update_file
                            .write()
                            .await
                            .replace(latest_update_file.clone());
                        Ok(latest_update_file.clone())
                    } else {
                        debug!(target: LOG_TARGET_APP_LOGIC, "[get_latest_update] New update detected, saving");
                        self.save_latest_update_file(
                            fetched.url.clone(),
                            fetched.title.clone(),
                            fetched.timestamp,
                        )?;
                        self.latest_update_file
                            .write()
                            .await
                            .replace(fetched.clone());
                        Ok(fetched)
                    }
                }
                Err(e) => {
                    warn!(target: LOG_TARGET_APP_LOGIC, "Failed to re-fetch latest update: {e}");
                    Ok(latest_update_file.clone())
                }
            }
        } else {
            debug!(target: LOG_TARGET_APP_LOGIC, "[get_latest_update] Didn't find cached latest update, fetching");
            self.handle_fetching_and_saving().await
        }
    }

    /// Fetches the latest published update and emits it to the frontend if it changed.
    /// Safe to call repeatedly (e.g. on an hourly interval) — it only emits when a new
    /// update is detected, so the banner updates automatically without an app restart.
    pub async fn handle_latest_update_event_emit(&self) -> Result<(), Error> {
        debug!(target: LOG_TARGET_APP_LOGIC, "[handle_latest_update_event_emit]");

        let previous = self.latest_update_file.read().await.clone();
        let latest_update = self.get_latest_update().await?;

        let is_new_update = previous
            .as_ref()
            .is_none_or(|p| p.url != latest_update.url || p.title != latest_update.title);

        if !is_new_update {
            debug!(target: LOG_TARGET_APP_LOGIC, "[handle_latest_update_event_emit] Latest update unchanged, skipping emit");
            return Ok(());
        }

        debug!(target: LOG_TARGET_APP_LOGIC, "[handle_latest_update_event_emit] Latest update: {}", latest_update.url);

        EventsEmitter::emit_latest_update(LatestUpdatePayload {
            url: latest_update.url,
            title: latest_update.title,
        })
        .await;
        debug!(target: LOG_TARGET_APP_LOGIC, "[handle_latest_update_event_emit] Emitted latest update event");

        Ok(())
    }
}

#[cfg(test)]
mod test {
    use super::LatestUpdate;

    #[test]
    fn test_parse_latest_update() {
        let html = r#"<a class="styles__Title-sc-3a714131-2 dVcsVv" href="/updates/2025-02-14-update-142">Obeisance of the Ootle</a><a class="styles__ReadMoreButton-sc-3a714131-6 lbmhdl" href="/updates/2025-02-14-update-142">Read More</a>"#;
        let (slug, title) = LatestUpdate::parse_latest_update(html).expect("should parse");
        assert_eq!(slug, "2025-02-14-update-142");
        assert_eq!(title, "Obeisance of the Ootle");
    }

    #[test]
    fn test_parse_latest_update_decodes_entities() {
        let html = r#"<a class="styles__Title-sc-3a714131-2 dVcsVv" href="/updates/2026-09-01-update-143">New&#x27;s &amp; Such</a>"#;
        let (slug, title) = LatestUpdate::parse_latest_update(html).expect("should parse");
        assert_eq!(slug, "2026-09-01-update-143");
        assert_eq!(title, "New's & Such");
    }

    #[test]
    fn test_parse_latest_update_returns_none_for_invalid_html() {
        let html = "<html><body>no updates here</body></html>";
        assert!(LatestUpdate::parse_latest_update(html).is_none());
    }
}
