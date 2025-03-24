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

use std::{
    fs::File,
    io::BufReader,
    path::{Path, PathBuf},
};

use anyhow::anyhow;
use log::debug;

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
    pub gpu_devices: Vec<GpuDevice>,
}

impl Default for GpuStatusFile {
    fn default() -> Self {
        Self {
            gpu_devices: Vec::new(),
        }
    }
}

impl GpuStatusFile {
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
}
