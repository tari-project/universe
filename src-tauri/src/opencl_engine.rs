use std::sync::{LazyLock};

use anyhow::{anyhow, Error, Ok};
use log::{debug, error, info, trace, warn};
use opencl3::{
    device::{ Device, CL_DEVICE_TYPE_CPU, CL_DEVICE_TYPE_GPU,CL_DEVICE_TYPE_ALL }, platform::{get_platforms, platform, Platform}
};
use tokio::sync::RwLock;

const LOG_TARGET: &str = "tari::universe::oopencl_engine";
static INSTANCE: LazyLock<OpenCLEngine> = LazyLock::new(OpenCLEngine::new); 

pub struct OpenCLEngine {
    platforms: Vec<Platform>,
    gpu_devices: RwLock<Vec<Device>>,
    cpu_devices: RwLock<Vec<Device>>,
}

impl OpenCLEngine {
    pub fn new() -> Self {
        let platforms:Vec<Platform> = get_platforms().unwrap_or_default();
        let gpu_devices:RwLock<Vec<Device>> = RwLock::new(Vec::new());
        let cpu_devices:RwLock<Vec<Device>> = RwLock::new(Vec::new());

        Self {
            platforms,
            gpu_devices,
            cpu_devices
        }
    }


    async fn populate_devices(&self) -> Result<(), Error> {

        let mut gpu_devices_lock = self.gpu_devices.write().await;
        let mut cpu_devices_lock = self.cpu_devices.write().await;

        info!(target: LOG_TARGET, "Iterating over platforms, found {:?}", self.platforms.len());

        for platform in self.platforms.iter() {
            info!(target: LOG_TARGET, "Processing platform: {:?}", platform.name()?);
            info!(target: LOG_TARGET, "Platform profile: {:?}", platform.profile()?);
            info!(target: LOG_TARGET, "Platform version: {:?}", platform.version()?);
            info!(target: LOG_TARGET, "Platform vendor: {:?}", platform.vendor()?);
            info!(target: LOG_TARGET, "Platform extensions: {:?}", platform.extensions()?);
            
            info!(target: LOG_TARGET, "Iterating over gpu devices");
            let gpu_devices = platform.get_devices(CL_DEVICE_TYPE_GPU)?;
            for gpu_device_raw in gpu_devices.iter() {
                let gpu_device = Device::new(gpu_device_raw.clone());
                info!(target: LOG_TARGET, "Found GPU device: {:?} with id {:?}", gpu_device.name()?, gpu_device.id());
                gpu_devices_lock.push(gpu_device);
            }

            info!(target: LOG_TARGET, "Iterating over cpu devices");
            let cpu_devices = platform.get_devices(CL_DEVICE_TYPE_CPU)?;
            for cpu_device_raw in cpu_devices.iter() {
                let cpu_device = Device::new(cpu_device_raw.clone());
                info!(target: LOG_TARGET, "Found CPU device: {:?} with id {:?}", cpu_device.name()?, cpu_device.id()); 
                cpu_devices_lock.push(cpu_device);
            }

            let custom_devices = platform.get_devices(CL_DEVICE_TYPE_ALL)?;
            for custom_device_raw in custom_devices.iter() {
                let custom_device = Device::new(custom_device_raw.clone());
                info!(target: LOG_TARGET, "Found custom device: {:?} with id {:?}", custom_device.name()?, custom_device.id()); 
            }
        }
        Ok(())
    }


    pub async  fn initialize(&self) -> Result<(), Error> {
        self.populate_devices().await?;
        Ok(())
    }

    pub fn current() -> &'static OpenCLEngine {
        &INSTANCE
    }

}