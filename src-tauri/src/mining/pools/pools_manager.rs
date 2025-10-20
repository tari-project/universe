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

use std::{collections::HashMap, sync::Arc, time::Instant};

use log::{debug, info, warn};
use tari_common_types::tari_address::TariAddress;
use tokio::{
    sync::{mpsc, RwLock},
    time::{interval, Duration},
};

use crate::{
    mining::pools::{
        adapters::{PoolApiAdapter, PoolApiAdapters},
        PoolStatus,
    },
    tasks_tracker::TaskTrackerUtil,
};

static LOG_TARGET: &str = "tari::universe::mining::pools::pools_manager";

#[derive(Clone)]
struct TaskState {
    pub pool_adapter: PoolApiAdapters,
    pub cached_mining_address: String,
    pub tracking_duration: Duration,
    pub pool_statuses: Arc<RwLock<HashMap<String, PoolStatus>>>,
    pub is_mining_active: bool,
    pub pool_stats_event_callback:
        Arc<dyn Fn(HashMap<String, PoolStatus>, PoolStatus) + Send + Sync + 'static>,
}

impl TaskState {
    pub fn new(
        pool_adapter: PoolApiAdapters,
        cached_mining_address: String,
        pool_statuses: Arc<RwLock<HashMap<String, PoolStatus>>>,
        is_mining_active: bool,
        pool_stats_event_callback: Arc<
            dyn Fn(HashMap<String, PoolStatus>, PoolStatus) + Send + Sync + 'static,
        >,
    ) -> Self {
        Self {
            pool_adapter,
            cached_mining_address,
            tracking_duration: Duration::ZERO,
            pool_statuses,
            is_mining_active,
            pool_stats_event_callback,
        }
    }
}

#[derive(Debug)]
pub enum PoolManagerThreadCommands {
    UpdateMiningAddress(String),
    UpdateMiningStatus(bool),
    UpdatePoolAdapter(PoolApiAdapters),
    Stop,
}

/// GpuPoolManager provides centralized management of GPU mining pool status monitoring. <br/>
/// Key features:
/// - Periodic pool status updates with adaptive polling intervals
/// - 60-second intervals when mining is active
/// - 300-second intervals when mining is inactive  
/// - 1-hour grace period after mining stops before task shuts down
/// - Automatic updates when pool or mining address configuration changes
/// - Integration with TasksTrackers for proper shutdown handling
pub struct PoolManager {
    pool_adapter: PoolApiAdapters,
    cached_mining_address: Option<String>,
    pool_stats: Arc<RwLock<HashMap<String, PoolStatus>>>,
    // Task tracking for periodic status updates
    is_task_running: bool,
    is_mining_active: bool,
    task_tracker: Arc<TaskTrackerUtil>,
    // Communication channels
    task_sender: Option<mpsc::UnboundedSender<PoolManagerThreadCommands>>,
    pool_stats_event_callback:
        Arc<dyn Fn(HashMap<String, PoolStatus>, PoolStatus) + Send + Sync + 'static>,
}

impl PoolManager {
    pub fn new(
        pool_adapter: PoolApiAdapters,
        task_tracker: Arc<TaskTrackerUtil>,
        callback: impl Fn(HashMap<String, PoolStatus>, PoolStatus) + Send + Sync + 'static,
    ) -> Self {
        Self {
            pool_adapter,
            cached_mining_address: None,
            pool_stats: Arc::new(RwLock::new(HashMap::new())),
            is_task_running: false,
            is_mining_active: true,
            task_sender: None,
            task_tracker,
            pool_stats_event_callback: Arc::new(callback),
        }
    }

    pub async fn update_current_pool_status(&self) {
        if let Some(address) = &self.cached_mining_address {
            let pool_status = self.pool_adapter.request_pool_status(address.clone()).await;
            match pool_status {
                Ok(status) => {
                    {
                        let mut statuses = self.pool_stats.write().await;
                        statuses.insert(self.pool_adapter.name().to_string(), status.clone());
                        (self.pool_stats_event_callback)(statuses.clone(), status.clone());
                    }
                    info!(target: LOG_TARGET, "Updated pool status: {status:?}");
                }
                Err(e) => {
                    warn!(target: LOG_TARGET, "Failed to fetch pool status: {e}");
                }
            }
        }
    }

