use std::{ops::Deref, sync::LazyLock};

use log::info;
use nvml_wrapper::{enum_wrappers::device::TemperatureSensor, Nvml};
use sysinfo::{Component, Components, Cpu, CpuRefreshKind, RefreshKind, System};

const LOG_TARGET: &str = "tari::universe::hardware_monitor";
static INSTANCE: LazyLock<HardwareMonitor> = LazyLock::new(|| HardwareMonitor::new());

enum CurrentOperatingSystem {
    Windows,
    Linux,
    MacOS,
}

#[derive(Clone)]
pub struct HardwareParameters {
    label: String,
    usage_percentage: f32,
    current_temperature: f32,
    max_temperature: f32,
}


pub struct HardwareStatus {
    cpu: Option<HardwareParameters>,
    gpu: Option<HardwareParameters>,
}

trait HardwareMonitorImpl: Send + Sync + 'static{
    fn read_cpu_parameters(&self, current_parameters: Option<HardwareParameters>) -> HardwareParameters;
    fn read_gpu_parameters(&self, current_parameters: Option<HardwareParameters>) -> HardwareParameters;
    fn log_all_components(&self);
}

pub struct HardwareMonitor {
    current_os: CurrentOperatingSystem,
    current_implementation: Box<dyn HardwareMonitorImpl>,
    cpu: Option<HardwareParameters>,
    gpu: Option<HardwareParameters>,
}

impl HardwareMonitor {
    pub fn new() -> Self {
        HardwareMonitor {
            current_os: HardwareMonitor::detect_current_os(),
            current_implementation: match HardwareMonitor::detect_current_os() {
                CurrentOperatingSystem::Windows => Box::new(WindowsHardwareMonitor {nvml: HardwareMonitor::initialize_nvml()}),
                CurrentOperatingSystem::Linux => Box::new(LinuxHardwareMonitor {nvml: HardwareMonitor::initialize_nvml()}),
                CurrentOperatingSystem::MacOS => Box::new(MacOSHardwareMonitor {}),
            },
            cpu: None,
            gpu: None,
        }
    }

    pub fn current() -> &'static Self {
        &*INSTANCE
    }

    fn initialize_nvml() -> Option<Nvml> {
        let nvml = Nvml::init();
        match nvml {
            Ok(nvml) => {
                info!(target: LOG_TARGET, "NVML initialized");
                Some(nvml)
            }
            Err(e) => {
                info!(target: LOG_TARGET, "Failed to initialize NVML: {}", e);
                None
            }
        }
    }

    fn detect_current_os() -> CurrentOperatingSystem {
        if cfg!(target_os = "windows") {
            return CurrentOperatingSystem::Windows;
        } else if cfg!(target_os = "linux") {
            return CurrentOperatingSystem::Linux;
        } else if cfg!(target_os = "macos") {
            return CurrentOperatingSystem::MacOS;
        } else {
            panic!("Unsupported OS");
        }
    }

    pub fn read_hardware_parameters(&self) -> HardwareStatus {
        self.current_implementation.log_all_components();
        HardwareStatus {
            cpu: Some(self.current_implementation.read_cpu_parameters(self.cpu.clone())),
            gpu: Some(self.current_implementation.read_gpu_parameters(self.gpu.clone())),
        }
    }

}

struct WindowsHardwareMonitor {
    nvml: Option<Nvml>
}
impl HardwareMonitorImpl for WindowsHardwareMonitor {
    fn log_all_components(&self) {
        let components = Components::new_with_refreshed_list();
        for component in components.deref() {
            info!(target: LOG_TARGET, "Component: {} Temperature: {}", component.label(), component.temperature());
        }
    }

    fn read_cpu_parameters(&self, current_parameters:Option<HardwareParameters>) -> HardwareParameters {
        let system = System::new_all();
        let components = Components::new_with_refreshed_list();
        let cpu_components: Vec<&Component> = components.deref().iter().filter(|c| c.label().contains("Cpu")).collect();

        let avarage_temperature = cpu_components.iter().map(|c| c.temperature()).sum::<f32>() / cpu_components.len() as f32;
        let usage = system.global_cpu_usage();
        let label: String = system.cpus().get(0).unwrap().brand().to_string();

        match current_parameters {
            Some(current_parameters) => {
                HardwareParameters {
                    label,
                    usage_percentage: usage,
                    current_temperature: avarage_temperature,
                    max_temperature: current_parameters.max_temperature.max(avarage_temperature),
                }
            }
            None => {
                HardwareParameters {
                    label,
                    usage_percentage: usage,
                    current_temperature: avarage_temperature,
                    max_temperature: avarage_temperature,
                }
            }
        }
    }
    fn read_gpu_parameters(&self, current_parameters:Option<HardwareParameters>) -> HardwareParameters {
        let nvml = match &self.nvml {
            Some(nvml) => nvml,
            None => {
                return HardwareParameters {
                    label: "N/A".to_string(),
                    usage_percentage: 0.0,
                    current_temperature: 0.0,
                    max_temperature: 0.0,
                }
            }
        };

        let main_gpu = match nvml.device_by_index(0) {
            Ok(device) => device,
            Err(e) => {
                info!(target: LOG_TARGET, "Failed to get main GPU: {}", e);
                return HardwareParameters {
                    label: "N/A".to_string(),
                    usage_percentage: 0.0,
                    current_temperature: 0.0,
                    max_temperature: 0.0,
                };
            }
        };

        let current_temperature = f32::from_bits(main_gpu.temperature(TemperatureSensor::Gpu).unwrap());
        let usage_percentage = f32::from_bits(main_gpu.utilization_rates().unwrap().gpu);
        let label = main_gpu.name().unwrap();

        match current_parameters {
            Some(current_parameters) => {
                HardwareParameters {
                    label,
                    usage_percentage,
                    current_temperature,
                    max_temperature: current_parameters.max_temperature.max(current_temperature),
                }
            }
            None => {
                HardwareParameters {
                    label,
                    usage_percentage,
                    current_temperature,
                    max_temperature: current_temperature,
                }
            }
        }
    }
}

