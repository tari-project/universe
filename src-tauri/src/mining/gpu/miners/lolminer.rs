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
    path::Path,
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
use tokio::{
    io::{AsyncBufReadExt, BufReader},
    sync::watch::Sender,
    time::timeout,
};

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

        // The device blocks are the only reliable signal here. lolminer's summary line varies
        // with what is installed: a host with the Cuda runtime but no Nvidia card prints
        // "Number of Cuda supported GPUs: 0", while a host with no Cuda runtime at all prints
        // "No Cuda driver or GPUs detected." The same holds for OpenCL.
        let gpu_devices = parse_device_list(&output_str);
        if gpu_devices.is_empty() {
            return Err(anyhow::anyhow!("No supported GPU devices found"));
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
        self.probe_device_capabilities(&gpu_miner_binary, &config_dir)
            .await;

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

    fn get_gpu_devices(&self) -> &[GpuCommonInformation] {
        &self.gpu_devices
    }
}

/// How long to wait for lolminer to print its device table before giving up on establishing
/// device capability.
const CAPABILITY_PROBE_TIMEOUT: Duration = Duration::from_secs(60);

/// Lines lolminer prints once it has finished deciding which devices it will use.
const DEVICE_TABLE_END_MARKERS: &[&str] = &[
    "Start Benchmark",
    "Start Mining",
    "All devices deselected",
    "Closing lolMiner",
];

impl LolMinerGpuMiner {
    /// Asks lolminer which of the detected devices it will actually mine C29 on.
    ///
    /// `--list-devices` reports every device with an OpenCL or Cuda driver, whether or not it
    /// can mine, and offers no way to tell the difference. Setting up for an algorithm is what
    /// makes lolminer print its `Active:` verdict, so run a benchmark and read the device table
    /// it prints on the way in, then stop it before it benchmarks anything.
    ///
    /// Failure here is not fatal and deliberately leaves capability unknown, which
    /// [`GpuCommonInformation::can_mine`] reads as "allowed". A probe that cannot run must
    /// never be the reason someone is locked out of mining.
    async fn probe_device_capabilities(&mut self, binary: &std::path::Path, config_dir: &Path) {
        match self.read_device_table(binary, config_dir).await {
            Ok(probed) => {
                for device in &mut self.gpu_devices {
                    let Some(verdict) = probed.iter().find(|p| p.device_id == device.device_id)
                    else {
                        warn!(
                            target: LOG_TARGET_APP_LOGIC,
                            "Lolminer did not report device {} while probing; leaving capability unknown",
                            device.device_id
                        );
                        continue;
                    };
                    device.is_mineable = verdict.is_mineable;
                    device.unsupported_reason = verdict.unsupported_reason.clone();

                    if device.is_known_unmineable() {
                        warn!(
                            target: LOG_TARGET_APP_LOGIC,
                            "Lolminer refuses device {} ({}): {}",
                            device.device_id,
                            device.name,
                            device.unsupported_reason.as_deref().unwrap_or("no reason given")
                        );
                    }
                }
            }
            Err(error) => {
                warn!(
                    target: LOG_TARGET_APP_LOGIC,
                    "Could not establish GPU capability, assuming devices are usable: {error}"
                );
            }
        }
    }

