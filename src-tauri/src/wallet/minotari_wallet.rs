// Copyright 2025. The Tari Project
//
// Redistribution and use in source and binary forms, with or without modification, are permitted provided that the
// following conditions are met:
//
// 1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following
// disclaimer.
//
// 2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the
// following disclaimer in the documentation and/or other materials provided with the distribution.
//
// 3. Neither the name of the copyright holder nor the names of its contributors may be used to endorse or promote
// products derived from this software without specific prior written permission.
//
// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES,
// INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
// DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
// SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
// SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
// WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE
// USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

use crate::{
    events_emitter::EventsEmitter, internal_wallet::InternalWallet, tasks_tracker::TasksTrackers,
    wallet::wallet_types::WalletBalance, UniverseAppState, APPLICATION_FOLDER_ID,
};
use log::{error, info, warn};
use minotari_wallet::{
    db::{
        ACCOUNT_CREATION_CHANNEL, BALANCE_CHANGE_CHANNEL, EVENT_CHANNEL, SCANNED_TIP_BLOCK_CHANNEL,
    },
    get_balance, init_db,
    models::BalanceChange,
    scan::{init_with_view_key, scan},
};
use std::sync::{atomic::AtomicBool, LazyLock};
use tari_common::configuration::Network;
use tari_transaction_components::MicroMinotari;
use tauri::{AppHandle, Manager};
use tokio::sync::RwLock;
static LOG_TARGET: &str = "tari::universe::wallet::minotari_wallet_manager";
static INSTANCE: LazyLock<MinotariWalletManager> = LazyLock::new(MinotariWalletManager::new);

static DEFAULT_GRPC_URL: &str = "https://rpc.tari.com";
static DEFAULT_PASSWORD: &str = "test_password";
static DEFAULT_ACCOUNT_ID: i64 = 1; // Default account ID for now

pub struct MinotariWalletManager {
    was_blockchain_scanned_to_current_height: AtomicBool, // Starts as false, set to true once the blockchain has been scanned so we don't show scanning UI again when block height is updated
    scanning_initiated: AtomicBool, // To prevent multiple scanning initializations
    app_handle: RwLock<Option<AppHandle>>, // Required to access node manager
    // ============== |Cached Data| ==============
    wallet_balance: RwLock<i64>,
}

impl MinotariWalletManager {
    pub fn new() -> Self {
        Self {
            was_blockchain_scanned_to_current_height: AtomicBool::new(false),
            scanning_initiated: AtomicBool::new(false),
            app_handle: RwLock::new(None),
            wallet_balance: RwLock::new(0),
        }
    }

    pub async fn load_app_handle(app_handle: AppHandle) {
        let mut handle_lock = INSTANCE.app_handle.write().await;
        *handle_lock = Some(app_handle);
    }

    async fn calculate_balance_from_change(
        balance_change: BalanceChange,
    ) -> Result<i64, anyhow::Error> {
        let mut current_balance = *INSTANCE.wallet_balance.read().await as u64;
        current_balance = current_balance
            .checked_add(balance_change.balance_credit)
            .ok_or_else(|| anyhow::anyhow!("Balance overflow when applying balance change"))?;
        current_balance = current_balance
            .checked_sub(balance_change.balance_debit)
            .ok_or_else(|| anyhow::anyhow!("Balance underflow when applying balance change"))?;
        #[allow(clippy::cast_possible_wrap)]
        let current_balance = current_balance as i64;
        Ok(current_balance)
    }

    pub async fn initialize_wallet() -> Result<(), anyhow::Error> {
        let sqlite_connection = init_db(Self::database_path().await?.as_str()).await?;
        let mut conn = sqlite_connection.acquire().await?;

        // ============== |Initialize Balance Data| ==============
        let balance = get_balance(&mut *conn, DEFAULT_ACCOUNT_ID).await?;
        {
            let mut wallet_balance_lock = INSTANCE.wallet_balance.write().await;
            if let (Some(credits), Some(debits)) = (balance.total_credits, balance.total_debits) {
                *wallet_balance_lock = credits.saturating_sub(debits);
            } else {
                *wallet_balance_lock = 0;
            }
        }

        Ok(())
    }

