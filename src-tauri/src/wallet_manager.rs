use crate::node_manager::NodeManager;
use crate::node_manager::NodeManagerError;
use crate::process_watcher::ProcessWatcher;
use crate::wallet_adapter::TransactionInfo;
use crate::wallet_adapter::WalletStatusMonitorError;
use crate::wallet_adapter::{WalletAdapter, WalletBalance};
use std::path::PathBuf;
use std::sync::Arc;
use tari_shutdown::ShutdownSignal;
use tokio::sync::RwLock;

#[derive(thiserror::Error, Debug)]
pub enum WalletManagerError {
    #[error("Wallet not started")]
    WalletNotStarted,
    #[error("Node manager error: {0}")]
    NodeManagerError(#[from] NodeManagerError),
    #[error("Unknown error: {0}")]
    UnknownError(#[from] anyhow::Error),
}

pub struct WalletManager {
    watcher: Arc<RwLock<ProcessWatcher<WalletAdapter>>>,
    node_manager: NodeManager,
}

impl Clone for WalletManager {
    fn clone(&self) -> Self {
        Self {
            watcher: self.watcher.clone(),
            node_manager: self.node_manager.clone(),
        }
    }
}

impl WalletManager {
    pub fn new(node_manager: NodeManager) -> Self {
        // TODO: wire up to front end
        let use_tor = false;

        let adapter = WalletAdapter::new(use_tor);
        let process_watcher = ProcessWatcher::new(adapter);

        Self {
            watcher: Arc::new(RwLock::new(process_watcher)),
            node_manager,
        }
    }

    pub async fn ensure_started(
        &self,
        app_shutdown: ShutdownSignal,
        base_path: PathBuf,
        config_path: PathBuf,
        log_path: PathBuf,
    ) -> Result<(), WalletManagerError> {
        self.node_manager.wait_ready().await?;
        let node_identity = self.node_manager.get_identity().await?;
        let base_node_tcp_port = self.node_manager.get_tcp_listener_port().await;

        let mut process_watcher = self.watcher.write().await;
        process_watcher.adapter.base_node_public_key = Some(node_identity.public_key.clone());
        process_watcher.adapter.base_node_address =
            Some(format!("/ip4/127.0.0.1/tcp/{}", base_node_tcp_port));
        process_watcher
            .start(
                app_shutdown,
                base_path,
                config_path,
                log_path,
                crate::binaries::Binaries::Wallet,
            )
            .await?;
        process_watcher.wait_ready().await?;
        Ok(())
    }

    pub async fn set_view_private_key_and_spend_key(
        &self,
        view_private_key: String,
        spend_key: String,
    ) {
        let mut process_watcher = self.watcher.write().await;
        process_watcher.adapter.view_private_key = view_private_key;
        process_watcher.adapter.spend_key = spend_key;
    }

    pub async fn get_balance(&self) -> Result<WalletBalance, WalletManagerError> {
        let process_watcher = self.watcher.read().await;
        process_watcher
            .status_monitor
            .as_ref()
            .ok_or_else(|| WalletManagerError::WalletNotStarted)?
            .get_balance()
            .await
            .map_err(|e| match e {
                WalletStatusMonitorError::WalletNotStarted => WalletManagerError::WalletNotStarted,
                _ => WalletManagerError::UnknownError(e.into()),
            })
    }

    pub async fn get_transaction_history(
        &self,
    ) -> Result<Vec<TransactionInfo>, WalletManagerError> {
        let process_watcher = self.watcher.read().await;
        process_watcher
            .status_monitor
            .as_ref()
            .ok_or_else(|| WalletManagerError::WalletNotStarted)?
            .get_transaction_history()
            .await
            .map_err(|e| match e {
                WalletStatusMonitorError::WalletNotStarted => WalletManagerError::WalletNotStarted,
                _ => WalletManagerError::UnknownError(e.into()),
            })
    }

    pub async fn stop(&self) -> Result<i32, WalletManagerError> {
        let mut process_watcher = self.watcher.write().await;
        process_watcher
            .stop()
            .await
            .map_err(WalletManagerError::UnknownError)
    }

    #[deprecated(
        note = "Do not use. Use internal wallet instead. This address is the address of the view key wallet and not the internal wallet."
    )]
    #[allow(dead_code)]
    pub async fn wallet_address(&self) -> Result<String, WalletManagerError> {
        panic!("Do not use. Use internal wallet instead. This address is the address of the view key wallet and not the internal wallet.");
        // In future the wallet might return the correct address. View only wallets have the same offline address, but different online addresses.
        // But the grpc only returns the online address.

        // let process_watcher = self.watcher.read().await;
        // Ok(process_watcher
        //     .status_monitor
        //     .as_ref()
        //     .ok_or_else(|| WalletManagerError::WalletNotStarted)?
        //     .get_wallet_address()
        //     .await
        //     .map_err(|e| match e {
        //         WalletStatusMonitorError::WalletNotStarted => WalletManagerError::WalletNotStarted,
        //         _ => WalletManagerError::UnknownError(e.into()),
        //     })?
        //     .to_base58())
    }
}
