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

use std::{path::PathBuf, sync::LazyLock};

use crate::{
    APPLICATION_FOLDER_ID, LOG_TARGET_APP_LOGIC,
    configs::{
        config_mining::{ConfigMining, ConfigMiningContent},
        trait_config::ConfigImpl,
    },
    events_emitter::EventsEmitter,
    hardware::{cpu_readers::DefaultCpuParametersReader, gpu_readers::DefaultGpuParametersReader},
    mining::gpu::miners::GpuCommonInformation,
};

use super::{
    cpu_readers::{
        CpuParametersReader, amd_cpu_reader::AmdCpuParametersReader,
        apple_cpu_reader::AppleCpuParametersReader, intel_cpu_reader::IntelCpuParametersReader,
    },
    gpu_readers::{
        GpuParametersReader, amd_gpu_reader::AmdGpuReader, apple_gpu_reader::AppleGpuReader,
        intel_gpu_reader::IntelGpuReader, nvidia_gpu_reader::NvidiaGpuReader,
    },
};
use anyhow::Error;
use log::{debug, error, info, warn};
use serde::{Deserialize, Serialize};
use sysinfo::{CpuRefreshKind, MemoryRefreshKind, RefreshKind, System};
use tokio::sync::RwLock;

static INSTANCE: LazyLock<HardwareStatusMonitor> = LazyLock::new(HardwareStatusMonitor::new);

#[derive(Debug, Serialize, Clone, Default, PartialEq)]
pub enum HardwareVendor {
    Nvidia,
    Amd,
    Intel,
    Apple,
    #[default]
    Unknown,
}

impl HardwareVendor {
    pub fn is_nvidia(&self, vendor: &str) -> bool {
        vendor.to_lowercase().contains("nvidia")
    }

    pub fn is_amd(&self, vendor: &str) -> bool {
        vendor.to_lowercase().contains("amd") || vendor.to_lowercase().contains("gfx")
    }

    pub fn is_intel(&self, vendor: &str) -> bool {
        vendor.to_lowercase().contains("intel")
    }

    pub fn is_apple(&self, vendor: &str) -> bool {
        vendor.to_lowercase().contains("apple")
    }

    pub fn from_string(vendor: &str) -> HardwareVendor {
        if HardwareVendor::is_nvidia(&HardwareVendor::Nvidia, vendor) {
            HardwareVendor::Nvidia
        } else if HardwareVendor::is_amd(&HardwareVendor::Amd, vendor) {
            HardwareVendor::Amd
        } else if HardwareVendor::is_intel(&HardwareVendor::Intel, vendor) {
            HardwareVendor::Intel
        } else if HardwareVendor::is_apple(&HardwareVendor::Apple, vendor) {
            HardwareVendor::Apple
        } else {
            error!(target: LOG_TARGET_APP_LOGIC, "Unsupported hardware vendor: {vendor:?}");
            HardwareVendor::Unknown
        }
    }
}

#[derive(Debug, Deserialize, Clone, Default)]
struct GpuStatusFileContent {
    devices: Vec<GpuStatusFileEntry>,
}

#[allow(dead_code)] // These fields are used when passed to the front end.
#[derive(Debug, Deserialize, Clone, Default)]
struct GpuStatusFileEntry {
    name: String,
    device_id: u32,
    device_type: String,
    platform_name: String,
    vendor: String,
    max_work_group_size: u32,
    max_compute_units: u32,
    global_mem_size: u64,
}

#[derive(Debug, Serialize, Clone, Default)]
pub struct DeviceParameters {
    pub usage_percentage: f32,
    pub current_temperature: f32,
    pub max_temperature: f32,
}
#[derive(Debug, Serialize, Clone, Default)]
pub struct DeviceStatus {
    pub is_available: bool,
    pub is_reader_implemented: bool,
}

#[derive(Debug, Serialize, Clone, Default)]
pub struct PublicDeviceCpuProperties {
    pub vendor: HardwareVendor,
    pub name: String,
    pub status: DeviceStatus,
    pub parameters: Option<DeviceParameters>,
}
#[derive(Debug, Serialize, Clone, Default)]
pub struct PublicDeviceGpuProperties {
    pub vendor: HardwareVendor,
    pub name: String,
    pub status: DeviceStatus,
    pub parameters: Option<DeviceParameters>,
    pub device_type: String, // Dedicated or integrated
}

