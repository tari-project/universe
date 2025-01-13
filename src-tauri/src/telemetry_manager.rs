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

use crate::app_in_memory_config::AppInMemoryConfig;
use crate::gpu_miner_adapter::GpuMinerStatus;
use crate::hardware::hardware_status_monitor::HardwareStatusMonitor;
use crate::node_adapter::BaseNodeStatus;
use crate::p2pool::models::P2poolStats;
use crate::{
    app_config::{AppConfig, MiningMode},
    cpu_miner::CpuMiner,
};
use anyhow::Result;
use base64::prelude::*;
use blake2::digest::Update;
use blake2::digest::VariableOutput;
use blake2::Blake2bVar;
use jsonwebtoken::errors::Error as JwtError;
use jsonwebtoken::{decode, Algorithm, DecodingKey, Validation};
use log::{debug, error, info, warn};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use sha2::Digest;
use std::collections::HashMap;
use std::future::Future;
use std::ops::Div;
use std::pin::Pin;
use std::{sync::Arc, thread::sleep, time::Duration};
use tari_common::configuration::Network;
use tari_utilities::encoding::MBase58;
use tauri::Emitter;
use tokio::sync::{watch, RwLock};
use tokio_util::sync::CancellationToken;

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

#[derive(Debug, Deserialize, Serialize)]
struct AirdropAccessToken {
    exp: u64,
    iat: i32,
    id: String,
    provider: String,
    role: String,
    scope: String,
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
#[serde(rename_all = "lowercase")]
pub enum TelemetryMiningMode {
    Eco,
    Ludicrous,
    Custom,
}

impl From<MiningMode> for TelemetryMiningMode {
    fn from(value: MiningMode) -> Self {
        match value {
            MiningMode::Eco => TelemetryMiningMode::Eco,
            MiningMode::Ludicrous => TelemetryMiningMode::Ludicrous,
            MiningMode::Custom => TelemetryMiningMode::Custom,
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
    pub gpu_utilization: Option<f32>,
    pub gpu_make: Option<String>,
    pub mode: TelemetryMiningMode,
    pub version: String,
    pub p2pool_enabled: bool,
    pub cpu_tribe_name: Option<String>,
    pub cpu_tribe_id: Option<String>,
    pub gpu_tribe_name: Option<String>,
    pub gpu_tribe_id: Option<String>,
    pub extra_data: HashMap<String, String>,
    pub current_os: String,
}

pub struct TelemetryManager {
    cpu_miner: Arc<RwLock<CpuMiner>>,
    config: Arc<RwLock<AppConfig>>,
    in_memory_config: Arc<RwLock<AppInMemoryConfig>>,
    pub cancellation_token: CancellationToken,
    node_network: Option<Network>,
    airdrop_access_token: Arc<RwLock<Option<String>>>,
    gpu_status: watch::Receiver<GpuMinerStatus>,
    node_status: watch::Receiver<BaseNodeStatus>,
    p2pool_status: watch::Receiver<Option<P2poolStats>>,
}

impl TelemetryManager {
    pub fn new(
        cpu_miner: Arc<RwLock<CpuMiner>>,
        config: Arc<RwLock<AppConfig>>,
        in_memory_config: Arc<RwLock<AppInMemoryConfig>>,
        network: Option<Network>,
        gpu_status: watch::Receiver<GpuMinerStatus>,
        node_status: watch::Receiver<BaseNodeStatus>,
        p2pool_status: watch::Receiver<Option<P2poolStats>>,
    ) -> Self {
        let cancellation_token = CancellationToken::new();
        Self {
            cpu_miner,
            config,
            cancellation_token,
            node_network: network,
            in_memory_config,
            airdrop_access_token: Arc::new(RwLock::new(None)),
            gpu_status,
            node_status,
            p2pool_status,
        }
    }

    pub async fn get_unique_string(&self) -> String {
        // TODO: remove before mainnet
        let config = self.config.read().await;
        if !config.allow_telemetry() {
            return "".to_string();
        }
        // let os = std::env::consts::OS;
        let anon_id = config.anon_id();
        let mut hasher = Blake2bVar::new(20).expect("Failed to create hasher");
        hasher.update(anon_id.as_bytes());
        let mut buf = [0u8; 20];
        hasher
            .finalize_variable(&mut buf)
            .expect("Failed to finalize hasher variable");
        let version = env!("CARGO_PKG_VERSION");
        // let mode = MiningMode::to_str(config.mode());

        let token_guard = self.airdrop_access_token.read().await;
        let id: Option<String> = token_guard.clone().and_then(|jwt| {
            let claims = decode_jwt_claims(&jwt);
            claims.map(|claim| claim.id)
        });
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

    pub async fn initialize(
        &mut self,
        airdrop_access_token: Arc<RwLock<Option<String>>>,
        window: tauri::Window,
    ) -> Result<()> {
        info!(target: LOG_TARGET, "Starting telemetry manager");
        self.airdrop_access_token = airdrop_access_token.clone();
        self.start_telemetry_process(TelemetryFrequency::default().into(), window)
            .await?;
        Ok(())
    }

    async fn start_telemetry_process(
        &mut self,
        timeout: Duration,
        window: tauri::Window,
    ) -> Result<(), TelemetryManagerError> {
        let cpu_miner = self.cpu_miner.clone();
        let gpu_status = self.gpu_status.clone();
        let node_status = self.node_status.clone();
        let p2pool_status = self.p2pool_status.clone();
        let config = self.config.clone();
        let cancellation_token: CancellationToken = self.cancellation_token.clone();
        let network = self.node_network;
        let config_cloned = self.config.clone();
        let in_memory_config_cloned = self.in_memory_config.clone();
        let airdrop_access_token = self.airdrop_access_token.clone();
        tokio::spawn(async move {
            tokio::select! {
                _ = async {
                    debug!(target: LOG_TARGET, "TelemetryManager::start_telemetry_process has  been started");
                    loop {
                        let telemetry_collection_enabled = config_cloned.read().await.allow_telemetry();
                        if telemetry_collection_enabled {
                            let airdrop_access_token_validated = validate_jwt(airdrop_access_token.clone()).await;
                            let telemetry_data = get_telemetry_data(&cpu_miner, &gpu_status, &node_status, &p2pool_status, &config, network).await;
                            let airdrop_api_url = in_memory_config_cloned.read().await.airdrop_api_url.clone();
                            handle_telemetry_data(telemetry_data, airdrop_api_url, airdrop_access_token_validated, window.clone()).await;
                        }
                        sleep(timeout);
                    }
                } => {},
                _ = cancellation_token.cancelled() => {
                    debug!(target: LOG_TARGET,"TelemetryManager::start_telemetry_process has been cancelled");
                }
            }
        });
        Ok(())
    }
}

async fn validate_jwt(airdrop_access_token: Arc<RwLock<Option<String>>>) -> Option<String> {
    let airdrop_access_token_internal = airdrop_access_token.read().await.clone();
    airdrop_access_token_internal.clone().and_then(|t| {
        let claims = decode_jwt_claims(&t);

        let now = std::time::SystemTime::now();
        let now_unix = now
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs();

        if let Some(claims) = claims {
            if claims.exp < now_unix {
                warn!(target: LOG_TARGET,"Access token has expired");
                None
            } else {
                Some(t)
            }
        } else {
            None
        }
    })
}

fn decode_jwt_claims(t: &str) -> Option<AirdropAccessToken> {
    let key = DecodingKey::from_secret(&[]);
    let mut validation = Validation::new(Algorithm::HS256);
    validation.insecure_disable_signature_validation();

    match decode::<AirdropAccessToken>(t, &key, &validation) {
        Ok(data) => Some(data.claims),
        Err(e) => {
            warn!(target: LOG_TARGET,"Error decoding access token: {:?}", e);
            None
        }
    }
}

#[allow(clippy::too_many_lines)]
async fn get_telemetry_data(
    cpu_miner: &RwLock<CpuMiner>,
    gpu_latest_miner_stats: &watch::Receiver<GpuMinerStatus>,
    node_latest_status: &watch::Receiver<BaseNodeStatus>,
    p2pool_latest_status: &watch::Receiver<Option<P2poolStats>>,
    config: &RwLock<AppConfig>,
    network: Option<Network>,
) -> Result<TelemetryData, TelemetryManagerError> {
    let BaseNodeStatus {
        randomx_network_hashrate,
        block_reward,
        block_height,
        is_synced,
        ..
    } = node_latest_status.borrow().clone();

    let cpu_miner = cpu_miner.read().await;
    let cpu = match cpu_miner
        .status(randomx_network_hashrate, block_reward)
        .await
    {
        Ok(cpu) => cpu,
        Err(e) => {
            warn!(target: LOG_TARGET, "Error getting cpu miner status: {:?}", e);
            return Err(TelemetryManagerError::Other(e));
        }
    };
    let gpu_status = gpu_latest_miner_stats.borrow().clone();

    let gpu_hardware_parameters = HardwareStatusMonitor::current()
        .get_gpu_public_properties()
        .await
        .ok();
    let cpu_hardware_parameters = HardwareStatusMonitor::current()
        .get_cpu_public_properties()
        .await
        .ok();

    let p2pool_stats = p2pool_latest_status.borrow().clone();

    let config_guard = config.read().await;
    let is_mining_active = is_synced && (cpu.hash_rate > 0.0 || gpu_status.hash_rate > 0);
    let cpu_hash_rate = Some(cpu.hash_rate);

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

    let gpu_hash_rate = Some(gpu_status.hash_rate as f64);

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
    let version = env!("CARGO_PKG_VERSION").to_string();
    let gpu_mining_used =
        config_guard.gpu_mining_enabled() && gpu_make.is_some() && gpu_hash_rate.is_some();
    let cpu_resource_used =
        config_guard.cpu_mining_enabled() && cpu_make.is_some() && cpu_hash_rate.is_some();
    let resource_used = match (gpu_mining_used, cpu_resource_used) {
        (true, true) => TelemetryResource::CpuGpu,
        (true, false) => TelemetryResource::Gpu,
        (false, true) => TelemetryResource::Cpu,
        (false, false) => TelemetryResource::None,
    };

    // let p2pool_gpu_stats_sha3 = p2pool_stats.as_ref().map(|s| s.sha3x_stats.clone());
    // let p2pool_cpu_stats_randomx = p2pool_stats.as_ref().map(|s| s.randomx_stats.clone());
    let p2pool_enabled = config_guard.p2pool_enabled() && p2pool_stats.is_some();
    // let (cpu_tribe_name, cpu_tribe_id) = if p2pool_enabled {
    //     if let Some(randomx_stats) = p2pool_cpu_stats_randomx {
    //         (
    //             Some(randomx_stats.squad.name.clone()),
    //             Some(randomx_stats.squad.id.clone()),
    //         )
    //     } else {
    //         (None, None)
    //     }
    // } else {
    //     (None, None)
    // };

    // let (gpu_tribe_name, gpu_tribe_id) = if p2pool_enabled {
    //     if let Some(sha3_stats) = p2pool_gpu_stats_sha3 {
    //         (
    //             Some(sha3_stats.squad.name.clone()),
    //             Some(sha3_stats.squad.id.clone()),
    //         )
    //     } else {
    //         (None, None)
    //     }
    // } else {
    //     (None, None)
    // };

    let mut extra_data = HashMap::new();
    extra_data.insert(
        "config_cpu_enabled".to_string(),
        config_guard.cpu_mining_enabled().to_string(),
    );
    extra_data.insert(
        "config_gpu_enabled".to_string(),
        config_guard.gpu_mining_enabled().to_string(),
    );
    extra_data.insert(
        "config_p2pool_enabled".to_string(),
        config_guard.p2pool_enabled().to_string(),
    );
    extra_data.insert(
        "config_tor_enabled".to_string(),
        config_guard.use_tor().to_string(),
    );
    let mut squad = None;
    if let Some(stats) = p2pool_stats.as_ref() {
        extra_data.insert(
            "p2pool_connected_peers".to_string(),
            stats.connection_info.connected_peers.to_string(),
        );
        extra_data.insert(
            "p2pool_rx_height".to_string(),
            stats.randomx_stats.height.to_string(),
        );
        extra_data.insert(
            "p2pool_sha3_height".to_string(),
            stats.sha3x_stats.height.to_string(),
        );
        extra_data.insert("p2pool_squad".to_string(), stats.squad.clone());
        squad = Some(stats.squad.clone());
    }

    if !all_cpus.is_empty() {
        extra_data.insert("all_cpus".to_string(), all_cpus.join(","));
    }
    if !all_gpus.is_empty() {
        extra_data.insert("all_gpus".to_string(), all_gpus.join(","));
    }

    Ok(TelemetryData {
        app_id: config_guard.anon_id().to_string(),
        block_height,
        is_mining_active,
        network: network.map(|n| n.into()),
        mode: config_guard.mode().into(),
        cpu_hash_rate,
        cpu_utilization,
        cpu_make,
        gpu_make,
        gpu_hash_rate,
        gpu_utilization,
        resource_used,
        version,
        p2pool_enabled,
        cpu_tribe_name: squad.clone(),
        cpu_tribe_id: None,
        gpu_tribe_name: squad.clone(),
        gpu_tribe_id: None,
        extra_data,
        current_os: std::env::consts::OS.to_string(),
    })
}

async fn handle_telemetry_data(
    telemetry: Result<TelemetryData, TelemetryManagerError>,
    airdrop_api_url: String,
    airdrop_access_token: Option<String>,
    window: tauri::Window,
) {
    match telemetry {
        Ok(telemetry) => {
            let telemetry_response = retry_with_backoff(
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
            )
            .await;

            match telemetry_response {
                Ok(response) => {
                    if let Some(response_inner) = response {
                        if let Some(user_points) = response_inner.user_points {
                            debug!(target: LOG_TARGET,"emitting UserPoints event{:?}", user_points);
                            let response_inner =
                                response_inner.referral_count.unwrap_or(ReferralCount {
                                    gems: 0.0,
                                    count: 0,
                                });
                            let emit_data = TelemetryDataResponseEvent {
                                base: user_points,
                                referral_count: response_inner,
                            };

                            window
                                .emit("UserPoints", emit_data)
                                .map_err(|e| {
                                    error!("could not send user points as an event: {:?}", e)
                                })
                                .unwrap_or(());
                        }
                    }
                }
                Err(e) => {
                    error!(target: LOG_TARGET,"Error sending telemetry data: {:?}", e);
                }
            }
        }
        Err(e) => {
            error!(target: LOG_TARGET,"Error getting telemetry data: {:?}", e);
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
        .post(format!("{}/miner/heartbeat", airdrop_api_url))
        .header(
            "User-Agent".to_string(),
            format!("tari-universe/{}", data.version.clone()),
        )
        .json(&data);

    if let Some(token) = airdrop_access_token.clone() {
        request_builder = request_builder.header("Authorization", format!("Bearer {}", token));
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

async fn retry_with_backoff<T, R, E>(
    mut f: T,
    increment_in_secs: u64,
    max_retries: u64,
    operation_name: &str,
) -> anyhow::Result<R>
where
    T: FnMut() -> Pin<Box<dyn Future<Output = Result<R, E>> + Send>>,
    E: std::error::Error,
{
    let range_size = increment_in_secs * max_retries + 1;

    for i in (0..range_size).step_by(usize::try_from(increment_in_secs)?) {
        tokio::time::sleep(Duration::from_secs(i)).await;

        let result = f().await;
        match result {
            Ok(res) => return Ok(res),
            Err(e) => {
                if i == range_size - 1 {
                    return Err(anyhow::anyhow!(
                        "Max retries reached, {} failed. Last error: {:?}",
                        operation_name,
                        e
                    ));
                } else {
                    warn!(target: LOG_TARGET, "Retrying {} due to failure: {:?}", operation_name, e);
                }
            }
        }
    }
    Err(anyhow::anyhow!(
        "Max retries reached, {} failed without capturing error",
        operation_name
    ))
}