    pub async fn initialize_blockchain_scanning() -> Result<(), anyhow::Error> {
        let database_path = Self::database_path().await?;

        if INSTANCE
            .scanning_initiated
            .load(std::sync::atomic::Ordering::SeqCst)
        {
            info!(
                target: LOG_TARGET,
                "Blockchain scanning has already been initiated, skipping initialization."
            );
            return Ok(());
        }

        INSTANCE
            .scanning_initiated
            .store(true, std::sync::atomic::Ordering::SeqCst);

        info!(
            target: LOG_TARGET,
            "Starting blockchain scan for Minotari wallet at database path: {}", database_path
        );

        Self::listen_to_account_updates().await?;
        Self::listen_to_balance_changes().await?;
        Self::listen_to_events().await?;
        Self::listen_to_scanned_tip_blocks().await?;

        let mut shutdown_signal = TasksTrackers::current().common.get_signal().await;

        TasksTrackers::current()
            .common
            .get_task_tracker()
            .await
            .spawn(async move {
                loop {
                    tokio::select! {
                        result = Self::execute_blockchain_scan() => {
                            match result {
                                Ok(_) => {
                                    info!(
                                        target: LOG_TARGET,
                                        "Blockchain scan completed successfully."
                                    );
                                }
                                Err(e) => {
                                    error!(
                                        target: LOG_TARGET,
                                        "Blockchain scan failed: {:?}", e
                                    );
                                }
                            }
                        }
                        _ = shutdown_signal.wait() => {
                            info!(
                                target: LOG_TARGET,
                                "Shutdown signal received. Terminating blockchain scan."
                            );
                            break;
                        }
                    }
                }
            });

        Ok(())
    }

    async fn execute_blockchain_scan() -> Result<(), anyhow::Error> {
        let database_path = Self::database_path().await?;
        info!(
            target: LOG_TARGET,
            "Executing blockchain scan for Minotari wallet at database path: {}", database_path
        );

        
        let scan_result = tokio::task::spawn_blocking(move || {
            tokio::runtime::Handle::current().block_on(scan(
                DEFAULT_PASSWORD,
                DEFAULT_GRPC_URL,
                database_path.as_str(),
                None,
                1000,
                50, // do not go over 50 as it may cause timeouts in wallet scanning logic
            ))
        })
        .await?;

        match scan_result {
            Ok(_) => {
                info!(
                    target: LOG_TARGET,
                    "Blockchain scan executed successfully."
                );
            }
            Err(e) => {
                warn!(
                    target: LOG_TARGET,
                    "Blockchain scan execution failed: {:?}", e
                );
            }
        };

        Ok(())
    }

    async fn listen_to_account_updates() -> Result<(), anyhow::Error> {
        // use ACCOUT_CREATION_CHANNEL
        let mut shutdown_signal = TasksTrackers::current().common.get_signal().await;
        let mut account_creation_receiver = ACCOUNT_CREATION_CHANNEL.1.lock().await;

        TasksTrackers::current()
            .common
            .get_task_tracker()
            .await
            .spawn(async move {
                loop {
                    tokio::select! {
                        result = account_creation_receiver.recv() => {
                            match result {
                                Some(account) => {
                                    info!(
                                        target: LOG_TARGET,
                                        "New account created: {:?}", account
                                    );
                                }
                                None => {
                                    warn!(
                                        target: LOG_TARGET,
                                        "Account creation channel closed."
                                    );
                                }
                            }
                        }
                        _ = shutdown_signal.wait() => {
                            info!(
                                target: LOG_TARGET,
                                "Shutdown signal received. Terminating account listener."
                            );
                            break;
                        }
                    }
                }
            });

        Ok(())
    }

    async fn listen_to_balance_changes() -> Result<(), anyhow::Error> {
        // use BALANCE_CHANGE_CHANNEL
        let mut shutdown_signal = TasksTrackers::current().common.get_signal().await;
        let mut balance_change_receiver = BALANCE_CHANGE_CHANNEL.1.lock().await;

        TasksTrackers::current()
            .common
            .get_task_tracker()
            .await
            .spawn(async move {
                loop {
                    tokio::select! {
                        result = balance_change_receiver.recv() => {
                            match result {
                                Some(change) => {
                                    info!(
                                        target: LOG_TARGET,
                                        "New balance change: {:?}", change
                                    );
                                    let new_balance = MinotariWalletManager::calculate_balance_from_change(change.clone()).await;
                                    match new_balance {
                                        Ok(balance) => {
                                            {
                                                let mut wallet_balance_lock = INSTANCE.wallet_balance.write().await;
                                                *wallet_balance_lock = balance;
                                                EventsEmitter::emit_wallet_balance_update(WalletBalance {available_balance: MicroMinotari(balance as u64), timelocked_balance: 0.into(), pending_incoming_balance: 0.into(), pending_outgoing_balance: 0.into()}).await;
                                            }
                                        }
                                        Err(e) => {
                                            error!(
                                                target: LOG_TARGET,
                                                "Failed to calculate new wallet balance from change {:?}: {:?}", change, e
                                            );
                                        }
                                    }

                                }
                                None => {
                                    warn!(
                                        target: LOG_TARGET,
                                        "Balance change channel closed."
                                    );
                                }
                            }
                        }
                        _ = shutdown_signal.wait() => {
                            info!(
                                target: LOG_TARGET,
                                "Shutdown signal received. Terminating balance change listener."
                            );
                            break;
                        }
                    }
                }
            });

        Ok(())
    }

