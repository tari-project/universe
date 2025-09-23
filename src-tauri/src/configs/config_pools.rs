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
use std::{sync::LazyLock, time::SystemTime};
use tauri::AppHandle;
use tokio::sync::RwLock;

use crate::{
    configs::pools::{
        cpu_pools::{CpuPool, LuckyPoolCpuConfig, SupportXTMCpuPoolConfig},
        gpu_pools::{GpuPool, LuckyPoolGpuConfig, SupportXTMGpuPoolConfig},
        PoolConfig,
    },
    mining::pools::{cpu_pool_manager::CpuPoolManager, gpu_pool_manager::GpuPoolManager},
};

use super::trait_config::{ConfigContentImpl, ConfigImpl};

pub const POOLS_CONFIG_VERSION: u32 = 0;
static INSTANCE: LazyLock<RwLock<ConfigPools>> = LazyLock::new(|| RwLock::new(ConfigPools::new()));

#[allow(clippy::struct_excessive_bools)]
#[derive(Serialize, Deserialize, Clone)]
#[serde(rename_all = "snake_case")]
#[serde(default)]
#[derive(Getters, Setters)]
pub struct ConfigPoolsContent {
    // ======= Config internals =======
    #[getset(get = "pub", set = "pub")]
    version_counter: u32,
    #[getset(get = "pub", set = "pub")]
    created_at: SystemTime,
    // ======= Gpu Pool =======
    #[getset(get = "pub", set = "pub")]
    gpu_pool_enabled: bool,
    #[getset(set = "pub")]
    selected_gpu_pool: String,
    #[getset(get = "pub", set = "pub")]
    available_gpu_pools: Vec<GpuPool>,
    // ======= Cpu Pool =======
    #[getset(get = "pub", set = "pub")]
    cpu_pool_enabled: bool,
    #[getset(set = "pub")]
    selected_cpu_pool: String,
    #[getset(get = "pub", set = "pub")]
    available_cpu_pools: Vec<CpuPool>,
}

impl Default for ConfigPoolsContent {
    fn default() -> Self {
        Self {
            // ======= Config internals =======
            version_counter: POOLS_CONFIG_VERSION,
            created_at: SystemTime::now(),
            // ======= Gpu Pool =======
            gpu_pool_enabled: true,
            selected_gpu_pool: GpuPool::default().name(),
            available_gpu_pools: vec![
                GpuPool::SupportXTMPool(SupportXTMGpuPoolConfig::default()),
                GpuPool::LuckyPool(LuckyPoolGpuConfig::default()),
            ],
            // ======= Cpu Pool =======
            cpu_pool_enabled: true,
            selected_cpu_pool: CpuPool::default().name(),
            available_cpu_pools: vec![
                CpuPool::SupportXTMPool(SupportXTMCpuPoolConfig::default()),
                CpuPool::LuckyPool(LuckyPoolCpuConfig::default()),
            ],
        }
    }
}
impl ConfigContentImpl for ConfigPoolsContent {}
impl ConfigPoolsContent {
    pub fn selected_gpu_pool(&self) -> GpuPool {
        self.available_gpu_pools
            .iter()
            .find(|pool| pool.name() == self.selected_gpu_pool)
            .cloned()
            .unwrap_or_else(GpuPool::default)
    }

    pub fn selected_cpu_pool(&self) -> CpuPool {
        self.available_cpu_pools
            .iter()
            .find(|pool| pool.name() == self.selected_cpu_pool)
            .cloned()
            .unwrap_or_else(CpuPool::default)
    }

    pub fn update_selected_cpu_config(&mut self, updated_config: CpuPool) -> &mut Self {
        if let Some(pool) = self
            .available_cpu_pools
            .iter_mut()
            .find(|pool| pool.name() == updated_config.name())
        {
            *pool = updated_config.clone();
        }
        self.selected_cpu_pool = updated_config.name();
        self
    }

    pub fn update_selected_gpu_config(&mut self, updated_config: GpuPool) -> &mut Self {
        if let Some(pool) = self
            .available_gpu_pools
            .iter_mut()
            .find(|pool| pool.name() == updated_config.name())
        {
            *pool = updated_config.clone();
        }
        self.selected_gpu_pool = updated_config.name();
        self
    }
}
pub struct ConfigPools {
    content: ConfigPoolsContent,
    app_handle: RwLock<Option<AppHandle>>,
}

impl ConfigPools {
    pub async fn initialize(app_handle: AppHandle) {
        let mut config = Self::current().write().await;
        config.load_app_handle(app_handle.clone()).await;

        // We want to initialize and fetch initial pool status only if pool mining is enabled_enabled() {
        CpuPoolManager::initialize_from_pool_config(&config.content).await;
        GpuPoolManager::initialize_from_pool_config(&config.content).await;
    }
}

impl ConfigImpl for ConfigPools {
    type Config = ConfigPoolsContent;

    fn current() -> &'static RwLock<Self> {
        &INSTANCE
    }

    fn new() -> Self {
        Self {
            content: ConfigPools::_load_or_create(),
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
        "config_pools".to_string()
    }

    fn _get_content(&self) -> &Self::Config {
        &self.content
    }

    fn _get_content_mut(&mut self) -> &mut Self::Config {
        &mut self.content
    }
}
