use std::sync::Arc;
use log::error;

use crate::wallet_adapter::WalletState;
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
}
