use human_format::Formatter;
use log::{ error, info };

use tauri::{
    menu::{ Menu, MenuItem },
    tray::{ TrayIcon, TrayIconBuilder, TrayIconEvent },
    AppHandle,
    Wry,
};

const LOG_TARGET: &str = "tari::universe::systemtray_manager";

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

pub enum CurrentOperatingSystem {
    Windows,
    Linux,
    MacOS,
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
        // let tray = SystemTrayManager::initialize_tray();

        Self {
            tray: None,
            menu: None,
			last_tray_data: SystemTrayData::default(),
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

    fn initialize_menu(&self, app: AppHandle) -> Result<Menu<Wry>, anyhow::Error> {
        info!(target: LOG_TARGET, "Initializing system tray menu");
        let cpu_hashrate = MenuItem::with_id(
            &app,
            SystrayItemId::CpuHashrate.to_str(),
            SystrayItemId::CpuHashrate.get_title(0.0),
            false,
            None::<&str>
        )?;
        let gpu_hashrate = MenuItem::with_id(
            &app,
            SystrayItemId::GpuHashrate.to_str(),
            SystrayItemId::GpuHashrate.get_title(0.0),
            false,
            None::<&str>
        )?;
        let estimated_earning = MenuItem::with_id(
            &app,
            SystrayItemId::EstimatedEarning.to_str(),
            SystrayItemId::EstimatedEarning.get_title(0.0),
            false,
            None::<&str>
        )?;

        let menu = Menu::with_items(&app, &[&cpu_hashrate, &gpu_hashrate, &estimated_earning])?;
        Ok(menu)
    }

    fn get_tooltip_text(&self) -> String {
		let data = self.last_tray_data.clone();
        let current_os = SystemTrayManager::detect_current_os();

        match current_os {
            CurrentOperatingSystem::Windows => {
                format!(
                    "Hashrate \nCPU: {} H/s\nGPU: {} H/s\nEst. earning: {} tXTM/day",
                    Formatter::new().with_decimals(2).with_separator("").format(data.cpu_hashrate),
                    // data.cpu_usage,
                    Formatter::new().with_decimals(2).with_separator("").format(data.gpu_hashrate),
                    // data.gpu_usage,
                    Formatter::new()
                        .with_decimals(2)
                        .with_separator("")
                        .format(data.estimated_earning / 1_000_000.0)
                )
            }
            CurrentOperatingSystem::Linux => "Not supported".to_string(),
            CurrentOperatingSystem::MacOS => {
                format!(
                    "CPU:\n  Hashrate: {} H/s\nGPU:\n  Hashrate: {} H/s\nEst. earning: {} tXTM/day",
                    Formatter::new().with_decimals(0).with_separator("").format(data.cpu_hashrate),
                    // data.cpu_usage,
                    Formatter::new().with_decimals(2).with_separator("").format(data.gpu_hashrate),
                    // data.gpu_usage,
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
		let tooltip_text = Some(self.get_tooltip_text());
        let tray = TrayIconBuilder::new()
            .on_tray_icon_event(move |tray, event| {
                match event {
                    TrayIconEvent::Enter { .. } => {
                        println!("systemtray enter event");
                        let _ = tray.set_tooltip(tooltip_text.as_ref());
                    }
                    _ => {}
                }
            })

            .menu(&menu)
            .tooltip(self.get_tooltip_text())
            .build(&app)?;

        self.menu.replace(menu);
        self.tray.replace(tray);

        Ok(())
    }

    pub fn update_tray(&mut self, data: SystemTrayData) {
        self.last_tray_data = data.clone();
        match self.menu {
            Some(ref menu) => {
                menu.get(SystrayItemId::CpuHashrate.to_str())
                    .unwrap()
                    .as_menuitem()
                    .unwrap()
                    .set_text(SystrayItemId::CpuHashrate.get_title(data.cpu_hashrate))
                    .unwrap_or_else(|e| {
                        error!(target: LOG_TARGET, "Failed to update menu field: {}", e);
                    });
                menu.get(SystrayItemId::GpuHashrate.to_str())
                    .unwrap()
                    .as_menuitem()
                    .unwrap()
                    .set_text(SystrayItemId::GpuHashrate.get_title(data.gpu_hashrate))
                    .unwrap_or_else(|e| {
                        error!(target: LOG_TARGET, "Failed to update menu field: {}", e);
                    });
                menu.get(SystrayItemId::EstimatedEarning.to_str())
                    .unwrap()
                    .as_menuitem()
                    .unwrap()
                    .set_text(SystrayItemId::EstimatedEarning.get_title(data.estimated_earning))
                    .unwrap_or_else(|e| {
                        error!(target: LOG_TARGET, "Failed to update menu field: {}", e);
                    });
            }
            None => {
                error!(target: LOG_TARGET, "Menu not initialized");
            }
        }
    }
}
