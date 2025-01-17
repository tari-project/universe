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
use crate::process_adapter::{
    HealthStatus, ProcessAdapter, ProcessInstance, ProcessStartupSpec, StatusMonitor,
};
use crate::utils::file_utils::convert_to_string;
use crate::utils::logging_utils::setup_logging;
use anyhow::Error;
use async_trait::async_trait;
use log::{info, warn};
use minotari_node_grpc_client::grpc::wallet_client::WalletClient;
use minotari_node_grpc_client::grpc::{
    GetBalanceRequest, GetCompletedTransactionsRequest, GetCompletedTransactionsResponse,
};
use serde::Serialize;
use std::path::PathBuf;
use tari_common::configuration::Network;
use tari_common_types::tari_address::{TariAddress, TariAddressError};
use tari_core::transactions::tari_amount::MicroMinotari;
use tari_crypto::ristretto::RistrettoPublicKey;
use tari_shutdown::Shutdown;
use tari_utilities::hex::Hex;
use tokio::sync::{watch, Mutex};
use tonic::Streaming;

#[cfg(target_os = "windows")]
use crate::utils::windows_setup_utils::add_firewall_rule;

const LOG_TARGET: &str = "tari::universe::wallet_adapter";

pub struct WalletAdapter {
    use_tor: bool,
    pub(crate) base_node_public_key: Option<RistrettoPublicKey>,
    pub(crate) base_node_address: Option<String>,
    pub(crate) view_private_key: String,
    pub(crate) spend_key: String,
    pub(crate) tcp_listener_port: u16,
    pub(crate) grpc_port: u16,
    balance_broadcast: watch::Sender<Option<WalletBalance>>,
}

impl WalletAdapter {
    pub fn new(use_tor: bool, balance_broadcast: watch::Sender<Option<WalletBalance>>) -> Self {
        let tcp_listener_port = PortAllocator::new().assign_port_with_fallback();
        let grpc_port = PortAllocator::new().assign_port_with_fallback();
        Self {
            use_tor,
            base_node_address: None,
            base_node_public_key: None,
            view_private_key: "".to_string(),
            spend_key: "".to_string(),
            tcp_listener_port,
            grpc_port,
            balance_broadcast,
        }
    }
}

impl ProcessAdapter for WalletAdapter {
    type StatusMonitor = WalletStatusMonitor;

