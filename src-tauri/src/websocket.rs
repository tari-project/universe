use std::collections::HashMap;
use std::collections::HashSet;
use std::sync::Arc;
use std::time::Duration;

use chrono::Utc;
use futures::SinkExt;
use futures::StreamExt;
use log::warn;
use log::{error, info};
use serde::Deserialize;
use serde::Serialize;
use serde_json::Value;
use tari_common::configuration::Network;
use tari_utilities::message_format::MessageFormat;
use tauri::AppHandle;
use tauri::Emitter;
use tauri::Manager;
use tokio::net::TcpStream;
use tokio::sync::mpsc;
use tokio::sync::mpsc::error::TryRecvError;
use tokio::sync::watch;
use tokio::sync::Mutex;
use tokio::sync::RwLock;
use tokio::time::sleep;
use tokio_tungstenite::connect_async;
use tokio_tungstenite::MaybeTlsStream;
use tokio_tungstenite::WebSocketStream;
use tokio_util::sync::CancellationToken;
use tungstenite::Message;
use tungstenite::Utf8Bytes;

use crate::airdrop::decode_jwt_claims_without_exp;
use crate::app_in_memory_config::AppInMemoryConfig;
use crate::commands::sign_ws_data;
use crate::commands::CpuMinerStatus;
use crate::commands::SignWsDataResponse;
use crate::hardware::hardware_status_monitor::HardwareStatusMonitor;
use crate::BaseNodeStatus;
use crate::GpuMinerStatus;
use crate::UniverseAppState;
const LOG_TARGET: &str = "tari::universe::websocket";
const OTHER_MESSAGE_NAME: &str = "other";

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
    ChannelSendError(#[from] tokio::sync::mpsc::error::SendError<String>),

    #[error("Missing app handle error")]
    MissingAppHandle,
}
#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct WebsocketMessage {
    pub event: String,
    pub data: serde_json::Value,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub signature: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub pub_key: Option<String>,
}

#[derive(Debug, Clone, Eq, PartialEq, Hash)]
pub struct WebsocketStoredMessage {
    pub time: chrono::DateTime<Utc>,
    pub data: serde_json::Value,
}

pub struct WebsocketManager {
    app_in_memory_config: Arc<RwLock<AppInMemoryConfig>>,
    cancellation_token: CancellationToken,
    message_cache: Arc<RwLock<HashMap<String, HashSet<WebsocketStoredMessage>>>>,
    app: Option<AppHandle>,
    receiver_channel: Arc<Mutex<tokio::sync::mpsc::Receiver<WebsocketMessage>>>,
}

impl WebsocketManager {
    pub fn new(
        app_in_memory_config: Arc<RwLock<AppInMemoryConfig>>,
        websocket_manager_rx: tokio::sync::mpsc::Receiver<WebsocketMessage>,
    ) -> Self {
        WebsocketManager {
            app_in_memory_config,
            cancellation_token: CancellationToken::new(),
            message_cache: Arc::new(RwLock::new(HashMap::new())),
            app: None,
            receiver_channel: Arc::new(Mutex::new(websocket_manager_rx)),
        }
    }

    pub fn set_app_handle(&mut self, app: AppHandle) {
        self.app = Some(app);
        log::info!("websocket manager app handle set");
    }

    // pub async fn send_ws_message<'a>(&self, value: &'a str) -> Result<(), WebsocketError> {
    //     //check if it is a json value
    //     let message_content_result = serde_json::from_str::<WebsocketMessage>(value)
    //         .inspect_err(|e| warn!(target:LOG_TARGET,"websocket message is not json"))?;
    //     log::trace!("websocket message sent {:?}", message_content_result);
    //     self.sender_channel.send(value.into()).await?;
    //     Result::Ok(())
    // }

    pub fn close(&self) {
        self.cancellation_token.cancel();
    }

    async fn connect_to_url(
        config_cloned: &Arc<RwLock<AppInMemoryConfig>>,
    ) -> Result<WebSocketStream<MaybeTlsStream<TcpStream>>, anyhow::Error> {
        info!(target:LOG_TARGET,"connecting to websocket...");
        let config_read = config_cloned.read().await;
        let adjusted_ws_url = config_read.airdrop_api_url.clone().replace("http", "ws");
        let (ws_stream, _) = connect_async(adjusted_ws_url).await?;
        info!(target:LOG_TARGET,"websocket connection established...");

        Ok(ws_stream)
    }

    pub async fn connect(&mut self) -> Result<(), anyhow::Error> {
        let in_memory_config = &self.app_in_memory_config;
        let config_cloned = in_memory_config.clone();
        let cancellation = self.cancellation_token.clone();
        let message_cache = self.message_cache.clone();
        let app_cloned = self.app.clone().ok_or(WebsocketError::MissingAppHandle)?;
        let receiver_channel = self.receiver_channel.clone();
        tauri::async_runtime::spawn(async move {
            tokio::select! {
                res = async {
                    loop {
                        if cancellation.is_cancelled(){
                            return Ok::<(),anyhow::Error>(());
                        }
                        let connection_res = WebsocketManager::connect_to_url(&config_cloned).await.inspect_err(|e|{
                            error!(target:LOG_TARGET,"failed to connect to websocket due to {}",e.to_string())});
                        if let Ok(connection) = connection_res {
                            _= WebsocketManager::listen(connection,app_cloned.clone(),
                            cancellation.clone(),
                            message_cache.clone(),
                            receiver_channel.clone()).await
                            .inspect_err(|e|{error!(target:LOG_TARGET,"Websocket: event handler error:{}",e.to_string())});
                        }
                        sleep(Duration::from_millis(5000)).await;
                    }
                } => {
                    res
                },
                _ = cancellation.cancelled() => {
                    info!(target: LOG_TARGET,"websocket service has been cancelled.");
                    Ok::<(),anyhow::Error>(())
                }
            }
        });
        Ok(())
    }

