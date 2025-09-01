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

use tari_common_types::tari_address::TariAddress;
use tokio::{spawn, sync::RwLock};

use crate::{
    configs::pools::cpu_pools::CpuPool,
    events_emitter::EventsEmitter,
    mining::pools::{adapters::PoolApiAdapters, pools_manager::PoolManager, PoolStatus},
    tasks_tracker::TasksTrackers,
};

#[allow(dead_code)]
static LOG_TARGET: &str = "tari::mining::pools::cpu_pool_manager";
static INSTANCE: LazyLock<CpuPoolManager> = LazyLock::new(CpuPoolManager::new);

pub struct CpuPoolManager {
    pool_status_manager: RwLock<PoolManager>,
}

impl CpuPoolManager {
    pub fn new() -> Self {
        let cpu_pool = CpuPool::default();

        let pool_adapter = Self::resolve_pool_adapter(&cpu_pool);
        let pool_manager = PoolManager::new(
            pool_adapter,
            TasksTrackers::current().cpu_mining_phase.clone(),
            Self::construct_callback_for_pool_status_update(),
        );
        Self {
            pool_status_manager: RwLock::new(pool_manager),
        }
    }

    fn construct_callback_for_pool_status_update(
    ) -> impl Fn(HashMap<String, PoolStatus>) + Send + Sync + 'static {
        move |pool_statuses: HashMap<String, PoolStatus>| {
            spawn(async move {
                EventsEmitter::emit_cpu_pools_status_update(pool_statuses).await;
            });
        }
    }

    fn resolve_pool_adapter(pool: &CpuPool) -> PoolApiAdapters {
        match pool {
            CpuPool::LuckyPool(_) => PoolApiAdapters::LuckyPool(
                crate::mining::pools::adapters::lucky_pool::LuckyPoolAdapter::new(
                    pool.name().to_string(),
                    pool.get_raw_stats_url(),
                ),
            ),
            CpuPool::SupportXTMPool(_) => PoolApiAdapters::SupportXmrPool(
                crate::mining::pools::adapters::support_xmr_pool::SupportXmrPoolAdapter::new(
                    pool.name().to_string(),
                    pool.get_raw_stats_url(),
                ),
            ),
        }
    }

    // Handle the case when user changes the selected pool in the settings
    // Should be triggered during config load and when user changes the selected pool
    /// Update pool and pool adapter based on the selected pool configuration
    /// This should be called whenever the selected pool configuration changes
    /// ### Arguments
    /// * `pool` - The new selected CPU pool configuration
    pub async fn handle_new_selected_pool(pool: CpuPool) {
        let new_pool_adapter = Self::resolve_pool_adapter(&pool);

        INSTANCE
            .pool_status_manager
            .write()
            .await
            .handle_pool_change(new_pool_adapter)
            .await;
    }

    pub async fn handle_wallet_address_change(address: &TariAddress) {
        INSTANCE
            .pool_status_manager
            .write()
            .await
            .handle_new_mining_address(address)
            .await;
    }

    pub async fn handle_mining_status_change(is_mining: bool) {
        INSTANCE
            .pool_status_manager
            .write()
            .await
            .toggle_mining_active(is_mining)
            .await;
    }
    pub async fn start_stats_watcher() {
        INSTANCE
            .pool_status_manager
            .write()
            .await
            .spawn_periodic_pool_status_update_task()
            .await;
    }
    pub async fn stop_stats_watcher() {
        INSTANCE
            .pool_status_manager
            .write()
            .await
            .stop_background_task();
    }

    pub async fn update_current_pool_status() {
        INSTANCE
            .pool_status_manager
            .write()
            .await
            .update_current_pool_status()
            .await;
    }
}
