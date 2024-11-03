pub mod amd_cpu_reader;
pub mod apple_cpu_reader;
pub mod intel_cpu_reader;

use super::monitor::{DeviceParameters, PublicDeviceProperties};
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

dyn_clone::clone_trait_object!(CpuParametersReader);
