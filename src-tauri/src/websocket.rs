use std::sync::Arc;

use log::debug;
use tokio::net::TcpStream;
use tokio::sync::RwLock;
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
    ws_stream: Option<WebSocketStream<MaybeTlsStream<TcpStream>>>,
    pub cancellation_token: CancellationToken,
}

impl Websocket {
    pub fn new(
        app_in_memory_config: Arc<RwLock<AppInMemoryConfig>>,
        cancellation_token: CancellationToken,
    ) -> Self {
        Websocket {
            app_in_memory_config,
            ws_stream: None,
            cancellation_token,
        }
    }

    pub async fn connect(&self) -> Result<(), WebsocketError> {
        let in_memory_config = &self.app_in_memory_config;
        let config_cloned = in_memory_config.clone();
        let cancellation = self.cancellation_token.clone();
        tokio::spawn(async move {
            tokio::select! {
                _ = async {
                        let config_read = config_cloned.read().await;
                        let (_ws_stream,_) = connect_async(config_read.websocket_url).await?;
                        println!("WebSocket handshake has been successfully completed");
                        Ok::<(),WebsocketError>(())
                }=>{ Ok::<(),WebsocketError>(())},
                _ = cancellation.cancelled() => {
                    debug!(target: LOG_TARGET,"TelemetryManager::start_telemetry_process has been cancelled");
                    Ok::<(),WebsocketError>(())
                }
            };
        });
        Ok(())
    }
}
