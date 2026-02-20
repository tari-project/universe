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

use crate::configs::config_mining::{ConfigMining, ConfigMiningContent, MiningModeType};
use crate::configs::trait_config::ConfigImpl;
use crate::events_emitter::EventsEmitter;
use crate::hardware::hardware_status_monitor::HardwareStatusMonitor;
use crate::mining::cpu::manager::CpuManager;
use crate::mining::gpu::manager::GpuManager;
use crate::systemtray_manager::{SystemTrayEvents, SystemTrayManager};
use serde_json::json;

pub async fn get_mining_status() -> Result<String, String> {
    let cpu_running = CpuManager::read().await.is_running();
    let gpu_running = GpuManager::read().await.is_running();
    let config = ConfigMining::content().await;

    let result = json!({
        "cpu_running": cpu_running,
        "gpu_running": gpu_running,
        "mode": config.selected_mining_mode(),
        "cpu_mining_enabled": config.cpu_mining_enabled(),
        "gpu_mining_enabled": config.gpu_mining_enabled(),
    });

    serde_json::to_string(&result).map_err(|e| e.to_string())
}

pub async fn get_mining_mode() -> Result<String, String> {
    let config = ConfigMining::content().await;
    let selected = config.selected_mining_mode().clone();
    let modes = config.mining_modes();

    let result = if let Some(mode) = modes.get(&selected) {
        json!({
            "selected_mode": selected,
            "mode_type": mode.mode_type.to_string(),
            "cpu_usage_percentage": mode.cpu_usage_percentage,
            "gpu_usage_percentage": mode.gpu_usage_percentage,
        })
    } else {
        json!({
            "selected_mode": selected,
            "error": "Mode details not found in config",
        })
    };

    serde_json::to_string(&result).map_err(|e| e.to_string())
}

pub async fn list_mining_modes() -> Result<String, String> {
    let config = ConfigMining::content().await;
    let modes = config.mining_modes();

    let result: Vec<serde_json::Value> = modes
        .values()
        .map(|mode| {
            json!({
                "mode_name": mode.mode_name,
                "mode_type": mode.mode_type.to_string(),
                "cpu_usage_percentage": mode.cpu_usage_percentage,
                "gpu_usage_percentage": mode.gpu_usage_percentage,
            })
        })
        .collect();

    serde_json::to_string(&result).map_err(|e| e.to_string())
}

pub async fn start_mining(cpu: Option<bool>, gpu: Option<bool>) -> Result<String, String> {
    let start_cpu = cpu.unwrap_or(true);
    let start_gpu = gpu.unwrap_or(true);
    let mut results = json!({});

    if start_cpu {
        match CpuManager::write().await.start_mining().await {
            Ok(()) => results["cpu"] = json!("started"),
            Err(e) => results["cpu"] = json!(format!("error: {e}")),
        }
    }

    if start_gpu {
        match GpuManager::write().await.start_mining().await {
            Ok(()) => results["gpu"] = json!("started"),
            Err(e) => results["gpu"] = json!(format!("error: {e}")),
        }
    }

    serde_json::to_string(&results).map_err(|e| e.to_string())
}

pub async fn stop_mining(cpu: Option<bool>, gpu: Option<bool>) -> Result<String, String> {
    let stop_cpu = cpu.unwrap_or(true);
    let stop_gpu = gpu.unwrap_or(true);
    let mut results = json!({});

    if stop_cpu {
        match CpuManager::write().await.stop_mining().await {
            Ok(()) => results["cpu"] = json!("stopped"),
            Err(e) => results["cpu"] = json!(format!("error: {e}")),
        }
    }

    if stop_gpu {
        match GpuManager::write().await.stop_mining().await {
            Ok(()) => results["gpu"] = json!("stopped"),
            Err(e) => results["gpu"] = json!(format!("error: {e}")),
        }
    }

    serde_json::to_string(&results).map_err(|e| e.to_string())
}

pub async fn set_mining_mode(mode: String) -> Result<String, String> {
    let cpu_was_running = CpuManager::read().await.is_running();
    let gpu_was_running = GpuManager::read().await.is_running();

    // Stop running miners before changing mode
    if cpu_was_running {
        let _unused = CpuManager::write().await.stop_mining().await;
    }
    if gpu_was_running {
        let _unused = GpuManager::write().await.stop_mining().await;
    }

    ConfigMining::update_field(ConfigMiningContent::set_selected_mining_mode, mode.clone())
        .await
        .map_err(|e| format!("Failed to set mining mode: {e}"))?;

    if mode != "Eco" {
        ConfigMining::update_field(ConfigMiningContent::set_eco_alert_needed, false)
            .await
            .map_err(|e| format!("Failed to update eco alert: {e}"))?;
    }

    SystemTrayManager::send_event(SystemTrayEvents::MiningMode(MiningModeType::from(
        mode.clone(),
    )))
    .await;

    EventsEmitter::emit_mining_config_loaded(&ConfigMining::content().await).await;

    // Restart miners that were previously running
    if cpu_was_running {
        let _unused = CpuManager::write().await.start_mining().await;
    }
    if gpu_was_running {
        let _unused = GpuManager::write().await.start_mining().await;
    }

    let config = ConfigMining::content().await;
    let modes = config.mining_modes();

    let result = if let Some(m) = modes.get(&mode) {
        json!({
            "selected_mode": mode,
            "mode_type": m.mode_type.to_string(),
            "cpu_usage_percentage": m.cpu_usage_percentage,
            "gpu_usage_percentage": m.gpu_usage_percentage,
        })
    } else {
        json!({
            "selected_mode": mode,
            "warning": "Mode was set but details not found in configured modes",
        })
    };

    serde_json::to_string(&result).map_err(|e| e.to_string())
}

pub async fn get_gpu_devices() -> Result<String, String> {
    let devices = HardwareStatusMonitor::current()
        .get_gpu_public_properties()
        .await
        .map_err(|e| format!("Failed to get GPU devices: {e}"))?;

    let result: Vec<serde_json::Value> = devices
        .iter()
        .map(|d| {
            json!({
                "vendor": format!("{:?}", d.vendor),
                "name": d.name,
                "device_type": d.device_type,
                "is_available": d.status.is_available,
                "is_reader_implemented": d.status.is_reader_implemented,
                "parameters": d.parameters.as_ref().map(|p| json!({
                    "usage_percentage": p.usage_percentage,
                    "current_temperature": p.current_temperature,
                    "max_temperature": p.max_temperature,
                })),
            })
        })
        .collect();

    serde_json::to_string(&result).map_err(|e| e.to_string())
}
