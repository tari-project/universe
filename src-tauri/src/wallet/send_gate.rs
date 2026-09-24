// Copyright 2025. The Tari Project
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

//! The single gated entry point for spending funds.
//!
//! Every caller that can move funds (the `send_one_sided_to_stealth_address` Tauri
//! command used by the in-app send flow and by the tapplet bridge, the MCP
//! `send_transaction` tool, and the `burn_to_l2` command) goes through the same
//! gates: [`gated_send`] and [`gated_burn`] share [`pass_gates`]. Two user-facing
//! gates exist:
//!
//! * **PIN** — when a PIN is configured it is requested (and validated, with lockout on
//!   repeated failures) by [`crate::internal_wallet::InternalWallet::get_signing_wallet`],
//!   which [`crate::wallet::minotari_wallet::MinotariWalletManager::send_one_sided_transaction`]
//!   and [`crate::wallet::minotari_wallet::MinotariWalletManager::burn_to_l2`] call
//!   before they create (and so lock the inputs of) the transaction. That is the real
//!   gate: a script running in the webview does not know the PIN. The prompt carries a
//!   [`crate::events::PinPromptContext`] so the user can see the amount and the
//!   destination (or L2 claim key) they are approving.
//! * **Confirmation dialog** — a backend-driven approve/deny dialog emitted to the
//!   frontend. It is required whenever there is no PIN to fall back on (and always for
//!   MCP, which additionally refuses to run at all without a configured PIN).

use std::fmt;
use std::str::FromStr;
use std::sync::LazyLock;
use std::time::Duration;

use log::{info, warn};
use tari_common::configuration::Network;
use tari_transaction_components::tari_amount::{MicroMinotari, Minotari};

use crate::LOG_TARGET_APP_LOGIC;
use crate::events::McpTransactionConfirmationPayload;
use crate::events::PinPromptContext;
use crate::events_emitter::EventsEmitter;
use crate::mcp::rate_limiter::TransactionRateLimiter;
use crate::pin::PinManager;
use crate::wallet::minotari_wallet::{BurnReceipt, MinotariWalletManager};

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

/// Where a send request came from.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum SendOrigin {
    /// The `send_one_sided_to_stealth_address` Tauri command: the in-app send UI, the
    /// tapplet bridge, or anything else able to reach `invoke`.
    App,
    /// The MCP `send_transaction` tool.
    Mcp,
}

impl SendOrigin {
    pub fn as_str(self) -> &'static str {
        match self {
            SendOrigin::App => "app",
            SendOrigin::Mcp => "mcp",
        }
    }

    fn request_id_prefix(self) -> &'static str {
        match self {
            SendOrigin::App => "app_tx",
            SendOrigin::Mcp => "mcp_tx",
        }
    }

    /// Mint an id correlating the confirmation dialog with the result reported for it.
    pub fn new_request_id(self) -> String {
        format!("{}_{}", self.request_id_prefix(), uuid::Uuid::new_v4())
    }

    /// Whether an explicit approve/deny dialog must be shown before signing.
    ///
    /// MCP always confirms. The app confirms only when no PIN is configured, because
    /// with a PIN the signing step already prompts for it (and that prompt shows the
    /// same amount/destination details) — asking twice would just train users to click
    /// through.
    fn requires_confirmation(self, pin_configured: bool) -> bool {
        match self {
            SendOrigin::Mcp => true,
            SendOrigin::App => !pin_configured,
        }
    }

    /// Whether the MCP transaction rate limiter applies.
    fn enforces_rate_limit(self) -> bool {
        matches!(self, SendOrigin::Mcp)
    }
}

pub struct GatedSendRequest {
    pub origin: SendOrigin,
    /// Correlates the confirmation dialog with the result the caller reports for it;
    /// mint it with [`SendOrigin::new_request_id`].
    pub request_id: String,
    pub amount: String,
    pub destination: String,
    pub payment_id: Option<String>,
}

