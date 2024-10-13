use std::fs;
use std::path::PathBuf;

use crate::binaries::{Binaries, BinaryResolver};
use crate::process_adapter::{
    HealthStatus, ProcessAdapter, ProcessInstance, ProcessStartupSpec, StatusMonitor,
};
use crate::process_utils;
use crate::utils::file_utils::convert_to_string;
use anyhow::{anyhow, Error};
use async_trait::async_trait;
use log::{debug, warn};
use tari_common_types::tari_address::TariAddress;
use tari_shutdown::Shutdown;
use tokio::runtime::Handle;
use tokio::select;

const LOG_TARGET: &str = "tari::universe::merge_mining_proxy_adapter";

#[derive(Clone, PartialEq, Default)]
pub(crate) struct MergeMiningProxyConfig {
    pub port: u16,
    pub p2pool_enabled: bool,
    pub base_node_grpc_port: u16,
    pub p2pool_grpc_port: u16,
    pub coinbase_extra: String,
    pub tari_address: TariAddress,
}

impl MergeMiningProxyConfig {
    pub fn set_to_use_base_node(&mut self, port: u16) {
        self.base_node_grpc_port = port;
    }

    pub fn set_to_use_p2pool(&mut self, port: u16) {
        self.p2pool_enabled = true;
        self.p2pool_grpc_port = port;
    }
}

pub struct MergeMiningProxyAdapter {
    pub config: Option<MergeMiningProxyConfig>,
}

impl MergeMiningProxyAdapter {
    pub fn new() -> Self {
        Self { config: None }
    }
}

impl ProcessAdapter for MergeMiningProxyAdapter {
    type StatusMonitor = MergeMiningProxyStatusMonitor;

    #[allow(clippy::too_many_lines)]
    fn spawn_inner(
        &self,
        data_dir: PathBuf,
        _config_dir: PathBuf,
        log_dir: PathBuf,
        binary_verison_path: PathBuf,
    ) -> Result<(ProcessInstance, Self::StatusMonitor), Error> {
        let inner_shutdown = Shutdown::new();

        let working_dir = data_dir.join("mmproxy");
        std::fs::create_dir_all(&working_dir)?;

        if self.config.is_none() {
            return Err(Error::msg("MergeMiningProxyAdapter config is None"));
        }

        let config = self
            .config
            .as_ref()
            .ok_or_else(|| anyhow!("MergeMiningProxyAdapter config is None"))?;
        let working_dir_string = convert_to_string(working_dir)?;
        let log_dir_string = convert_to_string(log_dir)?;

        let mut args: Vec<String> = vec![
            "-b".to_string(),
            working_dir_string,
            "--non-interactive-mode".to_string(),
            "--log-path".to_string(),
            log_dir_string,
            "-p".to_string(),
            // TODO: Test that this fails with an invalid value.Currently the process continues
            format!(
                "merge_mining_proxy.base_node_grpc_address=/ip4/127.0.0.1/tcp/{}",
                config.base_node_grpc_port
            ),
            "-p".to_string(),
            format!(
                "merge_mining_proxy.listener_address=/ip4/127.0.0.1/tcp/{}",
                config.port
            ),
            "-p".to_string(),
            format!(
                "merge_mining_proxy.coinbase_extra={}",
                config.coinbase_extra
            ),
            "-p".to_string(),
            // TODO: If you leave this out, it does not start. It just halts. Probably an error on the mmproxy noninteractive
            format!(
                "merge_mining_proxy.wallet_payment_address={}",
                config.tari_address.to_base58()
            ),
            "-p".to_string(),
            "merge_mining_proxy.wait_for_initial_sync_at_startup=false".to_string(),
        ];

        // TODO: uncomment if p2pool is needed in CPU mining
        if config.p2pool_enabled {
            args.push("-p".to_string());
            args.push("merge_mining_proxy.p2pool_enabled=true".to_string());
            args.push("-p".to_string());
            args.push(format!(
                "merge_mining_proxy.p2pool_node_grpc_address=/ip4/127.0.0.1/tcp/{}",
                config.p2pool_grpc_port
            ));
        }

        Ok((
            ProcessInstance {
                shutdown: inner_shutdown,
                handle: None,
                startup_spec: ProcessStartupSpec {
                    file_path: binary_verison_path,
                    envs: None,
                    args,
                    data_dir,
                    pid_file_name: self.pid_file_name().to_string(),
                    name: self.name().to_string(),
                },
            },
            MergeMiningProxyStatusMonitor {},
        ))
    }

    fn name(&self) -> &str {
        "minotari_merge_mining_proxy"
    }

    fn pid_file_name(&self) -> &str {
        "mmproxy_pid"
    }
}

#[derive(Clone)]
pub struct MergeMiningProxyStatusMonitor {}

#[async_trait]
impl StatusMonitor for MergeMiningProxyStatusMonitor {
    async fn check_health(&self) -> HealthStatus {
        // TODO: Implement a call to the jsonrpc api to check the health of the mmproxy
        HealthStatus::Healthy
    }
}
