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

pub mod balance_change_processor;
pub mod database_listeners;
pub mod database_manager;
pub mod minotari_wallet_types;

use crate::{
    events_emitter::EventsEmitter,
    internal_wallet::{InternalWallet, TariAddressType},
    tasks_tracker::TasksTrackers,
    wallet::minotari_wallet::{
        balance_change_processor::{
            types::BalanceChangeProcessorEmitStrategy, BalanceChangeProcessor,
        },
        database_manager::{MinotariWalletDatabaseManager, DEFAULT_ACCOUNT_ID},
    },
    UniverseAppState,
};
use log::{error, info, warn};
use minotari_wallet::{
    db::{
        get_all_balance_changes_by_account_id, get_latest_scanned_tip_block_by_account,
        AccountBalance,
    },
    get_balance,
    models::BalanceChange,
    scan::{init_with_view_key, scan},
};
use std::{
    sync::{atomic::AtomicBool, LazyLock},
    time::Duration,
};
use tari_common::configuration::Network;
use tauri::{AppHandle, Manager};
use tokio::{sync::RwLock, time::sleep};
static LOG_TARGET: &str = "tari::universe::wallet::minotari_wallet_manager";

static INSTANCE: LazyLock<MinotariWalletManager> = LazyLock::new(MinotariWalletManager::new);

static DEFAULT_GRPC_URL: LazyLock<String> = LazyLock::new(|| {
    let network = Network::get_current_or_user_setting_or_default();
    let http_api_url = match network {
        Network::MainNet => "https://rpc.tari.com",
        Network::StageNet => "https://rpc.stagenet.tari.com",
        Network::NextNet => "https://rpc.nextnet.tari.com",
        Network::LocalNet => "https://rpc.localnet.tari.com",
        Network::Igor => "https://rpc.igor.tari.com",
        Network::Esmeralda => "https://rpc.esmeralda.tari.com",
    };
    http_api_url.to_string()
});
static DEFAULT_PASSWORD: &str = "test_password";

// Blockchain scanning constants
const SCAN_BATCH_SIZE: u64 = 1000;
static MAX_CONCURRENT_REQUESTS: LazyLock<u64> = LazyLock::new(|| {
    let network = Network::get_current_or_user_setting_or_default();
    match network {
        Network::MainNet => 50,
        _ => 100,
    }
});

pub struct MinotariWalletManager {
    database_manager: MinotariWalletDatabaseManager,
    balance_change_processor: RwLock<BalanceChangeProcessor>,
    are_there_more_blocks_to_scan: AtomicBool,
    scanning_initiated: AtomicBool,
    app_handle: RwLock<Option<AppHandle>>,
    // ============== |Unified Wallet State| ==============
    last_scanned_height: RwLock<u64>,
    owner_tari_address: RwLock<Option<String>>, // Cached currently used Tari address for reducing number of lookups
}

impl MinotariWalletManager {
    pub fn new() -> Self {
        Self {
            database_manager: MinotariWalletDatabaseManager::new(),
            balance_change_processor: RwLock::new(BalanceChangeProcessor::new(
                BalanceChangeProcessorEmitStrategy::FullyProcessed,
            )),
            are_there_more_blocks_to_scan: AtomicBool::new(true),
            scanning_initiated: AtomicBool::new(false),
            app_handle: RwLock::new(None),

            owner_tari_address: RwLock::new(None),
            last_scanned_height: RwLock::new(0),
        }
    }

    pub async fn is_syncing() -> bool {
        INSTANCE
            .scanning_initiated
            .load(std::sync::atomic::Ordering::SeqCst)
            && INSTANCE
                .are_there_more_blocks_to_scan
                .load(std::sync::atomic::Ordering::SeqCst)
    }

    pub async fn load_app_handle(app_handle: AppHandle) {
        let mut handle_lock = INSTANCE.app_handle.write().await;
        *handle_lock = Some(app_handle);
    }

