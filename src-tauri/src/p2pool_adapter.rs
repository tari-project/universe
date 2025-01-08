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

use anyhow::anyhow;
use anyhow::Error;
use async_trait::async_trait;
use log::{info, warn};
use std::collections::HashMap;
use std::path::PathBuf;
use tari_common::configuration::Network;
use tari_shutdown::Shutdown;

use crate::p2pool;
use crate::p2pool::models::{Connections, Stats};
use crate::p2pool_manager::P2poolConfig;
use crate::process_adapter::HealthStatus;
use crate::process_adapter::ProcessStartupSpec;
use crate::process_adapter::{ProcessAdapter, ProcessInstance, StatusMonitor};
use crate::utils::file_utils::convert_to_string;
// use tari_utilities::epoch_time::EpochTime;

#[cfg(target_os = "windows")]
use crate::utils::windows_setup_utils::add_firewall_rule;

const LOG_TARGET: &str = "tari::universe::p2pool_adapter";

pub struct P2poolAdapter {
    pub(crate) config: Option<P2poolConfig>,
}

impl P2poolAdapter {
    pub fn new() -> Self {
        Self { config: None }
    }

    #[allow(dead_code)]
    pub fn config(&self) -> Option<&P2poolConfig> {
        self.config.as_ref()
    }
}

impl ProcessAdapter for P2poolAdapter {
    type StatusMonitor = P2poolStatusMonitor;

    fn spawn_inner(
        &self,
        data_dir: PathBuf,
        _config_dir: PathBuf,
        log_path: PathBuf,
        binary_version_path: PathBuf,
    ) -> Result<(ProcessInstance, Self::StatusMonitor), Error> {
        let inner_shutdown = Shutdown::new();

        info!(target: LOG_TARGET, "Starting p2pool node");

        let working_dir = data_dir.join("sha-p2pool");
        std::fs::create_dir_all(&working_dir).unwrap_or_else(|error| {
            warn!(target: LOG_TARGET, "Could not create p2pool working directory - {}", error);
        });

        if self.config.is_none() {
            return Err(anyhow!("P2poolAdapter config is not set"));
        }
        let config = self
            .config
            .as_ref()
            .ok_or_else(|| anyhow!("P2poolAdapter config is not set"))?;
        let log_path_string = convert_to_string(log_path.join("sha-p2pool"))?;

        let mut args: Vec<String> = vec![
            "start".to_string(),
            "--grpc-port".to_string(),
            config.grpc_port.to_string(),
            "--stats-server-port".to_string(),
            config.stats_server_port.to_string(),
            "--base-node-address".to_string(),
            config.base_node_address.clone(),
            // "--mdns-disabled".to_string(),
            "-b".to_string(),
            log_path_string,
            "--stable-peer".to_string(),
            "--private-key-folder".to_string(),
            working_dir.to_string_lossy().to_string(),
        ];
        let pid_file_name = self.pid_file_name().to_string();

        args.push("--squad".to_string());
        args.push("default_2".to_string());
        let mut envs = HashMap::new();
        match Network::get_current_or_user_setting_or_default() {
            Network::Esmeralda => {
                envs.insert("TARI_NETWORK".to_string(), "esmeralda".to_string());
            }
            Network::NextNet => {
                envs.insert("TARI_NETWORK".to_string(), "nextnet".to_string());
            }
            _ => {
                return Err(anyhow!("Unsupported network"));
            }
        };

        #[cfg(target_os = "windows")]
        add_firewall_rule("sha_p2pool.exe".to_string(), binary_version_path.clone())?;

        Ok((
            ProcessInstance {
                shutdown: inner_shutdown,
                handle: None,
                startup_spec: ProcessStartupSpec {
                    file_path: binary_version_path,
                    envs: Some(envs),
                    args,
                    data_dir,
                    pid_file_name,
                    name: "P2pool".to_string(),
                },
            },
            P2poolStatusMonitor::new(format!("http://127.0.0.1:{}", config.stats_server_port)),
        ))
    }

    fn name(&self) -> &str {
        "p2pool"
    }

    fn pid_file_name(&self) -> &str {
        "p2pool_pid"
    }
}

#[derive(Clone)]
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
    async fn check_health(&self) -> HealthStatus {
        match self.stats_client.stats().await {
            Ok(_stats) => {
                // if stats
                //     .connection_info
                //     .network_info
                //     .connection_counters
                //     .established_outgoing
                //     + stats
                //         .connection_info
                //         .network_info
                //         .connection_counters
                //         .established_incoming
                //     < 1
                // {
                //     warn!(target: LOG_TARGET, "P2pool has no connections, health check warning");
                //     return HealthStatus::Warning;
                // }

                // if EpochTime::now().as_u64() - stats.last_gossip_message.as_u64() > 60 {
                //     warn!(target: LOG_TARGET, "P2pool last gossip message was more than 60 seconds ago, health check warning");
                //     return HealthStatus::Warning;
                // }

                HealthStatus::Healthy
            }
            Err(e) => {
                warn!(target: LOG_TARGET, "P2pool health check failed: {}", e);
                HealthStatus::Unhealthy
            }
        }
    }
}

impl P2poolStatusMonitor {
    pub async fn status(&self) -> Result<Stats, Error> {
        self.stats_client.stats().await
    }

    pub async fn connections(&self) -> Result<Connections, Error> {
        self.stats_client.connections().await
    }
}
