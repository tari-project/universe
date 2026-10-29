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
//! `send_transaction` tool, the `burn_to_l2` command, the `l2_send` command and the
//! `l2_claim_burn` command) goes through the same gates: [`gated_send`], [`gated_burn`],
//! [`gated_l2_send`] and [`gated_l2_claim`] share [`pass_gates`]. Two user-facing gates exist:
//!
//! * **PIN** — when a PIN is configured it is requested (and validated, with lockout on
//!   repeated failures) by [`crate::internal_wallet::InternalWallet::get_signing_wallet`],
//!   which [`crate::wallet::minotari_wallet::MinotariWalletManager::send_one_sided_transaction`]
//!   and [`crate::wallet::minotari_wallet::MinotariWalletManager::burn_to_l2`] call
//!   before they create (and so lock the inputs of) the transaction, and
//!   [`crate::ootle::OotleWalletManager::send_xtr`] and
//!   [`crate::ootle::OotleWalletManager::claim_burn`] ask for it before they build the L2
//!   transaction. That is the real
//!   gate: a script running in the webview does not know the PIN. The prompt carries a
//!   [`crate::events::PinPromptContext`] so the user can see the amount and the
//!   destination (or L2 claim key) they are approving.
//! * **Confirmation dialog** — a backend-driven approve/deny dialog emitted to the
//!   frontend. It is required whenever there is no PIN to fall back on (and always for
//!   MCP, which additionally refuses to run at all without a configured PIN). Burns
//!   also refuse to run without a PIN, so they never fall back to the dialog alone.

use std::fmt;
use std::str::FromStr;
use std::sync::LazyLock;
use std::time::Duration;

use log::{info, warn};
use tari_common::configuration::Network;
use tari_ootle_wallet_sdk::{OotleAddress, PayRef, crypto::memo::Memo};
use tari_transaction_components::tari_amount::{MicroMinotari, Minotari};

use crate::LOG_TARGET_APP_LOGIC;
use crate::events::McpTransactionConfirmationPayload;
use crate::events::PinPromptContext;
use crate::events_emitter::EventsEmitter;
use crate::mcp::rate_limiter::TransactionRateLimiter;
use crate::ootle::OotleWalletManager;
use crate::pin::PinManager;
use crate::wallet::minotari_wallet::{BurnReceipt, MinotariWalletManager};

const DIALOG_TIMEOUT_SECS: u64 = 120;

#[derive(Debug)]
pub enum TransactionError {
    Disabled(String),
    NoPinConfigured(String),
    InvalidAmount(String),
    InvalidAddress(String),
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
            | TransactionError::InvalidAddress(msg)
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
    /// The `l2_send_from_tapplet` Tauri command, which only the tapplet signer calls.
    Tapplet,
}

impl SendOrigin {
    pub fn as_str(self) -> &'static str {
        match self {
            SendOrigin::App => "app",
            SendOrigin::Mcp => "mcp",
            SendOrigin::Tapplet => "tapplet",
        }
    }

    fn request_id_prefix(self) -> &'static str {
        match self {
            SendOrigin::App => "app_tx",
            SendOrigin::Mcp => "mcp_tx",
            SendOrigin::Tapplet => "tapplet_tx",
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
            SendOrigin::App | SendOrigin::Tapplet => !pin_configured,
        }
    }

    /// Whether a transaction rate limiter applies. MCP and tapplet sends each have their own,
    /// so one can't use up the other's quota.
    fn enforces_rate_limit(self) -> bool {
        matches!(self, SendOrigin::Mcp | SendOrigin::Tapplet)
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

/// An XTR send from one of the wallet's own L2 accounts, asked for by the in-app UI
/// ([`SendOrigin::App`]) or the tapplet signer ([`SendOrigin::Tapplet`]).
pub struct GatedL2SendRequest {
    pub origin: SendOrigin,
    pub app_handle: tauri::AppHandle,
    pub request_id: String,
    pub amount: String,
    /// Ootle address to send to.
    pub destination: String,
    /// Component address of the L2 account paying.
    pub account: String,
    /// Pay reference for the recipient, UTF-8, at most 64 bytes.
    pub pay_ref: Option<String>,
}

/// What is being spent, in the terms the user has to approve it in.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum SpendKind {
    Send {
        destination: String,
    },
    Burn {
        claim_public_key: String,
    },
    L2Send {
        destination: String,
        account: String,
        /// The pay reference the output carries, as text.
        pay_ref: Option<String>,
    },
    L2Claim {
        commitment: String,
    },
}

