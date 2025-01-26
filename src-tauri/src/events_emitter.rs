use log::error;
use serde::Serialize;
use tari_common_types::tari_address::TariAddress;
use tauri::{AppHandle, Emitter};

use crate::wallet_adapter::WalletBalance;

const LOG_TARGET: &str = "tari::universe::events_emitter";

// TODO: Rethink types and structure of events

#[derive(Debug, Serialize, Clone)]
pub enum FrontendEventType {
    WalletAddressUpdate,
    WalletBalanceUpdate,
}

#[derive(Clone, Debug, Serialize)]
struct FrontendEvent<T> {
    event_type: FrontendEventType,
    payload: T,
}

#[derive(Clone, Debug, Serialize)]
struct WalletAddressUpdatePayload {
    tari_address_base58: String,
    tari_address_emoji: String,
}

#[derive(Clone, Debug, Serialize)]
struct WalletBalanceUpdatePayload {
    balance: WalletBalance,
}

pub(crate) struct EventsEmitter;

impl EventsEmitter {
    pub async fn emit_wallet_address_update(app_handle: AppHandle, wallet_address: TariAddress) {
        let event = FrontendEvent {
            event_type: FrontendEventType::WalletAddressUpdate,
            payload: WalletAddressUpdatePayload {
                tari_address_base58: wallet_address.to_base58(),
                tari_address_emoji: wallet_address.to_emoji_string(),
            },
        };
        if let Err(e) = app_handle.emit("frontend_event", event) {
            error!(target: LOG_TARGET, "Failed to emit WalletAddressUpdate event: {:?}", e);
        }
    }

    pub async fn emit_wallet_balance_update(app_handle: AppHandle, balance: WalletBalance) {
        let event = FrontendEvent {
            event_type: FrontendEventType::WalletBalanceUpdate,
            payload: WalletBalanceUpdatePayload {
                balance: balance.clone(),
            },
        };
        if let Err(e) = app_handle.emit("frontend_event", event) {
            error!(target: LOG_TARGET, "Failed to emit WalletBalanceUpdate event: {:?}", e);
        }
    }
}
