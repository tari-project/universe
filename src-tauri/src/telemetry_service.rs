use std::{sync::Arc, time::SystemTime};

use log::{debug, error, warn};
use serde::Serialize;
use serde_json::Value;
use tokio::sync::{
    mpsc::{self, Sender},
    RwLock,
};
use tokio_util::sync::CancellationToken;

use crate::{
    app_config::AppConfig, app_in_memory_config::AppInMemoryConfig,
    process_utils::retry_with_backoff,
};

const LOG_TARGET: &str = "tari::universe::telemetry_service";

#[derive(Debug, Serialize, Clone)]
pub struct TelemetryData {
    event_name: String,
    event_value: Value,
}

#[derive(Debug, Serialize)]
pub struct FullTelemetryData {
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
    tx_channel: Option<Sender<TelemetryData>>,
    cancellation_token: CancellationToken,
    config: Arc<RwLock<AppConfig>>,
    in_memory_config: Arc<RwLock<AppInMemoryConfig>>,
}

impl TelemetryService {
    pub fn new(
        app_id: String,
        version: String,
        config: Arc<RwLock<AppConfig>>,
        in_memory_config: Arc<RwLock<AppInMemoryConfig>>,
    ) -> Self {
        let cancellation_token = CancellationToken::new();
        TelemetryService {
            app_id,
            version,
            tx_channel: None,
            cancellation_token,
            config,
            in_memory_config,
        }
    }
    pub async fn init(&mut self, app_version: String) -> Result<(), TelemetryServiceError> {
        self.version = app_version;
        let cancellation_token = self.cancellation_token.clone();
        let config_cloned = self.config.clone();
        let in_memory_config_cloned = self.in_memory_config.clone();
        let telemetry_api_url = in_memory_config_cloned
            .read()
            .await
            .telemetry_api_url
            .clone();
        let app_id = self.app_id.clone();
        let version = self.version.clone();
        let (tx, mut rx) = mpsc::channel(128);
        self.tx_channel = Some(tx);
        tokio::spawn(async move {
            tokio::select! {
                _ = async {
                    debug!(target: LOG_TARGET, "TelemetryService::init has  been started");
                    while let Some(telemetry_data) = rx.recv().await {
                        let telemetry_collection_enabled = config_cloned.read().await.allow_telemetry();
                        if telemetry_collection_enabled {
                            drop(retry_with_backoff(
                                || {
                                    Box::pin(send_telemetry_data(
                                        telemetry_data.clone(),
                                        telemetry_api_url.clone(),
                                        app_id.clone(),
                                        version.clone(),
                                    ))
                                },
                                3,
                                2,
                                "send_telemetry_data",
                            )
                            .await);
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

    pub async fn send(
        &self,
        event_name: String,
        event_value: Value,
    ) -> Result<(), TelemetryServiceError> {
        let data = TelemetryData {
            event_name,
            event_value,
        };
        if let Some(tx) = &self.tx_channel {
            if let Err(_) = tx.send(data).await {
                warn!(target: LOG_TARGET,"TelemetryService::send_telemetry_data Telemetry data sending failed");
                return Err(TelemetryServiceError::Other(anyhow::anyhow!(
                    "Telemetry data sending failed"
                )));
            }
            Ok(())
        } else {
            warn!(target: LOG_TARGET,"TelemetryService::send_telemetry_data Telemetry data sending failed - Service is not initialized");
            Err(TelemetryServiceError::Other(anyhow::anyhow!(
                "Telemetry data sending failed - Service is not initialized"
            )))
        }
    }
}

async fn send_telemetry_data(
    data: TelemetryData,
    api_url: String,
    app_id: String,
    version: String,
) -> Result<(), TelemetryServiceError> {
    let request = reqwest::Client::new();
    let full_data = FullTelemetryData {
        event_name: data.event_name,
        event_value: data.event_value,
        created_at: SystemTime::now(),
        user_id: None,
        app_id,
        version,
    };
    let request_builder = request
        .post(api_url)
        .header(
            "User-Agent".to_string(),
            format!("tari-universe/{}", full_data.version.clone()),
        )
        .json(&full_data);

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
