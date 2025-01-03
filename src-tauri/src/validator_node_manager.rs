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

#[derive(Clone)]
pub struct ValidatorNodeConfig {
    pub grpc_port: u16,
    pub stats_server_port: u16,
    pub base_node_address: String,
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
        self.config.base_node_address = format!("http://127.0.0.1:{}", grpc_port);
        self
    }

    pub fn build(&self) -> Result<ValidatorNodeConfig, anyhow::Error> {
        let grpc_port = PortAllocator::new().assign_port_with_fallback();
        let stats_server_port = PortAllocator::new().assign_port_with_fallback();
        Ok(ValidatorNodeConfig {
            grpc_port,
            stats_server_port,
            base_node_address: self.config.base_node_address.clone(),
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
        Self {
            grpc_port: 18145,
            stats_server_port: 19000,
            base_node_address: String::from("http://127.0.0.1:18142"),
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
