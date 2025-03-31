use std::collections::HashMap;
use std::collections::HashSet;
use std::sync::Arc;
use std::time::Duration;

use chrono::Utc;
use futures::SinkExt;
use futures::StreamExt;
use log::warn;
use log::{error, info};
use serde_json::Value;
use tari_utilities::message_format::MessageFormat;
use tauri::AppHandle;
use tauri::Emitter;
use tokio::net::TcpStream;
use tokio::sync::mpsc;
use tokio::sync::RwLock;
use tokio::time::sleep;
use tokio_tungstenite::connect_async;
use tokio_tungstenite::MaybeTlsStream;
use tokio_tungstenite::WebSocketStream;
use tokio_util::sync::CancellationToken;
use tungstenite::Message;
use tungstenite::Utf8Bytes;

use crate::app_in_memory_config::AppInMemoryConfig;
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

#[derive(Debug, Clone, Eq, PartialEq, Hash)]
pub struct WebsocketStoredMessage {
    pub time: chrono::DateTime<Utc>,
    pub data: serde_json::Value,
}

pub struct WebsocketManager {
    app_in_memory_config: Arc<RwLock<AppInMemoryConfig>>,
    ws_stream: Arc<RwLock<Option<WebSocketStream<MaybeTlsStream<TcpStream>>>>>,
    cancellation_token: CancellationToken,
    message_cache: Arc<RwLock<HashMap<String, HashSet<WebsocketStoredMessage>>>>,
    app: Option<AppHandle>,
    sender_channel: tokio::sync::mpsc::Sender<String>,
    receiver_channel: Arc<RwLock<tokio::sync::mpsc::Receiver<String>>>,
}

impl WebsocketManager {
    pub fn new(app_in_memory_config: Arc<RwLock<AppInMemoryConfig>>) -> Self {
        let (sender_channel, receiver_channel) = mpsc::channel::<String>(100);
        WebsocketManager {
            app_in_memory_config,
            ws_stream: Arc::new(RwLock::new(None)),
            cancellation_token: CancellationToken::new(),
            message_cache: Arc::new(RwLock::new(HashMap::new())),
            app: None,
            sender_channel,
            receiver_channel: Arc::new(RwLock::new(receiver_channel)),
        }
    }

    pub fn set_app_handle(&mut self, app: AppHandle) {
        self.app = Some(app);
        log::info!("websocket manager app handle set");
    }

