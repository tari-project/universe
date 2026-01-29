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

use minotari_node_grpc_client::grpc::{GetBalanceResponse, NetworkStatusResponse};
use serde::Serialize;
use tari_transaction_components::tari_amount::MicroMinotari;

#[allow(dead_code)]
#[derive(Debug, Clone, Default)]
pub struct WalletState {
    pub scanned_height: u64,
    pub balance: Option<WalletBalance>,
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
pub struct WalletBalance {
    pub available_balance: MicroMinotari,
    pub timelocked_balance: MicroMinotari,
    pub pending_incoming_balance: MicroMinotari,
    pub pending_outgoing_balance: MicroMinotari,
}

impl WalletBalance {
    pub fn from_response(res: GetBalanceResponse) -> Self {
        Self {
            available_balance: MicroMinotari(res.available_balance),
            timelocked_balance: MicroMinotari(res.timelocked_balance),
            pending_incoming_balance: MicroMinotari(res.pending_incoming_balance),
            pending_outgoing_balance: MicroMinotari(res.pending_outgoing_balance),
        }
    }

    pub fn from_option(res: Option<GetBalanceResponse>) -> Option<Self> {
        res.map(Self::from_response)
    }
}

#[derive(Debug, Serialize, Clone)]
pub struct TariAddressVariants {
    pub emoji_string: String,
    pub base58: String,
    pub hex: String,
}
