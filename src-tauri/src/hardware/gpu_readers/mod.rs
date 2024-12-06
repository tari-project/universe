// Copyright 2024. The Tari Project
//
// Redistribution and use in source and binary forms, with or without modification, are permitted provided that the
// following conditions are met:
//
// 1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following
// disclaimer.
//
// 2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the
// following disclaimer in the documentation and/or other materials provided with the distribution.
//
// 3. Neither the name of the copyright holder nor the names of its contributors may be used to endorse or promote
// products derived from this software without specific prior written permission.
//
// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES,
// INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
// DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
// SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
// SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
// WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE
// USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

pub mod amd_gpu_reader;
pub mod apple_gpu_reader;
pub mod intel_gpu_reader;
pub mod nvidia_gpu_reader;

use anyhow::Error;
use async_trait::async_trait;
use dyn_clone::DynClone;

use super::hardware_status_monitor::DeviceParameters;

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

#[derive(Clone)]
pub struct DefaultGpuParametersReader;

impl DefaultGpuParametersReader {
    #[allow(dead_code)]
    pub fn new() -> Self {
        Self {}
    }
}

#[async_trait]
impl GpuParametersReader for DefaultGpuParametersReader {
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

dyn_clone::clone_trait_object!(GpuParametersReader);
