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
use anyhow::anyhow;
use log::info;
use minotari_wallet::{
    DisplayedTransaction,
    db::SqlitePool,
    transactions::{manager::TransactionSender, one_sided_transaction::Recipient},
};
use std::str::FromStr;
use tari_common_types::tari_address::TariAddress;
use tari_transaction_components::{
    consensus::ConsensusManager,
    key_manager::KeyManager as WalletKeyManager,
    offline_signing::{
        ConfirmationMode, PayloadSummary,
        models::{PrepareOneSidedTransactionForSigningResult, SignedOneSidedTransactionResult},
        present_payload_summary, sign_locked_transaction,
    },
};

use crate::credential_manager::CredentialManager;
use crate::wallet::minotari_wallet::base_node_http_url;

pub(crate) const CONFIRMATION_WINDOW: u64 = 3;
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

/// The payment ID the recipient output carries: an ID encoded in the destination address
/// wins over the send form's Message, as the console wallet always did. Exchanges put the
/// deposit reference in the address, and a hand-typed variation of it must not replace it.
pub fn resolve_payment_id(
    destination: &TariAddress,
    supplied: Option<String>,
) -> Result<Option<String>, anyhow::Error> {
    let embedded = destination.get_memo_field_payment_id_bytes();
    if embedded.is_empty() {
        return Ok(supplied.filter(|id| !id.is_empty()));
    }
    String::from_utf8(embedded)
        .map(Some)
        .map_err(|_| anyhow!("Destination address contains a non-text payment ID"))
}

pub struct TransactionManager {
    transaction_sender: TransactionSender,
}

impl TransactionManager {
    pub async fn new(pool: SqlitePool, sender_address: String) -> Result<Self, anyhow::Error> {
        let network = wallet_network();
        let transaction_sender = TransactionSender::new(
            pool,
            sender_address,
            CredentialManager::minotari_db_password().await?,
            network,
            CONFIRMATION_WINDOW,
        )?;

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
            .map_err(|e| anyhow!("Failed to create unsigned transaction: {}", e))?;

        Ok(prepared_one_sided_transaction)
    }

    /// Sign with a key manager the caller already holds.
    ///
    /// Building the key manager is what raises the PIN prompt, and it must happen before
    /// [`Self::create_one_sided_transaction`] locks any UTXOs: signing here cannot be
    /// aborted by the user, so nothing stays locked after a cancelled send.
    pub async fn sign_one_sided_transaction(
        &self,
        key_manager: &WalletKeyManager,
        unsigned_tx: PrepareOneSidedTransactionForSigningResult,
    ) -> Result<SignedOneSidedTransactionResult, anyhow::Error> {
        info!("Signing one-sided transaction...");
        let network = wallet_network();
        let rules = ConsensusManager::builder(network).build();

        // The backend send gate already obtained approval for this wallet-built payload.
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
        .map_err(|e| anyhow!("Failed to sign one-sided transaction: {}", e))?;

        Ok(signed_transaction)
    }

    pub async fn finalize_one_sided_transaction(
        &mut self,
        signed_transaction: SignedOneSidedTransactionResult,
    ) -> Result<DisplayedTransaction, anyhow::Error> {
        info!("Finalizing one-sided transaction...");
        let sent = self
            .transaction_sender
            .finalize_transaction_and_broadcast(signed_transaction, base_node_http_url().await?)
            .await?;

        Ok(sent.displayed_transaction)
    }
}

#[cfg(test)]
mod tests {
    use super::{parse_destination_address, resolve_payment_id};
    use std::str::FromStr;
    use tari_common_types::tari_address::TariAddress;

    // Same Esmeralda fixtures as the send validation tests in
    // `crate::utils::address_utils`, which is the parser this one has to agree with.
    const ESME_ONE_SIDED_ADDRESS: &str = "f25eNHz2YnBVKHaqNuacGyDFB321RwwCnTr4vb2SjQCgDZVXyNNthc7zftQKRDu6evLjvSUD8W5akpPMdhS4HQ9kF3g";
    const ESME_ONE_SIDED_EMOJI_ADDRESS: &str = "🍗📟😇🦀🚽💈🎠🍚🦂🌕🎩💨👂🏰📜👞🎵🐬🐚💄🚨🔋🐀🐯💻👗🐊👠🦀🐝🚦🍌🎋🎼🍗🎮🎉👗🐮🎨👾🔧🤖💋🐾💨🎃🍀🦂🐀🐬🔱🥝👕🎳⏰🎃🐉💍🙈🍉🔱🎣🐢👒🍊💦";
    const NEXTNET_ONE_SIDED_ADDRESS: &str = "32FZ9MmtkbcxNwF1Qia1RykS2i3ycaJC5er32xaFi1fpkNKjKvVo6VFPKjoigSME76EmsaDPZLXu2e3ivp5MWSU54j1";
    const LOCALNET_DEPOSIT_ADDRESS: &str = "H6BhBUPxTJWtZVxhbExYLz623LRHXLKSaaVYZWXK2Yvn5jP4nufiUQzKo6fgHp2t3VuY6PiGGPubmynEDzxyXDXjAXPedBhZFgJT4dAVXEW1re";

    #[test]
    fn embedded_address_payment_id_wins_over_the_message() {
        let TariAddress::Dual(mut address) =
            parse_destination_address(ESME_ONE_SIDED_ADDRESS).unwrap()
        else {
            panic!("fixture must be a dual address");
        };
        let plain = TariAddress::Dual(address.clone());
        assert_eq!(resolve_payment_id(&plain, None).unwrap(), None);
        assert_eq!(
            resolve_payment_id(&plain, Some(String::new())).unwrap(),
            None
        );
        assert_eq!(
            resolve_payment_id(&plain, Some("note".into()))
                .unwrap()
                .as_deref(),
            Some("note")
        );

        address
            .add_memo_field_payment_id(b"ID5931480726".to_vec())
            .unwrap();
        let destination = TariAddress::Dual(address);
        for supplied in [None, Some(String::new()), Some("wrong".into())] {
            assert_eq!(
                resolve_payment_id(&destination, supplied)
                    .unwrap()
                    .as_deref(),
                Some("ID5931480726")
            );
        }
        let localnet = TariAddress::from_str(LOCALNET_DEPOSIT_ADDRESS).unwrap();
        assert_eq!(
            resolve_payment_id(&localnet, None).unwrap().as_deref(),
            Some("PW-DEPOSIT-123")
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
}
