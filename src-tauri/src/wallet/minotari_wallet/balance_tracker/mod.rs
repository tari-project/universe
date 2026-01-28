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

mod balance_calculator;
mod errors;

pub use balance_calculator::BalanceCalculator;
use log::{error, info};
use minotari_wallet::transactions::{TransactionDisplayStatus, TransactionSource};
use minotari_wallet::{db::AccountBalance, DisplayedTransaction};
use std::sync::LazyLock;
use tokio::sync::RwLock;

use crate::airdrop::send_new_block_mined;
use crate::configs::config_core::ConfigCore;
use crate::configs::trait_config::ConfigImpl;
use crate::events_emitter::EventsEmitter;
use crate::wallet::wallet_types::WalletBalance;
use tari_transaction_components::tari_amount::MicroMinotari;
use tauri::AppHandle;

const LOG_TARGET: &str = "tari::universe::wallet::balance_tracker";

static INSTANCE: LazyLock<BalanceTracker> = LazyLock::new(BalanceTracker::new);

pub struct BalanceTracker {
    current_balance: RwLock<u64>,
    app_handle: RwLock<Option<AppHandle>>,
}

impl BalanceTracker {
    pub fn new() -> Self {
        Self {
            current_balance: RwLock::new(0),
            app_handle: RwLock::new(None),
        }
    }

    /// Get the singleton instance
    pub fn current() -> &'static BalanceTracker {
        &INSTANCE
    }

    pub async fn load_app_handle(app_handle: AppHandle) {
        let mut handle_lock = INSTANCE.app_handle.write().await;
        *handle_lock = Some(app_handle);
    }

    /// Initialize balance from database AccountBalance
    pub async fn initialize_from_account_balance(&self, account_balance: AccountBalance) {
        // Calculate available balance from total_credits - total_debits
        let credits = account_balance.total_credits.unwrap_or(0) as u64;
        let debits = account_balance.total_debits.unwrap_or(0) as u64;
        let balance = credits.saturating_sub(debits);

        let mut current = self.current_balance.write().await;
        *current = balance;

        info!(
            target: LOG_TARGET,
            "Balance initialized to {} microTari (credits: {}, debits: {})", balance, credits, debits
        );

        // Emit initial balance to frontend
        Self::emit_balance(balance).await;
    }

    /// Clear balance (e.g., on wallet import)
    pub async fn clear(&self) {
        let mut current = self.current_balance.write().await;
        *current = 0;

        info!(target: LOG_TARGET, "Balance cleared");

        Self::emit_balance(0).await;
    }

    /// Get current balance
    pub async fn get_balance(&self) -> u64 {
        *self.current_balance.read().await
    }

    /// Update balance based on a list of new transactions
    /// This calculates the net change from transactions and applies it
    pub async fn update_from_transactions(&self, transactions: &[DisplayedTransaction]) {
        if transactions.is_empty() {
            return;
        }

        let mut total_credit: u64 = 0;
        let mut total_debit: u64 = 0;
        let mut latest_win: Option<&DisplayedTransaction> = None;

        for tx in transactions {
            // Use details.total_credit and details.total_debit from DisplayedTransaction
            total_credit = total_credit.saturating_add(tx.details.total_credit);
            total_debit = total_debit.saturating_add(tx.details.total_debit);

            if tx.source == TransactionSource::Coinbase
                && tx.status == TransactionDisplayStatus::Confirmed
            {
                latest_win = Some(tx)
            }
        }

        let current = self.get_balance().await;

        match BalanceCalculator::calculate_new_balance(current, total_credit, total_debit) {
            Ok(new_balance) => {
                let mut balance = self.current_balance.write().await;
                *balance = new_balance;

                info!(
                    target: LOG_TARGET,
                    "Balance updated: {} -> {} (credit: +{}, debit: -{})",
                    current, new_balance, total_credit, total_debit
                );

                if let Some(latest_win_tx) = latest_win {
                    let emit_win = transactions
                        .last()
                        .is_some_and(|tx| tx.id == latest_win_tx.id);
                    if emit_win {
                        Self::emit_change_from_mined(self, latest_win_tx.clone()).await;
                    }
                }

                Self::emit_balance(new_balance).await;
            }
            Err(e) => {
                error!(
                    target: LOG_TARGET,
                    "Failed to calculate new balance: {:?}", e
                );
            }
        }
    }

    /// Emit balance update to frontend
    async fn emit_balance(balance: u64) {
        let wallet_balance = WalletBalance {
            available_balance: MicroMinotari(balance),
            pending_incoming_balance: MicroMinotari(0),
            pending_outgoing_balance: MicroMinotari(0),
            timelocked_balance: MicroMinotari(0),
        };

        EventsEmitter::emit_wallet_balance_update(wallet_balance).await;
    }
    /// Emit new mined block if balance change was from a mined block
    async fn emit_change_from_mined(&self, coinbase_tx: DisplayedTransaction) {
        let tx = coinbase_tx.clone();
        let block_height = tx.blockchain.block_height;
        EventsEmitter::emit_new_block_mined(block_height, Some(tx)).await;

        if let Some(handle) = self.app_handle.read().await.clone() {
            let allow_notifications = *ConfigCore::content().await.allow_notifications();
            if allow_notifications {
                send_new_block_mined(handle.clone(), block_height).await;
            }
        }
    }
}
