use std::path::PathBuf;
use anyhow::Error;
use async_trait::async_trait;
use dirs_next::data_local_dir;
use log::info;
use tari_shutdown::Shutdown;
use tokio::runtime::Handle;
use tokio::select;
use tokio::task::JoinHandle;
use crate::binary_resolver::{Binaries, BinaryResolver};
use crate::process_adapter::{ProcessAdapter, ProcessInstance, StatusMonitor};

const LOG_TARGET: &str = "tari::universe::p2pool_adapter";

pub struct P2poolAdapter {
    grpc_port: u16,
    stats_server_port: u16,
}

impl P2poolAdapter {
    pub fn new(grpc_port: u16,
               stats_server_port: u16,
    ) -> Self {
        Self {
            grpc_port,
            stats_server_port,
        }
    }

    pub fn grpc_port(&self) -> u16 {
        self.grpc_port
    }

    pub fn stats_server_port(&self) -> u16 {
        self.stats_server_port
    }
}

impl ProcessAdapter for P2poolAdapter {
    type Instance = P2poolInstance;
    type StatusMonitor = P2poolStatusMonitor;

    fn spawn_inner(&self, _log_folder: PathBuf) -> Result<(Self::Instance, Self::StatusMonitor), Error> {
        let inner_shutdown = Shutdown::new();
        let shutdown_signal = inner_shutdown.to_signal();

        info!(target: LOG_TARGET, "Starting p2pool node");

        let working_dir = data_local_dir().unwrap().join("tari-universe").join("p2pool");
        std::fs::create_dir_all(&working_dir)?;

        let args: Vec<String> = vec![
            "--grpc-port".to_string(),
            self.grpc_port.to_string(),
            "--stats-server-port".to_string(),
            self.stats_server_port.to_string(),
        ];

        Ok((
            P2poolInstance {
                shutdown: inner_shutdown,
                handle: Some(tokio::spawn(async move {
                    let version = BinaryResolver::current()
                        .ensure_latest(Binaries::ShaP2pool)
                        .await?;

                    let file_path =
                        BinaryResolver::current().resolve_path(Binaries::ShaP2pool, &version)?;
                    crate::download_utils::set_permissions(&file_path).await?;
                    let mut child = tokio::process::Command::new(file_path)
                        .args(args)
                        // .stdout(std::process::Stdio::piped())
                        // .stderr(std::process::Stdio::piped())
                        .kill_on_drop(true)
                        .spawn()?;

                    select! {
                        _res = shutdown_signal =>{
                            child.kill().await?;
                            // res
                        },
                        res2 = child.wait() => {
                            dbg!("Exited badly:", res2?);
                        },
                    };
                    println!("Stopping p2pool node");

                    Ok(())
                })
                )
            },
            P2poolStatusMonitor {}
        ))
    }

    fn name(&self) -> &str {
        "p2pool"
    }
}

pub struct P2poolInstance {
    pub shutdown: Shutdown,
    handle: Option<JoinHandle<Result<(), anyhow::Error>>>,
}

#[async_trait]
impl ProcessInstance for P2poolInstance {
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

impl Drop for P2poolInstance {
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

pub struct P2poolStatusMonitor {}

impl StatusMonitor for P2poolStatusMonitor {
    fn status(&self) -> Result<(), Error> {

        todo!()
    }
}