/// A burn of L1 funds, claimable on L2 by `claim_public_key`. Only the in-app UI can
/// ask for one, so the origin is always [`SendOrigin::App`].
pub struct GatedBurnRequest {
    pub request_id: String,
    pub amount: String,
    /// Hex-encoded L2 claim public key.
    pub claim_public_key: String,
    pub payment_id: Option<String>,
}

/// What is being spent, in the terms the user has to approve it in.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum SpendKind {
    Send { destination: String },
    Burn { claim_public_key: String },
}

impl SpendKind {
    pub fn as_str(&self) -> &'static str {
        match self {
            SpendKind::Send { .. } => "send",
            SpendKind::Burn { .. } => "burn",
        }
    }

    /// The counterparty shown to the user: the address for a send, the L2 claim key
    /// for a burn. A burn has no recipient, and the claim key is the only thing that
    /// can ever get the funds back, so that is what the user must be asked to check.
    pub fn counterparty(&self) -> &str {
        match self {
            SpendKind::Send { destination } => destination,
            SpendKind::Burn { claim_public_key } => claim_public_key,
        }
    }

    fn pin_context(
        &self,
        amount_micro_minotari: u64,
        payment_id: Option<String>,
    ) -> PinPromptContext {
        match self {
            SpendKind::Send { destination } => PinPromptContext::Send {
                amount_micro_minotari,
                destination: destination.clone(),
                payment_id,
            },
            SpendKind::Burn { claim_public_key } => PinPromptContext::Burn {
                amount_micro_minotari,
                claim_public_key: claim_public_key.clone(),
                payment_id,
            },
        }
    }
}

/// Proof that a spend has passed the gates. Holds the gate permit for as long as it
/// lives, so drop it only once the transaction has been signed and broadcast.
struct GatePass {
    _permit: tokio::sync::SemaphorePermit<'static>,
    pin_context: PinPromptContext,
}

static TXN_DIALOG_GATE: LazyLock<tokio::sync::Semaphore> =
    LazyLock::new(|| tokio::sync::Semaphore::new(1));

static INFLIGHT: LazyLock<tokio::sync::Mutex<Option<InFlightTxn>>> =
    LazyLock::new(|| tokio::sync::Mutex::new(None));

static TXN_RATE_LIMITER: LazyLock<tokio::sync::Mutex<TransactionRateLimiter>> =
    LazyLock::new(|| tokio::sync::Mutex::new(TransactionRateLimiter::new()));

struct InFlightTxn {
    origin: SendOrigin,
    request_id: String,
    tx: tokio::sync::oneshot::Sender<TxnDialogResponse>,
}

pub struct TxnDialogResponse {
    pub approved: bool,
}

/// Parse an XTM amount string into µT, rejecting unparseable and zero amounts.
pub fn parse_amount(amount: &str) -> Result<u64, TransactionError> {
    let minotari_amount = Minotari::from_str(amount)
        .map_err(|e| TransactionError::InvalidAmount(format!("Invalid amount '{amount}': {e}")))?;
    let amount_u64 = MicroMinotari::from(minotari_amount).as_u64();

    if amount_u64 == 0 {
        return Err(TransactionError::InvalidAmount(
            "Amount must be greater than zero".to_string(),
        ));
    }

    Ok(amount_u64)
}

/// Send funds behind the user-consent gates described in the module docs.
///
/// Returns as soon as the transaction has been signed and broadcast; emitting result
/// events / balance refreshes is left to the caller.
pub async fn gated_send(request: GatedSendRequest) -> Result<(), TransactionError> {
    let GatedSendRequest {
        origin,
        request_id,
        amount,
        destination,
        payment_id,
    } = request;

    let amount_u64 = parse_amount(&amount)?;
    let kind = SpendKind::Send { destination };
    let pass = pass_gates(origin, request_id, &amount, amount_u64, &kind, &payment_id).await?;

    // The PIN dialog (when a PIN is configured) is raised from here on, before the
    // minotari transaction is created, and carries the amount/destination.
    info!(
        target: LOG_TARGET_APP_LOGIC,
        "send gate: executing send (origin={}, destination={}, amount={amount})",
        origin.as_str(),
        kind.counterparty()
    );
    let SpendKind::Send { destination } = kind else {
        unreachable!("gated_send builds a Send kind")
    };
    MinotariWalletManager::send_one_sided_transaction(
        destination,
        amount_u64,
        payment_id,
        Some(pass.pin_context),
    )
    .await
    .map(|_| ())
    .map_err(|e| TransactionError::WalletError(format!("Transaction failed: {e}")))
}

