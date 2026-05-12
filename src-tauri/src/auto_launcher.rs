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

#[cfg(target_os = "windows")]
use anyhow::Context;
use anyhow::anyhow;
use auto_launch::{AutoLaunch, AutoLaunchBuilder};
use dunce::canonicalize;
use log::{info, warn};
#[cfg(target_os = "windows")]
use planif::{
    enums::TaskCreationFlags,
    schedule::TaskScheduler as PlanifTaskScheduler,
    schedule_builder::{Action, ScheduleBuilder},
    settings::{LogonType, PrincipalSettings, RunLevel, Settings},
};
use tauri::utils::platform::current_exe;
use tokio::sync::RwLock;
#[cfg(target_os = "windows")]
use whoami::username;
#[cfg(target_os = "windows")]
use windows::{
    Win32::System::{
        Com::{CLSCTX_ALL, CoCreateInstance, VARIANT},
        TaskScheduler::{ITaskFolder, ITaskService, TaskScheduler as WindowsTaskScheduler},
    },
    core::{BSTR, Error as WindowsError},
};

use crate::{
    LOG_TARGET_APP_LOGIC,
    utils::platform_utils::{CurrentOperatingSystem, PlatformUtils},
};

static INSTANCE: LazyLock<AutoLauncher> = LazyLock::new(AutoLauncher::new);
#[cfg(target_os = "windows")]
const WINDOWS_STARTUP_TASK_NAME: &str = "Tari Universe startup";
#[cfg(target_os = "windows")]
const HRESULT_FROM_WIN32_FILE_NOT_FOUND: i32 = -2147024894;

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

        match PlatformUtils::detect_current_os() {
            CurrentOperatingSystem::Windows => {
                if config_is_auto_launcher_enabled {
                    info!(target: LOG_TARGET_APP_LOGIC, "Enabling Windows auto-launcher");
                    let did_enable_auto_launcher = !auto_launcher_is_enabled;
                    if !auto_launcher_is_enabled {
                        auto_launcher.enable()?;
                    }

                    #[cfg(target_os = "windows")]
                    if let Err(error) = self.toggle_windows_admin_auto_launcher(true).await {
                        if did_enable_auto_launcher {
                            let _unused = auto_launcher.disable().inspect_err(|disable_error| {
                                warn!(target: LOG_TARGET_APP_LOGIC, "Failed to roll back Windows auto-launcher after task scheduler error: {}", disable_error)
                            });
                        }

                        return Err(error);
                    }
                } else {
                    info!(target: LOG_TARGET_APP_LOGIC, "Disabling Windows auto-launcher");

                    #[cfg(target_os = "windows")]
                    self.toggle_windows_admin_auto_launcher(false).await?;

                    if auto_launcher_is_enabled {
                        auto_launcher.disable()?;
                    }
                }
            }
            CurrentOperatingSystem::MacOS => {
                if should_toggle_to_enabled || should_ensure_to_enable_at_first_startup {
                    info!(target: LOG_TARGET_APP_LOGIC, "Enabling auto-launcher");
                    // This for some reason fixes the issue where macOS starts two instances of the app
                    // when auto-launcher is enabled and when during shutdown user selects to reopen the apps after restart
                    auto_launcher.disable()?;
                    auto_launcher.enable()?;
                } else if should_toggle_to_disabled {
                    info!(target: LOG_TARGET_APP_LOGIC, "Disabling auto-launcher");
                    auto_launcher.disable()?;
                } else {
                    warn!(target: LOG_TARGET_APP_LOGIC, "Auto-launcher is already in the desired state");
                }
            }
            _ => {
                if should_toggle_to_enabled || should_ensure_to_enable_at_first_startup {
                    info!(target: LOG_TARGET_APP_LOGIC, "Enabling auto-launcher");
                    auto_launcher.enable()?;
                } else if should_toggle_to_disabled {
                    info!(target: LOG_TARGET_APP_LOGIC, "Disabling auto-launcher");
                    auto_launcher.disable()?;
                } else {
                    warn!(target: LOG_TARGET_APP_LOGIC, "Auto-launcher is already in the desired state");
                }
            }
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
            if let Err(error) = self
                .create_task_scheduler_for_admin_startup_with_run_level(RunLevel::Highest)
                .await
            {
                warn!(target: LOG_TARGET_APP_LOGIC, "Failed to create highest-privilege admin auto-launcher: {}. Retrying with least privileges", error);
                self.create_task_scheduler_for_admin_startup_with_run_level(RunLevel::LUA)
                    .await
                    .map_err(|fallback_error| {
                        anyhow!(
                            "Failed to create task scheduler for admin startup: {}; fallback also failed: {}",
                            error,
                            fallback_error
                        )
                    })?;
            }

            if !self.windows_startup_task_exists()? {
                return Err(anyhow!(
                    "Task scheduler entry '{}' was not found after registration",
                    WINDOWS_STARTUP_TASK_NAME
                ));
            }
        };

        if !should_be_enabled {
            info!(target: LOG_TARGET_APP_LOGIC, "Disabling admin auto-launcher");
            self.delete_task_scheduler_for_admin_startup()
                .context("Failed to delete task scheduler for admin startup")?;
        };

        Ok(())
    }

    #[cfg(target_os = "windows")]
    fn with_windows_task_folder<T>(
        &self,
        operation: impl FnOnce(&ITaskFolder) -> Result<T, WindowsError>,
    ) -> Result<T, anyhow::Error> {
        let task_scheduler = PlanifTaskScheduler::new()?;
        let _com_runtime = task_scheduler.get_com();

        let task_service: ITaskService =
            unsafe { CoCreateInstance(&WindowsTaskScheduler, None, CLSCTX_ALL)? };
        unsafe {
            task_service.Connect(
                VARIANT::default(),
                VARIANT::default(),
                VARIANT::default(),
                VARIANT::default(),
            )?;

            let task_folder = task_service.GetFolder(&BSTR::from("\\"))?;
            Ok(operation(&task_folder)?)
        }
    }

    #[cfg(target_os = "windows")]
    fn windows_startup_task_exists(&self) -> Result<bool, anyhow::Error> {
        self.with_windows_task_folder(|task_folder| unsafe {
            match task_folder.GetTask(&BSTR::from(WINDOWS_STARTUP_TASK_NAME)) {
                Ok(_) => Ok(true),
                Err(error) if error.code().0 == HRESULT_FROM_WIN32_FILE_NOT_FOUND => Ok(false),
                Err(error) => Err(error),
            }
        })
    }

    #[cfg(target_os = "windows")]
    fn delete_task_scheduler_for_admin_startup(&self) -> Result<(), anyhow::Error> {
        self.with_windows_task_folder(|task_folder| unsafe {
            match task_folder.DeleteTask(&BSTR::from(WINDOWS_STARTUP_TASK_NAME), 0) {
                Ok(()) => {
                    info!(target: LOG_TARGET_APP_LOGIC, "Task scheduler for admin startup deleted");
                    Ok(())
                }
                Err(error) if error.code().0 == HRESULT_FROM_WIN32_FILE_NOT_FOUND => {
                    info!(target: LOG_TARGET_APP_LOGIC, "Task scheduler for admin startup was already absent");
                    Ok(())
                }
                Err(error) => Err(error),
            }
        })
    }

    #[cfg(target_os = "windows")]
    pub async fn create_task_scheduler_for_admin_startup(
        &self,
    ) -> Result<(), Box<dyn std::error::Error>> {
        self.create_task_scheduler_for_admin_startup_with_run_level(RunLevel::Highest)
            .await
    }

    #[cfg(target_os = "windows")]
    async fn create_task_scheduler_for_admin_startup_with_run_level(
        &self,
        run_level: RunLevel,
    ) -> Result<(), Box<dyn std::error::Error>> {
        use planif::settings::{Duration, IdleSettings, InstancesPolicy};

        let task_scheduler = PlanifTaskScheduler::new()?;
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
            .create_logon()
            .author("Tari Universe")?
            .trigger("startup_trigger", true)?
            .action(Action::new("startup_action", &app_path, "", ""))?
            .principal(PrincipalSettings {
                display_name: "Tari Universe".to_string(),
                group_id: None,
                user_id: Some(username()),
                id: "Tari universe principal".to_string(),
                logon_type: LogonType::InteractiveToken,
                run_level,
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
                WINDOWS_STARTUP_TASK_NAME,
                TaskCreationFlags::CreateOrUpdate as i32,
            )?;

        info!(target: LOG_TARGET_APP_LOGIC, "Task scheduler for admin startup created");

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
