use std::sync::Arc;

use crate::wallet_adapter::WalletState;
use tokio::sync::{watch::Receiver, RwLock};

const LOG_TARGET: &str = "tari::universe::events_service";

#[derive(Clone)]
pub struct EventsService {
    pub wallet_state_watch_rx: Arc<RwLock<Receiver<Option<WalletState>>>>,
}

impl EventsService {
    pub fn new(wallet_state_watch_rx: Receiver<Option<WalletState>>) -> Self {
        Self {
            wallet_state_watch_rx: Arc::new(RwLock::new(wallet_state_watch_rx)),
        }
    }

    pub async fn wait_for_wallet_scan(
        &self,
        block_height: u64,
        retries_limit: u32,
    ) -> Result<WalletState, anyhow::Error> {
        let mut retries = 0;
        loop {
            let wallet_state = self.wallet_state_watch_rx.read().await.borrow().clone();
            if let Some(wallet_state) = wallet_state {
                if wallet_state.scanned_height >= block_height {
                    return Ok(wallet_state);
                }
            }
            tokio::time::sleep(std::time::Duration::from_millis(500)).await;
            retries += 1;
            if retries >= retries_limit {
                break;
            }
        }
        return Err(anyhow::anyhow!(
            "Exceeded maximum retries waiting for wallet scan"
        ));
    }
}
