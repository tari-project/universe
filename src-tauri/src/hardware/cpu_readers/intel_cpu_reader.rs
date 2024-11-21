use std::ops::Deref;

use anyhow::Error;
use async_trait::async_trait;
use sysinfo::{Component, Components, CpuRefreshKind, RefreshKind, System};

use crate::{
    hardware::hardware_status_monitor::DeviceParameters,
    utils::platform_utils::{CurrentOperatingSystem, PlatformUtils},
};

use super::CpuParametersReader;

#[derive(Clone)]
pub struct IntelCpuParametersReader {}

impl IntelCpuParametersReader {
    pub fn new() -> Self {
        Self {}
    }
}

#[async_trait]
impl CpuParametersReader for IntelCpuParametersReader {
    fn get_is_reader_implemented(&self) -> bool {
        match PlatformUtils::detect_current_os() {
            CurrentOperatingSystem::Windows => true,
            CurrentOperatingSystem::Linux => true,
            CurrentOperatingSystem::MacOS => true,
        }
    }

    async fn get_device_parameters(
        &self,
        old_device_parameters: Option<DeviceParameters>,
    ) -> Result<DeviceParameters, Error> {
        let mut system =
            System::new_with_specifics(RefreshKind::new().with_cpu(CpuRefreshKind::everything()));
        let components = Components::new_with_refreshed_list();

        let available_cpu_components: Vec<&Component> = match PlatformUtils::detect_current_os() {
            CurrentOperatingSystem::Windows => components
                .deref()
                .iter()
                .filter(|c| c.label().contains("Cpu"))
                .collect(),
            CurrentOperatingSystem::Linux => components
                .deref()
                .iter()
                .filter(|c| c.label().contains("Package"))
                .collect(),
            CurrentOperatingSystem::MacOS => components
                .deref()
                .iter()
                .filter(|c| c.label().contains("CPU"))
                .collect(),
        };

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
