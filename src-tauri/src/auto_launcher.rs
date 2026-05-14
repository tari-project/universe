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

use std::sync::LazyLock;

use anyhow::anyhow;
use auto_launch::{AutoLaunch, AutoLaunchBuilder};
use dunce::canonicalize;
use log::{info, warn};
use tauri::utils::platform::current_exe;
use tokio::sync::RwLock;

use crate::{
    LOG_TARGET_APP_LOGIC,
    utils::platform_utils::{CurrentOperatingSystem, PlatformUtils},
};

static INSTANCE: LazyLock<AutoLauncher> = LazyLock::new(AutoLauncher::new);
#[cfg(target_os = "windows")]
const WINDOWS_STARTUP_TASK_NAME: &str = "Tari Universe startup";

pub struct AutoLauncher {
    auto_launcher: RwLock<Option<AutoLaunch>>,
}

impl AutoLauncher {
    fn new() -> Self {
        Self {
            auto_launcher: RwLock::new(None),
        }
    }

    fn build_auto_launcher(app_name: &str, app_path: &str) -> Result<AutoLaunch, anyhow::Error> {
        info!(target: LOG_TARGET_APP_LOGIC, "Building auto-launcher with app_name: {app_name} and app_path: {app_path}");

        match PlatformUtils::detect_current_os() {
            CurrentOperatingSystem::Windows => AutoLaunchBuilder::new()
                .set_app_name(app_name)
                .set_app_path(app_path)
                .set_use_launch_agent(false)
                .build()
                .map_err(|e| e.into()),
            CurrentOperatingSystem::Linux => AutoLaunchBuilder::new()
                .set_app_name(app_name)
                .set_app_path(app_path)
                .set_use_launch_agent(false)
                .build()
                .map_err(|e| e.into()),
            CurrentOperatingSystem::MacOS => AutoLaunchBuilder::new()
                .set_app_name(app_name)
                .set_app_path(app_path)
                .set_use_launch_agent(true)
                .build()
                .map_err(|e| e.into()),
        }
    }

    async fn toggle_auto_launcher(
        &self,
        auto_launcher: &AutoLaunch,
        config_is_auto_launcher_enabled: bool,
    ) -> Result<(), anyhow::Error> {
        info!(target: LOG_TARGET_APP_LOGIC, "Toggling auto-launcher");
        let auto_launcher_is_enabled = auto_launcher.is_enabled()?;
        info!(target: LOG_TARGET_APP_LOGIC, "Auto-launcher is enabled: {auto_launcher_is_enabled}, config_is_auto_launcher_enabled: {config_is_auto_launcher_enabled}");

        let should_toggle_to_enabled = config_is_auto_launcher_enabled && !auto_launcher_is_enabled;
        let should_ensure_to_enable_at_first_startup =
            auto_launcher_is_enabled && config_is_auto_launcher_enabled;

        let should_toggle_to_disabled =
            !config_is_auto_launcher_enabled && auto_launcher_is_enabled;
        let should_ensure_windows_task_disabled = !config_is_auto_launcher_enabled
            && matches!(
                PlatformUtils::detect_current_os(),
                CurrentOperatingSystem::Windows
            );

        if should_toggle_to_enabled || should_ensure_to_enable_at_first_startup {
            info!(target: LOG_TARGET_APP_LOGIC, "Enabling auto-launcher");
            match PlatformUtils::detect_current_os() {
                CurrentOperatingSystem::MacOS => {
                    // This for some reason fixes the issue where macOS starts two instances of the app
                    // when auto-launcher is enabled and when during shutdown user selects to reopen the apps after restart
                    auto_launcher.disable()?;
                    auto_launcher.enable()?;
                }
                CurrentOperatingSystem::Windows => {
                    auto_launcher.enable()?;
                    #[cfg(target_os = "windows")]
                    self.toggle_windows_admin_auto_launcher(true).await?;
                }
                _ => {
                    auto_launcher.enable()?;
                }
            }
        } else if should_toggle_to_disabled || should_ensure_windows_task_disabled {
            info!(target: LOG_TARGET_APP_LOGIC, "Disabling auto-launcher");
            match PlatformUtils::detect_current_os() {
                CurrentOperatingSystem::Windows => {
                    #[cfg(target_os = "windows")]
                    self.toggle_windows_admin_auto_launcher(false).await?;
                    if auto_launcher_is_enabled {
                        auto_launcher.disable()?;
                    }
                }
                _ => {
                    auto_launcher.disable()?;
                }
            }
        } else {
            warn!(target: LOG_TARGET_APP_LOGIC, "Auto-launcher is already in the desired state");
        }

        Ok(())
    }

