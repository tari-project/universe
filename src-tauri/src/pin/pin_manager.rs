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

use tari_utilities::SafePassword;
use tauri::{AppHandle, Listener};
use tokio::sync::oneshot;

use crate::{
    configs::{config_wallet::ConfigWallet, trait_config::ConfigImpl},
    events_emitter::EventsEmitter,
    internal_wallet::InternalWallet,
    pin::pin_locker::PinLocker,
};

static LOG_TARGET: &str = "tari::universe::pin_manager";

pub struct PinManager {}

impl PinManager {
    pub async fn pin_locked() -> bool {
        *ConfigWallet::content()
            .await
            .pin_locker_state()
            .pin_locked()
    }

    pub async fn get_validated_pin(app_handle: &AppHandle) -> Result<SafePassword, anyhow::Error> {
        let pin = enter_pin_dialog(app_handle).await?;
        let pin_password = SafePassword::from(pin);
        PinManager::validate_pin(pin_password.clone()).await?;
        Ok(pin_password)
    }

    pub async fn get_validated_pin_if_defined(
        app_handle: &AppHandle,
    ) -> Result<Option<SafePassword>, anyhow::Error> {
        if PinManager::pin_locked().await {
            Ok(Some(PinManager::get_validated_pin(app_handle).await?))
        } else {
            Ok(None)
        }
    }

    pub async fn validate_pin(pin_password: SafePassword) -> Result<(), anyhow::Error> {
        let pin_locker_state = ConfigWallet::content().await.pin_locker_state().clone();
        let mut pin_locker = PinLocker::new(pin_locker_state);
        if let Some(remaining_seconds) = pin_locker.locked_out_seconds().await {
            return Err(anyhow::anyhow!(
                "Pin is locked out. Remaining seconds: {}",
                remaining_seconds
            ));
        }

        let wallet_config = ConfigWallet::content().await;
        // TODO: We can set a flag to validate against monero so user don't need to enter kerying twice

        // Validate pin against Tari Seed or Monero Seed
        if wallet_config.tari_wallet_details().is_some() {
            match InternalWallet::get_tari_seed(Some(pin_password.clone())).await {
                Ok(_unused) => {
                    log::info!(target: LOG_TARGET, "Pin validated successfully against Tari Seed!");
                }
                Err(e) => {
                    pin_locker.register_failed_pin_attempt().await?;
                    log::info!(target: LOG_TARGET, "Pin validation failed against Tari Seed!");
                    return Err(e);
                }
            }
        } else if *ConfigWallet::content().await.monero_address_is_generated() {
            match InternalWallet::get_monero_seed(Some(pin_password.clone())).await {
                Ok(_unused) => {
                    log::info!(target: LOG_TARGET, "Pin validated successfully against Monero Seed!");
                }
                Err(e) => {
                    pin_locker.register_failed_pin_attempt().await?;
                    log::info!(target: LOG_TARGET, "Pin validation failed against Monero Seed!");
                    return Err(e);
                }
            }
        } else {
            log::error!(target: LOG_TARGET, "Neither Tari Seed nor Monero Seed available to validate against.");
            panic!("Neither Tari Seed nor Monero Seed available to validate against.");
            // Edge case, we can't actually validate the pin
            // because we don't have neither a Tari wallet nor a Monero wallet
            // to check against.
        }

        pin_locker.reset_pin_attempts().await?;
        Ok(())
    }

    pub async fn create_pin(app_handle: &AppHandle) -> Result<SafePassword, anyhow::Error> {
        let pin = create_pin_dialog(app_handle).await?;
        Ok(SafePassword::from(pin))
    }

    pub async fn set_pin_locked() -> Result<(), anyhow::Error> {
        let pin_locker_state = ConfigWallet::content().await.pin_locker_state().clone();
        let mut pin_locker = PinLocker::new(pin_locker_state);
        pin_locker.set_pin_locked(true).await
    }
}

// Utils
async fn pin_dialog_with_emitter<F, Fut>(
    app_handle: &AppHandle,
    emit_fn: F,
) -> Result<String, anyhow::Error>
where
    F: Fn() -> Fut,
    Fut: std::future::Future<Output = ()>,
{
    // Display the PIN dialog using the provided emitter
    emit_fn().await;

    // Listen for the pin dialog response event
    let (tx, rx) = oneshot::channel();
    app_handle.once("pin-dialog-response", move |event| {
        let pin = event.payload().trim();

        if pin.len() >= 4 && pin.len() <= 6 {
            let _unused = tx.send(Some(pin.to_string()));
        } else {
            let _unused = tx.send(None);
        }
    });

    // Await the response
    let pin = rx.await.unwrap_or_default();
    if let Some(pin) = pin {
        Ok(pin.to_string())
    } else {
        log::info!("PIN entry cancelled");
        Err(anyhow::anyhow!("PIN entry cancelled"))
    }
}

async fn enter_pin_dialog(app_handle: &AppHandle) -> Result<String, anyhow::Error> {
    pin_dialog_with_emitter(app_handle, EventsEmitter::emit_ask_for_pin).await
}

async fn create_pin_dialog(app_handle: &AppHandle) -> Result<String, anyhow::Error> {
    pin_dialog_with_emitter(app_handle, EventsEmitter::emit_set_pin).await
}
