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
use std::path::{Path, PathBuf};
use std::sync::atomic::AtomicBool;
use std::sync::Arc;
use std::time::Duration;

use dirs::data_local_dir;
use log::{error, info, warn};
use serde::Serialize;
use tari_common::configuration::Network;
use tari_crypto::ristretto::RistrettoPublicKey;
use tari_shutdown::ShutdownSignal;
use tauri::AppHandle;
use tokio::sync::watch::{self, Sender};
use tokio::sync::RwLock;
use tokio::{fs, select};
use tokio_util::task::TaskTracker;

use crate::events_manager::EventsManager;
use crate::node::node_adapter::{
    NodeAdapter, NodeAdapterService, NodeIdentity, NodeStatusMonitorError,
};
use crate::process_adapter::ProcessAdapter;
use crate::process_stats_collector::ProcessStatsCollectorBuilder;
use crate::process_watcher::ProcessWatcher;
use crate::process_watcher::ProcessWatcherStats;
use crate::setup::setup_manager::SetupManager;
use crate::tasks_tracker::TasksTrackers;
use crate::{BaseNodeStatus, LocalNodeAdapter, RemoteNodeAdapter, APPLICATION_FOLDER_ID};

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
    Local,
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

#[derive(Clone)]
pub struct NodeManager {
    node_type: Arc<RwLock<NodeType>>,
    local_node_watcher: Arc<RwLock<Option<ProcessWatcher<LocalNodeAdapter>>>>,
    remote_node_watcher: Arc<RwLock<Option<ProcessWatcher<RemoteNodeAdapter>>>>,
    current_adapter: Arc<RwLock<Box<dyn NodeAdapter + Send + Sync>>>,
    shutdown: ShutdownSignal,
    base_node_watch_tx: watch::Sender<BaseNodeStatus>,
    local_node_watch_rx: watch::Receiver<BaseNodeStatus>,
    remote_node_watch_rx: watch::Receiver<BaseNodeStatus>,
    local_node_db_cleared: Arc<AtomicBool>,
}

