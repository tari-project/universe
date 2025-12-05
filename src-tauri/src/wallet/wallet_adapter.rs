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

use crate::port_allocator::PortAllocator;
use crate::process_adapter::{ProcessAdapter, ProcessInstance, ProcessStartupSpec};
use crate::process_adapter_utils::setup_working_directory;
use crate::utils::file_utils::convert_to_string;
use crate::utils::logging_utils::setup_logging;
#[cfg(target_os = "windows")]
use crate::utils::windows_setup_utils::add_firewall_rule;
use crate::wallet::wallet_status_monitor::WalletStatusMonitor;
use crate::wallet::wallet_types::WalletState;
use crate::{LOG_TARGET_APP_LOGIC, LOG_TARGET_STATUSES};
use anyhow::Error;
use log::{info, warn};
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};
use tari_common::configuration::Network;
use tari_shutdown::Shutdown;
use tokio::sync::watch;

#[derive(Serialize, Deserialize, Default)]
struct MinotariWalletMigrationInfo {
    version: u32,
}

impl MinotariWalletMigrationInfo {
    pub fn save(&self, path: &Path) -> Result<(), anyhow::Error> {
        let json_string = serde_json::to_string(self)?;
        fs::write(path, json_string)?;
        Ok(())
    }

    pub fn load_or_create(path: &Path) -> Result<Self, anyhow::Error> {
        if !fs::exists(path)? {
            return Ok(MinotariWalletMigrationInfo::default());
        }
        let contents = fs::read_to_string(path)?;

        Ok(serde_json::from_str(contents.as_str())?)
    }
}

pub struct WalletAdapter {
    use_tor: bool,
    connect_with_local_node: bool,
    pub(crate) view_private_key: String,
    pub(crate) spend_key: String,
    pub(crate) grpc_port: u16,
    pub(crate) state_broadcast: watch::Sender<Option<WalletState>>,
    pub(crate) wallet_birthday: Option<u16>,
    pub(crate) http_client_url: Option<String>,
}

impl WalletAdapter {
    pub fn new(state_broadcast: watch::Sender<Option<WalletState>>) -> Self {
        let grpc_port = PortAllocator::new().assign_port_with_fallback();
        Self {
            use_tor: false,
            connect_with_local_node: false,
            view_private_key: "".to_string(),
            spend_key: "".to_string(),
            grpc_port,
            state_broadcast,
            wallet_birthday: None,
            http_client_url: None,
        }
    }

    pub fn use_tor(&mut self, use_tor: bool) {
        self.use_tor = use_tor;
    }

    pub fn connect_with_local_node(&mut self, connect_with_local_node: bool) {
        self.connect_with_local_node = connect_with_local_node;
    }

    pub fn wallet_grpc_address(&self) -> String {
        format!("http://127.0.0.1:{}", self.grpc_port)
    }
}

impl ProcessAdapter for WalletAdapter {
    type StatusMonitor = WalletStatusMonitor;
    type ProcessInstance = ProcessInstance;