/// Networks whose L2 can claim a burn. Anywhere else the burn would just destroy funds.
pub fn network_supports_burn(network: Network) -> bool {
    matches!(network, Network::Esmeralda)
}

/// Burn funds for L2 behind the same gates as [`gated_send`]. A burn cannot be undone,
/// so it is never allowed to skip a gate a send would have to pass.
pub async fn gated_burn(request: GatedBurnRequest) -> Result<BurnReceipt, TransactionError> {
    let GatedBurnRequest {
        request_id,
        amount,
        claim_public_key,
        payment_id,
    } = request;

    let network = Network::get_current_or_user_setting_or_default();
    if !network_supports_burn(network) {
        return Err(TransactionError::Disabled(format!(
            "Burning to L2 is not available on {network}"
        )));
    }
    let amount_u64 = parse_amount(&amount)?;
    let kind = SpendKind::Burn { claim_public_key };
    let pass = pass_gates(
        SendOrigin::App,
        request_id,
        &amount,
        amount_u64,
        &kind,
        &payment_id,
    )
    .await?;

    info!(
        target: LOG_TARGET_APP_LOGIC,
        "send gate: executing burn (claim_public_key={}, amount={amount})",
        kind.counterparty()
    );
    let SpendKind::Burn { claim_public_key } = kind else {
        unreachable!("gated_burn builds a Burn kind")
    };
    MinotariWalletManager::burn_to_l2(
        claim_public_key,
        amount_u64,
        payment_id,
        Some(pass.pin_context),
    )
    .await
    .map_err(|e| TransactionError::WalletError(format!("Burn failed: {e}")))
}

