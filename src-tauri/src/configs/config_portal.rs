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
use serde::{Deserialize, Serialize};
use std::{sync::LazyLock, time::SystemTime};
use tauri::AppHandle;
use tokio::sync::RwLock;

use crate::events_manager::EventsManager;

use super::trait_config::{ConfigContentImpl, ConfigImpl};

static INSTANCE: LazyLock<RwLock<ConfigPortal>> =
    LazyLock::new(|| RwLock::new(ConfigPortal::new()));
#[allow(clippy::struct_excessive_bools)]
#[derive(Serialize, Deserialize, Clone)]
#[serde(rename_all = "snake_case")]
#[serde(default)]
#[derive(Getters, Setters)]
#[getset(get = "pub", set = "pub")]
pub struct ConfigPortalContent {
    created_at: SystemTime,
    /// The unique identifier of the SDK instance
    id: String,
    /// Name of local Level DB
    level_db_name: String,
    /// Portal chain config
    portal: EthereumChainConfig,
    native_chains: NativeChainsConfig,
    grpc_web_wallet: GrpcWebWalletConfig,
}

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq)]
pub struct EthereumChainConfig {
    pub id: u32,
    pub name: String,
    pub native_currency: NativeCurrencyConfig,
    pub rpc_urls: RpcUrlsConfig,
}

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq)]
pub struct NativeCurrencyConfig {
    pub decimals: u32,
    pub name: String,
    pub symbol: String,
}

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq)]
pub struct RpcUrlsConfig {
    pub http: String,
    pub websocket: String,
}

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq)]
pub struct NativeChainsConfig {
    pub ethereum: EthereumChainConfig,
    pub lightning: LightningChainConfig,
}

impl Default for NativeChainsConfig {
    fn default() -> Self {
        Self {
            ethereum: EthereumChainConfig {
                id: 1333,
                name: "localhost".to_owned(),
                native_currency: NativeCurrencyConfig {
                    decimals: 18,
                    name: "Ether".to_owned(),
                    symbol: "ETH".to_owned(),
                },
                rpc_urls: RpcUrlsConfig {
                    http: "TODO_HTTP_URL".to_owned(),
                    websocket: "TODO_WEBSOCKET_URL".to_owned(),
                },
            },
            lightning: Default::default(),
        }
    }
}

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq)]
pub struct LightningChainConfig {
    /// Hub address
    pub hub_id: String,
    pub hub_socket: String,
    /// RPC url
    pub url: String,
    /// Path to TLS Cert
    pub path_tls_cert: String,
    /// Path to Macaroon
    pub path_macaroon: String,
}

impl Default for LightningChainConfig {
    fn default() -> Self {
        Self {
            hub_id: "TODO_HUB_ID".to_owned(),
            hub_socket: "TODO_HUB_SOCKET".to_owned(),
            url: "TODO_URL".to_owned(),
            path_tls_cert: "TODO_PATH_TLS_CERT".to_owned(),
            path_macaroon: "TODO_MACAROON".to_owned(),
        }
    }
}

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq)]
pub struct GrpcWebWalletConfig {
    pub grpc_web_port: u16,
}

impl Default for GrpcWebWalletConfig {
    fn default() -> Self {
        Self {
            grpc_web_port: 28183,
        }
    }
}

impl Default for ConfigPortalContent {
    fn default() -> Self {
        Self {
            created_at: SystemTime::now(),
            id: "tari-universe".to_owned(),
            level_db_name: "portal-level-db".to_owned(),
            portal: EthereumChainConfig {
                id: 7070,
                name: "portalchain".to_owned(),
                native_currency: NativeCurrencyConfig {
                    decimals: 18,
                    name: "Xport".to_owned(),
                    symbol: "XPORT".to_owned(),
                },
                rpc_urls: RpcUrlsConfig {
                    http: "TODO_HTTP_URL".to_owned(),
                    websocket: "TODO_WEBSOCKET_URL".to_owned(),
                },
            },
            native_chains: Default::default(),
            grpc_web_wallet: Default::default(),
        }
    }
}
impl ConfigContentImpl for ConfigPortalContent {}

pub struct ConfigPortal {
    content: ConfigPortalContent,
    app_handle: RwLock<Option<AppHandle>>,
}

impl ConfigPortal {
    pub async fn initialize(app_handle: AppHandle) {
        let mut config = Self::current().write().await;
        config.load_app_handle(app_handle.clone()).await;

        EventsManager::handle_config_portal_loaded(&app_handle, config.content.clone()).await;
    }
}

impl ConfigImpl for ConfigPortal {
    type Config = ConfigPortalContent;
    type OldConfig = ();

    fn current() -> &'static RwLock<Self> {
        &INSTANCE
    }

    fn new() -> Self {
        Self {
            content: ConfigPortal::_load_or_create(),
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
        "config_portal".to_string()
    }

    fn _get_content(&self) -> &Self::Config {
        &self.content
    }

    fn _get_content_mut(&mut self) -> &mut Self::Config {
        &mut self.content
    }

    fn handle_old_config_migration(&mut self, _old_config: Option<Self::OldConfig>) {}
}
