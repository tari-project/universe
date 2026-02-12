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

use std::{fmt::Display, sync::LazyLock};

use futures::executor::block_on;
use log::{error, info};

use tauri::{
    menu::{Menu, MenuItem, PredefinedMenuItem},
    tray::TrayIcon,
    AppHandle, Manager, WebviewWindow, Wry,
};
use tokio::sync::{mpsc, RwLock, RwLockReadGuard, RwLockWriteGuard};

use crate::{
    configs::{
        config_mining::{ConfigMining, MiningModeType},
        trait_config::ConfigImpl,
    },
    events_emitter::EventsEmitter,
    mining::{cpu::manager::CpuManager, gpu::manager::GpuManager},
    shutdown_manager::ShutdownManager,
    tasks_tracker::TasksTrackers,
    utils::{
        formatting_utils::{format_currency, format_hashrate},
        platform_utils::{CurrentOperatingSystem, PlatformUtils},
    },
    LOG_TARGET_APP_LOGIC,
};

static INSTANCE: LazyLock<RwLock<SystemTrayManager>> =
    LazyLock::new(|| RwLock::new(SystemTrayManager::new()));

pub enum SystemTrayDataItem {
    CpuHashrate { hashrate: f64 },
    GpuHashrate { hashrate: f64 },
    CpuMiningState { is_cpu_mining_turned_on: bool },
    GpuMiningState { is_gpu_mining_turned_on: bool },
    Power { mode: String },
    PendingRewards { rewards: f64 },
    ShareCount { count: u64 },
}

impl Display for SystemTrayDataItem {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            SystemTrayDataItem::CpuHashrate { hashrate } => {
                write!(f, "CPU Hashrate: {}", format_hashrate(*hashrate))
            }
            SystemTrayDataItem::GpuHashrate { hashrate } => {
                write!(f, "GPU Hashrate: {}", format_hashrate(*hashrate))
            }
            SystemTrayDataItem::CpuMiningState {
                is_cpu_mining_turned_on,
            } => {
                write!(
                    f,
                    "CPU Mining: {}",
                    if *is_cpu_mining_turned_on {
                        "On"
                    } else {
                        "Off"
                    }
                )
            }
            SystemTrayDataItem::GpuMiningState {
                is_gpu_mining_turned_on,
            } => {
                write!(
                    f,
                    "GPU Mining: {}",
                    if *is_gpu_mining_turned_on {
                        "On"
                    } else {
                        "Off"
                    }
                )
            }
            SystemTrayDataItem::Power { mode } => {
                write!(f, "Power Mode: {}", mode)
            }
            SystemTrayDataItem::PendingRewards { rewards } => {
                write!(
                    f,
                    "Pending Rewards: {}",
                    format_currency(*rewards / 1_000_000.0, "XTM")
                )
            }
            SystemTrayDataItem::ShareCount { count } => {
                if count.eq(&0) {
                    write!(f, "Share Count: N/A")
                } else {
                    write!(f, "Share Count: {}", count)
                }
            }
        }
    }
}

impl SystemTrayDataItem {
    pub fn id(&self) -> &str {
        match self {
            SystemTrayDataItem::CpuHashrate { .. } => "cpu_hashrate",
            SystemTrayDataItem::GpuHashrate { .. } => "gpu_hashrate",
            SystemTrayDataItem::CpuMiningState { .. } => "cpu_mining_state",
            SystemTrayDataItem::GpuMiningState { .. } => "gpu_mining_state",
            SystemTrayDataItem::Power { .. } => "power",
            SystemTrayDataItem::PendingRewards { .. } => "pending_rewards",
            SystemTrayDataItem::ShareCount { .. } => "share_count",
        }
    }
}

pub enum SystemTrayActionItem {
    OpenTariUniverse,
    Settings,
    Close,
    ToggleMining { is_mining: bool },
}

