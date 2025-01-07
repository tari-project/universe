use std::net::SocketAddr;
use std::path::PathBuf;
use std::sync::Arc;
use std::time::Duration;

use futures_util::future::FusedFuture;
use log::warn;
use tari_shutdown::ShutdownSignal;
use tauri::Url;
use tokio::sync::RwLock;
use tokio::time::sleep;

use serde::{Deserialize, Serialize};

use crate::indexer_adapter::IndexerAdapter;
use crate::port_allocator::PortAllocator;
use crate::process_watcher::ProcessWatcher;

const LOG_TARGET: &str = "tari::universe::validator_node_manager";

/**
 * FULL CONFIG FROM TARI-DAN REPO
#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(deny_unknown_fields)]
#[allow(clippy::struct_excessive_bools)]
pub struct IndexerConfig {
    override_from: Option<String>,
    /// A path to the file that stores your node identity and secret key
    pub identity_file: PathBuf,
    /// A path to the file that stores the tor hidden service private key, if using the tor transport
    pub tor_identity_file: PathBuf,
    /// The Tari base node's GRPC URL (e.g. http://localhost:18142)
    pub base_node_grpc_url: Option<Url>,
    /// How often do we want to scan the base layer for changes
    #[serde(with = "serializers::seconds")]
    pub base_layer_scanning_interval: Duration,
    /// The relative path to store persistent data
    pub data_dir: PathBuf,
    /// The p2p configuration settings
    pub p2p: P2pConfig,
    /// JSON-RPC address of the indexer application
    pub json_rpc_address: Option<SocketAddr>,
    /// GraphQL port of the indexer application
    pub graphql_address: Option<SocketAddr>,
    /// The address of the HTTP UI
    pub http_ui_address: Option<SocketAddr>,
    /// The jrpc address where the UI should connect (it can be the same as the json_rpc_address, but doesn't have to
    /// be), if this will be None, then the listen_addr will be used.
    pub ui_connect_address: Option<String>,
    /// How often do we want to scan the second layer for new versions
    #[serde(with = "serializers::seconds")]
    pub dan_layer_scanning_internal: Duration,
    /// Template config
    pub templates: TemplateConfig,
    /// The sidechain to listen on.
    pub sidechain_id: Option<RistrettoPublicKey>,
    /// The templates sidechain id
    pub templates_sidechain_id: Option<RistrettoPublicKey>,
    /// The burnt utxos sidechain id
    pub burnt_utxo_sidechain_id: Option<RistrettoPublicKey>,
    /// The event filtering configuration
    pub event_filters: Vec<EventFilterConfig>,
}
 */

#[derive(Clone)]
pub struct IndexerConfig {
    pub base_path: String,
    pub json_rpc_address: String,
    pub json_rpc_public_address: String,
    pub grpc_port: u16,
    pub base_node_grpc_url: String,
    pub web_ui_address: String,
    pub base_layer_scanning_interval: u16,
}

pub struct IndexerConfigBuilder {
    config: IndexerConfig,
}

impl IndexerConfigBuilder {
    pub fn new() -> Self {
        Self {
            config: IndexerConfig::default(),
        }
    }

    pub fn with_base_node(&mut self, jrpc_port: u16) -> &mut Self {
        self.config.json_rpc_address = format!("http://127.0.0.1:{}", jrpc_port);
        self.config.json_rpc_public_address = format!("http://127.0.0.1:{}", jrpc_port);
        self
    }

    pub fn build(&self) -> Result<IndexerConfig, anyhow::Error> {
        let jrpc_port = PortAllocator::new().assign_port_with_fallback();
        let web_ui_port = PortAllocator::new().assign_port_with_fallback();
        let grpc_port = PortAllocator::new().assign_port_with_fallback();
        let stats_server_port = PortAllocator::new().assign_port_with_fallback();
        // TODO set proper values - below is just random test
        Ok(IndexerConfig {
            base_path: self.config.base_path.clone(),
            json_rpc_address: format!("http://127.0.0.1:{}", jrpc_port),
            json_rpc_public_address: format!("http://127.0.0.1:{}", jrpc_port),
            base_node_grpc_url: format!("/ip4/127.0.0.1/tcp/{}", grpc_port),
            web_ui_address: format!("http://127.0.0.1:{}", web_ui_port),
            base_layer_scanning_interval: 1,
            grpc_port,
        })
    }
}

impl IndexerConfig {
    pub fn builder() -> IndexerConfigBuilder {
        IndexerConfigBuilder::new()
    }
}

impl Default for IndexerConfig {
    fn default() -> Self {
        //TODO SET DEFAULT
        Self {
            base_path: String::from(""),
            json_rpc_address: String::from("http://127.0.0.1:18300"),
            json_rpc_public_address: String::from("http://127.0.0.1:19000"),
            base_node_grpc_url: String::from("http://127.0.0.1:18142"),
            web_ui_address: String::from("http://127.0.0.1:15000"),
            base_layer_scanning_interval: 10,
            grpc_port: 18144,
        }
    }
}

impl Clone for IndexerManager {
    fn clone(&self) -> Self {
        Self {
            watcher: self.watcher.clone(),
        }
    }
}

pub struct IndexerManager {
    watcher: Arc<RwLock<ProcessWatcher<IndexerAdapter>>>,
}

impl IndexerManager {
    pub fn new() -> Self {
        let adapter = IndexerAdapter::new();
        let process_watcher = ProcessWatcher::new(adapter);

        Self {
            watcher: Arc::new(RwLock::new(process_watcher)),
        }
    }

    pub async fn is_running(&self) -> bool {
        let process_watcher = self.watcher.read().await;
        process_watcher.is_running()
    }

    pub async fn is_pid_file_exists(&self, base_path: PathBuf) -> bool {
        let lock = self.watcher.read().await;
        lock.is_pid_file_exists(base_path)
    }

    pub async fn ensure_started(
        &self,
        app_shutdown: ShutdownSignal,
        config: IndexerConfig,
        base_path: PathBuf,
        config_path: PathBuf,
        log_path: PathBuf,
    ) -> Result<(), anyhow::Error> {
        let mut process_watcher = self.watcher.write().await;

        process_watcher.adapter.config = Some(config);
        process_watcher.health_timeout = Duration::from_secs(28);
        process_watcher.poll_time = Duration::from_secs(30);
        process_watcher
            .start(
                app_shutdown.clone(),
                base_path,
                config_path,
                log_path,
                crate::binaries::Binaries::TariIndexer,
            )
            .await?;
        process_watcher.wait_ready().await?;
        if let Some(status_monitor) = &process_watcher.status_monitor {
            loop {
                if app_shutdown.is_terminated() || app_shutdown.is_triggered() {
                    break;
                }
                sleep(Duration::from_secs(5)).await;
                if let Ok(_stats) = status_monitor.status().await {
                    break;
                } else {
                    warn!(target: LOG_TARGET, "Indexer stats not available yet");
                }
            } // wait until we have stats from Indexer, so its started
        }
        Ok(())
    }

    pub async fn stop(&self) -> Result<i32, anyhow::Error> {
        let mut process_watcher = self.watcher.write().await;
        let exit_code = process_watcher.stop().await?;
        if exit_code != 0 {
            warn!(target: LOG_TARGET, "Indexer process exited with code {}", exit_code);
        }
        Ok(exit_code)
    }

    pub async fn grpc_port(&self) -> u16 {
        let process_watcher = self.watcher.read().await;
        process_watcher
            .adapter
            .config
            .as_ref()
            .map(|c| c.grpc_port)
            .unwrap_or_default()
    }
}
