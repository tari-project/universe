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

use crate::LOG_TARGET_APP_LOGIC;
use crate::configs::config_mcp::ConfigMcp;
use crate::configs::trait_config::ConfigImpl;
use crate::events_emitter::EventsEmitter;
use crate::pin::PinManager;
use crate::wallet::send_gate::{GatedSendRequest, SendOrigin, gated_send};
use log::info;
use tari_transaction_components::tari_amount::{MicroMinotari, Minotari};

pub use crate::wallet::send_gate::TransactionError;

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
    // MCP-specific policy. The user-consent gates (confirmation dialog, rate limiter and
    // the PIN prompt raised while signing) live in `wallet::send_gate::gated_send`, which
    // the in-app send command goes through as well.

    // 1. Check transactions enabled
    let config = ConfigMcp::content().await;
    if !*config.transactions_enabled() {
        return Err(TransactionError::Disabled(
            "Transaction tier is disabled. Enable transactions in MCP settings.".to_string(),
        ));
    }

    // 2. Check PIN is configured. MCP refuses outright without one; a dialog alone is not
    //    enough of a gate for a remote caller.
    if !PinManager::pin_locked().await {
        return Err(TransactionError::NoPinConfigured(
            "No PIN configured. Set up a PIN before enabling MCP transactions.".to_string(),
        ));
    }

    // 3. Parse and validate amount against the MCP per-transaction maximum
    let amount_u64 = validate_amount(&amount, &config).map_err(TransactionError::InvalidAmount)?;
    let amount_display = format!("{} XTM", amount);
    let request_id = SendOrigin::Mcp.new_request_id();

    info!(target: LOG_TARGET_APP_LOGIC, "MCP: send_transaction requested (destination={}, amount={})", destination, amount_display);

    // 4. Rate limit, confirmation dialog, PIN and the actual send
    let result = gated_send(GatedSendRequest {
        origin: SendOrigin::Mcp,
        request_id: request_id.clone(),
        amount,
        destination: destination.clone(),
        payment_id,
    })
    .await;

    match result {
        Ok(()) => {
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
            EventsEmitter::emit_mcp_transaction_result(
                crate::events::McpTransactionResultPayload {
                    request_id,
                    success: false,
                    error: Some(e.to_string()),
                },
            )
            .await;
            Err(e)
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::configs::config_mcp::ConfigMcpContent;

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
}
