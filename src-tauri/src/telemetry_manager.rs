use anyhow::Result;
use log::{debug, error, info, warn};
use serde::{Deserialize, Serialize};
use std::{sync::Arc, thread::sleep, time::Duration};
use tari_common::configuration::Network;
use tari_core::transactions::tari_amount::MicroMinotari;
use tokio::sync::RwLock;
use tokio_util::sync::CancellationToken;
use jsonwebtoken::{decode, Algorithm, DecodingKey, Validation, TokenData};
use jsonwebtoken::errors::Error as JwtError;

use crate::{
    app_config::{AppConfig, MiningMode},
    cpu_miner::CpuMiner,
    gpu_miner::GpuMiner,
    hardware_monitor::HardwareMonitor,
    node_manager::NodeManager,
    UniverseAppState,
    LOG_TARGET
};

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
pub enum TelemetryNetwork {
    #[serde(rename(serialize = "mainnet"))]
    Main,
    #[serde(rename(serialize = "stagenet"))]
    Stage,
    #[serde(rename(serialize = "nextnet"))]
    Next,
    #[serde(rename(serialize = "localnet"))]
    Local,
    #[serde(rename(serialize = "igor"))]
    Igor,
    #[serde(rename(serialize = "esmeralda"))]
    Esmeralda,
}

