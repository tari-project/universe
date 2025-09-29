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

use log::{error, info};

use tauri::{
    menu::{Menu, MenuItem, PredefinedMenuItem},
    tray::TrayIcon,
    AppHandle, Manager, Wry,
};
use tokio::sync::{watch::Sender, RwLock, RwLockReadGuard, RwLockWriteGuard};

use crate::{
    configs::config_mining::{MiningMode, MiningModeType},
    tasks_tracker::TasksTrackers,
    utils::{
        formatting_utils::{format_currency, format_hashrate},
        platform_utils::{CurrentOperatingSystem, PlatformUtils},
    },
};

static INSTANCE: LazyLock<RwLock<SystemTrayManager>> =
    LazyLock::new(|| RwLock::new(SystemTrayManager::new()));
const LOG_TARGET: &str = "tari::universe::systemtray_manager";

#[derive(Debug)]
pub enum SystrayItemId {
    OpenTariUniverse,
    ToggleMinning,
    CpuHashrate,
    GpuHashrate,
    CpuMiningState,
    GpuMiningState,
    Power,
    Rewards,
    Settings,
    Close,
}

impl SystrayItemId {
    pub fn to_str(&self) -> &str {
        match self {
            SystrayItemId::OpenTariUniverse => "open_tari_universe",
            SystrayItemId::ToggleMinning => "toggle_minning",
            SystrayItemId::CpuHashrate => "cpu_hashrate",
            SystrayItemId::GpuHashrate => "gpu_hashrate",
            SystrayItemId::CpuMiningState => "cpu_mining_state",
            SystrayItemId::GpuMiningState => "gpu_mining_state",
            SystrayItemId::Power => "power",
            SystrayItemId::Rewards => "rewards",
            SystrayItemId::Settings => "settings",
            SystrayItemId::Close => "close",

        }
    }

}

#[derive(Debug, Clone, Default)]
pub struct SystemTrayGpuData {
    pub gpu_hashrate: f64,
    pub estimated_earning: u64,
}

#[derive(Debug, Clone, Default)]
pub struct SystemTrayCpuData {
    pub cpu_hashrate: f64,
    pub estimated_earning: u64,
}

#[derive(Debug, Clone, Default)]
pub struct SystemTrayData {
    pub cpu: SystemTrayCpuData,
    pub gpu: SystemTrayGpuData,
    pub is_cpu_mining_turned_on: bool,
    pub is_gpu_mining_turned_on: bool,
    pub mining_mode: MiningModeType,
    pub cpu_pool_pending_rewards: f64,
    pub gpu_pool_pending_rewards: f64,
}

pub enum SystemTrayEvents {
    UpdateCpuData(SystemTrayCpuData),
    UpdateGpuData(SystemTrayGpuData),
    UpdateCpuMiningState(bool),
    UpdateGpuMiningState(bool),
    UpdateMiningMode(MiningModeType),
    UpdateCpuPoolPendingRewards(f64),
    UpdateGpuPoolPendingRewards(f64),
}

#[derive(Clone)]
pub struct SystemTrayManager {
    pub tray: Option<TrayIcon>,
    pub menu: Option<Menu<Wry>>,
    pub data: SystemTrayData,
    pub channel: Sender<Option<SystemTrayEvents>>,
}

impl SystemTrayManager {
    fn new() -> Self {
        Self {
            tray: None,
            menu: None,
            data: SystemTrayData::default(),
            channel: Sender::new(None),
        }
    }

