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

use crate::airdrop;
use crate::airdrop::get_wallet_view_key_hashed;

use crate::app_in_memory_config::AppInMemoryConfig;
use crate::commands::CpuMinerStatus;
use crate::configs::config_core::ConfigCore;
use crate::configs::config_mining::ConfigMining;
use crate::configs::trait_config::ConfigImpl;
use crate::hardware::hardware_status_monitor::HardwareStatusMonitor;
use crate::internal_wallet::InternalWallet;
use crate::mining::gpu::consts::GpuMinerStatus;
use crate::mining::gpu::consts::GpuMiningAlgorithm;
use crate::node::node_adapter::BaseNodeStatus;
use crate::node::node_manager::NodeManager;
use crate::process_stats_collector::ProcessStatsCollector;
use crate::process_utils::retry_with_backoff;
use crate::tor_control_client::TorStatus;
use crate::utils::address_utils::extract_payment_id;
use crate::utils::network_status::NetworkStatus;
use crate::TasksTrackers;
use anyhow::Result;
use base64::prelude::*;
use blake2::digest::Update;
use blake2::digest::VariableOutput;
use blake2::Blake2bVar;
use jsonwebtoken::errors::Error as JwtError;
use log::{debug, error, info, warn};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use sha2::Digest;
use std::collections::HashMap;
use std::ops::Div;
use std::time::Instant;
use std::{sync::Arc, time::Duration};
use sysinfo::{Disks, System};
use tari_common::configuration::Network;
use tari_shutdown::ShutdownSignal;
use tari_utilities::encoding::MBase58;
use tauri::Emitter;
use tauri::Manager;
use tokio::sync::{watch, RwLock};
use tokio::time::interval;

const LOG_TARGET: &str = "tari::universe::telemetry_manager";

struct TelemetryFrequency(u64);

impl From<TelemetryFrequency> for Duration {
    fn from(value: TelemetryFrequency) -> Self {
        Duration::from_secs(value.0)
    }
}

impl Default for TelemetryFrequency {
    fn default() -> Self {
        TelemetryFrequency(15)
    }
}

