use std::{path::Path, sync::OnceLock};

use crate::wallet::{wallet_scanner::WalletScanner, wallet_types::WalletEvent};
use async_trait::async_trait;
use std::str::FromStr;
use tari_common::configuration::Network;
use tari_crypto::ristretto::{RistrettoPublicKey, RistrettoSecretKey};
use tari_ootle_common_types::Network as OotleNetwork;
use tari_ootle_wallet_sdk::{apis::stealth_scanner::StealthScannerApi, WalletSdk, WalletSdkConfig};
use tari_ootle_wallet_sdk_services::indexer_jrpc_impl::IndexerJsonRpcNetworkInterface;
use tari_ootle_wallet_storage_sqlite::SqliteWalletStore;
pub struct OotleWalletScanner {
    wallet_sdk: OnceLock<WalletSdk<SqliteWalletStore, IndexerJsonRpcNetworkInterface>>,
}

impl OotleWalletScanner {
    pub fn new() -> Self {
        Self {
            wallet_sdk: OnceLock::new(),
        }
    }
    pub fn init(&self, indexer_url: String, base_path: &Path) -> Result<(), anyhow::Error> {
        let indexer = IndexerJsonRpcNetworkInterface::new(indexer_url);
        let store = SqliteWalletStore::try_open(base_path.join("data/wallet.sqlite"))?;
        store.run_migrations()?;
        let network =
            OotleNetwork::from_str(&Network::get_current().to_string()).expect("Invalid network");
        let sdk_config = WalletSdkConfig {
            network,
            override_keyring_password: None,
        };
        let wallet_sdk = WalletSdk::initialize(store, indexer, sdk_config)?;
        self.wallet_sdk
            .set(wallet_sdk)
            .map_err(|_| anyhow::anyhow!("Wallet SDK already initialized"))?;
        Ok(())
    }
}

#[async_trait]
impl WalletScanner for OotleWalletScanner {
    async fn sync_events(
        &self,
        view_key: &RistrettoSecretKey,
        spend_key: &RistrettoPublicKey,
        last_scanned_height: u64,
        last_scanned_block: Option<&Vec<u8>>,
    ) -> (Vec<WalletEvent>, u64, Vec<u8>) {
        // Implementation goes here
        todo!()
    }
}