#[derive(Clone)]
pub struct PrivateCpuDeviceProperties {
    pub device_reader: Box<dyn CpuParametersReader>,
}
#[derive(Clone)]
pub struct PrivateGpuDeviceProperties {
    pub device_reader: Box<dyn GpuParametersReader>,
}

#[derive(Clone)]
pub struct CpuDeviceProperties {
    pub public_properties: PublicDeviceCpuProperties,
    pub private_properties: PrivateCpuDeviceProperties,
}
#[derive(Clone)]
pub struct GpuDeviceProperties {
    pub public_properties: PublicDeviceGpuProperties,
    pub private_properties: PrivateGpuDeviceProperties,
}

pub struct HardwareStatusMonitor {
    gpu_devices: RwLock<Vec<GpuDeviceProperties>>,
    cpu_devices: RwLock<Vec<CpuDeviceProperties>>,
}

impl HardwareStatusMonitor {
    fn new() -> Self {
        Self {
            gpu_devices: RwLock::new(Vec::new()),
            cpu_devices: RwLock::new(Vec::new()),
        }
    }

    async fn load_gpu_devices_from_status_file(
        &self,
        config_dir: PathBuf,
    ) -> Result<GpuStatusFileContent, Error> {
        let file: PathBuf = config_dir
            .join("gpuminer")
            .join("gpu_information_opencl.json");
        if file.exists() {
            debug!(target: LOG_TARGET_APP_LOGIC, "Loading gpu status from file: {file:?}");
            let content = tokio::fs::read_to_string(file).await?;
            let gpu_status: GpuStatusFileContent = serde_json::from_str(&content)?;
            Ok(gpu_status)
        } else {
            warn!(target: LOG_TARGET_APP_LOGIC, "Gpu status file not found: {file:?}");
            Ok(GpuStatusFileContent::default())
        }
    }

    async fn select_reader_for_gpu_device(
        &self,
        vendor: HardwareVendor,
    ) -> Box<dyn GpuParametersReader> {
        match vendor {
            HardwareVendor::Nvidia => Box::new(NvidiaGpuReader::new()),
            HardwareVendor::Amd => Box::new(AmdGpuReader::new()),
            HardwareVendor::Intel => Box::new(IntelGpuReader::new()),
            HardwareVendor::Apple => Box::new(AppleGpuReader::new()),
            _ => {
                warn!("Unsupported GPU vendor: {vendor:?}");
                Box::new(DefaultGpuParametersReader)
            }
        }
    }

    pub async fn initialize_gpu_devices(&self) -> Result<(), Error> {
        let config_dir = dirs::config_dir()
            .expect("Could not get config dir")
            .join(APPLICATION_FOLDER_ID);
        let gpu_status_file_content = self.load_gpu_devices_from_status_file(config_dir).await?;
        let mut platform_devices = Vec::new();

        for gpu_device in &gpu_status_file_content.devices {
            debug!(target: LOG_TARGET_APP_LOGIC, "GPU device name: {:?}", gpu_device.name);
            let vendor = HardwareVendor::from_string(&gpu_device.name);
            let device_reader = self.select_reader_for_gpu_device(vendor.clone()).await;
            let platform_device = GpuDeviceProperties {
                private_properties: PrivateGpuDeviceProperties {
                    device_reader: device_reader.clone(),
                },
                public_properties: PublicDeviceGpuProperties {
                    vendor: vendor.clone(),
                    name: gpu_device.name.clone(),
                    status: DeviceStatus {
                        is_available: true,
                        is_reader_implemented: device_reader.clone().get_is_reader_implemented(),
                    },
                    parameters: None,
                    device_type: gpu_device.device_type.clone(),
                    // parameters: if device_reader.clone().get_is_reader_implemented() {
                    //     debug!(target: LOG_TARGET_APP_LOGIC, "Getting device parameters for: {:?}", gpu_device.device_name);
                    //     device_reader.clone().get_device_parameters(None).await.ok()
                    // } else {
                    //     None
                    // },
                },
            };

            platform_devices.push(platform_device);
        }

        *self.gpu_devices.write().await = platform_devices;

        Ok(())
    }