    #[allow(clippy::too_many_lines)]
    fn spawn_inner(
        &self,
        data_dir: PathBuf,
        _config_dir: PathBuf,
        log_dir: PathBuf,
        binary_version_path: PathBuf,
    ) -> Result<(ProcessInstance, Self::StatusMonitor), Error> {
        // TODO: This was copied from node_adapter. This should be DRY'ed up
        let inner_shutdown = Shutdown::new();

        info!(target: LOG_TARGET, "Starting read only wallet");
        let working_dir = data_dir.join("wallet");
        std::fs::create_dir_all(&working_dir)?;

        let formatted_working_dir = convert_to_string(working_dir.clone())?;
        let config_dir = log_dir
            .join("wallet")
            .join("configs")
            .join("log4rs_config_wallet.yml");

        setup_logging(
            &config_dir.clone(),
            &log_dir,
            include_str!("../log4rs/wallet_sample.yml"),
        )?;

        let mut args: Vec<String> = vec![
            "-b".to_string(),
            formatted_working_dir,
            "--password".to_string(),
            "asjhfahjajhdfvarehnavrahuyg28397823yauifh24@@$@84y8".to_string(), // TODO: Maybe use a random password per machine
            "--view-private-key".to_string(),
            self.view_private_key.clone(),
            "--spend-key".to_string(),
            self.spend_key.clone(),
            "--non-interactive-mode".to_string(),
            format!(
                "--log-config={}",
                config_dir.to_str().expect("Could not get config dir")
            )
            .to_string(),
            "--grpc-enabled".to_string(),
            "--grpc-address".to_string(),
            format!("/ip4/127.0.0.1/tcp/{}", self.grpc_port),
            "-p".to_string(),
            "wallet.base_node.base_node_monitor_max_refresh_interval=1".to_string(),
            "-p".to_string(),
            format!(
                "wallet.custom_base_node={}::{}",
                self.base_node_public_key
                    .as_ref()
                    .map(|k| k.to_hex())
                    .ok_or_else(|| anyhow::anyhow!("Base node public key not set"))?,
                self.base_node_address
                    .as_ref()
                    .ok_or_else(|| anyhow::anyhow!("Base node address not set"))?
            ),
        ];

        let peer_data_folder = working_dir
            .join(Network::get_current_or_user_setting_or_default().to_string())
            .join("peer_db");

        if self.use_tor {
            args.push("-p".to_string());
            args.push("wallet.p2p.transport.tor.proxy_bypass_for_outbound_tcp=true".to_string())
        } else {
            args.push("-p".to_string());
            args.push("wallet.p2p.transport.type=tcp".to_string());
            args.push("-p".to_string());
            args.push(format!(
                "wallet.p2p.public_addresses=/ip4/127.0.0.1/tcp/{}",
                self.tcp_listener_port
            ));
            args.push("-p".to_string());
            args.push(format!(
                "wallet.p2p.transport.tcp.listener_address=/ip4/0.0.0.0/tcp/{}",
                self.tcp_listener_port
            ));

            let network = Network::get_current_or_user_setting_or_default();
            args.push("-p".to_string());
            args.push(format!(
                "{key}.p2p.seeds.dns_seeds=ip4.seeds.{key}.tari.com,ip6.seeds.{key}.tari.com",
                key = network.as_key_str(),
            ));
        }

        if let Err(e) = std::fs::remove_dir_all(peer_data_folder) {
            warn!(target: LOG_TARGET, "Could not clear peer data folder: {}", e);
        }

        #[cfg(target_os = "windows")]
        add_firewall_rule(
            "minotari_console_wallet.exe".to_string(),
            binary_version_path.clone(),
        )?;

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
            WalletStatusMonitor {
                grpc_port: self.grpc_port,
                latest_balance_broadcast: self.balance_broadcast.clone(),
                completed_transactions_stream: Mutex::new(None),
            },
        ))
    }

    fn name(&self) -> &str {
        "wallet"
    }

    fn pid_file_name(&self) -> &str {
        "wallet_pid"
    }
}

