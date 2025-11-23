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
    InternalTransactionType, MinotariWalletDetails, MinotariWalletTransaction,
};
use minotari_wallet::models::BalanceChange;
use tari_transaction_components::transaction_components::OutputType;

pub struct TransactionMatcher;

impl TransactionMatcher {
    pub fn find_mergeable_transaction<'a>(
        transactions: &'a mut [MinotariWalletTransaction],
        balance_change: &BalanceChange,
        transaction_details: &MinotariWalletDetails,
    ) -> Option<&'a mut MinotariWalletTransaction> {
        // Check if there are any transactions to merge with
        if transactions.is_empty() {
            return None;
        }

        // If it is a coinbase output, we do not merge it as it should be its own transaction
        if transaction_details.output_type == OutputType::Coinbase
            && transaction_details.balance_credit > 0
        {
            return None;
        };

        // Check if there are any non coinbase operations in existing transactions
        if transactions.iter().all(|transaction| {
            transaction
                .internal_transaction_type
                .eq(&InternalTransactionType::Coinbase)
        }) {
            return None;
        };

        // Find matching transaction by metadata which means:
        // - mined height
        // - effective date
        // - account id
        // - If claimed sender address exists both in transaction and balance change then they must be equal
        // - If claimed recipient address exists both in transaction and balance change then they must be equal

        transactions.iter_mut().find(|transaction| {
            transaction.mined_height == balance_change.effective_height
                && transaction.effective_date == balance_change.effective_date
                && transaction.account_id == balance_change.account_id
                && (transaction_details.memo_parsed.is_none()
                    || transaction_details.memo_parsed == transaction.memo_parsed)
                && (transaction_details.claimed_sender_address.is_none()
                    || transaction_details.claimed_sender_address.clone()
                        == transaction.claimed_sender_address.clone())
                && (transaction_details.claimed_recipient_address.is_none()
                    || transaction_details.claimed_recipient_address.clone()
                        == transaction.claimed_recipient_address.clone())
        })
    }
}
