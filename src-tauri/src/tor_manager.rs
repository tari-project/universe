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

use crate::process_stats_collector::ProcessStatsCollectorBuilder;
use crate::process_watcher::ProcessWatcher;
use crate::tor_adapter::{TorAdapter, TorConfig};
use crate::tor_control_client::TorStatus;
use std::{path::PathBuf, sync::Arc};
use tari_shutdown::ShutdownSignal;
use tokio::sync::{watch, RwLock};

pub(crate) struct TorManager {
    watcher: Arc<RwLock<ProcessWatcher<TorAdapter>>>,
}

impl Clone for TorManager {
    fn clone(&self) -> Self {
        Self {
            watcher: self.watcher.clone(),
        }
    }
}

impl TorManager {
    pub fn new(
        status_broadcast: watch::Sender<Option<TorStatus>>,
        stats_collector: &mut ProcessStatsCollectorBuilder,
    ) -> Self {
        let adapter = TorAdapter::new(status_broadcast);
        let process_watcher = ProcessWatcher::new(adapter, stats_collector.take_tor());

        Self {
            watcher: Arc::new(RwLock::new(process_watcher)),
        }
    }

    pub async fn ensure_started(
        &self,
        app_shutdown: ShutdownSignal,
        base_path: PathBuf,
        config_path: PathBuf,
        log_path: PathBuf,
    ) -> Result<(), anyhow::Error> {
        {
            let mut process_watcher = self.watcher.write().await;

            process_watcher
                .adapter
                .load_or_create_config(config_path.clone())
                .await?;
            process_watcher
                .start(
                    app_shutdown,
                    base_path,
                    config_path,
                    log_path,
                    crate::binaries::Binaries::Tor,
                )
                .await?;
        }
        self.wait_ready().await?;
        Ok(())
    }

    pub async fn wait_ready(&self) -> Result<(), anyhow::Error> {
        let process_watcher = self.watcher.read().await;
        match process_watcher.wait_ready().await {
            Ok(_) => {
                drop(process_watcher);
            }
            Err(e) => {
                drop(process_watcher);
                let mut write_lock = self.watcher.write().await;
                let _exit_code = write_lock.stop().await?;

                return Err(e);
            }
        }

        Ok(())
    }

    pub async fn get_tor_config(&self) -> TorConfig {
        self.watcher.read().await.adapter.get_tor_config()
    }

    pub async fn set_tor_config(&self, config: TorConfig) -> Result<TorConfig, anyhow::Error> {
        self.watcher
            .write()
            .await
            .adapter
            .set_tor_config(config)
            .await
    }

    pub async fn get_control_port(&self) -> Result<Option<u16>, anyhow::Error> {
        let process_watcher = self.watcher.read().await;
        Ok(process_watcher
            .status_monitor
            .as_ref()
            .map(|m| m.control_port))
    }

    pub async fn get_entry_guards(&self) -> Result<Vec<String>, anyhow::Error> {
        self.watcher.read().await.adapter.get_entry_guards().await
    }

    pub async fn stop(&self) -> Result<i32, anyhow::Error> {
        let mut process_watcher = self.watcher.write().await;
        let exit_code = process_watcher.stop().await?;
        Ok(exit_code)
    }

    pub async fn is_running(&self) -> bool {
        let process_watcher = self.watcher.read().await;
        process_watcher.is_running()
    }

    pub async fn is_pid_file_exists(&self, base_path: PathBuf) -> bool {
        let lock = self.watcher.read().await;
        lock.is_pid_file_exists(base_path)
    }
}
