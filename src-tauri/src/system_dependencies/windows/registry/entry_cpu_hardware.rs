use winreg::{RegKey, HKEY};

use crate::system_dependencies::windows::registry::{
    WindowsRegistryReader, WindowsRegistryRequirementChecker,
};

#[derive(Clone)]
pub struct WindowsRegistryCpuEntry {
    pub processor_name_string: String,
    pub vendor_identifier: String,
}
impl WindowsRegistryCpuEntry {
    pub fn get_vendor(&self) -> HardwareVendor {
        HardwareVendor::from_string(self.vendor_identifier.clone())
    }
}

pub struct WindowsRegistryCpuResolver {}

impl WindowsRegistryReader for WindowsRegistryCpuResolver {
    type Entry = WindowsRegistryCpuEntry;
    fn read_registry() -> Result<Self::Entry, anyhow::Error> {
        let hklm_key = RegKey::predef(Self::get_registry_root());
        let cpu_path = hklm_key.open_subkey(Self::get_registry_path())?;
        let cpu_info: WindowsRegistryCpuEntry = WindowsRegistryCpuEntry {
            processor_name_string: cpu_path.get_value("ProcessorNameString")?,
            vendor_identifier: cpu_path.get_value("VendorIdentifier")?,
        };
        Ok(cpu_info)
    }
    fn get_registry_path() -> String {
        "HARDWARE\\DESCRIPTION\\System\\CentralProcessor\\0".to_string()
    }
    fn get_registry_root() -> HKEY {
        HKEY::HKEY_LOCAL_MACHINE
    }
}

impl WindowsRegistryRequirementChecker for WindowsRegistryCpuEntry {
    type Requirement = ();
    fn check_requirements(&self, entry: &Self::Requirement) -> bool {
        true
    }
}
