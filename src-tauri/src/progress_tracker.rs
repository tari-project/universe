use std::{collections::HashMap, sync::Arc};

use log::error;
use tauri::{AppHandle, Emitter};
use tokio::sync::{watch::Sender, RwLock};

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
    pub fn new(app_handle: AppHandle, channel: Option<Sender<String>>) -> Self {
        Self {
            inner: Arc::new(RwLock::new(ProgressTrackerInner::new(app_handle, channel))),
        }
    }

    pub async fn set_max(&self, max: u64) {
        self.inner.write().await.set_next_max(max);
    }

    pub async fn send_last_action(&self, action: String) {
        self.inner.read().await.send_last_action(action);
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
    app_handle: AppHandle,
    min: u64,
    next_max: u64,
    last_action_channel: Option<Sender<String>>,
}

impl ProgressTrackerInner {
    pub fn new(app_handle: AppHandle, channel: Option<Sender<String>>) -> Self {
        Self {
            app_handle: app_handle.clone(),
            min: 0,
            next_max: 0,
            last_action_channel: channel,
        }
    }

    pub fn set_next_max(&mut self, max: u64) {
        self.min = self.next_max;
        self.next_max = max;
    }

    pub fn send_last_action(&self, action: String) {
        if let Some(channel) = &self.last_action_channel {
            channel
                .send(action)
                .inspect_err(|e| error!(target: LOG_TARGET, "Could not send last action: {:?}", e))
                .ok();
        }
    }

    pub fn update(
        &self,
        title: String,
        title_params: Option<HashMap<String, String>>,
        progress: u64,
    ) {
        //  debug!(target: LOG_TARGET, "Progress: {}% {}", progress, title);
        let progress_percentage = (self.min as f64
            + (((self.next_max - self.min) as f64) * ((progress as f64) / 100.0)))
            / 100.0;
        if let Some(channel) = &self.last_action_channel {
            channel
                .send(format!(
                    "last action: {} at progress: {}",
                    title.clone(),
                    progress_percentage
                ))
                .inspect_err(|e| error!(target: LOG_TARGET, "Could not send last action: {:?}", e))
                .ok();
        }
        self.app_handle
            .emit(
                "message",
                SetupStatusEvent {
                    event_type: "setup_status".to_string(),
                    title,
                    title_params,
                    progress: progress_percentage,
                },
            )
            .inspect_err(|e| error!(target: LOG_TARGET, "Could not emit event 'message': {:?}", e))
            .ok();
    }
}