    /// Initialize and cache the owner Tari address
    async fn init_owner_address() -> Result<(), anyhow::Error> {
        let address = InternalWallet::tari_address().await.to_base58();
        let mut owner_address_lock = INSTANCE.owner_tari_address.write().await;
        *owner_address_lock = Some(address);
        Ok(())
    }

    pub async fn update_owner_address(new_address: &str) -> Result<(), anyhow::Error> {
        let mut owner_address_lock = INSTANCE.owner_tari_address.write().await;
        *owner_address_lock = Some(new_address.to_string());
        Ok(())
    }

    pub async fn handle_side_effects_after_wallet_import(
        tari_wallet_type: TariAddressType,
    ) -> Result<(), anyhow::Error> {
        info!(
            target: LOG_TARGET,
            "Handling side effects after wallet import for wallet type: {:?}", tari_wallet_type
        );

        if tari_wallet_type == TariAddressType::Internal {
            let new_address = InternalWallet::tari_address().await.to_base58();
            Self::update_owner_address(&new_address).await?;
        }
        INSTANCE
            .balance_change_processor
            .write()
            .await
            .clear_stored_transactions()
            .await;
        INSTANCE
            .balance_change_processor
            .write()
            .await
            .clear_current_balance()
            .await;
        INSTANCE
            .balance_change_processor
            .write()
            .await
            .update_emit_strategy(BalanceChangeProcessorEmitStrategy::FullyProcessed);

        info!(
            target: LOG_TARGET,
            "Wallet import side effects handled. Transactions and balance cleared."
        );
        Ok(())
    }

    /// Get cached owner address or fetch if not cached
    async fn get_owner_address() -> String {
        let owner_address_lock = INSTANCE.owner_tari_address.read().await;
        if let Some(address) = owner_address_lock.as_ref() {
            return address.clone();
        }
        drop(owner_address_lock);

        // Not cached, initialize it
        let _unused = Self::init_owner_address().await;
        INSTANCE
            .owner_tari_address
            .read()
            .await
            .as_ref()
            .cloned()
            .unwrap_or_else(|| {
                error!(target: LOG_TARGET, "Failed to get owner Tari address");
                String::new()
            })
    }

    /// Acquire database connection with retry logic
    async fn get_db_connection() -> Result<sqlx::pool::PoolConnection<sqlx::Sqlite>, anyhow::Error>
    {
        INSTANCE.database_manager.get_connection().await
    }

    /// Get the latest scanned tip block for an account
    async fn get_latest_scanned_tip_block(
        account_id: i64,
    ) -> Result<Option<minotari_wallet::models::ScannedTipBlock>, anyhow::Error> {
        let mut conn = Self::get_db_connection().await?;
        get_latest_scanned_tip_block_by_account(&mut conn, account_id)
            .await
            .map_err(|e| e.into())
    }

    /// Get balance for an account
    async fn get_account_balance(account_id: i64) -> Result<AccountBalance, anyhow::Error> {
        let mut conn = Self::get_db_connection().await?;
        get_balance(&mut conn, account_id)
            .await
            .map_err(|e| e.into())
    }

    /// Get all balance changes for an account
    async fn get_all_balance_changes(account_id: i64) -> Result<Vec<BalanceChange>, anyhow::Error> {
        let mut conn = Self::get_db_connection().await?;
        get_all_balance_changes_by_account_id(&mut conn, account_id)
            .await
            .map_err(|e| e.into())
    }

    async fn process_balance_change(balance_change: BalanceChange) {
        INSTANCE
            .balance_change_processor
            .write()
            .await
            .process_balance_change(&balance_change)
            .await;
    }

    async fn process_wallet_transaction(balance_change: BalanceChange) -> Result<(), String> {
        INSTANCE
            .balance_change_processor
            .write()
            .await
            .process_wallet_transaction(
                balance_change,
                &mut Self::get_db_connection().await.map_err(|e| e.to_string())?,
                INSTANCE
                    .are_there_more_blocks_to_scan
                    .load(std::sync::atomic::Ordering::SeqCst),
            )
            .await
            .map_err(|e| e.to_string())?;

        Ok(())
    }

