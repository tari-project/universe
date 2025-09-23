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

use crate::mining::gpu::consts::{EngineType, GpuMinerType};
use getset::{Getters, Setters};
use log::{info, warn};
use serde::{Deserialize, Serialize};
use std::{collections::HashMap, sync::LazyLock, time::SystemTime};
use tauri::AppHandle;
use tokio::sync::RwLock;

use super::trait_config::{ConfigContentImpl, ConfigImpl};

pub const MINING_CONFIG_VERSION: u32 = 1;
static INSTANCE: LazyLock<RwLock<ConfigMining>> =
    LazyLock::new(|| RwLock::new(ConfigMining::new()));

#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
pub enum MiningModeType {
    Eco,
    Turbo,
    Ludicrous,
    Custom,
    User,
}
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MiningMode {
    pub mode_type: MiningModeType,
    pub mode_name: String,
    pub cpu_usage_percentage: u32,
    pub gpu_usage_percentage: u32,
}

#[derive(Serialize, Deserialize, Clone, Default)]
pub struct GpuDeviceSettings {
    device_id: u32,
    is_excluded: bool,
}
#[derive(Serialize, Deserialize, Clone)]
pub struct GpuDevicesSettings(HashMap<u32, GpuDeviceSettings>);

impl GpuDevicesSettings {
    pub fn new() -> Self {
        Self(HashMap::new())
    }

    pub fn add(&mut self, device_id: u32) {
        self.0.entry(device_id).or_insert(GpuDeviceSettings {
            device_id,
            is_excluded: false,
        });
    }
    pub fn set_excluded(&mut self, device_id: u32, is_excluded: bool) {
        if let Some(settings) = self.0.get_mut(&device_id) {
            settings.is_excluded = is_excluded;
        }
    }
}

#[derive(Serialize, Deserialize, Clone)]
#[serde(rename_all = "snake_case")]
#[serde(default)]
#[derive(Getters, Setters)]
#[getset(get = "pub", set = "pub")]
#[allow(clippy::struct_excessive_bools)]
pub struct ConfigMiningContent {
    version_counter: u32,
    created_at: SystemTime,
    selected_mining_mode: String,
    mining_modes: HashMap<String, MiningMode>,
    mine_on_app_start: bool,
    gpu_mining_enabled: bool,
    cpu_mining_enabled: bool,
    gpu_engine: EngineType,
    gpu_devices_settings: GpuDevicesSettings,
    squad_override: Option<String>,
    gpu_miner_type: GpuMinerType,
    is_lolminer_tested: bool,
}

impl Default for ConfigMiningContent {
    fn default() -> Self {
        Self {
            version_counter: MINING_CONFIG_VERSION,
            created_at: SystemTime::now(),
            selected_mining_mode: "Eco".to_string(),
            mine_on_app_start: true,
            gpu_miner_type: if cfg!(target_os = "windows") || cfg!(target_os = "linux") {
                GpuMinerType::LolMiner
            } else {
                GpuMinerType::Graxil
            },
            mining_modes: HashMap::from([
                (
                    "Eco".to_string(),
                    MiningMode {
                        mode_type: MiningModeType::Eco,
                        mode_name: "Eco".to_string(),
                        cpu_usage_percentage: 1,
                        gpu_usage_percentage: 1,
                    },
                ),
                (
                    "Turbo".to_string(),
                    MiningMode {
                        mode_type: MiningModeType::Turbo,
                        mode_name: "Turbo".to_string(),
                        cpu_usage_percentage: 10,
                        gpu_usage_percentage: 10,
                    },
                ),
                (
                    "Ludicrous".to_string(),
                    MiningMode {
                        mode_type: MiningModeType::Ludicrous,
                        mode_name: "Ludicrous".to_string(),
                        cpu_usage_percentage: 85,
                        gpu_usage_percentage: 95,
                    },
                ),
                (
                    "Custom".to_string(),
                    MiningMode {
                        mode_type: MiningModeType::Custom,
                        mode_name: "Custom".to_string(),
                        cpu_usage_percentage: 75,
                        gpu_usage_percentage: 75,
                    },
                ),
            ]),
            gpu_mining_enabled: true,
            cpu_mining_enabled: true,
            gpu_engine: EngineType::OpenCL,
            gpu_devices_settings: GpuDevicesSettings::new(),
            squad_override: None,
            is_lolminer_tested: false,
        }
    }
}
impl ConfigContentImpl for ConfigMiningContent {}
impl ConfigMiningContent {
    pub fn update_custom_mode_cpu_usage(&mut self, cpu_usage_percentage: u32) -> &mut Self {
        if let Some(custom_mode) = self.mining_modes.get_mut("Custom") {
            custom_mode.cpu_usage_percentage = cpu_usage_percentage;
        }
        self
    }

