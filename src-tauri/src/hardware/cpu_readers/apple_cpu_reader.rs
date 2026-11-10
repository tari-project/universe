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

use std::sync::Arc;

use anyhow::Error;
use async_trait::async_trait;
use sysinfo::Component;
use tokio::sync::Mutex;

use crate::{
    hardware::hardware_status_monitor::DeviceParameters,
    utils::platform_utils::{CurrentOperatingSystem, PlatformUtils},
};

use super::{CpuParametersReader, CpuReaderState};

#[derive(Clone)]
pub struct AppleCpuParametersReader {
    state: Arc<Mutex<CpuReaderState>>,
}

impl AppleCpuParametersReader {
    pub fn new() -> Self {
        Self {
            state: Arc::new(Mutex::new(CpuReaderState::new())),
        }
    }

    #[allow(dead_code)]
    pub fn new_with_state(state: Arc<Mutex<CpuReaderState>>) -> Self {
        Self { state }
    }
}

impl Default for AppleCpuParametersReader {
    fn default() -> Self {
        Self::new()
    }
}

#[async_trait]
impl CpuParametersReader for AppleCpuParametersReader {
    fn get_is_reader_implemented(&self) -> bool {
        match PlatformUtils::detect_current_os() {
            CurrentOperatingSystem::Windows => false,
            CurrentOperatingSystem::Linux => false,
            CurrentOperatingSystem::MacOS => true,
        }
    }

    async fn get_device_parameters(
        &self,
        old_device_parameters: Option<DeviceParameters>,
    ) -> Result<DeviceParameters, Error> {
        let mut guard = self.state.lock().await;
        guard.system.refresh_cpu_usage();
        guard.components.refresh();

        let mut available_cpu_components: Vec<&Component> = guard
            .components
            .iter()
            .filter(|c| c.label().contains("MTR"))
            .collect();

        if available_cpu_components.is_empty() {
            available_cpu_components = guard
                .components
                .iter()
                .filter(|c| {
                    let label = c.label();
                    label.contains("CPU")
                        || label.contains("Die")
                        || label.to_lowercase().contains("pmu")
                })
                .collect();
        }

        let valid_temps: Vec<f32> = available_cpu_components
            .iter()
            .map(|c| c.temperature())
            .filter(|t| !t.is_nan())
            .collect();

        let average_temperature = if valid_temps.is_empty() {
            0.0
        } else {
            valid_temps.iter().sum::<f32>() / valid_temps.len() as f32
        };

        let usage = guard.system.global_cpu_usage();

        let device_parameters = DeviceParameters {
            usage_percentage: usage,
            current_temperature: average_temperature,
            max_temperature: old_device_parameters.map_or(average_temperature, |old| {
                old.max_temperature.max(average_temperature)
            }),
        };

        Ok(device_parameters)
    }
}
