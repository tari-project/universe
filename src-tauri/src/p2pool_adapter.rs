use std::collections::HashMap;
use std::fs;
use std::path::PathBuf;
use std::sync::Arc;

use anyhow::Error;
use async_trait::async_trait;
use dirs_next::data_local_dir;
use log::{info, warn};
use rand::seq::SliceRandom;
use tari_shutdown::Shutdown;
use tokio::select;

use crate::binary_resolver::{Binaries, BinaryResolver};
use crate::p2pool::models::Stats;
use crate::p2pool_manager::P2poolConfig;
use crate::process_adapter::{ProcessAdapter, ProcessInstance, StatusMonitor};
use crate::process_utils::launch_child_process;
use crate::{p2pool, process_utils};

const LOG_TARGET: &str = "tari::universe::p2pool_adapter";

pub struct P2poolAdapter {
    config: Arc<P2poolConfig>,
}

impl P2poolAdapter {
    pub fn new(config: Arc<P2poolConfig>) -> Self {
        Self { config }
    }

    pub fn grpc_port(&self) -> u16 {
        self.config.grpc_port
    }

    pub fn stats_server_port(&self) -> u16 {
        self.config.stats_server_port
    }

    pub fn config(&self) -> &P2poolConfig {
        &self.config
    }
}

impl ProcessAdapter for P2poolAdapter {
    type StatusMonitor = P2poolStatusMonitor;

    fn spawn_inner(
        &self,
        data_dir: PathBuf,
        _config_dir: PathBuf,
        log_path: PathBuf,
    ) -> Result<(ProcessInstance, Self::StatusMonitor), Error> {
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
            self.config.grpc_port.to_string(),
            "--stats-server-port".to_string(),
            self.config.stats_server_port.to_string(),
            "--base-node-address".to_string(),
            self.config.base_node_address.clone(),
            "-b".to_string(),
            log_path.join("sha-p2pool").to_str().unwrap().to_string(),
            "--no-default-seed-peers".to_string() // TODO: remove, just for testing
        ];
        let pid_file_name = self.pid_file_name().to_string();
        Ok((
            ProcessInstance {
                shutdown: inner_shutdown,
                handle: Some(tokio::spawn(async move {
                    // file details
                    let file_path = BinaryResolver::current()
                        .resolve_path(Binaries::ShaP2pool)
                        .await?;
                    crate::download_utils::set_permissions(&file_path).await?;

                    // select tribe
                    // let child = tokio::process::Command::new(file_path.clone())
                    //     .args(vec!["list-tribes"])
                    //     .stdout(std::process::Stdio::piped())
                    //     .kill_on_drop(true)
                    //     .spawn()?;
                    // 
                    // let output = child.wait_with_output().await?;
                    // let tribes: Vec<String> = serde_json::from_slice(output.stdout.as_slice())?;
                    // let tribe = match tribes.choose(&mut rand::thread_rng()) {
                    //     Some(tribe) => tribe.to_string(),
                    //     None => String::from("default"), // TODO: generate name
                    // };
                    args.push("--tribe".to_string());
                    args.push("test_randomx".to_string());

                    // start
                    let mut child = launch_child_process(&file_path, &args)?;

                    if let Some(id) = child.id() {
                        fs::write(data_dir.join(pid_file_name.clone()), id.to_string())?;
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
                    println!("Stopping p2pool node");

                    if let Err(error) = fs::remove_file(data_dir.join(pid_file_name)) {
                        warn!(target: LOG_TARGET, "Could not clear p2pool's pid file: {error:?}");
                    }

                    Ok(exit_code)
                })),
            },
            P2poolStatusMonitor::new(format!(
                "http://127.0.0.1:{}",
                self.config.stats_server_port
            )),
        ))
    }

    fn name(&self) -> &str {
        "p2pool"
    }

    fn pid_file_name(&self) -> &str {
        "p2pool_pid"
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
    type Status = HashMap<String, Stats>;

    async fn status(&self) -> Result<Self::Status, Error> {
        self.stats_client.stats().await
    }
}
