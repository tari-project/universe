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

use std::ops::DerefMut;

use anyhow::Error;
use async_trait::async_trait;
use sysinfo::{Component, Components, CpuRefreshKind, RefreshKind, System};

use crate::{
    hardware::hardware_status_monitor::DeviceParameters,
    utils::platform_utils::{CurrentOperatingSystem, PlatformUtils},
};

use super::CpuParametersReader;

#[derive(Clone)]
pub struct AppleCpuParametersReader {}

impl AppleCpuParametersReader {
    pub fn new() -> Self {
        Self {}
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
        let mut system =
            System::new_with_specifics(RefreshKind::new().with_cpu(CpuRefreshKind::everything()));
        let mut components = Components::new_with_refreshed_list();

        let available_cpu_components: Vec<&Component> = components
            .deref_mut()
            .iter()
            .filter(|c| c.label().contains("MTR"))
            .collect();

        let avarage_temperature = available_cpu_components
            .iter()
            .map(|c| c.temperature())
            .sum::<f32>()
            / available_cpu_components.len() as f32;

        std::thread::sleep(sysinfo::MINIMUM_CPU_UPDATE_INTERVAL);
        system.refresh_cpu_all();

        let usage = system.global_cpu_usage();

        let device_parameters = DeviceParameters {
            usage_percentage: usage,
            current_temperature: avarage_temperature,
            max_temperature: old_device_parameters.map_or(avarage_temperature, |old| {
                old.max_temperature.max(avarage_temperature)
            }),
        };

        Ok(device_parameters)
    }
}
