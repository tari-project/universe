use std::{path::PathBuf, sync::Arc};

use log::info;
use tari_common_types::tari_address::TariAddress;
use tari_shutdown::ShutdownSignal;
use tokio::sync::RwLock;

use crate::{gpu_miner_adapter::GpuMinerAdapter, process_watcher::ProcessWatcher};

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
        base_path: PathBuf,
        log_path: PathBuf,
    ) -> Result<(), anyhow::Error> {
        let mut process_watcher = self.watcher.write().await;
        process_watcher.adapter.tari_address = tari_address;
        info!(target: LOG_TARGET, "Starting xtrgpuminer");
        process_watcher
            .start(app_shutdown, base_path, log_path)
            .await?;

        Ok(())
    }

    pub async fn stop(&self) -> Result<(), anyhow::Error> {
        let mut process_watcher = self.watcher.write().await;
        process_watcher.stop().await?;
        Ok(())
    }

    pub fn status(&mut self) {}
}
