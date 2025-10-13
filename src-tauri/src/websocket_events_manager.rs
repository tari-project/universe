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

use std::sync::Arc;
use std::thread::sleep;
use std::time::Duration;
use std::time::Instant;

use futures::lock::Mutex;
use log::debug;
use log::{error, info, warn};
use tari_common::configuration::Network;
use tauri::AppHandle;
use tokio::{
    sync::{broadcast, watch, RwLock},
    time,
};

use crate::websocket_manager::WebsocketManager;
use crate::{
    airdrop::decode_jwt_claims_without_exp,
    commands::{sign_ws_data, CpuMinerStatus, SignWsDataResponse},
    configs::{
        config_core::ConfigCore, config_pools::ConfigPools, pools::PoolConfig,
        trait_config::ConfigImpl,
    },
    internal_wallet::InternalWallet,
    tasks_tracker::TasksTrackers,
    websocket_manager::WebsocketMessage,
    BaseNodeStatus, GpuMinerStatus,
};
const LOG_TARGET: &str = "tari::universe::websocket_events_manager";
static INTERVAL_DURATION: std::time::Duration = Duration::from_secs(15);
static KEEP_ALIVE_INTERVAL_DURATION: std::time::Duration = Duration::from_secs(15);
static MAX_ACCEPTABLE_COMMAND_TIME: std::time::Duration = Duration::from_secs(1);

pub struct WebsocketEventsManager {
    app: Option<AppHandle>,
    cpu_miner_status_watch_rx: watch::Receiver<CpuMinerStatus>,
    gpu_latest_miner_stats: watch::Receiver<GpuMinerStatus>,
    node_latest_status: watch::Receiver<BaseNodeStatus>,
    websocket_tx_channel: Arc<tokio::sync::mpsc::Sender<WebsocketMessage>>,
    close_channel_tx: tokio::sync::broadcast::Sender<bool>,
    is_started: Arc<Mutex<bool>>,
}

impl WebsocketEventsManager {
    pub fn new(
        cpu_miner_status_watch_rx: watch::Receiver<CpuMinerStatus>,
        gpu_latest_miner_stats: watch::Receiver<GpuMinerStatus>,
        node_latest_status: watch::Receiver<BaseNodeStatus>,
        websocket_tx_channel: tokio::sync::mpsc::Sender<WebsocketMessage>,
    ) -> Self {
        let (close_channel_tx, _) = tokio::sync::broadcast::channel::<bool>(1);
        WebsocketEventsManager {
            cpu_miner_status_watch_rx,
            gpu_latest_miner_stats,
            node_latest_status,
            websocket_tx_channel: Arc::new(websocket_tx_channel),
            app: None,
            close_channel_tx,
            is_started: Arc::new(Mutex::new(false)),
        }
    }

    pub async fn set_app_handle(
        &mut self,
        app: AppHandle,
        websocket_manager: Arc<RwLock<WebsocketManager>>,
    ) -> Result<(), anyhow::Error> {
        self.app = Some(app);
        if let Err(e) = self.websocket_connect(websocket_manager).await {
            error!(target: LOG_TARGET, "Failed to start websocket connection: {e}");
            return Err(anyhow::anyhow!(e));
        } else {
            debug!(target: LOG_TARGET, "Websocket events manager initialized successfully");
        }
        Ok(())
    }

    // If we ever close websocket manager connection we should stop emitting messages using this
    // pub async fn stop_emitting_message(&self) {
    //     info!(target:LOG_TARGET,"stop websocket_events_manager");
    //
    //     match self.close_channel_tx.send(true) {
    //         Ok(_) => {}
    //         Err(_) => {
    //             info!(target: LOG_TARGET,"websocket_events_manager has already been closed.");
    //         }
    //     };
    //     info!(target: LOG_TARGET,"stopped emitting messages from websocket_events_manager");
    // }

