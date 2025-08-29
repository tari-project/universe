use std::{
    collections::HashMap, sync::{atomic::{AtomicBool, Ordering}, Arc}, time::Instant
};

use anyhow::anyhow;
use log::{debug, info, warn};
use tari_common_types::tari_address::TariAddress;
use tokio::{
    sync::{mpsc, RwLock},
    time::{interval, Duration},
};

use crate::{
    configs::pools::PoolConfig,
    mining::pools::{
        adapters::{PoolApiAdapter, PoolApiAdapters},
        PoolStatus,
    },
    requests::clients::http_client::HttpClient,
    tasks_tracker::{TaskTrackerUtil},
};

static LOG_TARGET: &str = "tari::mining::pools::pools_manager";

#[derive(Debug, Clone)]
struct TaskState {
    pub pool_adapter: PoolApiAdapters,
    pub cached_mining_address: TariAddress,
    pub tracking_duration: Duration,
    pub pool_statuses: Arc<RwLock<HashMap<String, PoolStatus>>>,
    pub is_mining_active: bool,
}

impl TaskState {
    pub fn new(
        pool_adapter: PoolApiAdapters,
        cached_mining_address: TariAddress,
        pool_statuses: Arc<RwLock<HashMap<String, PoolStatus>>>,
        is_mining_active: bool,
    ) -> Self {
        Self {
            pool_adapter,
            cached_mining_address,
            tracking_duration: Duration::ZERO,
            pool_statuses,
            is_mining_active,
        }
    }
}


#[derive(Debug)]
pub enum PoolManagerThreadCommands {
    UpdateMiningAddress(TariAddress),
    UpdateMiningStatus(bool),
    UpdatePoolAdapter(PoolApiAdapters),
    Stop,
    Shutdown,
}


/// GpuPoolManager provides centralized management of GPU mining pool status monitoring.
///
/// Key features:
/// - Periodic pool status updates with adaptive polling intervals
/// - 60-second intervals when mining is active
/// - 300-second intervals when mining is inactive  
/// - 1-hour grace period after mining stops before task shuts down
/// - Automatic restart when pool or mining address configuration changes
/// - Integration with TasksTrackers for proper shutdown handling

pub struct PoolManager{
    pool_adapter: PoolApiAdapters,
    cached_mining_address: Option<TariAddress>,
    pool_statuses: Arc<RwLock<HashMap<String, PoolStatus>>>,
    // Task tracking for periodic status updates
    is_task_running: bool,
    is_mining_active: bool,
    task_tracker: TaskTrackerUtil,
    // Communication channels
    task_sender: Option<mpsc::UnboundedSender<PoolManagerThreadCommands>>,
}

impl PoolManager {
    pub fn new(pool_adapter: PoolApiAdapters, pool_statuses: Arc<RwLock<HashMap<String, PoolStatus>>>, task_tracker: TaskTrackerUtil) -> Self {
        Self {
            pool_adapter,
            cached_mining_address: None,
            pool_statuses,
            is_task_running: false,
            is_mining_active: true,
            task_sender: None,
            task_tracker,
        }
    }

    pub async fn fetch_and_update_pool_status(&mut self) -> Result<PoolStatus, anyhow::Error> {
        if let Some (address) = &self.cached_mining_address {
            let pool_status = self.pool_adapter.request_pool_status(address.clone()).await?;
            Ok(pool_status)
        } else {
            return Err(anyhow!("No mining address set"));
        }
    }

    pub fn handle_pool_change(&mut self, adapter: PoolApiAdapters) {
        info!(target: LOG_TARGET, "Updated pool configuration to: {:?}", adapter);
        self.pool_adapter = adapter.clone();
        // Send to task if running
        if let Some(sender) = &self.task_sender {
            if let Err(e) = sender.send(PoolManagerThreadCommands::UpdatePoolAdapter(adapter)) {
                warn!(target: LOG_TARGET, "Failed to send pool update to task: {}", e);
            }
        }
    }

    // Handle the case when user changes the mining address in the settings
    // Should be triggered in InternalWallet side effects handler to keep up to date with the latest mining address
    pub fn handle_new_mining_address(&mut self, mining_address: &TariAddress) {
        info!(target: LOG_TARGET, "Updated mining address to: {}", mining_address);
        self.cached_mining_address = Some(mining_address.clone());

        // Send to task if running
        if let Some(sender) = &self.task_sender {
            if let Err(e) = sender.send(PoolManagerThreadCommands::UpdateMiningAddress(mining_address.clone())) {
                warn!(target: LOG_TARGET, "Failed to send mining address update to task: {}", e);
            }
        }
    }

    pub async fn toggle_mining_active(&mut self, is_active: bool) {
        // Update local state
        info!(target: LOG_TARGET, "Mining active status changed to: {}", is_active);
        self.is_mining_active = is_active;
        // Send to task if running
        if let Some(sender) = &self.task_sender {
            if let Err(e) = sender.send(PoolManagerThreadCommands::UpdateMiningStatus(is_active)) {
                warn!(target: LOG_TARGET, "Failed to send mining status update to task: {}", e);
            }
        }
    }

