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

use super::trait_config::{ConfigContentImpl, ConfigImpl};
use crate::LOG_TARGET_APP_LOGIC;
use crate::events_emitter::EventsEmitter;
use crate::mining::gpu::consts::GpuMinerType;
use getset::{Getters, Setters};
use log::{info, warn};
use serde::{Deserialize, Deserializer, Serialize, Serializer};
use std::time::Duration;
use std::{collections::HashMap, fmt::Display, sync::LazyLock, time::SystemTime};
use tauri::AppHandle;
use tokio::sync::RwLock;

pub const MINING_CONFIG_VERSION: u32 = 2;
static INSTANCE: LazyLock<RwLock<ConfigMining>> =
    LazyLock::new(|| RwLock::new(ConfigMining::new()));

#[derive(Debug, Clone, Copy, Eq, PartialEq, Serialize, Deserialize, Default)]
pub enum MiningModeType {
    #[default]
    Eco,
    Turbo,
    Ludicrous,
    Custom,
    User,
}

impl Display for MiningModeType {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        let mode_str = match self {
            MiningModeType::Eco => "Eco",
            MiningModeType::Turbo => "Turbo",
            MiningModeType::Ludicrous => "Ludicrous",
            MiningModeType::Custom => "Custom",
            MiningModeType::User => "User",
        };
        write!(f, "{mode_str}")
    }
}

impl From<&str> for MiningModeType {
    fn from(s: &str) -> Self {
        match s.to_lowercase().as_str() {
            "eco" => MiningModeType::Eco,
            "turbo" => MiningModeType::Turbo,
            "ludicrous" => MiningModeType::Ludicrous,
            "custom" => MiningModeType::Custom,
            "user" => MiningModeType::User,
            _ => {
                warn!("Unknown mining mode type: {s}, defaulting to Eco");
                MiningModeType::Eco
            }
        }
    }
}

impl From<String> for MiningModeType {
    fn from(s: String) -> Self {
        Self::from(s.as_str())
    }
}

#[derive(Debug, Clone, Eq, PartialEq, Serialize, Deserialize)]
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
#[derive(Serialize, Deserialize, Clone, Default)]
pub struct GpuDevicesSettings(HashMap<u32, GpuDeviceSettings>);

impl GpuDevicesSettings {
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

    fn is_every_device_excluded(&self) -> bool {
        !self.0.is_empty() && self.0.values().all(|settings| settings.is_excluded)
    }

    fn include_every_device(&mut self) {
        for settings in self.0.values_mut() {
            settings.is_excluded = false;
        }
    }

    pub fn excluded_device_ids(&self) -> Vec<u32> {
        self.0
            .iter()
            .filter_map(|(&device_id, settings)| settings.is_excluded.then_some(device_id))
            .collect()
    }
}

/// Device settings kept separately per GPU miner.
///
/// Device ids are only meaningful inside one miner's enumeration: lolMiner walks CUDA and OpenCL
/// devices and numbers them itself, TARI.Miner uses the nvidia-smi index. The same id therefore
/// points at different cards under different miners, so a single shared map would let an exclusion
/// the user set for one miner silently disable a different card under the other.
#[derive(Serialize, Clone, Default)]
pub struct GpuDevicesSettingsByMiner(HashMap<GpuMinerType, GpuDevicesSettings>);

impl GpuDevicesSettingsByMiner {
    pub fn for_miner(&self, miner_type: &GpuMinerType) -> Option<&GpuDevicesSettings> {
        self.0.get(miner_type)
    }

    fn is_empty(&self) -> bool {
        self.0.is_empty()
    }

    fn for_miner_mut(&mut self, miner_type: GpuMinerType) -> &mut GpuDevicesSettings {
        self.0.entry(miner_type).or_default()
    }
}

