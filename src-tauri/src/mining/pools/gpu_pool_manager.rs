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
        pools::{gpu_pools::GpuPool, BasePoolData},
        trait_config::ConfigImpl,
    },
    events_emitter::EventsEmitter,
    mining::{
        gpu::consts::GpuMinerType,
        pools::{
            adapters::{
                kryptex_pool::KryptexPoolAdapter, lucky_pool::LuckyPoolAdapter,
                support_xmr_pool::SupportXmrPoolAdapter, PoolApiAdapters,
            },
            pools_manager::PoolManager,
            PoolManagerInterfaceTrait, PoolStatus,
        },
    },
    setup::setup_manager::SetupManager,
    systemtray_manager::{SystemTrayEvents, SystemTrayManager},
    tasks_tracker::TasksTrackers,
};

static LOG_TARGET: &str = "tari::universe::mining::pools::gpu_pool_manager";
static INSTANCE: LazyLock<GpuPoolManager> = LazyLock::new(GpuPoolManager::new);

pub struct GpuPoolManager {
    pool_status_manager: RwLock<PoolManager>,
}

impl GpuPoolManager {
    pub fn new() -> Self {
        let gpu_pool = GpuPool::default();
        let gpu_pool_content = gpu_pool.default_content();

        let pool_adapter = Self::resolve_pool_adapter(gpu_pool_content);
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
        let gpu_pool_content = config_content.current_gpu_pool().clone();
        let pool_adapter = Self::resolve_pool_adapter(gpu_pool_content);

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
        let current_pool_content = ConfigPools::content().await.current_gpu_pool().clone();

        if !miner.is_pool_mining_supported() {
            info!(target: LOG_TARGET, "New GPU miner type '{miner:?}' does not support pool mining, disabling GPU pool feature");
            let _unused = SetupManager::get_instance()
                .turn_off_gpu_pool_feature()
                .await;
            return;
        }

        if !*ConfigPools::content().await.gpu_pool_enabled() {
            SetupManager::get_instance()
                .turn_on_gpu_pool_feature()
                .await;
        }

        if miner.is_pool_supported(&current_pool_content.pool_type) {
            info!(target: LOG_TARGET, "Current selected GPU pool '{}' supports the new miner type '{miner:?}', no pool switch needed", current_pool_content.pool_name);
        } else {
            info!(target: LOG_TARGET, "Current selected GPU pool '{}' does not support the new miner type '{miner:?}', switching to default pool for that miner", current_pool_content.pool_name);
            if let Some(default_miner_pool) = miner.default_pool() {
                // LolMiner or Graxil
                let _unused = ConfigPools::update_field(
                    ConfigPoolsContent::set_current_gpu_pool,
                    default_miner_pool,
                )
                .await;
                EventsEmitter::emit_pools_config_loaded(&ConfigPools::content().await.clone())
                    .await;

                let default_pool_content = ConfigPools::content().await.current_gpu_pool().clone();

                INSTANCE
                    .pool_status_manager
                    .write()
                    .await
                    .handle_pool_change(Self::resolve_pool_adapter(default_pool_content))
                    .await;
            };
        }
    }
}

impl PoolManagerInterfaceTrait<GpuPool> for GpuPoolManager {
    async fn get_write_manager() -> tokio::sync::RwLockWriteGuard<'static, PoolManager> {
        INSTANCE.pool_status_manager.write().await
    }

    fn construct_callback_for_pool_status_update(
    ) -> impl Fn(HashMap<String, PoolStatus>, PoolStatus) + Send + Sync + 'static {
        move |pool_statuses: HashMap<String, PoolStatus>, current_status: PoolStatus| {
            spawn(async move {
                EventsEmitter::emit_gpu_pools_status_update(pool_statuses).await;

                SystemTrayManager::send_event(SystemTrayEvents::GpuPoolPendingRewards(
                    current_status.unpaid,
                ))
                .await;
            });
        }
    }

    fn resolve_pool_adapter(pool: BasePoolData<GpuPool>) -> PoolApiAdapters {
        match pool.pool_type {
            GpuPool::LuckyPoolC29 => PoolApiAdapters::LuckyPool(LuckyPoolAdapter::new(
                pool.pool_type.key_string(),
                pool.stats_url,
            )),
            GpuPool::KryptexPoolC29 => PoolApiAdapters::Kryptex(KryptexPoolAdapter::new(
                pool.pool_type.key_string(),
                pool.stats_url,
            )),
            GpuPool::KryptexPoolSHA3X => PoolApiAdapters::Kryptex(KryptexPoolAdapter::new(
                pool.pool_type.key_string(),
                pool.stats_url,
            )),
            GpuPool::LuckyPoolSHA3X => PoolApiAdapters::LuckyPool(LuckyPoolAdapter::new(
                pool.pool_type.key_string(),
                pool.stats_url,
            )),
            GpuPool::SupportXTMPoolSHA3X => PoolApiAdapters::SupportXmr(
                SupportXmrPoolAdapter::new(pool.pool_type.key_string(), pool.stats_url),
            ),
        }
    }
}
