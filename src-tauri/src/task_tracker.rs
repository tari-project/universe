use crate::UniverseAppState;
use std::sync::LazyLock;
use tokio_util::task::TaskTracker;

use tauri::Manager;
static INSTANCE: LazyLock<TaskTracker> = LazyLock::new(TaskTracker::new);

pub struct TasksTracker {}

impl TasksTracker {
    pub fn current() -> &'static TaskTracker {
        &INSTANCE
    }

    pub async fn stop_all_processes(app_handle: tauri::AppHandle) {
        let state = app_handle.state::<UniverseAppState>().inner();
        state.shutdown.clone().trigger();
        let tasks_tracker = Self::current();
        tasks_tracker.close();
        tasks_tracker.wait().await;
    }
}
