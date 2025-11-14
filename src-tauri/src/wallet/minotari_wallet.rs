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
    APPLICATION_FOLDER_ID, UniverseAppState, events_emitter::EventsEmitter, internal_wallet::InternalWallet, tasks_tracker::TasksTrackers, wallet::{minotari_wallet_types::MinotariWalletTransaction, wallet_types::WalletBalance}
};
use log::{error, info, warn};
use minotari_wallet::{
    db::{
        ACCOUNT_CREATION_CHANNEL, BALANCE_CHANGE_CHANNEL, EVENT_CHANNEL, SCANNED_TIP_BLOCK_CHANNEL, get_input_details_for_balance_change_by_id, get_output_details_for_balance_change_by_id
    },
    get_balance, init_db,
    models::BalanceChange,
    scan::{init_with_view_key, scan},
};
use sqlx::{Sqlite, pool::PoolConnection};
use std::{path::PathBuf, sync::{LazyLock, atomic::AtomicBool}};
use tari_common::configuration::Network;
use tari_transaction_components::{MicroMinotari, transaction_components::WalletOutput};
use tauri::{AppHandle, Manager};
use tokio::sync::RwLock;
static LOG_TARGET: &str = "tari::universe::wallet::minotari_wallet_manager";
static INSTANCE: LazyLock<MinotariWalletManager> = LazyLock::new(MinotariWalletManager::new);

static DEFAULT_GRPC_URL: &str = "https://rpc.tari.com";
static DEFAULT_PASSWORD: &str = "test_password";
static DEFAULT_ACCOUNT_ID: i64 = 1; // Default account ID for now

pub struct MinotariWalletManager {
    database_connection: RwLock<Option<PoolConnection<Sqlite>>>,
    was_blockchain_scanned_to_current_height: AtomicBool, // Starts as false, set to true once the blockchain has been scanned so we don't show scanning UI again when block height is updated
    scanning_initiated: AtomicBool, // To prevent multiple scanning initializations
    app_handle: RwLock<Option<AppHandle>>, // Required to access node manager
    // ============== |Data| ==============
    wallet_balance: RwLock<i64>,
    transactions: RwLock<Vec<MinotariWalletTransaction>>,
}

impl MinotariWalletManager {
    pub fn new() -> Self {
        Self {
            database_connection: RwLock::new(None),
            was_blockchain_scanned_to_current_height: AtomicBool::new(false),
            scanning_initiated: AtomicBool::new(false),
            app_handle: RwLock::new(None),
            wallet_balance: RwLock::new(0),
            transactions: RwLock::new(Vec::new()),
        }
    }

    fn get_cached_transactions_path() -> Result<PathBuf, anyhow::Error> {
        let cache_directory_path =
            dirs::cache_dir().ok_or_else(|| anyhow::anyhow!("Failed to get cache directory"))?;
        let cache_directory_path = cache_directory_path
            .join(APPLICATION_FOLDER_ID)
            .join("minotari-wallet")
            .join(
                Network::get_current_or_user_setting_or_default()
                    .to_string()
                    .to_lowercase(),
            )
            .join("transactions_cache.json");
        Ok(cache_directory_path)
    }

    async fn save_transactions_to_cache(transactions: &Vec<MinotariWalletTransaction>) -> Result<(), anyhow::Error> {
        let cache_path = Self::get_cached_transactions_path()?;
        let serialized = serde_json::to_string(transactions)?;
        tokio::fs::create_dir_all(
            cache_path
                .parent()
                .ok_or_else(|| anyhow::anyhow!("Failed to get parent directory of cache path"))?,
        )
        .await?;
        tokio::fs::write(cache_path, serialized).await?;
        Ok(())
    }

