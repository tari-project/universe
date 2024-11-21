use device_query::{DeviceQuery, DeviceState};
use log::{error, info};
use tokio::time::{sleep, Duration};
use tokio_util::sync::CancellationToken;

#[allow(dead_code)]
const LOG_TARGET: &str = "tari::universe::user_listener";

#[derive(Debug, Clone)]
pub struct UserListener {
    pub is_listening: bool,
    pub is_mining_initialized: bool,
    pub cancelation_token: Option<CancellationToken>,
}

#[derive(Clone, serde::Serialize)]
pub struct UserActivityEventPayload {
    event_type: String,
}

#[derive(Clone, serde::Serialize)]
pub struct CurrentTimeoutDurationEventPayload {
    event_type: String,
    duration: u64,
}

#[allow(dead_code)]
impl UserListener {
    pub fn new() -> Self {
        Self {
            is_listening: false,
            is_mining_initialized: false,
            cancelation_token: None,
        }
    }

    pub fn read_user_mouse_coords() -> (i32, i32) {
        let device_state = DeviceState::new();
        let mouse = device_state.get_mouse();

        mouse.coords
    }

    pub fn start_listening_to_mouse_poisition_change(
        &mut self,
        timeout: Duration,
        window: tauri::Window,
    ) {
        println!("UserListener::start_listening_to_mouse_poisition_change");

        let cancellation_token = CancellationToken::new();
        self.cancelation_token = Some(cancellation_token.clone());
        self.is_listening = true;

        let mut user_listener = self.to_owned();
        let window = window.clone();

        let mut timeout_counter: Duration = Duration::from_secs(0);
        let mut last_mouse_coords = UserListener::read_user_mouse_coords();

        tokio::spawn(async move {
            tokio::select! {
                _ = async {
                    println!("UserListener::listening for user inactivity has been started");
                    info!(target: LOG_TARGET, "UserListener::listening for user inactivity has been started");
                    loop {
                        println!("Listening for user inactivity, is_mining_initialized: {}, timeout: {}, timeout_counter: {}", user_listener.is_mining_initialized, timeout.as_secs(), timeout_counter.as_secs());
                        let current_mouse_coords = UserListener::read_user_mouse_coords();

                        if current_mouse_coords == last_mouse_coords {
                            timeout_counter += Duration::from_secs(1);
                        } else {
                            last_mouse_coords = current_mouse_coords;
                            timeout_counter = Duration::from_secs(0);
                        }


                        if timeout_counter >= timeout && !user_listener.is_mining_initialized {
                            UserListener::on_user_idle(&window);
                            user_listener.is_mining_initialized = true;
                        }

                        if timeout_counter < timeout && user_listener.is_mining_initialized {
                            UserListener::on_user_active(&window);
                            user_listener.is_mining_initialized = false;
                        }


                        UserListener::emit_current_timeout_duration(&window, timeout.saturating_sub(timeout_counter));
                        sleep(Duration::from_secs(1)).await;
                    }
                } => {},
                _ = cancellation_token.cancelled() => {
                    info!(target: LOG_TARGET, "UserListener::listening for user inactivity has been cancelled");
                    if user_listener.is_mining_initialized {
                        UserListener::on_user_active(&window);
                        user_listener.is_mining_initialized = false;
                    }

                }
            }
        });
    }

    pub fn stop_listening_to_mouse_poisition_change(&mut self) {
        match &self.cancelation_token {
            Some(token) => {
                info!(target: LOG_TARGET, "UserListener::triggered cancelation of listening for user inactivity");
                token.cancel();
                self.is_listening = false;
            }
            None => {
                info!(target: LOG_TARGET,
                    "UserListener::triggered cancelation of listening for user inactivity but no cancelation token was found"
                );
            }
        }
    }

    pub fn on_user_idle(window: &tauri::Window) {
        println!("User is idle");
        window
            .emit(
                "message",
                UserActivityEventPayload {
                    event_type: "user_idle".to_string(),
                },
            )
            .unwrap_or_else(|e| {
                error!(target: LOG_TARGET,"Error emitting user_idle event: {}", e);
            });
    }

    pub fn on_user_active(window: &tauri::Window) {
        println!("User is active");
        window
            .emit(
                "message",
                UserActivityEventPayload {
                    event_type: "user_active".to_string(),
                },
            )
            .unwrap_or_else(|e| {
                error!(target: LOG_TARGET,"Error emitting user_active event: {}", e);
            });
    }

    pub fn emit_current_timeout_duration(window: &tauri::Window, timeout: Duration) {
        window
            .emit(
                "message",
                CurrentTimeoutDurationEventPayload {
                    event_type: "current_timeout_duration".to_string(),
                    duration: timeout.as_secs(),
                },
            )
            .unwrap_or_else(|e| {
                error!(target: LOG_TARGET,"Error emitting current_timeout_duration event: {}", e);
            });
    }
}
