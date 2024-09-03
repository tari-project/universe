use anyhow::Error;
use async_trait::async_trait;
use log::{debug, warn};
use std::{fs, path::PathBuf};
use tari_common_types::tari_address::TariAddress;
use tari_shutdown::Shutdown;
use tokio::select;

use crate::{
    binary_resolver::{Binaries, BinaryResolver},
    network_utils::get_free_port,
    process_adapter::{ProcessAdapter, ProcessInstance, StatusMonitor},
};

const LOG_TARGET: &str = "tari::universe::gpu_miner_adapter";

pub struct GpuMinerAdapter {
    pub(crate) tari_address: TariAddress,
    pub(crate) node_grpc_port: u16,
}

impl GpuMinerAdapter {
    pub fn new() -> Self {
        Self {
            tari_address: TariAddress::default(),
            node_grpc_port: 0,
        }
    }
}

impl ProcessAdapter for GpuMinerAdapter {
    type StatusMonitor = GpuMinerStatusMonitor;

    fn spawn_inner(
        &self,
        data_dir: PathBuf,
        config_dir: PathBuf,
        log_dir: PathBuf,
    ) -> Result<(ProcessInstance, Self::StatusMonitor), Error> {
        let inner_shutdown = Shutdown::new();
        let shutdown_signal = inner_shutdown.to_signal();

        let http_api_port = get_free_port().unwrap_or(18000);
        let working_dir = data_dir.join("gpuminer");
        std::fs::create_dir_all(&working_dir)?;
        let args: Vec<String> = vec![
            "--tari-address".to_string(),
            self.tari_address.to_string(),
            "--tari-node-url".to_string(),
            format!("http://127.0.0.1:{}", self.node_grpc_port),
            "--config".to_string(),
            config_dir
                .join("gpuminer")
                .join("config.json")
                .to_string_lossy()
                .to_string(),
            "--http-server-port".to_string(),
            http_api_port.to_string(),
        ];

        Ok((
            ProcessInstance {
                shutdown: inner_shutdown,
                handle: Some(tokio::spawn(async move {
                    let file_path = BinaryResolver::current()
                        .resolve_path(Binaries::GpuMiner)
                        .await?;
                    crate::download_utils::set_permissions(&file_path).await?;
                    let mut child;

                    if cfg!(debug_assertions) {
                        child = tokio::process::Command::new(file_path)
                            .args(args)
                            .env("TARI_NETWORK", "localnet")
                            // .stdout(std::process::Stdio::null())
                            // .stderr(std::process::Stdio::null())
                            .kill_on_drop(true)
                            .spawn()?;
                    } else {
                        child = tokio::process::Command::new(file_path)
                            .args(args)
                            .env("TARI_NETWORK", "esme")
                            // .stdout(std::process::Stdio::null())
                            // .stderr(std::process::Stdio::null())
                            .kill_on_drop(true)
                            .spawn()?;
                    }
                    if let Some(id) = child.id() {
                        fs::write(data_dir.join("xtrgpuminer_pid"), id.to_string())?;
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
                                    warn!(target: LOG_TARGET, "Error in XtrGpuInstance: {}", e);
                                    return Err(e.into());
                                }
                            }

                        },
                    };

                    match fs::remove_file(data_dir.join("xtrgpuminer_pid")) {
                        Ok(_) => {}
                        Err(_e) => {
                            debug!(target: LOG_TARGET, "Could not clear xtrgpuminer's pid file");
                        }
                    }
                    Ok(exit_code)
                })),
            },
            GpuMinerStatusMonitor {
                http_api_port: http_api_port,
            },
        ))
    }

    fn name(&self) -> &str {
        "xtrgpuminer"
    }

    fn pid_file_name(&self) -> &str {
        "xtrgpuminer_pid"
    }
}

pub struct GpuMinerStatusMonitor {
    http_api_port: u16,
}

#[async_trait]
impl StatusMonitor for GpuMinerStatusMonitor {
    type Status = GpuMinerStatus;

    async fn status(&self) -> Result<Self::Status, anyhow::Error> {
        todo!()
    }
}
pub struct GpuMinerStatus {}
