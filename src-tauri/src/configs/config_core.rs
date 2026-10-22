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
use log::{error, warn};
use semver::Version;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::PathBuf;
use std::{sync::LazyLock, time::SystemTime};
use tari_common::configuration::Network;
use tauri::{AppHandle, Manager};
use tokio::sync::RwLock;
use url::Url;

use crate::LOG_TARGET_APP_LOGIC;
use crate::ab_test_selector::ABTestSelector;
use crate::app_in_memory_config::{DEFAULT_EXCHANGE_ID, MinerType};
use crate::event_scheduler::ScheduledEventInfo;
use crate::network_utils::NetworkExt;
use crate::node::node_manager::NodeType;
use crate::shutdown_manager::ShutdownMode;
use crate::utils::rand_utils;

use super::trait_config::{ConfigContentImpl, ConfigImpl};

#[derive(Serialize, Deserialize, Clone, PartialEq)]
pub struct AirdropTokens {
    pub token: String,
    pub refresh_token: String,
}

/// Manual `Debug` so the credentials can never be written to a log line or a
/// telemetry payload through a `{:?}` formatter. `Serialize`/`Deserialize` are
/// intentionally left untouched: the tokens still have to round-trip through
/// the config file and the frontend.
impl std::fmt::Debug for AirdropTokens {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("AirdropTokens")
            .field("token", &"[REDACTED]")
            .field("refresh_token", &"[REDACTED]")
            .finish()
    }
}

pub const CORE_CONFIG_VERSION: u32 = 0;
static INSTANCE: LazyLock<RwLock<ConfigCore>> = LazyLock::new(|| RwLock::new(ConfigCore::new()));
#[allow(clippy::struct_excessive_bools)]
#[derive(Serialize, Deserialize, Clone)]
#[serde(rename_all = "snake_case")]
#[serde(default)]
#[derive(Getters, Setters)]
#[getset(get = "pub", set = "pub")]
pub struct ConfigCoreContent {
    version_counter: u32,
    created_at: SystemTime,
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
    pre_release: bool,
    last_changelog_version: Version,
    airdrop_tokens: Option<AirdropTokens>,
    remote_base_node_address: String,
    node_type: NodeType,
    exchange_id: String,
    scheduler_events: HashMap<String, ScheduledEventInfo>,
    shutdown_mode: ShutdownMode,
    show_window_on_startup: bool,
    node_data_directory: Option<PathBuf>,
    /// User override for the indexer the Ootle (L2) wallet talks to. The network
    /// default is not persisted; `ootle_indexer_url()` resolves it at read time so a
    /// changed default reaches existing installs.
    #[getset(skip)]
    #[serde(deserialize_with = "deserialize_http_url")]
    ootle_indexer_url: Option<Url>,
}

fn default_ootle_indexer_url(network: Network) -> Option<Url> {
    match network {
        Network::Esmeralda => Url::parse("https://ootle-indexer-a.tari.com/").ok(),
        _ => None,
    }
}

/// Only http(s) reaches the SDK's REST client; anything else counts as unset.
fn http_only(url: Option<Url>) -> Option<Url> {
    url.filter(|u| {
        let ok = matches!(u.scheme(), "http" | "https");
        if !ok {
            warn!(target: LOG_TARGET_APP_LOGIC, "Ignoring ootle_indexer_url with scheme {:?}: only http and https are accepted", u.scheme());
        }
        ok
    })
}

fn resolve_ootle_indexer_url(stored: Option<Url>, network: Network) -> Option<Url> {
    http_only(stored).or_else(|| default_ootle_indexer_url(network))
}

