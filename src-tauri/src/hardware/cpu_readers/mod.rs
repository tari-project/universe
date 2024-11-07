pub mod amd_cpu_reader;
pub mod apple_cpu_reader;
pub mod intel_cpu_reader;

use super::hardware_status_monitor::DeviceParameters;
use anyhow::Error;
use async_trait::async_trait;
use dyn_clone::DynClone;

#[async_trait]
pub trait CpuParametersReader: Send + DynClone + Sync + 'static {
    // async fn get_device_current_usage(&self) -> Result<f32, Error>;
    // async fn get_device_current_temperature(&self) -> Result<f32, Error>;
    // async fn get_device_max_temperature(&self) -> Result<f32, Error>;
    async fn get_device_parameters(
        &self,
        old_device_parameters: Option<DeviceParameters>,
    ) -> Result<DeviceParameters, Error>;
    fn get_is_reader_implemented(&self) -> bool;
}

#[derive(Clone)]
pub struct DefaultCpuParametersReader;

impl DefaultCpuParametersReader {
    #[allow(dead_code)]
    pub fn new() -> Self {
        Self {}
    }
}

#[async_trait]
impl CpuParametersReader for DefaultCpuParametersReader {
    fn get_is_reader_implemented(&self) -> bool {
        false
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

dyn_clone::clone_trait_object!(CpuParametersReader);
