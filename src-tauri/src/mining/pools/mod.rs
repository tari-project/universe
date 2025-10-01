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

use std::collections::HashMap;

use serde::Serialize;
use tari_common_types::tari_address::TariAddress;
use tokio::sync::RwLockWriteGuard;

use crate::{
    configs::pools::BasePoolData,
    mining::pools::{adapters::PoolApiAdapters, pools_manager::PoolManager},
};

mod adapters;
pub mod cpu_pool_manager;
pub mod gpu_pool_manager;
pub mod pools_manager;

#[derive(Clone, Debug, Serialize, Default)]
pub(crate) struct PoolStatus {
    pub accepted_shares: u64,
    pub unpaid: f64,
    pub balance: f64,
    pub min_payout: u64,
}

pub trait PoolManagerInterfaceTrait<T> {
    // =============== Getters ===============

    async fn get_write_manager() -> RwLockWriteGuard<'static, PoolManager>;

    // =============== To be implemented by the specific pool manager (CPU/GPU) ===============

    /// Callback to be called when pool status is updated
    /// This should emit an event to the frontend with the updated pool statuses
    /// This function is called in a separate task, so it should be non-blocking
    /// ### Arguments
    /// * `pool_statuses` - A map of pool names to their respective statuses
    fn construct_callback_for_pool_status_update(
    ) -> impl Fn(HashMap<String, PoolStatus>, PoolStatus) + Send + Sync + 'static;

    /// Resolve the appropriate pool adapter based on the selected pool configuration
    /// ### Arguments
    /// * `pool` - The selected pool configuration
    /// ### Returns
    /// The appropriate pool adapter for the selected pool
    fn resolve_pool_adapter(pool: BasePoolData<T>) -> PoolApiAdapters;

    // =============== Predefined methods ===============

    // Handle the case when user changes the selected pool in the settings
    // Should be triggered during config load and when user changes the selected pool
    /// Update pool and pool adapter based on the selected pool configuration
    /// This should be called whenever the selected pool configuration changes
    /// ### Arguments
    /// * `pool` - The new selected CPU pool configuration
    async fn handle_new_selected_pool(pool: BasePoolData<T>) {
        let new_pool_adapter = Self::resolve_pool_adapter(pool);

        Self::get_write_manager()
            .await
            .handle_pool_change(new_pool_adapter)
            .await;
    }

    /// Handle the case when user changes the wallet address used for mining
    /// This should be called whenever the wallet address changes either in seedless or normal wallet
    /// ### Arguments
    /// * `address` - The new Tari address to be used for mining
    async fn handle_wallet_address_change(address: &TariAddress) {
        Self::get_write_manager()
            .await
            .handle_new_mining_address(address)
            .await;
    }

    /// Handle the case when user starts or stops mining as listener for pool status behave differently based on it
    /// This should be called whenever mining is started or stopped
    /// ### Arguments
    /// * `is_mining` - A boolean indicating whether mining is active or not
    async fn handle_mining_status_change(is_mining: bool) {
        Self::get_write_manager()
            .await
            .toggle_mining_active(is_mining)
            .await;
    }

    /// Start a periodic task to fetch and update pool statuses
    /// This should be called when mining starts, it has handled to not start multiple tasks
    async fn start_stats_watcher() {
        Self::get_write_manager()
            .await
            .spawn_periodic_pool_status_update_task()
            .await;
    }

    /// Stop the periodic task fetching and updating pool statuses
    /// This should be called only when we disabled pool mining
    /// As other cases are handled internally
    async fn stop_stats_watcher() {
        Self::get_write_manager().await.stop_background_task();
    }

    /// Force an immediate update of the current pool statuses
    /// This can be called whenever an immediate update is needed, e.g., after changing the
    /// selected pool or wallet address while not mining
    #[allow(dead_code)]
    async fn update_current_pool_status() {
        Self::get_write_manager()
            .await
            .update_current_pool_status()
            .await;
    }
}
