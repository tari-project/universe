use winreg::{enums::HKEY_LOCAL_MACHINE, RegKey, HKEY};

use crate::system_dependencies::windows::registry::{
    WindowsRegistryReader, WindowsRegistryRequirementChecker,
};

pub struct WindowsRegistryKhronosSoftwareEntry {}

pub struct WindowsRegistryKhronosSoftwareResolver {}

impl WindowsRegistryReader for WindowsRegistryKhronosSoftwareResolver {
    type Entry = Vec<WindowsRegistryKhronosSoftwareEntry>;

    fn read_registry() -> Result<Self::Entry, anyhow::Error> {
        let hklm_key = RegKey::predef(Self::get_registry_root());
        let khronos_path = hklm_key.open_subkey(Self::get_registry_path())?;
        let mut khronos_entries = Vec::new();

        for subkey_name in khronos_path.enum_keys() {
            if subkey_name?.to_lowercase().contains("opencl") {
                khronos_entries.push(WindowsRegistryKhronosSoftwareEntry {});
            }
        }

        if khronos_entries.is_empty() {
            Err(anyhow::anyhow!("No Khronos OpenCL software found"))
        } else {
            Ok(khronos_entries)
        }
    }

    fn get_registry_path() -> String {
        "SOFTWARE\\Khronos".to_string()
    }
    fn get_registry_root() -> HKEY {
        HKEY_LOCAL_MACHINE
    }
}

impl WindowsRegistryRequirementChecker for WindowsRegistryKhronosSoftwareEntry {
    type Requirement = ();
    fn check_requirements(&self, _entry: &Self::Requirement) -> bool {
        true
    }
}
