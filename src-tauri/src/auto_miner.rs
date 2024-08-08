use device_query::{ DeviceEvents, DeviceQuery, DeviceState, MouseState };
use log::info;
use tokio::{ spawn, time::{ sleep, Duration, Timeout } };
use tokio_util::sync::CancellationToken;

#[derive(Debug, Clone)]
pub struct AutoMiner {
    pub is_listening: bool,
    pub is_mining: bool,
    pub idle_timeout: u64,
    pub cancelation_token: Option<CancellationToken>,
}

impl AutoMiner {
    pub fn new() -> Self {
        Self {
            is_listening: false,
            is_mining: false,
            idle_timeout: 5000,
            cancelation_token: None,
        }
    }

    pub fn set_auto_mining_listening(&mut self, is_listening: bool) {
        self.is_listening = is_listening;
    }

    pub fn read_user_mouse_coords() -> (i32, i32) {
        let device_state = DeviceState::new();
        let mouse = device_state.get_mouse();

        return mouse.coords;
    }

    pub fn start_listening_to_mouse_poisition_change(&mut self) {
        let idle_timeout = self.idle_timeout;

        let cancellation_token = CancellationToken::new();
        self.cancelation_token = Some(cancellation_token.clone());
        self.is_listening = true;

        let mut auto_miner = self.to_owned();

        let mut timeout_counter: u64 = 0;
        let mut last_mouse_coords = AutoMiner::read_user_mouse_coords();

        tokio::spawn(async move {
            tokio::select! {
                _ = async {
                    loop {
                        let current_mouse_coords = AutoMiner::read_user_mouse_coords();

                        if current_mouse_coords != last_mouse_coords {
                            last_mouse_coords = current_mouse_coords;
                            timeout_counter = 0;
                            println!("Mouse moved to: {:?}", current_mouse_coords);
                        } else {
                            timeout_counter += 1000;
                            println!("Mouse idle for: {:?}", timeout_counter);
                        }


                        if timeout_counter >= idle_timeout && !auto_miner.is_mining {
                            AutoMiner::start_auto_mining();
                            auto_miner.is_mining = true;
                        }

                        if timeout_counter < idle_timeout && auto_miner.is_mining {
                            AutoMiner::stop_auto_mining();
                            auto_miner.is_mining = false;
                        }

                        sleep(Duration::from_millis(idle_timeout)).await;
                    }
                } => {},
                _ = cancellation_token.cancelled() => {
                    info!("AutoMiner::start_listening_to_mouse_poisition_change() has been cancelled");
                    AutoMiner::stop_auto_mining();
                    auto_miner.is_mining = false;
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
                info!("AutoMiner::stop_listening_to_mouse_poisition_change() has been cancelled");
            }
        }
    }

    pub fn start_auto_mining() {
        println!("Mining started");
    }

    pub fn stop_auto_mining() {
        println!("Mining stopped");
    }
}
