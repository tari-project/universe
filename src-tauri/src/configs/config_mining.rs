use crate::{
    app_config::{GpuThreads, MiningMode},
    gpu_miner::EngineType,
};
use std::{
    sync::{LazyLock, Mutex},
    time::SystemTime,
};

use serde::{Deserialize, Serialize};

use crate::AppConfig;

use super::trait_config::{ConfigContentImpl, ConfigImpl};

static INSTANCE: LazyLock<Mutex<ConfigMining>> = LazyLock::new(|| Mutex::new(ConfigMining::new()));

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
#[serde(default)]
pub struct ConfigMiningContent {
    created_at: SystemTime,
    mode: MiningMode,
    eco_mode_cpu_threads: Option<u32>,       // Mining
    ludicrous_mode_cpu_threads: Option<u32>, // Mining
    eco_mode_cpu_options: Vec<String>,       // Mining
    ludicrous_mode_cpu_options: Vec<String>, // Mining
    custom_mode_cpu_options: Vec<String>,    // Mining
    custom_max_cpu_usage: Option<u32>,       // Mining
    custom_max_gpu_usage: Vec<GpuThreads>,   // Mining
    gpu_engine: EngineType,                  // Mining
}

impl Default for ConfigMiningContent {
    fn default() -> Self {
        Self {
            created_at: SystemTime::now(),
            mode: MiningMode::Eco,
            eco_mode_cpu_threads: None,
            ludicrous_mode_cpu_threads: None,
            eco_mode_cpu_options: vec![],
            ludicrous_mode_cpu_options: vec![],
            custom_mode_cpu_options: vec![],
            custom_max_cpu_usage: None,
            custom_max_gpu_usage: vec![],
            gpu_engine: EngineType::OpenCL,
        }
    }
}
impl ConfigContentImpl for ConfigMiningContent {}

impl ConfigMiningContent {
    pub fn mode(&self) -> MiningMode {
        self.mode
    }

    pub fn custom_cpu_usage(&self) -> Option<u32> {
        self.custom_max_cpu_usage
    }

    pub fn custom_gpu_usage(&self) -> Vec<GpuThreads> {
        self.custom_max_gpu_usage.clone()
    }

    pub fn custom_mode_cpu_options(&self) -> Vec<String> {
        self.custom_mode_cpu_options.clone()
    }

    pub fn eco_mode_cpu_options(&self) -> Vec<String> {
        self.eco_mode_cpu_options.clone()
    }

    pub fn eco_mode_cpu_threads(&self) -> Option<u32> {
        self.eco_mode_cpu_threads
    }

    pub fn gpu_engine(&self) -> EngineType {
        self.gpu_engine.clone()
    }

    pub fn ludicrous_mode_cpu_options(&self) -> Vec<String> {
        self.ludicrous_mode_cpu_options.clone()
    }

    pub fn ludicrous_mode_cpu_threads(&self) -> Option<u32> {
        self.ludicrous_mode_cpu_threads
    }

    pub fn set_mode(&mut self, mode: MiningMode) {
        self.mode = mode;
    }

    pub fn set_custom_cpu_usage(&mut self, custom_max_cpu_usage: Option<u32>) {
        self.custom_max_cpu_usage = custom_max_cpu_usage;
    }

    pub fn set_custom_gpu_usage(&mut self, custom_max_gpu_usage: Vec<GpuThreads>) {
        self.custom_max_gpu_usage = custom_max_gpu_usage;
    }

    pub fn set_custom_mode_cpu_options(&mut self, custom_mode_cpu_options: Vec<String>) {
        self.custom_mode_cpu_options = custom_mode_cpu_options;
    }

    pub fn set_eco_mode_cpu_options(&mut self, eco_mode_cpu_options: Vec<String>) {
        self.eco_mode_cpu_options = eco_mode_cpu_options;
    }

    pub fn set_eco_mode_cpu_threads(&mut self, eco_mode_cpu_threads: Option<u32>) {
        self.eco_mode_cpu_threads = eco_mode_cpu_threads;
    }

    pub fn set_gpu_engine(&mut self, gpu_engine: EngineType) {
        self.gpu_engine = gpu_engine;
    }

    pub fn set_ludicrous_mode_cpu_options(&mut self, ludicrous_mode_cpu_options: Vec<String>) {
        self.ludicrous_mode_cpu_options = ludicrous_mode_cpu_options;
    }

    pub fn set_ludicrous_mode_cpu_threads(&mut self, ludicrous_mode_cpu_threads: Option<u32>) {
        self.ludicrous_mode_cpu_threads = ludicrous_mode_cpu_threads;
    }
}

pub struct ConfigMining {
    content: ConfigMiningContent,
}

impl ConfigImpl for ConfigMining {
    type Config = ConfigMiningContent;
    type OldConfig = AppConfig;

    fn current() -> &'static Mutex<Self> {
        &INSTANCE
    }

    fn new() -> Self {
        Self {
            content: ConfigMiningContent::default(),
        }
    }

    fn get_name() -> String {
        "mining_config".to_string()
    }

    fn get_content(&self) -> &Self::Config {
        &self.content
    }

    fn get_content_mut(&mut self) -> &mut Self::Config {
        &mut self.content
    }

    fn migrate_old_config(&mut self, old_config: Self::OldConfig) -> Result<(), anyhow::Error> {
        self.content = ConfigMiningContent {
            created_at: SystemTime::now(),
            mode: old_config.mode(),
            custom_max_cpu_usage: old_config.custom_cpu_usage(),
            custom_max_gpu_usage: old_config.custom_gpu_usage(),
            custom_mode_cpu_options: old_config.custom_mode_cpu_options().clone(),
            eco_mode_cpu_options: old_config.eco_mode_cpu_options().clone(),
            eco_mode_cpu_threads: old_config.eco_mode_cpu_threads(),
            gpu_engine: old_config.gpu_engine(),
            ludicrous_mode_cpu_options: old_config.ludicrous_mode_cpu_options().clone(),
            ludicrous_mode_cpu_threads: old_config.ludicrous_mode_cpu_threads(),
        };
        Ok(())
    }
}
