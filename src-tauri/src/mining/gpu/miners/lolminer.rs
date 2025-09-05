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
use std::time::Duration;

use axum::async_trait;
use log::{info, warn};
use serde::Deserialize;
use tari_shutdown::Shutdown;
use tokio::sync::watch::Sender;

use crate::{
    mining::gpu::{
        consts::{GpuConnectionType, GpuMinerStatus},
        interface::{GpuMinerInterfaceTrait, GpuMinerStatusInterface},
    },
    process_adapter::{
        HealthStatus, ProcessAdapter, ProcessInstance, ProcessStartupSpec, StatusMonitor,
    },
};

const LOG_TARGET: &str = "tari::universe::mining::gpu::miners::lolminer";

#[derive(Default)]
pub struct LolMinerGpuMiner {
    pub tari_address: Option<String>,
    pub intensity_percentage: Option<u32>,
    pub worker_name: Option<String>,
    pub connection_type: Option<GpuConnectionType>,
    pub gpu_status_sender: Sender<GpuMinerStatus>,
}

impl LolMinerGpuMiner {
    #[allow(dead_code)]
    pub fn new(gpu_status_sender: Sender<GpuMinerStatus>) -> Self {
        Self {
            tari_address: None,
            intensity_percentage: None,
            worker_name: None,
            connection_type: None,
            gpu_status_sender,
        }
    }
}

impl GpuMinerInterfaceTrait for LolMinerGpuMiner {
    async fn load_tari_address(&mut self, tari_address: &str) -> Result<(), anyhow::Error> {
        self.tari_address = Some(tari_address.to_string());
        Ok(())
    }
    async fn load_worker_name(&mut self, worker_name: &str) -> Result<(), anyhow::Error> {
        self.worker_name = Some(worker_name.to_string());
        Ok(())
    }
    async fn load_intensity_percentage(
        &mut self,
        intensity_percentage: u32,
    ) -> Result<(), anyhow::Error> {
        self.intensity_percentage = Some(intensity_percentage);
        Ok(())
    }
    async fn load_connection_type(
        &mut self,
        connection_type: GpuConnectionType,
    ) -> Result<(), anyhow::Error> {
        self.connection_type = Some(connection_type);
        Ok(())
    }
    async fn detect_devices(&mut self) -> Result<(), anyhow::Error> {
        // lolMiner does not have a device detection feature
        Ok(())
    }
}

impl ProcessAdapter for LolMinerGpuMiner {
    type ProcessInstance = ProcessInstance;
    type StatusMonitor = GpuMinerStatusInterface;

    fn spawn_inner(
        &self,
        base_folder: std::path::PathBuf,
        _config_folder: std::path::PathBuf,
        log_folder: std::path::PathBuf,
        binary_version_path: std::path::PathBuf,
        _is_first_start: bool,
    ) -> Result<(Self::ProcessInstance, Self::StatusMonitor), anyhow::Error> {
        let inner_shutdown = Shutdown::new();
        let api_port = 8080;

        let mut args: Vec<String> = vec![
            // format!("--algo {}", "SHA3X"),
            "--algo".to_string(),
            "SHA3X".to_string(),
            format!("--apiport={}", api_port),
            format!("--apihost={}", "127.0.0.1"),
        ];

        if let Some(connection_type) = &self.connection_type {
            match connection_type {
                GpuConnectionType::Node {
                    node_grpc_address: _,
                } => {
                    return Err(anyhow::anyhow!("Graxil does not support node mining"));
                }
                GpuConnectionType::Pool { pool_url } => {
                    args.push("--pool".to_string());
                    args.push(pool_url.clone());
                }
            }
        } else {
            return Err(anyhow::anyhow!(
                "Connection type must be set before starting the GpuMinerShaAdapter"
            ));
        }

        if let Some(tari_address) = &self.tari_address {
            args.push("--user".to_string());
            args.push(tari_address.clone());
        } else {
            return Err(anyhow::anyhow!(
                "Tari address must be set before starting the GpuMinerShaAdapter"
            ));
        }

        args.push("--logfile".to_string());
        args.push(log_folder.to_string_lossy().to_string());

        #[cfg(target_os = "windows")]
        add_firewall_rule("lolMiner.exe".to_string(), binary_version_path.clone())?;

        info!(
            target: LOG_TARGET,
            "Binary file path: {}",
            binary_version_path.display()
        );

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
            GpuMinerStatusInterface::LolMiner(LolMinerGpuMinerStatusMonitor {
                http_api_port: api_port,
                gpu_status_sender: self.gpu_status_sender.clone(),
            }),
        ))
    }

    fn name(&self) -> &str {
        "lolminer"
    }

    fn pid_file_name(&self) -> &str {
        "lolminer_pid"
    }
}

#[derive(Clone)]
pub struct LolMinerGpuMinerStatusMonitor {
    http_api_port: u16,
    gpu_status_sender: Sender<GpuMinerStatus>,
}

#[async_trait]
impl StatusMonitor for LolMinerGpuMinerStatusMonitor {
    async fn check_health(&self, uptime: Duration, timeout_duration: Duration) -> HealthStatus {
        let status = match tokio::time::timeout(timeout_duration, self.status()).await {
            Ok(inner) => inner,
            Err(_) => {
                warn!(target: LOG_TARGET, "Timeout error in GpuMinerAdapter check_health");
                let _ = self.gpu_status_sender.send(GpuMinerStatus::default());
                return HealthStatus::Warning;
            }
        };

        match status {
            Ok(status) => {
                let _ = self.gpu_status_sender.send(status.clone());
                // GPU returns 0 for first 10 seconds until it has an average
                if status.hash_rate > 0.0 || uptime.as_secs() < 11 {
                    HealthStatus::Healthy
                } else {
                    HealthStatus::Warning
                }
            }
            Err(_) => {
                let _ = self.gpu_status_sender.send(GpuMinerStatus::default());
                HealthStatus::Unhealthy
            }
        }
    }
}

impl LolMinerGpuMinerStatusMonitor {
    #[allow(clippy::cast_possible_truncation)]
    pub async fn status(&self) -> Result<GpuMinerStatus, anyhow::Error> {
        let client = reqwest::Client::new();
        let url = format!("http://127.0.0.1:{}", self.http_api_port);
        let response = match client.get(url).send().await {
            Ok(response) => response,
            Err(e) => {
                warn!(target: LOG_TARGET, "Error in getting response from LolMiner status: {e}");
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
        let body: LolMinerHttpApiStatus = match serde_json::from_str(&text) {
            Ok(body) => body,
            Err(e) => {
                warn!(target: LOG_TARGET, "Error decoding body from  in LolMiner status: {e}");
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
            // round to 2 decimal places
            hash_rate: (body
                .algorithms
                .iter()
                .map(|a| a.total_performance)
                .sum::<f64>()
                * 100.0)
                .round()
                / 100.0,
        })
    }
}

#[derive(Debug, Deserialize)]
struct LolMinerHttpApiStatus {
    #[serde(rename = "Algorithms")]
    algorithms: Vec<Algorithm>,
}

#[derive(Debug, Deserialize)]
struct Algorithm {
    #[serde(rename = "Total_Performance")]
    total_performance: f64,
}
