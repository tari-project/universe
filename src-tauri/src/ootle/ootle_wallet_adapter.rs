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

use crate::configs::config_core::L2_NETWORK;
use crate::ootle::ootle_wallet_json_rpc_client::{OotleWalletInfo, OotleWalletJsonRpcClient};
use crate::port_allocator::PortAllocator;
use crate::process_adapter::{
    HealthStatus, ProcessAdapter, ProcessInstance, ProcessStartupSpec, StatusMonitor,
};
use crate::process_adapter_utils::setup_working_directory;
use crate::utils::file_utils::convert_to_string;
use crate::utils::logging_utils::setup_logging;
use anyhow::{Error, Result};
use async_trait::async_trait;
use log::{info, warn};
use reqwest::Url;
use serde::Serialize;
use std::path::PathBuf;
use std::sync::Arc;
use std::time::Duration;
use tari_shutdown::Shutdown;
use tari_utilities::Hidden;
use tokio::sync::watch;
use tokio::sync::Notify;

const LOG_TARGET: &str = "tari::universe::ootle_wallet_adapter";

pub struct OotleWalletAdapter {
    pub indexer_urls: Vec<Url>,
    pub(crate) web_ui_port: u16,
    pub(crate) json_rpc_port: u16,
    pub(crate) state_broadcast: watch::Sender<Option<OotleWalletState>>,
    unhealthy_notification: Arc<Notify>,
    pub seed_words: Option<Hidden<String>>,
}

impl OotleWalletAdapter {
    pub fn new(
        state_broadcast: watch::Sender<Option<OotleWalletState>>,
        unhealthy_notification: Arc<Notify>,
    ) -> Self {
        let json_rpc_port = PortAllocator::new().assign_port_with_fallback();
        let web_ui_port = PortAllocator::new().assign_port_with_fallback();
        Self {
            indexer_urls: vec![],
            json_rpc_port,
            web_ui_port,
            state_broadcast,
            unhealthy_notification,
            seed_words: None,
        }
    }
}

impl ProcessAdapter for OotleWalletAdapter {
    type StatusMonitor = OotleWalletStatusMonitor;
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

        info!(target: LOG_TARGET, "Starting Ootle wallet");

        let working_dir = setup_working_directory(&data_dir, "ootle_wallet")?;
        let formatted_working_dir = convert_to_string(working_dir.clone())?;
        let log_config_path = log_dir
            .join("ootle_wallet")
            .join("configs")
            .join("log4rs_config_wallet.yml");

        setup_logging(
            &log_config_path.clone(),
            &log_dir,
            include_str!("../../log4rs/ootle_wallet_sample.yml"),
        )?;

        let network = L2_NETWORK;
        let mut args: Vec<String> = vec![
            "-b".to_string(),
            formatted_working_dir,
            "-l".to_string(),
            log_config_path
                .to_str()
                .expect("Could not get config dir")
                .to_string(),
            "--network".to_string(),
            network.as_key_str().to_string(),
            "-p".to_string(),
            format!(
                "ootle_wallet_daemon.json_rpc_address=127.0.0.1:{}",
                self.json_rpc_port
            )
            .to_string(),
            "-p".to_string(),
            format!(
                "ootle_wallet_daemon.web_ui_address=127.0.0.1:{}",
                self.web_ui_port
            )
            .to_string(),
        ];
        if let Some(indexer_url) = self.indexer_urls.first() {
            args.push("-i".to_string());
            args.push(indexer_url.to_string());
        }
        if let Some(seed_words) = &self.seed_words {
            args.push("--seed-words".to_string());
            args.push(seed_words.clone().reveal().to_owned());
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
            OotleWalletStatusMonitor {
                json_rpc_port: self.json_rpc_port,
                state_broadcast: self.state_broadcast.clone(),
                unhealthy_notification: self.unhealthy_notification.clone(),
            },
        ))
    }

    fn name(&self) -> &str {
        "ootle_wallet"
    }

    fn pid_file_name(&self) -> &str {
        "ootle_wallet_pid"
    }
}

pub struct OotleWalletStatusMonitor {
    json_rpc_port: u16,
    state_broadcast: watch::Sender<Option<OotleWalletState>>,
    unhealthy_notification: Arc<Notify>,
}

impl Clone for OotleWalletStatusMonitor {
    fn clone(&self) -> Self {
        Self {
            json_rpc_port: self.json_rpc_port,
            state_broadcast: self.state_broadcast.clone(),
            unhealthy_notification: self.unhealthy_notification.clone(),
        }
    }
}

#[async_trait]
impl StatusMonitor for OotleWalletStatusMonitor {
    async fn check_health(&self, _uptime: Duration, timeout_duration: Duration) -> HealthStatus {
        match tokio::time::timeout(timeout_duration, self.get_status()).await {
            Ok(status_result) => match status_result {
                Ok(s) => {
                    let _result = self.state_broadcast.send(Some(s));
                    HealthStatus::Healthy
                }
                Err(e) => {
                    warn!(target: LOG_TARGET, "Ootle Wallet health check failed: {e}");
                    HealthStatus::Unhealthy
                }
            },
            Err(_timeout_error) => {
                warn!(
                    target: LOG_TARGET,
                    "Ootle Wallet health check timed out after {timeout_duration:?}"
                );
                HealthStatus::Warning
            }
        }
    }

    async fn handle_unhealthy(&self) -> Result<(), Error> {
        info!(target: LOG_TARGET, "OotleWalletStatusMonitor: Notifying unhealthy status.");
        self.unhealthy_notification.notify_one();
        Ok(())
    }
}

impl OotleWalletStatusMonitor {
    pub async fn get_status(&self) -> Result<OotleWalletState, OotleWalletStatusMonitorError> {
        let client = OotleWalletJsonRpcClient::new(self.json_rpc_port);
        let wallet_info = client.get_wallet_info().await?;
        Ok(OotleWalletState { wallet_info })
    }
}

#[derive(Debug, thiserror::Error)]
pub enum OotleWalletStatusMonitorError {
    #[error("Unknown error: {0}")]
    UnknownError(#[from] anyhow::Error),
}

#[allow(dead_code)]
#[derive(Debug, Clone, Default, Serialize)]
pub struct OotleWalletState {
    pub wallet_info: OotleWalletInfo,
}
