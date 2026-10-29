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
    db::{self as wallet_db, SqlitePool},
    transactions::{
        manager::TransactionSender,
        one_sided_transaction::{Recipient, recipient_memo},
    },
};
use std::str::FromStr;
use tari_common::configuration::Network;
use tari_common_types::tari_address::TariAddress;
use tari_transaction_components::{
    TransactionBuilder,
    consensus::ConsensusManager,
    key_manager::KeyManager as WalletKeyManager,
    offline_signing::{
        ConfirmationMode, PayloadSummary,
        models::{
            PaymentRecipient, PrepareOneSidedTransactionForSigningResult,
            SignedOneSidedTransactionResult,
        },
        prepare_one_sided_transaction_for_signing, present_payload_summary,
        sign_locked_transaction,
    },
    transaction_components::{MemoField, memo_field::TxType},
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
///
/// Binary payment IDs (such as 8-byte MEXC deposit references that are not valid UTF-8) are
/// returned hex-encoded for UI display; [`with_embedded_payment_id`] writes the raw address
/// bytes into the transaction memo.
pub fn resolve_payment_id(
    destination: &TariAddress,
    supplied: Option<String>,
) -> Result<Option<String>, anyhow::Error> {
    let embedded = destination.get_memo_field_payment_id_bytes();
    if embedded.is_empty() {
        return Ok(supplied.filter(|id| !id.is_empty()));
    }
    Ok(Some(
        String::from_utf8(embedded).unwrap_or_else(|err| hex::encode(err.into_bytes())),
    ))
}

/// Replaces a placeholder string memo with the raw payment ID bytes embedded in the recipient
/// address when they differ (e.g. non-UTF-8 binary deposit IDs) and re-signs the offline
/// signing payload.
fn with_embedded_payment_id(
    key_manager: &WalletKeyManager,
    network: Network,
    unsigned_tx: PrepareOneSidedTransactionForSigningResult,
) -> Result<PrepareOneSidedTransactionForSigningResult, anyhow::Error> {
    let Some(recipient) = unsigned_tx.info.recipients.first() else {
        return Ok(unsigned_tx);
    };
    let embedded = recipient.address.get_memo_field_payment_id_bytes();
    if embedded.is_empty() || unsigned_tx.info.payment_id.get_payment_id() == embedded {
        return Ok(unsigned_tx);
    }

    let payment_id =
        MemoField::new_open(embedded, TxType::PaymentToOther).map_err(|e| anyhow!(e))?;
    let payment_recipient = PaymentRecipient {
        payment_id: recipient_memo(
            payment_id.clone(),
            &unsigned_tx.info.sender_address,
            &recipient.address,
        )?,
        ..recipient.clone()
    };
    let consensus_constants = ConsensusManager::builder(network)
        .build()
        .consensus_constants(0)
        .clone();
    let mut tx_builder =
        TransactionBuilder::new(consensus_constants, key_manager.clone(), network)?;
    tx_builder.with_fee_per_gram(unsigned_tx.info.fee_per_gram);
    tx_builder.with_change_required();
    for input in &unsigned_tx.info.inputs {
        tx_builder.with_input(input.clone())?;
    }

    prepare_one_sided_transaction_for_signing(
        key_manager,
        unsigned_tx.tx_id,
        tx_builder,
        &[payment_recipient],
        payment_id,
        unsigned_tx.info.sender_address,
    )
    .map_err(|e| anyhow!("Failed to prepare unsigned transaction with embedded payment ID: {e}"))
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
        mut recipient: Recipient,
    ) -> Result<PrepareOneSidedTransactionForSigningResult, anyhow::Error> {
        let idempotency_key = uuid::Uuid::new_v4().to_string();
        let seconds_to_lock = UTXO_LOCK_DURATION_SECS;
        let embedded = recipient.address.get_memo_field_payment_id_bytes();
        let non_utf8_embedded = !embedded.is_empty() && std::str::from_utf8(&embedded).is_err();
        if non_utf8_embedded {
            // Reserve UTXO weight for the exact byte length of the binary payment ID while
            // passing valid UTF-8 to `TransactionSender::start_new_transaction`.
            recipient.payment_id = Some("0".repeat(embedded.len()));
        }

        let prepared_one_sided_transaction = self
            .transaction_sender
            .start_new_transaction(idempotency_key, recipient, seconds_to_lock)
            .map_err(|e| anyhow!("Failed to create unsigned transaction: {}", e))?;

        if non_utf8_embedded {
            let key_manager = self
                .transaction_sender
                .account
                .get_key_manager(&self.transaction_sender.password)?;
            return with_embedded_payment_id(
                &key_manager,
                self.transaction_sender.network,
                prepared_one_sided_transaction,
            );
        }

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
        let unsigned_tx = with_embedded_payment_id(key_manager, network, unsigned_tx)?;

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
        let non_utf8_embedded = signed_transaction
            .request
            .info
            .recipients
            .first()
            .map(|r| r.address.get_memo_field_payment_id_bytes())
            .filter(|bytes| !bytes.is_empty() && std::str::from_utf8(bytes).is_err());

        let mut sent = self
            .transaction_sender
            .finalize_transaction_and_broadcast(signed_transaction, base_node_http_url().await?)
            .await?;

        if let Some(embedded) = non_utf8_embedded {
            let hex_id = hex::encode(embedded);
            sent.displayed_transaction.message = Some(hex_id.clone());
            sent.displayed_transaction.details.memo_hex = Some(hex_id);
            if let Ok(conn) = self.transaction_sender.db_pool.get() {
                let _ = wallet_db::insert_displayed_transaction(&conn, &sent.displayed_transaction);
            }
        }

        Ok(sent.displayed_transaction)
    }
}

