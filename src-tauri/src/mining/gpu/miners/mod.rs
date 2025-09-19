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

use std::path::PathBuf;

use serde::{Deserialize, Serialize};
use tokio::{
    fs::OpenOptions,
    io::{AsyncReadExt, AsyncWriteExt, BufReader},
};

use crate::mining::gpu::miners::{glytex::GlytexGpuDevice, graxil::GraxilGpuDeviceInformation};

pub mod glytex;
pub mod graxil;
pub mod lolminer;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GpuCommonInformation {
    name: String,
    device_id: u32,
}

impl GpuCommonInformation {
    pub fn from_glytex_devices(device: GlytexGpuDevice) -> Self {
        Self {
            name: device.device_name,
            device_id: device.device_index,
        }
    }
    pub fn from_graxil_devices(devices: GraxilGpuDeviceInformation) -> Self {
        Self {
            name: devices.name,
            device_id: devices.device_id,
        }
    }
}

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

pub async fn load_file_content<T>(path: &PathBuf) -> Result<T, anyhow::Error>
where
    T: serde::de::DeserializeOwned,
{
    let file = OpenOptions::new().read(true).open(path).await?;

    let mut reader = BufReader::new(file);
    let mut contents = String::new();
    reader.read_to_string(&mut contents).await?;

    let gpu_information_file = serde_json::from_str(&contents)?;
    Ok(gpu_information_file)
}

pub async fn save_file_content<T>(path: &PathBuf, content: &T) -> Result<(), anyhow::Error>
where
    T: serde::Serialize,
{
    let serialized = serde_json::to_string_pretty(content)?;
    let mut file = OpenOptions::new()
        .write(true)
        .create(true)
        .truncate(true)
        .open(path)
        .await?;
    file.write_all(serialized.as_bytes()).await?;
    Ok(())
}
