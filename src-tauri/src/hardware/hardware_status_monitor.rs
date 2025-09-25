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
    configs::{
        config_mining::{ConfigMining, ConfigMiningContent},
        trait_config::ConfigImpl,
    },
    events_emitter::EventsEmitter,
    hardware::{cpu_readers::DefaultCpuParametersReader, gpu_readers::DefaultGpuParametersReader},
    mining::gpu::{interface::GpuMinerInterfaceTrait, manager::GpuManager, miners::GpuDeviceType},
    APPLICATION_FOLDER_ID,
};

use super::{
    cpu_readers::{
        amd_cpu_reader::AmdCpuParametersReader, apple_cpu_reader::AppleCpuParametersReader,
        intel_cpu_reader::IntelCpuParametersReader, CpuParametersReader,
    },
    gpu_readers::{
        amd_gpu_reader::AmdGpuReader, apple_gpu_reader::AppleGpuReader,
        intel_gpu_reader::IntelGpuReader, nvidia_gpu_reader::NvidiaGpuReader, GpuParametersReader,
    },
};
use anyhow::Error;
use log::{debug, error, info, warn};
use serde::{Deserialize, Serialize};
use sysinfo::{CpuRefreshKind, RefreshKind, System};
use tokio::sync::RwLock;

const LOG_TARGET: &str = "tari::universe::auto_launcher";

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
            error!(target: LOG_TARGET, "Unsupported hardware vendor: {vendor:?}");
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
            debug!(target: LOG_TARGET, "Loading gpu status from file: {file:?}");
            let content = tokio::fs::read_to_string(file).await?;
            let gpu_status: GpuStatusFileContent = serde_json::from_str(&content)?;
            Ok(gpu_status)
        } else {
            warn!(target: LOG_TARGET, "Gpu status file not found: {file:?}");
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
            debug!(target: LOG_TARGET, "GPU device name: {:?}", gpu_device.name);
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
                    //     debug!(target: LOG_TARGET, "Getting device parameters for: {:?}", gpu_device.device_name);
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

    async fn select_reader_for_cpu_device(
        &self,
        vendor: HardwareVendor,
    ) -> Box<dyn CpuParametersReader> {
        match vendor {
            HardwareVendor::Amd => Box::new(AmdCpuParametersReader::new()),
            HardwareVendor::Intel => Box::new(IntelCpuParametersReader::new()),
            HardwareVendor::Apple => Box::new(AppleCpuParametersReader::new()),
            _ => {
                warn!("Unsupported GPU vendor: {vendor:?}");
                Box::new(DefaultCpuParametersReader)
            }
        }
    }

    pub async fn initialize_cpu_devices(&self) -> Result<(), Error> {
        let system =
            System::new_with_specifics(RefreshKind::new().with_cpu(CpuRefreshKind::everything()));

        let mut cpu_devices = vec![];

        for cpu_device in system.cpus() {
            debug!(target: LOG_TARGET, "CPU brand: {:?}", cpu_device.brand());
            debug!(target: LOG_TARGET, "CPU vendor: {:?}", cpu_device.vendor_id());
            debug!(target: LOG_TARGET, "CPU model: {:?}", cpu_device.name());

            let vendor = HardwareVendor::Intel;
            let device_reader = self.select_reader_for_cpu_device(vendor.clone()).await;
            let platform_device = CpuDeviceProperties {
                private_properties: PrivateCpuDeviceProperties {
                    device_reader: device_reader.clone(),
                },
                public_properties: PublicDeviceCpuProperties {
                    vendor: vendor.clone(),
                    name: cpu_device.brand().to_string(),
                    status: DeviceStatus {
                        is_available: true,
                        is_reader_implemented: device_reader.clone().get_is_reader_implemented(),
                    },
                    parameters: None,
                    // parameters: if device_reader.clone().get_is_reader_implemented() {
                    //     device_reader.clone().get_device_parameters(None).await.ok()
                    // } else {
                    //     None
                    // },
                },
            };

            cpu_devices.push(platform_device);
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

    // This method will decide if gpu mining is recommended by which we mean if it should be enabled by default in config mining
    // It will have two steps verification:
    // Checking raw_detected_devices in graxil which includes device_type ( INTEGRATED or DEDICATED )
    // Checking system memory with sysinfo
    // If there is at least one dedicated gpu and system memory is above 16GB we recommend enabling gpu mining
    pub async fn decide_if_gpu_mining_is_recommended(&self) -> Result<(), Error> {
        let mut is_dedicated_gpu_found = false;
        let mut is_system_memory_above_16gb = false;

        if let Ok(mut graxil_interface) = GpuManager::write().await.get_raw_graxil_miner() {
            // TODO remove that extra detection step when miners will persist their state
            graxil_interface.detect_devices().await?;
            let raw_devices = graxil_interface.get_raw_gpu_devices();
            info!(target: LOG_TARGET, "Raw detected GPU devices: {:?}", raw_devices);
            for device in raw_devices {
                if device.device_type == GpuDeviceType::Dedicated {
                    is_dedicated_gpu_found = true;
                }
            }
        }

        let system = System::new_all();
        let total_memory_mb = system.total_memory() / 1024; // Convert KB to MB
        if total_memory_mb >= 16384 {
            is_system_memory_above_16gb = true;
        }

        info!(target: LOG_TARGET, "System total memory: {} MB", total_memory_mb);
        info!(target: LOG_TARGET, "Is dedicated GPU found: {}", is_dedicated_gpu_found);

        let is_gpu_mining_recommended = *ConfigMining::content().await.is_gpu_mining_recommended();
        let should_recommend_gpu_mining = is_dedicated_gpu_found || is_system_memory_above_16gb;

        // is_gpu_mining_recommended is by default true on first run
        // This check handles first time check and cases when something change on the machine which caused to gpu not work
        // If there is change from recommended to not recommended we turn off gpu mining
        if is_gpu_mining_recommended && !should_recommend_gpu_mining {
            ConfigMining::update_field(ConfigMiningContent::set_gpu_mining_enabled, false).await?;
        }

        // Always update the recommendation flag
        ConfigMining::update_field(
            ConfigMiningContent::set_is_gpu_mining_recommended,
            should_recommend_gpu_mining,
        )
        .await?;
        EventsEmitter::emit_mining_config_loaded(&ConfigMining::content().await).await;

        Ok(())
    }

    pub fn current() -> &'static HardwareStatusMonitor {
        &INSTANCE
    }
}
