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

use std::fmt;
use std::str::FromStr;
use std::sync::LazyLock;
use std::time::Duration;

use crate::LOG_TARGET_APP_LOGIC;
use crate::configs::config_mcp::ConfigMcp;
use crate::configs::trait_config::ConfigImpl;
use crate::events_emitter::EventsEmitter;
use crate::mcp::rate_limiter::TransactionRateLimiter;
use crate::pin::PinManager;
use crate::wallet::minotari_wallet::MinotariWalletManager;
use log::{info, warn};
use tari_transaction_components::tari_amount::{MicroMinotari, Minotari};

const DIALOG_TIMEOUT_SECS: u64 = 120;

#[derive(Debug)]
pub enum TransactionError {
    Disabled(String),
    NoPinConfigured(String),
    InvalidAmount(String),
    RateLimited(String),
    Denied(String),
    Timeout(String),
    WalletError(String),
    InternalError(String),
}

impl fmt::Display for TransactionError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            TransactionError::Disabled(msg)
            | TransactionError::NoPinConfigured(msg)
            | TransactionError::InvalidAmount(msg)
            | TransactionError::RateLimited(msg)
            | TransactionError::Denied(msg)
            | TransactionError::Timeout(msg)
            | TransactionError::WalletError(msg)
            | TransactionError::InternalError(msg) => write!(f, "{}", msg),
        }
    }
}

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
}

fn validate_amount(
    amount: &str,
    config: &crate::configs::config_mcp::ConfigMcpContent,
) -> Result<u64, String> {
    let minotari_amount =
        Minotari::from_str(amount).map_err(|e| format!("Invalid amount '{}': {}", amount, e))?;
    let micro_minotari_amount = MicroMinotari::from(minotari_amount);
    let amount_u64 = micro_minotari_amount.as_u64();

    if amount_u64 == 0 {
        return Err("Amount must be greater than zero".to_string());
    }

    if let Some(max_amount) = config.max_transaction_amount()
        && amount_u64 > *max_amount
    {
        return Err(format!(
            "Amount {} µT exceeds maximum allowed {} µT",
            amount_u64, max_amount
        ));
    }

    Ok(amount_u64)
}

#[derive(serde::Serialize)]
struct SendTransactionSuccess {
    status: &'static str,
    destination: String,
    amount: String,
    amount_micro_minotari: u64,
}

pub async fn send_transaction(
    destination: String,
    amount: String,
    payment_id: Option<String>,
) -> Result<String, TransactionError> {
    // 1. Check transactions enabled
    let config = ConfigMcp::content().await;
    if !*config.transactions_enabled() {
        return Err(TransactionError::Disabled(
            "Transaction tier is disabled. Enable transactions in MCP settings.".to_string(),
        ));
    }

    // 2. Check PIN is configured
    if !PinManager::pin_locked().await {
        return Err(TransactionError::NoPinConfigured(
            "No PIN configured. Set up a PIN before enabling MCP transactions.".to_string(),
        ));
    }

    // 3. Parse and validate amount
    let amount_u64 = validate_amount(&amount, &config).map_err(TransactionError::InvalidAmount)?;

    // 4. Acquire serialization gate (one dialog at a time)
    let _permit = TXN_DIALOG_GATE
        .acquire()
        .await
        .map_err(|_| TransactionError::InternalError("Transaction gate closed".to_string()))?;

    // 5. Rate limit check (after acquiring gate to avoid burning quota)
    if !TXN_RATE_LIMITER
        .lock()
        .await
        .check_transaction_allowed()
        .await
    {
        return Err(TransactionError::RateLimited(
            "Transaction rate limit exceeded. Try again later.".to_string(),
        ));
    }

    // 6. Generate request ID
    let request_id = format!("mcp_tx_{}", uuid::Uuid::new_v4());

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

    // 10. Wait for user confirmation
    await_confirmation(rx).await?;

    // 11. Execute transaction (PIN dialog is triggered by PinManager during signing)
    info!(target: LOG_TARGET_APP_LOGIC, "MCP: executing send_transaction (destination={}, amount={})", destination, amount_display);
    let tx_result = MinotariWalletManager::send_one_sided_transaction(
        destination.clone(),
        amount_u64,
        payment_id,
    )
    .await;

    match tx_result {
        Ok(_displayed_tx) => {
            EventsEmitter::emit_mcp_transaction_result(
                crate::events::McpTransactionResultPayload {
                    request_id,
                    success: true,
                    error: None,
                },
            )
            .await;

            let result = SendTransactionSuccess {
                status: "success",
                destination,
                amount: amount_display,
                amount_micro_minotari: amount_u64,
            };
            serde_json::to_string(&result)
                .map_err(|e| TransactionError::InternalError(e.to_string()))
        }
        Err(e) => {
            let error_msg = format!("Transaction failed: {}", e);
            EventsEmitter::emit_mcp_transaction_result(
                crate::events::McpTransactionResultPayload {
                    request_id,
                    success: false,
                    error: Some(error_msg.clone()),
                },
            )
            .await;
            Err(TransactionError::WalletError(error_msg))
        }
    }
}

