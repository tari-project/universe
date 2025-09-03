use async_trait::async_trait;
use tari_crypto::ristretto::{RistrettoPublicKey, RistrettoSecretKey};

use crate::wallet::wallet_types::WalletEvent;

#[async_trait]
pub trait WalletScanner {
    async fn sync_events(
        &self,
        view_key: &RistrettoSecretKey,
        spend_key: &RistrettoPublicKey,
        last_scanned_height: u64,
        last_scanned_block: Option<&Vec<u8>>,
    ) -> (Vec<WalletEvent>, u64, Vec<u8>);
}
