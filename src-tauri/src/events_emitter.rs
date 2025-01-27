use log::error;
use serde::Serialize;
use tari_common_types::tari_address::TariAddress;
use tauri::{AppHandle, Emitter};

use crate::{
    commands::CpuMinerStatus, hardware::hardware_status_monitor::PublicDeviceProperties, wallet_adapter::WalletBalance, BaseNodeStatus, GpuMinerStatus
};

const LOG_TARGET: &str = "tari::universe::events_emitter";

// TODO: Rethink types and structure of events

#[derive(Debug, Serialize, Clone)]
pub enum FrontendEventType {
    WalletAddressUpdate,
    WalletBalanceUpdate,
    BaseNodeUpdate,
    GpuDevicesUpdate,
    CpuMiningUpdate,
    GpuMiningUpdate,
    ConnectedPeersUpdate,
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
            payload: balance,
        };
        if let Err(e) = app_handle.emit("frontend_event", event) {
            error!(target: LOG_TARGET, "Failed to emit WalletBalanceUpdate event: {:?}", e);
        }
    }

    pub async fn emit_base_node_update(app_handle: AppHandle, status: BaseNodeStatus) {
        let event = FrontendEvent {
            event_type: FrontendEventType::BaseNodeUpdate,
            payload: status,
        };
        if let Err(e) = app_handle.emit("frontend_event", event) {
            error!(target: LOG_TARGET, "Failed to emit BaseNodeUpdate event: {:?}", e);
        }
    }

    pub async fn emit_gpu_devices_update(
        app_handle: AppHandle,
        gpu_public_devices: Vec<PublicDeviceProperties>,
    ) {
        let event = FrontendEvent {
            event_type: FrontendEventType::GpuDevicesUpdate,
            payload: gpu_public_devices,
        };
        if let Err(e) = app_handle.emit("frontend_event", event) {
            error!(target: LOG_TARGET, "Failed to emit GpuDevicesUpdate event: {:?}", e);
        }
    }

    pub async fn emit_cpu_mining_update(app_handle: AppHandle, status: CpuMinerStatus) {
        let event = FrontendEvent {
            event_type: FrontendEventType::CpuMiningUpdate,
            payload: status,
        };
        if let Err(e) = app_handle.emit("frontend_event", event) {
            error!(target: LOG_TARGET, "Failed to emit CpuMiningUpdate event: {:?}", e);
        }
    }

    pub async fn emit_gpu_mining_update(app_handle: AppHandle, status: GpuMinerStatus) {
        let event = FrontendEvent {
            event_type: FrontendEventType::GpuMiningUpdate,
            payload: status,
        };
        if let Err(e) = app_handle.emit("frontend_event", event) {
            error!(target: LOG_TARGET, "Failed to emit GpuMiningUpdate event: {:?}", e);
        }
    }

    pub async fn emit_connected_peers_update(app_handle: AppHandle, connected_peers: Vec<String>) {
        let event = FrontendEvent {
            event_type: FrontendEventType::ConnectedPeersUpdate,
            payload: connected_peers,
        };
        if let Err(e) = app_handle.emit("frontend_event", event) {
            error!(target: LOG_TARGET, "Failed to emit ConnectedPeersUpdate event: {:?}", e);
        }
    }
}