    pub async fn send_ws_message<'a>(&self, value: &'a str) -> Result<(), WebsocketError> {
        //check if it is a json value
        let messag_content_result = serde_json::from_str::<Value>(value)
            .inspect_err(|e| warn!(target:LOG_TARGET,"websocket message is not json"))?;
        log::trace!("websocket message sent {}", messag_content_result);
        self.sender_channel.send(value.clone().into()).await?;
        Result::Ok(())
    }

    pub fn close(&self) {
        self.cancellation_token.cancel();
    }

    async fn connect_to_url(
        config_cloned: &Arc<RwLock<AppInMemoryConfig>>,
        stream_cloned: &Arc<RwLock<Option<WebSocketStream<MaybeTlsStream<TcpStream>>>>>,
    ) -> Result<(), anyhow::Error> {
        info!(target:LOG_TARGET,"connecting to websocket...");
        let mut stream = stream_cloned.write().await;
        let config_read = config_cloned.read().await;
        let adjusted_ws_url = config_read.airdrop_api_url.clone().replace("http", "ws");
        let (ws_stream, _) = connect_async(adjusted_ws_url).await?;

        *stream = Some(ws_stream);
        drop(stream);
        info!(target:LOG_TARGET,"websocket connection established...");
        Ok(())
    }

    pub async fn connect(&mut self) -> Result<(), anyhow::Error> {
        let in_memory_config = &self.app_in_memory_config;
        let config_cloned = in_memory_config.clone();
        let cancellation = self.cancellation_token.clone();
        let stream_cloned: Arc<RwLock<Option<WebSocketStream<MaybeTlsStream<TcpStream>>>>> =
            self.ws_stream.clone();
        let message_cache = self.message_cache.clone();
        let app_cloned = self.app.clone().ok_or(WebsocketError::MissingAppHandle)?;
        let receiver_channel = self.receiver_channel.clone();
        tauri::async_runtime::spawn(async move {
            tokio::select! {
                res = async {
                    loop {
                        let read_stream = stream_cloned.read().await;
                        let stream_is_open = read_stream.is_some();

                        drop(read_stream);
                        if !stream_is_open {
                            let res = WebsocketManager::connect_to_url(&config_cloned, &stream_cloned).await.inspect_err(|e|{
                                error!(target:LOG_TARGET,"failed to connect to websocket due to {}",e.to_string())});
                            if res.is_ok() {
                                _= WebsocketManager::handle_ws_events(app_cloned.clone(),
                                stream_cloned.clone(),
                                cancellation.clone(),
                                message_cache.clone(),
                                receiver_channel.clone()).await
                                .inspect_err(|e|{error!(target:LOG_TARGET,"Websocket: event handler error:{}",e.to_string())});
                            }
                        }
                        sleep(Duration::from_millis(5000)).await;
                    }
                } => {
                    res
                },
                _ = cancellation.cancelled() => {
                    info!(target: LOG_TARGET,"websocket service has been cancelled.");
                }
            }
        });
        Ok(())
    }

    pub async fn handle_ws_events(
        app: AppHandle,
        stream: Arc<RwLock<Option<WebSocketStream<MaybeTlsStream<TcpStream>>>>>,
        cancellation_token: CancellationToken,
        message_cache: Arc<RwLock<HashMap<String, HashSet<WebsocketStoredMessage>>>>,
        receiver_channel: Arc<RwLock<tokio::sync::mpsc::Receiver<String>>>,
    ) -> Result<(), WebsocketError> {
        let mut stream_locked = stream.write().await;
        let Some(stream) = stream_locked.as_mut() else {
            return Result::<(), WebsocketError>::Ok(());
        };

        let (mut write_stream, mut read_stream) = stream.split();
        info!(target:LOG_TARGET,"listening to websocket events");
        // write_stream.("hey".to_binary());

        loop {
            let receive_task = async {
                while let Some(Ok(msg)) = read_stream.next().await {
                    match msg {
                        Message::Text(text) => {
                            info!(target:LOG_TARGET,"websocket message received...{}", text);
                            let message_as_str = text.as_str();
                            let messsage_value = serde_json::from_str::<Value>(message_as_str).inspect_err(|e|{
                                error!(target:LOG_TARGET,"Received websocket message that cannot be transformed to JSON: {}", e);
                            }).ok();

                            if let Some(message) = messsage_value {
                                let _ = cache_msg(message_cache.clone(), &message).await.inspect_err(|e|{
                                    error!(target:LOG_TARGET,"Received websocket message cannot be cached: {}", e);
                                });
                                let _ = app.emit("ws", message).inspect_err(|e|{
                                    error!(target:LOG_TARGET,"Received websocket message cannot be sent to frontend: {}", e);
                                });
                            }
                        }
                        Message::Close(_) => {
                            info!(target:LOG_TARGET, "webSocket closed.");
                            cancellation_token.cancel();
                        }
                        _ => {
                            error!(target: LOG_TARGET,"Not supported message type.");
                        }
                    }
                }
            };

            let mut receiver_channel_guard = receiver_channel.write().await;
            let sender_task = async {
                info!(target:LOG_TARGET,"websocket_manager: tx loop initialized...");
                while let Some(msg) = receiver_channel_guard.recv().await {
                    if let Err(e) = write_stream
                        .send(Message::Text(Utf8Bytes::from(msg.clone())))
                        .await
                    {
                        error!(target:LOG_TARGET,"Failed to send websocket message: {}", e);
                        continue;
                    }
                    info!(target:LOG_TARGET,"websocket event sent to airdrop {}", msg);
                }
            };
            tokio::select! {
                _=receive_task=>{},
                _=sender_task=>{},
                _=cancellation_token.cancelled()=>{
                }
            }
        }
    }
}

fn check_message_type_if_exists(value: &Value) -> Option<String> {
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
    let message_name = check_message_type_if_exists(value);

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
