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
use serde::Deserialize;
use std::path::PathBuf;
use std::sync::atomic::{AtomicBool, Ordering};
use std::time::Duration;
use tari_shutdown::Shutdown;
use tokio::sync::watch::Sender;
use uuid::Uuid;

use crate::mining::cpu::{CpuMinerConnectionStatus, CpuMinerStatus};
use crate::mining::CpuConnectionType;
use crate::port_allocator::PortAllocator;
use crate::process_adapter::{
    HandleUnhealthyResult, HealthStatus, ProcessAdapter, ProcessInstance, ProcessStartupSpec,
    StatusMonitor,
};
use crate::setup::setup_manager::SetupManager;

const LOG_TARGET: &str = "tari::universe::xmrig_adapter";

pub struct XmrigAdapter {
    pub connection_type: CpuConnectionType,
    pub address: String,
    pub http_api_token: String,
    pub http_api_port: u16,
    pub cpu_threads: Option<u32>,
    pub extra_options: Vec<String>,
    pub summary_broadcast: Sender<CpuMinerStatus>,
}

impl XmrigAdapter {
    pub fn new(summary_broadcast: Sender<CpuMinerStatus>) -> Self {
        let http_api_port = PortAllocator::new().assign_port_with_fallback();
        let http_api_token = Uuid::new_v4().to_string();
        Self {
            connection_type: CpuConnectionType::default(),
            address: String::new(),
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

        let mut args = vec![];

        let connection_type_args = match &self.connection_type {
            CpuConnectionType::LocalMMProxy { local_proxy_url } => {
                let extra_args = vec![
                    "--user".to_string(),
                    self.address.to_string(),
                    "--daemon".to_string(),
                    "--retry-pause=1".to_string(),
                    format!("--url={}", local_proxy_url),
                    "--coin=monero".to_string(), // is it needed? if yes then is it needed for pool mining?
                ];
                extra_args
            }
            CpuConnectionType::Pool {
                pool_url,
                worker_name,
            } => {
                let mut extra_args = vec![];
                let extended_user_address = match worker_name {
                    Some(worker_name) => format!("{}{}", self.address, worker_name),
                    None => self.address.to_string(),
                };
                extra_args.push(format!("--url={}", pool_url));
                extra_args.push("--user".to_string());
                extra_args.push(extended_user_address);
                extra_args
            }
        };

        args.extend(connection_type_args);

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
                access_token: self.http_api_token.clone(),
                http_api_port: self.http_api_port.to_string(),
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
    http_api_port: String,
    access_token: String,
    summary_broadcast: Sender<CpuMinerStatus>,
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
        match tokio::time::timeout(timeout_duration, self.status()).await {
            Ok(status) => match status {
                Ok(status) => {
                    let _result = self.summary_broadcast.send(status.clone());

                    if status.hash_rate.le(&0.0) {
                        warn!(target: LOG_TARGET, "Xmrig hash rate is 0");
                        return HealthStatus::Unhealthy;
                    }

                    HealthStatus::Healthy
                }
                Err(e) => {
                    warn!(target: LOG_TARGET, "Failed to get xmrig summary: {e}");
                    let _result = self.summary_broadcast.send(CpuMinerStatus::default());
                    HealthStatus::Unhealthy
                }
            },
            Err(_timeout_error) => {
                warn!(target: LOG_TARGET, "Timeout while getting xmrig summary");
                let _result = self.summary_broadcast.send(CpuMinerStatus::default());
                HealthStatus::Unhealthy
            }
        }
    }
}

#[derive(Deserialize, Debug, Clone)]
pub(crate) struct Summary {
    pub(crate) connection: Connection,
    pub(crate) hashrate: Hashrate,
}

#[derive(Deserialize, Debug, Clone)]
pub struct Connection {
    pub(crate) uptime: u64,
}

#[derive(Deserialize, Debug, Clone)]
pub struct Hashrate {
    pub(crate) total: Vec<Option<f64>>,
}

impl XmrigStatusMonitor {
    pub async fn status(&self) -> Result<CpuMinerStatus, Error> {
        let client = reqwest::Client::new();
        let response = match client
            .get(format!("http://127.0.0.1:{}/2/summary", self.http_api_port))
            .header("Authorization", format!("Bearer {}", self.access_token))
            .send()
            .await
        {
            Ok(response) => response,
            Err(e) => {
                warn!(target: LOG_TARGET, "Error in getting response from Xmrig status: {e}");
                if e.is_connect() {
                    return Ok(CpuMinerStatus::default());
                }
                return Ok(CpuMinerStatus::default());
            }
        };
        let text = response.text().await?;
        let body: Summary = match serde_json::from_str(&text) {
            Ok(body) => body,
            Err(e) => {
                warn!(target: LOG_TARGET, "Error decoding body from  in Xmrig status: {e}");
                return Ok(CpuMinerStatus::default());
            }
        };

        // body.hashrate.total is a vector of Option<f64> which elements are:
        // index 0: 10 seconds avarage hashrate
        // index 1: 60 seconds avarage hashrate
        // index 2: 15 minutes avarage hashrate

        let (ten_second_hash_rate, sixty_second_hash_rate, fifteen_minute_hash_rate) = (
            body.hashrate.total.first().and_then(|v| *v),
            body.hashrate.total.get(1).and_then(|v| *v),
            body.hashrate.total.get(2).and_then(|v| *v),
        );
        let avarage_hash_rate = fifteen_minute_hash_rate
            .or(sixty_second_hash_rate)
            .or(ten_second_hash_rate);

        Ok(CpuMinerStatus {
            is_mining: true,
            estimated_earnings: 0,
            hash_rate: avarage_hash_rate.unwrap_or(0.0),
            connection: CpuMinerConnectionStatus {
                is_connected: body.connection.uptime > 0,
            },
        })
    }
}
