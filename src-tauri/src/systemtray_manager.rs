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
    menu::{Menu, MenuItem, PredefinedMenuItem}, tray::TrayIcon, AppHandle, Manager, Wry
};
use tokio::sync::{watch::Sender, RwLock, RwLockReadGuard, RwLockWriteGuard};

use crate::{
    configs::{
        config_mining::{ConfigMining, MiningModeType},
        trait_config::ConfigImpl,
    }, events_emitter::EventsEmitter, tasks_tracker::TasksTrackers, utils::{formatting_utils::{format_currency, format_hashrate}, platform_utils::{CurrentOperatingSystem, PlatformUtils}}
};

static INSTANCE: LazyLock<RwLock<SystemTrayManager>> =
    LazyLock::new(|| RwLock::new(SystemTrayManager::new()));
const LOG_TARGET: &str = "tari::universe::systemtray_manager";

pub enum SystemTrayDataItem {
    CpuHashrate { hashrate: f64 },
    GpuHashrate { hashrate: f64 },
    CpuMiningState { is_cpu_mining_turned_on: bool },
    GpuMiningState { is_gpu_mining_turned_on: bool },
    Power { mode: String },
    PendingRewards { rewards: f64 },
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
}

#[derive(Clone, Debug)]
pub enum SystemTrayEvents {
    CpuHashrate(f64),
    GpuHashrate(f64),
    CpuMiningState(bool),
    GpuMiningState(bool),
    MiningMode(MiningModeType),
    CpuPoolPendingRewards(f64),
    GpuPoolPendingRewards(f64),
}

#[derive(Clone)]
pub struct SystemTrayManager {
    pub app_handle: Option<AppHandle>,
    pub tray: Option<TrayIcon>,
    pub menu: Option<Menu<Wry>>,
    pub data: SystemTrayData,
    pub channel: Sender<Option<SystemTrayEvents>>,
}

impl SystemTrayManager {
    fn new() -> Self {
        Self {
            app_handle: None,
            tray: None,
            menu: None,
            data: SystemTrayData::default(),
            channel: Sender::new(None),
        }
    }

