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

use crate::ootle::ootle_wallet_adapter::OotleWalletAdapter;
use crate::ootle::ootle_wallet_adapter::OotleWalletState;
use crate::ootle::ootle_wallet_json_rpc_client::OotleWalletJsonRpcClient;
use crate::process_stats_collector::ProcessStatsCollectorBuilder;
use crate::process_watcher::ProcessWatcher;
use crate::tasks_tracker::TasksTrackers;
use futures_util::future::FusedFuture;
use log::info;
use reqwest::Url;
use std::path::PathBuf;
use std::sync::Arc;
use tari_shutdown::ShutdownSignal;
use tari_utilities::Hidden;
use tokio::sync::RwLock;
use tokio::sync::{watch, Notify};

static LOG_TARGET: &str = "tari::universe::ootle_wallet_manager";

#[derive(Debug, Clone)]
pub struct OotleWalletStartupConfig {
    pub base_path: PathBuf,
    pub config_path: PathBuf,
    pub log_path: PathBuf,
    pub indexer_urls: Vec<Url>,
    pub seed_words: Hidden<String>,
}

#[derive(thiserror::Error, Debug)]
pub enum OotleWalletManagerError {
    #[error("Unknown error: {0}")]
    UnknownError(#[from] anyhow::Error),
}

pub struct OotleWalletManager {
    watcher: Arc<RwLock<ProcessWatcher<OotleWalletAdapter>>>,
    client: Arc<RwLock<Option<OotleWalletJsonRpcClient>>>,
    unhealthy_notification: Arc<Notify>,
}

impl Clone for OotleWalletManager {
    fn clone(&self) -> Self {
        Self {
            watcher: self.watcher.clone(),
            client: self.client.clone(),
            unhealthy_notification: self.unhealthy_notification.clone(),
        }
    }
}

impl OotleWalletManager {
    pub fn new(
        wallet_state_watch_tx: watch::Sender<Option<OotleWalletState>>,
        stats_collector: &mut ProcessStatsCollectorBuilder,
    ) -> Self {
        let unhealthy_notification = Arc::new(Notify::new());
        let adapter =
            OotleWalletAdapter::new(wallet_state_watch_tx, unhealthy_notification.clone());
        let process_watcher = ProcessWatcher::new(adapter, stats_collector.take_ootle_wallet());
        Self {
            watcher: Arc::new(RwLock::new(process_watcher)),
            client: Arc::new(RwLock::new(None)),
            unhealthy_notification,
        }
    }

    pub async fn ensure_started(
        &self,
        app_shutdown: ShutdownSignal,
        config: OotleWalletStartupConfig,
    ) -> Result<(), OotleWalletManagerError> {
        let shutdown_signal = TasksTrackers::current()
            .ootle_wallet_phase
            .get_signal()
            .await;
        let task_tracker = TasksTrackers::current()
            .ootle_wallet_phase
            .get_task_tracker()
            .await;

        let mut process_watcher = self.watcher.write().await;
        if process_watcher.is_running()
            || app_shutdown.is_terminated()
            || app_shutdown.is_triggered()
        {
            return Ok(());
        }

        // Spawn a task to listen for unhealthy notifications and reset the client
        let client_for_task = self.client.clone();
        let unhealthy_notification_clone = self.unhealthy_notification.clone();
        task_tracker.spawn(async move {
            loop {
                unhealthy_notification_clone.notified().await;
                info!(target: LOG_TARGET, "Received unhealthy notification, resetting Ootle wallet client.");
                let mut client_lock = client_for_task.write().await;
                *client_lock = None;
            }
        });

        process_watcher.adapter.indexer_urls = config.indexer_urls;
        process_watcher.adapter.seed_words = Some(config.seed_words);
        process_watcher
            .start(
                config.base_path,
                config.config_path,
                config.log_path,
                crate::binaries::Binaries::OotleWallet,
                shutdown_signal,
                task_tracker,
            )
            .await?;
        info!(target: LOG_TARGET, "Ootle wallet process started successfully");
        process_watcher.wait_ready().await?;
        Ok(())
    }

    pub async fn get_json_rpc_port(&self) -> u16 {
        self.watcher.read().await.adapter.json_rpc_port
    }

    pub async fn get_client(&self) -> Result<OotleWalletJsonRpcClient, OotleWalletManagerError> {
        let mut client_option = self.client.write().await;

        if let Some(ref client) = *client_option {
            Ok(client.clone())
        } else {
            let port = self.get_json_rpc_port().await;
            let mut new_client = OotleWalletJsonRpcClient::new(port);
            new_client.authenticate().await?;
            *client_option = Some(new_client.clone());
            Ok(new_client)
        }
    }

    #[allow(dead_code)]
    pub async fn stop(&self) -> Result<i32, OotleWalletManagerError> {
        let mut process_watcher = self.watcher.write().await;
        process_watcher
            .stop()
            .await
            .map_err(OotleWalletManagerError::UnknownError)
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