    pub async fn initialize_wallet() -> Result<(), anyhow::Error> {
        let database_path = MinotariWalletDatabaseManager::database_path()?;

        // Initialize database
        INSTANCE.database_manager.initialize(&database_path).await?;

        // Initialize owner address cache
        Self::init_owner_address().await?;

        // Start connection health check
        INSTANCE.database_manager.start_health_check().await;

        // ============= | Check latest block height | ==============

        let latest_scanned_block = Self::get_latest_scanned_tip_block(DEFAULT_ACCOUNT_ID).await?;
        if let Some(block) = latest_scanned_block {
            {
                let mut last_scanned_height_lock = INSTANCE.last_scanned_height.write().await;
                *last_scanned_height_lock = block.height;
                info!(
                    target: LOG_TARGET,
                    "Latest scanned tip block height from database: {}", block.height
                );
            }
        }

        // ============== |Initialize Balance Data| ==============
        let balance = Self::get_account_balance(DEFAULT_ACCOUNT_ID).await?;
        INSTANCE
            .balance_change_processor
            .write()
            .await
            .initialize_balance_from_account_balance(balance)
            .await;
        // ============== |Fetch and Process All Balance Changes| ==============

        let balance_changes = Self::get_all_balance_changes(DEFAULT_ACCOUNT_ID).await?;
        info!(
            target: LOG_TARGET,
            "Fetched {} balance changes from database", balance_changes.len()
        );

        // for balance_change in &balance_changes {
        //     info!(
        //         target: LOG_TARGET,
        //         "Balance Change - Height: {}, Date: {}, Credit: {}, Debit: {}, Description: {}",
        //         balance_change.effective_height,
        //         balance_change.effective_date,
        //         balance_change.balance_credit,
        //         balance_change.balance_debit,
        //         balance_change.description
        //     );
        // }
        let database_connection = &mut Self::get_db_connection().await?;

        INSTANCE
            .balance_change_processor
            .write()
            .await
            .initial_transaction_processing(balance_changes, database_connection)
            .await?;

        // let (transaction_count, transactions_to_emit) = {
        //     let mut wallet_state = INSTANCE.wallet_state.write().await;
        //     let count = wallet_state.transactions.len();

        //     // Reverse transactions so newest appear first
        //     wallet_state.transactions.reverse();
        //     let transactions = wallet_state.transactions.clone();

        //     (count, transactions)
        // };

        // info!(
        //     target: LOG_TARGET,
        //     "Processed all balance changes. Total transactions: {}", transaction_count
        // );

        // EventsEmitter::emit_wallet_transactions_found(transactions_to_emit).await;

        Ok(())
    }

    /// Temporary callback function for balance changes
    async fn on_balance_change(change: minotari_wallet::models::BalanceChange) {
        Self::process_wallet_transaction(change.clone())
            .await
            .unwrap_or_else(|e| {
                error!(
                    target: LOG_TARGET,
                    "Failed to process wallet transaction for balance change: {}",
                    e
                );
            });
        Self::process_balance_change(change).await;
    }

