use serde::{Deserialize, Serialize};
use winreg::HKEY;

use crate::{
    hardware::hardware_status_monitor::HardwareVendor,
    system_dependencies::{
        windows::registry::WindowsRegistryRecordType, UniversalDependencyManufacturerUIInfo,
        UniversalDependencyStatus, UniversalDependencyUIInfo, UniversalSystemDependency,
    },
};

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

pub struct WindowsSystemDependency {
    pub universal_data: UniversalSystemDependency,
    pub registry_entry_type: WindowsRegistryRecordType,
    pub check_values: Vec<String>,
}

impl WindowsSystemDependency {
    pub fn define_microsoft_minimum_runtime_dependency() -> WindowsSystemDependency {
        WindowsSystemDependency {
            universal_data: UniversalSystemDependency {
                id: "microsoft_vc_redist_minimum".to_string(),
                ui_info: UniversalDependencyUIInfo {
                    display_name: "Microsoft Visual C++ 2022 x64 Minimum Runtime".to_string(),
                    display_description:
                        "This is the minimum runtime required to run Tari applications.".to_string(),
                    manufacturer: UniversalDependencyManufacturerUIInfo {
                        name: Manufacturer::Microsoft.get_name(),
                        url: Manufacturer::Microsoft.get_url(),
                        logo_url: Manufacturer::Microsoft.get_logo_url(),
                    },
                },
                status: UniversalDependencyStatus::Unknown,
                download_url: "https://aka.ms/vs/17/release/vc_redist.x64.exe".to_string(),
            },
            registry_entry_type: WindowsRegistryRecordType::UninstallSoftware,
            check_values: vec![
                "Microsoft Visual C++ 2022 x64 Minimum Runtime".to_string(),
                "Microsoft Visual C++ 2019 x64 Minimum Runtime".to_string(),
            ],
        }
    }
    pub fn define_microsoft_additional_runtime_dependency() -> WindowsSystemDependency {
        WindowsSystemDependency {
            universal_data: UniversalSystemDependency {
                id: "microsoft_vc_redist_additional".to_string(),
                ui_info: UniversalDependencyUIInfo {
                    display_name: "Microsoft Visual C++ 2022 x64 Additional Runtime".to_string(),
                    display_description:
                        "This is the additional runtime required to run Tari applications."
                            .to_string(),
                    manufacturer: UniversalDependencyManufacturerUIInfo {
                        name: Manufacturer::Microsoft.get_name(),
                        url: Manufacturer::Microsoft.get_url(),
                        logo_url: Manufacturer::Microsoft.get_logo_url(),
                    },
                },
                status: UniversalDependencyStatus::Unknown,
                download_url: "https://aka.ms/vs/17/release/vc_redist.x64.exe".to_string(),
            },
            registry_entry_type: WindowsRegistryRecordType::UninstallSoftware,
            check_values: vec![
                "Microsoft Visual C++ 2022 x64 Additional Runtime".to_string(),
                "Microsoft Visual C++ 2019 x64 Additional Runtime".to_string(),
            ],
        }
    }

    pub fn define_khronos_opencl_dependency() -> WindowsSystemDependency {
        WindowsSystemDependency {
            universal_data: UniversalSystemDependency {
                id: "intel_opencl_runtime".to_string(),
                ui_info: UniversalDependencyUIInfo {
                    display_name: "Intel® CPU Runtime for OpenCL™".to_string(),
                    display_description: "The Intel® CPU Runtime for OpenCL™ is required for optimal performance and compatibility.".to_string(),
                    manufacturer: UniversalDependencyManufacturerUIInfo {
                        name: Manufacturer::Intel.get_name(),
                        url: Manufacturer::Intel.get_url(),
                        logo_url: Manufacturer::Intel.get_logo_url(),
                    },
                },
                status: UniversalDependencyStatus::Unknown,
                download_url: "https://registrationcenter-download.intel.com/akdlm/IRC_NAS/a8589e7b-70f8-4ef2-bdc3-7306dfb93e92/w_opencl_runtime_p_2025.2.0.768.exe".to_string(),
            },
            registry_entry_type: WindowsRegistryRecordType::KhronosSoftware,
            check_values: vec!["Intel(R) CPU Runtime for OpenCL(TM)".to_string()],
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
        let manufacturer_ui_info = UniversalDependencyManufacturerUIInfo {
            name: manufacturer.get_name(),
            url: manufacturer.get_url(),
            logo_url: manufacturer.get_logo_url(),
        };
        let ui_info = UniversalDependencyUIInfo {
            display_name,
            display_description,
            manufacturer: manufacturer_ui_info,
        };
        let download_url = match vendor {
            HardwareVendor::Nvidia => "https://us.download.nvidia.com/nvapp/client/11.0.4.526/NVIDIA_app_v11.0.4.526.exe".to_string(),
            HardwareVendor::Amd => "https://drivers.amd.com/drivers/installer/25.10/whql/amd-software-adrenalin-edition-25.8.1-minimalsetup-250801_web.exe".to_string(),
            HardwareVendor::Intel => {
                "https://dsadata.intel.com/installer".to_string()
            }
            _ => "".to_string(),
        };
        WindowsSystemDependency {
            universal_data: UniversalSystemDependency {
                id: format!("gpu_driver_{}", manufacturer.get_name().to_lowercase()),
                ui_info,
                status: UniversalDependencyStatus::Unknown,
                download_url,
            },
            registry_entry_type: WindowsRegistryRecordType::GpuHardware,
            check_values: vec![device_desc],
        }
    }
}
