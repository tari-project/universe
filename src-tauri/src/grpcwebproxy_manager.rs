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

// ./grpcwebproxy --backend_addr=localhost:18183 --run_tls_server=false --allow_all_origins --server_http_debug_port=28183 --enable_health_endpoint

use std::path::PathBuf;
use std::sync::Arc;
use std::time::Instant;

use anyhow::anyhow;
use log::info;
use tokio::sync::RwLock;
use tokio::time::sleep;

use crate::grpcwebproxy_adapter::GrpcWebProxyAdapter;
use crate::process_adapter::{HealthStatus, StatusMonitor};
use crate::process_stats_collector::ProcessStatsCollectorBuilder;
use crate::process_watcher::ProcessWatcher;
use crate::tasks_tracker::TasksTrackers;

const LOG_TARGET: &str = "tari::universe::grpc_web_proxy_manager";

#[derive(Debug, Clone, PartialEq)]
pub struct GrpcWebProxyConfig {
    pub grpc_web_port: u16,
    pub grpc_port: u16,
}

pub struct GrpcWebProxyManager {
    watcher: Arc<RwLock<ProcessWatcher<GrpcWebProxyAdapter>>>,
}

impl Clone for GrpcWebProxyManager {
    fn clone(&self) -> Self {
        Self {
            watcher: self.watcher.clone(),
        }
    }
}

impl GrpcWebProxyManager {
    pub fn new(stats_collector: &mut ProcessStatsCollectorBuilder) -> Self {
        let sidecar_adapter = GrpcWebProxyAdapter::new();
        let mut process_watcher =
            ProcessWatcher::new(sidecar_adapter, stats_collector.take_grpc_web_proxy());
        process_watcher.health_timeout = std::time::Duration::from_secs(28);
        process_watcher.poll_time = std::time::Duration::from_secs(30);
        process_watcher.expected_startup_time = std::time::Duration::from_secs(120);

        Self {
            watcher: Arc::new(RwLock::new(process_watcher)),
        }
    }

    pub async fn start(
        &self,
        config: GrpcWebProxyConfig,
        base_path: PathBuf,
        config_path: PathBuf,
        log_path: PathBuf,
    ) -> Result<(), anyhow::Error> {
        let shutdown_signal = TasksTrackers::current().unknown_phase.get_signal().await;
        let task_tracker = TasksTrackers::current()
            .unknown_phase
            .get_task_tracker()
            .await;
        let mut process_watcher = self.watcher.write().await;
        process_watcher.adapter.config = Some(config.clone());
        info!(target: LOG_TARGET, "Starting GrpcWebProxy");
        process_watcher
            .start(
                base_path,
                config_path,
                log_path,
                crate::binaries::Binaries::GrpcWebProxy,
                shutdown_signal,
                task_tracker,
            )
            .await?;

        Ok(())
    }

    pub async fn wait_ready(&self) -> Result<(), anyhow::Error> {
        let lock = self.watcher.read().await;
        let start_time = Instant::now();
        for i in 0..90 {
            if lock.is_running() {
                if let Some(status) = lock.status_monitor.as_ref() {
                    if status
                        .check_health(start_time.elapsed(), std::time::Duration::from_secs(10))
                        .await
                        == HealthStatus::Healthy
                    {
                        info!(target: LOG_TARGET, "GrpcWebProxy is healthy");
                        return Ok(());
                    } else {
                        info!(target: LOG_TARGET, "Waiting for GrpcWebProxy to be healthy... {}/90", i + 1);
                    }
                }
            }
            info!(target: LOG_TARGET, "Waiting for GrpcWebProxy to start... {}/90", i + 1);
            sleep(std::time::Duration::from_secs(1)).await;
        }
        Err(anyhow!("GrpcWebProxy did not start in 90sec"))
    }

    #[allow(dead_code)]
    pub async fn stop(&self) -> Result<(), anyhow::Error> {
        let mut process_watcher = self.watcher.write().await;
        process_watcher.stop().await?;
        Ok(())
    }
    #[allow(dead_code)]
    pub async fn is_running(&self) -> bool {
        let lock = self.watcher.read().await;
        lock.is_running()
    }
    #[allow(dead_code)]
    pub async fn is_pid_file_exists(&self, base_path: PathBuf) -> bool {
        let lock = self.watcher.read().await;
        lock.is_pid_file_exists(base_path)
    }
}
