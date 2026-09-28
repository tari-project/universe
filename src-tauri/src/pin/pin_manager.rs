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

use std::{
    sync::atomic::{AtomicU64, Ordering},
    time::Duration,
};

use serde::Deserialize;
use tari_utilities::SafePassword;
use tauri::{AppHandle, Listener};
use tokio::sync::oneshot;

use crate::{
    LOG_TARGET_APP_LOGIC,
    configs::{config_wallet::ConfigWallet, trait_config::ConfigImpl},
    events::PinPromptContext,
    events_emitter::EventsEmitter,
    internal_wallet::InternalWallet,
    pin::pin_locker::PinLocker,
};

pub struct PinManager {}

impl PinManager {
    pub async fn pin_locked() -> bool {
        *ConfigWallet::content()
            .await
            .pin_locker_state()
            .pin_locked()
    }

    /// Ask the user for their PIN and validate it.
    ///
    /// `context` is optional metadata describing what the PIN is being requested for
    /// (e.g. an outgoing transaction). It is forwarded to the frontend dialog so the
    /// user can see what they are authorising; callers with no meaningful context
    /// pass `None` and the dialog looks exactly as it always has.
    pub async fn get_validated_pin(
        app_handle: &AppHandle,
        context: Option<PinPromptContext>,
    ) -> Result<SafePassword, anyhow::Error> {
        let pin = enter_pin_dialog(app_handle, context).await?;
        let pin_password = SafePassword::from(pin);
        PinManager::validate_pin(pin_password.clone()).await?;
        Ok(pin_password)
    }

