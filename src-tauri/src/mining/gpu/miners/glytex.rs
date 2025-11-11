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

use std::{
    fs::read_dir,
    sync::atomic::{AtomicBool, Ordering},
    time::Duration,
};

use axum::async_trait;
use log::{info, warn};
use serde::Deserialize;
use tari_common::configuration::Network;
use tari_shutdown::Shutdown;
use tokio::sync::watch::Sender;

#[cfg(target_os = "windows")]
use crate::utils::windows_setup_utils::add_firewall_rule;

use crate::{
    binaries::{Binaries, BinaryResolver},
    configs::{config_mining::ConfigMining, trait_config::ConfigImpl},
    events_emitter::EventsEmitter,
    mining::{
        gpu::{
            consts::{EngineType, GpuMinerStatus, GpuMinerType},
            interface::{GpuMinerInterfaceTrait, GpuMinerStatusInterface},
            manager::GpuManager,
            miners::{load_file_content, save_file_content, GpuCommonInformation},
        },
        GpuConnectionType,
    },
    process_adapter::{
        HandleUnhealthyResult, HealthStatus, ProcessAdapter, ProcessInstance, ProcessStartupSpec,
        StatusMonitor,
    },
    process_utils, APPLICATION_FOLDER_ID,
};

const LOG_TARGET: &str = "tari::universe::mining::gpu::miners::glytex";
const DEFAULT_GPU_THREADS: u32 = 8196;
#[derive(serde::Deserialize, serde::Serialize, Debug, Clone)]
pub struct GlytexGpuStatus {
    pub recommended_grid_size: u32,
    pub recommended_block_size: u32,
    pub max_grid_size: u32,
}

#[derive(serde::Deserialize, serde::Serialize, Debug, Clone)]
pub struct GlytexGpuSettings {
    pub is_excluded: bool,
    pub is_available: bool,
}

impl Default for GlytexGpuSettings {
    fn default() -> Self {
        Self {
            is_excluded: false,
            is_available: true,
        }
    }
}

#[derive(serde::Deserialize, serde::Serialize, Debug, Clone)]
pub struct GlytexGpuDevice {
    pub device_name: String,
    pub device_index: u32,
    pub status: GlytexGpuStatus,
    pub settings: GlytexGpuSettings,
}
#[derive(serde::Deserialize, serde::Serialize, Debug, Clone)]
pub struct GlytexGpuDevices {
    pub gpu_devices: Vec<GlytexGpuDevice>,
}

pub struct GlytexGpuMiner {
    pub tari_address: Option<String>,
    pub intensity_percentage: Option<u32>,
    pub worker_name: Option<String>,
    pub connection_type: Option<GpuConnectionType>,
    pub selected_engine: Option<EngineType>,
    pub gpu_status_sender: Sender<GpuMinerStatus>,
    pub gpu_devices: Vec<GpuCommonInformation>,
    pub excluded_devices: Vec<u32>,
}

impl GlytexGpuMiner {
    pub fn new(gpu_status_sender: Sender<GpuMinerStatus>) -> Self {
        Self {
            tari_address: None,
            intensity_percentage: None,
            worker_name: None,
            connection_type: None,
            selected_engine: None,
            gpu_status_sender,
            gpu_devices: vec![],
            excluded_devices: vec![],
        }
    }
}

impl GpuMinerInterfaceTrait for GlytexGpuMiner {
    async fn load_excluded_devices(
        &mut self,
        excluded_devices: Vec<u32>,
    ) -> Result<(), anyhow::Error> {
        self.excluded_devices = excluded_devices;

        let selected_engine = self.selected_engine.clone().unwrap_or(EngineType::OpenCL);
        let config_path =
            dirs::config_dir().ok_or_else(|| anyhow::anyhow!("Failed to get config directory"))?;

        let config_dir = config_path.join(APPLICATION_FOLDER_ID);

        let gpu_engine_statuses_path = config_dir.join("gpuminer").join("engine_statuses");

        let gpu_status_file_name = format!("{selected_engine}_gpu_status.json");
        let gpu_status_file_path = gpu_engine_statuses_path.join(gpu_status_file_name);
        let mut gpu_status_file =
            load_file_content::<GlytexGpuDevices>(&gpu_status_file_path).await?;
        for device in &mut gpu_status_file.gpu_devices.iter_mut() {
            device.settings.is_excluded = self.excluded_devices.contains(&device.device_index);
        }
        save_file_content::<GlytexGpuDevices>(&gpu_status_file_path, &gpu_status_file).await?;

        Ok(())
    }

