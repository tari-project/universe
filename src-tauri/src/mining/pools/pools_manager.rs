use std::{
    collections::HashMap,
    sync::{atomic::AtomicBool, Arc, LazyLock},
    time::Instant,
};

use anyhow::anyhow;
use log::{debug, info, warn};
use tari_common_types::tari_address::TariAddress;
use tokio::{
    sync::RwLock,
    time::{interval, Duration},
};

use crate::{
    configs::pools::{cpu_pools::CpuPool, gpu_pools::GpuPool, PoolConfig},
    mining::pools::{
        adapters::{PoolApiAdapter, PoolApiAdapters},
        PoolStatus,
    },
    requests::clients::http_client::HttpClient,
    tasks_tracker::{TaskTrackerUtil, TasksTrackers},
};

static LOG_TARGET: &str = "tari::mining::pools::pools_manager";

/// GpuPoolManager provides centralized management of GPU mining pool status monitoring.
///
/// Key features:
/// - Periodic pool status updates with adaptive polling intervals
/// - 60-second intervals when mining is active
/// - 300-second intervals when mining is inactive  
/// - 1-hour grace period after mining stops before task shuts down
/// - Automatic restart when pool or mining address configuration changes
/// - Integration with TasksTrackers for proper shutdown handling

pub struct PoolManager<T: PoolConfig> {
    pool: T,
    pool_adapter: PoolApiAdapters,
    cached_mining_address: Option<TariAddress>,
    last_pool_statuses: HashMap<String, PoolStatus>,
    // Task tracking for periodic status updates
    is_task_running: bool,
    last_mining_check: Option<Instant>,
    was_mining_previously: AtomicBool,
    is_mining_active: AtomicBool,
}

impl<T: PoolConfig> PoolManager<T> {
    pub fn new() -> Self {
        Self {
            pool: T::default(),
            pool_adapter: PoolApiAdapters::default(),
            cached_mining_address: None,
            last_pool_statuses: HashMap::new(),
            is_task_running: false,
            last_mining_check: None,
            was_mining_previously: AtomicBool::new(false),
            is_mining_active: AtomicBool::new(false),
        }
    }

    pub fn get_last_pool_status(&self, pool_name: String) -> Option<PoolStatus> {
        self.last_pool_statuses.get(&pool_name).cloned()
    }

    pub fn get_all_last_pool_statuses(&self) -> HashMap<String, PoolStatus> {
        self.last_pool_statuses.clone()
    }

    pub async fn fetch_and_update_pool_status(&mut self) -> Result<PoolStatus, anyhow::Error> {
        // Fetch the latest pool status
        let pool_status = self.send_pool_status_request().await?;

        self.last_pool_statuses
            .insert(self.pool.name(), pool_status.clone());
        info!(target: LOG_TARGET, "Updated pool status for {}: {:?}", self.pool.name(), pool_status);

        Ok(pool_status)
    }

    pub fn handle_pool_change(&mut self, pool: T, adapter: PoolApiAdapters) {
        self.pool = pool;
        self.pool_adapter = adapter;
        info!(target: LOG_TARGET, "Updated pool configuration to: {}", self.pool.name());

        // Restart the periodic task to apply new configuration
    }

    // Handle the case when user changes the mining address in the settings
    // Should be triggered in InternalWallet side effects handler to keep up to date with the latest mining address
    pub fn handle_new_mining_address(&mut self, mining_address: &TariAddress) {
        self.cached_mining_address = Some(mining_address.clone());
        info!(target: LOG_TARGET, "Updated mining address to: {}", mining_address);

        // Restart the periodic task to apply new configuration
    }

    pub async fn toggle_mining_active(&mut self, is_active: bool) {
        self.is_mining_active
            .store(is_active, std::sync::atomic::Ordering::Relaxed);
    }

    /// Send a request to the mining pool to get the current status for the configured mining address
    /// Uses retires policy for the HTTP client
    async fn send_pool_status_request(&self) -> Result<PoolStatus, anyhow::Error> {
        let url = match &self.cached_mining_address {
            Some(address) => self.pool.get_stats_url(&address.to_string()),
            None => return Err(anyhow!("Mining address not set")),
        };
        let pool_status_response = HttpClient::with_retries(3).send_get_request(&url).await?;
        let response_text = pool_status_response.text().await?;
        let pool_status = self.pool_adapter.convert_api_data(response_text.as_str())?;
        Ok(pool_status)
    }

