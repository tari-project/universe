use std::sync::{atomic::AtomicBool, Arc};

use async_trait::async_trait;
use minotari_node_grpc_client::grpc::Peer;
use sha2::digest::typenum::Min;
use tari_shutdown::ShutdownSignal;

use crate::{
    node_adapter::{
        self, MinotariNodeAdapter, MinotariNodeClient, MinotariNodeStatusMonitor,
        MinotariNodeStatusMonitorError,
    },
    node_manager::{NodeAdapter, NodeClient, NodeIdentity},
    process_adapter::{HealthStatus, ProcessAdapter, ProcessInstance, StatusMonitor},
    progress_tracker::{self, ProgressTracker},
    remote_node_adapter::{NullProcessInstance, RemoteNodeAdapter},
    BaseNodeStatus,
};

pub(crate) struct RemoteUntilSyncedNodeAdapter {
    pub(crate) node: MinotariNodeAdapter,
    pub(crate) remote: RemoteNodeAdapter,
}

impl RemoteUntilSyncedNodeAdapter {
    pub(crate) fn new(node: MinotariNodeAdapter, remote: RemoteNodeAdapter) -> Self {
        Self {
            node: node,
            remote: remote,
        }
    }
}

impl NodeAdapter for RemoteUntilSyncedNodeAdapter {
    type NodeClient = WrappedNodeClient;

    fn set_grpc_address(&mut self, grpc_address: String) {
        // self.node.set_grpc_address(grpc_address);
        self.remote.set_grpc_address(grpc_address);
    }

    fn grpc_address(&self) -> Option<&(String, u16)> {
        // self.node.grpc_address()
        self.remote.grpc_address()
    }

    fn tcp_rpc_port(&self) -> u16 {
        self.remote.tcp_rpc_port()
    }

    fn get_node_client(&self) -> Option<Self::NodeClient> {
        Some(WrappedNodeClient::new(
            self.node.get_node_client()?,
            self.remote.get_node_client()?,
        ))
    }
}

impl ProcessAdapter for RemoteUntilSyncedNodeAdapter {
    type StatusMonitor = WrappedStatusMonitor;
    type ProcessInstance = ProcessInstance;

    fn spawn_inner(
        &self,
        base_folder: std::path::PathBuf,
        config_folder: std::path::PathBuf,
        log_folder: std::path::PathBuf,
        binary_version_path: std::path::PathBuf,
    ) -> Result<(Self::ProcessInstance, Self::StatusMonitor), anyhow::Error> {
        let (_unused, remote_status) = self.remote.spawn_inner(
            base_folder.clone(),
            config_folder.clone(),
            log_folder.clone(),
            binary_version_path.clone(),
        )?;
        let (node_process, node_status) =
            self.node
                .spawn_inner(base_folder, config_folder, log_folder, binary_version_path)?;

        Ok((
            node_process,
            WrappedStatusMonitor {
                remote: remote_status,
                local: node_status,
                is_synced: Arc::new(AtomicBool::new(false)),
            },
        ))
    }

    fn name(&self) -> &str {
        "remote_until_synced_node"
    }

    fn pid_file_name(&self) -> &str {
        "remote_until_synced_pid"
    }
}

#[derive(Clone)]
pub(crate) struct WrappedStatusMonitor {
    remote: MinotariNodeStatusMonitor,
    local: MinotariNodeStatusMonitor,
    is_synced: Arc<AtomicBool>,
}

#[async_trait]
impl StatusMonitor for WrappedStatusMonitor {
    async fn check_health(&self) -> HealthStatus {
        if self.is_synced.load(std::sync::atomic::Ordering::SeqCst) {
            dbg!("here");
            self.local.check_health().await
        } else {
            dbg!("here");
            // Check if we are synced on the node yet.
            let node_is_synced = self
                .local
                .get_network_state()
                .await
                .map(|state| state.is_synced)
                .unwrap_or_default();
            dbg!("here");
            if node_is_synced {
                dbg!("here");
                self.is_synced
                    .store(true, std::sync::atomic::Ordering::SeqCst);
                dbg!("here");
                self.local.check_health().await
            } else {
                dbg!("here");
                self.remote.check_health().await
            }
        }
    }
}

impl WrappedStatusMonitor {
    fn new(local: MinotariNodeStatusMonitor, remote: MinotariNodeStatusMonitor) -> Self {
        Self {
            local,
            remote,
            is_synced: Arc::new(AtomicBool::new(false)),
        }
    }

    fn is_synced(&self) -> bool {
        self.is_synced.load(std::sync::atomic::Ordering::SeqCst)
    }
}

pub(crate) struct WrappedNodeClient {
    remote: MinotariNodeClient,
    local: MinotariNodeClient,
    is_synced: Arc<AtomicBool>,
}

impl WrappedNodeClient {
    fn new(local: MinotariNodeClient, remote: MinotariNodeClient) -> Self {
        Self {
            local,
            remote,
            is_synced: Arc::new(AtomicBool::new(false)),
        }
    }

    async fn is_synced(&self) -> bool {
        let is_synced = self.is_synced.load(std::sync::atomic::Ordering::SeqCst);
        if !is_synced {
            let node_is_synced = self
                .local
                .get_network_state()
                .await
                .map(|state| state.is_synced)
                .unwrap_or_default();
            if node_is_synced {
                self.is_synced
                    .store(true, std::sync::atomic::Ordering::SeqCst);
                return true;
            }
        }
        is_synced
    }
}

#[async_trait]
impl NodeClient for WrappedNodeClient {
    async fn get_network_state(&self) -> Result<BaseNodeStatus, MinotariNodeStatusMonitorError> {
        if self.is_synced().await {
            self.local.get_network_state().await
        } else {
            self.remote.get_network_state().await
        }
    }

    async fn get_identity(&self) -> Result<NodeIdentity, anyhow::Error> {
        if self.is_synced().await {
            self.local.get_identity().await
        } else {
            self.remote.get_identity().await
        }
    }

    async fn wait_synced(
        &self,
        progress_tracker: ProgressTracker,
        shutdown_signal: ShutdownSignal,
    ) -> Result<(), MinotariNodeStatusMonitorError> {
        if self.is_synced().await {
            self.local
                .wait_synced(progress_tracker, shutdown_signal)
                .await
        } else {
            self.remote
                .wait_synced(progress_tracker, shutdown_signal)
                .await
        }
    }

    async fn list_connected_peers(&self) -> Result<Vec<Peer>, anyhow::Error> {
        if self.is_synced().await {
            self.local.list_connected_peers().await
        } else {
            self.remote.list_connected_peers().await
        }
    }

    async fn get_historical_blocks(
        &self,
        heights: Vec<u64>,
    ) -> Result<Vec<(u64, String)>, anyhow::Error> {
        if self.is_synced().await {
            self.local.get_historical_blocks(heights).await
        } else {
            self.remote.get_historical_blocks(heights).await
        }
    }
}
