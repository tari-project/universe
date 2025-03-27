use std::collections::HashMap;
use std::collections::HashSet;
use std::sync::Arc;
use std::time::Duration;

use anyhow::Ok;
use chrono::Utc;
use futures::StreamExt;
use log::{error, info};
use serde_json::Value;
use tauri::AppHandle;
use tauri::Emitter;
use tokio::net::TcpStream;
use tokio::sync::RwLock;
use tokio::time::sleep;
use tokio_tungstenite::connect_async;
use tokio_tungstenite::MaybeTlsStream;
use tokio_tungstenite::WebSocketStream;
use tokio_util::sync::CancellationToken;
use tungstenite::Message;

use crate::app_in_memory_config::AppInMemoryConfig;
const LOG_TARGET: &str = "tari::universe::websocket";
const OTHER_MESSAGE_NAME: &str = "other";

#[derive(Debug, thiserror::Error)]
pub enum WebsocketError {
    #[error("Other error: {0}")]
    Other(#[from] anyhow::Error),

    #[error("Websocket error: {0}")]
    WebsocketError(#[from] tungstenite::Error),
}

#[derive(Debug, Clone, Eq, PartialEq, Hash)]
pub struct WebsocketStoredMessage {
    pub time: chrono::DateTime<Utc>,
    pub data: serde_json::Value,
}

pub struct Websocket {
    app_in_memory_config: Arc<RwLock<AppInMemoryConfig>>,
    ws_stream: Arc<RwLock<Option<WebSocketStream<MaybeTlsStream<TcpStream>>>>>,
    cancellation_token: CancellationToken,
    lastMessages: Arc<RwLock<HashMap<String, HashSet<WebsocketStoredMessage>>>>,
    app: AppHandle,
}

impl Websocket {
    pub fn new(
        app_in_memory_config: Arc<RwLock<AppInMemoryConfig>>,
        cancellation_token: CancellationToken,
        app: AppHandle,
    ) -> Self {
        Websocket {
            app_in_memory_config,
            ws_stream: Arc::new(RwLock::new(None)),
            cancellation_token,
            lastMessages: Arc::new(RwLock::new(HashMap::new())),
            app,
        }
    }
    async fn connect_to_url(
        config_cloned: &Arc<RwLock<AppInMemoryConfig>>,
        stream_cloned: &Arc<RwLock<Option<WebSocketStream<MaybeTlsStream<TcpStream>>>>>,
    ) -> Result<(), anyhow::Error> {
        let mut stream = stream_cloned.write().await;
        let config_read = config_cloned.read().await;
        let (ws_stream, _) = connect_async(config_read.websocket_url.clone()).await?;
        *stream = Some(ws_stream);
        drop(stream);
        Ok(())
    }

    pub async fn connect(&mut self) -> Result<(), anyhow::Error> {
        let in_memory_config = &self.app_in_memory_config;
        let config_cloned = in_memory_config.clone();
        let cancellation = self.cancellation_token.clone();
        let stream_cloned: Arc<RwLock<Option<WebSocketStream<MaybeTlsStream<TcpStream>>>>> =
            self.ws_stream.clone();
        let message_cache = self.lastMessages.clone();
        let app_cloned = self.app.clone();
        tauri::async_runtime::spawn(async move {
            tokio::select! {
                res = async {
                    loop {
                        let read_stream = stream_cloned.read().await;
                        match &*read_stream {
                            Some(_) => {
                                sleep(Duration::from_millis(5000)).await;
                            }
                            None => {
                                Websocket::connect_to_url(&config_cloned, &stream_cloned).await?;
                                Websocket::handle_ws_events(app_cloned.clone(),stream_cloned.clone(),cancellation.clone(),message_cache.clone()).await?;
                            }
                        }
                    }
                } => {
                    res
                },
                _ = cancellation.cancelled() => {
                    info!(target: LOG_TARGET,"websocket service has been cancelled.");
                    Ok::<()>(())
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
    ) -> Result<(), WebsocketError> {
        let mut stream_locked = stream.write().await;
        let result = if let Some(stream) = stream_locked.as_mut() {
            let (write_stream, mut read_stream) = stream.split();
            tokio::select! {
                Some(res)=read_stream.next()=>{
                    match res {
                        Result::Ok(message)=>{
                            match message {
                                Message::Text(text)=>{
                                    let message_as_str = text.as_str();
                                    let messsage_value:Value = serde_json::from_str(message_as_str)?;
                                    cache_msg(message_cache, &messsage_value).await;
                                    app.emit("ws", messsage_value);
                                },
                                _=>{
                                    error!(target: LOG_TARGET,"Not supported message type.");
                                }
                            }
                            Result::<(), WebsocketError>::Ok(())
                        },
                        Result::Err(_e)=>{
                            // return Err(e.map(|e|anyhow::));
                        //    WebsocketError(e)
                        Result::<(), WebsocketError>::Ok(())
                        }
                    }
                },
                _=cancellation_token.cancelled()=>{
                    Result::<(), WebsocketError>::Ok(())
                }
            }
        } else {
            Result::<(), WebsocketError>::Ok(())
        };

        Result::<(), WebsocketError>::Ok(())
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
    let message_name = check_message_type_if_exists(&value);

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
            return new_set;
        });

    return Result::<(), WebsocketError>::Ok(());
}

// tokio::select! {
//     _ = async {
//             let config_read = config_cloned.read().await;
//             let (_ws_stream,_) = connect_async(config_read.websocket_url.clone()).await?;
//             println!("WebSocket handshake has been successfully completed");
//             Ok::<Some(ws_stream),WebsocketError>(())
//     } => { Ok::<(),WebsocketError>(())},
//     _ = cancellation.cancelled() => {
//         info!(target: LOG_TARGET,"websocket service has been cancelled.");
//         Ok::<None,WebsocketError>(())
//     }
// }
