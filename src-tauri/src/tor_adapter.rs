use std::path::PathBuf;

use anyhow::{anyhow, Error};
use async_trait::async_trait;
use log::{debug, info};
use serde::{Deserialize, Serialize};
use tari_shutdown::Shutdown;
use tokio::fs;
use tor_hash_passwd::EncryptedKey;

use crate::{
    process_adapter::{
        HealthStatus, ProcessAdapter, ProcessInstance, ProcessStartupSpec, StatusMonitor,
    },
    utils::file_utils::convert_to_string,
};

const LOG_TARGET: &str = "tari::universe::tor_adapter";

pub(crate) struct TorAdapter {
    socks_port: u16,
    password: String,
    config_file: Option<PathBuf>,
    config: TorConfig,
}

impl TorAdapter {
    pub fn new() -> Self {
        let socks_port = 9050;
        let password = "tari is the best".to_string();

        Self {
            socks_port,
            password,
            config_file: None,
            config: TorConfig::default(),
        }
    }

    pub async fn load_or_create_config(
        &mut self,
        config_path: PathBuf,
    ) -> Result<(), anyhow::Error> {
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

    pub async fn set_tor_config(&mut self, config: TorConfig) -> Result<TorConfig, Error> {
        self.config = config.clone();

        // match self.apply_tor_config_changes(config.clone()).await {
        //     Ok(_) => println!("4.XXXXXXXTor config changes applied successfully"),
        //     Err(e) => {
        //         warn!(target: LOG_TARGET, "Failed to apply Tor config changes: {:?}", e);
        //         return Err(e);
        //     }
        // }

        self.update_config_file().await?;
        Ok(config)
    }

    // pub async fn apply_tor_config_changes(&self, config: TorConfig) -> Result<(), Error> {
    //     let mut setconf_commands: Vec<String> = vec![];
    //     let control_port_address = "127.0.0.1:9051";

    //     // Establish a TCP connection
    //     let mut stream = TcpStream::connect(control_port_address)?;
    //     println!("Connected to Tor control port.");

    //     // Authenticate
    //     setconf_commands.push(format!("AUTHENTICATE \"{}\"\n", self.password.clone()));

    //     setconf_commands.push("SETCONF".to_string());

    //     // Set Bridge instances
    //     if config.use_bridges {
    //         for bridge in config.bridges {
    //             setconf_commands.push(format!("Bridge=\"{}\"", bridge))
    //         }
    //     }
    //     // Set UseBridges
    //     setconf_commands.push(format!("UseBridges={}", config.use_bridges as u8));
    //     // Set ControlPort
    //     setconf_commands.push(format!("ControlPort=127.0.0.1:{}", config.control_port));

    //     stream.write_all(setconf_commands.join(" ").as_bytes())?;

    //     Ok(())
    // }
}

impl ProcessAdapter for TorAdapter {
    type StatusMonitor = TorStatusMonitor;

    #[allow(clippy::too_many_lines)]
    fn spawn_inner(
        &self,
        data_dir: PathBuf,
        _config_dir: PathBuf,
        log_dir: PathBuf,
        binary_version_path: PathBuf,
    ) -> Result<(ProcessInstance, Self::StatusMonitor), Error> {
        let inner_shutdown = Shutdown::new();

        info!(target: LOG_TARGET, "Starting tor");
        let working_dir: PathBuf = data_dir.join("tor-data");
        std::fs::create_dir_all(&working_dir)?;

        let working_dir_string = convert_to_string(working_dir)?;
        let log_dir_string = convert_to_string(log_dir.join("tor.log"))?;
        let mut lyrebird_path = binary_version_path.clone();
        lyrebird_path.pop();
        lyrebird_path.push("pluggable_transports");
        lyrebird_path.push("lyrebird");
        if cfg!(target_os = "windows") {
            lyrebird_path.set_extension(".exe");
        }

        let mut args: Vec<String> = vec![
            "--allow-missing-torrc".to_string(),
            "--ignore-missing-torrc".to_string(),
            "--clientonly".to_string(),
            "1".to_string(),
            "--socksport".to_string(),
            self.socks_port.to_string(),
            "--controlport".to_string(),
            format!("127.0.0.1:{}", self.config.control_port),
            "--HashedControlPassword".to_string(),
            EncryptedKey::hash_password(&self.password).to_string(),
            "--clientuseipv6".to_string(),
            "1".to_string(),
            "--DataDirectory".to_string(),
            working_dir_string,
            "--Log".to_string(),
            format!("notice file {}", log_dir_string),
            // Used by tor bridges
            // TODO: This does not work when path has space on windows.
            // Consider running lyrebird binary manually
            "--ClientTransportPlugin".to_string(),
            format!("obfs4 exec {} managed", convert_to_string(lyrebird_path)?),
        ];

        if self.config.use_bridges {
            for bridge in &self.config.bridges {
                args.push("--Bridge".to_string());
                args.push(bridge.clone());
            }

            args.push("--UseBridges".to_string());
            args.push("1".to_string());
        }

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
    control_port: u16,
    use_bridges: bool,
    bridges: Vec<String>,
}

impl Default for TorConfig {
    fn default() -> Self {
        TorConfig {
            control_port: 9051,
            use_bridges: false,
            bridges: Vec::new(),
        }
    }
}
