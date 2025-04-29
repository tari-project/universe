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
use crate::tasks_tracker::TasksTrackers;
use crate::utils::file_utils::convert_to_string;
use crate::utils::logging_utils::setup_logging;
use anyhow::Error;
use async_trait::async_trait;
use log::{info, warn};
use minotari_node_grpc_client::grpc::wallet_client::WalletClient;
use minotari_node_grpc_client::grpc::{
    GetBalanceResponse, GetCompletedTransactionsRequest, GetCompletedTransactionsResponse,
    GetStateRequest, NetworkStatusResponse,
};
use serde::Serialize;
use std::path::PathBuf;
use std::time::Duration;
use tari_common::configuration::Network;
use tari_common_types::tari_address::{TariAddress, TariAddressError};
use tari_core::transactions::tari_amount::MicroMinotari;
use tari_core::transactions::transaction_components::encrypted_data::PaymentId;
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
    connect_with_local_node: bool,
    pub(crate) base_node_public_key: Option<RistrettoPublicKey>,
    pub(crate) base_node_address: Option<String>,
    pub(crate) view_private_key: String,
    pub(crate) spend_key: String,
    pub(crate) tcp_listener_port: u16,
    pub(crate) grpc_port: u16,
    pub(crate) state_broadcast: watch::Sender<Option<WalletState>>,
    pub(crate) wallet_birthday: Option<u16>,
    completed_transactions_stream: Mutex<Option<Streaming<GetCompletedTransactionsResponse>>>,
    coinbase_transactions_stream: Mutex<Option<Streaming<GetCompletedTransactionsResponse>>>,
}

impl WalletAdapter {
    pub fn new(state_broadcast: watch::Sender<Option<WalletState>>) -> Self {
        let tcp_listener_port = PortAllocator::new().assign_port_with_fallback();
        let grpc_port = PortAllocator::new().assign_port_with_fallback();
        Self {
            use_tor: false,
            connect_with_local_node: false,
            base_node_address: None,
            base_node_public_key: None,
            view_private_key: "".to_string(),
            spend_key: "".to_string(),
            tcp_listener_port,
            grpc_port,
            state_broadcast,
            wallet_birthday: None,
            completed_transactions_stream: Mutex::new(None),
            coinbase_transactions_stream: Mutex::new(None),
        }
    }

    pub fn use_tor(&mut self, use_tor: bool) {
        self.use_tor = use_tor;
    }

    pub fn connect_with_local_node(&mut self, connect_with_local_node: bool) {
        self.connect_with_local_node = connect_with_local_node;
    }

