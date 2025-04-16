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

use std::path::PathBuf;
use std::time::Duration;

use crate::process_adapter::{
    HealthStatus, ProcessAdapter, ProcessInstance, ProcessStartupSpec, StatusMonitor,
};
use crate::utils::file_utils::convert_to_string;
use crate::utils::logging_utils::setup_logging;
use anyhow::{anyhow, Error};
use async_trait::async_trait;
use log::warn;
// use log::warn;
use reqwest::Client;
use serde_json::json;
use tari_common_types::tari_address::TariAddress;
use tari_shutdown::Shutdown;

const LOG_TARGET: &str = "tari::universe::mm_proxy_adapter";

#[derive(Clone, PartialEq, Default)]
pub(crate) struct MergeMiningProxyConfig {
    pub port: u16,
    pub p2pool_enabled: bool,
    pub base_node_grpc_address: String,
    pub p2pool_grpc_port: u16,
    pub coinbase_extra: String,
    pub tari_address: TariAddress,
    pub use_monero_fail: bool,
    pub monero_nodes: Vec<String>,
}

#[allow(dead_code)]
impl MergeMiningProxyConfig {
    pub fn set_to_use_base_node(&mut self, grpc_address: String) {
        self.base_node_grpc_address = grpc_address;
    }

    pub fn set_to_use_p2pool(&mut self, port: u16) {
        self.p2pool_enabled = true;
        self.p2pool_grpc_port = port;
    }
}

pub struct MergeMiningProxyAdapter {
    pub config: Option<MergeMiningProxyConfig>,
}

impl MergeMiningProxyAdapter {
    pub fn new() -> Self {
        Self { config: None }
    }
}

impl ProcessAdapter for MergeMiningProxyAdapter {
    type StatusMonitor = MergeMiningProxyStatusMonitor;
    type ProcessInstance = ProcessInstance;

    #[allow(clippy::too_many_lines)]
    fn spawn_inner(
        &self,
        data_dir: PathBuf,
        _config_dir: PathBuf,
        log_dir: PathBuf,
        binary_verison_path: PathBuf,
        _is_first_start: bool,
    ) -> Result<(ProcessInstance, Self::StatusMonitor), Error> {
        let inner_shutdown = Shutdown::new();

        let working_dir = data_dir.join("mmproxy");
        std::fs::create_dir_all(&working_dir)?;

        if self.config.is_none() {
            return Err(Error::msg("MergeMiningProxyAdapter config is None"));
        }
        let config = self
            .config
            .as_ref()
            .ok_or_else(|| anyhow!("MergeMiningProxyAdapter config is None"))?;

        let config_dir = &log_dir
            .join("proxy")
            .join("configs")
            .join("log4rs_config_proxy.yml");
        setup_logging(
            &config_dir.clone(),
            &log_dir,
            include_str!("../log4rs/proxy_sample.yml"),
        )?;

        let working_dir_string = convert_to_string(working_dir)?;
        let config_dir_string = convert_to_string(config_dir.to_path_buf())?;

        let mut args: Vec<String> = vec![
            "-b".to_string(),
            working_dir_string,
            "--non-interactive-mode".to_string(),
            format!("--log-config={}", config_dir_string),
            "-p".to_string(),
            format!(
                "merge_mining_proxy.base_node_grpc_address={}",
                config.base_node_grpc_address
            ),
            "-p".to_string(),
            format!(
                "merge_mining_proxy.listener_address=/ip4/127.0.0.1/tcp/{}",
                config.port
            ),
            "-p".to_string(),
            format!(
                "merge_mining_proxy.coinbase_extra={}",
                config.coinbase_extra
            ),
            "-p".to_string(),
            // TODO: If you leave this out, it does not start. It just halts. Probably an error on the mmproxy noninteractive
            format!(
                "merge_mining_proxy.wallet_payment_address={}",
                config.tari_address.to_base58()
            ),
            "-p".to_string(),
            "merge_mining_proxy.wait_for_initial_sync_at_startup=false".to_string(),
            // Difficulty is checked in p2pool; no need to check it in the merge mining proxy as well.
            "-p".to_string(),
            "merge_mining_proxy.check_tari_difficulty_before_submit=false".to_string(),
            "-p".to_string(),
            format!(
                "merge_mining_proxy.use_dynamic_fail_data={}",
                config.use_monero_fail
            ),
        ];

        for node in &config.monero_nodes {
            args.push("-p".to_string());
            args.push(format!("merge_mining_proxy.monerod_url={}", node));
        }

        if config.p2pool_enabled {
            args.push("-p".to_string());
            args.push("merge_mining_proxy.p2pool_enabled=true".to_string());
            args.push("-p".to_string());
            args.push(format!(
                "merge_mining_proxy.p2pool_node_grpc_address={}",
                config.base_node_grpc_address
            ));
        }

        Ok((
            ProcessInstance {
                shutdown: inner_shutdown,
                handle: None,
                startup_spec: ProcessStartupSpec {
                    file_path: binary_verison_path,
                    envs: None,
                    args,
                    data_dir,
                    pid_file_name: self.pid_file_name().to_string(),
                    name: self.name().to_string(),
                },
            },
            MergeMiningProxyStatusMonitor {
                json_rpc_port: config.port,
            },
        ))
    }

    fn name(&self) -> &str {
        "minotari_merge_mining_proxy"
    }

    fn pid_file_name(&self) -> &str {
        "mmproxy_pid"
    }
}

#[derive(Clone)]
pub struct MergeMiningProxyStatusMonitor {
    json_rpc_port: u16,
}

#[async_trait]
impl StatusMonitor for MergeMiningProxyStatusMonitor {
    async fn check_health(&self, _uptime: Duration) -> HealthStatus {
        if self
            .get_version()
            .await
            .inspect_err(
                |e| warn!(target: LOG_TARGET, "Failed to get version during health check: {}", e),
            )
            .is_ok()
        {
            HealthStatus::Healthy
        } else {
            HealthStatus::Warning
        }
    }
}

impl MergeMiningProxyStatusMonitor {
    #[allow(dead_code)]
    pub async fn get_version(&self) -> Result<String, Error> {
        let rpc_url = format!("http://127.0.0.1:{}/json_rpc", self.json_rpc_port);
        let request_body = json!({
            "jsonrpc": "2.0",
            "id": "0",
            "method": "get_version",
            "params": {
            }
        });

        // Create an HTTP client
        let client = Client::new();

        // Send the POST request
        let response = client.post(rpc_url).json(&request_body).send().await?;

        // Parse the response body
        if response.status().is_success() {
            let response_text = response.text().await?;
            let response_json: serde_json::Value = serde_json::from_str(&response_text)?;
            if response_json.get("error").is_some() {
                return Err(anyhow!(
                    "Failed to get version Jsonrpc error: {}",
                    response_text
                ));
            }
            if response_json.get("result").is_none() {
                return Err(anyhow!("Failed to get version: {}", response_text));
            }
            Ok(response_text)
        } else {
            Err(anyhow!("Failed to get version: {}", response.status()))
        }
    }
}
