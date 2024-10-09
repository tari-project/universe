use std::{ops::Deref, sync::LazyLock};

use log::{debug, warn};
use nvml_wrapper::{enum_wrappers::device::TemperatureSensor, Nvml};
use serde::Serialize;
use sysinfo::{Component, Components, CpuRefreshKind, RefreshKind, System};
use tokio::sync::RwLock;

const LOG_TARGET: &str = "tari::universe::hardware_monitor";
static INSTANCE: LazyLock<RwLock<HardwareMonitor>> =
    LazyLock::new(|| RwLock::new(HardwareMonitor::new()));

enum CurrentOperatingSystem {
    Windows,
    Linux,
    MacOS,
}

#[derive(Clone, Debug, Serialize)]
pub struct HardwareParameters {
    pub label: String,
    pub usage_percentage: f32,
    pub current_temperature: f32,
    pub max_temperature: f32,
}

impl Default for HardwareParameters {
    fn default() -> Self {
        HardwareParameters {
            label: "N/A".to_string(),
            usage_percentage: 0.0,
            current_temperature: 0.0,
            max_temperature: 0.0,
        }
    }
}

#[derive(Debug, Serialize, Clone)]
pub struct HardwareStatus {
    pub cpu: Option<HardwareParameters>,
    pub gpu: Option<HardwareParameters>,
}

trait HardwareMonitorImpl: Send + Sync + 'static {
    fn _get_implementation_name(&self) -> String;
    fn read_cpu_parameters(
        &self,
        current_parameters: Option<HardwareParameters>,
    ) -> HardwareParameters;
    fn read_gpu_parameters(
        &self,
        current_parameters: Option<HardwareParameters>,
    ) -> HardwareParameters;
    fn _log_all_components(&self);
}

pub struct HardwareMonitor {
    #[allow(dead_code)]
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
                CurrentOperatingSystem::Windows => Box::new(WindowsHardwareMonitor {
                    nvml: HardwareMonitor::initialize_nvml(),
                }),
                CurrentOperatingSystem::Linux => Box::new(LinuxHardwareMonitor {
                    nvml: HardwareMonitor::initialize_nvml(),
                }),
                CurrentOperatingSystem::MacOS => Box::new(MacOSHardwareMonitor {}),
            },
            cpu: None,
            gpu: None,
        }
    }

    pub fn current() -> &'static RwLock<HardwareMonitor> {
        &INSTANCE
    }

    fn initialize_nvml() -> Option<Nvml> {
        let nvml = Nvml::init();
        match nvml {
            Ok(nvml) => {
                debug!(target: LOG_TARGET, "NVML initialized");
                Some(nvml)
            }
            Err(e) => {
                warn!(target: LOG_TARGET, "Failed to initialize NVML: {}", e);
                None
            }
        }
    }

    fn detect_current_os() -> CurrentOperatingSystem {
        if cfg!(target_os = "windows") {
            CurrentOperatingSystem::Windows
        } else if cfg!(target_os = "linux") {
            CurrentOperatingSystem::Linux
        } else if cfg!(target_os = "macos") {
            CurrentOperatingSystem::MacOS
        } else {
            panic!("Unsupported OS");
        }
    }

    pub fn read_hardware_parameters(&mut self) -> HardwareStatus {
        // USED FOR DEBUGGING
        // println!("Reading hardware parameters for {}", self.current_implementation.get_implementation_name());
        // self.current_implementation.log_all_components();
        let cpu = Some(
            self.current_implementation
                .read_cpu_parameters(self.cpu.clone()),
        );
        let gpu = Some(
            self.current_implementation
                .read_gpu_parameters(self.gpu.clone()),
        );

        self.cpu = cpu.clone();
        self.gpu = gpu.clone();

        HardwareStatus { cpu, gpu }
    }
}

struct WindowsHardwareMonitor {
    nvml: Option<Nvml>,
}
impl HardwareMonitorImpl for WindowsHardwareMonitor {
    fn _get_implementation_name(&self) -> String {
        "Windows".to_string()
    }

    fn _log_all_components(&self) {
        let components = Components::new_with_refreshed_list();
        for component in components.deref() {
            println!(
                "Component: {} Temperature: {}",
                component.label(),
                component.temperature()
            );
        }
    }