    pub fn update_custom_mode_gpu_usage(&mut self, gpu_usage_percentage: u32) -> &mut Self {
        if let Some(custom_mode) = self.mining_modes.get_mut("Custom") {
            custom_mode.gpu_usage_percentage = gpu_usage_percentage;
        }
        self
    }

    /// Populate the GPU devices settings with the given device IDs.
    /// If a device ID already exists, it will not be added again.
    pub fn populate_gpu_devices_settings(&mut self, device_ids: Vec<u32>) -> &mut Self {
        for device_id in device_ids {
            self.gpu_devices_settings.add(device_id);
        }

        self
    }

    pub fn enable_gpu_device_exclusion(&mut self, device_id: u32) -> &mut Self {
        self.gpu_devices_settings.set_excluded(device_id, true);
        self
    }

    pub fn disable_gpu_device_exclusion(&mut self, device_id: u32) -> &mut Self {
        self.gpu_devices_settings.set_excluded(device_id, false);
        self
    }

    pub fn get_selected_cpu_usage_percentage(&self) -> u32 {
        match self.mining_modes.get(&self.selected_mining_mode) {
            Some(mode) => mode.cpu_usage_percentage,
            None => {
                warn!("Mining mode '{}' not found", self.selected_mining_mode);
                0
            }
        }
    }

    pub fn get_excluded_devices(&self) -> Vec<u32> {
        self.gpu_devices_settings
            .0
            .iter()
            .filter_map(|(&device_id, settings)| {
                if settings.is_excluded {
                    Some(device_id)
                } else {
                    None
                }
            })
            .collect()
    }

    pub fn get_selected_gpu_usage_percentage(&self) -> u32 {
        match self.mining_modes.get(&self.selected_mining_mode) {
            Some(mode) => mode.gpu_usage_percentage,
            None => {
                warn!("Mining mode '{}' not found", self.selected_mining_mode);
                0
            }
        }
    }
}
pub struct ConfigMining {
    content: ConfigMiningContent,
    app_handle: RwLock<Option<AppHandle>>,
}

impl ConfigMining {
    pub async fn initialize(app_handle: AppHandle) {
        let mut config = Self::current().write().await;
        config.load_app_handle(app_handle.clone()).await;
        drop(config);

        Self::_check_for_migration()
            .await
            .expect("Could not check for migration");
    }

    async fn _migrate() -> Result<(), anyhow::Error> {
        let mut mining_modes = Self::content().await.mining_modes;
        let should_update_selected = !mining_modes.contains_key("Turbo")
            && Self::content().await.selected_mining_mode == "Eco";

        mining_modes
            .entry("Eco".to_string())
            .and_modify(|m| m.cpu_usage_percentage = 1)
            .and_modify(|m| m.gpu_usage_percentage = 1);

        let turbo = MiningMode {
            mode_type: MiningModeType::Turbo,
            mode_name: "Turbo".to_string(),
            cpu_usage_percentage: 10,
            gpu_usage_percentage: 10,
        };

        mining_modes
            .entry("Turbo".to_string())
            .or_insert_with(|| turbo);

        Self::update_field(ConfigMiningContent::set_mining_modes, mining_modes).await?;

        if should_update_selected {
            Self::update_field(
                ConfigMiningContent::set_selected_mining_mode,
                "Turbo".to_string(),
            )
            .await?;
            return Ok(());
        }
        Ok(())
    }

    async fn _check_for_migration() -> Result<(), anyhow::Error> {
        let current_version = Self::content().await.version_counter;
        if current_version < MINING_CONFIG_VERSION {
            info!("Mining config needs migration v{current_version:?} => v{MINING_CONFIG_VERSION}");
            Self::_migrate().await?;
            Self::update_field(
                ConfigMiningContent::set_version_counter,
                MINING_CONFIG_VERSION,
            )
            .await?;
            return Ok(());
        }
        Ok(())
    }
}

impl ConfigImpl for ConfigMining {
    type Config = ConfigMiningContent;

    fn new() -> Self {
        Self {
            content: ConfigMining::_load_or_create(),
            app_handle: RwLock::new(None),
        }
    }

    fn current() -> &'static RwLock<Self> {
        &INSTANCE
    }

    async fn _get_app_handle(&self) -> Option<AppHandle> {
        self.app_handle.read().await.clone()
    }

    fn _get_name() -> String {
        "config_mining".to_string()
    }

    fn _get_content(&self) -> &Self::Config {
        &self.content
    }

    fn _get_content_mut(&mut self) -> &mut Self::Config {
        &mut self.content
    }

    async fn load_app_handle(&mut self, app_handle: AppHandle) {
        *self.app_handle.write().await = Some(app_handle);
    }
}
