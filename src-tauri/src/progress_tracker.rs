use std::{collections::HashMap, sync::Arc};

use log::error;
use tauri::Emitter;
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
    pub fn new(app_handle: tauri::AppHandle) -> Self {
        Self {
            inner: Arc::new(RwLock::new(ProgressTrackerInner::new(app_handle))),
        }
    }

    pub async fn set_max(&self, max: u64) {
        self.inner.write().await.set_next_max(max);
    }

    pub async fn update(
        &self,
        title: String,
        title_params: Option<HashMap<String, String>>,
        progress: u64,
    ) {
        self.inner
            .read()
            .await
            .update(title, title_params, progress);
    }
}

pub struct ProgressTrackerInner {
    app_handle: tauri::AppHandle,
    min: u64,
    next_max: u64,
}

impl ProgressTrackerInner {
    pub fn new(app_handle: tauri::AppHandle) -> Self {
        Self {
            app_handle,
            min: 0,
            next_max: 0,
        }
    }

    pub fn set_next_max(&mut self, max: u64) {
        self.min = self.next_max;
        self.next_max = max;
    }

    pub fn update(
        &self,
        title: String,
        title_params: Option<HashMap<String, String>>,
        progress: u64,
    ) {
        //  debug!(target: LOG_TARGET, "Progress: {}% {}", progress, title);
        self.app_handle
            .emit(
                "message",
                SetupStatusEvent {
                    event_type: "setup_status".to_string(),
                    title,
                    title_params,
                    progress: (self.min as f64
                        + (((self.next_max - self.min) as f64) * ((progress as f64) / 100.0)))
                        / 100.0,
                },
            )
            .inspect_err(|e| error!(target: LOG_TARGET, "Could not emit event 'message': {:?}", e))
            .ok();
    }
}
