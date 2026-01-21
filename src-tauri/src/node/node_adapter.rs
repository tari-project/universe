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

use crate::ab_test_selector::ABTestSelector;
use crate::node::node_manager::NodeType;
use crate::node::utils::SyncProgressInfo;
use crate::process_adapter::{HandleUnhealthyResult, HealthStatus, StatusMonitor};
use crate::{LOG_TARGET_APP_LOGIC, LOG_TARGET_STATUSES};
use anyhow::{anyhow, Error};
use async_trait::async_trait;
use chrono::{NaiveDateTime, TimeZone, Utc};
use log::{error, info, warn};
use minotari_node_grpc_client::grpc::{
    Empty, GetNetworkStateRequest, SyncProgressResponse, SyncState,
};
use minotari_node_grpc_client::BaseNodeGrpcClient;
use minotari_node_wallet_client::BaseNodeWalletClient;
use serde::Serialize;
use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::atomic::AtomicU64;
use std::sync::Arc;
use std::time::{Duration, SystemTime};
use tari_common::configuration::Network;
use tari_common_types::chain_metadata::ChainMetadata;
use tari_common_types::types::FixedHash;
use tari_crypto::ristretto::RistrettoPublicKey;
use tari_shutdown::ShutdownSignal;
use tari_transaction_components::consensus::ConsensusManager;
use tari_transaction_components::tari_amount::MicroMinotari;
use tari_utilities::epoch_time::EpochTime;
use tari_utilities::hex::Hex;
use tari_utilities::ByteArray;
use tokio::fs;
use tokio::sync::watch;
use tokio::time::timeout;
use url::Url;

use crate::network_utils::{get_best_block_from_block_scan, get_block_info_from_block_scan};

#[async_trait]
pub trait NodeAdapter {
    fn get_grpc_address(&self) -> Option<(String, u16)>;
    fn set_grpc_address(&mut self, grpc_address: String) -> Result<(), anyhow::Error>;
    fn get_service(&self) -> Option<NodeAdapterService>;
    async fn get_connection_details(
        &self,
    ) -> Result<(Option<RistrettoPublicKey>, String), anyhow::Error>;
    fn get_http_api_url(&self) -> String;
    fn use_tor(&mut self, use_tor: bool);
    fn set_tor_control_port(&mut self, tor_control_port: Option<u16>);
    fn set_ab_group(&mut self, ab_group: ABTestSelector);
}

#[derive(Debug, Clone)]
pub(crate) struct NodeAdapterService {
    connection_address: String,
    http_address: String,
    required_sync_peers: u32,
    consensus_manager: ConsensusManager,
}

impl NodeAdapterService {
    pub fn new(
        connection_address: String,
        http_address: String,
        required_sync_peers: u32,
        consensus_manager: ConsensusManager,
    ) -> Self {
        Self {
            connection_address,
            http_address,
            required_sync_peers,
            consensus_manager,
        }
    }

    pub async fn get_network_state(
        &self,
        remote: bool,
    ) -> Result<BaseNodeStatus, NodeStatusMonitorError> {
        let http_address: Url = self
            .http_address
            .parse()
            .map_err(|e| anyhow::anyhow!("base node URL is invalid:{e}"))?;
        let http_client =
            minotari_node_wallet_client::http::Client::new(http_address.clone(), http_address);

        let tip = http_client.get_tip_info().await?;

        let block_height = tip
            .metadata
            .as_ref()
            .map(|m| m.best_block_height())
            .unwrap_or(0);
        let block_time = tip.metadata.as_ref().map(|m| m.timestamp()).unwrap_or(0);
        let block_reward = self.consensus_manager.get_block_reward_at(block_height);
        let (readiness_status, num_connections) = if remote {
            let status = if tip.is_synced {
                ReadinessStatus::READY
            } else {
                ReadinessStatus::NOT_READY
            };
            (status, 1)
        } else {
            let mut grpc_client = BaseNodeGrpcClient::connect(self.connection_address.clone())
                .await
                .map_err(|_| NodeStatusMonitorError::NodeNotStarted)?;
            let res = grpc_client
                .get_network_state(GetNetworkStateRequest {})
                .await
                .map_err(|e| NodeStatusMonitorError::UnknownError(e.into()))?;
            let res = res.into_inner();
            let status = res
                .readiness_status
                .map(|s| s.into())
                .unwrap_or(ReadinessStatus::NOT_READY);
            (status, res.num_connections)
        };
        Ok(BaseNodeStatus {
            block_reward,
            block_height,
            block_time,
            is_synced: tip.is_synced,
            num_connections,
            readiness_status,
        })
    }

