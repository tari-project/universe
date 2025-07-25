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

use crate::binaries::{Binaries, BinaryResolver};
use crate::internal_wallet::InternalWallet;
use crate::pin::PinManager;
use crate::port_allocator::PortAllocator;
use crate::process_adapter::{
    HealthStatus, ProcessAdapter, ProcessInstance, ProcessInstanceTrait, ProcessStartupSpec,
    StatusMonitor,
};
use crate::process_adapter_utils::setup_working_directory;
use crate::spend_wallet::SpendWallet;
use crate::tasks_tracker::TasksTrackers;
use crate::utils::file_utils::convert_to_string;
use crate::utils::logging_utils::setup_logging;
use anyhow::Error;
use async_trait::async_trait;
use log::{info, warn};
use minotari_node_grpc_client::grpc::payment_recipient::PaymentType;
use minotari_node_grpc_client::grpc::wallet_client::WalletClient;
use minotari_node_grpc_client::grpc::{
    BroadcastSignedOneSidedTransactionRequest, GetAllCompletedTransactionsRequest,
    GetBalanceRequest, GetBalanceResponse, GetStateRequest, NetworkStatusResponse,
    PaymentRecipient, PrepareOneSidedTransactionForSigningRequest, UserPaymentId,
};
use sentry::protocol::Event;
use serde::{Serialize, Serializer};
use std::collections::{BTreeMap, HashMap};
use std::fs;
use std::path::PathBuf;
use std::time::Duration;
use tari_common::configuration::Network;
use tari_common_types::tari_address::{TariAddress, TariAddressError};
use tari_core::transactions::tari_amount::MicroMinotari;
use tari_core::transactions::transaction_components::payment_id::PaymentId;
use tari_key_manager::mnemonic::{Mnemonic, MnemonicLanguage};
use tari_shutdown::Shutdown;
use tauri::{AppHandle, Manager};
use tauri_plugin_sentry::sentry;
use tokio::sync::watch;

#[cfg(target_os = "windows")]
use crate::utils::windows_setup_utils::add_firewall_rule;

const LOG_TARGET: &str = "tari::universe::wallet_adapter";

pub struct WalletAdapter {
    use_tor: bool,
    connect_with_local_node: bool,
    pub(crate) view_private_key: String,
    pub(crate) spend_key: String,
    pub(crate) tcp_listener_port: u16,
    pub(crate) grpc_port: u16,
    pub(crate) state_broadcast: watch::Sender<Option<WalletState>>,
    pub(crate) wallet_birthday: Option<u16>,
    pub(crate) http_client_url: Option<String>,
}

