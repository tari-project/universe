// Copyright 2024. The Tari Project
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

use crate::wallet::spend_wallet::SpendWallet;
use crate::wallet::wallet_adapter::WalletAdapter;
use crate::wallet::wallet_status_monitor::WalletStatusMonitorError;
use crate::LOG_TARGET_APP_LOGIC;
use minotari_node_grpc_client::grpc::payment_recipient::PaymentType;
use minotari_node_grpc_client::grpc::wallet_client::WalletClient;
use minotari_node_grpc_client::grpc::{
    BroadcastSignedOneSidedTransactionRequest, CancelTransactionRequest, PaymentRecipient,
    PrepareOneSidedTransactionForSigningRequest, UserPaymentId,
};
use std::fs;
use std::path::PathBuf;
use tari_common::configuration::Network;
use tauri::Manager;

/// This struct encapsulates all functionality related to transactions
pub struct TransactionService<'a> {
    wallet_adapter: &'a WalletAdapter,
    app_handle: &'a tauri::AppHandle,
}

impl<'a> TransactionService<'a> {
    pub fn new(wallet_adapter: &'a WalletAdapter, app_handle: &'a tauri::AppHandle) -> Self {
        Self {
            wallet_adapter,
            app_handle,
        }
    }

    /// Prepares a one-sided transaction to be signed by the spend wallet
    ///
    /// # Arguments
    /// * `amount` - Amount to send(MicroMinotari as u64)
    /// * `address` - Recipient's stealth address
    /// * `payment_id` - Optional utf8_string Payment ID for the transaction
    ///
    /// # Returns
    /// * `Result<(PathBuf, String), anyhow::Error>` - Path to the unsigned transaction file and transaction ID
    pub async fn prepare_one_sided_transaction_for_signing(
        &self,
        amount: u64,
        address: String,
        payment_id: Option<String>,
    ) -> Result<(PathBuf, String), anyhow::Error> {
        let payment_recipient = PaymentRecipient {
            address,
            amount,
            raw_payment_id: vec![],
            user_payment_id: payment_id.map(|p_id| UserPaymentId {
                utf8_string: p_id,
                u256: vec![],
                user_bytes: vec![],
            }),
            fee_per_gram: 1, // TODO: Implement fee calculation logic
            payment_type: PaymentType::OneSidedToStealthAddress.into(),
        };

        let mut client = WalletClient::connect(self.wallet_adapter.wallet_grpc_address())
            .await
            .map_err(|_e| WalletStatusMonitorError::WalletNotStarted)?;
        let res = client
            .prepare_one_sided_transaction_for_signing(
                PrepareOneSidedTransactionForSigningRequest {
                    recipient: Some(payment_recipient),
                },
            )
            .await?;

        let prepare_tx_res = res.into_inner();
        let unsigned_tx_json = if prepare_tx_res.is_success {
            prepare_tx_res.result
        } else {
            return Err(anyhow::anyhow!(
                "One-sided transaction preparation failed: {}",
                prepare_tx_res.failure_message
            ));
        };

        // Create directory for transaction files if it doesn't exist
        let wallet_txs_dir = get_transactions_directory(self.app_handle)?;
        if !wallet_txs_dir.exists() {
            std::fs::create_dir_all(&wallet_txs_dir).unwrap_or_else(|e| {
                log::error!(target: LOG_TARGET_APP_LOGIC, "Failed to create transactions directory: {e}");
            });
        }

        // Extract transaction ID from the JSON response
        let parsed: serde_json::Value = serde_json::from_str(&unsigned_tx_json)
            .expect("Failed to parse unsigned one-sided transaction JSON");
        let tx_id = if let Some(tx_id) = parsed.get("tx_id") {
            tx_id.to_string().trim_matches('"').to_string()
        } else {
            return Err(anyhow::anyhow!(
                "One-sided transaction ID not found in JSON file"
            ));
        };

        // Save unsigned transaction to file
        let unsigned_tx_file = wallet_txs_dir.join(format!("{tx_id}-unsigned.json"));
        fs::write(&unsigned_tx_file, &unsigned_tx_json)?;

        Ok((unsigned_tx_file, tx_id))
    }

