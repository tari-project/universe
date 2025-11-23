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

use std::{ops::Deref, str::FromStr};

use crate::wallet::minotari_wallet::{
    balance_change_processor::{errors::ProcessingError, types::TranactionDetailsType},
    minotari_wallet_types::{
        InternalTransactionType, MinotariWalletDetails, MinotariWalletOutputDetails,
        MinotariWalletTransaction,
    },
};
use minotari_wallet::models::BalanceChange;
use tari_common_types::tari_address::TariAddress;
use tari_transaction_components::transaction_components::OutputType;

pub struct TransactionBuilder;

impl TransactionBuilder {
    pub fn create_input_details(
        balance_change: &BalanceChange,
        extra_details: MinotariWalletOutputDetails,
    ) -> MinotariWalletDetails {
        MinotariWalletDetails {
            description: balance_change.description.clone(),
            balance_credit: balance_change.balance_credit,
            balance_debit: balance_change.balance_debit,
            claimed_recipient_address: balance_change.claimed_recipient_address.clone(),
            claimed_sender_address: balance_change.claimed_sender_address.clone(),
            memo_parsed: balance_change.memo_parsed.clone(),
            memo_hex: balance_change.memo_hex.clone(),
            claimed_fee: balance_change.claimed_fee.unwrap_or(0),
            claimed_amount: balance_change.claimed_amount,
            confirmed_height: extra_details.confirmed_height,
            status: extra_details.status,
            output_type: extra_details.output_type,
            coinbase_extra: extra_details.coinbase_extra,
            details_type: TranactionDetailsType::Input,
        }
    }

    pub fn create_output_details(
        balance_change: &BalanceChange,
        extra_details: MinotariWalletOutputDetails,
    ) -> MinotariWalletDetails {
        MinotariWalletDetails {
            description: balance_change.description.clone(),
            balance_credit: balance_change.balance_credit,
            balance_debit: balance_change.balance_debit,
            claimed_recipient_address: balance_change.claimed_recipient_address.clone(),
            claimed_sender_address: balance_change.claimed_sender_address.clone(),
            memo_parsed: balance_change.memo_parsed.clone(),
            memo_hex: balance_change.memo_hex.clone(),
            claimed_fee: balance_change.claimed_fee.unwrap_or(0),
            claimed_amount: balance_change.claimed_amount,
            confirmed_height: extra_details.confirmed_height,
            status: extra_details.status,
            output_type: extra_details.output_type,
            coinbase_extra: extra_details.coinbase_extra,
            details_type: TranactionDetailsType::Output,
        }
    }

    pub fn resolve_internal_transaction_type(
        outputs: Vec<MinotariWalletDetails>,
        credit: u64,
        debit: u64,
    ) -> InternalTransactionType {
        // Sent is when the debit is greater than credit
        // Received is when the credit is greater than debit
        // Coinbase is when details hase credit grater then debit and output type is coinbase

        if outputs
            .iter()
            .any(|op| op.output_type == OutputType::Coinbase)
            && credit > debit
        {
            InternalTransactionType::Coinbase
        } else if debit > credit {
            InternalTransactionType::Sent
        } else {
            InternalTransactionType::Received
        }
    }

    pub fn build_from_balance_change_and_details(
        balance_change: &BalanceChange,
        details: &MinotariWalletDetails,
    ) -> MinotariWalletTransaction {
        // -        let recipient_addr = TariAddress::from_str(claimed_recipient_address).map_err(|e| {
        // -            AddressResolutionError::RecipientParseError(format!(
        // -                "Failed to parse '{}': {}",
        // -                claimed_recipient_address, e
        // -            ))
        // -        })?;

        let claimed_recipient_emoji = details
            .claimed_recipient_address
            .as_ref()
            .and_then(|addr| TariAddress::from_str(addr).ok())
            .map(|addr| addr.to_emoji_string());

        let claimed_sender_emoji = details
            .claimed_sender_address
            .as_ref()
            .and_then(|addr| TariAddress::from_str(addr).ok())
            .map(|addr| addr.to_emoji_string());

        let mut transaction = MinotariWalletTransaction {
            id: uuid::Uuid::new_v4().to_string(),
            account_id: balance_change.account_id,
            inputs: vec![],
            outputs: vec![],
            mined_height: balance_change.effective_height,
            effective_date: balance_change.effective_date,
            transaction_balance: balance_change
                .balance_credit
                .saturating_add(balance_change.balance_debit),
            credit_balance: balance_change.balance_credit,
            debit_balance: balance_change.balance_debit,
            internal_transaction_type: InternalTransactionType::Sent, // Will be resolved later
            claimed_recipient_address: details.claimed_recipient_address.clone(),
            claimed_recipient_address_emoji: claimed_recipient_emoji,
            claimed_sender_address: details.claimed_sender_address.clone(),
            claimed_sender_address_emoji: claimed_sender_emoji,
            memo_parsed: balance_change.memo_parsed.clone(),
        };

        match details.details_type {
            TranactionDetailsType::Input => {
                transaction.inputs.push(details.clone());
            }
            TranactionDetailsType::Output => {
                transaction.outputs.push(details.clone());
            }
        }

        transaction.internal_transaction_type = Self::resolve_internal_transaction_type(
            transaction.outputs.deref().to_vec(),
            transaction.credit_balance,
            transaction.debit_balance,
        );

        transaction
    }

    pub fn merge_operation_into_transaction(
        transaction: &mut MinotariWalletTransaction,
        transaction_input: Option<&MinotariWalletDetails>,
        transaction_output: Option<&MinotariWalletDetails>,
    ) {
        let transaction_details = transaction_input
            .as_ref()
            .or(transaction_output.as_ref())
            .ok_or(ProcessingError::MissingOutputDetails(
                transaction.account_id,
                transaction.mined_height,
            ))
            .expect("Transaction must have at least input or output details to merge");

        if let Some(input) = transaction_input {
            transaction.inputs.push(input.clone());
        }

        if let Some(output) = transaction_output {
            transaction.outputs.push(output.clone());
        }

        transaction.credit_balance += transaction_details.balance_credit;
        transaction.debit_balance += transaction_details.balance_debit;
        transaction.transaction_balance = transaction
            .credit_balance
            .abs_diff(transaction.debit_balance);

        transaction.internal_transaction_type = Self::resolve_internal_transaction_type(
            transaction.outputs.deref().to_vec(),
            transaction.credit_balance,
            transaction.debit_balance,
        );

        if let Some(sender_address) = &transaction_details.claimed_sender_address {
            transaction.claimed_sender_address = Some(sender_address.clone());
            transaction.claimed_sender_address_emoji = TariAddress::from_str(sender_address)
                .ok()
                .map(|addr| addr.to_emoji_string());
        };
        if let Some(recipient_address) = &transaction_details.claimed_recipient_address {
            transaction.claimed_recipient_address = Some(recipient_address.clone());
            transaction.claimed_recipient_address_emoji = TariAddress::from_str(recipient_address)
                .ok()
                .map(|addr| addr.to_emoji_string());
        };

        if let Some(memo) = &transaction_details.memo_parsed {
            transaction.memo_parsed = Some(memo.clone());
        }
    }
}
