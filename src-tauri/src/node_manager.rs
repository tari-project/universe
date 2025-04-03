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
use tokio::sync::watch::Sender;
use tokio::sync::RwLock;

use crate::process_watcher::ProcessWatcherStats;

use crate::local_node_adapter::{
    BaseNodeStatus, MinotariNodeClient, MinotariNodeStatusMonitorError,
};
use crate::network_utils::{get_best_block_from_block_scan, get_block_info_from_block_scan};
use crate::process_adapter::ProcessAdapter;
use crate::process_stats_collector::ProcessStatsCollectorBuilder;
use crate::process_watcher::ProcessWatcher;
use crate::progress_trackers::progress_stepper::ChanneledStepUpdate;
use crate::setup::setup_manager::SetupManager;
use crate::tasks_tracker::TasksTrackers;
use crate::{LocalNodeAdapter, RemoteNodeAdapter};

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

pub struct NodeIdentity {
    pub public_key: RistrettoPublicKey,
    pub public_address: Vec<String>,
}

#[derive(Clone)]
pub enum NodeType {
    #[allow(dead_code)]
    Local,
    #[allow(dead_code)]
    Remote,
    RemoteUntilLocal,
    LocalAfterRemote,
}

#[derive(Clone)]
pub struct NodeManager {
    node_type: Arc<RwLock<NodeType>>,
    local_node_watcher: Arc<RwLock<Option<ProcessWatcher<LocalNodeAdapter>>>>,
    remote_node_watcher: Arc<RwLock<Option<ProcessWatcher<RemoteNodeAdapter>>>>,
    shutdown: ShutdownSignal,
}

fn construct_process_watcher<T: ProcessAdapter>(
    stats_broadcast: Sender<ProcessWatcherStats>,
    node_adapter: T,
) -> ProcessWatcher<T> {
    let mut process_watcher = ProcessWatcher::new(node_adapter, stats_broadcast);
    process_watcher.poll_time = Duration::from_secs(5);
    process_watcher.health_timeout = Duration::from_secs(4);
    process_watcher.expected_startup_time = Duration::from_secs(30);

    process_watcher
}

impl NodeManager {
    pub fn new(
        stats_collector: &mut ProcessStatsCollectorBuilder,
        local_node_adapter: LocalNodeAdapter,
        remote_node_adapter: RemoteNodeAdapter,
        shutdown: ShutdownSignal,
        node_type: NodeType,
    ) -> Self {
        let stats_broadcast = stats_collector.take_minotari_node();

        let local_node_watcher = match node_type {
            NodeType::Local | NodeType::RemoteUntilLocal | NodeType::LocalAfterRemote => Some(
                construct_process_watcher(stats_broadcast.clone(), local_node_adapter),
            ),
            NodeType::Remote => None,
        };

        let remote_node_watcher = match node_type {
            NodeType::Remote | NodeType::RemoteUntilLocal | NodeType::LocalAfterRemote => Some(
                construct_process_watcher(stats_broadcast, remote_node_adapter),
            ),
            NodeType::Local => None,
        };

        Self {
            node_type: Arc::new(RwLock::new(node_type)),
            local_node_watcher: Arc::new(RwLock::new(local_node_watcher)),
            remote_node_watcher: Arc::new(RwLock::new(remote_node_watcher)),
            shutdown,
        }
    }

