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

use crate::wallet::minotari_wallet::wallet_network;
use anyhow::{Context, anyhow};
use log::{info, warn};
use minotari_wallet::{
    db::SqlitePool,
    transactions::{
        input_selector::map_change_required_error,
        manager::{FinalizedSend, TransactionSender},
        one_sided_transaction::Recipient,
    },
};
use std::str::FromStr;
use tari_common_types::tari_address::TariAddress;
use tari_transaction_components::{
    TransactionBuilderError,
    consensus::ConsensusManager,
    key_manager::KeyManager,
    offline_signing::{
        ConfirmationMode, PayloadSummary,
        models::{PrepareOneSidedTransactionForSigningResult, SignedOneSidedTransactionResult},
        present_payload_summary, sign_locked_transaction,
    },
    tari_amount::MicroMinotari,
};

use crate::credential_manager::CredentialManager;
use crate::wallet::minotari_wallet::base_node_http_url;

pub(crate) const CONFIRMATION_WINDOW: u64 = 3;
/// Fee rate, in µT per gram, for every send and burn this wallet makes.
pub(crate) const SEND_FEE_PER_GRAM: u64 = 5;
/// Duration in seconds that UTXOs are locked after transaction creation.
///
/// The lock only has to outlive signing and broadcasting, which run back to back with
/// no user interaction (the PIN is collected before the transaction is created). Once
/// the reservation is claimed for broadcast the unlocker leaves it alone, so a short
/// window never frees the inputs of a transaction that is on the network — it only
/// bounds how long a send that died mid-flight keeps the funds unspendable.
pub(crate) const UTXO_LOCK_DURATION_SECS: u64 = 300;

/// Parse a destination address the way the send validation does.
///
/// `FromStr` accepts emoji, base58 and hex, matching
/// [`crate::utils::address_utils::verify_tari_address`]; parsing base58 only here meant
/// addresses the UI had already accepted failed at send time.
pub fn parse_destination_address(address: &str) -> Result<TariAddress, anyhow::Error> {
    let destination_address = TariAddress::from_str(address)
        .map_err(|e| anyhow!("Invalid destination address: {}", e))?;
    let expected_network = wallet_network();
    if destination_address.network() != expected_network {
        return Err(anyhow!(
            "Destination address is for network {:?}, but the wallet is on {:?}",
            destination_address.network(),
            expected_network
        ));
    }
    Ok(destination_address)
}

pub struct TransactionManager {
    transaction_sender: TransactionSender,
}

impl TransactionManager {
    pub async fn new(pool: SqlitePool, sender_address: String) -> Result<Self, anyhow::Error> {
        let network = wallet_network();
        let mut transaction_sender = TransactionSender::new(
            pool,
            sender_address,
            CredentialManager::minotari_db_password().await?,
            network,
            CONFIRMATION_WINDOW,
        )?;
        transaction_sender.fee_per_gram = MicroMinotari::from(SEND_FEE_PER_GRAM);

        Ok(Self { transaction_sender })
    }

    pub async fn create_one_sided_transaction(
        &mut self,
        recipient: Recipient,
    ) -> Result<PrepareOneSidedTransactionForSigningResult, anyhow::Error> {
        let idempotency_key = uuid::Uuid::new_v4().to_string();
        let seconds_to_lock = UTXO_LOCK_DURATION_SECS;

        let prepared_one_sided_transaction = self
            .transaction_sender
            .start_new_transaction(idempotency_key, recipient, seconds_to_lock)
            .context("Failed to create unsigned transaction")?;

        Ok(prepared_one_sided_transaction)
    }

    /// Sign with a key manager the caller already holds.
    ///
    /// Building the key manager is what raises the PIN prompt, and it must happen before
    /// [`Self::create_one_sided_transaction`] locks any UTXOs: signing here cannot be
    /// aborted by the user, so nothing stays locked after a cancelled send.
    pub async fn sign_one_sided_transaction(
        &self,
        key_manager: &KeyManager,
        unsigned_tx: PrepareOneSidedTransactionForSigningResult,
    ) -> Result<SignedOneSidedTransactionResult, anyhow::Error> {
        info!("Signing one-sided transaction...");
        let network = wallet_network();
        let rules = ConsensusManager::builder(network).build();

        // The user approved this send at the send gate, and the payload was built here
        // from our own database, so there's nothing more to confirm. The summary this
        // logs carries the recipient and amount; the log config keeps that target quiet.
        let summary = PayloadSummary::from_one_sided(unsigned_tx);
        let confirmation = present_payload_summary(
            &summary,
            ConfirmationMode::NonInteractive,
            &mut std::io::sink(),
            &mut std::io::empty(),
        )?;
        let signed_transaction = sign_locked_transaction(
            key_manager,
            rules.consensus_constants(0).clone(),
            network,
            summary.confirm(confirmation)?,
        )
        .map_err(sign_error)?;

        Ok(signed_transaction)
    }

