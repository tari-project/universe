use winreg::{enums::HKEY_LOCAL_MACHINE, RegKey, HKEY};

use crate::{
    hardware::hardware_status_monitor::HardwareVendor,
    system_dependencies::windows::registry::{
        WindowsRegistryReader, WindowsRegistryRequirementChecker,
    },
};

#[derive(Clone)]
pub struct WindowsRegistryGpuEntry {
    pub device_desc: String,
    pub driver: String,
    pub mfg: String,
}

impl WindowsRegistryGpuEntry {
    pub fn get_vendor(&self) -> HardwareVendor {
        HardwareVendor::from_string(self.mfg.clone())
    }
}

// Uppercase hexadecimal identifiers from PCI\VEN_XXXX&DEV_XXXX
#[derive(Debug, Clone, PartialEq)]
enum HardwareVendorIdentifier {
    Nvidia,
    Amd,
    Intel,
    Unknown,
}

impl HardwareVendorIdentifier {
    pub fn identifiers(&self) -> Vec<&'static str> {
        match self {
            HardwareVendorIdentifier::Nvidia => vec!["10DE"],
            HardwareVendorIdentifier::Amd => vec!["1002", "1022"],
            HardwareVendorIdentifier::Intel => vec!["8086"],
            HardwareVendorIdentifier::Unknown => vec![],
        }
    }
    // example parameter value VEN_8086&DEV_5917&SUBSYS...
    pub fn from_string(s: String) -> Self {
        for identifier in HardwareVendorIdentifier::Nvidia.identifiers() {
            let extended_identifier = format!("VEN_{}", identifier);
            if s.contains(extended_identifier) {
                return HardwareVendorIdentifier::Nvidia;
            }
        }
        for identifier in HardwareVendorIdentifier::Amd.identifiers() {
            let extended_identifier = format!("VEN_{}", identifier);
            if s.contains(extended_identifier) {
                return HardwareVendorIdentifier::Amd;
            }
        }
        for identifier in HardwareVendorIdentifier::Intel.identifiers() {
            let extended_identifier = format!("VEN_{}", identifier);
            if s.contains(extended_identifier) {
                return HardwareVendorIdentifier::Intel;
            }
        }
        HardwareVendorIdentifier::Unknown
    }
}

pub struct WindowsRegistryGpuResolver {}

impl WindowsRegistryReader for WindowsRegistryGpuResolver {
    type Entry = Vec<WindowsRegistryGpuEntry>;
    fn read_registry() -> Result<Self::Entry, anyhow::Error> {
        let hklm_key = RegKey::predef(Self::get_registry_root());
        let gpu_path = hklm_key.open_subkey(Self::get_registry_path())?;

        let mut gpu_entries: Vec<WindowsRegistryGpuEntry> = Vec::new();
        for subkey_name in gpu_path.enum_keys() {
            let entry_as_gpu = HardwareVendorIdentifier::from_string(subkey_name?);
            match entry_as_gpu {
                HardwareVendorIdentifier::Nvidia
                | HardwareVendorIdentifier::Amd
                | HardwareVendorIdentifier::Intel => {
                    let subkey = gpu_path.open_subkey(subkey_name?)?;
                    let device_desc: String = subkey.get_value("DeviceDesc").unwrap_or_default();
                    let driver: String = subkey.get_value("Driver").unwrap_or_default();
                    let mfg: String = subkey.get_value("Mfg").unwrap_or_default();
                    gpu_entries.push(WindowsRegistryGpuEntry {
                        device_desc,
                        driver,
                        mfg,
                    });
                }
                HardwareVendorIdentifier::Unknown => {}
            }
        }

        if gpu_entries.is_empty() {
            Err(anyhow::anyhow!("No GPU hardware entries found"))
        } else {
            Ok(gpu_entries)
        }
    }
    fn get_registry_path() -> String {
        "SYSTEM\\CurrentControlSet\\Enum\\PCI".to_string()
    }
    fn get_registry_root() -> HKEY {
        HKEY_LOCAL_MACHINE
    }
}

impl WindowsRegistryRequirementChecker for WindowsRegistryGpuEntry {
    type Requirement = ();
    fn check_requirements(&self, entry: &Self::Requirement) -> bool {
        true
    }
}
