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
use minotari_wallet::{DisplayedTransaction, db::AccountBalance};
use std::sync::LazyLock;
use tokio::sync::RwLock;

use crate::events_emitter::EventsEmitter;
use crate::wallet::wallet_types::WalletBalance;
use tari_transaction_components::tari_amount::MicroMinotari;

const LOG_TARGET: &str = "tari::universe::wallet::balance_tracker";

static INSTANCE: LazyLock<BalanceTracker> = LazyLock::new(BalanceTracker::new);

pub struct BalanceTracker {
    current_balance: RwLock<MicroMinotari>,
}

impl BalanceTracker {
    pub fn new() -> Self {
        Self {
            current_balance: RwLock::new(MicroMinotari(0)),
        }
    }

    /// Get the singleton instance
    pub fn current() -> &'static BalanceTracker {
        &INSTANCE
    }

    /// Initialize balance from database AccountBalance
    pub async fn initialize_from_account_balance(&self, account_balance: AccountBalance) {
        // Calculate available balance from total_credits - total_debits
        let credits = account_balance.total_credits.unwrap_or(MicroMinotari(0));
        let debits = account_balance.total_debits.unwrap_or(MicroMinotari(0));
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
        *current = MicroMinotari(0);

        info!(target: LOG_TARGET, "Balance cleared");

        Self::emit_balance(MicroMinotari(0)).await;
    }

    /// Get current balance
    pub async fn get_balance(&self) -> MicroMinotari {
        *self.current_balance.read().await
    }

    /// Update balance based on a list of new transactions
    /// This calculates the net change from transactions and applies it
    pub async fn update_from_transactions(&self, transactions: &[DisplayedTransaction]) {
        if transactions.is_empty() {
            return;
        }

        let mut total_credit: MicroMinotari = MicroMinotari(0);
        let mut total_debit: MicroMinotari = MicroMinotari(0);

        for tx in transactions {
            // Use details.total_credit and details.total_debit from DisplayedTransaction
            total_credit = total_credit.saturating_add(tx.details.total_credit);
            total_debit = total_debit.saturating_add(tx.details.total_debit);
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
    async fn emit_balance(balance: MicroMinotari) {
        let wallet_balance = WalletBalance {
            available_balance: balance,
            pending_incoming_balance: MicroMinotari(0),
            pending_outgoing_balance: MicroMinotari(0),
            timelocked_balance: MicroMinotari(0),
        };

        EventsEmitter::emit_wallet_balance_update(wallet_balance).await;
    }
}
