use crate::binaries::{Binaries, BinaryResolver};
use crate::process_adapter::{ProcessAdapter, ProcessInstance, StatusMonitor};
use crate::process_utils;
use crate::utils::file_utils::convert_to_string;
use anyhow::Error;
use async_trait::async_trait;
use log::{debug, info, warn};
use minotari_node_grpc_client::grpc::wallet_client::WalletClient;
use minotari_node_grpc_client::grpc::{GetBalanceRequest, GetCompletedTransactionsRequest};
use serde::Serialize;
use std::fs;
use std::path::PathBuf;
use tari_common::configuration::Network;
use tari_common_types::tari_address::{TariAddress, TariAddressError};
use tari_core::transactions::tari_amount::MicroMinotari;
use tari_crypto::ristretto::RistrettoPublicKey;
use tari_shutdown::Shutdown;
use tari_utilities::hex::Hex;
use tokio::select;

const LOG_TARGET: &str = "tari::universe::wallet_adapter";

pub struct WalletAdapter {
    use_tor: bool,
    pub(crate) base_node_public_key: Option<RistrettoPublicKey>,
    pub(crate) base_node_address: Option<String>,
    pub(crate) view_private_key: String,
    pub(crate) spend_key: String,
}

impl WalletAdapter {
    pub fn new(use_tor: bool) -> Self {
        Self {
            use_tor,
            base_node_address: None,
            base_node_public_key: None,
            view_private_key: "".to_string(),
            spend_key: "".to_string(),
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
    ) -> Result<(ProcessInstance, Self::StatusMonitor), Error> {
        // TODO: This was copied from node_adapter. This should be DRY'ed up
        let inner_shutdown = Shutdown::new();
        let shutdown_signal = inner_shutdown.to_signal();

        info!(target: LOG_TARGET, "Starting read only wallet");
        let working_dir = data_dir.join("wallet");
        std::fs::create_dir_all(&working_dir)?;

        let formatted_working_dir = convert_to_string(working_dir.clone())?;
        let formatted_log_dir = convert_to_string(log_dir)?;

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
            format!("--log-path={}", formatted_log_dir),
            "--grpc-enabled".to_string(),
            "--grpc-address".to_string(),
            "/ip4/127.0.0.1/tcp/18141".to_string(),
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
            args.push("wallet.p2p.public_addresses=/ip4/127.0.0.1/tcp/18188".to_string());
            args.push("-p".to_string());
            args.push(
                "wallet.p2p.transport.tcp.listener_address=/ip4/0.0.0.0/tcp/18188".to_string(),
            );

            // todo!()
        }
        Ok((
            ProcessInstance {
                shutdown: inner_shutdown,
                handle: Some(tokio::spawn(async move {
                    let file_path = BinaryResolver::current()
                        .read()
                        .await
                        .resolve_path_to_binary_files(Binaries::Wallet)
                        .await?;

                    // TODO: We have to clear out the p2pool folder every time until setting the base node
                    // doesn't add addresses. E.g
                    // 2024-10-05 20:41:57.275841400 [wallet] [Thread:51648] INFO  Address for base node differs from storage.
                    //  Was /onion3/6oo4ujdz2bpzxhvu7ujgrolmrhkwfixswvuwwkyzdfnhi6e5vts4cdid:18141, /ip4/127.0.0.1/tcp/57805,
                    //  /ip4/127.0.0.1/tcp/56751, /ip4/127.0.0.1/tcp/58004, /ip4/127.0.0.1/tcp/60299, /ip4/127.0.0.1/tcp/59878,
                    //  /ip4/127.0.0.1/tcp/62457, /ip4/127.0.0.1/tcp/62572, /ip4/127.0.0.1/tcp/63599, /ip4/127.0.0.1/tcp/65002, setting to /ip4/127.0.0.1/tcp/53601
                    if let Err(e) = std::fs::remove_dir_all(peer_data_folder) {
                        warn!(target: LOG_TARGET, "Could not clear peer data folder: {}", e);
                    }

                    crate::download_utils::set_permissions(&file_path).await?;
                    let mut child = process_utils::launch_child_process(&file_path, None, &args)?;

                    if let Some(id) = child.id() {
                        std::fs::write(data_dir.join("wallet_pid"), id.to_string())?;
                    }
                    let exit_code;
                    select! {
                        _res = shutdown_signal =>{
                            child.kill().await?;
                            exit_code = 0;
                            // res
                        },
                       res2 = child.wait() => {
                        match res2
                        {
                           Ok(res) => {
                               exit_code = res.code().unwrap_or(0)
                               },
                           Err(e) => {
                               warn!(target: LOG_TARGET, "Error in NodeInstance: {}", e);
                               return Err(e.into());
                           }
                       }
                        },
                    };
                    info!(target: LOG_TARGET, "Stopping minotari wallet");

                    match fs::remove_file(data_dir.join("wallet_pid")) {
                        Ok(_) => {}
                        Err(_e) => {
                            debug!(target: LOG_TARGET, "Could not clear wallet's pid file");
                        }
                    }
                    Ok(exit_code)
                })),
            },
            WalletStatusMonitor {},
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

pub struct WalletStatusMonitor {}

#[async_trait]
impl StatusMonitor for WalletStatusMonitor {
    type Status = ();

    async fn status(&self) -> Result<Self::Status, Error> {
        todo!()
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
    pub direction: i32,
    pub amount: MicroMinotari,
    pub fee: u64,
    pub is_cancelled: bool,
    pub excess_sig: String,
    pub timestamp: u64,
    pub message: String,
    pub payment_id: String,
}

impl WalletStatusMonitor {
    fn wallet_grpc_address(&self) -> String {
        String::from("http://127.0.0.1:18141")
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

    pub async fn get_transaction_history(
        &self,
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

        while let Some(message) = stream
            .message()
            .await
            .map_err(|e| WalletStatusMonitorError::UnknownError(e.into()))?
        {
            let tx = message.transaction.expect("Transaction not found");

            transactions.push(TransactionInfo {
                tx_id: tx.tx_id,
                source_address: tx.source_address.to_hex(),
                dest_address: tx.dest_address.to_hex(),
                status: tx.status,
                direction: tx.direction,
                amount: MicroMinotari(tx.amount),
                fee: tx.fee,
                is_cancelled: tx.is_cancelled,
                excess_sig: tx.excess_sig.to_hex(),
                timestamp: tx.timestamp,
                message: tx.message,
                payment_id: tx.payment_id.to_hex(),
            });
        }
        Ok(transactions)
    }

    #[deprecated(
        note = "Do not use. The view only wallet currently returns an interactive address that is not usable. Remove when grpc has been updated to return correct offline address"
    )]
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
