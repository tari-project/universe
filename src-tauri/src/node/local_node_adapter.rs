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

use crate::node::node_adapter::{
    BaseNodeStatus, NodeAdapter, NodeAdapterService, NodeStatusMonitor,
};
use crate::node::node_manager::NodeType;
use crate::port_allocator::PortAllocator;
use crate::process_adapter::{ProcessAdapter, ProcessInstance, ProcessStartupSpec};
use crate::utils::file_utils::convert_to_string;
use crate::utils::logging_utils::setup_logging;
use async_trait::async_trait;
use log::{info, warn};
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};
use std::sync::atomic::AtomicU64;
use std::sync::Arc;
use tari_common::configuration::Network;
use tari_shutdown::Shutdown;
use tokio::sync::watch;

#[cfg(target_os = "windows")]
use crate::utils::windows_setup_utils::add_firewall_rule;

const LOG_TARGET: &str = "tari::universe::local_node_adapter";

#[derive(Serialize, Deserialize, Default)]
struct MinotariNodeMigrationInfo {
    version: u32,
}

impl MinotariNodeMigrationInfo {
    pub fn save(&self, path: &Path) -> Result<(), anyhow::Error> {
        let json_string = serde_json::to_string(self)?;
        fs::write(path, json_string)?;
        Ok(())
    }

    pub fn load_or_create(path: &Path) -> Result<Self, anyhow::Error> {
        if !fs::exists(path)? {
            return Ok(MinotariNodeMigrationInfo::default());
        }
        let contents = fs::read_to_string(path)?;

        Ok(serde_json::from_str(contents.as_str())?)
    }
}

#[derive(Clone)]
pub(crate) struct LocalNodeAdapter {
    pub(crate) grpc_address: Option<(String, u16)>,
    status_broadcast: watch::Sender<BaseNodeStatus>,
    pub(crate) use_tor: bool,
    pub(crate) tcp_listener_port: u16,
    pub(crate) use_pruned_mode: bool,
    pub(crate) tor_control_port: Option<u16>,
    required_initial_peers: u32,
}

impl LocalNodeAdapter {
    pub fn new(status_broadcast: watch::Sender<BaseNodeStatus>) -> Self {
        let grpc_port = PortAllocator::new().assign_port_with_fallback();
        let tcp_listener_port = PortAllocator::new().assign_port_with_fallback();
        Self {
            grpc_address: Some(("127.0.0.1".to_string(), grpc_port)),
            status_broadcast,
            tcp_listener_port,
            use_pruned_mode: false,
            required_initial_peers: 3,
            use_tor: false,
            tor_control_port: None,
        }
    }

    pub fn get_grpc_address(&self) -> Option<(String, u16)> {
        self.grpc_address.clone()
    }

    pub fn tcp_address(&self) -> String {
        format!("/ip4/127.0.0.1/tcp/{}", self.tcp_listener_port)
    }

    pub fn get_service(&self) -> Option<NodeAdapterService> {
        if let Some(grpc_address) = self.get_grpc_address() {
            Some(NodeAdapterService::new(
                format!("http://{}:{}", grpc_address.0, grpc_address.1),
                self.required_initial_peers,
            ))
        } else {
            None
        }
    }
}

#[async_trait]
impl NodeAdapter for LocalNodeAdapter {
    fn get_grpc_address(&self) -> Option<(String, u16)> {
        self.get_grpc_address()
    }

    fn set_grpc_address(&mut self, _grpc_address: String) -> Result<(), anyhow::Error> {
        log::error!(target: LOG_TARGET, "Attempted to set gRPC address for local node, which is fixed to localhost.");
        Ok(())
    }

    fn get_service(&self) -> Option<NodeAdapterService> {
        self.get_service()
    }

    async fn get_connection_address(&self) -> Result<String, anyhow::Error> {
        Ok(self.tcp_address())
    }

    fn use_tor(&mut self, use_tor: bool) {
        self.use_tor = use_tor;
    }

    fn set_tor_control_port(&mut self, tor_control_port: Option<u16>) {
        self.tor_control_port = tor_control_port;
    }
}

impl ProcessAdapter for LocalNodeAdapter {
    type StatusMonitor = NodeStatusMonitor;
    type ProcessInstance = ProcessInstance;

