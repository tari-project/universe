use crate::binary_resolver::{Binaries, BinaryResolver};
use crate::process_adapter::{ProcessAdapter, ProcessInstance, StatusMonitor};
use crate::xmrig_adapter::XmrigInstance;
use anyhow::Error;
use async_trait::async_trait;
use dirs_next::{cache_dir, data_dir, data_local_dir};
use tari_shutdown::Shutdown;
use tokio::select;
use tokio::task::JoinHandle;

pub struct MergeMiningProxyAdapter {
    force_download: bool,
}

impl MergeMiningProxyAdapter {
    pub fn new() -> Self {
        Self {
            force_download: false,
        }
    }
}

impl ProcessAdapter for MergeMiningProxyAdapter {
    type Instance = MergeMiningProxyInstance;
    type StatusMonitor = MergeMiningProxyStatusMonitor;

    fn spawn_inner(&self) -> Result<(Self::Instance, Self::StatusMonitor), Error> {
        let inner_shutdown = Shutdown::new();
        let mut shutdown_signal = inner_shutdown.to_signal();

        let working_dir = data_local_dir()
            .unwrap()
            .join("tari-universe")
            .join("mmproxy");
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
            "merge_mining_proxy.wallet_payment_address=f2FfTTPa4CJRwgWbR1aXnxYgrmj3qDPvnifAKdcuSStmGfjKzmt77LZQMKaE6qBhyckzcEG1gLLekSQRNye4ybdw5oA".to_string()

        ];
        dbg!(&args);
        Ok((
            MergeMiningProxyInstance {
                shutdown: inner_shutdown,
                handle: Some(tokio::spawn(async move {
                    let version = BinaryResolver::current()
                        .ensure_latest(Binaries::MergeMiningProxy)
                        .await?;

                    let file_path = BinaryResolver::current()
                        .resolve_path(Binaries::MergeMiningProxy, &version)?;
                    crate::download_utils::set_permissions(&file_path).await?;
                    let mut child = tokio::process::Command::new(
                        file_path
                    )
                    .args(args)
                    // .stdout(std::process::Stdio::piped())
                    // .stderr(std::process::Stdio::piped())
                    .kill_on_drop(true)
                    .spawn()?;

                    select! {
                        res = shutdown_signal =>{
                            child.kill().await?;
                            // res
                        },
                        res2 = child.wait() => {
                            dbg!("Exited badly:", res2?);
                        },
                    };
                    Ok(())
                })),
            },
            MergeMiningProxyStatusMonitor {},
        ))
    }

    fn name(&self) -> &str {
        "minotari_merge_mining_proxy"
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

impl StatusMonitor for MergeMiningProxyStatusMonitor {
    fn status(&self) -> Result<(), Error> {
        todo!()
    }
}
