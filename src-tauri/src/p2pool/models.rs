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

use serde::{Deserialize, Serialize};
use tari_core::transactions::tari_amount::MicroMinotari;
use tari_utilities::epoch_time::EpochTime;

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct StatsBlock {
    pub hash: String,
    pub height: u64,
    pub timestamp: EpochTime,
    pub miner_wallet_address: Option<String>,
}

#[derive(Serialize, Deserialize, Debug, Default, Clone)]
pub struct SquadDetails {
    pub id: String,
    pub name: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ConnectionInfo {
    pub listener_addresses: Vec<String>,
    pub connected_peers: usize,
    pub network_info: NetworkInfo,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub(crate) struct NetworkInfo {
    /// The total number of connected peers.
    pub num_peers: usize,
    /// Counters of ongoing network connections.
    pub connection_counters: ConnectionCounters,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub(crate) struct ConnectionCounters {
    /// The current number of incoming connections.
    pub pending_incoming: u32,
    /// The current number of outgoing connections.
    pub pending_outgoing: u32,
    /// The current number of established inbound connections.
    pub established_incoming: u32,
    /// The current number of established outbound connections.
    pub established_outgoing: u32,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct P2poolStats {
    pub connection_info: ConnectionInfo,
    pub connected_since: Option<EpochTime>,
    pub randomx_stats: ChainStats,
    pub sha3x_stats: ChainStats,
    pub last_gossip_message: EpochTime,
    pub peer_id: String,
    pub squad: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ChainStats {
    // pub squad: SquadDetails,
    // pub num_of_miners: usize,
    pub height: u64,
    // pub share_chain_length: u64,
    // pub miner_block_stats: BlockStats,
    // pub p2pool_block_stats: BlockStats,
}

#[derive(Debug, Serialize, Deserialize, Default, Clone)]
pub struct BlockStats {
    pub accepted: u64,
    pub rejected: u64,
    pub submitted: u64,
}

#[derive(Serialize, Deserialize, Debug, Default, Clone)]
pub struct EstimatedEarnings {
    #[serde(rename = "1min")]
    pub one_minute: MicroMinotari,
    #[serde(rename = "1h")]
    pub one_hour: MicroMinotari,
    #[serde(rename = "1d")]
    pub one_day: MicroMinotari,
    #[serde(rename = "1w")]
    pub one_week: MicroMinotari,
    #[serde(rename = "30d")]
    pub one_month: MicroMinotari,
}

#[derive(Serialize, Deserialize, Debug, Default, Clone)]
pub struct PeerInfo {
    pub version: u64,
    pub peer_id: Option<String>,
    pub current_sha3x_height: u64,
    pub current_random_x_height: u64,
    pub current_sha3x_pow: u128,
    pub current_random_x_pow: u128,
    pub squad: String,
    pub timestamp: u64,
    pub user_agent: Option<String>,
    pub user_agent_version: Option<String>,
    public_addresses: Vec<String>,
}

#[derive(Serialize, Deserialize, Debug, Default, Clone)]
pub(crate) struct ConnectedPeerInfo {
    pub peer_id: String,
    pub peer_info: Option<PeerInfo>,
    pub last_grey_list_reason: Option<String>,
    pub last_ping: Option<u64>,
}

#[derive(Serialize, Deserialize, Debug, Default, Clone)]
pub(crate) struct Connections {
    peers: Vec<ConnectedPeerInfo>,
}
