use std::path::PathBuf;

use anyhow::Error;
use async_trait::async_trait;
use log::warn;
use tari_shutdown::Shutdown;

use crate::binary_resolver::{Binaries, BinaryResolver};
use crate::process_adapter::{ProcessAdapter, ProcessInstance, StatusMonitor};
use crate::process_utils;
use crate::xmrig::http_api::XmrigHttpApiClient;

const LOG_TARGET: &str = "tari::universe::clythor_adapter";

pub struct LocalMmproxy {
    pub host_name: String,
    pub port: u16,
}

pub struct ClythorAdapter {
    node_connection: LocalMmproxy,
    monero_address: String,
    http_api_token: String,
    http_api_port: u16,
    mining_threads: usize,
    pub client: XmrigHttpApiClient,
    // TODO: secure
}

impl ClythorAdapter {
    pub fn new(
        node_connection: LocalMmproxy,
        monero_address: String,
        mining_threads: usize,
    ) -> Self {
        let http_api_port = 18000;
        let http_api_token = "pass".to_string();
        Self {
            node_connection,
            monero_address,
            http_api_token: http_api_token.clone(),
            http_api_port,
            mining_threads,
            client: XmrigHttpApiClient::new(
                format!("http://127.0.0.1:{}", http_api_port).clone(),
                http_api_token.clone(),
            ),
        }
    }
}

impl ProcessAdapter for ClythorAdapter {
    type StatusMonitor = ClythorStatusMonitor;

    fn spawn_inner(
        &self,
        data_dir: PathBuf,
        _config_dir: PathBuf,
        log_dir: PathBuf,
    ) -> Result<(ProcessInstance, Self::StatusMonitor), anyhow::Error> {
        self.kill_previous_instances(data_dir.clone())?;

        let clythor_shutdown = Shutdown::new();
        let mut shutdown_signal = clythor_shutdown.to_signal();
        let clythor_log_file = log_dir.join("clythor.log");
        std::fs::create_dir_all(clythor_log_file.parent().unwrap())?;
        let clythor_data_dir = data_dir.join("clythor");
        std::fs::create_dir_all(&clythor_data_dir)?;
        let args = vec![
            format!("-b {}", clythor_data_dir.to_str().unwrap()),
            format!(
                "--log-path={}",
                &clythor_log_file.parent().unwrap().to_str().unwrap()
            ),
            format!("--http-port={}", self.http_api_port),
            format!("--access-token={}", self.http_api_token),
            format!("--user={}", self.monero_address),
            format!("--threads={}", self.mining_threads),
            format!(
                "--monero-base-node-address={}:{}",
                self.node_connection.host_name, self.node_connection.port
            ),
        ];
        let pid_file_path = data_dir.join(&self.pid_file_name());

        Ok((
            ProcessInstance {
                shutdown: clythor_shutdown,
                handle: Some(tokio::spawn(async move {
                    let clythor_bin = BinaryResolver::current()
                        .resolve_path(Binaries::Clythor)
                        .await?;

                    crate::download_utils::set_permissions(&clythor_bin).await?;
                    let mut child = process_utils::launch_child_process(&clythor_bin, None, &args)?;

                    if let Some(id) = child.id() {
                        let pid_file_path = data_dir.join(&pid_file_path);
                        std::fs::write(pid_file_path, id.to_string())?;
                    }
                    shutdown_signal.wait().await;

                    child.kill().await?;

                    match std::fs::remove_file(data_dir.join(&pid_file_path)) {
                        Ok(_) => {}
                        Err(e) => {
                            warn!(target: LOG_TARGET, "Could not clear clythor's pid file -  {e}");
                        }
                    }

                    Ok(0)
                })),
            },
            ClythorStatusMonitor {},
        ))
    }

    fn name(&self) -> &str {
        "clythor"
    }

    fn pid_file_name(&self) -> &str {
        "clythor_pid"
    }
}

pub struct ClythorStatusMonitor {}

#[async_trait]
impl StatusMonitor for ClythorStatusMonitor {
    type Status = ();

    async fn status(&self) -> Result<Self::Status, Error> {
        todo!()
    }
}
