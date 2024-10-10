use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::Arc;
use std::time::Duration;

use anyhow::anyhow;
use log::{error, warn};
use tari_core::proof_of_work::PowAlgorithm;
use tari_shutdown::ShutdownSignal;
use tokio::sync::RwLock;
use tokio::time::sleep;

use crate::network_utils;
use crate::p2pool::models::{BlockStats, ChainStats, ConnectionInfo, NetworkInfo, Stats};
use crate::p2pool_adapter::P2poolAdapter;
use crate::process_adapter::StatusMonitor;
use crate::process_watcher::ProcessWatcher;

const LOG_TARGET: &str = "tari::universe::p2pool_manager";
// const P2POOL_STATS_UPDATE_INTERVAL: Duration = Duration::from_secs(10);

#[derive(Clone)]
pub struct P2poolConfig {
    pub grpc_port: u16,
    pub stats_server_port: u16,
    pub base_node_address: String,
}

pub struct P2poolConfigBuilder {
    config: P2poolConfig,
}

impl P2poolConfigBuilder {
    pub fn new() -> Self {
        Self {
            config: P2poolConfig::default(),
        }
    }

    pub fn with_base_node(&mut self, grpc_port: u16) -> &mut Self {
        self.config.base_node_address = format!("http://127.0.0.1:{}", grpc_port);
        self
    }

    pub fn build(&self) -> Result<P2poolConfig, anyhow::Error> {
        let grpc_port =
            network_utils::get_free_port().ok_or_else(|| anyhow!("Could not assign free port"))?;
        let stats_server_port = network_utils::get_free_port()
            .ok_or_else(|| anyhow!("Could not assign free port for stats server"))?;
        Ok(P2poolConfig {
            grpc_port,
            stats_server_port,
            base_node_address: self.config.base_node_address.clone(),
        })
    }
}

impl P2poolConfig {
    pub fn builder() -> P2poolConfigBuilder {
        P2poolConfigBuilder::new()
    }
}

impl Default for P2poolConfig {
    fn default() -> Self {
        Self {
            grpc_port: 18145,
            stats_server_port: 19000,
            base_node_address: String::from("http://127.0.0.1:18142"),
        }
    }
}

impl Clone for P2poolManager {
    fn clone(&self) -> Self {
        Self {
            watcher: self.watcher.clone(),
        }
    }
}

pub struct P2poolManager {
    watcher: Arc<RwLock<ProcessWatcher<P2poolAdapter>>>,
}

impl P2poolManager {
    pub fn new() -> Self {
        let adapter = P2poolAdapter::new();
        let process_watcher = ProcessWatcher::new(adapter);

        Self {
            watcher: Arc::new(RwLock::new(process_watcher)),
        }
    }

    fn default_stats(&self) -> Stats {
        Stats {
            connected: false,
            peer_count: 0,
            connection_info: ConnectionInfo {
                listener_addresses: vec![],
                connected_peers: 0,
                network_info: NetworkInfo {
                    num_peers: 0,
                    connection_counters: crate::p2pool::models::ConnectionCounters {
                        pending_incoming: 0,
                        pending_outgoing: 0,
                        established_incoming: 0,
                        established_outgoing: 0,
                    },
                },
            },
            connected_since: Default::default(),
            randomx_stats: ChainStats {
                squad: crate::p2pool::models::SquadDetails {
                    id: "".to_string(),
                    name: "".to_string(),
                },
                num_of_miners: 0,
                share_chain_height: 0,
                miner_block_stats: BlockStats {
                    accepted: 0,
                    rejected: 0,
                    submitted: 0,
                },
                p2pool_block_stats: BlockStats {
                    accepted: 0,
                    rejected: 0,
                    submitted: 0,
                },
            },
            sha3x_stats: ChainStats {
                squad: crate::p2pool::models::SquadDetails {
                    id: "".to_string(),
                    name: "".to_string(),
                },
                num_of_miners: 0,
                share_chain_height: 0,
                miner_block_stats: BlockStats {
                    accepted: 0,
                    rejected: 0,
                    submitted: 0,
                },
                p2pool_block_stats: BlockStats {
                    accepted: 0,
                    rejected: 0,
                    submitted: 0,
                },
            },
        }
    }

    pub async fn stats(&self) -> Stats {
        match self.get_stats().await {
            Ok(stats) => stats,
            Err(e) => {
                error!(target: LOG_TARGET, "Failed to get stats: {}", e);
                self.default_stats()
            }
        }
    }

    async fn get_stats(&self) -> Result<Stats, anyhow::Error> {
        let process_watcher = self.watcher.read().await;
        if let Some(status_monitor) = &process_watcher.status_monitor {
            return status_monitor.status().await;
        }
        Err(anyhow!("P2pool Status monitor not started"))
    }

    pub async fn is_running(&self) -> Result<bool, anyhow::Error> {
        let process_watcher = self.watcher.read().await;
        if process_watcher.is_running() {
            return Ok(true);
        }
        Ok(false)
    }

    pub async fn ensure_started(
        &self,
        app_shutdown: ShutdownSignal,
        config: P2poolConfig,
        base_path: PathBuf,
        config_path: PathBuf,
        log_path: PathBuf,
    ) -> Result<(), anyhow::Error> {
        let mut process_watcher = self.watcher.write().await;
        if process_watcher.is_running() {
            return Ok(());
        }
        process_watcher.adapter.config = Some(config);
        process_watcher
            .start(app_shutdown, base_path, config_path, log_path)
            .await?;
        process_watcher.wait_ready().await?;
        if let Some(status_monitor) = &process_watcher.status_monitor {
            loop {
                sleep(Duration::from_secs(5)).await;
                if let Ok(_stats) = status_monitor.status().await {
                    break;
                }
            } // wait until we have stats from p2pool, so its started
        }
        Ok(())
    }

    pub async fn stop(&self) -> Result<i32, anyhow::Error> {
        let mut process_watcher = self.watcher.write().await;
        let exit_code = process_watcher.stop().await?;
        if exit_code != 0 {
            warn!(target: LOG_TARGET, "P2pool process exited with code {}", exit_code);
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