impl GpuDevicesSettingsByMiner {
    /// Reads the flat `device id -> settings` map written before there was a second GPU miner.
    /// lolMiner was the only miner those configs could have been describing, so their settings are
    /// kept and attributed to it rather than dropped.
    fn from_legacy_flat_shape(stored: serde_json::Value) -> Self {
        match serde_json::from_value::<GpuDevicesSettings>(stored) {
            Ok(flat) => {
                info!(target: LOG_TARGET_APP_LOGIC, "Adopting gpu device settings written before there was a second miner as lolMiner's");
                Self(HashMap::from([(GpuMinerType::LolMiner, flat)]))
            }
            Err(error) => {
                warn!(target: LOG_TARGET_APP_LOGIC, "Could not read the stored gpu device settings ({error}), starting from empty ones");
                Self::default()
            }
        }
    }

    fn from_per_miner_shape(entries: HashMap<String, serde_json::Value>) -> Self {
        let mut by_miner = HashMap::new();

        for (raw_miner_type, stored) in entries {
            let Some(miner_type) = GpuMinerType::from_name(&raw_miner_type) else {
                warn!(target: LOG_TARGET_APP_LOGIC, "Dropping gpu device settings for unknown miner {raw_miner_type}");
                continue;
            };

            match serde_json::from_value::<GpuDevicesSettings>(stored) {
                Ok(settings) => {
                    by_miner.insert(miner_type, settings);
                }
                Err(error) => {
                    warn!(target: LOG_TARGET_APP_LOGIC, "Dropping unreadable gpu device settings for {miner_type}: {error}");
                }
            }
        }

        Self(by_miner)
    }
}

impl<'de> Deserialize<'de> for GpuDevicesSettingsByMiner {
    /// Accepts both the per miner shape and the flat legacy one, and never fails.
    ///
    /// Failing here would fail the whole `ConfigMiningContent`, and `_load_or_create` answers that
    /// by writing a default config back over the user's file. Losing every mining setting because
    /// one field held something this build does not recognise - a miner added by a newer build the
    /// user rolled back from, a `null`, one malformed entry - is far worse than losing that field,
    /// so anything unreadable is dropped with a warning instead. `deserialize_gpu_miner_type`
    /// below exists for the same reason.
    ///
    /// This goes through `serde_json::Value` rather than an untagged enum because the two shapes
    /// are told apart by their map keys, and untagged buffering hands map keys on as strings
    /// without the integer key coercion serde_json itself does. Configs are only ever JSON.
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: Deserializer<'de>,
    {
        let stored = serde_json::Value::deserialize(deserializer)?;

        let Ok(entries) =
            serde_json::from_value::<HashMap<String, serde_json::Value>>(stored.clone())
        else {
            warn!(target: LOG_TARGET_APP_LOGIC, "Stored gpu device settings are not a map, starting from empty ones");
            return Ok(Self::default());
        };

        // The legacy shape is keyed by device id, the current one by miner name. An empty map is
        // read as the current shape, which gives the same empty result either way.
        if entries.keys().any(|key| key.parse::<u32>().is_ok()) {
            return Ok(Self::from_legacy_flat_shape(stored));
        }

        Ok(Self::from_per_miner_shape(entries))
    }
}
#[derive(Serialize, Deserialize, Debug, Clone)]
pub enum PauseOnBatteryModeState {
    Enabled,
    Disabled,
    NotSupported,
}

