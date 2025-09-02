use crate::wallet::wallet_scanner::WalletScanner;
use async_trait::async_trait;

pub struct OotleWalletScanner {}

#[async_trait]
impl WalletScanner for OotleWalletScanner {}
