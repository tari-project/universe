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

use crate::node_manager::NodeIdentity;
use crate::port_allocator::PortAllocator;
use crate::process_adapter::{
    HealthStatus, ProcessAdapter, ProcessInstance, ProcessStartupSpec, StatusMonitor,
};
use crate::utils::file_utils::convert_to_string;
use crate::utils::logging_utils::setup_logging;
use crate::ProgressTracker;
use anyhow::{anyhow, Error};
use async_trait::async_trait;
use log::{info, warn};
use minotari_node_grpc_client::grpc::{
    BlockHeader, Empty, GetBlocksRequest, GetNetworkStateRequest, Peer, SyncState,
};
use minotari_node_grpc_client::BaseNodeGrpcClient;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fmt::Write as _;
use std::fs;
use std::path::{Path, PathBuf};
use std::sync::atomic::AtomicU64;
use std::sync::Arc;
use std::time::Duration;
use tari_common::configuration::Network;
use tari_core::transactions::tari_amount::MicroMinotari;
use tari_crypto::ristretto::RistrettoPublicKey;
use tari_shutdown::{Shutdown, ShutdownSignal};
use tari_utilities::epoch_time::EpochTime;
use tari_utilities::ByteArray;
use tokio::sync::watch;
use tokio::time::timeout;

#[cfg(target_os = "windows")]
use crate::utils::windows_setup_utils::add_firewall_rule;

const LOG_TARGET: &str = "tari::universe::minotari_node_adapter";

#[derive(Serialize, Deserialize, Default)]
struct MinotariNodeMigrationInfo {
    version: u32,
}

impl MinotariNodeMigrationInfo {
    pub fn save(&self, path: &Path) -> Result<(), anyhow::Error> {
        let json_string = serde_json::to_string(self)?;
        fs::write(path, json_string)?;
        Ok(())
    }

    pub fn load_or_create(path: &Path) -> Result<Self, anyhow::Error> {
        if !fs::exists(path)? {
            return Ok(MinotariNodeMigrationInfo::default());
        }
        let contents = fs::read_to_string(path)?;

        Ok(serde_json::from_str(contents.as_str())?)
    }
}

pub(crate) struct MinotariNodeAdapter {
    pub(crate) use_tor: bool,
    pub(crate) grpc_port: u16,
    pub(crate) tcp_listener_port: u16,
    pub(crate) use_pruned_mode: bool,
    pub(crate) tor_control_port: Option<u16>,
    required_initial_peers: u32,
    status_broadcast: watch::Sender<BaseNodeStatus>,
}

impl MinotariNodeAdapter {
    pub fn new(status_broadcast: watch::Sender<BaseNodeStatus>) -> Self {
        let port = PortAllocator::new().assign_port_with_fallback();
        let tcp_listener_port = PortAllocator::new().assign_port_with_fallback();
        Self {
            grpc_port: port,
            tcp_listener_port,
            use_pruned_mode: false,
            required_initial_peers: 3,
            use_tor: false,
            tor_control_port: None,
            status_broadcast,
        }
    }
}

impl ProcessAdapter for MinotariNodeAdapter {
    type StatusMonitor = MinotariNodeStatusMonitor;

