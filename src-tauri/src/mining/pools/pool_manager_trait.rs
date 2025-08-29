use std::{
    collections::HashMap,
    time::{Duration, Instant},
};

use anyhow::anyhow;
use log::{debug, info, warn};
use tari_common_types::tari_address::TariAddress;

use crate::{
    configs::pools::PoolConfig,
    mining::pools::{
        adapters::{PoolApiAdapter, PoolApiAdapters},
        PoolStatus,
    },
    requests::clients::http_client::HttpClient,
    tasks_tracker::{TaskTrackerUtil, TasksTrackers},
};

static LOG_TARGET: &str = "tari::mining::pools::pool_manager";

/// PoolManagerTrait provides centralized management of mining pool status monitoring.
///
/// Key features:
/// - Periodic pool status updates with adaptive polling intervals
/// - 60-second intervals when mining is active
/// - 300-second intervals when mining is inactive  
/// - 1-hour grace period after mining stops before task shuts down
/// - Automatic restart when pool or mining address configuration changes
/// - Integration with TasksTrackers for proper shutdown handling
///
/// # Type Parameters
/// * `T` - Pool configuration type that implements PoolConfig trait
pub trait PoolManagerTrait<T: PoolConfig>: Send + Sync + 'static {
    // ========= [ Getters ] =========

    /// Get the singleton instance of the pool manager
    fn get_instance() -> &'static Self
    where
        Self: Sized;

    /// Get the cached mining address
    async fn get_cached_mining_address(&self) -> Option<TariAddress>;

    /// Get the currently selected pool configuration
    async fn get_selected_pool(&self) -> T;

    /// Get the pool API adapter for the current pool
    async fn get_pool_adapter(&self) -> PoolApiAdapters;

    /// Get the last cached pool status for a specific pool
    async fn get_last_pool_status(&self, pool_name: String) -> Option<PoolStatus>;

    /// Check if the periodic task is currently running
    async fn is_task_running(&self) -> bool;

    /// Check if mining is currently active
    async fn is_mining_active(&self) -> bool;

    /// Check if mining was active in the previous check
    async fn was_mining_previously(&self) -> bool;

    /// Get the timestamp of the last mining status check
    async fn last_mining_check(&self) -> Option<Instant>;

    /// Get the global task tracker utility
    fn get_global_task_tracker() -> TaskTrackerUtil
    where
        Self: Sized;

    /// Get all cached pool statuses
    async fn get_all_last_pool_statuses(&self) -> HashMap<String, PoolStatus>;

    // ========= [ Setters ] =========

    /// Set the cached mining address
    async fn set_cached_mining_address(
        &self,
        address: Option<TariAddress>,
    ) -> Result<(), anyhow::Error>;

    /// Set the selected pool configuration
    async fn set_selected_pool(&self, pool: T) -> Result<(), anyhow::Error>;

    /// Set the last pool status for a specific pool
    async fn set_last_pool_status(&self, pool_name: String, status: PoolStatus);

    /// Set whether the periodic task is running
    async fn set_task_running(&self, is_running: bool);

    /// Update mining status tracking
    async fn update_mining_status(&self, is_active: bool, was_active: bool, timestamp: Instant);

    // ========= [ Actions ] =========

    /// Send a request to the mining pool to get the current status for the configured mining address
    /// Uses retries policy for the HTTP client
    async fn send_pool_status_request(&self) -> Result<PoolStatus, anyhow::Error> {
        let url = match self.get_cached_mining_address().await {
            Some(address) => self
                .get_selected_pool()
                .await
                .get_stats_url(&address.to_string()),
            None => return Err(anyhow!("Mining address not set")),
        };
        let pool_status_response = HttpClient::with_retries(3).send_get_request(&url).await?;
        let response_text = pool_status_response.text().await?;
        let pool_status = self
            .get_pool_adapter()
            .await
            .convert_api_data(response_text.as_str())?;
        Ok(pool_status)
    }

    /// Handle the case when user changes the mining address in the settings
    /// Should be triggered in InternalWallet side effects handler to keep up to date with the latest mining address
    async fn handle_new_mining_address(&self, mining_address: &TariAddress)
    where
        Self: Sized,
    {
        self.set_cached_mining_address(Some(mining_address.clone()))
            .await
            .expect("Failed to set cached mining address");
        info!(target: LOG_TARGET, "Updated mining address to: {}", mining_address);

        // Restart the task to apply the new address immediately
        Self::restart_periodic_task().await;
    }

    /// Handle the case when user changes the selected pool in the settings
    /// Should be triggered during config load and when user changes the selected pool
    /// Update pool and pool adapter based on the selected pool configuration
    /// This should be called whenever the selected pool configuration changes
    /// ### Arguments
    /// * `pool` - The new selected pool configuration
    async fn handle_new_selected_pool(pool: T)
    where
        Self: Sized;

    /// Fetch the latest pool status and update the cached status
    async fn fetch_and_update_pool_status(&self) -> Result<PoolStatus, anyhow::Error> {
        // Fetch the latest pool status
        let pool_status = self.send_pool_status_request().await?;

        // Update the cached status
        {
            let pool = self.get_selected_pool().await;
            let pool_name = pool.name();
            self.set_last_pool_status(pool_name.clone(), pool_status.clone())
                .await;
        }

        Ok(pool_status)
    }

    /// Spawn the periodic pool status update task
    /// This method should be implemented by concrete types to handle the spawning
    /// The implementation should:
    /// 1. Check if task is already running
    /// 2. Mark task as running
    /// 3. Spawn a background task with adaptive polling intervals
    /// 4. Use periodic_update_logic_internal for the actual logic
    async fn spawn_periodic_pool_status_update_task(&self);

    /// Internal periodic update logic - concrete types should implement this
    /// This method contains the core polling logic and should be called by the spawned task
    ///
    /// # Arguments
    /// * `use_mining_interval` - Mutable reference to track which polling interval to use
    /// * `stop_task_at` - Mutable reference to track when to stop the task (grace period)
    ///
    /// # Returns
    /// * `bool` - true if the task should stop, false to continue
    async fn periodic_update_logic_internal(
        &self,
        use_mining_interval: &mut bool,
        stop_task_at: &mut Option<Instant>,
    ) -> bool {
        // Check current mining status
        let is_currently_mining = self.is_mining_active().await;
        let was_mining = self.was_mining_previously().await;
        let now = Instant::now();

        // Update mining status tracking
        if is_currently_mining {
            *use_mining_interval = true;
            *stop_task_at = None; // Reset grace period since we're mining again
            if !was_mining {
                info!(target: LOG_TARGET, "Mining started - switching to active polling (60s)");
            }
            self.update_mining_status(true, was_mining, now).await;
        } else {
            *use_mining_interval = false;
            if was_mining {
                // Mining just stopped, set 1 hour grace period
                *stop_task_at = Some(now + Duration::from_secs(3600)); // 1 hour
                info!(target: LOG_TARGET, "Mining stopped - switching to slow polling (300s) with 1h grace period");
            }
            self.update_mining_status(false, was_mining, now).await;
        }

        // Fetch pool status if we have a mining address
        if self.get_cached_mining_address().await.is_some() {
            match self.fetch_and_update_pool_status().await {
                Ok(status) => {
                    debug!(target: LOG_TARGET, "Successfully updated pool status: {:?}", status);
                }
                Err(e) => {
                    warn!(target: LOG_TARGET, "Failed to fetch pool status: {}", e);
                }
            }
        } else {
            debug!(target: LOG_TARGET, "No mining address set, skipping pool status update");
        }

        // Return false to continue the task
        false
    }

    /// Toggle mining active status
    async fn toggle_mining_active(is_active: bool)
    where
        Self: Sized,
    {
        let instance = Self::get_instance();
        let was_mining = instance.was_mining_previously().await;
        instance
            .update_mining_status(is_active, was_mining, Instant::now())
            .await;
    }

    /// Stop the periodic pool status update task
    async fn stop_periodic_task()
    where
        Self: Sized,
    {
        info!(target: LOG_TARGET, "Stopping periodic pool status update task");
        TasksTrackers::current().gpu_mining_phase.close().await;
        TasksTrackers::current().gpu_mining_phase.replace().await;

        // Mark task as not running
        let instance = Self::get_instance();
        instance.set_task_running(false).await;

        info!(target: LOG_TARGET, "Periodic pool status update task stopped");
    }

    /// Restart the periodic pool status update task
    /// This is useful when configuration changes (pool or mining address)
    async fn restart_periodic_task()
    where
        Self: Sized,
    {
        info!(target: LOG_TARGET, "Restarting periodic pool status update task due to configuration change");
        Self::stop_periodic_task().await;
        let instance = Self::get_instance();
        instance.spawn_periodic_pool_status_update_task().await;
    }
}
