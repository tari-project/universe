use std::sync::LazyLock;
use notify_rust::Notification;

use log::info;

const LOG_TARGET: &str = "tari::universe::notification_manager";
static INSTANCE: LazyLock<NotificationManager> = LazyLock::new(NotificationManager::new);

pub enum CurrentOperatingSystem {
    Windows,
    Linux,
    MacOS,
}

pub struct NotificationManager {}

impl NotificationManager {
    pub fn new() -> Self {
        Self {}
    }

    pub fn trigger_notification(&self, summary: &str, body: &str) {
        info!(target: LOG_TARGET, "Triggering notification with summary: {} and body: {}", summary, body);
        let notification = self.build_notification(summary, body);

        match Self::detect_current_os() {
            CurrentOperatingSystem::Linux => {
                #[cfg(target_os = "linux")]
                notification.show().unwrap().on_close(
                    |notification| {
                        info!(target: LOG_TARGET, "Notification closed: {:?}", notification);
                    },
                );
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
        let mut notification = Notification::new()
            .summary(summary)
            .body(body).finalize();

        match Self::detect_current_os() {
            CurrentOperatingSystem::Linux => {
                return notification.auto_icon().appname("Tari Universe").finalize();
            }
            CurrentOperatingSystem::MacOS => {
                return notification.finalize();
            }
            CurrentOperatingSystem::Windows => {
                return notification.finalize();
        }
    }
    }
    fn detect_current_os() -> CurrentOperatingSystem {
        if cfg!(target_os = "windows") {
            CurrentOperatingSystem::Windows
        } else if cfg!(target_os = "linux") {
            CurrentOperatingSystem::Linux
        } else if cfg!(target_os = "macos") {
            CurrentOperatingSystem::MacOS
        } else {
            panic!("Unsupported OS");
        }
    }

    pub fn current() -> &'static NotificationManager {
        &INSTANCE
    }
}