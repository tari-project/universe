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

use std::{collections::HashMap, sync::LazyLock};

use log::info;
use tokio::{spawn, sync::RwLock};

use crate::{
    configs::{
        config_pools::{ConfigPools, ConfigPoolsContent},
        pools::{gpu_pools::GpuPool, PoolConfig},
        trait_config::ConfigImpl,
    },
    events_emitter::EventsEmitter,
    mining::{
        gpu::consts::GpuMinerType,
        pools::{
            adapters::PoolApiAdapters, pools_manager::PoolManager, PoolManagerInterfaceTrait,
            PoolStatus,
        },
    },
    setup::setup_manager::SetupManager,
    tasks_tracker::TasksTrackers,
};

static LOG_TARGET: &str = "tari::mining::pools::gpu_pool_manager";
static INSTANCE: LazyLock<GpuPoolManager> = LazyLock::new(GpuPoolManager::new);

pub struct GpuPoolManager {
    pool_status_manager: RwLock<PoolManager>,
}

impl GpuPoolManager {
    pub fn new() -> Self {
        let gpu_pool = GpuPool::default();

        let pool_adapter = Self::resolve_pool_adapter(&gpu_pool);
        let pool_manager = PoolManager::new(
            pool_adapter,
            TasksTrackers::current().gpu_mining_phase.clone(),
            Self::construct_callback_for_pool_status_update(),
        );
        Self {
            pool_status_manager: RwLock::new(pool_manager),
        }
    }
    pub async fn initialize_from_pool_config(config_content: &ConfigPoolsContent) {
        let current_selected_pool = config_content.selected_gpu_pool().clone();
        let pool_adapter = Self::resolve_pool_adapter(&current_selected_pool);

        if *config_content.gpu_pool_enabled() {
            INSTANCE
                .pool_status_manager
                .write()
                .await
                .handle_pool_change(pool_adapter)
                .await;
        } else {
            INSTANCE
                .pool_status_manager
                .write()
                .await
                .load_pool_adapter(pool_adapter)
                .await;
        }
    }

    /// Handle the case when user switches or fallbacks the GPU miner type (e.g., from Lolminer to Graxil)
    /// Behavior:
    /// 1. If the currently selected pool supports the new miner type, do nothing (keep using the same pool)
    /// 2. If the currently selected pool does not support the new miner type, switch to the default pool for that miner type
    ///   - Update pool config values and adapter in the pool manager
    ///   - Emit event to the frontend to update the selected pool in the settings UI
    /// 3. If the new miner type is Glytex (solo mining only), disable pool mining
    ///   - Emit event to the frontend to update the settings UI
    /// ### Arguments
    /// * `miner` - The new GPU miner type
    pub async fn handle_miner_switch(miner: GpuMinerType) {
        let current_selected_pool = ConfigPools::content().await.selected_gpu_pool().clone();

        if !miner.is_pool_mining_supported() {
            info!(target: LOG_TARGET, "New GPU miner type '{miner:?}' does not support pool mining, disabling GPU pool feature");
            let _unused = SetupManager::get_instance()
                .turn_off_gpu_pool_feature()
                .await;
            return;
        }

        if !*ConfigPools::content().await.gpu_pool_enabled() {
            let _unused =
                ConfigPools::update_field(ConfigPoolsContent::set_gpu_pool_enabled, true).await;
            EventsEmitter::emit_pools_config_loaded(&ConfigPools::content().await.clone()).await;
        }

        if current_selected_pool.is_miner_algorithms_supported(&miner) {
            info!(target: LOG_TARGET, "Current selected GPU pool '{}' supports the new miner type '{miner:?}', no pool switch needed", current_selected_pool.name());
        } else {
            info!(target: LOG_TARGET, "Current selected GPU pool '{}' does not support the new miner type '{miner:?}', switching to default pool for that miner", current_selected_pool.name());
            match GpuPool::default_for_miner_type(miner) {
                // LolMiner or Graxil
                Some(pool) => {
                    let _unused = ConfigPools::update_field(
                        ConfigPoolsContent::set_selected_gpu_pool,
                        pool.name().to_string(),
                    )
                    .await;

                    let _unused = ConfigPools::update_field(
                        ConfigPoolsContent::update_selected_gpu_config,
                        pool.clone(),
                    )
                    .await;
                    EventsEmitter::emit_pools_config_loaded(&ConfigPools::content().await.clone())
                        .await;

                    INSTANCE
                        .pool_status_manager
                        .write()
                        .await
                        .handle_pool_change(Self::resolve_pool_adapter(&pool))
                        .await;
                }
                // Glytex
                None => {
                    let _unused = SetupManager::get_instance()
                        .turn_off_gpu_pool_feature()
                        .await;
                }
            };
        }
    }
}

impl PoolManagerInterfaceTrait for GpuPoolManager {
    type PoolConfigType = GpuPool;

    async fn get_write_manager() -> tokio::sync::RwLockWriteGuard<'static, PoolManager> {
        INSTANCE.pool_status_manager.write().await
    }

    fn construct_callback_for_pool_status_update(
    ) -> impl Fn(HashMap<String, PoolStatus>) + Send + Sync + 'static {
        move |pool_statuses: HashMap<String, PoolStatus>| {
            spawn(async move {
                EventsEmitter::emit_gpu_pools_status_update(pool_statuses).await;
            });
        }
    }

    fn resolve_pool_adapter(pool: &GpuPool) -> PoolApiAdapters {
        match pool {
            GpuPool::LuckyPool(_) => PoolApiAdapters::LuckyPool(
                crate::mining::pools::adapters::lucky_pool::LuckyPoolAdapter::new(
                    pool.name().to_string(),
                    pool.get_raw_stats_url(),
                ),
            ),
            GpuPool::SupportXTMPool(_) => PoolApiAdapters::SupportXmrPool(
                crate::mining::pools::adapters::support_xmr_pool::SupportXmrPoolAdapter::new(
                    pool.name().to_string(),
                    pool.get_raw_stats_url(),
                ),
            ),
        }
    }
}
