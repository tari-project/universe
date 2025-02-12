use std::{
    collections::HashMap,
    fs::File,
    io::BufReader,
    path::{Path, PathBuf},
};

use anyhow::anyhow;
use log::{debug, warn};

#[derive(serde::Deserialize, serde::Serialize, Debug, Clone)]
pub struct GpuStatus {
    pub recommended_grid_size: u32,
    pub recommended_block_size: u32,
    pub max_grid_size: u32,
}

#[derive(serde::Deserialize, serde::Serialize, Debug, Clone)]
pub struct GpuSettings {
    pub is_excluded: bool,
    pub is_available: bool,
}

impl Default for GpuSettings {
    fn default() -> Self {
        Self {
            is_excluded: false,
            is_available: true,
        }
    }
}

#[derive(serde::Deserialize, serde::Serialize, Debug, Clone)]
pub struct GpuDevice {
    pub device_name: String,
    pub device_index: u32,
    pub status: GpuStatus,
    pub settings: GpuSettings,
}

#[derive(serde::Deserialize, serde::Serialize, Debug, Clone)]
pub struct GpuStatusFile {
    pub gpu_devices: HashMap<String, GpuDevice>,
}

impl Default for GpuStatusFile {
    fn default() -> Self {
        Self {
            gpu_devices: HashMap::new(),
        }
    }
}

impl GpuStatusFile {
    pub fn new(gpu_devices: Vec<GpuDevice>, file_path: &PathBuf) -> Self {
        let resolved_gpu_file_content =
            Self::resolve_settings_for_detected_devices(gpu_devices, file_path);

        Self {
            gpu_devices: resolved_gpu_file_content,
        }
    }

    pub fn load(path: &PathBuf) -> Result<Self, anyhow::Error> {
        let file = File::open(path)?;
        let reader = BufReader::new(file);
        let config = serde_json::from_reader(reader)?;
        Ok(config)
    }

    pub fn save(new_content: GpuStatusFile, path: &Path) -> Result<(), anyhow::Error> {
        debug!(
            "Updating gpu status file with {:?}, at path: {:?}",
            new_content, path
        );
        let content = serde_json::to_string_pretty(&new_content)?;

        std::fs::write(path, content)
            .map_err(|e| anyhow!("Failed to save gpu status file: {}", e))?;
        Ok(())
    }

    fn resolve_settings_for_detected_devices(
        gpu_devices: Vec<GpuDevice>,
        file_path: &PathBuf,
    ) -> HashMap<String, GpuDevice> {
        match Self::load(file_path) {
            Ok(file) => {
                let mut resolved_gpu_devices = HashMap::new();
                for device in gpu_devices {
                    let device_name = device.device_name.clone();
                    let resolved_device = match file.gpu_devices.get(&device_name) {
                        Some(existing_device) => {
                            let mut resolved_device = device.clone();
                            resolved_device.settings = existing_device.settings.clone();
                            resolved_device
                        }
                        None => device,
                    };
                    resolved_gpu_devices.insert(device_name, resolved_device);
                }
                resolved_gpu_devices
            }
            Err(e) => {
                warn!(
                    "Could not load GPU status file: {}. Using detected devices",
                    e
                );
                gpu_devices
                    .into_iter()
                    .map(|device| (device.device_name.clone(), device))
                    .collect()
            }
        }
    }
}