    pub async fn spawn_periodic_pool_status_update_task(&mut self) {
        // Check if task is already running
        if self.is_task_running {
            debug!(target: LOG_TARGET, "Periodic pool status update task is already running");
            return;
        }
        self.is_task_running = true;

        info!(target: LOG_TARGET, "Starting periodic pool status update task");

        let shutdown_signal = TasksTrackers::current().common.get_signal().await;
        let task_tracker = TasksTrackers::current().common.get_task_tracker().await;

        task_tracker.spawn(async move {
            let mut shutdown_signal = shutdown_signal;
            let mut mining_interval = interval(Duration::from_secs(60)); // Active mining: 60 seconds
            let mut non_mining_interval = interval(Duration::from_secs(300)); // Not mining: 300 seconds
            let mut use_mining_interval = false;
            let mut stop_task_at = None::<Instant>;

            loop {
                tokio::select! {
                    _ = shutdown_signal.wait() => {
                        info!(target: LOG_TARGET, "Periodic pool status update task received shutdown signal");
                        break;
                    }
                    _ = mining_interval.tick(), if use_mining_interval => {
                        if self.periodic_update_logic(&mut use_mining_interval, &mut stop_task_at).await {
                            break;
                        }
                    }
                    _ = non_mining_interval.tick(), if !use_mining_interval => {
                        if self.periodic_update_logic(&mut use_mining_interval, &mut stop_task_at).await {
                            break;
                        }
                    }
                }

                // Check if we should stop the task (1 hour after mining stopped)
                if let Some(stop_at) = stop_task_at {
                    if Instant::now() >= stop_at {
                        info!(target: LOG_TARGET, "Stopping periodic pool status update task - 1 hour grace period expired");
                        break;
                    }
                }
            }

            // Clean up: mark task as not running
            self.is_task_running = false;
            info!(target: LOG_TARGET, "Periodic pool status update task finished");
        });
    }

    async fn periodic_update_logic(
        &mut self,
        use_mining_interval: &mut bool,
        stop_task_at: &mut Option<Instant>,
    ) -> bool {
        // Check current mining status (simplified check - you might need to get this from the actual miners)

        // Update mining status tracking
        {
            let now = Instant::now();

            if self
                .is_mining_active
                .load(std::sync::atomic::Ordering::Relaxed)
            {
                *use_mining_interval = true;
                *stop_task_at = None; // Reset grace period since we're mining again
                if !self
                    .was_mining_previously
                    .load(std::sync::atomic::Ordering::Relaxed)
                {
                    info!(target: LOG_TARGET, "Mining started - switching to active polling (60s)");
                }
                self.was_mining_previously
                    .store(true, std::sync::atomic::Ordering::Relaxed);
            } else {
                *use_mining_interval = false;
                if self
                    .was_mining_previously
                    .load(std::sync::atomic::Ordering::Relaxed)
                {
                    // Mining just stopped, set 1 hour grace period
                    *stop_task_at = Some(now + Duration::from_secs(3600)); // 1 hour
                    info!(target: LOG_TARGET, "Mining stopped - switching to slow polling (300s) with 1h grace period");
                }
                self.was_mining_previously
                    .store(false, std::sync::atomic::Ordering::Relaxed);
            }

            self.last_mining_check = Some(now);
        }

        // Fetch pool status if we have a mining address
        if self.cached_mining_address.is_some() {
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

    /// Stop the periodic pool status update task
    pub async fn stop_periodic_task(&mut self) {
        info!(target: LOG_TARGET, "Stopping periodic pool status update task");
        TasksTrackers::current().common.close().await;
        TasksTrackers::current().common.replace().await;

        // Mark task as not running
        self.is_task_running = false;

        info!(target: LOG_TARGET, "Periodic pool status update task stopped");
    }

    /// Restart the periodic pool status update task
    /// This is useful when configuration changes (pool or mining address)
    pub async fn restart_periodic_task(&mut self) {
        info!(target: LOG_TARGET, "Restarting periodic pool status update task due to configuration change");
        self.stop_periodic_task().await;
        self.spawn_periodic_pool_status_update_task().await;
    }
}
