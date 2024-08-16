use crate::binary_resolver::{Binaries, BinaryResolver};
use crate::p2pool;
use crate::p2pool::models::Stats;
use crate::process_adapter::{ProcessAdapter, ProcessInstance, StatusMonitor};
use anyhow::{anyhow, Error};
use async_trait::async_trait;
use dirs_next::data_local_dir;
use log::{info, warn};
use rand::seq::SliceRandom;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::path::PathBuf;
use tari_shutdown::Shutdown;
use tari_utilities::epoch_time::EpochTime;
use tokio::runtime::Handle;
use tokio::select;
use tokio::task::JoinHandle;

const LOG_TARGET: &str = "tari::universe::p2pool_adapter";

pub struct P2poolAdapter {
    grpc_port: u16,
    stats_server_port: u16,
}

impl P2poolAdapter {
    pub fn new(grpc_port: u16, stats_server_port: u16) -> Self {
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

    fn spawn_inner(
        &self,
        data_dir: PathBuf,
    ) -> Result<(Self::Instance, Self::StatusMonitor), Error> {
        let inner_shutdown = Shutdown::new();
        let shutdown_signal = inner_shutdown.to_signal();

        info!(target: LOG_TARGET, "Starting p2pool node");

        let working_dir = data_local_dir()
            .unwrap()
            .join("tari-universe")
            .join("sha-p2pool");
        std::fs::create_dir_all(&working_dir)?;

        let mut args: Vec<String> = vec![
            "start".to_string(),
            "--grpc-port".to_string(),
            self.grpc_port.to_string(),
            "--stats-server-port".to_string(),
            self.stats_server_port.to_string(),
            "-b".to_string(),
            data_dir.to_str().unwrap().to_string(), // TODO: use real log dir
        ];
        let pid_file_name = self.pid_file_name().to_string();
        Ok((
            P2poolInstance {
                shutdown: inner_shutdown,
                handle: Some(tokio::spawn(async move {
                    // file details
                    let file_path = BinaryResolver::current()
                        .resolve_path(Binaries::ShaP2pool)
                        .await?;
                    crate::download_utils::set_permissions(&file_path).await?;

                    // select tribe
                    let child = tokio::process::Command::new(file_path.clone())
                        .args(vec!["list-tribes"])
                        .stdout(std::process::Stdio::piped())
                        .kill_on_drop(true)
                        .spawn()?;

                    let output = child.wait_with_output().await?;
                    let tribes: Vec<String> = serde_json::from_slice(output.stdout.as_slice())?;
                    let tribe = match tribes.choose(&mut rand::thread_rng()) {
                        Some(tribe) => tribe.to_string(),
                        None => String::from("default"), // TODO: generate name
                    };
                    args.push("--tribe".to_string());
                    args.push(tribe);

                    // start
                    let mut child = tokio::process::Command::new(file_path)
                        .args(args)
                        .kill_on_drop(true)
                        .spawn()?;

                    if let Some(id) = child.id() {
                        fs::write(data_dir.join(pid_file_name.clone()), id.to_string())?;
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
                    println!("Stopping p2pool node");

                    if let Err(error) = fs::remove_file(data_dir.join(pid_file_name)) {
                        warn!(target: LOG_TARGET, "Could not clear p2pool's pid file: {error:?}");
                    }

                    Ok(())
                })),
            },
            P2poolStatusMonitor::new(format!("http://127.0.0.1:{}", self.stats_server_port)),
        ))
    }

    fn name(&self) -> &str {
        "p2pool"
    }

    fn pid_file_name(&self) -> &str {
        "p2pool_pid"
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

pub struct P2poolStatusMonitor {
    stats_client: p2pool::stats_client::Client,
}

impl P2poolStatusMonitor {
    pub fn new(stats_server_addr: String) -> Self {
        Self {
            stats_client: p2pool::stats_client::Client::new(stats_server_addr),
        }
    }
}

#[async_trait]
impl StatusMonitor for P2poolStatusMonitor {
    type Status = Stats;

    async fn status(&self) -> Result<Self::Status, Error> {
        self.stats_client.stats().await
    }
}