    async fn load_tari_address(&mut self, tari_address: &str) -> Result<(), anyhow::Error> {
        self.tari_address = Some(tari_address.to_string());
        Ok(())
    }
    async fn load_worker_name(&mut self, worker_name: Option<&str>) -> Result<(), anyhow::Error> {
        self.worker_name = worker_name.map(|name| name.to_string());
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
        let selected_engine = self.selected_engine.clone().unwrap_or(EngineType::OpenCL);
        let config_path =
            dirs::config_dir().ok_or_else(|| anyhow::anyhow!("Failed to get config directory"))?;

        let config_dir = config_path.join(APPLICATION_FOLDER_ID);

        let gpu_engine_statuses_path = config_dir.join("gpuminer").join("engine_statuses");

        let config_file = config_dir
            .join("gpuminer")
            .join("config.json")
            .to_string_lossy()
            .to_string();

        let args = vec![
            "--detect".to_string(),
            "true".to_string(),
            "--config".to_string(),
            config_file.clone(),
            "--gpu-status-file".to_string(),
            gpu_engine_statuses_path.to_string_lossy().to_string(),
            "--engine".to_string(),
            selected_engine.to_string(),
        ];

        let gpuminer_bin = BinaryResolver::current()
            .get_binary_path(Binaries::Glytex)
            .await?;

        crate::download_utils::set_permissions(&gpuminer_bin).await?;
        let child =
            process_utils::launch_child_process(&gpuminer_bin, &config_dir, None, &args, false)?;
        let output = child.wait_with_output().await?;

        match output.status.code() {
            Some(0) => {
                info!(target: LOG_TARGET, "Glytex GPU miner detection completed successfully");
                let gpu_status_file_name = format!("{selected_engine}_gpu_status.json");
                let gpu_status_file_path = gpu_engine_statuses_path.join(gpu_status_file_name);
                let gpu_status_file =
                    load_file_content::<GlytexGpuDevices>(&gpu_status_file_path).await?;
                let common_gpu_devices = gpu_status_file
                    .gpu_devices
                    .iter()
                    .map(|device| GpuCommonInformation::from_glytex_devices(device.clone()))
                    .collect::<Vec<GpuCommonInformation>>();

                self.gpu_devices = common_gpu_devices.clone();
                EventsEmitter::emit_detected_devices(common_gpu_devices).await;

                EventsEmitter::emit_update_gpu_devices_settings(
                    ConfigMining::content().await.gpu_devices_settings().clone(),
                )
                .await;

                let mut available_engines: Vec<String> = vec![];

                for entry in read_dir(gpu_engine_statuses_path)? {
                    info!(target: LOG_TARGET, "Reading engine status file");
                    info!(target: LOG_TARGET, "Engine status file: {entry:?}");
                    let entry = entry?;
                    let path = entry.path();
                    let file_name = path
                        .file_name()
                        .ok_or_else(|| anyhow::anyhow!("Failed to get file name"))?
                        .to_str()
                        .ok_or_else(|| anyhow::anyhow!("Failed conversion to string"))?;

                    let sanitized_file_name = file_name.split("_").collect::<Vec<&str>>()[0];
                    let engine_type = EngineType::from_string(sanitized_file_name);

                    info!(target: LOG_TARGET, "File name: {file_name:?}");
                    info!(target: LOG_TARGET, "Sanitized file name: {sanitized_file_name:?}");

                    match engine_type {
                        Ok(engine) => {
                            available_engines.push(engine.to_string());
                        }
                        Err(_) => {
                            info!(target: LOG_TARGET, "Invalid engine type: {sanitized_file_name:?}");
                        }
                    }
                }

                EventsEmitter::emit_detected_available_gpu_engines(
                    available_engines,
                    selected_engine.to_string(),
                )
                .await;
            }
            _ => {
                info!(target: LOG_TARGET, "Glytex GPU miner detection failed");
            }
        };
        Ok(())
    }
}

impl ProcessAdapter for GlytexGpuMiner {
    type ProcessInstance = ProcessInstance;
    type StatusMonitor = GpuMinerStatusInterface;

