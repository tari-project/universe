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
use std::sync::Arc;
use std::time::Duration;

use futures_util::future::FusedFuture;
use log::{info, warn};
use tokio::sync::{watch, RwLock};
use tokio::time::sleep;

use crate::p2pool::models::{Connections, P2poolStats};
use crate::p2pool_adapter::P2poolAdapter;
use crate::port_allocator::PortAllocator;
use crate::process_stats_collector::ProcessStatsCollectorBuilder;
use crate::process_watcher::ProcessWatcher;
use crate::tasks_tracker::TasksTrackers;

const LOG_TARGET: &str = "tari::universe::p2pool_manager";
// const P2POOL_STATS_UPDATE_INTERVAL: Duration = Duration::from_secs(10);

#[derive(Clone)]
pub struct P2poolConfig {
    pub grpc_port: u16,
    pub stats_server_port: u16,
    pub base_node_address: String,
    pub cpu_benchmark_hashrate: Option<u64>,
}

pub struct P2poolConfigBuilder {
    config: P2poolConfig,
}

impl P2poolConfigBuilder {
    pub fn new() -> Self {
        Self {
            config: P2poolConfig::default(),
        }
    }

    pub fn with_base_node(&mut self, address: String) -> &mut Self {
        self.config.base_node_address = address;
        self
    }

    pub fn with_stats_server_port(&mut self, stats_server_port: Option<u16>) -> &mut Self {
        self.config.stats_server_port = match stats_server_port {
            Some(port) => port,
            None => PortAllocator::new().assign_port_with_fallback(),
        };
        self
    }

    pub fn with_cpu_benchmark_hashrate(
        &mut self,
        cpu_benchmark_hashrate: Option<u64>,
    ) -> &mut Self {
        self.config.cpu_benchmark_hashrate = cpu_benchmark_hashrate;
        self
    }

    pub fn build(&self) -> Result<P2poolConfig, anyhow::Error> {
        let grpc_port = PortAllocator::new().assign_port_with_fallback();

        Ok(P2poolConfig {
            grpc_port,
            stats_server_port: self.config.stats_server_port,
            base_node_address: self.config.base_node_address.clone(),
            cpu_benchmark_hashrate: self.config.cpu_benchmark_hashrate,
        })
    }
}

impl P2poolConfig {
    pub fn builder() -> P2poolConfigBuilder {
        P2poolConfigBuilder::new()
    }
}

impl Default for P2poolConfig {
    fn default() -> Self {
        Self {
            grpc_port: 18145,
            stats_server_port: 19000,
            base_node_address: String::from("http://127.0.0.1:18142"),
            cpu_benchmark_hashrate: None,
        }
    }
}

impl Clone for P2poolManager {
    fn clone(&self) -> Self {
        Self {
            watcher: self.watcher.clone(),
        }
    }
}

pub struct P2poolManager {
    watcher: Arc<RwLock<ProcessWatcher<P2poolAdapter>>>,
}

impl P2poolManager {
    pub fn new(
        stats_broadcast: watch::Sender<Option<P2poolStats>>,
        stats_collector: &mut ProcessStatsCollectorBuilder,
    ) -> Self {
        let adapter = P2poolAdapter::new(stats_broadcast);
        let mut process_watcher = ProcessWatcher::new(adapter, stats_collector.take_p2pool());
        process_watcher.expected_startup_time = Duration::from_secs(300);

        Self {
            watcher: Arc::new(RwLock::new(process_watcher)),
        }
    }

    pub async fn get_connections(&self) -> Result<Option<Connections>, anyhow::Error> {
        let process_watcher = self.watcher.read().await;
        if let Some(status_monitor) = &process_watcher.status_monitor {
            Ok(Some(status_monitor.connections().await?))
        } else {
            Ok(None)
        }
    }
    #[allow(dead_code)]
    pub async fn is_running(&self) -> bool {
        let process_watcher = self.watcher.read().await;
        process_watcher.is_running()
    }
    #[allow(dead_code)]
    pub async fn is_pid_file_exists(&self, base_path: PathBuf) -> bool {
        let lock = self.watcher.read().await;
        lock.is_pid_file_exists(base_path)
    }

    pub async fn ensure_started(
        &self,
        config: P2poolConfig,
        base_path: PathBuf,
        config_path: PathBuf,
        log_path: PathBuf,
    ) -> Result<(), anyhow::Error> {
        let mut process_watcher = self.watcher.write().await;
        let shutdown_signal = TasksTrackers::current().unknown_phase.get_signal().await;
        let task_tracker = TasksTrackers::current()
            .unknown_phase
            .get_task_tracker()
            .await;

        info!(target: LOG_TARGET, "Starting P2pool, is_shutdown triggered: {} | is terminated: {}", shutdown_signal.is_triggered(),shutdown_signal.is_terminated());
        info!(target: LOG_TARGET, "task tracker is closed: {}", task_tracker.is_closed());

        process_watcher.adapter.config = Some(config);
        process_watcher.health_timeout = Duration::from_secs(28);
        process_watcher.poll_time = Duration::from_secs(30);
        process_watcher.expected_startup_time = Duration::from_secs(600);
        process_watcher
            .start(
                base_path,
                config_path,
                log_path,
                crate::binaries::Binaries::ShaP2pool,
                shutdown_signal.clone(),
                task_tracker,
            )
            .await?;
        process_watcher.wait_ready().await?;
        let shutdown_signal = TasksTrackers::current().unknown_phase.get_signal().await;
        if let Some(status_monitor) = &process_watcher.status_monitor {
            loop {
                if shutdown_signal.is_terminated() || shutdown_signal.is_triggered() {
                    break;
                }
                sleep(Duration::from_secs(5)).await;
                if let Ok(_stats) = status_monitor.status().await {
                    break;
                } else {
                    warn!(target: LOG_TARGET, "P2pool stats not available yet");
                }
            } // wait until we have stats from p2pool, so its started
        }
        Ok(())
    }
    #[allow(dead_code)]
    pub async fn stop(&self) -> Result<i32, anyhow::Error> {
        let mut process_watcher = self.watcher.write().await;
        let exit_code = process_watcher.stop().await?;
        if exit_code != 0 {
            warn!(target: LOG_TARGET, "P2pool process exited with code {}", exit_code);
        }
        Ok(exit_code)
    }

    pub async fn grpc_port(&self) -> u16 {
        let process_watcher = self.watcher.read().await;
        process_watcher
            .adapter
            .config
            .as_ref()
            .map(|c| c.grpc_port)
            .unwrap_or_default()
    }

    pub async fn stats_server_port(&self) -> u16 {
        let process_watcher = self.watcher.read().await;
        process_watcher
            .adapter
            .config
            .as_ref()
            .map(|c| c.stats_server_port)
            .unwrap_or_default()
    }
}