    /// Load a new pool adapter configuration
    /// This does not start the periodic task or fetch the status, it only updates the adapter used
    /// for future requests. To start fetching status, call `spawn_periodic_pool_status_update_task`.
    /// ### Arguments
    /// * `adapter` - The new pool adapter configuration to use
    /// ### Note
    /// Added for cases when pool is disabled but we want to load the correct last adapter from config
    pub async fn load_pool_adapter(&mut self, adapter: PoolApiAdapters) {
        self.pool_adapter = adapter;
    }

    pub async fn handle_pool_change(&mut self, adapter: PoolApiAdapters) {
        info!(target: LOG_TARGET, "Updated pool configuration to: {adapter:?}");
        self.pool_adapter = adapter.clone();

        // No point in continuing the task after mining address changed when mining is not active there propably won't be any stats to fetch
        if !self.is_mining_active {
            self.stop_background_task();
            self.update_current_pool_status().await; // Update once immediately to reflect the new address
        }

        if self.task_sender.is_none() {
            self.update_current_pool_status().await; // Update once immediately to reflect the new address
        }

        // Send to task if running
        if let Some(sender) = &self.task_sender {
            if let Err(e) = sender.send(PoolManagerThreadCommands::UpdatePoolAdapter(adapter)) {
                warn!(target: LOG_TARGET, "Failed to send pool update to task: {e}");
            }
            let pool_stats = self.pool_stats.read().await.clone();
            let current_status = pool_stats
                .get(self.pool_adapter.name())
                .cloned()
                .unwrap_or_default();
            (self.pool_stats_event_callback)(pool_stats, current_status);
        }
    }

    // Handle the case when user changes the mining address in the settings
    // Should be triggered in InternalWallet side effects handler to keep up to date with the latest mining address
    pub async fn handle_new_mining_address(&mut self, mining_address: &TariAddress) {
        let mining_address = mining_address.to_base58();

        info!(target: LOG_TARGET, "Updated mining address to: {mining_address}" );
        self.cached_mining_address = Some(mining_address.clone());

        // No point in continuing the task after mining address changed when mining is not active there propably won't be any stats to fetch
        if self.task_sender.is_some() && !self.is_mining_active {
            self.stop_background_task();
            self.update_current_pool_status().await; // Update once immediately to reflect the new address
        }

        if self.task_sender.is_none() {
            self.update_current_pool_status().await; // Update once immediately to reflect the new address
        }

        // Send to task if running
        if let Some(sender) = &self.task_sender {
            if let Err(e) = sender.send(PoolManagerThreadCommands::UpdateMiningAddress(
                mining_address.clone(),
            )) {
                warn!(target: LOG_TARGET, "Failed to send mining address update to task: {e}");
            }
            let pool_stats = self.pool_stats.read().await.clone();
            let current_status = pool_stats
                .get(self.pool_adapter.name())
                .cloned()
                .unwrap_or_default();
            (self.pool_stats_event_callback)(pool_stats, current_status);
        }
    }

    pub async fn toggle_mining_active(&mut self, is_active: bool) {
        // Update local state
        info!(target: LOG_TARGET, "Mining active status changed to: {is_active}");
        self.is_mining_active = is_active;
        // Send to task if running
        if let Some(sender) = &self.task_sender {
            if let Err(e) = sender.send(PoolManagerThreadCommands::UpdateMiningStatus(is_active)) {
                warn!(target: LOG_TARGET, "Failed to send mining status update to task: {e}");
            }
            let pool_stats = self.pool_stats.read().await.clone();
            let current_status = pool_stats
                .get(self.pool_adapter.name())
                .cloned()
                .unwrap_or_default();
            (self.pool_stats_event_callback)(pool_stats, current_status);
        }
    }

    /// Send a stop command to the background task
    pub fn stop_background_task(&mut self) {
        if let Some(sender) = &self.task_sender {
            if let Err(e) = sender.send(PoolManagerThreadCommands::Stop) {
                warn!(target: LOG_TARGET, "Failed to send stop command to task: {e}");
            }
        }
        self.task_sender = None;
        self.is_task_running = false;
    }

