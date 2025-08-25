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
use serde::{Deserialize, Serialize};
use std::env;
use std::sync::LazyLock;
use tokio::fs::File;
use tokio::io::AsyncWriteExt;
use tokio::sync::RwLock;
use winreg::enums::HKEY_LOCAL_MACHINE;
use winreg::RegKey;

use crate::{
    hardware::hardware_status_monitor::HardwareVendor,
    system_dependencies::windows::dependencies::{
        CollectedWindowsRegistryRecords, Manufacturer, WindowsDependencyManufacturerUIInfo,
        WindowsDependencyStatus, WindowsDependencyUIInfo, WindowsRegistryCpuEntry,
        WindowsRegistryGpuDriverEntry, WindowsRegistryGpuEntry, WindowsRegistryKhronosSoftware,
        WindowsSystemDependency,
    },
};

const LOG_TARGET: &str = "tari::universe::windows::resolver";
static INSTANCE: LazyLock<WindowsDependenciesResolver> =
    LazyLock::new(WindowsDependenciesResolver::new);

pub struct WindowsDependenciesResolver {
    dependencies: RwLock<Vec<WindowsSystemDependency>>,
    cpu_record: RwLock<Option<WindowsRegistryCpuEntry>>,
    gpu_records: RwLock<Vec<WindowsRegistryGpuEntry>>,
}

impl WindowsDependenciesResolver {
    fn new() -> Self {
        Self {
            dependencies: RwLock::new(vec![
                WindowsSystemDependency::define_microsoft_minimum_runtime_dependency(),
                WindowsSystemDependency::define_microsoft_additional_runtime_dependency(),
            ]),
            cpu_record: RwLock::new(None),
            gpu_records: RwLock::new(Vec::new()),
        }
    }

    pub fn current() -> &'static WindowsDependenciesResolver {
        &INSTANCE
    }

    fn load_registry_cpu_info(&self) -> Result<(), Error> {
        let hklm_key =
            RegKey::predef(CollectedWindowsRegistryRecords::CpuHardware(()).get_registry_root());
        let cpu_path = hklm_key
            .open_subkey(CollectedWindowsRegistryRecords::CpuHardware(()).get_registry_path())?;
        let cpu_info: WindowsRegistryCpuEntry = WindowsRegistryCpuEntry {
            processor_name_string: cpu_path.get_value("ProcessorNameString")?,
            vendor_identifier: cpu_path.get_value("VendorIdentifier")?,
        };
        let mut cpu_record = self.cpu_record.blocking_write();
        *cpu_record = Some(cpu_info);
        Ok(())
    }

    fn load_gpu_registry_info(&self) -> Result<(), Error> {
        let hklm_key =
            RegKey::predef(CollectedWindowsRegistryRecords::GpuHardware(()).get_registry_root());
        let gpus_path = hklm_key
            .open_subkey(CollectedWindowsRegistryRecords::GpuHardware(()).get_registry_path())?;
        let mut gpu_records = self.gpu_records.blocking_write();
        *gpu_records = Vec::new();
        for subkey_name in gpus_path.enum_keys().map(|x| x.unwrap()) {
            let gpu_path = gpus_path.open_subkey(subkey_name)?;
            let gpu_info: WindowsRegistryGpuEntry = WindowsRegistryGpuEntry {
                device_desc: gpu_path.get_value("DeviceDescription")?,
                driver: gpu_path.get_value("Driver")?,
                mfg: gpu_path.get_value("Mfg")?,
            };
            gpu_records.push(gpu_info);
        }
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
            if !dependencies
                .iter()
                .any(|d| d.ui_info.display_name == dependency.ui_info.display_name)
            {
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
                if !dependencies
                    .iter()
                    .any(|d| d.ui_info.display_name == dependency.ui_info.display_name)
                {
                    dependencies.push(dependency);
                }
                Ok(())
            } else {
                return Err(anyhow!(
                    "CPU information not available to determine vendor."
                ));
            }
        }
    }

    pub async fn read_khronos_registry_info(
        &self,
    ) -> Result<WindowsRegistryKhronosSoftware, Error> {
        todo!()
    }

    pub async fn read_gpu_drivers_registry_info(
        &self,
    ) -> Result<Vec<WindowsRegistryGpuEntry>, Error> {
        todo!()
    }

    pub async fn read_uninstalled_software_registry_info(
        &self,
    ) -> Result<Vec<WindowsRegistryGpuDriverEntry>, Error> {
        todo!()
    }

    pub async fn check_if_dependencies_are_installed_and_meets_requirements(
        &self,
    ) -> Result<(), Error> {
        todo!()
    }
}
