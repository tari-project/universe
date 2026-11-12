// Copyright 2026. The Tari Project
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

//! Sending XTR from an L2 account, the way tari_walletd's stealth transfer handler and
//! its web UI do it: dry run until the fee settles, then build at that fee and submit.
//! Shielding and unshielding are the same transfer, paid to the account's own address.

use std::time::Duration;

use anyhow::{anyhow, bail};
use log::warn;
use serde::{Deserialize, Serialize};
use tari_crypto::tari_utilities::ByteArray;
use tari_ootle_common_types::{Epoch, optional::Optional};
use tari_ootle_transaction::{Transaction, TransactionId};
use tari_ootle_wallet_sdk::{
    OotleAddress,
    apis::{
        confidential_transfer::UtxoInputSelection,
        stealth_transfer::{BadgeUsage, StealthTransferParams, TransferFeeParams, TransferOutput},
    },
    crypto::{memo::Memo, pay_to::PayTo},
    models::{AccountWithAddress, TransactionContext, TransactionStatus, WalletLockDropGuard},
    network::WalletNetworkInterface,
};
use tari_ootle_wallet_sdk_services::transaction_service::TransactionServiceHandle;
use tari_ootle_wallet_storage_sqlite::SqliteWalletStore;
use tari_template_lib::{
    prelude::RistrettoPublicKeyBytes,
    types::{Amount, constants::STEALTH_TARI_RESOURCE_ADDRESS},
};

use super::{
    LOG_TARGET, OotleSdk,
    claim::{self, Pending},
};
use crate::wallet::minotari_wallet::MinotariWalletManager;

/// Same as tari_walletd: about an hour at the 20 minute epoch target.
pub(super) const VALIDITY_EPOCHS: u64 = 3;
/// Same as tari_walletd: dry runs before giving up on the fee settling.
const MAX_FEE_ROUNDS: usize = 5;
/// The fee is whatever the indexer's dry run says and the engine never refunds it, so a
/// bad or tampered reply could sweep the account. Cap the fee at 0.1 XTR to bound
/// the damage while allowing headroom for transfers on supported networks.
pub(super) const MAX_L2_FEE: u64 = 100_000;
/// Every indexer call made while the send gate permit is held gets this long, so a
/// stalled indexer can't wedge every L1 and L2 spend behind it.
const INDEXER_TIMEOUT: Duration = Duration::from_secs(30);

/// Sends `amount` micro XTR from `account` to `destination` as a blinded stealth output
/// carrying `memo`.
/// Fails before anything is submitted if the account can't cover the amount and fee, or
/// the fee is over [`MAX_L2_FEE`]. `approve_fee` gets the settled fee before anything is
/// signed for real, and stops the send by returning an error.
pub async fn send_xtr(
    sdk: &OotleSdk,
    transactions: &TransactionServiceHandle,
    account: AccountWithAddress,
    destination: OotleAddress,
    amount: u64,
    memo: Option<Memo>,
    approve_fee: impl AsyncFnOnce(u64) -> Result<(), anyhow::Error>,
) -> Result<TransactionId, anyhow::Error> {
    let output = TransferOutput {
        address: destination,
        revealed_amount: Amount::zero(),
        blinded_amount: amount,
        memo,
        pay_to: PayTo::StealthPublicKey,
    };
    let params = transfer_params(sdk, UtxoInputSelection::PreferRevealed, output).await?;
    let params = settle_fee(sdk, transactions, &account, params, |_| Ok(())).await?;
    sign_and_submit(
        sdk,
        transactions,
        account,
        params,
        Pending::Send,
        approve_fee,
    )
    .await
}

/// Which way a conversion moves an account's own XTR.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum Conversion {
    /// Revealed (the account vault) to confidential (a stealth UTXO).
    Shield,
    /// Confidential (stealth UTXOs) to revealed (the account vault).
    Unshield,
}

