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

use tari_shutdown::Shutdown;
use tokio::sync::watch;
use tokio_util::task::TaskTracker;
use tonic::async_trait;

use crate::{
    local_node_adapter::{MinotariNodeClient, MinotariNodeStatusMonitor},
    process_adapter::{ProcessAdapter, ProcessInstanceTrait},
    BaseNodeStatus,
};
use anyhow::Error;
use std::{
    path::PathBuf,
    sync::{atomic::AtomicU64, Arc},
};

#[derive(Clone)]
pub(crate) struct RemoteNodeAdapter {
    pub grpc_address: Option<(String, u16)>,
    status_broadcast: watch::Sender<BaseNodeStatus>,
}

impl RemoteNodeAdapter {
    pub fn new(status_broadcast: watch::Sender<BaseNodeStatus>) -> Self {
        Self {
            grpc_address: None,
            status_broadcast,
        }
    }

    pub fn grpc_address(&self) -> Option<(String, u16)> {
        self.grpc_address.clone()
    }

    pub fn get_node_client(&self) -> Option<MinotariNodeClient> {
        if let Some(grpc_address) = self.grpc_address() {
            let address = if grpc_address.0.starts_with("http") {
                format!("{}:{}", grpc_address.0, grpc_address.1)
            } else {
                format!("http://{}:{}", grpc_address.0, grpc_address.1)
            };
            Some(MinotariNodeClient::new(address, 1))
        } else {
            None
        }
    }

    // Expected format currently: https://grpc.esmeralda.tari.com:443
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

impl ProcessAdapter for RemoteNodeAdapter {
    type StatusMonitor = MinotariNodeStatusMonitor;
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
            .grpc_address()
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
            MinotariNodeStatusMonitor::new(
                MinotariNodeClient::new(address, 1),
                self.status_broadcast.clone(),
                Arc::new(AtomicU64::new(0)),
            ),
        ))
    }

    fn name(&self) -> &str {
        "remote minotari node"
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
