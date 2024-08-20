use std::sync::Arc;

use log::info;
use tokio::sync::RwLock;

use crate::setup_status_event::SetupStatusEvent;

const LOG_TARGET: &str = "tari::universe::progress_tracker";

pub struct ProgressTracker {
    inner: Arc<RwLock<ProgressTrackerInner>>,
}

impl Clone for ProgressTracker {
    fn clone(&self) -> Self {
        Self {
            inner: self.inner.clone(),
        }
    }
}

impl ProgressTracker {
    pub fn new(window: tauri::Window) -> Self {
        Self {
            inner: Arc::new(RwLock::new(ProgressTrackerInner::new(window))),
        }
    }

    pub async fn set_max(&self, max: u64) {
        self.inner.write().await.set_next_max(max);
    }

    pub async fn update(&self, title: String, progress: u64) {
        self.inner.read().await.update(title, progress);
    }
}

pub struct ProgressTrackerInner {
    window: tauri::Window,
    min: u64,
    next_max: u64,
}

impl ProgressTrackerInner {
    pub fn new(window: tauri::Window) -> Self {
        Self {
            window,
            min: 0,
            next_max: 0,
        }
    }

    pub fn set_next_max(&mut self, max: u64) {
        self.min = self.next_max;
        self.next_max = max;
    }

    pub fn update(&self, title: String, progress: u64) {
        info!(target: LOG_TARGET, "Progress: {}% {}", progress, title);
        let _ = self.window.emit(
            "message",
            SetupStatusEvent {
                event_type: "setup_status".to_string(),
                title,
                progress: (self.min
                    + ((self.next_max - self.min) as f64 * (progress as f64 / 100.0)) as u64)
                    as f64
                    / 100.0,
            },
        );
    }
}