    /// Send a stop command to the background task
    pub fn stop_background_task(&mut self) {
        if let Some(sender) = &self.task_sender {
            if let Err(e) = sender.send(PoolManagerThreadCommands::Stop) {
                warn!(target: LOG_TARGET, "Failed to send stop command to task: {}", e);
            }
        }
        self.task_sender = None;
        self.is_task_running = false;
    }

    pub async fn spawn_periodic_pool_status_update_task(&mut self) {
        // Check if task is already running
        if self.is_task_running {
            debug!(target: LOG_TARGET, "Periodic pool status update task is already running");
            return;
        }
        self.is_task_running = true;

        info!(target: LOG_TARGET, "Starting periodic pool status update task");

        if let Some(tari_address) = &self.cached_mining_address {
        // Create channels for communication
        let (task_sender, mut task_receiver) = mpsc::unbounded_channel::<PoolManagerThreadCommands>();

        // Store senders/receivers in the struct
        self.task_sender = Some(task_sender);

        // Create the task state with current values
        let mut task_state = TaskState::new(
            self.pool_adapter.clone(),
            tari_address.clone(),
            self.pool_statuses.clone(),
            self.is_mining_active,
        );
        
        let mut shutdown_signal = self.task_tracker.get_signal().await;
        let task_tracker = self.task_tracker.get_task_tracker().await;

        task_tracker.spawn(async move {
            let mut mining_interval = interval(Duration::from_secs(60)); // Active mining: 60 seconds
            let mut non_mining_interval = interval(Duration::from_secs(300)); // Not mining: 300 seconds
            let mut stop_task_at = None::<Instant>;

            loop {
                tokio::select! {
                    _ = shutdown_signal.wait() => {
                        info!(target: LOG_TARGET, "Periodic pool status update task received shutdown signal");
                        break;
                    }
                    
                    // Handle incoming commands
                    Some(command) = task_receiver.recv() => {
                        debug!(target: LOG_TARGET, "Task received command: {:?}", command);
                        match command {
                            PoolManagerThreadCommands::UpdateMiningAddress(addr) => {
                                task_state.cached_mining_address = addr;
                                info!(target: LOG_TARGET, "Task: Updated mining address");
                            }
                            PoolManagerThreadCommands::UpdateMiningStatus(status) => {
                                info!(target: LOG_TARGET, "Task: Mining status updated to: {:?}", status);
                                task_state.is_mining_active = status;
                                if status {
                                    stop_task_at = None; // Reset grace period since we're mining again
                                }else {
                                    // If not mining, set the stop time if not already set
                                    if stop_task_at.is_none() {
                                        stop_task_at = Some(Instant::now() + Duration::from_secs(3600)); // 1 hour
                                    }
                                }
                            }
                            PoolManagerThreadCommands::UpdatePoolAdapter(adapter) => {
                                task_state.pool_adapter = adapter;
                                info!(target: LOG_TARGET, "Task: Updated pool configuration");
                            }
                            PoolManagerThreadCommands::Stop | PoolManagerThreadCommands::Shutdown => {
                                info!(target: LOG_TARGET, "Task: Received stop command");
                                break;
                            }
                        }
                    }

                    _ = mining_interval.tick() => {
                        if task_state.is_mining_active {
                            // Active mining: 60 seconds
                            Self::periodic_update_logic_static(&mut task_state).await;
                        }
                    }
                    non_mining_interval_duaration = non_mining_interval.tick() => {
                        if !task_state.is_mining_active {
                            // Not mining: 300 seconds
                            task_state.tracking_duration += Duration::from_secs(non_mining_interval_duaration.as_secs());
                            Self::periodic_update_logic_static(&mut task_state).await;
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

            info!(target: LOG_TARGET, "Periodic pool status update task finished");
        });
        } 

    }

    // Static version of periodic_update_logic for use in background task
    async fn periodic_update_logic_static(
        task_state: &mut TaskState,
    ) -> Result<(), anyhow::Error> {

        if task_state.is_mining_active {
            task_state.tracking_duration = Duration::ZERO; // Reset tracking duration when mining is active
        } else {
            task_state.tracking_duration += Duration::from_secs(
        }


        // Fetch pool status if we have a mining address
        if let Some(mining_address) = &task_state.cached_mining_address {
            let url = task_state.pool.get_stats_url(&mining_address.to_string());
            match HttpClient::with_retries(3).send_get_request(&url).await {
                Ok(response) => {
                    match response.text().await {
                        Ok(response_text) => {
                            match task_state.pool_adapter.convert_api_data(response_text.as_str()) {
                                Ok(pool_status) => {
                                    task_state.last_pool_statuses.insert(task_state.pool.name(), pool_status.clone());
                                    debug!(target: LOG_TARGET, "Task: Successfully updated pool status: {:?}", pool_status);
                                }
                                Err(e) => {
                                    warn!(target: LOG_TARGET, "Task: Failed to convert pool data: {}", e);
                                }
                            }
                        }
                        Err(e) => {
                            warn!(target: LOG_TARGET, "Task: Failed to read response text: {}", e);
                        }
                    }
                }
                Err(e) => {
                    warn!(target: LOG_TARGET, "Task: Failed to send pool status request: {}", e);
                }
            }
        } else {
            debug!(target: LOG_TARGET, "Task: No mining address set, skipping pool status update");
        }

        // Return false to continue the task
        false
    }
}
