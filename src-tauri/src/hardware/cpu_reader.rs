use std::ops::Deref;

use crate::hardware_monitor::HardwareParameters;

use super::{monitor::HardwareVendor, parameters_reader_impl::{DeviceParameters, ParametersReader}};

use anyhow::Error;
use async_trait::async_trait;
use sysinfo::{Component, Components, CpuRefreshKind, RefreshKind, System};

#[derive(Clone)]
pub struct CpuReader {
    vendor: HardwareVendor,
}

impl CpuReader {
    pub fn new(vendor: HardwareVendor) -> Self {
        Self {
            vendor
        }
    }

}

#[async_trait]
impl ParametersReader for CpuReader {
    async fn get_device_parameters(&self, old_device_parameters: Option<DeviceParameters> ) -> Result<DeviceParameters, Error> {
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



    // Windows
    // fn read_cpu_parameters(
    //     &self,
    //     current_parameters: Option<HardwareParameters>,
    // ) -> HardwareParameters {
    //     let mut system =
    //         System::new_with_specifics(RefreshKind::new().with_cpu(CpuRefreshKind::everything()));
    //     let components = Components::new_with_refreshed_list();
    //     let cpu_components: Vec<&Component> = components
    //         .deref()
    //         .iter()
    //         .filter(|c| c.label().contains("Cpu"))
    //         .collect();

    //     let avarage_temperature = cpu_components.iter().map(|c| c.temperature()).sum::<f32>()
    //         / cpu_components.len() as f32;

    //     // Wait a bit because CPU usage is based on diff.
    //     std::thread::sleep(sysinfo::MINIMUM_CPU_UPDATE_INTERVAL);
    //     system.refresh_cpu_all();

    //     let usage = system.global_cpu_usage();
    //     let label: String = match system.cpus().first() {
    //         Some(cpu) => cpu.brand().to_string(),
    //         None => {
    //             warn!("Failed to get CPU brand");
    //             "N/A".to_string()
    //         }
    //     };

    //     match current_parameters {
    //         Some(current_parameters) => HardwareParameters {
    //             label,
    //             usage_percentage: usage,
    //             current_temperature: avarage_temperature,
    //             max_temperature: current_parameters.max_temperature.max(avarage_temperature),
    //         },
    //         None => HardwareParameters {
    //             label,
    //             usage_percentage: usage,
    //             current_temperature: avarage_temperature,
    //             max_temperature: avarage_temperature,
    //         },
    //     }
    // }

    // Linux
    //     fn read_cpu_parameters(
    //     &self,
    //     current_parameters: Option<HardwareParameters>,
    // ) -> HardwareParameters {
    //     //TODO: Implement CPU usage for Linux
    //     let mut system =
    //         System::new_with_specifics(RefreshKind::new().with_cpu(CpuRefreshKind::everything()));
    //     let components = Components::new_with_refreshed_list();

    //     let intel_cpu_component: Vec<&Component> = components
    //         .deref()
    //         .iter()
    //         .filter(|c| c.label().contains("Package"))
    //         .collect();
    //     let amd_cpu_component: Vec<&Component> = components
    //         .deref()
    //         .iter()
    //         .filter(|c| c.label().contains("k10temp Tctl"))
    //         .collect();

    //     let available_cpu_components = if amd_cpu_component.is_empty() {
    //         intel_cpu_component
    //     } else {
    //         amd_cpu_component
    //     };

    //     let avarage_temperature = available_cpu_components
    //         .iter()
    //         .map(|c| c.temperature())
    //         .sum::<f32>()
    //         / available_cpu_components.len() as f32;

    //     // Wait a bit because CPU usage is based on diff.
    //     std::thread::sleep(sysinfo::MINIMUM_CPU_UPDATE_INTERVAL);
    //     system.refresh_cpu_all();

    //     let usage = system.global_cpu_usage();

    //     let label: String = match system.cpus().first() {
    //         Some(cpu) => cpu.brand().to_string(),
    //         None => {
    //             warn!("Failed to get CPU brand");
    //             "N/A".to_string()
    //         }
    //     };

    //     match current_parameters {
    //         Some(current_parameters) => HardwareParameters {
    //             label,
    //             usage_percentage: usage,
    //             current_temperature: avarage_temperature,
    //             max_temperature: current_parameters.max_temperature.max(avarage_temperature),
    //         },
    //         None => HardwareParameters {
    //             label,
    //             usage_percentage: usage,
    //             current_temperature: avarage_temperature,
    //             max_temperature: avarage_temperature,
    //         },
    //     }
    // }

    // Macos
    //     fn read_cpu_parameters(
    //     &self,
    //     current_parameters: Option<HardwareParameters>,
    // ) -> HardwareParameters {
    //     let mut system =
    //         System::new_with_specifics(RefreshKind::new().with_cpu(CpuRefreshKind::everything()));
    //     let components = Components::new_with_refreshed_list();

    //     let intel_cpu_components: Vec<&Component> = components
    //         .deref()
    //         .iter()
    //         .filter(|c| c.label().contains("CPU"))
    //         .collect();
    //     let silicon_cpu_components: Vec<&Component> = components
    //         .deref()
    //         .iter()
    //         .filter(|c| c.label().contains("MTR"))
    //         .collect();

    //     let available_cpu_components = if silicon_cpu_components.is_empty() {
    //         intel_cpu_components
    //     } else {
    //         silicon_cpu_components
    //     };

    //     let avarage_temperature = available_cpu_components
    //         .iter()
    //         .map(|c| c.temperature())
    //         .sum::<f32>()
    //         / available_cpu_components.len() as f32;

    //     // Wait a bit because CPU usage is based on diff.
    //     std::thread::sleep(sysinfo::MINIMUM_CPU_UPDATE_INTERVAL);
    //     system.refresh_cpu_all();

    //     let usage = system.global_cpu_usage();
    //     let label: String = match system.cpus().first() {
    //         Some(cpu) => cpu.brand().to_string() + " CPU",
    //         None => {
    //             warn!("Failed to get CPU brand");
    //             "N/A".to_string()
    //         }
    //     };

    //     match current_parameters {
    //         Some(current_parameters) => HardwareParameters {
    //             label,
    //             usage_percentage: usage,
    //             current_temperature: avarage_temperature,
    //             max_temperature: current_parameters.max_temperature.max(avarage_temperature),
    //         },
    //         None => HardwareParameters {
    //             label,
    //             usage_percentage: usage,
    //             current_temperature: avarage_temperature,
    //             max_temperature: avarage_temperature,
    //         },
    //     }
    // }
