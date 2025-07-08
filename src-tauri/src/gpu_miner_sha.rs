use log::info;
use std::{path::PathBuf, sync::Arc, time::Duration};
use tari_common_types::tari_address::TariAddress;
use tokio::sync::RwLock;

use crate::{
    binaries::Binaries, gpu_miner_sha_adapter::GpuMinerShaAdapter, process_watcher::ProcessWatcher,
    tasks_tracker::TasksTrackers, ProcessStatsCollectorBuilder,
};

const LOG_TARGET: &str = "tari::universe::gpu_miner_sha";

pub struct GpuMinerSha {
    watcher: Arc<RwLock<ProcessWatcher<GpuMinerShaAdapter>>>,
}

impl GpuMinerSha {
    pub fn new(stats_collector: &mut ProcessStatsCollectorBuilder) -> Self {
        let adapter = GpuMinerShaAdapter::new();
        let mut process_watcher =
            ProcessWatcher::new(adapter, stats_collector.take_gpu_miner_sha());
        process_watcher.health_timeout = Duration::from_secs(15);
        process_watcher.poll_time = Duration::from_secs(10);

        Self {
            watcher: Arc::new(RwLock::new(process_watcher)),
        }
    }

    pub async fn start(
        &self,
        tari_address: TariAddress,
        telemetry_id: String,
        base_path: PathBuf,
        config_path: PathBuf,
        log_path: PathBuf,
    ) -> Result<(), anyhow::Error> {
        let shutdown_signal = TasksTrackers::current().hardware_phase.get_signal().await;
        let task_tracker = TasksTrackers::current()
            .hardware_phase
            .get_task_tracker()
            .await;

        let mut process_watcher = self.watcher.write().await;

        process_watcher.adapter.tari_address = Some(tari_address);
        process_watcher.adapter.worker_name = Some(telemetry_id.to_string());
        process_watcher.adapter.batch_size = Some(10000);
        process_watcher.adapter.intensity = Some(100);
        info!(target: LOG_TARGET, "Starting sha miner");
        process_watcher
            .start(
                base_path,
                config_path,
                log_path,
                Binaries::GpuMinerSHA3X,
                shutdown_signal.clone(),
                task_tracker,
            )
            .await?;
        info!(target: LOG_TARGET, "sha miner started");

        Ok(())
    }

    pub async fn stop(&self) -> Result<(), anyhow::Error> {
        info!(target: LOG_TARGET, "Stopping sha miner");
        {
            let mut process_watcher = self.watcher.write().await;
            process_watcher.status_monitor = None;
            process_watcher.stop().await?;
        }
        info!(target: LOG_TARGET, "xtrgpuminer stopped");
        Ok(())
    }

    pub async fn initialize_status_updates() -> Result<(), anyhow::Error> {
        Ok(())
    }
}