    pub async fn get_historical_blocks(
        &self,
        heights: Vec<u64>,
    ) -> Result<Vec<(u64, String)>, Error> {
        let address: Url = self
            .http_address
            .parse()
            .map_err(|e| anyhow::anyhow!("base node URL is invalid:{e}"))?;
        let client = minotari_node_wallet_client::http::Client::new(address.clone(), address);

        let mut blocks: Vec<(u64, String)> = Vec::new();
        for height in heights {
            if let Some(header) = client.get_header_by_height(height).await? {
                blocks.push((height, header.hash.to_hex()));
            };
        }
        Ok(blocks)
    }

    pub async fn get_identity(&self) -> Result<NodeIdentity, Error> {
        let mut client = BaseNodeGrpcClient::connect(self.connection_address.clone()).await?;
        let id = client.identify(Empty {}).await?;
        let res = id.into_inner();

        Ok(NodeIdentity {
            public_key: Some(
                RistrettoPublicKey::from_canonical_bytes(&res.public_key)
                    .map_err(|e| anyhow!(e.to_string()))?,
            ),
            public_addresses: res.public_addresses,
        })
    }

    pub async fn wait_synced(
        &self,
        progress_params_tx: &watch::Sender<HashMap<String, String>>,
        progress_percentage_tx: &watch::Sender<f64>,
        shutdown_signal: ShutdownSignal,
        remote: bool,
    ) -> Result<u64, NodeStatusMonitorError> {
        let mut grpc_client = if remote {
            None
        } else {
            Some(
                BaseNodeGrpcClient::connect(self.connection_address.clone())
                    .await
                    .map_err(|_e| NodeStatusMonitorError::NodeNotStarted)?,
            )
        };

        let http_address: Url = self
            .http_address
            .parse()
            .map_err(|e| anyhow::anyhow!("base node URL is invalid:{e}"))?;
        let http_client =
            minotari_node_wallet_client::http::Client::new(http_address.clone(), http_address);

        loop {
            if shutdown_signal.is_triggered() {
                return Ok(0);
            }

            let (initial_sync_achieved, metadata) = if remote {
                let tip = http_client.get_tip_info().await?;
                let tari_transaction_components::rpc::models::TipInfoResponse {
                    is_synced,
                    metadata,
                } = tip;
                (is_synced, metadata)
            } else {
                let client = grpc_client.as_mut().expect("Should have a client here");

                // if we are running local, we want to connect to the grpc, as it runs the pre-service if the base node is migrating
                let tip = client
                    .get_tip_info(Empty {})
                    .await
                    .map_err(|e| NodeStatusMonitorError::UnknownError(e.into()))?
                    .into_inner();
                let minotari_node_grpc_client::grpc::TipInfoResponse {
                    metadata,
                    initial_sync_achieved,
                    base_node_state: _,
                    failed_checkpoints: _,
                } = tip;
                let core_meta = metadata.and_then(|meta| {
                    ChainMetadata::new(
                        meta.best_block_height,
                        FixedHash::try_from(meta.best_block_hash).unwrap_or_default(),
                        0,
                        0,
                        0.into(),
                        meta.timestamp,
                    )
                    .ok()
                });
                (initial_sync_achieved, core_meta)
            };

            let sync_progress = if metadata.is_some() && remote && initial_sync_achieved {
                // if the remote node has intial sync status, we can just asume the rest will be correct, so dont ask
                SyncProgressResponse {
                    tip_height: metadata
                        .as_ref()
                        .map(|meta| meta.best_block_height())
                        .unwrap_or_default(),
                    local_height: metadata
                        .as_ref()
                        .map(|meta| meta.best_block_height())
                        .unwrap_or_default(),
                    state: SyncState::Done as i32,
                    short_desc: "".to_string(),
                    initial_connected_peers: 1,
                }
            } else {
                let client = grpc_client.as_mut().expect("Should have a client here");
                let sync = client
                    .get_sync_progress(Empty {})
                    .await
                    .map_err(|e| NodeStatusMonitorError::UnknownError(e.into()))?;
                sync.into_inner()
            };
            let sync_info =
                SyncProgressInfo::from_sync_progress(&sync_progress, self.required_sync_peers);

            progress_percentage_tx.send(sync_info.percentage).ok();
            progress_params_tx.send(sync_info.progress_params).ok();

            if initial_sync_achieved
                && metadata.clone().is_some_and(|metadata| {
                    metadata.best_block_height() > 0 && sync_info.percentage >= 1.0
                })
            {
                info!(target: LOG_TARGET_APP_LOGIC, "Initial sync achieved");
                let tip_height = match metadata {
                    Some(metadata) => metadata.best_block_height(),
                    None => 0,
                };
                return Ok(tip_height);
            }

            tokio::time::sleep(tokio::time::Duration::from_secs(1)).await;
        }
    }

