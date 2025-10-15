use std::sync::LazyLock;

use log::info;
use tokio::{sync::Mutex, task::JoinHandle};

use crate::tasks_tracker::TasksTrackers;

const LOG_TARGET: &str = "tari::universe::battery_status";

static INSTANCE: LazyLock<BatteryStatus> = LazyLock::new(BatteryStatus::new);

pub struct BatteryStatus {
    battery_listener_thread: Mutex<Option<JoinHandle<()>>>,
}

impl BatteryStatus {
    pub fn new() -> Self {
        Self {
            battery_listener_thread: Mutex::new(None),
        }
    }

    pub async fn stop_battery_listener() {
        let mut thread_lock = INSTANCE.battery_listener_thread.lock().await;
        if let Some(handle) = thread_lock.take() {
            handle.abort();
            let _ = handle.await;
            log::info!(target: LOG_TARGET, "Battery listener thread stopped.");
        } else {
            log::info!(target: LOG_TARGET, "No battery listener thread to stop.");
        }
    }

    pub async fn start_battery_listener() {
        let mut thread_lock = INSTANCE.battery_listener_thread.lock().await;
        let common_task_tracker = TasksTrackers::current().common.get_task_tracker().await;
        let mut common_shutdown_signal = TasksTrackers::current().common.get_signal().await;

        if thread_lock.is_none() {
            let handle = common_task_tracker.spawn(async move {
                loop {
                    info!(target: LOG_TARGET, "============================= Battery Status loop ==============================");
                    // Use spawn_blocking to handle non-Send battery operations
                    let battery_info = tokio::task::spawn_blocking(|| {
                        info!(target: LOG_TARGET, "============================== Battery Status thread ==============================");
                        let battery_manager = battery::Manager::new().expect("Failed to create battery manager");
                        let mut result = Vec::new();
                        
                        battery_manager.batteries().is_ok_and(|batteries| batteries.count() == 0)
                            .then(|| result.push("No batteries found.".to_string()));

                        match battery_manager.batteries() {
                            Ok(mut batteries) => {
                                while let Some(Ok(battery)) = batteries.next() {
                                    result.push(format!(
                                        "Battery: {} - State: {:?}, Charge: {:.2}%",
                                        battery.vendor().unwrap_or("Unknown"),
                                        battery.state(),
                                        battery.state_of_charge().value * 100.0
                                    ));
                                }
                            }
                            Err(e) => {
                                result.push(format!("Failed to get batteries: {}", e));
                            }
                        }
                        
                        result
                    }).await.unwrap_or_else(|e| vec![format!("Error in battery check: {}", e)]);
                    
                    // Log each battery info
                    for info in battery_info {
                        log::info!(target: LOG_TARGET, "{}", info);
                    }

                    tokio::select! {
                        _ = tokio::time::sleep(tokio::time::Duration::from_secs(5)) => {},
                        _ = &mut common_shutdown_signal => {
                            log::info!(target: LOG_TARGET, "Battery listener received shutdown signal.");
                            break;
                        }
                    }
                }
            });
            *thread_lock = Some(handle);
            log::info!(target: LOG_TARGET, "Battery listener thread started.");
        } else {
            log::info!(target: LOG_TARGET, "Battery listener thread is already running.");
        }
    }
}
