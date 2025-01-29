use log::error;
use tari_common_types::tari_address::TariAddress;
use tari_core::transactions::tari_amount::MicroMinotari;
use tauri::AppHandle;
use tokio::sync::watch::Receiver;

use crate::{
    commands::CpuMinerStatus, events_emitter::EventsEmitter, events_service::EventsService,
    hardware::hardware_status_monitor::GpuDeviceProperties, wallet_adapter::WalletState,
    BaseNodeStatus, GpuMinerStatus,
};

const LOG_TARGET: &str = "tari::universe::events_manager";

pub struct EventsManager {
    events_service: EventsService,
}

impl EventsManager {
    pub fn new(wallet_state_watch_rx: Receiver<Option<WalletState>>) -> Self {
        Self {
            events_service: EventsService::new(wallet_state_watch_rx),
        }
    }

    pub async fn handle_internal_wallet_loaded_or_created(
        &mut self,
        app_handle: &AppHandle,
        wallet_address: TariAddress,
    ) {
        EventsEmitter::emit_wallet_address_update(&app_handle, wallet_address).await;
    }

    pub async fn wait_for_initial_wallet_scan(&self, app_handle: &AppHandle, block_height: u64) {
        let events_service = self.events_service.clone();
        let app_handle = app_handle.clone();
        tokio::spawn(async move {
            match events_service
                .wait_for_wallet_scan(block_height, 1200)
                .await
            {
                Ok(scanned_wallet_state) => match scanned_wallet_state.balance {
                    Some(balance) => {
                        EventsEmitter::emit_wallet_balance_update(&app_handle, balance).await
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

    pub async fn handle_new_block_height(&self, app_handle: &AppHandle, block_height: u64) {
        let app_handle_clone = app_handle.clone();
        let events_service = self.events_service.clone();
        tokio::spawn(async move {
            match events_service.wait_for_wallet_scan(block_height, 20).await {
                Ok(scanned_wallet_state) => match scanned_wallet_state.balance {
                    Some(balance) => {
                        EventsEmitter::emit_wallet_balance_update(
                            &app_handle_clone,
                            balance.clone(),
                        )
                        .await;
                        // TODO: Check coinbase txs
                        if balance.pending_incoming_balance.gt(&MicroMinotari::zero()) {
                            EventsEmitter::emit_new_block_mined(
                                &app_handle_clone,
                                block_height,
                                Some(true),
                            )
                            .await;
                        } else {
                            EventsEmitter::emit_new_block_mined(
                                &app_handle_clone,
                                block_height,
                                None,
                            )
                            .await;
                        }
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

    pub async fn handle_base_node_update(&self, app_handle: &AppHandle, status: BaseNodeStatus) {
        EventsEmitter::emit_base_node_update(&app_handle, status).await;
    }

    pub async fn handle_connected_peers_update(
        &self,
        app_handle: &AppHandle,
        connected_peers: Vec<String>,
    ) {
        EventsEmitter::emit_connected_peers_update(&app_handle, connected_peers).await;
    }

    pub async fn handle_gpu_devices_update(
        &self,
        app_handle: &AppHandle,
        gpu_devices: Vec<GpuDeviceProperties>,
    ) {
        let gpu_public_devices = gpu_devices
            .iter()
            .map(|gpu_device| gpu_device.public_properties.clone())
            .collect();

        EventsEmitter::emit_gpu_devices_update(&app_handle, gpu_public_devices).await;
    }

    pub async fn handle_cpu_mining_update(&self, app_handle: &AppHandle, status: CpuMinerStatus) {
        EventsEmitter::emit_cpu_mining_update(&app_handle, status).await;
    }

    pub async fn handle_gpu_mining_update(&self, app_handle: &AppHandle, status: GpuMinerStatus) {
        EventsEmitter::emit_gpu_mining_update(&app_handle, status).await;
    }
}
