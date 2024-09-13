use crate::process_utils;
use anyhow::anyhow;
use anyhow::Error;
use async_trait::async_trait;
use log::{debug, warn};
use serde::{Deserialize, Serialize};
use std::{fs, path::PathBuf};
use tari_common::configuration::Network;
use tari_common_types::tari_address::TariAddress;
use tari_shutdown::Shutdown;
use tokio::select;

use crate::{
    app_config::MiningMode,
    binary_resolver::{Binaries, BinaryResolver},
    network_utils::get_free_port,
    process_adapter::{ProcessAdapter, ProcessInstance, StatusMonitor},
};

const LOG_TARGET: &str = "tari::universe::gpu_miner_adapter";

pub const ECO_MODE_GPU_PERCENTAGE: u16 = 1;
pub const LUDICROUS_MODE_GPU_PERCENTAGE: u16 = 800; // TODO: In future will allow user to configure this, but for now let's not burn the gpu too much

pub enum GpuNodeSource {
    BaseNode { port: u16 },
    P2Pool { port: u16 },
}

pub(crate) struct GpuMinerAdapter {
    pub(crate) tari_address: TariAddress,
    // Value ranges 1 - 1000
    pub(crate) gpu_percentage: u16,
    pub(crate) node_source: Option<GpuNodeSource>,
    pub(crate) coinbase_extra: String,
}

impl GpuMinerAdapter {
    pub fn new() -> Self {
        Self {
            tari_address: TariAddress::default(),
            gpu_percentage: ECO_MODE_GPU_PERCENTAGE,
            node_source: None,
            coinbase_extra: "tari-universe".to_string(),
        }
    }

    pub fn set_mode(&mut self, mode: MiningMode) {
        match mode {
            MiningMode::Eco => self.gpu_percentage = ECO_MODE_GPU_PERCENTAGE,
            MiningMode::Ludicrous => self.gpu_percentage = LUDICROUS_MODE_GPU_PERCENTAGE,
        }
    }
}

impl ProcessAdapter for GpuMinerAdapter {
    type StatusMonitor = GpuMinerStatusMonitor;

