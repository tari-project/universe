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

use super::node_manager::{NodeManagerError, NodeType, STOP_ON_ERROR_CODES};
use crate::network_utils::NetworkExt;

#[test]
fn node_type_local_is_local() {
    assert!(NodeType::Local.is_local());
}

#[test]
fn node_type_remote_until_local_is_local() {
    assert!(NodeType::RemoteUntilLocal.is_local());
}

#[test]
fn node_type_local_after_remote_is_local() {
    assert!(NodeType::LocalAfterRemote.is_local());
}

#[test]
fn node_type_remote_not_local() {
    assert!(!NodeType::Remote.is_local());
}

#[test]
fn node_type_remote_is_remote() {
    assert!(NodeType::Remote.is_remote());
}

#[test]
fn node_type_remote_until_local_is_remote() {
    assert!(NodeType::RemoteUntilLocal.is_remote());
}

#[test]
fn node_type_local_not_remote() {
    assert!(!NodeType::Local.is_remote());
}

#[test]
fn node_type_local_after_remote_not_remote() {
    assert!(!NodeType::LocalAfterRemote.is_remote());
}

#[test]
fn node_type_display() {
    assert_eq!(format!("{}", NodeType::Local), "Local");
    assert_eq!(format!("{}", NodeType::Remote), "Remote");
    assert_eq!(
        format!("{}", NodeType::RemoteUntilLocal),
        "RemoteUntilLocal"
    );
    assert_eq!(
        format!("{}", NodeType::LocalAfterRemote),
        "LocalAfterRemote"
    );
}

#[test]
fn node_type_serialization() {
    let local = NodeType::Local;
    let serialized = serde_json::to_string(&local).unwrap();
    let deserialized: NodeType = serde_json::from_str(&serialized).unwrap();
    assert_eq!(local, deserialized);

    let remote = NodeType::Remote;
    let serialized = serde_json::to_string(&remote).unwrap();
    let deserialized: NodeType = serde_json::from_str(&serialized).unwrap();
    assert_eq!(remote, deserialized);

    let remote_until_local = NodeType::RemoteUntilLocal;
    let serialized = serde_json::to_string(&remote_until_local).unwrap();
    let deserialized: NodeType = serde_json::from_str(&serialized).unwrap();
    assert_eq!(remote_until_local, deserialized);

    let local_after_remote = NodeType::LocalAfterRemote;
    let serialized = serde_json::to_string(&local_after_remote).unwrap();
    let deserialized: NodeType = serde_json::from_str(&serialized).unwrap();
    assert_eq!(local_after_remote, deserialized);
}

#[test]
fn node_type_default() {
    let default_type: NodeType = Default::default();
    assert_eq!(default_type, NodeType::Remote);
}

#[test]
fn node_type_equality() {
    assert_eq!(NodeType::Local, NodeType::Local);
    assert_eq!(NodeType::Remote, NodeType::Remote);
    assert_ne!(NodeType::Local, NodeType::Remote);
    assert_ne!(NodeType::RemoteUntilLocal, NodeType::LocalAfterRemote);
}

#[test]
fn node_manager_error_exit_code_display() {
    let error = NodeManagerError::ExitCode(114);
    let display = format!("{}", error);
    assert!(display.contains("114"));
    assert!(display.contains("exit code"));
}

#[test]
fn node_manager_error_unknown_error_display() {
    let error = NodeManagerError::UnknownError(anyhow::anyhow!("test error"));
    let display = format!("{}", error);
    assert!(display.contains("test error"));
}

#[test]
fn stop_on_error_codes_contains_expected_values() {
    assert!(STOP_ON_ERROR_CODES.contains(&114));
    assert!(STOP_ON_ERROR_CODES.contains(&102));
    assert!(STOP_ON_ERROR_CODES.contains(&101));
    assert_eq!(STOP_ON_ERROR_CODES.len(), 3);
}

