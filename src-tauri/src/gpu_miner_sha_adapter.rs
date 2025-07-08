use axum::async_trait;
use log::info;
use std::{path::PathBuf, time::Duration};
use tari_common_types::tari_address::TariAddress;
use tari_shutdown::Shutdown;

use crate::process_adapter::{
    HealthStatus, ProcessAdapter, ProcessInstance, ProcessStartupSpec, StatusMonitor,
};

const LOG_TARGET: &str = "tari::universe::gpu_miner_sha_adapter";

#[derive(Clone)]
pub struct GpuMinerShaAdapter {
    pub tari_address: Option<TariAddress>,
    pub intensity: Option<u8>,
    pub batch_size: Option<u32>,
    pub worker_name: Option<String>,
}

impl GpuMinerShaAdapter {
    pub fn new() -> Self {
        Self {
            tari_address: None,
            batch_size: None,
            intensity: None,
            worker_name: None,
        }
    }
}

impl ProcessAdapter for GpuMinerShaAdapter {
    type StatusMonitor = GpuMinerShaStatusMonitor;
    type ProcessInstance = ProcessInstance;

    fn spawn_inner(
        &self,
        base_folder: PathBuf,
        _config_folder: PathBuf,
        _log_folder: PathBuf,
        binary_version_path: PathBuf,
        _is_first_start: bool,
    ) -> Result<(Self::ProcessInstance, Self::StatusMonitor), anyhow::Error> {
        let inner_shutdown = Shutdown::new();

        let mut args: Vec<String> = vec![];

        args.push("--algo".to_string());
        args.push("sha3x".to_string());

        args.push("--pool".to_string());
        args.push("pool.sha3x.supportxtm.com:6118".to_string());

        if let Some(tari_address) = &self.tari_address {
            args.push("--wallet".to_string());
            args.push(tari_address.to_base58());
        } else {
            return Err(anyhow::anyhow!(
                "Tari address must be set before starting the GpuMinerShaAdapter"
            ));
        }

        if let Some(intensity) = self.intensity {
            args.push("--gpu-intensity".to_string());
            args.push(intensity.to_string());
        }

        if let Some(batch_size) = self.batch_size {
            args.push("--gpu-batch-size".to_string());
            args.push(batch_size.to_string());
        }

        if let Some(worker_name) = &self.worker_name {
            args.push("--worker".to_string());
            args.push(worker_name.clone());
        }

        Ok((
            ProcessInstance {
                shutdown: inner_shutdown,
                startup_spec: ProcessStartupSpec {
                    file_path: binary_version_path,
                    envs: None,
                    args,
                    data_dir: base_folder,
                    pid_file_name: self.pid_file_name().to_string(),
                    name: self.name().to_string(),
                },
                handle: None,
            },
            GpuMinerShaStatusMonitor {},
        ))
    }

    fn name(&self) -> &str {
        "GpuMinerShaAdapter"
    }

    fn pid_file_name(&self) -> &str {
        "gpu_miner_sha.pid"
    }
}

#[derive(Clone)]
pub struct GpuMinerShaStatusMonitor {}

#[async_trait]
impl StatusMonitor for GpuMinerShaStatusMonitor {
    async fn check_health(&self, uptime: Duration, timeout_duration: Duration) -> HealthStatus {
        info!(target: LOG_TARGET, "GpuMinerShaStatusMonitor health check called");
        HealthStatus::Healthy
    }
}

impl GpuMinerShaStatusMonitor {
    pub async fn status(&self) -> Result<(), anyhow::Error> {
        info!(target: LOG_TARGET, "GpuMinerShaStatusMonitor status check called");
        Ok(())
    }
}
