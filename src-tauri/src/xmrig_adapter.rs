use anyhow::Error;
use async_trait::async_trait;
use log::warn;
use std::path::PathBuf;
use tari_shutdown::{Shutdown, ShutdownSignal};

use crate::network_utils::get_free_port;
use crate::process_adapter::{
    HealthStatus, ProcessAdapter, ProcessInstance, ProcessStartupSpec, StatusMonitor,
};
use crate::xmrig::http_api::XmrigHttpApiClient;
use crate::{process_utils, xmrig};

const LOG_TARGET: &str = "tari::universe::xmrig_adapter";

pub enum XmrigNodeConnection {
    LocalMmproxy { host_name: String, port: u16 },
}

impl XmrigNodeConnection {
    pub fn generate_args(&self) -> Vec<String> {
        match self {
            XmrigNodeConnection::LocalMmproxy { host_name, port } => {
                vec![
                    "--daemon".to_string(),
                    format!("--url={}:{}", host_name, port),
                    // "--daemon-poll-interval=10000".to_string(),
                    "--coin=monero".to_string(),
                ]
            }
        }
    }
}

pub struct XmrigAdapter {
    pub node_connection: Option<XmrigNodeConnection>,
    pub monero_address: Option<String>,
    pub http_api_token: String,
    pub http_api_port: u16,
    pub cpu_max_percentage: Option<isize>,
    pub extra_options: Vec<String>,
}

impl XmrigAdapter {
    pub fn new() -> Self {
        let http_api_port = get_free_port().unwrap_or(18000);
        let http_api_token = "pass".to_string();
        Self {
            node_connection: None,
            monero_address: None,
            http_api_token: http_api_token.clone(),
            http_api_port,
            cpu_max_percentage: None,
            extra_options: Vec::new(),
        }
    }

    pub async fn benchmark(
        &mut self,
        data_dir: PathBuf,
        log_dir: PathBuf,
        shutdown: ShutdownSignal,
        binary_version_path: PathBuf,
    ) -> Result<u32, Error> {
        self.kill_previous_instances(data_dir.clone())?;

        let xmrig_shutdown = Shutdown::new();

        let mut args = vec!["--bench=1M".to_string()];
        let xmrig_log_file = get_log_path(log_dir)?;
        match xmrig_log_file.to_str() {
            Some(log_file) => {
                args.push(format!("--log-file={}", &log_file));
            }
            None => {
                warn!(target: LOG_TARGET, "Could not convert xmrig log file path to string");
                warn!(target: LOG_TARGET, "Logs argument will not be added to xmrig");
            }
        };

        let child =
            process_utils::launch_child_process(&binary_version_path, &data_dir, None, &args)?;

        let output = child.wait_with_output().await?;
        // .map(|output| {
        //     let output_str = String::from_utf8_lossy(&output.stdout);
        //     let mut lines = output_str.lines();
        //     let last_line = lines.last().unwrap_or("0");
        //     last_line.parse::<u32>().unwrap_or(0)
        // })
        // .await;

        dbg!(output);
        todo!()
    }
}

impl ProcessAdapter for XmrigAdapter {
    type StatusMonitor = XmrigStatusMonitor;

    fn spawn_inner(
        &self,
        data_dir: PathBuf,
        _config_dir: PathBuf,
        log_dir: PathBuf,
        binary_version_path: PathBuf,
    ) -> Result<(ProcessInstance, Self::StatusMonitor), anyhow::Error> {
        self.kill_previous_instances(data_dir.clone())?;

        let xmrig_shutdown = Shutdown::new();
        let mut args = self
            .node_connection
            .as_ref()
            .ok_or(anyhow::anyhow!("Node connection not set"))?
            .generate_args();
        let xmrig_log_file = get_log_path(log_dir)?;
        match xmrig_log_file.to_str() {
            Some(log_file) => {
                args.push(format!("--log-file={}", &log_file));
            }
            None => {
                warn!(target: LOG_TARGET, "Could not convert xmrig log file path to string");
                warn!(target: LOG_TARGET, "Logs argument will not be added to xmrig");
            }
        };

        args.push(format!("--http-port={}", self.http_api_port));
        args.push(format!("--http-access-token={}", self.http_api_token));
        args.push("--donate-level=1".to_string());
        args.push(format!(
            "--user={}",
            self.monero_address
                .as_ref()
                .ok_or(anyhow::anyhow!("Monero address not set"))?
        ));
        args.push(format!(
            "--threads={}",
            self.cpu_max_percentage
                .ok_or(anyhow::anyhow!("CPU max percentage not set"))?
        ));
        args.push("--verbose".to_string());
        for extra_option in &self.extra_options {
            args.push(extra_option.clone());
        }

        Ok((
            ProcessInstance {
                shutdown: xmrig_shutdown,
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
            XmrigStatusMonitor {
                client: XmrigHttpApiClient::new(
                    format!("http://127.0.0.1:{}", self.http_api_port),
                    self.http_api_token.clone(),
                ),
            },
        ))
    }

    fn name(&self) -> &str {
        "xmrig"
    }

    fn pid_file_name(&self) -> &str {
        "xmrig_pid"
    }
}

fn get_log_path(log_dir: PathBuf) -> Result<PathBuf, Error> {
    let xmrig_log_file = log_dir.join("xmrig.log");
    let xmrig_log_file_parent = xmrig_log_file
        .parent()
        .ok_or_else(|| anyhow::anyhow!("Could not get parent directory of xmrig log file"))?;

    std::fs::create_dir_all(xmrig_log_file_parent).unwrap_or_else(|error| {
        warn!(target: LOG_TARGET, "Could not create xmrig log file parent directory - {}", error);
    });
    Ok(xmrig_log_file)
}

#[derive(Clone)]
pub struct XmrigStatusMonitor {
    client: XmrigHttpApiClient,
}

#[async_trait]
impl StatusMonitor for XmrigStatusMonitor {
    async fn check_health(&self) -> HealthStatus {
        // TODO: Connect this to actual stats
        HealthStatus::Healthy
    }
}

impl XmrigStatusMonitor {
    pub async fn summary(&self) -> Result<xmrig::http_api::models::Summary, Error> {
        self.client.summary().await
    }
}
