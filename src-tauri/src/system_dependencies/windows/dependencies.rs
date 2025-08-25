use serde::{Deserialize, Serialize};
use winreg::HKEY;

use crate::hardware::hardware_status_monitor::HardwareVendor;

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub enum WindowsDependencyStatus {
    Installed,
    NotInstalled,
    Unknown,
}

#[derive(Clone)]
pub struct WindowsRegistryUninstallSoftwareEntry {
    pub display_name: String,
    pub display_version: String,
}

impl WindowsRegistryTrait for WindowsRegistryUninstallSoftwareEntry {}
impl WindowsRegistryUninstallSoftwareEntry {
    pub fn check_if_it_is_desired_one(&self, required_names: &[String]) -> bool {
        for name in required_names {
            if self
                .display_name
                .to_lowercase()
                .contains(&name.to_lowercase())
            {
                return true;
            }
        }
        false
    }
}

#[derive(Clone)]
pub struct WindowsRegistryCpuEntry {
    pub processor_name_string: String,
    pub vendor_identifier: String,
}

impl WindowsRegistryTrait for WindowsRegistryCpuEntry {}
impl WindowsRegistryCpuEntry {
    pub fn get_vendor(&self) -> HardwareVendor {
        HardwareVendor::from_string(self.vendor_identifier.clone())
    }
}
#[derive(Clone)]
pub struct WindowsRegistryGpuEntry {
    pub device_desc: String,
    pub driver: String,
    pub mfg: String,
}

impl WindowsRegistryTrait for WindowsRegistryGpuEntry {}
impl WindowsRegistryGpuEntry {
    pub fn get_vendor(&self) -> HardwareVendor {
        HardwareVendor::from_string(self.mfg.clone())
    }
}
#[derive(Clone)]
pub struct WindowsRegistryGpuDriverEntry {
    pub driver_desc: String,
    pub driver_version: String,
    pub provider_name: String,
}

impl WindowsRegistryTrait for WindowsRegistryGpuDriverEntry {}

pub struct WindowsRegistryKhronosSoftware {}
impl WindowsRegistryTrait for WindowsRegistryKhronosSoftware {}

#[derive(Clone)]
pub enum CollectedWindowsRegistryRecords {
    // Insalled external software, checked via uninstall registry | e.g. Microsoft Visual C++ Redistributable
    UninstallSoftware,
    // Installed Khronos software, checked via Software\Khronos registry | e.g. OpenCL
    KhronosSoftware,
    // Cpu information that is present in the system, checked via CentralProcessor registry
    CpuHardware,
    // Gpu information that is present in the system, checked via CurrentControlSet\Enum\PCI registry
    GpuHardware,
    // Gpu drivers information that is present in the system, checked via CurrentControlSet\Control\Class registry
    GpuDrivers,
}

impl CollectedWindowsRegistryRecords {
    pub fn get_registry_path(&self) -> String {
        match self {
            CollectedWindowsRegistryRecords::UninstallSoftware => {
                "SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall".to_string()
            }
            CollectedWindowsRegistryRecords::KhronosSoftware => "SOFTWARE\\Khronos".to_string(),
            CollectedWindowsRegistryRecords::CpuHardware => {
                "HARDWARE\\DESCRIPTION\\System\\CentralProcessor\\0".to_string()
            }
            CollectedWindowsRegistryRecords::GpuHardware => {
                "SYSTEM\\CurrentControlSet\\Enum\\PCI".to_string()
            }
            CollectedWindowsRegistryRecords::GpuDrivers => {
                "SYSTEM\\CurrentControlSet\\Control\\Class\\{4D36E968-E325-11CE-BFC1-08002BE10318}"
                    .to_string()
            }
        }
    }