#[cfg(test)]
mod tests {
    use super::{parse_destination_address, resolve_payment_id, with_embedded_payment_id};
    use minotari_wallet::transactions::one_sided_transaction::recipient_memo;
    use std::str::FromStr;
    use tari_common::configuration::Network;
    use tari_common_types::{tari_address::TariAddress, transaction::TxId};
    use tari_transaction_components::{
        MicroMinotari, TransactionBuilder,
        consensus::ConsensusManager,
        key_manager::{KeyManager as WalletKeyManager, TransactionKeyManagerInterface},
        offline_signing::{
            ConfirmationMode, PayloadSummary, models::PaymentRecipient,
            prepare_one_sided_transaction_for_signing, present_payload_summary,
            sign_locked_transaction,
        },
        transaction_components::{
            MemoField, OutputFeatures, WalletOutputBuilder, covenants::Covenant, memo_field::TxType,
        },
    };

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

        let mut text_address = address.clone();
        text_address
            .add_memo_field_payment_id(b"ID5931480726".to_vec())
            .unwrap();
        let destination = TariAddress::Dual(text_address);
        for supplied in [None, Some(String::new()), Some("wrong".into())] {
            assert_eq!(
                resolve_payment_id(&destination, supplied)
                    .unwrap()
                    .as_deref(),
                Some("ID5931480726")
            );
        }

        // MEXC deposit addresses embed an 8-byte binary payment ID that is not valid UTF-8.
        let mexc_bytes = vec![0x80, 0xff, 0x00, 0xfe, 0x42, 0x13, 0x37, 0x99];
        address.add_memo_field_payment_id(mexc_bytes).unwrap();
        let mexc_destination = TariAddress::Dual(address);
        for supplied in [None, Some(String::new()), Some("wrong".into())] {
            assert_eq!(
                resolve_payment_id(&mexc_destination, supplied)
                    .unwrap()
                    .as_deref(),
                Some("80ff00fe42133799")
            );
        }