#[derive(Debug, thiserror::Error)]
pub enum WalletStatusMonitorError {
    #[error("Wallet not started")]
    WalletNotStarted,
    #[error("Tari address conversion error: {0}")]
    TariAddress(#[from] TariAddressError),
    #[error("Unknown error: {0}")]
    UnknownError(#[from] anyhow::Error),
}

pub struct WalletStatusMonitor {
    grpc_port: u16,
    latest_balance_broadcast: watch::Sender<Option<WalletBalance>>,
    completed_transactions_stream: Mutex<Option<Streaming<GetCompletedTransactionsResponse>>>,
}

impl Clone for WalletStatusMonitor {
    fn clone(&self) -> Self {
        Self {
            grpc_port: self.grpc_port,
            latest_balance_broadcast: self.latest_balance_broadcast.clone(),
            completed_transactions_stream: Mutex::new(None),
        }
    }
}

#[async_trait]
impl StatusMonitor for WalletStatusMonitor {
    async fn check_health(&self) -> HealthStatus {
        match self.get_balance().await {
            Ok(b) => {
                let _result = self.latest_balance_broadcast.send(Some(b));
                HealthStatus::Healthy
            }
            Err(e) => {
                warn!(target: LOG_TARGET, "Wallet health check failed: {}", e);
                HealthStatus::Unhealthy
            }
        }
    }
}

#[derive(Debug, Serialize, Clone)]
pub struct WalletBalance {
    pub available_balance: MicroMinotari,
    pub timelocked_balance: MicroMinotari,
    pub pending_incoming_balance: MicroMinotari,
    pub pending_outgoing_balance: MicroMinotari,
}

#[derive(Debug, Serialize)]
pub struct TransactionInfo {
    pub tx_id: u64,
    pub source_address: String,
    pub dest_address: String,
    pub status: i32,
    pub amount: MicroMinotari,
    pub fee: u64,
    pub timestamp: u64,
    pub payment_id: String,
    pub mined_in_block_height: u64,
}

impl WalletStatusMonitor {
    fn wallet_grpc_address(&self) -> String {
        format!("http://127.0.0.1:{}", self.grpc_port)
    }

    pub async fn get_balance(&self) -> Result<WalletBalance, WalletStatusMonitorError> {
        let mut client = WalletClient::connect(self.wallet_grpc_address())
            .await
            .map_err(|_e| WalletStatusMonitorError::WalletNotStarted)?;
        let res = client
            .get_balance(GetBalanceRequest {})
            .await
            .map_err(|e| WalletStatusMonitorError::UnknownError(e.into()))?;
        let res = res.into_inner();

        Ok(WalletBalance {
            available_balance: MicroMinotari(res.available_balance),
            timelocked_balance: MicroMinotari(res.timelocked_balance),
            pending_incoming_balance: MicroMinotari(res.pending_incoming_balance),
            pending_outgoing_balance: MicroMinotari(res.pending_outgoing_balance),
        })
    }

    pub async fn get_coinbase_transactions(
        &self,
        continuation: bool,
        limit: Option<u32>,
    ) -> Result<Vec<TransactionInfo>, WalletStatusMonitorError> {
        let mut stream =
            if continuation && self.completed_transactions_stream.lock().await.is_some() {
                self.completed_transactions_stream
                    .lock()
                    .await
                    .take()
                    .unwrap()
            } else {
                let mut client = WalletClient::connect(self.wallet_grpc_address())
                    .await
                    .map_err(|_e| WalletStatusMonitorError::WalletNotStarted)?;
                let res = client
                    .get_completed_transactions(GetCompletedTransactionsRequest {})
                    .await
                    .map_err(|e| WalletStatusMonitorError::UnknownError(e.into()))?;
                res.into_inner()
            };

        let mut transactions: Vec<TransactionInfo> = Vec::new();

        while let Some(message) = stream
            .message()
            .await
            .map_err(|e| WalletStatusMonitorError::UnknownError(e.into()))?
        {
            let tx = message.transaction.expect("Transaction not found");
            if tx.status != 12 && tx.status != 13 {
                // Consider only COINBASE_UNCONFIRMED and COINBASE_UNCONFIRMED
                continue;
            }
            transactions.push(TransactionInfo {
                tx_id: tx.tx_id,
                source_address: tx.source_address.to_hex(),
                dest_address: tx.dest_address.to_hex(),
                status: tx.status,
                amount: MicroMinotari(tx.amount),
                fee: tx.fee,
                timestamp: tx.timestamp,
                payment_id: tx.payment_id.to_hex(),
                mined_in_block_height: tx.mined_in_block_height,
            });
            if let Some(limit) = limit {
                if transactions.len() >= limit as usize {
                    break;
                }
            }
        }

        self.completed_transactions_stream
            .lock()
            .await
            .replace(stream);
        Ok(transactions)
    }

    #[deprecated(
        note = "Do not use. The view only wallet currently returns an interactive address that is not usable. Remove when grpc has been updated to return correct offline address"
    )]
    #[allow(dead_code)]
    pub async fn get_wallet_address(&self) -> Result<TariAddress, WalletStatusMonitorError> {
        panic!("Do not use. The view only wallet currently returns an interactive address that is not usable. Remove when grpc has been updated to return correct offline address");
        // let mut client = WalletClient::connect(self.wallet_grpc_address())
        //     .await
        //     .map_err(|_e| WalletStatusMonitorError::WalletNotStarted)?;
        // let res = client
        //     .get_address(Empty {})
        //     .await
        //     .map_err(|e| WalletStatusMonitorError::UnknownError(e.into()))?;
        // let res = res.into_inner();

        // match TariAddress::from_bytes(res.address.as_slice()) {
        //     Ok(address) => Ok(address),
        //     Err(err) => Err(WalletStatusMonitorError::TariAddress(err)),
        // }
    }
}