    pub async fn list_connected_peers(&self) -> Result<Vec<String>, anyhow::Error> {
        let mut client = BaseNodeGrpcClient::connect(self.connection_address.clone()).await?;
        let peers_list = client
            .list_connected_peers(Empty {})
            .await
            .map_err(|e| anyhow::anyhow!("Error list_connected_peers: {}", e))?
            .into_inner()
            .connected_peers;

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
            .map(|peer| peer.addresses[0].address.to_hex())
            .collect::<Vec<String>>();

        Ok(connected_peers)
    }

    pub async fn check_if_is_orphan_chain(&self) -> Result<bool, anyhow::Error> {
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

        let local_blocks = self.get_historical_blocks(heights).await?;
        for block_scan_block in &block_scan_blocks {
            if !local_blocks
                .iter()
                .any(|local_block| block_scan_block.1 == local_block.1)
            {
                let local_block = local_blocks.iter().find(|b| b.0 == block_scan_block.0);
                error!(target: LOG_TARGET_STATUSES, "Miner is stuck on orphan chain. Block at height: {} and hash: {} does not exist locally", block_scan_block.0, block_scan_block.1);
                if let Some(local_block) = local_block {
                    error!(target: LOG_TARGET_STATUSES, "Local block at height: {} and hash: {}", local_block.0, local_block.1);
                }
                return Ok(true);
            }
        }

        Ok(false)
    }
}

#[derive(Clone)]
pub(crate) struct NodeStatusMonitor {
    node_type: NodeType,
    node_service: NodeAdapterService,
    status_broadcast: watch::Sender<BaseNodeStatus>,
    last_block_time: Arc<AtomicU64>,
    base_path: Option<PathBuf>,
}

impl NodeStatusMonitor {
    pub fn new(
        node_type: NodeType,
        node_service: NodeAdapterService,
        status_broadcast: watch::Sender<BaseNodeStatus>,
        last_block_time: Arc<AtomicU64>,
        base_path: Option<PathBuf>,
    ) -> Self {
        Self {
            node_type,
            node_service,
            status_broadcast,
            last_block_time,
            base_path,
        }
    }
}

#[async_trait]
impl StatusMonitor for NodeStatusMonitor {
    async fn check_health(&self, uptime: Duration, timeout_duration: Duration) -> HealthStatus {
        let remote = self.node_type.is_remote();
        match timeout(
            timeout_duration,
            self.node_service.get_network_state(remote),
        )
        .await
        {
            Ok(res) => match res {
                Ok(status) => {
                    let _res = self.status_broadcast.send(status);
                    if status.readiness_status.is_initializing() {
                        info!(
                            "{:?} Node Health Check: Not ready yet | status: {:?}",
                            self.node_type,
                            status.clone()
                        );
                        return HealthStatus::Initializing;
                    }

                    if status.num_connections == 0 {
                        warn!(
                            "{:?} Node Health Check Warning: No connections | status: {:?}",
                            self.node_type,
                            status.clone()
                        );
                        return HealthStatus::Warning;
                    }

                    if self
                        .last_block_time
                        .load(std::sync::atomic::Ordering::SeqCst)
                        == status.block_time
                    {
                        if uptime.as_secs() > 3600
                            && EpochTime::now()
                                .checked_sub(EpochTime::from_secs_since_epoch(status.block_time))
                                .unwrap_or(EpochTime::from(0))
                                .as_u64()
                                > 3600
                        {
                            warn!(target: LOG_TARGET_STATUSES, "Base node height has not changed in an hour");
                            return HealthStatus::Unhealthy;
                        }
                    } else {
                        self.last_block_time
                            .store(status.block_time, std::sync::atomic::Ordering::SeqCst);
                    }
                    HealthStatus::Healthy
                }
                Err(e) => {
                    warn!(
                        "{:?} Node Health Check Error: checking base node status: {:?}",
                        self.node_type, e
                    );
                    HealthStatus::Unhealthy
                }
            },
            Err(e) => {
                warn!(
                    "{:?} Node Health Check (get_network_state) error: {:?}",
                    self.node_type, e
                );
                match self.node_service.get_identity().await {
                    Ok(identity) => {
                        info!(target: LOG_TARGET_STATUSES, "{:?} Node checking base node identity success: {:?}", self.node_type, identity);
                        return HealthStatus::Warning;
                    }
                    Err(e) => {
                        warn!(
                            "{:?} Node Health Check Error: checking base node identity: {:?}",
                            self.node_type, e
                        );
                        return HealthStatus::Unhealthy;
                    }
                }
            }
        }
    }