    pub async fn emit_interval_ws_events(&mut self) -> Result<(), anyhow::Error> {
        let cpu_miner_status_watch_rx = self.cpu_miner_status_watch_rx.clone();
        let gpu_latest_miner_stats = self.gpu_latest_miner_stats.clone();
        let node_latest_status = self.node_latest_status.clone();

        let app_id = ConfigCore::content().await.anon_id().clone();

        let app_cloned = self.app.clone();

        let websocket_tx_channel_clone = self.websocket_tx_channel.clone();
        let close_channel_tx = self.close_channel_tx.clone();

        let is_started = self.is_started.clone();
        let mut is_started_guard = is_started.lock().await;
        if *is_started_guard {
            warn!(target: LOG_TARGET, "Websocket events manager already started");
            return Ok(());
        }

        debug!(target: LOG_TARGET, "Starting websocket events manager with intervals: {}s mining, {}s keep-alive", 
              INTERVAL_DURATION.as_secs(), KEEP_ALIVE_INTERVAL_DURATION.as_secs());

        let is_started_cloned = self.is_started.clone();

        TasksTrackers::current().common.get_task_tracker().await.spawn(async move {
            debug!(target: LOG_TARGET, "Websocket events manager task spawned successfully");
            let mut shutdown_signal = TasksTrackers::current().common.get_signal().await;

            // Create intervals inside the spawned task
            let mut interval = time::interval(INTERVAL_DURATION);
            interval.set_missed_tick_behavior(tokio::time::MissedTickBehavior::Skip);

            let mut keep_alive_interval = time::interval(KEEP_ALIVE_INTERVAL_DURATION);
            keep_alive_interval.set_missed_tick_behavior(tokio::time::MissedTickBehavior::Skip);

            debug!(target: LOG_TARGET, "Intervals created - starting event loop");

            loop {
                let app_version_option = app_cloned.clone().map(|handle| handle.package_info().version.clone().to_string());
                let app_version = app_version_option.map_or(String::from("unknown"), |version| version.to_string());

                tokio::select! {
                  _= interval.tick() => {
                        debug!(target:LOG_TARGET, "✓ Mining status interval tick - assembling status");
                        if let Some(message) = WebsocketEventsManager::assemble_mining_status(
                          cpu_miner_status_watch_rx.clone(),
                          gpu_latest_miner_stats.clone(),
                          node_latest_status.clone(),
                          app_id.clone(),
                          app_version.clone(),
                        ).await {
                            debug!(target:LOG_TARGET, "sending mining status message {:?}", message);
                            drop(websocket_tx_channel_clone.send(message).await.inspect_err(|e|{
                              error!(target:LOG_TARGET, "could not send to websocket channel due to {e}");
                            }));
                        } else {
                            debug!(target:LOG_TARGET, "No mining status message to send");
                        }
                  },
                  _= keep_alive_interval.tick()=>{
                        if let Some(message) = WebsocketEventsManager::assemble_keep_alive().await{
                            debug!(target:LOG_TARGET, "sending keep-alive message");
                            drop(websocket_tx_channel_clone.send(message).await.inspect_err(|e|{
                              error!(target:LOG_TARGET, "could not send to websocket keep-alive channel due to {:?}", e);
                            }));
                        }
                  },
                  _= shutdown_signal.wait()=>{
                    info!(target:LOG_TARGET, "websocket events manager closed");
                    return;
                  }
                  _=wait_for_close_signal(close_channel_tx.subscribe(),is_started_cloned.clone())=>{
                    info!(target:LOG_TARGET, "websocket events manager closed");
                    return;
                  }
                }
            }
        });
        *is_started_guard = true;
        debug!(target: LOG_TARGET, "Websocket events manager started successfully");
        Ok(())
    }

    async fn assemble_mining_status(
        cpu_miner_status_watch_rx: watch::Receiver<CpuMinerStatus>,
        gpu_latest_miner_stats: watch::Receiver<GpuMinerStatus>,
        node_latest_status: watch::Receiver<BaseNodeStatus>,
        app_id: String,
        app_version: String,
    ) -> Option<WebsocketMessage> {
        let BaseNodeStatus { block_height, .. } = *node_latest_status.borrow();
        let jwt_token = ConfigCore::content()
            .await
            .airdrop_tokens()
            .clone()
            .map(|tokens| tokens.token);
        let user_id = jwt_token.map_or(String::new(), |token| {
            // If token is set decode it
            decode_jwt_claims_without_exp(&token.to_string()).map_or(String::new(), |c| c.id)
        });

        let cpu_miner_status = cpu_miner_status_watch_rx.borrow().clone();
        let gpu_status = gpu_latest_miner_stats.borrow().clone();
        let network = Network::get_current_or_user_setting_or_default().as_key_str();
        let is_mining_active = cpu_miner_status.hash_rate > 0.0 || gpu_status.hash_rate > 0.0;
        // If the miner is not active, we don't need to send any messages
        if !is_mining_active {
            return None;
        }

        // Check if wallet is initialized before trying to get address
        if !InternalWallet::is_initialized() {
            warn!(target: LOG_TARGET, "Wallet has not been initialized");
            return None;
        }
        let tari_address = InternalWallet::tari_address().await;

        let pools_config = ConfigPools::content().await;
        let gpu_pool_name = pools_config.selected_gpu_pool().name();
        let cpu_pool_name = pools_config.selected_cpu_pool().name();

        let signable_message = format!(
            "{},{},{},{},{},{},{},{},{}",
            app_version,
            network,
            app_id,
            user_id,
            is_mining_active,
            block_height,
            tari_address.to_base58(),
            gpu_pool_name,
            cpu_pool_name,
        );

        if let Ok(SignWsDataResponse { signature, pub_key }) = sign_ws_data(signable_message).await
        {
            let payload = serde_json::json!({
                    "isMining":is_mining_active,
                    "appId":app_id,
                    "blockHeight":block_height,
                    "version":app_version,
                    "network":network,
                    "userId":user_id,
                    "walletHash":tari_address.to_base58(),
                    "gpuPoolName":gpu_pool_name,
                    "cpuPoolName":cpu_pool_name,
            });

            return Some(WebsocketMessage {
                event: "mining-status".into(),
                data: Some(payload),
                signature: Some(signature),
                pub_key: Some(pub_key),
            });
        }
        None
    }

