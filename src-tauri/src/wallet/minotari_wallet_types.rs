use std::fmt::{Display, Formatter};

use chrono::NaiveDateTime;
use minotari_wallet::models::OutputStatus;
use serde::{Deserialize, Serialize};
use tari_transaction_components::transaction_components::{OutputFeatures, OutputType};

#[derive(Clone, Serialize, Deserialize)]
#[serde()]
pub struct WalletOutputFeaturesOnly {
    pub features: OutputFeatures,
}

impl Display for WalletOutputFeaturesOnly {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        write!(
            f,
            "WalletOutputFeaturesOnly {{ features: {:?} }}",
            self.features
        )
    }
}
#[derive(Clone, Deserialize, Serialize, Debug)]
pub struct MinotariWalletOutputDetails {
    pub confirmed_height: Option<u64>,
    pub status: OutputStatus,
    pub output_type: OutputType,
    pub coinbase_extra: String,
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
    pub claimed_recipient_address: String,
    pub claimed_recipient_address_emoji: String,
    pub claimed_sender_address: String,
    pub claimed_sender_address_emoji: String,
    pub memo_parsed: Option<String>,
    pub memo_hex: Option<String>,
    pub claimed_fee: u64,
    pub claimed_amount: Option<u64>,
    pub recieved_output_details: Option<MinotariWalletOutputDetails>,
    pub spent_output_details: Option<MinotariWalletOutputDetails>,
}

impl Display for MinotariWalletDetails {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        write!(
            f,
            "MinotariWalletDetails {{ description: {}, balance_credit: {}, balance_debit: {}, claimed_recipient_address: {}, claimed_recipient_address_emoji: {}, claimed_sender_address: {}, claimed_sender_address_emoji: {}, memo_parsed: {:?}, memo_hex: {:?}, claimed_fee: {}, claimed_amount: {:?}, recieved_output_details: {:?}, spent_output_details: {:?} }}",
            self.description,
            self.balance_credit,
            self.balance_debit,
            self.claimed_recipient_address,
            self.claimed_recipient_address_emoji,
            self.claimed_sender_address,
            self.claimed_sender_address_emoji,
            self.memo_parsed,
            self.memo_hex,
            self.claimed_fee,
            self.claimed_amount,
            self.recieved_output_details,
            self.spent_output_details,
        )
    }
}

#[derive(Clone, Deserialize, Serialize)]
pub struct MinotariWalletTransaction {
    pub id: String,
    pub account_id: i64,
    pub mined_height: u64,
    pub effective_date: NaiveDateTime,
    pub debit_balance: u64,
    pub credit_balance: u64,
    pub transaction_balance: u64,
    pub is_negative: bool,
    pub memo_parsed: Option<String>,
    pub operations: Vec<MinotariWalletDetails>,
}

impl Display for MinotariWalletTransaction {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        write!(
            f,
            "MinotariWalletTransaction {{ id: {}, account_id: {}, mined_height: {}, effective_date: {}, debit_balance: {}, credit_balance: {}, transaction_balance: {}, is_negative: {}, memo_parsed: {:?}, operations: {:?} }}",
            self.id,
            self.account_id,
            self.mined_height,
            self.effective_date,
            self.debit_balance,
            self.credit_balance,
            self.transaction_balance,
            self.is_negative,
            self.memo_parsed,
            self.operations,
        )
    }
}
