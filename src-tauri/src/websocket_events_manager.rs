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
use std::time::Duration;

use futures::lock::Mutex;
use log::{error, info};
use tari_common::configuration::Network;
use tauri::AppHandle;
use tokio::{
    sync::{broadcast, watch},
    time,
};

use crate::{
    airdrop::decode_jwt_claims_without_exp,
    commands::{sign_ws_data, CpuMinerStatus, SignWsDataResponse},
    configs::{config_core::ConfigCore, trait_config::ConfigImpl},
    internal_wallet::InternalWallet,
    tasks_tracker::TasksTrackers,
    websocket_manager::WebsocketMessage,
    BaseNodeStatus, GpuMinerStatus,
};
const LOG_TARGET: &str = "tari::universe::websocket_events_manager";
static INTERVAL_DURATION: std::time::Duration = Duration::from_secs(15);

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

    pub fn set_app_handle(&mut self, app: AppHandle) {
        self.app = Some(app);
    }

    pub async fn stop_emitting_message(&self) {
        info!(target:LOG_TARGET,"stop websocket_events_manager");

        match self.close_channel_tx.send(true) {
            Ok(_) => {}
            Err(_) => {
                info!(target: LOG_TARGET,"websocket_events_manager has already been closed.");
            }
        };
        info!(target: LOG_TARGET,"stopped emitting messages from websocket_events_manager");
    }

    pub async fn emit_interval_ws_events(&mut self) -> Result<(), anyhow::Error> {
        let mut interval = time::interval(INTERVAL_DURATION);
        interval.set_missed_tick_behavior(tokio::time::MissedTickBehavior::Skip);
        let cpu_miner_status_watch_rx = self.cpu_miner_status_watch_rx.clone();
        let gpu_latest_miner_stats = self.gpu_latest_miner_stats.clone();
        let node_latest_status = self.node_latest_status.clone();

        let app_id = ConfigCore::content().await.anon_id().clone();

        let app_cloned = self.app.clone();

        let websocket_tx_channel_clone = self.websocket_tx_channel.clone();
        let close_channel_tx = self.close_channel_tx.clone();

        let is_started = self.is_started.clone();
        if let Some(mut is_started_guard) = self.is_started.try_lock() {
            if *is_started_guard {
                return Ok(());
            }
            TasksTrackers::current().common.get_task_tracker().await.spawn(async move {
                loop {
                    let app_version_option = app_cloned.clone().map(|handle| handle.package_info().version.clone().to_string());
                    let jwt_token = ConfigCore::content()
                        .await
                        .airdrop_tokens()
                        .clone()
                        .map(|tokens| tokens.token);
                    let mut shutdown_signal = TasksTrackers::current().common.get_signal().await;
                    let jwt = jwt_token.map_or(String::new(), |token| token.to_string());
                    let app_version = app_version_option.map_or(String::from("unknown"), |version| version.to_string());
                    tokio::select! {
                      _= interval.tick() => {
                            if let Some(message) = WebsocketEventsManager::assemble_mining_status(
                              cpu_miner_status_watch_rx.clone(),
                              gpu_latest_miner_stats.clone(),
                              node_latest_status.clone(),
                              app_id.clone(),
                              app_version.clone(),
                              jwt,
                            ).await{
                                drop(websocket_tx_channel_clone.send(message).await.inspect_err(|e|{
                                  error!(target:LOG_TARGET, "could not send to websocket channel due to {e}");
                                }));
                            }
                      },
                      _= shutdown_signal.wait()=>{
                        info!(target:LOG_TARGET, "websocket events manager closed");

                        return;
                      }
                      _=wait_for_close_signal(close_channel_tx.subscribe(),is_started.clone())=>{
                        info!(target:LOG_TARGET, "websocket events manager closed");
                        return;
                      }
                    }
                }
            });
            *is_started_guard = true;
            Ok(())
        } else {
            Err(anyhow::anyhow!("could not start emitting"))
        }
    }

    async fn assemble_mining_status(
        cpu_miner_status_watch_rx: watch::Receiver<CpuMinerStatus>,
        gpu_latest_miner_stats: watch::Receiver<GpuMinerStatus>,
        node_latest_status: watch::Receiver<BaseNodeStatus>,
        app_id: String,
        app_version: String,
        jwt_token: String,
    ) -> Option<WebsocketMessage> {
        let BaseNodeStatus { block_height, .. } = *node_latest_status.borrow();

        let cpu_miner_status = cpu_miner_status_watch_rx.borrow().clone();
        let gpu_status = gpu_latest_miner_stats.borrow().clone();
        let network = Network::get_current_or_user_setting_or_default().as_key_str();
        let is_mining_active = cpu_miner_status.hash_rate > 0.0 || gpu_status.hash_rate > 0.0;
        let tari_address = InternalWallet::tari_address().await;

        if let Some(claims) = decode_jwt_claims_without_exp(&jwt_token) {
            let signable_message = format!(
                "{},{},{},{},{},{},{}",
                app_version,
                network,
                app_id,
                claims.id,
                is_mining_active,
                block_height,
                tari_address.to_base58()
            );
            if let Ok(SignWsDataResponse { signature, pub_key }) =
                sign_ws_data(signable_message).await
            {
                let payload = serde_json::json!({
                        "isMining":is_mining_active,
                        "appId":app_id,
                        "blockHeight":block_height,
                        "version":app_version,
                        "network":network,
                        "userId":claims.id,
                        "walletHash":tari_address.to_base58()
                });

                return Some(WebsocketMessage {
                    event: "mining-status".into(),
                    data: Some(payload),
                    signature: Some(signature),
                    pub_key: Some(pub_key),
                });
            }
        }
        None
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
