use super::{gpu_parameters_reader_impl::GpuParametersReader, monitor::{DeviceParameters, HardwareVendor}};

use anyhow::{Error, Ok};
use async_trait::async_trait;

#[derive(Clone)]
pub struct GpuReader {
    vendor: HardwareVendor
}

impl GpuReader {
    pub fn new(vendor: HardwareVendor) -> Self {
        Self {
            vendor
        }
    }
}

#[async_trait]
impl GpuParametersReader for GpuReader {
    async fn get_device_parameters(&self, old_device_parameters: Option<DeviceParameters>) -> Result<DeviceParameters, Error> {
        let device_parameters = DeviceParameters {
            usage_percentage: 0.0,
            current_temperature: 0.0,
            max_temperature: 0.0,
        };
        Ok(device_parameters)
    }
    // async fn get_device_current_usage(&self) -> Result<f32, Error> {
    //     Ok(0.0)
    // }

    // async fn get_device_current_temperature(&self) -> Result<f32, Error> {
    //     Ok(0.0)
    // }

    // async fn get_device_max_temperature(&self) -> Result<f32, Error> {
    //     Ok(0.0)
    // }
}
