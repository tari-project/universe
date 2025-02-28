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

use log::{info, warn};
use serde::Deserialize;
use std::time::Duration;
use std::{path::PathBuf, sync::Arc};
use tari_common_types::tari_address::TariAddress;
use tari_core::transactions::tari_amount::MicroMinotari;
use tari_shutdown::ShutdownSignal;
use tokio::select;
use tokio::sync::{watch, RwLock};

use crate::app_config::GpuThreads;
use crate::binaries::{Binaries, BinaryResolver};
use crate::gpu_miner_adapter::GpuNodeSource;
use crate::process_stats_collector::ProcessStatsCollectorBuilder;
use crate::utils::math_utils::estimate_earning;
use crate::{
    app_config::MiningMode,
    gpu_miner_adapter::{GpuMinerAdapter, GpuMinerStatus},
    process_watcher::ProcessWatcher,
};
use crate::{process_utils, BaseNodeStatus};

const LOG_TARGET: &str = "tari::universe::gpu_miner";

#[derive(Debug, Deserialize)]
pub struct GpuStatusJson {
    pub gpu_devices: Vec<GpuConfig>,
}

#[derive(Debug, Deserialize, Clone)]
#[allow(dead_code)]
pub(crate) struct GpuConfig {
    pub device_index: u32,
    pub device_name: String,
    pub is_available: bool,
    pub grid_size: u32,
    pub max_grid_size: u32,
    pub block_size: u32,
}

pub(crate) struct GpuMiner {
    watcher: Arc<RwLock<ProcessWatcher<GpuMinerAdapter>>>,
    is_available: bool,
    gpu_devices: Vec<GpuConfig>,
    excluded_gpu_devices: Vec<u8>,
    node_status_watch_rx: watch::Receiver<BaseNodeStatus>,
    gpu_raw_status_rx: watch::Receiver<Option<GpuMinerStatus>>,
    status_broadcast: watch::Sender<GpuMinerStatus>,
}

impl GpuMiner {
    pub fn new(
        status_broadcast: watch::Sender<GpuMinerStatus>,
        node_status_watch_rx: watch::Receiver<BaseNodeStatus>,
        stats_collector: &mut ProcessStatsCollectorBuilder,
    ) -> Self {
        let (gpu_raw_status_tx, gpu_raw_status_rx) = watch::channel(None);
        let adapter = GpuMinerAdapter::new(vec![], gpu_raw_status_tx);
        let mut process_watcher = ProcessWatcher::new(adapter, stats_collector.take_gpu_miner());
        process_watcher.health_timeout = Duration::from_secs(9);
        process_watcher.poll_time = Duration::from_secs(10);

        Self {
            watcher: Arc::new(RwLock::new(process_watcher)),
            is_available: false,
            gpu_devices: vec![],
            excluded_gpu_devices: vec![],
            status_broadcast,
            node_status_watch_rx,
            gpu_raw_status_rx,
        }
    }

    #[allow(clippy::too_many_arguments)]
    pub async fn start(
        &mut self,
        app_shutdown: ShutdownSignal,
        tari_address: TariAddress,
        node_source: GpuNodeSource,
        base_path: PathBuf,
        config_path: PathBuf,
        log_path: PathBuf,
        mining_mode: MiningMode,
        coinbase_extra: String,
        custom_gpu_grid_size: Vec<GpuThreads>,
    ) -> Result<(), anyhow::Error> {
        let mut process_watcher = self.watcher.write().await;
        process_watcher.adapter.tari_address = tari_address;
        process_watcher.adapter.gpu_devices = self.gpu_devices.clone();
        process_watcher
            .adapter
            .set_mode(mining_mode, custom_gpu_grid_size);
        process_watcher.adapter.node_source = Some(node_source);
        process_watcher.adapter.coinbase_extra = coinbase_extra;
        process_watcher
            .adapter
            .set_excluded_gpu_devices(self.excluded_gpu_devices.clone());
        info!(target: LOG_TARGET, "Starting xtrgpuminer");
        process_watcher
            .start(
                app_shutdown.clone(),
                base_path,
                config_path,
                log_path,
                Binaries::GpuMiner,
            )
            .await?;
        info!(target: LOG_TARGET, "xtrgpuminer started");

        self.initialize_status_updates(app_shutdown).await;

        Ok(())
    }