impl Conversion {
    pub fn as_str(self) -> &'static str {
        match self {
            Conversion::Shield => "shield",
            Conversion::Unshield => "unshield",
        }
    }

    /// Spends only the side being converted, fee included, so the other side is never
    /// touched. A preference would quietly top up a short balance from the other side, and
    /// converting confidential to confidential (or revealed to revealed) only burns a fee.
    fn input_selection(self) -> UtxoInputSelection {
        match self {
            Conversion::Shield => UtxoInputSelection::RevealedOnly,
            Conversion::Unshield => UtxoInputSelection::ConfidentialOnly,
        }
    }

    /// The output paying `amount` to `address` (the account's own) on the other side. A
    /// revealed output is deposited into the account the address names.
    fn output(self, address: OotleAddress, amount: u64) -> TransferOutput {
        let (revealed_amount, blinded_amount) = match self {
            Conversion::Shield => (Amount::zero(), amount),
            Conversion::Unshield => (Amount::from(amount), 0),
        };
        TransferOutput {
            address,
            revealed_amount,
            blinded_amount,
            memo: None,
            pay_to: PayTo::StealthPublicKey,
        }
    }

    /// What the account can spend on the side being converted: unlocked vault funds for a
    /// shield, unspent stealth UTXOs for an unshield.
    fn available(self, sdk: &OotleSdk, account: &AccountWithAddress) -> Result<u64, anyhow::Error> {
        let component = account.component_address();
        let available = match self {
            Conversion::Shield => sdk
                .accounts_api()
                .get_vault_by_resource(component, &STEALTH_TARI_RESOURCE_ADDRESS)
                .optional()?
                .map(|vault| vault.available_revealed_balance())
                .unwrap_or_default(),
            Conversion::Unshield => sdk
                .stealth_outputs_api()
                .get_unspent_balance_for_account_resource(
                    component,
                    &STEALTH_TARI_RESOURCE_ADDRESS,
                )?,
        };
        available
            .to_u64_checked()
            .ok_or_else(|| anyhow!("The {} balance is too large to convert", self.as_str()))
    }
}

/// Moves `amount` micro XTR of `account`'s own funds between its revealed and confidential
/// balances. The fee comes out of the side being converted, so a shield of X takes X + fee
/// from the revealed balance and adds X to the confidential one, and an unshield the
/// opposite. Fails before anything is submitted, like [`send_xtr`], if that side can't
/// cover the amount and fee or the fee is over [`MAX_L2_FEE`].
pub async fn convert_xtr(
    sdk: &OotleSdk,
    transactions: &TransactionServiceHandle,
    account: AccountWithAddress,
    conversion: Conversion,
    amount: u64,
    approve_fee: impl AsyncFnOnce(u64) -> Result<(), anyhow::Error>,
) -> Result<TransactionId, anyhow::Error> {
    let output = conversion.output(account.address().clone(), amount);
    let params = transfer_params(sdk, conversion.input_selection(), output).await?;
    let params = settle_fee(sdk, transactions, &account, params, |_| Ok(())).await?;
    let pending = Pending::Conversion { conversion };
    sign_and_submit(sdk, transactions, account, params, pending, approve_fee).await
}

/// The most `account` can convert in one transaction once the fee is paid: everything on
/// that side less the fee, which is settled with a dry run of exactly that conversion.
/// Nothing is submitted and each dry run releases the inputs it locked; the caller holds
/// the send gate permit so no real spend is selecting inputs at the same time.
pub async fn max_conversion(
    sdk: &OotleSdk,
    transactions: &TransactionServiceHandle,
    account: AccountWithAddress,
    conversion: Conversion,
) -> Result<u64, anyhow::Error> {
    let available = conversion.available(sdk, &account)?;
    let address = account.address().clone();
    let output = conversion.output(address.clone(), available);
    let params = transfer_params(sdk, conversion.input_selection(), output).await?;
    // Each round pays the fee out of the same balance, so the amount shrinks as it rises.
    let params = settle_fee(sdk, transactions, &account, params, |params| {
        let amount = sweep_amount(available, params.max_fee)?;
        params.outputs = vec![conversion.output(address.clone(), amount)];
        Ok(())
    })
    .await?;
    sweep_amount(available, params.max_fee)
}

