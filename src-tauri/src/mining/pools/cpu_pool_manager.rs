use std::sync::LazyLock;

use tokio::sync::RwLock;

use crate::{
    configs::pools::cpu_pools::CpuPool,
    mining::pools::{adapters::PoolApiAdapters, pools_manager::PoolManager},
    tasks_tracker::TasksTrackers,
};

static LOG_TARGET: &str = "tari::mining::pools::cpu_pool_manager";
static INSTANCE: LazyLock<CpuPoolManager> = LazyLock::new(CpuPoolManager::new);

pub struct CpuPoolManager {
    pool_status_manager: RwLock<PoolManager<CpuPool>>,
}

impl CpuPoolManager {
    pub fn new() -> Self {
        Self {
            pool_status_manager: RwLock::new(PoolManager::new()),
        }
    }

    // Handle the case when user changes the selected pool in the settings
    // Should be triggered during config load and when user changes the selected pool
    /// Update pool and pool adapter based on the selected pool configuration
    /// This should be called whenever the selected pool configuration changes
    /// ### Arguments
    /// * `pool` - The new selected CPU pool configuration
    pub async fn handle_new_selected_pool(&self, pool: CpuPool) {
        let new_pool_adapter = match pool {
            CpuPool::LuckyPool(_) => PoolApiAdapters::LuckyPool(
                crate::mining::pools::adapters::lucky_pool::LuckyPoolAdapter {},
            ),
            CpuPool::SupportXTMPool(_) => PoolApiAdapters::SupportXmrPool(
                crate::mining::pools::adapters::support_xmr_pool::SupportXmrPoolAdapter {},
            ),
        };

        // Update pool configuration
        {
            self.pool_status_manager
                .write()
                .await
                .handle_pool_change(pool, new_pool_adapter);
        }
    }
}