    #[allow(clippy::too_many_lines)]
    fn spawn_inner(
        &self,
        base_folder: std::path::PathBuf,
        config_folder: std::path::PathBuf,
        log_folder: std::path::PathBuf,
        binary_version_path: std::path::PathBuf,
        _is_first_start: bool,
    ) -> Result<(Self::ProcessInstance, Self::StatusMonitor), anyhow::Error> {
        info!(target: LOG_TARGET, "Gpu miner spawn inner");
        let inner_shutdown = Shutdown::new();

        let http_api_port = 8080;
        let working_dir = base_folder.join("gpuminer");
        std::fs::create_dir_all(&working_dir)?;
        std::fs::create_dir_all(config_folder.join("gpuminer"))?;

        let tari_node_address = match &self.connection_type {
            Some(GpuConnectionType::Node { node_grpc_address }) => node_grpc_address,
            Some(GpuConnectionType::Pool { pool_url: _ }) => {
                return Err(anyhow::anyhow!("Glytex does not support pool mining"));
            }
            None => {
                return Err(anyhow::anyhow!(
                    "Connection type must be set before starting the miner"
                ));
            }
        };

        let tari_address = match &self.tari_address {
            Some(addr) => addr.clone(),
            None => {
                return Err(anyhow::anyhow!(
                    "Tari address must be set before starting the GpuMinerShaAdapter"
                ));
            }
        };

        let gpu_engine_statuses = config_folder
            .join("gpuminer")
            .join("engine_statuses")
            .clone()
            .to_string_lossy()
            .to_string();

        let grid_size = format!("{DEFAULT_GPU_THREADS}");

        let selected_engine = self.selected_engine.clone().unwrap_or_default();

        let mut args: Vec<String> = vec![
            "--tari-address".to_string(),
            tari_address,
            "--tari-node-url".to_string(),
            tari_node_address.to_string(),
            "--config".to_string(),
            config_folder
                .join("gpuminer")
                .join("config.json")
                .to_string_lossy()
                .to_string(),
            "--http-server-port".to_string(),
            http_api_port.to_string(),
            "--grid-size".to_string(),
            grid_size.clone(),
            "--log-config-file".to_string(),
            config_folder
                .join("gpuminer")
                .join("log4rs_config.yml")
                .to_string_lossy()
                .to_string(),
            "--gpu-status-file".to_string(),
            gpu_engine_statuses.clone(),
            "--log-dir".to_string(),
            log_folder.to_string_lossy().to_string(),
            "--template-timeout-secs".to_string(),
            "5".to_string(),
            "--engine".to_string(),
            selected_engine.to_string(),
        ];

        if let Some(worker_name) = &self.worker_name {
            // Only available after 0.1.8-pre.2
            args.push("--coinbase-extra".to_string());
            args.push(worker_name.clone());
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
            Network::Igor => {
                envs.insert("TARI_NETWORK".to_string(), "igor".to_string());
            }
            Network::MainNet => {
                envs.insert("TARI_NETWORK".to_string(), "mainnet".to_string());
            }
            Network::StageNet => {
                envs.insert("TARI_NETWORK".to_string(), "stagenet".to_string());
            }
            Network::LocalNet => {
                envs.insert("TARI_NETWORK".to_string(), "localnet".to_string());
            }
        }

        #[cfg(target_os = "windows")]
        add_firewall_rule("glytex.exe".to_string(), binary_version_path.clone())?;

        Ok((
            ProcessInstance {
                shutdown: inner_shutdown,
                startup_spec: ProcessStartupSpec {
                    file_path: binary_version_path,
                    envs: Some(envs),
                    args,
                    data_dir: base_folder,
                    pid_file_name: self.pid_file_name().to_string(),
                    name: self.name().to_string(),
                },
                handle: None,
            },
            GpuMinerStatusInterface::Glytex(GlytexGpuMinerStatusMonitor {
                http_api_port,
                gpu_status_sender: self.gpu_status_sender.clone(),
            }),
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
pub struct GlytexGpuMinerStatusMonitor {
    http_api_port: u16,
    gpu_status_sender: Sender<GpuMinerStatus>,
}

// This is a flag to indicate if the fallback to other miner has already been triggered
// We want to avoid triggering it multiple times per session
static WAS_FALLBACK_TO_OTHER_MINER_TRIGGERED: AtomicBool = AtomicBool::new(false);

#[async_trait]
impl StatusMonitor for GlytexGpuMinerStatusMonitor {
    async fn handle_unhealthy(
        &self,
        duration_since_last_healthy_status: Duration,
    ) -> Result<HandleUnhealthyResult, anyhow::Error> {
        info!(target: LOG_TARGET, "Handling unhealthy status for GpuMinerShaAdapter | Duration since last healthy status: {:?}", duration_since_last_healthy_status.as_secs());
        if duration_since_last_healthy_status.as_secs().gt(&(60 * 3)) // Fallback after 3 minutes of unhealthiness
            && !WAS_FALLBACK_TO_OTHER_MINER_TRIGGERED.load(Ordering::SeqCst)
        {
            match GpuManager::write().await.handle_unhealthy_miner().await {
                Ok(_) => {
                    info!(target: LOG_TARGET, "GpuMinerShaAdapter: GPU Pool feature turned off due to prolonged unhealthiness.");
                    WAS_FALLBACK_TO_OTHER_MINER_TRIGGERED.store(true, Ordering::SeqCst);
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

    async fn check_health(&self, _uptime: Duration, timeout_duration: Duration) -> HealthStatus {
        let status = match tokio::time::timeout(timeout_duration, self.status()).await {
            Ok(inner) => inner,
            Err(_) => {
                warn!(target: LOG_TARGET, "Timeout error in GpuMinerAdapter check_health");
                let _ = self
                    .gpu_status_sender
                    .send(GpuMinerStatus::default_with_algorithm(
                        GpuMinerType::Glytex.main_algorithm(),
                    ));
                return HealthStatus::Unhealthy;
            }
        };

        match status {
            Ok(status) => {
                let _ = self.gpu_status_sender.send(status.clone());
                if status.hash_rate > 0.0 {
                    if !GpuManager::read().await.is_current_miner_healthy().await {
                        info!(target: LOG_TARGET, "Marking current miner as healthy again");
                        let _unused = GpuManager::write().await.handle_healthy_miner().await;
                    }
                    HealthStatus::Healthy
                } else {
                    HealthStatus::Unhealthy
                }
            }
            Err(_) => {
                let _ = self
                    .gpu_status_sender
                    .send(GpuMinerStatus::default_with_algorithm(
                        GpuMinerType::Glytex.main_algorithm(),
                    ));
                HealthStatus::Unhealthy
            }
        }
    }
}

impl GlytexGpuMinerStatusMonitor {
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
                warn!(target: LOG_TARGET, "Error in getting response from XtrGpuMiner status: {e}");
                if e.is_connect() {
                    return Ok(GpuMinerStatus {
                        is_mining: false,
                        hash_rate: 0.0,
                        estimated_earnings: 0,
                        algorithm: GpuMinerType::Glytex.main_algorithm(),
                    });
                }
                return Ok(GpuMinerStatus {
                    is_mining: false,
                    hash_rate: 0.0,
                    estimated_earnings: 0,
                    algorithm: GpuMinerType::Glytex.main_algorithm(),
                });
            }
        };
        let text = response.text().await?;
        let body: XtrGpuminerHttpApiStatus = match serde_json::from_str(&text) {
            Ok(body) => body,
            Err(e) => {
                warn!(target: LOG_TARGET, "Error decoding body from  in XtrGpuMiner status: {e}");
                return Ok(GpuMinerStatus {
                    is_mining: false,
                    hash_rate: 0.0,
                    estimated_earnings: 0,
                    algorithm: GpuMinerType::Glytex.main_algorithm(),
                });
            }
        };

        Ok(GpuMinerStatus {
            is_mining: true,
            estimated_earnings: 0,
            hash_rate: body.total_hashrate.ten_seconds.unwrap_or(0.0),
            algorithm: GpuMinerType::Glytex.main_algorithm(),
        })
    }
}

#[derive(Debug, Deserialize)]

struct XtrGpuminerHttpApiStatus {
    total_hashrate: AverageHashrate,
}

#[derive(Debug, Clone, Deserialize)]
pub(crate) struct AverageHashrate {
    ten_seconds: Option<f64>,
}