    async fn handle_unhealthy(
        &self,
        _duration_since_last_healthy_status: Duration,
    ) -> Result<HandleUnhealthyResult, anyhow::Error> {
        if self.node_type == NodeType::Remote {
            // Do not clear local node files for remote nodes
            return Ok(HandleUnhealthyResult::Continue);
        }

        if let Some(ref base_path) = self.base_path {
            let _unused = fs::remove_dir_all(
                base_path
                    .join("node")
                    .join(Network::get_current().to_string().to_lowercase())
                    .join("peer_db"),
            )
            .await;

            let _unused = fs::remove_dir_all(
                base_path
                    .join("node")
                    .join(Network::get_current().to_string().to_lowercase())
                    .join("libtor"),
            )
            .await;

            let _unused = fs::remove_dir_all(base_path.join("tor-data")).await;
            let _unused = fs::remove_dir_all(
                base_path
                    .join("node")
                    .join(Network::get_current().to_string().to_lowercase())
                    .join("config"),
            )
            .await;
        }

        Ok(HandleUnhealthyResult::Continue)
    }
}

#[derive(Clone, Debug, Serialize)]
pub struct NodeIdentity {
    pub public_key: Option<RistrettoPublicKey>,
    pub public_addresses: Vec<String>,
}

#[derive(Clone, Copy, Debug, serde::Deserialize, serde::Serialize)]
pub struct MigrationProgress {
    pub current_block: u64,
    pub total_blocks: u64,
    pub progress_percentage: f64,
    pub current_db_version: u64,
    pub target_db_version: u64,
}

#[derive(Clone, Copy, Debug, serde::Deserialize, serde::Serialize)]
pub enum ReadinessStatus {
    State(i32),
    Migration(MigrationProgress),
}

impl ReadinessStatus {
    // Constants for all state variants - updated to match new values
    pub const NOT_READY: Self = Self::State(0);
    pub const STARTING_UP: Self = Self::State(1);
    pub const DATABASE_INITIALIZING: Self = Self::State(10);
    pub const RECOVERING_PREPARING: Self = Self::State(20);
    pub const RECOVERING_REBUILDING: Self = Self::State(21);
    pub const RECOVERING_REBUILDING_DATABASE: Self = Self::State(22);
    pub const BUILDING_CONTEXT_BLOCKCHAIN: Self = Self::State(32);
    pub const BUILDING_CONTEXT_BOOTSTRAP: Self = Self::State(34);
    pub const READY: Self = Self::State(100);

    /// Check if the node is ready
    pub fn is_ready(&self) -> bool {
        matches!(self, Self::State(100))
    }

    /// Check if the node is not ready
    pub fn is_initializing(&self) -> bool {
        !self.is_ready()
    }

    /// Get the raw i32 value for state, or a representative value for migration
    pub fn as_i32(&self) -> i32 {
        match self {
            Self::State(value) => *value,
            Self::Migration(_) => 50, // Representative value for migration
        }
    }

    /// Get a human-readable status string
    pub fn as_str(&self) -> &'static str {
        match self {
            Self::State(0) => "Not Ready",
            Self::State(1) => "Starting Up",
            Self::State(10) => "Database Initializing",
            Self::State(20) => "Recovering - Preparing",
            Self::State(21) => "Recovering - Rebuilding",
            Self::State(22) => "Recovering - Rebuilding Database",
            Self::State(32) => "Building Context - Blockchain",
            Self::State(34) => "Building Context - Bootstrap",
            Self::State(100) => "Ready",
            Self::State(_) => "Unknown State",
            Self::Migration(_) => "Migrating Database",
        }
    }
}

