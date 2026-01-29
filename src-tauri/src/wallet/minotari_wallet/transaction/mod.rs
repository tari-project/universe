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

// let one_sided_tx = OneSidedTransaction::new(pool.clone(), network, password.clone());
// let result = one_sided_tx
//     .create_unsigned_transaction(account, recipients, idempotency_key, seconds_to_lock)
//     .await
//     .map_err(|e| anyhow!("Failed to create unsigned transaction: {}", e))?;

use anyhow::anyhow;
use minotari_wallet::{
    db::SqlitePool,
    transactions::{manager::TransactionSender, one_sided_transaction::Recipient},
    DisplayedTransaction,
};
use tari_common::configuration::Network;
use tari_transaction_components::{
    consensus::ConsensusManager,
    offline_signing::{
        models::{PrepareOneSidedTransactionForSigningResult, SignedOneSidedTransactionResult},
        sign_locked_transaction,
    },
};
use tauri::AppHandle;

use crate::{
    internal_wallet::InternalWallet,
    wallet::minotari_wallet::{DEFAULT_GRPC_URL, DEFAULT_PASSWORD},
};

const CONFIRMATION_WINDOW: u64 = 3;

pub struct TransactionManager {
    transaction_sender: TransactionSender,
}

impl TransactionManager {
    pub async fn new(pool: SqlitePool, sender_address: String) -> Result<Self, anyhow::Error> {
        let network = Network::get_current_or_user_setting_or_default();
        let transaction_sender = TransactionSender::new(
            pool,
            sender_address,
            DEFAULT_PASSWORD.to_string(),
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
        let seconds_to_lock = 86400; // 24 hours

        let prepared_one_sided_transaction = self
            .transaction_sender
            .start_new_transaction(idempotency_key, recipient, seconds_to_lock)
            .map_err(|e| anyhow!("Failed to create unsigned transaction: {}", e))?;

        Ok(prepared_one_sided_transaction)
    }

    pub async fn sign_one_sided_transaction(
        &self,
        app_handle: &AppHandle,
        unsigned_tx: PrepareOneSidedTransactionForSigningResult,
    ) -> Result<SignedOneSidedTransactionResult, anyhow::Error> {
        println!("Signing one-sided transaction...");
        let key_manager = InternalWallet::get_key_manager(app_handle).await?;
        let network = Network::get_current_or_user_setting_or_default();
        let rules = ConsensusManager::builder(network).build();

        let signed_transaction = sign_locked_transaction(
            &key_manager,
            rules.consensus_constants(0).clone(),
            network,
            unsigned_tx,
        )
        .map_err(|e| anyhow!("Failed to sign one-sided transaction: {}", e))?;

        Ok(signed_transaction)
    }

    pub async fn finalize_one_sided_transaction(
        &mut self,
        signed_transaction: SignedOneSidedTransactionResult,
    ) -> Result<DisplayedTransaction, anyhow::Error> {
        println!("Finalizing one-sided transaction...");
        let displayed_transaction = self
            .transaction_sender
            .finalize_transaction_and_broadcast(signed_transaction, DEFAULT_GRPC_URL.clone())
            .await?;

        Ok(displayed_transaction)
    }
}