    fn spawn_inner(
        &self,
        data_dir: PathBuf,
        config_dir: PathBuf,
        _log_dir: PathBuf,
    ) -> Result<(ProcessInstance, Self::StatusMonitor), Error> {
        let inner_shutdown = Shutdown::new();
        let shutdown_signal = inner_shutdown.to_signal();

        let http_api_port = get_free_port().unwrap_or(18000);
        let working_dir = data_dir.join("gpuminer");
        std::fs::create_dir_all(&working_dir)?;
        std::fs::create_dir_all(config_dir.join("gpuminer"))?;

        if self.node_source.is_none() {
            return Err(anyhow!("GpuMinerAdapter node_source is not set"));
        }

        let tari_node_port = match self.node_source.as_ref().unwrap() {
            GpuNodeSource::BaseNode { port } => port,
            GpuNodeSource::P2Pool { port } => port,
        };

        let mut args: Vec<String> = vec![
            "--tari-address".to_string(),
            self.tari_address.to_string(),
            "--tari-node-url".to_string(),
            format!("http://127.0.0.1:{}", tari_node_port),
            "--config".to_string(),
            config_dir
                .join("gpuminer")
                .join("config.json")
                .to_string_lossy()
                .to_string(),
            "--http-server-port".to_string(),
            http_api_port.to_string(),
            "--gpu-percentage".to_string(),
            self.gpu_percentage.to_string(),
        ];

        // Only available after 0.1.8-pre.2
        args.push("--coinbase-extra".to_string());
        args.push(self.coinbase_extra.clone());

        if matches!(
            self.node_source.as_ref(),
            Some(GpuNodeSource::P2Pool { .. })
        ) {
            args.push("--p2pool-enabled".to_string());
        }

        Ok((
            ProcessInstance {
                shutdown: inner_shutdown,
                handle: Some(tokio::spawn(async move {
                    let file_path = BinaryResolver::current()
                        .resolve_path(Binaries::GpuMiner)
                        .await?;
                    crate::download_utils::set_permissions(&file_path).await?;
                    let mut child;

                    // if cfg!(debug_assertions) {
                    //     child = tokio::process::Command::new(file_path)
                    //         .args(args)
                    //         .env("TARI_NETWORK", "localnet")
                    //         // .stdout(std::process::Stdio::null())
                    //         // .stderr(std::process::Stdio::null())
                    //         .kill_on_drop(true)
                    //         .spawn()?;
                    // } else {
                    //     child = tokio::process::Command::new(file_path)
                    //         .args(args)
                    //         .env("TARI_NETWORK", "esme")
                    //         // .stdout(std::process::Stdio::null())
                    //         // .stderr(std::process::Stdio::null())
                    //         .kill_on_drop(true)
                    //         .spawn()?;
                    // }
                    let mut envs = std::collections::HashMap::new();
                    match Network::get_current_or_user_setting_or_default() {
                        Network::Esmeralda => {
                            envs.insert("TARI_NETWORK".to_string(), "esme".to_string());
                        }
                        Network::NextNet => {
                            envs.insert("TARI_NETWORK".to_string(), "nextnet".to_string());
                        }
                        _ => {
                            return Err(anyhow!("Unsupported network"));
                        }
                    }
                    // envs.insert("TARI_NETWORK".to_string(), "esme".to_string());
                    child = process_utils::launch_child_process(&file_path, Some(envs), &args)?;
                    if let Some(id) = child.id() {
                        fs::write(data_dir.join("xtrgpuminer_pid"), id.to_string())?;
                    }
                    let exit_code;

                    select! {
                        _res = shutdown_signal =>{
                            child.kill().await?;
                            exit_code = 0;
                            // res
                        },
                        res2 = child.wait() => {
                            match res2
                             {
                                Ok(res) => {
                                    exit_code = res.code().unwrap_or(0)
                                    },
                                Err(e) => {
                                    warn!(target: LOG_TARGET, "Error in XtrGpuInstance: {}", e);
                                    return Err(e.into());
                                }
                            }

                        },
                    };

                    match fs::remove_file(data_dir.join("xtrgpuminer_pid")) {
                        Ok(_) => {}
                        Err(_e) => {
                            debug!(target: LOG_TARGET, "Could not clear xtrgpuminer's pid file");
                        }
                    }
                    Ok(exit_code)
                })),
            },
            GpuMinerStatusMonitor { http_api_port },
        ))
    }

    fn name(&self) -> &str {
        "xtrgpuminer"
    }

    fn pid_file_name(&self) -> &str {
        "xtrgpuminer_pid"
    }
}

pub struct GpuMinerStatusMonitor {
    http_api_port: u16,
}

#[async_trait]
impl StatusMonitor for GpuMinerStatusMonitor {
    type Status = GpuMinerStatus;

    async fn status(&self) -> Result<Self::Status, anyhow::Error> {
        let client = reqwest::Client::new();
        let response = match client
            .get(format!("http://127.0.0.1:{}/stats", self.http_api_port))
            .send()
            .await
        {
            Ok(response) => response,
            Err(e) => {
                if e.is_connect() {
                    return Ok(GpuMinerStatus {
                        is_mining: false,
                        hash_rate: 0,
                        estimated_earnings: 0,
                    });
                }
                warn!(target: LOG_TARGET, "Error in getting response from XtrGpuMiner status: {}", e);
                return Ok(GpuMinerStatus {
                    is_mining: false,
                    hash_rate: 0,
                    estimated_earnings: 0,
                });
            }
        };
        let text = response.text().await?;
        let body: XtrGpuminerHttpApiStatus = match serde_json::from_str(&text) {
            Ok(body) => body,
            Err(e) => {
                warn!(target: LOG_TARGET, "Error decoding body from  in XtrGpuMiner status: {}", e);
                return Ok(GpuMinerStatus {
                    is_mining: false,
                    hash_rate: 0,
                    estimated_earnings: 0,
                });
            }
        };
        Ok(GpuMinerStatus {
            is_mining: true,
            hash_rate: body.hashes_per_second,
            estimated_earnings: 0,
        })
    }
}

#[derive(Debug, Deserialize)]
struct XtrGpuminerHttpApiStatus {
    hashes_per_second: u64,
}

#[derive(Debug, Serialize)]
pub struct GpuMinerStatus {
    pub is_mining: bool,
    pub hash_rate: u64,
    pub estimated_earnings: u64,
}
