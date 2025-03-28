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

use crate::app_config::GpuThreads;
use crate::gpu_miner::EngineType;
use crate::gpu_status_file::GpuDevice;
use crate::port_allocator::PortAllocator;
use crate::process_adapter::HealthStatus;
use crate::process_adapter::ProcessStartupSpec;
use anyhow::anyhow;
use anyhow::Error;
use async_trait::async_trait;
use log::{info, warn};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::PathBuf;
use std::time::Instant;
use tari_common::configuration::Network;
use tari_common_types::tari_address::TariAddress;
use tari_shutdown::Shutdown;
use tokio::sync::watch;

#[cfg(target_os = "windows")]
use crate::utils::windows_setup_utils::add_firewall_rule;

use crate::{
    app_config::MiningMode,
    process_adapter::{ProcessAdapter, ProcessInstance, StatusMonitor},
};

const LOG_TARGET: &str = "tari::universe::gpu_miner_adapter";

pub enum GpuNodeSource {
    BaseNode { port: u16 },
    P2Pool { port: u16 },
}

pub(crate) struct GpuMinerAdapter {
    pub(crate) tari_address: TariAddress,
    // Value ranges 1 - 1000
    pub(crate) gpu_grid_size: Vec<GpuThreads>,
    pub(crate) node_source: Option<GpuNodeSource>,
    pub(crate) coinbase_extra: String,
    pub(crate) gpu_devices: Vec<GpuDevice>,
    pub(crate) gpu_raw_status_broadcast: watch::Sender<Option<GpuMinerStatus>>,
    pub(crate) curent_selected_engine: EngineType,
}

impl GpuMinerAdapter {
    pub fn new(
        gpu_devices: Vec<GpuDevice>,
        gpu_raw_status_broadcast: watch::Sender<Option<GpuMinerStatus>>,
    ) -> Self {
        Self {
            tari_address: TariAddress::default(),
            gpu_grid_size: gpu_devices
                .iter()
                .map(|gpu_device| GpuThreads {
                    gpu_name: gpu_device.device_name.clone(),
                    max_gpu_threads: gpu_device.status.max_grid_size,
                })
                .collect(),
            node_source: None,
            coinbase_extra: "tari-universe".to_string(),
            gpu_devices,
            gpu_raw_status_broadcast,
            curent_selected_engine: EngineType::OpenCL,
        }
    }

    pub fn set_mode(&mut self, mode: MiningMode, custom_max_gpus_grid_size: Vec<GpuThreads>) {
        match mode {
            MiningMode::Eco => {
                self.gpu_grid_size = self
                    .gpu_devices
                    .iter()
                    .map(|gpu_device| GpuThreads {
                        gpu_name: gpu_device.device_name.clone(),
                        max_gpu_threads: 2,
                    })
                    .collect()
            }
            MiningMode::Ludicrous => {
                self.gpu_grid_size = self
                    .gpu_devices
                    .iter()
                    .map(|gpu_device| GpuThreads {
                        gpu_name: gpu_device.device_name.clone(),
                        max_gpu_threads: 1024,
                    })
                    .collect()
            }
            MiningMode::Custom => self.gpu_grid_size = custom_max_gpus_grid_size,
        }
    }
}

impl ProcessAdapter for GpuMinerAdapter {
    type StatusMonitor = GpuMinerStatusMonitor;

