use std::{sync::Arc, time::Duration};

use log::{error, info};
use tari_common::configuration::Network;
use tari_shutdown::Shutdown;
use tauri::AppHandle;
use tokio::{
    sync::{watch, RwLock},
    time,
};

use crate::{
    airdrop::decode_jwt_claims_without_exp,
    commands::{sign_ws_data, CpuMinerStatus, SignWsDataResponse},
    websocket_manager::WebsocketMessage,
    AppConfig, BaseNodeStatus, GpuMinerStatus,
};
const LOG_TARGET: &str = "tari::universe::websocket_events_manager";
static INTERVAL_DURATION: std::time::Duration = Duration::from_secs(15);

pub struct WebsocketEventsManager {
    app: Option<AppHandle>,
    app_config: Arc<RwLock<AppConfig>>,
    cpu_miner_status_watch_rx: watch::Receiver<CpuMinerStatus>,
    gpu_latest_miner_stats: watch::Receiver<GpuMinerStatus>,
    node_latest_status: watch::Receiver<BaseNodeStatus>,
    shutdown: Shutdown,
    app_id: String,
    websocket_tx_channel: Arc<tokio::sync::mpsc::Sender<WebsocketMessage>>,
}

impl WebsocketEventsManager {
    pub fn new(
        app_config: Arc<RwLock<AppConfig>>,
        app_id: String,
        cpu_miner_status_watch_rx: watch::Receiver<CpuMinerStatus>,
        gpu_latest_miner_stats: watch::Receiver<GpuMinerStatus>,
        node_latest_status: watch::Receiver<BaseNodeStatus>,
        shutdown: Shutdown,
        websocket_tx_channel: tokio::sync::mpsc::Sender<WebsocketMessage>,
    ) -> Self {
        WebsocketEventsManager {
            cpu_miner_status_watch_rx,
            gpu_latest_miner_stats,
            node_latest_status,
            shutdown,
            app_id,
            websocket_tx_channel: Arc::new(websocket_tx_channel),
            app: None,
            app_config,
        }
    }

    pub fn set_app_handle(&mut self, app: AppHandle) {
        self.app = Some(app);
    }

    pub async fn emit_interval_ws_events(&mut self) {
        let mut interval = time::interval(INTERVAL_DURATION);
        let shutdown = self.shutdown.clone();
        let cpu_miner_status_watch_rx = self.cpu_miner_status_watch_rx.clone();
        let gpu_latest_miner_stats = self.gpu_latest_miner_stats.clone();
        let node_latest_status = self.node_latest_status.clone();
        let app_id = self.app_id.clone();
        let app_version = self
            .app
            .clone()
            .map(|handle| handle.package_info().version.clone())
            .expect("no app version present in WebsocketEventsManager")
            .to_string();
        let app_config_clone = self.app_config.clone();
        let websocket_tx_channel_clone = self.websocket_tx_channel.clone();

        tokio::spawn(async move {
            loop {
                let jwt_token = app_config_clone
                    .read()
                    .await
                    .airdrop_tokens()
                    .map(|tokens| tokens.token);
                let mut shutdown_signal = shutdown.clone().to_signal();
                tokio::select! {
                  _= interval.tick() => {
                        info!(target:LOG_TARGET, "jwt might exist");
                        if let Some(jwt)= jwt_token{
                            info!(target:LOG_TARGET, "jwt exist");

                        if let Some(message) = WebsocketEventsManager::assemble_mining_status(
                          cpu_miner_status_watch_rx.clone(),
                          gpu_latest_miner_stats.clone(),
                          node_latest_status.clone(),
                          app_id.clone(),
                          app_version.clone(),
                          jwt,
                        ).await{
                            info!(target:LOG_TARGET, "sending mining-status message: {:?}", message);

                            let _ = websocket_tx_channel_clone.send(message).await.inspect_err(|e|{
                              error!(target:LOG_TARGET, "could not send to websocket channel due to {}",e);
                            });
                        }}
                  },
                  _= shutdown_signal.wait()=>{
                    info!(target:LOG_TARGET, "websocket events manager closed");
                    return;
                  }
                }
            }
        });
    }

    async fn assemble_mining_status(
        cpu_miner_status_watch_rx: watch::Receiver<CpuMinerStatus>,
        gpu_latest_miner_stats: watch::Receiver<GpuMinerStatus>,
        node_latest_status: watch::Receiver<BaseNodeStatus>,
        app_id: String,
        app_version: String,
        jwt_token: String,
    ) -> Option<WebsocketMessage> {
        let BaseNodeStatus { block_height, .. } = node_latest_status.borrow().clone();

        let cpu_miner_status = cpu_miner_status_watch_rx.borrow().clone();
        let gpu_status = gpu_latest_miner_stats.borrow().clone();
        let network = match Network::get_current_or_user_setting_or_default() {
            Network::Esmeralda => "esmeralda".to_owned(),
            Network::NextNet => "nextnet".to_owned(),
            _ => "unknown".to_owned(),
        };
        let is_mining_active = cpu_miner_status.hash_rate > 0.0 || gpu_status.hash_rate > 0.0;

        if let Some(claims) = decode_jwt_claims_without_exp(&jwt_token) {
            let signable_message = format!(
                "{},{},{},{},{},{}",
                app_version, network, app_id, claims.id, is_mining_active, block_height
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
                        "userId":claims.id
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
