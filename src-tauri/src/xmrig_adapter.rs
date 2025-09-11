// Copyright 2024. The Tari Project
//
// Redistribution and use in source and binary forms, with or without modification, are permitted provided that the
// following conditions are met:
//
// 1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following
// disclaimer.
//
// 2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the
// following disclaimer in the documentation and/or other materials provided with the distribution.
//
// 3. Neither the name of the copyright holder nor the names of its contributors may be used to endorse or promote
// products derived from this software without specific prior written permission.
//
// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES,
// INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
// DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
// SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
// SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
// WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE
// USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

use anyhow::Error;
use async_trait::async_trait;
use log::{info, warn};
use std::path::PathBuf;
use std::sync::atomic::{AtomicBool, Ordering};
use std::time::Duration;
use tari_shutdown::Shutdown;
use tokio::sync::watch;

use crate::port_allocator::PortAllocator;
use crate::process_adapter::{
    HandleUnhealthyResult, HealthStatus, ProcessAdapter, ProcessInstance, ProcessStartupSpec,
    StatusMonitor,
};
use crate::setup::setup_manager::SetupManager;
use crate::xmrig;
use crate::xmrig::http_api::models::Summary;
use crate::xmrig::http_api::XmrigHttpApiClient;

const LOG_TARGET: &str = "tari::universe::xmrig_adapter";

pub enum XmrigNodeConnection {
    LocalMmproxy {
        host_name: String,
        port: u16,
        monero_address: String,
    },
    Pool {
        host_name: String,
        port: u16,
        tari_address: String,
    },
}

impl XmrigNodeConnection {
    pub fn generate_args(&self) -> Vec<String> {
        match self {
            XmrigNodeConnection::LocalMmproxy {
                host_name,
                port,
                monero_address,
            } => {
                vec![
                    "--daemon".to_string(),
                    format!("--url={}:{}", host_name, port),
                    // "--daemon-poll-interval=10000".to_string(),
                    "--coin=monero".to_string(),
                    // We are using a local daemon, so retry as soon as possible
                    "--retry-pause=1".to_string(),
                    "--user".to_string(),
                    format!("{}", monero_address),
                ]
            }
            XmrigNodeConnection::Pool {
                host_name,
                port,
                tari_address: monero_address,
            } => {
                vec![
                    "--url".to_string(),
                    format!("{}:{}", host_name, port),
                    "--coin=monero".to_string(),
                    "--user".to_string(),
                    format!("{}", monero_address),
                ]
            }
        }
    }
}

pub struct XmrigAdapter {
    pub node_connection: Option<XmrigNodeConnection>,
    // pub monero_address: Option<String>,
    pub http_api_token: String,
    pub http_api_port: u16,
    pub cpu_threads: Option<u32>,
    pub extra_options: Vec<String>,
    pub summary_broadcast: watch::Sender<Option<Summary>>,
}

impl XmrigAdapter {
    pub fn new(summary_broadcast: watch::Sender<Option<Summary>>) -> Self {
        let http_api_port = PortAllocator::new().assign_port_with_fallback();
        let http_api_token = "pass".to_string();
        Self {
            node_connection: None,
            // monero_address: None,
            http_api_token: http_api_token.clone(),
            http_api_port,
            cpu_threads: None,
            extra_options: Vec::new(),
            summary_broadcast,
        }
    }
}

impl ProcessAdapter for XmrigAdapter {
    type StatusMonitor = XmrigStatusMonitor;
    type ProcessInstance = ProcessInstance;

