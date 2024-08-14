use device_query::{DeviceQuery, DeviceState};
use log::info;
use tokio::time::{sleep, Duration};
use tokio_util::sync::CancellationToken;

#[derive(Debug, Clone)]
pub struct UserListener {
    pub is_listening: bool,
    pub is_mining_initialized: bool,
    pub idle_timeout: u64,
    pub cancelation_token: Option<CancellationToken>,
}

#[derive(Clone, serde::Serialize)]
pub struct UserActivityEventPayload {
    event_type: String,
}

impl UserListener {
    pub fn new() -> Self {
        Self {
            is_listening: false,
            is_mining_initialized: false,
            idle_timeout: 5000,
            cancelation_token: None,
        }
    }

    pub fn read_user_mouse_coords() -> (i32, i32) {
        let device_state = DeviceState::new();
        let mouse = device_state.get_mouse();

        mouse.coords
    }

    pub fn set_idle_timeout(&mut self, timeout: u64) {
        self.idle_timeout = timeout;
    }

    pub fn start_listening_to_mouse_poisition_change(&mut self,timeout: u64, window: tauri::Window) {
        let idle_timeout = self.idle_timeout;

        let cancellation_token = CancellationToken::new();
        self.cancelation_token = Some(cancellation_token.clone());
        self.is_listening = true;

        let mut user_listener = self.to_owned();
        let window = window.clone();

        let mut timeout_counter: u64 = 0;
        let mut last_mouse_coords = UserListener::read_user_mouse_coords();

        tokio::spawn(async move {
            tokio::select! {
                _ = async {
                    info!("UserListener::listening for user inactivity has been started");
                    loop {
                        let current_mouse_coords = UserListener::read_user_mouse_coords();

                        if current_mouse_coords != last_mouse_coords {
                            last_mouse_coords = current_mouse_coords;
                            timeout_counter = 0;
                        } else {
                            timeout_counter += 1000;
                        }


                        if timeout_counter >= idle_timeout && !user_listener.is_mining_initialized {
                            UserListener::on_user_idle(&window);
                            user_listener.is_mining_initialized = true;
                        }

                        if timeout_counter < idle_timeout && user_listener.is_mining_initialized {
                            UserListener::on_user_active(&window);
                            user_listener.is_mining_initialized = false;
                        }

                        sleep(Duration::from_millis(idle_timeout)).await;
                    }
                } => {},
                _ = cancellation_token.cancelled() => {
                    info!("UserListener::listening for user inactivity has been cancelled");
                    UserListener::on_user_active(&window);
                    user_listener.is_mining_initialized = false;
                }
            }
        });
    }

    pub fn stop_listening_to_mouse_poisition_change(&mut self) {
        match &self.cancelation_token {
            Some(token) => {
                token.cancel();
                self.is_listening = false;
            }
            None => {
                info!(
                    "UserListener::triggered cancelation of listening for user inactivity but no cancelation token was found"
                );
            }
        }
    }

    pub fn on_user_idle(window: &tauri::Window) {
        window
            .emit(
                "message",
                UserActivityEventPayload {
                    event_type: "user_idle".to_string(),
                },
            )
            .unwrap();
    }

    pub fn on_user_active(window: &tauri::Window) {
        window
            .emit(
                "message",
                UserActivityEventPayload {
                    event_type: "user_active".to_string(),
                },
            )
            .unwrap();
    }
}
