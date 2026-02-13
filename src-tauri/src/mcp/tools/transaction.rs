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

use std::str::FromStr;
use std::sync::LazyLock;
use std::time::{Duration, SystemTime, UNIX_EPOCH};

use log::{info, warn};
use tari_transaction_components::tari_amount::{MicroMinotari, Minotari};
use tari_utilities::SafePassword;

use crate::configs::config_mcp::ConfigMcp;
use crate::configs::trait_config::ConfigImpl;
use crate::events_emitter::EventsEmitter;
use crate::mcp::rate_limiter::TransactionRateLimiter;
use crate::pin::PinManager;
use crate::wallet::wallet_manager::WalletManager;
use crate::LOG_TARGET_APP_LOGIC;

const DIALOG_TIMEOUT_SECS: u64 = 120;

static TXN_DIALOG_GATE: LazyLock<tokio::sync::Semaphore> =
    LazyLock::new(|| tokio::sync::Semaphore::new(1));

static INFLIGHT: LazyLock<tokio::sync::Mutex<Option<InFlightTxn>>> =
    LazyLock::new(|| tokio::sync::Mutex::new(None));

static TXN_RATE_LIMITER: LazyLock<tokio::sync::Mutex<TransactionRateLimiter>> =
    LazyLock::new(|| tokio::sync::Mutex::new(TransactionRateLimiter::new()));

struct InFlightTxn {
    request_id: String,
    tx: tokio::sync::oneshot::Sender<TxnDialogResponse>,
}

pub struct TxnDialogResponse {
    pub approved: bool,
    pub pin: Option<String>,
}

fn validate_amount(
    amount: &str,
    config: &crate::configs::config_mcp::ConfigMcpContent,
) -> Result<u64, String> {
    let minotari_amount =
        Minotari::from_str(amount).map_err(|e| format!("Invalid amount '{}': {}", amount, e))?;
    let micro_minotari_amount = MicroMinotari::from(minotari_amount);
    let amount_u64 = micro_minotari_amount.as_u64();

    if let Some(max_amount) = config.max_transaction_amount() {
        if amount_u64 > *max_amount {
            return Err(format!(
                "Amount {} µT exceeds maximum allowed {} µT",
                amount_u64, max_amount
            ));
        }
    }

    Ok(amount_u64)
}

pub async fn send_transaction(
    destination: String,
    amount: String,
    payment_id: Option<String>,
    wallet_manager: &WalletManager,
    app_handle: &tauri::AppHandle,
) -> Result<String, String> {
    // 1. Check transactions enabled
    let config = ConfigMcp::content().await;
    if !*config.transactions_enabled() {
        return Err(
            "Transaction tier is disabled. Enable transactions in MCP settings.".to_string(),
        );
    }

    // 2. Check PIN is configured
    if !PinManager::pin_locked().await {
        return Err(
            "No PIN configured. Set up a PIN before enabling MCP transactions.".to_string(),
        );
    }

    // 3. Parse and validate amount
    let amount_u64 = validate_amount(&amount, &config)?;

    // 4. Acquire serialization gate (one dialog at a time)
    let _permit = TXN_DIALOG_GATE
        .acquire()
        .await
        .map_err(|_| "Transaction gate closed".to_string())?;

    // 5. Rate limit check (after acquiring gate to avoid burning quota)
    if !TXN_RATE_LIMITER
        .lock()
        .await
        .check_transaction_allowed()
        .await
    {
        return Err("Transaction rate limit exceeded. Try again later.".to_string());
    }

    // 6. Generate request ID
    let request_id = format!(
        "mcp_tx_{}",
        SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap_or_default()
            .as_millis()
    );

    // 7. Create oneshot channel and set INFLIGHT
    let (tx, rx) = tokio::sync::oneshot::channel::<TxnDialogResponse>();
    {
        let mut inflight = INFLIGHT.lock().await;
        *inflight = Some(InFlightTxn {
            request_id: request_id.clone(),
            tx,
        });
    }

    // 8. Format display amount
    let amount_display = format!("{} XTM", amount);

    info!(target: LOG_TARGET_APP_LOGIC, "MCP: send_transaction dialog emitted (request_id={}, destination={}, amount={})", request_id, destination, amount_display);

    // 9. Emit confirmation event to frontend
    EventsEmitter::emit_mcp_transaction_confirmation(
        crate::events::McpTransactionConfirmationPayload {
            request_id: request_id.clone(),
            destination: destination.clone(),
            amount_micro_minotari: amount_u64,
            amount_display: amount_display.clone(),
        },
    )
    .await;

    // 10. Wait for response with timeout
    let response = match tokio::time::timeout(Duration::from_secs(DIALOG_TIMEOUT_SECS), rx).await {
        Ok(Ok(response)) => response,
        Ok(Err(_)) => {
            clear_inflight().await;
            return Err("Transaction confirmation channel closed unexpectedly".to_string());
        }
        Err(_) => {
            clear_inflight().await;
            return Err("Transaction timed out waiting for confirmation (120s)".to_string());
        }
    };

    // 11. Check approval
    if !response.approved {
        return Err("Transaction denied by user".to_string());
    }

    // 12. Validate PIN
    let pin_str = response.pin.ok_or("PIN is required for transactions")?;
    let pin_password = SafePassword::from(pin_str);
    PinManager::validate_pin(pin_password)
        .await
        .map_err(|e: anyhow::Error| format!("PIN incorrect: {}", e))?;

    // 13. Execute transaction
    info!(target: LOG_TARGET_APP_LOGIC, "MCP: executing send_transaction (destination={}, amount={})", destination, amount_display);
    wallet_manager
        .send_one_sided_to_stealth_address(
            amount.clone(),
            destination.clone(),
            payment_id,
            app_handle,
        )
        .await
        .map_err(|e| format!("Transaction failed: {}", e))?;

    // 14. Emit balance update
    if let Ok(balance) = wallet_manager.get_balance().await {
        EventsEmitter::emit_wallet_balance_update(balance).await;
    }

    let result = serde_json::json!({
        "status": "success",
        "destination": destination,
        "amount": amount_display,
        "amount_micro_minotari": amount_u64,
    });
    serde_json::to_string(&result).map_err(|e| e.to_string())
}

/// Called by the Tauri command when the frontend responds to the transaction dialog.
pub async fn respond_to_transaction(
    request_id: String,
    approved: bool,
    pin: Option<String>,
) -> Result<(), String> {
    let mut inflight = INFLIGHT.lock().await;
    match inflight.take() {
        Some(txn) => {
            if txn.request_id != request_id {
                // Put it back — stale response
                *inflight = Some(txn);
                return Err("Request ID mismatch — stale or invalid response".to_string());
            }
            drop(txn.tx.send(TxnDialogResponse { approved, pin }));
            Ok(())
        }
        None => Err("No transaction awaiting confirmation".to_string()),
    }
}

/// Clear any in-flight transaction (e.g., on server shutdown).
pub async fn clear_inflight() {
    let mut inflight = INFLIGHT.lock().await;
    if let Some(txn) = inflight.take() {
        drop(txn.tx.send(TxnDialogResponse {
            approved: false,
            pin: None,
        }));
        warn!(target: LOG_TARGET_APP_LOGIC, "MCP: cleared in-flight transaction dialog (request_id={})", txn.request_id);
    }
}
