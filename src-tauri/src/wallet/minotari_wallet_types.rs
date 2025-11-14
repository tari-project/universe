use chrono::NaiveDateTime;
use minotari_wallet::models::OutputStatus;
use serde::{Deserialize, Serialize};
use tari_transaction_components::transaction_components::WalletOutput;

pub struct MinotariWalletBalance(i64);
#[derive(Clone, Deserialize, Serialize)]
pub struct MinotariWalletOutputDetails {
    pub confirmed_height: Option<u64>,
    pub status: OutputStatus,
    pub wallet_output_json: WalletOutput,
}

#[derive(Clone, Deserialize, Serialize)]
pub struct MinotariWalletDetails {
    pub description: String,
    pub balance_credit: u64,
    pub balance_debit: u64,
    pub claimed_recipient_address: String,
    pub claimed_sender_address: String,
    pub memo_parsed: Option<String>,
    pub memo_hex: Option<String>,
    pub claimed_fee: u64,
    pub claimed_amount: Option<u64>,
    pub recieved_output_details: Option<MinotariWalletOutputDetails>,
    pub spent_output_details: Option<MinotariWalletOutputDetails>,
}

#[derive(Clone, Deserialize, Serialize)]
pub struct MinotariWalletTransaction {
    pub account_id: i64,
    pub mined_height: u64,
    pub effective_date: NaiveDateTime,
    pub operations: Vec<MinotariWalletDetails>,
}
