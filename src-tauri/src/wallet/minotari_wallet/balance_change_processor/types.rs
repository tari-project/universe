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

use crate::{
    events_emitter::EventsEmitter,
    wallet::minotari_wallet::minotari_wallet_types::{
        MinotariWalletOutputDetails, MinotariWalletTransaction,
    },
};

use serde::{Deserialize, Serialize};

#[derive(Clone, Serialize, Deserialize, Debug, Default)]
pub struct BalanceChangeProcessorStoredTransactions(Vec<MinotariWalletTransaction>);

impl BalanceChangeProcessorStoredTransactions {
    pub fn transactions_mut(&mut self) -> &mut Vec<MinotariWalletTransaction> {
        &mut self.0
    }
    pub fn add_transaction(&mut self, transaction: MinotariWalletTransaction) {
        self.0.push(transaction);
    }
    pub async fn emit(&mut self) {
        println!(
            "================================================ Emitting {} processed transactions",
            self.0.len()
        );
        EventsEmitter::emit_wallet_transactions_found(
            self.0.clone().iter().rev().cloned().collect(),
        )
        .await;
        self.0.clear();
    }
    pub fn clear(&mut self) {
        self.0.clear();
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub enum BalanceChangeProcessorEmitStrategy {
    PerBlock,
    FullyProcessed,
}

pub struct MinotariWalletBalance(u64);
impl MinotariWalletBalance {
    pub fn new(initial_balance: u64) -> Self {
        Self(initial_balance)
    }

    pub fn balance(&self) -> u64 {
        self.0
    }

    pub fn update(&mut self, new_balance: u64) {
        self.0 = new_balance;
    }
}
#[derive(Clone, Deserialize, Serialize, Debug)]
pub enum TranactionDetailsType {
    Input,
    Output,
}

#[derive(Debug, Clone)]
pub struct OutputDetailsPair {
    pub input: Option<MinotariWalletOutputDetails>,
    pub output: Option<MinotariWalletOutputDetails>,
}
