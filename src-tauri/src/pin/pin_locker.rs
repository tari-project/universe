// Copyright 2024. The Tari Project
//
// Redistribution and use in source and binary forms, with or without modification, are permitted provided that the
// following conditions are met:
//
// 1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following
// disclaimer.
//
// 2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the
// following disclaimer in the documentation and/or other materials provided with the distribution.
//
// 3. Neither the name of the copyright holder nor the names of its contributors may be used to endorse or promote
// products derived from this software without specific prior written permission.
//
// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES,
// INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
// DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
// SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
// SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
// WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE
// USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

use std::time::SystemTime;

use getset::{Getters, Setters};
use serde::{Deserialize, Serialize};
use tiny_keccak::{Hasher, Keccak};

use crate::configs::{
    config_wallet::{ConfigWallet, ConfigWalletContent},
    trait_config::ConfigImpl,
};

pub struct PinLocker {
    state: PinLockerState,
    // hash_state: Option<Vec<u8>>,
}

impl PinLocker {
    pub fn new(state: PinLockerState) -> Self {
        PinLocker {
            state,
            // hash_state: None,
        }
    }

    pub async fn register_failed_pin_attempt(&mut self) -> Result<(), anyhow::Error> {
        self.state.register_failed_pin_attempt();
        ConfigWallet::update_field(
            ConfigWalletContent::set_pin_locker_state,
            self.state.clone(),
        )
        .await
    }

    pub async fn reset_pin_attempts(&mut self) -> Result<(), anyhow::Error> {
        self.state.reset_pin_attempts();
        ConfigWallet::update_field(
            ConfigWalletContent::set_pin_locker_state,
            self.state.clone(),
        )
        .await
    }

    pub async fn locked_out_seconds(&self) -> Option<u64> {
        if let (Some(last), Some(duration)) = (
            self.state.last_failed_pin_attempt,
            self.state.pin_lockout_duration(),
        ) {
            match last.elapsed() {
                Ok(elapsed) => {
                    if elapsed < duration {
                        Some(duration.as_secs() - elapsed.as_secs())
                    } else {
                        None
                    }
                }
                Err(_) => None,
            }
        } else {
            None
        }
    }

    pub async fn set_pin_locked(&mut self, locked: bool) -> Result<(), anyhow::Error> {
        self.state.pin_locked = locked;
        ConfigWallet::update_field(
            ConfigWalletContent::set_pin_locker_state,
            self.state.clone(),
        )
        .await
    }
}

#[derive(Default, Serialize, Deserialize, Clone, Debug, Getters, Setters)]
pub struct PinLockerState {
    #[getset(get = "pub", set = "pub")]
    pin_locked: bool,
    #[getset(get = "pub", set = "pub")]
    failed_pin_attempts: u32,
    #[getset(get = "pub", set = "pub")]
    last_failed_pin_attempt: Option<SystemTime>,
}

impl PinLockerState {
    pub fn pin_lockout_duration(&self) -> Option<std::time::Duration> {
        match self.failed_pin_attempts {
            3 => Some(std::time::Duration::from_secs(30)),
            4 => Some(std::time::Duration::from_secs(120)),
            5 => Some(std::time::Duration::from_secs(600)),
            n if n >= 6 => Some(std::time::Duration::from_secs(3600)),
            _ => None,
        }
    }

    pub fn register_failed_pin_attempt(&mut self) {
        self.failed_pin_attempts += 1;
        self.last_failed_pin_attempt = Some(SystemTime::now());
    }

    pub fn reset_pin_attempts(&mut self) {
        self.failed_pin_attempts = 0;
        self.last_failed_pin_attempt = None;
    }

    // Will be used later
    #[allow(dead_code)]
    pub fn create_hash(state: &PinLockerState) -> Vec<u8> {
        // Serialize the struct to a byte vector
        let serialized_data = bincode::serialize(state).expect("Failed to serialize data");
        // Create a new Keccak instance
        let mut keccak = Keccak::v256(); // For Keccak-256
        let mut output = [0u8; 32];
        keccak.update(&serialized_data);
        keccak.finalize(&mut output);
        output.to_vec() // Return the hash as a Vec<u8>
    }
}
