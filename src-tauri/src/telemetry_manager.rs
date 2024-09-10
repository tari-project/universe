use anyhow::Result;
use jsonwebtoken::errors::Error as JwtError;
use jsonwebtoken::{decode, Algorithm, DecodingKey, Validation};
use log::{error, info, warn};
use serde::{Deserialize, Serialize};
use std::{sync::Arc, thread::sleep, time::Duration};
use tari_common::configuration::Network;
use tari_core::transactions::tari_amount::MicroMinotari;
use tauri::Manager;
use tokio::sync::RwLock;
use tokio_util::sync::CancellationToken;

use crate::app_in_memory_config::AppInMemoryConfig;
use crate::{
    app_config::{AppConfig, MiningMode},
    cpu_miner::CpuMiner,
    gpu_miner::GpuMiner,
    hardware_monitor::HardwareMonitor,
    node_manager::NodeManager,
};

const LOG_TARGET: &str = "tari::universe::telemetry_manager";

#[derive(Debug, Deserialize, Serialize)]
struct AirdropAccessToken {
    exp: u64,
    iat: i32,
    id: String,
    provider: String,
    role: String,
    scope: String,
}

#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum TelemetryResource {
    Cpu,
    Gpu,
    #[serde(rename(serialize = "cpu-gpu"))]
    CpuGpu,
}

#[derive(Debug, Deserialize, Serialize)]
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

#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum TelemetryMiningMode {
    Eco,
    Ludicrous,
}

impl From<MiningMode> for TelemetryMiningMode {
    fn from(value: MiningMode) -> Self {
        match value {
            MiningMode::Eco => TelemetryMiningMode::Eco,
            MiningMode::Ludicrous => TelemetryMiningMode::Ludicrous,
        }
    }
}

#[derive(Debug, Deserialize, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
struct UserPoints {
    pub gems: f64,
    pub shells: f64,
    pub hammers: f64,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
struct TelemetryDataResponse {
    pub success: bool,
    pub user_points: Option<UserPoints>,
}

#[derive(Debug, Deserialize, Serialize)]
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
}

pub struct TelemetryManager {
    node_manager: NodeManager,
    cpu_miner: Arc<RwLock<CpuMiner>>,
    gpu_miner: Arc<RwLock<GpuMiner>>,
    config: Arc<RwLock<AppConfig>>,
    in_memory_config: Arc<RwLock<AppInMemoryConfig>>,
    pub cancellation_token: CancellationToken,
    node_network: Option<Network>,
}

impl TelemetryManager {
    pub fn new(
        node_manager: NodeManager,
        cpu_miner: Arc<RwLock<CpuMiner>>,
        gpu_miner: Arc<RwLock<GpuMiner>>,
        config: Arc<RwLock<AppConfig>>,
        in_memory_config: Arc<RwLock<AppInMemoryConfig>>,
        network: Option<Network>,
    ) -> Self {
        let cancellation_token = CancellationToken::new();
        Self {
            node_manager,
            cpu_miner,
            gpu_miner,
            config,
            cancellation_token,
            node_network: network,
            in_memory_config,
        }
    }

    pub async fn get_unique_string(&self) -> String {
        let config = self.config.read().await;
        if !config.allow_telemetry {
            return "".to_string();
        }
        let os = std::env::consts::OS;
        let anon_id = config.anon_id.clone();
        let version = env!("CARGO_PKG_VERSION");
        let mode = MiningMode::to_str(config.mode);
        let auto_mining = config.auto_mining;
        let unique_string = format!("v0,{},{},{},{},{}", anon_id, mode, auto_mining, os, version,);
        unique_string
    }

    pub fn update_network(&mut self, network: Option<Network>) {
        self.node_network = network;
    }

    pub async fn initialize(
        &mut self,
        app: tauri::AppHandle,
        airdrop_access_token: Arc<RwLock<Option<String>>>,
    ) -> Result<()> {
        info!(target: LOG_TARGET, "Starting telemetry manager");
        self.start_telemetry_process(app, Duration::from_secs(60), airdrop_access_token)
            .await?;
        Ok(())
    }

