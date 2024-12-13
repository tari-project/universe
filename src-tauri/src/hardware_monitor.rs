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

use std::{fs, ops::Deref, path::PathBuf, sync::LazyLock};

use anyhow::anyhow;
use log::{debug, trace, warn};
use nvml_wrapper::{enum_wrappers::device::TemperatureSensor, Nvml};
use serde::{Deserialize, Serialize};
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

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct GpuStatus {
    pub device_name: String,
    pub is_available: bool,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct GpuStatusFile {
    pub gpu_devices: Vec<GpuStatus>,
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
    pub gpu: Vec<HardwareParameters>,
}

trait HardwareMonitorImpl: Send + Sync + 'static {
    fn _get_implementation_name(&self) -> String;
    fn read_cpu_parameters(
        &self,
        current_parameters: Option<HardwareParameters>,
    ) -> HardwareParameters;
    fn read_gpu_parameters(
        &self,
        current_parameters: Vec<HardwareParameters>,
    ) -> Vec<HardwareParameters>;
    fn read_gpu_devices(&self) -> Vec<GpuStatus>;
    fn load_status_file(&mut self, config_path: PathBuf) -> Result<(), anyhow::Error>;
    fn _log_all_components(&self);
}

pub struct HardwareMonitor {
    #[allow(dead_code)]
    current_os: CurrentOperatingSystem,
    current_implementation: Box<dyn HardwareMonitorImpl>,
    cpu: Option<HardwareParameters>,
    gpu: Vec<HardwareParameters>,
    gpu_devices: Vec<GpuStatus>,
}

#[allow(dead_code)]
impl HardwareMonitor {
    pub fn new() -> Self {
        HardwareMonitor {
            current_os: HardwareMonitor::detect_current_os(),
            current_implementation: match HardwareMonitor::detect_current_os() {
                CurrentOperatingSystem::Windows => Box::new(WindowsHardwareMonitor {
                    nvml: HardwareMonitor::initialize_nvml(),
                    gpu_status_file: None,
                }),
                CurrentOperatingSystem::Linux => Box::new(LinuxHardwareMonitor {
                    nvml: HardwareMonitor::initialize_nvml(),
                    gpu_status_file: None,
                }),
                CurrentOperatingSystem::MacOS => Box::new(MacOSHardwareMonitor {
                    gpu_status_file: None,
                }),
            },
            cpu: None,
            gpu: vec![],
            gpu_devices: vec![],
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
        // println!("Reading hardware parameters for {}", self.current_implementation._get_implementation_name());
        // self.current_implementation._log_all_components();
        let cpu = Some(
            self.current_implementation
                .read_cpu_parameters(self.cpu.clone()),
        );
        let gpu = self
            .current_implementation
            .read_gpu_parameters(self.gpu.clone());

        self.cpu = cpu.clone();
        self.gpu = gpu.clone();

        HardwareStatus { cpu, gpu }
    }

    pub fn read_gpu_devices(&mut self) -> Vec<GpuStatus> {
        let gpu_dev = self.current_implementation.read_gpu_devices();
        self.gpu_devices = gpu_dev.clone();
        gpu_dev
    }
    pub fn load_status_file(&mut self, config_path: PathBuf) -> Result<(), anyhow::Error> {
        match self.current_implementation.load_status_file(config_path) {
            Ok(_) => {
                trace!(target: LOG_TARGET, "Gpu status file loaded successfully");
                Ok(())
            }
            Err(e) => Err(anyhow!("Fail to load gpu status file: {:?}", e)),
        }
    }
}

#[allow(dead_code)]
struct WindowsHardwareMonitor {
    nvml: Option<Nvml>,
    gpu_status_file: Option<PathBuf>,
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
        current_parameters: Vec<HardwareParameters>,
    ) -> Vec<HardwareParameters> {
        let mut gpu_devices = vec![];
        let nvml = match &self.nvml {
            Some(nvml) => nvml,
            None => {
                return gpu_devices;
            }
        };

        let num_of_devices = nvml.device_count().unwrap_or_else(|e| {
            println!("Failed to get number of GPU devices: {}", e);
            0
        });
        for i in 0..num_of_devices {
            let current_gpu = match nvml.device_by_index(i) {
                Ok(device) => device,
                Err(e) => {
                    println!("Failed to get main GPU: {}", e);
                    continue; // skip to the next iteration
                }
            };

            let current_temperature = current_gpu
                .temperature(TemperatureSensor::Gpu)
                .unwrap_or_default() as f32;
            let usage_percentage = current_gpu
                .utilization_rates()
                .map(|e| e.gpu)
                .unwrap_or_default() as f32;
            let label = current_gpu.name().unwrap_or_else(|_e| "N/A".to_string());

            let max_temperature = match current_parameters.get(i as usize) {
                Some(current_parameters) => {
                    current_parameters.max_temperature.max(current_temperature)
                }
                None => current_temperature,
            };

            gpu_devices.push(HardwareParameters {
                label,
                usage_percentage,
                current_temperature,
                max_temperature,
            });
        }
        gpu_devices
    }
    fn read_gpu_devices(&self) -> Vec<GpuStatus> {
        let file = self.gpu_status_file.clone();
        let mut gpu_devices = vec![];

        if let Some(file_path) = file {
            let gpu_status_file = match fs::read_to_string(file_path) {
                Ok(f) => f,
                Err(e) => {
                    warn!(target: LOG_TARGET, "Failed to read gpu status file: {}", e);
                    return gpu_devices;
                }
            };
            match serde_json::from_str::<GpuStatusFile>(&gpu_status_file) {
                Ok(gpu) => gpu_devices = gpu.gpu_devices,
                Err(e) => {
                    warn!(target: LOG_TARGET, "Failed to parse gpu status: {:?}", e);
                }
            }
        }
        gpu_devices
    }
    fn load_status_file(&mut self, config_path: PathBuf) -> Result<(), anyhow::Error> {
        let file: PathBuf = config_path.join("gpuminer").join("gpu_status.json");
        if file.exists() {
            self.gpu_status_file = Some(file.clone());
            trace!(target: LOG_TARGET, "Loading gpu status from file: {:?}", file);
        } else {
            debug!(target: LOG_TARGET, "Gpu status file does not exist or is corrupt");
        }
        Ok(())
    }
}

