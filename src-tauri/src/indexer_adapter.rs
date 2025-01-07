use anyhow::anyhow;
use anyhow::Error;
use async_trait::async_trait;
use log::{debug, info, warn};
use std::collections::HashMap;
use std::path::PathBuf;
use tari_common::configuration::Network;
use tari_shutdown::Shutdown;

use crate::process_adapter::HealthStatus;
use crate::process_adapter::ProcessStartupSpec;
use crate::process_adapter::{ProcessAdapter, ProcessInstance, StatusMonitor};
use crate::utils::file_utils::convert_to_string;

use crate::indexer_manager::IndexerConfig;
#[cfg(target_os = "windows")]
use crate::utils::setup_utils::setup_utils::add_firewall_rule;

const LOG_TARGET: &str = "tari::universe::indexer_adapter";

pub struct IndexerAdapter {
    pub(crate) config: Option<IndexerConfig>,
}

impl IndexerAdapter {
    pub fn new() -> Self {
        Self { config: None }
    }

    #[allow(dead_code)]
    pub fn config(&self) -> Option<&IndexerConfig> {
        self.config.as_ref()
    }
}

impl ProcessAdapter for IndexerAdapter {
    type StatusMonitor = IndexerStatusMonitor;

    fn spawn_inner(
        &self,
        data_dir: PathBuf,
        _config_dir: PathBuf,
        log_path: PathBuf,
        binary_version_path: PathBuf,
    ) -> Result<(ProcessInstance, Self::StatusMonitor), Error> {
        let inner_shutdown = Shutdown::new();

        info!(target: LOG_TARGET, "Starting validator node");

        let working_dir = data_dir.join("sha-indexer");
        std::fs::create_dir_all(&working_dir).unwrap_or_else(|error| {
            warn!(target: LOG_TARGET, "Could not create indexer working directory - {}", error);
        });

        if self.config.is_none() {
            return Err(anyhow!("IndexerAdapter config is not set"));
        }
        let config = self
            .config
            .as_ref()
            .ok_or_else(|| anyhow!("IndexerAdapter config is not set"))?;
        let log_path_string = convert_to_string(log_path.join("sha-indexer"))?;
        let network = Network::get_current_or_user_setting_or_default();

        let args: Vec<String> = vec![
            "start".to_string(),
            "-b".to_string(),
            config.base_path.to_string(),
            "--network".to_string(),
            network.to_string(),
            format!("-pindexer.base_node_grpc_url={}", config.base_node_grpc_url),
            format!("-pindexer.json_rpc_address={}", config.json_rpc_address),
            format!("-pindexer.http_ui_address={}", config.web_ui_address),
            format!(
                "-pindexer.ui_connect_address={}",
                config.json_rpc_public_address
            ),
            format!(
                "-pindexer.base_layer_scanning_interval={}",
                config.base_layer_scanning_interval
            ),
        ];
        let pid_file_name = self.pid_file_name().to_string();

        let mut envs = HashMap::new();
        match Network::get_current_or_user_setting_or_default() {
            Network::Esmeralda => {
                envs.insert("TARI_NETWORK".to_string(), "esmeralda".to_string());
            }
            Network::NextNet => {
                envs.insert("TARI_NETWORK".to_string(), "nextnet".to_string());
            }
            _ => {
                return Err(anyhow!("Unsupported network"));
            }
        };

        #[cfg(target_os = "windows")]
        add_firewall_rule("sha_indexer.exe".to_string(), binary_version_path.clone())?;

        debug!(target: LOG_TARGET, "🚀 Tari Indexer args {:?}", &args);

        Ok((
            ProcessInstance {
                shutdown: inner_shutdown,
                handle: None,
                startup_spec: ProcessStartupSpec {
                    file_path: binary_version_path,
                    envs: Some(envs),
                    args,
                    data_dir,
                    pid_file_name,
                    name: self.name().to_string(),
                },
            },
            IndexerStatusMonitor::new(config.grpc_port),
        ))
    }

    fn name(&self) -> &str {
        "indexer"
    }

    fn pid_file_name(&self) -> &str {
        "indexer_pid"
    }
}

#[derive(Clone)]
pub struct IndexerStatusMonitor {
    grpc_port: u16,
}

impl IndexerStatusMonitor {
    pub fn new(port: u16) -> Self {
        Self { grpc_port: port }
    }
    pub async fn get_identity(&self) -> Result<(), Error> {
        //TODO
        Ok(())
    }
}

#[async_trait]
impl StatusMonitor for IndexerStatusMonitor {
    async fn check_health(&self) -> HealthStatus {
        if self.get_identity().await.is_ok() {
            HealthStatus::Healthy
        } else {
            HealthStatus::Unhealthy
        }
    }
}

impl IndexerStatusMonitor {
    pub async fn status(&self) -> Result<u16, Error> {
        Ok(self.grpc_port) //TODO
    }
}
