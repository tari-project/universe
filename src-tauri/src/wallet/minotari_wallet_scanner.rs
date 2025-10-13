use crate::wallet::{wallet_scanner::WalletScanner, wallet_types::WalletEvent};
use async_trait::async_trait;
use log::info;
use tari_crypto::ristretto::{RistrettoPublicKey, RistrettoSecretKey};

const LOG_TARGET: &str = "tari::universe::wallet::minotari_wallet_scanner";

pub struct MinotariWalletScanner {}

#[async_trait]
impl WalletScanner for MinotariWalletScanner {
    async fn sync_events(
        &self,
        _view_key: &RistrettoSecretKey,
        _spend_key: &RistrettoPublicKey,
        _last_scanned_height: u64,
        _last_scanned_block: Option<&Vec<u8>>,
    ) -> (Vec<WalletEvent>, u64, Vec<u8>) {
        info!(target: LOG_TARGET, "Minotari wallet scanner is not yet implemented");
        todo!()
    }
}
