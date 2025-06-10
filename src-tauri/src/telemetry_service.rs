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

use log::{debug, error, info, warn};
use serde::Serialize;
use serde_json::Value;
use std::{sync::Arc, time::SystemTime};
use tokio::sync::{
    mpsc::{self, Sender},
    RwLock,
};
use tokio_util::sync::CancellationToken;

use crate::{
    app_in_memory_config::DynamicMemoryConfig,
    configs::{config_core::ConfigCore, trait_config::ConfigImpl},
    hardware::hardware_status_monitor::HardwareStatusMonitor,
    process_utils::retry_with_backoff,
    tasks_tracker::TasksTrackers,
    utils::platform_utils::{CurrentOperatingSystem, PlatformUtils},
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
    user_id: String,
    app_id: String,
    version: String,
    os: String,
    cpu_name: String,
    gpu_name: String,
    exchange_id: String,
}

#[derive(Debug, thiserror::Error)]
pub enum TelemetryServiceError {
    #[error("Other error: {0}")]
    Other(#[from] anyhow::Error),

    #[error("Reqwest error: {0}")]
    ReqwestError(#[from] reqwest::Error),
}

pub struct TelemetryService {
    version: String,
    tx_channel: Option<Sender<TelemetryData>>,
    cancellation_token: CancellationToken,
    in_memory_config: Arc<RwLock<DynamicMemoryConfig>>,
}

impl TelemetryService {
    pub fn new(in_memory_config: Arc<RwLock<DynamicMemoryConfig>>) -> Self {
        let cancellation_token = CancellationToken::new();
        TelemetryService {
            version: "0.0.0".to_string(),
            tx_channel: None,
            cancellation_token,
            in_memory_config,
        }
    }
    pub async fn init(
        &mut self,
        app_version: String,
        user: String,
    ) -> Result<(), TelemetryServiceError> {
        let os = PlatformUtils::detect_current_os();
        let mut shutdown_signal = TasksTrackers::current().common.get_signal().await;

        self.version = app_version;
        let cancellation_token = self.cancellation_token.clone();
        let in_memory_config_cloned = self.in_memory_config.clone();
        let in_memory_config_guard = in_memory_config_cloned.read().await;
        let telemetry_api_url = in_memory_config_guard.telemetry_api_url.clone();
        let in_memory_config_cloned_2 = self.in_memory_config.clone();
        let version = self.version.clone();
        let (tx, mut rx) = mpsc::channel(128);
        self.tx_channel = Some(tx);
        TasksTrackers::current()
            .common
            .get_task_tracker()
            .await
            .spawn(async move {
                let system_info = SystemInfo {
                    version,
                    user_id: user,
                    os,
                };
                tokio::select! {
                    _ = async {
                        debug!(target: LOG_TARGET, "TelemetryService::init has  been started");
                        while let Some(telemetry_data) = rx.recv().await {
                                let telemetry_collection_enabled = *ConfigCore::content().await.allow_telemetry();
                                if !telemetry_collection_enabled {
                                info!(target: LOG_TARGET, "TelemetryService::init telemetry collection is disabled");
                            return;
                        }
                        let anon_id = ConfigCore::content().await.anon_id().clone();
                            drop(retry_with_backoff(
                                    || {
                                        Box::pin(send_telemetry_data(
                                            telemetry_data.clone(),
                                            telemetry_api_url.clone(),
                                            system_info.clone(),
                                            anon_id.clone(),
                                            in_memory_config_cloned_2 .clone()
                                        ))
                                    },
                                    3,
                                    2,
                                    "send_telemetry_data",
                                )
                                .await);
                            }
                        } => {}
                        _ = shutdown_signal.wait() => {
                            info!(target: LOG_TARGET,"TelemetryService::init has been cancelled");
                        }
                        _ = cancellation_token.cancelled() => {
                            info!(target: LOG_TARGET,"TelemetryService::init has been cancelled");
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
            if (tx.send(data).await).is_err() {
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

#[derive(Clone)]
struct SystemInfo {
    version: String,
    user_id: String,
    os: CurrentOperatingSystem,
}

async fn send_telemetry_data(
    data: TelemetryData,
    api_url: String,
    system_info: SystemInfo,
    app_id: String,
    memory_config: Arc<RwLock<DynamicMemoryConfig>>,
) -> Result<(), TelemetryServiceError> {
    let config_read_guard = memory_config.read().await;
    let request = reqwest::Client::new();

    let hardware = HardwareStatusMonitor::current();

    let cpu_name = hardware.get_cpu_devices().await?;
    let cpu_name = match cpu_name.first() {
        Some(cpu) => cpu.public_properties.name.clone(),
        None => "Unknown".to_string(),
    };

    let gpu_name = hardware.get_gpu_devices().await?;
    let gpu_name = match gpu_name.first() {
        Some(gpu) => gpu.public_properties.name.clone(),
        None => "Unknown".to_string(),
    };
    let exchange_id = config_read_guard.exchange_id.clone();

    let full_data = FullTelemetryData {
        event_name: data.event_name,
        event_value: data.event_value,
        created_at: SystemTime::now(),
        user_id: system_info.user_id,
        app_id,
        version: system_info.version,
        os: system_info.os.to_string(),
        cpu_name,
        gpu_name,
        exchange_id,
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
