use crate::wallet::{wallet_scanner::WalletScanner, wallet_types::WalletEvent};
use async_trait::async_trait;
use tari_crypto::ristretto::{RistrettoPublicKey, RistrettoSecretKey};

pub struct OotleWalletScanner {}

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
