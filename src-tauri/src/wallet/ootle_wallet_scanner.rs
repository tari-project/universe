use crate::wallet::{wallet_scanner::WalletScanner, wallet_types::WalletEvent};
use async_trait::async_trait;
use tari_crypto::ristretto::{RistrettoPublicKey, RistrettoSecretKey};
use tari_ootle_wallet_sdk::apis::stealth_scanner::StealthScannerApi;

pub struct OotleWalletScanner {
    indexer_url: String,
    stealth_scanner: StealthScannerApi<SqliteWalletStore, IndexerJrpcImpl>
}

impl OotleWalletScanner {
    pub fn new(indexer_url: String, sqlite_store_address: String) -> Self {
        let indexer_jrpc = IndexerJrpcImpl::new(indexer_url.clone());
        let wallet_store = SqliteWalletStore::new(sqlite_store_address);
        let stealth_scanner = StealthScannerApi::new(wallet_store, indexer_jrpc);
        let key_manager_api = KeyManagerApi::new(wallet_store.clone());
        

        Self { indexer_url, stealth_scanner }
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
