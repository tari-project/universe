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

use std::collections::HashMap;
use std::fmt::Display;
use std::path::{Path, PathBuf};
use std::sync::atomic::AtomicBool;
use std::sync::Arc;
use std::time::Duration;

use log::{error, info, warn};
use serde::{Deserialize, Serialize};
use tari_common::configuration::Network;
use tari_crypto::ristretto::RistrettoPublicKey;
use tari_shutdown::ShutdownSignal;
use tokio::sync::watch::{self, Sender};
use tokio::sync::RwLock;
use tokio::time::sleep;
use tokio::{fs, select};
use tokio_util::task::TaskTracker;

use crate::configs::config_core::ConfigCore;
use crate::configs::trait_config::ConfigImpl;
use crate::node::node_adapter::{
    NodeAdapter, NodeAdapterService, NodeIdentity, NodeStatusMonitorError, ReadinessStatus,
};
use crate::process_adapter::ProcessAdapter;
use crate::process_stats_collector::ProcessStatsCollectorBuilder;
use crate::process_watcher::ProcessWatcher;
use crate::process_watcher::ProcessWatcherStats;
use crate::progress_trackers::progress_stepper::IncrementalProgressTracker;
use crate::setup::setup_manager::SetupManager;
use crate::tasks_tracker::TasksTrackers;
use crate::{BaseNodeStatus, LocalNodeAdapter, RemoteNodeAdapter, LOG_TARGET_APP_LOGIC};

#[derive(Debug, thiserror::Error)]
pub enum NodeManagerError {
    #[error("Node failed to start and was stopped with exit code: {}", .0)]
    ExitCode(i32),
    #[error("Node failed with an unknown error: {0}")]
    UnknownError(#[from] anyhow::Error),
}

pub const STOP_ON_ERROR_CODES: [i32; 2] = [114, 102];

#[derive(Clone, Debug, PartialEq, Serialize, Deserialize, Default)]
pub enum NodeType {
    Local,
    #[default]
    Remote,
    RemoteUntilLocal,
    LocalAfterRemote,
}

impl NodeType {
    pub fn is_local(&self) -> bool {
        matches!(
            self,
            NodeType::Local | NodeType::LocalAfterRemote | NodeType::RemoteUntilLocal
        )
    }
    pub fn is_remote(&self) -> bool {
        matches!(self, NodeType::Remote | NodeType::RemoteUntilLocal)
    }
}

impl Display for NodeType {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            NodeType::Local => write!(f, "Local"),
            NodeType::Remote => write!(f, "Remote"),
            NodeType::RemoteUntilLocal => write!(f, "RemoteUntilLocal"),
            NodeType::LocalAfterRemote => write!(f, "LocalAfterRemote"),
        }
    }
}

#[derive(Clone)]
pub struct NodeManager {
    node_type: Arc<RwLock<NodeType>>,
    local_node_watcher: Arc<RwLock<Option<ProcessWatcher<LocalNodeAdapter>>>>,
    remote_node_watcher: Arc<RwLock<Option<ProcessWatcher<RemoteNodeAdapter>>>>,
    current_adapter: Arc<RwLock<Box<dyn NodeAdapter + Send + Sync>>>,
    base_node_watch_tx: watch::Sender<BaseNodeStatus>,
    local_node_watch_rx: watch::Receiver<BaseNodeStatus>,
    remote_node_watch_rx: watch::Receiver<BaseNodeStatus>,
    local_node_db_cleared: Arc<AtomicBool>,
    orphan_chain_detected: Arc<AtomicBool>,
}