    #[allow(clippy::too_many_lines)]
    fn spawn_inner(
        &self,
        data_dir: PathBuf,
        _config_dir: PathBuf,
        log_dir: PathBuf,
        binary_version_path: PathBuf,
        _is_first_start: bool,
    ) -> Result<(ProcessInstance, Self::StatusMonitor), Error> {
        let inner_shutdown = Shutdown::new();
        let status_shutdown = inner_shutdown.to_signal();

        info!(target: LOG_TARGET, "Starting minotari node");
        let working_dir: PathBuf = data_dir.join("node");
        let network_dir = working_dir.join(Network::get_current().to_string().to_lowercase());
        fs::create_dir_all(&network_dir)?;
        let migration_file = network_dir.join("migrations.json");
        let mut migration_info = MinotariNodeMigrationInfo::load_or_create(&migration_file)?;

        if migration_info.version < 1 {
            // Delete the peer info db.
            let peer_db_dir = network_dir.join("peer_db");

            info!(target: LOG_TARGET, "Node migration v1: removing peer db at {:?}", peer_db_dir);

            if peer_db_dir.exists() {
                fs::remove_dir_all(peer_db_dir)?;
            }
            info!(target: LOG_TARGET, "Node Migration v1 complete");
            migration_info.version = 1;
        }
        migration_info.save(&migration_file)?;

        let config_dir = log_dir
            .clone()
            .join("base_node")
            .join("configs")
            .join("log4rs_config_base_node.yml");
        setup_logging(
            &config_dir.clone(),
            &log_dir,
            include_str!("../log4rs/base_node_sample.yml"),
        )?;
        let working_dir_string = convert_to_string(working_dir)?;
        let config_dir_string = convert_to_string(config_dir)?;

        let mut args: Vec<String> = vec![
            "-b".to_string(),
            working_dir_string,
            "--non-interactive-mode".to_string(),
            "--mining-enabled".to_string(),
            format!("--log-config={}", config_dir_string),
            "-p".to_string(),
            "base_node.grpc_enabled=true".to_string(),
            "-p".to_string(),
            format!(
                "base_node.grpc_address=/ip4/127.0.0.1/tcp/{}",
                self.grpc_port
            ),
            "-p".to_string(),
            "base_node.report_grpc_error=true".to_string(),
            "-p".to_string(),
            format!(
                "base_node.state_machine.initial_sync_peer_count={}",
                self.required_initial_peers
            ),
            "-p".to_string(),
            "base_node.grpc_server_allow_methods=\"list_connected_peers, get_blocks\"".to_string(),
            "-p".to_string(),
            "base_node.p2p.allow_test_addresses=true".to_string(),
        ];
        if self.use_pruned_mode {
            args.push("-p".to_string());
            args.push("base_node.storage.pruning_horizon=100".to_string());
        }
        // Uncomment to test winning blocks
        // if cfg!(debug_assertions) {
        // args.push("--network".to_string());
        // args.push("localnet".to_string());
        // }
        if self.use_tor {
            // args.push("-p".to_string());
            // args.push(
            //     "base_node.p2p.transport.tor.listener_address_override=/ip4/127.0.0.1/tcp/18189"
            //         .to_string(),
            // );
            if !cfg!(target_os = "macos") {
                args.push("-p".to_string());
                args.push("use_libtor=false".to_string());
            }
            args.push("-p".to_string());
            args.push(format!(
                "base_node.p2p.auxiliary_tcp_listener_address=/ip4/0.0.0.0/tcp/{0}",
                self.tcp_listener_port
            ));
            args.push("-p".to_string());
            args.push("base_node.p2p.transport.tor.proxy_bypass_for_outbound_tcp=true".to_string());
            if let Some(mut tor_control_port) = self.tor_control_port {
                // macos uses libtor, so will be 9051
                if cfg!(target_os = "macos") {
                    tor_control_port = 9051;
                }
                args.push("-p".to_string());
                args.push(format!(
                    "base_node.p2p.transport.tor.control_address=/ip4/127.0.0.1/tcp/{}",
                    tor_control_port
                ));
            }
        } else {
            args.push("-p".to_string());
            args.push("base_node.p2p.transport.type=tcp".to_string());
            args.push("-p".to_string());
            args.push(format!(
                "base_node.p2p.public_addresses=/ip4/127.0.0.1/tcp/{}",
                self.tcp_listener_port
            ));
            args.push("-p".to_string());
            args.push(format!(
                "base_node.p2p.transport.tcp.listener_address=/ip4/127.0.0.1/tcp/{}",
                self.tcp_listener_port
            ));

            let network = Network::get_current_or_user_setting_or_default();
            args.push("-p".to_string());
            args.push(format!(
                "{key}.p2p.seeds.dns_seeds=ip4.seeds.{key}.tari.com,ip6.seeds.{key}.tari.com",
                key = network.as_key_str(),
            ));
        }

        #[cfg(target_os = "windows")]
        add_firewall_rule("minotari_node.exe".to_string(), binary_version_path.clone())?;

        Ok((
            ProcessInstance {
                shutdown: inner_shutdown,
                handle: None,
                startup_spec: ProcessStartupSpec {
                    file_path: binary_version_path,
                    envs: None,
                    args,
                    data_dir,
                    pid_file_name: self.pid_file_name().to_string(),
                    name: self.name().to_string(),
                },
            },
            MinotariNodeStatusMonitor {
                grpc_port: self.grpc_port,
                required_sync_peers: self.required_initial_peers,
                shutdown_signal: status_shutdown,
                status_broadcast: self.status_broadcast.clone(),
                last_block_time: Arc::new(AtomicU64::new(0)),
            },
        ))
    }

    fn name(&self) -> &str {
        "minotari_node"
    }

    fn pid_file_name(&self) -> &str {
        "node_pid"
    }
}