    pub fn detect_cpu_vendor(vendor_id: &str, brand: &str) -> HardwareVendor {
        let combined = format!("{vendor_id} {brand}");
        let lower = combined.to_lowercase();
        if lower.contains("amd") || lower.contains("authenticamd") {
            HardwareVendor::Amd
        } else if lower.contains("intel") || lower.contains("genuineintel") {
            HardwareVendor::Intel
        } else if lower.contains("apple") {
            HardwareVendor::Apple
        } else {
            #[cfg(target_os = "macos")]
            if std::env::consts::ARCH == "aarch64" {
                return HardwareVendor::Apple;
            }
            warn!(target: LOG_TARGET_APP_LOGIC, "Unknown CPU vendor: {combined}");
            HardwareVendor::Unknown
        }
    }

    async fn select_reader_for_cpu_device(
        &self,
        vendor: HardwareVendor,
    ) -> Box<dyn CpuParametersReader> {
        match vendor {
            HardwareVendor::Amd => Box::new(AmdCpuParametersReader::new()),
            HardwareVendor::Intel => Box::new(IntelCpuParametersReader::new()),
            HardwareVendor::Apple => Box::new(AppleCpuParametersReader::new()),
            _ => {
                warn!(target: LOG_TARGET_APP_LOGIC, "Unsupported CPU vendor: {vendor:?}");
                Box::new(DefaultCpuParametersReader)
            }
        }
    }

    pub async fn initialize_cpu_devices(&self) -> Result<(), Error> {
        let system =
            System::new_with_specifics(RefreshKind::new().with_cpu(CpuRefreshKind::everything()));

        let mut cpu_devices = vec![];
        let mut seen_names = std::collections::HashSet::new();

        for cpu_device in system.cpus() {
            debug!(target: LOG_TARGET_APP_LOGIC, "CPU brand: {:?}", cpu_device.brand());
            debug!(target: LOG_TARGET_APP_LOGIC, "CPU vendor: {:?}", cpu_device.vendor_id());
            debug!(target: LOG_TARGET_APP_LOGIC, "CPU model: {:?}", cpu_device.name());

            let name = cpu_device.brand().trim();
            let name = if name.is_empty() {
                cpu_device.name().to_string()
            } else {
                name.to_string()
            };

            if !seen_names.insert(name.clone()) {
                continue;
            }

            let vendor = Self::detect_cpu_vendor(cpu_device.vendor_id(), cpu_device.brand());
            let device_reader = self.select_reader_for_cpu_device(vendor.clone()).await;
            let platform_device = CpuDeviceProperties {
                private_properties: PrivateCpuDeviceProperties {
                    device_reader: device_reader.clone(),
                },
                public_properties: PublicDeviceCpuProperties {
                    vendor,
                    name,
                    status: DeviceStatus {
                        is_available: true,
                        is_reader_implemented: device_reader.get_is_reader_implemented(),
                    },
                    parameters: None,
                },
            };

            cpu_devices.push(platform_device);
        }

        if cpu_devices.is_empty() {
            let vendor = Self::detect_cpu_vendor("", "");
            let device_reader = self.select_reader_for_cpu_device(vendor.clone()).await;
            cpu_devices.push(CpuDeviceProperties {
                private_properties: PrivateCpuDeviceProperties {
                    device_reader: device_reader.clone(),
                },
                public_properties: PublicDeviceCpuProperties {
                    vendor,
                    name: "CPU".to_string(),
                    status: DeviceStatus {
                        is_available: true,
                        is_reader_implemented: device_reader.get_is_reader_implemented(),
                    },
                    parameters: None,
                },
            });
        }

        *self.cpu_devices.write().await = cpu_devices;

        Ok(())
    }

    #[allow(dead_code)]
    pub async fn get_gpu_devices(&self) -> Result<Vec<GpuDeviceProperties>, Error> {
        let gpu_devices = self.gpu_devices.read().await;
        Ok(gpu_devices.clone())
    }

    #[allow(dead_code)]
    pub async fn get_cpu_devices(&self) -> Result<Vec<CpuDeviceProperties>, Error> {
        let cpu_devices = self.cpu_devices.read().await;
        Ok(cpu_devices.clone())
    }

