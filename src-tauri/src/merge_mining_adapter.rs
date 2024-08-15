use crate::binary_resolver::{Binaries, BinaryResolver};
use crate::process_adapter::{ProcessAdapter, ProcessInstance, StatusMonitor};
use anyhow::Error;
use async_trait::async_trait;
use log::warn;
use std::fs;
use std::path::PathBuf;
use tari_common_types::tari_address::TariAddress;
use tari_shutdown::Shutdown;
use tokio::runtime::Handle;
use tokio::select;
use tokio::task::JoinHandle;

const LOG_TARGET: &str = "tari::universe::merge_mining_proxy_adapter";

pub struct MergeMiningProxyAdapter {
    force_download: bool,
    pub(crate) tari_address: TariAddress,
}

impl MergeMiningProxyAdapter {
    pub fn new() -> Self {
        Self {
            force_download: false,
            tari_address: TariAddress::default(),
        }
    }
}

impl ProcessAdapter for MergeMiningProxyAdapter {
    type Instance = MergeMiningProxyInstance;
    type StatusMonitor = MergeMiningProxyStatusMonitor;

    fn spawn_inner(
        &self,
        data_dir: PathBuf,
    ) -> Result<(Self::Instance, Self::StatusMonitor), Error> {
        let inner_shutdown = Shutdown::new();
        let shutdown_signal = inner_shutdown.to_signal();

        let working_dir = data_dir.join("mmproxy");
        std::fs::create_dir_all(&working_dir)?;
        let args: Vec<String> = vec![
            "-b".to_string(),
            working_dir.to_str().unwrap().to_string(),
            "--non-interactive-mode".to_string(),
            "-p".to_string(),
            // TODO: Test that this fails with an invalid value.Currently the process continues
            "merge_mining_proxy.base_node_grpc_address=/ip4/127.0.0.1/tcp/18142".to_string(),
            "-p".to_string(),
            // TODO: If you leave this out, it does not start. It just halts. Probably an error on the mmproxy noninteractive
            format!(
                "merge_mining_proxy.wallet_payment_address={}",
                self.tari_address.to_base58()
            ),
            "-p".to_string(),
            "merge_mining_proxy.wait_for_initial_sync_at_startup=false".to_string(),
        ];
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
                    };

                    match fs::remove_file(data_dir.join("mmproxy_pid")) {
                        Ok(_) => {}
                        Err(e) => {
                            warn!(target: LOG_TARGET, "Could not clear node's pid file");
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
                handle.await.unwrap();
            });
        }
    }
}

impl StatusMonitor for MergeMiningProxyStatusMonitor {
    fn status(&self) -> Result<(), Error> {
        todo!()
    }
}
