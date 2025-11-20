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

use crate::wallet::minotari_wallet::minotari_wallet_types::{
    MinotariWalletOutputDetails, MinotariWalletTransaction,
};
use log::warn;

use super::errors::WalletStateError;

static LOG_TARGET: &str = "tari::universe::wallet::minotari_wallet::wallet_state";

#[derive(Debug, Clone)]
pub struct WalletStateData {
    balance: i64,
    last_known_good_balance: i64,
    transactions: Vec<MinotariWalletTransaction>,
}

impl WalletStateData {
    pub fn new() -> Self {
        Self {
            balance: 0,
            last_known_good_balance: 0,
            transactions: Vec::new(),
        }
    }

    pub fn from_raw(
        balance: i64,
        last_known_good_balance: i64,
        transactions: Vec<MinotariWalletTransaction>,
    ) -> Self {
        Self {
            balance,
            last_known_good_balance,
            transactions,
        }
    }

    // Immutable accessors
    pub fn balance(&self) -> i64 {
        self.balance
    }

    pub fn last_known_good_balance(&self) -> i64 {
        self.last_known_good_balance
    }

    pub fn transactions(&self) -> &[MinotariWalletTransaction] {
        &self.transactions
    }

    pub fn transactions_mut(&mut self) -> &mut Vec<MinotariWalletTransaction> {
        &mut self.transactions
    }

    pub fn into_parts(self) -> (i64, i64, Vec<MinotariWalletTransaction>) {
        (
            self.balance,
            self.last_known_good_balance,
            self.transactions,
        )
    }

    pub fn update_balance(&mut self, new_balance: i64) {
        self.last_known_good_balance = self.balance;
        self.balance = new_balance;
    }

    pub fn rollback_balance(&mut self) {
        warn!(
            target: LOG_TARGET,
            "Rolling back balance from {} to last known good: {}",
            self.balance,
            self.last_known_good_balance
        );
        self.balance = self.last_known_good_balance;
    }

    pub fn add_transaction(
        &mut self,
        transaction: MinotariWalletTransaction,
    ) -> Result<(), WalletStateError> {
        if self.transactions.iter().any(|t| t.id == transaction.id) {
            return Err(WalletStateError::DuplicateTransaction {
                transaction_id: transaction.id.clone(),
            });
        }

        self.transactions.push(transaction);
        Ok(())
    }

    pub fn clear_transactions(&mut self) {
        self.transactions.clear();
    }

    pub fn reset(&mut self) {
        self.balance = 0;
        self.last_known_good_balance = 0;
        self.transactions.clear();
    }

    pub fn find_transaction(&self, transaction_id: &str) -> Option<&MinotariWalletTransaction> {
        self.transactions.iter().find(|t| t.id == transaction_id)
    }

    pub fn transaction_count(&self) -> usize {
        self.transactions.len()
    }
}

impl Default for WalletStateData {
    fn default() -> Self {
        Self::new()
    }
}

#[derive(Debug, Clone)]
pub struct OutputDetailsPair {
    pub received: Option<MinotariWalletOutputDetails>,
    pub spent: Option<MinotariWalletOutputDetails>,
}

#[derive(Debug, Clone)]
pub struct ResolvedAddressPair {
    pub recipient_base58: String,
    pub recipient_emoji: String,
    pub sender_base58: String,
    pub sender_emoji: String,
}