    /// Temporary callback function for scanned tip blocks
    async fn on_scanned_tip_block(block: minotari_wallet::models::ScannedTipBlock) {
        {
            let last_scanned_height_lock = INSTANCE.last_scanned_height.read().await;
            // info!(
            //     target: LOG_TARGET,
            //     "Received scanned tip block height: {}. Last scanned height: {}",
            //     block.height,
            //     *last_scanned_height_lock
            // );
            if block.height <= *last_scanned_height_lock {
                return;
            }
        }

        if let Some(app_handle) = &*INSTANCE.app_handle.read().await {
            let app_state: tauri::State<'_, UniverseAppState> =
                app_handle.state::<UniverseAppState>();
            let node_status_watch_rx = app_state.node_status_watch_rx.clone();
            let last_registered_node_status_height = node_status_watch_rx.borrow().block_height;

            // Calculate scanning percentage
            let scanned_percentage = if last_registered_node_status_height > 0 {
                (block.height as f64 / last_registered_node_status_height as f64) * 100.0
            } else {
                0.0
            };
            let scanned_percentage = scanned_percentage.min(100.0);

            info!(
                target: LOG_TARGET,
                "Scanned tip block height: {}. Node reported height: {}. Scanned percentage: {:.2}%",
                block.height,
                last_registered_node_status_height,
                scanned_percentage
            );

            EventsEmitter::emit_wallet_scanning_progress_update(
                block.height,
                last_registered_node_status_height,
                scanned_percentage,
                INSTANCE
                    .are_there_more_blocks_to_scan
                    .load(std::sync::atomic::Ordering::SeqCst),
            )
            .await;

            {
                let mut last_scanned_height_lock = INSTANCE.last_scanned_height.write().await;
                *last_scanned_height_lock = block.height;
            }
        } else {
            warn!(
                target: LOG_TARGET,
                "App handle not set in MinotariWalletManager. Cannot access node manager for blockchain scanning."
            );
        }
    }

    pub async fn initialize_blockchain_scanning() -> Result<(), anyhow::Error> {
        let database_path = MinotariWalletDatabaseManager::database_path()?;

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

        database_listeners::listen_to_balance_changes(Self::on_balance_change).await?;
        database_listeners::listen_to_scanned_tip_blocks(Self::on_scanned_tip_block).await?;

        let mut shutdown_signal = TasksTrackers::current().wallet_phase.get_signal().await;

        TasksTrackers::current()
            .wallet_phase
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
        let database_path = MinotariWalletDatabaseManager::database_path()?;
        let tari_address = Self::get_owner_address().await;

        if !INSTANCE
            .are_there_more_blocks_to_scan
            .load(std::sync::atomic::Ordering::SeqCst)
        {
            info!(
                target: LOG_TARGET,
                "No more blocks to scan. Waiting with next blockchain scan."
            );
            sleep(Duration::from_secs(30)).await;
        }

        let scan_result = tokio::task::spawn_blocking(move || {
            tokio::runtime::Handle::current().block_on(scan(
                DEFAULT_PASSWORD,
                DEFAULT_GRPC_URL.as_str(),
                &database_path,
                Some(tari_address.as_str()),
                SCAN_BATCH_SIZE,
                *MAX_CONCURRENT_REQUESTS,
            ))
        })
        .await?;

        match scan_result {
            Ok((_events, more_blocks)) => {
                info!(
                    target: LOG_TARGET,
                    "Blockchain scan executed successfully."
                );
                INSTANCE
                    .are_there_more_blocks_to_scan
                    .store(more_blocks, std::sync::atomic::Ordering::SeqCst);
                if !more_blocks {
                    info!(
                        target: LOG_TARGET,
                        "Blockchain scan completed. No more blocks to scan."
                    );
                    let last_scanned_height = *INSTANCE.last_scanned_height.read().await;
                    EventsEmitter::emit_wallet_scanning_progress_update(
                        last_scanned_height,
                        last_scanned_height,
                        100.0,
                        false,
                    )
                    .await;
                }
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

    pub async fn import_view_key() -> Result<(), anyhow::Error> {
        let tari_wallet_details = InternalWallet::tari_wallet_details().await;
        if let Some(details) = tari_wallet_details {
            let database_path = MinotariWalletDatabaseManager::database_path()?;
            let tari_address = Self::get_owner_address().await;

            init_with_view_key(
                &details.view_private_key_hex,
                &details.spend_public_key_hex,
                DEFAULT_PASSWORD,
                database_path.as_str(),
                details.wallet_birthday,
                Some(tari_address.as_str()),
            )
            .await?;

            Ok(())
        } else {
            Err(anyhow::anyhow!("Tari wallet details not found"))
        }
    }
}
