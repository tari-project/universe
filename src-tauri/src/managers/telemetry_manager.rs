use anyhow::Result;
use log::{error, info, warn};
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
#[serde(rename_all_fields = "lowercase")]
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
    pub resoure_utilization: f32,
    pub resoure_make: Option<String>,
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

// impl Clone for TelemetryManager {
//     fn clone(&self) -> Self {
//         Self {
//             node_manager: self.node_manager.clone(),
//             cpu_miner: self.cpu_miner.clone(),
//             gpu_miner: self.gpu_miner.clone(),
//             wallet_manager: self.wallet_manager.clone(),
//             config: self.config.clone(),
//             cancelation_token: self.cancelation_token.clone(),
//             is_collecting_telemetry: self.is_collecting_telemetry,
//         }
//     }
// }

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
        let telemetry_collection_enabled = self.config.read().await.telemetry_collection;
        self.is_collecting_telemetry = telemetry_collection_enabled;
        let _ = self.start_telemetry_process(Duration::from_secs(60)).await;
        Ok(())
    }

    async fn start_telemetry_process(&mut self, timeout: Duration) -> Result<(), String> {
        let telemetry_collection_enabled = self.config.read().await.telemetry_collection;
        let node_manager = self.node_manager.clone();
        let cpu_miner = self.cpu_miner.clone();
        let gpu_miner = self.gpu_miner.clone();
        let config = self.config.clone();
        let cancellation_token: CancellationToken = self.cancellation_token.clone();
        let network = self.node_network.clone();
        tokio::spawn(async move {
            tokio::select! {
                _ = async {
                    info!("TelemetryManager::start_telemetry_process has  been started");
                    loop {
                        if telemetry_collection_enabled {
                            //do telemetry collection
                            let telemetry = get_telemetry_data(cpu_miner.clone(), gpu_miner.clone(), node_manager.clone(), config.clone(), network).await;
                            match telemetry {
                                Ok(telemetry) => {
                                    info!("Telemetry data: {:?}", telemetry);
                                },
                                Err(e) => {
                                    error!("Error getting telemetry data: {:?}", e);
                                }
                            }
                        }
                        sleep(timeout);
                    }
                    // Ok::<(),Box<dyn Error>>(())
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
) -> Result<TelemetryData, String> {
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
        .map_err(|e| e.to_string())
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
    let hash_rate = if cpu.is_mining { cpu.hash_rate } else { 0.0 };

    Ok(TelemetryData {
        app_id: "minotari".to_string(),
        block_height,
        is_mining_active,
        network: network.map(|n| n.into()),
        hash_rate,
        mode: config_guard.mode.clone().into(),
        resource: if cpu.is_mining {
            TelemetryResource::Cpu
        } else {
            TelemetryResource::Gpu
        },
        resoure_utilization: hardware_status.get_utilization().unwrap_or(0.0),
        resoure_make: hardware_status.get_label(),
    })
}
