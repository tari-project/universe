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

use std::{collections::HashMap, sync::LazyLock, time::SystemTime};

use anyhow::Error;
use serde::{Deserialize, Serialize};
use tauri::AppHandle;
use tokio::sync::RwLock;

use super::trait_config::{ConfigContentImpl, ConfigImpl};

static LOG_TARGET: &str = "tari::universe::config_database_listener";
static INSTANCE: LazyLock<RwLock<ConfigDatabaseListener>> =
    LazyLock::new(|| RwLock::new(ConfigDatabaseListener::new()));

pub const DATABASE_LISTENER_CONFIG_VERSION: u32 = 0;

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct CachedTableState {
    pub account_id: i64,
    pub table_name: String,
    pub last_known_value: i64,
    pub last_checked: SystemTime,
    pub check_count: u64,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(default)]
pub struct ConfigDatabaseListenerContent {
    version_counter: u32,
    last_updated: SystemTime,
    /// Key: "{account_id}:{table_name}" -> Value: cached state
    cached_states: HashMap<String, CachedTableState>,
}

impl Default for ConfigDatabaseListenerContent {
    fn default() -> Self {
        Self {
            version_counter: DATABASE_LISTENER_CONFIG_VERSION,
            last_updated: SystemTime::now(),
            cached_states: HashMap::new(),
        }
    }
}

impl ConfigContentImpl for ConfigDatabaseListenerContent {}

pub struct ConfigDatabaseListener {
    content: ConfigDatabaseListenerContent,
    app_handle: Option<AppHandle>,
}

impl ConfigImpl for ConfigDatabaseListener {
    type Config = ConfigDatabaseListenerContent;

    fn new() -> Self {
        Self {
            content: Self::_load_or_create(),
            app_handle: None,
        }
    }

    fn current() -> &'static RwLock<Self> {
        &INSTANCE
    }

    async fn _get_app_handle(&self) -> Option<AppHandle> {
        self.app_handle.clone()
    }

    fn _get_name() -> String {
        "database_listener".to_string()
    }

    fn _get_content(&self) -> &Self::Config {
        &self.content
    }

    fn _get_content_mut(&mut self) -> &mut Self::Config {
        &mut self.content
    }

    async fn load_app_handle(&mut self, app_handle: AppHandle) {
        self.app_handle = Some(app_handle);
    }
}

// Convenience methods for external access
impl ConfigDatabaseListener {
    pub async fn initialize(app_handle: AppHandle) {
        let mut config = Self::current().write().await;
        config.load_app_handle(app_handle).await;
    }

    /// Get cached state for a specific table and account
    pub async fn get_cached_state(account_id: i64, table_name: &str) -> Option<CachedTableState> {
        let key = Self::make_key(account_id, table_name);
        Self::content().await.cached_states.get(&key).cloned()
    }

    /// Update cached state for a specific table and account
    pub async fn update_cached_state(
        account_id: i64,
        table_name: String,
        value: i64,
    ) -> Result<(), Error> {
        let key = Self::make_key(account_id, &table_name);

        // Get existing state to preserve check_count
        let existing_check_count = Self::content()
            .await
            .cached_states
            .get(&key)
            .map(|s| s.check_count)
            .unwrap_or(0);

        let state = CachedTableState {
            account_id,
            table_name,
            last_known_value: value,
            last_checked: SystemTime::now(),
            check_count: existing_check_count + 1,
        };

        Self::update_field(
            |config, state: CachedTableState| {
                let key = Self::make_key(state.account_id, &state.table_name);
                config.cached_states.insert(key, state);
                config.last_updated = SystemTime::now();
                config
            },
            state,
        )
        .await
    }

    fn make_key(account_id: i64, table_name: &str) -> String {
        format!("{}:{}", account_id, table_name)
    }
}