async fn await_confirmation(
    rx: tokio::sync::oneshot::Receiver<TxnDialogResponse>,
) -> Result<(), TransactionError> {
    let response = match tokio::time::timeout(Duration::from_secs(DIALOG_TIMEOUT_SECS), rx).await {
        Ok(Ok(response)) => response,
        Ok(Err(_)) => {
            clear_inflight().await;
            return Err(TransactionError::InternalError(
                "Transaction confirmation channel closed unexpectedly".to_string(),
            ));
        }
        Err(_) => {
            clear_inflight().await;
            return Err(TransactionError::Timeout(
                "Transaction timed out waiting for confirmation (120s)".to_string(),
            ));
        }
    };

    if !response.approved {
        return Err(TransactionError::Denied(
            "Transaction denied by user".to_string(),
        ));
    }

    Ok(())
}

/// Called by the Tauri command when the frontend responds to the transaction dialog.
pub async fn respond_to_transaction(request_id: String, approved: bool) -> Result<(), String> {
    let mut inflight = INFLIGHT.lock().await;
    match inflight.take() {
        Some(txn) => {
            if txn.request_id != request_id {
                *inflight = Some(txn);
                return Err("Request ID mismatch — stale or invalid response".to_string());
            }
            drop(txn.tx.send(TxnDialogResponse { approved }));
            Ok(())
        }
        None => Err("No transaction awaiting confirmation".to_string()),
    }
}