    pub async fn get_transactions_history(
        &self,
        continuation: bool,
        limit: Option<u32>,
    ) -> Result<Vec<TransactionInfo>, WalletStatusMonitorError> {
        // TODO: Implement starting point instead of continuation
        let mut stream = if continuation
            && self.completed_transactions_stream.lock().await.is_some()
        {
            self.completed_transactions_stream
                .lock()
                .await
                .take()
                .expect("completed_transactions_stream not found")
        } else {
            let mut client = WalletClient::connect(self.wallet_grpc_address())
                .await
                .map_err(|_e| WalletStatusMonitorError::WalletNotStarted)?;
            let res = client
                .get_completed_transactions(GetCompletedTransactionsRequest { payment_id: None })
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
            let tx = message.transaction.ok_or_else(|| {
                WalletStatusMonitorError::UnknownError(anyhow::anyhow!("Transaction not found"))
            })?;
            if tx.status == 14 || tx.status == 7 {
                // Remove TRANSACTION_STATUS_COINBASE_NOT_IN_BLOCK_CHAIN and REJECTED
                continue;
            }
            transactions.push(TransactionInfo {
                tx_id: tx.tx_id,
                source_address: tx.source_address.to_hex(),
                dest_address: tx.dest_address.to_hex(),
                status: tx.status,
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

        self.completed_transactions_stream
            .lock()
            .await
            .replace(stream);
        Ok(transactions)
    }

    pub async fn get_coinbase_transactions(
        &self,
        continuation: bool,
        limit: Option<u32>,
    ) -> Result<Vec<TransactionInfo>, WalletStatusMonitorError> {
        // TODO: Implement starting point instead of continuation
        let mut stream = if continuation && self.coinbase_transactions_stream.lock().await.is_some()
        {
            self.coinbase_transactions_stream
                .lock()
                .await
                .take()
                .expect("coinbase_transactions_stream not found")
        } else {
            let mut client = WalletClient::connect(self.wallet_grpc_address())
                .await
                .map_err(|_e| WalletStatusMonitorError::WalletNotStarted)?;
            let res = client
                .get_completed_transactions(GetCompletedTransactionsRequest { payment_id: None })
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

        self.coinbase_transactions_stream
            .lock()
            .await
            .replace(stream);
        Ok(transactions)
    }

    pub async fn wait_for_scan_to_height(
        &self,
        block_height: u64,
        timeout: Option<Duration>,
    ) -> Result<WalletState, WalletStatusMonitorError> {
        let mut state_receiver = self.state_broadcast.subscribe();
        let mut shutdown_signal = TasksTrackers::current().wallet_phase.get_signal().await;
        let mut zero_scanned_height_count = 0;
        loop {
            tokio::select! {
                result = state_receiver.changed() => {
                    if result.is_err() {
                        return Err(WalletStatusMonitorError::WalletNotStarted);
                    }

                    let current_state = state_receiver.borrow().clone();
                    if let Some(state) = current_state {
                        // Case 1: Scan has reached or exceeded target height
                        if state.scanned_height >= block_height && block_height > 0 {
                            info!(target: LOG_TARGET, "Wallet scan completed up to block height {}", block_height);
                            return Ok(state);
                        }
                        // Case 2: Wallet is at height 0 but is connected - likely means scan finished already
                        if state.scanned_height == 0 && block_height > 0 {
                            if let Some(network) = &state.network {
                                if matches!(network.status, ConnectivityStatus::Online(3..)) {
                                    zero_scanned_height_count += 1;
                                    if zero_scanned_height_count >= 10 {
                                        warn!(target: LOG_TARGET, "Wallet scanned before gRPC service started");
                                        return Ok(state);
                                    }
                                }
                            }
                        }
                    }
                },
                _ = shutdown_signal.wait() => {
                    log::info!(target: LOG_TARGET, "Shutdown signal received, stopping wait_for_scan_to_height");
                    return Ok(WalletState::default());
                }
                _ = async {
                    tokio::time::sleep(timeout.unwrap_or(Duration::MAX)).await;
                } => {
                    warn!(
                        target: LOG_TARGET,
                        "Timeout reached while waiting for wallet scan to complete. Current height: {}/{}",
                        state_receiver.borrow().as_ref().map(|s| s.scanned_height).unwrap_or(0),
                        block_height
                    );
                    // Return current state if available, otherwise error
                    return state_receiver
                        .borrow()
                        .clone()
                        .ok_or(WalletStatusMonitorError::WalletNotStarted);
                }
            }
        }
    }

    /// Find a recent coinbase transaction for a specific block height
    pub async fn find_coinbase_transaction_for_block(
        &self,
        block_height: u64,
    ) -> Result<Option<TransactionInfo>, WalletStatusMonitorError> {
        // Get a small batch of recent coinbase transactions
        let transactions = self.get_coinbase_transactions(false, Some(10)).await?;

        // Find one matching the specified block height
        let matching_tx = transactions
            .into_iter()
            .find(|tx| tx.mined_in_block_height == block_height);

        Ok(matching_tx)
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

        match self.wallet_birthday {
            Some(wallet_birthday) => {
                args.push("--birthday".to_string());
                args.push(wallet_birthday.to_string());
            }
            None => {
                warn!(target: LOG_TARGET, "Wallet birthday not specified - wallet will scan from genesis block");
            }
        }

        let peer_data_folder = working_dir
            .join(Network::get_current_or_user_setting_or_default().to_string())
            .join("peer_db");

        // Always use direct connections with the local node
        if self.use_tor && !self.connect_with_local_node {
            args.push("-p".to_string());
            args.push("wallet.p2p.transport.tor.proxy_bypass_for_outbound_tcp=true".to_string())
        } else {
            if self.connect_with_local_node {
                args.push("-p".to_string());
                args.push("wallet.base_node.base_node_monitor_max_refresh_interval=1".to_string());
            }
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

        let mut envs = std::collections::HashMap::new();
        envs.insert(
            "MINOTARI_WALLET_PASSWORD".to_string(),
            "asjhfahjajhdfvarehnavrahuyg28397823yauifh24@@$@84y8".to_string(),
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
    async fn check_health(&self, _uptime: Duration, timeout_duration: Duration) -> HealthStatus {
        match tokio::time::timeout(timeout_duration, self.get_status()).await {
            Ok(status_result) => match status_result {
                Ok(s) => {
                    let _result = self.state_broadcast.send(Some(s));
                    HealthStatus::Healthy
                }
                Err(e) => {
                    warn!(target: LOG_TARGET, "Wallet health check failed: {}", e);
                    HealthStatus::Unhealthy
                }
            },
            Err(_timeout_error) => {
                warn!(
                    target: LOG_TARGET,
                    "Wallet health check timed out after {:?}", timeout_duration
                );
                HealthStatus::Warning
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
#[derive(Debug, Clone, Default)]
pub struct WalletState {
    pub scanned_height: u64,
    pub balance: Option<WalletBalance>,
    pub network: Option<NetworkStatus>,
}

#[allow(dead_code)]
#[derive(Debug, Copy, Clone, Default)]
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
#[derive(Default, Debug, Copy, Clone)]
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
    pub status: i32,
    pub amount: MicroMinotari,
    pub is_cancelled: bool,
    pub direction: i32,
    pub excess_sig: Vec<u8>,
    pub fee: u64,
    pub timestamp: u64,
    pub payment_id: String,
    pub mined_in_block_height: u64,
}
