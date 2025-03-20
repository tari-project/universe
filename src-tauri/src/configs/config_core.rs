use std::{
    sync::{LazyLock, Mutex},
    time::SystemTime,
};

use serde::{Deserialize, Serialize};

use crate::{app_config::AirdropTokens, AppConfig};

use super::trait_config::{ConfigContentImpl, ConfigImpl};

static INSTANCE: LazyLock<Mutex<ConfigCore>> = LazyLock::new(|| Mutex::new(ConfigCore::new()));

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
#[serde(default)]
pub struct ConfigCoreContent {
    created_at: SystemTime,
    is_p2pool_enabled: bool,
    use_tor: bool,
    allow_telemetry: bool,
    last_binaries_update_timestamp: Option<SystemTime>,
    anon_id: Option<String>,
    should_auto_launch: bool,
    mmproxy_use_monero_failover: bool,
    mmproxy_monero_nodes: Vec<String>,
    auto_update: bool,
    p2pool_stats_server_port: Option<u16>,
    pre_release: bool,
    last_changelog_version: Option<String>,
    airdrop_tokens: Option<AirdropTokens>,
}

impl Default for ConfigCoreContent {
    fn default() -> Self {
        Self {
            created_at: SystemTime::now(),
            is_p2pool_enabled: false,
            use_tor: false,
            allow_telemetry: true,
            last_binaries_update_timestamp: None,
            anon_id: None,
            should_auto_launch: false,
            mmproxy_use_monero_failover: false,
            mmproxy_monero_nodes: vec![],
            auto_update: true,
            p2pool_stats_server_port: None,
            pre_release: false,
            last_changelog_version: None,
            airdrop_tokens: None,
        }
    }
}
impl ConfigContentImpl for ConfigCoreContent {}

impl ConfigCoreContent {
    pub fn is_p2pool_enabled(&self) -> bool {
        self.is_p2pool_enabled
    }

    pub fn use_tor(&self) -> bool {
        self.use_tor
    }

    pub fn allow_telemetry(&self) -> bool {
        self.allow_telemetry
    }

    pub fn last_binaries_update_timestamp(&self) -> Option<SystemTime> {
        self.last_binaries_update_timestamp
    }

    pub fn anon_id(&self) -> Option<String> {
        self.anon_id.clone()
    }

    pub fn should_auto_launch(&self) -> bool {
        self.should_auto_launch
    }

    pub fn mmproxy_use_monero_fail(&self) -> bool {
        self.mmproxy_use_monero_failover
    }

    pub fn mmproxy_monero_nodes(&self) -> &[String] {
        &self.mmproxy_monero_nodes
    }

    pub fn auto_update(&self) -> bool {
        self.auto_update
    }

    pub fn p2pool_stats_server_port(&self) -> Option<u16> {
        self.p2pool_stats_server_port
    }

    pub fn pre_release(&self) -> bool {
        self.pre_release
    }

    pub fn last_changelog_version(&self) -> Option<String> {
        self.last_changelog_version.clone()
    }

    pub fn airdrop_tokens(&self) -> Option<&AirdropTokens> {
        self.airdrop_tokens.as_ref()
    }

    pub fn set_is_p2pool_enabled(&mut self, is_p2pool_enabled: bool) {
        self.is_p2pool_enabled = is_p2pool_enabled;
    }

    pub fn set_use_tor(&mut self, use_tor: bool) {
        self.use_tor = use_tor;
    }

    pub fn set_allow_telemetry(&mut self, allow_telemetry: bool) {
        self.allow_telemetry = allow_telemetry;
    }

    pub fn set_last_binaries_update_timestamp(
        &mut self,
        last_binaries_update_timestamp: Option<SystemTime>,
    ) {
        self.last_binaries_update_timestamp = last_binaries_update_timestamp;
    }

    pub fn set_anon_id(&mut self, anon_id: Option<String>) {
        self.anon_id = anon_id;
    }

    pub fn set_should_auto_launch(&mut self, should_auto_launch: bool) {
        self.should_auto_launch = should_auto_launch;
    }

    pub fn set_mmproxy_use_monero_fail(&mut self, mmproxy_use_monero_failover: bool) {
        self.mmproxy_use_monero_failover = mmproxy_use_monero_failover;
    }

    pub fn set_mmproxy_monero_nodes(&mut self, mmproxy_monero_nodes: Vec<String>) {
        self.mmproxy_monero_nodes = mmproxy_monero_nodes;
    }

    pub fn set_auto_update(&mut self, auto_update: bool) {
        self.auto_update = auto_update;
    }

    pub fn set_p2pool_stats_server_port(&mut self, p2pool_stats_server_port: Option<u16>) {
        self.p2pool_stats_server_port = p2pool_stats_server_port;
    }

    pub fn set_pre_release(&mut self, pre_release: bool) {
        self.pre_release = pre_release;
    }

    pub fn set_last_changelog_version(&mut self, last_changelog_version: Option<String>) {
        self.last_changelog_version = last_changelog_version;
    }

    pub fn set_airdrop_tokens(&mut self, airdrop_tokens: Option<AirdropTokens>) {
        self.airdrop_tokens = airdrop_tokens;
    }
}

pub struct ConfigCore {
    content: ConfigCoreContent,
}

impl ConfigImpl for ConfigCore {
    type Config = ConfigCoreContent;
    type OldConfig = AppConfig;

    fn current() -> &'static Mutex<Self> {
        &INSTANCE
    }

    fn new() -> Self {
        Self {
            content: ConfigCoreContent::default(),
        }
    }

    fn get_name() -> String {
        "core_config".to_string()
    }

    fn get_content(&self) -> &Self::Config {
        &self.content
    }

    fn get_content_mut(&mut self) -> &mut Self::Config {
        &mut self.content
    }

    fn migrate_old_config(&mut self, old_config: Self::OldConfig) -> Result<(), anyhow::Error> {
        self.content = ConfigCoreContent {
            created_at: SystemTime::now(),
            is_p2pool_enabled: old_config.p2pool_enabled(),
            use_tor: old_config.use_tor(),
            allow_telemetry: old_config.allow_telemetry(),
            last_binaries_update_timestamp: Some(old_config.last_binaries_update_timestamp()),
            anon_id: Some(old_config.anon_id().to_string()),
            should_auto_launch: old_config.should_auto_launch(),
            mmproxy_use_monero_failover: old_config.mmproxy_use_monero_fail(),
            mmproxy_monero_nodes: old_config.mmproxy_monero_nodes().to_vec(),
            auto_update: old_config.auto_update(),
            p2pool_stats_server_port: old_config.p2pool_stats_server_port(),
            pre_release: old_config.pre_release(),
            last_changelog_version: Some(old_config.last_changelog_version().to_string()),
            airdrop_tokens: old_config.airdrop_tokens(),
        };
        Ok(())
    }
}
