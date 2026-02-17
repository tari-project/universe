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

use log::info;
use minotari_wallet::db::AccountBalance;
use minotari_wallet::scan::BalanceChangeSummary;
use std::sync::LazyLock;
use tokio::sync::RwLock;

use crate::events_emitter::EventsEmitter;
use crate::wallet::minotari_wallet::MinotariWalletManager;
use crate::wallet::minotari_wallet::database_manager::DEFAULT_ACCOUNT_ID;
use crate::wallet::wallet_types::WalletBalance;
use tari_transaction_components::tari_amount::MicroMinotari;

const LOG_TARGET: &str = "tari::universe::wallet::balance_tracker";

const EMPTY_BALANCE: AccountBalance = AccountBalance {
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
    current_balance: RwLock<AccountBalance>,
}

impl BalanceTracker {
    pub fn new() -> Self {
        Self {
            current_balance: RwLock::new(EMPTY_BALANCE.clone()),
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

        let mut current = self.current_balance.write().await;
        *current = account_balance.clone();

        info!(
            target: LOG_TARGET,
            "Balance initialized to {} microTari (credits: {}, debits: {})", account_balance.total, credits, debits
        );

        // Emit initial balance to frontend
        Self::emit_balance(account_balance).await;
    }

    /// Clear balance (e.g., on wallet import)
    pub async fn clear(&self) {
        let mut current = self.current_balance.write().await;
        *current = EMPTY_BALANCE;

        info!(target: LOG_TARGET, "Balance cleared");

        let wallet_balance = WalletBalance {
            available_balance: MicroMinotari(0),
            pending_incoming_balance: MicroMinotari(0),
            pending_outgoing_balance: MicroMinotari(0),
            timelocked_balance: MicroMinotari(0),
        };

        EventsEmitter::emit_wallet_balance_update(wallet_balance).await;
    }

    /// Get current balance
    pub async fn get_balance(&self) -> AccountBalance {
        let current = self.current_balance.read().await;
        current.clone()
    }

    pub async fn update_from_block_event(&self, balance_changes: Vec<BalanceChangeSummary>) {
        if balance_changes.is_empty() {
            return;
        }

        if let Ok(new_balance) =
            MinotariWalletManager::get_account_balance(DEFAULT_ACCOUNT_ID).await
        {
            Self::emit_balance(new_balance).await;
        }
    }

    /// Emit balance update to frontend
    async fn emit_balance(account_balance: AccountBalance) {
        let wallet_balance = WalletBalance {
            available_balance: account_balance.available,
            pending_incoming_balance: account_balance.unconfirmed,
            pending_outgoing_balance: MicroMinotari(0),
            timelocked_balance: account_balance.locked,
        };

        EventsEmitter::emit_wallet_balance_update(wallet_balance).await;
    }
}
