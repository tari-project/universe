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

use getset::{Getters, Setters};
use semver::Version;
use serde::{Deserialize, Serialize};
use std::{sync::LazyLock, time::SystemTime};
use tari_common::configuration::Network;
use tauri::AppHandle;
use tokio::sync::RwLock;

use crate::app_in_memory_config::DEFAULT_EXCHANGE_ID;
use crate::events_emitter::EventsEmitter;
use crate::node::node_manager::NodeType;
use crate::{ab_test_selector::ABTestSelector, internal_wallet::generate_password};

use super::trait_config::{ConfigContentImpl, ConfigImpl};

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq)]
pub struct AirdropTokens {
    pub token: String,
    pub refresh_token: String,
}

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
    allow_notifications: bool,
    last_binaries_update_timestamp: SystemTime,
    anon_id: String,
    ab_group: ABTestSelector,
    should_auto_launch: bool,
    mmproxy_use_monero_failover: bool,
    mmproxy_monero_nodes: Vec<String>,
    auto_update: bool,
    p2pool_stats_server_port: Option<u16>,
    pre_release: bool,
    last_changelog_version: Version,
    airdrop_tokens: Option<AirdropTokens>,
    remote_base_node_address: String,
    node_type: NodeType,
    exchange_id: String,
}

fn default_monero_nodes() -> Vec<String> {
    vec![
        "https://xmr-01.tari.com".to_string(),
        "https://xmr-lim.tari.com".to_string(),
        "https://xmr-gra.tari.com".to_string(),
        "https://xmr-bhs.tari.com".to_string(),
    ]
}

impl Default for ConfigCoreContent {
    fn default() -> Self {
        let network = Network::get_current_or_user_setting_or_default();
        let remote_base_node_address = match network {
            Network::MainNet => "https://grpc.tari.com:443".to_string(),
            _ => {
                format!("https://grpc.{}.tari.com:443", network.as_key_str())
            }
        };
        let anon_id = generate_password(20);
        let ab_test_selector = anon_id
            .chars()
            .nth(0)
            .map(|c| {
                if (c as u32) % 2 == 0 {
                    ABTestSelector::GroupA
                } else {
                    ABTestSelector::GroupB
                }
            })
            .unwrap_or(ABTestSelector::GroupA);

        Self {
            was_config_migrated: false,
            created_at: SystemTime::now(),
            is_p2pool_enabled: true,
            use_tor: true,
            allow_telemetry: true,
            allow_notifications: false,
            last_binaries_update_timestamp: SystemTime::now(),
            anon_id,
            ab_group: ab_test_selector,
            should_auto_launch: false,
            mmproxy_use_monero_failover: false,
            mmproxy_monero_nodes: default_monero_nodes(),
            auto_update: true,
            p2pool_stats_server_port: None,
            pre_release: false,
            last_changelog_version: Version::new(0, 0, 0),
            airdrop_tokens: None,
            remote_base_node_address,
            node_type: NodeType::Local,
            exchange_id: DEFAULT_EXCHANGE_ID.to_string(),
        }
    }
}
impl ConfigContentImpl for ConfigCoreContent {}

pub struct ConfigCore {
    content: ConfigCoreContent,
    app_handle: RwLock<Option<AppHandle>>,
}

impl ConfigCore {
    pub async fn initialize(app_handle: AppHandle) {
        let mut config = Self::current().write().await;
        config.load_app_handle(app_handle.clone()).await;

        EventsEmitter::emit_core_config_loaded(config.content.clone()).await;
    }
}

impl ConfigImpl for ConfigCore {
    type Config = ConfigCoreContent;

    fn current() -> &'static RwLock<Self> {
        &INSTANCE
    }

    fn new() -> Self {
        Self {
            content: ConfigCore::_load_or_create(),
            app_handle: RwLock::new(None),
        }
    }

    async fn _get_app_handle(&self) -> Option<AppHandle> {
        self.app_handle.read().await.clone()
    }

    async fn load_app_handle(&mut self, app_handle: AppHandle) {
        *self.app_handle.write().await = Some(app_handle);
    }

    fn _get_name() -> String {
        "config_core".to_string()
    }

    fn _get_content(&self) -> &Self::Config {
        &self.content
    }

    fn _get_content_mut(&mut self) -> &mut Self::Config {
        &mut self.content
    }
}
