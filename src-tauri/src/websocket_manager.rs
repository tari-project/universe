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

use chrono::Utc;
use futures::SinkExt;
use futures::StreamExt;
use log::trace;
use log::{error, info};
use serde::Deserialize;
use serde::Serialize;
use serde_json::Value;
use tauri::AppHandle;
use tauri::Emitter;
use tauri::Manager;
use tokio::net::TcpStream;
use tokio::sync::broadcast;
use tokio::sync::mpsc;
use tokio::sync::watch;
use tokio::sync::Mutex;
use tokio::sync::RwLock;
use tokio::time::sleep;
use tokio_tungstenite::connect_async;
use tokio_tungstenite::MaybeTlsStream;
use tokio_tungstenite::WebSocketStream;
use tungstenite::Message;
use tungstenite::Utf8Bytes;
use urlencoding::encode;

use crate::app_in_memory_config::DynamicMemoryConfig;
use crate::configs::config_core::ConfigCore;
use crate::configs::trait_config::ConfigImpl;
use crate::tasks_tracker::TasksTrackers;

const LOG_TARGET: &str = "tari::universe::websocket";

#[derive(Debug, thiserror::Error)]
pub enum WebsocketError {
    #[error("Other error: {0}")]
    Other(#[from] anyhow::Error),

    #[error("Websocket error: {0}")]
    WsError(#[from] tungstenite::Error),

    #[error("serde error: {0}")]
    SerdeError(#[from] serde_json::Error),

    #[error("tauri error: {0}")]
    TauriError(#[from] tauri::Error),

    #[error("channel send error: {0}")]
    ChannelSendError(#[from] mpsc::error::SendError<String>),

    #[error("Missing app handle error")]
    MissingAppHandle,
}
#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct WebsocketMessage {
    pub event: String,
    pub data: Option<serde_json::Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub signature: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub pub_key: Option<String>,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, Eq)]
pub enum WebsocketManagerStatusMessage {
    Connected,
    Reconnecting,
    Stopped,
}

#[derive(Debug, Clone, Eq, PartialEq, Hash)]
pub struct WebsocketStoredMessage {
    pub time: chrono::DateTime<Utc>,
    pub data: serde_json::Value,
}

pub struct WebsocketManager {
    app_in_memory_config: Arc<RwLock<DynamicMemoryConfig>>,
    app: Option<AppHandle>,
    message_receiver_channel: Arc<Mutex<mpsc::Receiver<WebsocketMessage>>>,
    status_update_channel_tx: watch::Sender<WebsocketManagerStatusMessage>,
    status_update_channel_rx: watch::Receiver<WebsocketManagerStatusMessage>,
    close_channel_tx: tokio::sync::broadcast::Sender<bool>,
}

impl WebsocketManager {
    pub fn new(
        app_in_memory_config: Arc<RwLock<DynamicMemoryConfig>>,
        websocket_manager_rx: mpsc::Receiver<WebsocketMessage>,
        status_update_channel_tx: watch::Sender<WebsocketManagerStatusMessage>,
        status_update_channel_rx: watch::Receiver<WebsocketManagerStatusMessage>,
    ) -> Self {
        let (close_channel_tx, _) = tokio::sync::broadcast::channel::<bool>(1);
        WebsocketManager {
            app_in_memory_config,
            app: None,
            message_receiver_channel: Arc::new(Mutex::new(websocket_manager_rx)),
            status_update_channel_tx,
            status_update_channel_rx,
            close_channel_tx,
        }
    }

    pub fn set_app_handle(&mut self, app: AppHandle) {
        self.app = Some(app.clone());
        log::info!("websocket manager app handle set");
        let mut status_channel_rx = self.status_update_channel_rx.clone();
        let main_window = app
            .get_webview_window("main")
            .expect("main window must exist");

        tokio::spawn(async move {
            while status_channel_rx.changed().await.is_ok() {
                let new_state = status_channel_rx.borrow();
                drop(main_window
                    .clone()
                    .emit("ws-status-change", new_state.clone()).inspect_err(|e|{
                        error!(target:LOG_TARGET,"could not send ws-status-change event: {:?} error: {}",new_state, e.to_string());
                    }));
            }
        });
    }

    pub fn is_websocket_manager_ready(&self) -> bool {
        self.app.is_some()
    }

    async fn connect_to_url(
        in_memory_config: &Arc<RwLock<DynamicMemoryConfig>>,
    ) -> Result<WebSocketStream<MaybeTlsStream<TcpStream>>, anyhow::Error> {
        info!(target:LOG_TARGET,"connecting to websocket...");
        let config_read = in_memory_config.read().await;
        let mut adjusted_ws_url = config_read.airdrop_api_url.clone();
        if adjusted_ws_url.contains("https") {
            adjusted_ws_url = config_read.airdrop_api_url.clone().replace("https", "wss");
        } else {
            adjusted_ws_url = config_read.airdrop_api_url.clone().replace("http", "ws");
        }

        let app_id = ConfigCore::content().await.anon_id().clone();
        adjusted_ws_url.push_str(&format!("/v2/ws?app_id={}", encode(&app_id)));

        let token = ConfigCore::content()
            .await
            .airdrop_tokens()
            .clone()
            .map(|tokens| tokens.token);

        if let Some(jwt) = token {
            adjusted_ws_url.push_str(&format!("&token={}", encode(&jwt)));
        }

        // adjusted_ws_url.push_str(&format!("/new-wss"))
        let (ws_stream, _) = connect_async(adjusted_ws_url).await?;
        info!(target:LOG_TARGET,"websocket connection established...");

        Ok(ws_stream)
    }

    pub async fn close_connection(&self) {
        info!(target:LOG_TARGET,"websocket start to close...");

        match self.close_channel_tx.send(true) {
            Ok(_) => loop {
                if self
                    .status_update_channel_rx
                    .clone()
                    .changed()
                    .await
                    .is_ok()
                {
                    let actual_state = self.status_update_channel_rx.borrow();
                    if actual_state.clone() == WebsocketManagerStatusMessage::Stopped {
                        info!(target:LOG_TARGET,"websocket stopped");

                        return;
                    }
                } else {
                    return;
                }
            },
            Err(_) => {
                info!(target: LOG_TARGET,"websocket connection has already been closed.");
            }
        };
        info!(target: LOG_TARGET,"websocket connection closed");
    }

    pub async fn connect(&mut self) -> Result<(), anyhow::Error> {
        if self.status_update_channel_rx.borrow().clone() != WebsocketManagerStatusMessage::Stopped
        {
            info!(target:LOG_TARGET,"websocket already connected");
            return Ok(());
        }
        if self.app.is_none() {
            return Err(anyhow::anyhow!(
                " Cannot connect to websocket as app is not set yet"
            ));
        }

        let in_memory_config = &self.app_in_memory_config;
        let config_cloned = in_memory_config.clone();
        let app_cloned = self.app.clone().ok_or(WebsocketError::MissingAppHandle)?;
        let receiver_channel = self.message_receiver_channel.clone();
        let mut shutdown_signal = TasksTrackers::current().common.get_signal().await;
        let status_update_channel_tx = self.status_update_channel_tx.clone();
        let mut status_update_channel_rx: watch::Receiver<WebsocketManagerStatusMessage> =
            self.status_update_channel_rx.clone();
        let close_channel_tx = self.close_channel_tx.clone();
        //we don't want to receive previous messages
        status_update_channel_rx.mark_unchanged();

        tauri::async_runtime::spawn(async move {
            loop {
                tokio::select! {
                    _ = async {
                        let connection_res = WebsocketManager::connect_to_url(&config_cloned).await.inspect_err(|e|{
                            error!(target:LOG_TARGET,"failed to connect to websocket due to {}",e.to_string())});

                        if let Ok(connection) = connection_res {
                            WebsocketManager::listen(connection,app_cloned.clone(),
                                receiver_channel.clone(),
                                status_update_channel_tx.clone(),
                                close_channel_tx.clone()).await
                        }
                        let _ = status_update_channel_tx
                        .send(WebsocketManagerStatusMessage::Reconnecting);
                        sleep(Duration::from_millis(5000)).await;
                        Ok::<(),anyhow::Error>(())
                    } => {},
                    _=wait_for_close_signal(close_channel_tx.clone().subscribe())=>{
                        let _ = status_update_channel_tx
                        .send(WebsocketManagerStatusMessage::Stopped);
                        info!(target: LOG_TARGET,"websocket service has been cancelled.");
                        return Ok::<(),anyhow::Error>(());
                    }
                    _= shutdown_signal.wait()=>{
                        let _ = status_update_channel_tx
                        .send(WebsocketManagerStatusMessage::Stopped);
                        return Ok::<(),anyhow::Error>(());
                    }
                }
            }
        });

        info!(target:LOG_TARGET,"waiting for websocket startup");
        if status_update_channel_rx.changed().await.is_ok() {
            let value = status_update_channel_rx.borrow().clone();
            if value == WebsocketManagerStatusMessage::Connected {
                return Ok(());
            } else {
                return Err(anyhow::anyhow!(
                    "Websocket could not connect to backend as its status is {:?}",
                    value
                ));
            }
        };

        Ok(())
    }

    pub async fn listen(
        connection_stream: WebSocketStream<MaybeTlsStream<TcpStream>>,
        app: AppHandle,
        message_receiver_channel: Arc<Mutex<mpsc::Receiver<WebsocketMessage>>>,
        status_update_channel_tx: watch::Sender<WebsocketManagerStatusMessage>,
        close_channel_tx: tokio::sync::broadcast::Sender<bool>,
    ) {
        let (write_stream, read_stream) = connection_stream.split();
        info!(target:LOG_TARGET,"listening to websocket events");
        let mut shutdown_signal = TasksTrackers::current().common.get_signal().await;

        let close_channel_tx_sender = close_channel_tx.clone();
        let close_channel_tx_receiver = close_channel_tx.clone();

        let _ = status_update_channel_tx.send(WebsocketManagerStatusMessage::Connected);

        tokio::select! {
            _= tauri::async_runtime::spawn(async move {
                receiver_task(app, read_stream, close_channel_tx_receiver.clone()).await;
            })=>{},
            _=tauri::async_runtime::spawn(async move {
                drop(sender_task(message_receiver_channel, write_stream, close_channel_tx_sender.clone()).await);
            })=>{},
            _=wait_for_close_signal(close_channel_tx.clone().subscribe())=>{
                return;
            },
            _=shutdown_signal.wait()=>{
                return;
            }
        }
        info!(target:LOG_TARGET, "websocket task closed");
    }
}

async fn sender_task(
    receiver_channel: Arc<Mutex<mpsc::Receiver<WebsocketMessage>>>,
    mut write_stream: futures::stream::SplitSink<
        WebSocketStream<MaybeTlsStream<TcpStream>>,
        Message,
    >,
    close_channel_tx: tokio::sync::broadcast::Sender<bool>,
) -> Result<(), WebsocketError> {
    let mut shutdown_signal = TasksTrackers::current().common.get_signal().await;
    info!(target:LOG_TARGET,"websocket_manager: tx loop initialized...");
    let mut receiver = receiver_channel.lock().await;
    loop {
        tokio::select! {
            Some(msg) = receiver.recv() => {
                let message_as_json = serde_json::to_string(&msg)?;
                write_stream
                    .send(Message::Text(Utf8Bytes::from(message_as_json.clone())))
                    .await
                    .inspect_err(|e| {
                        error!(target:LOG_TARGET,"Failed to send websocket message: {}", e);
                    })?;
                 // info!(target:LOG_TARGET,"websocket event sent to airdrop {:?}", message_as_json);
            },
            _=wait_for_close_signal(close_channel_tx.clone().subscribe())=>{
                info!(target:LOG_TARGET, "exiting websocket_manager sender task");
                return Result::Ok(());
            },
            _=shutdown_signal.wait()=>{
                info!(target:LOG_TARGET, "shutting down websocket_manager sender task");
                return Result::Ok(());
            }
        }
    }
}

async fn wait_for_close_signal(mut channel: broadcast::Receiver<bool>) {
    match channel.recv().await {
        Ok(_) => {
            trace!(target:LOG_TARGET,"received websocket_manager stop signal");
        }
        Err(_) => {
            trace!(target:LOG_TARGET,"received websocket_manager stop signal");
        }
    }
}

async fn receiver_task(
    app: AppHandle,
    mut read_stream: futures::stream::SplitStream<WebSocketStream<MaybeTlsStream<TcpStream>>>,
    close_channel_tx: tokio::sync::broadcast::Sender<bool>,
) {
    let mut shutdown_signal = TasksTrackers::current().common.get_signal().await;
    info!(target:LOG_TARGET,"websocket_manager: rx loop initialized...");
    loop {
        tokio::select! {
                Some(msg_or_error) = read_stream.next() => {
                    match msg_or_error {
                        Result::Ok(msg) => match msg {
                            Message::Text(text) => {
                                info!(target:LOG_TARGET,"websocket message received {}", text);
                                let message_as_str = text.as_str();
                                let messsage_value = serde_json::from_str::<Value>(message_as_str).inspect_err(|e|{
                                            error!(target:LOG_TARGET,"Received text websocket message that cannot be transformed to JSON: {}", e);
                                        }).ok();

                                if let Some(message) = messsage_value {
                                    drop(app.emit("ws-rx", message).inspect_err(|e|{
                                                error!(target:LOG_TARGET,"Received text websocket message cannot be sent to frontend: {}", e);
                                            }));
                                }
                            }
                            Message::Close(_) => {
                                info!(target:LOG_TARGET, "webSocket connection got closed.");
                                return;
                            }
                            _ => {
                                error!(target: LOG_TARGET,"Not supported message type.");
                            }
                        },
                        Result::Err(e) => {
                            error!(target: LOG_TARGET,"error at receiving websocket stream message {}",e);
                            return;
                        }
                    }
            },
            _=wait_for_close_signal(close_channel_tx.clone().subscribe())=>{
                info!(target:LOG_TARGET, "exiting websocket_manager receiver task");
                return;
            },
            _=shutdown_signal.wait()=>{
                info!(target:LOG_TARGET, "shutting down websocket_manager receiver task");
                return;
            }
        }
    }
}