#[derive(Debug, thiserror::Error)]
pub enum TelemetryManagerError {
    #[error("telemetry data could not be sent because of an error: {0}")]
    ReqwestError(#[from] reqwest::Error),

    #[error("Other error: {0}")]
    Other(#[from] anyhow::Error),

    #[error("Jwt decodeing error: {0}")]
    JwtDecodeError(#[from] JwtError),
}

impl From<Network> for TelemetryNetwork {
    fn from(value: Network) -> Self {
        match value {
            Network::MainNet => TelemetryNetwork::Main,
            Network::StageNet => TelemetryNetwork::Stage,
            Network::NextNet => TelemetryNetwork::Next,
            Network::LocalNet => TelemetryNetwork::Local,
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
}

pub struct TelemetryManager {
    node_manager: NodeManager,
    cpu_miner: Arc<RwLock<CpuMiner>>,
    gpu_miner: Arc<RwLock<GpuMiner>>,
    config: Arc<RwLock<AppConfig>>,
    pub cancellation_token: CancellationToken,
    pub is_collecting_telemetry: bool,
    node_network: Option<Network>,
}

impl TelemetryManager {
    pub fn new(
        node_manager: NodeManager,
        cpu_miner: Arc<RwLock<CpuMiner>>,
        gpu_miner: Arc<RwLock<GpuMiner>>,
        config: Arc<RwLock<AppConfig>>,
        network: Option<Network>,
    ) -> Self {
        let cancellation_token = CancellationToken::new();
        Self {
            node_manager,
            cpu_miner,
            gpu_miner,
            config,
            cancellation_token,
            is_collecting_telemetry: false,
            node_network: network,
        }
    }

    pub fn update_network(&mut self, network: Option<Network>) {
        self.node_network = network;
    }

    pub async fn initialize(&mut self, app_state: tauri::State<'_, UniverseAppState>) -> Result<()> {
        info!("Starting telemetry manager");
        let telemetry_collection_enabled = self.config.read().await.telemetry_collection;
        self.is_collecting_telemetry = telemetry_collection_enabled;
        let _ = self.start_telemetry_process(Duration::from_secs(60), app_state).await;
        Ok(())
    }

    async fn start_telemetry_process(
        &mut self,
        timeout: Duration,
        app_state: tauri::State<'_, UniverseAppState>,
    ) -> Result<(), TelemetryManagerError> {
        let node_manager = self.node_manager.clone();
        let cpu_miner = self.cpu_miner.clone();
        let gpu_miner = self.gpu_miner.clone();
        let config = self.config.clone();
        let cancellation_token: CancellationToken = self.cancellation_token.clone();
        let network = self.node_network;
        let config_cloned = self.config.clone();
        let airdrop_access_token = app_state.airdrop_access_token.clone();
        
        tokio::spawn(async move {
            tokio::select! {
                _ = async {
                    info!("TelemetryManager::start_telemetry_process has  been started");
                    loop {
                        let telemetry_collection_enabled = config_cloned.read().await.telemetry_collection;

                        let airdrop_access_token_clone = airdrop_access_token.read().await.clone().and_then(|t| {
                            let key = DecodingKey::from_secret(&[]);
                            let mut validation = Validation::new(Algorithm::HS256);
                            validation.insecure_disable_signature_validation();

                            let claims = match decode::<AirdropAccessToken>(&t, &key, &validation) {
                                Ok(data) => Some(data.claims),
                                Err(e) => {
                                    error!("Error decoding access token: {:?}", e);
                                    None
                                }
                            };
                            
                            let now = std::time::SystemTime::now();
                            let now_unix = now.duration_since(std::time::UNIX_EPOCH).unwrap_or_default().as_secs();

                            if let Some(claims) = claims {
                                if claims.exp < now_unix {
                                    error!("Access token has expired");
                                    None
                                } else {
                                    Some(t)
                                }
                            } else {
                                None
                            }
                        });

                        if telemetry_collection_enabled {
                            let telemetry = get_telemetry_data(cpu_miner.clone(), gpu_miner.clone(), node_manager.clone(), config.clone(), network).await;
                            match telemetry {
                                Ok(telemetry) => {
                                    send_telemetry_data(telemetry, airdrop_access_token_clone).await;
                                },
                                Err(e) => {
                                    error!("Error getting telemetry data: {:?}", e);
                                }
                            }
                        }
                        sleep(timeout);
                    }
                } => {},
                _ = cancellation_token.cancelled() => {
                    info!("TelemetryManager::start_telemetry_process has been cancelled");
                }
            }
        });
        Ok(())
    }
}

async fn get_telemetry_data(
    cpu_miner: Arc<RwLock<CpuMiner>>,
    _gpu_miner: Arc<RwLock<GpuMiner>>,
    node_manager: NodeManager,
    config: Arc<RwLock<AppConfig>>,
    network: Option<Network>,
) -> Result<TelemetryData, TelemetryManagerError> {
    let mut cpu_miner = cpu_miner.write().await;
    let (_sha_hash_rate, randomx_hash_rate, block_reward, block_height, _block_time, is_synced) =
        node_manager
            .get_network_hash_rate_and_block_reward()
            .await
            .unwrap_or({
                //  warn!(target: LOG_TARGET, "Error getting network hash rate and block reward: {:?}", e);
                (0, 0, MicroMinotari(0), 0, 0, false)
            });
    let cpu = match cpu_miner
        .status(randomx_hash_rate, block_reward)
        .await
        .map_err(|e| e.into())
    {
        Ok(cpu) => cpu,
        Err(e) => {
            warn!(target: LOG_TARGET, "Error getting cpu miner status: {:?}", e);
            return Err(e);
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
    let gpu_hash_rate = None;
    let gpu_utilization = hardware_status.gpu.clone().map(|c| c.usage_percentage);
    let gpu_make = hardware_status.gpu.clone().map(|c| c.label);

    Ok(TelemetryData {
        app_id: config_guard.anon_id.clone(),
        block_height,
        is_mining_active,
        network: network.map(|n| n.into()),
        mode: config_guard.mode.clone().into(),
        cpu_hash_rate,
        cpu_utilization,
        cpu_make,
        gpu_make,
        gpu_hash_rate,
        gpu_utilization,
        resource_used: TelemetryResource::Cpu,
    })
}

fn get_airdrop_url() -> String {
    "http://localhost:3004".to_string()
}

async fn send_telemetry_data(data: TelemetryData, airdrop_access_token: Option<String>) {
    debug!("Telemetry data being sent: {:?}", data);

     let request = reqwest::Client::new();
     let mut request_builder = request
        .post(format!("{}/miner/heartbeat", get_airdrop_url()))
        .json(&data);

    if let Some(token) = airdrop_access_token {
        request_builder = request_builder.header("Authorization", format!("Bearer {}", token));
    }

    let result = request_builder.send().await.map_err(TelemetryManagerError::ReqwestError);

    match result {
        Ok(response) => {
            if response.status().is_success() {
                info!("Telemetry data sent");
            } else {
                warn!("Error sending telemetry data: {:#?}", response);
            }
        }
        Err(e) => {
            error!("Error sending telemetry data: {:#?}", e);
        }
    }
}
