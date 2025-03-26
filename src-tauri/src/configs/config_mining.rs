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

use crate::{
    app_config::{GpuThreads, MiningMode},
    gpu_miner::EngineType,
};
use std::{sync::LazyLock, time::SystemTime};

use getset::{Getters, Setters};
use serde::{Deserialize, Serialize};
use tokio::sync::Mutex;

use crate::AppConfig;

use super::trait_config::{ConfigContentImpl, ConfigImpl};

static INSTANCE: LazyLock<Mutex<ConfigMining>> = LazyLock::new(|| Mutex::new(ConfigMining::new()));

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
#[serde(default)]
#[derive(Getters, Setters)]
#[getset(get = "pub", set = "pub")]
pub struct ConfigMiningContent {
    created_at: SystemTime,
    mode: MiningMode,
    eco_mode_cpu_threads: Option<u32>,
    ludicrous_mode_cpu_threads: Option<u32>,
    eco_mode_cpu_options: Vec<String>,
    ludicrous_mode_cpu_options: Vec<String>,
    custom_mode_cpu_options: Vec<String>,
    custom_max_cpu_usage: Option<u32>,
    custom_max_gpu_usage: Vec<GpuThreads>,
    gpu_engine: EngineType,
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