impl Display for SystemTrayActionItem {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            SystemTrayActionItem::OpenTariUniverse => write!(f, "Open Tari Universe"),
            SystemTrayActionItem::Settings => write!(f, "Settings"),
            SystemTrayActionItem::Close => write!(f, "Quit Tari Universe"),
            SystemTrayActionItem::ToggleMining { is_mining } => {
                if *is_mining {
                    write!(f, "Pause Mining")
                } else {
                    write!(f, "Start Mining")
                }
            }
        }
    }
}

impl SystemTrayActionItem {
    pub fn id(&self) -> &str {
        match self {
            SystemTrayActionItem::OpenTariUniverse => "open_tari_universe",
            SystemTrayActionItem::Settings => "settings",
            SystemTrayActionItem::Close => "close",
            SystemTrayActionItem::ToggleMining { .. } => "mining_toggle",
        }
    }
}

#[derive(Clone, Default)]
pub struct SystemTrayData {
    pub cpu_hashrate: f64,
    pub gpu_hashrate: f64,
    pub is_cpu_mining_turned_on: bool,
    pub is_gpu_mining_turned_on: bool,
    pub mining_mode: MiningModeType,
    pub pool_pending_rewards: f64,
    pub pool_share_count: u64,
    pub is_mining: bool,
}

#[derive(Clone, Debug)]
pub enum SystemTrayEvents {
    CpuHashrate(f64),
    GpuHashrate(f64),
    CpuMiningState(bool),
    GpuMiningState(bool),
    MiningMode(MiningModeType),
    CpuPoolStats {
        pending_rewards: f64,
        share_count: u64,
    },
    GpuPoolStats {
        pending_rewards: f64,
        share_count: u64,
    },
    CpuMiningActivity(bool),
    GpuMiningActivity(bool),
}

#[derive(Clone)]
pub struct SystemTrayManager {
    pub app_handle: Option<AppHandle>,
    pub tray: Option<TrayIcon>,
    pub menu: Option<Menu<Wry>>,
    pub data: SystemTrayData,
    pub channel: mpsc::UnboundedSender<SystemTrayEvents>,
}

impl SystemTrayManager {
    fn new() -> Self {
        let (sender, _) = mpsc::unbounded_channel();
        Self {
            app_handle: None,
            tray: None,
            menu: None,
            data: SystemTrayData::default(),
            channel: sender,
        }
    }

