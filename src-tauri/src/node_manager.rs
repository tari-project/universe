use std::path::{Path, PathBuf};
use std::sync::Arc;
use std::time::SystemTime;

use chrono::{NaiveDateTime, TimeZone, Utc};
use log::{error, info};
use minotari_node_grpc_client::grpc::Peer;
use tari_common::configuration::Network;
use tari_core::transactions::tari_amount::MicroMinotari;
use tari_crypto::ristretto::RistrettoPublicKey;
use tari_shutdown::ShutdownSignal;
use tari_utilities::hex::Hex;
use tokio::fs;
use tokio::sync::RwLock;

use crate::network_utils::{get_best_block_from_block_scan, get_block_info_from_block_scan};
use crate::node_adapter::{MinotariNodeAdapter, MinotariNodeStatusMonitorError};
use crate::process_watcher::ProcessWatcher;
use crate::ProgressTracker;

const LOG_TARGET: &str = "tari::universe::minotari_node_manager";

#[derive(Debug, thiserror::Error)]
pub enum NodeManagerError {
    #[error("Node failed to start and was stopped with exit code: {}", .0)]
    ExitCode(i32),
    #[error("Node failed with an unknown error: {0}")]
    UnknownError(#[from] anyhow::Error),
    #[error("Node not started")]
    NodeNotStarted,
}

pub struct NodeManager {
    watcher: Arc<RwLock<ProcessWatcher<MinotariNodeAdapter>>>,
}

impl Clone for NodeManager {
    fn clone(&self) -> Self {
        Self {
            watcher: self.watcher.clone(),
        }
    }
}

impl NodeManager {
    pub fn new() -> Self {
        // TODO: wire up to front end
        // let mut use_tor = true;

        // Unix systems have built in tor.
        // TODO: Add tor service for windows.
        // if cfg!(target_os = "windows") {
        // use_tor = false;
        // }

        let adapter = MinotariNodeAdapter::new();
        let process_watcher = ProcessWatcher::new(adapter);

        Self {
            watcher: Arc::new(RwLock::new(process_watcher)),
        }
    }

    pub async fn clean_data_folder(&self, base_path: &Path) -> Result<(), anyhow::Error> {
        fs::remove_dir_all(base_path.join("node")).await?;
        Ok(())
    }

    pub async fn ensure_started(
        &self,
        app_shutdown: ShutdownSignal,
        base_path: PathBuf,
        config_path: PathBuf,
        log_path: PathBuf,
        use_tor: bool,
        tor_control_port: Option<u16>,
    ) -> Result<(), NodeManagerError> {
        {
            let mut process_watcher = self.watcher.write().await;

            process_watcher.adapter.use_tor = use_tor;
            process_watcher.adapter.tor_control_port = tor_control_port;
            process_watcher.stop_on_exit_codes = vec![114];
            process_watcher
                .start(
                    app_shutdown,
                    base_path,
                    config_path,
                    log_path,
                    crate::binaries::Binaries::MinotariNode,
                )
                .await?;
        }
        self.wait_ready().await?;
        Ok(())
    }

    #[allow(dead_code)]
    pub async fn start(
        &self,
        app_shutdown: ShutdownSignal,
        base_path: PathBuf,
        config_path: PathBuf,
        log_path: PathBuf,
    ) -> Result<(), anyhow::Error> {
        let mut process_watcher = self.watcher.write().await;
        process_watcher
            .start(
                app_shutdown,
                base_path,
                config_path,
                log_path,
                crate::binaries::Binaries::MinotariNode,
            )
            .await?;

        Ok(())
    }

    pub async fn get_grpc_port(&self) -> Result<u16, anyhow::Error> {
        let lock = self.watcher.read().await;
        Ok(lock.adapter.grpc_port)
    }

    pub async fn get_tcp_listener_port(&self) -> u16 {
        let lock = self.watcher.read().await;
        lock.adapter.tcp_listener_port
    }

    pub async fn wait_synced(
        &self,
        progress_tracker: ProgressTracker,
    ) -> Result<(), anyhow::Error> {
        self.wait_ready().await?;
        let status_monitor_lock = self.watcher.read().await;
        let status_monitor = status_monitor_lock
            .status_monitor
            .as_ref()
            .ok_or_else(|| anyhow::anyhow!("wait_synced: Node not started"))?;
        status_monitor.wait_synced(progress_tracker).await
    }

    pub async fn wait_ready(&self) -> Result<(), NodeManagerError> {
        loop {
            let process_watcher = self.watcher.read().await;
            match process_watcher.wait_ready().await {
                Ok(_) => {}
                Err(e) => {
                    drop(process_watcher);
                    let mut write_lock = self.watcher.write().await;
                    let exit_code = write_lock.stop().await?;

                    if exit_code != 0 {
                        return Err(NodeManagerError::ExitCode(exit_code));
                    }
                    return Err(NodeManagerError::UnknownError(e));
                }
            }

            match self.get_identity().await {
                Ok(_) => break,
                Err(_) => tokio::time::sleep(tokio::time::Duration::from_secs(1)).await,
            }
        }
        Ok(())
    }