    #[allow(clippy::too_many_lines)]
    fn spawn_inner(
        &self,
        data_dir: PathBuf,
        _config_dir: PathBuf,
        log_dir: PathBuf,
        binary_version_path: PathBuf,
        _is_first_start: bool,
    ) -> Result<(ProcessInstance, Self::StatusMonitor), anyhow::Error> {
        let inner_shutdown = Shutdown::new();

        info!(target: LOG_TARGET, "Starting minotari node");
        let working_dir: PathBuf = data_dir.join("node");
        let network_dir = working_dir.join(Network::get_current().to_string().to_lowercase());
        fs::create_dir_all(&network_dir)?;
        let migration_file = network_dir.join("migrations.json");
        let mut migration_info = MinotariNodeMigrationInfo::load_or_create(&migration_file)?;

        if migration_info.version < 1 {
            // Delete the peer info db.
            let peer_db_dir = network_dir.join("peer_db");

            info!(target: LOG_TARGET, "Node migration v1: removing peer db at {:?}", peer_db_dir);

            if peer_db_dir.exists() {
                let _unused = fs::remove_dir_all(peer_db_dir).inspect_err(|e| {
                    warn!(target: LOG_TARGET, "Failed to remove peer db: {:?}", e);
                });
            }
            info!(target: LOG_TARGET, "Node Migration v1 complete");
            migration_info.version = 1;
        }
        migration_info.save(&migration_file)?;

        // if is_first_start {
        //     let peer_db_dir = network_dir.join("peer_db");
        //     if peer_db_dir.exists() {
        //         info!(target: LOG_TARGET, "Removing peer db at {:?}", peer_db_dir);
        //         let _unused = fs::remove_dir_all(peer_db_dir).inspect_err(|e| {
        //             warn!(target: LOG_TARGET, "Failed to remove peer db: {:?}", e);
        //         });
        //     }
        // }

        let config_dir = log_dir
            .clone()
            .join("base_node")
            .join("configs")
            .join("log4rs_config_base_node.yml");
        setup_logging(
            &config_dir.clone(),
            &log_dir,
            include_str!("../../log4rs/base_node_sample.yml"),
        )?;
        let working_dir_string = convert_to_string(working_dir)?;
        let config_dir_string = convert_to_string(config_dir)?;
        let grpc_address = self
            .get_grpc_address()
            .expect("Local node grpc address not defined");

        let mut args: Vec<String> = vec![
            "-b".to_string(),
            working_dir_string,
            "--non-interactive-mode".to_string(),
            "--mining-enabled".to_string(),
            format!("--log-config={}", config_dir_string),
            "-p".to_string(),
            "base_node.grpc_enabled=true".to_string(),
            "-p".to_string(),
            format!(
                "base_node.grpc_address=/ip4/{}/tcp/{}",
                grpc_address.0, grpc_address.1
            ),
            "-p".to_string(),
            "base_node.report_grpc_error=true".to_string(),
            "-p".to_string(),
            format!(
                "base_node.state_machine.initial_sync_peer_count={}",
                self.required_initial_peers
            ),
            "-p".to_string(),
            "base_node.grpc_server_allow_methods=\"list_connected_peers, get_blocks\"".to_string(),
            "-p".to_string(),
            "base_node.p2p.allow_test_addresses=true".to_string(),
            "-p".to_string(),
            "base_node.p2p.dht.network_discovery.min_desired_peers=12".to_string(),
            "-p".to_string(),
            "base_node.p2p.dht.minimize_connections=true".to_string(),
        ];
        if self.use_pruned_mode {
            args.push("-p".to_string());
            args.push("base_node.storage.pruning_horizon=100".to_string());
        }
        // Uncomment to test winning blocks
        // if cfg!(debug_assertions) {
        // args.push("--network".to_string());
        // args.push("localnet".to_string());
        // }
        if self.use_tor {
            // args.push("-p".to_string());
            // args.push(
            //     "base_node.p2p.transport.tor.listener_address_override=/ip4/127.0.0.1/tcp/18189"
            //         .to_string(),
            // );
            if !cfg!(target_os = "macos") {
                args.push("-p".to_string());
                args.push("use_libtor=false".to_string());
            }
            args.push("-p".to_string());
            args.push(format!(
                "base_node.p2p.auxiliary_tcp_listener_address=/ip4/0.0.0.0/tcp/{0}",
                self.tcp_listener_port
            ));
            args.push("-p".to_string());
            args.push("base_node.p2p.transport.tor.proxy_bypass_for_outbound_tcp=true".to_string());
            if let Some(mut tor_control_port) = self.tor_control_port {
                // macos uses libtor, so will be 9051
                if cfg!(target_os = "macos") {
                    tor_control_port = 9051;
                }
                args.push("-p".to_string());
                args.push(format!(
                    "base_node.p2p.transport.tor.control_address=/ip4/127.0.0.1/tcp/{}",
                    tor_control_port
                ));
            }
        } else {
            args.push("-p".to_string());
            args.push("base_node.p2p.transport.type=tcp".to_string());
            args.push("-p".to_string());
            args.push(format!(
                "base_node.p2p.public_addresses=/ip4/127.0.0.1/tcp/{}",
                self.tcp_listener_port
            ));
            args.push("-p".to_string());
            args.push(format!(
                "base_node.p2p.transport.tcp.listener_address=/ip4/127.0.0.1/tcp/{}",
                self.tcp_listener_port
            ));

            let network = Network::get_current_or_user_setting_or_default();
            args.push("-p".to_string());
            args.push(format!(
                "{key}.p2p.seeds.dns_seeds=ip4.seeds.{key}.tari.com,ip6.seeds.{key}.tari.com,seeds.{key}.tari.com",
                key = network.as_key_str(),
            ));
        }

        #[cfg(target_os = "windows")]
        add_firewall_rule("minotari_node.exe".to_string(), binary_version_path.clone())?;

        Ok((
            ProcessInstance {
                shutdown: inner_shutdown,
                handle: None,
                startup_spec: ProcessStartupSpec {
                    file_path: binary_version_path,
                    envs: None,
                    args,
                    data_dir,
                    pid_file_name: self.pid_file_name().to_string(),
                    name: self.name().to_string(),
                },
            },
            NodeStatusMonitor::new(
                NodeType::Local,
                NodeAdapterService::new(
                    format!("http://{}:{}", grpc_address.0, grpc_address.1),
                    self.required_initial_peers,
                ),
                self.status_broadcast.clone(),
                Arc::new(AtomicU64::new(0)),
            ),
        ))
    }

    fn name(&self) -> &str {
        "local_minotari_node"
    }

    fn pid_file_name(&self) -> &str {
        "node_pid"
    }
}
