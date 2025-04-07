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
use std::time::Duration;

use log::{error, info, warn};
use serde::Serialize;
use tari_common::configuration::Network;
use tari_shutdown::ShutdownSignal;
use tokio::sync::watch::Sender;
use tokio::sync::RwLock;
use tokio::{fs, select};
use tokio_util::task::TaskTracker;

use crate::node::node_adapter::{
    NodeAdapter, NodeAdapterService, NodeIdentity, NodeStatusMonitorError,
};
use crate::process_adapter::ProcessAdapter;
use crate::process_stats_collector::ProcessStatsCollectorBuilder;
use crate::process_watcher::ProcessWatcher;
use crate::process_watcher::ProcessWatcherStats;
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
}

pub const STOP_ON_ERROR_CODES: [i32; 2] = [114, 102];

#[derive(Clone, Debug, PartialEq, Serialize)]
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
    current_adapter: Arc<RwLock<Box<dyn NodeAdapter + Send + Sync>>>,
    shutdown: ShutdownSignal,
}

fn construct_process_watcher<T: NodeAdapter + ProcessAdapter + Send + Sync + 'static>(
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
                construct_process_watcher(stats_broadcast.clone(), local_node_adapter.clone()),
            ),
            NodeType::Remote => None,
        };
        let remote_node_watcher = match node_type {
            NodeType::Remote | NodeType::RemoteUntilLocal => Some(construct_process_watcher(
                stats_broadcast,
                remote_node_adapter.clone(),
            )),
            NodeType::Local | NodeType::LocalAfterRemote => None,
        };

        let current_adapter: Box<dyn NodeAdapter + Send + Sync> = match node_type {
            NodeType::Local | NodeType::LocalAfterRemote => Box::new(local_node_adapter),
            NodeType::Remote | NodeType::RemoteUntilLocal => Box::new(remote_node_adapter),
        };

        Self {
            node_type: Arc::new(RwLock::new(node_type)),
            local_node_watcher: Arc::new(RwLock::new(local_node_watcher)),
            remote_node_watcher: Arc::new(RwLock::new(remote_node_watcher)),
            current_adapter: Arc::new(RwLock::new(current_adapter)),
            shutdown,
        }
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
        let shutdown_signal = TasksTrackers::current().node_phase.get_signal().await;
        let task_tracker = TasksTrackers::current().node_phase.get_task_tracker().await;
        let node_type = self.get_node_type().await?;

        match node_type {
            NodeType::Local | NodeType::LocalAfterRemote => {
                self.configure_local_adapter(true, use_tor, tor_control_port)
                    .await?;
                self.start_local_watcher(
                    base_path.clone(),
                    config_path.clone(),
                    log_path.clone(),
                    shutdown_signal.clone(),
                    task_tracker,
                )
                .await?;
            }
            NodeType::Remote => {
                self.configure_remote_adapter(true, remote_grpc_address)
                    .await?;
                self.start_remote_watcher(
                    base_path,
                    config_path,
                    log_path,
                    shutdown_signal.clone(),
                    task_tracker,
                )
                .await?;
            }
            NodeType::RemoteUntilLocal => {
                self.configure_remote_adapter(true, remote_grpc_address)
                    .await?;
                self.start_remote_watcher(
                    base_path.clone(),
                    config_path.clone(),
                    log_path.clone(),
                    shutdown_signal.clone(),
                    task_tracker.clone(),
                )
                .await?;
                self.configure_local_adapter(false, use_tor, tor_control_port)
                    .await?;
                self.start_local_watcher(
                    base_path,
                    config_path,
                    log_path,
                    shutdown_signal.clone(),
                    task_tracker,
                )
                .await?;

                self.switch_to_local_after_remote(shutdown_signal).await?;
            }
        }
        // println!("====== grpc: {:?}", self.get_grpc_address().await);
        self.wait_ready().await?;
        Ok(())
    }

    async fn start_local_watcher(
        &self,
        base_path: PathBuf,
        config_path: PathBuf,
        log_path: PathBuf,
        shutdown_signal: ShutdownSignal,
        task_tracker: TaskTracker,
    ) -> Result<(), NodeManagerError> {
        let mut local_node_watcher = self.local_node_watcher.write().await;
        if let Some(local_node_watcher) = local_node_watcher.as_mut() {
            local_node_watcher.stop_on_exit_codes = STOP_ON_ERROR_CODES.to_vec();
            local_node_watcher
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
        Ok(())
    }

    async fn start_remote_watcher(
        &self,
        base_path: PathBuf,
        config_path: PathBuf,
        log_path: PathBuf,
        shutdown_signal: ShutdownSignal,
        task_tracker: TaskTracker,
    ) -> Result<(), NodeManagerError> {
        let mut remote_node_watcher = self.remote_node_watcher.write().await;
        if let Some(remote_node_watcher) = remote_node_watcher.as_mut() {
            remote_node_watcher.stop_on_exit_codes = STOP_ON_ERROR_CODES.to_vec();
            remote_node_watcher
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
        Ok(())
    }

    async fn configure_local_adapter(
        &self,
        is_current: bool,
        use_tor: bool,
        tor_control_port: Option<u16>,
    ) -> Result<(), anyhow::Error> {
        let mut local_node_watcher = self.local_node_watcher.write().await;
        if let Some(local_node_watcher) = local_node_watcher.as_mut() {
            local_node_watcher.adapter.use_tor(use_tor);
            local_node_watcher
                .adapter
                .set_tor_control_port(tor_control_port);
            if is_current {
                let mut current_adapter = self.current_adapter.write().await;
                *current_adapter = Box::new(local_node_watcher.adapter.clone());
            }
        }
        Ok(())
    }

    async fn configure_remote_adapter(
        &self,
        is_current: bool,
        remote_grpc_address: Option<String>,
    ) -> Result<(), anyhow::Error> {
        let mut remote_node_watcher = self.remote_node_watcher.write().await;
        if let Some(remote_node_watcher) = remote_node_watcher.as_mut() {
            if let Some(remote_grpc_address) = remote_grpc_address {
                remote_node_watcher
                    .adapter
                    .set_grpc_address(remote_grpc_address)?;
            }
            if is_current {
                let mut current_adapter = self.current_adapter.write().await;
                *current_adapter = Box::new(remote_node_watcher.adapter.clone());
            }
        }
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
        let node_type = self.get_node_type().await?;

        match node_type {
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

    async fn switch_to_local_after_remote(
        &self,
        mut shutdown_signal: ShutdownSignal,
    ) -> Result<(), anyhow::Error> {
        let node_type = self.node_type.clone();
        let node_manager = self.clone();
        TasksTrackers::current().node_phase.get_task_tracker().await.spawn(async move {
            select! {
                _ = shutdown_signal.wait() => {
                    info!(target: LOG_TARGET, "Shutdown signal received, stopping local node watcher");
                }
                _ = async {
                    for _ in 0..100 {
                        let local_current_service = {
                            let local_node_watcher = node_manager.local_node_watcher.read().await;
                            local_node_watcher.as_ref().and_then(|watcher| watcher.adapter.get_service())
                        };

                        if let Some(local_current_service) = local_current_service {
                            match local_current_service
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
                                        println!("PODMIANIA current adaptera");
                                        let local_node_watcher = node_manager.local_node_watcher.read().await;
                                        if let Some(local_node_watcher) = &*local_node_watcher {
                                            let mut current_adapter = node_manager.current_adapter.write().await;
                                            *current_adapter = Box::new(local_node_watcher.adapter.clone());
                                        }
                                    };
                                    info!(target: LOG_TARGET, "Local Node successfully switched");
                                    {
                                        SetupManager::get_instance().handle_switch_to_local_node().await;
                                        let mut remote_node_watcher = node_manager.remote_node_watcher.write().await;
                                        if let Some(remote_node_watcher) = remote_node_watcher.as_mut() {
                                            if let Err(e) = remote_node_watcher.stop().await {
                                                error!(target: LOG_TARGET, "Failed to stop local node watcher: {}", e);
                                            }
                                        }
                                    }
                                    break;
                                }
                                Err(NodeStatusMonitorError::NodeNotStarted) => {}
                                Err(e) => {
                                    error!(target: LOG_TARGET, "NodeManagerError: {}", NodeManagerError::UnknownError(e.into()));
                                }
                            };
                        }

                        tokio::time::sleep(Duration::from_secs(2)).await;
                    }
                } => {}
            }
        });

        Ok(())
    }

    pub async fn wait_synced(
        &self,
        progress_trackers: Vec<Option<ChanneledStepUpdate>>,
    ) -> Result<(), anyhow::Error> {
        self.wait_ready().await?;
        loop {
            let current_service = self.get_current_service().await?;
            match current_service
                .wait_synced(progress_trackers.clone(), self.shutdown.clone())
                .await
            {
                Ok(_) => {
                    return Ok(());
                }
                Err(e) => match e {
                    NodeStatusMonitorError::NodeNotStarted => {
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
            let node_type = self.get_node_type().await?;
            match node_type {
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
                Err(err) => {
                    warn!(target: LOG_TARGET, "Node did not return get_identity, waiting.. | {}",err);
                    tokio::time::sleep(tokio::time::Duration::from_secs(1)).await;
                }
            }
        }
        Ok(())
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

    pub async fn get_node_type(&self) -> Result<NodeType, anyhow::Error> {
        let node_type = self.node_type.read().await;
        Ok(node_type.clone())
    }

    pub async fn get_current_service(&self) -> Result<NodeAdapterService, anyhow::Error> {
        let current_adapter = self.current_adapter.read().await;
        current_adapter
            .get_service()
            .ok_or_else(|| anyhow::anyhow!("Node not started"))
    }

    pub async fn get_identity(&self) -> Result<NodeIdentity, anyhow::Error> {
        let current_service = self.get_current_service().await?;
        current_service.get_identity().await.inspect_err(|e| {
            error!(target: LOG_TARGET, "Error getting node identity: {}", e);
        })
    }

    pub async fn get_connection_address(&self) -> Result<String, anyhow::Error> {
        let current_adapter = self.current_adapter.read().await;
        current_adapter.get_connection_address().await
    }

    pub async fn get_grpc_address(&self) -> Result<String, anyhow::Error> {
        let current_adapter = self.current_adapter.read().await;
        let grpc_address = current_adapter.get_grpc_address();

        if let Some((host, port)) = grpc_address {
            if host.starts_with("http") {
                return Ok(format!("{}:{}", host, port));
            } else {
                return Ok(format!("http://{}:{}", host, port));
            }
        }
        Err(anyhow::anyhow!("grpc_address not set"))
    }

    pub async fn check_if_is_orphan_chain(
        &self,
        report_to_sentry: bool,
    ) -> Result<bool, anyhow::Error> {
        let current_service = self.get_current_service().await?;
        current_service
            .check_if_is_orphan_chain(report_to_sentry)
            .await
    }

    pub async fn list_connected_peers(&self) -> Result<Vec<String>, anyhow::Error> {
        let current_service = self.get_current_service().await?;
        current_service.list_connected_peers().await
    }
}
