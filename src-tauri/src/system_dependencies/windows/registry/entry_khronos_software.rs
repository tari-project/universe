use crate::system_dependencies::windows::registry::{
    WindowsRegistryReader, WindowsRegistryRequirementChecker,
};

pub struct WindowsRegistryKhronosSoftwareEntry {}

pub struct WindowsRegistryKhronosSoftwareResolver {}

impl WindowsRegistryReader for WindowsRegistryKhronosSoftwareResolver {
    type Entry = WindowsRegistryKhronosSoftwareEntry;

    fn read_registry() -> Result<Self::Entry, anyhow::Error> {
        let hklm_key = RegKey::predef(Self::get_registry_root());
        let khronos_path = hklm_key.open_subkey(Self::get_registry_path())?;

        for subkey_name in khronos_path.enum_keys() {
            if subkey_name?.to_lowercase().contains("opencl") {
                return Ok(Self::Entry {});
            }
        }

        Err(anyhow::anyhow!("No Khronos OpenCL software found"))
    }

    fn get_registry_path() -> String {
        "SOFTWARE\\Khronos".to_string()
    }
    fn get_registry_root() -> HKEY {
        HKEY::HKEY_LOCAL_MACHINE
    }
}

impl WindowsRegistryRequirementChecker for WindowsRegistryKhronosSoftwareEntry {
    type Requirement = ();
    fn check_requirements(&self, _entry: &Self::Requirement) -> bool {
        true
    }
}
