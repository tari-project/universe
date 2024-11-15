use anyhow::{anyhow, Error};
use async_trait::async_trait;
use log::{debug, error};
use nvml_wrapper::{enum_wrappers::device::TemperatureSensor, Nvml};

use crate::{
    hardware::hardware_status_monitor::DeviceParameters,
    utils::platform_utils::{CurrentOperatingSystem, PlatformUtils},
};

use super::GpuParametersReader;

#[derive(Clone)]
pub struct NvidiaGpuReader {}
impl NvidiaGpuReader {
    pub fn new() -> Self {
        Self {}
    }

    pub fn init_nvml(&self) -> Option<Nvml> {
        match Nvml::init() {
            Ok(nvml) => {
                debug!("Nvidia GPU reader initialized");
                Some(nvml)
            }
            Err(e) => {
                error!("Failed to initialize Nvidia GPU reader: {}", e);
                None
            }
        }
    }
}

#[async_trait]
impl GpuParametersReader for NvidiaGpuReader {
    fn get_is_reader_implemented(&self) -> bool {
        match PlatformUtils::detect_current_os() {
            CurrentOperatingSystem::Windows => self.init_nvml().is_some(),
            CurrentOperatingSystem::Linux => self.init_nvml().is_some(),
            CurrentOperatingSystem::MacOS => false,
        }
    }
    async fn get_device_parameters(
        &self,
        old_device_parameters: Option<DeviceParameters>,
    ) -> Result<DeviceParameters, Error> {
        let nvml = self
            .init_nvml()
            .ok_or(anyhow!("Failed to initialize Nvidia GPU reader"))?;
        // TODO ADD support for multiple GPUs
        let main_device = nvml
            .device_by_index(0)
            .map_err(|e| anyhow!("Failed to get Nvidia GPU device: {}", e))?;
        let usage_percentage = main_device
            .utilization_rates()
            .map_err(|e| anyhow!("Failed to get Nvidia GPU utilization rates: {}", e))?
            .gpu as f32;
        let current_temperature = main_device
            .temperature(TemperatureSensor::Gpu)
            .map_err(|e| anyhow!("Failed to get Nvidia GPU temperature: {}", e))?
            as f32;

        let device_parameters = DeviceParameters {
            usage_percentage,
            current_temperature,
            max_temperature: old_device_parameters.map_or(current_temperature, |old| {
                old.max_temperature.max(current_temperature)
            }),
        };
        Ok(device_parameters)
    }
}
