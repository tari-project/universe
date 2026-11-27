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

use crate::process_adapter::ProcessAdapter;
use crate::process_stats_collector::ProcessStatsCollectorBuilder;
use crate::process_watcher::ProcessWatcher;
use crate::tasks_tracker::TasksTrackers;
use crate::tor_adapter::{TorAdapter, TorConfig};
use crate::tor_control_client::TorStatus;
use crate::{LOG_TARGET_APP_LOGIC, LOG_TARGET_STATUSES};
use anyhow::anyhow;
use log::{error, info};
use std::time::Duration;
use std::{path::PathBuf, sync::Arc};
use tokio::sync::{RwLock, watch};

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
            let shutdown_signal = TasksTrackers::current().node_phase.get_signal().await;
            let task_tracker = TasksTrackers::current().node_phase.get_task_tracker().await;

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
                write_lock.status_monitor = None;

                return Err(e);
            }
        }

        // Ensure node is fully bootstrapped
        let mut shutdown_signal = TasksTrackers::current().node_phase.get_signal().await;
        let mut tor_status_watch_rx = self.status_watch_rx.clone();

        // One fixed deadline for the whole wait. A plain sleep() recreated each
        // iteration would restart on every status update (Tor emits one roughly
        // every poll), so the timeout would never actually fire while Tor keeps
        // reporting progress. sleep_until keeps pointing at the same instant.
        let deadline = tokio::time::Instant::now() + Duration::from_secs(STARTUP_TIMEOUT);

        loop {
            tokio::select! {
                _ = tokio::time::sleep_until(deadline) => {
                    let err_msg = format!("Waiting for Tor to be ready timed out after {STARTUP_TIMEOUT}");
                    log::error!(target: LOG_TARGET_STATUSES, "{err_msg}");
                    let mut write_lock = self.watcher.write().await;
                    if let Err(e) = write_lock.stop().await {
                        log::warn!(target: LOG_TARGET_STATUSES, "Failed to stop Tor after the startup timeout: {e}");
                    }
                    write_lock.status_monitor = None;
                    return Err(anyhow!(err_msg))
                }
                _ = tor_status_watch_rx.changed() => {
                    let tor_status = *tor_status_watch_rx.borrow();
                    log::info!(target: LOG_TARGET_STATUSES, "Waiting for Tor bootstrap: {}%", tor_status.bootstrap_phase);
                    if tor_status.is_bootstrapped && tor_status.network_liveness && tor_status.circuit_ok {
                        break;
                    }
                }
                _ = shutdown_signal.wait() => {
                    let err_msg = "Tor startup interrupted by shutdown signal";
                    log::warn!(target: LOG_TARGET_STATUSES, "{err_msg}");
                    return Err(anyhow!(err_msg));
                }
            };
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
        if !process_watcher.is_running() {
            return Ok(None);
        }
        Ok(process_watcher
            .status_monitor
            .as_ref()
            .map(|m| m.control_port))
    }

    pub async fn get_control_cookie_path(&self) -> Option<PathBuf> {
        let process_watcher = self.watcher.read().await;
        if !process_watcher.is_running() {
            return None;
        }
        process_watcher
            .status_monitor
            .as_ref()
            .map(|m| m.cookie_path())
    }

    pub async fn get_entry_guards(&self) -> Result<Vec<String>, anyhow::Error> {
        self.watcher.read().await.adapter.get_entry_guards().await
    }

    pub async fn on_app_exit(&self) {
        match self
            .watcher
            .read()
            .await
            .adapter
            .ensure_no_hanging_processes_are_running()
            .await
        {
            Ok(_) => {
                info!(target: LOG_TARGET_APP_LOGIC, "TorManager::on_app_exit completed successfully");
            }
            Err(e) => {
                error!(target: LOG_TARGET_APP_LOGIC, "TorManager::on_app_exit failed: {}", e);
            }
        }
    }

    #[allow(dead_code)]
    pub async fn stop(&self) -> Result<i32, anyhow::Error> {
        let mut process_watcher = self.watcher.write().await;
        let exit_code = process_watcher.stop().await?;
        process_watcher.status_monitor = None;
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

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn control_port_and_cookie_are_none_when_tor_watcher_is_not_running() {
        let temp = tempfile::tempdir().expect("tempdir");
        let (tx, _rx) = watch::channel(TorStatus::default());
        let mut stats = ProcessStatsCollectorBuilder::new();
        let manager = TorManager::new(tx, &mut stats);

        {
            let mut watcher = manager.watcher.write().await;
            let (_instance, monitor) = watcher
                .adapter
                .spawn_inner(
                    temp.path().to_path_buf(),
                    temp.path().to_path_buf(),
                    temp.path().to_path_buf(),
                    temp.path().join("tor"),
                    false,
                )
                .expect("spawn_inner");
            watcher.status_monitor = Some(monitor);
        }

        assert!(!manager.is_running().await);
        assert_eq!(manager.get_control_port().await.expect("port"), None);
        assert_eq!(manager.get_control_cookie_path().await, None);
    }

    #[tokio::test]
    async fn stop_clears_stale_status_monitor() {
        let temp = tempfile::tempdir().expect("tempdir");
        let (tx, _rx) = watch::channel(TorStatus::default());
        let mut stats = ProcessStatsCollectorBuilder::new();
        let manager = TorManager::new(tx, &mut stats);

        {
            let mut watcher = manager.watcher.write().await;
            let (_instance, monitor) = watcher
                .adapter
                .spawn_inner(
                    temp.path().to_path_buf(),
                    temp.path().to_path_buf(),
                    temp.path().to_path_buf(),
                    temp.path().join("tor"),
                    false,
                )
                .expect("spawn_inner");
            watcher.status_monitor = Some(monitor);
        }

        let exit_code = manager.stop().await.expect("stop");
        assert_eq!(exit_code, 0);
        assert!(manager.watcher.read().await.status_monitor.is_none());
    }
}