#[allow(dead_code)]
struct LinuxHardwareMonitor {
    nvml: Option<Nvml>,
    gpu_status_file: Option<PathBuf>,
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
        current_parameters: Vec<HardwareParameters>,
    ) -> Vec<HardwareParameters> {
        let mut gpu_devices: Vec<HardwareParameters> = vec![];
        let nvml = match &self.nvml {
            Some(nvml) => nvml,
            None => {
                // on linux use json file only if nvml not found
                let gpus = self.read_gpu_devices();
                for gpu in gpus {
                    gpu_devices.push(HardwareParameters {
                        label: gpu.device_name.clone(),
                        usage_percentage: 0.0,
                        current_temperature: 0.0,
                        max_temperature: 0.0,
                    });
                }
                return gpu_devices;
            }
        };

        let num_of_devices = nvml.device_count().unwrap_or_else(|e| {
            println!("Failed to get number of GPU devices: {}", e);
            0
        });
        for i in 0..num_of_devices {
            let current_gpu = match nvml.device_by_index(i) {
                Ok(device) => device,
                Err(e) => {
                    println!("Failed to get gpu devices: {}", e);
                    continue; // skip to the next iteration
                }
            };

            let current_temperature = current_gpu
                .temperature(TemperatureSensor::Gpu)
                .unwrap_or_default() as f32;
            let usage_percentage = current_gpu
                .utilization_rates()
                .map(|e| e.gpu)
                .unwrap_or_default() as f32;
            let label = current_gpu.name().unwrap_or("N/A".to_string());

            let max_temperature = match current_parameters.get(i as usize) {
                Some(current_parameters) => {
                    current_parameters.max_temperature.max(current_temperature)
                }
                None => current_temperature,
            };

            gpu_devices.push(HardwareParameters {
                label,
                usage_percentage,
                current_temperature,
                max_temperature,
            });
        }
        gpu_devices
    }
    fn read_gpu_devices(&self) -> Vec<GpuStatus> {
        let file = self.gpu_status_file.clone();
        let mut gpu_devices = vec![];

        if let Some(file_path) = file {
            let gpu_status_file = match fs::read_to_string(file_path) {
                Ok(f) => f,
                Err(e) => {
                    warn!(target: LOG_TARGET, "Failed to read gpu status file: {}", e);
                    return gpu_devices;
                }
            };
            match serde_json::from_str::<GpuStatusFile>(&gpu_status_file) {
                Ok(gpu) => {
                    gpu_devices = gpu.gpu_devices;
                }
                Err(e) => {
                    warn!(target: LOG_TARGET, "Failed to parse gpu status: {}", e.to_string());
                }
            }
        }
        gpu_devices
    }
    fn load_status_file(&mut self, config_path: PathBuf) -> Result<(), anyhow::Error> {
        let file: PathBuf = config_path.join("gpuminer").join("gpu_status.json");
        if file.exists() {
            self.gpu_status_file = Some(file.clone());
            trace!(target: LOG_TARGET, "Loading gpu status from file: {:?}", file);
        } else {
            debug!(target: LOG_TARGET, "Gpu status file does not exist or is corrupt");
        }
        Ok(())
    }
}

