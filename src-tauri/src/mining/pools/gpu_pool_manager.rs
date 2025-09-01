use std::{collections::HashMap, sync::LazyLock};

use tari_common_types::tari_address::TariAddress;
use tokio::{spawn, sync::RwLock};

use crate::{
    configs::pools::gpu_pools::GpuPool,
    events_emitter::EventsEmitter,
    mining::pools::{adapters::PoolApiAdapters, pools_manager::PoolManager, PoolStatus},
    tasks_tracker::TasksTrackers,
};

#[allow(dead_code)]
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

    // Handle the case when user changes the selected pool in the settings
    // Should be triggered during config load and when user changes the selected pool
    /// Update pool and pool adapter based on the selected pool configuration
    /// This should be called whenever the selected pool configuration changes
    /// ### Arguments
    /// * `pool` - The new selected GPU pool configuration
    pub async fn handle_new_selected_pool(pool: GpuPool) {
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
