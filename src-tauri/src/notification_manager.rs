use std::sync::LazyLock;
use tauri::{AppHandle, CustomMenuItem, SystemTray, SystemTrayMenu, SystemTrayMenuItem};


const LOG_TARGET: &str = "tari::universe::notification_manager";
static INSTANCE: LazyLock<NotificationManager> = LazyLock::new(NotificationManager::new);

pub enum SystrayItemId {
    CpuHashrate,
    GpuHashrate,
    CpuUsage,
    GpuUsage,
    EstimatedEarning,
}

impl SystrayItemId {
    pub fn to_str(&self) -> &str {
        match self {
            SystrayItemId::CpuHashrate => "cpu_hashrate",
            SystrayItemId::GpuHashrate => "gpu_hashrate",
            SystrayItemId::CpuUsage => "cpu_usage",
            SystrayItemId::GpuUsage => "gpu_usage",
            SystrayItemId::EstimatedEarning => "estimated_earning",
        }
    }

    pub fn get_title(&self, value: f64) -> String {
        match self {
            SystrayItemId::CpuHashrate => format!("CPU Hashrate: {:.2} H/s", value),
            SystrayItemId::GpuHashrate => format!("GPU Hashrate: {:.2} H/s", value),
            SystrayItemId::CpuUsage => format!("CPU Usage: {:.2}%", value),
            SystrayItemId::GpuUsage => format!("GPU Usage: {:.2}%", value),
            SystrayItemId::EstimatedEarning => format!("Estimated Earning: {:.2} tXTM/Day", value),
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

pub struct NotificationManager {
    pub systray: SystemTray,
}

impl NotificationManager {

    pub fn new() -> Self {
        let systray = NotificationManager::initialize_systray();


        Self {
            systray
        }
    }

    pub fn update_menu_field(&self, app: AppHandle, item_id: SystrayItemId, value: f64 ) {
        app.tray_handle().get_item(item_id.to_str()).set_title(item_id.get_title(value)).unwrap();
    }

    pub fn create_tooltip_from_data(&self,data: SystrayData) -> String {
        NotificationManager::internal_create_tooltip_from_data(data)
    }

    fn internal_create_tooltip_from_data(data: SystrayData) -> String {
        format!("CPU Hashrate: {:.2} H/s\nGPU Hashrate: {:.2} H/s\nCPU Usage: {:.2}%\nGPU Usage: {:.2}%\nEstimated Earning: {:.2} Tari", data.cpu_hashrate, data.gpu_hashrate, data.cpu_usage, data.gpu_usage, data.estimated_earning)
    }

    fn initialize_menu() -> SystemTrayMenu {
        let cpu_hashrate = CustomMenuItem::new(SystrayItemId::CpuHashrate.to_str(), SystrayItemId::CpuHashrate.get_title(0.0)).disabled();
        let gpu_hashrate = CustomMenuItem::new(SystrayItemId::GpuHashrate.to_str(), SystrayItemId::GpuHashrate.get_title(0.0)).disabled();
        let cpu_usage = CustomMenuItem::new(SystrayItemId::CpuUsage.to_str(), SystrayItemId::CpuUsage.get_title(0.0)).disabled();
        let gpu_usage = CustomMenuItem::new(SystrayItemId::GpuUsage.to_str(), SystrayItemId::GpuUsage.get_title(0.0)).disabled();
        let estimated_earning = CustomMenuItem::new(SystrayItemId::EstimatedEarning.to_str(),SystrayItemId::EstimatedEarning.get_title(0.0)).disabled();

        SystemTrayMenu::new()
        .add_item(cpu_usage)
          .add_item(cpu_hashrate)
          .add_native_item(SystemTrayMenuItem::Separator)
          .add_item(gpu_usage)
          .add_item(gpu_hashrate)
          .add_native_item(SystemTrayMenuItem::Separator)
          .add_item(estimated_earning)
    }

    fn initialize_systray() -> SystemTray {
        let current_os = NotificationManager::detect_current_os();
        let systray = SystemTray::new();

        let empty_data = SystrayData {
            cpu_hashrate: 0.0,
            gpu_hashrate: 0.0,
            cpu_usage: 0.0,
            gpu_usage: 0.0,
            estimated_earning: 0.0,
        };
        let tray_menu = NotificationManager::initialize_menu();
        let tooltip = NotificationManager::internal_create_tooltip_from_data(empty_data.clone());


        match current_os {
            CurrentOperatingSystem::Windows => {
                return systray.with_tooltip(tooltip.clone().as_str())
            }
            CurrentOperatingSystem::Linux => {
                return systray.with_menu(tray_menu)
            }
            CurrentOperatingSystem::MacOS => {
                return systray.with_tooltip(tooltip.clone().as_str())
            }
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

    pub fn update_systray(&self, app: AppHandle, data: SystrayData) {
        let current_os = NotificationManager::detect_current_os();
        let tooltip = NotificationManager::internal_create_tooltip_from_data(data.clone());

        match current_os {
            CurrentOperatingSystem::Windows => {
                app.tray_handle().set_tooltip(tooltip.as_str()).unwrap();
            }
            CurrentOperatingSystem::Linux => {
                self.update_menu_field(app.clone(), SystrayItemId::CpuHashrate, data.cpu_hashrate);
                self.update_menu_field(app.clone(), SystrayItemId::GpuHashrate, data.gpu_hashrate);
                self.update_menu_field(app.clone(), SystrayItemId::CpuUsage, data.cpu_usage);
                self.update_menu_field(app.clone(), SystrayItemId::GpuUsage, data.gpu_usage);
                self.update_menu_field(app.clone(), SystrayItemId::EstimatedEarning, data.estimated_earning);
            }
            CurrentOperatingSystem::MacOS => {
                app.tray_handle().set_tooltip(tooltip.as_str()).unwrap();
            }
        }

    }

    pub fn get_systray(&self) -> &SystemTray {
        &self.systray
    }

    pub fn current() -> &'static NotificationManager{
        &INSTANCE
    }
}