/// `available` less `fee`, refused when nothing would be left to convert.
fn sweep_amount(available: u64, fee: u64) -> Result<u64, anyhow::Error> {
    match available.checked_sub(fee) {
        Some(amount) if amount > 0 => Ok(amount),
        _ => bail!("The balance of {available} micro TARI doesn't cover the {fee} micro TARI fee"),
    }
}

/// A dry run of one XTR output paid from `input_selection`, at a placeholder fee of 1 for
/// [`settle_fee`] to raise.
async fn transfer_params(
    sdk: &OotleSdk,
    input_selection: UtxoInputSelection,
    output: TransferOutput,
) -> Result<StealthTransferParams, anyhow::Error> {
    let epoch = with_indexer_timeout(sdk.get_network_interface().get_current_epoch()).await??;
    Ok(StealthTransferParams {
        fee_params: TransferFeeParams::new(input_selection),
        input_selection,
        outputs: vec![output],
        badge_usage: BadgeUsage::None,
        resource_address: STEALTH_TARI_RESOURCE_ADDRESS,
        max_fee: 1,
        max_epoch: Epoch(epoch.as_u64().saturating_add(VALIDITY_EPOCHS)),
        is_dry_run: true,
    })
}

/// Has the user approve the settled fee, then builds the transfer for real and submits it,
/// tracked as `pending`.
async fn sign_and_submit(
    sdk: &OotleSdk,
    transactions: &TransactionServiceHandle,
    account: AccountWithAddress,
    mut params: StealthTransferParams,
    pending: Pending,
    approve_fee: impl AsyncFnOnce(u64) -> Result<(), anyhow::Error>,
) -> Result<TransactionId, anyhow::Error> {
    approve_fee(params.max_fee).await?;
    params.is_dry_run = false;

    let context = TransactionContext::with_accounts([*account.component_address()]);
    let (lock, transaction) = build(sdk, account, params).await?;
    submit(sdk, transactions, transaction, context, Some(lock), pending).await
}

/// Submits `transaction` and returns its id unless it definitely failed. It's tracked as
/// `pending` before it goes out, so its outcome is reported whenever it settles.
///
/// A transport error is not a failure: the SDK keeps the transaction `New` and resubmits
/// it on its next poll, so it stays tracked and `lock` keeps its inputs until the wallet
/// releases them on finalize, the same as for a transaction the network took. Only an
/// explicit rejection, or a transaction the transaction service answered that it did not
/// store, fails and drops `lock`, which frees the inputs.
///
/// When the transaction service doesn't answer in time, the request may still be queued
/// and the wallet may store the transaction after it was read as absent, so the id is
/// returned as pending and `lock` stays. If the wallet stores the transaction, the lock is
/// linked to it and released on finalize. If it never does, the SDK clears the unlinked
/// lock once it times out, and a late store then fails to link it.
pub(super) async fn submit(
    sdk: &OotleSdk,
    transactions: &TransactionServiceHandle,
    transaction: Transaction,
    context: TransactionContext,
    lock: Option<WalletLockDropGuard<'_, SqliteWalletStore>>,
    pending: Pending,
) -> Result<TransactionId, anyhow::Error> {
    let dir = MinotariWalletManager::burn_proofs_dir()?;
    let id = transaction.calculate_id();
    claim::track(&dir, id, pending);
    let submitted = Submitted::from(
        with_indexer_timeout(transactions.submit_transaction_with_opts(
            transaction,
            Some(context),
            lock.as_ref().map(|l| l.id()),
        ))
        .await,
    );
    let stored = sdk
        .transaction_api()
        .get(id)
        .optional()
        .map(|tx| tx.map(|tx| (tx.status, tx.invalid_reason)))
        .map_err(|e| e.to_string());
    if let Some(e) = failure(&submitted, stored) {
        claim::untrack(&dir, id);
        return Err(e);
    }
    match submitted {
        Submitted::Answered(Ok(())) => {}
        Submitted::Answered(Err(e)) => {
            warn!(target: LOG_TARGET, "Submitting {id} failed, the wallet will resubmit it: {e}")
        }
        Submitted::TimedOut(e) => warn!(
            target: LOG_TARGET,
            "Submitting {id} did not finish ({e}), so it is reported pending and its inputs stay locked"
        ),
    }
    if let Some(lock) = lock {
        lock.keep_locked();
    }
    Ok(id)
}

