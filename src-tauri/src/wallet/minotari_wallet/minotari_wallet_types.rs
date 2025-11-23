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

use std::fmt::{Display, Formatter};

use chrono::NaiveDateTime;
use minotari_wallet::models::OutputStatus;
use serde::{Deserialize, Serialize};
use tari_transaction_components::transaction_components::{MemoField, OutputFeatures, OutputType};

use crate::wallet::minotari_wallet::balance_change_processor::types::TranactionDetailsType;

#[derive(Clone, Serialize, Deserialize)]
#[serde()]
pub struct WalletOutputFeaturesAndMemoOnly {
    pub features: OutputFeatures,
    pub payment_id: MemoField,
}

impl Display for WalletOutputFeaturesAndMemoOnly {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        write!(
            f,
            "WalletOutputFeaturesAndMemoOnly {{ features: {:?}, payment_id: {:?} }}",
            self.features, self.payment_id
        )
    }
}
#[derive(Clone, Deserialize, Serialize, Debug)]
pub struct MinotariWalletOutputDetails {
    pub confirmed_height: Option<u64>,
    pub status: OutputStatus,
    pub output_type: OutputType,
    pub coinbase_extra: String,
    pub transaction_token_amount: Option<u64>, // Present only when payment_id => MemoField::TransactionInfo
}

impl Display for MinotariWalletOutputDetails {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        write!(
            f,
            "MinotariWalletOutputDetails {{ confirmed_height: {:?}, status: {:?}, output_type: {:?}, coinbase_extra: {} }}",
            self.confirmed_height,
            self.status,
            self.output_type,
            self.coinbase_extra,
        )
    }
}
#[derive(Clone, Deserialize, Serialize, Debug)]
pub struct MinotariWalletDetails {
    pub description: String,
    pub balance_credit: u64,
    pub balance_debit: u64,
    pub claimed_recipient_address: Option<String>,
    pub claimed_sender_address: Option<String>,
    pub memo_parsed: Option<String>,
    pub memo_hex: Option<String>,
    pub claimed_fee: u64,
    pub claimed_amount: Option<u64>,
    pub confirmed_height: Option<u64>,
    pub status: OutputStatus,
    pub output_type: OutputType,
    pub coinbase_extra: String,
    pub details_type: TranactionDetailsType,
    pub transaction_token_amount: Option<u64>,
}

impl Display for MinotariWalletDetails {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        write!(
            f,
            "MinotariWalletDetails {{ description: {}, balance_credit: {}, balance_debit: {}, claimed_recipient_address: {:?}, claimed_sender_address: {:?}, memo_parsed: {:?}, memo_hex: {:?}, claimed_fee: {}, claimed_amount: {:?}, confirmed_height: {:?}, status: {:?}, output_type: {:?}, coinbase_extra: {} }}",
            self.description,
            self.balance_credit,
            self.balance_debit,
            self.claimed_recipient_address,
            self.claimed_sender_address,
            self.memo_parsed,
            self.memo_hex,
            self.claimed_fee,
            self.claimed_amount,
            self.confirmed_height,
            self.status,
            self.output_type,
            self.coinbase_extra,
        )
    }
}

#[derive(Debug, Clone, Deserialize, Serialize, Eq, PartialEq)]
pub enum InternalTransactionType {
    Sent,
    Received,
    Coinbase,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct MinotariWalletTransaction {
    pub id: String,
    pub account_id: i64,
    pub mined_height: u64,
    pub effective_date: NaiveDateTime,
    pub debit_balance: u64,
    pub credit_balance: u64,
    pub transaction_balance: u64,
    pub claimed_recipient_address: Option<String>,
    pub claimed_recipient_address_emoji: Option<String>,
    pub claimed_sender_address: Option<String>,
    pub claimed_sender_address_emoji: Option<String>,
    pub internal_transaction_type: InternalTransactionType,
    pub memo_parsed: Option<String>,
    pub inputs: Vec<MinotariWalletDetails>,
    pub outputs: Vec<MinotariWalletDetails>,
}

impl Display for MinotariWalletTransaction {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        write!(
            f,
            "MinotariWalletTransaction {{ id: {}, account_id: {}, mined_height: {}, effective_date: {}, debit_balance: {}, credit_balance: {}, transaction_balance: {}, internal_transaction_type: {:?}, memo_parsed: {:?}, inputs: {:?}, outputes: {:?}}}",
            self.id,
            self.account_id,
            self.mined_height,
            self.effective_date,
            self.debit_balance,
            self.credit_balance,
            self.transaction_balance,
            self.internal_transaction_type,
            self.memo_parsed,
            self.inputs,
            self.outputs
        )
    }
}
