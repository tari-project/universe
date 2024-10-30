use std::sync::LazyLock;

use log::error;
use anyhow::Error;
use opencl3::context::Context;
use tokio::sync::RwLock;
use super::{cpu_reader::CpuReader, gpu_reader::GpuReader, opencl_engine::OpenCLEngine, parameters_reader_impl::{DeviceParameters, ParametersReader}};


const LOG_TARGET: &str = "tari::universe::auto_launcher";

static INSTANCE: LazyLock<Monitor> = LazyLock::new(Monitor::new);

#[derive(Debug , Clone)]
pub enum HardwareVendor {
    Nvidia,
    Amd,
    Intel,
    Apple,
}

impl HardwareVendor {
    pub fn to_string(&self) -> String {
        match self {
            HardwareVendor::Nvidia => "Nvidia".to_string(),
            HardwareVendor::Amd => "Amd".to_string(),
            HardwareVendor::Intel => "Intel".to_string(),
            HardwareVendor::Apple => "Apple".to_string(),
        }
    }

    pub fn is_nvidia(&self, vendor: &str) -> bool {
        vendor.to_lowercase().contains("nvidia")
    }

    pub fn is_amd(&self, vendor: &str) -> bool {
        vendor.to_lowercase().contains("amd")
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
            panic!("Unsupported hardware vendor");
        }
    }
}

#[derive(Debug, Clone)]
pub struct DeviceStatus {
    pub is_available: bool,
}

#[derive(Clone)]
pub struct PublicDeviceProperties {
    pub vendor: HardwareVendor,
    pub name: String,
    pub status: DeviceStatus,
    pub parameters: Option<DeviceParameters>,
}

#[derive(Clone)]
pub struct PrivateDeviceProperties {
    pub parameters_reader: Box<dyn ParametersReader>,
}

#[derive(Clone)]
pub struct DeviceProperties {
    pub public_properties: PublicDeviceProperties,
    pub private_properties: PrivateDeviceProperties,
}

pub struct Monitor {
    gpu_devices: RwLock<Vec<DeviceProperties>>,
    cpu_devices: RwLock<Vec<DeviceProperties>>,
}

impl Monitor {
    fn new() -> Self {
        Self {
            gpu_devices: RwLock::new(Vec::new()),
            cpu_devices: RwLock::new(Vec::new()),
        }
    }

    async fn initialize_gpu_devices(&self) -> Result<Vec<DeviceProperties>, Error> {
        let gpu_devices = OpenCLEngine::current().get_gpu_devices().await?;
        let mut platform_devices = Vec::new();

        for gpu_device in gpu_devices.iter() {
            let device_status = DeviceStatus {
                is_available: Context::from_device(gpu_device).is_ok(),
            };

            let vendor = HardwareVendor::from_string(&gpu_device.vendor()?);
            let platform_device = DeviceProperties {
                private_properties: PrivateDeviceProperties { parameters_reader: Box::new(GpuReader::new(vendor.clone())), },
                public_properties: PublicDeviceProperties {
                    vendor: vendor.clone(),
                    name: gpu_device.name()?,
                    status: device_status,
                    parameters: None,
                }
            };

            platform_devices.push(platform_device);
        }

        Ok(platform_devices)
    }

    async fn initialize_cpu_devices(&self) -> Result<Vec<DeviceProperties>, Error> {
        let cpu_devices = OpenCLEngine::current().get_cpu_devices().await?;
        let mut platform_devices = Vec::new();

        for cpu_device in cpu_devices.iter() {
            let device_status = DeviceStatus {
                is_available: Context::from_device(cpu_device).is_ok(),
            };

            let vendor = HardwareVendor::from_string(&cpu_device.vendor()?);
            let platform_device = DeviceProperties {
                private_properties: PrivateDeviceProperties { parameters_reader: Box::new(CpuReader::new(vendor.clone())), },
                public_properties: PublicDeviceProperties {
                    vendor: vendor.clone(),
                    name: cpu_device.name()?,
                    status: device_status,
                    parameters: None,
                }
            };
            platform_devices.push(platform_device);
        }

        Ok(platform_devices)
    }

    pub async fn initialize(&self) -> Result<(), Error> {
        let gpu_devices = self.initialize_gpu_devices().await?;
        let cpu_devices = self.initialize_cpu_devices().await?;

        let mut gpu_devices_lock = self.gpu_devices.write().await;
        let mut cpu_devices_lock = self.cpu_devices.write().await;
        
        *gpu_devices_lock = gpu_devices;
        *cpu_devices_lock = cpu_devices;

        Ok(())
    }

    pub async fn get_gpu_devices(&self) -> Result<Vec<DeviceProperties>, Error> {
        let gpu_devices = self.gpu_devices.read().await;
        Ok(gpu_devices.clone())
    }

    pub async fn get_cpu_devices(&self) -> Result<Vec<DeviceProperties>, Error> {
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
                parameters: device.private_properties.parameters_reader.get_device_parameters(device.public_properties.parameters.clone()).await.ok(),
            });
        };
        
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
                parameters: device.private_properties.parameters_reader.get_device_parameters(device.public_properties.parameters.clone()).await.ok(),
            });
        };
        
        Ok(platform_devices)   
    }

    pub fn current() -> &'static Monitor {
        &INSTANCE
    }
}