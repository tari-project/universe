use log::{error, info};
use std::sync::LazyLock;
use tauri::{
    AppHandle, CustomMenuItem, Manager, SystemTray, SystemTrayEvent, SystemTrayMenu,
    SystemTrayMenuItem,
};

use crate::format_utils::format_balance;
use crate::hardware_monitor::HardwareStatus;

const LOG_TARGET: &str = "tari::universe::systemtray_manager";
static INSTANCE: LazyLock<SystemtrayManager> = LazyLock::new(SystemtrayManager::new);

pub enum SystrayItemId {
    CpuHashrate,
    GpuHashrate,
    CpuUsage,
    GpuUsage,
    EstimatedEarning,
    UnMinimize,
}

impl SystrayItemId {
    pub fn to_str(&self) -> &str {
        match self {
            SystrayItemId::CpuHashrate => "cpu_hashrate",
            SystrayItemId::GpuHashrate => "gpu_hashrate",
            SystrayItemId::CpuUsage => "cpu_usage",
            SystrayItemId::GpuUsage => "gpu_usage",
            SystrayItemId::EstimatedEarning => "estimated_earning",
            SystrayItemId::UnMinimize => "unminimize",
        }
    }

    pub fn get_title(&self, value: f64) -> String {
        match self {
            SystrayItemId::CpuHashrate => format!("CPU Hashrate: {:.2} H/s", value),
            SystrayItemId::GpuHashrate => format!("GPU Hashrate: {:.2} H/s", value),
            SystrayItemId::CpuUsage => format!("CPU Usage: {:.2}%", value),
            SystrayItemId::GpuUsage => format!("GPU Usage: {:.2}%", value),
            SystrayItemId::EstimatedEarning => {
                format!("Est earning: {} tXTM/day", format_balance(value))
            }
            SystrayItemId::UnMinimize => "Unminimize".to_string(),
        }
    }
}

pub enum CurrentOperatingSystem {
    Windows,
    Linux,
    MacOS,
}

#[derive(Debug, Clone)]
pub struct SystrayData {
    pub cpu_hashrate: f64,
    pub gpu_hashrate: f64,
    pub cpu_usage: f64,
    pub gpu_usage: f64,
    pub estimated_earning: f64,
}

pub struct SystemtrayManager {
    pub systray: SystemTray,
}

impl SystemtrayManager {
    pub fn new() -> Self {
        let systray = SystemtrayManager::initialize_systray();

        Self { systray }
    }
    fn initialize_menu() -> SystemTrayMenu {
        info!(target: LOG_TARGET, "Initializing system tray menu");
        let cpu_hashrate = CustomMenuItem::new(
            SystrayItemId::CpuHashrate.to_str(),
            SystrayItemId::CpuHashrate.get_title(0.0),
        )
        .disabled();
        let gpu_hashrate = CustomMenuItem::new(
            SystrayItemId::GpuHashrate.to_str(),
            SystrayItemId::GpuHashrate.get_title(0.0),
        )
        .disabled();
        let cpu_usage = CustomMenuItem::new(
            SystrayItemId::CpuUsage.to_str(),
            SystrayItemId::CpuUsage.get_title(0.0),
        )
        .disabled();
        let gpu_usage = CustomMenuItem::new(
            SystrayItemId::GpuUsage.to_str(),
            SystrayItemId::GpuUsage.get_title(0.0),
        )
        .disabled();
        let estimated_earning = CustomMenuItem::new(
            SystrayItemId::EstimatedEarning.to_str(),
            SystrayItemId::EstimatedEarning.get_title(0.0),
        )
        .disabled();
        let unminimize = CustomMenuItem::new(
            SystrayItemId::UnMinimize.to_str(),
            SystrayItemId::UnMinimize.get_title(0.0),
        );

        SystemTrayMenu::new()
            .add_item(cpu_usage)
            .add_item(cpu_hashrate)
            .add_native_item(SystemTrayMenuItem::Separator)
            .add_item(gpu_usage)
            .add_item(gpu_hashrate)
            .add_native_item(SystemTrayMenuItem::Separator)
            .add_item(estimated_earning)
            .add_native_item(SystemTrayMenuItem::Separator)
            .add_item(unminimize)
    }

