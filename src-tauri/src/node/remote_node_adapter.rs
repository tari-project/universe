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

use tari_crypto::ristretto::RistrettoPublicKey;
use tari_shutdown::Shutdown;
use tokio::sync::watch;
use tokio_util::task::TaskTracker;
use tonic::async_trait;

use crate::{
    ab_test_selector::ABTestSelector,
    node::{
        node_adapter::{NodeAdapter, NodeAdapterService, NodeStatusMonitor},
        node_manager::NodeType,
    },
    process_adapter::{ProcessAdapter, ProcessInstanceTrait},
    BaseNodeStatus,
};
use anyhow::Error;
use std::{
    path::PathBuf,
    sync::{atomic::AtomicU64, Arc},
};

const LOG_TARGET: &str = "tari::universe::remote_node_adapter";

#[derive(Clone)]
pub(crate) struct RemoteNodeAdapter {
    pub grpc_address: Option<(String, u16)>,
    pub(crate) use_tor: bool,
    ab_group: ABTestSelector,
    status_broadcast: watch::Sender<BaseNodeStatus>,
}

impl RemoteNodeAdapter {
    pub fn new(status_broadcast: watch::Sender<BaseNodeStatus>) -> Self {
        Self {
            grpc_address: None,
            status_broadcast,
            use_tor: false,
            ab_group: ABTestSelector::GroupA,
        }
    }

    pub fn get_grpc_address(&self) -> Option<(String, u16)> {
        self.grpc_address.clone()
    }

    pub fn get_service(&self) -> Option<NodeAdapterService> {
        if let Some(grpc_address) = self.get_grpc_address() {
            let address = if grpc_address.0.starts_with("http") {
                format!("{}:{}", grpc_address.0, grpc_address.1)
            } else {
                format!("http://{}:{}", grpc_address.0, grpc_address.1)
            };
            Some(NodeAdapterService::new(address, 1))
        } else {
            None
        }
    }

    // Expected format currently: https://grpc.<network>.tari.com:443
    pub fn set_grpc_address(&mut self, grpc_address: String) -> Result<(), anyhow::Error> {
        let has_scheme = grpc_address.starts_with("http");
        let is_https = grpc_address.starts_with("https");
        if !has_scheme {
            let parts = grpc_address.split(':').collect::<Vec<&str>>();
            let port = parts[1].parse::<u16>()?;
            let scheme = if port == 443 { "https://" } else { "http://" };
            self.grpc_address = Some((
                format!("{}{}", scheme, parts[0]),
                if is_https { 443 } else { 80 },
            ));
            return Ok(());
        }

        let parts = grpc_address.split(':').collect::<Vec<&str>>();
        self.grpc_address = Some((format!("{}:{}", parts[0], parts[1]), parts[2].parse()?));
        Ok(())
    }
}

#[async_trait]
impl NodeAdapter for RemoteNodeAdapter {
    fn get_grpc_address(&self) -> Option<(String, u16)> {
        self.get_grpc_address()
    }

    fn set_grpc_address(&mut self, grpc_address: String) -> Result<(), anyhow::Error> {
        self.set_grpc_address(grpc_address)
    }

    fn get_service(&self) -> Option<NodeAdapterService> {
        self.get_service()
    }

    fn use_tor(&mut self, use_tor: bool) {
        self.use_tor = use_tor;
    }

    fn set_ab_group(&mut self, ab_group: ABTestSelector) {
        self.ab_group = ab_group;
    }

    fn set_tor_control_port(&mut self, _tor_control_port: Option<u16>) {
        log::info!(target: LOG_TARGET, "RemoteNodeAdapter doesn't use tor_control_port");
    }

    async fn get_connection_details(&self) -> Result<(RistrettoPublicKey, String), anyhow::Error> {
        let node_service = self.get_service();
        if let Some(node_service) = node_service {
            let node_identity = node_service.get_identity().await?;
            let public_key = node_identity.public_key.clone();

            if let Some(addr) = node_identity
                .public_addresses
                .iter()
                .find(|addr| addr.starts_with("/ip4/"))
            {
                return Ok((public_key, addr.clone()));
            }
            if let Some(addr) = node_identity
                .public_addresses
                .iter()
                .find(|addr| addr.starts_with("/ip6/"))
            {
                return Ok((public_key, addr.clone()));
            }
            // Take any address if IPv4 or IPv6 not found
            if let Some(addr) = node_identity.public_addresses.first() {
                return Ok((public_key, addr.clone()));
            }

            return Err(anyhow::anyhow!("No address found for remote node"));
        }

        Err(anyhow::anyhow!("Remote node service is not available"))
    }
}

impl ProcessAdapter for RemoteNodeAdapter {
    type StatusMonitor = NodeStatusMonitor;
    type ProcessInstance = NullProcessInstance;

    fn spawn_inner(
        &self,
        _base_folder: PathBuf,
        _config_folder: PathBuf,
        _log_folder: PathBuf,
        _binary_version_path: PathBuf,
        _is_first_start: bool,
    ) -> Result<(Self::ProcessInstance, Self::StatusMonitor), anyhow::Error> {
        let inner_shutdown = Shutdown::new();
        let grpc_address = self
            .get_grpc_address()
            .ok_or_else(|| anyhow::anyhow!("GRPC address not set"))?;
        let address = if grpc_address.0.starts_with("http") {
            format!("{}:{}", grpc_address.0, grpc_address.1)
        } else {
            format!("http://{}:{}", grpc_address.0, grpc_address.1)
        };
        Ok((
            NullProcessInstance {
                shutdown: inner_shutdown,
            },
            NodeStatusMonitor::new(
                NodeType::Remote,
                NodeAdapterService::new(address, 1),
                self.status_broadcast.clone(),
                Arc::new(AtomicU64::new(0)),
                None, // Used only by Local Node
            ),
        ))
    }

    fn name(&self) -> &str {
        "remote_minotari_node"
    }

    fn pid_file_name(&self) -> &str {
        "remote_node_pid"
    }
}

pub struct NullProcessInstance {
    shutdown: Shutdown,
}

#[async_trait]
impl ProcessInstanceTrait for NullProcessInstance {
    fn ping(&self) -> bool {
        true
    }
    async fn start(&mut self, _task_trakcer: TaskTracker) -> Result<(), anyhow::Error> {
        Ok(())
    }
    async fn stop(&mut self) -> Result<i32, anyhow::Error> {
        self.shutdown.trigger();
        Ok(0)
    }

    fn is_shutdown_triggered(&self) -> bool {
        self.shutdown.is_triggered()
    }

    async fn wait(&mut self) -> Result<i32, Error> {
        Ok(0)
    }
}
