use human_format::Formatter;
use log::{error, info};

use tauri::{
    menu::{Menu, MenuItem},
    tray::{TrayIcon, TrayIconBuilder},
    AppHandle, Wry,
};

use crate::utils::platform_utils::{CurrentOperatingSystem, PlatformUtils};

const LOG_TARGET: &str = "tari::universe::systemtray_manager";

#[derive(Debug)]
pub enum SystrayItemId {
    CpuHashrate,
    GpuHashrate,
    EstimatedEarning,
}

impl SystrayItemId {
    pub fn to_str(&self) -> &str {
        match self {
            SystrayItemId::CpuHashrate => "cpu_hashrate",
            SystrayItemId::GpuHashrate => "gpu_hashrate",
            SystrayItemId::EstimatedEarning => "estimated_earning",
        }
    }

    pub fn get_title(&self, value: f64) -> String {
        match self {
            SystrayItemId::CpuHashrate => format!("CPU Hashrate: {:.2} H/s", value),
            SystrayItemId::GpuHashrate => format!("GPU Hashrate: {:.2} H/s", value),
            SystrayItemId::EstimatedEarning => format!("Estimated Earning: {:.2} tXTM/Day", value),
        }
    }
}
#[derive(Debug, Clone, Default)]
pub struct SystemTrayData {
    pub cpu_hashrate: f64,
    pub gpu_hashrate: f64,
    pub estimated_earning: f64,
}

pub struct SystemTrayManager {
    pub tray: Option<TrayIcon>,
    pub menu: Option<Menu<Wry>>,
    pub last_tray_data: SystemTrayData,
}

impl SystemTrayManager {
    pub fn new() -> Self {
        Self {
            tray: None,
            menu: None,
            last_tray_data: SystemTrayData::default(),
        }
    }

    fn initialize_menu(&self, app: AppHandle) -> Result<Menu<Wry>, anyhow::Error> {
        info!(target: LOG_TARGET, "Initializing system tray menu");
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

        let menu = Menu::with_items(&app, &[&cpu_hashrate, &gpu_hashrate, &estimated_earning])?;
        Ok(menu)
    }

    fn get_tooltip_text(&self) -> String {
        let data = self.last_tray_data.clone();

        match PlatformUtils::detect_current_os() {
            CurrentOperatingSystem::Linux => "Not supported".to_string(),
            _ => {
                format!(
                    "Hashrate \nCPU: {} H/s\nGPU: {} H/s\nEst. earning: {} tXTM/day",
                    Formatter::new()
                        .with_decimals(2)
                        .with_separator("")
                        .format(data.cpu_hashrate),
                    Formatter::new()
                        .with_decimals(2)
                        .with_separator("")
                        .format(data.gpu_hashrate),
                    Formatter::new()
                        .with_decimals(2)
                        .with_separator("")
                        .format(data.estimated_earning / 1_000_000.0)
                )
            }
        }
    }

    pub fn initialize_tray(&mut self, app: AppHandle) -> Result<(), anyhow::Error> {
        let menu = self.initialize_menu(app.clone())?;
        let tray = TrayIconBuilder::new()
            .menu(&menu)
            .icon(
                app.default_window_icon()
                    .cloned()
                    .expect("Failed to get default_window_icon"),
            )
            .tooltip(self.get_tooltip_text())
            .build(&app)?;

        self.menu.replace(menu);
        self.tray.replace(tray);

        Ok(())
    }

    pub fn update_tray(&mut self, data: SystemTrayData) {
        self.last_tray_data = data.clone();

        if let Err(e) = self
            .tray
            .as_ref()
            .unwrap()
            .set_tooltip(Some(self.get_tooltip_text()))
        {
            error!(target: LOG_TARGET, "Failed to update tooltip: {}", e);
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
