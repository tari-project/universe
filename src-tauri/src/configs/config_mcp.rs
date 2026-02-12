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

use super::trait_config::{ConfigContentImpl, ConfigImpl};
use crate::LOG_TARGET_APP_LOGIC;
use base64::prelude::*;
use getset::{Getters, Setters};
use log::info;
use ring::rand::{SecureRandom, SystemRandom};
use serde::{Deserialize, Serialize};
use std::sync::LazyLock;
use std::time::SystemTime;
use tauri::AppHandle;
use tokio::sync::RwLock;

pub const MCP_CONFIG_VERSION: u32 = 0;
static INSTANCE: LazyLock<RwLock<ConfigMcp>> = LazyLock::new(|| RwLock::new(ConfigMcp::new()));

#[derive(Serialize, Deserialize, Clone)]
#[serde(rename_all = "snake_case")]
#[serde(default)]
#[derive(Getters, Setters)]
#[getset(get = "pub", set = "pub")]
#[allow(clippy::struct_excessive_bools)]
pub struct ConfigMcpContent {
    version_counter: u32,
    created_at: SystemTime,
    enabled: bool,
    bearer_token: Option<String>,
    token_created_at: Option<SystemTime>,
    token_expires_at: Option<SystemTime>,
    token_expiry_days: u32,
    transactions_enabled: bool,
    max_transaction_amount: Option<u64>,
    port: u16,
    read_tier_enabled: bool,
    control_tier_enabled: bool,
    rate_limit_transaction: u32,
}

impl Default for ConfigMcpContent {
    fn default() -> Self {
        Self {
            version_counter: 0,
            created_at: SystemTime::now(),
            enabled: false,
            bearer_token: None,
            token_created_at: None,
            token_expires_at: None,
            token_expiry_days: 30,
            transactions_enabled: false,
            max_transaction_amount: None,
            port: 19222,
            read_tier_enabled: true,
            control_tier_enabled: true,
            rate_limit_transaction: 5,
        }
    }
}

impl ConfigContentImpl for ConfigMcpContent {}

// TODO: Remove allow(dead_code) when Phase 2 (MCP server) consumes these methods
#[allow(dead_code)]
impl ConfigMcpContent {
    pub fn generate_token() -> String {
        let rng = SystemRandom::new();
        let mut bytes = [0u8; 32];
        rng.fill(&mut bytes)
            .expect("Failed to generate random bytes for MCP token");
        format!("tu_{}", BASE64_URL_SAFE_NO_PAD.encode(bytes))
    }

    pub fn ensure_token(&mut self) -> &str {
        if self.bearer_token.is_none() {
            let token = Self::generate_token();
            let now = SystemTime::now();
            let expiry =
                now + std::time::Duration::from_secs(u64::from(self.token_expiry_days) * 86400);
            self.bearer_token = Some(token);
            self.token_created_at = Some(now);
            self.token_expires_at = Some(expiry);
        }
        self.bearer_token
            .as_deref()
            .expect("bearer_token guaranteed by preceding is_none check")
    }

    pub fn revoke_token(&mut self) {
        self.bearer_token = None;
        self.token_created_at = None;
        self.token_expires_at = None;
    }

    pub fn refresh_token_expiry(&mut self) {
        if self.bearer_token.is_some() {
            let now = SystemTime::now();
            let expiry =
                now + std::time::Duration::from_secs(u64::from(self.token_expiry_days) * 86400);
            self.token_expires_at = Some(expiry);
        }
    }

    pub fn is_token_expired(&self) -> bool {
        match self.token_expires_at {
            Some(expiry) => SystemTime::now() > expiry,
            None => true,
        }
    }

    /// Returns a redacted version of the token for safe display
    pub fn redacted_token(&self) -> Option<String> {
        self.bearer_token.as_ref().map(|t| {
            if t.len() > 7 {
                format!("{}••••••••", &t[..3])
            } else {
                "tu_••••••••".to_string()
            }
        })
    }
}

pub struct ConfigMcp {
    content: ConfigMcpContent,
    app_handle: RwLock<Option<AppHandle>>,
}

impl ConfigMcp {
    pub async fn initialize(app_handle: AppHandle) {
        let mut config = Self::current().write().await;
        config.load_app_handle(app_handle.clone()).await;
        drop(config);

        Self::_check_for_migration()
            .await
            .expect("Could not check for migration");
    }

    async fn _migrate() -> Result<(), anyhow::Error> {
        // No migrations needed for v0
        Ok(())
    }

    async fn _check_for_migration() -> Result<(), anyhow::Error> {
        let current_version = Self::content().await.version_counter;
        #[allow(clippy::absurd_extreme_comparisons)]
        if current_version < MCP_CONFIG_VERSION {
            info!(target: LOG_TARGET_APP_LOGIC, "MCP config needs migration v{current_version:?} => v{MCP_CONFIG_VERSION}");
            Self::_migrate().await?;
            Self::update_field(ConfigMcpContent::set_version_counter, MCP_CONFIG_VERSION).await?;
        }
        Ok(())
    }
}

impl ConfigImpl for ConfigMcp {
    type Config = ConfigMcpContent;

    fn new() -> Self {
        Self {
            content: ConfigMcp::_load_or_create(),
            app_handle: RwLock::new(None),
        }
    }

    fn current() -> &'static RwLock<Self> {
        &INSTANCE
    }

    async fn _get_app_handle(&self) -> Option<AppHandle> {
        self.app_handle.read().await.clone()
    }

    fn _get_name() -> String {
        "config_mcp".to_string()
    }

    fn _get_content(&self) -> &Self::Config {
        &self.content
    }

    fn _get_content_mut(&mut self) -> &mut Self::Config {
        &mut self.content
    }

    async fn load_app_handle(&mut self, app_handle: AppHandle) {
        *self.app_handle.write().await = Some(app_handle);
    }
}