/// Checks a user-entered indexer URL and returns the form the SDK needs: http(s) with
/// a host, no credentials, query or fragment, and a path ending in `/` because the
/// indexer client appends its routes to it as text. Any host goes, localhost included.
pub fn canonicalise_ootle_indexer_url(input: &str) -> Result<Url, anyhow::Error> {
    let mut url = Url::parse(input.trim()).map_err(|e| anyhow::anyhow!("{e}"))?;
    if !matches!(url.scheme(), "http" | "https") {
        anyhow::bail!(
            "scheme {:?} is not supported; use http or https",
            url.scheme()
        );
    }
    if url.host_str().is_none_or(str::is_empty) {
        anyhow::bail!("missing host");
    }
    if !url.username().is_empty() || url.password().is_some() {
        anyhow::bail!("userinfo (user:pass@) is not permitted");
    }
    if url.query().is_some() {
        anyhow::bail!("query strings are not permitted");
    }
    if url.fragment().is_some() {
        anyhow::bail!("fragments are not permitted");
    }
    if !url.path().ends_with('/') {
        let path = format!("{}/", url.path());
        url.set_path(&path);
    }
    Ok(url)
}

/// Defaults that have since been taken down. A copy of one in a config file is stale, not
/// a choice the user made, so it loads as unset and the current default applies.
const RETIRED_OOTLE_INDEXER_URLS: &[&str] = &["http://54.38.0.31:50124/"];

fn deserialize_http_url<'de, D: serde::Deserializer<'de>>(d: D) -> Result<Option<Url>, D::Error> {
    Ok(http_only(Option::<Url>::deserialize(d)?)
        .filter(|u| !RETIRED_OOTLE_INDEXER_URLS.contains(&u.as_str())))
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
            Network::LocalNet => "http://127.0.0.1:18142".to_string(),
            _ => {
                format!("https://grpc.{}.tari.com:443", network.as_key_str())
            }
        };
        let anon_id = rand_utils::get_rand_string(20);
        let ab_test_selector = anon_id
            .chars()
            .nth(0)
            .map(|c| {
                if (c as u32).is_multiple_of(2) {
                    ABTestSelector::GroupA
                } else {
                    ABTestSelector::GroupB
                }
            })
            .unwrap_or(ABTestSelector::GroupA);

        Self {
            version_counter: CORE_CONFIG_VERSION,
            created_at: SystemTime::now(),
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
            pre_release: false,
            last_changelog_version: Version::new(0, 0, 0),
            airdrop_tokens: None,
            remote_base_node_address,
            node_type: if network.is_solo_network() {
                NodeType::Local
            } else {
                NodeType::default()
            },
            exchange_id: DEFAULT_EXCHANGE_ID.to_string(),
            scheduler_events: HashMap::new(),
            shutdown_mode: ShutdownMode::Tasktray,
            show_window_on_startup: true,
            node_data_directory: None,
            ootle_indexer_url: None,
        }
    }
}
impl ConfigContentImpl for ConfigCoreContent {}
impl ConfigCoreContent {
    pub fn is_on_exchange_specific_variant(&self) -> bool {
        MinerType::from_str(&self.exchange_id).is_exchange_mode()
    }

    /// Sets the user override; None goes back to the network default.
    pub fn set_ootle_indexer_url(&mut self, url: Option<Url>) -> &mut Self {
        self.ootle_indexer_url = url;
        self
    }

    /// The stored override if it is http(s), else the network default.
    pub fn ootle_indexer_url(&self) -> Option<Url> {
        resolve_ootle_indexer_url(
            self.ootle_indexer_url.clone(),
            Network::get_current_or_user_setting_or_default(),
        )
    }
}

pub struct ConfigCore {
    content: ConfigCoreContent,
    app_handle: RwLock<Option<AppHandle>>,
}

