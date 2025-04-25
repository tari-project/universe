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
use crate::tasks_tracker::TasksTrackers;
use crate::tor_adapter::{TorAdapter, TorConfig};
use crate::tor_control_client::TorStatus;
use crate::APPLICATION_FOLDER_ID;
use anyhow::anyhow;
use dirs::data_local_dir;
use log::error;
use std::time::Duration;
use std::{path::PathBuf, sync::Arc};
use tauri_plugin_sentry::sentry;
use tokio::sync::{watch, RwLock};

const LOG_TARGET: &str = "tari::universe::tor_manager";
const STARTUP_TIMEOUT: u64 = 180; // 3mins

pub(crate) struct TorManager {
    watcher: Arc<RwLock<ProcessWatcher<TorAdapter>>>,
    status_watch_rx: watch::Receiver<TorStatus>,
}

impl Clone for TorManager {
    fn clone(&self) -> Self {
        Self {
            watcher: self.watcher.clone(),
            status_watch_rx: self.status_watch_rx.clone(),
        }
    }
}

impl TorManager {
    pub fn new(
        status_broadcast: watch::Sender<TorStatus>,
        stats_collector: &mut ProcessStatsCollectorBuilder,
    ) -> Self {
        let status_watch_rx = status_broadcast.subscribe();
        let adapter = TorAdapter::new(status_broadcast);
        let mut process_watcher = ProcessWatcher::new(adapter, stats_collector.take_tor());
        process_watcher.expected_startup_time = Duration::from_secs(STARTUP_TIMEOUT);
        process_watcher.health_timeout = Duration::from_secs(9);
        process_watcher.poll_time = Duration::from_secs(10);

        Self {
            watcher: Arc::new(RwLock::new(process_watcher)),
            status_watch_rx,
        }
    }

    pub async fn ensure_started(
        &self,
        base_path: PathBuf,
        config_path: PathBuf,
        log_path: PathBuf,
    ) -> Result<(), anyhow::Error> {
        {
            let shutdown_signal = TasksTrackers::current().core_phase.get_signal().await;
            let task_tracker = TasksTrackers::current().core_phase.get_task_tracker().await;

            let mut process_watcher = self.watcher.write().await;

            process_watcher
                .adapter
                .load_or_create_config(config_path.clone())
                .await?;
            process_watcher
                .start(
                    base_path,
                    config_path,
                    log_path,
                    crate::binaries::Binaries::Tor,
                    shutdown_signal,
                    task_tracker,
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

        // Ensure node is fully bootstrapped
        let mut shutdown_signal = TasksTrackers::current().node_phase.get_signal().await;
        let mut tor_status_watch_rx = self.status_watch_rx.clone();

        loop {
            tokio::select! {
                _ = tokio::time::sleep(Duration::from_secs(STARTUP_TIMEOUT)) => {
                    let err_msg = format!("Waiting for Tor to be ready timed out after {}", STARTUP_TIMEOUT);
                    log::error!(target: LOG_TARGET, "{}", err_msg);
                    sentry::capture_message(&err_msg, sentry::Level::Error);
                    return Err(anyhow!(err_msg))
                }
                _ = tor_status_watch_rx.changed() => {
                    let tor_status = *tor_status_watch_rx.borrow();
                    log::info!(target: LOG_TARGET, "Waiting for Tor bootstrap: {}%", tor_status.bootstrap_phase);
                    if tor_status.is_bootstrapped && tor_status.network_liveness && tor_status.circuit_ok {
                        break;
                    }
                }
                _ = shutdown_signal.wait() => {
                    log::warn!(target: LOG_TARGET, "Shutdown signal received, stopping wait_ready for Tor");
                    break;
                }
            };
        }

        Ok(())
    }

    pub async fn clear_local_files(&self) -> Result<(), anyhow::Error> {
        let mut watcher = self.watcher.write().await;
        watcher.stop().await?;
        if watcher.is_running() {
            error!(target: LOG_TARGET, "Tor is running, cannot clear local files");
        }

        if let Some(local_dir) = data_local_dir() {
            let node_dir = local_dir.join(APPLICATION_FOLDER_ID).join("tor-data");

            if node_dir.exists() {
                std::fs::remove_dir_all(&node_dir).map_err(|e| {
                    error!(target: LOG_TARGET, "Failed to remove tor directory: {}", e);
                    anyhow::anyhow!("Failed to remove tor directory: {}", e)
                })?;
            }
        };

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

    #[allow(dead_code)]
    pub async fn stop(&self) -> Result<i32, anyhow::Error> {
        let mut process_watcher = self.watcher.write().await;
        let exit_code = process_watcher.stop().await?;
        Ok(exit_code)
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
}