    #[cfg(target_os = "windows")]
    async fn toggle_windows_admin_auto_launcher(
        &self,
        should_be_enabled: bool,
    ) -> Result<(), anyhow::Error> {
        if should_be_enabled {
            info!(target: LOG_TARGET_APP_LOGIC, "Enabling admin auto-launcher");
            self.create_task_scheduler_for_admin_startup()
                .await
                .map_err(|e| anyhow!("Failed to create task scheduler for admin startup: {}", e))?;
        } else {
            info!(target: LOG_TARGET_APP_LOGIC, "Disabling admin auto-launcher");
            self.delete_task_scheduler_for_admin_startup()
                .await
                .map_err(|e| anyhow!("Failed to delete task scheduler for admin startup: {}", e))?;
        };

        Ok(())
    }

    #[cfg(target_os = "windows")]
    pub async fn create_task_scheduler_for_admin_startup(&self) -> Result<(), anyhow::Error> {
        let app_exe = current_exe()?;
        let app_exe = canonicalize(&app_exe)?;
        let app_path = app_exe
            .as_os_str()
            .to_str()
            .ok_or(anyhow!("Failed to convert path to string"))?
            .to_string();

        info!(target: LOG_TARGET_APP_LOGIC, "Creating task scheduler for admin startup with app_path: {}", app_path);

        let task_run_command = quote_schtasks_task_run_path(&app_path);
        run_schtasks(&[
            "/Create",
            "/TN",
            WINDOWS_STARTUP_TASK_NAME,
            "/TR",
            &task_run_command,
            "/SC",
            "ONLOGON",
            "/RL",
            "HIGHEST",
            "/F",
        ])
        .await?;

        info!(target: LOG_TARGET_APP_LOGIC, "Task scheduler for admin startup created");

        Ok(())
    }

    #[cfg(target_os = "windows")]
    pub async fn delete_task_scheduler_for_admin_startup(&self) -> Result<(), anyhow::Error> {
        info!(target: LOG_TARGET_APP_LOGIC, "Deleting task scheduler for admin startup");

        match delete_windows_startup_task().await? {
            WindowsStartupTaskDeleteResult::Deleted => {
                info!(target: LOG_TARGET_APP_LOGIC, "Task scheduler for admin startup deleted");
            }
            WindowsStartupTaskDeleteResult::NotFound => {
                info!(target: LOG_TARGET_APP_LOGIC, "Task scheduler for admin startup does not exist");
            }
        }

        Ok(())
    }

    pub async fn initialize_auto_launcher(
        &self,
        is_auto_launcher_enabled: bool,
    ) -> Result<(), anyhow::Error> {
        info!(target: LOG_TARGET_APP_LOGIC, "Initializing auto-launcher");

        let app_exe = current_exe()?;
        let app_exe = canonicalize(&app_exe)?;
        let app_name = app_exe
            .file_stem()
            .and_then(|file| file.to_str())
            .ok_or(anyhow!("Failed to get file stem"))?;

        let app_path = app_exe
            .as_os_str()
            .to_str()
            .ok_or(anyhow!("Failed to convert path to string"))?
            .to_string();

        info!(target: LOG_TARGET_APP_LOGIC, "Building auto-launcher with app_name: {app_name} and app_path: {app_path}");
        let auto_launcher = AutoLauncher::build_auto_launcher(app_name, &app_path)?;

        info!(target: LOG_TARGET_APP_LOGIC, "Auto-launcher built");

        self.toggle_auto_launcher(&auto_launcher, is_auto_launcher_enabled)
            .await?;

        info!(target: LOG_TARGET_APP_LOGIC, "Auto-launcher toggled");

        let _ = &self.auto_launcher.write().await.replace(auto_launcher);

        info!(target: LOG_TARGET_APP_LOGIC, "Auto-launcher initialized");

        Ok(())
    }

