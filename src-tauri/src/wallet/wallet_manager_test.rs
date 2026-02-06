// Copyright 2024. The Tari Project
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

use super::wallet_types::{TransactionInfo, TransactionStatus};
use tari_transaction_components::tari_amount::MicroMinotari;

fn calculate_scan_progress(scanned_height: u64, target_height: u64) -> f64 {
    if target_height > 0 {
        (scanned_height as f64 / target_height as f64 * 100.0).min(100.0)
    } else {
        0.0
    }
}

fn coinbase_statuses_bitflag() -> u32 {
    (1 << TransactionStatus::CoinbaseConfirmed as u32)
        | (1 << TransactionStatus::CoinbaseUnconfirmed as u32)
}

fn find_transaction_by_block_height(
    transactions: Vec<TransactionInfo>,
    block_height: u64,
) -> Option<TransactionInfo> {
    transactions
        .into_iter()
        .find(|tx| tx.mined_in_block_height == block_height)
}

fn create_test_transaction(block_height: u64, status: TransactionStatus) -> TransactionInfo {
    TransactionInfo {
        tx_id: format!("tx_{}", block_height),
        source_address: "source".to_string(),
        dest_address: "dest".to_string(),
        status,
        amount: MicroMinotari(1000),
        is_cancelled: false,
        direction: 1,
        excess_sig: vec![],
        fee: 100,
        timestamp: 1234567890,
        payment_id: "".to_string(),
        mined_in_block_height: block_height,
        payment_reference: None,
    }
}

#[test]
fn test_calculate_scan_progress_normal() {
    assert!((calculate_scan_progress(50, 100) - 50.0).abs() < f64::EPSILON);
    assert!((calculate_scan_progress(75, 100) - 75.0).abs() < f64::EPSILON);
    assert!((calculate_scan_progress(100, 100) - 100.0).abs() < f64::EPSILON);
}

#[test]
fn test_calculate_scan_progress_zero_target() {
    assert!((calculate_scan_progress(50, 0) - 0.0).abs() < f64::EPSILON);
    assert!((calculate_scan_progress(0, 0) - 0.0).abs() < f64::EPSILON);
}

#[test]
fn test_calculate_scan_progress_exceeds_target() {
    assert!((calculate_scan_progress(150, 100) - 100.0).abs() < f64::EPSILON);
    assert!((calculate_scan_progress(1000, 100) - 100.0).abs() < f64::EPSILON);
}

#[test]
fn test_calculate_scan_progress_edge_cases() {
    assert!((calculate_scan_progress(0, 100) - 0.0).abs() < f64::EPSILON);
    assert!((calculate_scan_progress(1, 100) - 1.0).abs() < f64::EPSILON);
    assert!((calculate_scan_progress(99, 100) - 99.0).abs() < f64::EPSILON);
}

#[test]
fn test_coinbase_statuses_bitflag() {
    let bitflag = coinbase_statuses_bitflag();

    let coinbase_confirmed_bit = 1 << (TransactionStatus::CoinbaseConfirmed as u32);
    let coinbase_unconfirmed_bit = 1 << (TransactionStatus::CoinbaseUnconfirmed as u32);

    assert!(bitflag & coinbase_confirmed_bit != 0);
    assert!(bitflag & coinbase_unconfirmed_bit != 0);

    let other_status_bit = 1 << (TransactionStatus::Completed as u32);
    assert!(bitflag & other_status_bit == 0);
}

#[test]
fn test_find_transaction_by_block_height_found() {
    let transactions = vec![
        create_test_transaction(100, TransactionStatus::CoinbaseConfirmed),
        create_test_transaction(200, TransactionStatus::CoinbaseConfirmed),
        create_test_transaction(300, TransactionStatus::CoinbaseUnconfirmed),
    ];

    let result = find_transaction_by_block_height(transactions, 200);
    assert!(result.is_some());
    assert_eq!(result.unwrap().mined_in_block_height, 200);
}

#[test]
fn test_find_transaction_by_block_height_not_found() {
    let transactions = vec![
        create_test_transaction(100, TransactionStatus::CoinbaseConfirmed),
        create_test_transaction(200, TransactionStatus::CoinbaseConfirmed),
    ];

    let result = find_transaction_by_block_height(transactions, 999);
    assert!(result.is_none());
}

#[test]
fn test_find_transaction_by_block_height_empty_list() {
    let transactions: Vec<TransactionInfo> = vec![];
    let result = find_transaction_by_block_height(transactions, 100);
    assert!(result.is_none());
}

#[test]
fn test_find_transaction_by_block_height_first_match() {
    let transactions = vec![
        create_test_transaction(100, TransactionStatus::CoinbaseConfirmed),
        create_test_transaction(100, TransactionStatus::CoinbaseUnconfirmed),
    ];

    let result = find_transaction_by_block_height(transactions, 100);
    assert!(result.is_some());
    assert_eq!(result.unwrap().status, TransactionStatus::CoinbaseConfirmed);
}

#[test]
fn test_transaction_status_from_i32() {
    assert_eq!(TransactionStatus::from(0), TransactionStatus::Completed);
    assert_eq!(TransactionStatus::from(5), TransactionStatus::Coinbase);
    assert_eq!(
        TransactionStatus::from(12),
        TransactionStatus::CoinbaseUnconfirmed
    );
    assert_eq!(
        TransactionStatus::from(13),
        TransactionStatus::CoinbaseConfirmed
    );
    assert_eq!(TransactionStatus::from(999), TransactionStatus::NotFound);
    assert_eq!(TransactionStatus::from(-1), TransactionStatus::NotFound);
}

#[test]
fn test_transaction_status_as_i32() {
    assert_eq!(TransactionStatus::Completed as i32, 0);
    assert_eq!(TransactionStatus::Coinbase as i32, 5);
    assert_eq!(TransactionStatus::CoinbaseUnconfirmed as i32, 12);
    assert_eq!(TransactionStatus::CoinbaseConfirmed as i32, 13);
}
