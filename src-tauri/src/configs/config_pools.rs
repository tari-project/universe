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
use std::{collections::HashMap, sync::LazyLock, time::SystemTime};
use tauri::AppHandle;
use tokio::sync::RwLock;

use crate::{
    configs::pools::{cpu_pools::CpuPool, gpu_pools::GpuPool, BasePoolData},
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
    current_gpu_pool: GpuPool,
    #[getset(get = "pub", set = "pub")]
    gpu_pools: HashMap<GpuPool, BasePoolData<GpuPool>>,
    // ======= Cpu Pool =======
    #[getset(get = "pub", set = "pub")]
    cpu_pool_enabled: bool,
    #[getset(set = "pub")]
    current_cpu_pool: CpuPool,
    #[getset(get = "pub", set = "pub")]
    cpu_pools: HashMap<CpuPool, BasePoolData<CpuPool>>,
}

impl Default for ConfigPoolsContent {
    fn default() -> Self {
        Self {
            // ======= Config internals =======
            version_counter: POOLS_CONFIG_VERSION,
            created_at: SystemTime::now(),
            // ======= Gpu Pool =======
            gpu_pool_enabled: true,
            current_gpu_pool: GpuPool::default(),
            gpu_pools: GpuPool::load_default_pools_data(),
            // ======= Cpu Pool =======
            cpu_pool_enabled: true,
            current_cpu_pool: CpuPool::default(),
            cpu_pools: CpuPool::load_default_pools_data(),
        }
    }
}
impl ConfigContentImpl for ConfigPoolsContent {}
impl ConfigPoolsContent {
    pub fn current_gpu_pool(&self) -> BasePoolData<GpuPool> {
        self.gpu_pools
            .get(&self.current_gpu_pool)
            .cloned()
            .unwrap_or_else(|| GpuPool::default().default_content())
    }

    pub fn current_cpu_pool(&self) -> BasePoolData<CpuPool> {
        self.cpu_pools
            .get(&self.current_cpu_pool)
            .cloned()
            .unwrap_or_else(|| CpuPool::default().default_content())
    }

    pub fn update_current_cpu_config(
        &mut self,
        updated_config: BasePoolData<CpuPool>,
    ) -> &mut Self {
        if let Some(pool) = self.cpu_pools.get_mut(&self.current_cpu_pool) {
            *pool = updated_config.clone();
        }
        self
    }

    pub fn update_current_gpu_config(
        &mut self,
        updated_config: BasePoolData<GpuPool>,
    ) -> &mut Self {
        if let Some(pool) = self.gpu_pools.get_mut(&self.current_gpu_pool) {
            *pool = updated_config.clone();
        }
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

        // We want to initialize and fetch initial pool status only if pool mining is enabled
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
