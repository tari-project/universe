use winreg::{enums::HKEY_LOCAL_MACHINE, RegKey, HKEY};

use crate::system_dependencies::windows::registry::{
    WindowsRegistryReader, WindowsRegistryRequirementChecker,
};

#[derive(Clone)]
pub struct WindowsRegistryUninstallSoftwareEntry {
    pub display_name: String,
    pub display_version: String,
}

pub struct WindowsRegistryUninstallSoftwareResolver {}

impl WindowsRegistryReader for WindowsRegistryUninstallSoftwareResolver {
    type Entry = Vec<WindowsRegistryUninstallSoftwareEntry>;

    fn read_registry() -> Result<Self::Entry, anyhow::Error> {
        let hklm_key = RegKey::predef(Self::get_registry_root());
        let uninstall_path = hklm_key.open_subkey(Self::get_registry_path())?;
        let mut uninstall_entries = Vec::new();

        for subkey_name in uninstall_path.enum_keys() {
            let subkey = uninstall_path.open_subkey(subkey_name?)?;
            let display_name: String = subkey.get_value("DisplayName").unwrap_or_default();
            if !display_name.is_empty() {
                let display_version: String =
                    subkey.get_value("DisplayVersion").unwrap_or_default();
                uninstall_entries.push(WindowsRegistryUninstallSoftwareEntry {
                    display_name,
                    display_version,
                });
            }
        }

        if uninstall_entries.is_empty() {
            Err(anyhow::anyhow!("No uninstall software entries found"))
        } else {
            Ok(uninstall_entries)
        }
    }

    fn get_registry_path() -> String {
        "SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall".to_string()
    }

    fn get_registry_root() -> HKEY {
        HKEY_LOCAL_MACHINE
    }
}

impl WindowsRegistryRequirementChecker for WindowsRegistryUninstallSoftwareEntry {
    type Requirement = Vec<String>;
    fn check_requirements(&self, entry: &Self::Requirement) -> bool {
        entry.iter().any(|name| self.display_name.contains(name))
    }
}
