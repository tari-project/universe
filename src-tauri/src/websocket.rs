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
    WsError(#[from] tungstenite::Error),

    #[error("serde error: {0}")]
    SerdeError(#[from] serde_json::Error),

    #[error("tauri error: {0}")]
    TauriError(#[from] tauri::Error),

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
}

impl WebsocketManager {
    pub fn new(app_in_memory_config: Arc<RwLock<AppInMemoryConfig>>) -> Self {
        WebsocketManager {
            app_in_memory_config,
            ws_stream: Arc::new(RwLock::new(None)),
            cancellation_token: CancellationToken::new(),
            message_cache: Arc::new(RwLock::new(HashMap::new())),
            app: None,
        }
    }

    pub fn set_app_handle(&mut self, app: AppHandle) {
        self.app = Some(app);
    }

    pub fn close(&self) {
        self.cancellation_token.cancel();
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
        let message_cache = self.message_cache.clone();
        let app_cloned = self.app.clone().ok_or(WebsocketError::MissingAppHandle)?;
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
                                let res = WebsocketManager::connect_to_url(&config_cloned, &stream_cloned).await.inspect_err(|e|{error!(target:LOG_TARGET,"failed to connect to websocket due to{}",e.to_string())});
                                if res.is_ok() {
                                    WebsocketManager::handle_ws_events(app_cloned.clone(),stream_cloned.clone(),cancellation.clone(),message_cache.clone()).await.inspect_err(|e|{error!(target:LOG_TARGET,"Websocket: event handler error:{}",e.to_string())});
                                }
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
        let Some(stream) = stream_locked.as_mut() else {
            return Result::<(), WebsocketError>::Ok(());
        };

        let (_write_stream, mut read_stream) = stream.split();
        loop {
            tokio::select! {
                Some(res)=read_stream.next()=>{
                    let message = res.map_err(WebsocketError::WsError)?;
                    match message{
                            Message::Text(text)=>{
                                let message_as_str = text.as_str();
                                let messsage_value:Value = serde_json::from_str(message_as_str)?;
                                cache_msg(message_cache.clone(), &messsage_value).await?;
                                app.emit("ws", messsage_value)?;
                            },
                            _=>{
                                error!(target: LOG_TARGET,"Not supported message type.");
                            }
                    }

                },
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