    pub async fn get_gpu_public_properties(&self) -> Result<Vec<PublicDeviceGpuProperties>, Error> {
        let gpu_devices = self.gpu_devices.read().await;

        let mut platform_devices = Vec::new();

        for device in gpu_devices.iter() {
            platform_devices.push(PublicDeviceGpuProperties {
                device_type: device.public_properties.device_type.clone(),
                vendor: device.public_properties.vendor.clone(),
                name: device.public_properties.name.clone(),
                status: device.public_properties.status.clone(),
                parameters: device
                    .private_properties
                    .device_reader
                    .get_device_parameters(device.public_properties.parameters.clone())
                    .await
                    .ok(),
            });
        }

        Ok(platform_devices)
    }

    pub async fn get_cpu_public_properties(&self) -> Result<Vec<PublicDeviceCpuProperties>, Error> {
        let cpu_devices = self.cpu_devices.read().await;

        let mut platform_devices = Vec::new();

        for device in cpu_devices.iter() {
            platform_devices.push(PublicDeviceCpuProperties {
                vendor: device.public_properties.vendor.clone(),
                name: device.public_properties.name.clone(),
                status: device.public_properties.status.clone(),
                parameters: device
                    .private_properties
                    .device_reader
                    .get_device_parameters(device.public_properties.parameters.clone())
                    .await
                    .ok(),
            });
        }

        Ok(platform_devices)
    }

    /// The system memory below which mining alongside everyday use gets uncomfortable.
    const RECOMMENDED_SYSTEM_MEMORY_MB: u64 = 16384;

    /// Records whether GPU mining is possible at all, and whether it should be on by default.
    ///
    /// These are separate questions. Whether a GPU *can* mine C29 is the miner's to answer, and
    /// a refusal forbids mining. Whether we *should* mine by default is ours, and a "no" only
    /// changes the default: a user who asks for GPU mining on a modest machine gets it.
    ///
    /// Conflating the two is how an integrated GPU ends up presented as a working miner, and
    /// how a capable card ends up disabled for living in a machine with 8 GB of RAM.
    pub async fn decide_if_gpu_mining_is_recommended(
        &self,
        devices: &[GpuCommonInformation],
    ) -> Result<(), Error> {
        let system = System::new_with_specifics(
            RefreshKind::new().with_memory(MemoryRefreshKind::everything()),
        );
        // sysinfo reports memory in bytes.
        let total_memory_mb = system.total_memory() / 1024 / 1024;
        let has_enough_system_memory = total_memory_mb >= Self::RECOMMENDED_SYSTEM_MEMORY_MB;

        info!(target: LOG_TARGET_APP_LOGIC, "System total memory: {total_memory_mb} MB");

        // Only an explicit refusal forbids mining. A device whose capability could not be
        // established stays usable. No device at all leaves nothing to mine on.
        let refusal = devices
            .iter()
            .find(|device| device.is_known_unmineable())
            .and_then(|device| device.unsupported_reason.clone());
        let is_available = devices.iter().any(GpuCommonInformation::can_mine);

        let should_recommend = is_available
            && has_enough_system_memory
            && devices
                .iter()
                .any(GpuCommonInformation::is_recommended_for_mining);

        if !is_available {
            if devices.is_empty() {
                info!(target: LOG_TARGET_APP_LOGIC, "No GPU detected, GPU mining is unavailable");
            } else {
                warn!(
                    target: LOG_TARGET_APP_LOGIC,
                    "No detected GPU can mine C29: {}",
                    refusal.as_deref().unwrap_or("no reason given")
                );
            }
            ConfigMining::update_field(ConfigMiningContent::set_gpu_mining_enabled, false).await?;
        }

        ConfigMining::update_field(ConfigMiningContent::set_gpu_mining_available, is_available)
            .await?;
        ConfigMining::update_field(
            ConfigMiningContent::set_gpu_mining_unavailable_reason,
            (!is_available).then_some(refusal).flatten(),
        )
        .await?;

        // A recommendation seeds the default. It must not overrule a user who has already
        // decided for themselves.
        let config = ConfigMining::content().await.clone();
        if !should_recommend && !*config.has_user_chosen_gpu_mining() {
            ConfigMining::update_field(ConfigMiningContent::set_gpu_mining_enabled, false).await?;
        }

        ConfigMining::update_field(
            ConfigMiningContent::set_is_gpu_mining_recommended,
            should_recommend,
        )
        .await?;
        EventsEmitter::emit_mining_config_loaded(&ConfigMining::content().await).await;

        Ok(())
    }

