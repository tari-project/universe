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

use crate::configs::config_wallet::{ConfigWallet, ConfigWalletContent};
use crate::configs::trait_config::ConfigImpl;
use crate::events_emitter::EventsEmitter;
use crate::internal_wallet::InternalWallet;
use crate::node::node_manager::{NodeManager, NodeManagerError};
use crate::process_adapter::ProcessAdapter;
use crate::process_stats_collector::ProcessStatsCollectorBuilder;
use crate::process_watcher::ProcessWatcher;
use crate::tasks_tracker::TasksTrackers;
use crate::wallet::wallet_adapter::WalletAdapter;
use crate::wallet::wallet_status_monitor::WalletStatusMonitorError;
use crate::wallet::wallet_types::{TransactionInfo, TransactionStatus, WalletBalance, WalletState};
use crate::BaseNodeStatus;
use futures_util::future::FusedFuture;
use log::{error, info};
use std::path::{Path, PathBuf};
use std::str::FromStr;
use std::sync::atomic::AtomicBool;
use std::sync::Arc;
use std::time::Duration;
use tari_common::configuration::Network;
use tari_shutdown::ShutdownSignal;
use tari_transaction_components::tari_amount::{MicroMinotari, Minotari};
use tokio::fs;
use tokio::sync::watch;
use tokio::sync::RwLock;

