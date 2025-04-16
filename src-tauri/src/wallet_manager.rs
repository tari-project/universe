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
use crate::node::node_manager::{NodeManager, NodeManagerError};
use crate::process_stats_collector::ProcessStatsCollectorBuilder;
use crate::process_watcher::ProcessWatcher;
use crate::tasks_tracker::TasksTrackers;
use crate::wallet_adapter::TransactionInfo;
use crate::wallet_adapter::WalletStatusMonitorError;
use crate::wallet_adapter::{WalletAdapter, WalletState};
use futures_util::future::FusedFuture;
use std::path::PathBuf;
use std::sync::atomic::AtomicBool;
use std::sync::Arc;
use std::time::Duration;
use tari_shutdown::ShutdownSignal;
use tauri::AppHandle;
use tokio::sync::watch;
use tokio::sync::RwLock;

static LOG_TARGET: &str = "tari::universe::wallet_manager";

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
}

impl Clone for WalletManager {
    fn clone(&self) -> Self {
        Self {
            watcher: self.watcher.clone(),
            node_manager: self.node_manager.clone(),
            initial_scan_completed: self.initial_scan_completed.clone(),
        }
    }
}

impl WalletManager {
    pub fn new(
        node_manager: NodeManager,
        wallet_state_watch_tx: watch::Sender<Option<WalletState>>,
        stats_collector: &mut ProcessStatsCollectorBuilder,
    ) -> Self {
        let adapter = WalletAdapter::new(wallet_state_watch_tx);
        let process_watcher = ProcessWatcher::new(adapter, stats_collector.take_wallet());

        Self {
            watcher: Arc::new(RwLock::new(process_watcher)),
            node_manager,
            initial_scan_completed: Arc::new(AtomicBool::new(false)),
        }
    }

    pub async fn ensure_started(
        &self,
        app_shutdown: ShutdownSignal,
        base_path: PathBuf,
        config_path: PathBuf,
        log_path: PathBuf,
        use_tor: bool,
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

        let node_identity = self.node_manager.get_identity().await?;
        let node_connection_address = self.node_manager.get_connection_address().await?;
        process_watcher.adapter.base_node_public_key = Some(node_identity.public_key.clone());
        process_watcher.adapter.base_node_address = Some(node_connection_address);
        process_watcher.adapter.use_tor(use_tor);

        process_watcher
            .start(
                base_path,
                config_path,
                log_path,
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

    pub fn is_initial_scan_completed(&self) -> bool {
        self.initial_scan_completed
            .load(std::sync::atomic::Ordering::Relaxed)
    }

    pub async fn get_transactions_history(
        &self,
        continuation: bool,
        limit: Option<u32>,
    ) -> Result<Vec<TransactionInfo>, WalletManagerError> {
        let process_watcher = self.watcher.read().await;
        process_watcher
            .adapter
            .get_transactions_history(continuation, limit)
            .await
            .map_err(|e| match e {
                WalletStatusMonitorError::WalletNotStarted => WalletManagerError::WalletNotStarted,
                _ => WalletManagerError::UnknownError(e.into()),
            })
    }

    pub async fn get_coinbase_transactions(
        &self,
        continuation: bool,
        limit: Option<u32>,
    ) -> Result<Vec<TransactionInfo>, WalletManagerError> {
        let process_watcher = self.watcher.read().await;
        process_watcher
            .adapter
            .get_coinbase_transactions(continuation, limit)
            .await
            .map_err(|e| match e {
                WalletStatusMonitorError::WalletNotStarted => WalletManagerError::WalletNotStarted,
                _ => WalletManagerError::UnknownError(e.into()),
            })
    }

    pub async fn wait_for_scan_to_height(
        &self,
        block_height: u64,
        timeout: Duration,
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

    pub async fn wait_for_initial_wallet_scan(
        &self,
        app: &AppHandle,
        block_height: u64,
    ) -> Result<(), WalletManagerError> {
        log::info!(target: LOG_TARGET, "Starting initial wallet scan to height {}", block_height);

        if self.is_initial_scan_completed() {
            log::info!(target: LOG_TARGET, "Initial wallet scan already completed, skipping");
            return Ok(());
        }

        let process_watcher = self.watcher.read().await;
        if !process_watcher.is_running() {
            return Err(WalletManagerError::WalletNotStarted);
        }
        let state_receiver = process_watcher.adapter.state_broadcast.subscribe();
        let app_clone = app.clone();
        drop(process_watcher);
        // Start a background task to monitor the wallet state and emit scan progress updates
        TasksTrackers::current().wallet_phase.get_task_tracker().await.spawn(async move {
            let mut state_rx = state_receiver;
            let mut shutdown_signal = TasksTrackers::current().wallet_phase.get_signal().await;

            loop {
                tokio::select! {
                    _ = shutdown_signal.wait() => {
                        log::info!(target: LOG_TARGET, "Shutdown signal received, stopping status forwarding thread");
                        break;
                    }
                    result = state_rx.changed() => {
                        if result.is_err() {
                            log::warn!(target: LOG_TARGET, "Failed to get wallet state update");
                            break;
                        }

                        let (scanned_height, progress) = {
                            if let Some(state) = &*state_rx.borrow() {
                                let scanned_height = state.scanned_height;
                                let progress = if block_height > 0 {
                                    (scanned_height as f64 / block_height as f64 * 100.0).min(100.0)
                                } else {
                                    0.0
                                };
                                (scanned_height, progress)
                            } else {
                                continue;
                            }
                        };

                        if scanned_height > 0 {
                            EventsEmitter::emit_init_wallet_scanning_progress(
                                &app_clone,
                                scanned_height,
                                block_height,
                                progress,
                            ).await;
                        }
                    }
                }
            }
        });

        let app_clone2 = app.clone();
        let wallet_manager = self.clone();
        TasksTrackers::current().wallet_phase.get_task_tracker().await.spawn(async move {
            match wallet_manager
                .wait_for_scan_to_height(block_height, Duration::from_secs(3600))
                .await
            {
                Ok(scanned_wallet_state) => {
                    if let Some(balance) = scanned_wallet_state.balance {
                        log::info!(
                            target: LOG_TARGET,
                            "Initial wallet scan complete. Available balance: {}",
                            balance.available_balance
                        );
                        EventsEmitter::emit_wallet_balance_update(&app_clone2, balance).await;
                        EventsEmitter::emit_init_wallet_scanning_progress(
                            &app_clone2,
                            block_height,
                            block_height,
                            100.0,
                        ).await;

                        wallet_manager.initial_scan_completed
                            .store(true, std::sync::atomic::Ordering::Relaxed);
                    } else {
                        log::warn!(target: LOG_TARGET, "Wallet Balance is None after initial scanning");
                    }
                    Ok(())
                }
                Err(e) => {
                    log::error!(target: LOG_TARGET, "Error during initial wallet scan: {}", e);
                    Err(e)
                }
            }
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
