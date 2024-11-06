use anyhow::{Error, Ok};
use async_trait::async_trait;

use crate::{
    hardware::hardware_status_monitor::DeviceParameters,
    utils::platform_utils::{CurrentOperatingSystem, PlatformUtils},
};

use super::GpuParametersReader;

#[derive(Clone)]
pub struct AppleGpuReader {}

impl AppleGpuReader {
    pub fn new() -> Self {
        Self {}
    }
}

#[async_trait]
impl GpuParametersReader for AppleGpuReader {
    fn get_is_reader_implemented(&self) -> bool {
        match PlatformUtils::detect_current_os() {
            CurrentOperatingSystem::Windows => false,
            CurrentOperatingSystem::Linux => false,
            CurrentOperatingSystem::MacOS => false,
        }
    }
    async fn get_device_parameters(
        &self,
        _old_device_parameters: Option<DeviceParameters>,
    ) -> Result<DeviceParameters, Error> {
        let device_parameters = DeviceParameters {
            usage_percentage: 0.0,
            current_temperature: 0.0,
            max_temperature: 0.0,
        };
        Ok(device_parameters)
    }
}