impl ConfigCore {
    pub async fn initialize(app_handle: AppHandle) {
        let mut config = Self::current().write().await;
        config.load_app_handle(app_handle.clone()).await;

        if config.content.version_counter.eq(&0) && config.content.node_type.eq(&NodeType::Local) {
            config.content.node_type = NodeType::RemoteUntilLocal;
            config.content.version_counter = 1;
            let _unused = Self::_save_config(config._get_content().clone());
        };

        if config.content.node_data_directory.is_none()
            && let Ok(app_data_dir) = app_handle.path().app_local_data_dir().inspect_err(|e| {
                error!(target: LOG_TARGET_APP_LOGIC, "Could not load data dir {e}");
            })
        {
            config.content.node_data_directory = Some(app_data_dir);
            let _unused = Self::_save_config(config._get_content().clone());
        }
    }
    pub async fn update_node_data_directory(
        path: PathBuf,
    ) -> Result<Option<PathBuf>, anyhow::Error> {
        let previous_path = Self::content().await.node_data_directory;
        Self::update_field(ConfigCoreContent::set_node_data_directory, Some(path)).await?;
        Ok(previous_path)
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

    /// The copy handed out (and emitted to the frontend) carries the resolved
    /// indexer URL; the stored content keeps only the user override.
    async fn content() -> Self::Config {
        let mut content = Self::current().read().await.content.clone();
        content.ootle_indexer_url = content.ootle_indexer_url();
        content
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn only_esmeralda_has_a_default_ootle_indexer() {
        assert_eq!(
            default_ootle_indexer_url(Network::Esmeralda).map(String::from),
            Some("https://ootle-indexer-a.tari.com/".to_string())
        );
        for network in [
            Network::MainNet,
            Network::StageNet,
            Network::NextNet,
            Network::LocalNet,
            Network::Igor,
        ] {
            assert!(default_ootle_indexer_url(network).is_none(), "{network}");
        }
    }

    #[test]
    fn the_default_indexer_is_resolved_at_read_time_not_persisted() {
        let persisted = serde_json::to_value(ConfigCoreContent::default()).expect("json");
        assert!(persisted["ootle_indexer_url"].is_null());
        assert_eq!(
            resolve_ootle_indexer_url(None, Network::Esmeralda),
            default_ootle_indexer_url(Network::Esmeralda)
        );
        let custom = Url::parse("https://indexer.example:443").ok();
        assert_eq!(
            resolve_ootle_indexer_url(custom.clone(), Network::Esmeralda),
            custom
        );
    }

    #[test]
    fn indexer_urls_are_canonicalised() {
        let ok = |input: &str| {
            canonicalise_ootle_indexer_url(input)
                .map(String::from)
                .expect(input)
        };
        assert_eq!(ok("http://localhost:18300"), "http://localhost:18300/");
        assert_eq!(ok(" http://127.0.0.1:18300/ "), "http://127.0.0.1:18300/");
        assert_eq!(ok("https://indexer.example"), "https://indexer.example/");
        assert_eq!(ok("http://[::1]:18300"), "http://[::1]:18300/");
        assert_eq!(
            ok("https://proxy.example/ootle/indexer"),
            "https://proxy.example/ootle/indexer/"
        );
        for bad in [
            "",
            "localhost:18300",
            "ftp://indexer.example",
            "file:///etc/passwd",
            "http://user:pass@indexer.example",
            "http://indexer.example/?a=b",
            "http://indexer.example/#x",
        ] {
            assert!(canonicalise_ootle_indexer_url(bad).is_err(), "{bad}");
        }
    }

    #[test]
    fn a_non_http_indexer_url_is_treated_as_unset() {
        let file_url = Url::parse("file:///etc/passwd").ok();
        assert_eq!(
            resolve_ootle_indexer_url(file_url.clone(), Network::Esmeralda),
            default_ootle_indexer_url(Network::Esmeralda)
        );
        assert_eq!(resolve_ootle_indexer_url(file_url, Network::MainNet), None);

        let loaded: ConfigCoreContent =
            serde_json::from_str(r#"{"ootle_indexer_url":"file:///etc/passwd"}"#).expect("json");
        assert_eq!(loaded.ootle_indexer_url, None);
        let loaded: ConfigCoreContent =
            serde_json::from_str(r#"{"ootle_indexer_url":"http://localhost:18300"}"#)
                .expect("json");
        assert_eq!(
            loaded.ootle_indexer_url.map(String::from),
            Some("http://localhost:18300/".to_string())
        );
    }

    #[test]
    fn a_retired_default_indexer_loads_as_unset() {
        let loaded: ConfigCoreContent =
            serde_json::from_str(r#"{"ootle_indexer_url":"http://54.38.0.31:50124/"}"#)
                .expect("json");
        assert_eq!(loaded.ootle_indexer_url, None);
    }
}
