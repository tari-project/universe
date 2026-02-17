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

use winreg::{HKEY, RegKey, enums::HKEY_LOCAL_MACHINE};

use crate::{
    hardware::hardware_status_monitor::HardwareVendor,
    system_dependencies::windows::registry::{
        WindowsRegistryReader, WindowsRegistryRequirementChecker,
    },
};

#[derive(Clone)]
pub struct WindowsRegistryGpuDriverEntry {
    pub driver_desc: String,
    pub driver_version: String,
    pub provider_name: String,
    pub driver_identifier: String,
}

impl WindowsRegistryGpuDriverEntry {
    pub fn get_vendor(&self) -> HardwareVendor {
        HardwareVendor::from_string(&self.provider_name)
    }
}

pub struct WindowsRegistryGpuDriverResolver {}

impl WindowsRegistryReader for WindowsRegistryGpuDriverResolver {
    type Entry = Vec<WindowsRegistryGpuDriverEntry>;

    fn read_registry() -> Result<Self::Entry, anyhow::Error> {
        let hklm_key = RegKey::predef(Self::get_registry_root());
        let gpu_drivers_path = hklm_key.open_subkey(Self::get_registry_path())?;
        let mut gpu_driver_entries = Vec::new();

        for subkey_name in gpu_drivers_path.enum_keys() {
            if let Ok(subkey_name) = &subkey_name {
                if let Ok(subkey) = gpu_drivers_path.open_subkey(subkey_name) {
                    let driver_desc: Result<String, std::io::Error> =
                        subkey.get_value("DriverDesc");
                    let driver_version: Result<String, std::io::Error> =
                        subkey.get_value("DriverVersion");
                    let provider_name: Result<String, std::io::Error> =
                        subkey.get_value("ProviderName");
                    if let (Ok(driver_desc), Ok(driver_version), Ok(provider_name)) =
                        (driver_desc, driver_version, provider_name)
                    {
                        gpu_driver_entries.push(WindowsRegistryGpuDriverEntry {
                            driver_desc,
                            driver_version,
                            provider_name,
                            driver_identifier: format!(
                                "{{4D36E968-E325-11CE-BFC1-08002BE10318}}\\{}",
                                subkey_name
                            ),
                        });
                    }
                }
            }
        }

        if gpu_driver_entries.is_empty() {
            Err(anyhow::anyhow!("No GPU driver entries found"))
        } else {
            Ok(gpu_driver_entries)
        }
    }
    fn get_registry_path() -> String {
        "SYSTEM\\CurrentControlSet\\Control\\Class\\{4D36E968-E325-11CE-BFC1-08002BE10318}"
            .to_string()
    }
    fn get_registry_root() -> HKEY {
        HKEY_LOCAL_MACHINE
    }
}

impl WindowsRegistryRequirementChecker for WindowsRegistryGpuDriverEntry {
    type Requirement = Vec<String>;
    fn check_requirements(&self, entry: &Self::Requirement) -> bool {
        let sanitized_driver_identifier = self.driver_identifier.to_lowercase().trim().to_string();
        entry
            .iter()
            .any(|e| e.to_lowercase().trim().to_string() == sanitized_driver_identifier)
    }
}
