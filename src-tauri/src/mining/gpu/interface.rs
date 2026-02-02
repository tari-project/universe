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

use std::time::Duration;

use axum::async_trait;

use crate::{
    mining::{
        gpu::miners::lolminer::{LolMinerGpuMiner, LolMinerGpuMinerStatusMonitor},
        GpuConnectionType,
    },
    process_adapter::{
        HandleUnhealthyResult, HealthStatus, ProcessAdapter, ProcessInstance, StatusMonitor,
    },
};

pub trait GpuMinerInterfaceTrait: Send + Sync {
    async fn load_tari_address(&mut self, tari_address: &str) -> Result<(), anyhow::Error>;
    async fn load_worker_name(&mut self, worker_name: Option<&str>) -> Result<(), anyhow::Error>;
    async fn load_intensity_percentage(
        &mut self,
        intensity_percentage: u32,
    ) -> Result<(), anyhow::Error>;
    async fn load_connection_type(
        &mut self,
        connection_type: GpuConnectionType,
    ) -> Result<(), anyhow::Error>;
    async fn detect_devices(&mut self) -> Result<(), anyhow::Error>;
    async fn load_excluded_devices(
        &mut self,
        _excluded_devices: Vec<u32>,
    ) -> Result<(), anyhow::Error> {
        Ok(())
    }
}

pub enum GpuMinerInterface {
    LolMiner(LolMinerGpuMiner),
}

impl GpuMinerInterfaceTrait for GpuMinerInterface {
    async fn load_tari_address(&mut self, tari_address: &str) -> Result<(), anyhow::Error> {
        match self {
            GpuMinerInterface::LolMiner(miner) => miner.load_tari_address(tari_address).await,
        }
    }
    async fn load_worker_name(&mut self, worker_name: Option<&str>) -> Result<(), anyhow::Error> {
        match self {
            GpuMinerInterface::LolMiner(miner) => miner.load_worker_name(worker_name).await,
        }
    }
    async fn load_intensity_percentage(
        &mut self,
        intensity_percentage: u32,
    ) -> Result<(), anyhow::Error> {
        match self {
            GpuMinerInterface::LolMiner(miner) => {
                miner.load_intensity_percentage(intensity_percentage).await
            }
        }
    }
    async fn load_connection_type(
        &mut self,
        connection_type: GpuConnectionType,
    ) -> Result<(), anyhow::Error> {
        match self {
            GpuMinerInterface::LolMiner(miner) => miner.load_connection_type(connection_type).await,
        }
    }

    async fn detect_devices(&mut self) -> Result<(), anyhow::Error> {
        match self {
            GpuMinerInterface::LolMiner(miner) => miner.detect_devices().await,
        }
    }

    async fn load_excluded_devices(
        &mut self,
        excluded_devices: Vec<u32>,
    ) -> Result<(), anyhow::Error> {
        match self {
            GpuMinerInterface::LolMiner(miner) => {
                miner.load_excluded_devices(excluded_devices).await
            }
        }
    }
}

#[derive(Clone)]
pub enum GpuMinerStatusInterface {
    LolMiner(LolMinerGpuMinerStatusMonitor),
}

#[async_trait]
impl StatusMonitor for GpuMinerStatusInterface {
    async fn handle_unhealthy(
        &self,
        duration_since_last_healthy_status: Duration,
    ) -> Result<HandleUnhealthyResult, anyhow::Error> {
        match self {
            GpuMinerStatusInterface::LolMiner(monitor) => {
                monitor
                    .handle_unhealthy(duration_since_last_healthy_status)
                    .await
            }
        }
    }
    async fn check_health(&self, uptime: Duration, timeout_duration: Duration) -> HealthStatus {
        match self {
            GpuMinerStatusInterface::LolMiner(monitor) => {
                monitor.check_health(uptime, timeout_duration).await
            }
        }
    }
}

impl ProcessAdapter for GpuMinerInterface {
    type ProcessInstance = ProcessInstance;
    type StatusMonitor = GpuMinerStatusInterface;
    fn spawn_inner(
        &self,
        base_folder: std::path::PathBuf,
        config_folder: std::path::PathBuf,
        log_folder: std::path::PathBuf,
        binary_version_path: std::path::PathBuf,
        is_first_start: bool,
    ) -> Result<(Self::ProcessInstance, Self::StatusMonitor), anyhow::Error> {
        match self {
            GpuMinerInterface::LolMiner(miner) => miner.spawn_inner(
                base_folder,
                config_folder,
                log_folder,
                binary_version_path,
                is_first_start,
            ),
        }
    }
    fn name(&self) -> &str {
        match self {
            GpuMinerInterface::LolMiner(miner) => miner.name(),
        }
    }
    fn pid_file_name(&self) -> &str {
        match self {
            GpuMinerInterface::LolMiner(miner) => miner.pid_file_name(),
        }
    }
}
