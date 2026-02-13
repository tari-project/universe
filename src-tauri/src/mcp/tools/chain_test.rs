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

use crate::node::node_adapter::{BaseNodeStatus, ReadinessStatus};
use tari_transaction_components::tari_amount::MicroMinotari;

use super::chain::{get_chain_status, get_network_info};

#[test]
fn get_chain_status_returns_ok_with_default_status() {
    let status = BaseNodeStatus::default();
    let result = get_chain_status(&status);
    assert!(result.is_ok());
}

#[test]
fn get_chain_status_contains_expected_fields() {
    let status = BaseNodeStatus::default();
    let json_str = get_chain_status(&status).unwrap();
    let parsed: serde_json::Value = serde_json::from_str(&json_str).unwrap();

    assert!(parsed.get("block_height").is_some());
    assert!(parsed.get("block_time").is_some());
    assert!(parsed.get("block_reward_micro_minotari").is_some());
    assert!(parsed.get("is_synced").is_some());
    assert!(parsed.get("num_connections").is_some());
    assert!(parsed.get("readiness_status").is_some());
}

#[test]
fn get_chain_status_default_values() {
    let status = BaseNodeStatus::default();
    let json_str = get_chain_status(&status).unwrap();
    let parsed: serde_json::Value = serde_json::from_str(&json_str).unwrap();

    assert_eq!(parsed["block_height"], 0);
    assert_eq!(parsed["block_time"], 0);
    assert_eq!(parsed["block_reward_micro_minotari"], 0);
    assert_eq!(parsed["is_synced"], false);
    assert_eq!(parsed["num_connections"], 0);
}

#[test]
fn get_chain_status_with_synced_node() {
    let status = BaseNodeStatus {
        block_height: 50_000,
        block_time: 120,
        block_reward: MicroMinotari(5_000_000),
        is_synced: true,
        num_connections: 8,
        readiness_status: ReadinessStatus::READY,
    };
    let json_str = get_chain_status(&status).unwrap();
    let parsed: serde_json::Value = serde_json::from_str(&json_str).unwrap();

    assert_eq!(parsed["block_height"], 50_000);
    assert_eq!(parsed["block_time"], 120);
    assert_eq!(parsed["block_reward_micro_minotari"], 5_000_000);
    assert_eq!(parsed["is_synced"], true);
    assert_eq!(parsed["num_connections"], 8);
    assert_eq!(parsed["readiness_status"], "Ready");
}

#[test]
fn get_chain_status_default_readiness_is_not_ready() {
    let status = BaseNodeStatus::default();
    let json_str = get_chain_status(&status).unwrap();
    let parsed: serde_json::Value = serde_json::from_str(&json_str).unwrap();

    assert_eq!(parsed["readiness_status"], "Not Ready");
}

#[test]
fn get_chain_status_with_large_block_height() {
    let status = BaseNodeStatus {
        block_height: u64::MAX,
        ..Default::default()
    };
    let result = get_chain_status(&status);
    assert!(result.is_ok());
}

#[test]
fn get_chain_status_with_large_reward() {
    let status = BaseNodeStatus {
        block_reward: MicroMinotari(u64::MAX),
        ..Default::default()
    };
    let result = get_chain_status(&status);
    assert!(result.is_ok());
}

#[test]
fn get_network_info_returns_ok_with_default_status() {
    let status = BaseNodeStatus::default();
    let result = get_network_info(&status);
    assert!(result.is_ok());
}

#[test]
fn get_network_info_contains_expected_fields() {
    let status = BaseNodeStatus::default();
    let json_str = get_network_info(&status).unwrap();
    let parsed: serde_json::Value = serde_json::from_str(&json_str).unwrap();

    assert!(parsed.get("network").is_some());
    assert!(parsed.get("is_synced").is_some());
    assert!(parsed.get("num_connections").is_some());
}

#[test]
fn get_network_info_default_is_not_synced() {
    let status = BaseNodeStatus::default();
    let json_str = get_network_info(&status).unwrap();
    let parsed: serde_json::Value = serde_json::from_str(&json_str).unwrap();

    assert_eq!(parsed["is_synced"], false);
    assert_eq!(parsed["num_connections"], 0);
}

#[test]
fn get_network_info_with_connections() {
    let status = BaseNodeStatus {
        is_synced: true,
        num_connections: 12,
        ..Default::default()
    };
    let json_str = get_network_info(&status).unwrap();
    let parsed: serde_json::Value = serde_json::from_str(&json_str).unwrap();

    assert_eq!(parsed["is_synced"], true);
    assert_eq!(parsed["num_connections"], 12);
}

#[test]
fn get_network_info_network_field_is_string() {
    let status = BaseNodeStatus::default();
    let json_str = get_network_info(&status).unwrap();
    let parsed: serde_json::Value = serde_json::from_str(&json_str).unwrap();

    assert!(parsed["network"].is_string());
}
