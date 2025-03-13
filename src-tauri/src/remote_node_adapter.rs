use tari_shutdown::{Shutdown, ShutdownSignal};
use tokio::sync::watch;
use tonic::async_trait;

use crate::{
    node_adapter::{MinotariNodeClient, MinotariNodeStatusMonitor},
    process_adapter::{ProcessAdapter, ProcessInstanceTrait},
    BaseNodeStatus,
};
use std::path::PathBuf;

pub(crate) struct RemoteNodeAdapter {
    grpc_address: Option<(String, u16)>,
    tcp_rpc_port: u16,
    status_broadcast: watch::Sender<BaseNodeStatus>,
}

impl RemoteNodeAdapter {
    pub fn new(status_broadcast: watch::Sender<BaseNodeStatus>) -> Self {
        Self {
            grpc_address: None,
            tcp_rpc_port: 0,
            status_broadcast,
        }
    }

    pub fn grpc_address(&self) -> Option<&(String, u16)> {
        self.grpc_address.as_ref()
    }

    pub fn set_grpc_address(&mut self, grpc_address: String) {
        let parts = grpc_address.split(':').collect::<Vec<&str>>();
        self.grpc_address = Some((parts[0].to_string(), parts[1].parse().unwrap()));
    }

    pub fn tcp_rpc_port(&self) -> u16 {
        self.tcp_rpc_port
    }

    pub fn get_node_client(&self) -> Option<MinotariNodeClient> {
        if let Some(grpc_address) = self.grpc_address() {
            Some(MinotariNodeClient::new(
                format!("http://{}:{}", grpc_address.0, grpc_address.1),
                1,
            ))
        } else {
            None
        }
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
    ) -> Result<(Self::ProcessInstance, Self::StatusMonitor), anyhow::Error> {
        let inner_shutdown = Shutdown::new();
        let status_shutdown = inner_shutdown.to_signal();
        let grpc_address = self
            .grpc_address()
            .ok_or_else(|| anyhow::anyhow!("GRPC address not set"))?;
        Ok((
            NullProcessInstance {
                shutdown: inner_shutdown,
            },
            MinotariNodeStatusMonitor::new(
                MinotariNodeClient::new(format!("http://{}:{}", grpc_address.0, grpc_address.1), 1),
                self.status_broadcast.clone(),
            ),
        ))
    }

    fn name(&self) -> &str {
        "remote minotari node"
    }

    fn pid_file_name(&self) -> &str {
        "remote_pid"
    }
}

pub struct NullProcessInstance {
    shutdown: Shutdown,
}

#[async_trait]
impl ProcessInstanceTrait for NullProcessInstance {
    fn ping(&self) -> bool {
        dbg!("ping");
        true
    }
    async fn start(&mut self) -> Result<(), anyhow::Error> {
        dbg!("start");
        Ok(())
    }
    async fn stop(&mut self) -> Result<i32, anyhow::Error> {
        dbg!("stop");
        self.shutdown.trigger();
        Ok(0)
    }

    fn is_shutdown_triggered(&self) -> bool {
        dbg!("is_shutdown_triggered");
        self.is_shutdown_triggered()
    }
}
