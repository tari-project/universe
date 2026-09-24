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

use anyhow::{anyhow, bail};
use tari_crypto::tari_utilities::ByteArray;
use tari_ootle_common_types::Epoch;
use tari_ootle_transaction::{Transaction, TransactionId};
use tari_ootle_wallet_sdk::{
    OotleAddress,
    apis::{
        confidential_transfer::UtxoInputSelection,
        stealth_transfer::{BadgeUsage, StealthTransferParams, TransferFeeParams, TransferOutput},
    },
    crypto::pay_to::PayTo,
    models::{AccountWithAddress, TransactionContext, WalletLockDropGuard},
    network::WalletNetworkInterface,
};
use tari_ootle_wallet_sdk_services::transaction_service::TransactionServiceHandle;
use tari_ootle_wallet_storage_sqlite::SqliteWalletStore;
use tari_template_lib::{
    prelude::RistrettoPublicKeyBytes,
    types::{Amount, constants::STEALTH_TARI_RESOURCE_ADDRESS},
};

use super::OotleSdk;

/// Same as tari_walletd: about an hour at the 20 minute epoch target.
const VALIDITY_EPOCHS: u64 = 3;
/// Same as tari_walletd: dry runs before giving up on the fee settling.
const MAX_FEE_ROUNDS: usize = 5;

/// Sends `amount` micro XTR from `account` to `destination` as a blinded stealth output.
/// Fails before anything is submitted if the account can't cover the amount and fee.
pub async fn send_xtr(
    sdk: &OotleSdk,
    transactions: &TransactionServiceHandle,
    account: AccountWithAddress,
    destination: OotleAddress,
    amount: u64,
) -> Result<TransactionId, anyhow::Error> {
    let epoch = sdk.get_network_interface().get_current_epoch().await?;
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
    params.is_dry_run = false;

    let component = *account.component_address();
    let (lock, transaction) = build(sdk, account, params).await?;
    let id = transactions
        .submit_transaction_with_opts(
            transaction,
            Some(TransactionContext::with_accounts([component])),
            Some(lock.id()),
        )
        .await
        .map_err(|e| anyhow!("The L2 transaction was not submitted: {e}"))?;
    // The wallet releases the lock once the transaction is finalized.
    lock.keep_locked();
    Ok(id)
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
        let result = transactions
            .submit_dry_run_transaction(transaction)
            .await
            .map_err(|e| anyhow!("The L2 fee estimate failed: {e}"))?;
        let finalize = result.finalize;
        if finalize.charged_fees() <= params.max_fee {
            if let Some(reason) = finalize.any_reject() {
                bail!("The L2 transaction would be rejected: {reason}");
            }
            return Ok(params.max_fee);
        }
        params.max_fee = finalize.required_fees();
    }
    bail!("The L2 fee estimate did not settle after {MAX_FEE_ROUNDS} dry runs")
}

/// Builds and signs the transfer. The returned guard holds the spent inputs locked
/// until it's released, kept, or dropped.
async fn build(
    sdk: &OotleSdk,
    account: AccountWithAddress,
    params: StealthTransferParams,
) -> Result<(WalletLockDropGuard<'_, SqliteWalletStore>, Transaction), anyhow::Error> {
    let (lock, transfer) = sdk.stealth_transfer_api().transfer(account, params).await?;
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
