use anyhow::Result;
use log::{debug, error, info, warn};
use serde::{Deserialize, Serialize};
use std::{sync::Arc, thread::sleep, time::Duration};
use tari_common::configuration::Network;
use tari_core::transactions::tari_amount::MicroMinotari;
use tokio::sync::RwLock;
use tokio_util::sync::CancellationToken;

use crate::{
    app_config::{AppConfig, MiningMode},
    cpu_miner::CpuMiner,
    gpu_miner::GpuMiner,
    hardware_monitor::HardwareMonitor,
    node_manager::NodeManager,
    LOG_TARGET,
};

#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum TelemetryResource {
    Cpu,
    Gpu,
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
    pub hash_rate: f64,
    pub resource: TelemetryResource,
    pub resource_utilization: Option<f32>,
    pub resource_make: Option<String>,
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

    pub async fn initialize(&mut self) -> Result<()> {
        info!("Starting telemetry manager");
        let telemetry_collection_enabled = self.config.read().await.telemetry_collection;
        self.is_collecting_telemetry = telemetry_collection_enabled;
        let _ = self.start_telemetry_process(Duration::from_secs(60)).await;
        Ok(())
    }

    async fn start_telemetry_process(
        &mut self,
        timeout: Duration,
    ) -> Result<(), TelemetryManagerError> {
        let telemetry_collection_enabled = self.config.read().await.telemetry_collection;
        let node_manager = self.node_manager.clone();
        let cpu_miner = self.cpu_miner.clone();
        let gpu_miner = self.gpu_miner.clone();
        let config = self.config.clone();
        let cancellation_token: CancellationToken = self.cancellation_token.clone();
        let network = self.node_network;
        tokio::spawn(async move {
            tokio::select! {
                _ = async {
                    info!("TelemetryManager::start_telemetry_process has  been started");
                    loop {
                        if telemetry_collection_enabled {
                            let telemetry = get_telemetry_data(cpu_miner.clone(), gpu_miner.clone(), node_manager.clone(), config.clone(), network).await;
                            match telemetry {
                                Ok(telemetry) => {
                                    send_telemetry_data(telemetry).await;
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
    let hash_rate = if cpu.is_mining && cpu.is_mining_enabled {
        cpu.hash_rate
    } else {
        0.0
    };

    Ok(TelemetryData {
        app_id: "minotari".to_string(),
        block_height,
        is_mining_active,
        network: network.map(|n| n.into()),
        hash_rate,
        mode: config_guard.mode.clone().into(),
        resource: TelemetryResource::Cpu,
        resource_utilization: hardware_status.get_utilization(),
        resource_make: hardware_status.get_label(),
    })
}

fn get_airdrop_url() -> String {
    "http://localhost:3004".to_string()
}

async fn send_telemetry_data(data: TelemetryData) {
    debug!("Telemetry data being sent: {:?}", data);

    let result = reqwest::Client::new()
        .post(format!("{}/miner/heartbeat", get_airdrop_url()))
        .json(&data)
        .send()
        .await
        .map_err(TelemetryManagerError::ReqwestError);

    match result {
        Ok(response) => {
            if response.status().is_success() {
                println!("Telemetry data sent successfully");
            } else {
                warn!("Error sending telemetry data: {:#?}", response);
            }
        }
        Err(e) => {
            error!("Error sending telemetry data: {:#?}", e);
        }
    }
}
