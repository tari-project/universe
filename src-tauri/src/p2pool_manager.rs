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
use log::warn;
use tari_shutdown::ShutdownSignal;
use tokio::sync::{watch, RwLock};
use tokio::time::sleep;

use crate::p2pool::models::{Connections, P2poolStats};
use crate::p2pool_adapter::P2poolAdapter;
use crate::port_allocator::PortAllocator;
use crate::process_watcher::ProcessWatcher;

const LOG_TARGET: &str = "tari::universe::p2pool_manager";
// const P2POOL_STATS_UPDATE_INTERVAL: Duration = Duration::from_secs(10);

#[derive(Clone)]
pub struct P2poolConfig {
    pub grpc_port: u16,
    pub stats_server_port: u16,
    pub base_node_address: String,
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

    pub fn with_base_node(&mut self, grpc_port: u16) -> &mut Self {
        self.config.base_node_address = format!("http://127.0.0.1:{}", grpc_port);
        self
    }

    pub fn with_stats_server_port(&mut self, stats_server_port: Option<u16>) -> &mut Self {
        self.config.stats_server_port = match stats_server_port {
            Some(port) => port,
            None => PortAllocator::new().assign_port_with_fallback(),
        };
        self
    }

    pub fn build(&self) -> Result<P2poolConfig, anyhow::Error> {
        let grpc_port = PortAllocator::new().assign_port_with_fallback();

        Ok(P2poolConfig {
            grpc_port,
            stats_server_port: self.config.stats_server_port,
            base_node_address: self.config.base_node_address.clone(),
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
    pub fn new(stats_broadcast: watch::Sender<Option<P2poolStats>>) -> Self {
        let adapter = P2poolAdapter::new(stats_broadcast);
        let mut process_watcher = ProcessWatcher::new(adapter);
        process_watcher.expected_startup_time = Duration::from_secs(30);

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

    pub async fn is_running(&self) -> bool {
        let process_watcher = self.watcher.read().await;
        process_watcher.is_running()
    }

    pub async fn is_pid_file_exists(&self, base_path: PathBuf) -> bool {
        let lock = self.watcher.read().await;
        lock.is_pid_file_exists(base_path)
    }

    pub async fn ensure_started(
        &self,
        app_shutdown: ShutdownSignal,
        config: P2poolConfig,
        base_path: PathBuf,
        config_path: PathBuf,
        log_path: PathBuf,
    ) -> Result<(), anyhow::Error> {
        let mut process_watcher = self.watcher.write().await;

        process_watcher.adapter.config = Some(config);
        process_watcher.health_timeout = Duration::from_secs(28);
        process_watcher.poll_time = Duration::from_secs(30);
        process_watcher
            .start(
                app_shutdown.clone(),
                base_path,
                config_path,
                log_path,
                crate::binaries::Binaries::ShaP2pool,
            )
            .await?;
        process_watcher.wait_ready().await?;
        if let Some(status_monitor) = &process_watcher.status_monitor {
            loop {
                if app_shutdown.is_terminated() || app_shutdown.is_triggered() {
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
