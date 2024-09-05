use std::{path::PathBuf, sync::Arc};

use log::info;
use tari_common_types::tari_address::TariAddress;
use tari_core::transactions::tari_amount::MicroMinotari;
use tari_shutdown::ShutdownSignal;
use tokio::sync::RwLock;

use crate::p2pool_manager::P2poolConfig;
use crate::{
    app_config::MiningMode,
    gpu_miner_adapter::{GpuMinerAdapter, GpuMinerStatus},
    process_adapter::StatusMonitor,
    process_watcher::ProcessWatcher,
};

const SHA_BLOCKS_PER_DAY: u64 = 360;
const LOG_TARGET: &str = "tari::universe::gpu_miner";

pub(crate) struct GpuMiner {
    watcher: Arc<RwLock<ProcessWatcher<GpuMinerAdapter>>>,
    p2pool_config: Arc<P2poolConfig>,
}

impl GpuMiner {
    pub fn new(p2pool_config: Arc<P2poolConfig>) -> Self {
        let adapter = GpuMinerAdapter::new();
        let process_watcher = ProcessWatcher::new(adapter);
        Self {
            watcher: Arc::new(RwLock::new(process_watcher)),
            p2pool_config,
        }
    }

    pub async fn start(
        &mut self,
        app_shutdown: ShutdownSignal,
        tari_address: TariAddress,
        node_grpc_port: u16,
        p2pool_enabled: bool,
        base_path: PathBuf,
        config_path: PathBuf,
        log_path: PathBuf,
        mining_mode: MiningMode,
    ) -> Result<(), anyhow::Error> {
        let mut process_watcher = self.watcher.write().await;
        process_watcher.adapter.tari_address = tari_address;
        process_watcher.adapter.node_grpc_port = node_grpc_port;
        process_watcher.adapter.set_mode(mining_mode);
        process_watcher.adapter.p2pool_enabled = p2pool_enabled;
        process_watcher.adapter.p2pool_grpc_port = self.p2pool_config.grpc_port;
        info!(target: LOG_TARGET, "Starting xtrgpuminer");
        process_watcher
            .start(app_shutdown, base_path, config_path, log_path)
            .await?;

        Ok(())
    }

    pub async fn stop(&self) -> Result<(), anyhow::Error> {
        let mut process_watcher = self.watcher.write().await;
        process_watcher.stop().await?;
        Ok(())
    }

    pub async fn status(
        &mut self,
        network_hash_rate: u64,
        block_reward: MicroMinotari,
    ) -> Result<GpuMinerStatus, anyhow::Error> {
        let process_watcher = self.watcher.read().await;
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
                Ok(status)
            }
            None => Ok(GpuMinerStatus {
                hash_rate: 0,
                estimated_earnings: 0,
                is_mining: false,
            }),
        }
    }
}