impl WalletAdapter {
    pub fn new(state_broadcast: watch::Sender<Option<WalletState>>) -> Self {
        let tcp_listener_port = PortAllocator::new().assign_port_with_fallback();
        let grpc_port = PortAllocator::new().assign_port_with_fallback();
        Self {
            use_tor: false,
            connect_with_local_node: false,
            view_private_key: "".to_string(),
            spend_key: "".to_string(),
            tcp_listener_port,
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

    pub async fn get_balance(&self) -> Result<WalletBalance, anyhow::Error> {
        let mut client = WalletClient::connect(self.wallet_grpc_address())
            .await
            .map_err(|_e| WalletStatusMonitorError::WalletNotStarted)?;
        let res = client
            .get_balance(GetBalanceRequest { payment_id: None })
            .await?;
        let balance = res.into_inner();

        Ok(WalletBalance::from_response(balance))
    }

    pub async fn get_transactions(
        &self,
        offset: Option<u32>,
        limit: Option<u32>,
        status: Option<u32>,
        current_block_height: u64,
    ) -> Result<Vec<TransactionInfo>, WalletStatusMonitorError> {
        let mut client = WalletClient::connect(self.wallet_grpc_address())
            .await
            .map_err(|_e| WalletStatusMonitorError::WalletNotStarted)?;
        let res = client
            .get_all_completed_transactions(GetAllCompletedTransactionsRequest {
                offset: u64::from(offset.unwrap_or(0)),
                limit: u64::from(limit.unwrap_or(0)),
                status_bitflag: u64::from(status.unwrap_or(0)),
            })
            .await
            .map_err(|e| WalletStatusMonitorError::UnknownError(e.into()))?;

        let transactions = res
            .into_inner()
            .transactions
            .into_iter()
            .map(|tx| {
                let confirmations = if current_block_height > 0
                    && tx.mined_in_block_height <= current_block_height
                {
                    current_block_height - tx.mined_in_block_height
                } else {
                    0
                };
                let payment_reference = if confirmations >= 5 {
                    match tx.direction {
                        1 => tx.payment_references_received.last().map(hex::encode),
                        2 => tx.payment_references_sent.last().map(hex::encode),
                        _ => None,
                    }
                } else {
                    None
                };

                Ok(TransactionInfo {
                    tx_id: tx.tx_id.to_string(),
                    source_address: TariAddress::from_bytes(&tx.source_address)?.to_base58(),
                    dest_address: TariAddress::from_bytes(&tx.dest_address)?.to_base58(),
                    status: TransactionStatus::from(tx.status),
                    amount: MicroMinotari(tx.amount),
                    is_cancelled: tx.is_cancelled,
                    direction: tx.direction,
                    excess_sig: tx.excess_sig,
                    fee: tx.fee,
                    timestamp: tx.timestamp,
                    payment_id: PaymentId::stringify_bytes(&tx.user_payment_id),
                    mined_in_block_height: tx.mined_in_block_height,
                    payment_reference,
                })
            })
            .collect::<Result<Vec<_>, TariAddressError>>()?;

        Ok(transactions)
    }

    pub async fn send_one_sided_to_stealth_address(
        &self,
        amount: u64,
        address: String,
        payment_id: Option<String>,
        app_handle: &tauri::AppHandle,
    ) -> Result<(), anyhow::Error> {
        let payment_recipient = PaymentRecipient {
            address,
            amount,
            raw_payment_id: vec![],
            user_payment_id: payment_id.map(|p_id| UserPaymentId {
                utf8_string: p_id,
                u256: vec![],
                user_bytes: vec![],
            }),
            fee_per_gram: 150, // TODO: Implement fee calculation logic
            payment_type: PaymentType::OneSidedToStealthAddress.into(),
        };

        // GRPC: PrepareOneSidedTransactionForSigning
        let mut client = WalletClient::connect(self.wallet_grpc_address())
            .await
            .map_err(|_e| WalletStatusMonitorError::WalletNotStarted)?;
        let res = client
            .prepare_one_sided_transaction_for_signing(
                PrepareOneSidedTransactionForSigningRequest {
                    recipient: Some(payment_recipient),
                },
            )
            .await
            .map_err(|e| WalletStatusMonitorError::UnknownError(e.into()))?;
        let prepare_tx_res = res.into_inner();
        let unsigned_tx_json = match prepare_tx_res.is_success {
            true => prepare_tx_res.result,
            false => {
                return Err(anyhow::anyhow!(
                    "Transaction preparation failed: {}",
                    prepare_tx_res.failure_message
                ))
            }
        };

        // 1B Save to file
        let network = Network::get_current_or_user_setting_or_default()
            .to_string()
            .to_lowercase();
        let wallet_txs_dir = app_handle
            .path()
            .app_local_data_dir()
            .expect("Couldn't get application config directory!")
            .join(network)
            .join("sent_transactions");
        if !wallet_txs_dir.exists() {
            std::fs::create_dir_all(&wallet_txs_dir).unwrap_or_else(|e| {
                log::error!(target: LOG_TARGET, "Failed to create directory: {e}");
            });
        };

        // Extract tx_id
        let parsed: serde_json::Value = serde_json::from_str(&unsigned_tx_json)
            .expect("Failed to parse unsigned transaction JSON");
        let tx_id = if let Some(tx_id) = parsed.get("tx_id") {
            println!("xxxxx Transaction ID: {}", tx_id);
            tx_id.to_string()
        } else {
            return Err(anyhow::anyhow!("Transaction ID not found"));
        };

        let unsigned_tx_file = wallet_txs_dir.join(format!("{tx_id}-unsigned.json"));
        fs::write(&unsigned_tx_file, &unsigned_tx_json)?;

        // 2(SPEND_WALLET). minotari_console_wallet sign-one-sided-transaction --input-file <unsigned_tx_file> --output-file <signed_tx_file>
        // CLI COMMAND
        let signed_tx_file = wallet_txs_dir.join(format!("{tx_id}.json"));
        //

        let view_wallet_working_dir = app_handle
            .path()
            .app_local_data_dir()
            .expect("Couldn't get application config directory!")
            .join("spend_wallet");
        let spend_wallet_working_dir = app_handle
            .path()
            .app_local_data_dir()
            .expect("Couldn't get application config directory!")
            .join("spend_wallet");
        if !spend_wallet_working_dir.exists() {
            std::fs::create_dir_all(&spend_wallet_working_dir)?;
        }
        // Copy view wallet directory to spend wallet directory
        if view_wallet_working_dir.exists() {
            let entries = std::fs::read_dir(&view_wallet_working_dir)?;
            for entry in entries {
                let entry = entry?;
                let path = entry.path();
                if path.is_file() {
                    let target_path = spend_wallet_working_dir.join(path.file_name().unwrap());
                    if !target_path.exists() {
                        std::fs::copy(&path, target_path)?;
                    }
                }
            }
        }

        let spend_wallet = SpendWallet::new();
        spend_wallet
            .sign_one_sided_transaction(unsigned_tx_file, signed_tx_file.clone(), app_handle)
            .await?;

        // let seed_words = self.get_seed_words(app_handle).await?;
        // let sign_one_sided_transaction_command =
        //     ExecutionCommand::new("sign-one-sided-transaction")
        //         .with_extra_args(vec![

        //             "--i".to_string(),
        //             unsigned_tx_file.to_string_lossy().into_owned(),
        //             "--o".to_string(),
        //             signed_tx_file.to_string_lossy().into_owned(),
        //         ])
        //         .with_extra_envs(HashMap::from([(
        //             "MINOTARI_WALLET_SEED_WORDS".to_string(),
        //             seed_words.to_string(),
        //         )]));

        // self.execute_command(app_handle, sign_one_sided_transaction_command, vec![0])
        //     .await?;

        // 3. minotari_console_wallet send-one-sided-transaction --input-file <signed_tx_file>
        // GRPC: BroadcastSignedOneSidedTransaction
        let signed_tx_json = fs::read_to_string(&signed_tx_file)?;
        let res = client
            .broadcast_signed_one_sided_transaction(BroadcastSignedOneSidedTransactionRequest {
                request: signed_tx_json,
            })
            .await?;
        let broadcast_signed_tx_res = res.into_inner();
        match broadcast_signed_tx_res.is_success {
            true => {
                log::info!(
                    "Transaction broadcasted successfully | tx_id: {}",
                    broadcast_signed_tx_res.transaction_id
                );
                Ok(())
            }
            false => Err(anyhow::anyhow!(
                "Transaction preparation failed: {}",
                broadcast_signed_tx_res.failure_message
            )),
        }
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
                        if state.scanned_height >= block_height {
                            info!(target: LOG_TARGET, "Wallet scan completed up to block height {block_height}");
                            return Ok(state);
                        }
                        // Case 2: Wallet is at height 0 but is connected - likely means scan finished already
                        if state.scanned_height == 0 {
                            if let Some(network) = &state.network {
                                if matches!(network.status, ConnectivityStatus::Online(3..)) {
                                    zero_scanned_height_count += 1;
                                    if zero_scanned_height_count >= 5 {
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

    pub fn wallet_grpc_address(&self) -> String {
        format!("http://127.0.0.1:{}", self.grpc_port)
    }

    async fn execute_command(
        &self,
        app_handle: &AppHandle,
        command: ExecutionCommand,
        allow_exit_codes: Vec<i32>,
    ) -> Result<(i32, Vec<String>, Vec<String>), Error> {
        let data_dir = app_handle
            .path()
            .app_local_data_dir()
            .expect("Could not get data dir");
        let config_dir = app_handle
            .path()
            .app_config_dir()
            .expect("Could not get config dir");
        let log_dir = app_handle
            .path()
            .app_log_dir()
            .expect("Could not get log dir");
        let binary_path = BinaryResolver::current()
            .resolve_path_to_binary_files(Binaries::Wallet)
            .await?;

        let (mut instance, _monitor) =
            self.spawn(data_dir, config_dir, log_dir, binary_path, false)?;

        instance
            .startup_spec
            .args
            .extend(command.extra_args.clone());
        instance
            .startup_spec
            .envs
            .get_or_insert_with(HashMap::new)
            .extend(command.extra_envs);

        let (exit_code, stdout_lines, stderr_lines) = instance
            .start_and_wait_for_output(
                TasksTrackers::current()
                    .wallet_phase
                    .get_task_tracker()
                    .await,
            )
            .await?;

        log::info!(
            target: LOG_TARGET,
            "Command '{}' execution completed with exit code: {}. Details: {{ stdout_lines: {:?}, stderr_lines: {:?}, extra_args: {:?} }}",
            command.name,
            exit_code,
            stdout_lines.join("\n"),
            stderr_lines.join("\n"),
            command.extra_args
        );

        if !allow_exit_codes.contains(&exit_code) {
            sentry::capture_event(Event {
                level: sentry::Level::Error,
                culprit: Some("WalletAdapter::ExecuteCommand".to_string()),
                message: Some(format!(
                    "Command '{}' failed with exit code: {}",
                    command.name, exit_code
                )),
                extra: BTreeMap::from([
                    (
                        "exit_code".to_string(),
                        serde_json::Value::String(exit_code.to_string()),
                    ),
                    (
                        "stdout_lines".to_string(),
                        serde_json::Value::String(stdout_lines.join("\n")),
                    ),
                    (
                        "stderr_lines".to_string(),
                        serde_json::Value::String(stderr_lines.join("\n")),
                    ),
                    (
                        "command".to_string(),
                        serde_json::Value::String(command.name.clone()),
                    ),
                    (
                        "extra_args".to_string(),
                        serde_json::Value::String(format!("{:?}", command.extra_args)),
                    ),
                ]),
                ..Default::default()
            });

            return Err(anyhow::anyhow!(
                "Command '{}' failed with exit code: {}",
                command.name,
                exit_code
            ));
        }

        Ok((exit_code, stdout_lines, stderr_lines))
    }

    async fn get_seed_words(&self, app_handle: &tauri::AppHandle) -> Result<String, Error> {
        let pin_password = PinManager::get_validated_pin_if_defined(app_handle).await?;
        let tari_cipher_seed = InternalWallet::get_tari_seed(pin_password).await?;
        let seed_words = tari_cipher_seed.to_mnemonic(MnemonicLanguage::English, None)?;
        Ok(seed_words.join(" ").reveal().to_string())
    }
}

#[derive(Debug)]
struct ExecutionCommand {
    name: String,
    extra_args: Vec<String>,
    extra_envs: HashMap<String, String>,
}

impl ExecutionCommand {
    fn new(name: impl Into<String>) -> Self {
        Self {
            name: name.into(),
            extra_args: Vec::new(),
            extra_envs: HashMap::new(),
        }
    }

    fn with_extra_args(mut self, extra_args: Vec<String>) -> Self {
        self.extra_args.extend(extra_args);
        self
    }

    #[allow(dead_code)]
    fn with_extra_envs(mut self, extra_envs: HashMap<String, String>) -> Self {
        self.extra_envs.extend(extra_envs);
        self
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

        info!(target: LOG_TARGET, "Starting read only wallet");

        // Setup working directory using shared utility
        let working_dir = setup_working_directory(&data_dir, "wallet")?;

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
            "--non-interactive-mode".to_string(),
            format!(
                "--log-config={}",
                config_dir.to_str().expect("Could not get config dir")
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
                warn!(target: LOG_TARGET, "Wallet birthday not specified - wallet will scan from genesis block");
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
            warn!(target: LOG_TARGET, "Could not clear peer data folder: {e}");
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
                    warn!(target: LOG_TARGET, "Wallet health check failed: {e}");
                    HealthStatus::Unhealthy
                }
            },
            Err(_timeout_error) => {
                warn!(
                    target: LOG_TARGET,
                    "Wallet health check timed out after {timeout_duration:?}"
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
            balance: WalletBalance::from_option(status.balance),
            network: NetworkStatus::from(status.network),
        })
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
    pub fn from_response(res: GetBalanceResponse) -> Self {
        Self {
            available_balance: MicroMinotari(res.available_balance),
            timelocked_balance: MicroMinotari(res.timelocked_balance),
            pending_incoming_balance: MicroMinotari(res.pending_incoming_balance),
            pending_outgoing_balance: MicroMinotari(res.pending_outgoing_balance),
        }
    }

    pub fn from_option(res: Option<GetBalanceResponse>) -> Option<Self> {
        res.map(Self::from_response)
    }
}

#[derive(Debug, Serialize, Clone)]
pub struct TransactionInfo {
    pub tx_id: String,
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
    pub payment_reference: Option<String>,
}

#[derive(Debug, Serialize, Clone)]
pub struct TariAddressVariants {
    pub emoji_string: String,
    pub base58: String,
    pub hex: String,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
#[repr(i32)]
pub enum TransactionStatus {
    /// This transaction has been completed between the parties but has not been broadcast to the base layer network.
    Completed = 0,
    /// This transaction has been broadcast to the base layer network and is currently in one or more base node mempools.
    Broadcast = 1,
    /// This transaction has been mined and included in a block.
    MinedUnconfirmed = 2,
    /// This transaction was generated as part of importing a spendable UTXO
    Imported = 3,
    /// This transaction is still being negotiated by the parties
    Pending = 4,
    /// This is a created Coinbase Transaction
    Coinbase = 5,
    /// This transaction is mined and confirmed at the current base node's height
    MinedConfirmed = 6,
    /// The transaction was rejected by the mempool
    Rejected = 7,
    /// This is faux transaction mainly for one-sided transaction outputs or wallet recovery outputs have been found
    OneSidedUnconfirmed = 8,
    /// All Imported and FauxUnconfirmed transactions will end up with this status when the outputs have been confirmed
    OneSidedConfirmed = 9,
    /// This transaction is still being queued for sending
    Queued = 10,
    /// The transaction was not found by the wallet its in transaction database
    NotFound = 11,
    /// This is Coinbase transaction that is detected from chain
    CoinbaseUnconfirmed = 12,
    /// This is Coinbase transaction that is detected from chain
    CoinbaseConfirmed = 13,
    /// This is Coinbase transaction that is not currently detected as mined
    CoinbaseNotInBlockChain = 14,
}

// We should decide which format we wanna use
impl Serialize for TransactionStatus {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        serializer.serialize_i32(*self as i32)
    }
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
