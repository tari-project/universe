use crate::binary_resolver::{Binaries, BinaryResolver};
use crate::process_adapter::{ProcessAdapter, ProcessInstance, StatusMonitor};
use anyhow::Error;
use async_trait::async_trait;
use dirs_next::data_local_dir;
use log::info;
use std::path::PathBuf;
use tari_shutdown::Shutdown;
use tokio::select;
use tokio::task::JoinHandle;

const LOG_TARGET: &str = "tari::universe::minotari_node_adapter";

pub struct MinotariNodeAdapter {
    force_download: bool,
    use_tor: bool,
}

impl MinotariNodeAdapter {
    pub fn new(use_tor: bool) -> Self {
        Self {
            force_download: false,
            use_tor,
        }
    }
}

impl ProcessAdapter for MinotariNodeAdapter {
    type Instance = MinotariNodeInstance;
    type StatusMonitor = MinotariNodeStatusMonitor;

    fn spawn_inner(
        &self,
        log_path: PathBuf,
    ) -> Result<(Self::Instance, Self::StatusMonitor), Error> {
        let inner_shutdown = Shutdown::new();
        let shutdown_signal = inner_shutdown.to_signal();

        info!(target: LOG_TARGET, "Starting minotari node");
        let working_dir = data_local_dir().unwrap().join("tari-universe").join("node");
        std::fs::create_dir_all(&working_dir)?;

        let mut args: Vec<String> = vec![
            "-b".to_string(),
            working_dir.to_str().unwrap().to_string(),
            "--non-interactive-mode".to_string(),
            "--mining-enabled".to_string(),
            // "-p\"base_node.grpc_server_allow_methods\"=get_network_difficulty".to_string(),
        ];
        if !self.use_tor {
            // TODO: This is a bit of a hack. You have to specify a public address for the node to bind to.
            // In future we should change the base node to not error if it is tcp and doesn't have a public address
            args.push("-p".to_string());
            args.push("base_node.p2p.transport.type=tcp".to_string());
            args.push("-p".to_string());
            args.push("base_node.p2p.public_addresses=/ip4/172.2.3.4/tcp/18189".to_string());
            // args.push("-p\"base_node.p2p.transport.tcp.listener_address\"=\"/ip4/0.0.0.0/tcp/18189\"".to_string());
        }
        dbg!(&args);
        Ok((
            MinotariNodeInstance {
                shutdown: inner_shutdown,
                handle: Some(tokio::spawn(async move {
                    let version = BinaryResolver::current()
                        .ensure_latest(Binaries::MinotariNode)
                        .await?;

                    let file_path =
                        BinaryResolver::current().resolve_path(Binaries::MinotariNode, &version)?;
                    crate::download_utils::set_permissions(&file_path).await?;
                    let mut child = tokio::process::Command::new(file_path)
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
                    println!("Stopping minotari node");

                    // child.kill().await?;
                    // let out = child.wait_with_output().await?;
                    // println!("stdout: {}", String::from_utf8_lossy(&out.stdout));
                    Ok(())
                })),
            },
            MinotariNodeStatusMonitor {},
        ))
    }

    fn name(&self) -> &str {
        "minotari_node"
    }
}

pub struct MinotariNodeInstance {
    pub shutdown: Shutdown,
    handle: Option<JoinHandle<Result<(), anyhow::Error>>>,
}

pub struct MinotariNodeStatusMonitor {}

#[async_trait]
impl ProcessInstance for MinotariNodeInstance {
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

impl StatusMonitor for MinotariNodeStatusMonitor {
    fn status(&self) -> Result<(), Error> {
        todo!()
    }
}