/// What the transaction service made of a submission.
enum Submitted {
    /// The service answered. Its error means the wallet did not store the transaction: the
    /// service links the lock in the write that stores it, and reports no error after that.
    /// A dropped request is also an answer, as nothing is left to store it.
    Answered(Result<(), String>),
    /// The service did not answer in time. The request may still be queued, so the wallet
    /// may yet store the transaction.
    TimedOut(String),
}

impl<T, E: std::fmt::Display> From<Result<Result<T, E>, anyhow::Error>> for Submitted {
    fn from(result: Result<Result<T, E>, anyhow::Error>) -> Self {
        match result {
            Ok(answer) => Self::Answered(answer.map(drop).map_err(|e| e.to_string())),
            Err(timeout) => Self::TimedOut(timeout.to_string()),
        }
    }
}

/// Why a submission failed for good, from what the transaction service returned and what
/// the wallet stored for the transaction, or `None` while it may still go through. The
/// SDK returns the id even when the network rejects the submission outright and only
/// records the rejection on the stored transaction. When the wallet can't be read, or the
/// service didn't answer in time, the outcome is unknown, so the transaction is treated as
/// submitted.
fn failure(
    submitted: &Submitted,
    stored: Result<Option<(TransactionStatus, Option<String>)>, String>,
) -> Option<anyhow::Error> {
    match (submitted, stored) {
        (_, Ok(Some((status, reason)))) => rejection(status, reason.as_deref()),
        (Submitted::Answered(Err(e)), Ok(None)) => {
            Some(anyhow!("The L2 transaction was not submitted: {e}"))
        }
        (Submitted::Answered(Ok(())), Ok(None)) => None,
        (Submitted::TimedOut(_), Ok(None)) => None,
        (_, Err(e)) => {
            warn!(target: LOG_TARGET, "Could not read back a submitted L2 transaction: {e}");
            None
        }
    }
}

fn rejection(status: TransactionStatus, reason: Option<&str>) -> Option<anyhow::Error> {
    matches!(
        status,
        TransactionStatus::InvalidTransaction | TransactionStatus::Rejected
    )
    .then(|| {
        anyhow!(
            "The network rejected it: {}",
            reason.unwrap_or("no reason given")
        )
    })
}

/// Dry runs the transfer, raising the fee to what the run reports until a build at a
/// fee covers what it's charged, and returns the params at that fee. Input selection
/// targets amount + fee, so the fee changes the shape of the transaction being priced.
/// `fit` runs before every dry run, so the outputs can follow the fee (a sweep pays it out
/// of the amount).
async fn settle_fee(
    sdk: &OotleSdk,
    transactions: &TransactionServiceHandle,
    account: &AccountWithAddress,
    mut params: StealthTransferParams,
    fit: impl Fn(&mut StealthTransferParams) -> Result<(), anyhow::Error>,
) -> Result<StealthTransferParams, anyhow::Error> {
    for _ in 0..MAX_FEE_ROUNDS {
        fit(&mut params)?;
        let (lock, transaction) = build(sdk, account.clone(), params.clone()).await?;
        lock.release();
        let result = with_indexer_timeout(transactions.submit_dry_run_transaction(transaction))
            .await?
            .map_err(|e| anyhow!("The L2 fee estimate failed: {e}"))?;
        let finalize = result.finalize;
        if finalize.charged_fees() <= params.max_fee {
            if let Some(reason) = finalize.any_reject() {
                bail!("The L2 transaction would be rejected: {reason}");
            }
            return Ok(params);
        }
        params.max_fee = check_fee(finalize.required_fees(), MAX_L2_FEE)?;
    }
    bail!("The L2 fee estimate did not settle after {MAX_FEE_ROUNDS} dry runs")
}

