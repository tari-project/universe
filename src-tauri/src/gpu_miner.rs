use std::{path::PathBuf, sync::Arc};

use log::info;
use tari_common_types::tari_address::TariAddress;
use tari_core::transactions::tari_amount::MicroMinotari;
use tari_shutdown::ShutdownSignal;
use tokio::sync::RwLock;

use crate::{
    gpu_miner_adapter::{GpuMinerAdapter, GpuMinerStatus},
    process_adapter::StatusMonitor,
    process_watcher::{self, ProcessWatcher},
};

const LOG_TARGET: &str = "tari::universe::cpu_miner";

pub(crate) struct GpuMiner {
    watcher: Arc<RwLock<ProcessWatcher<GpuMinerAdapter>>>,
}

impl GpuMiner {
    pub fn new() -> Self {
        let adapter = GpuMinerAdapter::new();
        let process_watcher = ProcessWatcher::new(adapter);
        Self {
            watcher: Arc::new(RwLock::new(process_watcher)),
        }
    }

    pub async fn start(
        &mut self,
        app_shutdown: ShutdownSignal,
        tari_address: TariAddress,
        node_grpc_port: u16,
        base_path: PathBuf,
        config_path: PathBuf,
        log_path: PathBuf,
    ) -> Result<(), anyhow::Error> {
        let mut process_watcher = self.watcher.write().await;
        process_watcher.adapter.tari_address = tari_address;
        process_watcher.adapter.node_grpc_port = node_grpc_port;
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
    ) -> Result<(Option<GpuMinerStatus>, EstimatedEarnings), anyhow::Error> {
        let process_watcher = self.watcher.read().await;
        match &process_watcher.status_monitor {
            Some(status_monitor) => {
                let status = status_monitor.status().await?;
                let estimated_earnings = EstimatedEarnings {};
                Ok((Some(status), estimated_earnings))
            }
            None => Ok((None, EstimatedEarnings {})),
        }
    }
}

pub struct EstimatedEarnings {}
