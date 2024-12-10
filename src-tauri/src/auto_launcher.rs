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
use planif::{
    enums::TaskCreationFlags,
    schedule::TaskScheduler,
    schedule_builder::{Action, ScheduleBuilder},
    settings::{LogonType, PrincipalSettings, RunLevel, Settings},
};
use tauri::utils::platform::current_exe;
use tokio::sync::RwLock;
use whoami::username;

const LOG_TARGET: &str = "tari::universe::auto_launcher";

static INSTANCE: LazyLock<AutoLauncher> = LazyLock::new(AutoLauncher::new);

pub enum CurrentOperatingSystem {
    Windows,
    Linux,
    MacOS,
}

pub struct AutoLauncher {
    auto_launcher: RwLock<Option<AutoLaunch>>,
}

impl AutoLauncher {
    fn new() -> Self {
        Self {
            auto_launcher: RwLock::new(None),
        }
    }

    fn detect_current_os() -> CurrentOperatingSystem {
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

    fn build_auto_launcher(app_name: &str, app_path: &str) -> Result<AutoLaunch, anyhow::Error> {
        info!(target: LOG_TARGET, "Building auto-launcher with app_name: {} and app_path: {}", app_name, app_path);

        match AutoLauncher::detect_current_os() {
            CurrentOperatingSystem::Windows => {
                return AutoLaunchBuilder::new()
                    .set_app_name(app_name)
                    .set_app_path(app_path)
                    .set_use_launch_agent(false)
                    .build()
                    .map_err(|e| e.into());
            }
            CurrentOperatingSystem::Linux => {
                return AutoLaunchBuilder::new()
                    .set_app_name(app_name)
                    .set_app_path(app_path)
                    .set_use_launch_agent(false)
                    .build()
                    .map_err(|e| e.into());
            }
            CurrentOperatingSystem::MacOS => {
                return AutoLaunchBuilder::new()
                    .set_app_name(app_name)
                    .set_app_path(app_path)
                    .set_use_launch_agent(true)
                    .build()
                    .map_err(|e| e.into());
            }
        }
    }

    fn toggle_auto_launcher(
        auto_launcher: &AutoLaunch,
        config_is_auto_launcher_enabled: bool,
    ) -> Result<(), anyhow::Error> {
        let is_auto_launcher_enabled = auto_launcher.is_enabled().unwrap_or(false);

        if config_is_auto_launcher_enabled && !is_auto_launcher_enabled {
            info!(target: LOG_TARGET, "Enabling auto-launcher");
            match AutoLauncher::detect_current_os() {
                CurrentOperatingSystem::MacOS => {
                    // This for some reason fixes the issue where macOS starts two instances of the app
                    // when auto-launcher is enabled and when during shutdown user selects to reopen the apps after restart
                    auto_launcher.disable()?;
                    auto_launcher.enable()?;
                }
                _ => {
                    auto_launcher.enable()?;
                }
            }
            auto_launcher.enable()?;
        }

        if !config_is_auto_launcher_enabled && is_auto_launcher_enabled {
            info!(target: LOG_TARGET, "Disabling auto-launcher");
            auto_launcher.disable()?;
        }

        Ok(())
    }

    async fn toggle_windows_admin_auto_launcher(
        &self,
        config_is_auto_launcher_enabled: bool,
    ) -> Result<(), anyhow::Error> {
        if config_is_auto_launcher_enabled {
            info!(target: LOG_TARGET, "Enabling admin auto-launcher");
            self.create_task_scheduler_for_admin_startup(true)
                .await
                .map_err(|e| anyhow!("Failed to create task scheduler for admin startup: {}", e));
        }

        if !config_is_auto_launcher_enabled {
            info!(target: LOG_TARGET, "Disabling admin auto-launcher");
            self.create_task_scheduler_for_admin_startup(false)
                .await
                .map_err(|e| anyhow!("Failed to create task scheduler for admin startup: {}", e));
        }

        Ok(())
    }

    pub async fn create_task_scheduler_for_admin_startup(
        &self,
        is_triggered: bool,
    ) -> Result<(), Box<dyn std::error::Error>> {
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

        schedule_builder
            .create_logon()
            .author("Tari Universe")?
            .trigger("startup_trigger", is_triggered)?
            .action(Action::new("startup_action", &app_path, "", ""))?
            .principal(PrincipalSettings {
                display_name: "Tari Universe".to_string(),
                group_id: None,
                user_id: Some(username()),
                id: "Tari universe principal".to_string(),
                logon_type: LogonType::InteractiveToken,
                run_level: RunLevel::Highest,
            })?
            .settings(Settings {
                stop_if_going_on_batteries: Some(false),
                start_when_available: Some(true),
                run_only_if_network_available: Some(false),
                run_only_if_idle: Some(false),
                enabled: Some(true),
                disallow_start_if_on_batteries: Some(false),
                ..Default::default()
            })?
            .build()?
            .register(
                "Tari Universe startup",
                TaskCreationFlags::CreateOrUpdate as i32,
            )?;

        Ok(())
    }

    pub async fn initialize_auto_launcher(
        &self,
        is_auto_launcher_enabled: bool,
    ) -> Result<(), anyhow::Error> {
        info!(target: LOG_TARGET, "Initializing auto-launcher");

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

        info!(target: LOG_TARGET, "Building auto-launcher with app_name: {} and app_path: {}", app_name, app_path);
        let auto_launcher = AutoLauncher::build_auto_launcher(app_name, &app_path)?;

        AutoLauncher::toggle_auto_launcher(&auto_launcher, is_auto_launcher_enabled)?;
        #[cfg(target_os = "windows")]
        self.toggle_windows_admin_auto_launcher(is_auto_launcher_enabled)
            .await?;

        let _ = &self.auto_launcher.write().await.replace(auto_launcher);

        Ok(())
    }

    pub async fn update_auto_launcher(
        &self,
        is_auto_launcher_enabled: bool,
    ) -> Result<(), anyhow::Error> {
        info!(target: LOG_TARGET, "Updating auto-launcher");
        let auto_launcher = self.auto_launcher.read().await;

        if auto_launcher.is_none() {
            warn!(target: LOG_TARGET, "Auto-launcher is not initialized. Initializing auto-launcher");
            drop(auto_launcher);
            self.initialize_auto_launcher(is_auto_launcher_enabled)
                .await?;
        } else {
            let auto_launcher_ref = auto_launcher.as_ref();
            match auto_launcher_ref {
                Some(auto_launcher) => {
                    AutoLauncher::toggle_auto_launcher(auto_launcher, is_auto_launcher_enabled)?;
                    #[cfg(target_os = "windows")]
                    self.toggle_windows_admin_auto_launcher(is_auto_launcher_enabled)
                        .await?;
                }
                None => {
                    warn!(target: LOG_TARGET, "Could not get auto-launcher reference");
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
