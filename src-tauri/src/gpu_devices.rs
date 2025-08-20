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

use serde::{Deserialize, Serialize};
use std::{
    path::{Path, PathBuf},
    sync::LazyLock,
};
use tokio::{
    fs::OpenOptions,
    io::{AsyncReadExt, BufReader},
    sync::RwLock,
};

use crate::{
    binaries::{Binaries, BinaryResolver},
    configs::{
        config_mining::{ConfigMining, ConfigMiningContent},
        trait_config::ConfigImpl,
    },
    events_emitter::EventsEmitter,
    process_utils,
};

use log::info;

const LOG_TARGET: &str = "tari::universe::gpu_devices";

static INSTANCE: LazyLock<RwLock<GpuDevices>> = LazyLock::new(|| RwLock::new(GpuDevices::new()));

#[allow(clippy::upper_case_acronyms)]
#[derive(Serialize, Debug, Deserialize, Clone, PartialEq)]
pub enum GpuVendor {
    NVIDIA,
    AMD,
    Intel,
    Unknown,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub enum GpuDeviceType {
    Integrated,
    Dedicated,
    Unknown,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GpuDeviceInformation {
    pub name: String,
    pub device_id: u32,
    pub platform_name: String,
    pub vendor: GpuVendor,
    pub max_work_group_size: usize,
    pub max_compute_units: u32,
    pub global_mem_size: u64,
    pub device_type: GpuDeviceType,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GpuInformationFile {
    pub devices: Vec<GpuDeviceInformation>,
}

impl GpuInformationFile {
    pub async fn load(path: &PathBuf) -> Result<Self, anyhow::Error> {
        let file = OpenOptions::new().read(true).open(path).await?;

        let mut reader = BufReader::new(file);
        let mut contents = String::new();
        reader.read_to_string(&mut contents).await?;

        let gpu_information_file = serde_json::from_str(&contents)?;
        Ok(gpu_information_file)
    }
}
#[derive(Debug)]
pub struct GpuDevices {
    pub devices: Vec<GpuDeviceInformation>,
}

impl GpuDevices {
    pub fn new() -> Self {
        Self {
            devices: Vec::new(),
        }
    }

    fn _gpu_information_file_parent_directory(&self, config_dir: &Path) -> PathBuf {
        config_dir.join("gpuminer")
    }

    fn _construct_gpu_information_file_path(
        &self,
        config_dir: &Path,
    ) -> Result<PathBuf, anyhow::Error> {
        let gpu_information_file_path = self
            ._gpu_information_file_parent_directory(config_dir)
            .join("gpu_information_opencl.json");
        gpu_information_file_path
            .try_exists()
            .map_err(|e| anyhow::anyhow!("Failed to check if gpu status file exists: {}", e))?;

        Ok(gpu_information_file_path)
    }

    pub fn current() -> &'static RwLock<GpuDevices> {
        &INSTANCE
    }

    pub async fn detect(&mut self, config_dir: PathBuf) -> Result<(), anyhow::Error> {
        let gpu_information_file_directory =
            self._gpu_information_file_parent_directory(&config_dir);
        let gpu_information_file_path = self._construct_gpu_information_file_path(&config_dir)?;

        let args: Vec<String> = vec![
            "--detect".to_string(),
            "--information-file-dir".to_string(),
            gpu_information_file_directory.to_string_lossy().to_string(),
        ];
        let gpuminer_bin = BinaryResolver::current()
            .resolve_path_to_binary_files(Binaries::GpuMinerSHA3X)
            .await?;

        info!(target: LOG_TARGET, "Gpu miner binary file path {:?}", gpuminer_bin.clone());
        crate::download_utils::set_permissions(&gpuminer_bin).await?;
        let child =
            process_utils::launch_child_process(&gpuminer_bin, &config_dir, None, &args, false)?;
        let output = child.wait_with_output().await?;
        info!(target: LOG_TARGET, "Gpu detect exit code: {:?}", output.status.code().unwrap_or_default());

        match output.status.code() {
            Some(0) => {
                let gpu_information_file =
                    GpuInformationFile::load(&gpu_information_file_path).await?;
                self.devices = gpu_information_file.devices;

                EventsEmitter::emit_detected_devices(self.devices.clone()).await;
                let devices_indexes: Vec<u32> = self.devices.iter().map(|d| d.device_id).collect();
                ConfigMining::update_field(
                    ConfigMiningContent::populate_gpu_devices_settings,
                    devices_indexes,
                )
                .await?;

                EventsEmitter::emit_update_gpu_devices_settings(
                    ConfigMining::content().await.gpu_devices_settings().clone(),
                )
                .await;

                Ok(())
            }
            _ => Err(anyhow::anyhow!(
                "Non-zero exit code: {:?}",
                output.status.code()
            )),
        }
    }
}