    pub async fn listen(
        connection_stream: WebSocketStream<MaybeTlsStream<TcpStream>>,
        app: AppHandle,
        connection_cancellation_token: CancellationToken,
        message_cache: Arc<RwLock<HashMap<String, HashSet<WebsocketStoredMessage>>>>,
        receiver_channel: Arc<Mutex<tokio::sync::mpsc::Receiver<WebsocketMessage>>>,
    ) -> Result<(), WebsocketError> {
        let (write_stream, read_stream) = connection_stream.split();
        info!(target:LOG_TARGET,"listening to websocket events");

        let task_cancellation = CancellationToken::new();
        let task_cancellation_cloned = task_cancellation.clone();
        let task_cancellation_cloned2 = task_cancellation.clone();

        //receiver
        let receiver_task = tauri::async_runtime::spawn(async move {
            tokio::select! {
                _=receiver_task(app, message_cache, read_stream)=>{
                },
                _=task_cancellation_cloned.cancelled()=>{
                    info!(target:LOG_TARGET,"cancelling receiver task");
                }
            }
        });

        //sender
        let sender_task = tauri::async_runtime::spawn(async move {
            tokio::select! {
                _=sender_task(receiver_channel, write_stream)=>{
                },
                _=task_cancellation_cloned2.cancelled()=>{
                    info!(target:LOG_TARGET,"cancelling sender task");
                }
            }
        });

        tokio::select! {
            _=receiver_task=>{
                info!(target:LOG_TARGET,"receiver cancelled");
                task_cancellation.cancel();
            },
            _=sender_task=>{
                info!(target:LOG_TARGET,"sender cancelled");
                task_cancellation.cancel();
            },
            _=connection_cancellation_token.cancelled()=>{
                task_cancellation.cancel();
            }
        }
        info!(target:LOG_TARGET, "websocket task closed");

        Result::Ok(())
    }
}

async fn sender_task(
    receiver_channel: Arc<Mutex<tokio::sync::mpsc::Receiver<WebsocketMessage>>>,
    mut write_stream: futures::stream::SplitSink<
        WebSocketStream<MaybeTlsStream<TcpStream>>,
        Message,
    >,
) -> Result<(), WebsocketError> {
    info!(target:LOG_TARGET,"websocket_manager: tx loop initialized...");
    let mut receiver = receiver_channel.lock().await;
    while let Some(msg) = receiver.recv().await {
        let message_as_json = serde_json::to_string(&msg)?;
        write_stream
            .send(Message::Text(Utf8Bytes::from(message_as_json.clone())))
            .await
            .inspect_err(|e| {
                error!(target:LOG_TARGET,"Failed to send websocket message: {}", e);
            })?;
        info!(target:LOG_TARGET,"websocket event sent to airdrop {:?}", message_as_json);
    }
    info!(target:LOG_TARGET, "exiting sender task");
    Result::Ok(())
}

async fn receiver_task(
    app: AppHandle,
    message_cache: Arc<RwLock<HashMap<String, HashSet<WebsocketStoredMessage>>>>,
    mut read_stream: futures::stream::SplitStream<WebSocketStream<MaybeTlsStream<TcpStream>>>,
) {
    info!(target:LOG_TARGET,"websocket_manager: rx loop initialized...");
    while let Some(msg_or_error) = read_stream.next().await {
        match msg_or_error {
            Result::Ok(msg) => match msg {
                Message::Text(text) => {
                    info!(target:LOG_TARGET,"websocket message received {}", text);
                    let message_as_str = text.as_str();
                    let messsage_value = serde_json::from_str::<Value>(message_as_str).inspect_err(|e|{
                                    error!(target:LOG_TARGET,"Received text websocket message that cannot be transformed to JSON: {}", e);
                                }).ok();

                    if let Some(message) = messsage_value {
                        let _ = cache_msg(message_cache.clone(), &message).await.inspect_err(|e|{
                                        error!(target:LOG_TARGET,"Received text websocket message cannot be cached: {}", e);
                                    });
                        let _ = app.emit("ws", message).inspect_err(|e|{
                                        error!(target:LOG_TARGET,"Received text websocket message cannot be sent to frontend: {}", e);
                                    });
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
            }
        }
    }
    info!(target:LOG_TARGET, "websocket receiving stream closed from server side");
}

fn check_message_conforms_to_event_format(value: &Value) -> Option<String> {
    if let Value::Object(map) = value {
        if let (Some(Value::String(name)), Some(_)) = (map.get("name"), map.get("data")) {
            return Some(name.clone());
        }
    }
    None
}

async fn cache_msg(
    cache: Arc<RwLock<HashMap<String, HashSet<WebsocketStoredMessage>>>>,
    value: &Value,
) -> Result<(), WebsocketError> {
    let message_name = check_message_conforms_to_event_format(value);

    let mut cache_write = cache.write().await;
    let key = message_name.unwrap_or(OTHER_MESSAGE_NAME.into());

    let new_message = WebsocketStoredMessage {
        time: Utc::now(),
        data: value.clone(),
    };

    cache_write
        .entry(key.clone())
        .and_modify(|message_set| {
            if key != "other" {
                //we only store the latest of named messages, this is the normal mode of operation
                message_set.clear();
                message_set.insert(new_message.clone());
            } else {
                //other messages get accumulated
                message_set.insert(new_message.clone());
            }
        })
        .or_insert_with(|| {
            let mut new_set: HashSet<WebsocketStoredMessage> = HashSet::new();
            new_set.insert(new_message.clone());
            new_set
        });

    Result::<(), WebsocketError>::Ok(())
}
