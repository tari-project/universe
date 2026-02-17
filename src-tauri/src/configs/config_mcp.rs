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
pub(crate) const SECONDS_PER_DAY: u64 = 24 * 60 * 60;
static INSTANCE: LazyLock<RwLock<ConfigMcp>> = LazyLock::new(|| RwLock::new(ConfigMcp::new()));

mod token_cipher {
    use base64::prelude::*;
    use ring::aead::{AES_256_GCM, Aad, LessSafeKey, Nonce, UnboundKey};
    use ring::digest;
    use ring::rand::{SecureRandom, SystemRandom};

    use crate::APPLICATION_FOLDER_ID;

    const NONCE_LEN: usize = 12;

    fn derive_key() -> LessSafeKey {
        let hash1 = digest::digest(
            &digest::SHA256,
            format!("tari-universe-mcp-token-v1:{}", APPLICATION_FOLDER_ID).as_bytes(),
        );
        let hash2 = digest::digest(&digest::SHA256, hash1.as_ref());
        let unbound =
            UnboundKey::new(&AES_256_GCM, &hash2.as_ref()[..32]).expect("AES key creation failed");
        LessSafeKey::new(unbound)
    }

    pub fn encrypt(plaintext: &str) -> String {
        let key = derive_key();
        let rng = SystemRandom::new();
        let mut nonce_bytes = [0u8; NONCE_LEN];
        rng.fill(&mut nonce_bytes)
            .expect("Failed to generate nonce");

        let mut in_out = plaintext.as_bytes().to_vec();
        let nonce = Nonce::assume_unique_for_key(nonce_bytes);
        key.seal_in_place_append_tag(nonce, Aad::empty(), &mut in_out)
            .expect("AES-GCM seal failed");

        let mut result = Vec::with_capacity(NONCE_LEN + in_out.len());
        result.extend_from_slice(&nonce_bytes);
        result.extend_from_slice(&in_out);
        BASE64_URL_SAFE_NO_PAD.encode(&result)
    }

    pub fn decrypt(encoded: &str) -> Result<String, &'static str> {
        let data = BASE64_URL_SAFE_NO_PAD
            .decode(encoded)
            .map_err(|_| "invalid base64")?;
        if data.len() < NONCE_LEN + AES_256_GCM.tag_len() {
            return Err("ciphertext too short");
        }

        let (nonce_bytes, ciphertext_and_tag) = data.split_at(NONCE_LEN);
        let nonce = Nonce::try_assume_unique_for_key(nonce_bytes).map_err(|_| "invalid nonce")?;
        let key = derive_key();

        let mut buf = ciphertext_and_tag.to_vec();
        let plaintext = key
            .open_in_place(nonce, Aad::empty(), &mut buf)
            .map_err(|_| "decryption failed")?;
        String::from_utf8(plaintext.to_vec()).map_err(|_| "invalid utf8")
    }

    pub fn serialize_token<S>(value: &Option<String>, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        match value {
            Some(plaintext) => serializer.serialize_some(&encrypt(plaintext)),
            None => serializer.serialize_none(),
        }
    }

    pub fn deserialize_token<'de, D>(deserializer: D) -> Result<Option<String>, D::Error>
    where
        D: serde::Deserializer<'de>,
    {
        use serde::Deserialize;
        let opt: Option<String> = Option::deserialize(deserializer)?;
        match opt {
            Some(encoded) => match decrypt(&encoded) {
                Ok(plaintext) => Ok(Some(plaintext)),
                Err(_) => Ok(Some(encoded)),
            },
            None => Ok(None),
        }
    }
}

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
    #[serde(
        serialize_with = "token_cipher::serialize_token",
        deserialize_with = "token_cipher::deserialize_token"
    )]
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
            let expiry = now
                + std::time::Duration::from_secs(
                    u64::from(self.token_expiry_days) * SECONDS_PER_DAY,
                );
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
            let expiry = now
                + std::time::Duration::from_secs(
                    u64::from(self.token_expiry_days) * SECONDS_PER_DAY,
                );
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

    /// Returns a JSON value with the bearer token replaced by a redacted version,
    /// suitable for sending to the frontend.
    pub fn to_redacted_value(&self) -> Result<serde_json::Value, serde_json::Error> {
        let mut value = serde_json::to_value(self)?;
        if let Some(obj) = value.as_object_mut() {
            if obj.get("bearer_token").and_then(|v| v.as_str()).is_some() {
                obj.insert(
                    "bearer_token_redacted".to_string(),
                    serde_json::Value::String(self.redacted_token().unwrap_or_default()),
                );
            }
            obj.remove("bearer_token");
        }
        Ok(value)
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