    pub fn current() -> &'static HardwareStatusMonitor {
        &INSTANCE
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_detect_cpu_vendor_amd() {
        assert_eq!(
            HardwareStatusMonitor::detect_cpu_vendor(
                "AuthenticAMD",
                "AMD Ryzen 9 5950X 16-Core Processor"
            ),
            HardwareVendor::Amd
        );
        assert_eq!(
            HardwareStatusMonitor::detect_cpu_vendor("", "AMD Ryzen 7 7800X3D"),
            HardwareVendor::Amd
        );
    }

    #[test]
    fn test_detect_cpu_vendor_intel() {
        assert_eq!(
            HardwareStatusMonitor::detect_cpu_vendor(
                "GenuineIntel",
                "12th Gen Intel(R) Core(TM) i7-12700K"
            ),
            HardwareVendor::Intel
        );
        assert_eq!(
            HardwareStatusMonitor::detect_cpu_vendor("", "Intel Core i9-13900K"),
            HardwareVendor::Intel
        );
    }

    #[test]
    fn test_detect_cpu_vendor_apple() {
        assert_eq!(
            HardwareStatusMonitor::detect_cpu_vendor("Apple", "Apple M2 Pro"),
            HardwareVendor::Apple
        );
        assert_eq!(
            HardwareStatusMonitor::detect_cpu_vendor("", "Apple M1 Max"),
            HardwareVendor::Apple
        );
    }

    #[test]
    fn test_detect_cpu_vendor_unknown() {
        #[cfg(not(target_os = "macos"))]
        assert_eq!(
            HardwareStatusMonitor::detect_cpu_vendor("GenericVendor", "GenericProcessor 1234"),
            HardwareVendor::Unknown
        );
    }

    #[test]
    fn test_detect_cpu_vendor_empty_and_whitespace() {
        #[cfg(not(target_os = "macos"))]
        {
            assert_eq!(
                HardwareStatusMonitor::detect_cpu_vendor("", ""),
                HardwareVendor::Unknown
            );
            assert_eq!(
                HardwareStatusMonitor::detect_cpu_vendor("   ", "   "),
                HardwareVendor::Unknown
            );
            assert_eq!(
                HardwareStatusMonitor::detect_cpu_vendor("\t", "\n"),
                HardwareVendor::Unknown
            );
        }
        #[cfg(all(target_os = "macos", target_arch = "aarch64"))]
        {
            assert_eq!(
                HardwareStatusMonitor::detect_cpu_vendor("", ""),
                HardwareVendor::Apple
            );
        }
    }

    #[test]
    fn test_detect_cpu_vendor_case_insensitivity() {
        // AMD variations
        assert_eq!(
            HardwareStatusMonitor::detect_cpu_vendor("authenticamd", "amd ryzen 5 5600x"),
            HardwareVendor::Amd
        );
        assert_eq!(
            HardwareStatusMonitor::detect_cpu_vendor("AUTHENTICAMD", "AMD RYZEN 5 5600X"),
            HardwareVendor::Amd
        );
        assert_eq!(
            HardwareStatusMonitor::detect_cpu_vendor("AuThEnTiCaMd", "aMd RyZeN 5 5600x"),
            HardwareVendor::Amd
        );

        // Intel variations
        assert_eq!(
            HardwareStatusMonitor::detect_cpu_vendor("genuineintel", "intel(r) core(tm) i5-10400"),
            HardwareVendor::Intel
        );
        assert_eq!(
            HardwareStatusMonitor::detect_cpu_vendor("GENUINEINTEL", "INTEL(R) CORE(TM) I5-10400"),
            HardwareVendor::Intel
        );
        assert_eq!(
            HardwareStatusMonitor::detect_cpu_vendor("GeNuInEiNtEl", "InTeL(R) cOrE(tM) i5-10400"),
            HardwareVendor::Intel
        );

        // Apple variations
        assert_eq!(
            HardwareStatusMonitor::detect_cpu_vendor("apple", "apple m3 pro"),
            HardwareVendor::Apple
        );
        assert_eq!(
            HardwareStatusMonitor::detect_cpu_vendor("APPLE", "APPLE M3 PRO"),
            HardwareVendor::Apple
        );
        assert_eq!(
            HardwareStatusMonitor::detect_cpu_vendor("ApPlE", "aPpLe M3 pRo"),
            HardwareVendor::Apple
        );
    }

