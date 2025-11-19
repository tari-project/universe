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
    events_emitter::EventsEmitter,
    internal_wallet::{InternalWallet, TariAddressType},
    tasks_tracker::TasksTrackers,
    wallet::{
        minotari_wallet_types::{
            MinotariWalletDetails, MinotariWalletTransaction, WalletOutputFeaturesOnly,
        },
        wallet_types::WalletBalance,
    },
    UniverseAppState, APPLICATION_FOLDER_ID,
};
use log::{error, info, warn};
use minotari_wallet::{
    db::{
        get_all_balance_changes_by_account_id, get_input_details_for_balance_change_by_id,
        get_latest_scanned_tip_block_by_account, get_output_details_for_balance_change_by_id,
        ACCOUNT_CREATION_CHANNEL, BALANCE_CHANGE_CHANNEL, SCANNED_TIP_BLOCK_CHANNEL,
    },
    get_balance, init_db,
    models::BalanceChange,
    scan::{init_with_view_key, scan},
};
use sqlx::{Pool, Sqlite};
use std::{
    str::FromStr,
    sync::{atomic::AtomicBool, LazyLock},
    time::{Duration, SystemTime, UNIX_EPOCH},
};
use tari_common::configuration::Network;
use tari_common_types::tari_address::TariAddress;
use tari_transaction_components::MicroMinotari;
use tauri::{AppHandle, Manager};
use tokio::{sync::RwLock, time::sleep};
static LOG_TARGET: &str = "tari::universe::wallet::minotari_wallet_manager";

#[derive(Clone)]
struct WalletState {
    balance: i64,
    last_known_good_balance: i64,
    last_balance_update: u64, // Unix timestamp
    transactions: Vec<MinotariWalletTransaction>,
}

impl WalletState {
    fn new() -> Self {
        Self {
            balance: 0,
            last_known_good_balance: 0,
            last_balance_update: 0,
            transactions: Vec::new(),
        }
    }

    fn update_balance(&mut self, new_balance: i64) {
        self.last_known_good_balance = self.balance;
        self.balance = new_balance;
        self.last_balance_update = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs();
    }

    fn rollback_balance(&mut self) {
        warn!(
            target: LOG_TARGET,
            "Rolling back balance from {} to last known good: {}",
            self.balance,
            self.last_known_good_balance
        );
        self.balance = self.last_known_good_balance;
    }
}

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
static DEFAULT_ACCOUNT_ID: i64 = 1; // Default account ID for now

// Blockchain scanning constants
const SCAN_BATCH_SIZE: u64 = 1000;
const MAX_CONCURRENT_REQUESTS: LazyLock<u64> = LazyLock::new(|| {
    let network = Network::get_current_or_user_setting_or_default();
    match network {
        Network::MainNet => 50,
        _ => 100,
    }
});

// Connection health check constants
const CONNECTION_HEALTH_CHECK_INTERVAL_SECS: u64 = 60;
const CONNECTION_RETRY_MAX_ATTEMPTS: usize = 3;
const CONNECTION_RETRY_DELAY_MS: u64 = 1000;

pub struct MinotariWalletManager {
    database_pool: RwLock<Option<Pool<Sqlite>>>,
    was_blockchain_scanned_to_current_height: AtomicBool,
    scanning_initiated: AtomicBool,
    app_handle: RwLock<Option<AppHandle>>,
    // ============== |Unified Wallet State| ==============
    wallet_state: RwLock<WalletState>,
    owner_tari_address: RwLock<Option<String>>,
    last_scanned_height: RwLock<u64>,
}

impl MinotariWalletManager {
    pub fn new() -> Self {
        Self {
            database_pool: RwLock::new(None),
            was_blockchain_scanned_to_current_height: AtomicBool::new(false),
            scanning_initiated: AtomicBool::new(false),
            app_handle: RwLock::new(None),
            wallet_state: RwLock::new(WalletState::new()),
            owner_tari_address: RwLock::new(None),
            last_scanned_height: RwLock::new(0),
        }
    }

