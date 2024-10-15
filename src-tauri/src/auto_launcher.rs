use std::sync::LazyLock;

use anyhow::anyhow;
use auto_launch::{AutoLaunch, AutoLaunchBuilder};
use dunce::canonicalize;
use log::{info, warn};
use tauri::utils::platform::current_exe;
use tokio::sync::RwLock;

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