    #[test]
    fn test_detect_cpu_vendor_exotic_brands() {
        #[cfg(not(target_os = "macos"))]
        {
            // VIA / Centaur
            assert_eq!(
                HardwareStatusMonitor::detect_cpu_vendor("CentaurHauls", "VIA Nano L2200"),
                HardwareVendor::Unknown
            );
            // Cyrix
            assert_eq!(
                HardwareStatusMonitor::detect_cpu_vendor("CyrixInstead", "Cyrix 6x86MX"),
                HardwareVendor::Unknown
            );
            // Qualcomm Snapdragon ARM
            assert_eq!(
                HardwareStatusMonitor::detect_cpu_vendor(
                    "Qualcomm",
                    "Snapdragon X Elite X1E-80-100"
                ),
                HardwareVendor::Unknown
            );
            // Ampere Altra ARM server
            assert_eq!(
                HardwareStatusMonitor::detect_cpu_vendor("Ampere", "Ampere Altra Max Q128-28"),
                HardwareVendor::Unknown
            );
            // Loongson MIPS/LoongArch
            assert_eq!(
                HardwareStatusMonitor::detect_cpu_vendor("Loongson", "Loongson-3A6000"),
                HardwareVendor::Unknown
            );
            // Zhaoxin x86
            assert_eq!(
                HardwareStatusMonitor::detect_cpu_vendor("Shanghai", "Zhaoxin KaiXian KX-U6780A"),
                HardwareVendor::Unknown
            );
            // RISC-V SiFive
            assert_eq!(
                HardwareStatusMonitor::detect_cpu_vendor("SiFive", "SiFive Freedom U740"),
                HardwareVendor::Unknown
            );
            // Hygon x86 (Dhyana) without amd in brand
            assert_eq!(
                HardwareStatusMonitor::detect_cpu_vendor(
                    "HygonGenuine",
                    "Hygon C86 7185 32-core Processor"
                ),
                HardwareVendor::Unknown
            );
        }
    }

    #[test]
    fn test_detect_cpu_vendor_unicode_and_extremes() {
        #[cfg(not(target_os = "macos"))]
        {
            // Non-ASCII Unicode characters
            assert_eq!(
                HardwareStatusMonitor::detect_cpu_vendor("Fujitsu", "A64FX-μArch"),
                HardwareVendor::Unknown
            );
            // Emojis and special chars
            assert_eq!(
                HardwareStatusMonitor::detect_cpu_vendor("!@#$%^&*()", "🔥 SuperChip ⚡"),
                HardwareVendor::Unknown
            );
            // Long strings
            let long_str = "x".repeat(10_000);
            assert_eq!(
                HardwareStatusMonitor::detect_cpu_vendor(&long_str, &long_str),
                HardwareVendor::Unknown
            );
        }

        // Long string containing vendor name
        let prefix = "a".repeat(500);
        let suffix = "b".repeat(500);
        assert_eq!(
            HardwareStatusMonitor::detect_cpu_vendor(
                &prefix,
                &format!("{prefix} amd ryzen {suffix}")
            ),
            HardwareVendor::Amd
        );
        assert_eq!(
            HardwareStatusMonitor::detect_cpu_vendor(
                &prefix,
                &format!("{prefix} intel core {suffix}")
            ),
            HardwareVendor::Intel
        );
        assert_eq!(
            HardwareStatusMonitor::detect_cpu_vendor(
                &prefix,
                &format!("{prefix} apple m3 {suffix}")
            ),
            HardwareVendor::Apple
        );
    }
}
