use crate::binary_resolver::{Binaries, BinaryResolver};
use crate::process_adapter::{ProcessAdapter, ProcessInstance, StatusMonitor};
use anyhow::Error;
use async_trait::async_trait;
use log::{debug, info, warn};
use minotari_node_grpc_client::grpc::wallet_client::WalletClient;
use minotari_node_grpc_client::grpc::GetBalanceRequest;
use serde::Serialize;
use std::fs;
use std::path::PathBuf;
use tari_core::transactions::tari_amount::MicroMinotari;
use tari_crypto::ristretto::RistrettoPublicKey;
use tari_shutdown::Shutdown;
use tari_utilities::hex::Hex;
use tokio::runtime::Handle;
use tokio::select;
use tokio::task::JoinHandle;

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
    type Instance = WalletInstance;
    type StatusMonitor = WalletStatusMonitor;
    fn spawn_inner(
        &self,
        data_dir: PathBuf,
    ) -> Result<(Self::Instance, Self::StatusMonitor), Error> {
        // TODO: This was copied from node_adapter. This should be DRY'ed up
        let inner_shutdown = Shutdown::new();
        let shutdown_signal = inner_shutdown.to_signal();

        info!(target: LOG_TARGET, "Starting read only wallet");
        let working_dir = data_dir.join("wallet");
        std::fs::create_dir_all(&working_dir)?;

        let mut args: Vec<String> = vec![
            "-b".to_string(),
            working_dir.to_str().unwrap().to_string(),
            "--password".to_string(),
            "asjhfahjajhdfvarehnavrahuyg28397823yauifh24@@$@84y8".to_string(), // TODO: Maybe use a random password per machine
            "--view-private-key".to_string(),
            self.view_private_key.clone(),
            "--spend-key".to_string(),
            self.spend_key.clone(),
            "--non-interactive-mode".to_string(),
            "--grpc-enabled".to_string(),
            "--grpc-address".to_string(),
            "/ip4/127.0.0.1/tcp/18141".to_string(),
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
        if !self.use_tor {
            // TODO: This is a bit of a hack. You have to specify a public address for the node to bind to.
            // In future we should change the base node to not error if it is tcp and doesn't have a public address
            args.push("-p".to_string());
            args.push("wallet.p2p.transport.type=tcp".to_string());
            args.push("-p".to_string());
            args.push("wallet.p2p.public_addresses=/ip4/172.2.3.4/tcp/18188".to_string());
            args.push("-p".to_string());
            args.push(
                "wallet.p2p.transport.tcp.listener_address=/ip4/0.0.0.0/tcp/18188".to_string(),
            );
            // todo!()
        } else {
            args.push("-p".to_string());
            args.push("wallet.p2p.transport.tor.proxy_bypass_for_outbound_tcp=false".to_string())
        }
        Ok((
            WalletInstance {
                shutdown: inner_shutdown,
                handle: Some(tokio::spawn(async move {
                    let file_path = BinaryResolver::current()
                        .resolve_path(Binaries::Wallet)
                        .await?;
                    crate::download_utils::set_permissions(&file_path).await?;
                    let mut child = tokio::process::Command::new(file_path)
                        .args(args)
                        // .stdout(std::process::Stdio::piped())
                        // .stderr(std::process::Stdio::piped())
                        .kill_on_drop(true)
                        .spawn()?;

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
                    println!("Stopping minotari node");

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

pub struct WalletInstance {
    pub shutdown: Shutdown,
    handle: Option<JoinHandle<Result<i32, anyhow::Error>>>,
}

#[async_trait]
impl ProcessInstance for WalletInstance {
    fn ping(&self) -> bool {
        self.handle
            .as_ref()
            .map(|m| !m.is_finished())
            .unwrap_or_else(|| false)
    }

    async fn stop(&mut self) -> Result<i32, Error> {
        self.shutdown.trigger();
        let handle = self.handle.take();
        let res = handle.unwrap().await??;
        Ok(res)
    }
}

impl Drop for WalletInstance {
    fn drop(&mut self) {
        println!("Drop being called");
        self.shutdown.trigger();
        if let Some(handle) = self.handle.take() {
            Handle::current().block_on(async move {
                let _ = handle.await.unwrap().map_err(|e| {
                    warn!(target: LOG_TARGET, "Error stopping wallet: {:?}", e);
                    e
                });
            });
        }
    }
}

pub struct WalletStatusMonitor {}

impl StatusMonitor for WalletStatusMonitor {}

#[derive(Debug, Serialize)]
pub struct WalletBalance {
    pub available_balance: MicroMinotari,
    pub timelocked_balance: MicroMinotari,
    pub pending_incoming_balance: MicroMinotari,
    pub pending_outgoing_balance: MicroMinotari,
}
impl WalletStatusMonitor {
    pub async fn get_balance(&self) -> Result<WalletBalance, anyhow::Error> {
        let mut client = WalletClient::connect("http://127.0.0.1:18141").await?;
        let res = client.get_balance(GetBalanceRequest {}).await?;
        let res = res.into_inner();

        Ok(WalletBalance {
            available_balance: MicroMinotari(res.available_balance),
            timelocked_balance: MicroMinotari(res.timelocked_balance),
            pending_incoming_balance: MicroMinotari(res.pending_incoming_balance),
            pending_outgoing_balance: MicroMinotari(res.pending_outgoing_balance),
        })
    }
}