struct LinuxHardwareMonitor {
    nvml: Option<Nvml>
}
impl HardwareMonitorImpl for LinuxHardwareMonitor{
    fn log_all_components(&self) {
        let components = Components::new_with_refreshed_list();
        for component in components.deref() {
            info!(target: LOG_TARGET, "Component: {} Temperature: {}", component.label(), component.temperature());
        }
    }
    fn read_cpu_parameters(&self, current_parameters:Option<HardwareParameters>) -> HardwareParameters {
        let system = System::new_all();
        let components = Components::new_with_refreshed_list();
        let cpu_components: Vec<&Component> = components.deref().iter().filter(|c| c.label().contains("Core")).collect();

        let avarage_temperature = cpu_components.iter().map(|c| c.temperature()).sum::<f32>() / cpu_components.len() as f32;
        let usage = system.global_cpu_usage();
        let label: String = system.cpus().get(0).unwrap().brand().to_string();

        match current_parameters {
            Some(current_parameters) => {
                HardwareParameters {
                    label,
                    usage_percentage: usage,
                    current_temperature: avarage_temperature,
                    max_temperature: current_parameters.max_temperature.max(avarage_temperature),
                }
            }
            None => {
                HardwareParameters {
                    label,
                    usage_percentage: usage,
                    current_temperature: avarage_temperature,
                    max_temperature: avarage_temperature,
                }
            }
        }

    }
    fn read_gpu_parameters(&self, current_parameters:Option<HardwareParameters>) -> HardwareParameters {
        let nvml = match &self.nvml {
            Some(nvml) => nvml,
            None => {
                return HardwareParameters {
                    label: "N/A".to_string(),
                    usage_percentage: 0.0,
                    current_temperature: 0.0,
                    max_temperature: 0.0,
                }
            }
        };

        let main_gpu = match nvml.device_by_index(0) {
            Ok(device) => device,
            Err(e) => {
                info!(target: LOG_TARGET, "Failed to get main GPU: {}", e);
                return HardwareParameters {
                    label: "N/A".to_string(),
                    usage_percentage: 0.0,
                    current_temperature: 0.0,
                    max_temperature: 0.0,
                };
            }
        };

        let current_temperature = f32::from_bits(main_gpu.temperature(TemperatureSensor::Gpu).unwrap());
        let usage_percentage = f32::from_bits(main_gpu.utilization_rates().unwrap().gpu);
        let label = main_gpu.name().unwrap();

        match current_parameters {
            Some(current_parameters) => {
                HardwareParameters {
                    label,
                    usage_percentage,
                    current_temperature,
                    max_temperature: current_parameters.max_temperature.max(current_temperature),
                }
            }
            None => {
                HardwareParameters {
                    label,
                    usage_percentage,
                    current_temperature,
                    max_temperature: current_temperature,
                }
            }
        }

    }
}


struct MacOSHardwareMonitor {}
impl HardwareMonitorImpl for MacOSHardwareMonitor {
    fn log_all_components(&self) {
        let components = Components::new_with_refreshed_list();
        for component in components.deref() {
            info!(target: LOG_TARGET, "Component: {} Temperature: {}", component.label(), component.temperature());
        }
    }
    fn read_cpu_parameters(&self, current_parameters:Option<HardwareParameters>) -> HardwareParameters {
        let system = System::new_all();
        let components = Components::new_with_refreshed_list();
        let cpu_components: Vec<&Component> = components.deref().iter().filter(|c| c.label().contains("CPU")).collect();

        let avarage_temperature = cpu_components.iter().map(|c| c.temperature()).sum::<f32>() / cpu_components.len() as f32;
        let usage = system.global_cpu_usage();
        let label: String = system.cpus().get(0).unwrap().brand().to_string();

        match current_parameters {
            Some(current_parameters) => {
                HardwareParameters {
                    label,
                    usage_percentage: usage,
                    current_temperature: avarage_temperature,
                    max_temperature: current_parameters.max_temperature.max(avarage_temperature),
                }
            }
            None => {
                HardwareParameters {
                    label,
                    usage_percentage: usage,
                    current_temperature: avarage_temperature,
                    max_temperature: avarage_temperature,
                }
            }
        }
    }
    fn read_gpu_parameters(&self, current_parameters:Option<HardwareParameters>) -> HardwareParameters {
        let system = System::new_all();
        let components = Components::new_with_refreshed_list();
        let gpu_components: Vec<&Component> = components.deref().iter().filter(|c| c.label().contains("GPU")).collect();

        let avarage_temperature = gpu_components.iter().map(|c| c.temperature()).sum::<f32>() / gpu_components.len() as f32;
        let usage = system.global_cpu_usage();
        let label: String = system.cpus().get(0).unwrap().brand().to_string();

        match current_parameters {
            Some(current_parameters) => {
                HardwareParameters {
                    label,
                    usage_percentage: usage,
                    current_temperature: avarage_temperature,
                    max_temperature: current_parameters.max_temperature.max(avarage_temperature),
                }
            }
            None => {
                HardwareParameters {
                    label,
                    usage_percentage: usage,
                    current_temperature: avarage_temperature,
                    max_temperature: avarage_temperature,
                }
            }
        }
    }
}