static LOG_TARGET: &str = "tari::universe::wallet_manager";

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
        info!(target: LOG_TARGET, "Using Tor: {}", config.use_tor);
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
        info!(target: LOG_TARGET, "Wallet process started successfully");

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

    pub fn is_initial_scan_completed(&self) -> bool {
        self.initial_scan_completed
            .load(std::sync::atomic::Ordering::Relaxed)
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
                info!(target: LOG_TARGET, "WalletManager::on_app_exit completed successfully");
            }
            Err(e) => {
                error!(target: LOG_TARGET, "WalletManager::on_app_exit failed: {}", e);
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

        log::info!(target: LOG_TARGET, "Cleaning wallet data folder");
        Ok(())
    }

    pub async fn get_balance(&self) -> Result<WalletBalance, anyhow::Error> {
        let process_watcher = self.watcher.read().await;
        process_watcher.adapter.get_balance().await
    }

    pub async fn get_transactions(
        &self,
        offset: Option<u32>,
        limit: Option<u32>,
        status_bitflag: Option<u32>,
    ) -> Result<Vec<TransactionInfo>, WalletManagerError> {
        let node_status = *self.base_node_watch_rx.borrow();
        let current_block_height = node_status.block_height;
        let process_watcher = self.watcher.read().await;
        process_watcher
            .adapter
            .get_transactions(offset, limit, status_bitflag, current_block_height)
            .await
            .map_err(|e| match e {
                WalletStatusMonitorError::WalletNotStarted => WalletManagerError::WalletNotStarted,
                _ => WalletManagerError::UnknownError(e.into()),
            })
    }

    pub async fn wait_for_scan_to_height(
        &self,
        block_height: u64,
        timeout: Option<Duration>,
    ) -> Result<WalletState, WalletManagerError> {
        let process_watcher = self.watcher.read().await;

        if !process_watcher.is_running() {
            return Err(WalletManagerError::WalletNotStarted);
        }

        process_watcher
            .adapter
            .wait_for_scan_to_height(block_height, timeout)
            .await
            .map_err(|e| match e {
                WalletStatusMonitorError::WalletNotStarted => WalletManagerError::WalletNotStarted,
                _ => WalletManagerError::UnknownError(e.into()),
            })
    }

    pub async fn send_one_sided_to_stealth_address(
        &self,
        amount_str: String,
        destination: String,
        payment_id: Option<String>,
        app_handle: &tauri::AppHandle,
    ) -> Result<(), WalletManagerError> {
        let process_watcher = self.watcher.read().await;
        if !process_watcher.is_running() {
            return Err(WalletManagerError::WalletNotStarted);
        }

        // TODO: check if node is synced?
        self.node_manager.wait_ready().await?;

        let minotari_amount = Minotari::from_str(&amount_str)
            .map_err(|e| WalletManagerError::UnknownError(e.into()))?;
        let micro_minotari_amount = MicroMinotari::from(minotari_amount);
        let amount = micro_minotari_amount.as_u64();

        // Payment ID can't be an empty string
        let payment_id = match payment_id {
            Some(s) if s.is_empty() => None,
            _ => payment_id,
        };

        let res = process_watcher
            .adapter
            .send_one_sided_to_stealth_address(amount, destination, payment_id, app_handle)
            .await;

        res.map_err(WalletManagerError::UnknownError)
    }

    pub async fn find_coinbase_transaction_for_block(
        &self,
        block_height: u64,
    ) -> Result<Option<TransactionInfo>, WalletManagerError> {
        const COINBASE_STATUSES_BITFLAG: u32 = (1 << TransactionStatus::CoinbaseConfirmed as u32)
            | (1 << TransactionStatus::CoinbaseUnconfirmed as u32);

        // Get a small batch of recent coinbase transactions
        let coinbase_txs = self
            .get_transactions(Some(0), Some(10), Some(COINBASE_STATUSES_BITFLAG))
            .await?;

        // Find one matching the specified block height
        let matching_tx = coinbase_txs
            .into_iter()
            .find(|tx| tx.mined_in_block_height == block_height);

        Ok(matching_tx)
    }

    #[allow(clippy::too_many_lines)]
    pub async fn wait_for_initial_wallet_scan(
        &self,
        node_status_watch_rx: watch::Receiver<BaseNodeStatus>,
    ) -> Result<(), WalletManagerError> {
        if self.is_initial_scan_completed() {
            // TODO - need to change this so we can get scan progress?
            log::info!(target: LOG_TARGET, "Initial wallet scan already completed, skipping");
            EventsEmitter::emit_wallet_status_updated(true, None).await;
            return Ok(());
        }

        let process_watcher = self.watcher.read().await;
        if !process_watcher.is_running() {
            return Err(WalletManagerError::WalletNotStarted);
        }
        let wallet_state_receiver = process_watcher.adapter.state_broadcast.subscribe();
        let wallet_state_receiver_clone = wallet_state_receiver.clone();
        drop(process_watcher);

        let node_status_watch_rx_progress = node_status_watch_rx.clone();
        let initial_scan_completed = self.initial_scan_completed.clone();
        // Start a background task to monitor the wallet state and emit scan progress updates
        TasksTrackers::current().wallet_phase.get_task_tracker().await.spawn(async move {
            let mut wallet_state_rx = wallet_state_receiver_clone;
            let mut shutdown_signal = TasksTrackers::current().wallet_phase.get_signal().await;

            loop {
                tokio::select! {
                    _ = shutdown_signal.wait() => {
                        log::info!(target: LOG_TARGET, "Shutdown signal received, stopping status forwarding thread");
                        break;
                    }
                    _ = wallet_state_rx.changed() => {
                        let current_target_height = node_status_watch_rx_progress.borrow().block_height;
                        let (scanned_height, progress) = {
                            if let Some(wallet_state) = &*wallet_state_rx.borrow() {
                                let progress = if current_target_height > 0 {
                                    (wallet_state.scanned_height as f64 / current_target_height as f64 * 100.0).min(100.0)
                                } else {
                                    0.0
                                };
                                (wallet_state.scanned_height, progress)
                            } else {
                                continue;
                            }
                        };
                        if initial_scan_completed.load(std::sync::atomic::Ordering::Relaxed) {
                            break;
                        }

                        if scanned_height > 0 && progress < 100.0 {
                            log::info!(target: LOG_TARGET, "Initial wallet scanning: {progress}% ({scanned_height}/{current_target_height})");
                            EventsEmitter::emit_init_wallet_scanning_progress(
                                scanned_height,
                                current_target_height,
                                progress,
                            ).await;
                        }
                    }
                }
            }
        });

        let wallet_manager = self.clone();
        let mut node_status_watch_rx_scan = node_status_watch_rx.clone();

        TasksTrackers::current().wallet_phase.get_task_tracker().await.spawn(async move {
            let mut shutdown_signal = TasksTrackers::current().wallet_phase.get_signal().await;

            loop {
                let mut retries = 0;
                let current_target_height = loop {
                    let current_height = node_status_watch_rx_scan.borrow().block_height;
                    if current_height > 0 {
                        break current_height;
                    }
                    retries += 1;
                    if retries >= 10 {
                        log::warn!(target: LOG_TARGET, "Max retries(10) reached while waiting for node status update");
                        break 1;
                    }
                    tokio::select!{
                        _ = node_status_watch_rx_scan.changed() => {},
                        _ = shutdown_signal.wait() =>{
                            break 1;
                        }
                    }
                };
                tokio::select! {
                    _ = shutdown_signal.wait() => {
                        log::info!(target: LOG_TARGET, "Shutdown signal received, stopping wallet initial scan task");
                        return Ok(());
                    }
                    result = wallet_manager.wait_for_scan_to_height(current_target_height, None) => {
                        match result {
                            Ok(scanned_wallet_state) => {
                                let node_status = *node_status_watch_rx_scan.borrow();
                                if !node_status.is_synced {
                                    log::info!(target: LOG_TARGET,
                                        "Node is not synced, continuing..");
                                    continue;
                                }

                                let latest_height = node_status.block_height;
                                if latest_height > current_target_height {
                                    log::info!(target: LOG_TARGET,
                                        "Node height increased from {current_target_height} to {latest_height} while initial scanning, continuing..");
                                    continue;
                                }

                                // Scan completed to current target height
                                if let Some(balance) = scanned_wallet_state.balance {
                                    log::info!(
                                        target: LOG_TARGET,
                                        "Initial wallet scan complete up to {} block height. Available balance: {}",
                                        latest_height,
                                        balance.available_balance
                                    );

                                    ConfigWallet::update_field(ConfigWalletContent::set_last_known_balance, balance.available_balance).await?;

                                    EventsEmitter::emit_wallet_balance_update(balance).await;
                                    EventsEmitter::emit_init_wallet_scanning_progress(
                                        current_target_height,
                                        current_target_height,
                                        100.0,
                                    ).await;

                                    wallet_manager.initial_scan_completed
                                        .store(true, std::sync::atomic::Ordering::Relaxed);
                                } else {
                                    log::warn!(target: LOG_TARGET, "Wallet Balance is None after initial scanning");
                                }
                                break;
                            }
                            Err(e) => {
                                log::error!(target: LOG_TARGET, "Error during initial wallet scan: {e}");
                                return Err(e);
                            }
                        }
                    }
                }
            }

            Ok(())
        });

        // Balance might be invalid right after initial scanning but it should be revalidated shortly after
        let wallet_state_receiver_clone = wallet_state_receiver.clone();
        TasksTrackers::current()
            .wallet_phase
            .get_task_tracker()
            .await
            .spawn(async move {
                WalletManager::validate_balance_after_scan(wallet_state_receiver_clone)
                    .await
                    .inspect_err(|e| {
                        log::error!(target: LOG_TARGET, "Balance validation failed: {e}");
                    })
            });

        Ok(())
    }

    async fn validate_balance_after_scan(
        wallet_state_receiver: watch::Receiver<Option<WalletState>>,
    ) -> Result<(), WalletManagerError> {
        let mut interval = tokio::time::interval(Duration::from_secs(2));
        interval.set_missed_tick_behavior(tokio::time::MissedTickBehavior::Skip);
        let end_time = tokio::time::Instant::now() + Duration::from_secs(120);
        let mut shutdown_signal = TasksTrackers::current().wallet_phase.get_signal().await;

        loop {
            tokio::select! {
                _ = shutdown_signal.wait() => {
                    info!(target: LOG_TARGET, "Shutdown signal received, stopping balance validation");
                    break;
                }
                _ = interval.tick() => {
                    if tokio::time::Instant::now() >= end_time {
                        break;
                    }

                    let wallet_status = wallet_state_receiver.borrow().clone();
                    if let Some(wallet_state) = wallet_status {
                        if let Some(balance) = wallet_state.balance {
                            ConfigWallet::update_field(ConfigWalletContent::set_last_known_balance, balance.available_balance).await?;
                            EventsEmitter::emit_wallet_balance_update(balance).await;
                        }
                    }
                }
            }
        }

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