    pub async fn update_auto_launcher(
        &self,
        is_auto_launcher_enabled: bool,
    ) -> Result<(), anyhow::Error> {
        info!(target: LOG_TARGET_APP_LOGIC, "Updating auto-launcher");
        let auto_launcher = self.auto_launcher.read().await;

        if auto_launcher.is_none() {
            warn!(target: LOG_TARGET_APP_LOGIC, "Auto-launcher is not initialized. Initializing auto-launcher");
            drop(auto_launcher);
            self.initialize_auto_launcher(is_auto_launcher_enabled)
                .await?;
        } else {
            let auto_launcher_ref = auto_launcher.as_ref();
            match auto_launcher_ref {
                Some(auto_launcher) => {
                    self.toggle_auto_launcher(auto_launcher, is_auto_launcher_enabled)
                        .await?;
                }
                None => {
                    warn!(target: LOG_TARGET_APP_LOGIC, "Could not get auto-launcher reference");
                    drop(auto_launcher);
                }
            }
        }
        Ok(())
    }

    pub fn current() -> &'static AutoLauncher {
        &INSTANCE
    }
}

#[cfg(target_os = "windows")]
enum WindowsStartupTaskDeleteResult {
    Deleted,
    NotFound,
}

#[cfg(target_os = "windows")]
async fn delete_windows_startup_task() -> Result<WindowsStartupTaskDeleteResult, anyhow::Error> {
    match run_schtasks(&["/Delete", "/TN", WINDOWS_STARTUP_TASK_NAME, "/F"]).await {
        Ok(()) => Ok(WindowsStartupTaskDeleteResult::Deleted),
        Err(error) if is_schtasks_not_found_error(&error.to_string()) => {
            Ok(WindowsStartupTaskDeleteResult::NotFound)
        }
        Err(error) => Err(error),
    }
}

#[cfg(target_os = "windows")]
async fn run_schtasks(args: &[&str]) -> Result<(), anyhow::Error> {
    let output = tokio::process::Command::new("schtasks")
        .args(args)
        .output()
        .await?;

    if output.status.success() {
        return Ok(());
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    let stderr = String::from_utf8_lossy(&output.stderr);

    Err(anyhow!(
        "schtasks {:?} failed with status {:?}. stdout: {} stderr: {}",
        args,
        output.status.code(),
        stdout.trim(),
        stderr.trim()
    ))
}

#[cfg(any(target_os = "windows", test))]
fn quote_schtasks_task_run_path(app_path: &str) -> String {
    format!("\"{}\"", app_path.replace('"', "\\\""))
}

#[cfg(any(target_os = "windows", test))]
fn is_schtasks_not_found_error(error: &str) -> bool {
    let error = error.to_ascii_lowercase();

    error.contains("cannot find the file")
        || error.contains("the system cannot find the file")
        || error.contains("could not find")
}

#[cfg(test)]
mod tests {
    #[test]
    fn quote_schtasks_task_run_path_wraps_executable_paths() {
        let path = r"C:\Program Files\Tari Universe\Tari Universe.exe";

        assert_eq!(
            super::quote_schtasks_task_run_path(path),
            r#""C:\Program Files\Tari Universe\Tari Universe.exe""#
        );
    }

    #[test]
    fn quote_schtasks_task_run_path_escapes_embedded_quotes() {
        let path = r#"C:\Apps\Tari "Beta"\Tari Universe.exe"#;

        assert_eq!(
            super::quote_schtasks_task_run_path(path),
            r#""C:\Apps\Tari \"Beta\"\Tari Universe.exe""#
        );
    }

    #[test]
    fn is_schtasks_not_found_error_matches_windows_message() {
        assert!(super::is_schtasks_not_found_error(
            "schtasks failed. ERROR: The system cannot find the file specified."
        ));
    }

    #[test]
    fn is_schtasks_not_found_error_rejects_permission_errors() {
        assert!(!super::is_schtasks_not_found_error(
            "schtasks failed. ERROR: Access is denied."
        ));
    }
}
