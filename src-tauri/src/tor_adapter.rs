use std::{fs, path::PathBuf};

use anyhow::Error;
use async_trait::async_trait;
use log::{debug, info, warn};
use tari_shutdown::Shutdown;
use tokio::select;

use crate::{
    binaries::{Binaries, BinaryResolver},
    process_adapter::{ProcessAdapter, ProcessInstance, StatusMonitor},
    process_utils,
    utils::file_utils::convert_to_string,
};

const LOG_TARGET: &str = "tari::universe::tor_adapter";

pub(crate) struct TorAdapter {
    control_port: u16,
    socks_port: u16,
}

impl TorAdapter {
    pub fn new() -> Self {
        let control_port = 9051;
        let socks_port = 9050;
        Self {
            control_port,
            socks_port,
        }
    }
}

impl ProcessAdapter for TorAdapter {
    type StatusMonitor = TorStatusMonitor;

    #[allow(clippy::too_many_lines)]
    fn spawn_inner(
        &self,
        data_dir: PathBuf,
        _config_dir: PathBuf,
        log_dir: PathBuf,
    ) -> Result<(ProcessInstance, Self::StatusMonitor), Error> {
        let inner_shutdown = Shutdown::new();
        let shutdown_signal = inner_shutdown.to_signal();

        info!(target: LOG_TARGET, "Starting tor");
        let working_dir: PathBuf = data_dir.join("tor-data");
        std::fs::create_dir_all(&working_dir)?;

        let working_dir_string = convert_to_string(working_dir)?;
        let log_dir_string = convert_to_string(log_dir.join("tor.log"))?;

        let args: Vec<String> = vec![
            "--allow-missing-torrc".to_string(),
            "--clientonly".to_string(),
            "1".to_string(),
            "--socksport".to_string(),
            self.socks_port.to_string(),
            "--controlport".to_string(),
            format!("127.0.0.1:{}", self.control_port),
            "--clientuseipv6".to_string(),
            "1".to_string(),
            "--DataDirectory".to_string(),
            working_dir_string,
            "--Log".to_string(),
            format!("notice file {}", log_dir_string),
        ];
        info!(target: LOG_TARGET, "Starting tor with args: {:?}", args);
        Ok((
            ProcessInstance {
                shutdown: inner_shutdown,
                handle: Some(tokio::spawn(async move {
                    let file_path = BinaryResolver::current()
                        .read()
                        .await
                        .resolve_path_to_binary_files(Binaries::Tor)
                        .await?;

                    crate::download_utils::set_permissions(&file_path).await?;
                    let mut child = process_utils::launch_child_process(&file_path, None, &args)?;

                    if let Some(id) = child.id() {
                        fs::write(data_dir.join("tor_pid"), id.to_string())?;
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
                                    warn!(target: LOG_TARGET, "Error in tor: {}", e);
                                    return Err(e.into());
                                }
                            }

                        },
                    }

                    match fs::remove_file(data_dir.join("tor_pid")) {
                        Ok(_) => {}
                        Err(_e) => {
                            debug!(target: LOG_TARGET, "Could not clear tor's pid file");
                        }
                    }
                    Ok(exit_code)
                })),
            },
            TorStatusMonitor {},
        ))
    }

    fn name(&self) -> &str {
        "tor"
    }

    fn pid_file_name(&self) -> &str {
        "tor_pid"
    }
}

pub(crate) struct TorStatusMonitor {}

#[async_trait]
impl StatusMonitor for TorStatusMonitor {
    type Status = ();

    async fn status(&self) -> Result<Self::Status, Error> {
        todo!()
    }
}
