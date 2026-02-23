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

use minotari_wallet::db::AccountBalance;
use std::sync::LazyLock;
use tokio::sync::RwLock;

use crate::events_emitter::EventsEmitter;
use crate::wallet::minotari_wallet::LOG_TARGET;
use log::info;
use tari_transaction_components::tari_amount::MicroMinotari;

pub static EMPTY_BALANCE: AccountBalance = AccountBalance {
    total: MicroMinotari(0),
    available: MicroMinotari(0),
    locked: MicroMinotari(0),
    unconfirmed: MicroMinotari(0),
    total_credits: None,
    total_debits: None,
    max_height: None,
    max_date: None,
};

static INSTANCE: LazyLock<BalanceTracker> = LazyLock::new(BalanceTracker::new);

pub struct BalanceTracker {
    account_balance: RwLock<AccountBalance>,
}

impl BalanceTracker {
    pub fn new() -> Self {
        Self {
            account_balance: RwLock::new(EMPTY_BALANCE.clone()),
        }
    }

    /// Get the singleton instance
    pub fn current() -> &'static BalanceTracker {
        &INSTANCE
    }

    /// Initialize balance from database AccountBalance
    pub async fn initialize_from_account_balance(&self, account_balance: AccountBalance) {
        let mut current_account = self.account_balance.write().await;
        *current_account = account_balance.clone();

        info!(
            target: LOG_TARGET,
            "Account Balance initialized. {} total, {} avaliable",
            account_balance.total, account_balance.available
        );

        Self::emit_balance(account_balance).await;
    }

    /// Clear balance (e.g., on wallet import)
    pub async fn clear(&self) {
        let mut current = self.account_balance.write().await;
        *current = EMPTY_BALANCE.clone();

        info!(target: LOG_TARGET, "Balance cleared");
        Self::emit_balance(EMPTY_BALANCE.clone()).await;
    }

    /// Get current account balance
    pub async fn get_account_balance(&self) -> AccountBalance {
        let current = self.account_balance.read().await;
        current.clone()
    }

    /// Update balance based on a list of new transactions
    /// This calculates the net change from transactions and applies it
    pub async fn update_from_transactions(&self, updated_account_balance: Option<AccountBalance>) {
        let mut account_balance = self.account_balance.write().await;
        if let Some(updated_balance) = updated_account_balance {
            *account_balance = updated_balance;
        }

        info!(
            target: LOG_TARGET,
            "Balance updated from DB state and transaction. Total: {}, Available: {}",
            account_balance.total, account_balance.available
        );

        Self::emit_balance(account_balance.clone()).await;
    }

    /// Emit balance update to frontend
    async fn emit_balance(account_balance: AccountBalance) {
        EventsEmitter::emit_wallet_balance_update(account_balance).await;
    }
}
