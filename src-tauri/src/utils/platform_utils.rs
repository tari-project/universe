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

use std::fmt::Display;

use anyhow::anyhow;

use crate::UniverseAppState;

#[cfg(target_os = "macos")]
use super::macos_utils::is_app_in_applications_folder;

#[derive(Clone)]
pub enum CurrentOperatingSystem {
    Windows,
    Linux,
    MacOS,
}

impl Display for CurrentOperatingSystem {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            CurrentOperatingSystem::Windows => write!(f, "Windows"),
            CurrentOperatingSystem::Linux => write!(f, "Linux"),
            CurrentOperatingSystem::MacOS => write!(f, "MacOS"),
        }
    }
}

pub struct PlatformUtils {}
impl PlatformUtils {
    pub fn detect_current_os() -> CurrentOperatingSystem {
        if cfg!(target_os = "windows") {
            CurrentOperatingSystem::Windows
        } else if cfg!(target_os = "linux") {
            CurrentOperatingSystem::Linux
        } else if cfg!(target_os = "macos") {
            CurrentOperatingSystem::MacOS
        } else {
            panic!("Unsupported OS");
        }
    }

    pub async fn initialize_preqesities(app_handle: tauri::AppHandle) -> Result<(), anyhow::Error> {
        let current_os = PlatformUtils::detect_current_os();
        match current_os {
            CurrentOperatingSystem::Windows => {
                #[cfg(target_os = "windows")]
                PlatformUtils::initialize_windows_preqesities(app_handle).await?;
                Ok(())
            }
            CurrentOperatingSystem::Linux => {
                #[cfg(target_os = "linux")]
                PlatformUtils::initialize_linux_preqesities(app_handle).await?;
                Ok(())
            }
            CurrentOperatingSystem::MacOS => {
                #[cfg(target_os = "macos")]
                PlatformUtils::initialize_macos_preqesities(app_handle).await?;
                Ok(())
            }
        }
    }

    #[cfg(target_os = "macos")]
    async fn initialize_macos_preqesities(
        app_handle: tauri::AppHandle,
    ) -> Result<(), anyhow::Error> {
        let state = app_handle.state::<UniverseAppState>();
        if !cfg!(dev) && !is_app_in_applications_folder() {
            state
                .events_manager
                .handle_critical_problem(
                    &app_handle,
                    None,
                    Some("not-installed-in-applications-directory".to_string()),
                )
                .await;
            return Err(anyhow!(
                "App is not installed in the Applications directory"
            ));
        }
        Ok(())
    }

    #[cfg(target_os = "windows")]
    async fn initialize_windows_preqesities(
        app_handle: tauri::AppHandle,
    ) -> Result<(), anyhow::Error> {
        let state = app_handle.state::<UniverseAppState>();
        if cfg!(target_os = "windows") && !cfg!(dev) {
            ExternalDependencies::current()
                .read_registry_installed_applications()
                .await?;
            let is_missing = ExternalDependencies::current()
                .check_if_some_dependency_is_not_installed()
                .await;
            if is_missing {
                state
                    .events_manager
                    .handle_critical_problem(
                        &app_handle,
                        None,
                        Some("missing-required-dependencies".to_string()),
                    )
                    .await;
                return Err(anyhow!("Missing required dependencies"));
            }
        }
        Ok(())
    }

    #[cfg(target_os = "linux")]
    async fn initialize_linux_preqesities(
        app_handle: tauri::AppHandle,
    ) -> Result<(), anyhow::Error> {
        Ok(())
    }
}