/// Clear any in-flight transaction (e.g., on server shutdown).
pub async fn clear_inflight() {
    let mut inflight = INFLIGHT.lock().await;
    if let Some(txn) = inflight.take() {
        drop(txn.tx.send(TxnDialogResponse { approved: false }));
        warn!(target: LOG_TARGET_APP_LOGIC, "MCP: cleared in-flight transaction dialog (request_id={})", txn.request_id);
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::configs::config_mcp::ConfigMcpContent;
    use serial_test::serial;

    // =========================================================================
    // validate_amount
    // =========================================================================

    #[test]
    fn validate_amount_valid_integer() {
        let config = ConfigMcpContent::default();
        let result = validate_amount("1", &config);
        assert!(result.is_ok());
        assert_eq!(result.unwrap(), 1_000_000);
    }

    #[test]
    fn validate_amount_valid_decimal() {
        let config = ConfigMcpContent::default();
        let result = validate_amount("1.5", &config);
        assert!(result.is_ok());
        assert_eq!(result.unwrap(), 1_500_000);
    }

    #[test]
    fn validate_amount_invalid_string() {
        let config = ConfigMcpContent::default();
        let result = validate_amount("not_a_number", &config);
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("Invalid amount"));
    }

    #[test]
    fn validate_amount_empty_string() {
        let config = ConfigMcpContent::default();
        let result = validate_amount("", &config);
        assert!(result.is_err());
    }

    #[test]
    fn validate_amount_exceeds_max() {
        let mut config = ConfigMcpContent::default();
        config.set_max_transaction_amount(Some(500_000)); // 0.5 XTM max
        let result = validate_amount("1", &config); // 1 XTM = 1_000_000 µT
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("exceeds maximum"));
    }

    #[test]
    fn validate_amount_at_max_boundary() {
        let mut config = ConfigMcpContent::default();
        config.set_max_transaction_amount(Some(1_000_000)); // 1 XTM max
        let result = validate_amount("1", &config); // exactly 1 XTM
        assert!(result.is_ok());
        assert_eq!(result.unwrap(), 1_000_000);
    }

    #[test]
    fn validate_amount_no_max_configured() {
        let config = ConfigMcpContent::default();
        let result = validate_amount("999999", &config);
        assert!(result.is_ok());
    }

    #[test]
    fn validate_amount_zero() {
        let config = ConfigMcpContent::default();
        let result = validate_amount("0", &config);
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("greater than zero"));
    }

    #[test]
    fn validate_amount_negative() {
        let config = ConfigMcpContent::default();
        let result = validate_amount("-1", &config);
        assert!(result.is_err());
    }

    // =========================================================================
    // respond_to_transaction
    // =========================================================================

    #[tokio::test]
    #[serial]
    async fn respond_to_transaction_no_inflight() {
        clear_inflight().await;

        let result = respond_to_transaction("test_id".to_string(), true).await;
        assert!(result.is_err());
        assert!(
            result
                .unwrap_err()
                .contains("No transaction awaiting confirmation")
        );
    }

    #[tokio::test]
    #[serial]
    async fn respond_to_transaction_mismatched_id() {
        let (tx, _rx) = tokio::sync::oneshot::channel::<TxnDialogResponse>();
        {
            let mut inflight = INFLIGHT.lock().await;
            *inflight = Some(InFlightTxn {
                request_id: "correct_id".to_string(),
                tx,
            });
        }

        let result = respond_to_transaction("wrong_id".to_string(), true).await;
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("Request ID mismatch"));

        clear_inflight().await;
    }

    #[tokio::test]
    #[serial]
    async fn respond_to_transaction_matching_id_approved() {
        let (tx, rx) = tokio::sync::oneshot::channel::<TxnDialogResponse>();
        {
            let mut inflight = INFLIGHT.lock().await;
            *inflight = Some(InFlightTxn {
                request_id: "match_id".to_string(),
                tx,
            });
        }

        let result = respond_to_transaction("match_id".to_string(), true).await;
        assert!(result.is_ok());

        let response = rx.await.unwrap();
        assert!(response.approved);
    }

    #[tokio::test]
    #[serial]
    async fn respond_to_transaction_denied() {
        let (tx, rx) = tokio::sync::oneshot::channel::<TxnDialogResponse>();
        {
            let mut inflight = INFLIGHT.lock().await;
            *inflight = Some(InFlightTxn {
                request_id: "deny_id".to_string(),
                tx,
            });
        }

        let result = respond_to_transaction("deny_id".to_string(), false).await;
        assert!(result.is_ok());

        let response = rx.await.unwrap();
        assert!(!response.approved);
    }

    // =========================================================================
    // clear_inflight
    // =========================================================================

    #[tokio::test]
    #[serial]
    async fn clear_inflight_with_pending() {
        let (tx, rx) = tokio::sync::oneshot::channel::<TxnDialogResponse>();
        {
            let mut inflight = INFLIGHT.lock().await;
            *inflight = Some(InFlightTxn {
                request_id: "clear_test".to_string(),
                tx,
            });
        }

        clear_inflight().await;

        let response = rx.await.unwrap();
        assert!(!response.approved);

        let inflight = INFLIGHT.lock().await;
        assert!(inflight.is_none());
    }

    #[tokio::test]
    #[serial]
    async fn clear_inflight_when_empty() {
        clear_inflight().await;
        // Should not panic on second call
        clear_inflight().await;

        let inflight = INFLIGHT.lock().await;
        assert!(inflight.is_none());
    }
}
