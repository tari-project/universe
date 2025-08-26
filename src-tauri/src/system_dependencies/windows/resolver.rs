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

use anyhow::{anyhow, Error};
use futures_util::StreamExt;
use log::info;
use std::{env, os::windows::process::CommandExt};
use tokio::fs::File;
use tokio::io::AsyncWriteExt;
use tokio::sync::RwLock;

use crate::system_dependencies::windows::dependencies::WindowsSystemDependency;
use crate::system_dependencies::windows::registry::entry_cpu_hardware::WindowsRegistryCpuEntry;
use crate::system_dependencies::windows::registry::entry_uninstall_software::WindowsRegistryUninstallSoftwareEntry;
use crate::system_dependencies::UniversalDependencyStatus;
use crate::{
    hardware::hardware_status_monitor::HardwareVendor,
    system_dependencies::{
        windows::registry::{
            entry_cpu_hardware::WindowsRegistryCpuResolver,
            entry_gpu_drivers::WindowsRegistryGpuDriverResolver,
            entry_gpu_hardware::{WindowsRegistryGpuEntry, WindowsRegistryGpuResolver},
            entry_khronos_software::WindowsRegistryKhronosSoftwareResolver,
            entry_uninstall_software::WindowsRegistryUninstallSoftwareResolver,
            WindowsRegistryReader, WindowsRegistryRecordType,
        },
        UniversalSystemDependency,
    },
};

const LOG_TARGET: &str = "tari::universe::system_dependencies::windows::resolver";

pub struct WindowsDependenciesResolver {
    dependencies: RwLock<Vec<WindowsSystemDependency>>,
    cpu_record: RwLock<Option<WindowsRegistryCpuEntry>>,
    gpu_records: RwLock<Vec<WindowsRegistryGpuEntry>>,
}

impl WindowsDependenciesResolver {
    pub fn new() -> Self {
        Self {
            dependencies: RwLock::new(vec![
                WindowsSystemDependency::define_microsoft_minimum_runtime_dependency(),
                WindowsSystemDependency::define_microsoft_additional_runtime_dependency(),
            ]),
            cpu_record: RwLock::new(None),
            gpu_records: RwLock::new(Vec::new()),
        }
    }

    fn load_registry_cpu_info(&self) -> Result<(), Error> {
        let cpu_info = WindowsRegistryCpuResolver::read_registry()?;
        let mut cpu_record = self.cpu_record.blocking_write();
        *cpu_record = Some(cpu_info);
        Ok(())
    }

    fn load_gpu_registry_info(&self) -> Result<(), Error> {
        let gpus_info = WindowsRegistryGpuResolver::read_registry()?;
        let mut gpu_record = self.gpu_records.blocking_write();
        *gpu_record = gpus_info;
        Ok(())
    }

    pub async fn add_gpu_drivers_as_dependencies(&self) -> Result<(), Error> {
        self.load_gpu_registry_info()?;
        let gpu_records = self.gpu_records.read().await;
        let mut dependencies = self.dependencies.write().await;
        for gpu in gpu_records.iter() {
            let dependency = WindowsSystemDependency::define_gpu_driver_dependency(
                gpu.get_vendor(),
                gpu.device_desc.clone(),
            );
            if !dependencies.iter().any(|d| {
                d.universal_data.ui_info.display_name
                    == dependency.universal_data.ui_info.display_name
            }) {
                dependencies.push(dependency);
            }
        }
        Ok(())
    }

    pub async fn add_khronos_opencl_as_dependency(&self) -> Result<(), Error> {
        self.load_registry_cpu_info()?;
        let cpu_record = self.cpu_record.read().await.clone();
        if let Some(cpu) = cpu_record {
            let vendor = cpu.get_vendor();
            // For now only Intel CPUs are supported for OpenCL via Khronos downloaded through Intel® CPU Runtime for OpenCL™ Applications with SYCL* Support
            if vendor == HardwareVendor::Intel {
                let dependency = WindowsSystemDependency::define_khronos_opencl_dependency();
                let mut dependencies = self.dependencies.write().await;
                if !dependencies.iter().any(|d| {
                    d.universal_data.ui_info.display_name
                        == dependency.universal_data.ui_info.display_name
                }) {
                    dependencies.push(dependency);
                }
                Ok(())
            } else {
                return Err(anyhow!(
                    "CPU information not available to determine vendor."
                ));
            }
        }
        Ok(())
    }

