use std::path::PathBuf;

use anyhow::{Error, anyhow};
use async_trait::async_trait;
use log::{debug, info};
use tari_shutdown::Shutdown;
use tor_hash_passwd::EncryptedKey;
use tokio::fs;
use serde::{Deserialize, Serialize};

use crate::{
    process_adapter::{
        HealthStatus, ProcessAdapter, ProcessInstance, ProcessStartupSpec, StatusMonitor,
    },
    utils::file_utils::convert_to_string,
};

const LOG_TARGET: &str = "tari::universe::tor_adapter";

pub(crate) struct TorAdapter {
    control_port: u16,
    socks_port: u16,
    password: String,
    config_file: Option<PathBuf>,
    config: TorConfig,
}

impl TorAdapter {
    pub fn new() -> Self {
        let control_port = 9051;
        let socks_port = 9050;
        let password = "tari is the best".to_string();

        Self {
            control_port,
            socks_port,
            password,
            config_file: None,
            config: TorConfig::default(),
        }
    }

    pub async fn load_or_create_config(&mut self, config_path: PathBuf) -> Result<(), anyhow::Error> {
        let file: PathBuf = config_path.join("tor_config.json");
        self.config_file = Some(file.clone());

        if file.exists() {
            debug!(target: LOG_TARGET, "Loading tor config from file: {:?}", file);
            let config = fs::read_to_string(&file).await?;
            self.apply_loaded_config(config);
        } else {
            info!(target: LOG_TARGET, "App config does not exist or is corrupt. Creating new one");
        }
        self.update_config_file().await?;
        Ok(())
    }

    fn apply_loaded_config(&mut self, config: String) {
        self.config = serde_json::from_str::<TorConfig>(&config).unwrap_or(TorConfig::default());
    }

    async fn update_config_file(&mut self) -> Result<(), anyhow::Error> {
        let file = self
            .config_file
            .clone()
            .ok_or_else(|| anyhow!("Tor config file not set"))?;

        let config = serde_json::to_string(&self.config)?;
        debug!(target: LOG_TARGET, "Updating tor config file: {:?} {:?}", file, self.config.clone());
        fs::write(file, config).await?;

        Ok(())
    }

    pub fn get_tor_config(&self) -> TorConfig {
        self.config.clone()
    }
}

impl ProcessAdapter for TorAdapter {
    type StatusMonitor = TorStatusMonitor;

    #[allow(clippy::too_many_lines)]
    fn spawn_inner(
        &self,
        data_dir: PathBuf,
        config_dir: PathBuf,
        log_dir: PathBuf,
        binary_version_path: PathBuf,
    ) -> Result<(ProcessInstance, Self::StatusMonitor), Error> {
        let inner_shutdown = Shutdown::new();

        info!(target: LOG_TARGET, "Starting tor");
        let working_dir: PathBuf = data_dir.join("tor-data");
        std::fs::create_dir_all(&working_dir)?;

        let working_dir_string = convert_to_string(working_dir)?;
        let log_dir_string = convert_to_string(log_dir.join("tor.log"))?;

        let mut args: Vec<String> = vec![
            "--allow-missing-torrc".to_string(),
            "--ignore-missing-torrc".to_string(),
            "--clientonly".to_string(),
            "1".to_string(),
            "--socksport".to_string(),
            self.socks_port.to_string(),
            "--controlport".to_string(),
            format!("127.0.0.1:{}", self.control_port),
            "--HashedControlPassword".to_string(),
            EncryptedKey::hash_password(&self.password).to_string(),
            "--clientuseipv6".to_string(),
            "1".to_string(),
            "--DataDirectory".to_string(),
            working_dir_string,
            "--Log".to_string(),
            format!("notice file {}", log_dir_string),
        ];

        if self.config.use_bridges {
            let mut lyrebird_path = binary_version_path.clone();
            lyrebird_path.pop();
            lyrebird_path.push("pluggable_transports");
            lyrebird_path.push("lyrebird");

            args.push("--ClientTransportPlugin".to_string());
            args.push(format!("obfs4 exec {} -enableLogging managed", convert_to_string(lyrebird_path)?));

            args.push("--Bridge".to_string());
            args.push("obfs4 177.235.180.145:8668 3AC17E97D18ADF92E9662D00EDE3B8FCCA6A6D80 cert=/WbHxF7lntn60mpieMRQ17YF88WfezgIzU0U+vQ3GMyCQUesVWtRkowZStfTO9cv6FutPw iat-mode=0".to_string());
            args.push("--Bridge".to_string());
            args.push("obfs4 217.62.239.211:9449 628B95EEAE48758CBAA2812AE99E1AB5B3BE44D4 cert=i7tmgWvq4X2rncJz4FQsQWwkXiEWVE7Nvm1gffYn5ZlVsA0kBF6c/8041dTB4mi0TSShWA iat-mode=0".to_string());

            args.push("--UseBridges".to_string());
            args.push("1".to_string());
        }
        info!(target: LOG_TARGET, "Starting tor with args: {:?}", args);
        println!("XXXXXXXXXXXXXXXXXXXXXXXXXX Starting tor with args: {:?}", args);

        Ok((
            ProcessInstance {
                shutdown: inner_shutdown,
                handle: None,
                startup_spec: ProcessStartupSpec {
                    file_path: binary_version_path,
                    envs: None,
                    args,
                    data_dir,
                    pid_file_name: self.pid_file_name().to_string(),
                    name: self.name().to_string(),
                },
            },
            TorStatusMonitor {},
        ))
    }

    fn name(&self) -> &str {
        "tor"
    }

    fn pid_file_name(&self) -> &str {
        "tor_pid"
    }
}

#[derive(Clone)]
pub(crate) struct TorStatusMonitor {}

#[async_trait]
impl StatusMonitor for TorStatusMonitor {
    async fn check_health(&self) -> HealthStatus {
        // TODO: Implement health check
        HealthStatus::Healthy
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TorConfig {
    use_bridges: bool,
    bridges: Vec<String>,
}

impl Default for TorConfig {
    fn default() -> Self {
        TorConfig {
            use_bridges: false,
            bridges: Vec::new(),
        }
    }
}
