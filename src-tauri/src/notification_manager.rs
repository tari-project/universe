use notify_rust::Notification;
use std::sync::LazyLock;

use log::info;

use crate::utils::platform_utils::{CurrentOperatingSystem, PlatformUtils};

const LOG_TARGET: &str = "tari::universe::notification_manager";
static INSTANCE: LazyLock<NotificationManager> = LazyLock::new(NotificationManager::new);

pub struct NotificationManager {}

impl NotificationManager {
    pub fn new() -> Self {
        Self {}
    }

    pub fn trigger_notification(&self, summary: &str, body: &str) {
        info!(target: LOG_TARGET, "Triggering notification with summary: {} and body: {}", summary, body);
        let notification = self.build_notification(summary, body);

        match PlatformUtils::detect_current_os() {
            CurrentOperatingSystem::Linux => {
                #[cfg(target_os = "linux")]
                notification.show().unwrap().on_close(|notification| {
                    info!(target: LOG_TARGET, "Notification closed: {:?}", notification);
                });
            }
            CurrentOperatingSystem::MacOS => {
                #[cfg(target_os = "macos")]
                notification.show().unwrap();
            }
            CurrentOperatingSystem::Windows => {
                #[cfg(target_os = "windows")]
                notification.show().unwrap();
            }
        }
    }

    fn build_notification(&self, summary: &str, body: &str) -> Notification {
        let mut notification = Notification::new().summary(summary).body(body).finalize();

        match PlatformUtils::detect_current_os() {
            CurrentOperatingSystem::Linux => {
                notification.auto_icon().appname("Tari Universe").finalize()
            }
            CurrentOperatingSystem::MacOS => notification.finalize(),
            CurrentOperatingSystem::Windows => notification.finalize(),
        }
    }

    pub fn current() -> &'static NotificationManager {
        &INSTANCE
    }
}
