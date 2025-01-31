use log::{error, warn};
use std::sync::Arc;

use crate::{
    wallet_adapter::{TransactionInfo, WalletState},
    wallet_manager::WalletManager,
};
use tokio::sync::watch::Receiver;

const LOG_TARGET: &str = "tari::universe::events_service";

#[derive(Clone)]
pub struct EventsService {
    pub wallet_state_watch_rx: Arc<Receiver<Option<WalletState>>>,
}

impl EventsService {
    pub fn new(wallet_state_watch_rx: Receiver<Option<WalletState>>) -> Self {
        Self {
            wallet_state_watch_rx: Arc::new(wallet_state_watch_rx),
        }
    }

    pub async fn wait_for_wallet_scan(
        &self,
        block_height: u64,
        retries_limit: u32,
    ) -> Result<WalletState, anyhow::Error> {
        let mut retries = 0;
        let mut wallet_state_watch_rx = (*self.wallet_state_watch_rx).clone();
        loop {
            if wallet_state_watch_rx.changed().await.is_err() {
                error!(target: LOG_TARGET, "Failed to receive wallet_state_watch_rx");
                break;
            }
            if let Some(wallet_state) = wallet_state_watch_rx.borrow().clone() {
                if wallet_state.scanned_height >= block_height {
                    return Ok(wallet_state);
                }

                if wallet_state.scanned_height == 0 && retries > 2 {
                    warn!(target: LOG_TARGET, "Initial wallet scan completed before the wallet grpc server started");
                    return Ok(wallet_state);
                }
            }
            retries += 1;
            if retries >= retries_limit {
                break;
            }
        }
        Err(anyhow::anyhow!(
            "Exceeded maximum retries waiting for wallet scan"
        ))
    }

    pub async fn get_coinbase_transaction_for_last_mined_block(
        &self,
        wallet_manager: &WalletManager,
        current_block_height: u64,
    ) -> Option<TransactionInfo> {
        match wallet_manager
            .get_coinbase_transactions(false, Some(1))
            .await
        {
            Ok(mut txs) => {
                if let Some(tx) = txs.pop() {
                    if tx.mined_in_block_height == current_block_height {
                        return Some(tx);
                    }
                }
                None
            }
            Err(e) => {
                error!(target: LOG_TARGET, "Failed to get latest coinbase transaction: {:?}", e);
                None
            }
        }
    }
}
