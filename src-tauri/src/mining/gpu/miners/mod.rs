use std::path::PathBuf;

use serde::{Deserialize, Serialize};
use tokio::{
    fs::OpenOptions,
    io::{AsyncReadExt, BufReader},
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
