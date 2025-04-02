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

use std::path::{Path, PathBuf};
use std::sync::Arc;
use std::time::{Duration, SystemTime};

use chrono::{NaiveDateTime, TimeZone, Utc};
use log::{error, info, warn};
use minotari_node_grpc_client::grpc::Peer;
use serde_json::json;
use tari_common::configuration::Network;
use tari_crypto::ristretto::RistrettoPublicKey;
use tari_shutdown::ShutdownSignal;
use tari_utilities::hex::Hex;
use tauri_plugin_sentry::sentry;
use tauri_plugin_sentry::sentry::protocol::Event;
use tokio::fs;
use tokio::sync::RwLock;

use crate::network_utils::{get_best_block_from_block_scan, get_block_info_from_block_scan};
use crate::node_adapter::{BaseNodeStatus, MinotariNodeStatusMonitorError};
use crate::process_adapter::ProcessAdapter;
use crate::process_stats_collector::ProcessStatsCollectorBuilder;
use crate::process_watcher::ProcessWatcher;
use crate::progress_trackers::progress_stepper::ChanneledStepUpdate;
use crate::tasks_tracker::TasksTrackers;
use async_trait::async_trait;

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

pub const STOP_ON_ERROR_CODES: [i32; 2] = [114, 102];

pub(crate) trait NodeAdapter: ProcessAdapter {
    type NodeClient: NodeClient;
    fn set_grpc_address(&mut self, grpc_address: String) -> Result<(), anyhow::Error>;
    fn grpc_address(&self) -> Option<&(String, u16)>;
    #[allow(dead_code)]
    fn tcp_rpc_port(&self) -> u16;
    fn get_node_client(&self) -> Option<Self::NodeClient>;
    fn use_tor(&mut self, use_tor: bool);
    fn tor_control_port(&mut self, tor_control_port: Option<u16>);
}

#[async_trait]
pub(crate) trait NodeClient {
    async fn wait_synced(
        &self,
        progress_tracker: Vec<Option<ChanneledStepUpdate>>,
        shutdown_signal: ShutdownSignal,
    ) -> Result<(), MinotariNodeStatusMonitorError>;
    async fn get_identity(&self) -> Result<NodeIdentity, anyhow::Error>;
    async fn get_network_state(&self) -> Result<BaseNodeStatus, MinotariNodeStatusMonitorError>;
    async fn list_connected_peers(&self) -> Result<Vec<Peer>, anyhow::Error>;
    async fn get_historical_blocks(
        &self,
        heights: Vec<u64>,
    ) -> Result<Vec<(u64, String)>, anyhow::Error>;
}

pub(crate) struct NodeManager<T: NodeAdapter> {
    watcher: Arc<RwLock<ProcessWatcher<T>>>,
    shutdown: ShutdownSignal,
}

impl<T: NodeAdapter> Clone for NodeManager<T> {
    fn clone(&self) -> Self {
        Self {
            watcher: self.watcher.clone(),
            shutdown: self.shutdown.clone(),
        }
    }
}

impl<T: NodeAdapter> NodeManager<T> {
    pub fn new(
        stats_collector: &mut ProcessStatsCollectorBuilder,
        node_adapter: T,
        shutdown: ShutdownSignal,
    ) -> Self {
        // TODO: wire up to front end
        // let mut use_tor = true;

        // Unix systems have built in tor.
        // TODO: Add tor service for windows.
        // if cfg!(target_os = "windows") {
        // use_tor = false;
        // }

        // let adapter = MinotariNodeAdapter::new(status_broadcast);
        // let adapter = RemoteUntilSyncedNodeAdapter::new(
        // MinotariNodeAdapter::new(status_broadcast.clone()),
        // RemoteNodeAdapter::new(status_broadcast),
        // );
        let mut process_watcher =
            ProcessWatcher::new(node_adapter, stats_collector.take_minotari_node());
        process_watcher.poll_time = Duration::from_secs(5);
        process_watcher.health_timeout = Duration::from_secs(4);
        process_watcher.expected_startup_time = Duration::from_secs(30);

        Self {
            watcher: Arc::new(RwLock::new(process_watcher)),
            shutdown,
        }
    }

    pub async fn clean_data_folder(&self, base_path: &Path) -> Result<(), anyhow::Error> {
        fs::remove_dir_all(base_path.join("node")).await?;
        Ok(())
    }

    #[allow(clippy::too_many_arguments)]
    pub async fn ensure_started(
        &self,
        base_path: PathBuf,
        config_path: PathBuf,
        log_path: PathBuf,
        use_tor: bool,
        tor_control_port: Option<u16>,
        remote_grpc_address: Option<String>,
    ) -> Result<(), NodeManagerError> {
        {
            let shutdown_signal = TasksTrackers::current().node_phase.get_signal().await;
            let task_tracker = TasksTrackers::current().node_phase.get_task_tracker().await;

            let mut process_watcher = self.watcher.write().await;

            process_watcher.adapter.use_tor(use_tor);
            process_watcher.adapter.tor_control_port(tor_control_port);
            process_watcher.stop_on_exit_codes = STOP_ON_ERROR_CODES.to_vec();
            if let Some(remote_grpc_address) = remote_grpc_address {
                process_watcher
                    .adapter
                    .set_grpc_address(remote_grpc_address)?;
            }
            process_watcher
                .start(
                    base_path,
                    config_path,
                    log_path,
                    crate::binaries::Binaries::MinotariNode,
                    shutdown_signal,
                    task_tracker,
                )
                .await?;
        }
        self.wait_ready().await?;
        Ok(())
    }