    pub fn get_registry_root(&self) -> HKEY {
        match self {
            CollectedWindowsRegistryRecords::UninstallSoftware => HKEY::HKEY_LOCAL_MACHINE,
            CollectedWindowsRegistryRecords::KhronosSoftware => HKEY::HKEY_LOCAL_MACHINE,
            CollectedWindowsRegistryRecords::CpuHardware => HKEY::HKEY_LOCAL_MACHINE,
            CollectedWindowsRegistryRecords::GpuHardware => HKEY::HKEY_LOCAL_MACHINE,
            CollectedWindowsRegistryRecords::GpuDrivers => HKEY::HKEY_LOCAL_MACHINE,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum Manufacturer {
    Microsoft,
    Nvidia,
    AMD,
    Intel,
    Unknown,
}

impl Manufacturer {
    pub fn from_hardware_vendor(vendor: HardwareVendor) -> Self {
        match vendor {
            HardwareVendor::Nvidia => Manufacturer::Nvidia,
            HardwareVendor::Amd => Manufacturer::AMD,
            HardwareVendor::Intel => Manufacturer::Intel,
            _ => Manufacturer::Unknown,
        }
    }
    pub fn get_name(&self) -> String {
        match self {
            Manufacturer::Microsoft => "Microsoft".to_string(),
            Manufacturer::Nvidia => "Nvidia".to_string(),
            Manufacturer::AMD => "AMD".to_string(),
            Manufacturer::Intel => "Intel".to_string(),
            Manufacturer::Unknown => "Unknown".to_string(),
        }
    }
    pub fn get_url(&self) -> String {
        match self {
            Manufacturer::Microsoft => "https://www.microsoft.com".to_string(),
            Manufacturer::Nvidia => "https://www.nvidia.com".to_string(),
            Manufacturer::AMD => "https://www.amd.com".to_string(),
            Manufacturer::Intel => "https://www.intel.com".to_string(),
            Manufacturer::Unknown => "".to_string(),
        }
    }
    pub fn get_logo_url(&self) -> String {
        match self {
            Manufacturer::Microsoft => self.get_url() + "/favicon.ico",
            Manufacturer::Nvidia => self.get_url() + "/favicon.ico",
            Manufacturer::AMD => self.get_url() + "/favicon.ico",
            Manufacturer::Intel => self.get_url() + "/favicon.ico",
            Manufacturer::Unknown => "".to_string(),
        }
    }
}

pub struct WindowsDependencyManufacturerUIInfo {
    pub name: String,
    pub url: String,
    pub logo_url: String,
}

pub struct WindowsDependencyUIInfo {
    pub display_name: String,
    pub display_description: String,
    pub manufacturer: WindowsDependencyManufacturerUIInfo,
}
pub struct WindowsSystemDependency {
    pub ui_info: WindowsDependencyUIInfo,
    pub download_url: String,
    pub registry_entry_type: CollectedWindowsRegistryRecords,
    pub status: WindowsDependencyStatus,
    pub check_values: Vec<String>,
}

impl WindowsSystemDependency {
    pub fn define_microsoft_minimum_runtime_dependency() -> WindowsSystemDependency {
        WindowsSystemDependency {
            ui_info: WindowsDependencyUIInfo {
                display_name: "Microsoft Visual C++ 2022 x64 Minimum Runtime".to_string(),
                display_description:
                    "This is the minimum runtime required to run Tari applications.".to_string(),
                manufacturer: WindowsDependencyManufacturerUIInfo {
                    name: Manufacturer::Microsoft.get_name(),
                    url: Manufacturer::Microsoft.get_url(),
                    logo_url: Manufacturer::Microsoft.get_logo_url(),
                },
            },
            status: WindowsDependencyStatus::Unknown,
            registry_entry_type: CollectedWindowsRegistryRecords::UninstallSoftware,
            check_values: vec![
                "Microsoft Visual C++ 2022 x64 Minimum Runtime".to_string(),
                "Microsoft Visual C++ 2019 x64 Minimum Runtime".to_string(),
            ],
            download_url: "https://aka.ms/vs/17/release/vc_redist.x64.exe".to_string(),
        }
    }
    pub fn define_microsoft_additional_runtime_dependency() -> WindowsSystemDependency {
        WindowsSystemDependency {
            ui_info: WindowsDependencyUIInfo {
                display_name: "Microsoft Visual C++ 2022 x64 Additional Runtime".to_string(),
                display_description:
                    "This is the additional runtime required to run Tari applications.".to_string(),
                manufacturer: WindowsDependencyManufacturerUIInfo {
                    name: Manufacturer::Microsoft.get_name(),
                    url: Manufacturer::Microsoft.get_url(),
                    logo_url: Manufacturer::Microsoft.get_logo_url(),
                },
            },
            status: WindowsDependencyStatus::Unknown,
            registry_entry_type: CollectedWindowsRegistryRecords::UninstallSoftware,
            check_values: vec![
                "Microsoft Visual C++ 2022 x64 Additional Runtime".to_string(),
                "Microsoft Visual C++ 2019 x64 Additional Runtime".to_string(),
            ],
            download_url: "https://aka.ms/vs/17/release/vc_redist.x64.exe".to_string(),
        }
    }

    pub fn define_khronos_opencl_dependency() -> WindowsSystemDependency {
        WindowsSystemDependency {
            ui_info: WindowsDependencyUIInfo {
                display_name: "Intel® CPU Runtime for OpenCL™".to_string(),
                display_description: "The Intel® CPU Runtime for OpenCL™ is required for optimal performance and compatibility.".to_string(),
                manufacturer: WindowsDependencyManufacturerUIInfo {
                    name: Manufacturer::Intel.get_name(),
                    url: Manufacturer::Intel.get_url(),
                    logo_url: Manufacturer::Intel.get_logo_url(),
                },
            },
            status: WindowsDependencyStatus::Unknown,
            registry_entry_type: CollectedWindowsRegistryRecords::KhronosSoftware,
            check_values: vec!["Intel(R) CPU Runtime for OpenCL(TM)".to_string()],
            download_url: "https://registrationcenter-download.intel.com/akdlm/IRC_NAS/a8589e7b-70f8-4ef2-bdc3-7306dfb93e92/w_opencl_runtime_p_2025.2.0.768.exe".to_string(),
        }
    }
    pub fn define_gpu_driver_dependency(
        vendor: HardwareVendor,
        device_desc: String,
    ) -> WindowsSystemDependency {
        let manufacturer = Manufacturer::from_hardware_vendor(vendor);
        let display_name = format!("{} GPU Driver", manufacturer.get_name());
        let display_description = format!(
            "The latest {} GPU driver is required for optimal performance and compatibility.",
            manufacturer.get_name()
        );
        let manufacturer_ui_info = WindowsDependencyManufacturerUIInfo {
            name: manufacturer.get_name(),
            url: manufacturer.get_url(),
            logo_url: manufacturer.get_logo_url(),
        };
        let ui_info = WindowsDependencyUIInfo {
            display_name,
            display_description,
            manufacturer: manufacturer_ui_info,
        };
        let download_url = match vendor {
            HardwareVendor::Nvidia => "https://www.nvidia.com/Download/index.aspx".to_string(),
            HardwareVendor::Amd => "https://www.amd.com/en/support".to_string(),
            HardwareVendor::Intel => {
                "https://downloadcenter.intel.com/product/80939/Graphics".to_string()
            }
            _ => "".to_string(),
        };
        WindowsSystemDependency {
            ui_info,
            download_url,
            registry_entry_type: CollectedWindowsRegistryRecords::GpuHardware,
            status: WindowsDependencyStatus::Unknown,
            check_values: vec![device_desc],
        }
    }
}