    pub async fn get_universal_dependencies(&self) -> Vec<UniversalSystemDependency> {
        let dependencies = self.dependencies.read().await;
        dependencies
            .iter()
            .map(|d| d.clone().universal_data)
            .collect()
    }

    // It should iter over all dependencies and validate them using registry readers and requirement checkers
    pub async fn validate_dependencies(&self) -> Result<Vec<UniversalSystemDependency>, Error> {
        let dependencies = self.dependencies.write().await;
        for dependency in dependencies.iter_mut() {
            // Validate each dependency using the appropriate registry reader
            match dependency.registry_entry_type {
                WindowsRegistryRecordType::GpuDrivers => {
                    let entries = WindowsRegistryGpuDriverResolver::read_registry()?;
                    for entry in entries.iter() {
                        for check_value in dependency.check_values.iter() {
                            if entry.check_requirements(check_value) {
                                dependency.status = UniversalDependencyStatus::Installed;
                                break;
                            }
                        }
                    }
                }
                WindowsRegistryRecordType::KhronosSoftware => {
                    let entries = WindowsRegistryKhronosSoftwareResolver::read_registry()?;
                    for entry in entries.iter() {
                        for check_value in dependency.check_values.iter() {
                            if entry.check_requirements(check_value) {
                                dependency.status = UniversalDependencyStatus::Installed;
                                break;
                            }
                        }
                    }
                }
                WindowsRegistryRecordType::UninstallSoftware => {
                    let entries = WindowsRegistryUninstallSoftwareResolver::read_registry()?;
                    for entry in entries.iter() {
                        for check_value in dependency.check_values.iter() {
                            if entry.check_requirements(check_value) {
                                dependency.status = UniversalDependencyStatus::Installed;
                                break;
                            }
                        }
                    }
                }
                _ => {}
            }
        }
        Ok(dependencies
            .iter()
            .map(|d| d.clone().universal_data)
            .collect())
    }

    pub async fn download_and_install_missing_dependencies(&self, id: String) -> Result<(), Error> {
        let dependencies = self.dependencies.read().await;
        if let Some(dependency) = dependencies.iter().find(|d| d.universal_data.id == id) {
            if dependency.universal_data.status == UniversalDependencyStatus::Installed {
                info!(
                    target: LOG_TARGET,
                    "Dependency '{}' is already installed.", dependency.universal_data.ui_info.display_name
                );
                return Ok(());
            }

            let url = &dependency.universal_data.ui_info.download_url;
            if url.is_empty() {
                return Err(anyhow!(
                    "No download URL available for dependency '{}'.",
                    dependency.universal_data.ui_info.display_name
                ));
            }

            info!(
                target: LOG_TARGET,
                "Downloading and installing dependency '{}' from {}",
                dependency.universal_data.ui_info.display_name,
                url
            );

            let response = reqwest::get(url).await?;
            if !response.status().is_success() {
                return Err(anyhow!(
                    "Failed to download dependency '{}'. HTTP Status: {}",
                    dependency.universal_data.ui_info.display_name,
                    response.status()
                ));
            }

            let temp_dir = env::temp_dir();
            let file_name = url
                .split('/')
                .last()
                .ok_or_else(|| anyhow!("Invalid download URL."))?;
            let file_path = temp_dir.join(file_name);
            let mut file = File::create(&file_path).await?;
            let mut stream = response.bytes_stream();

            while let Some(chunk) = stream.next().await {
                let chunk = chunk?;
                file.write_all(&chunk).await?;
            }
            file.flush().await?;

            // Execute the installer
            use crate::consts::PROCESS_CREATION_NO_WINDOW;
            let status = std::process::Command::new(&file_path)
                .creation_flags(PROCESS_CREATION_NO_WINDOW)
                .arg("/quiet")
                .arg("/norestart")
                .status()?;

            if !status.success() {
                return Err(anyhow!(
                    "Installation of dependency '{}' failed.",
                    dependency.universal_data.ui_info.display_name
                ));
            }

            info!(
                target: LOG_TARGET,
                "Dependency '{}' installed successfully.",
                dependency.universal_data.ui_info.display_name
            );
        } else {
            return Err(anyhow!("Dependency with ID '{}' not found.", id));
        }
        Ok(())
    }
}
