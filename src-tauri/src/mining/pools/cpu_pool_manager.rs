use std::{collections::HashMap, sync::{Arc, LazyLock}};

use tokio::sync::RwLock;

use crate::{
    configs::pools::cpu_pools::CpuPool,
    mining::pools::{adapters::PoolApiAdapters, pools_manager::PoolManager, PoolStatus},
};

static LOG_TARGET: &str = "tari::mining::pools::cpu_pool_manager";
static INSTANCE: LazyLock<CpuPoolManager> = LazyLock::new(CpuPoolManager::new);

pub struct CpuPoolManager {
    pool_statuses: Arc<RwLock<HashMap<String, PoolStatus>>>>,
    pool_status_manager: RwLock<PoolManager>,
}

impl CpuPoolManager {
    pub fn new() -> Self {
        let cpu_pool = CpuPool::default();

        let pool_statuses: Arc<RwLock<HashMap<String, PoolStatus>>> = Arc::new(RwLock::new(HashMap::new()));
        let pool_adapter = Self::resolve_pool_adapter(&cpu_pool);
        let pool_manager = PoolManager::new(pool_adapter,pool_statuses.clone());
        Self {
            pool_statuses: pool_statuses.clone(),
            pool_status_manager: RwLock::new(pool_manager),
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
    pub async fn handle_new_selected_pool(&self, pool: CpuPool) {
        let new_pool_adapter = Self::resolve_pool_adapter(&pool);

        self.pool_status_manager
            .write()
            .await
            .handle_pool_change(new_pool_adapter);
    }
}
