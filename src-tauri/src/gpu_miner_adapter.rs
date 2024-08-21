use anyhow::Error;
use log::{debug, warn};
use std::{fs, path::PathBuf};
use tari_common_types::tari_address::TariAddress;
use tari_shutdown::Shutdown;
use tokio::select;

use crate::{
    binary_resolver::{Binaries, BinaryResolver},
    process_adapter::{ProcessAdapter, ProcessInstance, StatusMonitor},
};

const LOG_TARGET: &str = "tari::universe::gpu_miner_adapter";

pub struct GpuMinerAdapter {
    pub(crate) tari_address: TariAddress,
}

impl GpuMinerAdapter {
    pub fn new() -> Self {
        Self {
            tari_address: TariAddress::default(),
        }
    }
}

impl ProcessAdapter for GpuMinerAdapter {
    type StatusMonitor = GpuMinerStatusMonitor;

    fn spawn_inner(
        &self,
        data_dir: PathBuf,
        log_dir: PathBuf,
    ) -> Result<(ProcessInstance, Self::StatusMonitor), Error> {
        let inner_shutdown = Shutdown::new();
        let shutdown_signal = inner_shutdown.to_signal();

        let working_dir = data_dir.join("gpuminer");
        std::fs::create_dir_all(&working_dir)?;
        let args: Vec<String> = vec![
            "--tari-address".to_string(),
            self.tari_address.to_string(),
            "--tari-node-url".to_string(),
            "http://127.0.0.1:18142".to_string(),
        ];

        Ok((
            ProcessInstance {
                shutdown: inner_shutdown,
                handle: Some(tokio::spawn(async move {
                    let file_path = BinaryResolver::current()
                        .resolve_path(Binaries::GpuMiner)
                        .await?;
                    crate::download_utils::set_permissions(&file_path).await?;
                    let mut child = tokio::process::Command::new(file_path)
                        .args(args)
                        .env("TARI_NETWORK", "esme")
                        // .stdout(std::process::Stdio::null())
                        // .stderr(std::process::Stdio::null())
                        .kill_on_drop(true)
                        .spawn()?;

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
            GpuMinerStatusMonitor {},
        ))
    }

    fn name(&self) -> &str {
        "xtrgpuminer"
    }

    fn pid_file_name(&self) -> &str {
        "xtrgpuminer_pid"
    }
}

pub struct GpuMinerStatusMonitor {}

impl StatusMonitor for GpuMinerStatusMonitor {}
