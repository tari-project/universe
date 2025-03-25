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

use std::path::PathBuf;

use tokio::io::{AsyncBufReadExt, AsyncWriteExt, BufReader};
use tokio::net::TcpStream;

use anyhow::{anyhow, Error};
use async_trait::async_trait;
use log::{debug, error, info};
use serde::{Deserialize, Serialize};
use tari_shutdown::Shutdown;
use tokio::fs;

use crate::port_allocator::PortAllocator;
use crate::{
    process_adapter::{
        HealthStatus, ProcessAdapter, ProcessInstance, ProcessStartupSpec, StatusMonitor,
    },
    utils::file_utils::convert_to_string,
};

const LOG_TARGET: &str = "tari::universe::tor_adapter";

pub(crate) struct TorAdapter {
    socks_port: u16,
    config_file: Option<PathBuf>,
    config: TorConfig,
}

impl TorAdapter {
    pub fn new() -> Self {
        let port = PortAllocator::new().assign_port_with_fallback();

        Self {
            socks_port: port,
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
        let mut conf = serde_json::from_str::<TorConfig>(&config).unwrap_or_default();
        if conf.version < 1 {
            conf.control_port = 0;
            conf.version = 1;
        }

        self.config = conf;
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
        //     Ok(_) => info!(target: LOG_TARGET, "Tor config changes applied successfully"),
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

    pub async fn get_entry_guards(&self) -> Result<Vec<String>, Error> {
        let control_port_address = format!("127.0.0.1:{}", self.config.control_port);
        let stream = TcpStream::connect(control_port_address.clone()).await?;
        let mut reader = BufReader::new(stream);

        // AUTHENTICATE
        let auth_command = "AUTHENTICATE\n";
        reader.get_mut().write_all(auth_command.as_bytes()).await?;
        let mut response = String::new();
        reader.read_line(&mut response).await?;
        if !response.starts_with("250 OK") {
            error!(target: LOG_TARGET, "Tor AUTHENTICATE failed for: {:?}", control_port_address);
            return Err(Error::msg("Authentication failed"));
        }

        // GETINFO entry-guards
        let getinfo_command = "GETINFO entry-guards\n";
        reader
            .get_mut()
            .write_all(getinfo_command.as_bytes())
            .await?;
        response.clear();
        reader.read_line(&mut response).await?;

        if response.starts_with("250+entry-guards=") {
            let mut entry_guards: Vec<String> = vec![];
            loop {
                response.clear();
                reader.read_line(&mut response).await?;
                if response == ".\r\n" || response.is_empty() {
                    break;
                }
                entry_guards.push(response.trim().to_string());
            }

            Ok(entry_guards)
        } else {
            error!(target: LOG_TARGET, "Tor GETINFO entry-guards with response: {:?}", response);
            Err(Error::msg("Failed to get entry guards"))
        }
    }
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
            lyrebird_path.set_extension("exe");
        }
        let mut control_port = self.config.control_port;
        if control_port == 0 {
            control_port = PortAllocator::new().assign_port_with_fallback();
        }

        let mut args: Vec<String> = vec![
            "--allow-missing-torrc".to_string(),
            "--ignore-missing-torrc".to_string(),
            "--clientonly".to_string(),
            "1".to_string(),
            "--socksport".to_string(),
            self.socks_port.to_string(),
            "--controlport".to_string(),
            format!("127.0.0.1:{}", control_port),
            // TODO: Put hashed password back
            // "--HashedControlPassword".to_string(),
            // EncryptedKey::hash_password(&self.password).to_string(),
            "--clientuseipv6".to_string(),
            "1".to_string(),
            "--DataDirectory".to_string(),
            working_dir_string,
            "--Log".to_string(),
            format!("notice file {}", log_dir_string),
        ];

        if self.config.use_bridges {
            // Used by tor bridges
            // TODO: This does not work when path has space on windows.
            // Consider running lyrebird binary manually
            args.push("--ClientTransportPlugin".to_string());
            args.push(format!(
                "obfs4 exec {} managed",
                convert_to_string(lyrebird_path)?
            ));
            for bridge in &self.config.bridges {
                args.push("--Bridge".to_string());
                args.push(bridge.clone());
            }

            args.push("--UseBridges".to_string());
            args.push("1".to_string());
        }

        Ok((
            ProcessInstance::new(
                inner_shutdown,
                ProcessStartupSpec {
                    file_path: binary_version_path,
                    envs: None,
                    args,
                    data_dir,
                    pid_file_name: self.pid_file_name().to_string(),
                    name: self.name().to_string(),
                },
            ),
            TorStatusMonitor { control_port },
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
pub(crate) struct TorStatusMonitor {
    pub control_port: u16,
}

#[async_trait]
impl StatusMonitor for TorStatusMonitor {
    async fn check_health(&self) -> HealthStatus {
        // TODO: Implement health check
        HealthStatus::Healthy
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TorConfig {
    #[serde(default)]
    version: u16,
    control_port: u16,
    use_bridges: bool,
    bridges: Vec<String>,
}

impl Default for TorConfig {
    fn default() -> Self {
        // let port = network_utils::get_free_port().unwrap_or(9061);
        TorConfig {
            version: 1,
            control_port: 0,
            use_bridges: false,
            bridges: Vec::new(),
        }
    }
}