    pub async fn finalize_one_sided_transaction(
        &mut self,
        signed_transaction: SignedOneSidedTransactionResult,
    ) -> Result<FinalizedSend, anyhow::Error> {
        info!("Finalizing one-sided transaction...");
        let sent = self
            .transaction_sender
            .finalize_transaction_and_broadcast(signed_transaction, base_node_http_url().await?)
            .await?;
        // Recorded either way; the post-scan monitor rebroadcasts it until it is mined.
        if !sent.accepted_by_node {
            warn!(
                "The node has not accepted the send yet: {}",
                sent.node_reason.as_deref().unwrap_or_default()
            );
        }

        Ok(sent)
    }
}

/// A signing failure, with the builder's refusal to build without a change output
/// turned into the library's typed `ChangeNotAffordable`.
fn sign_error(error: TransactionBuilderError) -> anyhow::Error {
    map_change_required_error(error).context("Failed to sign one-sided transaction")
}

#[cfg(test)]
mod tests {
    use super::{parse_destination_address, sign_error};
    use minotari_wallet::transactions::{
        input_selector::UtxoSelectionError, one_sided_transaction::Recipient,
    };
    use std::str::FromStr;
    use tari_common_types::tari_address::TariAddress;
    use tari_transaction_components::{TransactionBuilderError, tari_amount::MicroMinotari};

    // Same Esmeralda fixtures as the send validation tests in
    // `crate::utils::address_utils`, which is the parser this one has to agree with.
    const ESME_ONE_SIDED_ADDRESS: &str = "f25eNHz2YnBVKHaqNuacGyDFB321RwwCnTr4vb2SjQCgDZVXyNNthc7zftQKRDu6evLjvSUD8W5akpPMdhS4HQ9kF3g";
    const ESME_ONE_SIDED_EMOJI_ADDRESS: &str = "🍗📟😇🦀🚽💈🎠🍚🦂🌕🎩💨👂🏰📜👞🎵🐬🐚💄🚨🔋🐀🐯💻👗🐊👠🦀🐝🚦🍌🎋🎼🍗🎮🎉👗🐮🎨👾🔧🤖💋🐾💨🎃🍀🦂🐀🐬🔱🥝👕🎳⏰🎃🐉💍🙈🍉🔱🎣🐢👒🍊💦";
    const NEXTNET_ONE_SIDED_ADDRESS: &str = "32FZ9MmtkbcxNwF1Qia1RykS2i3ycaJC5er32xaFi1fpkNKjKvVo6VFPKjoigSME76EmsaDPZLXu2e3ivp5MWSU54j1";
    const MAINNET_MEXC_DEPOSIT_ADDRESS: &str = "165DUuzQoKG9BaBqprN3ZmsMRfvGHMwNwCpehJUqGoGLsSDtB535XA3PPzfRZhu2uYM9xfT8JsKoXEquWMr6XVwKK46oQHdBBjJg3sveDnoiE4cr2HBSyGx8qdxRoUEsbKsZD9f";
    const LOCALNET_DEPOSIT_ADDRESS: &str = "H6BhBUPxTJWtZVxhbExYLz623LRHXLKSaaVYZWXK2Yvn5jP4nufiUQzKo6fgHp2t3VuY6PiGGPubmynEDzxyXDXjAXPedBhZFgJT4dAVXEW1re";

    /// MEXC's deposit addresses embed a 32-byte binary reference. The wallet library sends
    /// those exact bytes, in place of any Message, so a send to one must not be refused.
    #[test]
    fn a_binary_address_payment_id_is_sent_as_its_bytes() {
        let mexc = TariAddress::from_str(MAINNET_MEXC_DEPOSIT_ADDRESS).unwrap();
        let embedded = mexc.get_memo_field_payment_id_bytes();
        assert_eq!(embedded.len(), 32);
        assert!(String::from_utf8(embedded.clone()).is_err());

        let recipient = Recipient {
            address: mexc,
            amount: 1_000.into(),
            payment_id: Some("typed".to_string()),
        };
        assert_eq!(recipient.payment_id_bytes(), Some(embedded));

        let localnet = Recipient {
            address: TariAddress::from_str(LOCALNET_DEPOSIT_ADDRESS).unwrap(),
            amount: 1_000.into(),
            payment_id: None,
        };
        assert_eq!(
            localnet.payment_id_bytes(),
            Some(b"PW-DEPOSIT-123".to_vec())
        );
    }

    #[test]
    fn accepts_the_address_forms_send_validation_accepts() {
        // Base58 and emoji are the same address; parsing base58 only rejected sends the
        // UI had already validated.
        assert!(parse_destination_address(ESME_ONE_SIDED_ADDRESS).is_ok());
        assert!(parse_destination_address(ESME_ONE_SIDED_EMOJI_ADDRESS).is_ok());
        assert!(parse_destination_address(NEXTNET_ONE_SIDED_ADDRESS).is_err());
        assert!(parse_destination_address("not an address").is_err());
    }

    #[test]
    fn signing_without_room_for_change_reads_as_the_change_error() {
        let error = sign_error(TransactionBuilderError::OfflineTransactionRequiresChange {
            remainder: MicroMinotari(40),
            change_fee: MicroMinotari(100),
        });
        assert!(
            matches!(
                error.downcast_ref::<UtxoSelectionError>(),
                Some(UtxoSelectionError::ChangeNotAffordable { .. })
            ),
            "{error:#}"
        );
    }
}
