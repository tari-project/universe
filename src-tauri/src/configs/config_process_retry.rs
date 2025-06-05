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

use getset::{Getters, Setters};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::LazyLock;
use tauri::AppHandle;
use tokio::sync::RwLock;

use super::trait_config::{ConfigContentImpl, ConfigImpl};

static INSTANCE: LazyLock<RwLock<ConfigProcessRetry>> = LazyLock::new(|| RwLock::new(ConfigProcessRetry::new()));

#[derive(Serialize, Deserialize, Clone, PartialEq, Debug)]
#[serde(rename_all = "snake_case")]
#[serde(default)]
#[derive(Getters, Setters)]
#[getset(get = "pub", set = "pub")]
pub struct ProcessSpecificConfig {
    pub max_startup_attempts: u8,
    pub startup_retry_delay_secs: u64,
    pub max_runtime_restart_attempts: u8,
    pub runtime_restart_delay_secs: u64,
}

#[derive(Serialize, Deserialize, Clone, PartialEq, Debug)]
#[serde(rename_all = "snake_case")]
#[serde(default)]
#[derive(Getters, Setters)]
#[getset(get = "pub", set = "pub")]
pub struct ConfigProcessRetryContent {
    /// Global default configuration
    default_config: ProcessSpecificConfig,
    /// Process-specific overrides
    process_overrides: HashMap<String, ProcessSpecificConfig>,
    /// Enable binary corruption detection during startup and runtime
    enable_corruption_detection: bool,
    /// Enable automatic re-download of corrupted binaries
    corruption_redownload_enabled: bool,
    /// Maximum number of re-download attempts for corrupted binaries
    max_corruption_redownload_attempts: u8,
}

impl Default for ProcessSpecificConfig {
    fn default() -> Self {
        Self {
            max_startup_attempts: 10,
            startup_retry_delay_secs: 5,
            max_runtime_restart_attempts: 3,
            runtime_restart_delay_secs: 10,
        }
    }
}

impl Default for ConfigProcessRetryContent {
    fn default() -> Self {
        Self {
            default_config: ProcessSpecificConfig::default(),
            process_overrides: HashMap::new(),
            enable_corruption_detection: true,
            corruption_redownload_enabled: true,
            max_corruption_redownload_attempts: 3,
        }
    }
}

impl ProcessSpecificConfig {
    pub fn startup_retry_delay(&self) -> std::time::Duration {
        std::time::Duration::from_secs(self.startup_retry_delay_secs)
    }

    pub fn runtime_restart_delay(&self) -> std::time::Duration {
        std::time::Duration::from_secs(self.runtime_restart_delay_secs)
    }
}

impl ConfigProcessRetryContent {
    pub fn get_config_for_process(&self, process_name: &str) -> &ProcessSpecificConfig {
        self.process_overrides.get(process_name)
            .unwrap_or(&self.default_config)
    }

    pub fn set_process_config(&mut self, process_name: String, config: ProcessSpecificConfig) {
        self.process_overrides.insert(process_name, config);
    }

    pub fn remove_process_config(&mut self, process_name: &str) -> Option<ProcessSpecificConfig> {
        self.process_overrides.remove(process_name)
    }

    pub fn get_process_names(&self) -> Vec<String> {
        self.process_overrides.keys().cloned().collect()
    }
}

impl ConfigContentImpl for ConfigProcessRetryContent {}

pub struct ConfigProcessRetry {
    content: ConfigProcessRetryContent,
    app_handle: RwLock<Option<AppHandle>>,
}

impl ConfigProcessRetry {
    pub fn new() -> Self {
        Self {
            content: ConfigProcessRetryContent::default(),
            app_handle: RwLock::new(None),
        }
    }

    pub async fn current() -> &'static LazyLock<RwLock<ConfigProcessRetry>> {
        &INSTANCE
    }
}

impl ConfigImpl for ConfigProcessRetry {
    type Config = ConfigProcessRetryContent;

    fn current() -> &'static RwLock<Self> {
        &INSTANCE
    }

    fn new() -> Self {
        Self {
            content: ConfigProcessRetryContent::default(),
            app_handle: RwLock::new(None),
        }
    }

    async fn _get_app_handle(&self) -> Option<AppHandle> {
        self.app_handle.read().await.clone()
    }

    async fn load_app_handle(&mut self, app_handle: AppHandle) {
        *self.app_handle.write().await = Some(app_handle);
    }

    fn _get_name() -> String {
        "config_process_retry".to_string()
    }

    fn _get_content(&self) -> &Self::Config {
        &self.content
    }

    fn _get_content_mut(&mut self) -> &mut Self::Config {
        &mut self.content
    }
}

impl Default for ConfigProcessRetry {
    fn default() -> Self {
        Self::new()
    }
}