    fn spawn_inner(
        &self,
        data_dir: PathBuf,
        _config_dir: PathBuf,
        log_dir: PathBuf,
        binary_version_path: PathBuf,
        _is_first_start: bool,
    ) -> Result<(ProcessInstance, Self::StatusMonitor), anyhow::Error> {
        let xmrig_shutdown = Shutdown::new();
        let mut args = self
            .node_connection
            .as_ref()
            .ok_or(anyhow::anyhow!("Node connection not set"))?
            .generate_args();
        let xmrig_log_file = log_dir.join("xmrig").join("xmrig.log");
        std::fs::create_dir_all(
            xmrig_log_file
                .parent()
                .expect("Could not get xmrig root log dir"),
        )?;

        let xmrig_log_file_parent = xmrig_log_file
            .parent()
            .ok_or_else(|| anyhow::anyhow!("Could not get parent directory of xmrig log file"))?;

        match xmrig_log_file.to_str() {
            Some(log_file) => {
                args.push(format!("--log-file={}", &log_file));
            }
            None => {
                warn!(target: LOG_TARGET, "Could not convert xmrig log file path to string");
                warn!(target: LOG_TARGET, "Logs argument will not be added to xmrig");
            }
        };

        std::fs::create_dir_all(xmrig_log_file_parent).unwrap_or_else(|error| {
            warn!(target: LOG_TARGET, "Could not create xmrig log file parent directory - {error}");
        });

        args.push(format!("--http-port={}", self.http_api_port));
        args.push(format!("--http-access-token={}", self.http_api_token));
        args.push("--donate-level=1".to_string());

        // don't specify threads for ludicrous mode
        if let Some(cpu_threads) = self.cpu_threads {
            args.push(format!("--threads={cpu_threads}"));
        }
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
                summary_broadcast: self.summary_broadcast.clone(),
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

// This is a flag to indicate if the fallback to solo mining has been triggered
// We want to avoid triggering it multiple times per session
static WAS_FALLBACK_TO_SOLO_MINING_TRIGGERED: AtomicBool = AtomicBool::new(false);

#[derive(Clone)]
pub struct XmrigStatusMonitor {
    client: XmrigHttpApiClient,
    summary_broadcast: watch::Sender<Option<Summary>>,
}

#[async_trait]
impl StatusMonitor for XmrigStatusMonitor {
    async fn handle_unhealthy(
        &self,
        duration_since_last_healthy_status: Duration,
    ) -> Result<HandleUnhealthyResult, anyhow::Error> {
        // Fallback to solo mining if the miner has been unhealthy for more than 30 minutes
        info!(target: LOG_TARGET, "Handling unhealthy status for Xmrig | Duration since last healthy status: {:?}", duration_since_last_healthy_status.as_secs());
        if duration_since_last_healthy_status.as_secs().gt(&(60 * 30))
            && !WAS_FALLBACK_TO_SOLO_MINING_TRIGGERED.load(Ordering::SeqCst)
        {
            match SetupManager::get_instance()
                .turn_off_cpu_pool_feature()
                .await
            {
                Ok(_) => {
                    info!(target: LOG_TARGET, "XmrigAdapter: CPU Pool feature turned off due to prolonged unhealthiness.");
                    WAS_FALLBACK_TO_SOLO_MINING_TRIGGERED.store(true, Ordering::SeqCst);
                    return Ok(HandleUnhealthyResult::Stop);
                }
                Err(error) => {
                    warn!(target: LOG_TARGET, "XmrigAdapter: Failed to turn off CPU Pool feature: {error} | Continuing to monitor.");
                    return Ok(HandleUnhealthyResult::Continue);
                }
            }
        } else {
            return Ok(HandleUnhealthyResult::Continue);
        }
    }

    async fn check_health(&self, _uptime: Duration, timeout_duration: Duration) -> HealthStatus {
        match tokio::time::timeout(timeout_duration, self.summary()).await {
            Ok(summary_result) => match summary_result {
                Ok(summary) => {
                    let _result = self.summary_broadcast.send(Some(summary.clone()));

                    if summary.hashrate.total.iter().all(|x| x.eq(&Some(0.0))) {
                        warn!(target: LOG_TARGET, "Xmrig has zero hashrate reported.");
                        return HealthStatus::Unhealthy;
                    }

                    HealthStatus::Healthy
                }
                Err(e) => {
                    warn!(target: LOG_TARGET, "Failed to get xmrig summary: {e}");
                    let _result = self.summary_broadcast.send(None);
                    HealthStatus::Unhealthy
                }
            },
            Err(_timeout_error) => {
                warn!(target: LOG_TARGET, "Timeout while getting xmrig summary");
                let _result = self.summary_broadcast.send(None);
                HealthStatus::Warning
            }
        }
    }
}

impl XmrigStatusMonitor {
    pub async fn summary(&self) -> Result<xmrig::http_api::models::Summary, Error> {
        self.client.summary().await
    }
}
