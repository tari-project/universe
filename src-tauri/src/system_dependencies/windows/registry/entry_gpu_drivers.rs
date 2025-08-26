use winreg::{RegKey, HKEY};

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
        HardwareVendor::from_string(self.provider_name.clone())
    }
}

pub struct WindowsRegistryGpuDriverResolver {}

impl WindowsRegistryReader for WindowsRegistryGpuDriverResolver {
    type Entry = WindowsRegistryGpuDriverEntry;

    fn read_registry() -> Result<Vec<Self::Entry>, anyhow::Error> {
        let hklm_key = RegKey::predef(Self::get_registry_root());
        let gpu_drivers_path = hklm_key.open_subkey(Self::get_registry_path())?;
        let mut gpu_driver_entries = Vec::new();

        for subkey_name in gpu_drivers_path.enum_keys() {
            let subkey = gpu_drivers_path.open_subkey(subkey_name?)?;
            let driver_desc: String = subkey.get_value("DriverDesc").unwrap_or_default();
            if !driver_desc.is_empty() {
                let driver_version: String = subkey.get_value("DriverVersion").unwrap_or_default();
                let provider_name: String = subkey.get_value("ProviderName").unwrap_or_default();
                gpu_driver_entries.push(Self::Entry {
                    driver_desc,
                    driver_version,
                    provider_name,
                    driver_identifier: format!(
                        "{{4D36E968-E325-11CE-BFC1-08002BE10318}}\\{}",
                        subkey_name?
                    ),
                });
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
        HKEY::HKEY_LOCAL_MACHINE
    }
}

impl WindowsRegistryRequirementChecker for WindowsRegistryGpuDriverEntry {
    type Requirement = String;
    fn check_requirements(&self, entry: &Self::Requirement) -> bool {
        self.driver_identifier == *entry
    }
}
