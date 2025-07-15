// Copyright 2025. The Tari Project
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

use axum::async_trait;

use log::{info, warn};
use std::{path::PathBuf, time::Duration};
use tari_common_types::tari_address::TariAddress;
use tari_shutdown::Shutdown;
use tokio::sync::watch::Sender;

use crate::{
    gpu_miner_sha_websocket::GpuMinerShaWebSocket,
    process_adapter::{
        HealthStatus, ProcessAdapter, ProcessInstance, ProcessStartupSpec, StatusMonitor,
    },
    GpuMinerStatus,
};

const LOG_TARGET: &str = "tari::universe::gpu_miner_sha_adapter";

#[derive(Clone)]
pub struct GpuMinerShaAdapter {
    pub tari_address: Option<TariAddress>,
    pub intensity: Option<u32>,
    pub batch_size: Option<u32>,
    pub worker_name: Option<String>,
    pub pool_url: Option<String>,
    pub(crate) gpu_status_sender: Sender<GpuMinerStatus>,
}

impl GpuMinerShaAdapter {
    pub fn new(gpu_status_sender: Sender<GpuMinerStatus>) -> Self {
        Self {
            tari_address: None,
            batch_size: None,
            intensity: None,
            worker_name: None,
            gpu_status_sender,
            pool_url: None,
        }
    }
}

impl ProcessAdapter for GpuMinerShaAdapter {
    type StatusMonitor = GpuMinerShaStatusMonitor;
    type ProcessInstance = ProcessInstance;

    fn spawn_inner(
        &self,
        base_folder: PathBuf,
        _config_folder: PathBuf,
        _log_folder: PathBuf,
        binary_version_path: PathBuf,
        _is_first_start: bool,
    ) -> Result<(Self::ProcessInstance, Self::StatusMonitor), anyhow::Error> {
        let inner_shutdown = Shutdown::new();

        let mut args: Vec<String> = vec![];

        args.push("--algo".to_string());
        args.push("sha3x".to_string());
        args.push("--web".to_string());

        if let Some(pool_url) = &self.pool_url {
            args.push("--pool".to_string());
            args.push(pool_url.clone());
        }

        if let Some(tari_address) = &self.tari_address {
            args.push("--wallet".to_string());
            args.push(tari_address.to_base58());
        } else {
            return Err(anyhow::anyhow!(
                "Tari address must be set before starting the GpuMinerShaAdapter"
            ));
        }

        if let Some(intensity) = self.intensity {
            args.push("--gpu-intensity".to_string());
            args.push(intensity.to_string());
        }

        if let Some(batch_size) = self.batch_size {
            args.push("--gpu-batch-size".to_string());
            args.push(batch_size.to_string());
        }

        if let Some(worker_name) = &self.worker_name {
            args.push("--worker".to_string());
            args.push(worker_name.clone());
        }

        Ok((
            ProcessInstance {
                shutdown: inner_shutdown,
                startup_spec: ProcessStartupSpec {
                    file_path: binary_version_path,
                    envs: None,
                    args,
                    data_dir: base_folder,
                    pid_file_name: self.pid_file_name().to_string(),
                    name: self.name().to_string(),
                },
                handle: None,
            },
            GpuMinerShaStatusMonitor {
                gpu_status_sender: self.gpu_status_sender.clone(),
                websocket_listener: GpuMinerShaWebSocket::new(),
            },
        ))
    }

    fn name(&self) -> &str {
        "GpuMinerShaAdapter"
    }

    fn pid_file_name(&self) -> &str {
        "gpu_miner_sha.pid"
    }
}

#[derive(Clone)]
pub struct GpuMinerShaStatusMonitor {
    gpu_status_sender: Sender<GpuMinerStatus>,
    websocket_listener: GpuMinerShaWebSocket,
}

#[async_trait]
impl StatusMonitor for GpuMinerShaStatusMonitor {
    async fn check_health(&self, uptime: Duration, timeout_duration: Duration) -> HealthStatus {
        info!(target: LOG_TARGET, "Checking health of ShaMiner");
        let status = match tokio::time::timeout(timeout_duration, self.status()).await {
            Ok(inner) => inner,
            Err(_) => {
                warn!(target: LOG_TARGET, "Timeout error in ShaMiner check_health");
                return HealthStatus::Warning;
            }
        };

        match status {
            Ok(status) => {
                info!(target: LOG_TARGET, "ShaMiner status: {status:?}");
                let _ = self.gpu_status_sender.send(status.clone());
                if status.hash_rate > 0.0 || uptime.as_secs() < 11 {
                    HealthStatus::Healthy
                } else {
                    HealthStatus::Warning
                }
            }
            Err(_) => HealthStatus::Unhealthy,
        }
    }
}

impl GpuMinerShaStatusMonitor {
    pub async fn status(&self) -> Result<GpuMinerStatus, anyhow::Error> {
        self.websocket_listener.clone().connect().await;
        let last_status = self.websocket_listener.get_last_message().await;

        if let Some(status) = last_status {
            return Ok(GpuMinerStatus {
                is_mining: true,
                estimated_earnings: 0,
                hash_rate: status.current_hashrate as f64,
            });
        }

        Ok(GpuMinerStatus {
            is_mining: false,
            estimated_earnings: 0,
            hash_rate: 0.0,
        })
    }
}
