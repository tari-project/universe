use crate::node_manager::NodeManager;
use crate::process_watcher::ProcessWatcher;
use crate::wallet_adapter::{WalletAdapter, WalletBalance};
use std::path::PathBuf;
use std::sync::Arc;
use tari_shutdown::ShutdownSignal;
use tokio::sync::RwLock;

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
        let mut use_tor = true;

        // Unix systems have built in tor.
        // TODO: Add tor service for windows.
        if cfg!(target_os = "windows") {
            use_tor = false;
        }

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
        log_path: PathBuf,
    ) -> Result<(), anyhow::Error> {
        self.node_manager.wait_ready().await?;
        let node_identity = self.node_manager.get_identity().await?;

        let mut process_watcher = self.watcher.write().await;
        process_watcher.adapter.base_node_public_key = Some(node_identity.public_key.clone());
        process_watcher.adapter.base_node_address = Some("/ip4/127.0.0.1/tcp/9998".to_string());
        process_watcher
            .start(app_shutdown, base_path, log_path)
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

    pub async fn get_balance(&self) -> Result<WalletBalance, anyhow::Error> {
        let process_watcher = self.watcher.read().await;
        process_watcher
            .status_monitor
            .as_ref()
            .ok_or_else(|| anyhow::anyhow!("Wallet not started"))?
            .get_balance()
            .await
    }
}