    #[allow(dead_code)]
    pub async fn read() -> RwLockReadGuard<'static, SystemTrayManager> {
        INSTANCE.read().await
    }

    pub async fn write() -> RwLockWriteGuard<'static, SystemTrayManager> {
        INSTANCE.write().await
    }

    pub async fn send_event(event: SystemTrayEvents) {
        match INSTANCE.read().await.channel.send(event) {
            Ok(_) => {}
            Err(e) => {
                error!(target: LOG_TARGET_APP_LOGIC, "Failed to send system tray event: {e}");
            }
        };
    }

    #[allow(clippy::too_many_lines)]
    async fn start_tray_data_listener(&mut self) {
        // Create a new receiver since we need to move it into the task
        let (sender, mut receiver) = mpsc::unbounded_channel();

        // Replace the old channel with the new sender
        self.channel = sender;

        let task_tracker = TasksTrackers::current().common.get_task_tracker().await;
        let mut shutdown_signal = TasksTrackers::current().common.get_signal().await;

        info!(target: LOG_TARGET_APP_LOGIC, "Starting system tray data listener");
        task_tracker.spawn(async move {
            let mut last_gpu_pool_pending_rewards = 0.0;
            let mut last_cpu_pool_pending_rewards = 0.0;
            let mut last_cpu_mining_activity = false;
            let mut last_gpu_mining_activity = false;
            let mut last_gpu_pool_share_count = 0;
            let mut last_cpu_pool_share_count = 0;

            loop {
                tokio::select! {
                    _ = shutdown_signal.wait() => {
                        info!(target: LOG_TARGET_APP_LOGIC, "Shutting down system tray data listener");
                        break;
                    }
                    event = receiver.recv() => {
                        match event {
                            Some(event) => {
                                match event {
                                    SystemTrayEvents::CpuHashrate(hashrate) => {
                                        Self::write().await.update_menu_data_item(
                                            SystemTrayDataItem::CpuHashrate { hashrate }
                                        );
                                        Self::write().await.data.cpu_hashrate = hashrate;
                                    },
                                    SystemTrayEvents::GpuHashrate(hashrate) => {
                                        Self::write().await.update_menu_data_item(
                                            SystemTrayDataItem::GpuHashrate { hashrate }
                                        );
                                        Self::write().await.data.gpu_hashrate = hashrate;
                                    },
                                    SystemTrayEvents::CpuMiningState(is_turned_on) => {
                                        Self::write().await.update_menu_data_item(
                                            SystemTrayDataItem::CpuMiningState { is_cpu_mining_turned_on: is_turned_on }
                                        );
                                        Self::write().await.data.is_cpu_mining_turned_on = is_turned_on;
                                    },
                                    SystemTrayEvents::GpuMiningState(is_turned_on) => {
                                        Self::write().await.update_menu_data_item(
                                            SystemTrayDataItem::GpuMiningState { is_gpu_mining_turned_on: is_turned_on }
                                        );
                                        Self::write().await.data.is_gpu_mining_turned_on = is_turned_on;
                                    },
                                    SystemTrayEvents::MiningMode(mode) => {
                                        Self::write().await.update_menu_data_item(
                                            SystemTrayDataItem::Power { mode: mode.to_string() }
                                        );
                                        Self::write().await.data.mining_mode = mode;
                                    },
                                    SystemTrayEvents::CpuMiningActivity(is_active) => {
                                        last_cpu_mining_activity = is_active;
                                        let is_mining = last_cpu_mining_activity || last_gpu_mining_activity;
                                        Self::write().await.update_menu_action_item(
                                            SystemTrayActionItem::ToggleMining { is_mining }
                                        );
                                        Self::write().await.data.is_mining = is_mining;
                                    },
                                    SystemTrayEvents::GpuMiningActivity(is_active) => {
                                        last_gpu_mining_activity = is_active;
                                        let is_mining = last_cpu_mining_activity || last_gpu_mining_activity;
                                        Self::write().await.update_menu_action_item(
                                            SystemTrayActionItem::ToggleMining { is_mining }
                                        );
                                        Self::write().await.data.is_mining = is_mining;
                                    },
                                    SystemTrayEvents::CpuPoolStats { pending_rewards, share_count } => {
                                        last_cpu_pool_pending_rewards = pending_rewards;
                                        last_cpu_pool_share_count = share_count;
                                        let total_pending_rewards = last_cpu_pool_pending_rewards + last_gpu_pool_pending_rewards;
                                        let total_share_count = last_cpu_pool_share_count + last_gpu_pool_share_count;
                                        Self::write().await.update_menu_data_item(
                                            SystemTrayDataItem::PendingRewards { rewards: total_pending_rewards }
                                        );
                                        Self::write().await.update_menu_data_item(
                                            SystemTrayDataItem::ShareCount { count: total_share_count }
                                        );
                                        Self::write().await.data.pool_pending_rewards = total_pending_rewards;
                                        Self::write().await.data.pool_share_count = total_share_count;
                                    },
                                    SystemTrayEvents::GpuPoolStats { pending_rewards, share_count } => {
                                        last_gpu_pool_pending_rewards = pending_rewards;
                                        last_gpu_pool_share_count = share_count;
                                        let total_pending_rewards = last_cpu_pool_pending_rewards + last_gpu_pool_pending_rewards;
                                        let total_share_count = last_cpu_pool_share_count + last_gpu_pool_share_count;
                                        Self::write().await.update_menu_data_item(
                                            SystemTrayDataItem::PendingRewards { rewards: total_pending_rewards }
                                        );
                                        Self::write().await.update_menu_data_item(
                                            SystemTrayDataItem::ShareCount { count: total_share_count }
                                        );
                                        Self::write().await.data.pool_pending_rewards = total_pending_rewards;
                                        Self::write().await.data.pool_share_count = total_share_count;
                                    },
                                }
                            }
                            None => {
                                info!(target: LOG_TARGET_APP_LOGIC, "System tray data listener channel closed");
                                break;
                            }
                        }
                    }
                }
            }
        });
    }

    fn initialize_menu_data_item(
        &self,
        item: SystemTrayDataItem,
        is_clickable: bool,
    ) -> MenuItem<Wry> {
        MenuItem::with_id(
            &self.app_handle.clone().expect("App handle not initialized"),
            item.id(),
            item.to_string(),
            is_clickable,
            None::<&str>,
        )
        .expect("Failed to create data menu item")
    }

    fn initialize_action_item(&self, item: SystemTrayActionItem) -> MenuItem<Wry> {
        MenuItem::with_id(
            &self.app_handle.clone().expect("App handle not initialized"),
            item.id(),
            item.to_string(),
            true,
            None::<&str>,
        )
        .expect("Failed to create action menu item")
    }

    async fn initialize_menu(&self) -> Result<Menu<Wry>, anyhow::Error> {
        info!(target: LOG_TARGET_APP_LOGIC, "Initializing system tray menu");

        let app_handle = self.app_handle.clone().expect("App handle not initialized");

        // Default behavior only works on MacOS for now
        #[cfg(target_os = "macos")]
        let about = PredefinedMenuItem::about(&app_handle, None, None)?;
        #[cfg(target_os = "macos")]
        let about_separator = PredefinedMenuItem::separator(&app_handle)?;
        let top_action_separator = PredefinedMenuItem::separator(&app_handle)?;
        let rewards_separator = PredefinedMenuItem::separator(&app_handle)?;
        let bottom_action_separator = PredefinedMenuItem::separator(&app_handle)?;

        // Data items

        let cpu_hashrate = self
            .initialize_menu_data_item(SystemTrayDataItem::CpuHashrate { hashrate: 0.0 }, false);
        let gpu_hashrate = self
            .initialize_menu_data_item(SystemTrayDataItem::GpuHashrate { hashrate: 0.0 }, false);
        let cpu_mining_state = self.initialize_menu_data_item(
            SystemTrayDataItem::CpuMiningState {
                is_cpu_mining_turned_on: *ConfigMining::content().await.cpu_mining_enabled(),
            },
            false,
        );
        let gpu_mining_state = self.initialize_menu_data_item(
            SystemTrayDataItem::GpuMiningState {
                is_gpu_mining_turned_on: *ConfigMining::content().await.gpu_mining_enabled(),
            },
            false,
        );
        let power = self.initialize_menu_data_item(
            SystemTrayDataItem::Power {
                mode: ConfigMining::content().await.selected_mining_mode().clone(),
            },
            false,
        );

        let pool_pending_rewards = self
            .initialize_menu_data_item(SystemTrayDataItem::PendingRewards { rewards: 0.0 }, false);

        let pool_share_count =
            self.initialize_menu_data_item(SystemTrayDataItem::ShareCount { count: 0 }, false);

        // Action items

        let open_tari_universe =
            self.initialize_action_item(SystemTrayActionItem::OpenTariUniverse);
        let settings = self.initialize_action_item(SystemTrayActionItem::Settings);
        let quit = self.initialize_action_item(SystemTrayActionItem::Close);
        let toggle_mining =
            self.initialize_action_item(SystemTrayActionItem::ToggleMining { is_mining: false });

        let menu = Menu::with_items(
            &app_handle,
            &[
                #[cfg(target_os = "macos")]
                &about,
                #[cfg(target_os = "macos")]
                &about_separator,
                &open_tari_universe,
                &toggle_mining,
                &top_action_separator,
                &cpu_hashrate,
                &gpu_hashrate,
                &cpu_mining_state,
                &gpu_mining_state,
                &power,
                &rewards_separator,
                &pool_pending_rewards,
                &pool_share_count,
                &bottom_action_separator,
                &settings,
                &quit,
            ],
        )?;
        Ok(menu)
    }

    pub async fn initialize_tray(&mut self, app: &AppHandle) {
        let tray = app.tray_by_id("universe-tray-id").expect("tray not found");
        self.app_handle = Some(app.clone());

        match self.initialize_menu().await {
            Ok(menu) => {
                tray.set_menu(Some(menu.clone())).unwrap_or_else(|e| {
                    error!(target: LOG_TARGET_APP_LOGIC, "Failed to set system tray menu: {e}");
                });
                self.menu = Some(menu);
            }
            Err(e) => {
                error!(target: LOG_TARGET_APP_LOGIC, "Failed to initialize system tray menu: {e}");
            }
        }

        tray.on_menu_event(move |app, event| match event.id.as_ref() {
            "open_tari_universe" => {
                block_on(Self::open_tari_universe_action(app.clone()));
            }
            "settings" => {
                block_on(Self::open_settings_action(app.clone()));
            }
            "close" => {
                info!(target: LOG_TARGET_APP_LOGIC, "Quitting application from system tray");
                block_on(Self::close_tari_universe_action(app.clone()));
            }
            "mining_toggle" => {
                tauri::async_runtime::spawn(async move {
                    Self::toggle_mining_action().await;
                });
            }
            _ => {
                error!(target: LOG_TARGET_APP_LOGIC, "menu item {:?} not handled", event.id);
            }
        });

        self.tray.replace(tray);

        self.start_tray_data_listener().await;

        #[cfg(target_os = "windows")]
        {
            if let Err(e) = Self::set_tray_icon_promoted(true).await {
                error!(target: LOG_TARGET_APP_LOGIC, "Failed to promote tray icon: {e}");
            }
        }
    }

    async fn close_tari_universe_action(app: AppHandle) {
        Self::open_tari_universe_action(app.clone()).await;
        ShutdownManager::instance()
            .initialize_shutdown_from_system_tray()
            .await;
    }

    async fn open_tari_universe_action(app_handle: AppHandle) {
        let window = match app_handle.get_webview_window("main") {
            Some(window) => window,
            None => {
                error!(target: LOG_TARGET_APP_LOGIC, "Failed to get main window");
                return;
            }
        };

        if !window.is_minimized().unwrap_or(false) && window.is_visible().unwrap_or(false) {
            info!(target: LOG_TARGET_APP_LOGIC, "Focusing window");
            window.set_focus().unwrap_or_else(|error| {
                error!(target: LOG_TARGET_APP_LOGIC, "Failed to set focus on window: {error}");
            });
            return;
        }
        info!(target: LOG_TARGET_APP_LOGIC, "Unminimizing window");
        match PlatformUtils::detect_current_os() {
            CurrentOperatingSystem::Linux => {
                window.hide().unwrap_or_else(
                    |error| error!(target: LOG_TARGET_APP_LOGIC, "Failed hide window: {error}"),
                );
                window.unminimize().unwrap_or_else(
                    |error| error!(target: LOG_TARGET_APP_LOGIC, "Failed to unminimize window: {error}"),
                );
                window.show().unwrap_or_else(
                    |error| error!(target: LOG_TARGET_APP_LOGIC, "Failed to show window: {error}"),
                );
                window.set_focus().unwrap_or_else(
                    |error| error!(target: LOG_TARGET_APP_LOGIC, "Failed to set focus on window: {error}"),
                );
            }
            _ => {
                window.show().unwrap_or_else(|error| {
                    error!(target: LOG_TARGET_APP_LOGIC, "Failed to show window: {error}");
                });
                window.unminimize().unwrap_or_else(|error| {
                    error!(target: LOG_TARGET_APP_LOGIC, "Failed to unminimize window: {error}");
                });
                window.set_focus().unwrap_or_else(|error| {
                    error!(target: LOG_TARGET_APP_LOGIC, "Failed to set focus on window: {error}");
                });
            }
        }
    }

    async fn open_settings_action(app_handle: AppHandle) {
        Self::open_tari_universe_action(app_handle).await;
        EventsEmitter::emit_open_settings().await;
    }

    async fn toggle_mining_action() {
        let is_mining = Self::read().await.data.is_mining;
        if is_mining {
            CpuManager::write().await.stop_mining().await.ok();
            GpuManager::write().await.stop_mining().await.ok();
        } else {
            CpuManager::write().await.start_mining().await.ok();
            GpuManager::write().await.start_mining().await.ok();
        }
    }
    fn update_menu_data_item(&mut self, item: SystemTrayDataItem) {
        if let Some(menu) = &self.menu {
            if let Some(menu_item) = menu.get(item.id()) {
                if let Some(menu_item) = menu_item.as_menuitem() {
                    if let Err(e) = menu_item.set_text(item.to_string()) {
                        error!(target: LOG_TARGET_APP_LOGIC, "Failed to update menu field: {e}");
                    }
                } else {
                    error!(target: LOG_TARGET_APP_LOGIC, "Failed to get menu item for {item}");
                }
            } else {
                error!(target: LOG_TARGET_APP_LOGIC, "Failed to get menu item by id for {item}");
            }
        } else {
            error!(target: LOG_TARGET_APP_LOGIC, "Menu is not initialized");
        }
    }

    fn update_menu_action_item(&mut self, item: SystemTrayActionItem) {
        if let Some(menu) = &self.menu {
            if let Some(menu_item) = menu.get(item.id()) {
                if let Some(menu_item) = menu_item.as_menuitem() {
                    if let Err(e) = menu_item.set_text(item.to_string()) {
                        error!(target: LOG_TARGET_APP_LOGIC, "Failed to update menu field: {e}");
                    }
                } else {
                    error!(target: LOG_TARGET_APP_LOGIC, "Failed to get menu item for {item}");
                }
            } else {
                error!(target: LOG_TARGET_APP_LOGIC, "Failed to get menu item by id for {item}");
            }
        } else {
            error!(target: LOG_TARGET_APP_LOGIC, "Menu is not initialized");
        }
    }

    pub fn hide_to_tray(window: Option<WebviewWindow>) {
        if let Some(window) = window {
            if window.is_visible().unwrap_or(false) {
                #[cfg(target_os = "macos")]
                {
                    AppHandle::hide(window.app_handle()).unwrap_or_else(|error| {
                        error!(target: LOG_TARGET_APP_LOGIC, "Failed to hide app: {error}");
                    });
                }

                #[cfg(not(target_os = "macos"))]
                {
                    window.hide().unwrap_or_else(|error| {
                        error!(target: LOG_TARGET_APP_LOGIC, "Failed to hide window: {error}");
                    });
                }
            }
        }
    }

    #[cfg(target_os = "windows")]
    async fn set_tray_icon_promoted(promote: bool) -> Result<(), anyhow::Error> {
        use crate::system_dependencies::windows::registry::{
            entry_tasktray_icon::WindowsRegistryTasktrayIconResolver, WindowsRegistryReader,
        };

        let entries = WindowsRegistryTasktrayIconResolver::read_registry()?;
        for entry in entries.iter().filter(|e| e.is_tari_icon()) {
            if !entry.is_promoted() {
                WindowsRegistryTasktrayIconResolver::set_icon_promoted(
                    &entry.executable_path,
                    promote,
                )
                .await?;
            }
        }

        Ok(())
    }
}
