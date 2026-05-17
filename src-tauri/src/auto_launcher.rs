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
use log::{info, warn, error};
#[cfg(target_os = "windows")]
use planif::{
    enums::TaskCreationFlags,
    schedule::TaskScheduler,
    schedule_builder::{Action, ScheduleBuilder},
    settings::{LogonType, PrincipalSettings, RunLevel, Settings},
};
#[cfg(target_os = "windows")]
use winreg::enums::*;
#[cfg(target_os = "windows")]
use winreg::RegKey;
use tauri::utils::platform::current_exe;
use tokio::sync::RwLock;
#[cfg(target_os = "windows")]
use whoami::username;

use crate::{
    LOG_TARGET_APP_LOGIC,
    utils::platform_utils::{CurrentOperatingSystem, PlatformUtils},
};

static INSTANCE: LazyLock<AutoLauncher> = LazyLock::new(AutoLauncher::new);

const TASK_NAME: &str = "TariUniverseStartup";
const REGISTRY_KEY_PATH: &str = r"Software\Microsoft\Windows\CurrentVersion\Run";
const APP_REGISTRY_VALUE_NAME: &str = "TariUniverse";

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

        // On Windows, the auto_launcher.is_enabled() may not accurately reflect the state
        // because the auto-launch crate uses different mechanisms. We need to also check
        // our registry fallback state to get an accurate picture.
        let auto_launcher_is_enabled = auto_launcher.is_enabled()?;

        // For Windows, also check our registry fallback as a secondary indicator
        #[cfg(target_os = "windows")]
        let windows_registry_enabled = self.is_registry_auto_start_enabled();

        #[cfg(target_os = "windows")]
        let effective_is_enabled = auto_launcher_is_enabled || windows_registry_enabled;
        #[cfg(not(target_os = "windows"))]
        let effective_is_enabled = auto_launcher_is_enabled;

        info!(target: LOG_TARGET_APP_LOGIC, "Auto-launcher is enabled: {auto_launcher_is_enabled} (auto-launch), registry: {windows_registry_enabled}, effective: {effective_is_enabled}, config_is_auto_launcher_enabled: {config_is_auto_launcher_enabled}");

        let should_toggle_to_enabled = config_is_auto_launcher_enabled && !effective_is_enabled;
        let should_ensure_to_enable_at_first_startup =
            effective_is_enabled && config_is_auto_launcher_enabled;

        let should_toggle_to_disabled =
            !config_is_auto_launcher_enabled && effective_is_enabled;

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
                    // To startup application as admin on windows, we need to create a task scheduler
                    // Use registry fallback if task scheduler fails
                    #[cfg(target_os = "windows")]
                    {
                        if let Err(e) = self.toggle_windows_admin_auto_launcher(true).await {
                            error!(target: LOG_TARGET_APP_LOGIC, "Failed to enable admin auto-launcher via Task Scheduler: {}, attempting registry fallback", e);
                            if let Err(reg_err) = self.set_registry_auto_start(true) {
                                warn!(target: LOG_TARGET_APP_LOGIC, "Failed registry fallback for auto-launcher: {}", reg_err);
                                return Err(anyhow!("Failed to enable auto-launcher: Task Scheduler error: {}, Registry fallback error: {}", e, reg_err));
                            }
                        }
                    }
                }
                _ => {
                    auto_launcher.enable()?;
                }
            }
        } else if should_toggle_to_disabled {
            info!(target: LOG_TARGET_APP_LOGIC, "Disabling auto-launcher");
            match PlatformUtils::detect_current_os() {
                CurrentOperatingSystem::Windows => {
                    #[cfg(target_os = "windows")]
                    {
                        if let Err(e) = self.toggle_windows_admin_auto_launcher(false).await {
                            warn!(target: LOG_TARGET_APP_LOGIC, "Failed to disable admin auto-launcher via Task Scheduler: {}", e);
                        }
                        // Also clean up registry entry if it exists
                        if let Err(e) = self.set_registry_auto_start(false) {
                            warn!(target: LOG_TARGET_APP_LOGIC, "Failed to remove registry auto-start entry: {}", e);
                        }
                    }
                    auto_launcher.disable()?;
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
            self.create_task_scheduler_for_admin_startup(true)
                .await
                .map_err(|e| anyhow!("Failed to create task scheduler for admin startup: {}", e))?;
        };

        if !should_be_enabled {
            info!(target: LOG_TARGET_APP_LOGIC, "Disabling admin auto-launcher");
            self.create_task_scheduler_for_admin_startup(false)
                .await
                .map_err(|e| anyhow!("Failed to create task scheduler for admin startup: {}", e))?;
        };

        Ok(())
    }

    #[cfg(target_os = "windows")]
    pub async fn create_task_scheduler_for_admin_startup(
        &self,
        is_triggered: bool,
    ) -> Result<(), Box<dyn std::error::Error>> {
        use planif::settings::{Duration, IdleSettings, InstancesPolicy};

        let task_scheduler = TaskScheduler::new()?;
        let com_runtime = task_scheduler.get_com();
        let schedule_builder = ScheduleBuilder::new(&com_runtime)?;

        let app_exe = current_exe()?;
        let app_exe = canonicalize(&app_exe)?;

        let app_path = app_exe
            .as_os_str()
            .to_str()
            .ok_or(anyhow!("Failed to convert path to string"))?
            .to_string();

        info!(target: LOG_TARGET_APP_LOGIC, "Creating task scheduler for admin startup with app_path: {}", app_path);
        info!(target: LOG_TARGET_APP_LOGIC, "UserName: {}", username());

        let mut retry_interval = Duration::new();
        retry_interval.minutes = Some(1);

        let mut delay_duration = Duration::new();
        delay_duration.seconds = Some(30);
        delay_duration.minutes = Some(0);

        schedule_builder
            .create_boot()
            .author("Tari Universe")?
            .trigger("boot_trigger", is_triggered)?
            .action(Action::new("startup_action", &app_path, "", ""))?
            .principal(PrincipalSettings {
                display_name: "Tari Universe".to_string(),
                group_id: None,
                user_id: Some(username()),
                id: "Tari universe principal".to_string(),
                logon_type: LogonType::S4U,
                run_level: RunLevel::Highest,
            })?
            .settings(Settings {
                stop_if_going_on_batteries: Some(false),
                start_when_available: Some(true),
                run_only_if_network_available: Some(false),
                run_only_if_idle: Some(false),
                enabled: Some(true),
                disallow_start_if_on_batteries: Some(false),
                hidden: Some(false),
                multiple_instances_policy: Some(InstancesPolicy::Parallel),
                restart_count: Some(3),
                restart_interval: Some(retry_interval.to_string()),
                idle_settings: Some(IdleSettings {
                    stop_on_idle_end: Some(false),
                    restart_on_idle: Some(false),
                    ..Default::default()
                }),
                allow_demand_start: Some(true),
                ..Default::default()
            })?
            .delay(delay_duration)?
            .build()?
            .register(
                TASK_NAME,
                TaskCreationFlags::CreateOrUpdate as i32,
            )?;

        info!(target: LOG_TARGET_APP_LOGIC, "Task scheduler for admin startup created");

        Ok(())
    }

    #[cfg(target_os = "windows")]
    pub fn set_registry_auto_start(&self, enable: bool) -> Result<(), Box<dyn std::error::Error>> {
        let app_exe = current_exe()?;
        let app_exe = canonicalize(&app_exe)?;
        let app_path = app_exe
            .as_os_str()
            .to_str()
            .ok_or("Failed to convert path to string")?;

        let hkcu = RegKey::predef(HKEY_CURRENT_USER);
        let (run_key, _) = hkcu.create_subkey(REGISTRY_KEY_PATH)?;

        if enable {
            info!(target: LOG_TARGET_APP_LOGIC, "Adding Tari Universe to Windows registry auto-start: {}", app_path);
            run_key.set_value(APP_REGISTRY_VALUE_NAME, &app_path)?;
            info!(target: LOG_TARGET_APP_LOGIC, "Registry auto-start entry created successfully");
        } else {
            info!(target: LOG_TARGET_APP_LOGIC, "Removing Tari Universe from Windows registry auto-start");
            // Ignore error if value doesn't exist
            let _ = run_key.delete_value(APP_REGISTRY_VALUE_NAME);
            info!(target: LOG_TARGET_APP_LOGIC, "Registry auto-start entry removed");
        }

        Ok(())
    }

    #[cfg(target_os = "windows")]
    pub fn is_registry_auto_start_enabled(&self) -> bool {
        let hkcu = RegKey::predef(HKEY_CURRENT_USER);
        if let Ok(run_key) = hkcu.open_subkey(REGISTRY_KEY_PATH) {
            if let Ok(_value) = run_key.get_value::<String, _>(APP_REGISTRY_VALUE_NAME) {
                return true;
            }
        }
        false
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