impl SpendKind {
    pub fn as_str(&self) -> &'static str {
        match self {
            SpendKind::Send { .. } => "send",
            SpendKind::Burn { .. } => "burn",
            SpendKind::L2Send { .. } => "l2_send",
            SpendKind::L2Claim { .. } => "l2_claim",
        }
    }

    /// The counterparty shown to the user: the address for a send, the L2 claim key
    /// for a burn. A burn has no recipient, and the claim key is the only thing that
    /// can ever get the funds back, so that is what the user must be asked to check. A
    /// claim shows the commitment of the burn being claimed.
    pub fn counterparty(&self) -> &str {
        match self {
            SpendKind::Send { destination } | SpendKind::L2Send { destination, .. } => destination,
            SpendKind::Burn { claim_public_key } => claim_public_key,
            SpendKind::L2Claim { commitment } => commitment,
        }
    }

    /// The counterparty as it goes in the logs: an L2 address without its pay reference.
    fn logged_counterparty(&self) -> String {
        match self {
            SpendKind::L2Send { destination, .. } => l2_log_destination(destination),
            _ => self.counterparty().to_string(),
        }
    }

    fn pin_context(
        &self,
        origin: SendOrigin,
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
            SpendKind::L2Send {
                destination,
                account,
                pay_ref,
            } => PinPromptContext::L2Send {
                amount_micro_minotari,
                destination: destination.clone(),
                account: account.clone(),
                pay_ref: pay_ref.clone(),
                origin: origin.as_str().to_string(),
                fee_micro_minotari: None,
            },
            SpendKind::L2Claim { commitment } => PinPromptContext::L2Claim {
                amount_micro_minotari,
                commitment: commitment.clone(),
                fee_micro_minotari: None,
            },
        }
    }

    /// The currency the amount is in: XTR on L2, XTM on L1.
    fn currency(&self) -> &'static str {
        match self {
            SpendKind::L2Send { .. } | SpendKind::L2Claim { .. } => "XTR",
            SpendKind::Send { .. } | SpendKind::Burn { .. } => "XTM",
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
/// Tapplet sends, counted separately from MCP and not tied to the MCP config's limit.
static TAPPLET_RATE_LIMITER: LazyLock<tokio::sync::Mutex<TransactionRateLimiter>> =
    LazyLock::new(|| tokio::sync::Mutex::new(TransactionRateLimiter::new()));
const TAPPLET_SENDS_PER_MINUTE: u32 = 5;

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

/// Networks with an L2 Universe can use. A burn anywhere else would just destroy funds.
pub fn network_supports_l2(network: Network) -> bool {
    matches!(network, Network::Esmeralda)
}

/// Checks run before anything on L2 (and any burn to it) shows a dialog or takes the
/// gate permit. L2 needs a PIN: without one the only gate would be a confirmation
/// dialog, and a script in the webview can answer that.
pub fn check_l2_allowed(network: Network, pin_configured: bool) -> Result<(), TransactionError> {
    if !network_supports_l2(network) {
        return Err(TransactionError::Disabled(format!(
            "Layer 2 is not available on {network}"
        )));
    }
    if !pin_configured {
        return Err(TransactionError::NoPinConfigured(
            "No PIN configured. Set up a PIN before using Layer 2.".to_string(),
        ));
    }
    Ok(())
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

    check_l2_allowed(
        Network::get_current_or_user_setting_or_default(),
        PinManager::pin_locked().await,
    )?;
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

/// Send XTR on L2 behind the same gates as [`gated_send`]. Refused without a PIN or off
/// Esmeralda, and the amount and destination address are checked before any dialog or
/// permit. Returns the L2 transaction id.
pub async fn gated_l2_send(request: GatedL2SendRequest) -> Result<String, TransactionError> {
    let GatedL2SendRequest {
        origin,
        app_handle,
        request_id,
        amount,
        destination,
        account,
        pay_ref,
    } = request;

    check_l2_allowed(
        Network::get_current_or_user_setting_or_default(),
        PinManager::pin_locked().await,
    )?;
    let amount_u64 = parse_amount(&amount)?;
    check_tapplet_amount(origin, amount_u64)?;
    check_tapplet_pay_ref(origin, pay_ref.as_deref())?;
    let address = OotleWalletManager::parse_address(&destination)?;
    let (pay_ref, memo) = l2_send_memo(pay_ref.as_deref(), &address)?.unzip();
    // The parsed form, so the PIN prompt never shows padding the parser trimmed away.
    let kind = SpendKind::L2Send {
        destination: address.to_string(),
        account,
        pay_ref,
    };
    let pass = pass_gates(origin, request_id, &amount, amount_u64, &kind, &None).await?;

    info!(
        target: LOG_TARGET_APP_LOGIC,
        "send gate: executing L2 send (origin={}, destination={}, amount={amount})",
        origin.as_str(),
        kind.logged_counterparty()
    );
    let SpendKind::L2Send { account, .. } = kind else {
        unreachable!("gated_l2_send builds an L2Send kind")
    };
    OotleWalletManager::send_xtr(
        &app_handle,
        &account,
        address,
        amount_u64,
        memo,
        pass.pin_context,
    )
    .await
}

/// An Ootle address for the logs, with any embedded pay reference dropped.
pub fn l2_log_destination(destination: &str) -> String {
    match OotleAddress::from_str(destination.trim()) {
        Ok(address) => address.without_pay_ref().to_string(),
        Err(_) => "<invalid address>".to_string(),
    }
}

/// The pay reference an L2 send carries, as text for the PIN prompt, and the output memo
/// holding it. An explicit `pay_ref` must match the one embedded in the destination
/// address, if there is one; without an explicit one the embedded one is used.
fn l2_send_memo(
    pay_ref: Option<&str>,
    destination: &OotleAddress,
) -> Result<Option<(String, Memo)>, TransactionError> {
    let embedded = destination.pay_ref().map(|p| p.as_bytes());
    let bytes = match (pay_ref.map(str::as_bytes), embedded) {
        (Some(explicit), Some(embedded)) if explicit != embedded => {
            return Err(TransactionError::InvalidAddress(
                "Pay reference differs from the one in the destination address".to_string(),
            ));
        }
        (Some(bytes), _) | (None, Some(bytes)) => bytes,
        (None, None) => return Ok(None),
    };
    if PayRef::new_checked(bytes).is_none() {
        return Err(TransactionError::InvalidAddress(format!(
            "Pay reference must be 1 to {} bytes",
            PayRef::MAX_LEN
        )));
    }
    // Only printable ASCII is shown as text, so the PIN prompt can't show a lookalike of what is sent.
    let shown = if bytes.iter().all(|b| b.is_ascii_graphic() || *b == b' ') {
        String::from_utf8_lossy(bytes).into_owned()
    } else {
        format!("0x{}", hex::encode(bytes))
    };
    let memo = Memo::new_pay_ref_and_message(bytes, "")
        .ok_or_else(|| TransactionError::InvalidAddress("Pay reference too long".to_string()))?;
    Ok(Some((shown, memo)))
}

/// The PIN prompt shows the amount as a JS number divided by 10^6. Above 2^52 micro XTR that
/// quotient can round to a neighbouring micro XTR, so what it shows could differ from what is
/// signed. Below 10^15 the quotient is under 2^30 and always rounds back exactly. Only a
/// tapplet chooses amounts that large unseen.
const MAX_TAPPLET_AMOUNT: u64 = 999_999_999_999_999;

fn check_tapplet_amount(origin: SendOrigin, amount_u64: u64) -> Result<(), TransactionError> {
    if origin == SendOrigin::Tapplet && amount_u64 > MAX_TAPPLET_AMOUNT {
        return Err(TransactionError::InvalidAmount(format!(
            "Amount must be at most {MAX_TAPPLET_AMOUNT} micro XTR"
        )));
    }
    Ok(())
}

/// A tapplet's pay ref is a bridge order id: a hyphenated UUID v4. The signer checks this too,
/// but it runs in the webview.
fn check_tapplet_pay_ref(
    origin: SendOrigin,
    pay_ref: Option<&str>,
) -> Result<(), TransactionError> {
    if origin != SendOrigin::Tapplet {
        return Ok(());
    }
    let is_uuid_v4 = pay_ref.is_some_and(|p| {
        p.len() == 36
            && uuid::Uuid::try_parse(p).is_ok_and(|u| {
                u.get_version_num() == 4 && u.get_variant() == uuid::Variant::RFC4122
            })
    });
    if !is_uuid_v4 {
        return Err(TransactionError::InvalidAddress(
            "Pay reference must be a UUID v4".to_string(),
        ));
    }
    Ok(())
}

/// Claim an L1 burn on L2 behind the same gates as [`gated_l2_send`]. Refused without a
/// PIN or off Esmeralda, and only for a burn whose proof file is there to claim. Returns
/// the L2 transaction id.
pub async fn gated_l2_claim(
    app_handle: tauri::AppHandle,
    request_id: String,
    commitment: String,
) -> Result<String, TransactionError> {
    check_l2_allowed(
        Network::get_current_or_user_setting_or_default(),
        PinManager::pin_locked().await,
    )?;
    let (file_name, proof) = OotleWalletManager::find_claimable_burn(&commitment)?;
    let amount_u64 = proof.claim_proof.value;
    let amount = format!("{}.{:06}", amount_u64 / 1_000_000, amount_u64 % 1_000_000);
    let kind = SpendKind::L2Claim { commitment };
    let pass = pass_gates(
        SendOrigin::App,
        request_id,
        &amount,
        amount_u64,
        &kind,
        &None,
    )
    .await?;

    info!(
        target: LOG_TARGET_APP_LOGIC,
        "send gate: executing L2 claim (commitment={}, amount={amount})",
        kind.counterparty()
    );
    OotleWalletManager::claim_burn(&app_handle, file_name, proof, pass.pin_context).await
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
    let logged_destination = kind.logged_counterparty();

    info!(
        target: LOG_TARGET_APP_LOGIC,
        "send gate: kind={} origin={} amount={amount} destination={logged_destination} pin_configured={pin_configured} confirmation_dialog={needs_confirmation}",
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

    // Rate limit check (after acquiring gate to avoid burning quota). Tapplet sends behind a
    // PIN skip the confirmation dialog, so this sits outside it.
    if origin.enforces_rate_limit() {
        let allowed = match origin {
            SendOrigin::Tapplet => TAPPLET_RATE_LIMITER
                .lock()
                .await
                .check_allowed(TAPPLET_SENDS_PER_MINUTE),
            _ => {
                TXN_RATE_LIMITER
                    .lock()
                    .await
                    .check_transaction_allowed()
                    .await
            }
        };
        if !allowed {
            return Err(TransactionError::RateLimited(
                "Transaction rate limit exceeded. Try again later.".to_string(),
            ));
        }
    }

    if needs_confirmation {
        let (tx, rx) = tokio::sync::oneshot::channel::<TxnDialogResponse>();
        {
            let mut inflight = INFLIGHT.lock().await;
            *inflight = Some(InFlightTxn {
                origin,
                request_id: request_id.clone(),
                tx,
            });
        }

        let amount_display = format!("{amount} {}", kind.currency());
        info!(
            target: LOG_TARGET_APP_LOGIC,
            "send gate: confirmation dialog emitted (request_id={request_id}, origin={}, destination={logged_destination}, amount={amount_display})",
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
        pin_context: kind.pin_context(origin, amount_u64, payment_id.clone()),
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
    fn mcp_and_tapplet_sends_are_rate_limited() {
        assert!(SendOrigin::Mcp.enforces_rate_limit());
        assert!(!SendOrigin::App.enforces_rate_limit());
        assert!(SendOrigin::Tapplet.enforces_rate_limit());
    }

    #[test]
    fn tapplet_origin_confirms_like_the_app() {
        assert!(SendOrigin::Tapplet.requires_confirmation(false));
        assert!(!SendOrigin::Tapplet.requires_confirmation(true));
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
            send.pin_context(SendOrigin::App, 1, None),
            PinPromptContext::Send {
                amount_micro_minotari: 1,
                ..
            }
        ));
        assert!(matches!(
            burn.pin_context(SendOrigin::App, 2, Some("memo".to_string())),
            PinPromptContext::Burn { amount_micro_minotari: 2, ref claim_public_key, payment_id: Some(_) }
                if claim_public_key == "claimkey"
        ));
    }

    #[test]
    fn l2_send_asks_about_the_l2_address_in_xtr() {
        let send = SpendKind::L2Send {
            destination: "otl_esm_addr".to_string(),
            account: "component_abc".to_string(),
            pay_ref: None,
        };
        assert_eq!(send.as_str(), "l2_send");
        assert_eq!(send.counterparty(), "otl_esm_addr");
        assert_eq!(send.currency(), "XTR");
        assert_eq!(
            SpendKind::Send {
                destination: "addr".to_string()
            }
            .currency(),
            "XTM"
        );
        assert!(matches!(
            send.pin_context(SendOrigin::App, 3, None),
            PinPromptContext::L2Send { amount_micro_minotari: 3, ref destination, ref account, pay_ref: None, ref origin, fee_micro_minotari: None }
                if destination == "otl_esm_addr" && account == "component_abc" && origin == "app"
        ));
    }

    #[test]
    fn l2_send_pin_prompt_shows_a_tapplet_origin_and_the_pay_ref() {
        let send = SpendKind::L2Send {
            destination: "otl_esm_addr".to_string(),
            account: "component_abc".to_string(),
            pay_ref: Some("bridge-ref".to_string()),
        };
        assert!(matches!(
            send.pin_context(SendOrigin::Tapplet, 3, None),
            PinPromptContext::L2Send { pay_ref: Some(ref pay_ref), ref origin, .. }
                if pay_ref == "bridge-ref" && origin == "tapplet"
        ));
    }

    #[test]
    fn l2_claim_asks_about_the_burn_commitment_in_xtr() {
        let claim = SpendKind::L2Claim {
            commitment: "dae29ac8".to_string(),
        };
        assert_eq!(claim.as_str(), "l2_claim");
        assert_eq!(claim.counterparty(), "dae29ac8");
        assert_eq!(claim.currency(), "XTR");
        assert!(matches!(
            claim.pin_context(SendOrigin::App, 4, None).with_fee(7),
            PinPromptContext::L2Claim { amount_micro_minotari: 4, ref commitment, fee_micro_minotari: Some(7) }
                if commitment == "dae29ac8"
        ));
    }

    #[test]
    fn only_esmeralda_supports_l2() {
        assert!(network_supports_l2(Network::Esmeralda));
        for network in [
            Network::MainNet,
            Network::StageNet,
            Network::NextNet,
            Network::LocalNet,
            Network::Igor,
        ] {
            assert!(!network_supports_l2(network), "{network} must not offer L2");
        }
    }

    #[test]
    fn l2_needs_a_pin_and_esmeralda() {
        assert!(check_l2_allowed(Network::Esmeralda, true).is_ok());
        assert!(matches!(
            check_l2_allowed(Network::Esmeralda, false),
            Err(TransactionError::NoPinConfigured(_))
        ));
        assert!(matches!(
            check_l2_allowed(Network::MainNet, true),
            Err(TransactionError::Disabled(_))
        ));
    }

    #[test]
    fn origins_are_distinguishable_on_the_wire() {
        assert_eq!(SendOrigin::App.as_str(), "app");
        assert_eq!(SendOrigin::Mcp.as_str(), "mcp");
        assert!(SendOrigin::App.new_request_id().starts_with("app_tx_"));
        assert!(SendOrigin::Mcp.new_request_id().starts_with("mcp_tx_"));
        assert_eq!(SendOrigin::Tapplet.as_str(), "tapplet");
        assert!(
            SendOrigin::Tapplet
                .new_request_id()
                .starts_with("tapplet_tx_")
        );
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
    // L2 pay reference
    // =========================================================================

    fn ootle_address() -> OotleAddress {
        let key =
            tari_template_lib::prelude::RistrettoPublicKeyBytes::try_from([1u8; 32].as_slice())
                .expect("key bytes");
        OotleAddress::new(tari_ootle_wallet_sdk::Network::Esmeralda, key, key)
    }

    fn memo_pay_ref(memo: &Memo) -> Vec<u8> {
        memo.as_pay_ref().expect("memo has a pay ref").to_vec()
    }

    #[test]
    fn l2_send_memo_carries_an_explicit_pay_ref() {
        let pay_ref = "0f8fad5b-d9cb-469f-a165-70867728950e";
        let (shown, memo) = l2_send_memo(Some(pay_ref), &ootle_address())
            .expect("valid pay ref")
            .expect("a memo");
        assert_eq!(shown, pay_ref);
        assert_eq!(memo_pay_ref(&memo), pay_ref.as_bytes());
    }

    #[test]
    fn l2_send_memo_falls_back_to_the_address_pay_ref() {
        let embedded = PayRef::new_checked(b"from-address".as_slice()).expect("pay ref");
        let address = ootle_address().with_pay_ref(embedded);

        let (shown, memo) = l2_send_memo(None, &address)
            .expect("no pay ref")
            .expect("a memo");
        assert_eq!(shown, "from-address");
        assert_eq!(memo_pay_ref(&memo), b"from-address");

        let (_, same) = l2_send_memo(Some("from-address"), &address)
            .expect("same pay ref")
            .expect("a memo");
        assert_eq!(memo_pay_ref(&same), b"from-address");
    }

    #[test]
    fn l2_send_memo_rejects_a_pay_ref_that_differs_from_the_address_one() {
        let embedded = PayRef::new_checked(b"from-address".as_slice()).expect("pay ref");
        let address = ootle_address().with_pay_ref(embedded);
        let err = l2_send_memo(Some("explicit"), &address).expect_err("rejected");
        assert!(matches!(err, TransactionError::InvalidAddress(_)));
    }

    #[test]
    fn l2_logs_drop_the_address_pay_ref() {
        let plain = ootle_address().to_string();
        let embedded = PayRef::new_checked(b"secret-ref".as_slice()).expect("pay ref");
        let with_ref = ootle_address().with_pay_ref(embedded).to_string();
        assert_ne!(plain, with_ref);

        assert_eq!(l2_log_destination(&with_ref), plain);
        assert_eq!(l2_log_destination(&format!("  {with_ref} ")), plain);
        assert_eq!(l2_log_destination("garbage"), "<invalid address>");

        let send = SpendKind::L2Send {
            destination: with_ref.clone(),
            account: "component_abc".to_string(),
            pay_ref: Some("secret-ref".to_string()),
        };
        assert_eq!(send.logged_counterparty(), plain);
        assert_eq!(
            send.counterparty(),
            with_ref,
            "the PIN prompt still shows the full address"
        );
        let l1 = SpendKind::Send {
            destination: "addr".to_string(),
        };
        assert_eq!(l1.logged_counterparty(), "addr");
    }

    #[test]
    fn l2_send_memo_shows_a_pay_ref_that_is_not_printable_ascii_in_hex() {
        for bytes in [
            vec![0xff, 0xfe, b'a'],
            "café".as_bytes().to_vec(),
            "ref\u{200D}".as_bytes().to_vec(),
            "line\nbreak".as_bytes().to_vec(),
        ] {
            let embedded = PayRef::new_checked(bytes.clone()).expect("pay ref");
            let address = ootle_address().with_pay_ref(embedded);
            let (shown, memo) = l2_send_memo(None, &address)
                .expect("the recipient's bytes are sent")
                .expect("a memo");
            assert_eq!(memo_pay_ref(&memo), bytes.as_slice());
            assert_eq!(shown, format!("0x{}", hex::encode(&bytes)), "{bytes:?}");
        }
    }

    #[test]
    fn tapplet_amounts_stay_within_what_the_pin_prompt_shows_exactly() {
        assert!(check_tapplet_amount(SendOrigin::Tapplet, MAX_TAPPLET_AMOUNT).is_ok());
        let err = check_tapplet_amount(SendOrigin::Tapplet, MAX_TAPPLET_AMOUNT + 1)
            .expect_err("too large for the prompt");
        assert!(matches!(err, TransactionError::InvalidAmount(_)));
        assert!(check_tapplet_amount(SendOrigin::App, MAX_TAPPLET_AMOUNT + 1).is_ok());
    }

    #[test]
    fn tapplet_pay_refs_must_be_uuid_v4() {
        let v4 = "3f2b8c1e-9a4d-4e6f-8b2a-1c3d5e7f9a0b";
        assert!(check_tapplet_pay_ref(SendOrigin::Tapplet, Some(v4)).is_ok());
        assert!(check_tapplet_pay_ref(SendOrigin::Tapplet, Some(&v4.to_uppercase())).is_ok());
        for bad in [
            None,
            Some("not-a-uuid"),
            Some("3f2b8c1e9a4d4e6f8b2a1c3d5e7f9a0b"),
            Some("{3f2b8c1e-9a4d-4e6f-8b2a-1c3d5e7f9a0b}"),
            Some("3f2b8c1e-9a4d-1e6f-8b2a-1c3d5e7f9a0b"),
            Some("3f2b8c1e-9a4d-4e6f-cb2a-1c3d5e7f9a0b"),
        ] {
            let err = check_tapplet_pay_ref(SendOrigin::Tapplet, bad).expect_err("refused");
            assert!(
                matches!(err, TransactionError::InvalidAddress(_)),
                "{bad:?}"
            );
        }
        assert!(check_tapplet_pay_ref(SendOrigin::App, Some("anything")).is_ok());
        assert!(check_tapplet_pay_ref(SendOrigin::App, None).is_ok());
    }

    #[test]
    fn l2_send_memo_is_empty_without_any_pay_ref() {
        assert!(l2_send_memo(None, &ootle_address()).expect("ok").is_none());
    }

    #[test]
    fn l2_send_memo_rejects_an_empty_or_oversized_pay_ref() {
        let too_long = "a".repeat(PayRef::MAX_LEN + 1);
        for pay_ref in ["", too_long.as_str()] {
            let err = l2_send_memo(Some(pay_ref), &ootle_address()).expect_err("rejected");
            assert!(matches!(err, TransactionError::InvalidAddress(_)));
        }
        let longest = "a".repeat(PayRef::MAX_LEN);
        assert!(l2_send_memo(Some(&longest), &ootle_address()).is_ok());
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