    pub async fn get_validated_pin_if_defined(
        app_handle: &AppHandle,
        context: Option<PinPromptContext>,
    ) -> Result<Option<SafePassword>, anyhow::Error> {
        if PinManager::pin_locked().await {
            Ok(Some(
                PinManager::get_validated_pin(app_handle, context).await?,
            ))
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
                    log::info!(target: LOG_TARGET_APP_LOGIC, "Pin validated successfully against Tari Seed!");
                }
                Err(e) => {
                    pin_locker.register_failed_pin_attempt().await?;
                    log::info!(target: LOG_TARGET_APP_LOGIC, "Pin validation failed against Tari Seed!");
                    return Err(e);
                }
            }
        } else if *ConfigWallet::content().await.monero_address_is_generated() {
            match InternalWallet::get_monero_seed(Some(pin_password.clone())).await {
                Ok(_unused) => {
                    log::info!(target: LOG_TARGET_APP_LOGIC, "Pin validated successfully against Monero Seed!");
                }
                Err(e) => {
                    pin_locker.register_failed_pin_attempt().await?;
                    log::info!(target: LOG_TARGET_APP_LOGIC, "Pin validation failed against Monero Seed!");
                    return Err(e);
                }
            }
        } else {
            log::error!(target: LOG_TARGET_APP_LOGIC, "Neither Tari Seed nor Monero Seed available to validate against.");
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

/// Only one PIN prompt at a time, so the user always knows which dialog they are
/// answering. Held only for a single emit-and-wait, never across prompts, so a caller
/// that prompts twice (or holds the send gate permit) just queues behind it.
static PIN_PROMPT: tokio::sync::Mutex<()> = tokio::sync::Mutex::const_new(());
static NEXT_PROMPT_ID: AtomicU64 = AtomicU64::new(1);
/// A dialog nobody answers (a lost event, a reloaded webview) must not hold
/// `PIN_PROMPT` for the rest of the session.
const PIN_PROMPT_TIMEOUT: Duration = Duration::from_secs(5 * 60);

/// What the frontend sends on "pin-dialog-response": the id of the prompt it answers
/// and the PIN, or no PIN when the user cancelled. A string, never a number: `012345`
/// must not arrive as `12345`.
#[derive(Deserialize)]
struct PinDialogResponse {
    id: u64,
    pin: Option<String>,
}

/// The answer a "pin-dialog-response" payload gives prompt `id`: `None` when it answers
/// another prompt (or isn't a response at all), `Some(None)` when the user cancelled or
/// the PIN isn't 4 to 6 ASCII digits.
fn pin_for_prompt(payload: &str, id: u64) -> Option<Option<String>> {
    let response: PinDialogResponse = serde_json::from_str(payload).ok()?;
    if response.id != id {
        return None;
    }
    Some(
        response
            .pin
            .filter(|pin| (4..=6).contains(&pin.len()) && pin.bytes().all(|b| b.is_ascii_digit())),
    )
}

async fn pin_dialog_with_emitter<F, Fut>(
    app_handle: &AppHandle,
    emit_fn: F,
) -> Result<String, anyhow::Error>
where
    F: Fn(u64) -> Fut,
    Fut: std::future::Future<Output = ()>,
{
    let _prompt = PIN_PROMPT.lock().await;
    let id = NEXT_PROMPT_ID.fetch_add(1, Ordering::Relaxed);

    // Listen before showing the dialog so a fast answer can't be missed.
    let (tx, rx) = oneshot::channel();
    let tx = std::sync::Mutex::new(Some(tx));
    let listener = app_handle.listen("pin-dialog-response", move |event| {
        if let Some(pin) = pin_for_prompt(event.payload(), id)
            && let Some(tx) = tx.lock().ok().and_then(|mut tx| tx.take())
        {
            let _unused = tx.send(pin);
        }
    });
    emit_fn(id).await;

    let response = tokio::time::timeout(PIN_PROMPT_TIMEOUT, rx).await;
    app_handle.unlisten(listener);
    match response {
        Ok(Ok(Some(pin))) => Ok(pin),
        Err(_elapsed) => {
            log::info!(target: LOG_TARGET_APP_LOGIC, "PIN entry timed out");
            EventsEmitter::emit_close_pin_dialog(id).await;
            Err(anyhow::anyhow!("PIN entry cancelled"))
        }
        Ok(_) => {
            log::info!(target: LOG_TARGET_APP_LOGIC, "PIN entry cancelled");
            Err(anyhow::anyhow!("PIN entry cancelled"))
        }
    }
}

async fn enter_pin_dialog(
    app_handle: &AppHandle,
    context: Option<PinPromptContext>,
) -> Result<String, anyhow::Error> {
    pin_dialog_with_emitter(app_handle, |id| {
        EventsEmitter::emit_ask_for_pin(id, context.clone())
    })
    .await
}

async fn create_pin_dialog(app_handle: &AppHandle) -> Result<String, anyhow::Error> {
    pin_dialog_with_emitter(app_handle, EventsEmitter::emit_set_pin).await
}

#[cfg(test)]
mod tests {
    use super::pin_for_prompt;

    #[test]
    fn only_a_response_to_this_prompt_counts() {
        assert_eq!(
            pin_for_prompt(r#"{"id":7,"pin":"123456"}"#, 7),
            Some(Some("123456".into()))
        );
        assert_eq!(pin_for_prompt(r#"{"id":6,"pin":"123456"}"#, 7), None);
        assert_eq!(pin_for_prompt(r#"{"pin":"123456"}"#, 7), None);
        assert_eq!(pin_for_prompt("123456", 7), None);
        assert_eq!(pin_for_prompt(r#"{"id":7}"#, 7), Some(None));
    }

    #[test]
    fn pin_is_four_to_six_ascii_digits_with_leading_zeros_kept() {
        for pin in ["012345", "000001", "000000", "1234"] {
            assert_eq!(
                pin_for_prompt(&format!(r#"{{"id":7,"pin":"{pin}"}}"#), 7),
                Some(Some(pin.into())),
                "{pin}"
            );
        }
        for pin in ["123", "1234567", "12a4", "１２３４", "12 4", ""] {
            assert_eq!(
                pin_for_prompt(&format!(r#"{{"id":7,"pin":"{pin}"}}"#), 7),
                Some(None),
                "{pin}"
            );
        }
        // A numeric payload is the old wire format; it is not a PIN any more.
        assert_eq!(pin_for_prompt(r#"{"id":7,"pin":123456}"#, 7), None);
    }
}
