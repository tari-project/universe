use crate::wallet::wallet_scanner::WalletScanner;
use async_trait::async_trait;

pub struct MinotariWalletScanner {}

#[async_trait]
impl WalletScanner for MinotariWalletScanner {}