    async fn load_transactions_from_cache(&self) -> Result<(), anyhow::Error> {
        let cache_path = Self::get_cached_transactions_path()?;
        if tokio::fs::metadata(&cache_path).await.is_ok() {
            let data = tokio::fs::read_to_string(cache_path).await?;
            let deserialized: Vec<MinotariWalletTransaction> = serde_json::from_str(&data)?;
            let mut transactions_lock = self.transactions.write().await;
            *transactions_lock = deserialized;
            info!(
                target: LOG_TARGET,
                "================ Loaded {} transactions from cache.",
                transactions_lock.len()
            );
        }
        Ok(())
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

    async fn process_balance_change(
        balance_change: BalanceChange,
    )  {
        let new_balance = Self::calculate_balance_from_change(balance_change).await;
        if let Ok(new_balance) = new_balance {
            let mut wallet_balance_lock = INSTANCE.wallet_balance.write().await;
            *wallet_balance_lock = new_balance;
            EventsEmitter::emit_wallet_balance_update(WalletBalance {available_balance: MicroMinotari(new_balance as u64), timelocked_balance: 0.into(), pending_incoming_balance: 0.into(), pending_outgoing_balance: 0.into()}).await;
        }else {
            error!(
                target: LOG_TARGET,
                "Failed to calculate new wallet balance after balance change: {:?}", new_balance.err()
            );
        }
    }

    // Starts with comparing mined_height and effective_date to determine if the records are for the same transaction
    // Then proccess the details, for input transaction fetch the input details to get output id and then fetch output id for it
    // for output transaction fetch the output details directly
    // Finally construct MinotariWalletTransaction and add it to the transactions list and log the details
    async fn process_wallet_transaction(
        balance_change: BalanceChange,
    )  {
        info!(
            target: LOG_TARGET,
            "Processing wallet transaction for balance change: {:?}", balance_change
        );
        use crate::wallet::minotari_wallet_types::{MinotariWalletDetails, MinotariWalletOutputDetails};
        
        let mut database_lock = INSTANCE.database_connection.write().await;
        info!(
            target: LOG_TARGET,
            "Acquired database connection lock for processing wallet transaction"
        );
        let mut transactions_lock = INSTANCE.transactions.write().await;
        info!(
            target: LOG_TARGET,
            "Acquired transactions lock for processing wallet transaction"
        );
        if let Some(conn) = database_lock.as_mut() {
            info!(
                target: LOG_TARGET,
                "Database connection available for processing wallet transaction"
            );
            
            // Fetch output and input details
            let mut received_output_details = None;
            let mut spent_output_details = None;
            
            // If there's an output associated with this balance change (credit)
            if let Some(output_id) = balance_change.caused_by_output_id {
                if let Ok((confirmed_height, status, wallet_output_json)) = 
                    get_output_details_for_balance_change_by_id(conn, output_id).await 
                {
                    if let (Some(status), Some(wallet_output_json_str)) = (status, wallet_output_json) {
                        if let Ok(wallet_output) = serde_json::from_str::<WalletOutput>(&wallet_output_json_str) {
                            received_output_details = Some(MinotariWalletOutputDetails {
                                confirmed_height,
                                status,
                                output_type: wallet_output.features().output_type,
                                coinbase_extra: wallet_output.features().coinbase_extra.to_string(),
                            });
                        }
                    }
                }
            }
            // If there's an input associated with this balance change (debit)
            if let Some(input_id) = balance_change.caused_by_input_id {
                // First get the output_id from the input
                if let Ok(Some(output_id)) = 
                    get_input_details_for_balance_change_by_id(conn, input_id).await 
                {
                    // Then fetch the output details for that output_id
                    if let Ok((confirmed_height, status, wallet_output_json)) = 
                        get_output_details_for_balance_change_by_id(conn, output_id).await 
                    {
                        if let (Some(status), Some(wallet_output_json_str)) = (status, wallet_output_json) {
                            if let Ok(wallet_output) = serde_json::from_str::<WalletOutput>(&wallet_output_json_str) {
                                spent_output_details = Some(MinotariWalletOutputDetails {
                                    confirmed_height,
                                    status,
                                    output_type: wallet_output.features().output_type,
                                    coinbase_extra: wallet_output.features().coinbase_extra.to_string(),
                                });
                            }
                        }
                    }
                }
            }
            let owner_tari_address = InternalWallet::tari_address().await.to_base58();
            let details = MinotariWalletDetails {
                description: balance_change.description.clone(),
                balance_credit: balance_change.balance_credit,
                balance_debit: balance_change.balance_debit,
                claimed_recipient_address: balance_change.claimed_recipient_address.unwrap_or(owner_tari_address.clone()), 
                claimed_sender_address: balance_change.claimed_sender_address.unwrap_or(owner_tari_address),
                memo_parsed: balance_change.memo_parsed.clone(),          
                memo_hex: balance_change.memo_hex.clone(),
                claimed_fee: balance_change.claimed_fee.unwrap_or(0),
                claimed_amount: balance_change.claimed_amount,
                recieved_output_details: received_output_details,
                spent_output_details,
            };
            
            let last_transaction = transactions_lock.last();

            if let Some(last_transaction) = last_transaction {
                info!(target: LOG_TARGET, "Heeeere");
                            // Check if this balance change belongs to the same transaction
            let same_transaction = last_transaction.mined_height == balance_change.effective_height &&
                last_transaction.effective_date == balance_change.effective_date && last_transaction.account_id == balance_change.account_id;
            
            if same_transaction {
                                info!(target: LOG_TARGET, "Heeeere1");
                // Add to existing transaction
                if let Some(transaction) = transactions_lock.last_mut() {
                    transaction.operations.push(details);
                    transaction.credit_balance += balance_change.balance_credit;
                    transaction.debit_balance += balance_change.balance_debit;
                    transaction.transaction_balance += balance_change.balance_credit - balance_change.balance_debit;
                    transaction.is_negative = transaction.debit_balance > transaction.credit_balance;
                    EventsEmitter::emit_wallet_transaction_updated(transaction.clone()).await;
                }
            } else {
                                                info!(target: LOG_TARGET, "Heeeere2");
                // First transaction
                let new_transaction = MinotariWalletTransaction {
                    id: uuid::Uuid::new_v4().to_string(),
                    account_id: balance_change.account_id,
                    operations: vec![details],
                    mined_height: balance_change.effective_height,
                    effective_date: balance_change.effective_date,
                    transaction_balance: balance_change.balance_credit + balance_change.balance_debit, // One of theses fields will be zero at the initialization
                    credit_balance: balance_change.balance_credit,
                    debit_balance: balance_change.balance_debit,
                    is_negative: balance_change.balance_debit > balance_change.balance_credit,
                };
                transactions_lock.push(new_transaction.clone());
                
                info!(
                    target: LOG_TARGET,
                    "💸 New Transaction - Height: {},Date: {}, Credit: {}, Debit: {}, Description: {}",
                    balance_change.effective_height,
                    balance_change.effective_date,
                    balance_change.balance_credit,
                    balance_change.balance_debit,
                    balance_change.description
                );
                EventsEmitter::emit_wallet_transactions_found(vec![new_transaction]).await;
            }
            }else {
                                info!(target: LOG_TARGET, "Heeeere2");
                // First transaction
                let new_transaction = MinotariWalletTransaction {
                    id: uuid::Uuid::new_v4().to_string(),
                    account_id: balance_change.account_id,
                    operations: vec![details],
                    mined_height: balance_change.effective_height,
                    effective_date: balance_change.effective_date,
                    transaction_balance: balance_change.balance_credit + balance_change.balance_debit,
                    credit_balance: balance_change.balance_credit,
                    debit_balance: balance_change.balance_debit,
                    is_negative: balance_change.balance_debit > balance_change.balance_credit,
                };
                transactions_lock.push(new_transaction.clone());
                
                info!(
                    target: LOG_TARGET,
                    "💸 New Transaction - Height: {},Date: {}, Credit: {}, Debit: {}, Description: {}",
                    balance_change.effective_height,
                    balance_change.effective_date,
                    balance_change.balance_credit,
                    balance_change.balance_debit,
                    balance_change.description
                );
                    EventsEmitter::emit_wallet_transactions_found(vec![new_transaction]).await;
            }

            info!(
                target: LOG_TARGET,
                "Saving {} transactions to cache",
                transactions_lock.len()
            );
            Self::save_transactions_to_cache(&transactions_lock).await.unwrap_or_else(|e| {
                error!(
                    target: LOG_TARGET,
                    "Failed to save transactions to cache: {:?}", e
                );
            });
                        info!(
                target: LOG_TARGET,
                "Saved transactions to cache"
            );
        } else {
            error!(
                target: LOG_TARGET,
                "Database connection not available for processing wallet transaction"
            );
        }
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

        // ============== |Load Cached Transactions| ==============
        INSTANCE.load_transactions_from_cache().await?;

        INSTANCE.database_connection.write().await.replace(conn);

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
                                    Self::process_balance_change(change.clone()).await;
                                    Self::process_wallet_transaction(
                                        change,
                                    ).await;

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