    pub async fn spawn_periodic_pool_status_update_task(&mut self) {
        // Check if task is already running
        if self.is_task_running {
            debug!(target: LOG_TARGET, "Periodic pool status update task is already running");
            self.toggle_mining_active(true).await; // Ensure mining active status is updated
            return;
        }
        self.is_task_running = true;

        info!(target: LOG_TARGET, "Starting periodic pool status update task");

        if let Some(tari_address) = &self.cached_mining_address {
            // Create channels for communication
            let (task_sender, mut task_receiver) =
                mpsc::unbounded_channel::<PoolManagerThreadCommands>();

            // Store senders/receivers in the struct
            self.task_sender = Some(task_sender);

            // Create the task state with current values
            let mut task_state = TaskState::new(
                self.pool_adapter.clone(),
                tari_address.clone(),
                self.pool_stats.clone(),
                self.is_mining_active,
                self.pool_stats_event_callback.clone(),
            );

            let mut shutdown_signal = self.task_tracker.get_signal().await;
            let task_tracker = self.task_tracker.get_task_tracker().await;

            task_tracker.spawn(async move {
            let mut mining_interval = interval(Duration::from_secs(60)); // Active mining: 60 seconds
            mining_interval.set_missed_tick_behavior(tokio::time::MissedTickBehavior::Skip);
            let mut non_mining_interval = interval(Duration::from_secs(300)); // Not mining: 300 seconds
            non_mining_interval.set_missed_tick_behavior(tokio::time::MissedTickBehavior::Skip);
            let mut stop_task_at = None::<Instant>;

            loop {
                tokio::select! {
                    _ = shutdown_signal.wait() => {
                        info!(target: LOG_TARGET, "Periodic pool status update task received shutdown signal");
                        break;
                    }
                    // Handle incoming commands
                    Some(command) = task_receiver.recv() => {
                        debug!(target: LOG_TARGET, "Task received command: {command:?}" );
                        match command {
                            PoolManagerThreadCommands::UpdateMiningAddress(addr) => {
                                task_state.cached_mining_address = addr;
                                Self::periodic_update_logic_static(&mut task_state).await;
                                info!(target: LOG_TARGET, "Task: Updated mining address");
                            }
                            PoolManagerThreadCommands::UpdateMiningStatus(status) => {
                                info!(target: LOG_TARGET, "Task: Mining status updated to: {status:?}" );
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
                                task_state.pool_adapter = adapter.clone();
                                Self::periodic_update_logic_static(&mut task_state).await;
                                info!(target: LOG_TARGET, "Task: Updated pool configuration to: {adapter:?}");
                            }
                            PoolManagerThreadCommands::Stop  => {
                                info!(target: LOG_TARGET, "Task: Received stop command");
                                break;
                            }
                        }
                    }

                    _ = mining_interval.tick() => {
                        if task_state.is_mining_active {
                            // Active mining: 60 seconds
                            task_state.tracking_duration = Duration::ZERO; // Reset tracking duration when mining is active
                            Self::periodic_update_logic_static(&mut task_state).await;
                        }
                    }
                    non_mining_interval_duration = non_mining_interval.tick() => {
                        if !task_state.is_mining_active {
                            // Not mining: 300 seconds
                            task_state.tracking_duration += Duration::from_secs(non_mining_interval_duration.elapsed().as_secs());
                            Self::periodic_update_logic_static(&mut task_state).await;
                        }
                    }

                }

                // Check if we should stop the task (1 hour after mining stopped)
                if let Some(stop_at) = stop_task_at {
                    if task_state.tracking_duration >= Duration::from_secs(stop_at.elapsed().as_secs()) {
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
    async fn periodic_update_logic_static(task_state: &mut TaskState) {
        let pool_status = task_state
            .pool_adapter
            .request_pool_status(task_state.cached_mining_address.clone())
            .await;
        match pool_status {
            Ok(status) => {
                {
                    let mut statuses = task_state.pool_statuses.write().await;
                    statuses.insert(task_state.pool_adapter.name().to_string(), status.clone());
                    (task_state.pool_stats_event_callback)(statuses.clone(), status.clone());
                }
                info!(target: LOG_TARGET, "Updated pool status: {status:?}");
            }
            Err(e) => {
                warn!(target: LOG_TARGET, "Failed to fetch pool status: {e}");
            }
        }
    }
}