    pub async fn is_initial_scan_completed() -> bool {
        INSTANCE
            .was_blockchain_scanned_to_current_height
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

        match tari_wallet_type {
            TariAddressType::External => {
                Self::clear_wallet_state().await;

                info!(
                    target: LOG_TARGET,
                    "External wallet import completed. Transactions and balance cleared."
                );

                Ok(())
            }
            TariAddressType::Internal => {
                let new_address = InternalWallet::tari_address().await.to_base58();
                Self::update_owner_address(&new_address).await?;
                Self::clear_wallet_state().await;

                info!(
                    target: LOG_TARGET,
                    "Internal wallet import completed. Owner address updated to: {}. Transactions and balance cleared.",
                    new_address
                );

                Ok(())
            }
        }
    }

    /// Clear the in-memory wallet state (transactions and balance)
    async fn clear_wallet_state() {
        let mut wallet_state = INSTANCE.wallet_state.write().await;
        wallet_state.transactions.clear();
        wallet_state.balance = 0;
        wallet_state.last_known_good_balance = 0;
        wallet_state.last_balance_update = 0;
        drop(wallet_state);

        info!(
            target: LOG_TARGET,
            "In-memory wallet state cleared: transactions and balance reset to 0"
        );

        // Emit events to clear frontend state
        EventsEmitter::emit_wallet_transactions_cleared().await;
        EventsEmitter::emit_wallet_balance_update(WalletBalance {
            available_balance: MicroMinotari(0),
            timelocked_balance: 0.into(),
            pending_incoming_balance: 0.into(),
            pending_outgoing_balance: 0.into(),
        })
        .await;
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
    async fn get_db_connection() -> Result<sqlx::pool::PoolConnection<Sqlite>, anyhow::Error> {
        let pool_lock = INSTANCE.database_pool.read().await;
        let pool = pool_lock
            .as_ref()
            .ok_or_else(|| anyhow::anyhow!("Database pool not initialized"))?;

        for attempt in 1..=CONNECTION_RETRY_MAX_ATTEMPTS {
            match pool.acquire().await {
                Ok(conn) => {
                    log::debug!(target: LOG_TARGET, "Database connection acquired");
                    return Ok(conn);
                }
                Err(e) => {
                    warn!(
                        target: LOG_TARGET,
                        "Failed to acquire database connection (attempt {}/{}): {}",
                        attempt, CONNECTION_RETRY_MAX_ATTEMPTS, e
                    );
                    if attempt < CONNECTION_RETRY_MAX_ATTEMPTS {
                        tokio::time::sleep(tokio::time::Duration::from_millis(
                            CONNECTION_RETRY_DELAY_MS,
                        ))
                        .await;
                    } else {
                        return Err(anyhow::anyhow!(
                            "Failed to acquire database connection after {} attempts",
                            CONNECTION_RETRY_MAX_ATTEMPTS
                        ));
                    }
                }
            }
        }

        Err(anyhow::anyhow!("Failed to acquire database connection"))
    }

    /// Periodic database health check
    async fn start_connection_health_check() {
        let mut shutdown_signal = TasksTrackers::current().wallet_phase.get_signal().await;

        TasksTrackers::current()
            .wallet_phase
            .get_task_tracker()
            .await
            .spawn(async move {
                let mut interval = tokio::time::interval(
                    tokio::time::Duration::from_secs(CONNECTION_HEALTH_CHECK_INTERVAL_SECS)
                );
                loop {
                    tokio::select! {
                        _ = interval.tick() => {
                            match Self::get_db_connection().await {
                                Ok(_) => {
                                    log::debug!(target: LOG_TARGET, "Database connection health check passed");
                                }
                                Err(e) => {
                                    error!(
                                        target: LOG_TARGET,
                                        "Database connection health check failed: {}", e
                                    );
                                    // Log connection status issue
                                    warn!(target: LOG_TARGET, "Database connection unhealthy: {}", e);
                                }
                            }
                        }
                        _ = shutdown_signal.wait() => {
                            info!(target: LOG_TARGET, "Shutdown signal received. Terminating health check.");
                            break;
                        }
                    }
                }
            });
    }

    /// Helper method to check if a balance change belongs to the same transaction
    fn belongs_to_same_transaction(
        transaction: &MinotariWalletTransaction,
        balance_change: &BalanceChange,
        details: &MinotariWalletDetails,
    ) -> bool {
        let is_same_transaction_metadata = transaction.mined_height
            == balance_change.effective_height
            && transaction.effective_date == balance_change.effective_date
            && transaction.account_id == balance_change.account_id;
        let is_incoming_transaction_a_coinbase_one = details
            .recieved_output_details
            .as_ref()
            .map_or(false, |output| {
                output.output_type
                    == tari_transaction_components::transaction_components::OutputType::Coinbase
            });
        is_same_transaction_metadata && !is_incoming_transaction_a_coinbase_one
    }

    /// Helper method to create and emit a new transaction
    async fn create_and_emit_new_transaction(
        balance_change: &BalanceChange,
        details: crate::wallet::minotari_wallet_types::MinotariWalletDetails,
        transactions_lock: &mut Vec<MinotariWalletTransaction>,
    ) {
        let new_transaction = MinotariWalletTransaction {
            id: uuid::Uuid::new_v4().to_string(),
            account_id: balance_change.account_id,
            operations: vec![details],
            mined_height: balance_change.effective_height,
            effective_date: balance_change.effective_date,
            transaction_balance: balance_change
                .balance_credit
                .saturating_add(balance_change.balance_debit),
            credit_balance: balance_change.balance_credit,
            debit_balance: balance_change.balance_debit,
            is_negative: balance_change.balance_debit > balance_change.balance_credit,
            memo_parsed: balance_change.memo_parsed.clone(),
        };

        transactions_lock.push(new_transaction.clone());

        // info!(
        //     target: LOG_TARGET,
        //     "💸 New Transaction - Height: {}, Date: {}, Credit: {}, Debit: {}, Description: {}",
        //     balance_change.effective_height,
        //     balance_change.effective_date,
        //     balance_change.balance_credit,
        //     balance_change.balance_debit,
        //     balance_change.description
        // );

        EventsEmitter::emit_wallet_transactions_found(vec![new_transaction]).await;
    }

    async fn calculate_balance_from_change(
        current_balance: i64,
        balance_change: &BalanceChange,
    ) -> Result<i64, anyhow::Error> {
        let mut new_balance = current_balance as u64;
        new_balance = new_balance
            .checked_add(balance_change.balance_credit)
            .ok_or_else(|| anyhow::anyhow!("Balance overflow when applying balance change"))?;
        new_balance = new_balance
            .checked_sub(balance_change.balance_debit)
            .ok_or_else(|| anyhow::anyhow!("Balance underflow when applying balance change"))?;
        #[allow(clippy::cast_possible_wrap)]
        Ok(new_balance as i64)
    }

    async fn process_balance_change(balance_change: BalanceChange) {
        let mut wallet_state = INSTANCE.wallet_state.write().await;

        match Self::calculate_balance_from_change(wallet_state.balance, &balance_change).await {
            Ok(new_balance) => {
                wallet_state.update_balance(new_balance);

                let balance_to_emit = new_balance;
                drop(wallet_state);

                EventsEmitter::emit_wallet_balance_update(WalletBalance {
                    available_balance: MicroMinotari(balance_to_emit as u64),
                    timelocked_balance: 0.into(),
                    pending_incoming_balance: 0.into(),
                    pending_outgoing_balance: 0.into(),
                })
                .await;
            }
            Err(e) => {
                error!(
                    target: LOG_TARGET,
                    "Failed to calculate new wallet balance after balance change: {}. Using last known good balance.", e
                );
                wallet_state.rollback_balance();

                // Emit last known good balance
                let balance_to_emit = wallet_state.balance;
                drop(wallet_state);

                EventsEmitter::emit_wallet_balance_update(WalletBalance {
                    available_balance: MicroMinotari(balance_to_emit as u64),
                    timelocked_balance: 0.into(),
                    pending_incoming_balance: 0.into(),
                    pending_outgoing_balance: 0.into(),
                })
                .await;
            }
        }
    }

    async fn fetch_balance_change_details(
        conn: &mut sqlx::pool::PoolConnection<Sqlite>,
        balance_change: &BalanceChange,
    ) -> (
        Option<crate::wallet::minotari_wallet_types::MinotariWalletOutputDetails>,
        Option<crate::wallet::minotari_wallet_types::MinotariWalletOutputDetails>,
    ) {
        use crate::wallet::minotari_wallet_types::MinotariWalletOutputDetails;

        let mut received_output_details: Option<MinotariWalletOutputDetails> = None;
        let mut spent_output_details: Option<MinotariWalletOutputDetails> = None;

        // If there's an output associated with this balance change (credit)
        if let Some(output_id) = balance_change.caused_by_output_id {
            match get_output_details_for_balance_change_by_id(conn, output_id).await {
                Ok((confirmed_height, status, wallet_output_json)) => {
                    if let (Some(status), Some(wallet_output_json_str)) =
                        (status, wallet_output_json)
                    {
                        match serde_json::from_str::<WalletOutputFeaturesOnly>(
                            &wallet_output_json_str,
                        ) {
                            Ok(wallet_output) => {
                                received_output_details = Some(MinotariWalletOutputDetails {
                                    confirmed_height,
                                    status,
                                    output_type: wallet_output.features.output_type,
                                    coinbase_extra: wallet_output
                                        .features
                                        .coinbase_extra
                                        .to_string(),
                                });
                            }
                            Err(e) => warn!(
                                target: LOG_TARGET,
                                "Failed to parse wallet output JSON for output {}: {}", output_id, e
                            ),
                        }
                    }
                }
                Err(e) => warn!(
                    target: LOG_TARGET,
                    "Failed to fetch output details for output {}: {}", output_id, e
                ),
            }
        }

        // If there's an input associated with this balance change (debit)
        if let Some(input_id) = balance_change.caused_by_input_id {
            match get_input_details_for_balance_change_by_id(conn, input_id).await {
                Ok(Some(output_id)) => {
                    match get_output_details_for_balance_change_by_id(conn, output_id).await {
                        Ok((confirmed_height, status, wallet_output_json)) => {
                            if let (Some(status), Some(wallet_output_json_str)) =
                                (status, wallet_output_json)
                            {
                                match serde_json::from_str::<WalletOutputFeaturesOnly>(
                                    &wallet_output_json_str,
                                ) {
                                    Ok(wallet_output) => {
                                        spent_output_details = Some(MinotariWalletOutputDetails {
                                            confirmed_height,
                                            status,
                                            output_type: wallet_output.features.output_type,
                                            coinbase_extra: wallet_output
                                                .features
                                                .coinbase_extra
                                                .to_string(),
                                        });
                                    }
                                    Err(e) => warn!(
                                        target: LOG_TARGET,
                                        "Failed to parse wallet output JSON for spent output {}: {}", output_id, e
                                    ),
                                }
                            }
                        }
                        Err(e) => warn!(
                            target: LOG_TARGET,
                            "Failed to fetch output details for spent output via input {}: {}", input_id, e
                        ),
                    }
                }
                Ok(None) => warn!(
                    target: LOG_TARGET,
                    "No output_id found for input {}", input_id
                ),
                Err(e) => warn!(
                    target: LOG_TARGET,
                    "Failed to fetch input details for input {}: {}", input_id, e
                ),
            }
        }

        (received_output_details, spent_output_details)
    }

    async fn get_last_non_coinbase_transaction(
        wallet_state: &mut WalletState,
    ) -> Option<&mut MinotariWalletTransaction> {
        for transaction in wallet_state.transactions.iter_mut().rev() {
            let has_non_coinbase_operation = transaction.operations.iter().any(|op| {
                if let Some(received_details) = &op.recieved_output_details {
                    received_details.output_type
                        != tari_transaction_components::transaction_components::OutputType::Coinbase
                } else {
                    true
                }
            });
            if has_non_coinbase_operation {
                return Some(transaction);
            }
        }
        None
    }

    async fn process_wallet_transaction(balance_change: BalanceChange) -> Result<(), String> {
        use crate::wallet::minotari_wallet_types::MinotariWalletDetails;

        info!(
            target: LOG_TARGET,
            "Processing wallet transaction for balance change at height: {}", balance_change.effective_height
        );

        let mut conn = match Self::get_db_connection().await {
            Ok(conn) => conn,
            Err(e) => {
                error!(target: LOG_TARGET, "Failed to get database connection: {}", e);
                return Err(format!("Database connection error: {}", e));
            }
        };

        let (received_output_details, spent_output_details) =
            Self::fetch_balance_change_details(&mut conn, &balance_change).await;

        // Drop connection to allow other operations
        drop(conn);

        let owner_tari_address = Self::get_owner_address().await;
        let claimed_recipient_address = balance_change
            .claimed_recipient_address
            .as_ref()
            .cloned()
            .unwrap_or_else(|| owner_tari_address.clone());

        let claimed_sender_address = balance_change
            .claimed_sender_address
            .as_ref()
            .cloned()
            .unwrap_or_else(|| owner_tari_address.clone());

        let claimed_recipient_address =
            TariAddress::from_str(&claimed_recipient_address).map_err(|e| e.to_string())?;

        let claimed_sender_address =
            TariAddress::from_str(&claimed_sender_address).map_err(|e| e.to_string())?;

        let details = MinotariWalletDetails {
            description: balance_change.description.clone(),
            balance_credit: balance_change.balance_credit,
            balance_debit: balance_change.balance_debit,
            claimed_recipient_address: claimed_recipient_address.to_base58(),
            claimed_recipient_address_emoji: claimed_recipient_address.to_emoji_string(),
            claimed_sender_address: claimed_sender_address.to_base58(),
            claimed_sender_address_emoji: claimed_sender_address.to_emoji_string(),
            memo_parsed: balance_change.memo_parsed.clone(),
            memo_hex: balance_change.memo_hex.clone(),
            claimed_fee: balance_change.claimed_fee.unwrap_or(0),
            claimed_amount: balance_change.claimed_amount,
            recieved_output_details: received_output_details,
            spent_output_details,
        };

        let mut wallet_state = INSTANCE.wallet_state.write().await;

        // Check if we should append to existing transaction or create new one
        let transaction_to_emit = if let Some(last_transaction) =
            Self::get_last_non_coinbase_transaction(&mut wallet_state).await
        {
            info!(
                target: LOG_TARGET,
                "Last non-coinbase transaction found at height: {}", last_transaction.mined_height
            );
            info!(
                target: LOG_TARGET,
                "Comparing with balance change at height: {}", balance_change.effective_height
            );

            if Self::belongs_to_same_transaction(last_transaction, &balance_change, &details) {
                info!(
                    target: LOG_TARGET,
                    "Appending to existing transaction at height: {}", balance_change.effective_height
                );
                // Add to existing transaction
                last_transaction.operations.push(details.clone());
                last_transaction.credit_balance += balance_change.balance_credit;
                last_transaction.debit_balance += balance_change.balance_debit;
                last_transaction.transaction_balance = last_transaction
                    .credit_balance
                    .abs_diff(last_transaction.debit_balance);
                last_transaction.is_negative =
                    last_transaction.debit_balance > last_transaction.credit_balance;

                Some(last_transaction.clone())
            } else {
                None
            }
        } else {
            None
        };

        if let Some(transaction) = transaction_to_emit {
            drop(wallet_state);
            EventsEmitter::emit_wallet_transaction_updated(transaction).await;
            return Ok(());
        }

        Self::create_and_emit_new_transaction(
            &balance_change,
            details,
            &mut wallet_state.transactions,
        )
        .await;
        drop(wallet_state);
        Ok(())
    }

    pub async fn initialize_wallet() -> Result<(), anyhow::Error> {
        let database_path = Self::database_path().await?;
        let pool = init_db(&database_path).await?;

        // Store the pool
        {
            let mut pool_lock = INSTANCE.database_pool.write().await;
            *pool_lock = Some(pool);
        }

        // Initialize owner address cache
        Self::init_owner_address().await?;

        // Start connection health check
        Self::start_connection_health_check().await;

        let mut conn = Self::get_db_connection().await?;

        // ============= | Check latest block height | ==============

        let latest_scanned_block =
            get_latest_scanned_tip_block_by_account(&mut conn, DEFAULT_ACCOUNT_ID).await?;
        if let Some(block) = latest_scanned_block {
            {
                let mut last_scanned_height_lock = INSTANCE.last_scanned_height.write().await;
                *last_scanned_height_lock = block.height;
            }
        }

        // ============== |Initialize Balance Data| ==============
        let balance = get_balance(&mut conn, DEFAULT_ACCOUNT_ID).await?;
        let initial_balance =
            if let (Some(credits), Some(debits)) = (balance.total_credits, balance.total_debits) {
                credits.saturating_sub(debits)
            } else {
                0
            };

        {
            let mut wallet_state = INSTANCE.wallet_state.write().await;
            wallet_state.update_balance(initial_balance);
        }

        EventsEmitter::emit_wallet_balance_update(WalletBalance {
            available_balance: MicroMinotari(initial_balance as u64),
            timelocked_balance: 0.into(),
            pending_incoming_balance: 0.into(),
            pending_outgoing_balance: 0.into(),
        })
        .await;

        // ============== |Fetch and Process All Balance Changes| ==============

        let balance_changes =
            get_all_balance_changes_by_account_id(&mut conn, DEFAULT_ACCOUNT_ID).await?;
        info!(
            target: LOG_TARGET,
            "Fetched {} balance changes from database", balance_changes.len()
        );

        // Drop connection before processing
        drop(conn);

        for balance_change in &balance_changes {
            info!(
                target: LOG_TARGET,
                "Balance Change - Height: {}, Date: {}, Credit: {}, Debit: {}, Description: {}",
                balance_change.effective_height,
                balance_change.effective_date,
                balance_change.balance_credit,
                balance_change.balance_debit,
                balance_change.description
            );
        }

        // Process all balance changes to rebuild transactions
        for balance_change in balance_changes {
            Self::process_wallet_transaction(balance_change)
                .await
                .unwrap_or_else(|e| {
                    error!(
                        target: LOG_TARGET,
                        "Failed to process wallet transaction for balance change: {}", e
                    );
                });
        }

        let (transaction_count, transactions_to_emit) = {
            let mut wallet_state = INSTANCE.wallet_state.write().await;
            let count = wallet_state.transactions.len();

            // Reverse transactions so newest appear first
            wallet_state.transactions.reverse();
            let transactions = wallet_state.transactions.clone();

            (count, transactions)
        };

        info!(
            target: LOG_TARGET,
            "Processed all balance changes. Total transactions: {}", transaction_count
        );

        EventsEmitter::emit_wallet_transactions_found(transactions_to_emit).await;

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
        Self::listen_to_scanned_tip_blocks().await?;

        let mut shutdown_signal = TasksTrackers::current().wallet_phase.get_signal().await;

        TasksTrackers::current()
            .wallet_phase
            .get_task_tracker()
            .await
            .spawn(async move {
                loop {
                    // Once scanned to current height, prevent constant immediate re-scan
                    if INSTANCE
                        .was_blockchain_scanned_to_current_height
                        .load(std::sync::atomic::Ordering::SeqCst)
                    {
                        sleep(Duration::from_secs(30)).await;
                    }

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
        let tari_address = Self::get_owner_address().await;

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
        .await;

        // get node block height from app state
        if let Some(app_handle) = &*INSTANCE.app_handle.read().await {
            let app_state = app_handle.state::<UniverseAppState>();
            let node_status_watch_rx = app_state.node_status_watch_rx.clone();
            let last_registered_node_status_height = node_status_watch_rx.borrow().block_height;

            let last_scanned_height_lock = INSTANCE.last_scanned_height.write().await;
            if *last_scanned_height_lock >= last_registered_node_status_height {
                INSTANCE
                    .was_blockchain_scanned_to_current_height
                    .store(true, std::sync::atomic::Ordering::SeqCst);
                EventsEmitter::emit_wallet_scanning_progress_update(
                    *last_scanned_height_lock,
                    last_registered_node_status_height,
                    100.0,
                    INSTANCE
                        .was_blockchain_scanned_to_current_height
                        .load(std::sync::atomic::Ordering::SeqCst),
                )
                .await;
            }
        } else {
            warn!(
                target: LOG_TARGET,
                "App handle not set in MinotariWalletManager. Cannot access node manager for blockchain scanning."
            );
        }

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
        let mut shutdown_signal = TasksTrackers::current().wallet_phase.get_signal().await;
        let mut account_creation_receiver = ACCOUNT_CREATION_CHANNEL.1.lock().await;

        TasksTrackers::current()
            .wallet_phase
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
        let mut shutdown_signal = TasksTrackers::current().wallet_phase.get_signal().await;
        let mut balance_change_receiver = BALANCE_CHANGE_CHANNEL.1.lock().await;

        TasksTrackers::current()
            .wallet_phase
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
                                    ).await.unwrap_or_else(|e| {
                                        error!(
                                            target: LOG_TARGET,
                                            "Failed to process wallet transaction for balance change: {}", e
                                        );
                                    });

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

    async fn listen_to_scanned_tip_blocks() -> Result<(), anyhow::Error> {
        let mut shutdown_signal = TasksTrackers::current().wallet_phase.get_signal().await;
        let mut scanned_tip_block_receiver = SCANNED_TIP_BLOCK_CHANNEL.1.lock().await;

        if let Some(app_handle) = &*INSTANCE.app_handle.read().await {
            let app_state = app_handle.state::<UniverseAppState>();
            let node_status_watch_rx = app_state.node_status_watch_rx.clone();

            TasksTrackers::current()
            .wallet_phase
            .get_task_tracker()
            .await
            .spawn(async move {
                loop {
                    let last_registered_node_status_height = node_status_watch_rx.borrow().block_height;

                    tokio::select! {
                        result = scanned_tip_block_receiver.recv() => {
                            match result {
                                Some(block) => {
                                    // info!(
                                    //     target: LOG_TARGET,
                                    //     "New scanned tip block: {:?}", block
                                    // );
                                    // percentage value of block.height / last_registered_node_status_height
                                    let scanned_percentage = if last_registered_node_status_height > 0 {
                                        (block.height as f64 / last_registered_node_status_height as f64) * 100.0
                                    } else {
                                        0.0
                                    };
                                    let scanned_percentage = scanned_percentage.min(100.0);



                                    if last_registered_node_status_height > 0 &&
                                        block.height >= last_registered_node_status_height &&
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
                                        block.height,
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
