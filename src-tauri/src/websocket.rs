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
use tauri::AppHandle;
use tauri::Emitter;
use tokio::net::TcpStream;
use tokio::sync::mpsc;
use tokio::sync::mpsc::error::TryRecvError;
use tokio::sync::watch;
use tokio::sync::RwLock;
use tokio::time::sleep;
use tokio_tungstenite::connect_async;
use tokio_tungstenite::MaybeTlsStream;
use tokio_tungstenite::WebSocketStream;
use tokio_util::sync::CancellationToken;
use tokio_util::task::TaskTracker;
use tungstenite::Message;
use tungstenite::Utf8Bytes;

use crate::airdrop::decode_jwt_claims_without_exp;
use crate::app_in_memory_config::AppInMemoryConfig;
use crate::commands::sign_ws_data;
use crate::commands::CpuMinerStatus;
use crate::hardware::hardware_status_monitor::HardwareStatusMonitor;
use crate::BaseNodeStatus;
use crate::GpuMinerStatus;
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
struct WebsocketMessage {
    event: String,
    data: serde_json::Value,
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
    sender_channel: tokio::sync::mpsc::Sender<String>,
    receiver_channel: Arc<RwLock<tokio::sync::mpsc::Receiver<String>>>,
}

impl WebsocketManager {
    pub fn new(app_in_memory_config: Arc<RwLock<AppInMemoryConfig>>) -> Self {
        let (sender_channel, receiver_channel) = mpsc::channel::<String>(100);
        WebsocketManager {
            app_in_memory_config,
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
        let message_content_result = serde_json::from_str::<WebsocketMessage>(value)
            .inspect_err(|e| warn!(target:LOG_TARGET,"websocket message is not json"))?;
        log::trace!("websocket message sent {:?}", message_content_result);
        self.sender_channel.send(value.into()).await?;
        Result::Ok(())
    }

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
                        let connection_res = WebsocketManager::connect_to_url(&config_cloned).await.inspect_err(|e|{
                            error!(target:LOG_TARGET,"failed to connect to websocket due to {}",e.to_string())});
                        if let Ok(connection) = connection_res {
                            _= WebsocketManager::listen(connection,app_cloned.clone(),
                            cancellation.clone(),
                            message_cache.clone(),
                            receiver_channel.clone()).await
                            .inspect_err(|e|{error!(target:LOG_TARGET,"Websocket: event handler error:{}",e.to_string())});
                        }
                        info!(target:LOG_TARGET,"------------------Go to sleeep");
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

    pub async fn listen(
        connection_stream: WebSocketStream<MaybeTlsStream<TcpStream>>,
        app: AppHandle,
        connection_cancellation_token: CancellationToken,
        message_cache: Arc<RwLock<HashMap<String, HashSet<WebsocketStoredMessage>>>>,
        receiver_channel: Arc<RwLock<tokio::sync::mpsc::Receiver<String>>>,
    ) -> Result<(), WebsocketError> {
        let (write_stream, read_stream) = connection_stream.split();
        info!(target:LOG_TARGET,"listening to websocket events");

        let tracker = TaskTracker::new();
        let task_cancellation = CancellationToken::new();
        let task_cancellation_cloned = task_cancellation.clone();
        let task_cancellation_cloned2 = task_cancellation.clone();

        //receiver
        tracker.spawn(async move {
            tokio::select! {
                _=receiver_task(app, message_cache, read_stream, task_cancellation_cloned.clone())=>{
                    ()
                },
                _=task_cancellation_cloned.cancelled()=>{
                    info!(target:LOG_TARGET,"cancelling receiver task");
                    ()
                }
            }
        });

        //sender
        tracker.spawn(async move {
            tokio::select! {
                _=sender_task(receiver_channel, write_stream, task_cancellation_cloned2.clone())=>{
                    ()
                },
                _=task_cancellation_cloned2.cancelled()=>{
                    info!(target:LOG_TARGET,"cancelling sender task");
                    ()
                }
            }
        });

        tokio::select! {
            _=tracker.wait()=>{
                info!(target:LOG_TARGET,"both ws tasks cancelled");
            },
            _=task_cancellation.cancelled()=>{
                tracker.close();
            },
            _=connection_cancellation_token.cancelled()=>{
                task_cancellation.cancel();
                tracker.close();
            }
        }
        info!(target:LOG_TARGET, "exiting listen function");

        Result::Ok(())
    }
}

async fn sender_task(
    receiver_channel: Arc<RwLock<mpsc::Receiver<String>>>,
    mut write_stream: futures::stream::SplitSink<
        WebSocketStream<MaybeTlsStream<TcpStream>>,
        Message,
    >,
    task_cancellation: CancellationToken,
) -> () {
    info!(target:LOG_TARGET,"websocket_manager: tx loop initialized...");
    // loop {
    let mut receiver_channel_guard = receiver_channel.write().await;
    while let Some(msg) = receiver_channel_guard.recv().await {
        if let Err(e) = write_stream
            .send(Message::Text(Utf8Bytes::from(msg.clone())))
            .await
        {
            error!(target:LOG_TARGET,"Failed to send websocket message: {}", e);
            task_cancellation.cancel();
        }
        info!(target:LOG_TARGET,"websocket event sent to airdrop {}", msg);
    }
    info!(target:LOG_TARGET, "exiting sender task");
    // }
}

async fn receiver_task(
    app: AppHandle,
    message_cache: Arc<RwLock<HashMap<String, HashSet<WebsocketStoredMessage>>>>,
    mut read_stream: futures::stream::SplitStream<WebSocketStream<MaybeTlsStream<TcpStream>>>,
    task_cancellation: CancellationToken,
) -> () {
    info!(target:LOG_TARGET,"websocket_manager: rx loop initialized...");
    // loop {
    while let Some(Ok(msg)) = read_stream.next().await {
        match msg {
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
                info!(target:LOG_TARGET, "webSocket closed.");
                task_cancellation.clone().cancel();
                break;
            }
            _ => {
                error!(target: LOG_TARGET,"Not supported message type.");
            }
        }
    }
    info!(target:LOG_TARGET, "exiting receiver task");

