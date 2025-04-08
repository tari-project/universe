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

use anyhow::Ok;
use getset::{Getters, Setters};
use semver::Version;
use serde::{Deserialize, Serialize};
use std::{ops::Deref, str::FromStr, sync::LazyLock, time::SystemTime};
use tari_common::configuration::Network;
use tauri::{AppHandle, Manager};
use tokio::sync::RwLock;

use crate::{
    app_config::AirdropTokens, internal_wallet::generate_password, AppConfig, UniverseAppState,
};

use super::trait_config::{ConfigContentImpl, ConfigImpl};

static INSTANCE: LazyLock<RwLock<ConfigCore>> = LazyLock::new(|| RwLock::new(ConfigCore::new()));
#[allow(clippy::struct_excessive_bools)]
#[derive(Serialize, Deserialize, Clone)]
#[serde(rename_all = "snake_case")]
#[serde(default)]
#[derive(Getters, Setters)]
#[getset(get = "pub", set = "pub")]
pub struct ConfigCoreContent {
    was_config_migrated: bool,
    created_at: SystemTime,
    is_p2pool_enabled: bool,
    use_tor: bool,
    allow_telemetry: bool,
    last_binaries_update_timestamp: SystemTime,
    anon_id: String,
    should_auto_launch: bool,
    mmproxy_use_monero_failover: bool,
    mmproxy_monero_nodes: Vec<String>,
    auto_update: bool,
    p2pool_stats_server_port: Option<u16>,
    pre_release: bool,
    last_changelog_version: Version,
    airdrop_tokens: Option<AirdropTokens>,
    remote_base_node_address: String,
}

impl Default for ConfigCoreContent {
    fn default() -> Self {
        let remote_base_node_address = format!(
            "https://grpc.{}.tari.com:443",
            Network::get_current_or_user_setting_or_default().as_key_str()
        );

        Self {
            was_config_migrated: false,
            created_at: SystemTime::now(),
            is_p2pool_enabled: true,
            use_tor: true,
            allow_telemetry: true,
            last_binaries_update_timestamp: SystemTime::now(),
            anon_id: generate_password(20),
            should_auto_launch: false,
            mmproxy_use_monero_failover: false,
            mmproxy_monero_nodes: vec![],
            auto_update: false,
            p2pool_stats_server_port: None,
            pre_release: false,
            last_changelog_version: Version::new(0, 0, 0),
            airdrop_tokens: None,
            remote_base_node_address,
        }
    }
}
impl ConfigContentImpl for ConfigCoreContent {}

pub struct ConfigCore {
    content: ConfigCoreContent,
    app_handle: RwLock<Option<AppHandle>>,
}

impl ConfigImpl for ConfigCore {
    type Config = ConfigCoreContent;
    type OldConfig = AppConfig;

    fn current() -> &'static RwLock<Self> {
        &INSTANCE
    }

    fn new() -> Self {
        Self {
            content: ConfigCore::_load_config().unwrap_or_default(),
            app_handle: RwLock::new(None),
        }
    }

    async fn _send_telemetry_event(
        &self,
        event_name: &str,
        event_data: serde_json::Value,
    ) -> Result<(), anyhow::Error> {
        if let Some(app_handle) = self.app_handle.read().await.deref() {
            let app_state = app_handle.state::<UniverseAppState>();
            app_state
                .telemetry_service
                .read()
                .await
                .send(event_name.to_string(), event_data)
                .await?;
        }
        Ok(())
    }

    async fn load_app_handle(&mut self, app_handle: AppHandle) {
        *self.app_handle.write().await = Some(app_handle);
    }

    fn _get_name() -> String {
        "core_config".to_string()
    }

    fn _get_content(&self) -> &Self::Config {
        &self.content
    }

    fn _get_content_mut(&mut self) -> &mut Self::Config {
        &mut self.content
    }

    fn migrate_old_config(&mut self, old_config: Self::OldConfig) {
        if self.content.was_config_migrated {
            return;
        }

        self.content = ConfigCoreContent {
            was_config_migrated: true,
            created_at: SystemTime::now(),
            is_p2pool_enabled: old_config.p2pool_enabled(),
            use_tor: old_config.use_tor(),
            allow_telemetry: old_config.allow_telemetry(),
            last_binaries_update_timestamp: old_config.last_binaries_update_timestamp(),
            anon_id: old_config.anon_id().to_string(),
            should_auto_launch: old_config.should_auto_launch(),
            mmproxy_use_monero_failover: old_config.mmproxy_use_monero_fail(),
            mmproxy_monero_nodes: old_config.mmproxy_monero_nodes().to_vec(),
            auto_update: old_config.auto_update(),
            p2pool_stats_server_port: old_config.p2pool_stats_server_port(),
            pre_release: old_config.pre_release(),
            last_changelog_version: Version::from_str(old_config.last_changelog_version())
                .unwrap_or_else(|_| Version::new(0, 0, 0)),
            airdrop_tokens: old_config.airdrop_tokens(),
            ..Default::default()
        };
    }
}
