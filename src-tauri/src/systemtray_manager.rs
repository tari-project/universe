use anyhow::anyhow;
use human_format::Formatter;
use log::{error, info};
use std::{ops::Div, sync::LazyLock};
use tauri::menu::{Menu, MenuBuilder, MenuEvent, MenuItem};
use tauri::tray::{TrayIcon, TrayIconBuilder, TrayIconEvent};
use tauri::{AppHandle, Manager, Wry};

use crate::hardware::hardware_status_monitor::PublicDeviceProperties;

const LOG_TARGET: &str = "tari::universe::systemtray_manager";
static TRAY_ID: &str = "main";
static MENU_ID: &str = "universe";

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
            SystrayItemId::CpuHashrate => format!(
                "CPU Hashrate: {} H/s",
                Formatter::new()
                    .with_decimals(2)
                    .with_separator("")
                    .format(value)
            ),
            SystrayItemId::GpuHashrate => format!(
                "GPU Hashrate: {} H/s",
                Formatter::new()
                    .with_decimals(2)
                    .with_separator("")
                    .format(value)
            ),
            SystrayItemId::CpuUsage => format!("CPU Usage: {:.2}%", value),
            SystrayItemId::GpuUsage => format!("GPU Usage: {:.2}%", value),
            SystrayItemId::EstimatedEarning => {
                format!(
                    "Est earning: {} tXTM/day",
                    Formatter::new()
                        .with_decimals(2)
                        .with_separator("")
                        .format(value / 1_000_000.0)
                )
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

#[derive(Debug, Clone, Default)]
pub struct SystrayData {
    pub cpu_hashrate: f64,
    pub gpu_hashrate: f64,
    pub cpu_usage: f64,
    pub gpu_usage: f64,
    pub estimated_earning: f64,
    pub minimized: bool,
}

fn initialize_menu(handle: AppHandle, data: SystrayData) -> tauri::Result<Menu<Wry>> {
    info!(target: LOG_TARGET, "Initializing system tray menu");
    let cpu_hashrate = MenuItem::with_id(
        &handle,
        SystrayItemId::CpuHashrate.to_str(),
        SystrayItemId::CpuHashrate.get_title(data.cpu_hashrate),
        false,
        None::<&str>,
    )?;
    let gpu_hashrate = MenuItem::with_id(
        &handle,
        SystrayItemId::GpuHashrate.to_str(),
        SystrayItemId::GpuHashrate.get_title(data.gpu_hashrate),
        false,
        None::<&str>,
    )?;
    let cpu_usage = MenuItem::with_id(
        &handle,
        SystrayItemId::CpuUsage.to_str(),
        SystrayItemId::CpuUsage.get_title(data.cpu_usage),
        false,
        None::<&str>,
    )?;
    let gpu_usage = MenuItem::with_id(
        &handle,
        SystrayItemId::GpuUsage.to_str(),
        SystrayItemId::GpuUsage.get_title(data.gpu_usage),
        false,
        None::<&str>,
    )?;
    let estimated_earning = MenuItem::with_id(
        &handle,
        SystrayItemId::EstimatedEarning.to_str(),
        SystrayItemId::EstimatedEarning.get_title(data.estimated_earning),
        false,
        None::<&str>,
    )?;
    let unminimize = MenuItem::with_id(
        &handle,
        SystrayItemId::UnMinimize.to_str(),
        SystrayItemId::UnMinimize.get_title(0.0),
        data.minimized,
        None::<&str>,
    )?;

    MenuBuilder::with_id(&handle, MENU_ID)
        .item(&cpu_usage)
        .item(&cpu_hashrate)
        .separator()
        .item(&gpu_usage)
        .item(&gpu_hashrate)
        .separator()
        .item(&estimated_earning)
        .separator()
        .item(&unminimize)
        .build()
}

pub fn initialize_systray(handle: AppHandle) -> Result<TrayIcon, anyhow::Error> {
    info!(target: LOG_TARGET, "Initializing system tray");
    let current_os = detect_current_os();
    let builder = TrayIconBuilder::with_id(TRAY_ID);

    let tray_menu = initialize_menu(handle.clone(), SystrayData::default())?;
    let tooltip = internal_create_tooltip_from_data(SystrayData::default());

    match current_os {
        CurrentOperatingSystem::Windows => builder
            .tooltip(tooltip.clone().as_str())
            .build(&handle)
            .map_err(|e| anyhow::anyhow!(e)),
        CurrentOperatingSystem::Linux => builder
            .menu(&tray_menu)
            .build(&handle)
            .map_err(|e| anyhow::anyhow!(e)),
        CurrentOperatingSystem::MacOS => builder
            .menu(&tray_menu)
            .tooltip(tooltip.clone().as_str())
            .build(&handle)
            .map_err(|e| anyhow::anyhow!(e)),
    }
}

fn internal_create_tooltip_from_data(data: SystrayData) -> String {
    let current_os = detect_current_os();

    match current_os {
        CurrentOperatingSystem::Windows => {
            format!(
                "Hashrate | Usage\nCPU: {} H/s | {:.0}%\nGPU: {} H/s | {:.0}%\nEst. earning: {} tXTM/day",
                Formatter::new().with_decimals(2).with_separator("").format(data.cpu_hashrate),
                data.cpu_usage,
                Formatter::new().with_decimals(2).with_separator("").format(data.gpu_hashrate),
                data.gpu_usage,
                Formatter::new().with_decimals(2).with_separator("").format(data.estimated_earning / 1_000_000.0)
            )
        }
        CurrentOperatingSystem::Linux => "Not supported".to_string(),
        CurrentOperatingSystem::MacOS => {
            format!(
                "CPU:\n  Hashrate: {} H/s\n  Usage: {:.0}%\nGPU:\n  Hashrate: {} H/s\n  Usage: {:.0}%\nEst. earning: {} tXTM/day",
                Formatter::new().with_decimals(0).with_separator("").format(data.cpu_hashrate),
                data.cpu_usage,
                Formatter::new().with_decimals(2).with_separator("").format(data.gpu_hashrate),
                data.gpu_usage,
                Formatter::new().with_decimals(2).with_separator("").format(data.estimated_earning / 1_000_000.0)
            )
        }
    }
}

fn update_menu_with_data(app: AppHandle, mut data: SystrayData) -> Result<(), anyhow::Error> {
    let window = app.get_window("main").expect("Could not get window");
    if let Ok(minimized) = window.is_minimized() {
        data.minimized = minimized;
    }
    app.tray_by_id(TRAY_ID)
        .ok_or(anyhow::anyhow!("No tray found by id"))?
        .set_menu(initialize_menu(app.clone(), data).ok())?;

    Ok(())
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

pub fn update_systray(app: AppHandle, data: SystrayData) -> Result<(), anyhow::Error> {
    let tray = app
        .tray_by_id(TRAY_ID)
        .ok_or(anyhow!("Couldn't get tray by id"))?;
    let current_os = detect_current_os();
    let tooltip = internal_create_tooltip_from_data(data.clone());

    match current_os {
        CurrentOperatingSystem::Windows => {
            tray.set_tooltip(Some(tooltip.as_str()))
                .unwrap_or_else(|e| {
                    error!(target: LOG_TARGET, "Failed to update tooltip: {}", e);
                });
        }
        CurrentOperatingSystem::Linux => {
            update_menu_with_data(app, data)?;
        }
        CurrentOperatingSystem::MacOS => {
            update_menu_with_data(app.clone(), data)?;
            tray.set_tooltip(Some(tooltip.as_str()))
                .unwrap_or_else(|e| {
                    error!(target: LOG_TARGET, "Failed to update tooltip: {}", e);
                });
        }
    }

    Ok(())
}

pub fn handle_menu_event(app: AppHandle, event: MenuEvent) {
    let window = match app.get_window("main") {
        Some(window) => window,
        None => {
            error!(target: LOG_TARGET, "Failed to get main window");
            return;
        }
    };

    info!(target: LOG_TARGET, "System tray menu item click event: {}", event.id.0);
    match event.id.0.as_str() {
        "unminimize" => {
            info!(target: LOG_TARGET, "Unminimizing window");
            match detect_current_os() {
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
            info!(target: LOG_TARGET, "Unknown menu item click event: {}", event.id.0);
        }
    }
}

pub fn handle_system_tray_event(app: AppHandle, event: TrayIconEvent) {
    let window = match app.get_window("main") {
        Some(window) => window,
        None => {
            error!(target: LOG_TARGET, "Failed to get main window");
            return;
        }
    };
    match event {
        TrayIconEvent::DoubleClick { .. } => {
            window.unminimize().unwrap_or_else(|error| {
                error!(target: LOG_TARGET, "Failed to unminimize window: {}", error);
            });
            window.set_focus().unwrap_or_else(|error| {
                error!(target: LOG_TARGET, "Failed to set focus on window: {}", error);
            });
        }
        _ => {
            info!(target: LOG_TARGET, "System tray event");
        }
    }
}

pub fn create_systemtray_data(
    cpu_hashrate: f64,
    gpu_hashrate: f64,
    gpu_parameters: Vec<PublicDeviceProperties>,
        cpu_parameters: Vec<PublicDeviceProperties>,
    estimated_earning: f64,
) -> SystrayData {
    let cpu_usage_percentage = cpu_parameters
        .iter()
        .map(|cpu| f64::from(cpu.clone().parameters.unwrap_or_default().usage_percentage))
        .sum::<f64>()
            .div(cpu_parameters.len() as f64);
            let gpu_usage_percentage = gpu_parameters
            .iter()
            .map(|gpu| f64::from(gpu.clone().parameters.unwrap_or_default().usage_percentage))
            .sum::<f64>().div(gpu_parameters.len() as f64);
        SystrayData {
            cpu_hashrate,
            gpu_hashrate,
            cpu_usage: cpu_usage_percentage,
            gpu_usage: gpu_usage_percentage,
        estimated_earning,
        minimized: false,
    }
}