    pub async fn stop(&self) -> Result<(), anyhow::Error> {
        info!(target: LOG_TARGET, "Stopping xtrgpuminer");
        {
            let mut process_watcher = self.watcher.write().await;
            process_watcher.status_monitor = None;
            process_watcher.stop().await?;
        }
        let _res = self.status_broadcast.send(GpuMinerStatus::default());
        info!(target: LOG_TARGET, "xtrgpuminer stopped");
        Ok(())
    }

    pub async fn is_running(&self) -> bool {
        let process_watcher = self.watcher.read().await;
        process_watcher.is_running()
    }

    pub async fn is_pid_file_exists(&self, base_path: PathBuf) -> bool {
        let lock = self.watcher.read().await;
        lock.is_pid_file_exists(base_path)
    }

    pub async fn detect(&mut self, config_dir: PathBuf) -> Result<(), anyhow::Error> {
        info!(target: LOG_TARGET, "Verify if gpu miner can work on the system");

        let config_file = config_dir
            .join("gpuminer")
            .join("config.json")
            .to_string_lossy()
            .to_string();
        let gpu_status_file = config_dir
            .join("gpuminer")
            .join("gpu_status.json")
            .to_string_lossy()
            .to_string();

        let args: Vec<String> = vec![
            "--detect".to_string(),
            "true".to_string(),
            "--config".to_string(),
            config_file.clone(),
            "--gpu-status-file".to_string(),
            gpu_status_file.clone(),
        ];
        let gpuminer_bin = BinaryResolver::current()
            .read()
            .await
            .resolve_path_to_binary_files(Binaries::GpuMiner)?;

        info!(target: LOG_TARGET, "Gpu miner binary file path {:?}", gpuminer_bin.clone());
        crate::download_utils::set_permissions(&gpuminer_bin).await?;
        let child = process_utils::launch_child_process(&gpuminer_bin, &config_dir, None, &args)?;
        let output = child.wait_with_output().await?;
        info!(target: LOG_TARGET, "Gpu detect exit code: {:?}", output.status.code().unwrap_or_default());
        let gpu_settings = std::fs::read_to_string(gpu_status_file)?;
        let gpu_settings: GpuStatusJson = serde_json::from_str(&gpu_settings)?;
        self.gpu_devices = gpu_settings.gpu_devices;
        match output.status.code() {
            Some(0) => {
                self.is_available = true;
                Ok(())
            }
            _ => {
                self.is_available = false;
                Err(anyhow::anyhow!(
                    "Non-zero exit code: {:?}",
                    output.status.code()
                ))
            }
        }
    }

    async fn initialize_status_updates(&self, mut app_shutdown: ShutdownSignal) {
        let mut gpu_raw_status_rx = self.gpu_raw_status_rx.clone();
        let node_status_watch_rx = self.node_status_watch_rx.clone();
        let status_broadcast = self.status_broadcast.clone();

        tauri::async_runtime::spawn(async move {
            loop {
                select! {
                    _ = gpu_raw_status_rx.changed() => {
                        let node_status = node_status_watch_rx.borrow().clone();
                        let gpu_raw_status = gpu_raw_status_rx.borrow().clone();

                        let gpu_status = match gpu_raw_status {
                            Some(gpu_raw_status) => {
                                let estimated_earnings = estimate_earning(
                                    node_status.sha_network_hashrate,
                                    gpu_raw_status.hash_rate,
                                    node_status.block_reward,
                                );

                                GpuMinerStatus {
                                    estimated_earnings: MicroMinotari(estimated_earnings).as_u64(),
                                    ..gpu_raw_status
                                }
                            }
                            None => {
                                warn!(target: LOG_TARGET, "Failed to get gpu miner status");
                                GpuMinerStatus::default()
                            }
                        };

                        let _result = status_broadcast.send(gpu_status);
                    },
                    _ = app_shutdown.wait() => {
                        break;
                    },
                }
            }
        });
    }

    pub fn is_gpu_mining_available(&self) -> bool {
        self.is_available
    }

    pub async fn set_excluded_device(
        &mut self,
        excluded_gpu_devices: Vec<u8>,
    ) -> Result<(), anyhow::Error> {
        self.excluded_gpu_devices = excluded_gpu_devices;
        Ok(())
    }

    pub async fn get_gpu_devices(&self) -> Result<Vec<GpuConfig>, anyhow::Error> {
        Ok(self.gpu_devices.clone())
    }
}