        let localnet = TariAddress::from_str(LOCALNET_DEPOSIT_ADDRESS).unwrap();
        assert_eq!(
            resolve_payment_id(&localnet, None).unwrap().as_deref(),
            Some("PW-DEPOSIT-123")
        );
    }

    #[test]
    fn non_utf8_embedded_payment_id_is_preserved_as_raw_bytes_in_unsigned_and_signed_tx() {
        let network = Network::Esmeralda;
        let consensus = ConsensusManager::builder(network)
            .build()
            .consensus_constants(0)
            .clone();
        let key_manager = WalletKeyManager::new_random().unwrap();
        let sender_address = parse_destination_address(ESME_ONE_SIDED_ADDRESS).unwrap();

        let TariAddress::Dual(mut dest_dual) =
            parse_destination_address(ESME_ONE_SIDED_ADDRESS).unwrap()
        else {
            panic!("fixture must be a dual address");
        };
        let mexc_bytes = vec![0x80, 0xff, 0x00, 0xfe, 0x42, 0x13, 0x37, 0x99];
        dest_dual
            .add_memo_field_payment_id(mexc_bytes.clone())
            .unwrap();
        let destination = TariAddress::Dual(dest_dual);

        // Build an unspent input owned by `key_manager`.
        let (mask_key, script_key) = key_manager
            .get_next_commitment_mask_and_script_key()
            .unwrap();
        let sender_offset = key_manager.get_random_key(None, None).unwrap();
        let input = WalletOutputBuilder::new(MicroMinotari(10_000_000), mask_key.key_id)
            .with_features(OutputFeatures::default())
            .with_script(Default::default())
            .encrypt_data_for_recovery(&key_manager, None, MemoField::new_empty())
            .unwrap()
            .with_input_data(Default::default())
            .with_covenant(Covenant::default())
            .with_version(Default::default())
            .with_sender_offset_public_key(sender_offset.pub_key)
            .with_script_key(script_key.key_id)
            .sign_metadata_signature(&key_manager, &sender_offset.key_id)
            .unwrap()
            .try_build(&key_manager)
            .unwrap();

        let mut tx_builder =
            TransactionBuilder::new(consensus.clone(), key_manager.clone(), network).unwrap();
        tx_builder.with_fee_per_gram(MicroMinotari(5));
        tx_builder.with_change_required();
        tx_builder.with_input(input).unwrap();

        let placeholder =
            MemoField::new_open_from_string(&"0".repeat(mexc_bytes.len()), TxType::PaymentToOther)
                .unwrap();
        let payment_recipient = PaymentRecipient {
            amount: MicroMinotari(1_000_000),
            output_features: OutputFeatures::default(),
            address: destination.clone(),
            payment_id: recipient_memo(placeholder.clone(), &sender_address, &destination).unwrap(),
        };
        let unsigned = prepare_one_sided_transaction_for_signing(
            &key_manager,
            TxId::from(42u64),
            tx_builder,
            &[payment_recipient],
            placeholder,
            sender_address.clone(),
        )
        .unwrap();

        let rebuilt = with_embedded_payment_id(&key_manager, network, unsigned).unwrap();
        assert_eq!(rebuilt.info.payment_id.get_payment_id(), mexc_bytes);
        assert_eq!(
            rebuilt.info.recipients[0].payment_id.get_payment_id(),
            mexc_bytes
        );
        assert_eq!(
            rebuilt.info.recipients[0]
                .payment_id
                .claimed_sender_address()
                .as_ref(),
            Some(&sender_address)
        );

        let summary = PayloadSummary::from_one_sided(rebuilt);
        let confirmation = present_payload_summary(
            &summary,
            ConfirmationMode::NonInteractive,
            &mut std::io::sink(),
            &mut std::io::empty(),
        )
        .unwrap();
        let signed = sign_locked_transaction(
            &key_manager,
            consensus,
            network,
            summary.confirm(confirmation).unwrap(),
        )
        .unwrap();
        assert_eq!(
            signed.signed_transaction.outputs[0]
                .payment_id()
                .get_payment_id(),
            mexc_bytes
        );
        assert_eq!(
            signed
                .signed_transaction
                .change_output
                .as_ref()
                .unwrap()
                .payment_id()
                .get_payment_id(),
            mexc_bytes
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