#[derive(Debug, thiserror::Error)]
pub enum MinotariNodeStatusMonitorError {
    #[error("Unknown error: {0}")]
    UnknownError(#[from] anyhow::Error),
    #[error("Node not started")]
    NodeNotStarted,
}

#[derive(Clone, Debug, Serialize)]
pub(crate) struct BaseNodeStatus {
    pub sha_network_hashrate: u64,
    pub randomx_network_hashrate: u64,
    pub block_reward: MicroMinotari,
    pub block_height: u64,
    pub block_time: u64,
    pub is_synced: bool,
    pub num_connections: u64,
}

impl Default for BaseNodeStatus {
    fn default() -> Self {
        Self {
            sha_network_hashrate: 0,
            randomx_network_hashrate: 0,
            block_reward: MicroMinotari(0),
            block_height: 0,
            block_time: 0,
            is_synced: false,
            num_connections: 0,
        }
    }
}

#[derive(Clone)]
pub struct MinotariNodeStatusMonitor {
    grpc_port: u16,
    required_sync_peers: u32,
    shutdown_signal: ShutdownSignal,
    status_broadcast: watch::Sender<BaseNodeStatus>,
    last_block_time: Arc<AtomicU64>,
}

#[async_trait]
impl StatusMonitor for MinotariNodeStatusMonitor {
    async fn check_health(&self, uptime: Duration) -> HealthStatus {
        let duration = std::time::Duration::from_secs(1);
        match timeout(duration, self.get_network_state()).await {
            Ok(res) => match res {
                Ok(status) => {
                    let _res = self.status_broadcast.send(status.clone());
                    if status.num_connections == 0 {
                        return HealthStatus::Warning;
                    }
                    if self
                        .last_block_time
                        .load(std::sync::atomic::Ordering::SeqCst)
                        == status.block_time
                    {
                        if uptime.as_secs() > 1200
                            && EpochTime::now()
                                .checked_sub(EpochTime::from_secs_since_epoch(status.block_time))
                                .unwrap_or(EpochTime::from(0))
                                .as_u64()
                                > 1200
                        {
                            warn!(target: LOG_TARGET, "Base node height has not changed in twenty minutes");
                            return HealthStatus::Warning;
                        }
                    } else {
                        self.last_block_time
                            .store(status.block_time, std::sync::atomic::Ordering::SeqCst);
                    }
                    HealthStatus::Healthy
                }
                Err(e) => {
                    warn!(target: LOG_TARGET, "Error checking base node status: {:?}", e);
                    HealthStatus::Unhealthy
                }
            },
            Err(e) => {
                warn!(target: LOG_TARGET, "Base node template check timed out. {:?}", e);
                match self.get_identity().await {
                    Ok(_) => {
                        return HealthStatus::Healthy;
                    }
                    Err(e) => {
                        warn!(target: LOG_TARGET, "Error checking base node identity: {:?}", e);
                        return HealthStatus::Unhealthy;
                    }
                }
            }
        }
    }
}

impl MinotariNodeStatusMonitor {
    pub async fn get_network_state(
        &self,
    ) -> Result<BaseNodeStatus, MinotariNodeStatusMonitorError> {
        let mut client =
            BaseNodeGrpcClient::connect(format!("http://127.0.0.1:{}", self.grpc_port))
                .await
                .map_err(|_| MinotariNodeStatusMonitorError::NodeNotStarted)?;

        let res = client
            .get_network_state(GetNetworkStateRequest {})
            .await
            .map_err(|e| MinotariNodeStatusMonitorError::UnknownError(e.into()))?;
        let res = res.into_inner();
        let metadata = match res.metadata {
            Some(metadata) => metadata,
            None => {
                return Err(MinotariNodeStatusMonitorError::UnknownError(anyhow!(
                    "No metadata found"
                )));
            }
        };

        Ok(BaseNodeStatus {
            sha_network_hashrate: res.sha3x_estimated_hash_rate,
            randomx_network_hashrate: res.randomx_estimated_hash_rate,
            block_reward: MicroMinotari(res.reward),
            block_height: metadata.best_block_height,
            block_time: metadata.timestamp,
            is_synced: res.initial_sync_achieved,
            num_connections: res.num_connections,
        })
    }

    pub async fn get_historical_blocks(
        &self,
        heights: Vec<u64>,
    ) -> Result<Vec<(u64, String)>, Error> {
        let mut client =
            BaseNodeGrpcClient::connect(format!("http://127.0.0.1:{}", self.grpc_port)).await?;

        let mut res = client
            .get_blocks(GetBlocksRequest { heights })
            .await?
            .into_inner();

        let mut blocks: Vec<(u64, String)> = Vec::new();
        while let Some(block) = res.message().await? {
            let BlockHeader { height, hash, .. } = block
                .block
                .clone()
                .expect("Failed to get block data")
                .header
                .expect("Failed to get block header data");
            let hash: String = hash.iter().fold(String::new(), |mut acc, x| {
                write!(acc, "{:02x}", x).expect("Unable to write");
                acc
            });

            blocks.push((height, hash));
        }
        Ok(blocks)
    }