    pub async fn read() -> RwLockReadGuard<'static, SystemTrayManager> {
        INSTANCE.read().await
    }

    pub async fn write() -> RwLockWriteGuard<'static, SystemTrayManager> {
        INSTANCE.write().await
    }

    pub async fn get_channel_sender(&self) -> Sender<Option<SystemTrayEvents>> {
        self.channel.clone()
    }

    async fn start_tray_data_listener(&mut self) {
        let mut receiver = self.channel.subscribe();
        let mut manager = Self::write().await;
        let task_tracker = TasksTrackers::current().common.get_task_tracker().await;
        let mut shutdown_signal = TasksTrackers::current().common.get_signal().await;

        info!(target: LOG_TARGET, "Starting system tray data listener");
        task_tracker.spawn(async move {
            loop {
                tokio::select! {
                    _ = shutdown_signal.wait() => {
                        info!(target: LOG_TARGET, "Shutting down system tray data listener");
                        break;
                    }

                    result = receiver.changed() => {
                        if result.is_ok() {
                            if let Some(event) = &*receiver.borrow() {
                                match event {
                                    SystemTrayEvents::UpdateCpuData(data) => {
                                        manager.update_tray_with_cpu_data(data.clone());
                                    }
                                    SystemTrayEvents::UpdateGpuData(data) => {
                                        manager.update_tray_with_gpu_data(data.clone());
                                    }
                                    SystemTrayEvents::UpdateCpuMiningState(state) => {
                                        manager.data.is_cpu_mining_turned_on = *state;
                                        manager.update_tray(manager.data.clone());
                                    }
                                    SystemTrayEvents::UpdateGpuMiningState(state) => {
                                        manager.data.is_gpu_mining_turned_on = *state;
                                        manager.update_tray(manager.data.clone());
                                    }
                                    SystemTrayEvents::UpdateMiningMode(mode) => {
                                        manager.data.mining_mode = mode.clone();
                                        manager.update_tray(manager.data.clone());
                                    }
                                    SystemTrayEvents::UpdateCpuPoolPendingRewards(rewards) => {
                                        manager.data.cpu_pool_pending_rewards = *rewards;
                                        manager.update_tray(manager.data.clone());
                                    }
                                    SystemTrayEvents::UpdateGpuPoolPendingRewards(rewards) => {
                                        manager.data.gpu_pool_pending_rewards = *rewards;
                                        manager.update_tray(manager.data.clone());
                                    }
                                }
                            }
                        } else {
                            error!(target: LOG_TARGET, "System tray data listener channel closed");
                            break;
                        }

                    }
                }
            }
        });
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
                format_hashrate(data.cpu.cpu_hashrate),
                format_hashrate(data.gpu.gpu_hashrate),
                format_currency(
                    ((data.cpu.estimated_earning + data.gpu.estimated_earning) / 1_000_000) as f64,
                    "XTM/day"
                )
            )),
        }
    }

    pub fn initialize_tray(&mut self, app: &AppHandle) -> Result<(), anyhow::Error> {
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
                            window.hide().unwrap_or_else(|error| error!(target: LOG_TARGET, "Failed hide window: {error}"));
                            window.unminimize().unwrap_or_else(|error| error!(target: LOG_TARGET, "Failed to unminimize window: {error}"));
                            window.show().unwrap_or_else(|error| error!(target: LOG_TARGET, "Failed to show window: {error}"));
                            window.set_focus().unwrap_or_else(|error| error!(target: LOG_TARGET, "Failed to set focus on window: {error}"));
                        }
                        _ => {
                            window.unminimize().unwrap_or_else(|error| {
                                error!(target: LOG_TARGET, "Failed to unminimize window: {error}");
                            });
                            window.set_focus().unwrap_or_else(|error| {
                                error!(target: LOG_TARGET, "Failed to set focus on window: {error}");
                            });
                        }
                    }
                } else {
                    info!(target: LOG_TARGET, "Minimizing window");
                    window.minimize().unwrap_or_else(|error| {
                        error!(target: LOG_TARGET, "Failed to minimize window: {error}");
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

    pub fn update_tray_with_gpu_data(&mut self, data: SystemTrayGpuData) {
        self.data.gpu = data;
        self.update_tray(self.data.clone());
    }

    pub fn update_tray_with_cpu_data(&mut self, data: SystemTrayCpuData) {
        self.data.cpu = data;
        self.update_tray(self.data.clone());
    }

    fn update_menu_item

    pub fn update_tray(&mut self, data: SystemTrayData) {
        if let Some(tray) = &self.tray {
            if let Err(e) = tray.set_tooltip(self.get_tooltip_text(data.clone())) {
                error!(target: LOG_TARGET, "Failed to update tooltip: {e}");
            }
        } else {
            error!(target: LOG_TARGET, "Tray not initialized");
        }
        if let Some(menu) = &self.menu {
            for (id, value) in [
                (SystrayItemId::CpuHashrate, data.cpu.cpu_hashrate),
                (SystrayItemId::GpuHashrate, data.gpu.gpu_hashrate),
                (
                    SystrayItemId::EstimatedEarning,
                    ((data.cpu.estimated_earning + data.gpu.estimated_earning) / 1_000_000) as f64,
                ),
            ] {
                if let Some(item) = menu.get(id.to_str()) {
                    if let Some(menu_item) = item.as_menuitem() {
                        if let Err(e) = menu_item.set_text(id.get_title(value)) {
                            error!(target: LOG_TARGET, "Failed to update menu field: {e}");
                        }
                    } else {
                        error!(target: LOG_TARGET, "Failed to get menu item for {id:?}");
                    }
                } else {
                    error!(target: LOG_TARGET, "Failed to get menu item by id for {id:?}");
                }
            }
        } else {
            error!(target: LOG_TARGET, "Menu not initialized");
        }
    }
}
