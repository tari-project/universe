use std::{fs, path::PathBuf};

use anyhow::Error;
use async_trait::async_trait;
use log::{debug, info, warn};
use tari_shutdown::Shutdown;
use tokio::{runtime::Handle, select};

use crate::{
    binaries::{Binaries, BinaryResolver},
    process_adapter::{
        HealthStatus, ProcessAdapter, ProcessInstance, ProcessStartupSpec, StatusMonitor,
    },
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
        binary_version_path: PathBuf,
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
                handle: None,
                startup_spec: ProcessStartupSpec {
                    file_path: binary_version_path,
                    envs: None,
                    args,
                    data_dir,
                    pid_file_name: self.pid_file_name().to_string(),
                    name: self.name().to_string(),
                },
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

#[derive(Clone)]
pub(crate) struct TorStatusMonitor {}

#[async_trait]
impl StatusMonitor for TorStatusMonitor {
    async fn check_health(&self) -> HealthStatus {
        // TODO: Implement health check
        HealthStatus::Healthy
    }
}