    fn initialize_systray() -> SystemTray {
        info!(target: LOG_TARGET, "Initializing system tray");
        let current_os = SystemtrayManager::detect_current_os();
        let systray = SystemTray::new();

        let empty_data = SystrayData {
            cpu_hashrate: 0.0,
            gpu_hashrate: 0.0,
            cpu_usage: 0.0,
            gpu_usage: 0.0,
            estimated_earning: 0.0,
        };
        let tray_menu = SystemtrayManager::initialize_menu();
        let tooltip = SystemtrayManager::internal_create_tooltip_from_data(empty_data.clone());

        match current_os {
            CurrentOperatingSystem::Windows => {
                return systray.with_tooltip(tooltip.clone().as_str())
            }
            CurrentOperatingSystem::Linux => systray.with_menu(tray_menu),
            CurrentOperatingSystem::MacOS => {
                return systray
                    .with_menu(tray_menu)
                    .with_tooltip(tooltip.clone().as_str())
            }
        }
    }

    fn internal_create_tooltip_from_data(data: SystrayData) -> String {
        let current_os = SystemtrayManager::detect_current_os();

        match current_os {
            CurrentOperatingSystem::Windows => {
                format!(
                    "Hashrate | Usage\nCPU: {:.0} H/s | {:.0}%\nGPU: {:.0} H/s | {:.0}%\nEst. earning: {} tXTM/day",
                    data.cpu_hashrate,
                    data.cpu_usage,
                    data.gpu_hashrate,
                    data.gpu_usage,
                    format_balance(data.estimated_earning)
                )
            }
            CurrentOperatingSystem::Linux => "Not supported".to_string(),
            CurrentOperatingSystem::MacOS => {
                format!(
                    "CPU:\n  Hashrate: {:.0} H/s\n  Usage: {:.0}%\nGPU:\n  Hashrate: {:.0} H/s\n  Usage: {:.0}%\nEst. earning: {} tXTM/day",
                    data.cpu_hashrate, data.cpu_usage, data.gpu_hashrate, data.gpu_usage, format_balance(data.estimated_earning)
                )
            }
        }
    }

    fn update_menu_field(&self, app: AppHandle, item_id: SystrayItemId, value: f64) {
        app.tray_handle()
            .get_item(item_id.to_str())
            .set_title(item_id.get_title(value))
            .unwrap_or_else(|e| {
                error!(target: LOG_TARGET, "Failed to update menu field: {}", e);
            });
    }

    fn update_menu_with_data(&self, app: AppHandle, data: SystrayData) {
        self.update_menu_field(app.clone(), SystrayItemId::CpuHashrate, data.cpu_hashrate);
        self.update_menu_field(app.clone(), SystrayItemId::GpuHashrate, data.gpu_hashrate);
        self.update_menu_field(app.clone(), SystrayItemId::CpuUsage, data.cpu_usage);
        self.update_menu_field(app.clone(), SystrayItemId::GpuUsage, data.gpu_usage);
        self.update_menu_field(
            app.clone(),
            SystrayItemId::EstimatedEarning,
            data.estimated_earning,
        );
    }

