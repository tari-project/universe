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

use crate::events_emitter::EventsEmitter;
use crate::internal_wallet::InternalWallet;
use crate::node::node_manager::{NodeManager, NodeManagerError};
use crate::process_stats_collector::ProcessStatsCollectorBuilder;
use crate::process_watcher::ProcessWatcher;
use crate::tasks_tracker::TasksTrackers;
use crate::wallet_adapter::WalletStatusMonitorError;
use crate::wallet_adapter::{TransactionInfo, WalletBalance};
use crate::wallet_adapter::{WalletAdapter, WalletState};
use crate::{BaseNodeStatus, UniverseAppState};
use futures_util::future::FusedFuture;
use std::path::{Path, PathBuf};
use std::sync::atomic::AtomicBool;
use std::sync::Arc;
use std::time::Duration;
use tari_common::configuration::Network;
use tari_shutdown::ShutdownSignal;
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
    #[error("Unknown error: {0}")]
    UnknownError(#[from] anyhow::Error),
}

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
        state: tauri::State<'_, UniverseAppState>,
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

        let (public_key, public_address) = self.node_manager.get_connection_details().await?;
        process_watcher.adapter.base_node_public_key = Some(public_key.clone());
        process_watcher.adapter.base_node_address = Some(public_address.clone());
        process_watcher.adapter.use_tor(config.use_tor);
        process_watcher
            .adapter
            .connect_with_local_node(config.connect_with_local_node);
        process_watcher.adapter.wallet_birthday = self
            .get_wallet_birthday(config.config_path.clone(), state)
            .await
            .ok();

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
        process_watcher.wait_ready().await?;
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

    pub fn is_initial_scan_completed(&self) -> bool {
        self.initial_scan_completed
            .load(std::sync::atomic::Ordering::Relaxed)
    }

    pub async fn get_wallet_birthday(
        &self,
        config_path: PathBuf,
        state: tauri::State<'_, UniverseAppState>,
    ) -> Result<u16, anyhow::Error> {
        let internal_wallet = InternalWallet::load_or_create(config_path, state).await?;
        internal_wallet.get_birthday().await
    }

    pub async fn clean_data_folder(&self, base_path: &Path) -> Result<(), anyhow::Error> {
        self.initial_scan_completed
            .store(false, std::sync::atomic::Ordering::Relaxed);

        fs::remove_dir_all(
            base_path
                .join("wallet")
                .join(Network::get_current().to_string().to_lowercase()),
        )
        .await?;
        log::info!(target: LOG_TARGET, "Cleaning wallet data folder");
        Ok(())
    }

    pub async fn get_balance(&self) -> Result<WalletBalance, anyhow::Error> {
        let process_watcher = self.watcher.read().await;
        process_watcher.adapter.get_balance().await
    }

    pub async fn get_transactions_history(
        &self,
        offset: Option<i32>,
        limit: Option<i32>,
    ) -> Result<Vec<TransactionInfo>, WalletManagerError> {
        let node_status = *self.base_node_watch_rx.borrow();
        let current_block_height = node_status.block_height;
        let process_watcher = self.watcher.read().await;
        process_watcher
            .adapter
            .get_transactions_history(offset, limit, current_block_height)
            .await
            .map_err(|e| match e {
                WalletStatusMonitorError::WalletNotStarted => WalletManagerError::WalletNotStarted,
                _ => WalletManagerError::UnknownError(e.into()),
            })
    }

    pub async fn import_transaction(&self, tx_output_file: PathBuf) -> Result<(), anyhow::Error> {
        let process_watcher = self.watcher.read().await;
        if !process_watcher.is_running() {
            return Err(anyhow::Error::msg("Wallet not started"));
        }

        process_watcher
            .adapter
            .import_transaction(tx_output_file)
            .await
    }

    pub async fn get_coinbase_transactions(
        &self,
        continuation: bool,
        limit: Option<u32>,
    ) -> Result<Vec<TransactionInfo>, WalletManagerError> {
        let node_status = *self.base_node_watch_rx.borrow();
        let current_block_height = node_status.block_height;
        let process_watcher = self.watcher.read().await;
        process_watcher
            .adapter
            .get_coinbase_transactions(continuation, limit, current_block_height)
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

    pub async fn find_coinbase_transaction_for_block(
        &self,
        block_height: u64,
    ) -> Result<Option<TransactionInfo>, WalletManagerError> {
        let process_watcher = self.watcher.read().await;
        if !process_watcher.is_running() {
            return Err(WalletManagerError::WalletNotStarted);
        }

        process_watcher
            .adapter
            .find_coinbase_transaction_for_block(block_height)
            .await
            .map_err(|e| match e {
                WalletStatusMonitorError::WalletNotStarted => WalletManagerError::WalletNotStarted,
                _ => WalletManagerError::UnknownError(e.into()),
            })
    }

    #[allow(clippy::too_many_lines)]
    pub async fn wait_for_initial_wallet_scan(
        &self,
        node_status_watch_rx: watch::Receiver<BaseNodeStatus>,
    ) -> Result<(), WalletManagerError> {
        if self.is_initial_scan_completed() {
            log::info!(target: LOG_TARGET, "Initial wallet scan already completed, skipping");
            return Ok(());
        }

        let process_watcher = self.watcher.read().await;
        if !process_watcher.is_running() {
            return Err(WalletManagerError::WalletNotStarted);
        }
        let wallet_state_receiver = process_watcher.adapter.state_broadcast.subscribe();
        drop(process_watcher);

        let node_status_watch_rx_progress = node_status_watch_rx.clone();
        let initial_scan_completed = self.initial_scan_completed.clone();
        // Start a background task to monitor the wallet state and emit scan progress updates
        TasksTrackers::current().wallet_phase.get_task_tracker().await.spawn(async move {
            let mut wallet_state_rx = wallet_state_receiver;
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
                            log::info!(target: LOG_TARGET, "Initial wallet scanning: {}% ({}/{})", progress, scanned_height, current_target_height);
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
                    let _unused = node_status_watch_rx_scan.changed().await;
                };
                tokio::select! {
                    _ = shutdown_signal.wait() => {
                        log::info!(target: LOG_TARGET, "Shutdown signal received, stopping wallet initial scan task");
                        return Ok(());
                    }
                    result = wallet_manager.wait_for_scan_to_height(current_target_height, None) => {
                        match result {
                            Ok(scanned_wallet_state) => {
                                let latest_height = node_status_watch_rx_scan.borrow().block_height;
                                if latest_height > current_target_height {
                                    log::info!(target: LOG_TARGET,
                                        "Node height increased from {} to {} while initial scanning, continuing..",
                                        current_target_height, latest_height);
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
                                log::error!(target: LOG_TARGET, "Error during initial wallet scan: {}", e);
                                return Err(e);
                            }
                        }
                    }
                }
            }

            Ok(())
        });

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

    #[deprecated(
        note = "Do not use. Use internal wallet instead. This address is the address of the view key wallet and not the internal wallet."
    )]
    #[allow(dead_code)]
    pub async fn wallet_address(&self) -> Result<String, WalletManagerError> {
        panic!("Do not use. Use internal wallet instead. This address is the address of the view key wallet and not the internal wallet.");
        // In future the wallet might return the correct address. View only wallets have the same offline address, but different online addresses.
        // But the grpc only returns the online address.

        // let process_watcher = self.watcher.read().await;
        // Ok(process_watcher
        //     .status_monitor
        //     .as_ref()
        //     .ok_or_else(|| WalletManagerError::WalletNotStarted)?
        //     .get_wallet_address()
        //     .await
        //     .map_err(|e| match e {
        //         WalletStatusMonitorError::WalletNotStarted => WalletManagerError::WalletNotStarted,
        //         _ => WalletManagerError::UnknownError(e.into()),
        //     })?
        //     .to_base58())
    }
}