/// Run the consent gates for one spend: serialise on the gate permit, then show the
/// approve/deny dialog when the origin requires it. On success the returned
/// [`GatePass`] carries the permit and the PIN context to sign under.
async fn pass_gates(
    origin: SendOrigin,
    request_id: String,
    amount: &str,
    amount_u64: u64,
    kind: &SpendKind,
    payment_id: &Option<String>,
) -> Result<GatePass, TransactionError> {
    let pin_configured = PinManager::pin_locked().await;
    let needs_confirmation = origin.requires_confirmation(pin_configured);
    let destination = kind.counterparty();

    info!(
        target: LOG_TARGET_APP_LOGIC,
        "send gate: kind={} origin={} amount={amount} destination={destination} pin_configured={pin_configured} confirmation_dialog={needs_confirmation}",
        kind.as_str(),
        origin.as_str()
    );

    // One send at a time, held until the transaction has been signed and broadcast. This
    // does two jobs: concurrent requests can't race over INFLIGHT, and, when a PIN is
    // configured, the PIN prompt raised while signing is guaranteed to belong to exactly
    // one send. The prompt is answered through a single `pin-dialog-response` event that
    // is delivered to every listener registered at that moment, so without this permit a
    // burst of sends would all be signed by the one PIN entry the user typed for the
    // transaction they could see.
    let permit = TXN_DIALOG_GATE
        .acquire()
        .await
        .map_err(|_| TransactionError::InternalError("Transaction gate closed".to_string()))?;

    if needs_confirmation {
        // Rate limit check (after acquiring gate to avoid burning quota)
        if origin.enforces_rate_limit()
            && !TXN_RATE_LIMITER
                .lock()
                .await
                .check_transaction_allowed()
                .await
        {
            return Err(TransactionError::RateLimited(
                "Transaction rate limit exceeded. Try again later.".to_string(),
            ));
        }

        let (tx, rx) = tokio::sync::oneshot::channel::<TxnDialogResponse>();
        {
            let mut inflight = INFLIGHT.lock().await;
            *inflight = Some(InFlightTxn {
                origin,
                request_id: request_id.clone(),
                tx,
            });
        }

        let amount_display = format!("{amount} XTM");
        info!(
            target: LOG_TARGET_APP_LOGIC,
            "send gate: confirmation dialog emitted (request_id={request_id}, origin={}, destination={destination}, amount={amount_display})",
            origin.as_str()
        );

        EventsEmitter::emit_mcp_transaction_confirmation(McpTransactionConfirmationPayload {
            request_id,
            kind: kind.as_str().to_string(),
            destination: destination.to_string(),
            amount_micro_minotari: amount_u64,
            amount_display,
            origin: origin.as_str().to_string(),
            payment_id: payment_id.clone(),
        })
        .await;

        await_confirmation(rx).await?;
        info!(target: LOG_TARGET_APP_LOGIC, "send gate: transaction approved by user (origin={})", origin.as_str());
    }

    Ok(GatePass {
        _permit: permit,
        pin_context: kind.pin_context(amount_u64, payment_id.clone()),
    })
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

/// Deny and clear any in-flight transaction dialog, whoever asked for it (used when a
/// dialog times out or its channel is gone).
pub async fn clear_inflight() {
    let mut inflight = INFLIGHT.lock().await;
    if let Some(txn) = inflight.take() {
        deny_and_log(txn);
    }
}

/// Deny and clear the in-flight transaction dialog only if it was raised by `origin`.
///
/// The MCP server calls this on shutdown so an agent's pending request doesn't outlive
/// the server; an in-app send that happens to have its dialog open at the same time
/// must not be knocked over by that.
pub async fn clear_inflight_from(origin: SendOrigin) {
    let mut inflight = INFLIGHT.lock().await;
    match inflight.take() {
        Some(txn) if txn.origin == origin => deny_and_log(txn),
        other => *inflight = other,
    }
}

fn deny_and_log(txn: InFlightTxn) {
    drop(txn.tx.send(TxnDialogResponse { approved: false }));
    warn!(
        target: LOG_TARGET_APP_LOGIC,
        "send gate: cleared in-flight transaction dialog (origin={}, request_id={})",
        txn.origin.as_str(),
        txn.request_id
    );
}

#[cfg(test)]
mod tests {
    use super::*;
    use serial_test::serial;

    // =========================================================================
    // Gate policy
    // =========================================================================

    #[test]
    fn app_origin_confirms_only_without_pin() {
        assert!(
            SendOrigin::App.requires_confirmation(false),
            "a send with no PIN configured must be confirmed"
        );
        assert!(
            !SendOrigin::App.requires_confirmation(true),
            "with a PIN configured the PIN prompt is the gate, no second dialog"
        );
    }

    #[test]
    fn mcp_origin_always_confirms() {
        assert!(SendOrigin::Mcp.requires_confirmation(true));
        assert!(SendOrigin::Mcp.requires_confirmation(false));
    }

    #[test]
    fn only_mcp_is_rate_limited() {
        assert!(SendOrigin::Mcp.enforces_rate_limit());
        assert!(!SendOrigin::App.enforces_rate_limit());
    }

    #[test]
    fn spend_kind_shows_the_user_what_the_funds_go_to() {
        let send = SpendKind::Send {
            destination: "addr".to_string(),
        };
        let burn = SpendKind::Burn {
            claim_public_key: "claimkey".to_string(),
        };
        assert_eq!(send.as_str(), "send");
        assert_eq!(burn.as_str(), "burn");
        assert_eq!(send.counterparty(), "addr");
        assert_eq!(burn.counterparty(), "claimkey");
        assert!(matches!(
            send.pin_context(1, None),
            PinPromptContext::Send {
                amount_micro_minotari: 1,
                ..
            }
        ));
        assert!(matches!(
            burn.pin_context(2, Some("memo".to_string())),
            PinPromptContext::Burn { amount_micro_minotari: 2, ref claim_public_key, payment_id: Some(_) }
                if claim_public_key == "claimkey"
        ));
    }

    #[test]
    fn only_esmeralda_supports_burn() {
        assert!(network_supports_burn(Network::Esmeralda));
        for network in [
            Network::MainNet,
            Network::StageNet,
            Network::NextNet,
            Network::LocalNet,
            Network::Igor,
        ] {
            assert!(
                !network_supports_burn(network),
                "{network} must not offer burns"
            );
        }
    }

    #[test]
    fn origins_are_distinguishable_on_the_wire() {
        assert_eq!(SendOrigin::App.as_str(), "app");
        assert_eq!(SendOrigin::Mcp.as_str(), "mcp");
        assert!(SendOrigin::App.new_request_id().starts_with("app_tx_"));
        assert!(SendOrigin::Mcp.new_request_id().starts_with("mcp_tx_"));
        assert_ne!(
            SendOrigin::Mcp.new_request_id(),
            SendOrigin::Mcp.new_request_id(),
            "request ids must be unique per request"
        );
    }

    // =========================================================================
    // parse_amount
    // =========================================================================

    #[test]
    fn parse_amount_valid_integer() {
        assert_eq!(parse_amount("1").expect("valid amount"), 1_000_000);
    }

    #[test]
    fn parse_amount_valid_decimal() {
        assert_eq!(parse_amount("1.5").expect("valid amount"), 1_500_000);
    }

    #[test]
    fn parse_amount_rejects_zero() {
        let err = parse_amount("0").expect_err("zero must be rejected");
        assert!(matches!(err, TransactionError::InvalidAmount(_)));
        assert!(err.to_string().contains("greater than zero"));
    }

    #[test]
    fn parse_amount_rejects_garbage() {
        let err = parse_amount("not_a_number").expect_err("garbage must be rejected");
        assert!(err.to_string().contains("Invalid amount"));
    }

    #[test]
    fn parse_amount_rejects_negative() {
        assert!(parse_amount("-1").is_err());
    }

    // =========================================================================
    // Confirmation plumbing
    // =========================================================================

    #[tokio::test]
    #[serial]
    async fn respond_to_transaction_no_inflight() {
        clear_inflight().await;

        let result = respond_to_transaction("test_id".to_string(), true).await;
        assert!(
            result
                .expect_err("no dialog is pending")
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
                origin: SendOrigin::App,
                request_id: "correct_id".to_string(),
                tx,
            });
        }

        let result = respond_to_transaction("wrong_id".to_string(), true).await;
        assert!(
            result
                .expect_err("stale response must be rejected")
                .contains("Request ID mismatch")
        );

        clear_inflight().await;
    }

    #[tokio::test]
    #[serial]
    async fn respond_to_transaction_matching_id_approved() {
        let (tx, rx) = tokio::sync::oneshot::channel::<TxnDialogResponse>();
        {
            let mut inflight = INFLIGHT.lock().await;
            *inflight = Some(InFlightTxn {
                origin: SendOrigin::App,
                request_id: "match_id".to_string(),
                tx,
            });
        }

        respond_to_transaction("match_id".to_string(), true)
            .await
            .expect("matching id is accepted");

        assert!(rx.await.expect("response delivered").approved);
    }

    #[tokio::test]
    #[serial]
    async fn respond_to_transaction_denied() {
        let (tx, rx) = tokio::sync::oneshot::channel::<TxnDialogResponse>();
        {
            let mut inflight = INFLIGHT.lock().await;
            *inflight = Some(InFlightTxn {
                origin: SendOrigin::App,
                request_id: "deny_id".to_string(),
                tx,
            });
        }

        respond_to_transaction("deny_id".to_string(), false)
            .await
            .expect("matching id is accepted");

        assert!(!rx.await.expect("response delivered").approved);
    }

    #[tokio::test]
    #[serial]
    async fn await_confirmation_denied_is_an_error() {
        let (tx, rx) = tokio::sync::oneshot::channel::<TxnDialogResponse>();
        drop(tx.send(TxnDialogResponse { approved: false }));

        let err = await_confirmation(rx).await.expect_err("denied");
        assert!(matches!(err, TransactionError::Denied(_)));
    }

    #[tokio::test]
    #[serial]
    async fn await_confirmation_approved_is_ok() {
        let (tx, rx) = tokio::sync::oneshot::channel::<TxnDialogResponse>();
        drop(tx.send(TxnDialogResponse { approved: true }));

        await_confirmation(rx).await.expect("approved");
    }

    #[tokio::test]
    #[serial]
    async fn await_confirmation_dropped_channel_is_an_error() {
        let (tx, rx) = tokio::sync::oneshot::channel::<TxnDialogResponse>();
        drop(tx);

        let err = await_confirmation(rx).await.expect_err("channel closed");
        assert!(matches!(err, TransactionError::InternalError(_)));
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
                origin: SendOrigin::App,
                request_id: "clear_test".to_string(),
                tx,
            });
        }

        clear_inflight().await;

        assert!(
            !rx.await.expect("response delivered").approved,
            "clearing an in-flight dialog must deny, never approve"
        );
        assert!(INFLIGHT.lock().await.is_none());
    }

    #[tokio::test]
    #[serial]
    async fn clear_inflight_when_empty() {
        clear_inflight().await;
        // Should not panic on second call
        clear_inflight().await;

        assert!(INFLIGHT.lock().await.is_none());
    }

    #[tokio::test]
    #[serial]
    async fn clear_inflight_from_leaves_other_origin_alone() {
        let (tx, mut rx) = tokio::sync::oneshot::channel::<TxnDialogResponse>();
        {
            let mut inflight = INFLIGHT.lock().await;
            *inflight = Some(InFlightTxn {
                origin: SendOrigin::App,
                request_id: "app_pending".to_string(),
                tx,
            });
        }

        clear_inflight_from(SendOrigin::Mcp).await;

        assert!(
            rx.try_recv().is_err(),
            "an MCP shutdown must not answer the app's dialog"
        );
        let still_pending = INFLIGHT.lock().await;
        assert_eq!(
            still_pending.as_ref().map(|txn| txn.request_id.as_str()),
            Some("app_pending")
        );
        drop(still_pending);

        clear_inflight().await;
    }

    #[tokio::test]
    #[serial]
    async fn clear_inflight_from_denies_matching_origin() {
        let (tx, rx) = tokio::sync::oneshot::channel::<TxnDialogResponse>();
        {
            let mut inflight = INFLIGHT.lock().await;
            *inflight = Some(InFlightTxn {
                origin: SendOrigin::Mcp,
                request_id: "mcp_pending".to_string(),
                tx,
            });
        }

        clear_inflight_from(SendOrigin::Mcp).await;

        assert!(!rx.await.expect("response delivered").approved);
        assert!(INFLIGHT.lock().await.is_none());
    }

    // =========================================================================
    // Gate permit
    // =========================================================================

    /// The permit must cover the whole send, not just the confirmation dialog: a second
    /// request has to wait until the first has released it, PIN or no PIN.
    #[tokio::test]
    #[serial]
    async fn gate_permit_serialises_sends() {
        let first = TXN_DIALOG_GATE.acquire().await.expect("gate open");

        let second =
            tokio::time::timeout(Duration::from_millis(50), TXN_DIALOG_GATE.acquire()).await;
        assert!(
            second.is_err(),
            "second send must block while the first holds the permit"
        );

        drop(first);

        let reacquired = tokio::time::timeout(Duration::from_millis(50), TXN_DIALOG_GATE.acquire())
            .await
            .expect("permit released")
            .expect("gate open");
        drop(reacquired);
    }
}