    // }
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

// async fn send_mining_status(
//     websocket_manager: WebsocketManager,
//     cpu_miner_status_watch_rx: watch::Receiver<CpuMinerStatus>,
//     gpu_latest_miner_stats: watch::Receiver<GpuMinerStatus>,
//     node_latest_status: watch::Receiver<BaseNodeStatus>,
//     app_version: String,
//     network: String,
//     app_id: String,
//     jwt: String,
// ) -> Message {
//     let BaseNodeStatus { block_height, .. } = node_latest_status.borrow().clone();

//     let cpu_miner_status = cpu_miner_status_watch_rx.borrow().clone();
//     let gpu_status = gpu_latest_miner_stats.borrow().clone();

//     let gpu_hardware_parameters = HardwareStatusMonitor::current()
//         .get_gpu_public_properties()
//         .await
//         .ok();
//     let cpu_hardware_parameters = HardwareStatusMonitor::current()
//         .get_cpu_public_properties()
//         .await
//         .ok();

//     let is_mining_active = cpu_miner_status.hash_rate > 0.0 || gpu_status.hash_rate > 0.0;

//     let claims = decode_jwt_claims_without_exp(&jwt).;
//     claims.id
//     //const transformedPayload = `${payload.userId},${payload.isMining},${payload.blockHeight}`;
//     let signature = sign_ws_data(format!(
//         "{},{},{},{},{},{},{}",
//         app_version, network, app_id,
//     ));
//     let payload = serde_json::json!({
//         "is_mining":is_mining_active,

//     });
//     return Message::Text(Utf8Bytes::from(payload.clone()));
// }
