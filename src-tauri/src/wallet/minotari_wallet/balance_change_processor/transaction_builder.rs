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
    MinotariWalletDetails, MinotariWalletTransaction,
};
use minotari_wallet::models::BalanceChange;

pub struct TransactionBuilder;

impl TransactionBuilder {
    pub fn build_from_balance_change(
        balance_change: &BalanceChange,
        details: MinotariWalletDetails,
    ) -> MinotariWalletTransaction {
        MinotariWalletTransaction {
            id: uuid::Uuid::new_v4().to_string(),
            account_id: balance_change.account_id,
            operations: vec![details],
            mined_height: balance_change.effective_height,
            effective_date: balance_change.effective_date,
            transaction_balance: balance_change
                .balance_credit
                .saturating_add(balance_change.balance_debit),
            credit_balance: balance_change.balance_credit,
            debit_balance: balance_change.balance_debit,
            is_negative: balance_change.balance_debit > balance_change.balance_credit,
            memo_parsed: balance_change.memo_parsed.clone(),
        }
    }

    pub fn merge_operation_into_transaction(
        transaction: &mut MinotariWalletTransaction,
        balance_change: &BalanceChange,
        details: MinotariWalletDetails,
    ) {
        transaction.operations.push(details);
        transaction.credit_balance += balance_change.balance_credit;
        transaction.debit_balance += balance_change.balance_debit;
        transaction.transaction_balance = transaction
            .credit_balance
            .abs_diff(transaction.debit_balance);
        transaction.is_negative = transaction.debit_balance > transaction.credit_balance;
    }
}
