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
    db::AccountRow,
    transactions::one_sided_transaction::{OneSidedTransaction, Recipient},
};
use sqlx::SqlitePool;
use tari_common::configuration::Network;
use tari_transaction_components::offline_signing::{
    models::{PrepareOneSidedTransactionForSigningResult, SignedOneSidedTransactionResult},
    offline_signer::OfflineSigner,
};
use tauri::AppHandle;

use crate::internal_wallet::InternalWallet;

pub struct TransactionManager {}

impl TransactionManager {
    pub fn new() -> Self {
        Self {}
    }

    pub async fn create_one_sided_transaction(
        &self,
        pool: &SqlitePool,
        password: String,
        account: AccountRow,
        recipients: Vec<Recipient>,
        idempotency_key: Option<String>,
        seconds_to_lock: u64,
    ) -> Result<PrepareOneSidedTransactionForSigningResult, anyhow::Error> {
        let network = Network::get_current_or_user_setting_or_default();

        let one_sided_tx = OneSidedTransaction::new(pool.clone(), network, password.clone());
        one_sided_tx
            .create_unsigned_transaction(account, recipients, idempotency_key, seconds_to_lock)
            .await
            .map_err(|e| anyhow!("Failed to create unsigned transaction: {}", e))
    }

    pub async fn sign_one_sided_transaction(
        &self,
        app_handle: &AppHandle,
        unsigned_tx: PrepareOneSidedTransactionForSigningResult,
    ) -> Result<SignedOneSidedTransactionResult, anyhow::Error> {
        let key_manager = InternalWallet::get_key_manager(app_handle).await?;
        let mut signer = OfflineSigner::new(key_manager);

        let signed_tx = signer
            .sign_locked_transaction(unsigned_tx)
            .map_err(|e| anyhow!("Failed to sign one-sided transaction: {}", e))?;
        Ok(signed_tx)
    }
}
