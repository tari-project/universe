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
        let sanitized_entry: Vec<String> = entry
            .iter()
            .map(|name| name.to_lowercase().trim().to_string())
            .collect();
        let sanitized_display_name = self.display_name.to_lowercase().trim().to_string();
        sanitized_entry
            .iter()
            .any(|name| sanitized_display_name.contains(name))
    }
}
