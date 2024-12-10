use std::{
    sync::Arc,
    time::{Duration, SystemTime},
};

use log::{debug, warn};
use serde::Serialize;
use serde_json::Value;
use tokio::sync::{
    mpsc::{self, Sender},
    RwLock,
};
use tokio_util::sync::CancellationToken;

use crate::{app_config::AppConfig, app_in_memory_config::AppInMemoryConfig};

const LOG_TARGET: &str = "tari::universe::telemetry_service";

#[derive(Debug, Serialize)]
pub struct TelemetryData {
    event_name: String,
    event_value: Value,
    created_at: SystemTime,
    user_id: Option<String>,
    app_id: String,
    version: String,
}

#[derive(Debug, thiserror::Error)]
pub enum TelemetryServiceError {
    #[error("Other error: {0}")]
    Other(#[from] anyhow::Error),

    #[error("Reqwest error: {0}")]
    ReqwestError(#[from] reqwest::Error),
}

pub struct TelemetryService {
    app_id: String,
    version: String,
    frequency: Duration,
    tx_channel: Option<Sender<TelemetryData>>,
    cancellation_token: CancellationToken,
    config: Arc<RwLock<AppConfig>>,
    in_memory_config: Arc<RwLock<AppInMemoryConfig>>,
}

impl TelemetryService {
    pub fn new(
        app_id: String,
        version: String,
        frequency: Duration,
        config: Arc<RwLock<AppConfig>>,
        in_memory_config: Arc<RwLock<AppInMemoryConfig>>,
    ) -> Self {
        let cancellation_token = CancellationToken::new();
        TelemetryService {
            app_id,
            version,
            frequency,
            tx_channel: None,
            cancellation_token,
            config,
            in_memory_config,
        }
    }
    pub async fn init(&mut self) -> Result<(), TelemetryServiceError> {
        let cancellation_token = self.cancellation_token.clone();
        let config_cloned = self.config.clone();
        let in_memory_config_cloned = self.in_memory_config.clone();
        let telemetry_api_url = in_memory_config_cloned
            .read()
            .await
            .telemetry_api_url
            .clone();
        let (tx, mut rx) = mpsc::channel(128);
        self.tx_channel = Some(tx);
        tokio::spawn(async move {
            tokio::select! {
                _ = async {
                    debug!(target: LOG_TARGET, "TelemetryService::init has  been started");
                    while let Some(telemetry_data) = rx.recv().await {
                        let telemetry_collection_enabled = config_cloned.read().await.allow_telemetry();
                        if telemetry_collection_enabled {
                            drop(send_telemetry_data(telemetry_data, telemetry_api_url.clone()).await);
                        }
                    }
                } => {},
                _ = cancellation_token.cancelled() => {
                    debug!(target: LOG_TARGET,"TelemetryService::init has been cancelled");
                }
            }
        });
        Ok(())
    }
}

async fn send_telemetry_data(
    data: TelemetryData,
    api_url: String,
) -> Result<(), TelemetryServiceError> {
    let request = reqwest::Client::new();
    let request_builder = request
        .post(api_url)
        .header(
            "User-Agent".to_string(),
            format!("tari-universe/{}", data.version.clone()),
        )
        .json(&data);

    let response = request_builder.send().await?;

    if response.status() == 429 {
        warn!(target: LOG_TARGET,"TelemetryService::send_telemetry_data Telemetry data rate limited by http {:?}", response.status());
        return Ok(());
    }

    if response.status() != 200 {
        let status = response.status();
        let response = response.text().await?;
        let response_as_json: Result<Value, serde_json::Error> = serde_json::from_str(&response);
        return Err(anyhow::anyhow!(
            "Telemetry data sending error. Status {:?} response text: {:?}",
            status.to_string(),
            response_as_json.unwrap_or(response.into()),
        )
        .into());
    }

    debug!(target: LOG_TARGET,"TelemetryService::send_telemetry_data Telemetry data sent");

    Ok(())
}