#[derive(Debug, Deserialize, Serialize, Clone)]
#[serde(rename_all = "lowercase")]
pub enum TelemetryResource {
    Cpu,
    Gpu,
    #[serde(rename(serialize = "cpu-gpu"))]
    CpuGpu,
    None,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
#[serde(rename_all = "lowercase")]
pub enum TelemetryNetwork {
    MainNet,
    StageNet,
    NextNet,
    LocalNet,
    Igor,
    Esmeralda,
}

#[derive(Debug, thiserror::Error)]
pub enum TelemetryManagerError {
    #[error("Other error: {0}")]
    Other(#[from] anyhow::Error),

    #[error("Jwt decodeing error: {0}")]
    JwtDecodeError(#[from] JwtError),

    #[error("Reqwest error: {0}")]
    ReqwestError(#[from] reqwest::Error),

    #[error("TelemetryManagerError::Cancelled")]
    Cancelled,
}

impl From<Network> for TelemetryNetwork {
    fn from(value: Network) -> Self {
        match value {
            Network::MainNet => TelemetryNetwork::MainNet,
            Network::StageNet => TelemetryNetwork::StageNet,
            Network::NextNet => TelemetryNetwork::NextNet,
            Network::LocalNet => TelemetryNetwork::LocalNet,
            Network::Igor => TelemetryNetwork::Igor,
            Network::Esmeralda => TelemetryNetwork::Esmeralda,
        }
    }
}

#[derive(Debug, Deserialize, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
struct UserPoints {
    pub gems: f64,
    pub shells: f64,
    pub hammers: f64,
    pub rank: Option<String>,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
struct ReferralCount {
    pub gems: f64,
    pub count: i64,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
struct TelemetryDataResponse {
    pub success: bool,
    pub user_points: Option<UserPoints>,
    pub referral_count: Option<ReferralCount>,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
struct TelemetryDataResponseEvent {
    pub base: UserPoints,
    pub referral_count: ReferralCount,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct TelemetryData {
    pub app_id: String,
    pub block_height: u64,
    pub is_mining_active: bool,
    pub network: Option<TelemetryNetwork>,
    pub resource_used: TelemetryResource,
    pub cpu_hash_rate: Option<f64>,
    pub cpu_utilization: Option<f32>,
    pub cpu_make: Option<String>,
    pub gpu_hash_rate: Option<f64>,
    pub gpu_hash_rate_c29: Option<f64>,
    pub gpu_utilization: Option<f32>,
    pub gpu_make: Option<String>,
    pub mode: String,
    pub version: String,
    pub extra_data: HashMap<String, String>,
    pub current_os: String,
    pub download_speed: f64,
    pub upload_speed: f64,
    pub latency: f64,
    pub wallet_view_key_hashed: String,
    pub exchange_id: String,
    pub tari_address: String,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct NotificationData {
    pub app_id: String,
    pub network: Option<TelemetryNetwork>,
    pub version: String,
    pub is_mining_active: bool,
    pub wallet_view_key_hashed: String,
    pub is_orphan: bool,
}

impl From<TelemetryData> for NotificationData {
    fn from(data: TelemetryData) -> Self {
        Self {
            app_id: data.app_id,
            network: data.network,
            version: data.version,
            is_mining_active: data.is_mining_active,
            wallet_view_key_hashed: data.wallet_view_key_hashed,
            is_orphan: data
                .extra_data
                .get("is_orphan")
                .unwrap_or(&"false".to_string())
                == "true",
        }
    }
}

pub struct TelemetryManager {
    cpu_miner_status_watch_rx: watch::Receiver<CpuMinerStatus>,
    in_memory_config: Arc<RwLock<AppInMemoryConfig>>,
    node_network: Option<Network>,
    gpu_status: watch::Receiver<GpuMinerStatus>,
    node_status: watch::Receiver<BaseNodeStatus>,
    tor_status: watch::Receiver<TorStatus>,
    process_stats_collector: ProcessStatsCollector,
    node_manager: NodeManager,
}

impl TelemetryManager {
    #[allow(clippy::too_many_arguments)]
    pub fn new(
        cpu_miner_status_watch_rx: watch::Receiver<CpuMinerStatus>,
        in_memory_config: Arc<RwLock<AppInMemoryConfig>>,
        network: Option<Network>,
        gpu_status: watch::Receiver<GpuMinerStatus>,
        node_status: watch::Receiver<BaseNodeStatus>,
        tor_status: watch::Receiver<TorStatus>,
        process_stats_collector: ProcessStatsCollector,
        node_manager: NodeManager,
    ) -> Self {
        Self {
            cpu_miner_status_watch_rx,
            node_network: network,
            in_memory_config,
            gpu_status,
            node_status,
            tor_status,
            process_stats_collector,
            node_manager,
        }
    }

    pub async fn get_unique_string(&self) -> String {
        let allow_telemetry = *ConfigCore::content().await.allow_telemetry();
        let anon_id = ConfigCore::content().await.anon_id().clone();
        let airdrop_tokens = ConfigCore::content().await.airdrop_tokens().clone();

        if !allow_telemetry {
            return "".to_string();
        }

        // let os = std::env::consts::OS;
        let mut hasher = Blake2bVar::new(20).expect("Failed to create hasher");
        hasher.update(anon_id.as_bytes());
        let mut buf = [0u8; 20];
        hasher
            .finalize_variable(&mut buf)
            .expect("Failed to finalize hasher variable");
        let version = env!("CARGO_PKG_VERSION");
        // let mode = MiningMode::to_str(config.mode());

        let airdrop_access_token = airdrop_tokens.map(|tokens| tokens.token);
        let id: Option<String> = airdrop_access_token
            .and_then(|token| airdrop::decode_jwt_claims(&token).map(|claim| claim.id));

        let id_or_empty = id.unwrap_or("".to_string());
        let id_as_bytes = id_or_empty.as_bytes();

        let mut sha256_hasher = sha2::Sha256::new();
        sha2::Digest::update(&mut sha256_hasher, id_as_bytes);
        let id_sha256 = sha256_hasher.finalize();
        let id_base64_sha256 = BASE64_STANDARD_NO_PAD.encode(id_sha256);

        let unique_string = format!(
            "v3,{},{},{}",
            buf.to_monero_base58(),
            version,
            id_base64_sha256
        );

        unique_string
    }

    #[allow(dead_code)]
    pub fn update_network(&mut self, network: Option<Network>) {
        self.node_network = network;
    }

    pub async fn initialize(&mut self, app_handle: tauri::AppHandle) -> Result<()> {
        info!(target: LOG_TARGET, "Starting telemetry manager");
        self.start_telemetry_process(TelemetryFrequency::default().into(), app_handle)
            .await?;
        Ok(())
    }

    async fn start_telemetry_process(
        &mut self,
        timeout: Duration,
        app_handle: tauri::AppHandle,
    ) -> Result<(), TelemetryManagerError> {
        let uptime = Instant::now();
        let cpu_miner_status_watch_rx = self.cpu_miner_status_watch_rx.clone();
        let gpu_status = self.gpu_status.clone();
        let node_status = self.node_status.clone();
        let tor_status = self.tor_status.clone();
        let network = self.node_network;
        let in_memory_config_cloned = self.in_memory_config.clone();
        let stats_collector = self.process_stats_collector.clone();
        let node_manager = self.node_manager.clone();
        let mut shutdown_signal = TasksTrackers::current().common.get_signal().await;
        let mut interval = interval(timeout);
        interval.set_missed_tick_behavior(tokio::time::MissedTickBehavior::Skip);

        TasksTrackers::current().common.get_task_tracker().await.spawn(async move {
            loop {
                let airdrop_tokens = ConfigCore::content().await.airdrop_tokens().clone();
                let allow_telemetry = *ConfigCore::content().await.allow_telemetry();
                let allow_notifications = *ConfigCore::content().await.allow_notifications();
                tokio::select! {
                    _ = interval.tick() => {
                        debug!(target: LOG_TARGET, "TelemetryManager::start_telemetry_process has  been started");
                        let airdrop_access_token = airdrop_tokens.map(|tokens| tokens.token);
                        let airdrop_access_token_validated = airdrop::validate_jwt(airdrop_access_token).await;
                        let memory_config = in_memory_config_cloned.read().await;
                        let exchange_id = memory_config.exchange_id.clone();
                        let telemetry_data = cancellable_get_telemetry_data(app_handle.clone(),&cpu_miner_status_watch_rx, &gpu_status, &node_status,
                            &tor_status, network, exchange_id, uptime, &stats_collector, &node_manager, &mut (shutdown_signal.clone())).await;
                        let airdrop_api_url = in_memory_config_cloned.read().await.airdrop_api_url.clone();
                        handle_data(telemetry_data, airdrop_api_url, airdrop_access_token_validated, app_handle.clone(), &mut (shutdown_signal.clone()), allow_telemetry, allow_notifications).await;

                    },
                    _ = shutdown_signal.wait() => {
                        info!(target: LOG_TARGET,"TelemetryManager::start_telemetry_process has been cancelled by app shutdown");
                        break;
                    }
                }
            }
        });
        Ok(())
    }
}

#[allow(clippy::too_many_arguments)]
async fn cancellable_get_telemetry_data(
    app_handle: tauri::AppHandle,
    cpu_miner_status_watch_rx: &watch::Receiver<CpuMinerStatus>,
    gpu_latest_miner_stats: &watch::Receiver<GpuMinerStatus>,
    node_latest_status: &watch::Receiver<BaseNodeStatus>,
    tor_latest_status: &watch::Receiver<TorStatus>,
    network: Option<Network>,
    exchange_id: String,
    started: Instant,
    stats_collector: &ProcessStatsCollector,
    node_manager: &NodeManager,
    shutdown_signal: &mut ShutdownSignal,
) -> Result<TelemetryData, TelemetryManagerError> {
    tokio::select! {result = get_telemetry_data_inner(app_handle.clone(),cpu_miner_status_watch_rx, gpu_latest_miner_stats, node_latest_status, tor_latest_status, network, started, stats_collector, node_manager, exchange_id) => {
            result
        }
        _ = shutdown_signal.wait() => {
            info!(target: LOG_TARGET,"TelemetryManager::start_telemetry_process has been cancelled by app shutdown");
            Err(TelemetryManagerError::Cancelled)
        }
    }
}
#[allow(clippy::too_many_lines)]
#[allow(clippy::too_many_arguments)]
async fn get_telemetry_data_inner(
    app_handle: tauri::AppHandle,
    cpu_miner_status_watch_rx: &watch::Receiver<CpuMinerStatus>,
    gpu_latest_miner_stats: &watch::Receiver<GpuMinerStatus>,
    node_latest_status: &watch::Receiver<BaseNodeStatus>,
    tor_latest_status: &watch::Receiver<TorStatus>,
    network: Option<Network>,
    started: Instant,
    stats_collector: &ProcessStatsCollector,
    node_manager: &NodeManager,
    exchange_id: String,
) -> Result<TelemetryData, TelemetryManagerError> {
    let BaseNodeStatus {
        block_height,
        is_synced,
        num_connections,
        ..
    } = *node_latest_status.borrow();

    let wallet_view_key_hashed = get_wallet_view_key_hashed(app_handle.clone()).await;
    let cpu_miner_status = cpu_miner_status_watch_rx.borrow().clone();
    let gpu_status = gpu_latest_miner_stats.borrow().clone();
    let config = ConfigCore::content().await;
    let gpu_hardware_parameters = HardwareStatusMonitor::current()
        .get_gpu_public_properties()
        .await
        .ok();
    let cpu_hardware_parameters = HardwareStatusMonitor::current()
        .get_cpu_public_properties()
        .await
        .ok();

    let tor_status = *tor_latest_status.borrow();

    let is_mining_active = cpu_miner_status.hash_rate > 0.0 || gpu_status.hash_rate > 0.0;
    let cpu_hash_rate = Some(cpu_miner_status.hash_rate);

    let cpu_utilization = if let Some(cpu_hardware_parameters) = cpu_hardware_parameters.clone() {
        let filtered_cpus = cpu_hardware_parameters
            .iter()
            .filter(|c| c.parameters.is_some())
            .collect::<Vec<_>>();
        Some(
            filtered_cpus
                .iter()
                .map(|c| c.parameters.clone().unwrap_or_default().usage_percentage)
                .sum::<f32>()
                .div(filtered_cpus.len() as f32),
        )
    } else {
        None
    };

    let (cpu_make, all_cpus) =
        if let Some(cpu_hardware_parameters) = cpu_hardware_parameters.clone() {
            let cpu_names: Vec<String> = cpu_hardware_parameters
                .iter()
                .map(|c| c.name.clone())
                .collect();
            (cpu_names.first().cloned(), cpu_names)
        } else {
            (None, vec![])
        };

    let mut gpu_hash_rate = None;
    let mut gpu_hash_rate_c29 = None;

    if gpu_status.algorithm.eq(&GpuMiningAlgorithm::SHA3X) {
        gpu_hash_rate = Some(gpu_status.hash_rate);
    } else {
        gpu_hash_rate_c29 = Some(gpu_status.hash_rate);
    }

    let is_hashrate_some = gpu_hash_rate.is_some() || gpu_hash_rate_c29.is_some();

    let gpu_utilization = if let Some(gpu_hardware_parameters) = gpu_hardware_parameters.clone() {
        let filtered_gpus = gpu_hardware_parameters
            .iter()
            .filter(|c| c.parameters.is_some())
            .collect::<Vec<_>>();
        Some(
            filtered_gpus
                .iter()
                .map(|c| c.parameters.clone().unwrap_or_default().usage_percentage)
                .sum::<f32>()
                .div(filtered_gpus.len() as f32),
        )
    } else {
        None
    };

    let (gpu_make, all_gpus) =
        if let Some(gpu_hardware_parameters) = gpu_hardware_parameters.clone() {
            let gpu_names: Vec<String> = gpu_hardware_parameters
                .iter()
                .map(|c| c.name.clone())
                .collect();
            (gpu_names.first().cloned(), gpu_names)
        } else {
            (None, vec![])
        }; //TODO refactor - now is JUST WIP to meet the String type

    let mining_config = ConfigMining::content().await;
    let version = env!("CARGO_PKG_VERSION").to_string();
    let gpu_mining_used =
        *mining_config.gpu_mining_enabled() && gpu_make.is_some() && is_hashrate_some;
    let cpu_resource_used =
        *mining_config.cpu_mining_enabled() && cpu_make.is_some() && cpu_hash_rate.is_some();
    let resource_used = match (gpu_mining_used, cpu_resource_used) {
        (true, true) => TelemetryResource::CpuGpu,
        (true, false) => TelemetryResource::Gpu,
        (false, true) => TelemetryResource::Cpu,
        (false, false) => TelemetryResource::None,
    };

    let mut extra_data = HashMap::new();
    let is_orphan = node_manager.is_on_orphan_chain();
    extra_data.insert("is_orphan".to_string(), is_orphan.to_string());
    extra_data.insert(
        "config_cpu_enabled".to_string(),
        mining_config.cpu_mining_enabled().to_string(),
    );
    extra_data.insert(
        "config_gpu_enabled".to_string(),
        mining_config.gpu_mining_enabled().to_string(),
    );
    extra_data.insert(
        "config_tor_enabled".to_string(),
        config.use_tor().to_string(),
    );

    // Add payment ID from current tari address
    if InternalWallet::is_initialized() {
        if let Some(_state) = app_handle.try_state::<crate::UniverseAppState>() {
            let tari_address = InternalWallet::tari_address().await;
            if let Ok(Some(payment_id)) = extract_payment_id(&tari_address.to_base58()) {
                extra_data.insert("mining_address_payment_id".to_string(), payment_id);
            }
            // Note: If no payment ID, we don't add the field (saves space vs empty string)
        }
    }

    extra_data.insert(
        "tor_bootstrap_phase".to_string(),
        tor_status.bootstrap_phase.to_string(),
    );
    extra_data.insert(
        "tor_is_bootstrapped".to_string(),
        tor_status.is_bootstrapped.to_string(),
    );
    extra_data.insert(
        "tor_network_liveness".to_string(),
        tor_status.network_liveness.to_string(),
    );
    extra_data.insert(
        "tor_circuit_ok".to_string(),
        tor_status.circuit_ok.to_string(),
    );

    if !all_cpus.is_empty() {
        extra_data.insert("all_cpus".to_string(), all_cpus.join(","));
    }
    if !all_gpus.is_empty() {
        extra_data.insert("all_gpus".to_string(), all_gpus.join(","));
    }

    let mut system = System::new_all();
    std::thread::sleep(sysinfo::MINIMUM_CPU_UPDATE_INTERVAL);
    // Refresh CPUs again.
    system.refresh_cpu_usage();
    extra_data.insert(
        "cpu_usage".to_string(),
        system.global_cpu_usage().to_string(),
    );
    system.refresh_memory();
    extra_data.insert(
        "total_memory_gb".to_string(),
        system
            .total_memory()
            .saturating_div(1_000_000_000)
            .to_string(),
    );
    let memory_utilization = (system.used_memory() as f64 / system.total_memory() as f64) * 100.0;
    extra_data.insert(
        "memory_utilization".to_string(),
        memory_utilization.round().to_string(),
    );
    extra_data.insert(
        "free_memory_gb".to_string(),
        system
            .free_memory()
            .saturating_div(1_000_000_000)
            .to_string(),
    );
    if let Some(core_count) = system.physical_core_count() {
        extra_data.insert("physical_core_count".to_string(), core_count.to_string());
    }
    if let Some(arch) = System::cpu_arch() {
        extra_data.insert("cpu_arch".to_string(), arch);
    }
    extra_data.insert(
        "uptime".to_string(),
        started.elapsed().as_secs().to_string(),
    );
    extra_data.insert("node_is_synced".to_string(), is_synced.to_string());
    extra_data.insert(
        "node_num_connections".to_string(),
        num_connections.to_string(),
    );
    extra_data.insert("current_os".to_string(), std::env::consts::OS.to_string());
    extra_data.insert("ab_test".to_string(), config.ab_group().to_string());

    add_process_stats(
        &mut extra_data,
        stats_collector.get_cpu_miner_stats(),
        "cpu_miner",
    );
    add_process_stats(
        &mut extra_data,
        stats_collector.get_gpu_miner_stats(),
        "gpu_miner",
    );
    add_process_stats(
        &mut extra_data,
        stats_collector.get_minotari_node_stats(),
        "node",
    );
    add_process_stats(
        &mut extra_data,
        stats_collector.get_mm_proxy_stats(),
        "mmproxy",
    );
    add_process_stats(&mut extra_data, stats_collector.get_tor_stats(), "tor");

    add_process_stats(
        &mut extra_data,
        stats_collector.get_wallet_stats(),
        "wallet",
    );

    let (download_speed, upload_speed, latency) = *NetworkStatus::current()
        .get_network_speeds_receiver()
        .borrow();

    extra_data.insert(
        "download_speed".to_string(),
        download_speed.round().to_string(),
    );
    extra_data.insert("upload_speed".to_string(), upload_speed.round().to_string());
    extra_data.insert("network_latency".to_string(), latency.round().to_string());
    extra_data.insert("exchange_id".to_string(), exchange_id.to_string());

    let disks = Disks::new_with_refreshed_list();
    for (i, disk) in disks.list().iter().enumerate() {
        extra_data.insert(
            format!("disk_{i}_total_gb"),
            disk.total_space().saturating_div(1_000_000_000).to_string(),
        );
        extra_data.insert(
            format!("disk_{i}_free_gb"),
            disk.available_space()
                .saturating_div(1_000_000_000)
                .to_string(),
        );
        extra_data.insert(
            format!("disk_{i}_used_gb"),
            (disk.total_space().saturating_sub(disk.available_space()))
                .saturating_div(1_000_000_000)
                .to_string(),
        );
        extra_data.insert(
            format!("disk_{i}_kind"),
            match disk.kind() {
                sysinfo::DiskKind::HDD => "HDD".to_string(),
                sysinfo::DiskKind::SSD => "SSD".to_string(),
                sysinfo::DiskKind::Unknown(_) => "Unknown".to_string(),
            },
        );
    }

    let tari_address = InternalWallet::tari_address().await.to_base58();

    let data = TelemetryData {
        app_id: config.anon_id().to_string(),
        block_height,
        is_mining_active,
        network: network.map(|n| n.into()),
        mode: mining_config
            .selected_mining_mode()
            .to_string()
            .to_lowercase(),
        cpu_hash_rate,
        cpu_utilization,
        cpu_make,
        gpu_make,
        gpu_hash_rate_c29,
        gpu_hash_rate,
        gpu_utilization,
        resource_used,
        version,
        extra_data,
        current_os: std::env::consts::OS.to_string(),
        download_speed,
        upload_speed,
        latency,
        wallet_view_key_hashed,
        exchange_id,
        tari_address,
    };

    Ok(data)
}

fn add_process_stats(
    extra_data: &mut HashMap<String, String>,
    process_stats: crate::process_watcher::ProcessWatcherStats,
    process: &str,
) {
    extra_data.insert(
        format!("{process}_uptime_seconds"),
        process_stats.current_uptime.as_secs().to_string(),
    );
    extra_data.insert(
        format!("{process}_total_health_checks"),
        process_stats.total_health_checks.to_string(),
    );
    extra_data.insert(
        format!("{process}_num_warnings"),
        process_stats.num_warnings.to_string(),
    );
    extra_data.insert(
        format!("{process}_num_failure"),
        process_stats.num_failures.to_string(),
    );
    extra_data.insert(
        format!("{process}_num_restarts"),
        process_stats.num_restarts.to_string(),
    );
    extra_data.insert(
        format!("{process}_max_health_check_seconds"),
        process_stats
            .max_health_check_duration
            .as_secs()
            .to_string(),
    );
    extra_data.insert(
        format!("{process}_total_health_check_seconds"),
        process_stats
            .total_health_check_duration
            .as_secs()
            .to_string(),
    );
}

async fn handle_data(
    data: Result<TelemetryData, TelemetryManagerError>,
    airdrop_api_url: String,
    airdrop_access_token: Option<String>,
    app_handle: tauri::AppHandle,
    shutdown_signal: &mut ShutdownSignal,
    allow_telemetry: bool,
    allow_notifications: bool,
) {
    match data {
        Ok(telemetry) => {
            if allow_telemetry {
                let telemetry_response = tokio::select! {
                    response = retry_with_backoff(
                        || {
                            Box::pin(send_telemetry_data(
                                telemetry.clone(),
                                airdrop_access_token.clone(),
                                airdrop_api_url.clone(),
                            ))
                        },
                        3,
                        2,
                        "send_telemetry_data",
                    ) => response,
                    _ = shutdown_signal.wait() => {
                        info!(target: LOG_TARGET, "Telemetry data sending cancelled by shutdown signal");
                        return;
                    }
                };

                match telemetry_response {
                    Ok(response) => {
                        if let Some(response_inner) = response {
                            if let Some(user_points) = response_inner.user_points {
                                debug!(target: LOG_TARGET,"emitting UserPoints event{user_points:?}");
                                let response_inner =
                                    response_inner.referral_count.unwrap_or(ReferralCount {
                                        gems: 0.0,
                                        count: 0,
                                    });
                                let emit_data = TelemetryDataResponseEvent {
                                    base: user_points,
                                    referral_count: response_inner,
                                };

                                app_handle
                                    .emit("UserPoints", emit_data)
                                    .map_err(|e| {
                                        error!("could not send user points as an event: {e}")
                                    })
                                    .unwrap_or(());
                            }
                        }
                    }
                    Err(e) => {
                        error!(target: LOG_TARGET,"Error sending telemetry data: {e}");
                    }
                }
            }

            if allow_notifications {
                let notification_data_response = tokio::select! {
                    response = send_notification_data(telemetry.into(), airdrop_access_token, airdrop_api_url)
                        =>response,
                    _ = shutdown_signal.wait() => {
                        debug!(target: LOG_TARGET, "mining status notification data sending cancelled by shutdown signal");
                        return;
                    }
                };
                match notification_data_response {
                    Ok(_) => {
                        debug!(target: LOG_TARGET,"successfully sent emitting mining status notification event");
                    }
                    Err(e) => {
                        warn!(target: LOG_TARGET,"emitting mining status notification data sending error {:?}", e.to_string());
                    }
                }
            }
        }

        Err(TelemetryManagerError::Cancelled) => {
            debug!(target: LOG_TARGET, "Telemetry manager shutdown – no data sent");
        }
        Err(e) => {
            error!(target: LOG_TARGET,"Error getting telemetry data: {e}");
        }
    }
}

async fn send_telemetry_data(
    data: TelemetryData,
    airdrop_access_token: Option<String>,
    airdrop_api_url: String,
) -> Result<Option<TelemetryDataResponse>, TelemetryManagerError> {
    let request = reqwest::Client::new();
    let mut request_builder = request
        .post(format!("{airdrop_api_url}/miner/heartbeat"))
        .header(
            "User-Agent".to_string(),
            format!("tari-universe/{}", data.version.clone()),
        )
        .json(&data);

    if let Some(token) = airdrop_access_token.clone() {
        request_builder = request_builder.header("Authorization", format!("Bearer {token}"));
    }

    let response = request_builder.send().await?;

    if response.status() == 429 {
        warn!(target: LOG_TARGET,"Telemetry data rate limited by http {:?}", response.status());
        return Ok(None);
    }

    if response.status() != 200 {
        let status = response.status();
        let response = response.text().await?;
        let response_as_json: Result<Value, serde_json::Error> = serde_json::from_str(&response);
        return Err(anyhow::anyhow!(
            "Telemetry data sending error. Status {:?} response text: {:?}",
            status.to_string(),
            response_as_json.unwrap_or(response.into()),
        )
        .into());
    }

    debug!(target: LOG_TARGET,"Telemetry data sent");

    if airdrop_access_token.is_some() {
        let data: TelemetryDataResponse = response.json().await?;
        return Ok(Some(data));
    }
    Ok(None)
}

async fn send_notification_data(
    data: NotificationData,
    airdrop_access_token: Option<String>,
    airdrop_api_url: String,
) -> Result<(), TelemetryManagerError> {
    let request = reqwest::Client::new();

    let mut request_builder = request
        .post(format!("{airdrop_api_url}/miner/notifications"))
        .timeout(Duration::from_secs(5))
        .header(
            "User-Agent".to_string(),
            format!("tari-universe/{}", data.version.clone()),
        )
        .json(&data);

    if let Some(token) = airdrop_access_token.clone() {
        request_builder = request_builder.header("Authorization", format!("Bearer {token}"));
    }

    let response = request_builder.send().await?;

    if response.status() == 429 {
        warn!(target: LOG_TARGET,"notification data rate limited by http {:?}", response.status());
        return Ok(());
    }

    if response.status() != 200 {
        let status = response.status();
        let response = response.text().await?;
        let response_as_json: Result<Value, serde_json::Error> = serde_json::from_str(&response);
        return Err(anyhow::anyhow!(
            "notification data sending error. Status {:?} response text: {:?}",
            status.to_string(),
            response_as_json.unwrap_or(response.into()),
        )
        .into());
    }

    Ok(())
}