impl NodeManager {
    pub fn new(
        stats_collector: &mut ProcessStatsCollectorBuilder,
        local_node_adapter: LocalNodeAdapter,
        remote_node_adapter: RemoteNodeAdapter,
        node_type: NodeType,
        base_node_watch_tx: watch::Sender<BaseNodeStatus>,
        local_node_watch_rx: watch::Receiver<BaseNodeStatus>,
        remote_node_watch_rx: watch::Receiver<BaseNodeStatus>,
    ) -> Self {
        let stats_broadcast = stats_collector.take_minotari_node();
        let local_node_watcher: Option<ProcessWatcher<LocalNodeAdapter>> =
            Some(construct_process_watcher(
                stats_broadcast.clone(),
                local_node_adapter.clone(),
                node_type.is_local(),
            ));
        let remote_node_watcher: Option<ProcessWatcher<RemoteNodeAdapter>> =
            Some(construct_process_watcher(
                stats_broadcast,
                remote_node_adapter.clone(),
                node_type.is_local(),
            ));

        let current_adapter: Box<dyn NodeAdapter + Send + Sync> = match node_type {
            NodeType::Local | NodeType::LocalAfterRemote => Box::new(local_node_adapter),
            NodeType::Remote | NodeType::RemoteUntilLocal => Box::new(remote_node_adapter),
        };

        Self {
            node_type: Arc::new(RwLock::new(node_type)),
            local_node_watcher: Arc::new(RwLock::new(local_node_watcher)),
            remote_node_watcher: Arc::new(RwLock::new(remote_node_watcher)),
            current_adapter: Arc::new(RwLock::new(current_adapter)),
            base_node_watch_tx,
            local_node_watch_rx,
            remote_node_watch_rx,
            local_node_db_cleared: Arc::new(AtomicBool::new(false)),
            orphan_chain_detected: Arc::new(AtomicBool::new(false)),
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

        if self.is_local().await {
            {
                let mut watcher = self.local_node_watcher.write().await;
                if let Some(watcher) = watcher.as_mut() {
                    let chain_data_dir = ConfigCore::content().await.chain_data_directory().clone();
                    watcher.adapter.set_chain_data_directory(chain_data_dir);
                }
            }
            self.configure_adapter(
                self.local_node_watcher.clone(),
                self.is_local_current().await,
                None, // always 127.0.0.1
                use_tor,
                tor_control_port,
            )
            .await?;
            start_watcher(
                &self.local_node_watcher,
                base_path.clone(),
                config_path.clone(),
                log_path.clone(),
                shutdown_signal.clone(),
                task_tracker.clone(),
            )
            .await?;
        }
        if self.is_remote().await {
            self.configure_adapter(
                self.remote_node_watcher.clone(),
                self.is_remote_current().await,
                remote_grpc_address,
                use_tor,
                None, // no control port needed
            )
            .await?;
            start_watcher(
                &self.remote_node_watcher,
                base_path,
                config_path,
                log_path,
                shutdown_signal.clone(),
                task_tracker,
            )
            .await?;
        }

        let node_type = self.get_node_type().await;
        start_status_forwarding_thread(
            self.clone(),
            self.base_node_watch_tx.clone(),
            self.local_node_watch_rx.clone(),
            self.remote_node_watch_rx.clone(),
            shutdown_signal.clone(),
        )
        .await?;
        self.wait_ready().await?;
        if matches!(node_type, NodeType::RemoteUntilLocal) {
            self.switch_to_local_when_synced(shutdown_signal).await?;
        }

        Ok(())
    }

    async fn configure_adapter<T>(
        &self,
        node_watcher: Arc<RwLock<Option<ProcessWatcher<T>>>>,
        is_current: bool,
        remote_grpc_address: Option<String>,
        use_tor: bool,
        tor_control_port: Option<u16>,
    ) -> Result<(), anyhow::Error>
    where
        T: NodeAdapter + ProcessAdapter + Send + Sync + Clone + 'static,
    {
        let mut node_watcher = node_watcher.write().await;
        if let Some(node_watcher) = node_watcher.as_mut() {
            node_watcher.adapter.use_tor(use_tor);
            node_watcher.adapter.set_tor_control_port(tor_control_port);
            let ab_group = *ConfigCore::content().await.ab_group();
            node_watcher.adapter.set_ab_group(ab_group);

            if let Some(remote_grpc_address) = remote_grpc_address {
                node_watcher.adapter.set_grpc_address(remote_grpc_address)?;
            }

            if is_current {
                let mut current_adapter = self.current_adapter.write().await;
                *current_adapter = Box::new(node_watcher.adapter.clone());
            }
        }
        Ok(())
    }

    pub async fn set_node_type(&self, new_node_type: NodeType) {
        let mut node_type = self.node_type.write().await;
        *node_type = new_node_type;
    }

    async fn switch_to_local_when_synced(
        &self,
        shutdown_signal: ShutdownSignal,
    ) -> Result<(), anyhow::Error> {
        let node_type = self.node_type.clone();
        let node_manager = self.clone();

        // Spawn a task to monitor the local node's sync progress
        TasksTrackers::current()
            .node_phase
            .get_task_tracker()
            .await
            .spawn(async move {
                let (progress_params_tx, _) = watch::channel(HashMap::<String, String>::new());
                let (progress_percentage_tx, _) = watch::channel(0f64);

                monitor_local_node_sync_and_switch(
                    node_manager,
                    node_type,
                    progress_params_tx,
                    progress_percentage_tx,
                    shutdown_signal,
                )
                .await;
            });

        Ok(())
    }

    pub async fn wait_synced(
        &self,
        progress_params_tx: &watch::Sender<HashMap<String, String>>,
        progress_percentage_tx: &watch::Sender<f64>,
    ) -> Result<(), anyhow::Error> {
        let shutdown_signal = TasksTrackers::current().node_phase.get_signal().await;
        loop {
            let current_service = self.get_current_service().await?;
            let remote = self.is_remote().await;
            match current_service
                .wait_synced(
                    progress_params_tx,
                    progress_percentage_tx,
                    shutdown_signal.clone(),
                    remote,
                )
                .await
            {
                Ok(_) => {
                    return Ok(());
                }
                Err(_) => {
                    sleep(Duration::from_secs(5)).await;
                    continue;
                }
            }
        }
    }

    pub async fn wait_migration(
        &self,
        migration_tracker: Option<IncrementalProgressTracker>,
    ) -> Result<(), NodeManagerError> {
        if self.is_local().await {
            let current_service = self.get_current_service().await;
            let migration_handle = TasksTrackers::current()
                        .node_phase
                        .get_task_tracker()
                        .await
                        .spawn(async move {
                            let mut shutdown_signal = TasksTrackers::current().node_phase.get_signal().await;
                            let mut migration_completed = false;

                            while !migration_completed {
                                tokio::select! {
                                    _ = shutdown_signal.wait() => {
                                        info!(target: LOG_TARGET_APP_LOGIC, "Node migration interrupted");
                                        break;
                                    }
                                    _ = tokio::time::sleep(Duration::from_millis(2000)) => {
                                        // Try to get node status
                                        if let Ok(ref current_service) = current_service {
                                            if let Ok(status) = current_service.get_network_state(false).await {
                                                match status.readiness_status {
                                                    ReadinessStatus::Migration(progress) => {
                                                        info!(target: LOG_TARGET_APP_LOGIC, "Database migration in progress: {:.1}% ({}/{})",
                                                            progress.progress_percentage, progress.current_block, progress.total_blocks);

                                                        let mut params = HashMap::new();
                                                        params.insert("current_block".to_string(), progress.current_block.to_string());
                                                        params.insert("total_blocks".to_string(), progress.total_blocks.to_string());
                                                        params.insert("current_db_version".to_string(), progress.current_db_version.to_string());
                                                        params.insert("target_db_version".to_string(), progress.target_db_version.to_string());

                                                        if let Some(tracker) = &migration_tracker {
                                                            tracker.send_update(params, progress.progress_percentage / 100.0).await;
                                                        }

                                                        if progress.progress_percentage >= 100.0 {
                                                            info!(target: LOG_TARGET_APP_LOGIC, "Database migration completed");
                                                            migration_completed = true;
                                                        }
                                                    }
                                                    ReadinessStatus::State(state) => match state {
                                                        100 => {
                                                            info!(target: LOG_TARGET_APP_LOGIC, "Node is ready, no migration needed");
                                                            migration_completed = true;
                                                        }
                                                        _ => info!(target: LOG_TARGET_APP_LOGIC, "Received other state: {state}")
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        });
            let _unused = migration_handle.await;
            info!(target: LOG_TARGET_APP_LOGIC, "Migration monitoring completed");
        }
        Ok(())
    }

    pub async fn wait_ready(&self) -> Result<(), NodeManagerError> {
        if self.is_remote().await {
            ensure_node_identity_reachable(&self.remote_node_watcher, "Remote").await?;
        }
        if self.is_local().await {
            ensure_node_identity_reachable(&self.local_node_watcher, "Local").await?;
        }

        Ok(())
    }

    pub async fn clean_data_folder(&self, base_path: &Path) -> Result<(), anyhow::Error> {
        fs::remove_dir_all(
            base_path
                .join("node")
                .join(Network::get_current().to_string().to_lowercase()),
        )
        .await?;
        self.local_node_db_cleared
            .store(true, std::sync::atomic::Ordering::SeqCst);
        Ok(())
    }

    pub async fn get_node_type(&self) -> NodeType {
        let node_type = self.node_type.read().await;
        node_type.clone()
    }

    pub async fn get_current_service(&self) -> Result<NodeAdapterService, anyhow::Error> {
        let current_adapter = self.current_adapter.read().await;
        current_adapter
            .get_service()
            .ok_or_else(|| anyhow::anyhow!("Node not started"))
    }

    pub async fn get_identity(&self) -> Result<NodeIdentity, anyhow::Error> {
        if self.is_local().await {
            let current_service = self.get_current_service().await?;
            current_service.get_identity().await
        } else {
            let (_, address) = self.get_connection_details().await?;
            Ok(NodeIdentity {
                public_key: None,
                public_addresses: vec![address],
            })
        }
    }

    pub async fn get_connection_details(
        &self,
    ) -> Result<(Option<RistrettoPublicKey>, String), anyhow::Error> {
        let current_adapter = self.current_adapter.read().await;
        current_adapter.get_connection_details().await
    }

    pub async fn get_grpc_address(&self) -> Result<String, anyhow::Error> {
        let current_adapter = self.current_adapter.read().await;
        let grpc_address = current_adapter.get_grpc_address();

        if let Some((host, port)) = grpc_address {
            if host.starts_with("http") {
                return Ok(format!("{host}:{port}"));
            } else {
                return Ok(format!("http://{host}:{port}"));
            }
        }
        Err(anyhow::anyhow!("grpc_address not set"))
    }

    pub async fn on_app_exit(&self) {
        if let Some(local_node_adapter) = {
            let watcher_guard = self.local_node_watcher.read().await;
            watcher_guard
                .as_ref()
                .map(|watcher| watcher.adapter.clone())
        } {
            match local_node_adapter
                .ensure_no_hanging_processes_are_running()
                .await
            {
                Ok(_) => {
                    info!(target: LOG_TARGET_APP_LOGIC, "LocalNodeAdapter::on_app_exit completed successfully");
                }
                Err(e) => {
                    error!(target: LOG_TARGET_APP_LOGIC, "LocalNodeAdapter::on_app_exit failed: {}", e);
                }
            }
        }

        if let Some(remote_node_adapter) = {
            let watcher_guard = self.remote_node_watcher.read().await;
            watcher_guard
                .as_ref()
                .map(|watcher| watcher.adapter.clone())
        } {
            match remote_node_adapter
                .ensure_no_hanging_processes_are_running()
                .await
            {
                Ok(_) => {
                    info!(target: LOG_TARGET_APP_LOGIC, "RemoteNodeAdapter::on_app_exit completed successfully");
                }
                Err(e) => {
                    error!(target: LOG_TARGET_APP_LOGIC, "RemoteNodeAdapter::on_app_exit failed: {}", e);
                }
            }
        }
    }

    pub async fn get_grpc_port(&self) -> Result<u16, anyhow::Error> {
        let current_adapter = self.current_adapter.read().await;
        let grpc_address = current_adapter.get_grpc_address();

        if let Some((_host, port)) = grpc_address {
            return Ok(port);
        }
        Err(anyhow::anyhow!("grpc_address not set"))
    }

    pub async fn get_http_api_url(&self) -> String {
        let current_adapter = self.current_adapter.read().await;
        current_adapter.get_http_api_url()
    }

    pub async fn check_if_is_orphan_chain(&self) -> Result<bool, anyhow::Error> {
        let base_node_status_rx = self.base_node_watch_tx.subscribe();
        let base_node_status = *base_node_status_rx.borrow();
        if !base_node_status.is_synced {
            info!(target: LOG_TARGET_APP_LOGIC, "Node is not synced, skipping orphan chain check");
            return Ok(false);
        }

        let current_service = self.get_current_service().await?;
        let orphan_chain_detected = current_service.check_if_is_orphan_chain().await?;
        self.orphan_chain_detected
            .store(orphan_chain_detected, std::sync::atomic::Ordering::SeqCst);
        Ok(orphan_chain_detected)
    }

    pub fn is_on_orphan_chain(&self) -> bool {
        self.orphan_chain_detected
            .load(std::sync::atomic::Ordering::SeqCst)
    }

    pub async fn list_connected_peers(&self) -> Result<Vec<String>, anyhow::Error> {
        if self.is_local().await {
            let current_service = self.get_current_service().await?;
            current_service.list_connected_peers().await
        } else {
            Ok(Vec::new())
        }
    }

    // Self Checks
    pub async fn is_local(&self) -> bool {
        let node_type = self.get_node_type().await;
        node_type.is_local()
    }

    pub async fn is_local_current(&self) -> bool {
        let node_type = self.get_node_type().await;
        matches!(node_type, NodeType::Local | NodeType::LocalAfterRemote)
    }

    pub async fn is_remote_current(&self) -> bool {
        self.is_remote().await
    }

    pub async fn is_remote(&self) -> bool {
        let node_type = self.get_node_type().await;
        node_type.is_remote()
    }
}

// Helpers
fn construct_process_watcher<T: NodeAdapter + ProcessAdapter + Send + Sync + 'static>(
    stats_broadcast: Sender<ProcessWatcherStats>,
    node_adapter: T,
    is_local: bool,
) -> ProcessWatcher<T> {
    let mut process_watcher = ProcessWatcher::new(node_adapter, stats_broadcast);
    if is_local {
        process_watcher.poll_time = Duration::from_secs(5);
        process_watcher.health_timeout = Duration::from_secs(4);
    } else {
        process_watcher.poll_time = Duration::from_secs(45);
        process_watcher.health_timeout = Duration::from_secs(44);
    }
    // NODE: Temporary solution to process payrefs in TU v1.2.9
    process_watcher.expected_startup_time = Duration::from_secs(540); // 9mins

    process_watcher
}

async fn start_watcher<T>(
    node_watcher: &Arc<RwLock<Option<ProcessWatcher<T>>>>,
    base_path: PathBuf,
    config_path: PathBuf,
    log_path: PathBuf,
    shutdown_signal: ShutdownSignal,
    task_tracker: TaskTracker,
) -> Result<(), NodeManagerError>
where
    T: ProcessAdapter + Send + Sync + 'static,
{
    let mut watcher_guard = node_watcher.write().await;
    if let Some(watcher_ref) = watcher_guard.as_mut() {
        watcher_ref.stop_on_exit_codes = STOP_ON_ERROR_CODES.to_vec();
        watcher_ref
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

async fn stop_watcher_on_error<T>(
    node_watcher: &Arc<RwLock<Option<ProcessWatcher<T>>>>,
    error: anyhow::Error,
) -> Result<(), NodeManagerError>
where
    T: ProcessAdapter + Send + Sync + 'static,
{
    let mut watcher_guard = node_watcher.write().await;
    if let Some(watcher_ref) = watcher_guard.as_mut() {
        let exit_code = watcher_ref.stop().await?;
        if exit_code != 0 {
            return Err(NodeManagerError::ExitCode(exit_code));
        }
    }
    Err(NodeManagerError::UnknownError(error))
}

async fn wait_ready_for_node_process<T>(
    node_watcher: &Arc<RwLock<Option<ProcessWatcher<T>>>>,
) -> Result<(), NodeManagerError>
where
    T: ProcessAdapter + Send + Sync + 'static,
{
    let mut watcher = node_watcher.write().await;
    if let Some(watcher_ref) = watcher.as_mut() {
        match watcher_ref.wait_ready().await {
            Ok(_) => Ok(()),
            Err(e) => {
                let exit_code = watcher_ref.stop().await?;
                if exit_code != 0 {
                    return Err(NodeManagerError::ExitCode(exit_code));
                }
                Err(NodeManagerError::UnknownError(e))
            }
        }
    } else {
        Err(NodeManagerError::UnknownError(anyhow::Error::msg(
            "Node watcher not defined",
        )))
    }
}

pub async fn start_status_forwarding_thread(
    node_manager: NodeManager,
    base_node_watch_tx: watch::Sender<BaseNodeStatus>,
    mut local_node_watch_rx: watch::Receiver<BaseNodeStatus>,
    mut remote_node_watch_rx: watch::Receiver<BaseNodeStatus>,
    mut shutdown_signal: ShutdownSignal,
) -> Result<(), anyhow::Error> {
    // Keep track of last status to compare for meaningful changes
    let mut last_local_status: Option<BaseNodeStatus> = None;
    let mut last_remote_status: Option<BaseNodeStatus> = None;

    TasksTrackers::current().node_phase.get_task_tracker().await.spawn(async move {
        loop {
            tokio::select! {
                _ = shutdown_signal.wait() => {
                    info!(target: LOG_TARGET_APP_LOGIC, "Shutdown signal received, stopping status forwarding thread");
                    break;
                }
                // Local node status update received
                Ok(()) = local_node_watch_rx.changed() => {
                    if node_manager.is_local_current().await {
                        let status = *local_node_watch_rx.borrow();
                        let should_log = match last_local_status {
                            Some(last) => {
                                status.block_height != last.block_height ||
                                status.is_synced != last.is_synced
                            },
                            None => true,
                        };

                        if base_node_watch_tx.send(status).is_err() {
                            error!(target: LOG_TARGET_APP_LOGIC, "Failed to forward local BaseNodeStatus via base_node_watch_tx");
                        }
                        if should_log {
                            info!(target: LOG_TARGET_APP_LOGIC, "Forwarded Local BaseNodeStatus: {status:?}");
                            last_local_status = Some(status);
                        }
                    }
                }
                // Remote node status update received
                Ok(()) = remote_node_watch_rx.changed() => {
                    if node_manager.is_remote_current().await {
                        let status = *remote_node_watch_rx.borrow();
                        let should_log = match last_remote_status {
                            Some(last) => {
                                status.block_height != last.block_height ||
                                status.is_synced != last.is_synced
                            },
                            None => true, // First status update always gets logged
                        };

                        if base_node_watch_tx.send(status).is_err() {
                            error!(target: LOG_TARGET_APP_LOGIC, "Failed to forward remote BaseNodeStatus via base_node_watch_tx");
                        }
                        if should_log {
                            info!(target: LOG_TARGET_APP_LOGIC, "Forwarded Remote BaseNodeStatus: {status:?}");
                            last_remote_status = Some(status);
                        }
                    }
                }
            }
        }
    });

    Ok(())
}

async fn ensure_node_identity_reachable<T>(
    node_watcher: &Arc<RwLock<Option<ProcessWatcher<T>>>>,
    node_type: &str,
) -> Result<(), NodeManagerError>
where
    T: NodeAdapter + ProcessAdapter + Send + Sync + 'static,
{
    let shutdown_signal = TasksTrackers::current().node_phase.get_signal().await;
    let mut retries = 0;

    while !shutdown_signal.is_triggered() {
        if let Some(service) = {
            let watcher_guard = node_watcher.read().await;
            watcher_guard
                .as_ref()
                .and_then(|watcher| watcher.adapter.get_service())
        } {
            wait_ready_for_node_process(node_watcher).await?;
            match service.get_identity().await {
                Ok(_) => {
                    wait_ready_for_node_process(node_watcher).await?;
                    return Ok(());
                }
                Err(err) => {
                    // NODE: Temporary solution to process payrefs in TU v1.2.9
                    if retries > 420 {
                        warn!(
                            target: LOG_TARGET_APP_LOGIC,
                            "Max retries exceeded for {node_type} node identity readiness. Stopping watcher. Error: {err}"
                        );
                        return stop_watcher_on_error(node_watcher, err).await;
                    }
                    warn!(
                        target: LOG_TARGET_APP_LOGIC,
                        "[ensure_node_identity_reachable] {node_type} node did not return identity, retrying in 1 second... | {err}"
                    );
                    retries += 1;
                }
            }
        } else {
            error!(
                target: LOG_TARGET_APP_LOGIC,
                "{node_type} node service is unavailable - ensure_node_identity_reachable skipped"
            );
            break;
        }

        tokio::time::sleep(Duration::from_secs(1)).await;
    }

    Ok(())
}

async fn monitor_local_node_sync_and_switch(
    node_manager: NodeManager,
    node_type: Arc<RwLock<NodeType>>,
    progress_params_tx: watch::Sender<HashMap<String, String>>,
    progress_percentage_tx: watch::Sender<f64>,
    mut shutdown_signal: ShutdownSignal,
) {
    select! {
        _ = shutdown_signal.wait() => {
            info!(target: LOG_TARGET_APP_LOGIC, "Shutdown signal received, stopping local node watcher");
        }
        _ = async {
            let shutdown_signal = TasksTrackers::current().node_phase.get_signal().await;
            for _ in 0..100 {
                if let Some(local_node_service) = {
                    let local_node_watcher = node_manager.local_node_watcher.read().await;
                    local_node_watcher.as_ref().and_then(|watcher| watcher.adapter.get_service())
                } {
                    match local_node_service
                        .wait_synced(&progress_params_tx, &progress_percentage_tx, shutdown_signal.clone(), false)
                        .await
                    {
                        Ok(synced_height) => {
                            let remote_node_height = node_manager.remote_node_watch_rx.borrow().block_height;
                            if synced_height + 50 < remote_node_height {
                                warn!(target: LOG_TARGET_APP_LOGIC, "Sync completed but local node is behind remote node by more than 50 blocks. Attempting to sync again");
                                sleep(Duration::from_secs(3)).await; // Wait for 3 seconds before retrying to ensure the node has time to enter syncing state again
                                continue;
                            }
                            sleep(Duration::from_secs(30)).await; // Wait 30 secs to not interfere with the setup when node already synced
                            info!(target: LOG_TARGET_APP_LOGIC, "Local node synced, switching node type...");
                            switch_to_local(node_manager.clone(), node_type.clone()).await;
                            break;
                        }
                        Err(NodeStatusMonitorError::NodeNotStarted) => {
                            info!(target: LOG_TARGET_APP_LOGIC, "Local node not started, waiting...");
                        }
                        Err(e) => {
                            error!(target: LOG_TARGET_APP_LOGIC, "NodeManagerError: {}", NodeManagerError::UnknownError(e.into()));
                        }
                    };
                }

                tokio::time::sleep(Duration::from_secs(2)).await;
            }
        } => {}
    }
}

async fn switch_to_local(node_manager: NodeManager, node_type: Arc<RwLock<NodeType>>) {
    {
        let mut node_type = node_type.write().await;
        *node_type = NodeType::LocalAfterRemote;
    }
    {
        let local_node_watcher = node_manager.local_node_watcher.read().await;
        if let Some(local_node_watcher) = &*local_node_watcher {
            let mut current_adapter = node_manager.current_adapter.write().await;
            *current_adapter = Box::new(local_node_watcher.adapter.clone());
        }
    }
    info!(target: LOG_TARGET_APP_LOGIC, "Local Node successfully switched");

    {
        SetupManager::get_instance()
            .handle_switch_to_local_node()
            .await;
        let mut remote_node_watcher = node_manager.remote_node_watcher.write().await;
        if let Some(remote_node_watcher) = remote_node_watcher.as_mut() {
            if let Err(e) = remote_node_watcher.stop().await {
                error!(target: LOG_TARGET_APP_LOGIC, "Failed to stop remote node watcher: {e}");
            }
        }
    }
}
