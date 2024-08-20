use std::fs;
use std::path::PathBuf;

use anyhow::Error;
use async_trait::async_trait;
use log::{debug, warn};
use tari_common_types::tari_address::TariAddress;
use tari_shutdown::Shutdown;
use tokio::runtime::Handle;
use tokio::select;
use tokio::task::JoinHandle;

use crate::binary_resolver::{Binaries, BinaryResolver};
use crate::process_adapter::{ProcessAdapter, ProcessInstance, StatusMonitor};

const LOG_TARGET: &str = "tari::universe::merge_mining_proxy_adapter";

#[derive(Clone)]
pub struct MergeMiningProxyConfig {
    pub port: u16,
    pub p2pool_enabled: bool,
    pub p2pool_grpc_port: u16,
    pub base_node_grpc_port: u16,
}

impl MergeMiningProxyConfig {
    pub fn new(
        port: u16,
        base_node_grpc_port: u16,
    ) -> Self {
        Self {
            port,
            p2pool_enabled: false,
            p2pool_grpc_port: 0,
            base_node_grpc_port,
        }
    }

    pub fn new_with_p2pool(
        port: u16,
        p2pool_grpc_port: u16,
    ) -> Self {
        Self {
            port,
            p2pool_enabled: true,
            p2pool_grpc_port,
            base_node_grpc_port: 0,
        }
    }
}

pub struct MergeMiningProxyAdapter {
    pub(crate) tari_address: TariAddress,
    config: MergeMiningProxyConfig,
}

impl MergeMiningProxyAdapter {
    pub fn new(config: MergeMiningProxyConfig) -> Self {
        Self {
            tari_address: TariAddress::default(),
            config,
        }
    }
}

impl ProcessAdapter for MergeMiningProxyAdapter {
    type Instance = MergeMiningProxyInstance;
    type StatusMonitor = MergeMiningProxyStatusMonitor;

    fn spawn_inner(
        &self,
        data_dir: PathBuf,
        _log_path: PathBuf,
    ) -> Result<(Self::Instance, Self::StatusMonitor), Error> {
        let inner_shutdown = Shutdown::new();
        let shutdown_signal = inner_shutdown.to_signal();

        let working_dir = data_dir.join("mmproxy");
        std::fs::create_dir_all(&working_dir)?;

        let base_node_port = if self.config.p2pool_enabled {
            self.config.p2pool_grpc_port
        } else {
            self.config.base_node_grpc_port
        };

        let mut args: Vec<String> = vec![
            "-b".to_string(),
            working_dir.to_str().unwrap().to_string(),
            "--non-interactive-mode".to_string(),
            "-p".to_string(),
            // TODO: Test that this fails with an invalid value.Currently the process continues
            format!("merge_mining_proxy.base_node_grpc_address=/ip4/127.0.0.1/tcp/{}", base_node_port),
            "-p".to_string(),
            format!("merge_mining_proxy.listener_address=/ip4/127.0.0.1/tcp/{}", self.config.port),
            "-p".to_string(),
            // TODO: If you leave this out, it does not start. It just halts. Probably an error on the mmproxy noninteractive
            format!(
                "merge_mining_proxy.wallet_payment_address={}",
                self.tari_address.to_base58()
            ),
            "-p".to_string(),
            "merge_mining_proxy.wait_for_initial_sync_at_startup=false".to_string(),
        ];

        if self.config.p2pool_enabled {
            args.push("-p".to_string());
            args.push("merge_mining_proxy.p2pool_enabled=true".to_string());
        }

        Ok((
            MergeMiningProxyInstance {
                shutdown: inner_shutdown,
                handle: Some(tokio::spawn(async move {
                    let file_path = BinaryResolver::current()
                        .resolve_path(Binaries::MergeMiningProxy)
                        .await?;
                    crate::download_utils::set_permissions(&file_path).await?;
                    let mut child = tokio::process::Command::new(file_path)
                        .args(args)
                        // .stdout(std::process::Stdio::piped())
                        // .stderr(std::process::Stdio::piped())
                        .kill_on_drop(true)
                        .spawn()?;

                    if let Some(id) = child.id() {
                        fs::write(data_dir.join("mmproxy_pid"), id.to_string())?;
                    }

                    select! {
                        _res = shutdown_signal =>{
                            child.kill().await?;
                            // res
                        },
                        res2 = child.wait() => {
                            dbg!("Exited badly:", res2?);
                        },
                    }
                    ;

                    match fs::remove_file(data_dir.join("mmproxy_pid")) {
                        Ok(_) => {}
                        Err(_e) => {
                            debug!(target: LOG_TARGET, "Could not clear mmproxy's pid file");
                        }
                    }
                    Ok(())
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

pub struct MergeMiningProxyInstance {
    pub shutdown: Shutdown,
    handle: Option<JoinHandle<Result<(), anyhow::Error>>>,
}

pub struct MergeMiningProxyStatusMonitor {}

#[async_trait]
impl ProcessInstance for MergeMiningProxyInstance {
    fn ping(&self) -> bool {
        self.handle
            .as_ref()
            .map(|m| !m.is_finished())
            .unwrap_or_else(|| false)
    }

    async fn stop(&mut self) -> Result<(), Error> {
        self.shutdown.trigger();
        let handle = self.handle.take();
        let res = handle.unwrap().await??;
        Ok(res)
    }
}
impl Drop for MergeMiningProxyInstance {
    fn drop(&mut self) {
        println!("Drop being called");
        self.shutdown.trigger();
        if let Some(handle) = self.handle.take() {
            Handle::current().block_on(async move {
                let _ = handle.await.unwrap().map_err(|e| {
                    warn!(target: LOG_TARGET, "Error in MergeMiningProxyInstance: {}", e);
                });
            });
        }
    }
}

#[async_trait]
impl StatusMonitor for MergeMiningProxyStatusMonitor {
    type Status = ();

    async fn status(&self) -> Result<Self::Status, Error> {
        todo!()
    }
}