    #[allow(dead_code)]
    pub async fn try_get_listening_port(&self) -> Result<u16, anyhow::Error> {
        // todo!()
        Ok(0)
    }

    /// Returns Sha hashrate, Rx hashrate and block reward
    pub async fn get_network_hash_rate_and_block_reward(
        &self,
    ) -> Result<(u64, u64, MicroMinotari, u64, u64, bool), NodeManagerError> {
        let mut status_monitor_lock = self.watcher.write().await;
        let status_monitor = status_monitor_lock
            .status_monitor
            .as_mut()
            .ok_or_else(|| NodeManagerError::NodeNotStarted)?;
        status_monitor
            .get_network_hash_rate_and_block_reward()
            .await
            .map_err(|e| {
                if matches!(e, MinotariNodeStatusMonitorError::NodeNotStarted) {
                    NodeManagerError::NodeNotStarted
                } else {
                    NodeManagerError::UnknownError(e.into())
                }
            })
    }

    pub async fn get_identity(&self) -> Result<NodeIdentity, anyhow::Error> {
        let status_monitor_lock = self.watcher.read().await;
        let status_monitor = status_monitor_lock
            .status_monitor
            .as_ref()
            .ok_or_else(|| anyhow::anyhow!("get_identity: Node not started"))?;
        status_monitor.get_identity().await
    }

    pub async fn stop(&self) -> Result<i32, anyhow::Error> {
        let mut process_watcher = self.watcher.write().await;
        let exit_code = process_watcher.stop().await?;
        Ok(exit_code)
    }

    pub async fn is_running(&self) -> bool {
        let process_watcher = self.watcher.read().await;
        process_watcher.is_running()
    }

    pub async fn is_pid_file_exists(&self, base_path: PathBuf) -> bool {
        let lock = self.watcher.read().await;
        lock.is_pid_file_exists(base_path)
    }

    pub async fn check_if_is_orphan_chain(&self) -> Result<bool, anyhow::Error> {
        let mut status_monitor_lock = self.watcher.write().await;
        let status_monitor = status_monitor_lock
            .status_monitor
            .as_mut()
            .ok_or_else(|| anyhow::anyhow!("Node not started"))?;
        let (_, _, _, _, _, is_synced) = status_monitor
            .get_network_hash_rate_and_block_reward()
            .await
            .map_err(|e| {
                if matches!(e, MinotariNodeStatusMonitorError::NodeNotStarted) {
                    NodeManagerError::NodeNotStarted
                } else {
                    NodeManagerError::UnknownError(e.into())
                }
            })?;
        if !is_synced {
            info!(target: LOG_TARGET, "Node is not synced, skipping orphan chain check");
            return Ok(false);
        }

        let network = Network::get_current_or_user_setting_or_default();
        let block_scan_tip = get_best_block_from_block_scan(network).await?;
        let heights: Vec<u64> = vec![
            block_scan_tip.saturating_sub(50),
            block_scan_tip.saturating_sub(100),
            block_scan_tip.saturating_sub(200),
        ];
        let mut block_scan_blocks: Vec<(u64, String)> = vec![];

        for height in &heights {
            let block_scan_block = get_block_info_from_block_scan(network, height).await?;
            block_scan_blocks.push(block_scan_block);
        }

        let local_blocks = status_monitor.get_historical_blocks(heights).await?;
        for block_scan_block in &block_scan_blocks {
            if !local_blocks
                .iter()
                .any(|local_block| block_scan_block.1 == local_block.1)
            {
                return Ok(true);
            }
        }
        Ok(false)
    }

    pub async fn list_connected_peers(&self) -> Result<Vec<String>, anyhow::Error> {
        let status_monitor_lock = self.watcher.read().await;
        let status_monitor = status_monitor_lock
            .status_monitor
            .as_ref()
            .ok_or_else(|| anyhow::anyhow!("Node not started"))?;
        let peers_list = status_monitor
            .list_connected_peers()
            .await
            .unwrap_or_else(|e| {
                error!(target: LOG_TARGET, "Error list_connected_peers: {}", e);
                Vec::<Peer>::new()
            });
        let connected_peers = peers_list
            .iter()
            .filter(|peer| {
                let since = match NaiveDateTime::parse_from_str(
                    peer.addresses[0].last_seen.as_str(),
                    "%Y-%m-%d %H:%M:%S%.f",
                ) {
                    Ok(datetime) => datetime,
                    Err(_e) => {
                        // debug!(target: LOG_TARGET, "Error parsing datetime: {}", e);
                        return false;
                    }
                };
                let since = Utc.from_utc_datetime(&since);
                let duration = SystemTime::now()
                    .duration_since(since.into())
                    .unwrap_or_default();
                duration.as_secs() < 60
            })
            .cloned()
            .map(|peer| peer.addresses[0].address.to_hex())
            .collect::<Vec<String>>();

        Ok(connected_peers)
    }
}

pub struct NodeIdentity {
    pub public_key: RistrettoPublicKey,
}
