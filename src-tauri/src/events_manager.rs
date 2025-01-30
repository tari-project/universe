use log::error;
use tari_common_types::tari_address::TariAddress;
use tari_core::transactions::tari_amount::MicroMinotari;
use tauri::{AppHandle, Manager};
use tokio::sync::watch::Receiver;

use crate::{
    commands::CpuMinerStatus, events_emitter::EventsEmitter, events_service::EventsService,
    hardware::hardware_status_monitor::GpuDeviceProperties, wallet_adapter::WalletState,
    BaseNodeStatus, GpuMinerStatus, UniverseAppState,
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
        app: &AppHandle,
        wallet_address: TariAddress,
    ) {
        EventsEmitter::emit_wallet_address_update(&app, wallet_address).await;
    }

    pub async fn wait_for_initial_wallet_scan(&self, app: &AppHandle, block_height: u64) {
        let events_service = self.events_service.clone();
        let app = app.clone();
        tokio::spawn(async move {
            match events_service
                .wait_for_wallet_scan(block_height, 1200)
                .await
            {
                Ok(scanned_wallet_state) => match scanned_wallet_state.balance {
                    Some(balance) => EventsEmitter::emit_wallet_balance_update(&app, balance).await,
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

    pub async fn handle_new_block_height(&self, app: &AppHandle, block_height: u64) {
        let app_clone = app.clone();
        let events_service = self.events_service.clone();
        tokio::spawn(async move {
            match events_service.wait_for_wallet_scan(block_height, 20).await {
                Ok(scanned_wallet_state) => match scanned_wallet_state.balance {
                    Some(balance) => {
                        println!(
                            "{} ======================= handle_new_block_height: #{}",
                            chrono::Local::now().format("%H:%M:%S.%f"),
                            block_height
                        );
                        println!(
                            "{} Wallet balance: {:?}",
                            chrono::Local::now().format("%H:%M:%S.%f"),
                            balance
                        );
                        let coinbase_tx = if balance
                            .pending_incoming_balance
                            .gt(&MicroMinotari::zero())
                        {
                            let last_mined_block_height = block_height - 1;
                            println!(
                                "{} Pending incoming balance is greater than zero. Last mined block height: {}",
                                chrono::Local::now().format("%H:%M:%S.%f"),
                                last_mined_block_height
                            );
                            events_service
                                .get_coinbase_transaction_for_last_mined_block(
                                    &app_clone.state::<UniverseAppState>().wallet_manager,
                                    last_mined_block_height,
                                )
                                .await
                        } else {
                            println!(
                                "{} Pending incoming balance is zero.",
                                chrono::Local::now().format("%H:%M:%S.%f")
                            );
                            None
                        };
                        println!(
                            "{} Coinbase transaction: {:?}",
                            chrono::Local::now().format("%H:%M:%S.%f"),
                            coinbase_tx
                        );
                        EventsEmitter::emit_new_block_mined(&app_clone, block_height, coinbase_tx)
                            .await;
                        EventsEmitter::emit_wallet_balance_update(&app_clone, balance.clone())
                            .await;
                        println!(
                            "{} ============== handle_new_block_height done ===============",
                            chrono::Local::now().format("%H:%M:%S.%f")
                        );
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

    pub async fn handle_base_node_update(&self, app: &AppHandle, status: BaseNodeStatus) {
        EventsEmitter::emit_base_node_update(&app, status).await;
    }

    pub async fn handle_connected_peers_update(
        &self,
        app: &AppHandle,
        connected_peers: Vec<String>,
    ) {
        EventsEmitter::emit_connected_peers_update(&app, connected_peers).await;
    }

    pub async fn handle_gpu_devices_update(
        &self,
        app: &AppHandle,
        gpu_devices: Vec<GpuDeviceProperties>,
    ) {
        let gpu_public_devices = gpu_devices
            .iter()
            .map(|gpu_device| gpu_device.public_properties.clone())
            .collect();

        EventsEmitter::emit_gpu_devices_update(&app, gpu_public_devices).await;
    }

    pub async fn handle_cpu_mining_update(&self, app: &AppHandle, status: CpuMinerStatus) {
        EventsEmitter::emit_cpu_mining_update(&app, status).await;
    }

    pub async fn handle_gpu_mining_update(&self, app: &AppHandle, status: GpuMinerStatus) {
        EventsEmitter::emit_gpu_mining_update(&app, status).await;
    }
}