#[test]
fn test_localnet_explicit_remote_uses_the_configured_chain() {
    use tari_common::configuration::Network;
    assert_eq!(
        NodeType::Remote.for_network(Network::LocalNet),
        NodeType::Remote
    );
    assert_eq!(
        NodeType::Local.for_network(Network::LocalNet),
        NodeType::Local
    );
    assert_eq!(
        NodeType::RemoteUntilLocal.for_network(Network::LocalNet),
        NodeType::Local
    );
    for network in [
        Network::MainNet,
        Network::Esmeralda,
        Network::StageNet,
        Network::NextNet,
        Network::Igor,
    ] {
        let expected = if network.is_solo_network() {
            NodeType::Local
        } else {
            NodeType::Remote
        };
        assert_eq!(NodeType::Remote.for_network(network), expected);
    }
}

#[tokio::test]
async fn remote_until_local_remote_configuration_is_ready_without_local_or_tor() {
    use super::node_manager::NodeManager;
    use crate::{
        BaseNodeStatus, LocalNodeAdapter, RemoteNodeAdapter,
        process_stats_collector::ProcessStatsCollectorBuilder,
    };
    use tari_common::configuration::Network;
    use tari_transaction_components::consensus::ConsensusManager;
    use tokio::sync::watch;

    let mut stats = ProcessStatsCollectorBuilder::new();
    let (base_tx, _base_rx) = watch::channel(BaseNodeStatus::default());
    let (local_tx, local_rx) = watch::channel(BaseNodeStatus::default());
    let (remote_tx, remote_rx) = watch::channel(BaseNodeStatus::default());
    let consensus = ConsensusManager::builder(Network::get_current()).build();

    let manager = NodeManager::new(
        &mut stats,
        LocalNodeAdapter::new(local_tx, consensus.clone()),
        RemoteNodeAdapter::new(remote_tx, consensus),
        NodeType::RemoteUntilLocal,
        base_tx,
        local_rx,
        remote_rx,
    );

    manager
        .configure_remote_only_for_test(Some("https://grpc.tari.com:443".to_string()))
        .await
        .expect("configure remote");

    // Remote service is immediately active for wallet & solo mining before Tor or local node start.
    assert_eq!(
        manager.get_grpc_address().await.expect("remote grpc"),
        "https://grpc.tari.com:443"
    );
    assert!(!manager.is_local_watcher_running_for_test().await);

    // Background local node falls back to TCP without displacing current remote service.
    manager
        .configure_local_for_test(false, None, None)
        .await
        .expect("configure local tcp fallback");

    assert_eq!(
        manager.local_adapter_tor_state_for_test().await,
        Some((false, None))
    );
    assert_eq!(
        manager.get_grpc_address().await.expect("still remote grpc"),
        "https://grpc.tari.com:443"
    );
}

#[tokio::test]
async fn local_node_tcp_fallback_clears_tor_settings_on_current_adapter() {
    use super::node_manager::NodeManager;
    use crate::{
        BaseNodeStatus, LocalNodeAdapter, RemoteNodeAdapter,
        process_stats_collector::ProcessStatsCollectorBuilder,
    };
    use std::path::PathBuf;
    use tari_common::configuration::Network;
    use tari_transaction_components::consensus::ConsensusManager;
    use tokio::sync::watch;

    let mut stats = ProcessStatsCollectorBuilder::new();
    let (base_tx, _base_rx) = watch::channel(BaseNodeStatus::default());
    let (local_tx, local_rx) = watch::channel(BaseNodeStatus::default());
    let (remote_tx, remote_rx) = watch::channel(BaseNodeStatus::default());
    let consensus = ConsensusManager::builder(Network::get_current()).build();

    let manager = NodeManager::new(
        &mut stats,
        LocalNodeAdapter::new(local_tx, consensus.clone()),
        RemoteNodeAdapter::new(remote_tx, consensus),
        NodeType::Local,
        base_tx,
        local_rx,
        remote_rx,
    );

    manager
        .configure_local_for_test(
            true,
            Some(9051),
            Some(PathBuf::from("/var/empty/control_auth_cookie")),
        )
        .await
        .expect("configure local tor");
    assert_eq!(
        manager.local_adapter_tor_state_for_test().await,
        Some((true, Some(9051)))
    );

    manager
        .configure_local_for_test(false, None, None)
        .await
        .expect("configure local tcp fallback");
    assert_eq!(
        manager.local_adapter_tor_state_for_test().await,
        Some((false, None))
    );
}