    pub async fn get_identity(&self) -> Result<NodeIdentity, Error> {
        let mut client =
            BaseNodeGrpcClient::connect(format!("http://127.0.0.1:{}", self.grpc_port)).await?;

        let id = client.identify(Empty {}).await?;
        let res = id.into_inner();

        Ok(NodeIdentity {
            public_key: RistrettoPublicKey::from_canonical_bytes(&res.public_key)
                .map_err(|e| anyhow!(e.to_string()))?,
        })
    }

    #[allow(clippy::too_many_lines)]
    pub async fn wait_synced(
        &self,
        progress_tracker: ProgressTracker,
    ) -> Result<(), MinotariNodeStatusMonitorError> {
        let mut client =
            BaseNodeGrpcClient::connect(format!("http://127.0.0.1:{}", self.grpc_port))
                .await
                .map_err(|_e| MinotariNodeStatusMonitorError::NodeNotStarted)?;

        loop {
            if self.shutdown_signal.is_triggered() {
                break Ok(());
            }
            let tip = client
                .get_tip_info(Empty {})
                .await
                .map_err(|e| MinotariNodeStatusMonitorError::UnknownError(e.into()))?;
            let sync_progress = client
                .get_sync_progress(Empty {})
                .await
                .map_err(|e| MinotariNodeStatusMonitorError::UnknownError(e.into()))?;
            let tip_res = tip.into_inner();
            let sync_progress = sync_progress.into_inner();
            if tip_res.initial_sync_achieved {
                break Ok(());
            }

            if sync_progress.state == SyncState::Startup as i32 {
                progress_tracker
                    .update(
                        "preparing-for-initial-sync".to_string(),
                        Some(HashMap::from([
                            (
                                "initial_connected_peers".to_string(),
                                sync_progress.initial_connected_peers.to_string(),
                            ),
                            (
                                "required_peers".to_string(),
                                self.required_sync_peers.to_string(),
                            ),
                        ])),
                        10,
                    )
                    .await;
            } else if sync_progress.state == SyncState::Header as i32 {
                let progress = if sync_progress.tip_height == 0 {
                    10
                } else {
                    10 + (30 * sync_progress.local_height / sync_progress.tip_height)
                };
                progress_tracker
                    .update(
                        "waiting-for-header-sync".to_string(),
                        Some(HashMap::from([
                            (
                                "local_header_height".to_string(),
                                sync_progress.local_height.to_string(),
                            ),
                            (
                                "tip_header_height".to_string(),
                                sync_progress.tip_height.to_string(),
                            ),
                            ("local_block_height".to_string(), "0".to_string()),
                            (
                                "tip_block_height".to_string(),
                                sync_progress.tip_height.to_string(),
                            ),
                            // Keep these fields for old translations that have not been updated
                            (
                                "local_height".to_string(),
                                sync_progress.local_height.to_string(),
                            ),
                            (
                                "tip_height".to_string(),
                                sync_progress.tip_height.to_string(),
                            ),
                        ])),
                        progress,
                    )
                    .await;
            } else if sync_progress.state == SyncState::Block as i32 {
                let progress = if sync_progress.tip_height == 0 {
                    40
                } else {
                    40 + (60 * sync_progress.local_height / sync_progress.tip_height)
                };
                progress_tracker
                    .update(
                        "waiting-for-block-sync".to_string(),
                        Some(HashMap::from([
                            // Assume the headers have already been synced
                            (
                                "local_header_height".to_string(),
                                sync_progress.tip_height.to_string(),
                            ),
                            (
                                "tip_header_height".to_string(),
                                sync_progress.tip_height.to_string(),
                            ),
                            (
                                "local_block_height".to_string(),
                                sync_progress.local_height.to_string(),
                            ),
                            (
                                "tip_block_height".to_string(),
                                sync_progress.tip_height.to_string(),
                            ),
                            // Keep these fields for old translations that have not been updated
                            (
                                "local_height".to_string(),
                                sync_progress.local_height.to_string(),
                            ),
                            (
                                "tip_height".to_string(),
                                sync_progress.tip_height.to_string(),
                            ),
                        ])),
                        progress,
                    )
                    .await;
            } else {
                // do nothing
            }

            tokio::time::sleep(tokio::time::Duration::from_secs(1)).await;
        }
    }

    pub async fn list_connected_peers(&self) -> Result<Vec<Peer>, Error> {
        let mut client =
            BaseNodeGrpcClient::connect(format!("http://127.0.0.1:{}", self.grpc_port)).await?;
        let connected_peers = client.list_connected_peers(Empty {}).await?;
        Ok(connected_peers.into_inner().connected_peers)
    }
}