/// Refuses a fee above `ceiling`, returning it otherwise.
pub(super) fn check_fee(fee: u64, ceiling: u64) -> Result<u64, anyhow::Error> {
    if fee > ceiling {
        bail!("The network asked for a fee of {fee} micro TARI, over the {ceiling} limit");
    }
    Ok(fee)
}

/// Runs an indexer call under [`INDEXER_TIMEOUT`].
pub(super) async fn with_indexer_timeout<T>(
    call: impl Future<Output = T>,
) -> Result<T, anyhow::Error> {
    with_timeout(INDEXER_TIMEOUT, call).await
}

async fn with_timeout<T>(
    limit: Duration,
    call: impl Future<Output = T>,
) -> Result<T, anyhow::Error> {
    tokio::time::timeout(limit, call).await.map_err(|_| {
        anyhow!(
            "The L2 indexer didn't answer within {} seconds",
            limit.as_secs()
        )
    })
}

/// Builds and signs the transfer. The returned guard holds the spent inputs locked
/// until it's released, kept, or dropped.
async fn build(
    sdk: &OotleSdk,
    account: AccountWithAddress,
    params: StealthTransferParams,
) -> Result<(WalletLockDropGuard<'_, SqliteWalletStore>, Transaction), anyhow::Error> {
    let (lock, transfer) =
        with_indexer_timeout(sdk.stealth_transfer_api().transfer(account, params)).await??;
    let main_pk = RistrettoPublicKeyBytes::try_from(transfer.main_signer.public_key().as_bytes())?;
    let main_signer = sdk.signer_api().with_context(&main_pk);
    let transaction = match transfer.additional_signer.as_ref() {
        Some(signer) => main_signer.sign(signer.key_id, transfer.transaction)?,
        None => transfer.transaction.finish(),
    };
    let transaction = transfer
        .utxo_spend_keys
        .iter()
        .try_fold(transaction, |tx, key| {
            main_signer.sign_with_stealth_key(key, tx)
        })?;
    let transaction = sdk
        .signer_api()
        .sign(transfer.main_signer.key_id, transaction)?;
    Ok((lock, transaction))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn only_a_rejection_or_an_unstored_transaction_fails_a_submission() {
        let stored = |status| Ok(Some((status, Some("input spent".to_string()))));
        let accepted = Submitted::Answered(Ok(()));
        let transport = Submitted::Answered(Err("connection reset".to_string()));
        // The SDK kept it New after a transport error and will resubmit it.
        assert!(failure(&transport, stored(TransactionStatus::New)).is_none());
        assert!(failure(&accepted, stored(TransactionStatus::Pending)).is_none());
        let rejected = failure(&accepted, stored(TransactionStatus::InvalidTransaction)).unwrap();
        assert!(rejected.to_string().contains("input spent"));
        // The service answered that it did not store it, so nothing will resubmit it.
        let unsent = failure(&transport, Ok(None)).unwrap();
        assert!(unsent.to_string().contains("connection reset"));
        // Can't tell, so it keeps its inputs locked.
        assert!(failure(&transport, Err("store busy".to_string())).is_none());
    }

    #[tokio::test]
    async fn a_stalled_submit_read_back_as_absent_stays_pending() {
        // The service has the request queued but hasn't stored it when the caller gives up
        // and reads the wallet, so the read finds nothing. The service may store it right
        // after, linking the lock to it, so the lock must not be released.
        let stalled = std::future::pending::<Result<TransactionId, String>>();
        let submitted = Submitted::from(with_timeout(Duration::from_millis(10), stalled).await);
        let Submitted::TimedOut(e) = &submitted else {
            panic!("a stalled submit times out");
        };
        assert!(e.contains("didn't answer"));
        assert!(failure(&submitted, Ok(None)).is_none());
        assert!(failure(&submitted, Ok(Some((TransactionStatus::New, None)))).is_none());
        assert!(failure(&submitted, Err("store busy".to_string())).is_none());
        // The store finished after the read and the network rejected it.
        let stored = Ok(Some((
            TransactionStatus::Rejected,
            Some("input spent".to_string()),
        )));
        assert!(failure(&submitted, stored).is_some());
    }

    #[tokio::test]
    async fn an_answered_submit_is_not_a_timeout() {
        let answered = async { Err::<TransactionId, _>("service shut down".to_string()) };
        let submitted = Submitted::from(with_timeout(Duration::from_secs(10), answered).await);
        assert!(matches!(&submitted, Submitted::Answered(Err(e)) if e == "service shut down"));
        assert!(failure(&submitted, Ok(None)).is_some());
    }

    #[test]
    fn only_rejected_or_invalid_submissions_fail() {
        let err = rejection(TransactionStatus::InvalidTransaction, Some("input spent")).unwrap();
        assert!(err.to_string().contains("input spent"));
        assert!(rejection(TransactionStatus::Rejected, None).is_some());
        assert!(rejection(TransactionStatus::Pending, None).is_none());
        assert!(rejection(TransactionStatus::Accepted, None).is_none());
    }

    fn own_address() -> OotleAddress {
        let key = RistrettoPublicKeyBytes::try_from([1u8; 32].as_slice()).expect("key bytes");
        OotleAddress::new(tari_ootle_wallet_sdk::Network::Esmeralda, key, key)
    }

    #[test]
    fn a_shield_spends_only_revealed_funds_into_a_blinded_output() {
        assert!(matches!(
            Conversion::Shield.input_selection(),
            UtxoInputSelection::RevealedOnly
        ));
        let output = Conversion::Shield.output(own_address(), 1_500_000);
        assert_eq!(output.blinded_amount, 1_500_000);
        assert!(output.revealed_amount.is_zero());
        assert_eq!(output.address, own_address());
        assert!(output.memo.is_none());
        assert!(matches!(output.pay_to, PayTo::StealthPublicKey));
        assert!(output.validate_pay_to().is_ok());
    }

    #[test]
    fn an_unshield_spends_only_confidential_funds_into_a_revealed_output() {
        assert!(matches!(
            Conversion::Unshield.input_selection(),
            UtxoInputSelection::ConfidentialOnly
        ));
        let output = Conversion::Unshield.output(own_address(), 1_500_000);
        assert_eq!(output.blinded_amount, 0);
        assert_eq!(output.revealed_amount, Amount::from(1_500_000u64));
        assert_eq!(output.address, own_address());
        assert!(output.memo.is_none());
        // A revealed-only output must stay a plain key-path one, or the SDK refuses it.
        assert!(output.validate_pay_to().is_ok());
    }

    #[test]
    fn conversions_take_the_names_the_frontend_sends() {
        let parse = |name: &str| serde_json::from_value::<Conversion>(serde_json::json!(name));
        assert_eq!(parse("shield").unwrap(), Conversion::Shield);
        assert_eq!(parse("unshield").unwrap(), Conversion::Unshield);
        assert!(parse("Shield").is_err());
        assert!(parse("send").is_err());
        for conversion in [Conversion::Shield, Conversion::Unshield] {
            assert_eq!(parse(conversion.as_str()).unwrap(), conversion);
        }
    }

    #[test]
    fn a_sweep_pays_the_fee_out_of_the_balance() {
        assert_eq!(sweep_amount(1_000_000, 2_500).unwrap(), 997_500);
        assert_eq!(sweep_amount(2_501, 2_500).unwrap(), 1);
        let err = sweep_amount(2_500, 2_500).unwrap_err();
        assert_eq!(
            err.to_string(),
            "The balance of 2500 micro TARI doesn't cover the 2500 micro TARI fee"
        );
        assert!(sweep_amount(0, 1).is_err());
    }

    #[test]
    fn fees_over_the_ceiling_are_refused() {
        assert_eq!(check_fee(MAX_L2_FEE, MAX_L2_FEE).unwrap(), MAX_L2_FEE);
        let err = check_fee(MAX_L2_FEE + 1, MAX_L2_FEE).unwrap_err();
        assert_eq!(
            err.to_string(),
            "The network asked for a fee of 100001 micro TARI, over the 100000 limit"
        );
    }
}
