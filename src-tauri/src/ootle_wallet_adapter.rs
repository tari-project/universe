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

use anyhow::Error;
use async_trait::async_trait;
use log::{info, warn};
use std::path::PathBuf;
use tari_shutdown::Shutdown;
use tokio::sync::watch;

use crate::port_allocator::PortAllocator;
use crate::process_adapter::{
    HealthStatus, ProcessAdapter, ProcessInstance, ProcessStartupSpec, StatusMonitor,
};
use crate::xmrig;
use crate::xmrig::http_api::models::Summary;
use crate::xmrig::http_api::OotleWalletHttpApiClient;

pub struct OotleWalletAdapter {
    pub address: Option<String>,
    pub jrpc_port: String,
    pub web_ui_port: u16,
}

impl OotleWalletAdapter {
    pub fn new() -> Self {
        let jrpc_port = PortAllocator::new().assign_port_with_fallback();
        let web_ui_port = PortAllocator::new().assign_port_with_fallback();
        info!(target: LOG_TARGET, "👨‍🔧 --- XMRIG NEW http port {}", &http_api_port);
        Self {
            address: None,
            jrpc_port,
            web_ui_port,
        }
    }

    pub async fn grpc_port(&self) -> u16 {
        self.jrpc_address
    }
}

impl ProcessAdapter for OotleWalletAdapter {
    type StatusMonitor = OotleWalletStatusMonitor;

    fn spawn_inner(
        &self,
        data_dir: PathBuf,
        _config_dir: PathBuf,
        log_dir: PathBuf,
        binary_version_path: PathBuf,
    ) -> Result<(ProcessInstance, Self::StatusMonitor), anyhow::Error> {
        let wallet_daemon_config_file = config_dir.join(WALLET_DAEMON_CONFIG_FILE);
        // let port = PortAllocator::new().assign_port_with_fallback();
        info!(target: LOG_TARGET,"🚨 Start wallet daemon");
        if let Err(e) =
            spawn_wallet_daemon(log_dir, data_dir, wallet_daemon_config_file, jrpc_port).await
        {
            error!(target: LOG_TARGET, "Could not start wallet daemon: {:?}", e);
        }
        println!(
            "------> 🌟 WALLET DAEMON DONE with assigned jrpc_port: {:?}",
            &jrpc_port
        );
        info!(target: LOG_TARGET, "🌟 WALLET DAEMON DONE with jrpc_port {:?}", &jrpc_port);
        info!(target: LOG_TARGET, "🚀 Wallet daemon started successfully");

        Ok(())
    }

    fn name(&self) -> &str {
        "ootle_wallet"
    }

    fn pid_file_name(&self) -> &str {
        "ootle_wallet_pid"
    }

    fn pid_file_name(&self) -> &str {
        "ootle_wallet_pid"
    }
}

#[derive(Clone)]
pub struct OotleWalletStatusMonitor {
    client: OotleWalletHttpApiClient,
    summary_broadcast: watch::Sender<Option<Summary>>,
}

#[async_trait]
impl StatusMonitor for OotleWalletStatusMonitor {
    async fn check_health(&self) -> HealthStatus {
        match self.summary().await {
            Ok(s) => {
                let _result = self.summary_broadcast.send(Some(s));
                HealthStatus::Healthy
            }
            Err(e) => {
                warn!(target: LOG_TARGET, "Failed to get xmrig summary: {}", e);
                let _result = self.summary_broadcast.send(None);
                HealthStatus::Unhealthy
            }
        }
    }
}

impl OotleWalletStatusMonitor {
    pub async fn summary(&self) -> Result<xmrig::http_api::models::Summary, Error> {
        self.client.summary().await
    }
}
