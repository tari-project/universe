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
use log::info;

use super::transaction_builder::TransactionBuilder;

static LOG_TARGET: &str =
    "tari::universe::wallet::minotari_wallet::balance_change_processor::input_matcher";

pub struct InputMatcher;

impl InputMatcher {
    pub fn match_inputs_to_transactions(
        stored_inputs: &mut Vec<MinotariWalletDetails>,
        transactions: &mut Vec<MinotariWalletTransaction>,
    ) -> usize {
        if stored_inputs.is_empty() {
            return 0;
        }

        info!(
            target: LOG_TARGET,
            "Matching {} inputs against {} transactions",
            stored_inputs.len(),
            transactions.len()
        );

        // Filter to non-coinbase transactions for matching
        let mut non_coinbase_transactions: Vec<MinotariWalletTransaction> = transactions
            .iter()
            .filter(|tx| tx.internal_transaction_type != InternalTransactionType::Coinbase)
            .cloned()
            .collect();

        let mut matched_input_indices = Vec::new();

        for combination_size in 1..=stored_inputs.len() {
            if matched_input_indices.len() == stored_inputs.len() {
                break;
            }

            let available_indices: Vec<usize> = (0..stored_inputs.len())
                .filter(|i| !matched_input_indices.contains(i))
                .collect();

            if available_indices.len() < combination_size {
                continue;
            }

            let combinations = Self::generate_combinations(&available_indices, combination_size);

            for combination_indices in combinations {
                let inputs_debit_sum: u64 = combination_indices
                    .iter()
                    .map(|&idx| stored_inputs[idx].balance_debit)
                    .sum();

                let mut matched_transaction_idx = None;

                for (tx_idx, transaction) in non_coinbase_transactions.iter_mut().enumerate() {
                    if !transaction.inputs.is_empty() {
                        continue;
                    }

                    let outputs_token_sum: u64 = transaction
                        .outputs
                        .iter()
                        .filter_map(|output| output.transaction_token_amount)
                        .sum();

                    if Self::is_match(
                        inputs_debit_sum,
                        transaction.credit_balance,
                        outputs_token_sum,
                    ) {
                        for &input_idx in &combination_indices {
                            TransactionBuilder::merge_operation_into_transaction(
                                transaction,
                                Some(&stored_inputs[input_idx]),
                                None,
                            );
                        }

                        matched_transaction_idx = Some(tx_idx);
                        matched_input_indices.extend(combination_indices.clone());
                        break;
                    }
                }

                if matched_transaction_idx.is_some() {
                    continue;
                }
            }
        }

        Self::apply_matched_transactions(transactions, non_coinbase_transactions);

        let matched_count = matched_input_indices.len();
        info!(
            target: LOG_TARGET,
            "Matched {} of {} inputs",
            matched_count,
            stored_inputs.len()
        );

        matched_input_indices.sort_unstable();
        for &idx in matched_input_indices.iter().rev() {
            stored_inputs.remove(idx);
        }

        matched_count
    }

    fn is_match(inputs_debit_sum: u64, transaction_credit: u64, outputs_token_sum: u64) -> bool {
        const TOLERANCE: u64 = 999_999;

        inputs_debit_sum
            .checked_sub(transaction_credit)
            .map(|diff| diff.abs_diff(outputs_token_sum) <= TOLERANCE)
            .unwrap_or(false)
    }

    fn apply_matched_transactions(
        transactions: &mut Vec<MinotariWalletTransaction>,
        non_coinbase_transactions: Vec<MinotariWalletTransaction>,
    ) {
        let mut final_transactions = Vec::new();
        let mut non_coinbase_idx = 0;

        for transaction in transactions.iter() {
            if transaction.internal_transaction_type == InternalTransactionType::Coinbase {
                final_transactions.push(transaction.clone());
            } else if non_coinbase_idx < non_coinbase_transactions.len() {
                final_transactions.push(non_coinbase_transactions[non_coinbase_idx].clone());
                non_coinbase_idx += 1;
            } else {
                // This case should not happen, but just in case, we push the original transaction
                final_transactions.push(transaction.clone());
            }
        }

        *transactions = final_transactions;
    }

    fn generate_combinations(items: &[usize], size: usize) -> Vec<Vec<usize>> {
        if size == 0 {
            return vec![vec![]];
        }
        if items.is_empty() {
            return vec![];
        }

        let mut result = Vec::new();

        for i in 0..=items.len().saturating_sub(size) {
            let first = items[i];
            let remaining = &items[i + 1..];
            let sub_combinations = Self::generate_combinations(remaining, size - 1);

            for mut sub_combo in sub_combinations {
                let mut combo = vec![first];
                combo.append(&mut sub_combo);
                result.push(combo);
            }
        }

        result
    }
}