impl PauseOnBatteryModeState {
    pub fn is_not_supported(&self) -> bool {
        matches!(self, PauseOnBatteryModeState::NotSupported)
    }
    pub fn is_enabled(&self) -> bool {
        matches!(self, PauseOnBatteryModeState::Enabled)
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
    #[serde(default)]
    gpu_devices_settings_by_miner: GpuDevicesSettingsByMiner,
    /// Compatibility copy of the device settings, under the name older builds expect.
    ///
    /// Written as lolMiner's settings in the flat `device id -> settings` shape, because builds
    /// from before per miner settings declare this field as `HashMap<u32, GpuDeviceSettings>` and
    /// a present field they cannot parse is a hard error there, costing the user their whole
    /// mining config. Read back tolerantly in every shape this name has ever held - flat, and the
    /// per miner map that intermediate builds wrote here - so upgrading from any of them keeps the
    /// user's exclusions. `gpu_devices_settings_by_miner` is authoritative once migrated.
    #[serde(
        rename = "gpu_devices_settings",
        default,
        serialize_with = "serialize_gpu_devices_settings_for_older_builds"
    )]
    legacy_gpu_devices_settings: GpuDevicesSettingsByMiner,
    #[serde(default, deserialize_with = "deserialize_gpu_miner_type")]
    gpu_miner_type: GpuMinerType,
    squad_override: Option<String>,
    pause_on_battery_mode: PauseOnBatteryModeState,
    is_lolminer_tested: bool,
    is_gpu_mining_recommended: bool,

    eco_alert_needed: bool,
    mode_mining_times: HashMap<String, Duration>, // we only need Eco for now, but we can add to this if needed
}

impl Default for ConfigMiningContent {
    fn default() -> Self {
        Self {
            version_counter: MINING_CONFIG_VERSION,
            created_at: SystemTime::now(),
            selected_mining_mode: "Eco".to_string(),
            mine_on_app_start: true,
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
            gpu_devices_settings_by_miner: GpuDevicesSettingsByMiner::default(),
            legacy_gpu_devices_settings: GpuDevicesSettingsByMiner::default(),
            gpu_miner_type: GpuMinerType::default(),
            pause_on_battery_mode: PauseOnBatteryModeState::Enabled,
            squad_override: None,
            is_lolminer_tested: false,
            is_gpu_mining_recommended: true,
            eco_alert_needed: true,
            mode_mining_times: HashMap::from([("Eco".to_string(), Duration::new(0, 0))]),
        }
    }
}
/// Writes the compatibility copy in the flat shape older builds can read, which can only carry one
/// miner's settings - lolMiner's, the only one those builds know about.
fn serialize_gpu_devices_settings_for_older_builds<S>(
    settings: &GpuDevicesSettingsByMiner,
    serializer: S,
) -> Result<S::Ok, S::Error>
where
    S: Serializer,
{
    settings
        .for_miner(&GpuMinerType::LolMiner)
        .cloned()
        .unwrap_or_default()
        .serialize(serializer)
}

