use std::sync::Arc;
use std::time::Duration;

use anyhow::Ok;
use log::info;
use tokio::net::TcpStream;
use tokio::sync::RwLock;
use tokio::time::sleep;
use tokio_tungstenite::connect_async;
use tokio_tungstenite::MaybeTlsStream;
use tokio_tungstenite::WebSocketStream;
use tokio_util::sync::CancellationToken;

use crate::app_in_memory_config::AppInMemoryConfig;
const LOG_TARGET: &str = "tari::universe::websocket";

#[derive(Debug, thiserror::Error)]
pub enum WebsocketError {
    #[error("Other error: {0}")]
    Other(#[from] anyhow::Error),

    #[error("Websocket error: {0}")]
    WebsocketError(#[from] tungstenite::Error),
}

pub struct Websocket {
    app_in_memory_config: Arc<RwLock<AppInMemoryConfig>>,
    ws_stream: Arc<RwLock<Option<WebSocketStream<MaybeTlsStream<TcpStream>>>>>,
    cancellation_token: CancellationToken,
}

impl Websocket {
    pub fn new(
        app_in_memory_config: Arc<RwLock<AppInMemoryConfig>>,
        cancellation_token: CancellationToken,
    ) -> Self {
        Websocket {
            app_in_memory_config,
            ws_stream: Arc::new(RwLock::new(None)),
            cancellation_token,
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
                                Websocket::handle_ws_events(stream_cloned.clone()).await?;
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
        stream: Arc<RwLock<Option<WebSocketStream<MaybeTlsStream<TcpStream>>>>>,
    ) -> Result<(), anyhow::Error> {
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
        Ok(())
    }
}
