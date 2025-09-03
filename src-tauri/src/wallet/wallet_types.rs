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

use std::{collections::HashMap, str::FromStr};

use minotari_node_grpc_client::grpc::{GetBalanceResponse, NetworkStatusResponse};
use serde::{Serialize, Serializer};
use tari_transaction_components::tari_amount::MicroMinotari;

#[allow(dead_code)]
#[derive(Debug, Clone, Default)]
pub struct WalletState {
    pub scanned_height: u64,
    pub balance: Option<Balances>,
    pub network: Option<NetworkStatus>,
}

#[allow(dead_code)]
#[derive(Debug, Copy, Clone, Default)]
pub struct NetworkStatus {
    pub status: ConnectivityStatus,
    pub avg_latency_ms: u32,
    pub num_node_connections: u32,
}

impl NetworkStatus {
    pub fn from(res: Option<NetworkStatusResponse>) -> Option<Self> {
        match res {
            Some(res) => Some(Self {
                status: match res.status {
                    0 => ConnectivityStatus::Initializing,
                    1 => ConnectivityStatus::Online(res.num_node_connections as usize),
                    2 => ConnectivityStatus::Degraded(res.num_node_connections as usize),
                    3 => ConnectivityStatus::Offline,
                    _ => return None,
                },
                avg_latency_ms: res.avg_latency_ms,
                num_node_connections: res.num_node_connections,
            }),
            None => None,
        }
    }
}

#[allow(dead_code)]
#[derive(Default, Debug, Copy, Clone)]
pub enum ConnectivityStatus {
    /// Initial connectivity status before the Connectivity actor has initialized.
    #[default]
    Initializing,
    /// Connectivity is online.
    Online(usize),
    /// Connectivity is less than the required minimum, but some connections are still active.
    Degraded(usize),
    /// There are no active connections.
    Offline,
}

#[derive(Debug, Clone, Serialize)]
pub struct Balances {
    pub balances: HashMap<Currency, WalletBalance>,
}

#[derive(Debug, Clone, Serialize)]
pub struct WalletBalance {
    pub currency: Currency,
    pub available_balance: u64,
    pub timelocked_balance: u64,
    // pub pending_incoming_balance: MicroMinotari,
    // pub pending_outgoing_balance: MicroMinotari,
}

impl WalletBalance {
    pub fn from_response(res: GetBalanceResponse) -> Self {
        Self {
            currency: Currency::Xtm,
            available_balance: res.available_balance,
            timelocked_balance: res.timelocked_balance,
            // pending_incoming_balance: MicroMinotari(res.pending_incoming_balance),
            // pending_outgoing_balance: MicroMinotari(res.pending_outgoing_balance),
        }
    }

    pub fn from_option(res: Option<GetBalanceResponse>) -> Option<Self> {
        res.map(Self::from_response)
    }
}

#[derive(Debug, Serialize, Clone, Eq, PartialEq, Hash)]
pub enum Currency {
    Xtm,
    Xtr,
    Usdx,
}

#[derive(Debug, Serialize, Clone, PartialEq, Eq, Hash)]
pub struct ChainId(pub String);

impl FromStr for ChainId {
    type Err = std::string::ParseError;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        Ok(ChainId(s.to_string()))
    }
}

impl ChainId {
    pub fn minotari() -> Self {
        ChainId("minotari".to_string())
    }

    pub fn ootle() -> Self {
        ChainId("ootle".to_string())
    }
}

#[derive(Debug, Serialize, Clone)]
pub struct TransactionInfo {
    pub id: u32,
    pub source_address: String,
    pub dest_address: String,
    pub status: TransactionStatus,
    pub amount: u64,
    pub currency: Currency,
    pub wallet_id: u32,
    pub is_cancelled: bool,
    pub direction: i32,
    pub excess_sig: Vec<u8>,
    pub fee: u64,
    pub timestamp: u64,
    pub payment_id: String,
    pub mined_in_block_height: u64,
    pub mined_in_chain_id: ChainId,
    pub payment_reference: Option<String>,
}

#[derive(Debug, Serialize, Clone)]
pub struct TariAddressVariants {
    pub emoji_string: String,
    pub base58: String,
    pub hex: String,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
#[repr(i32)]
pub enum TransactionStatus {
    /// This transaction has been completed between the parties but has not been broadcast to the base layer network.
    Completed = 0,
    /// This transaction has been broadcast to the base layer network and is currently in one or more base node mempools.
    Broadcast = 1,
    /// This transaction has been mined and included in a block.
    MinedUnconfirmed = 2,
    /// This transaction was generated as part of importing a spendable UTXO
    Imported = 3,
    /// This transaction is still being negotiated by the parties
    Pending = 4,
    /// This is a created Coinbase Transaction
    Coinbase = 5,
    /// This transaction is mined and confirmed at the current base node's height
    MinedConfirmed = 6,
    /// The transaction was rejected by the mempool
    Rejected = 7,
    /// This is faux transaction mainly for one-sided transaction outputs or wallet recovery outputs have been found
    OneSidedUnconfirmed = 8,
    /// All Imported and FauxUnconfirmed transactions will end up with this status when the outputs have been confirmed
    OneSidedConfirmed = 9,
    /// This transaction is still being queued for sending
    Queued = 10,
    /// The transaction was not found by the wallet its in transaction database
    NotFound = 11,
    /// This is Coinbase transaction that is detected from chain
    CoinbaseUnconfirmed = 12,
    /// This is Coinbase transaction that is detected from chain
    CoinbaseConfirmed = 13,
    /// This is Coinbase transaction that is not currently detected as mined
    CoinbaseNotInBlockChain = 14,
}

// We should decide which format we wanna use
impl Serialize for TransactionStatus {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        serializer.serialize_i32(*self as i32)
    }
}

impl From<i32> for TransactionStatus {
    fn from(value: i32) -> Self {
        match value {
            0 => TransactionStatus::Completed,
            1 => TransactionStatus::Broadcast,
            2 => TransactionStatus::MinedUnconfirmed,
            3 => TransactionStatus::Imported,
            4 => TransactionStatus::Pending,
            5 => TransactionStatus::Coinbase,
            6 => TransactionStatus::MinedConfirmed,
            7 => TransactionStatus::Rejected,
            8 => TransactionStatus::OneSidedUnconfirmed,
            9 => TransactionStatus::OneSidedConfirmed,
            10 => TransactionStatus::Queued,
            11 => TransactionStatus::NotFound,
            12 => TransactionStatus::CoinbaseUnconfirmed,
            13 => TransactionStatus::CoinbaseConfirmed,
            14 => TransactionStatus::CoinbaseNotInBlockChain,
            _ => TransactionStatus::NotFound,
        }
    }
}

#[derive(Debug)]
pub enum WalletEvent {
    OutputRolledBack {},
}

pub struct WalletInfo {
    pub id: i64,
    pub name: String,
    // currency_symbol: String,
    // decimal_places: i64,
    pub view_key_reference: String,
    pub chain_id: ChainId,
    // chain_resource_id: Option<String>,
    pub chain_birthday_height: u64,
    pub last_scanned_height: Option<u64>,
    pub last_scanned_hash: Option<Vec<u8>>,
    // created_at: chrono::NaiveDateTime,
}
