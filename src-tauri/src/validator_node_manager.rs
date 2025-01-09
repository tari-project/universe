use std::path::PathBuf;
use std::sync::Arc;
use std::time::Duration;

use futures_util::future::FusedFuture;
use log::warn;
use tari_shutdown::ShutdownSignal;
use tokio::sync::RwLock;
use tokio::time::sleep;

use crate::port_allocator::PortAllocator;
use crate::process_watcher::ProcessWatcher;
use crate::validator_node_adapter::ValidatorNodeAdapter;

const LOG_TARGET: &str = "tari::universe::validator_node_manager";

/**
 * FULL CONFIG FROM TARI-DAN REPO
#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(deny_unknown_fields)]
#[allow(clippy::struct_excessive_bools)]
pub struct ValidatorNodeConfig {
    override_from: Option<String>,
    pub shard_key_file: PathBuf,
    /// A path to the file that stores your node identity and secret key
    pub identity_file: PathBuf,
    //// The node's publicly-accessible hostname
    // pub public_address: Option<Multiaddr>,
    /// The Tari base node's GRPC URL
    pub base_node_grpc_url: Option<Url>,
    /// If set to false, there will be no base layer scanning at all
    pub scan_base_layer: bool,
    /// How often do we want to scan the base layer for changes
    #[serde(with = "serializers::seconds")]
    pub base_layer_scanning_interval: Duration,
    /// The relative path to store persistent data
    pub data_dir: PathBuf,
    /// The p2p configuration settings
    pub p2p: P2pConfig,
    /// P2P RPC configuration
    pub rpc: RpcConfig,
    /// GRPC address of the validator node  application
    pub grpc_address: Option<Multiaddr>,
    /// JSON-RPC address of the validator node  application
    pub json_rpc_listener_address: Option<SocketAddr>,
    /// The jrpc address where the UI should connect (it can be the same as the json_rpc_address, but doesn't have to
    /// be), if this will be None, then the listen_addr will be used.
    pub json_rpc_public_address: Option<String>,
    /// The address of the HTTP UI
    pub http_ui_listener_address: Option<SocketAddr>,
    /// Template config
    pub templates: TemplateConfig,
    /// Fee claim public key
    pub fee_claim_public_key: RistrettoPublicKey,
    /// Create identity file if not exists
    pub dont_create_id: bool,
    /// The (optional) sidechain to run this on
    pub validator_node_sidechain_id: Option<RistrettoPublicKey>,
    /// The templates sidechain id
    pub template_sidechain_id: Option<RistrettoPublicKey>,
    /// The burnt utxo sidechain id
    pub burnt_utxo_sidechain_id: Option<RistrettoPublicKey>,
    /// The path to store layer one transactions.
    pub layer_one_transaction_path: PathBuf,
}
 */

#[derive(Clone)]
pub struct ValidatorNodeConfig {
    pub base_path: String,
    pub json_rpc_address: String,
    pub json_rpc_public_address: String,
    pub grpc_port: u16,
    pub base_node_grpc_url: String,
    pub web_ui_address: String,
    pub base_layer_scanning_interval: u16,
}

pub struct ValidatorNodeConfigBuilder {
    config: ValidatorNodeConfig,
}

impl ValidatorNodeConfigBuilder {
    pub fn new() -> Self {
        Self {
            config: ValidatorNodeConfig::default(),
        }
    }

    pub fn with_base_node(&mut self, grpc_port: u16) -> &mut Self {
        self.config.base_node_grpc_url = format!("http://127.0.0.1:{}", grpc_port);
        self
    }

    pub fn with_base_path(&mut self, base_path: &PathBuf) -> &mut Self {
        self.config.base_path = base_path.to_string_lossy().to_string();
        self
    }

    pub fn build(&self) -> Result<ValidatorNodeConfig, anyhow::Error> {
        // TODO set proper values not hardcoded ones
        let jrpc_port = 18005;
        let web_ui_port = 18006;
        let grpc_port = PortAllocator::new().assign_port_with_fallback();
        Ok(ValidatorNodeConfig {
            base_path: self.config.base_path.clone(),
            json_rpc_address: format!("http://127.0.0.1:{}", jrpc_port),
            json_rpc_public_address: format!("http://127.0.0.1:{}", jrpc_port),
            base_node_grpc_url: self.config.base_node_grpc_url.clone(),
            web_ui_address: format!("http://127.0.0.1:{}", web_ui_port),
            base_layer_scanning_interval: 1,
            grpc_port,
        })
    }
}

impl ValidatorNodeConfig {
    pub fn builder() -> ValidatorNodeConfigBuilder {
        ValidatorNodeConfigBuilder::new()
    }
}

impl Default for ValidatorNodeConfig {
    fn default() -> Self {
        //TODO SET DEFAULT
        Self {
            base_path: String::from(""),
            json_rpc_address: String::from("http://127.0.0.1:18200"),
            json_rpc_public_address: String::from("http://127.0.0.1:19000"),
            base_node_grpc_url: String::from("http://127.0.0.1:18142"),
            web_ui_address: String::from("http://127.0.0.1:5001"),
            base_layer_scanning_interval: 10,
            grpc_port: 18144,
        }
    }
}

impl Clone for ValidatorNodeManager {
    fn clone(&self) -> Self {
        Self {
            watcher: self.watcher.clone(),
        }
    }
}

pub struct ValidatorNodeManager {
    watcher: Arc<RwLock<ProcessWatcher<ValidatorNodeAdapter>>>,
}

impl ValidatorNodeManager {
    pub fn new() -> Self {
        let adapter = ValidatorNodeAdapter::new();
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
        config: ValidatorNodeConfig,
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
                crate::binaries::Binaries::TariValidatorNode,
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
                    warn!(target: LOG_TARGET, "ValidatorNode stats not available yet");
                }
            } // wait until we have stats from validatorNode, so its started
        }
        Ok(())
    }

    pub async fn stop(&self) -> Result<i32, anyhow::Error> {
        let mut process_watcher = self.watcher.write().await;
        let exit_code = process_watcher.stop().await?;
        if exit_code != 0 {
            warn!(target: LOG_TARGET, "ValidatorNode process exited with code {}", exit_code);
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