    #[allow(dead_code)]
    pub async fn start(
        &self,
        base_path: PathBuf,
        config_path: PathBuf,
        log_path: PathBuf,
    ) -> Result<(), anyhow::Error> {
        let shutdown_signal = TasksTrackers::current().node_phase.get_signal().await;
        let task_tracker = TasksTrackers::current().node_phase.get_task_tracker().await;

        let mut process_watcher = self.watcher.write().await;
        process_watcher
            .start(
                base_path,
                config_path,
                log_path,
                crate::binaries::Binaries::MinotariNode,
                shutdown_signal,
                task_tracker,
            )
            .await?;

        Ok(())
    }

    pub async fn get_grpc_address(&self) -> Result<String, anyhow::Error> {
        let lock = self.watcher.read().await;
        if let Some((host, port)) = lock.adapter.grpc_address() {
            if host.starts_with("http") {
                return Ok(format!("{}:{}", host, port));
            } else {
                return Ok(format!("http://{}:{}", host, port));
            }
        }
        Err(anyhow::anyhow!("grpc_address not set"))
    }

    #[allow(dead_code)]
    pub async fn get_tcp_listener_port(&self) -> u16 {
        let lock = self.watcher.read().await;
        lock.adapter.tcp_rpc_port()
    }

    pub async fn wait_synced(
        &self,
        progress_trackers: Vec<Option<ChanneledStepUpdate>>,
    ) -> Result<(), anyhow::Error> {
        self.wait_ready().await?;
        let status_monitor = self
            .watcher
            .read()
            .await
            .adapter
            .get_node_client()
            .ok_or_else(|| NodeManagerError::NodeNotStarted)?;
        loop {
            match status_monitor
                .wait_synced(progress_trackers.clone(), self.shutdown.clone())
                .await
            {
                Ok(_) => return Ok(()),
                Err(e) => match e {
                    MinotariNodeStatusMonitorError::NodeNotStarted => {
                        continue;
                    }
                    _ => {
                        return Err(NodeManagerError::UnknownError(e.into()).into());
                    }
                },
            }
        }
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
                Err(_) => {
                    warn!(target: LOG_TARGET, "Node did not return get_identity, waiting...");
                    tokio::time::sleep(tokio::time::Duration::from_secs(1)).await;
                }
            }
        }
        Ok(())
    }

    #[allow(dead_code)]
    pub async fn try_get_listening_port(&self) -> Result<u16, anyhow::Error> {
        // todo!()
        Ok(0)
    }

    pub async fn get_identity(&self) -> Result<NodeIdentity, anyhow::Error> {
        let status_monitor = self
            .watcher
            .read()
            .await
            .adapter
            .get_node_client()
            .ok_or_else(|| NodeManagerError::NodeNotStarted)?;
        status_monitor.get_identity().await.inspect_err(|e| {
            error!(target: LOG_TARGET, "Error getting node identity: {}", e);
        })
    }

    pub async fn check_if_is_orphan_chain(
        &self,
        report_to_sentry: bool,
    ) -> Result<bool, anyhow::Error> {
        let status_monitor = self
            .watcher
            .read()
            .await
            .adapter
            .get_node_client()
            .ok_or_else(|| NodeManagerError::NodeNotStarted)?;
        let BaseNodeStatus {
            is_synced,
            block_height: local_tip,
            ..
        } = status_monitor.get_network_state().await.map_err(|e| {
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
                if report_to_sentry {
                    let error_msg = "Orphan chain detected".to_string();
                    let extra = vec![
                        (
                            "block_scan_block_height".to_string(),
                            json!(block_scan_block.0.to_string()),
                        ),
                        (
                            "block_scan_block_hash".to_string(),
                            json!(block_scan_block.1.clone()),
                        ),
                        (
                            "block_scan_tip_height".to_string(),
                            json!(block_scan_tip.to_string()),
                        ),
                        ("local_tip_height".to_string(), json!(local_tip.to_string())),
                    ];
                    sentry::capture_event(Event {
                        message: Some(error_msg),
                        level: sentry::Level::Error,
                        culprit: Some("orphan-chain".to_string()),
                        extra: extra.into_iter().collect(),
                        ..Default::default()
                    });
                }
                return Ok(true);
            }
        }
        Ok(false)
    }

    pub async fn list_connected_peers(&self) -> Result<Vec<String>, anyhow::Error> {
        let status_monitor = self
            .watcher
            .read()
            .await
            .adapter
            .get_node_client()
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
    pub public_address: Vec<String>,
}
