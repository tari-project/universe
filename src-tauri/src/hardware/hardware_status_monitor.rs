use std::{path::PathBuf, sync::LazyLock};

use crate::{
    hardware::{cpu_readers::DefaultCpuParametersReader, gpu_readers::DefaultGpuParametersReader},
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
use log::{error, info, warn};
use serde::{Deserialize, Serialize};
use sysinfo::{CpuRefreshKind, RefreshKind, System};
use tokio::sync::RwLock;

const LOG_TARGET: &str = "tari::universe::auto_launcher";

static INSTANCE: LazyLock<HardwareStatusMonitor> = LazyLock::new(HardwareStatusMonitor::new);

#[derive(Debug, Serialize, Clone, Default)]
pub enum HardwareVendor {
    Nvidia,
    Amd,
    Intel,
    Apple,
    #[default]
    Unknown,
}

impl HardwareVendor {
    #[allow(clippy::inherent_to_string)]
    pub fn to_string(&self) -> String {
        match self {
            HardwareVendor::Nvidia => "Nvidia".to_string(),
            HardwareVendor::Amd => "Amd".to_string(),
            HardwareVendor::Intel => "Intel".to_string(),
            HardwareVendor::Apple => "Apple".to_string(),
            HardwareVendor::Unknown => "Unknown".to_string(),
        }
    }

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
            error!(target: LOG_TARGET, "Unsupported hardware vendor: {:?}", vendor);
            HardwareVendor::Unknown
        }
    }
}

#[derive(Debug, Deserialize, Clone, Default)]
struct GpuStatusFileContent {
    gpu_devices: Vec<GpuStatusFileEntry>,
}

#[derive(Debug, Deserialize, Clone, Default)]
struct GpuStatusFileEntry {
    is_available: bool,
    device_name: String,
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
pub struct PublicDeviceProperties {
    pub vendor: HardwareVendor,
    pub name: String,
    pub status: DeviceStatus,
    pub parameters: Option<DeviceParameters>,
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
    pub public_properties: PublicDeviceProperties,
    pub private_properties: PrivateCpuDeviceProperties,
}
#[derive(Clone)]
pub struct GpuDeviceProperties {
    pub public_properties: PublicDeviceProperties,
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
            .join(APPLICATION_FOLDER_ID)
            .join("gpuminer")
            .join("gpu_status.json");
        if file.exists() {
            info!(target: LOG_TARGET, "Loading gpu status from file: {:?}", file);
            let content = tokio::fs::read_to_string(file).await?;
            let gpu_status: GpuStatusFileContent = serde_json::from_str(&content)?;
            Ok(gpu_status)
        } else {
            warn!(target: LOG_TARGET, "Gpu status file not found: {:?}", file);
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
                warn!("Unsupported GPU vendor: {:?}", vendor);
                Box::new(DefaultGpuParametersReader)
            }
        }
    }

    async fn initialize_gpu_devices(
        &self,
        config_dir: PathBuf,
    ) -> Result<Vec<GpuDeviceProperties>, Error> {
        let gpu_status_file_content = self.load_gpu_devices_from_status_file(config_dir).await?;
        let mut platform_devices = Vec::new();

        for gpu_device in &gpu_status_file_content.gpu_devices {
            info!(target: LOG_TARGET, "GPU device name: {:?}", gpu_device.device_name);
            let vendor = HardwareVendor::from_string(&gpu_device.device_name);
            let device_reader = self.select_reader_for_gpu_device(vendor.clone()).await;
            let platform_device = GpuDeviceProperties {
                private_properties: PrivateGpuDeviceProperties {
                    device_reader: device_reader.clone(),
                },
                public_properties: PublicDeviceProperties {
                    vendor: vendor.clone(),
                    name: gpu_device.device_name.clone(),
                    status: DeviceStatus {
                        is_available: gpu_device.is_available,
                        is_reader_implemented: device_reader.clone().get_is_reader_implemented(),
                    },
                    parameters: None,
                    // parameters: if device_reader.clone().get_is_reader_implemented() {
                    //     info!(target: LOG_TARGET, "Getting device parameters for: {:?}", gpu_device.device_name);
                    //     device_reader.clone().get_device_parameters(None).await.ok()
                    // } else {
                    //     None
                    // },
                },
            };

            platform_devices.push(platform_device);
        }

        Ok(platform_devices)
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
                warn!("Unsupported GPU vendor: {:?}", vendor);
                Box::new(DefaultCpuParametersReader)
            }
        }
    }

    async fn initialize_cpu_devices(&self) -> Result<Vec<CpuDeviceProperties>, Error> {
        let system =
            System::new_with_specifics(RefreshKind::new().with_cpu(CpuRefreshKind::everything()));

        let mut cpu_devices = vec![];

        for cpu_device in system.cpus() {
            info!(target: LOG_TARGET, "CPU brand: {:?}", cpu_device.brand());
            info!(target: LOG_TARGET, "CPU vendor: {:?}", cpu_device.vendor_id());
            info!(target: LOG_TARGET, "CPU model: {:?}", cpu_device.name());

            let vendor = HardwareVendor::Intel;
            let device_reader = self.select_reader_for_cpu_device(vendor.clone()).await;
            let platform_device = CpuDeviceProperties {
                private_properties: PrivateCpuDeviceProperties {
                    device_reader: device_reader.clone(),
                },
                public_properties: PublicDeviceProperties {
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

        Ok(cpu_devices)
    }

    pub async fn initialize(&self, config_dir: PathBuf) -> Result<(), Error> {
        let gpu_devices = self.initialize_gpu_devices(config_dir).await?;
        let cpu_devices = self.initialize_cpu_devices().await?;

        let mut gpu_devices_lock = self.gpu_devices.write().await;
        let mut cpu_devices_lock = self.cpu_devices.write().await;

        *gpu_devices_lock = gpu_devices;
        *cpu_devices_lock = cpu_devices;

        Ok(())
    }

    #[allow(dead_code)]
    pub async fn get_gpu_devices(&self) -> Result<Vec<GpuDeviceProperties>, Error> {
        let gpu_devices = self.gpu_devices.read().await;
        Ok(gpu_devices.clone())
    }

    pub async fn get_gpu_devices_public_properties(
        &self,
    ) -> Result<Vec<PublicDeviceProperties>, Error> {
        let gpu_devices = self.gpu_devices.read().await;

        let mut platform_devices = Vec::new();

        for device in gpu_devices.iter() {
            platform_devices.push(device.public_properties.clone());
        }

        Ok(platform_devices)
    }

    #[allow(dead_code)]
    pub async fn get_cpu_devices(&self) -> Result<Vec<CpuDeviceProperties>, Error> {
        let cpu_devices = self.cpu_devices.read().await;
        Ok(cpu_devices.clone())
    }

    pub async fn get_gpu_public_properties(&self) -> Result<Vec<PublicDeviceProperties>, Error> {
        let gpu_devices = self.gpu_devices.read().await;

        let mut platform_devices = Vec::new();

        for device in gpu_devices.iter() {
            platform_devices.push(PublicDeviceProperties {
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

    pub async fn get_cpu_public_properties(&self) -> Result<Vec<PublicDeviceProperties>, Error> {
        let cpu_devices = self.cpu_devices.read().await;

        let mut platform_devices = Vec::new();

        for device in cpu_devices.iter() {
            platform_devices.push(PublicDeviceProperties {
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

    pub fn current() -> &'static HardwareStatusMonitor {
        &INSTANCE
    }
}
