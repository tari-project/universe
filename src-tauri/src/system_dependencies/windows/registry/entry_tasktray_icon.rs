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

use winreg::{HKEY, RegKey, enums::HKEY_CURRENT_USER};

use crate::system_dependencies::windows::registry::WindowsRegistryReader;

pub struct WindowsRegistryTasktratIconEntry {
    pub executable_path: String,
    pub is_promoted: Option<bool>,
}

impl WindowsRegistryTasktratIconEntry {
    pub fn is_promoted(&self) -> bool {
        self.is_promoted.unwrap_or(false)
    }
    pub fn is_tari_icon(&self) -> bool {
        self.executable_path.to_lowercase().contains("tari")
    }
}

pub struct WindowsRegistryTasktrayIconResolver {}

impl WindowsRegistryReader for WindowsRegistryTasktrayIconResolver {
    type Entry = Vec<WindowsRegistryTasktratIconEntry>;

    fn read_registry() -> Result<Self::Entry, anyhow::Error> {
        let hkcu_key = RegKey::predef(Self::get_registry_root());
        let tasktray_icon_path = hkcu_key.open_subkey(Self::get_registry_path())?;
        let mut tasktray_icon_entries = Vec::new();

        for subkey_name in tasktray_icon_path.enum_keys() {
            if let Ok(subkey_name) = &subkey_name {
                if let Ok(subkey) = tasktray_icon_path.open_subkey(subkey_name) {
                    let executable_path: Result<String, std::io::Error> =
                        subkey.get_value("ExecutablePath");
                    let is_promoted: Result<u32, std::io::Error> = subkey.get_value("isPromoted");

                    if let Ok(executable_path) = executable_path {
                        let is_promoted = is_promoted.ok().map(|v| v != 0);
                        let entry = WindowsRegistryTasktratIconEntry {
                            executable_path,
                            is_promoted,
                        };
                        tasktray_icon_entries.push(entry);
                    }
                }
            }
        }

        Ok(tasktray_icon_entries)
    }

    fn get_registry_path() -> String {
        "Control Panel\\NotifyIconSettings".to_string()
    }
    fn get_registry_root() -> HKEY {
        HKEY_CURRENT_USER
    }
}

impl WindowsRegistryTasktrayIconResolver {
    pub async fn set_icon_promoted(
        executable_path: &str,
        promote: bool,
    ) -> Result<(), anyhow::Error> {
        let hkcu_key = RegKey::predef(WindowsRegistryTasktrayIconResolver::get_registry_root());
        let tasktray_icon_path = hkcu_key.open_subkey_with_flags(
            WindowsRegistryTasktrayIconResolver::get_registry_path(),
            winreg::enums::KEY_ALL_ACCESS,
        )?;

        for subkey_name in tasktray_icon_path.enum_keys() {
            if let Ok(subkey_name) = &subkey_name {
                if let Ok(subkey) = tasktray_icon_path
                    .open_subkey_with_flags(subkey_name, winreg::enums::KEY_ALL_ACCESS)
                {
                    let current_executable_path: Result<String, std::io::Error> =
                        subkey.get_value("ExecutablePath");

                    if let Ok(current_executable_path) = current_executable_path {
                        if current_executable_path.eq_ignore_ascii_case(executable_path) {
                            subkey.set_value("isPromoted", &(if promote { 1u32 } else { 0u32 }))?;
                            break;
                        }
                    }
                }
            }
        }

        Ok(())
    }
}
