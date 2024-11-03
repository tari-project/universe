pub mod amd_gpu_reader;
pub mod apple_gpu_reader;
pub mod intel_gpu_reader;
pub mod nvidia_gpu_reader;

use anyhow::Error;
use async_trait::async_trait;
use dyn_clone::DynClone;

use super::monitor::DeviceParameters;

#[async_trait]
pub trait GpuParametersReader: Send + DynClone + Sync + 'static {
    // async fn get_device_current_usage(&self) -> Result<f32, Error>;
    // async fn get_device_current_temperature(&self) -> Result<f32, Error>;
    // async fn get_device_max_temperature(&self) -> Result<f32, Error>;
    async fn get_device_parameters(
        &self,
        old_device_parameters: Option<DeviceParameters>,
    ) -> Result<DeviceParameters, Error>;
    fn get_is_reader_implemented(&self) -> bool;
}

dyn_clone::clone_trait_object!(GpuParametersReader);