    async fn assemble_keep_alive() -> Option<WebsocketMessage> {
        let jwt_token = ConfigCore::content()
            .await
            .airdrop_tokens()
            .clone()
            .map(|tokens| tokens.token);

        let payload = serde_json::json!({
            "token": jwt_token,
        });

        Some(WebsocketMessage {
            event: "keep-alive".into(),
            data: Some(payload),
            signature: None,
            pub_key: None,
        })
    }

    async fn websocket_connect(
        &mut self,
        websocket_manager: Arc<RwLock<WebsocketManager>>,
    ) -> Result<(), String> {
        debug!(target: LOG_TARGET, "websocket_connect command started");
        let timer = Instant::now();

        const MAX_RETRIES: u32 = 5;
        const INITIAL_DELAY_MS: u64 = 100;
        const MAX_TOTAL_TIMEOUT_SECS: u64 = 30;

        let mut retry_count = 0;
        let mut delay_ms = INITIAL_DELAY_MS;

        loop {
            let mut websocket_manger_guard = websocket_manager.write().await;

            if websocket_manger_guard.is_websocket_manager_ready() {
                // WebSocket manager is ready, proceed with connection
                websocket_manger_guard
                    .connect()
                    .await
                    .map_err(|e| e.to_string())?;

                self.emit_interval_ws_events()
                    .await
                    .map_err(|e| e.to_string())?;

                if timer.elapsed() > MAX_ACCEPTABLE_COMMAND_TIME {
                    warn!(target: LOG_TARGET, "websocket_connect took too long: {:?}", timer.elapsed());
                }
                debug!(target: LOG_TARGET, "websocket_connect command finished after {} retries", retry_count);
                return Ok(());
            }

            // Release the guard before sleeping
            drop(websocket_manger_guard);

            retry_count += 1;

            // Check if we've exceeded max retries or total timeout
            if retry_count > MAX_RETRIES {
                warn!(target: LOG_TARGET, "websocket_connect failed after {} retries - websocket manager not ready", MAX_RETRIES);
                return Err(format!(
                    "websocket manager not ready after {} retries",
                    MAX_RETRIES
                ));
            }

            if timer.elapsed().as_secs() >= MAX_TOTAL_TIMEOUT_SECS {
                warn!(target: LOG_TARGET, "websocket_connect timed out after {:?} - websocket manager not ready", timer.elapsed());
                return Err(format!(
                    "websocket manager not ready after {}s timeout",
                    MAX_TOTAL_TIMEOUT_SECS
                ));
            }

            debug!(target: LOG_TARGET, "websocket_connect retry {} in {}ms - websocket manager not ready yet", retry_count, delay_ms);

            // Sleep with exponential backoff
            sleep(Duration::from_millis(delay_ms));
            delay_ms = (delay_ms * 2).min(2000); // Cap at 2 seconds
        }
    }
}

async fn wait_for_close_signal(
    mut channel: broadcast::Receiver<bool>,
    is_started: Arc<Mutex<bool>>,
) {
    match channel.recv().await {
        Ok(_) => {
            let mut is_started_guard = is_started.lock().await;
            *is_started_guard = false;
            drop(is_started_guard);
            info!(target:LOG_TARGET,"received websocket_events_manager stop signal");
        }
        Err(_) => {
            info!(target:LOG_TARGET,"received websocket_events_manager stop signal");
        }
    }
}
