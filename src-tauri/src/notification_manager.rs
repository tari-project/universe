use std::sync::LazyLock;
use notify_rust::{Notification, Timeout};

use log::info;

const LOG_TARGET: &str = "tari::universe::notification_manager";
static INSTANCE: LazyLock<NotificationManager> = LazyLock::new(NotificationManager::new);

pub struct NotificationManager {}

impl NotificationManager {
    pub fn new() -> Self {
        Self {}
    }

    pub fn trigger_notification(&self, summary: &str, body: &str) {
        info!(target: LOG_TARGET, "Triggering notification with summary: {} and body: {}", summary, body);
        Notification::new()
    .summary("Firefox News")
    .body("This will almost look like a real firefox notification.")
    .icon("firefox")
    .timeout(Timeout::Milliseconds(6000)) //milliseconds
    .show().unwrap().on_close(
        || {
            info!(target: LOG_TARGET,"Notification closed");
        }
    );
    }

    pub fn current() -> &'static NotificationManager {
        &INSTANCE
    }
}