    pub fn create_tooltip_from_data(&self, data: SystrayData) -> String {
        SystemtrayManager::internal_create_tooltip_from_data(data)
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

    pub fn update_systray(&self, app: AppHandle, data: SystrayData) {
        let current_os = SystemtrayManager::detect_current_os();
        let tooltip = SystemtrayManager::internal_create_tooltip_from_data(data.clone());

        match current_os {
            CurrentOperatingSystem::Windows => {
                app.tray_handle()
                    .set_tooltip(tooltip.as_str())
                    .unwrap_or_else(|e| {
                        error!(target: LOG_TARGET, "Failed to update tooltip: {}", e);
                    });
            }
            CurrentOperatingSystem::Linux => {
                self.update_menu_with_data(app, data);
            }
            CurrentOperatingSystem::MacOS => {
                self.update_menu_with_data(app.clone(), data);
                app.clone()
                    .tray_handle()
                    .set_tooltip(tooltip.as_str())
                    .unwrap_or_else(|e| {
                        error!(target: LOG_TARGET, "Failed to update tooltip: {}", e);
                    });
            }
        }
    }

    pub fn handle_system_tray_event(&self, app: AppHandle, event: SystemTrayEvent) {
        let window = match app.get_window("main") {
            Some(window) => window,
            None => {
                error!(target: LOG_TARGET, "Failed to get main window");
                return;
            }
        };
        match event {
            SystemTrayEvent::DoubleClick { .. } => {
                window.unminimize().unwrap_or_else(|error| {
                    error!(target: LOG_TARGET, "Failed to unminimize window: {}", error);
                });
                window.set_focus().unwrap_or_else(|error| {
                    error!(target: LOG_TARGET, "Failed to set focus on window: {}", error);
                });
            }
            SystemTrayEvent::MenuItemClick { id, .. } => {
                info!(target: LOG_TARGET, "System tray menu item click event: {}", id);
                match id.as_str() {
                    "unminimize" => {
                        info!(target: LOG_TARGET, "Unminimizing window");
                        match SystemtrayManager::detect_current_os() {
                            CurrentOperatingSystem::Linux => {
                                let is_minimized = window.is_minimized().unwrap_or(false);
                                let is_visible = window.is_visible().unwrap_or(false);

                                if is_minimized | !is_visible {
                                    // Ony soultion to unminimize and show the window on Linux
                                    // At least one that I found
                                    window.hide().unwrap_or_else(|error| {
                                        error!(target: LOG_TARGET, "Failed hide window: {}", error);
                                    });
                                    window.unminimize().unwrap_or_else(|error| {
                                        error!(target: LOG_TARGET, "Failed to unminimize window: {}", error);
                                    });
                                    window.show().unwrap_or_else(|error| {
                                        error!(target: LOG_TARGET, "Failed to show window: {}", error);
                                    });
                                    window.set_focus().unwrap_or_else(|error| {
                                        error!(target: LOG_TARGET, "Failed to set focus on window: {}", error);
                                    });
                                }
                            }
                            CurrentOperatingSystem::MacOS => {
                                window.unminimize().unwrap_or_else(|error| {
                                    error!(target: LOG_TARGET, "Failed to unminimize window: {}", error);
                                });
                                window.set_focus().unwrap_or_else(|error| {
                                    error!(target: LOG_TARGET, "Failed to set focus on window: {}", error);
                                });
                            }
                            _ => {}
                        }
                    }
                    _ => {
                        info!(target: LOG_TARGET, "Unknown menu item click event: {}", id);
                    }
                }
            }
            _ => {
                info!(target: LOG_TARGET, "System tray event");
            }
        }
    }

    pub fn create_systemtray_data(
        &self,
        cpu_hashrate: f64,
        gpu_hashrate: f64,
        hardware_status: HardwareStatus,
        estimated_earning: f64,
    ) -> SystrayData {
        SystrayData {
            cpu_hashrate,
            gpu_hashrate,
            cpu_usage: f64::from(hardware_status.cpu.unwrap_or_default().usage_percentage),
            gpu_usage: f64::from(hardware_status.gpu.unwrap_or_default().usage_percentage),
            estimated_earning,
        }
    }

    pub fn get_systray(&self) -> &SystemTray {
        &self.systray
    }

    pub fn current() -> &'static SystemtrayManager {
        &INSTANCE
    }
}