    async fn listen_to_events() -> Result<(), anyhow::Error> {
        // use EVENT_CHANNEL
        let mut shutdown_signal = TasksTrackers::current().common.get_signal().await;
        let mut event_receiver = EVENT_CHANNEL.1.lock().await;

        TasksTrackers::current()
            .common
            .get_task_tracker()
            .await
            .spawn(async move {
                loop {
                    tokio::select! {
                        result = event_receiver.recv() => {
                            match result {
                                Some(event) => {
                                    info!(
                                        target: LOG_TARGET,
                                        "New wallet event: {:?}", event
                                    );
                                }
                                None => {
                                    warn!(
                                        target: LOG_TARGET,
                                        "Event channel closed."
                                    );
                                }
                            }
                        }
                        _ = shutdown_signal.wait() => {
                            info!(
                                target: LOG_TARGET,
                                "Shutdown signal received. Terminating event listener."
                            );
                            break;
                        }
                    }
                }
            });

        Ok(())
    }

    async fn listen_to_scanned_tip_blocks() -> Result<(), anyhow::Error> {
        // use SCANNED_TIP_BLOCK_CHANNEL
        let mut shutdown_signal = TasksTrackers::current().common.get_signal().await;
        let mut scanned_tip_block_receiver = SCANNED_TIP_BLOCK_CHANNEL.1.lock().await;

        if let Some(app_handle) = &*INSTANCE.app_handle.read().await {
            let app_state = app_handle.state::<UniverseAppState>();
            let node_status_watch_rx = app_state.node_status_watch_rx.clone();
            let last_node_status = *node_status_watch_rx.borrow();

            TasksTrackers::current()
            .common
            .get_task_tracker()
            .await
            .spawn(async move {
                loop {
                    let last_registered_node_status_height = last_node_status.block_height;

                    tokio::select! {
                        result = scanned_tip_block_receiver.recv() => {
                            match result {
                                Some(block) => {
                                    info!(
                                        target: LOG_TARGET,
                                        "New scanned tip block: {:?}", block
                                    );
                                    // percentage value of block.height / last_registered_node_status_height
                                    let scanned_percentage = if last_registered_node_status_height > 0 {
                                        (block.height as f64 / last_registered_node_status_height as f64) * 100.0
                                    } else {
                                        0.0
                                    };
                                    let scanned_percentage = scanned_percentage.min(100.0);



                                    if last_registered_node_status_height > 0 &&
                                        block.height as u64 >= last_registered_node_status_height &&
                                        !INSTANCE.was_blockchain_scanned_to_current_height.load(std::sync::atomic::Ordering::SeqCst)
                                    {
                                        info!(
                                            target: LOG_TARGET,
                                            "Blockchain has been scanned up to the node's block height: {}. Marking scanning as complete.",
                                            last_registered_node_status_height
                                        );
                                        INSTANCE.was_blockchain_scanned_to_current_height.store(true, std::sync::atomic::Ordering::SeqCst);
                                        
                                    }

                                    EventsEmitter::emit_wallet_scanning_progress_update(
                                        block.height as u64,
                                        last_registered_node_status_height,
                                        scanned_percentage,
                                        INSTANCE.was_blockchain_scanned_to_current_height.load(std::sync::atomic::Ordering::SeqCst),
                                    ).await;

                                }
                                None => {
                                    warn!(
                                        target: LOG_TARGET,
                                        "Scanned tip block channel closed."
                                    );
                                }
                            }
                        }
                        _ = shutdown_signal.wait() => {
                            info!(
                                target: LOG_TARGET,
                                "Shutdown signal received. Terminating scanned tip block listener."
                            );
                            break;
                        }
                    }
                }
            });
        } else {
            warn!(
                target: LOG_TARGET,
                "App handle not set in MinotariWalletManager. Cannot access node manager for blockchain scanning."
            );
        }
        Ok(())
    }

    pub async fn import_view_key() -> Result<(), anyhow::Error> {
        let tari_wallet_details = InternalWallet::tari_wallet_details().await;
        if let Some(details) = tari_wallet_details {
            let database_path = Self::database_path().await?;

            init_with_view_key(
                &details.view_private_key_hex,
                &details.spend_public_key_hex,
                DEFAULT_PASSWORD,
                database_path.as_str(),
                details.wallet_birthday,
            )
            .await?;

            Ok(())
        } else {
            Err(anyhow::anyhow!("Tari wallet details not found"))
        }
    }

    async fn database_path() -> Result<String, anyhow::Error> {
        let data_directory_path =
            dirs::data_dir().ok_or_else(|| anyhow::anyhow!("Failed to get cache directory"))?;

        let binary_folder_path = data_directory_path
            .join(APPLICATION_FOLDER_ID)
            .join("minotari-wallet")
            .join(
                Network::get_current_or_user_setting_or_default()
                    .to_string()
                    .to_lowercase(),
            )
            .join("wallet.db");

        if let Some(string_path) = binary_folder_path.to_str() {
            Ok(string_path.to_string())
        } else {
            Err(anyhow::anyhow!("Failed to convert database path to string"))
        }
    }
}
