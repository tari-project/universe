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
    GetBalanceResponse, GetCompletedTransactionsRequest, GetStateRequest, NetworkStatusResponse,
};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use tari_common::configuration::Network;
use tari_common_types::tari_address::{TariAddress, TariAddressError};
use tari_core::transactions::tari_amount::MicroMinotari;
use tari_core::transactions::transaction_components::encrypted_data::PaymentId;
use tari_crypto::ristretto::RistrettoPublicKey;
use tari_shutdown::Shutdown;
use tari_utilities::hex::Hex;
use tokio::sync::watch;

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
    state_broadcast: watch::Sender<Option<WalletState>>,
}

impl WalletAdapter {
    pub fn new(use_tor: bool, state_broadcast: watch::Sender<Option<WalletState>>) -> Self {
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
            state_broadcast,
        }
    }

    pub async fn get_transactions(
        &self,
        last_tx_id: Option<u64>,
        status_filters: Option<Vec<TransactionStatus>>,
        limit: Option<u32>,
    ) -> Result<Vec<TransactionInfo>, WalletStatusMonitorError> {
        let mut client = WalletClient::connect(self.wallet_grpc_address())
            .await
            .map_err(|_e| WalletStatusMonitorError::WalletNotStarted)?;

        let res = client
            .get_completed_transactions(GetCompletedTransactionsRequest {})
            .await
            .map_err(|e| WalletStatusMonitorError::UnknownError(e.into()))?;

        let mut stream = res.into_inner();
        let mut transactions: Vec<TransactionInfo> = Vec::new();
        let mut should_collect = last_tx_id.is_none();

        while let Some(message) = stream
            .message()
            .await
            .map_err(|e| WalletStatusMonitorError::UnknownError(e.into()))?
        {
            let tx = message.transaction.ok_or_else(|| {
                WalletStatusMonitorError::UnknownError(anyhow::anyhow!("Transaction not found"))
            })?;

            // If we have a last_tx_id, skip transactions until we find it
            if !should_collect {
                if let Some(last_id) = last_tx_id {
                    if tx.tx_id == last_id {
                        should_collect = true;
                    }
                }
                continue;
            }

            // Apply status filter only if Some with non-empty vector
            if let Some(filters) = &status_filters {
                if !filters.is_empty() && !filters.contains(&TransactionStatus::from(tx.status)) {
                    continue;
                }
            }

            transactions.push(TransactionInfo {
                tx_id: tx.tx_id,
                source_address: tx.source_address.to_hex(),
                dest_address: tx.dest_address.to_hex(),
                status: TransactionStatus::from(tx.status),
                amount: MicroMinotari(tx.amount),
                is_cancelled: tx.is_cancelled,
                direction: tx.direction,
                excess_sig: tx.excess_sig,
                fee: tx.fee,
                timestamp: tx.timestamp,
                payment_id: PaymentId::from_bytes(&tx.payment_id).user_data_as_string(),
                mined_in_block_height: tx.mined_in_block_height,
            });

            if let Some(limit) = limit {
                if transactions.len() >= limit as usize {
                    break;
                }
            }
        }

        Ok(transactions)
    }

    pub fn wallet_grpc_address(&self) -> String {
        format!("http://127.0.0.1:{}", self.grpc_port)
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
                state_broadcast: self.state_broadcast.clone(),
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

pub struct WalletStatusMonitor {
    grpc_port: u16,
    state_broadcast: watch::Sender<Option<WalletState>>,
}

impl Clone for WalletStatusMonitor {
    fn clone(&self) -> Self {
        Self {
            grpc_port: self.grpc_port,
            state_broadcast: self.state_broadcast.clone(),
        }
    }
}

#[async_trait]
impl StatusMonitor for WalletStatusMonitor {
    async fn check_health(&self) -> HealthStatus {
        match self.get_status().await {
            Ok(s) => {
                let _result = self.state_broadcast.send(Some(s));
                HealthStatus::Healthy
            }
            Err(e) => {
                warn!(target: LOG_TARGET, "Wallet health check failed: {}", e);
                HealthStatus::Unhealthy
            }
        }
    }
}

impl WalletStatusMonitor {
    fn wallet_grpc_address(&self) -> String {
        format!("http://127.0.0.1:{}", self.grpc_port)
    }

    pub async fn get_status(&self) -> Result<WalletState, WalletStatusMonitorError> {
        let mut client = WalletClient::connect(self.wallet_grpc_address())
            .await
            .map_err(|_e| WalletStatusMonitorError::WalletNotStarted)?;
        let res = client
            .get_state(GetStateRequest {})
            .await
            .map_err(|e| WalletStatusMonitorError::UnknownError(e.into()))?;
        let status = res.into_inner();

        Ok(WalletState {
            scanned_height: status.scanned_height,
            balance: WalletBalance::from(status.balance),
            network: NetworkStatus::from(status.network),
        })
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

#[derive(Debug, thiserror::Error)]
pub enum WalletStatusMonitorError {
    #[error("Wallet not started")]
    WalletNotStarted,
    #[error("Tari address conversion error: {0}")]
    TariAddress(#[from] TariAddressError),
    #[error("Unknown error: {0}")]
    UnknownError(#[from] anyhow::Error),
}

#[allow(dead_code)]
#[derive(Debug, Clone)]
pub struct WalletState {
    pub scanned_height: u64,
    pub balance: Option<WalletBalance>,
    pub network: Option<NetworkStatus>,
}

#[allow(dead_code)]
#[derive(Debug, Clone)]
pub struct NetworkStatus {
    pub status: ConnectivityStatus,
    pub avg_latency_ms: u32,
    pub num_node_connections: u32,
}

impl NetworkStatus {
    pub fn from(res: Option<NetworkStatusResponse>) -> Option<Self> {
        match res {
            Some(res) => Some(Self {
                status: match res.status {
                    0 => ConnectivityStatus::Initializing,
                    1 => ConnectivityStatus::Online(res.num_node_connections as usize),
                    2 => ConnectivityStatus::Degraded(res.num_node_connections as usize),
                    3 => ConnectivityStatus::Offline,
                    _ => return None,
                },
                avg_latency_ms: res.avg_latency_ms,
                num_node_connections: res.num_node_connections,
            }),
            None => None,
        }
    }
}

#[allow(dead_code)]
#[derive(Default, Debug, Clone)]
pub enum ConnectivityStatus {
    /// Initial connectivity status before the Connectivity actor has initialized.
    #[default]
    Initializing,
    /// Connectivity is online.
    Online(usize),
    /// Connectivity is less than the required minimum, but some connections are still active.
    Degraded(usize),
    /// There are no active connections.
    Offline,
}

#[derive(Debug, Clone, Serialize)]
pub struct WalletBalance {
    pub available_balance: MicroMinotari,
    pub timelocked_balance: MicroMinotari,
    pub pending_incoming_balance: MicroMinotari,
    pub pending_outgoing_balance: MicroMinotari,
}

impl WalletBalance {
    pub fn from(res: Option<GetBalanceResponse>) -> Option<Self> {
        res.map(|balance| Self {
            available_balance: MicroMinotari(balance.available_balance),
            timelocked_balance: MicroMinotari(balance.timelocked_balance),
            pending_incoming_balance: MicroMinotari(balance.pending_incoming_balance),
            pending_outgoing_balance: MicroMinotari(balance.pending_outgoing_balance),
        })
    }
}

#[derive(Debug, Serialize, Clone)]
pub struct TransactionInfo {
    pub tx_id: u64,
    pub source_address: String,
    pub dest_address: String,
    pub status: TransactionStatus,
    pub amount: MicroMinotari,
    pub is_cancelled: bool,
    pub direction: i32,
    pub excess_sig: Vec<u8>,
    pub fee: u64,
    pub timestamp: u64,
    pub payment_id: String,
    pub mined_in_block_height: u64,
}

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq)]
pub enum TransactionStatus {
    // This transaction has been completed between the parties but has not been broadcast to the base layer network.
    Completed = 0,
    // This transaction has been broadcast to the base layer network and is currently in one or more base node mempools.
    Broadcast = 1,
    // This transaction has been mined and included in a block.
    MinedUnconfirmed = 2,
    // This transaction was generated as part of importing a spendable UTXO
    Imported = 3,
    // This transaction is still being negotiated by the parties
    Pending = 4,
    // This is a created Coinbase Transaction
    Coinbase = 5,
    // This transaction is mined and confirmed at the current base node's height
    MinedConfirmed = 6,
    // The transaction was rejected by the mempool
    Rejected = 7,
    // This is faux transaction mainly for one-sided transaction outputs or wallet recovery outputs have been found
    OneSidedUnconfirmed = 8,
    // All Imported and FauxUnconfirmed transactions will end up with this status when the outputs have been confirmed
    OneSidedConfirmed = 9,
    // This transaction is still being queued for sending
    Queued = 10,
    // The transaction was not found by the wallet its in transaction database
    NotFound = 11,
    // This is Coinbase transaction that is detected from chain
    CoinbaseUnconfirmed = 12,
    // This is Coinbase transaction that is detected from chain
    CoinbaseConfirmed = 13,
    // This is Coinbase transaction that is not currently detected as mined
    CoinbaseNotInBlockChain = 14,
}

impl From<i32> for TransactionStatus {
    fn from(value: i32) -> Self {
        match value {
            0 => TransactionStatus::Completed,
            1 => TransactionStatus::Broadcast,
            2 => TransactionStatus::MinedUnconfirmed,
            3 => TransactionStatus::Imported,
            4 => TransactionStatus::Pending,
            5 => TransactionStatus::Coinbase,
            6 => TransactionStatus::MinedConfirmed,
            7 => TransactionStatus::Rejected,
            8 => TransactionStatus::OneSidedUnconfirmed,
            9 => TransactionStatus::OneSidedConfirmed,
            10 => TransactionStatus::Queued,
            11 => TransactionStatus::NotFound,
            12 => TransactionStatus::CoinbaseUnconfirmed,
            13 => TransactionStatus::CoinbaseConfirmed,
            14 => TransactionStatus::CoinbaseNotInBlockChain,
            _ => TransactionStatus::NotFound,
        }
    }
}