    #[allow(clippy::too_many_lines)]
    fn spawn_inner(
        &self,
        data_dir: PathBuf,
        _config_dir: PathBuf,
        log_dir: PathBuf,
        binary_version_path: PathBuf,
        _is_first_start: bool,
    ) -> Result<(ProcessInstance, Self::StatusMonitor), Error> {
        let inner_shutdown = Shutdown::new();

        info!(target: LOG_TARGET_APP_LOGIC, "Starting read only wallet");

        // Setup working directory using shared utility
        let working_dir = setup_working_directory(&data_dir, "wallet")?;
        let network_dir = working_dir.join(Network::get_current().to_string().to_lowercase());
        let config_dir = network_dir.join("config");

        fs::create_dir_all(&config_dir)?;
        let migration_file = network_dir.join("migrations.json");
        let mut migration_info = MinotariWalletMigrationInfo::load_or_create(&migration_file)?;

        if migration_info.version < 1 {
            if config_dir.exists() {
                info!(target: LOG_TARGET_APP_LOGIC, "Wallet migration v1: removing directory at {config_dir:?}");
                let _unused = fs::remove_dir_all(config_dir).inspect_err(|e| {
                    warn!(target: LOG_TARGET_APP_LOGIC, "Wallet migration v1 Failed to remove directory: {e:?}");
                });
            }

            info!(target: LOG_TARGET_APP_LOGIC, "Wallet migration v1 complete");
            migration_info.version = 1;
        }
        migration_info.save(&migration_file)?;

        let formatted_working_dir = convert_to_string(working_dir.clone())?;
        let log_cofig = log_dir
            .join("wallet")
            .join("configs")
            .join("log4rs_config_wallet.yml");

        setup_logging(
            &log_cofig.clone(),
            &log_dir,
            include_str!("../../log4rs/wallet_sample.yml"),
        )?;

        let mut args: Vec<String> = vec![
            "-b".to_string(),
            formatted_working_dir,
            "--non-interactive-mode".to_string(),
            format!(
                "--log-config={}",
                log_cofig.to_str().expect("Could not get config dir")
            )
            .to_string(),
            "--grpc-enabled".to_string(),
            "--grpc-address".to_string(),
            format!("/ip4/127.0.0.1/tcp/{}", self.grpc_port),
        ];

        let http_client_url = self
            .http_client_url
            .as_ref()
            .ok_or_else(|| anyhow::anyhow!("HTTP client URL not configured"))?;
        args.push("-p".to_string());
        args.push(format!("wallet.http_server_url={http_client_url}"));

        match self.wallet_birthday {
            Some(wallet_birthday) => {
                args.push("--birthday".to_string());
                args.push(wallet_birthday.to_string());
            }
            None => {
                warn!(target: LOG_TARGET_APP_LOGIC, "Wallet birthday not specified - wallet will scan from genesis block");
            }
        }

        let peer_data_folder = working_dir
            .join(Network::get_current_or_user_setting_or_default().to_string())
            .join("peer_db");

        // Always use direct connections with the local node
        if self.use_tor && !self.connect_with_local_node {
            args.push("-p".to_string());
            args.push("wallet.p2p.transport.tor.proxy_bypass_for_outbound_tcp=true".to_string());
            args.push("-p".to_string());
            let network = Network::get_current_or_user_setting_or_default();
            match network {
                Network::MainNet => {
                    args.push(format!(
                        "{key}.p2p.seeds.dns_seeds=seeds.tari.com",
                        key = network.as_key_str(),
                    ));
                }
                _ => {
                    args.push(format!(
                        "{key}.p2p.seeds.dns_seeds=seeds.{key}.tari.com",
                        key = network.as_key_str(),
                    ));
                }
            };
        } else {
            if self.connect_with_local_node {
                args.push("-p".to_string());
                args.push("wallet.base_node.base_node_monitor_max_refresh_interval=1".to_string());
            }
            args.push("-p".to_string());
            let network = Network::get_current_or_user_setting_or_default();
            match network {
                Network::MainNet => {
                    args.push(format!(
                        "{key}.p2p.seeds.dns_seeds=ip4.seeds.tari.com,ip6.seeds.tari.com",
                        key = network.as_key_str(),
                    ));
                }
                _ => {
                    args.push(format!(
                        "{key}.p2p.seeds.dns_seeds=ip4.seeds.{key}.tari.com,ip6.seeds.{key}.tari.com",
                        key = network.as_key_str(),
                    ));
                }
            }
        }

        if let Err(e) = std::fs::remove_dir_all(peer_data_folder) {
            warn!(target: LOG_TARGET_APP_LOGIC, "Could not clear peer data folder: {e}");
        }

        #[cfg(target_os = "windows")]
        add_firewall_rule(
            "minotari_console_wallet.exe".to_string(),
            binary_version_path.clone(),
        )?;

        let mut envs = std::collections::HashMap::new();
        envs.insert(
            "MINOTARI_WALLET_PASSWORD".to_string(),
            "asjhfahjajhdfvarehnavrahuyg28397823yauifh24@@$@84y8".to_string(),
        );
        envs.insert(
            "MINOTARI_WALLET_VIEW_PRIVATE_KEY".to_string(),
            self.view_private_key.clone(),
        );
        envs.insert(
            "MINOTARI_WALLET_SPEND_KEY".to_string(),
            self.spend_key.clone(),
        );

        Ok((
            ProcessInstance {
                shutdown: inner_shutdown,
                handle: None,
                startup_spec: ProcessStartupSpec {
                    file_path: binary_version_path,
                    envs: Some(envs),
                    args,
                    data_dir,
                    pid_file_name: self.pid_file_name().to_string(),
                    name: self.name().to_string(),
                },
            },
            WalletStatusMonitor::new(self.grpc_port, self.state_broadcast.clone()),
        ))
    }

    fn name(&self) -> &str {
        "wallet"
    }

    fn pid_file_name(&self) -> &str {
        "wallet_pid"
    }
}