    /// Runs `lolminer --benchmark CR29` and returns the devices in the table it prints during
    /// setup, killing it as soon as that table is complete.
    async fn read_device_table(
        &self,
        binary: &std::path::Path,
        config_dir: &Path,
    ) -> Result<Vec<GpuCommonInformation>, anyhow::Error> {
        let args = vec!["--benchmark".to_string(), "CR29".to_string()];
        let mut child = launch_child_process(binary, config_dir, None, &args, true)?;

        let stdout = child
            .stdout
            .take()
            .ok_or_else(|| anyhow::anyhow!("Lolminer produced no stdout to probe"))?;

        let mut output = String::new();
        let read_device_table = async {
            let mut lines = BufReader::new(stdout).lines();
            while let Some(line) = lines.next_line().await? {
                let reached_end = DEVICE_TABLE_END_MARKERS
                    .iter()
                    .any(|marker| line.contains(marker));
                output.push_str(&line);
                output.push('\n');
                if reached_end {
                    break;
                }
            }
            Ok::<(), anyhow::Error>(())
        };

        let outcome = timeout(CAPABILITY_PROBE_TIMEOUT, read_device_table).await;

        // The benchmark itself is of no interest, and neither is a hung device init.
        if let Err(error) = child.kill().await {
            warn!(target: LOG_TARGET_APP_LOGIC, "Could not stop lolminer after probing: {error}");
        }

        outcome.map_err(|_| anyhow::anyhow!("Lolminer did not report its devices in time"))??;

        Ok(parse_device_list(&output))
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
/// `true (Selected Algorithm: Cuckaroo 29 (Tari))` or `false (Unsupported device or driver
/// version.)`. The reason itself may contain brackets, so match to the final one.
static ACTIVE_VERDICT: LazyLock<Regex> =
    LazyLock::new(|| Regex::new(r"^(true|false)(?:\s*\((.*)\))?$").expect("valid active regex"));

struct PartialDevice {
    device_id: u32,
    name: Option<String>,
    vendor: Option<String>,
    memory_mb: Option<u64>,
    is_mineable: Option<bool>,
    unsupported_reason: Option<String>,
}

impl PartialDevice {
    fn new(device_id: u32) -> Self {
        Self {
            device_id,
            name: None,
            vendor: None,
            memory_mb: None,
            is_mineable: None,
            unsupported_reason: None,
        }
    }

    /// A device without a name is not usable, and not worth reporting.
    fn build(self) -> Option<GpuCommonInformation> {
        Some(GpuCommonInformation {
            name: self.name?,
            device_id: self.device_id,
            vendor: self.vendor.unwrap_or_default(),
            memory_mb: self.memory_mb,
            is_mineable: self.is_mineable,
            unsupported_reason: self.unsupported_reason,
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
            // Only emitted once lolminer sets up for an algorithm, so it is absent from
            // `--list-devices` and present in a benchmark or mining run.
            "Active" => {
                if let Some(caps) = ACTIVE_VERDICT.captures(value.trim()) {
                    let is_mineable = caps.get(1).is_some_and(|v| v.as_str() == "true");
                    device.is_mineable = Some(is_mineable);
                    device.unsupported_reason = match caps.get(2) {
                        Some(reason) if !is_mineable => Some(reason.as_str().trim().to_string()),
                        _ => None,
                    };
                }
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

    /// Verbatim `lolMiner 1.98a --list-devices`, captured on a Linux host with a dedicated
    /// Radeon RX 9070 XT and an integrated GPU. Retains the banner, the ANSI colour codes and
    /// the trailing whitespace lolminer emits. Note it carries no `Active:` field.
    const LIST_DEVICES_AMD: &str = include_str!("test_fixtures/lolminer_198a_list_devices_amd.txt");

    /// `lolMiner 1.98a --list-devices` on a Ryzen laptop whose only GPU is integrated. It
    /// reports no Cuda runtime at all, and its shared memory sits just above lolminer's
    /// documented 6 GB floor.
    const LIST_DEVICES_AMD_IGPU: &str =
        include_str!("test_fixtures/lolminer_198a_list_devices_amd_igpu.txt");

    /// Verbatim `lolMiner 1.98a --benchmark CR29` on the same host as [`LIST_DEVICES_AMD`],
    /// up to the point mining starts. This is where the `Active:` verdict appears.
    const BENCHMARK_C29_AMD: &str =
        include_str!("test_fixtures/lolminer_198a_benchmark_c29_amd.txt");

    /// `lolminer.txt` from a real mining run on a Ryzen laptop with only an integrated GPU.
    /// lolminer refuses the device and exits without ever hashing.
    const ALL_DEVICES_DESELECTED: &str =
        include_str!("test_fixtures/lolminer_198a_all_devices_deselected.txt");

    fn device(
        name: &str,
        memory_mb: Option<u64>,
        is_mineable: Option<bool>,
    ) -> GpuCommonInformation {
        GpuCommonInformation {
            name: name.to_string(),
            device_id: 0,
            vendor: String::new(),
            memory_mb,
            is_mineable,
            unsupported_reason: None,
        }
    }

    #[test]
    fn parses_real_list_devices_output() {
        let devices = parse_device_list(LIST_DEVICES_AMD);

        assert_eq!(
            devices,
            vec![
                GpuCommonInformation {
                    name: "Radeon RX 9070 XT".to_string(),
                    device_id: 0,
                    vendor: "Advanced Micro Devices (AMD), ROCm".to_string(),
                    memory_mb: Some(32624),
                    is_mineable: None,
                    unsupported_reason: None,
                },
                GpuCommonInformation {
                    name: "RDNA 2".to_string(),
                    device_id: 1,
                    vendor: "Advanced Micro Devices (AMD), ROCm".to_string(),
                    memory_mb: Some(30825),
                    is_mineable: None,
                    unsupported_reason: None,
                },
            ]
        );
    }

    #[test]
    fn parses_output_from_a_host_with_no_cuda_runtime() {
        let devices = parse_device_list(LIST_DEVICES_AMD_IGPU);

        assert_eq!(devices.len(), 1);
        assert_eq!(devices[0].name, "AMD Radeon (TM) Graphics");
        assert_eq!(devices[0].vendor, "Advanced Micro Devices (AMD)");
        assert_eq!(devices[0].memory_mb, Some(6211));
    }

    /// `--list-devices` never reports supportability, so capability must stay unknown.
    #[test]
    fn list_devices_leaves_capability_unknown() {
        for device in parse_device_list(LIST_DEVICES_AMD) {
            assert_eq!(device.is_mineable, None);
            assert!(device.can_mine(), "unknown capability must fail open");
        }
    }

    #[test]
    fn parses_the_active_verdict_from_a_benchmark_run() {
        let devices = parse_device_list(BENCHMARK_C29_AMD);

        assert_eq!(devices.len(), 2);

        assert_eq!(devices[0].name, "Radeon RX 9070 XT");
        assert_eq!(devices[0].is_mineable, Some(true));
        assert_eq!(devices[0].unsupported_reason, None);

        assert_eq!(devices[1].name, "RDNA 2");
        assert_eq!(devices[1].is_mineable, Some(false));
        assert_eq!(
            devices[1].unsupported_reason.as_deref(),
            Some("Unsupported device or driver version.")
        );
        assert!(devices[1].is_known_unmineable());
        assert!(!devices[1].can_mine());
    }

    /// `Active: true (Selected Algorithm: Cuckaroo 29 (Tari))` closes two brackets.
    #[test]
    fn active_reason_may_itself_contain_brackets() {
        let devices = parse_device_list(
            "Device 0:\n    Name: A\n    Active:  true (Selected Algorithm: Cuckaroo 29 (Tari))\n",
        );

        assert_eq!(devices[0].is_mineable, Some(true));
    }

    /// A refused device keeps lolminer's wording so it can be shown to the user verbatim.
    #[test]
    fn a_refused_device_keeps_lolminers_reason() {
        let devices = parse_device_list(
            "Device 0:\n    Name: A\n    Active:  false (Unsupported device or driver version.)\n",
        );

        assert_eq!(
            devices[0].unsupported_reason.as_deref(),
            Some("Unsupported device or driver version.")
        );
    }

    #[test]
    fn an_accepted_device_carries_no_reason() {
        let devices = parse_device_list("Device 0:\n    Name: A\n    Active:  true\n");

        assert_eq!(devices[0].is_mineable, Some(true));
        assert_eq!(devices[0].unsupported_reason, None);
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
        let devices = parse_device_list(
            "|  Made by Lolliedieb: 2025 |\nOpenCL driver detected. Number of OpenCL supported GPUs: 2 \nName: not a device\n",
        );

        assert!(devices.is_empty());
    }

    #[test]
    fn a_device_without_a_name_is_dropped() {
        assert!(parse_device_list("Device 0:\n    Memory:  8192 MByte\n").is_empty());
    }

    #[test]
    fn address_field_containing_a_colon_does_not_confuse_the_parser() {
        let devices =
            parse_device_list("Device 0:\n    Name: A\n    Address: 3:0\n    Memory: 8192 MByte\n");

        assert_eq!(devices[0].name, "A");
        assert_eq!(devices[0].memory_mb, Some(8192));
    }

    #[test]
    fn unknown_memory_never_disqualifies_a_device() {
        let devices = parse_device_list("Device 0:\n    Name: A\n");

        assert_eq!(devices[0].memory_mb, None);
        assert!(devices[0].has_enough_memory_for_c29());
        assert!(devices[0].has_comfortable_memory());
    }

    #[test]
    fn memory_requirement_matches_lolminers_documented_6gb_floor() {
        assert!(!device("GPU", Some(4096), None).has_enough_memory_for_c29());
        assert!(device("GPU", Some(6144), None).has_enough_memory_for_c29());
    }

    /// The gap between "lolminer will run" and "you want this on by default".
    #[test]
    fn a_device_at_the_memory_floor_is_allowed_but_not_recommended() {
        let marginal = device("Radeon RX 480", Some(6211), Some(true));

        assert!(marginal.can_mine());
        assert!(marginal.has_enough_memory_for_c29());
        assert!(!marginal.has_comfortable_memory());
        assert!(!marginal.is_recommended_for_mining());
    }

    #[test]
    fn integrated_gpus_are_detected_by_name() {
        for name in [
            "AMD Radeon (TM) Graphics",
            "Intel(R) UHD Graphics 620",
            "Intel(R) Iris(R) Xe Graphics",
            "AMD Radeon Graphics",
        ] {
            assert!(
                device(name, Some(16384), Some(true)).is_probably_integrated(),
                "{name} should be seen as integrated"
            );
        }

        for name in ["Radeon RX 9070 XT", "NVIDIA GeForce RTX 3060"] {
            assert!(
                !device(name, Some(16384), Some(true)).is_probably_integrated(),
                "{name} should be seen as dedicated"
            );
        }
    }

    /// An integrated GPU that lolminer would accept is still not switched on by default:
    /// it shares memory with the host and would make the machine unpleasant to use.
    #[test]
    fn an_integrated_gpu_is_never_recommended() {
        let igpu = device("AMD Radeon (TM) Graphics", Some(16384), Some(true));

        assert!(igpu.can_mine());
        assert!(igpu.has_comfortable_memory());
        assert!(!igpu.is_recommended_for_mining());
    }

    #[test]
    fn a_dedicated_gpu_with_headroom_is_recommended() {
        let gpu = device("NVIDIA GeForce RTX 3060", Some(12288), Some(true));

        assert!(gpu.can_mine());
        assert!(gpu.is_recommended_for_mining());
    }

    /// Absence of evidence must not lock anyone out, but it must not enable them either.
    #[test]
    fn a_refused_device_is_neither_usable_nor_recommended() {
        let refused = device("RDNA 2", Some(30825), Some(false));

        assert!(!refused.can_mine());
        assert!(!refused.is_recommended_for_mining());
    }
    /// The machine that motivated this change: one integrated GPU, refused outright. Its 6211 MB
    /// of shared memory clears lolminer's 6 GB floor, so nothing short of asking lolminer would
    /// have caught it.
    #[test]
    fn a_machine_whose_only_gpu_is_refused_has_nothing_to_mine_on() {
        let devices = parse_device_list(ALL_DEVICES_DESELECTED);

        assert_eq!(devices.len(), 1);
        assert!(devices[0].has_enough_memory_for_c29());
        assert!(devices[0].is_known_unmineable());
        assert!(!devices.iter().any(GpuCommonInformation::can_mine));
        assert_eq!(
            devices[0].unsupported_reason.as_deref(),
            Some("Unsupported device or driver version.")
        );
    }

    /// One usable device is enough, even when another is refused alongside it.
    #[test]
    fn a_refused_device_does_not_disqualify_its_healthy_neighbour() {
        let devices = parse_device_list(BENCHMARK_C29_AMD);

        assert!(devices.iter().any(GpuCommonInformation::can_mine));
        assert!(
            devices
                .iter()
                .any(GpuCommonInformation::is_recommended_for_mining)
        );
    }

    /// Every line lolminer prints when it has finished choosing devices must stop the probe,
    /// otherwise it would read on into the benchmark, or hang waiting for a miner that has quit.
    #[test]
    fn the_device_table_end_markers_appear_in_real_output() {
        assert!(
            BENCHMARK_C29_AMD
                .lines()
                .any(|line| DEVICE_TABLE_END_MARKERS.iter().any(|m| line.contains(m))),
            "a benchmark run must hit an end marker"
        );
        assert!(
            ALL_DEVICES_DESELECTED
                .lines()
                .any(|line| DEVICE_TABLE_END_MARKERS.iter().any(|m| line.contains(m))),
            "a refused run must hit an end marker"
        );
    }
}
