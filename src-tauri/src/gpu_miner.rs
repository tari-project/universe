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
use serde::{Deserialize, Serialize};
use std::fmt::Display;
use std::fs::read_dir;
use std::path::Path;
use std::time::Duration;
use std::{path::PathBuf, sync::Arc};
use tari_common_types::tari_address::TariAddress;
use tari_core::transactions::tari_amount::MicroMinotari;
use tari_shutdown::ShutdownSignal;
use tauri::AppHandle;
use tokio::select;
use tokio::sync::{watch, RwLock};

use crate::app_config::GpuThreads;
use crate::binaries::{Binaries, BinaryResolver};
use crate::events_manager::EventsManager;
use crate::gpu_miner_adapter::GpuNodeSource;
use crate::gpu_status_file::{GpuDevice, GpuStatusFile};
use crate::process_stats_collector::ProcessStatsCollectorBuilder;
use crate::tasks_tracker::TasksTrackers;
use crate::utils::math_utils::estimate_earning;
use crate::{
    app_config::MiningMode,
    gpu_miner_adapter::{GpuMinerAdapter, GpuMinerStatus},
    process_watcher::ProcessWatcher,
};
use crate::{process_utils, BaseNodeStatus};

const LOG_TARGET: &str = "tari::universe::gpu_miner";

#[derive(Debug, PartialEq, Clone, Serialize, Deserialize, Default)]
pub enum EngineType {
    #[default]
    OpenCL,
    Cuda,
    Metal,
}

impl Display for EngineType {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            EngineType::Cuda => write!(f, "CUDA"),
            EngineType::OpenCL => write!(f, "OpenCL"),
            EngineType::Metal => write!(f, "Metal"),
        }
    }
}

impl EngineType {
    pub fn from_string(engine_type: &str) -> Result<EngineType, anyhow::Error> {
        match engine_type {
            "CUDA" => Ok(EngineType::Cuda),
            "OpenCL" => Ok(EngineType::OpenCL),
            "Metal" => Ok(EngineType::Metal),
            _ => Err(anyhow::anyhow!("Invalid engine type")),
        }
    }
}

pub(crate) struct GpuMiner {
    watcher: Arc<RwLock<ProcessWatcher<GpuMinerAdapter>>>,
    is_available: bool,
    gpu_devices: Vec<GpuDevice>,
    curent_selected_engine: EngineType,
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
        let adapter = GpuMinerAdapter::new(Vec::new(), gpu_raw_status_tx);
        let mut process_watcher = ProcessWatcher::new(adapter, stats_collector.take_gpu_miner());
        process_watcher.health_timeout = Duration::from_secs(9);
        process_watcher.poll_time = Duration::from_secs(10);