    fn read_cpu_parameters(
        &self,
        current_parameters: Option<HardwareParameters>,
    ) -> HardwareParameters {
        let mut system =
            System::new_with_specifics(RefreshKind::new().with_cpu(CpuRefreshKind::everything()));
        let components = Components::new_with_refreshed_list();
        let cpu_components: Vec<&Component> = components
            .deref()
            .iter()
            .filter(|c| c.label().contains("Cpu"))
            .collect();

        let avarage_temperature = cpu_components.iter().map(|c| c.temperature()).sum::<f32>()
            / cpu_components.len() as f32;

        // Wait a bit because CPU usage is based on diff.
        std::thread::sleep(sysinfo::MINIMUM_CPU_UPDATE_INTERVAL);
        system.refresh_cpu_all();

        let usage = system.global_cpu_usage();
        let label: String = match system.cpus().first() {
            Some(cpu) => cpu.brand().to_string(),
            None => {
                warn!("Failed to get CPU brand");
                "N/A".to_string()
            }
        };

        match current_parameters {
            Some(current_parameters) => HardwareParameters {
                label,
                usage_percentage: usage,
                current_temperature: avarage_temperature,
                max_temperature: current_parameters.max_temperature.max(avarage_temperature),
            },
            None => HardwareParameters {
                label,
                usage_percentage: usage,
                current_temperature: avarage_temperature,
                max_temperature: avarage_temperature,
            },
        }
    }
    fn read_gpu_parameters(
        &self,
        current_parameters: Option<HardwareParameters>,
    ) -> HardwareParameters {
        let nvml = match &self.nvml {
            Some(nvml) => nvml,
            None => {
                return HardwareParameters {
                    label: "N/A".to_string(),
                    usage_percentage: 0.0,
                    current_temperature: 0.0,
                    max_temperature: 0.0,
                };
            }
        };

        let main_gpu = match nvml.device_by_index(0) {
            Ok(device) => device,
            Err(e) => {
                println!("Failed to get main GPU: {}", e);
                return HardwareParameters {
                    label: "N/A".to_string(),
                    usage_percentage: 0.0,
                    current_temperature: 0.0,
                    max_temperature: 0.0,
                };
            }
        };

        let current_temperature = main_gpu
            .temperature(TemperatureSensor::Gpu)
            .unwrap_or_default() as f32;
        let usage_percentage = match main_gpu.utilization_rates() {
            Ok(usage) => usage.gpu as f32,
            Err(e) => {
                warn!("Failed to get GPU usage: {}", e);
                0.0
            }
        };
        let label = main_gpu.name().unwrap_or_default();

        match current_parameters {
            Some(current_parameters) => HardwareParameters {
                label,
                usage_percentage,
                current_temperature,
                max_temperature: current_parameters.max_temperature.max(current_temperature),
            },
            None => HardwareParameters {
                label,
                usage_percentage,
                current_temperature,
                max_temperature: current_temperature,
            },
        }
    }
}

struct LinuxHardwareMonitor {
    nvml: Option<Nvml>,
}
impl HardwareMonitorImpl for LinuxHardwareMonitor {
    fn _get_implementation_name(&self) -> String {
        "Linux".to_string()
    }
    fn _log_all_components(&self) {
        let components = Components::new_with_refreshed_list();
        for component in components.deref() {
            println!(
                "Component: {} Temperature: {}",
                component.label(),
                component.temperature()
            );
        }
    }
    fn read_cpu_parameters(
        &self,
        current_parameters: Option<HardwareParameters>,
    ) -> HardwareParameters {
        //TODO: Implement CPU usage for Linux
        let mut system =
            System::new_with_specifics(RefreshKind::new().with_cpu(CpuRefreshKind::everything()));
        let components = Components::new_with_refreshed_list();

        let intel_cpu_component: Vec<&Component> = components
            .deref()
            .iter()
            .filter(|c| c.label().contains("Package"))
            .collect();
        let amd_cpu_component: Vec<&Component> = components
            .deref()
            .iter()
            .filter(|c| c.label().contains("k10temp Tctl"))
            .collect();

        let available_cpu_components = if amd_cpu_component.is_empty() {
            intel_cpu_component
        } else {
            amd_cpu_component
        };

        let avarage_temperature = available_cpu_components
            .iter()
            .map(|c| c.temperature())
            .sum::<f32>()
            / available_cpu_components.len() as f32;

        // Wait a bit because CPU usage is based on diff.
        std::thread::sleep(sysinfo::MINIMUM_CPU_UPDATE_INTERVAL);
        system.refresh_cpu_all();

        let usage = system.global_cpu_usage();

        let label: String = match system.cpus().first() {
            Some(cpu) => cpu.brand().to_string(),
            None => {
                warn!("Failed to get CPU brand");
                "N/A".to_string()
            }
        };

        match current_parameters {
            Some(current_parameters) => HardwareParameters {
                label,
                usage_percentage: usage,
                current_temperature: avarage_temperature,
                max_temperature: current_parameters.max_temperature.max(avarage_temperature),
            },
            None => HardwareParameters {
                label,
                usage_percentage: usage,
                current_temperature: avarage_temperature,
                max_temperature: avarage_temperature,
            },
        }
    }
    fn read_gpu_parameters(
        &self,
        current_parameters: Option<HardwareParameters>,
    ) -> HardwareParameters {
        let nvml: &Nvml = match &self.nvml {
            Some(nvml) => nvml,
            None => {
                println!("Failed to get NVML");
                return HardwareParameters {
                    label: "N/A".to_string(),
                    usage_percentage: 0.0,
                    current_temperature: 0.0,
                    max_temperature: 0.0,
                };
            }
        };

        let main_gpu = match nvml.device_by_index(0) {
            Ok(device) => device,
            Err(e) => {
                println!("Failed to get main GPU: {}", e);
                return HardwareParameters {
                    label: "N/A".to_string(),
                    usage_percentage: 0.0,
                    current_temperature: 0.0,
                    max_temperature: 0.0,
                };
            }
        };

        let current_temperature = main_gpu
            .temperature(TemperatureSensor::Gpu)
            .unwrap_or_default() as f32;
        let usage_percentage = match main_gpu.utilization_rates() {
            Ok(usage) => usage.gpu as f32,
            Err(e) => {
                warn!("Failed to get GPU usage: {}", e);
                0.0
            }
        };
        let label = main_gpu.name().unwrap_or_default();

        match current_parameters {
            Some(current_parameters) => HardwareParameters {
                label,
                usage_percentage,
                current_temperature,
                max_temperature: current_parameters.max_temperature.max(current_temperature),
            },
            None => HardwareParameters {
                label,
                usage_percentage,
                current_temperature,
                max_temperature: current_temperature,
            },
        }
    }
}

