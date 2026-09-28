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

use std::time::Duration;

use anyhow::{anyhow, bail};
use log::warn;
use tari_crypto::tari_utilities::ByteArray;
use tari_ootle_common_types::{Epoch, optional::Optional};
use tari_ootle_transaction::{Transaction, TransactionId};
use tari_ootle_wallet_sdk::{
    OotleAddress,
    apis::{
        confidential_transfer::UtxoInputSelection,
        stealth_transfer::{BadgeUsage, StealthTransferParams, TransferFeeParams, TransferOutput},
    },
    crypto::pay_to::PayTo,
    models::{AccountWithAddress, TransactionContext, TransactionStatus, WalletLockDropGuard},
    network::WalletNetworkInterface,
};
use tari_ootle_wallet_sdk_services::transaction_service::TransactionServiceHandle;
use tari_ootle_wallet_storage_sqlite::SqliteWalletStore;
use tari_template_lib::{
    prelude::RistrettoPublicKeyBytes,
    types::{Amount, constants::STEALTH_TARI_RESOURCE_ADDRESS},
};

use super::{LOG_TARGET, OotleSdk, claim};
use crate::wallet::minotari_wallet::MinotariWalletManager;

/// Same as tari_walletd: about an hour at the 20 minute epoch target.
pub(super) const VALIDITY_EPOCHS: u64 = 3;
/// Same as tari_walletd: dry runs before giving up on the fee settling.
const MAX_FEE_ROUNDS: usize = 5;
/// The fee is whatever the indexer's dry run says and the engine never refunds it, so a
/// bad or tampered reply could sweep the account. Esmeralda averages about 6,600 micro XTR
/// a transaction (fee volume over receipt count on the indexer's network/economics, and
/// that includes template publishes at 250,000 each); a transfer is a few thousand.
/// 0.1 XTR leaves plenty of headroom and still caps the damage.
pub(super) const MAX_L2_FEE: u64 = 100_000;
/// Every indexer call made while the send gate permit is held gets this long, so a
/// stalled indexer can't wedge every L1 and L2 spend behind it.
const INDEXER_TIMEOUT: Duration = Duration::from_secs(30);

/// Sends `amount` micro XTR from `account` to `destination` as a blinded stealth output.
/// Fails before anything is submitted if the account can't cover the amount and fee, or
/// the fee is over [`MAX_L2_FEE`]. `approve_fee` gets the settled fee before anything is
/// signed for real, and stops the send by returning an error.
pub async fn send_xtr(
    sdk: &OotleSdk,
    transactions: &TransactionServiceHandle,
    account: AccountWithAddress,
    destination: OotleAddress,
    amount: u64,
    approve_fee: impl AsyncFnOnce(u64) -> Result<(), anyhow::Error>,
) -> Result<TransactionId, anyhow::Error> {
    let epoch = with_indexer_timeout(sdk.get_network_interface().get_current_epoch()).await??;
    let mut params = StealthTransferParams {
        fee_params: TransferFeeParams::new(UtxoInputSelection::PreferRevealed),
        input_selection: UtxoInputSelection::PreferRevealed,
        outputs: vec![TransferOutput {
            address: destination,
            revealed_amount: Amount::zero(),
            blinded_amount: amount,
            memo: None,
            pay_to: PayTo::StealthPublicKey,
        }],
        badge_usage: BadgeUsage::None,
        resource_address: STEALTH_TARI_RESOURCE_ADDRESS,
        max_fee: 1,
        max_epoch: Epoch(epoch.as_u64().saturating_add(VALIDITY_EPOCHS)),
        is_dry_run: true,
    };
    params.max_fee = estimate_fee(sdk, transactions, &account, params.clone()).await?;
    approve_fee(params.max_fee).await?;
    params.is_dry_run = false;

    let context = TransactionContext::with_accounts([*account.component_address()]);
    let (lock, transaction) = build(sdk, account, params).await?;
    submit(sdk, transactions, transaction, context, Some(lock), None).await
}