    async fn start_telemetry_process(
        &mut self,
        app: tauri::AppHandle,
        timeout: Duration,
        airdrop_access_token: Arc<RwLock<Option<String>>>,
    ) -> Result<(), TelemetryManagerError> {
        let node_manager = self.node_manager.clone();
        let cpu_miner = self.cpu_miner.clone();
        let gpu_miner = self.gpu_miner.clone();
        let config = self.config.clone();
        let cancellation_token: CancellationToken = self.cancellation_token.clone();
        let network = self.node_network;
        let config_cloned = self.config.clone();
        let app_cloned = app.clone();
        let in_memory_config_cloned = self.in_memory_config.clone();
        tokio::spawn(async move {
            tokio::select! {
                _ = async {
                    info!(target: LOG_TARGET, "TelemetryManager::start_telemetry_process has  been started");
                    loop {
                        let telemetry_collection_enabled = config_cloned.read().await.allow_telemetry;
                        if telemetry_collection_enabled {
                            let airdrop_access_token_validated = validate_jwt(airdrop_access_token.clone()).await;
                            let telemetry = get_telemetry_data(cpu_miner.clone(), gpu_miner.clone(), node_manager.clone(), config.clone(), network).await;
                            match telemetry {
                                Ok(telemetry) => {
                                    let airdrop_api_url = in_memory_config_cloned.read().await.airdrop_api_url.clone();
                                    let telemetry_response = send_telemetry_data(telemetry, airdrop_access_token_validated, airdrop_api_url).await;
                                    match telemetry_response {
                                        Ok(response) => {
                                            if let Some(response_inner) = response {
                                                if response_inner.user_points.is_some() {
                                                    info!(target: LOG_TARGET,"emitting UserPoints event{:?}",response_inner);
                                                    app_cloned.emit_all("UserPoints", response_inner.user_points.unwrap())
                                                    .map_err(|e| error!("could not send user points as an event: {:?}", e))
                                                    .unwrap_or(());
                                                }
                                            }
                                        },
                                        Err(e) => {
                                            error!(target: LOG_TARGET,"Error sending telemetry data: {:?}", e);
                                        }
                                    }
                                },
                                Err(e) => {
                                    error!(target: LOG_TARGET,"Error getting telemetry data: {:?}", e);
                                }
                            }
                        }
                        sleep(timeout);
                    }
                } => {},
                _ = cancellation_token.cancelled() => {
                    info!(target: LOG_TARGET,"TelemetryManager::start_telemetry_process has been cancelled");
                }
            }
        });
        Ok(())
    }
}

async fn validate_jwt(airdrop_access_token: Arc<RwLock<Option<String>>>) -> Option<String> {
    let airdrop_access_token_internal = airdrop_access_token.read().await.clone();
    airdrop_access_token_internal.clone().and_then(|t| {
        let key = DecodingKey::from_secret(&[]);
        let mut validation = Validation::new(Algorithm::HS256);
        validation.insecure_disable_signature_validation();

        let claims = match decode::<AirdropAccessToken>(&t, &key, &validation) {
            Ok(data) => Some(data.claims),
            Err(e) => {
                warn!(target: LOG_TARGET,"Error decoding access token: {:?}", e);
                None
            }
        };

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

async fn get_telemetry_data(
    cpu_miner: Arc<RwLock<CpuMiner>>,
    gpu_miner: Arc<RwLock<GpuMiner>>,
    node_manager: NodeManager,
    config: Arc<RwLock<AppConfig>>,
    network: Option<Network>,
) -> Result<TelemetryData, TelemetryManagerError> {
    let (sha_hash_rate, randomx_hash_rate, block_reward, block_height, _block_time, is_synced) =
        node_manager
            .get_network_hash_rate_and_block_reward()
            .await
            .unwrap_or((0, 0, MicroMinotari(0), 0, 0, false));

    let mut cpu_miner = cpu_miner.write().await;
    let cpu = match cpu_miner.status(randomx_hash_rate, block_reward).await {
        Ok(cpu) => cpu,
        Err(e) => {
            warn!(target: LOG_TARGET, "Error getting cpu miner status: {:?}", e);
            return Err(TelemetryManagerError::Other(e));
        }
    };
    let mut gpu_miner_lock = gpu_miner.write().await;
    let gpu_status = match gpu_miner_lock.status(sha_hash_rate, block_reward).await {
        Ok(gpu) => gpu,
        Err(e) => {
            warn!(target: LOG_TARGET, "Error getting gpu miner status: {:?}", e);
            return Err(TelemetryManagerError::Other(e));
        }
    };

    let hardware_status = HardwareMonitor::current()
        .write()
        .await
        .read_hardware_parameters();

    let config_guard = config.read().await;
    let is_mining_active = is_synced && cpu.is_mining;
    let cpu_hash_rate = Some(cpu.hash_rate);
    let cpu_utilization = hardware_status.cpu.clone().map(|c| c.usage_percentage);
    let cpu_make = hardware_status.cpu.clone().map(|c| c.label);
    let gpu_hash_rate = Some(gpu_status.hash_rate as f64);
    let gpu_utilization = hardware_status.gpu.clone().map(|c| c.usage_percentage);
    let gpu_make = hardware_status.gpu.clone().map(|c| c.label);
    let version = env!("CARGO_PKG_VERSION").to_string();

    Ok(TelemetryData {
        app_id: config_guard.anon_id.clone(),
        block_height,
        is_mining_active,
        network: network.map(|n| n.into()),
        mode: config_guard.mode.into(),
        cpu_hash_rate,
        cpu_utilization,
        cpu_make,
        gpu_make,
        gpu_hash_rate,
        gpu_utilization,
        resource_used: TelemetryResource::Cpu,
        version,
    })
}

async fn send_telemetry_data(
    data: TelemetryData,
    airdrop_access_token: Option<String>,
    airdrop_api_url: String,
) -> Result<Option<TelemetryDataResponse>, TelemetryManagerError> {
    let request = reqwest::Client::new();
    let mut request_builder = request
        .post(format!("{}/miner/heartbeat", airdrop_api_url))
        .json(&data);

    if let Some(token) = airdrop_access_token.clone() {
        request_builder = request_builder.header("Authorization", format!("Bearer {}", token));
    }

    let result = request_builder.send().await?;
    let response = result.error_for_status()?;
    info!(target: LOG_TARGET,"Telemetry data sent");

    if airdrop_access_token.is_some() {
        let data: TelemetryDataResponse = response.json().await?;
        return Ok(Some(data));
    }
    Ok(None)
}