struct MacOSHardwareMonitor {}
impl HardwareMonitorImpl for MacOSHardwareMonitor {
    fn _get_implementation_name(&self) -> String {
        "MacOS".to_string()
    }
    fn _log_all_components(&self) {
        let components = Components::new_with_refreshed_list();
        for component in components.deref() {
            println!(
                "Component: {} Temperature: {}",
                component.label(),
                component.temperature()
            );
        }
    }
    fn read_cpu_parameters(
        &self,
        current_parameters: Option<HardwareParameters>,
    ) -> HardwareParameters {
        let mut system =
            System::new_with_specifics(RefreshKind::new().with_cpu(CpuRefreshKind::everything()));
        let components = Components::new_with_refreshed_list();

        let intel_cpu_components: Vec<&Component> = components
            .deref()
            .iter()
            .filter(|c| c.label().contains("CPU"))
            .collect();
        let silicon_cpu_components: Vec<&Component> = components
            .deref()
            .iter()
            .filter(|c| c.label().contains("MTR"))
            .collect();

        let available_cpu_components = if silicon_cpu_components.is_empty() {
            intel_cpu_components
        } else {
            silicon_cpu_components
        };

        let avarage_temperature = available_cpu_components
            .iter()
            .map(|c| c.temperature())
            .sum::<f32>()
            / available_cpu_components.len() as f32;

        // Wait a bit because CPU usage is based on diff.
        std::thread::sleep(sysinfo::MINIMUM_CPU_UPDATE_INTERVAL);
        system.refresh_cpu_all();

        let usage = system.global_cpu_usage();
        let label: String = match system.cpus().first() {
            Some(cpu) => cpu.brand().to_string() + " CPU",
            None => {
                warn!("Failed to get CPU brand");
                "N/A".to_string()
            }
        };

        match current_parameters {
            Some(current_parameters) => HardwareParameters {
                label,
                usage_percentage: usage,
                current_temperature: avarage_temperature,
                max_temperature: current_parameters.max_temperature.max(avarage_temperature),
            },
            None => HardwareParameters {
                label,
                usage_percentage: usage,
                current_temperature: avarage_temperature,
                max_temperature: avarage_temperature,
            },
        }
    }
    fn read_gpu_parameters(
        &self,
        current_parameters: Option<HardwareParameters>,
    ) -> HardwareParameters {
        let system = System::new_all();
        let components = Components::new_with_refreshed_list();
        let gpu_components: Vec<&Component> = components
            .deref()
            .iter()
            .filter(|c| c.label().contains("GPU"))
            .collect();

        let avarage_temperature = gpu_components.iter().map(|c| c.temperature()).sum::<f32>()
            / gpu_components.len() as f32;
        //TODO: Implement GPU usage for MacOS
        let usage = system.global_cpu_usage();
        let label: String = match system.cpus().first() {
            Some(cpu) => cpu.brand().to_string() + " GPU",
            None => {
                warn!("Failed to get GPU brand");
                "N/A".to_string()
            }
        };

        match current_parameters {
            Some(current_parameters) => HardwareParameters {
                label,
                usage_percentage: usage,
                current_temperature: avarage_temperature,
                max_temperature: current_parameters.max_temperature.max(avarage_temperature),
            },
            None => HardwareParameters {
                label,
                usage_percentage: usage,
                current_temperature: avarage_temperature,
                max_temperature: avarage_temperature,
            },
        }
    }
}
