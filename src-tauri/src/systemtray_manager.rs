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

use log::{error, info};

use tauri::{
    menu::{Menu, MenuItem, PredefinedMenuItem},
    tray::TrayIcon,
    AppHandle, Manager, Wry,
};

use crate::utils::{
    formatting_utils::{format_currency, format_hashrate},
    platform_utils::{CurrentOperatingSystem, PlatformUtils},
};

const LOG_TARGET: &str = "tari::universe::systemtray_manager";

#[derive(Debug)]
pub enum SystrayItemId {
    CpuHashrate,
    GpuHashrate,
    EstimatedEarning,
    MinimizeToggle,
}

impl SystrayItemId {
    pub fn to_str(&self) -> &str {
        match self {
            SystrayItemId::CpuHashrate => "cpu_hashrate",
            SystrayItemId::GpuHashrate => "gpu_hashrate",
            SystrayItemId::EstimatedEarning => "estimated_earning",
            SystrayItemId::MinimizeToggle => "minimize_toggle",
        }
    }

    pub fn get_title(&self, value: f64) -> String {
        match self {
            SystrayItemId::CpuHashrate => format!("CPU Power: {}", format_hashrate(value)),
            SystrayItemId::GpuHashrate => format!("GPU Power: {}", format_hashrate(value)),
            SystrayItemId::EstimatedEarning => {
                format!("Est. Earning: {}", format_currency(value, "tXTM/day"))
            }
            SystrayItemId::MinimizeToggle => "Minimize/Unminimize".to_string(),
        }
    }
}
#[derive(Debug, Clone, Default)]
pub struct SystemTrayData {
    pub cpu_hashrate: f64,
    pub gpu_hashrate: f64,
    pub estimated_earning: f64,
}

#[derive(Clone)]
pub struct SystemTrayManager {
    pub tray: Option<TrayIcon>,
    pub menu: Option<Menu<Wry>>,
}

impl SystemTrayManager {
    pub fn new() -> Self {
        Self {
            tray: None,
            menu: None,
        }
    }

    fn initialize_menu(&self, app: AppHandle) -> Result<Menu<Wry>, anyhow::Error> {
        info!(target: LOG_TARGET, "Initializing system tray menu");
        // Default behavior only works on MacOS for now
        #[cfg(target_os = "macos")]
        let about = PredefinedMenuItem::about(&app, None, None)?;
        let separator = PredefinedMenuItem::separator(&app)?;
        let cpu_hashrate = MenuItem::with_id(
            &app,
            SystrayItemId::CpuHashrate.to_str(),
            SystrayItemId::CpuHashrate.get_title(0.0),
            false,
            None::<&str>,
        )?;
        let gpu_hashrate = MenuItem::with_id(
            &app,
            SystrayItemId::GpuHashrate.to_str(),
            SystrayItemId::GpuHashrate.get_title(0.0),
            false,
            None::<&str>,
        )?;
        let estimated_earning = MenuItem::with_id(
            &app,
            SystrayItemId::EstimatedEarning.to_str(),
            SystrayItemId::EstimatedEarning.get_title(0.0),
            false,
            None::<&str>,
        )?;
        let minimize_toggle = MenuItem::with_id(
            &app,
            SystrayItemId::MinimizeToggle.to_str(),
            SystrayItemId::MinimizeToggle.get_title(0.0),
            true,
            None::<&str>,
        )?;

        let menu = Menu::with_items(
            &app,
            &[
                #[cfg(target_os = "macos")]
                &about,
                #[cfg(target_os = "macos")]
                &separator,
                &cpu_hashrate,
                &gpu_hashrate,
                &separator,
                &estimated_earning,
                &separator,
                &minimize_toggle,
            ],
        )?;
        Ok(menu)
    }
    fn get_tooltip_text(&self, data: SystemTrayData) -> Option<String> {
        match PlatformUtils::detect_current_os() {
            CurrentOperatingSystem::Linux => None,
            _ => Some(format!(
                "CPU Power: {}\nGPU Power: {}\nEst. earning: {}",
                format_hashrate(data.cpu_hashrate),
                format_hashrate(data.gpu_hashrate),
                format_currency(data.estimated_earning / 1_000_000.0, "tXTM/day")
            )),
        }
    }

    pub fn initialize_tray(&mut self, app: AppHandle) -> Result<(), anyhow::Error> {
        let tray = app.tray_by_id("universe-tray-id").expect("tray not found");
        let menu = self.initialize_menu(app.clone())?;
        tray.set_menu(Some(menu.clone()))?;

        tray.on_menu_event(move |app, event| match event.id.as_ref() {
            "minimize_toggle" => {
                let window = match app.get_webview_window("main") {
                    Some(window) => window,
                    None => {
                        error!(target: LOG_TARGET, "Failed to get main window");
                        return;
                    }
                };

                if window.is_minimized().unwrap_or(false) {
                    info!(target: LOG_TARGET, "Unminimizing window");
                    match PlatformUtils::detect_current_os() {
                        CurrentOperatingSystem::Linux => {
                            window.hide().unwrap_or_else(|error| error!(target: LOG_TARGET, "Failed hide window: {}", error));
                            window.unminimize().unwrap_or_else(|error| error!(target: LOG_TARGET, "Failed to unminimize window: {}", error));
                            window.show().unwrap_or_else(|error| error!(target: LOG_TARGET, "Failed to show window: {}", error));
                            window.set_focus().unwrap_or_else(|error| error!(target: LOG_TARGET, "Failed to set focus on window: {}", error));
                        }
                        _ => {
                            window.unminimize().unwrap_or_else(|error| {
                                error!(target: LOG_TARGET, "Failed to unminimize window: {}", error);
                            });
                            window.set_focus().unwrap_or_else(|error| {
                                error!(target: LOG_TARGET, "Failed to set focus on window: {}", error);
                            });
                        }
                    }
                } else {
                    info!(target: LOG_TARGET, "Minimizing window");
                    window.minimize().unwrap_or_else(|error| {
                        error!(target: LOG_TARGET, "Failed to minimize window: {}", error);
                    });
                }
            },
            _ => {
                error!(target: LOG_TARGET, "menu item {:?} not handled", event.id);
            }
        });

        self.menu.replace(menu);
        self.tray.replace(tray);

        Ok(())
    }

    pub fn update_tray(&mut self, data: SystemTrayData) {
        if let Some(tray) = &self.tray {
            if let Err(e) = tray.set_tooltip(self.get_tooltip_text(data.clone())) {
                error!(target: LOG_TARGET, "Failed to update tooltip: {}", e);
            }
        } else {
            error!(target: LOG_TARGET, "Tray not initialized");
        }
        if let Some(menu) = &self.menu {
            for (id, value) in [
                (SystrayItemId::CpuHashrate, data.cpu_hashrate),
                (SystrayItemId::GpuHashrate, data.gpu_hashrate),
                (
                    SystrayItemId::EstimatedEarning,
                    data.estimated_earning / 1_000_000.0,
                ),
            ] {
                if let Some(item) = menu.get(id.to_str()) {
                    if let Some(menu_item) = item.as_menuitem() {
                        if let Err(e) = menu_item.set_text(id.get_title(value)) {
                            error!(target: LOG_TARGET, "Failed to update menu field: {}", e);
                        }
                    } else {
                        error!(target: LOG_TARGET, "Failed to get menu item for {:?}", id);
                    }
                } else {
                    error!(target: LOG_TARGET, "Failed to get menu item by id for {:?}", id);
                }
            }
        } else {
            error!(target: LOG_TARGET, "Menu not initialized");
        }
    }
}
