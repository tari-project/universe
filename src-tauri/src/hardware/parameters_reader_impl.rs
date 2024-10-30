use anyhow::Error;
use async_trait::async_trait;
use dyn_clone::DynClone;

#[derive(Clone)]
pub struct DeviceParameters {
    pub usage_percentage: f32,
    pub current_temperature: f32,
    pub max_temperature: f32,
}

#[async_trait]
pub trait ParametersReader: Send + DynClone + Sync + 'static {
    // async fn get_device_current_usage(&self) -> Result<f32, Error>;
    // async fn get_device_current_temperature(&self) -> Result<f32, Error>;
    // async fn get_device_max_temperature(&self) -> Result<f32, Error>;
    async fn get_device_parameters(&self, old_device_parameters: Option<DeviceParameters>) -> Result<DeviceParameters, Error>;
}

dyn_clone::clone_trait_object!(ParametersReader);