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
    sync::{
        LazyLock,
        atomic::{AtomicBool, Ordering},
    },
    time::Duration,
};

use axum::async_trait;
use log::{info, warn};
use regex::Regex;
use serde::Deserialize;
use tari_shutdown::Shutdown;
use tokio::sync::watch::Sender;

#[cfg(target_os = "windows")]
use crate::utils::windows_setup_utils::add_firewall_rule;

use crate::{
    APPLICATION_FOLDER_ID, LOG_TARGET_APP_LOGIC, LOG_TARGET_STATUSES,
    binaries::{Binaries, BinaryResolver},
    configs::{
        config_mining::{ConfigMining, ConfigMiningContent},
        trait_config::ConfigImpl,
    },
    events_emitter::EventsEmitter,
    mining::{
        GpuConnectionType,
        gpu::{
            consts::{GpuMinerStatus, GpuMinerType},
            interface::{GpuMinerInterfaceTrait, GpuMinerStatusInterface},
            manager::GpuManager,
            miners::{GpuCommonInformation, MIN_GPU_MEMORY_MB_FOR_C29},
        },
    },
    port_allocator::PortAllocator,
    process_adapter::{
        HandleUnhealthyResult, HealthStatus, ProcessAdapter, ProcessInstance, ProcessStartupSpec,
        StatusMonitor,
    },
    process_utils::launch_child_process,
};

#[derive(Default)]
pub struct LolMinerGpuMiner {
    pub tari_address: Option<String>,
    pub intensity_percentage: Option<u32>,
    pub worker_name: Option<String>,
    pub connection_type: Option<GpuConnectionType>,
    pub gpu_status_sender: Sender<GpuMinerStatus>,
    pub gpu_devices: Vec<GpuCommonInformation>,
    pub excluded_devices: Vec<u32>,
}

impl LolMinerGpuMiner {
    pub fn new(gpu_status_sender: Sender<GpuMinerStatus>) -> Self {
        Self {
            tari_address: None,
            intensity_percentage: None,
            worker_name: None,
            connection_type: None,
            gpu_status_sender,
            gpu_devices: vec![],
            excluded_devices: vec![],
        }
    }
}

impl GpuMinerInterfaceTrait for LolMinerGpuMiner {
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

    async fn load_excluded_devices(
        &mut self,
        excluded_devices: Vec<u32>,
    ) -> Result<(), anyhow::Error> {
        self.excluded_devices = excluded_devices;
        Ok(())
    }

