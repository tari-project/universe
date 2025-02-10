use std::{
    fs::File,
    io::BufReader,
    path::{Path, PathBuf},
};

use anyhow::anyhow;
use log::debug;

#[derive(serde::Deserialize, serde::Serialize, Debug, Clone)]
pub struct GpuStatus {
    pub device_index: u32,
    pub device_name: String,
    pub is_available: bool,
    pub is_excluded: bool,
    pub grid_size: u32,
    pub max_grid_size: u32,
    pub block_size: u32,
}

#[derive(serde::Deserialize, serde::Serialize, Debug)]
pub struct GpuStatusFile {
    pub gpu_devices: Vec<GpuStatus>,
}

impl Default for GpuStatusFile {
    fn default() -> Self {
        Self::new()
    }
}

impl GpuStatusFile {
    pub fn new() -> Self {
        Self {
            gpu_devices: vec![],
        }
    }

    pub fn load(path: &PathBuf) -> Result<Self, anyhow::Error> {
        let file = File::open(path)?;
        let reader = BufReader::new(file);
        let config = serde_json::from_reader(reader)?;
        Ok(config)
    }

    pub fn save(new_content: Vec<GpuStatus>, path: &Path) -> Result<(), anyhow::Error> {
        debug!(
            "Updating gpu status file with {:?}, at path: {:?}",
            new_content, path
        );
        let content = serde_json::to_string_pretty(&GpuStatusFile {
            gpu_devices: new_content,
        })?;

        std::fs::write(path, content)
            .map_err(|e| anyhow!("Failed to save gpu status file: {}", e))?;
        Ok(())
    }
}