/// Submits `transaction` and returns its id unless it definitely failed. It's tracked
/// before it goes out (`claim_file` for a claim, `None` for a send) so its outcome is
/// reported whenever it settles.
///
/// A transport error is not a failure: the SDK keeps the transaction `New` and resubmits
/// it on its next poll, so it stays tracked and `lock` keeps its inputs until the wallet
/// releases them on finalize, the same as for a transaction the network took. Only an
/// explicit rejection, or a transaction the wallet never stored, fails and drops `lock`,
/// which frees the inputs.
pub(super) async fn submit(
    sdk: &OotleSdk,
    transactions: &TransactionServiceHandle,
    transaction: Transaction,
    context: TransactionContext,
    lock: Option<WalletLockDropGuard<'_, SqliteWalletStore>>,
    claim_file: Option<String>,
) -> Result<TransactionId, anyhow::Error> {
    let dir = MinotariWalletManager::burn_proofs_dir()?;
    let id = transaction.calculate_id();
    claim::track(&dir, id, claim_file);
    let submitted = with_indexer_timeout(transactions.submit_transaction_with_opts(
        transaction,
        Some(context),
        lock.as_ref().map(|l| l.id()),
    ))
    .await
    .map_err(|e| e.to_string())
    .and_then(|sent| sent.map(drop).map_err(|e| e.to_string()));
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
    if let Err(e) = submitted {
        warn!(target: LOG_TARGET, "Submitting {id} failed, the wallet will resubmit it: {e}");
    }
    if let Some(lock) = lock {
        lock.keep_locked();
    }
    Ok(id)
}

/// Why a submission failed for good, from what the transaction service returned and what
/// the wallet stored for the transaction, or `None` while it may still go through. The
/// SDK returns the id even when the network rejects the submission outright and only
/// records the rejection on the stored transaction. When the wallet can't be read the
/// outcome is unknown, so the transaction is treated as submitted.
fn failure(
    submitted: &Result<(), String>,
    stored: Result<Option<(TransactionStatus, Option<String>)>, String>,
) -> Option<anyhow::Error> {
    match (submitted, stored) {
        (_, Ok(Some((status, reason)))) => rejection(status, reason.as_deref()),
        (Err(e), Ok(None)) => Some(anyhow!("The L2 transaction was not submitted: {e}")),
        (Ok(()), Ok(None)) => None,
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
/// fee covers what it's charged. Input selection targets amount + fee, so the fee
/// changes the shape of the transaction being priced.
async fn estimate_fee(
    sdk: &OotleSdk,
    transactions: &TransactionServiceHandle,
    account: &AccountWithAddress,
    mut params: StealthTransferParams,
) -> Result<u64, anyhow::Error> {
    for _ in 0..MAX_FEE_ROUNDS {
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
            return Ok(params.max_fee);
        }
        params.max_fee = check_fee(finalize.required_fees(), MAX_L2_FEE)?;
    }
    bail!("The L2 fee estimate did not settle after {MAX_FEE_ROUNDS} dry runs")
}

/// Refuses a fee above `ceiling`, returning it otherwise.
pub(super) fn check_fee(fee: u64, ceiling: u64) -> Result<u64, anyhow::Error> {
    if fee > ceiling {
        bail!("The network asked for a fee of {fee} micro XTR, over the {ceiling} limit");
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
        let transport = Err("connection reset".to_string());
        // The SDK kept it New after a transport error and will resubmit it.
        assert!(failure(&transport, stored(TransactionStatus::New)).is_none());
        assert!(failure(&Ok(()), stored(TransactionStatus::Pending)).is_none());
        let rejected = failure(&Ok(()), stored(TransactionStatus::InvalidTransaction)).unwrap();
        assert!(rejected.to_string().contains("input spent"));
        // Never stored, so nothing will resubmit it.
        let unsent = failure(&transport, Ok(None)).unwrap();
        assert!(unsent.to_string().contains("connection reset"));
        // Can't tell, so it keeps its inputs locked.
        assert!(failure(&transport, Err("store busy".to_string())).is_none());
    }

    #[tokio::test]
    async fn a_stalled_submit_times_out_as_a_transport_error() {
        let stalled = std::future::pending::<Result<(), String>>();
        let submitted = with_timeout(Duration::from_millis(10), stalled)
            .await
            .map_err(|e| e.to_string())
            .and_then(|sent| sent);
        assert!(submitted.as_ref().unwrap_err().contains("didn't answer"));
        // Stored New, so it stays pending and keeps its lock like any transport error.
        assert!(failure(&submitted, Ok(Some((TransactionStatus::New, None)))).is_none());
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

    #[test]
    fn fees_over_the_ceiling_are_refused() {
        assert_eq!(check_fee(MAX_L2_FEE, MAX_L2_FEE).unwrap(), MAX_L2_FEE);
        let err = check_fee(MAX_L2_FEE + 1, MAX_L2_FEE).unwrap_err();
        assert!(err.to_string().contains("over the 100000 limit"));
    }
}