#[allow(dead_code)]
struct MacOSHardwareMonitor {
    gpu_status_file: Option<PathBuf>,
}
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
        current_parameters: Vec<HardwareParameters>,
    ) -> Vec<HardwareParameters> {
        let mut gpu_params = vec![];
        // GPU devices list taken from gpu_status.json file
        let gpu_devices = self.read_gpu_devices();
        let num_of_devices = gpu_devices.len();

        let system = System::new_all();
        let components = Components::new_with_refreshed_list();
        let gpu_components: Vec<&Component> = components
            .deref()
            .iter()
            .filter(|c| c.label().contains("GPU"))
            .collect();
        let avarage_temperature =
            gpu_components.iter().map(|c| c.temperature()).sum::<f32>() / num_of_devices as f32;

        for i in 0..num_of_devices {
            let current_gpu = if let Some(device) = gpu_devices.get(i) {
                device
            } else {
                println!("Failed to get GPU device nr {:?}", i);
                continue; // skip to the next iteration
            };

            //TODO: Implement GPU usage for MacOS
            let usage_percentage = system.global_cpu_usage();
            let label: String = current_gpu.device_name.clone();
            let mut current_temperature = avarage_temperature;
            let mut max_temperature = avarage_temperature;

            if let Some(current_parameters) = current_parameters.get(i) {
                current_temperature = current_parameters.current_temperature;
                max_temperature = current_parameters.max_temperature.max(avarage_temperature)
            };

            gpu_params.push(HardwareParameters {
                label,
                usage_percentage,
                current_temperature,
                max_temperature,
            });
        }
        gpu_params
    }
    fn read_gpu_devices(&self) -> Vec<GpuStatus> {
        let file = self.gpu_status_file.clone();
        let mut gpu_devices = vec![];

        if let Some(file_path) = file {
            let gpu_status_file = match fs::read_to_string(file_path) {
                Ok(f) => f,
                Err(e) => {
                    warn!(target: LOG_TARGET, "Failed to read gpu status file: {}", e);
                    return gpu_devices;
                }
            };
            match serde_json::from_str::<GpuStatusFile>(&gpu_status_file) {
                Ok(gpu) => {
                    gpu_devices = gpu.gpu_devices;
                }
                Err(e) => {
                    warn!(target: LOG_TARGET, "Failed to parse gpu status: {:?}", e);
                }
            }
        }
        gpu_devices
    }
    fn load_status_file(&mut self, config_path: PathBuf) -> Result<(), anyhow::Error> {
        let file: PathBuf = config_path.join("gpuminer").join("gpu_status.json");
        if file.exists() {
            self.gpu_status_file = Some(file.clone());
            trace!(target: LOG_TARGET, "Loading gpu status from file: {:?}", file);
        } else {
            debug!(target: LOG_TARGET, "Gpu status file does not exist or is corrupt");
        }
        Ok(())
    }
}
