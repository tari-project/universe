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

use crate::internal_wallet::InternalWallet;
use crate::node::node_manager::{NodeManager, NodeManagerError};
use crate::process_adapter::ProcessAdapter;
use crate::process_stats_collector::ProcessStatsCollectorBuilder;
use crate::process_watcher::ProcessWatcher;
use crate::tasks_tracker::TasksTrackers;
use crate::wallet::wallet_adapter::WalletAdapter;
use crate::wallet::wallet_types::WalletState;
use crate::{BaseNodeStatus, LOG_TARGET_APP_LOGIC};
use futures_util::future::FusedFuture;
use log::{error, info};
use std::path::{Path, PathBuf};
use std::sync::atomic::AtomicBool;
use std::sync::Arc;
use std::time::Duration;
use tari_common::configuration::Network;
use tari_shutdown::ShutdownSignal;
use tokio::fs;
use tokio::sync::watch;
use tokio::sync::RwLock;

#[derive(Debug, Clone)]
pub struct WalletStartupConfig {
    pub base_path: PathBuf,
    pub config_path: PathBuf,
    pub log_path: PathBuf,
    pub use_tor: bool,
    pub connect_with_local_node: bool,
}

#[derive(thiserror::Error, Debug)]
pub enum WalletManagerError {
    #[error("Wallet not started")]
    #[allow(dead_code)]
    WalletNotStarted,
    #[error("Node manager error: {0}")]
    NodeManagerError(#[from] NodeManagerError),
    #[error("Wallet failed to start and was stopped with exit code: {}", .0)]
    ExitCode(i32),
    #[error("Unknown error: {0}")]
    UnknownError(#[from] anyhow::Error),
}
pub const STOP_ON_ERROR_CODES: [i32; 1] = [101];

pub struct WalletManager {
    watcher: Arc<RwLock<ProcessWatcher<WalletAdapter>>>,
    node_manager: NodeManager,
    initial_scan_completed: Arc<AtomicBool>,
    base_node_watch_rx: watch::Receiver<BaseNodeStatus>,
}

impl Clone for WalletManager {
    fn clone(&self) -> Self {
        Self {
            watcher: self.watcher.clone(),
            node_manager: self.node_manager.clone(),
            initial_scan_completed: self.initial_scan_completed.clone(),
            base_node_watch_rx: self.base_node_watch_rx.clone(),
        }
    }
}

impl WalletManager {
    pub fn new(
        node_manager: NodeManager,
        wallet_state_watch_tx: watch::Sender<Option<WalletState>>,
        stats_collector: &mut ProcessStatsCollectorBuilder,
        base_node_watch_rx: watch::Receiver<BaseNodeStatus>,
    ) -> Self {
        let adapter = WalletAdapter::new(wallet_state_watch_tx);
        let process_watcher = ProcessWatcher::new(adapter, stats_collector.take_wallet());

        Self {
            watcher: Arc::new(RwLock::new(process_watcher)),
            node_manager,
            initial_scan_completed: Arc::new(AtomicBool::new(false)),
            base_node_watch_rx,
        }
    }

    pub async fn ensure_started(
        &self,
        app_shutdown: ShutdownSignal,
        config: WalletStartupConfig,
    ) -> Result<(), WalletManagerError> {
        let shutdown_signal = TasksTrackers::current().wallet_phase.get_signal().await;
        let task_tracker = TasksTrackers::current()
            .wallet_phase
            .get_task_tracker()
            .await;

        self.node_manager.wait_ready().await?;

        let mut process_watcher = self.watcher.write().await;
        if process_watcher.is_running()
            || app_shutdown.is_terminated()
            || app_shutdown.is_triggered()
        {
            return Ok(());
        }

        process_watcher.adapter.http_client_url = Some(self.node_manager.get_http_api_url().await);
        process_watcher.poll_time = Duration::from_secs(5);
        process_watcher.adapter.use_tor(config.use_tor);
        info!(target: LOG_TARGET_APP_LOGIC, "Using Tor: {}", config.use_tor);
        process_watcher
            .adapter
            .connect_with_local_node(config.connect_with_local_node);

        let tari_wallet_details = InternalWallet::tari_wallet_details().await;
        process_watcher.adapter.wallet_birthday = tari_wallet_details.map(|d| d.wallet_birthday);
        process_watcher.stop_on_exit_codes = STOP_ON_ERROR_CODES.to_vec();

        process_watcher
            .start(
                config.base_path,
                config.config_path,
                config.log_path,
                crate::binaries::Binaries::Wallet,
                shutdown_signal,
                task_tracker,
            )
            .await?;
        info!(target: LOG_TARGET_APP_LOGIC, "Wallet process started successfully");

        match process_watcher.wait_ready().await {
            Ok(_) => Ok::<(), anyhow::Error>(()),
            Err(e) => {
                let exit_code = process_watcher.stop().await?;
                if exit_code != 0 {
                    return Err(WalletManagerError::ExitCode(exit_code));
                }
                return Err(WalletManagerError::UnknownError(e));
            }
        }?;

        Ok(())
    }

    pub async fn set_view_private_key_and_spend_key(
        &self,
        view_private_key: String,
        spend_key: String,
    ) {
        let mut process_watcher = self.watcher.write().await;
        process_watcher.adapter.view_private_key = view_private_key;
        process_watcher.adapter.spend_key = spend_key;
    }

    pub async fn get_view_private_key(&self) -> String {
        self.watcher.read().await.adapter.view_private_key.clone()
    }

    pub async fn get_port(&self) -> u16 {
        self.watcher.read().await.adapter.grpc_port
    }

    pub async fn on_app_exit(&self) {
        match self
            .watcher
            .read()
            .await
            .adapter
            .ensure_no_hanging_processes_are_running()
            .await
        {
            Ok(_) => {
                info!(target: LOG_TARGET_APP_LOGIC, "WalletManager::on_app_exit completed successfully");
            }
            Err(e) => {
                error!(target: LOG_TARGET_APP_LOGIC, "WalletManager::on_app_exit failed: {}", e);
            }
        }
    }

    pub async fn clean_data_folder(&self, base_path: &Path) -> Result<(), anyhow::Error> {
        self.initial_scan_completed
            .store(false, std::sync::atomic::Ordering::Relaxed);

        let path_to_network_wallet = base_path
            .join("wallet")
            .join(Network::get_current().to_string().to_lowercase());

        if path_to_network_wallet.try_exists()? && path_to_network_wallet.is_dir() {
            fs::remove_dir_all(path_to_network_wallet).await?;
        }

        info!(target: LOG_TARGET_APP_LOGIC, "Cleaning wallet data folder");
        Ok(())
    }

    #[allow(dead_code)]
    pub async fn stop(&self) -> Result<i32, WalletManagerError> {
        // Reset the initial scan flag
        self.initial_scan_completed
            .store(false, std::sync::atomic::Ordering::Relaxed);

        let mut process_watcher = self.watcher.write().await;
        process_watcher
            .stop()
            .await
            .map_err(WalletManagerError::UnknownError)
    }
    #[allow(dead_code)]
    pub async fn is_running(&self) -> bool {
        let process_watcher = self.watcher.read().await;
        process_watcher.is_running()
    }
    #[allow(dead_code)]
    pub async fn is_pid_file_exists(&self, base_path: PathBuf) -> bool {
        let lock = self.watcher.read().await;
        lock.is_pid_file_exists(base_path)
    }
}