    /// Cancel a transaction
    /// Used as cleanup after failing to sign one sided transaction by spend wallet
    ///
    /// # Arguments
    /// * `tx_id` - The ID of the transaction to cancel
    ///
    /// # Returns
    /// * `Result<(), anyhow::Error>` - A result indicating success or failure
    pub async fn cancel_transaction(&self, tx_id: String) -> Result<(), anyhow::Error> {
        let wallet_txs_dir = get_transactions_directory(self.app_handle)?;
        let unsigned_tx_file = wallet_txs_dir.join(format!("{tx_id}-unsigned.json"));
        let signed_tx_file = wallet_txs_dir.join(format!("{tx_id}.json"));

        let tx_id_u64 = tx_id
            .parse::<u64>()
            .map_err(|_| anyhow::anyhow!("Invalid transaction ID: {}", tx_id))?;

        let mut client = WalletClient::connect(self.wallet_adapter.wallet_grpc_address())
            .await
            .map_err(|_e| WalletStatusMonitorError::WalletNotStarted)?;
        let res = client
            .cancel_transaction(CancelTransactionRequest { tx_id: tx_id_u64 })
            .await?;

        let cancel_tx_res = res.into_inner();
        if !cancel_tx_res.is_success {
            return Err(anyhow::anyhow!(
                "One-sided transaction preparation failed: {}",
                cancel_tx_res.failure_message
            ));
        };

        // Remove unsigned and signed transaction files
        fs::remove_file(&unsigned_tx_file)?;
        fs::remove_file(&signed_tx_file)?;

        Ok(())
    }

    /// Signs a prepared one-sided transaction using the SpendWallet
    ///
    /// # Arguments
    /// * `unsigned_tx_file` - Path to the unsigned transaction file
    /// * `tx_id` - Transaction ID
    ///
    /// # Returns
    /// * `Result<PathBuf, anyhow::Error>` - Path to the signed transaction file
    pub async fn sign_one_sided_tx(
        &self,
        unsigned_tx_file: PathBuf,
        tx_id: String,
    ) -> Result<PathBuf, anyhow::Error> {
        // Define the output file path for the signed transaction
        let wallet_txs_dir = get_transactions_directory(self.app_handle)?;
        let signed_tx_destination_file = wallet_txs_dir.join(format!("{tx_id}.json"));

        // Sign the transaction using SpendWallet
        let spend_wallet = SpendWallet::new();
        spend_wallet
            .sign_one_sided_transaction(
                unsigned_tx_file,
                signed_tx_destination_file.clone(),
                self.app_handle,
            )
            .await?;

        Ok(signed_tx_destination_file)
    }

    /// Broadcasts a signed one-sided transaction to the network
    ///
    /// # Arguments
    /// * `signed_tx_file` - Path to the signed transaction file
    ///
    /// # Returns
    /// * `Result<(), anyhow::Error>` - Success or failure
    pub async fn broadcast_one_sided_tx(
        &self,
        signed_tx_file: PathBuf,
    ) -> Result<(), anyhow::Error> {
        let signed_tx_json = fs::read_to_string(&signed_tx_file)?;

        let mut client = WalletClient::connect(self.wallet_adapter.wallet_grpc_address())
            .await
            .map_err(|_e| WalletStatusMonitorError::WalletNotStarted)?;

        let res = client
            .broadcast_signed_one_sided_transaction(BroadcastSignedOneSidedTransactionRequest {
                request: signed_tx_json,
            })
            .await?;

        let broadcast_signed_tx_res = res.into_inner();
        if broadcast_signed_tx_res.is_success {
            log::info!(
                target: LOG_TARGET_APP_LOGIC,
                "One-sided transaction broadcasted successfully | tx_id: {}",
                broadcast_signed_tx_res.transaction_id
            );
            Ok(())
        } else {
            Err(anyhow::anyhow!(
                "One-sided transaction broadcast failed: {}",
                broadcast_signed_tx_res.failure_message
            ))
        }
    }
}

/// Gets the directory where transaction files(signed + unsigned) are stored
///
/// # Returns
/// * `Result<PathBuf, anyhow::Error>` - Path to the one-sided transactions directory
pub fn get_transactions_directory(app_handle: &tauri::AppHandle) -> Result<PathBuf, anyhow::Error> {
    let network = Network::get_current_or_user_setting_or_default()
        .to_string()
        .to_lowercase();

    let dir = app_handle
        .path()
        .app_local_data_dir()
        .expect("Couldn't get app_local_data_dir for get_transactions_directory!")
        .join(network)
        .join("sent_transactions");

    Ok(dir)
}
