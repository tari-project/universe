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

use anyhow::{Error, anyhow};
use log::info;
use std::env::temp_dir;
use std::os::windows::process::CommandExt;
use tokio::sync::RwLock;

use crate::LOG_TARGET_APP_LOGIC;
use crate::requests::clients::http_file_client::HttpFileClient;
use crate::system_dependencies::UniversalDependencyStatus;
use crate::system_dependencies::windows::dependencies::WindowsSystemDependency;
use crate::system_dependencies::windows::registry::WindowsRegistryRequirementChecker;
use crate::system_dependencies::windows::registry::entry_cpu_hardware::WindowsRegistryCpuEntry;
use crate::{
    hardware::hardware_status_monitor::HardwareVendor,
    system_dependencies::{
        UniversalSystemDependency,
        windows::registry::{
            WindowsRegistryReader, WindowsRegistryRecordType,
            entry_cpu_hardware::WindowsRegistryCpuResolver,
            entry_gpu_drivers::WindowsRegistryGpuDriverResolver,
            entry_gpu_hardware::{WindowsRegistryGpuEntry, WindowsRegistryGpuResolver},
            entry_khronos_software::WindowsRegistryKhronosSoftwareResolver,
            entry_uninstall_software::WindowsRegistryUninstallSoftwareResolver,
        },
    },
};

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

    async fn load_registry_cpu_info(&self) -> Result<(), Error> {
        let cpu_info = WindowsRegistryCpuResolver::read_registry()?;
        let mut cpu_record = self.cpu_record.write().await;
        *cpu_record = Some(cpu_info);
        Ok(())
    }

    async fn load_gpu_registry_info(&self) -> Result<(), Error> {
        let gpus_info = WindowsRegistryGpuResolver::read_registry()?;
        let mut gpu_record = self.gpu_records.write().await;
        *gpu_record = gpus_info;
        Ok(())
    }

    pub async fn add_gpu_drivers_as_dependencies(&self) -> Result<(), Error> {
        self.load_gpu_registry_info().await?;
        let gpu_records = self.gpu_records.read().await;
        let mut dependencies = self.dependencies.write().await;
        for gpu in gpu_records.iter() {
            let dependency = WindowsSystemDependency::define_gpu_driver_dependency(
                gpu.get_vendor(),
                gpu.device_desc.clone(),
                gpu.driver.clone(),
            );
            dependencies.push(dependency);
        }
        Ok(())
    }

    pub async fn add_khronos_opencl_as_dependency(&self) -> Result<(), Error> {
        self.load_registry_cpu_info().await?;
        let cpu_record = self.cpu_record.read().await.clone();
        if let Some(cpu) = cpu_record {
            let vendor = cpu.get_vendor();
            // For now only Intel CPUs are supported for OpenCL via Khronos downloaded through Intel® CPU Runtime for OpenCL™ Applications with SYCL* Support
            if vendor == HardwareVendor::Intel {
                let dependency = WindowsSystemDependency::define_khronos_opencl_dependency();
                let mut dependencies = self.dependencies.write().await;
                dependencies.push(dependency);
            }
        } else {
            return Err(anyhow!(
                "CPU information not available to determine vendor."
            ));
        }
        Ok(())
    }

    pub async fn get_universal_dependencies(
        &self,
    ) -> Result<Vec<UniversalSystemDependency>, Error> {
        let dependencies = self.dependencies.read().await;
        Ok(dependencies
            .iter()
            .map(|d| d.universal_data.clone())
            .collect())
    }

    // It should iter over all dependencies and validate them using registry readers and requirement checkers
    pub async fn validate_dependencies(&self) -> Result<Vec<UniversalSystemDependency>, Error> {
        let mut dependencies = self.dependencies.write().await;
        for dependency in dependencies.iter_mut() {
            // Validate each dependency using the appropriate registry reader
            match dependency.registry_entry_type {
                WindowsRegistryRecordType::GpuDrivers => {
                    match WindowsRegistryGpuDriverResolver::read_registry() {
                        Ok(entries) => {
                            for entry in entries.iter() {
                                if entry.check_requirements(&dependency.check_values) {
                                    dependency.universal_data.status =
                                        UniversalDependencyStatus::Installed;
                                    break;
                                } else {
                                    dependency.universal_data.status =
                                        UniversalDependencyStatus::NotInstalled;
                                }
                            }
                        }
                        Err(_) => {
                            dependency.universal_data.status =
                                UniversalDependencyStatus::NotInstalled;
                        }
                    }
                }
                WindowsRegistryRecordType::KhronosSoftware => {
                    match WindowsRegistryKhronosSoftwareResolver::read_registry() {
                        Ok(entries) => {
                            for entry in entries.iter() {
                                if entry.check_requirements(&()) {
                                    dependency.universal_data.status =
                                        UniversalDependencyStatus::Installed;
                                    break;
                                } else {
                                    dependency.universal_data.status =
                                        UniversalDependencyStatus::NotInstalled;
                                }
                            }
                        }
                        Err(_) => {
                            dependency.universal_data.status =
                                UniversalDependencyStatus::NotInstalled;
                        }
                    }
                }
                WindowsRegistryRecordType::UninstallSoftware => {
                    match WindowsRegistryUninstallSoftwareResolver::read_registry() {
                        Ok(entries) => {
                            for entry in entries.iter() {
                                if entry.check_requirements(&dependency.check_values) {
                                    dependency.universal_data.status =
                                        UniversalDependencyStatus::Installed;
                                    break;
                                } else {
                                    dependency.universal_data.status =
                                        UniversalDependencyStatus::NotInstalled;
                                }
                            }
                        }
                        Err(_) => {
                            dependency.universal_data.status =
                                UniversalDependencyStatus::NotInstalled;
                        }
                    }
                }
                _ => {}
            }
        }
        Ok(dependencies
            .iter()
            .map(|d| d.universal_data.clone())
            .collect())
    }

    pub async fn download_and_install_missing_dependencies(&self, id: String) -> Result<(), Error> {
        let dependencies = self.dependencies.read().await;
        if let Some(dependency) = dependencies.iter().find(|d| d.universal_data.id == id) {
            if dependency.universal_data.status == UniversalDependencyStatus::Installed {
                info!(
                    target: LOG_TARGET_APP_LOGIC,
                    "Dependency '{}' is already installed.", dependency.universal_data.ui_info.display_name
                );
                return Ok(());
            }

            let url = &dependency.universal_data.download_url;
            let destination = temp_dir().join("executables".to_string());
            let file_path = HttpFileClient::builder()
                .build(url.clone(), destination.clone())?
                .execute()
                .await?;

            // Execute the installer
            use crate::consts::PROCESS_CREATION_NO_WINDOW;
            let status = std::process::Command::new(&file_path)
                .creation_flags(PROCESS_CREATION_NO_WINDOW)
                .status()?;

            if !status.success() {
                return Err(anyhow!(
                    "Installation of dependency '{}' failed.",
                    dependency.universal_data.ui_info.display_name
                ));
            }

            info!(
                target: LOG_TARGET_APP_LOGIC,
                "Dependency '{}' installed successfully.",
                dependency.universal_data.ui_info.display_name
            );
        } else {
            return Err(anyhow!("Dependency with ID '{}' not found.", id));
        }
        Ok(())
    }
}
