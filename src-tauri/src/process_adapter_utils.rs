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

use crate::utils::file_utils::convert_to_string;
use crate::utils::logging_utils::setup_logging;
use anyhow::Error;
use log::{info, warn};
use std::collections::HashMap;
use std::fs;
use std::path::PathBuf;
use tari_common::configuration::Network;

#[cfg(target_os = "windows")]
use crate::utils::windows_setup_utils::add_firewall_rule;

const LOG_TARGET: &str = "tari::universe::process_adapter_utils";

/// Common configuration for process adapters
pub struct ProcessAdapterConfig {
    pub working_dir_name: String,
    pub log_config_name: String,
    pub log_sample_content: &'static str,
    pub binary_name: String,
    pub grpc_port: Option<u16>,
    pub tcp_listener_port: Option<u16>,
    pub use_tor: bool,
    pub connect_with_local_node: bool,
    pub base_node_public_key: Option<String>,
    pub base_node_address: Option<String>,
    pub environment_variables: HashMap<String, String>,
    pub extra_args: Vec<String>,
}

/// Setup common directory structure and cleanup
pub fn setup_working_directory(
    data_dir: &PathBuf,
    working_dir_name: &str,
) -> Result<PathBuf, Error> {
    let working_dir = data_dir.join(working_dir_name);
    let network_dir = working_dir.join(Network::get_current().to_string().to_lowercase());
    std::fs::create_dir_all(&working_dir)?;

    // Remove peerdb on every restart as requested by Protocol team
    let peer_db_dir = network_dir.join("peer_db");
    if peer_db_dir.exists() {
        info!(target: LOG_TARGET, "Removing peer db at {:?}", peer_db_dir);
        let _unused = fs::remove_dir_all(peer_db_dir).inspect_err(|e| {
            warn!(target: LOG_TARGET, "Failed to remove peer db: {:?}", e);
        });
    }

    Ok(working_dir)
}

/// Setup logging configuration
pub fn setup_logging_config(
    log_dir: &PathBuf,
    config_name: &str,
    sample_content: &str,
) -> Result<PathBuf, Error> {
    let config_dir = log_dir
        .join("configs")
        .join(config_name);

    setup_logging(&config_dir, log_dir, sample_content)?;
    Ok(config_dir)
}

/// Build common base arguments for process
pub fn build_base_args(
    working_dir: &PathBuf,
    config_dir: &PathBuf,
    grpc_port: Option<u16>,
) -> Result<Vec<String>, Error> {
    let formatted_working_dir = convert_to_string(working_dir.clone())?;
    let mut args = vec![
        "-b".to_string(),
        formatted_working_dir,
        "--non-interactive-mode".to_string(),
        format!(
            "--log-config={}",
            config_dir.to_str().expect("Could not get config dir")
        ),
    ];

    if let Some(port) = grpc_port {
        args.extend([
            "--grpc-enabled".to_string(),
            "--grpc-address".to_string(),
            format!("/ip4/127.0.0.1/tcp/{}", port),
        ]);
    }

    Ok(args)
}

/// Add network configuration arguments
pub fn add_network_args(
    args: &mut Vec<String>,
    use_tor: bool,
    connect_with_local_node: bool,
    tcp_listener_port: Option<u16>,
    base_node_public_key: Option<&str>,
    base_node_address: Option<&str>,
) -> Result<(), Error> {
    if let (Some(public_key), Some(address)) = (base_node_public_key, base_node_address) {
        args.extend([
            "-p".to_string(),
            format!("wallet.custom_base_node={}::{}", public_key, address),
        ]);
    }

    // Always use direct connections with the local node
    if use_tor && !connect_with_local_node {
        args.extend([
            "-p".to_string(),
            "wallet.p2p.transport.tor.proxy_bypass_for_outbound_tcp=true".to_string(),
        ]);
        
        let network = Network::get_current_or_user_setting_or_default();
        args.push("-p".to_string());
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
        }
    } else {
        if connect_with_local_node {
            args.extend([
                "-p".to_string(),
                "wallet.base_node.base_node_monitor_max_refresh_interval=1".to_string(),
            ]);
        }
        
        args.extend([
            "-p".to_string(),
            "wallet.p2p.transport.type=tcp".to_string(),
        ]);

        if let Some(port) = tcp_listener_port {
            args.extend([
                "-p".to_string(),
                format!("wallet.p2p.public_addresses=/ip4/127.0.0.1/tcp/{}", port),
                "-p".to_string(),
                format!("wallet.p2p.transport.tcp.listener_address=/ip4/0.0.0.0/tcp/{}", port),
            ]);
        }

        let network = Network::get_current_or_user_setting_or_default();
        args.push("-p".to_string());
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

    Ok(())
}

/// Clean up peer data folder
pub fn cleanup_peer_data_folder(working_dir: &PathBuf) {
    let peer_data_folder = working_dir
        .join(Network::get_current_or_user_setting_or_default().to_string())
        .join("peer_db");

    if let Err(e) = std::fs::remove_dir_all(peer_data_folder) {
        warn!(target: LOG_TARGET, "Could not clear peer data folder: {}", e);
    }
}

/// Setup Windows firewall rule if needed
#[cfg(target_os = "windows")]
pub fn setup_windows_firewall(
    binary_name: &str,
    binary_version_path: &PathBuf,
) -> Result<(), Error> {
    add_firewall_rule(binary_name.to_string(), binary_version_path.clone())?;
    Ok(())
}

#[cfg(not(target_os = "windows"))]
pub fn setup_windows_firewall(
    _binary_name: &str,
    _binary_version_path: &PathBuf,
) -> Result<(), Error> {
    Ok(())
}
