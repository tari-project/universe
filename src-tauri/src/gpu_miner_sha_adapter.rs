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
use std::{
    path::PathBuf,
    sync::atomic::{AtomicBool, Ordering},
    time::Duration,
};
use tari_common_types::tari_address::TariAddress;
use tari_shutdown::Shutdown;
use tokio::sync::watch::Sender;

use crate::port_allocator::PortAllocator;
#[cfg(target_os = "windows")]
use crate::utils::windows_setup_utils::add_firewall_rule;
use crate::{
    gpu_miner_sha_websocket::GpuMinerShaWebSocket,
    process_adapter::{
        HandleUnhealthyResult, HealthStatus, ProcessAdapter, ProcessInstance, ProcessStartupSpec,
        StatusMonitor,
    },
    setup::setup_manager::SetupManager,
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
        log_folder: PathBuf,
        binary_version_path: PathBuf,
        _is_first_start: bool,
    ) -> Result<(Self::ProcessInstance, Self::StatusMonitor), anyhow::Error> {
        let inner_shutdown = Shutdown::new();
        let ws_port = PortAllocator::new().assign_port_with_fallback();

        let mut args: Vec<String> = vec![
            "--algo".to_string(),
            "sha3x".to_string(),
            // --web is needed for the web socket to be open
            "--ws".to_string(),
            ws_port.to_string(),
            "--gpu".to_string(),
        ];

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

        args.push("--log-dir".to_string());
        args.push(log_folder.to_string_lossy().to_string());

        #[cfg(target_os = "windows")]
        add_firewall_rule("graxil.exe".to_string(), binary_version_path.clone())?;

        Ok((
            ProcessInstance {
                shutdown: inner_shutdown.clone(),
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
                websocket_listener: GpuMinerShaWebSocket::new(ws_port),
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

// This is a flag to indicate if the fallback to solo mining has been triggered
// We want to avoid triggering it multiple times per session
static WAS_FALLBACK_TO_SOLO_MINING_TRIGGERED: AtomicBool = AtomicBool::new(false);

#[derive(Clone)]
pub struct GpuMinerShaStatusMonitor {
    gpu_status_sender: Sender<GpuMinerStatus>,
    websocket_listener: GpuMinerShaWebSocket,
}

#[async_trait]
impl StatusMonitor for GpuMinerShaStatusMonitor {
    async fn handle_unhealthy(
        &self,
        duration_since_last_healthy_status: Duration,
    ) -> Result<HandleUnhealthyResult, anyhow::Error> {
        // Fallback to solo mining if the miner has been unhealthy for more than 30 minutes
        info!(target: LOG_TARGET, "Handling unhealthy status for GpuMinerShaAdapter | Duration since last healthy status: {:?}", duration_since_last_healthy_status.as_secs());
        if duration_since_last_healthy_status.as_secs().gt(&(60 * 30))
            && !WAS_FALLBACK_TO_SOLO_MINING_TRIGGERED.load(Ordering::SeqCst)
        {
            match SetupManager::get_instance()
                .turn_off_gpu_pool_feature()
                .await
            {
                Ok(_) => {
                    info!(target: LOG_TARGET, "GpuMinerShaAdapter: GPU Pool feature turned off due to prolonged unhealthiness.");
                    WAS_FALLBACK_TO_SOLO_MINING_TRIGGERED.store(true, Ordering::SeqCst);
                    return Ok(HandleUnhealthyResult::Stop);
                }
                Err(error) => {
                    warn!(target: LOG_TARGET, "GpuMinerShaAdapter: Failed to turn off GPU Pool feature: {error} | Continuing to monitor.");
                    return Ok(HandleUnhealthyResult::Continue);
                }
            }
        } else {
            return Ok(HandleUnhealthyResult::Continue);
        }
    }

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