    pub async fn clean_data_folder(&self, base_path: &Path) -> Result<(), anyhow::Error> {
        fs::remove_dir_all(
            base_path
                .join("node")
                .join(Network::get_current().to_string().to_lowercase())
                .join("data"),
        )
        .await?;
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
        let node_type = self.node_type.read().await;
        let shutdown_signal = TasksTrackers::current().node_phase.get_signal().await;
        let task_tracker = TasksTrackers::current().node_phase.get_task_tracker().await;

        match &*node_type {
            NodeType::Local | NodeType::LocalAfterRemote => {
                let mut local_node_watcher = self.local_node_watcher.write().await;
                if let Some(local_node_watcher) = local_node_watcher.as_mut() {
                    local_node_watcher.adapter.use_tor(use_tor);
                    local_node_watcher
                        .adapter
                        .tor_control_port(tor_control_port);
                    local_node_watcher.stop_on_exit_codes = STOP_ON_ERROR_CODES.to_vec();
                    local_node_watcher
                        .start(
                            base_path.clone(),
                            config_path.clone(),
                            log_path.clone(),
                            crate::binaries::Binaries::MinotariNode,
                            shutdown_signal.clone(),
                            task_tracker,
                        )
                        .await?;
                }
            }
            NodeType::Remote => {
                let mut remote_node_watcher = self.remote_node_watcher.write().await;
                if let Some(remote_node_watcher) = remote_node_watcher.as_mut() {
                    remote_node_watcher.stop_on_exit_codes = STOP_ON_ERROR_CODES.to_vec();
                    if let Some(remote_grpc_address) = remote_grpc_address {
                        remote_node_watcher
                            .adapter
                            .set_grpc_address(remote_grpc_address)?;
                    }
                    remote_node_watcher
                        .start(
                            base_path,
                            config_path,
                            log_path,
                            crate::binaries::Binaries::MinotariNode,
                            shutdown_signal.clone(),
                            task_tracker,
                        )
                        .await?;
                }
            }
            NodeType::RemoteUntilLocal => {
                let mut remote_node_watcher = self.remote_node_watcher.write().await;
                let mut local_node_watcher = self.local_node_watcher.write().await;

                if let Some(remote_node_watcher) = remote_node_watcher.as_mut() {
                    remote_node_watcher.stop_on_exit_codes = STOP_ON_ERROR_CODES.to_vec();
                    if let Some(remote_grpc_address) = remote_grpc_address {
                        remote_node_watcher
                            .adapter
                            .set_grpc_address(remote_grpc_address)?;
                    }
                    remote_node_watcher
                        .start(
                            base_path.clone(),
                            config_path.clone(),
                            log_path.clone(),
                            crate::binaries::Binaries::MinotariNode,
                            shutdown_signal.clone(),
                            task_tracker.clone(),
                        )
                        .await?;
                }
                if let Some(local_node_watcher) = local_node_watcher.as_mut() {
                    local_node_watcher.adapter.use_tor(use_tor);
                    local_node_watcher
                        .adapter
                        .tor_control_port(tor_control_port);
                    local_node_watcher.stop_on_exit_codes = STOP_ON_ERROR_CODES.to_vec();
                    local_node_watcher
                        .start(
                            base_path,
                            config_path,
                            log_path,
                            crate::binaries::Binaries::MinotariNode,
                            shutdown_signal.clone(),
                            task_tracker,
                        )
                        .await?;
                }

                self.switch_to_local_after_remote(shutdown_signal).await?;
            }
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

        let node_type = self.node_type.read().await;
        match &*node_type {
            NodeType::Local | NodeType::LocalAfterRemote => {
                let mut local_node_watcher = self.local_node_watcher.write().await;
                if let Some(local_node_watcher) = local_node_watcher.as_mut() {
                    local_node_watcher
                        .start(
                            base_path.clone(),
                            config_path.clone(),
                            log_path.clone(),
                            crate::binaries::Binaries::MinotariNode,
                            shutdown_signal.clone(),
                            task_tracker,
                        )
                        .await?;
                }
            }
            NodeType::Remote => {
                let mut remote_node_watcher = self.remote_node_watcher.write().await;
                if let Some(remote_node_watcher) = remote_node_watcher.as_mut() {
                    remote_node_watcher
                        .start(
                            base_path,
                            config_path,
                            log_path,
                            crate::binaries::Binaries::MinotariNode,
                            shutdown_signal.clone(),
                            task_tracker,
                        )
                        .await?;
                }
            }
            NodeType::RemoteUntilLocal => {
                let mut remote_node_watcher = self.remote_node_watcher.write().await;
                if let Some(remote_node_watcher) = remote_node_watcher.as_mut() {
                    remote_node_watcher
                        .start(
                            base_path.clone(),
                            config_path.clone(),
                            log_path.clone(),
                            crate::binaries::Binaries::MinotariNode,
                            shutdown_signal.clone(),
                            task_tracker.clone(),
                        )
                        .await?;
                }

                let mut local_node_watcher = self.local_node_watcher.write().await;
                if let Some(local_node_watcher) = local_node_watcher.as_mut() {
                    local_node_watcher
                        .start(
                            base_path,
                            config_path,
                            log_path,
                            crate::binaries::Binaries::MinotariNode,
                            shutdown_signal.clone(),
                            task_tracker,
                        )
                        .await?;
                }

                self.switch_to_local_after_remote(shutdown_signal).await?;
            }
        }

        Ok(())
    }

    pub async fn get_current_node_client(&self) -> Result<MinotariNodeClient, anyhow::Error> {
        let node_type = self.node_type.read().await;
        match &*node_type {
            NodeType::Local => {
                let local_node_watcher = self.local_node_watcher.read().await;
                if let Some(local_node_watcher) = local_node_watcher.as_ref() {
                    local_node_watcher.adapter.get_node_client()
                } else {
                    None
                }
            }
            NodeType::Remote => {
                let remote_node_watcher = self.remote_node_watcher.read().await;
                if let Some(remote_node_watcher) = remote_node_watcher.as_ref() {
                    remote_node_watcher.adapter.get_node_client()
                } else {
                    None
                }
            }
            NodeType::RemoteUntilLocal | NodeType::LocalAfterRemote => {
                let remote_node_watcher = self.remote_node_watcher.read().await;
                if let Some(remote_node_watcher) = remote_node_watcher.as_ref() {
                    remote_node_watcher.adapter.get_node_client()
                } else {
                    let local_node_watcher = self.local_node_watcher.read().await;
                    if let Some(local_node_watcher) = local_node_watcher.as_ref() {
                        local_node_watcher.adapter.get_node_client()
                    } else {
                        None
                    }
                }
            }
        }
        .ok_or_else(|| anyhow::anyhow!("Node not started"))
    }

    async fn switch_to_local_after_remote(
        &self,
        mut shutdown_signal: ShutdownSignal,
    ) -> Result<(), anyhow::Error> {
        let node_type = self.node_type.clone();
        let node_manager = self.clone();
        let t = TasksTrackers::current().node_phase.get_task_tracker().await.spawn(async move {
            let mut local_node_client = None;
            for _ in 0..10 {
                tokio::time::sleep(Duration::from_secs(2)).await;
                local_node_client = {
                    let local_node_watcher = node_manager.local_node_watcher.read().await;
                    local_node_watcher.as_ref().and_then(|watcher| watcher.adapter.get_node_client())
                };
                if local_node_client.is_some() {
                    break;
                }
            }

            if let Some(local_node_client) = local_node_client {
                match local_node_client
                    .wait_synced(vec![None, None, None], node_manager.shutdown.clone())
                    .await
                {
                    Ok(_) => {
                        info!(target: LOG_TARGET, "Local node synced, switching node type...");
                        {
                            let mut node_type = node_type.write().await;
                            *node_type = NodeType::LocalAfterRemote;
                        }
                        {
                            let mut remote_node_watcher =
                                node_manager.remote_node_watcher.write().await;
                            SetupManager::get_instance()
                                .handle_switch_to_local_node()
                                .await;
                            if let Some(remote_node_watcher) = remote_node_watcher.as_mut() {
                                if let Err(e) = remote_node_watcher.stop().await {
                                    error!(target: LOG_TARGET, "Failed to stop local node watcher: {}", e);
                                }
                            }
                        }
                    }
                    Err(MinotariNodeStatusMonitorError::NodeNotStarted) => {}
                    Err(e) => {
                        error!(target: LOG_TARGET,
                            "NodeManagerError: {}",
                            NodeManagerError::UnknownError(e.into())
                        );
                    }
                }
            } else {
                error!(target: LOG_TARGET,
                    "Local node client not found when switching nodes",
                );
            }
        });

        TasksTrackers::current().node_phase.get_task_tracker().await.spawn(async move {
            tokio::select! {
                _ = t => {
                    info!(target: LOG_TARGET, "Successfully switched to the local node");
                },
                _ = shutdown_signal.wait() => {
                    info!(target: LOG_TARGET, "Shutdown Signal: switching to the local node terminated");
                },
            }
        });

        Ok(())
    }

    pub async fn get_identity(&self) -> Result<NodeIdentity, anyhow::Error> {
        let node_client = self.get_current_node_client().await?;

        node_client.get_identity().await.inspect_err(|e| {
            error!(target: LOG_TARGET, "Error getting node identity: {}", e);
        })
    }

    pub async fn get_connection_address(&self) -> Result<String, anyhow::Error> {
        let node_type = self.node_type.read().await;
        match &*node_type {
            NodeType::Local | NodeType::LocalAfterRemote => {
                let process_watcher = self.local_node_watcher.read().await;
                let local_tcp_address = match process_watcher
                    .as_ref()
                    .and_then(|local_node_watcher| Some(local_node_watcher.adapter.tcp_address()))
                {
                    Some(address) => address,
                    None => return Err(anyhow::anyhow!("Local Node tcp address not set")),
                };
                Ok(local_tcp_address)
            }
            NodeType::Remote | NodeType::RemoteUntilLocal => {
                let node_identity = self.get_identity().await?;
                let public_tcp_address = node_identity.public_address[0].clone();
                Ok(public_tcp_address)
            }
        }
    }

    pub async fn get_grpc_address(&self) -> Result<String, anyhow::Error> {
        let node_type = self.node_type.read().await;

        let grpc_address = match &*node_type {
            NodeType::Local | NodeType::LocalAfterRemote => {
                let process_watcher = self.local_node_watcher.read().await;
                process_watcher
                    .as_ref()
                    .and_then(|local_node_watcher| local_node_watcher.adapter.grpc_address())
            }
            NodeType::Remote | NodeType::RemoteUntilLocal => {
                let process_watcher = self.remote_node_watcher.read().await;
                process_watcher
                    .as_ref()
                    .and_then(|remote_node_watcher| remote_node_watcher.adapter.grpc_address())
            }
        };

        if let Some((host, port)) = grpc_address {
            if host.starts_with("http") {
                return Ok(format!("{}:{}", host, port));
            } else {
                return Ok(format!("http://{}:{}", host, port));
            }
        }
        Err(anyhow::anyhow!("grpc_address not set"))
    }

    pub async fn wait_synced(
        &self,
        progress_trackers: Vec<Option<ChanneledStepUpdate>>,
    ) -> Result<(), anyhow::Error> {
        self.wait_ready().await?;
        loop {
            let node_client = self.get_current_node_client().await?;
            match node_client
                .wait_synced(progress_trackers.clone(), self.shutdown.clone())
                .await
            {
                Ok(_) => {
                    return Ok(());
                }
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

    pub async fn check_if_is_orphan_chain(
        &self,
        report_to_sentry: bool,
    ) -> Result<bool, anyhow::Error> {
        let node_client = self.get_current_node_client().await?;
        let BaseNodeStatus {
            is_synced,
            block_height: local_tip,
            ..
        } = node_client.get_network_state().await.map_err(|e| {
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

        let local_blocks = node_client.get_historical_blocks(heights).await?;
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

    pub async fn wait_ready(&self) -> Result<(), NodeManagerError> {
        let node_type = self.node_type.read().await;
        loop {
            match &*node_type {
                NodeType::Local | NodeType::LocalAfterRemote => {
                    let local_node_watcher = self.local_node_watcher.read().await;
                    if let Some(local_node_watcher) = local_node_watcher.as_ref() {
                        match local_node_watcher.wait_ready().await {
                            Ok(_) => (),
                            Err(e) => {
                                let mut local_node_watcher = self.local_node_watcher.write().await;
                                if let Some(local_node_watcher) = local_node_watcher.as_mut() {
                                    let exit_code = local_node_watcher.stop().await?;
                                    if exit_code != 0 {
                                        return Err(NodeManagerError::ExitCode(exit_code));
                                    }
                                }
                                return Err(NodeManagerError::UnknownError(e));
                            }
                        }
                    }
                }
                NodeType::Remote | NodeType::RemoteUntilLocal => {
                    let remote_node_watcher = self.remote_node_watcher.read().await;
                    if let Some(remote_node_watcher) = remote_node_watcher.as_ref() {
                        match remote_node_watcher.wait_ready().await {
                            Ok(_) => (),
                            Err(e) => {
                                let mut remote_node_watcher =
                                    self.remote_node_watcher.write().await;
                                if let Some(remote_node_watcher) = remote_node_watcher.as_mut() {
                                    let exit_code = remote_node_watcher.stop().await?;
                                    if exit_code != 0 {
                                        return Err(NodeManagerError::ExitCode(exit_code));
                                    }
                                }
                                return Err(NodeManagerError::UnknownError(e));
                            }
                        }
                    }
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

    pub async fn list_connected_peers(&self) -> Result<Vec<String>, anyhow::Error> {
        let node_client = self.get_current_node_client().await?;
        let peers_list = node_client
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