/// Tolerant deserializer for the selected GPU miner.
/// Configs written by older versions can still hold a miner that no longer exists (the SHA3 miners
/// that were removed), and those must not make the whole mining config fail to load. Neither must
/// a value that is not a miner name at all, `null` included.
fn deserialize_gpu_miner_type<'de, D>(deserializer: D) -> Result<GpuMinerType, D::Error>
where
    D: Deserializer<'de>,
{
    // Through Value rather than String directly: a non string value would otherwise leave the
    // parser mid token, and there would be no whole config left to salvage.
    let stored = serde_json::Value::deserialize(deserializer)?;
    let Some(raw_miner_type) = stored.as_str() else {
        warn!(target: LOG_TARGET_APP_LOGIC, "Gpu miner in the mining config is not a name, falling back to the default one");
        return Ok(GpuMinerType::default());
    };

    Ok(GpuMinerType::from_name(raw_miner_type).unwrap_or_else(|| {
        warn!(target: LOG_TARGET_APP_LOGIC, "Unknown gpu miner {raw_miner_type} in the mining config, falling back to the default one");
        GpuMinerType::default()
    }))
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

    /// Populate the GPU devices settings with the device IDs a miner detected.
    /// If a device ID already exists for that same miner, it will not be added again.
    /// Settings belonging to the other miners are left untouched, so switching miners and switching
    /// back keeps whatever the user chose for each of them.
    /// A config written before device settings were per miner only holds lolMiner's, under the
    /// legacy key. Move them across the first time the per miner map is touched, so upgrading
    /// keeps the user's exclusions.
    fn adopt_legacy_gpu_devices_settings(&mut self) {
        if !self.gpu_devices_settings_by_miner.is_empty()
            || self.legacy_gpu_devices_settings.is_empty()
        {
            return;
        }

        info!(target: LOG_TARGET_APP_LOGIC, "Adopting the gpu device settings stored under the compatibility key");
        self.gpu_devices_settings_by_miner = std::mem::take(&mut self.legacy_gpu_devices_settings);
    }

    /// Keeps the compatibility copy in step, so rolling back to a build that only knows the flat
    /// shape still finds the user's lolMiner exclusions there.
    fn refresh_legacy_gpu_devices_settings(&mut self) {
        self.legacy_gpu_devices_settings = self.gpu_devices_settings_by_miner.clone();
    }

    fn update_gpu_devices_settings(
        &mut self,
        miner_type: GpuMinerType,
        update: impl FnOnce(&mut GpuDevicesSettings),
    ) -> &mut Self {
        self.adopt_legacy_gpu_devices_settings();
        update(self.gpu_devices_settings_by_miner.for_miner_mut(miner_type));
        self.refresh_legacy_gpu_devices_settings();
        self
    }

    pub fn populate_gpu_devices_settings(
        &mut self,
        (miner_type, device_ids): (GpuMinerType, Vec<u32>),
    ) -> &mut Self {
        self.update_gpu_devices_settings(miner_type, |settings| {
            for device_id in device_ids {
                settings.add(device_id);
            }
        })
    }

    pub fn enable_gpu_device_exclusion(
        &mut self,
        (miner_type, device_id): (GpuMinerType, u32),
    ) -> &mut Self {
        self.update_gpu_devices_settings(miner_type, |settings| {
            settings.set_excluded(device_id, true);
        })
    }

    pub fn disable_gpu_device_exclusion(
        &mut self,
        (miner_type, device_id): (GpuMinerType, u32),
    ) -> &mut Self {
        self.update_gpu_devices_settings(miner_type, |settings| {
            settings.set_excluded(device_id, false);
        })
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

    /// Re-includes the devices of every miner that has all of its devices excluded.
    ///
    /// "Every device excluded" is not a mining configuration, it is only ever how the user turned
    /// mining off from the device list. Leaving a miner in it makes that miner refuse to start with
    /// `MiningError::AllDevicesExcluded`, and the user cannot always reach that miner's device
    /// list to undo it. Deliberate partial exclusions are left alone.
    pub fn include_devices_of_unusable_miners(&mut self, (): ()) -> &mut Self {
        self.adopt_legacy_gpu_devices_settings();
        for (miner_type, settings) in &mut self.gpu_devices_settings_by_miner.0 {
            if settings.is_every_device_excluded() {
                info!(target: LOG_TARGET_APP_LOGIC, "Re-including every {miner_type} device, all of them were excluded");
                settings.include_every_device();
            }
        }
        self.refresh_legacy_gpu_devices_settings();
        self
    }

    pub fn get_excluded_devices(&self, miner_type: &GpuMinerType) -> Vec<u32> {
        self.gpu_devices_settings_by_miner
            .for_miner(miner_type)
            // Not migrated yet: read straight from the compatibility copy.
            .or_else(|| self.legacy_gpu_devices_settings.for_miner(miner_type))
            .map(GpuDevicesSettings::excluded_device_ids)
            .unwrap_or_default()
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

    pub async fn update_mining_times(
        mode: MiningModeType,
        duration: u64,
    ) -> Result<(), anyhow::Error> {
        let mut mode_mining_times = Self::content().await.mode_mining_times;

        mode_mining_times
            .entry(mode.to_string())
            .and_modify(|t| *t = Duration::from_secs(t.as_secs() + duration));

        Self::update_field(
            ConfigMiningContent::set_mode_mining_times,
            mode_mining_times.clone(),
        )
        .await?;

        if mode.to_string() == "Eco" && Self::content().await.eco_alert_needed {
            let secs = mode_mining_times
                .get("Eco")
                .unwrap_or(&Duration::new(0, 0))
                .as_secs();
            let threshold = 3600 * 12; // 12 hours in seconds
            if secs >= threshold {
                EventsEmitter::emit_show_eco_alert().await;
            }
        }

        Ok(())
    }

    async fn _migrate() -> Result<(), anyhow::Error> {
        let current_version = Self::content().await.version_counter;

        // v0 -> v1 migration (existing mining modes migration)
        if current_version < 1 {
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
            }
        }

        // v1 -> v2 migration (SHA3 removal)
        // Note: gpu_miner_type and gpu_engine fields will be ignored on next deserialize
        // since they're removed from the struct. GPU mining disable is handled at runtime
        // via is_supported_on_current_platform() check in phase_gpu_mining.rs

        Ok(())
    }

    async fn _check_for_migration() -> Result<(), anyhow::Error> {
        let current_version = Self::content().await.version_counter;
        if current_version < MINING_CONFIG_VERSION {
            info!(target: LOG_TARGET_APP_LOGIC, "Mining config needs migration v{current_version:?} => v{MINING_CONFIG_VERSION}");
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

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn a_config_without_a_gpu_miner_keeps_the_default_one() {
        let content: ConfigMiningContent =
            serde_json::from_str(r#"{"selected_mining_mode":"Eco"}"#).expect("valid mining config");

        assert_eq!(*content.gpu_miner_type(), GpuMinerType::LolMiner);
        assert_eq!(content.selected_mining_mode(), "Eco");
    }

    #[test]
    fn a_saved_gpu_miner_is_restored() {
        let content: ConfigMiningContent =
            serde_json::from_str(r#"{"gpu_miner_type":"TariMiner"}"#).expect("valid mining config");

        assert_eq!(*content.gpu_miner_type(), GpuMinerType::TariMiner);
    }

    #[test]
    fn a_removed_gpu_miner_falls_back_to_the_default_one_instead_of_failing_the_load() {
        let content: ConfigMiningContent =
            serde_json::from_str(r#"{"gpu_miner_type":"Graxil","cpu_mining_enabled":false}"#)
                .expect("legacy mining configs still load");

        assert_eq!(*content.gpu_miner_type(), GpuMinerType::LolMiner);
        assert!(!content.cpu_mining_enabled());
    }

    /// Mirrors the call sequence a launch produces: `GpuManager::detect_devices` probes every
    /// available miner, then `load_saved_miner` -> `switch_miner` detects again for the miner it
    /// settled on. Every one of those detections lands in `populate_gpu_devices_settings`, so a
    /// user's exclusion has to survive all of them, on this launch and on every later one.
    #[test]
    fn user_exclusions_survive_the_detection_sweep_of_every_launch() {
        let mut content = ConfigMiningContent::default();
        content.populate_gpu_devices_settings((GpuMinerType::LolMiner, vec![0, 1]));
        content.enable_gpu_device_exclusion((GpuMinerType::LolMiner, 0));

        for launch in 0..3 {
            // The probe sweep runs for every miner that initialized, not just the selected one.
            content.populate_gpu_devices_settings((GpuMinerType::TariMiner, vec![0]));
            content.populate_gpu_devices_settings((GpuMinerType::LolMiner, vec![0, 1]));
            // ...and then again for the miner that was actually selected.
            content.populate_gpu_devices_settings((GpuMinerType::LolMiner, vec![0, 1]));

            assert_eq!(
                content.get_excluded_devices(&GpuMinerType::LolMiner),
                vec![0],
                "the exclusion was lost on launch {launch}"
            );
        }
    }

    #[test]
    fn each_miner_keeps_its_own_exclusions() {
        let mut content = ConfigMiningContent::default();
        content.populate_gpu_devices_settings((GpuMinerType::LolMiner, vec![0, 1]));
        content.populate_gpu_devices_settings((GpuMinerType::TariMiner, vec![0]));

        // Device 0 is a different card under each miner's enumeration, so excluding it for one
        // must not exclude it for the other.
        content.enable_gpu_device_exclusion((GpuMinerType::LolMiner, 0));

        assert_eq!(
            content.get_excluded_devices(&GpuMinerType::LolMiner),
            vec![0]
        );
        assert!(
            content
                .get_excluded_devices(&GpuMinerType::TariMiner)
                .is_empty()
        );
    }

    #[test]
    fn exclusions_come_back_when_the_user_switches_miners_and_switches_back() {
        let mut content = ConfigMiningContent::default();
        content.populate_gpu_devices_settings((GpuMinerType::LolMiner, vec![0, 1]));
        content.enable_gpu_device_exclusion((GpuMinerType::LolMiner, 1));

        content.populate_gpu_devices_settings((GpuMinerType::TariMiner, vec![0, 1]));
        content.enable_gpu_device_exclusion((GpuMinerType::TariMiner, 0));
        content.populate_gpu_devices_settings((GpuMinerType::LolMiner, vec![0, 1]));

        assert_eq!(
            content.get_excluded_devices(&GpuMinerType::LolMiner),
            vec![1]
        );
        assert_eq!(
            content.get_excluded_devices(&GpuMinerType::TariMiner),
            vec![0]
        );
    }

    #[test]
    fn an_unknown_device_id_is_ignored_rather_than_invented() {
        let mut content = ConfigMiningContent::default();
        content.populate_gpu_devices_settings((GpuMinerType::LolMiner, vec![0]));

        content.enable_gpu_device_exclusion((GpuMinerType::LolMiner, 7));

        assert!(
            content
                .get_excluded_devices(&GpuMinerType::LolMiner)
                .is_empty()
        );
    }

    #[test]
    fn device_settings_written_before_there_was_a_second_miner_are_kept_for_lolminer() {
        // lolMiner was the only GPU miner those configs could describe, so their exclusions are
        // still valid for it and must not be thrown away on upgrade.
        let content: ConfigMiningContent = serde_json::from_str(
            r#"{"gpu_devices_settings":{"0":{"device_id":0,"is_excluded":true},"1":{"device_id":1,"is_excluded":false}}}"#,
        )
        .expect("legacy mining configs still load");

        assert_eq!(
            content.get_excluded_devices(&GpuMinerType::LolMiner),
            vec![0]
        );
        assert!(
            content
                .get_excluded_devices(&GpuMinerType::TariMiner)
                .is_empty()
        );
    }

    /// Everything unreadable in this field has to degrade to a warning. A hard error fails the
    /// whole `ConfigMiningContent`, and `_load_or_create` answers that by writing a default config
    /// back over the user's file, losing every unrelated mining setting with it.
    #[test]
    fn an_unreadable_device_settings_field_never_fails_the_mining_config() {
        for stored in [
            // A miner added by a newer build the user then rolled back from.
            r#"{"LolMiner":{"0":{"device_id":0,"is_excluded":true}},"SomeFutureMiner":{}}"#,
            // Not a map at all.
            "null",
            "\"nonsense\"",
            "[]",
            // A map whose entries are not device settings.
            r#"{"LolMiner":"nonsense"}"#,
            // Neither shape: keys are not miner names and the values are not device settings.
            r#"{"nonsense":{"also":"nonsense"}}"#,
        ] {
            let config = format!(
                r#"{{"gpu_devices_settings":{stored},"selected_mining_mode":"Ludicrous","mine_on_app_start":false}}"#
            );

            let content: ConfigMiningContent = serde_json::from_str(&config)
                .unwrap_or_else(|e| panic!("{stored} must not fail the mining config: {e}"));

            // The unrelated settings are what this is really protecting.
            assert_eq!(content.selected_mining_mode(), "Ludicrous");
            assert!(!content.mine_on_app_start());
        }
    }

    /// The same guarantee as above, for the key this build actually writes. Both keys have to
    /// degrade to a warning independently, or the rollback safety net becomes the thing that
    /// wipes the config it was added to protect.
    #[test]
    fn an_unreadable_per_miner_device_settings_field_never_fails_the_mining_config() {
        for stored in [
            r#"{"LolMiner":{"0":{"device_id":0,"is_excluded":true}},"SomeFutureMiner":{}}"#,
            "null",
            "\"nonsense\"",
            "[]",
            r#"{"LolMiner":"nonsense"}"#,
            r#"{"nonsense":{"also":"nonsense"}}"#,
        ] {
            let config = format!(
                r#"{{"gpu_devices_settings_by_miner":{stored},"selected_mining_mode":"Ludicrous","mine_on_app_start":false}}"#
            );

            let content: ConfigMiningContent = serde_json::from_str(&config)
                .unwrap_or_else(|e| panic!("{stored} must not fail the mining config: {e}"));

            assert_eq!(content.selected_mining_mode(), "Ludicrous");
            assert!(!content.mine_on_app_start());
        }
    }

    #[test]
    fn settings_for_miners_this_build_knows_survive_an_unknown_sibling() {
        let content: ConfigMiningContent = serde_json::from_str(
            r#"{"gpu_devices_settings_by_miner":{"LolMiner":{"0":{"device_id":0,"is_excluded":true}},"SomeFutureMiner":{"0":{"device_id":0,"is_excluded":true}}}}"#,
        )
        .expect("valid mining config");

        assert_eq!(
            content.get_excluded_devices(&GpuMinerType::LolMiner),
            vec![0]
        );
    }

    #[test]
    fn one_unreadable_miner_entry_does_not_take_its_siblings_with_it() {
        let content: ConfigMiningContent = serde_json::from_str(
            r#"{"gpu_devices_settings_by_miner":{"LolMiner":{"0":{"device_id":0,"is_excluded":true}},"TariMiner":"nonsense"}}"#,
        )
        .expect("valid mining config");

        assert_eq!(
            content.get_excluded_devices(&GpuMinerType::LolMiner),
            vec![0]
        );
        assert!(
            content
                .get_excluded_devices(&GpuMinerType::TariMiner)
                .is_empty()
        );
    }

    #[test]
    fn a_miner_with_every_device_excluded_is_made_usable_again() {
        let mut content = ConfigMiningContent::default();
        content.populate_gpu_devices_settings((GpuMinerType::LolMiner, vec![0, 1]));
        content.enable_gpu_device_exclusion((GpuMinerType::LolMiner, 0));
        content.enable_gpu_device_exclusion((GpuMinerType::LolMiner, 1));

        content.include_devices_of_unusable_miners(());

        assert!(
            content
                .get_excluded_devices(&GpuMinerType::LolMiner)
                .is_empty()
        );
    }

    /// The miner the user emptied out is not necessarily the one selected when they turn GPU
    /// mining back on, so this cannot be scoped to the selected miner.
    #[test]
    fn every_unusable_miner_is_made_usable_again_not_just_one() {
        let mut content = ConfigMiningContent::default();
        for miner_type in [GpuMinerType::LolMiner, GpuMinerType::TariMiner] {
            content.populate_gpu_devices_settings((miner_type.clone(), vec![0]));
            content.enable_gpu_device_exclusion((miner_type, 0));
        }

        content.include_devices_of_unusable_miners(());

        for miner_type in [GpuMinerType::LolMiner, GpuMinerType::TariMiner] {
            assert!(content.get_excluded_devices(&miner_type).is_empty());
        }
    }

    #[test]
    fn a_deliberate_partial_exclusion_is_left_alone() {
        let mut content = ConfigMiningContent::default();
        content.populate_gpu_devices_settings((GpuMinerType::LolMiner, vec![0, 1]));
        content.enable_gpu_device_exclusion((GpuMinerType::LolMiner, 1));

        content.include_devices_of_unusable_miners(());

        assert_eq!(
            content.get_excluded_devices(&GpuMinerType::LolMiner),
            vec![1]
        );
    }

    /// The per miner map lived under the old `gpu_devices_settings` name in intermediate builds,
    /// so a pre-release tester's config can hold that shape under that key. Dropping it would lose
    /// both miners' settings on the very upgrade the compatibility key exists to protect.
    #[test]
    fn per_miner_settings_written_under_the_compatibility_key_are_adopted() {
        let mut content: ConfigMiningContent = serde_json::from_str(
            r#"{"gpu_devices_settings":{"LolMiner":{"0":{"device_id":0,"is_excluded":true}},"TariMiner":{"1":{"device_id":1,"is_excluded":true}}}}"#,
        )
        .expect("valid mining config");

        assert_eq!(
            content.get_excluded_devices(&GpuMinerType::LolMiner),
            vec![0]
        );
        assert_eq!(
            content.get_excluded_devices(&GpuMinerType::TariMiner),
            vec![1]
        );

        // ...and they survive the migration onto the authoritative key.
        content.populate_gpu_devices_settings((GpuMinerType::LolMiner, vec![0]));

        assert_eq!(
            content.get_excluded_devices(&GpuMinerType::LolMiner),
            vec![0]
        );
        assert_eq!(
            content.get_excluded_devices(&GpuMinerType::TariMiner),
            vec![1]
        );
    }

    /// A build from before per miner settings declares this key as a flat `HashMap<u32, _>`, and a
    /// present field it cannot parse fails its whole mining config.
    #[test]
    fn the_compatibility_key_is_written_in_the_shape_older_builds_can_read() {
        let mut content = ConfigMiningContent::default();
        content.populate_gpu_devices_settings((GpuMinerType::LolMiner, vec![0, 1]));
        content.enable_gpu_device_exclusion((GpuMinerType::LolMiner, 1));
        content.populate_gpu_devices_settings((GpuMinerType::TariMiner, vec![0]));

        let serialized = serde_json::to_value(&content).expect("serializable mining config");
        let compatibility_key = serialized
            .get("gpu_devices_settings")
            .expect("the compatibility key is always written");

        let as_an_older_build_would_read_it: HashMap<u32, GpuDeviceSettings> =
            serde_json::from_value(compatibility_key.clone())
                .expect("an older build must still be able to parse this");

        assert_eq!(as_an_older_build_would_read_it.len(), 2);
        assert!(
            as_an_older_build_would_read_it
                .get(&1)
                .is_some_and(|settings| settings.is_excluded)
        );
    }

    #[test]
    fn per_miner_device_settings_round_trip_through_serialization() {
        let mut content = ConfigMiningContent::default();
        content.populate_gpu_devices_settings((GpuMinerType::TariMiner, vec![0, 1]));
        content.enable_gpu_device_exclusion((GpuMinerType::TariMiner, 1));

        let serialized = serde_json::to_string(&content).expect("serializable mining config");
        let deserialized: ConfigMiningContent =
            serde_json::from_str(&serialized).expect("valid mining config");

        assert_eq!(
            deserialized.get_excluded_devices(&GpuMinerType::TariMiner),
            vec![1]
        );
    }

    #[test]
    fn the_selected_gpu_miner_round_trips_through_serialization() {
        let mut content = ConfigMiningContent::default();
        content.set_gpu_miner_type(GpuMinerType::TariMiner);

        let serialized = serde_json::to_string(&content).expect("serializable mining config");
        let deserialized: ConfigMiningContent =
            serde_json::from_str(&serialized).expect("valid mining config");

        assert_eq!(*deserialized.gpu_miner_type(), GpuMinerType::TariMiner);
    }
}