impl NodeManager {
    pub fn new(
        stats_collector: &mut ProcessStatsCollectorBuilder,
        local_node_adapter: LocalNodeAdapter,
        remote_node_adapter: RemoteNodeAdapter,
        shutdown: ShutdownSignal,
        node_type: NodeType,
        base_node_watch_tx: watch::Sender<BaseNodeStatus>,
        local_node_watch_rx: watch::Receiver<BaseNodeStatus>,
        remote_node_watch_rx: watch::Receiver<BaseNodeStatus>,
    ) -> Self {
        let stats_broadcast = stats_collector.take_minotari_node();
        let mut local_node_watcher: Option<ProcessWatcher<LocalNodeAdapter>> = None;
        if node_type.is_local() {
            local_node_watcher = Some(construct_process_watcher(
                stats_broadcast.clone(),
                local_node_adapter.clone(),
                node_type.is_local(),
            ));
        }
        let mut remote_node_watcher: Option<ProcessWatcher<RemoteNodeAdapter>> = None;
        if node_type.is_remote() {
            remote_node_watcher = Some(construct_process_watcher(
                stats_broadcast,
                remote_node_adapter.clone(),
                node_type.is_local(),
            ));
        }

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
            base_node_watch_tx,
            local_node_watch_rx,
            remote_node_watch_rx,
            local_node_db_cleared: Arc::new(AtomicBool::new(false)),
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
        app_handle: AppHandle,
    ) -> Result<(), NodeManagerError> {
        let shutdown_signal = TasksTrackers::current().node_phase.get_signal().await;
        let task_tracker = TasksTrackers::current().node_phase.get_task_tracker().await;

        if self.is_local().await? {
            self.configure_adapter(
                self.local_node_watcher.clone(),
                self.is_local_current().await?,
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
        if self.is_remote().await? {
            self.configure_adapter(
                self.remote_node_watcher.clone(),
                self.is_remote_current().await?,
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

        let node_type = self.get_node_type().await?;
        if matches!(node_type, NodeType::RemoteUntilLocal) {
            self.switch_to_local_when_synced(shutdown_signal.clone(), app_handle)
                .await?;
        }
        start_status_forwarding_thread(
            self.clone(),
            self.base_node_watch_tx.clone(),
            self.local_node_watch_rx.clone(),
            self.remote_node_watch_rx.clone(),
            shutdown_signal,
        )
        .await?;
        self.wait_ready().await?;

        Ok(())
    }

    pub async fn clear_local_files(&self) -> Result<(), anyhow::Error> {
        if self.is_local().await.ok().is_some_and(|is_local| is_local) {
            let watcher = self.local_node_watcher.read().await;
            if watcher.as_ref().is_some_and(|watcher| watcher.is_running()) {
                error!(target: LOG_TARGET, "Local node is running, cannot clear local files");
            }

            if let Some(local_dir) = data_local_dir() {
                let node_dir = local_dir
                    .join(APPLICATION_FOLDER_ID)
                    .join("node")
                    .join(Network::get_current().as_key_str());

                if node_dir.exists() {
                    std::fs::remove_dir_all(&node_dir).map_err(|e| {
                        error!(target: LOG_TARGET, "Failed to remove node directory: {}", e);
                        anyhow::anyhow!("Failed to remove node directory: {}", e)
                    })?;
                }
            };
        };

        if self
            .is_remote()
            .await
            .ok()
            .is_some_and(|is_remote| is_remote)
        {
            let watcher = self.remote_node_watcher.read().await;
            if watcher.as_ref().is_some_and(|watcher| watcher.is_running()) {
                error!(target: LOG_TARGET, "Remote node is running, cannot clear local files");
            }
        };

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

    async fn switch_to_local_when_synced(
        &self,
        shutdown_signal: ShutdownSignal,
        app_handle: AppHandle,
    ) -> Result<(), anyhow::Error> {
        let node_type = self.node_type.clone();
        let node_manager = self.clone();
        let app_handle = app_handle.clone();

        // Spawn a task to monitor the local node's sync progress
        TasksTrackers::current()
            .node_phase
            .get_task_tracker()
            .await
            .spawn(async move {
                let (progress_params_tx, progress_params_rx) =
                    watch::channel(HashMap::<String, String>::new());
                let (progress_percentage_tx, progress_percentage_rx) = watch::channel(0f64);

                let shutdown_signal_clone = shutdown_signal.clone();
                spawn_syncing_updater(
                    progress_params_rx,
                    progress_percentage_rx,
                    shutdown_signal_clone,
                    app_handle.clone(),
                )
                .await;

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
        self.wait_ready().await?;
        loop {
            let current_service = self.get_current_service().await?;
            match current_service
                .wait_synced(
                    progress_params_tx,
                    progress_percentage_tx,
                    self.shutdown.clone(),
                )
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
        if self.is_remote().await? {
            wait_ready_for_node_process(&self.remote_node_watcher).await?;
            ensure_node_identity_reachable(&self.remote_node_watcher, "Remote").await?;
        }
        if self.is_local().await? {
            wait_ready_for_node_process(&self.local_node_watcher).await?;
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

    pub async fn get_connection_details(
        &self,
    ) -> Result<(RistrettoPublicKey, String), anyhow::Error> {
        let current_adapter = self.current_adapter.read().await;
        current_adapter.get_connection_details().await
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

    // Self Checks
    pub async fn is_local(&self) -> Result<bool, anyhow::Error> {
        let node_type = self.get_node_type().await?;
        Ok(node_type.is_local())
    }

    pub async fn is_local_current(&self) -> Result<bool, anyhow::Error> {
        let node_type = self.get_node_type().await?;
        Ok(matches!(
            node_type,
            NodeType::Local | NodeType::LocalAfterRemote
        ))
    }

    pub async fn is_remote_current(&self) -> Result<bool, anyhow::Error> {
        self.is_remote().await
    }

    pub async fn is_remote(&self) -> Result<bool, anyhow::Error> {
        let node_type = self.get_node_type().await?;
        Ok(node_type.is_remote())
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
        process_watcher.poll_time = Duration::from_secs(10);
        process_watcher.health_timeout = Duration::from_secs(9);
    }
    process_watcher.expected_startup_time = Duration::from_secs(30);

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
                    info!(target: LOG_TARGET, "Shutdown signal received, stopping status forwarding thread");
                    break;
                }
                // Local node status update received
                Ok(()) = local_node_watch_rx.changed() => {
                    let is_local_current = node_manager.is_local_current().await;
                    if is_local_current.unwrap_or(false) {
                        let status = *local_node_watch_rx.borrow();
                        let should_log = match last_local_status {
                            Some(last) => {
                                status.block_height != last.block_height ||
                                status.is_synced != last.is_synced
                            },
                            None => true,
                        };

                        if base_node_watch_tx.send(status).is_err() {
                            error!(target: LOG_TARGET, "Failed to forward local BaseNodeStatus via base_node_watch_tx");
                        }
                        if should_log {
                            info!(target: LOG_TARGET, "Forwarded Local BaseNodeStatus: {:?}", status);
                            last_local_status = Some(status);
                        }
                    }
                }
                // Remote node status update received
                Ok(()) = remote_node_watch_rx.changed() => {
                    let is_remote_current = node_manager.is_remote_current().await;
                    if is_remote_current.unwrap_or(false) {
                        let status = *remote_node_watch_rx.borrow();
                        let should_log = match last_remote_status {
                            Some(last) => {
                                status.block_height != last.block_height ||
                                status.is_synced != last.is_synced
                            },
                            None => true, // First status update always gets logged
                        };

                        if base_node_watch_tx.send(status).is_err() {
                            error!(target: LOG_TARGET, "Failed to forward remote BaseNodeStatus via base_node_watch_tx");
                        }
                        if should_log {
                            info!(target: LOG_TARGET, "Forwarded Remote BaseNodeStatus: {:?}", status);
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
            match service.get_identity().await {
                Ok(_) => {
                    return Ok(());
                }
                Err(err) => {
                    if retries > 20 {
                        warn!(
                            target: LOG_TARGET,
                            "Max retries exceeded for {} node identity readiness. Stopping watcher. Error: {}",
                            node_type,
                            err
                        );
                        return stop_watcher_on_error(node_watcher, err).await;
                    }
                    warn!(
                        target: LOG_TARGET,
                        "[ensure_node_identity_reachable] {} node did not return identity, retrying in 1 second... | {}",
                        node_type,
                        err
                    );
                    retries += 1;
                }
            }
        } else {
            error!(
                target: LOG_TARGET,
                "{} node service is unavailable - ensure_node_identity_reachable skipped",
                node_type
            );
            break;
        }

        tokio::time::sleep(Duration::from_secs(1)).await;
    }

    Ok(())
}

async fn spawn_syncing_updater(
    mut progress_params_rx: watch::Receiver<HashMap<String, String>>,
    progress_percentage_rx: watch::Receiver<f64>,
    mut shutdown_signal: ShutdownSignal,
    app_handle: AppHandle,
) {
    TasksTrackers::current()
        .node_phase
        .get_task_tracker()
        .await
        .spawn(async move {
            loop {
                tokio::select! {
                    _ = progress_params_rx.changed() => {
                        let progress_params = progress_params_rx.borrow().clone();
                        let percentage = *progress_percentage_rx.borrow();
                        if let Some(step) = progress_params.get("step").cloned() {
                            EventsManager::handle_background_node_sync_update(&app_handle, progress_params.clone()).await;
                            if step == "Block" && percentage == 1.0 {
                                break;
                            }
                        }
                        tokio::time::sleep(Duration::from_secs(1)).await;
                    },
                    _ = shutdown_signal.wait() => {
                        break;
                    }
                }
            }
        });
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
            info!(target: LOG_TARGET, "Shutdown signal received, stopping local node watcher");
        }
        _ = async {
            for _ in 0..100 {
                if let Some(local_node_service) = {
                    let local_node_watcher = node_manager.local_node_watcher.read().await;
                    local_node_watcher.as_ref().and_then(|watcher| watcher.adapter.get_service())
                } {
                    match local_node_service
                        .wait_synced(&progress_params_tx, &progress_percentage_tx, node_manager.shutdown.clone())
                        .await
                    {
                        Ok(_) => {
                            info!(target: LOG_TARGET, "Local node synced, switching node type...");
                            switch_to_local(node_manager.clone(), node_type.clone()).await;
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
    info!(target: LOG_TARGET, "Local Node successfully switched");

    {
        SetupManager::get_instance()
            .handle_switch_to_local_node()
            .await;
        let mut remote_node_watcher = node_manager.remote_node_watcher.write().await;
        if let Some(remote_node_watcher) = remote_node_watcher.as_mut() {
            if let Err(e) = remote_node_watcher.stop().await {
                error!(target: LOG_TARGET, "Failed to stop remote node watcher: {}", e);
            }
        }
    }
}