    async fn detect_devices(&mut self) -> Result<(), anyhow::Error> {
        let config_path =
            dirs::config_dir().ok_or_else(|| anyhow::anyhow!("Failed to get config directory"))?;

        let config_dir = config_path.join(APPLICATION_FOLDER_ID);

        let gpu_miner_binary = BinaryResolver::current()
            .get_binary_path(Binaries::LolMiner)
            .await?;

        let args = vec!["--list-devices".to_string()];

        crate::download_utils::set_permissions(&gpu_miner_binary).await?;
        let result = launch_child_process(&gpu_miner_binary, &config_dir, None, &args, true)?;

        let output = result.wait_with_output().await?;
        let output_str = String::from_utf8_lossy(&output.stdout);
        if output_str.contains("Number of Cuda supported GPUs: 0")
            && output_str.contains("Number of OpenCL supported GPUs: 0")
        {
            return Err(anyhow::anyhow!("No supported GPU devices found"));
        }

        let gpu_devices = parse_device_list(&output_str);
        if gpu_devices.is_empty() {
            return Err(anyhow::anyhow!(
                "Could not parse any GPU devices from lolminer --list-devices output"
            ));
        }

        for device in &gpu_devices {
            info!(
                target: LOG_TARGET_APP_LOGIC,
                "Lolminer detected device {}: {} (vendor: {}, memory: {:?} MB)",
                device.device_id, device.name, device.vendor, device.memory_mb
            );
            if !device.has_enough_memory_for_c29() {
                warn!(
                    target: LOG_TARGET_APP_LOGIC,
                    "Device {} ({}) reports {:?} MB, below the {} MB lolminer requires to mine C29",
                    device.device_id, device.name, device.memory_mb, MIN_GPU_MEMORY_MB_FOR_C29
                );
            }
        }

        self.gpu_devices = gpu_devices;
        let devices_indexes: Vec<u32> = self.gpu_devices.iter().map(|d| d.device_id).collect();
        EventsEmitter::emit_detected_devices(self.gpu_devices.clone()).await;
        ConfigMining::update_field(
            ConfigMiningContent::populate_gpu_devices_settings,
            devices_indexes,
        )
        .await?;

        EventsEmitter::emit_update_gpu_devices_settings(
            ConfigMining::content().await.gpu_devices_settings().clone(),
        )
        .await;

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
        let api_port = PortAllocator::new().assign_port_with_fallback();

        let mut args: Vec<String> = vec![
            "--algo".to_string(),
            "CR29".to_string(),
            format!("--apiport={}", api_port),
            format!("--apihost={}", "127.0.0.1"),
        ];

        if let Some(connection_type) = &self.connection_type {
            match connection_type {
                GpuConnectionType::Node {
                    node_grpc_address: _,
                } => {
                    return Err(anyhow::anyhow!("Lolminer does not support node mining"));
                }
                GpuConnectionType::Pool { pool_url } => {
                    args.push("--pool".to_string());
                    args.push(pool_url.clone());
                }
            }
        } else {
            return Err(anyhow::anyhow!(
                "Connection type must be set before starting the LolminerGpuMiner"
            ));
        }

        if let Some(tari_address) = &self.tari_address {
            let mut address = tari_address.clone();
            if let Some(worker_name) = &self.worker_name {
                address = format!("{}{}", tari_address, worker_name);
            }
            args.push("--user".to_string());
            args.push(address);
        } else {
            return Err(anyhow::anyhow!(
                "Tari address must be set before starting the LolminerGpuMiner"
            ));
        }

        info!(
            target: LOG_TARGET_APP_LOGIC,
            "Lol miner logs destination: {}",
            log_folder.to_string_lossy()
        );
        args.push("--log".to_string());
        args.push("on".to_string());
        args.push("--logfile".to_string());
        let log_file_path = log_folder.join("lolminer.txt");
        args.push(log_file_path.to_string_lossy().to_string());

        // Add device selection if there are excluded devices
        if !self.excluded_devices.is_empty() && !self.gpu_devices.is_empty() {
            let devices_to_use: Vec<String> = self
                .gpu_devices
                .iter()
                .map(|d| d.device_id)
                .filter(|id| !self.excluded_devices.contains(id))
                .map(|id| id.to_string())
                .collect();

            if devices_to_use.is_empty() {
                return Err(crate::mining::MiningError::AllDevicesExcluded.into());
            } else {
                args.push("--devices".to_string());
                args.push(devices_to_use.join(","));
                info!(
                    target: LOG_TARGET_APP_LOGIC,
                    "Lolminer using devices: {} (excluded: {:?})",
                    devices_to_use.join(","),
                    self.excluded_devices
                );
            }
        }

        #[cfg(target_os = "windows")]
        add_firewall_rule("lolMiner.exe".to_string(), binary_version_path.clone())?;

        info!(
            target: LOG_TARGET_APP_LOGIC,
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

// This is a flag to indicate if the fallback to other miner has already been triggered
// We want to avoid triggering it multiple times per session
static WAS_FALLBACK_TO_OTHER_MINER_TRIGGERED: AtomicBool = AtomicBool::new(false);

#[async_trait]
impl StatusMonitor for LolMinerGpuMinerStatusMonitor {
    async fn handle_unhealthy(
        &self,
        duration_since_last_healthy_status: Duration,
    ) -> Result<HandleUnhealthyResult, anyhow::Error> {
        info!(target: LOG_TARGET_STATUSES, "Handling unhealthy status for GpuMinerShaAdapter | Duration since last healthy status: {:?}", duration_since_last_healthy_status.as_secs());
        if duration_since_last_healthy_status.as_secs().gt(&(60 * 3)) // Fallback after 3 minutes of unhealthiness
            && !WAS_FALLBACK_TO_OTHER_MINER_TRIGGERED.load(Ordering::SeqCst)
        {
            match GpuManager::write().await.handle_unhealthy_miner().await {
                Ok(_) => {
                    info!(target: LOG_TARGET_STATUSES, "GpuMinerShaAdapter: GPU Pool feature turned off due to prolonged unhealthiness.");
                    WAS_FALLBACK_TO_OTHER_MINER_TRIGGERED.store(true, Ordering::SeqCst);
                    return Ok(HandleUnhealthyResult::Stop);
                }
                Err(error) => {
                    warn!(target: LOG_TARGET_STATUSES, "GpuMinerShaAdapter: Failed to turn off GPU Pool feature: {error} | Continuing to monitor.");
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
                warn!(target: LOG_TARGET_STATUSES, "Timeout error in GpuMinerAdapter check_health");
                let _ = self
                    .gpu_status_sender
                    .send(GpuMinerStatus::default_with_algorithm(
                        GpuMinerType::LolMiner.main_algorithm(),
                    ));
                return HealthStatus::Unhealthy;
            }
        };

        match status {
            Ok(status) => {
                let _ = self.gpu_status_sender.send(status.clone());
                if status.hash_rate > 0.0 {
                    if !GpuManager::read().await.is_current_miner_healthy().await {
                        info!(target: LOG_TARGET_STATUSES, "Marking current miner as healthy again");
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
                        GpuMinerType::LolMiner.main_algorithm(),
                    ));
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
                warn!(target: LOG_TARGET_STATUSES, "Error in getting response from LolMiner status: {e}");
                if e.is_connect() {
                    return Ok(GpuMinerStatus {
                        is_mining: false,
                        hash_rate: 0.0,
                        estimated_earnings: 0,
                        algorithm: GpuMinerType::LolMiner.main_algorithm(),
                    });
                }
                return Ok(GpuMinerStatus {
                    is_mining: false,
                    hash_rate: 0.0,
                    estimated_earnings: 0,
                    algorithm: GpuMinerType::LolMiner.main_algorithm(),
                });
            }
        };
        let text = response.text().await?;
        let body: LolMinerHttpApiStatus = match serde_json::from_str(&text) {
            Ok(body) => body,
            Err(e) => {
                warn!(target: LOG_TARGET_STATUSES, "Error decoding body from  in LolMiner status: {e}");
                return Ok(GpuMinerStatus {
                    is_mining: false,
                    hash_rate: 0.0,
                    estimated_earnings: 0,
                    algorithm: GpuMinerType::LolMiner.main_algorithm(),
                });
            }
        };

        Ok(GpuMinerStatus {
            is_mining: true,
            estimated_earnings: 0,
            hash_rate: ((body
                .algorithms
                .iter()
                .map(|a| a.total_performance)
                .sum::<f64>()
                * 100.0)
                .round()
                / 100.0),
            algorithm: GpuMinerType::LolMiner.main_algorithm(),
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

static ANSI_ESCAPE: LazyLock<Regex> =
    LazyLock::new(|| Regex::new(r"\x1b\[[0-9;]*m").expect("valid ANSI escape regex"));
static DEVICE_HEADER: LazyLock<Regex> =
    LazyLock::new(|| Regex::new(r"^Device\s+(\d+):$").expect("valid device header regex"));
static MEMORY_MBYTE: LazyLock<Regex> =
    LazyLock::new(|| Regex::new(r"^(\d+)\s*MByte").expect("valid memory regex"));

struct PartialDevice {
    device_id: u32,
    name: Option<String>,
    vendor: Option<String>,
    memory_mb: Option<u64>,
}

impl PartialDevice {
    fn new(device_id: u32) -> Self {
        Self {
            device_id,
            name: None,
            vendor: None,
            memory_mb: None,
        }
    }

    /// A device without a name is not usable, and not worth reporting.
    fn build(self) -> Option<GpuCommonInformation> {
        Some(GpuCommonInformation {
            name: self.name?,
            device_id: self.device_id,
            vendor: self.vendor.unwrap_or_default(),
            memory_mb: self.memory_mb,
        })
    }
}

/// Parses the device blocks emitted by `lolMiner --list-devices`.
///
/// The output is ANSI-coloured, human-oriented text. A block looks like:
///
/// ```text
/// Device 0:
///     Name:    Radeon RX 9070 XT
///     Address: 3:0
///     Vendor:  Advanced Micro Devices (AMD), ROCm
///     Drivers: OpenCL
///     Memory:  32624 MByte (32558 MByte free)
/// ```
///
/// `device_id` is taken from the `Device N:` header rather than the position in the list,
/// because it is passed back to lolminer via `--devices` and must match its numbering.
fn parse_device_list(output_str: &str) -> Vec<GpuCommonInformation> {
    let mut devices = Vec::new();
    let mut current: Option<PartialDevice> = None;

    for raw_line in output_str.lines() {
        let stripped = ANSI_ESCAPE.replace_all(raw_line, "");
        let line = stripped.trim();

        if let Some(device_id) = DEVICE_HEADER
            .captures(line)
            .and_then(|caps| caps.get(1))
            .and_then(|id| id.as_str().parse().ok())
        {
            devices.extend(current.take().and_then(PartialDevice::build));
            current = Some(PartialDevice::new(device_id));
            continue;
        }

        let (Some(device), Some((field, value))) = (current.as_mut(), line.split_once(':')) else {
            continue;
        };

        match field.trim() {
            "Name" => device.name = Some(value.trim().to_string()),
            "Vendor" => device.vendor = Some(value.trim().to_string()),
            "Memory" => {
                device.memory_mb = MEMORY_MBYTE
                    .captures(value.trim())
                    .and_then(|caps| caps.get(1))
                    .and_then(|mb| mb.as_str().parse().ok());
            }
            _ => {}
        }
    }

    devices.extend(current.and_then(PartialDevice::build));
    devices
}

#[cfg(test)]
mod tests {
    use super::*;

    /// Verbatim `lolMiner 1.98a --list-devices` output, captured on a Linux host with a
    /// dedicated Radeon RX 9070 XT and an integrated GPU. Retains the banner, the ANSI
    /// colour codes and the trailing whitespace lolminer emits.
    const LIST_DEVICES_AMD: &str = include_str!("test_fixtures/lolminer_198a_list_devices_amd.txt");

    #[test]
    fn parses_real_lolminer_output() {
        let devices = parse_device_list(LIST_DEVICES_AMD);

        assert_eq!(
            devices,
            vec![
                GpuCommonInformation {
                    name: "Radeon RX 9070 XT".to_string(),
                    device_id: 0,
                    vendor: "Advanced Micro Devices (AMD), ROCm".to_string(),
                    memory_mb: Some(32624),
                },
                GpuCommonInformation {
                    name: "RDNA 2".to_string(),
                    device_id: 1,
                    vendor: "Advanced Micro Devices (AMD), ROCm".to_string(),
                    memory_mb: Some(30825),
                },
            ]
        );
    }

    #[test]
    fn strips_ansi_colour_codes_embedded_in_the_name() {
        let devices = parse_device_list(
            "Device 0: \n    Name:    \x1b[38;2;255;069;000mNVIDIA GeForce RTX 3060 \n\x1b[0m    Memory:  12288 MByte (12000 MByte free) \n",
        );

        assert_eq!(devices.len(), 1);
        assert_eq!(devices[0].name, "NVIDIA GeForce RTX 3060");
        assert_eq!(devices[0].memory_mb, Some(12288));
    }

    #[test]
    fn device_id_comes_from_the_header_not_the_position() {
        let devices = parse_device_list("Device 3:\n    Name: A\nDevice 7:\n    Name: B\n");

        assert_eq!(
            devices.iter().map(|d| d.device_id).collect::<Vec<_>>(),
            vec![3, 7]
        );
    }

    #[test]
    fn ignores_the_banner_and_summary_lines() {
        // The banner and the "supported GPUs" summary both contain colons.
        let devices = parse_device_list(
            "|  Made by Lolliedieb: 2025 |\nOpenCL driver detected. Number of OpenCL supported GPUs: 2 \nName: not a device\n",
        );

        assert!(devices.is_empty());
    }

    #[test]
    fn a_device_without_a_name_is_dropped() {
        let devices = parse_device_list("Device 0:\n    Memory:  8192 MByte\n");

        assert!(devices.is_empty());
    }

    #[test]
    fn address_field_containing_a_colon_does_not_confuse_the_parser() {
        let devices =
            parse_device_list("Device 0:\n    Name: A\n    Address: 3:0\n    Memory: 8192 MByte\n");

        assert_eq!(devices[0].name, "A");
        assert_eq!(devices[0].memory_mb, Some(8192));
    }

    #[test]
    fn memory_is_none_when_lolminer_does_not_report_it() {
        let devices = parse_device_list("Device 0:\n    Name: A\n");

        assert_eq!(devices[0].memory_mb, None);
        // Unknown memory must not disqualify a device.
        assert!(devices[0].has_enough_memory_for_c29());
    }

    #[test]
    fn memory_requirement_matches_lolminers_documented_6gb_floor() {
        let device = |memory_mb| GpuCommonInformation {
            name: "GPU".to_string(),
            device_id: 0,
            vendor: String::new(),
            memory_mb,
        };

        assert!(!device(Some(4096)).has_enough_memory_for_c29());
        assert!(device(Some(6144)).has_enough_memory_for_c29());
        assert!(device(Some(12288)).has_enough_memory_for_c29());
    }
}
