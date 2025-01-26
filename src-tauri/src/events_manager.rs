use log::error;
use tari_common_types::tari_address::TariAddress;
use tauri::AppHandle;
use tokio::sync::watch::Receiver;

use crate::{
    events_emitter::EventsEmitter, events_service::EventsService, wallet_adapter::WalletState,
};

const LOG_TARGET: &str = "tari::universe::events_manager";

pub struct EventsManager {
    events_service: EventsService,
}

// TODO: Rethink renaming it to ActionsManager?
// TODO: Retnink to make this manager react to FINISHED actions only(handle_...)
// TODO: Limit cloning

impl EventsManager {
    pub fn new(wallet_state_watch_rx: Receiver<Option<WalletState>>) -> Self {
        Self {
            events_service: EventsService::new(wallet_state_watch_rx),
        }
    }

    pub async fn handle_internal_wallet_loaded_or_created(
        &mut self,
        app_handle: AppHandle,
        wallet_address: TariAddress,
    ) {
        EventsEmitter::emit_wallet_address_update(app_handle, wallet_address).await;
    }

    pub async fn wait_for_initial_wallet_scan(&self, app_handle: AppHandle, block_height: u64) {
        let app_handle_clone = app_handle.clone();
        let events_service = self.events_service.clone();
        tokio::spawn(async move {
            match events_service
                .wait_for_wallet_scan(block_height, 1200)
                .await
            {
                Ok(scanned_wallet_state) => match scanned_wallet_state.balance {
                    Some(balance) => {
                        EventsEmitter::emit_wallet_balance_update(app_handle_clone, balance).await
                    }
                    None => {
                        error!(target: LOG_TARGET, "Wallet Balance is None after initial scanning");
                    }
                },
                Err(e) => {
                    error!(target: LOG_TARGET, "Error waiting for wallet scan: {:?}", e);
                }
            };
        });
    }

    pub async fn handle_new_block_height(&self, app_handle: AppHandle, block_height: u64) {
        let app_handle_clone = app_handle.clone();
        let events_service = self.events_service.clone();
        tokio::spawn(async move {
            match events_service.wait_for_wallet_scan(block_height, 20).await {
                Ok(scanned_wallet_state) => match scanned_wallet_state.balance {
                    Some(balance) => {
                        EventsEmitter::emit_wallet_balance_update(app_handle_clone, balance).await;
                    }
                    None => {
                        error!(target: LOG_TARGET, "Wallet balance is None after new block height #{}", block_height);
                    }
                },
                Err(e) => {
                    error!(target: LOG_TARGET, "Error waiting for wallet scan: {:?}", e);
                }
            };
        });
    }
}