    #[allow(clippy::too_many_lines)]
    fn spawn_inner(
        &self,
        data_dir: PathBuf,
        config_dir: PathBuf,
        log_dir: PathBuf,
        binary_version_path: PathBuf,
    ) -> Result<(ProcessInstance, Self::StatusMonitor), Error> {
        info!(target: LOG_TARGET, "Gpu miner spawn inner");
        let inner_shutdown = Shutdown::new();

        let http_api_port = PortAllocator::new().assign_port_with_fallback();
        let working_dir = data_dir.join("gpuminer");
        std::fs::create_dir_all(&working_dir)?;
        std::fs::create_dir_all(config_dir.join("gpuminer"))?;

        if self.node_source.is_none() {
            return Err(anyhow!("GpuMinerAdapter node_source is not set"));
        }

        let tari_node_port = match self.node_source.as_ref() {
            Some(GpuNodeSource::BaseNode { port }) => port,
            Some(GpuNodeSource::P2Pool { port }) => port,
            None => {
                return Err(anyhow!("GpuMinerAdapter node_source is not set"));
            }
        };

        let gpu_engine_statuses = config_dir
            .join("gpuminer")
            .join("engine_statuses")
            .clone()
            .to_string_lossy()
            .to_string();

        let grid_size = self
            .gpu_grid_size
            .iter()
            .map(|x| x.max_gpu_threads.clone().to_string())
            .collect::<Vec<_>>()
            .join(",");

        let mut args: Vec<String> = vec![
            "--tari-address".to_string(),
            self.tari_address.to_base58(),
            "--tari-node-url".to_string(),
            format!("http://127.0.0.1:{}", tari_node_port),
            "--config".to_string(),
            config_dir
                .join("gpuminer")
                .join("config.json")
                .to_string_lossy()
                .to_string(),
            "--http-server-port".to_string(),
            http_api_port.to_string(),
            "--grid-size".to_string(),
            grid_size.clone(),
            "--log-config-file".to_string(),
            config_dir
                .join("gpuminer")
                .join("log4rs_config.yml")
                .to_string_lossy()
                .to_string(),
            "--gpu-status-file".to_string(),
            gpu_engine_statuses.clone(),
            "--log-dir".to_string(),
            log_dir.to_string_lossy().to_string(),
            "--template-timeout-secs".to_string(),
            "1".to_string(),
            "--engine".to_string(),
            self.curent_selected_engine.to_string(),
        ];

        // Only available after 0.1.8-pre.2
        args.push("--coinbase-extra".to_string());
        args.push(self.coinbase_extra.clone());

        if matches!(
            self.node_source.as_ref(),
            Some(GpuNodeSource::P2Pool { .. })
        ) {
            args.push("--p2pool-enabled".to_string());
        }

        info!(target: LOG_TARGET, "Run Gpu miner with args: {:?}", args.join(" "));
        let mut envs = std::collections::HashMap::new();
        match Network::get_current_or_user_setting_or_default() {
            Network::Esmeralda => {
                envs.insert("TARI_NETWORK".to_string(), "esme".to_string());
            }
            Network::NextNet => {
                envs.insert("TARI_NETWORK".to_string(), "nextnet".to_string());
            }
            _ => {
                return Err(anyhow!("Unsupported network"));
            }
        }

        #[cfg(target_os = "windows")]
        add_firewall_rule("glytex.exe".to_string(), binary_version_path.clone())?;

        Ok((
            ProcessInstance::new(
                inner_shutdown,
                ProcessStartupSpec {
                    file_path: binary_version_path,
                    envs: Some(envs),
                    args,
                    data_dir,
                    pid_file_name: self.pid_file_name().to_string(),
                    name: self.name().to_string(),
                },
            ),
            GpuMinerStatusMonitor {
                http_api_port,
                start_time: Instant::now(),
                gpu_raw_status_broadcast: self.gpu_raw_status_broadcast.clone(),
            },
        ))
    }

    fn name(&self) -> &str {
        "glytex"
    }

    fn pid_file_name(&self) -> &str {
        "glytex_pid"
    }
}

#[derive(Clone)]
pub struct GpuMinerStatusMonitor {
    http_api_port: u16,
    start_time: Instant,
    gpu_raw_status_broadcast: watch::Sender<Option<GpuMinerStatus>>,
}

#[async_trait]
impl StatusMonitor for GpuMinerStatusMonitor {
    async fn check_health(&self) -> HealthStatus {
        if let Ok(status) = self.status().await {
            let _result = self.gpu_raw_status_broadcast.send(Some(status.clone()));
            // GPU returns 0 for first 10 seconds until it has an average
            if status.hash_rate > 0.0 || self.start_time.elapsed().as_secs() < 11 {
                HealthStatus::Healthy
            } else {
                HealthStatus::Warning
            }
        } else {
            let _result = self.gpu_raw_status_broadcast.send(None);
            HealthStatus::Unhealthy
        }
    }
}

impl GpuMinerStatusMonitor {
    #[allow(clippy::cast_possible_truncation)]
    pub async fn status(&self) -> Result<GpuMinerStatus, anyhow::Error> {
        let client = reqwest::Client::new();
        let response = match client
            .get(format!("http://127.0.0.1:{}/stats", self.http_api_port))
            .send()
            .await
        {
            Ok(response) => response,
            Err(e) => {
                warn!(target: LOG_TARGET, "Error in getting response from XtrGpuMiner status: {}", e);
                if e.is_connect() {
                    return Ok(GpuMinerStatus {
                        is_mining: false,
                        hash_rate: 0.0,
                        estimated_earnings: 0,
                    });
                }
                return Ok(GpuMinerStatus {
                    is_mining: false,
                    hash_rate: 0.0,
                    estimated_earnings: 0,
                });
            }
        };
        let text = response.text().await?;
        let body: XtrGpuminerHttpApiStatus = match serde_json::from_str(&text) {
            Ok(body) => body,
            Err(e) => {
                warn!(target: LOG_TARGET, "Error decoding body from  in XtrGpuMiner status: {}", e);
                return Ok(GpuMinerStatus {
                    is_mining: false,
                    hash_rate: 0.0,
                    estimated_earnings: 0,
                });
            }
        };

        Ok(GpuMinerStatus {
            is_mining: true,
            estimated_earnings: 0,
            hash_rate: body.total_hashrate.ten_seconds.unwrap_or(0.0),
        })
    }
}

#[derive(Debug, Deserialize)]
#[allow(dead_code)]
struct XtrGpuminerHttpApiStatus {
    #[allow(dead_code)]
    hashrate_per_device: HashMap<u32, AverageHashrate>,
    total_hashrate: AverageHashrate,
}

#[derive(Debug, Clone, Deserialize)]
#[allow(dead_code)]
pub(crate) struct AverageHashrate {
    ten_seconds: Option<f64>,
    one_minute: Option<f64>,
}

#[derive(Debug, Serialize, Clone, Default)]
pub(crate) struct GpuMinerStatus {
    pub is_mining: bool,
    pub hash_rate: f64,
    pub estimated_earnings: u64,
}
