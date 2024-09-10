use std::fs;
use std::path::PathBuf;

use crate::binary_resolver::{Binaries, BinaryResolver};
use crate::process_adapter::{ProcessAdapter, ProcessInstance, StatusMonitor};
use crate::process_utils;
use anyhow::Error;
use async_trait::async_trait;
use log::{debug, warn};
use tari_common_types::tari_address::TariAddress;
use tari_shutdown::Shutdown;
use tokio::select;

const LOG_TARGET: &str = "tari::universe::merge_mining_proxy_adapter";

#[derive(Clone, PartialEq, Default)]
pub struct MergeMiningProxyConfig {
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

    fn spawn_inner(
        &self,
        data_dir: PathBuf,
        _config_dir: PathBuf,
        log_dir: PathBuf,
    ) -> Result<(ProcessInstance, Self::StatusMonitor), Error> {
        let inner_shutdown = Shutdown::new();
        let shutdown_signal = inner_shutdown.to_signal();

        let working_dir = data_dir.join("mmproxy");
        std::fs::create_dir_all(&working_dir)?;

        if self.config.is_none() {
            return Err(Error::msg("MergeMiningProxyAdapter config is None"));
        }
        let config = self.config.as_ref().unwrap();
        let mut args: Vec<String> = vec![
            "-b".to_string(),
            working_dir.to_str().unwrap().to_string(),
            "--non-interactive-mode".to_string(),
            "--log-path".to_string(),
            log_dir.to_str().unwrap().to_string(),
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
                handle: Some(tokio::spawn(async move {
                    let file_path = BinaryResolver::current()
                        .resolve_path(Binaries::MergeMiningProxy)
                        .await?;
                    crate::download_utils::set_permissions(&file_path).await?;
                    let mut child = process_utils::launch_child_process(&file_path, None, &args)?;

                    if let Some(id) = child.id() {
                        fs::write(data_dir.join("mmproxy_pid"), id.to_string())?;
                    }
                    let exit_code;

                    select! {
                        _res = shutdown_signal =>{
                            child.kill().await?;
                            exit_code = 0;
                            // res
                        },
                        res2 = child.wait() => {
                            match res2
                             {
                                Ok(res) => {
                                    exit_code = res.code().unwrap_or(0)
                                    },
                                Err(e) => {
                                    warn!(target: LOG_TARGET, "Error in MergeMiningProxyInstance: {}", e);
                                    return Err(e.into());
                                }
                            }

                        },
                    };

                    match fs::remove_file(data_dir.join("mmproxy_pid")) {
                        Ok(_) => {}
                        Err(_e) => {
                            debug!(target: LOG_TARGET, "Could not clear mmproxy's pid file");
                        }
                    }
                    Ok(exit_code)
                })),
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

pub struct MergeMiningProxyStatusMonitor {}

#[async_trait]
impl StatusMonitor for MergeMiningProxyStatusMonitor {
    type Status = ();

    async fn status(&self) -> Result<Self::Status, Error> {
        todo!()
    }
}