        Self {
            watcher: Arc::new(RwLock::new(process_watcher)),
            is_available: false,
            gpu_devices: Vec::new(),
            curent_selected_engine: EngineType::OpenCL,
            status_broadcast,
            node_status_watch_rx,
            gpu_raw_status_rx,
        }
    }

    #[allow(clippy::too_many_arguments)]
    pub async fn start(
        &mut self,
        tari_address: TariAddress,
        node_source: GpuNodeSource,
        base_path: PathBuf,
        config_path: PathBuf,
        log_path: PathBuf,
        mining_mode: MiningMode,
        coinbase_extra: String,
        custom_gpu_grid_size: Vec<GpuThreads>,
    ) -> Result<(), anyhow::Error> {
        let shutdown_signal = TasksTrackers::current().hardware_phase.get_signal().await;
        let task_tracker = TasksTrackers::current()
            .hardware_phase
            .get_task_tracker()
            .await;

        let mut process_watcher = self.watcher.write().await;
        process_watcher.adapter.tari_address = tari_address;
        process_watcher.adapter.gpu_devices = self.gpu_devices.clone();
        process_watcher
            .adapter
            .set_mode(mining_mode, custom_gpu_grid_size);
        process_watcher.adapter.node_source = Some(node_source);
        process_watcher.adapter.coinbase_extra = coinbase_extra;
        info!(target: LOG_TARGET, "Starting xtrgpuminer");
        process_watcher
            .start(
                base_path,
                config_path,
                log_path,
                Binaries::GpuMiner,
                shutdown_signal.clone(),
                task_tracker,
            )
            .await?;
        info!(target: LOG_TARGET, "xtrgpuminer started");

        self.initialize_status_updates(shutdown_signal).await;

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
    #[allow(dead_code)]
    pub async fn is_pid_file_exists(&self, base_path: PathBuf) -> bool {
        let lock = self.watcher.read().await;
        lock.is_pid_file_exists(base_path)
    }

    pub async fn detect(
        &mut self,
        app: AppHandle,
        config_dir: PathBuf,
        engine: EngineType,
    ) -> Result<(), anyhow::Error> {
        info!(target: LOG_TARGET, "Verify if gpu miner can work on the system");
        self.curent_selected_engine = engine;

        let config_file = config_dir
            .join("gpuminer")
            .join("config.json")
            .to_string_lossy()
            .to_string();
        let gpu_engine_statuses = get_gpu_engines_statuses_path(&config_dir)
            .to_string_lossy()
            .to_string();

        let args: Vec<String> = vec![
            "--detect".to_string(),
            "true".to_string(),
            "--config".to_string(),
            config_file.clone(),
            "--gpu-status-file".to_string(),
            gpu_engine_statuses.clone(),
            "--engine".to_string(),
            self.curent_selected_engine.to_string(),
        ];
        let gpuminer_bin = BinaryResolver::current()
            .read()
            .await
            .resolve_path_to_binary_files(Binaries::GpuMiner)
            .await?;

        info!(target: LOG_TARGET, "Gpu miner binary file path {:?}", gpuminer_bin.clone());
        crate::download_utils::set_permissions(&gpuminer_bin).await?;
        let child = process_utils::launch_child_process(&gpuminer_bin, &config_dir, None, &args)?;
        let output = child.wait_with_output().await?;
        info!(target: LOG_TARGET, "Gpu detect exit code: {:?}", output.status.code().unwrap_or_default());

        let gpu_status_file_name = format!("{}_gpu_status.json", self.curent_selected_engine);
        let gpu_status_file_path =
            get_gpu_engines_statuses_path(&config_dir).join(gpu_status_file_name);
        let gpu_status_file = GpuStatusFile::load(&gpu_status_file_path)?;

        self.gpu_devices = gpu_status_file.gpu_devices;
        match output.status.code() {
            Some(0) => {
                self.is_available = true;
                EventsManager::handle_detected_available_gpu_engines(
                        &app,
                        self.get_available_gpu_engines(config_dir)
                            .await?
                            .iter()
                            .map(|x| x.to_string())
                            .collect(),
                        self.curent_selected_engine.to_string(),
                    )
                    .await;

                EventsManager::handle_detected_devices(&app, self.gpu_devices.clone())
                    .await;
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

    pub async fn get_available_gpu_engines(
        &self,
        config_dir: PathBuf,
    ) -> Result<Vec<EngineType>, anyhow::Error> {
        let mut available_engines: Vec<EngineType> = vec![];
        let engine_statuses_directory = config_dir.join("gpuminer").join("engine_statuses");

        for entry in read_dir(engine_statuses_directory)? {
            info!(target: LOG_TARGET, "Reading engine status file");
            info!(target: LOG_TARGET, "Engine status file: {:?}", entry);
            let entry = entry?;
            let path = entry.path();
            // let file_name = path.file_name().unwrap().to_str().unwrap();
            let file_name = path
                .file_name()
                .ok_or_else(|| anyhow::anyhow!("Failed to get file name"))?
                .to_str()
                .ok_or_else(|| anyhow::anyhow!("Failed conversion to string"))?;

            let sanitized_file_name = file_name.split("_").collect::<Vec<&str>>()[0];
            let engine_type = EngineType::from_string(sanitized_file_name);

            info!(target: LOG_TARGET, "File name: {:?}", file_name);
            info!(target: LOG_TARGET, "Sanitized file name: {:?}", sanitized_file_name);

            match engine_type {
                Ok(engine) => {
                    available_engines.push(engine);
                }
                Err(_) => {
                    info!(target: LOG_TARGET, "Invalid engine type: {:?}", sanitized_file_name);
                }
            }
        }

        Ok(available_engines)
    }

    async fn initialize_status_updates(&self, mut app_shutdown: ShutdownSignal) {
        let mut gpu_raw_status_rx = self.gpu_raw_status_rx.clone();
        let node_status_watch_rx = self.node_status_watch_rx.clone();
        let status_broadcast = self.status_broadcast.clone();

        tauri::async_runtime::spawn(async move {
            loop {
                select! {
                    _ = gpu_raw_status_rx.changed() => {
                        let node_status = *node_status_watch_rx.borrow();
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

    pub async fn toggle_device_exclusion(
        &mut self,
        config_dir: PathBuf,
        device_index: u32,
        excluded: bool,
    ) -> Result<(), anyhow::Error> {
        let device = self
            .gpu_devices
            .iter_mut()
            .find(|gpu_device| gpu_device.device_index == device_index);

        if let Some(gpu_device) = device {
            gpu_device.settings.is_excluded = excluded;
        }

        let path = get_gpu_engines_statuses_path(&config_dir)
            .join(format!("{}_gpu_status.json", self.curent_selected_engine));
        GpuStatusFile::save(
            GpuStatusFile {
                gpu_devices: self.gpu_devices.clone(),
            },
            &path,
        )?;

        Ok(())
    }

    pub async fn set_selected_engine(
        &mut self,
        engine: EngineType,
        config_dir: PathBuf,
        app: AppHandle,
    ) -> Result<(), anyhow::Error> {
        self.curent_selected_engine = engine.clone();
        let mut process_watcher = self.watcher.write().await;
        process_watcher.adapter.curent_selected_engine = engine;

        let gpu_status_file_name = format!("{}_gpu_status.json", self.curent_selected_engine);
        let gpu_status_file_path =
            get_gpu_engines_statuses_path(&config_dir).join(gpu_status_file_name);
        let gpu_settings = GpuStatusFile::load(&gpu_status_file_path)?;

        self.gpu_devices = gpu_settings.gpu_devices;

        EventsManager::handle_detected_devices(&app, self.gpu_devices.clone())
            .await;

        Ok(())
    }

    pub async fn get_gpu_devices(&self) -> Result<Vec<GpuDevice>, anyhow::Error> {
        Ok(self.gpu_devices.clone())
    }
}

fn get_gpu_engines_statuses_path(config_dir: &Path) -> PathBuf {
    config_dir.join("gpuminer").join("engine_statuses").clone()
}
