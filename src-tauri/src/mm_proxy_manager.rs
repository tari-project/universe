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

use anyhow::anyhow;
use log::info;
use tari_common_types::tari_address::TariAddress;
use tari_shutdown::ShutdownSignal;
use tokio::sync::RwLock;
use tokio::time::sleep;

use crate::mm_proxy_adapter::{MergeMiningProxyAdapter, MergeMiningProxyConfig};
use crate::port_allocator::PortAllocator;
use crate::process_watcher::ProcessWatcher;

const LOG_TARGET: &str = "tari::universe::mm_proxy_manager";

#[derive(Clone)]
pub(crate) struct StartConfig {
    pub app_shutdown: ShutdownSignal,
    pub base_path: PathBuf,
    pub config_path: PathBuf,
    pub log_path: PathBuf,
    pub tari_address: TariAddress,
    pub base_node_grpc_port: u16,
    pub coinbase_extra: String,
    pub p2pool_enabled: bool,
    pub p2pool_port: u16,
    pub monero_nodes: Vec<String>,
    pub use_monero_fail: bool,
}

pub struct MmProxyManager {
    watcher: Arc<RwLock<ProcessWatcher<MergeMiningProxyAdapter>>>,
    start_config: Arc<RwLock<Option<StartConfig>>>,
}

impl Clone for MmProxyManager {
    fn clone(&self) -> Self {
        Self {
            watcher: self.watcher.clone(),
            start_config: self.start_config.clone(),
        }
    }
}

impl MmProxyManager {
    pub fn new() -> Self {
        let sidecar_adapter = MergeMiningProxyAdapter::new();
        let mut process_watcher = ProcessWatcher::new(sidecar_adapter);
        process_watcher.health_timeout = std::time::Duration::from_secs(28);
        process_watcher.poll_time = std::time::Duration::from_secs(30);

        Self {
            watcher: Arc::new(RwLock::new(process_watcher)),
            start_config: Arc::new(RwLock::new(None)),
        }
    }

    pub async fn config(&self) -> Option<MergeMiningProxyConfig> {
        let lock = self.watcher.read().await;
        lock.adapter.config.clone()
    }

    pub async fn change_config(&self, config: MergeMiningProxyConfig) -> Result<(), anyhow::Error> {
        let mut lock = self.watcher.write().await;
        lock.stop().await?;
        lock.adapter.config = Some(config);
        let start_config_read = self.start_config.read().await;
        match start_config_read.as_ref() {
            Some(start_config) => {
                drop(lock);
                let config = start_config.clone();
                drop(start_config_read);
                self.start(config).await?;
                self.wait_ready().await?;
            }
            None => {
                return Err(anyhow!(
                    "Missing start config! MM proxy manager must be started at least once!"
                ));
            }
        }

        Ok(())
    }

    pub async fn start(&self, config: StartConfig) -> Result<(), anyhow::Error> {
        let mut current_start_config = self.start_config.write().await;
        *current_start_config = Some(config.clone());
        let mut process_watcher = self.watcher.write().await;

        let new_config = MergeMiningProxyConfig {
            tari_address: config.tari_address.clone(),
            base_node_grpc_port: config.base_node_grpc_port,
            coinbase_extra: config.coinbase_extra.clone(),
            p2pool_enabled: config.p2pool_enabled,
            port: PortAllocator::new().assign_port_with_fallback(),
            p2pool_grpc_port: config.p2pool_port,
            monero_nodes: config.monero_nodes.clone(),
            use_monero_fail: config.use_monero_fail,
        };
        process_watcher.adapter.config = Some(new_config.clone());
        info!(target: LOG_TARGET, "Starting mmproxy");
        process_watcher
            .start(
                config.app_shutdown,
                config.base_path,
                config.config_path,
                config.log_path,
                crate::binaries::Binaries::MergeMiningProxy,
            )
            .await?;

        Ok(())
    }

    pub async fn wait_ready(&self) -> Result<(), anyhow::Error> {
        // TODO: I'm ready when the http health service says so
        self.watcher.read().await.wait_ready().await?;
        // TODO: Currently the mmproxy takes a long time to connect to all the monero daemons. This should be changed to waiting for the http or grpc service to
        // say it is online
        sleep(std::time::Duration::from_secs(20)).await;
        Ok(())
    }

    pub async fn get_monero_port(&self) -> Result<u16, anyhow::Error> {
        let lock = self.watcher.read().await;
        match lock.adapter.config.clone() {
            Some(config) => Ok(config.port),
            None => Err(anyhow!("MM proxy not started")),
        }
    }

    pub async fn stop(&self) -> Result<(), anyhow::Error> {
        let mut process_watcher = self.watcher.write().await;
        process_watcher.stop().await?;
        Ok(())
    }

    pub async fn is_running(&self) -> bool {
        let lock = self.watcher.read().await;
        lock.is_running()
    }

    pub async fn is_pid_file_exists(&self, base_path: PathBuf) -> bool {
        let lock = self.watcher.read().await;
        lock.is_pid_file_exists(base_path)
    }
}
