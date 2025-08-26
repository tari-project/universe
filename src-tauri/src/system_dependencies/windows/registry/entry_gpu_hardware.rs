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
        HardwareVendor::from_string(&self.mfg)
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
            if s.contains(&extended_identifier) {
                return HardwareVendorIdentifier::Nvidia;
            }
        }
        for identifier in HardwareVendorIdentifier::Amd.identifiers() {
            let extended_identifier = format!("VEN_{}", identifier);
            if s.contains(&extended_identifier) {
                return HardwareVendorIdentifier::Amd;
            }
        }
        for identifier in HardwareVendorIdentifier::Intel.identifiers() {
            let extended_identifier = format!("VEN_{}", identifier);
            if s.contains(&extended_identifier) {
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
        // Will return list of records like:
        // VEN_10DE&DEV_1E07&SUBSYS_8536104B&REV_A1
        // We will identify the vendor from the VEN_XXXX part
        // Then we will need to open nested key and then ready values like DeviceDesc, Driver, Mfg
        for vendor_record in gpu_path.enum_keys() {
            if let Ok(vendor_record) = &vendor_record {
                let entry_as_gpu = HardwareVendorIdentifier::from_string(vendor_record.clone());
                match entry_as_gpu {
                    HardwareVendorIdentifier::Nvidia
                    | HardwareVendorIdentifier::Amd
                    | HardwareVendorIdentifier::Intel => {
                        let vendor_record_key = gpu_path.open_subkey(vendor_record)?;
                        for gpu_record in vendor_record_key.enum_keys() {
                            if let Ok(gpu_record) = &gpu_record {
                                // Some keys may not open, so we just skip them
                                let gpu_record_data =
                                    match vendor_record_key.open_subkey(gpu_record) {
                                        Err(_) => continue,
                                        Ok(gpu_record_data) => gpu_record_data,
                                    };
                                let device_desc: Result<String, std::io::Error> =
                                    gpu_record_data.get_value("DeviceDesc");
                                let driver: Result<String, std::io::Error> =
                                    gpu_record_data.get_value("Driver");
                                let mfg: Result<String, std::io::Error> =
                                    gpu_record_data.get_value("Mfg");
                                let class_guid: Result<String, std::io::Error> =
                                    gpu_record_data.get_value("ClassGUID");
                                if let (Ok(device_desc), Ok(driver), Ok(mfg), Ok(class_guid)) =
                                    (device_desc, driver, mfg, class_guid)
                                {
                                    // We are only interested in display adapters
                                    if class_guid != "{4d36e968-e325-11ce-bfc1-08002be10318}" {
                                        continue;
                                    }
                                    gpu_entries.push(WindowsRegistryGpuEntry {
                                        device_desc,
                                        driver,
                                        mfg,
                                    });
                                }
                            }
                        }
                    }
                    HardwareVendorIdentifier::Unknown => {}
                }
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
    fn check_requirements(&self, _entry: &Self::Requirement) -> bool {
        true
    }
}
