use std::{path::PathBuf, sync::Arc};

use log::info;
use tari_common_types::tari_address::TariAddress;
use tari_core::transactions::tari_amount::MicroMinotari;
use tari_shutdown::ShutdownSignal;
use tokio::sync::RwLock;

use crate::binaries::{Binaries, BinaryResolver};
use crate::gpu_miner_adapter::GpuNodeSource;
use crate::process_utils;
use crate::{
    app_config::MiningMode,
    gpu_miner_adapter::{GpuMinerAdapter, GpuMinerStatus},
    process_watcher::ProcessWatcher,
};

const SHA_BLOCKS_PER_DAY: u64 = 360;
const LOG_TARGET: &str = "tari::universe::gpu_miner";

pub(crate) struct GpuMiner {
    watcher: Arc<RwLock<ProcessWatcher<GpuMinerAdapter>>>,
    is_available: bool,
    excluded_gpu_devices: Vec<u8>,
}

impl GpuMiner {
    pub fn new() -> Self {
        let adapter = GpuMinerAdapter::new();
        let process_watcher = ProcessWatcher::new(adapter);
        Self {
            watcher: Arc::new(RwLock::new(process_watcher)),
            is_available: false,
            excluded_gpu_devices: vec![],
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
        custom_gpu_grid_size: Option<u16>,
    ) -> Result<(), anyhow::Error> {
        let mut process_watcher = self.watcher.write().await;
        process_watcher.adapter.tari_address = tari_address;
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
                app_shutdown,
                base_path,
                config_path,
                log_path,
                Binaries::GpuMiner,
            )
            .await?;
        info!(target: LOG_TARGET, "xtrgpuminer started");

        Ok(())
    }

    pub async fn stop(&self) -> Result<(), anyhow::Error> {
        info!(target: LOG_TARGET, "Stopping xtrgpuminer");
        let mut process_watcher = self.watcher.write().await;
        process_watcher.status_monitor = None;
        process_watcher.stop().await?;
        info!(target: LOG_TARGET, "xtrgpuminer stopped");
        Ok(())
    }

    pub async fn status(
        &self,
        network_hash_rate: u64,
        block_reward: MicroMinotari,
    ) -> Result<GpuMinerStatus, anyhow::Error> {
        let process_watcher = self.watcher.read().await;
        if !process_watcher.is_running() {
            return Ok(GpuMinerStatus {
                hash_rate: 0,
                estimated_earnings: 0,
                is_mining: false,
                is_available: self.is_available,
            });
        }
        match &process_watcher.status_monitor {
            Some(status_monitor) => {
                let mut status = status_monitor.status().await?;
                let hash_rate = status.hash_rate;
                let estimated_earnings = if network_hash_rate == 0 {
                    0
                } else {
                    #[allow(clippy::cast_possible_truncation)]
                    {
                        ((block_reward.as_u64() as f64)
                            * (hash_rate as f64 / network_hash_rate as f64)
                            * (SHA_BLOCKS_PER_DAY as f64))
                            .floor() as u64
                    }
                };
                // Can't be more than the max reward for a day
                let estimated_earnings = std::cmp::min(
                    estimated_earnings,
                    block_reward.as_u64() * SHA_BLOCKS_PER_DAY,
                );
                status.estimated_earnings = estimated_earnings;
                status.is_available = self.is_available;
                Ok(status)
            }
            None => Ok(GpuMinerStatus {
                hash_rate: 0,
                estimated_earnings: 0,
                is_mining: false,
                is_available: self.is_available,
            }),
        }
    }

    pub async fn detect(&mut self, config_dir: PathBuf) -> Result<(), anyhow::Error> {
        info!(target: LOG_TARGET, "Verify if gpu miner can work on the system");

        let args: Vec<String> = vec![
            "--detect".to_string(),
            "true".to_string(),
            "--config".to_string(),
            config_dir
                .join("gpuminer")
                .join("config.json")
                .to_string_lossy()
                .to_string(),
            "--gpu-status-file".to_string(),
            config_dir
                .join("gpuminer")
                .join("gpu_status.json")
                .to_string_lossy()
                .to_string(),
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
}