    #[allow(dead_code)]
    pub async fn read() -> RwLockReadGuard<'static, SystemTrayManager> {
        INSTANCE.read().await
    }

    pub async fn write() -> RwLockWriteGuard<'static, SystemTrayManager> {
        INSTANCE.write().await
    }

    pub async fn get_channel_sender() -> Sender<Option<SystemTrayEvents>> {
        INSTANCE.read().await.channel.clone()
    }

    async fn start_tray_data_listener(&mut self) {
        let mut receiver = self.channel.subscribe();

        let task_tracker = TasksTrackers::current().common.get_task_tracker().await;
        let mut shutdown_signal = TasksTrackers::current().common.get_signal().await;

        info!(target: LOG_TARGET, "Starting system tray data listener");
        task_tracker.spawn(async move {
            let mut last_gpu_pool_pending_rewards = 0.0;
            let mut last_cpu_pool_pending_rewards = 0.0;

            loop {
                tokio::select! {
                    _ = shutdown_signal.wait() => {
                        info!(target: LOG_TARGET, "Shutting down system tray data listener");
                        break;
                    }

                    
                    result = receiver.changed() => {
                        if result.is_ok() {
                            // Clone the event data immediately to avoid holding the guard across await points
                            let event_opt = receiver.borrow().clone();
                            if let Some(event) = event_opt {
                                info!(target: LOG_TARGET, "Received system tray event: {:?}", event);
                                match event {
                                    SystemTrayEvents::CpuHashrate(hashrate) => {
                                        info!(target: LOG_TARGET, "Received CPU hashrate update: {}", hashrate);
                                        Self::write().await.update_menu_item(
                                            SystemTrayDataItem::CpuHashrate { hashrate }
                                        );
                                        Self::write().await.data.cpu_hashrate = hashrate;
                                    },
                                    SystemTrayEvents::GpuHashrate(hashrate) => {
                                        info!(target: LOG_TARGET, "Received GPU hashrate update: {}", hashrate);
                                        Self::write().await.update_menu_item(
                                            SystemTrayDataItem::GpuHashrate { hashrate }
                                        );
                                        Self::write().await.data.gpu_hashrate = hashrate;
                                    },
                                    SystemTrayEvents::CpuMiningState(is_turned_on) => {
                                        Self::write().await.update_menu_item(
                                            SystemTrayDataItem::CpuMiningState { is_cpu_mining_turned_on: is_turned_on }
                                        );
                                        Self::write().await.data.is_cpu_mining_turned_on = is_turned_on;
                                    },
                                    SystemTrayEvents::GpuMiningState(is_turned_on) => {
                                        Self::write().await.update_menu_item(
                                            SystemTrayDataItem::GpuMiningState { is_gpu_mining_turned_on: is_turned_on }
                                        );
                                        Self::write().await.data.is_gpu_mining_turned_on = is_turned_on;
                                    },
                                    SystemTrayEvents::MiningMode(mode) => {
                                        Self::write().await.update_menu_item(
                                            SystemTrayDataItem::Power { mode: mode.to_string() }
                                        );
                                        Self::write().await.data.mining_mode = mode;
                                    },
                                    SystemTrayEvents::CpuPoolPendingRewards(rewards) => {
                                        last_cpu_pool_pending_rewards = rewards;
                                        let total_rewards = last_cpu_pool_pending_rewards + last_gpu_pool_pending_rewards;
                                        Self::write().await.update_menu_item(
                                            SystemTrayDataItem::PendingRewards { rewards: total_rewards }
                                        );
                                        Self::write().await.data.pool_pending_rewards = total_rewards;
                                    },
                                    SystemTrayEvents::GpuPoolPendingRewards(rewards) => {
                                        last_gpu_pool_pending_rewards = rewards;
                                        let total_rewards = last_cpu_pool_pending_rewards + last_gpu_pool_pending_rewards;
                                        Self::write().await.update_menu_item(
                                            SystemTrayDataItem::PendingRewards { rewards: total_rewards }
                                        );
                                        Self::write().await.data.pool_pending_rewards = total_rewards;
                                    },
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
        info!(target: LOG_TARGET, "Initializing system tray menu");

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
                &bottom_action_separator,
                &settings,
                &quit,
            ],
        )?;
        Ok(menu)
    }
    // fn get_tooltip_text(&self, data: SystemTrayData) -> Option<String> {
    //     match PlatformUtils::detect_current_os() {
    //         CurrentOperatingSystem::Linux => None,
    //         _ => Some(format!(
    //             "CPU Power: {}\nGPU Power: {}\nEst. earning: {}",
    //             format_hashrate(data.cpu_hashrate),
    //             format_hashrate(data.gpu_hashrate),
    //             format_currency(data.estimated_earning / 1_000_000.0, "XTM/day")
    //         )),
    //     }
    // }

    pub async fn initialize_tray(&mut self, app: &AppHandle) {
        let tray = app.tray_by_id("universe-tray-id").expect("tray not found");
        self.app_handle = Some(app.clone());

        match self.initialize_menu().await {
            Ok(menu) => {
                tray.set_menu(Some(menu.clone())).unwrap_or_else(|e| {
                    error!(target: LOG_TARGET, "Failed to set system tray menu: {e}");
                });
                self.menu = Some(menu);
            }
            Err(e) => {
                error!(target: LOG_TARGET, "Failed to initialize system tray menu: {e}");
            }
        }

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
            "open_tari_universe" => {
                block_on(Self::open_tari_universe_action(app.clone()));
            }
            "settings" => {
                block_on(Self::open_settings_action(app.clone()));
            }
            "close" => {
                info!(target: LOG_TARGET, "Quitting application from system tray");
                app.exit(0);
            }
            "mining_toggle" => {}
            _ => {
                error!(target: LOG_TARGET, "menu item {:?} not handled", event.id);
            }
        });

        self.tray.replace(tray);

        self.start_tray_data_listener().await;
    }

    async fn open_tari_universe_action(app_handle: AppHandle) {

                        let window = match app_handle.get_webview_window("main") {
                Some(window) => window,
                None => {
                    error!(target: LOG_TARGET, "Failed to get main window");
                    return;
                }
            };

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

    }

    async fn open_settings_action(app_handle: AppHandle) {
        Self::open_tari_universe_action(app_handle).await;
        EventsEmitter::emit_open_settings().await;
    }

    fn update_menu_item(&mut self, item: SystemTrayDataItem) {
        if let Some(menu) = &self.menu {
            if let Some(menu_item) = menu.get(item.id()) {
                if let Some(menu_item) = menu_item.as_menuitem() {
                    if let Err(e) = menu_item.set_text(item.to_string()) {
                        error!(target: LOG_TARGET, "Failed to update menu field: {e}");
                    }
                } else {
                    error!(target: LOG_TARGET, "Failed to get menu item for {item}");
                }
            } else {
                error!(target: LOG_TARGET, "Failed to get menu item by id for {item}");
            }
        } else {
            error!(target: LOG_TARGET, "Menu is not initialized");
        }
    }
}
