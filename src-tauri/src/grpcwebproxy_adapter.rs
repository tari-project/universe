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

use crate::{
    grpcwebproxy_manager::GrpcWebProxyConfig,
    process_adapter::{
        HealthStatus, ProcessAdapter, ProcessInstance, ProcessStartupSpec, StatusMonitor,
    },
};
use anyhow::{anyhow, Error};
use async_trait::async_trait;
use log::warn;
use tari_shutdown::Shutdown;

const LOG_TARGET: &str = "tari::universe::grpcwebproxy_adapter";

pub struct GrpcWebProxyAdapter {
    pub(crate) config: Option<GrpcWebProxyConfig>,
}

impl GrpcWebProxyAdapter {
    pub fn new() -> Self {
        Self { config: None }
    }
}

impl ProcessAdapter for GrpcWebProxyAdapter {
    type StatusMonitor = GrpcWebProxyStatusMonitor;
    type ProcessInstance = ProcessInstance;

    #[allow(clippy::too_many_lines)]
    fn spawn_inner(
        &self,
        data_dir: PathBuf,
        _config_dir: PathBuf,
        _log_dir: PathBuf,
        binary_version_path: PathBuf,
        _is_first_start: bool,
    ) -> Result<(ProcessInstance, Self::StatusMonitor), Error> {
        let inner_shutdown = Shutdown::new();

        let config = self
            .config
            .as_ref()
            .ok_or_else(|| anyhow!("GrpcWebProxyAdapter config is not set"))?;

        let args: Vec<String> = vec![
            format!("--backend_addr=127.0.0.1:{}", config.grpc_port),
            format!("--server_http_debug_port={} ", config.grpc_web_port),
            "--run_tls_server=false".to_string(),
            "--allow_all_origins".to_string(),
            "--enable_health_endpoint".to_string(),
        ];

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
            GrpcWebProxyStatusMonitor {
                health_check_port: config.grpc_web_port,
            },
        ))
    }

    fn name(&self) -> &str {
        "grpc_web_proxy"
    }

    fn pid_file_name(&self) -> &str {
        "grpcwebproxy_pid"
    }
}

#[derive(Clone)]
pub struct GrpcWebProxyStatusMonitor {
    health_check_port: u16,
}

#[async_trait]
impl StatusMonitor for GrpcWebProxyStatusMonitor {
    async fn check_health(&self, _uptime: Duration, timeout_duration: Duration) -> HealthStatus {
        match tokio::time::timeout(timeout_duration, self.is_healthy()).await {
            Ok(result) => match result {
                Ok(_) => HealthStatus::Healthy,
                Err(e) => {
                    warn!(
                        target: LOG_TARGET,
                        "Health check failed: {}", e
                    );
                    HealthStatus::Warning
                }
            },
            Err(_) => {
                warn!(
                    target: LOG_TARGET,
                    "GrpcWebProxy health check timed out after {:?}", timeout_duration
                );
                HealthStatus::Warning
            }
        }
    }
}

impl GrpcWebProxyStatusMonitor {
    pub async fn is_healthy(&self) -> Result<(), Error> {
        let client = reqwest::Client::new();
        client
            .get(format!(
                "http://127.0.0.1:{}/_health",
                self.health_check_port
            ))
            .send()
            .await
            .map(|resp| {
                if resp.status().is_success() {
                    Ok(())
                } else {
                    Err(anyhow!(
                        "GrpcWebProxy health check failed with status code: {}",
                        resp.status()
                    ))
                }
            })
            .unwrap_or_else(|e| Err(anyhow!("Error in GrpcWebProxy health check: {}", e)))
    }
}
