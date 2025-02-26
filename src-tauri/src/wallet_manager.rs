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

use crate::node_manager::NodeManager;
use crate::node_manager::NodeManagerError;
use crate::process_stats_collector::ProcessStatsCollectorBuilder;
use crate::process_watcher::ProcessWatcher;
use crate::wallet_adapter::TransactionInfo;
use crate::wallet_adapter::WalletStatusMonitorError;
use crate::wallet_adapter::{WalletAdapter, WalletState};
use futures_util::future::FusedFuture;
use std::path::PathBuf;
use std::sync::Arc;
use tari_shutdown::ShutdownSignal;
use tokio::sync::watch;
use tokio::sync::RwLock;

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
}

impl Clone for WalletManager {
    fn clone(&self) -> Self {
        Self {
            watcher: self.watcher.clone(),
            node_manager: self.node_manager.clone(),
        }
    }
}

impl WalletManager {
    pub fn new(
        node_manager: NodeManager,
        wallet_state_watch_tx: watch::Sender<Option<WalletState>>,
        stats_collector: &mut ProcessStatsCollectorBuilder,
    ) -> Self {
        // TODO: wire up to front end
        let use_tor = false;

        let adapter = WalletAdapter::new(use_tor, wallet_state_watch_tx);
        let process_watcher = ProcessWatcher::new(adapter, stats_collector.take_wallet());

        Self {
            watcher: Arc::new(RwLock::new(process_watcher)),
            node_manager,
        }
    }

    pub async fn ensure_started(
        &self,
        app_shutdown: ShutdownSignal,
        base_path: PathBuf,
        config_path: PathBuf,
        log_path: PathBuf,
    ) -> Result<(), WalletManagerError> {
        self.node_manager.wait_ready().await?;
        let node_identity = self.node_manager.get_identity().await?;
        let base_node_tcp_port = self.node_manager.get_tcp_listener_port().await;

        let mut process_watcher = self.watcher.write().await;

        if process_watcher.is_running()
            || app_shutdown.is_terminated()
            || app_shutdown.is_triggered()
        {
            return Ok(());
        }

        process_watcher.adapter.base_node_public_key = Some(node_identity.public_key.clone());
        process_watcher.adapter.base_node_address =
            Some(format!("/ip4/127.0.0.1/tcp/{}", base_node_tcp_port));
        process_watcher
            .start(
                app_shutdown,
                base_path,
                config_path,
                log_path,
                crate::binaries::Binaries::Wallet,
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

    pub async fn get_coinbase_transactions(
        &self,
        continuation: bool,
        limit: Option<u32>,
    ) -> Result<Vec<TransactionInfo>, WalletManagerError> {
        let process_watcher = self.watcher.read().await;
        process_watcher
            .status_monitor
            .as_ref()
            .ok_or_else(|| WalletManagerError::WalletNotStarted)?
            .get_coinbase_transactions(continuation, limit)
            .await
            .map_err(|e| match e {
                WalletStatusMonitorError::WalletNotStarted => WalletManagerError::WalletNotStarted,
                _ => WalletManagerError::UnknownError(e.into()),
            })
    }

    pub async fn stop(&self) -> Result<i32, WalletManagerError> {
        let mut process_watcher = self.watcher.write().await;
        process_watcher
            .stop()
            .await
            .map_err(WalletManagerError::UnknownError)
    }

    pub async fn is_running(&self) -> bool {
        let process_watcher = self.watcher.read().await;
        process_watcher.is_running()
    }

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