impl From<minotari_node_grpc_client::grpc::ReadinessStatus> for ReadinessStatus {
    fn from(status: minotari_node_grpc_client::grpc::ReadinessStatus) -> Self {
        if let Some(status_oneof) = status.status {
            match status_oneof {
                minotari_node_grpc_client::grpc::readiness_status::Status::State(state) => {
                    Self::State(state)
                }
                minotari_node_grpc_client::grpc::readiness_status::Status::Migration(migration) => {
                    Self::Migration(MigrationProgress {
                        current_block: migration.current_block,
                        total_blocks: migration.total_blocks,
                        progress_percentage: migration.progress_percentage,
                        current_db_version: migration.current_db_version,
                        target_db_version: migration.target_db_version,
                    })
                }
            }
        } else {
            Self::NOT_READY
        }
    }
}

impl From<i32> for ReadinessStatus {
    fn from(value: i32) -> Self {
        Self::State(value)
    }
}

impl From<ReadinessStatus> for minotari_node_grpc_client::grpc::ReadinessStatus {
    fn from(status: ReadinessStatus) -> Self {
        let status_oneof = match status {
            ReadinessStatus::State(state_value) => {
                minotari_node_grpc_client::grpc::readiness_status::Status::State(state_value)
            }
            ReadinessStatus::Migration(migration) => {
                let migration_proto = minotari_node_grpc_client::grpc::MigrationProgress {
                    current_block: migration.current_block,
                    total_blocks: migration.total_blocks,
                    progress_percentage: migration.progress_percentage,
                    current_db_version: migration.current_db_version,
                    target_db_version: migration.target_db_version,
                };
                minotari_node_grpc_client::grpc::readiness_status::Status::Migration(
                    migration_proto,
                )
            }
        };

        minotari_node_grpc_client::grpc::ReadinessStatus {
            status: Some(status_oneof),
            timestamp: 0, // Default timestamp value
        }
    }
}

impl ReadinessStatus {
    /// Get detailed status information including migration progress
    pub fn detailed_str(&self) -> String {
        match self {
            Self::State(0) => "Not Ready".to_string(),
            Self::State(1) => "Starting Up".to_string(),
            Self::State(10) => "Database Initializing".to_string(),
            Self::State(20) => "Recovering - Preparing".to_string(),
            Self::State(21) => "Recovering - Rebuilding".to_string(),
            Self::State(22) => "Recovering - Rebuilding Database".to_string(),
            Self::State(32) => "Building Context - Blockchain".to_string(),
            Self::State(34) => "Building Context - Bootstrap".to_string(),
            Self::State(100) => "Ready".to_string(),
            Self::State(value) => format!("Unknown State ({value})"),
            Self::Migration(progress) => {
                format!(
                    "Migrating DB v{} -> v{} ({:.1}% - {}/{})",
                    progress.current_db_version,
                    progress.target_db_version,
                    progress.progress_percentage,
                    progress.current_block,
                    progress.total_blocks
                )
            }
        }
    }

    /// Get migration progress if status is migrating
    pub fn migration_progress(&self) -> Option<&MigrationProgress> {
        match self {
            Self::Migration(progress) => Some(progress),
            _ => None,
        }
    }
}

impl std::fmt::Display for ReadinessStatus {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.detailed_str())
    }
}

#[derive(Clone, Copy, Debug, Serialize)]
pub(crate) struct BaseNodeStatus {
    pub block_reward: MicroMinotari,
    pub block_height: u64,
    pub block_time: u64,
    pub is_synced: bool,
    pub num_connections: u64,
    pub readiness_status: ReadinessStatus,
}

impl Default for BaseNodeStatus {
    fn default() -> Self {
        Self {
            block_reward: MicroMinotari(0),
            block_height: 0,
            block_time: 0,
            is_synced: false,
            num_connections: 0,
            readiness_status: ReadinessStatus::NOT_READY,
        }
    }
}

#[derive(Debug, thiserror::Error)]
pub enum NodeStatusMonitorError {
    #[error("Unknown error: {0}")]
    UnknownError(#[from] anyhow::Error),
    #[error("Node not started")]
    NodeNotStarted,
}
