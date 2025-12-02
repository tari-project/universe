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

use tokio::{
    spawn,
    sync::{RwLock, RwLockWriteGuard},
};

use crate::{
    configs::{
        config_pools::ConfigPoolsContent,
        pools::{cpu_pools::CpuPool, BasePoolData},
    },
    events_emitter::EventsEmitter,
    mining::pools::{
        adapters::{
            kryptex_pool::KryptexPoolAdapter, lucky_pool::LuckyPoolAdapter,
            support_xmr_pool::SupportXmrPoolAdapter, PoolApiAdapters,
        },
        pools_manager::PoolManager,
        PoolManagerInterfaceTrait, PoolStatus,
    },
    systemtray_manager::{SystemTrayEvents, SystemTrayManager},
    tasks_tracker::TasksTrackers,
};

static INSTANCE: LazyLock<CpuPoolManager> = LazyLock::new(CpuPoolManager::new);

pub struct CpuPoolManager {
    pool_status_manager: RwLock<PoolManager>,
}

impl CpuPoolManager {
    pub fn new() -> Self {
        let cpu_pool = CpuPool::default();
        let cpu_pool_data = cpu_pool.default_content();

        let pool_adapter = Self::resolve_pool_adapter(cpu_pool_data);
        let pool_manager = PoolManager::new(
            pool_adapter,
            TasksTrackers::current().cpu_mining_phase.clone(),
            Self::construct_callback_for_pool_status_update(),
        );
        Self {
            pool_status_manager: RwLock::new(pool_manager),
        }
    }

    pub async fn initialize_from_pool_config(config_content: &ConfigPoolsContent) {
        let cpu_pool_content = config_content.current_cpu_pool().clone();
        let pool_adapter = Self::resolve_pool_adapter(cpu_pool_content);

        if *config_content.cpu_pool_enabled() {
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
}

impl PoolManagerInterfaceTrait<CpuPool> for CpuPoolManager {
    async fn get_write_manager() -> RwLockWriteGuard<'static, PoolManager> {
        INSTANCE.pool_status_manager.write().await
    }

    fn construct_callback_for_pool_status_update(
    ) -> impl Fn(HashMap<String, PoolStatus>, PoolStatus) + Send + Sync + 'static {
        move |pool_statuses: HashMap<String, PoolStatus>, current_status: PoolStatus| {
            spawn(async move {
                EventsEmitter::emit_cpu_pools_status_update(pool_statuses).await;
                SystemTrayManager::send_event(SystemTrayEvents::CpuPoolStats {
                    pending_rewards: current_status.unpaid,
                    share_count: current_status.accepted_shares,
                })
                .await;
            });
        }
    }

    fn resolve_pool_adapter(pool: BasePoolData<CpuPool>) -> PoolApiAdapters {
        match pool.pool_type {
            CpuPool::LuckyPoolRANDOMX => PoolApiAdapters::LuckyPool(LuckyPoolAdapter::new(
                pool.pool_type.key_string(),
                pool.stats_url,
            )),
            CpuPool::SupportXTMPoolRANDOMX => PoolApiAdapters::SupportXmr(
                SupportXmrPoolAdapter::new(pool.pool_type.key_string(), pool.stats_url),
            ),
            CpuPool::KryptexPoolRANDOMX => PoolApiAdapters::Kryptex(KryptexPoolAdapter::new(
                pool.pool_type.key_string(),
                pool.stats_url,
            )),
        }
    }
}
