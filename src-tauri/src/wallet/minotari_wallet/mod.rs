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

pub mod balance_tracker;
pub mod database_manager;
pub mod transaction;

pub static LOG_TARGET: &str = "tari::universe::wallet::minotari_wallet";

use crate::{
    LOG_TARGET_STATUSES, UniverseAppState,
    events_emitter::EventsEmitter,
    internal_wallet::{InternalWallet, TariAddressType},
    tasks_tracker::TasksTrackers,
    wallet::minotari_wallet::{
        balance_tracker::BalanceTracker,
        database_manager::{DEFAULT_ACCOUNT_ID, MinotariWalletDatabaseManager},
        transaction::TransactionManager,
    },
};
use log::{error, info};
use minotari_wallet::{
    DisplayedTransaction, ProcessingEvent, ScanMode, ScanStatusEvent, Scanner,
    TransactionHistoryService,
    db::{
        AccountBalance, get_all_balance_changes_by_account_id,
        get_latest_scanned_tip_block_by_account,
    },
    get_balance,
    models::BalanceChange,
    tasks::unlocker::TransactionUnlocker,
    transactions::one_sided_transaction::Recipient,
    utils::init_wallet::init_with_view_key,
};
use r2d2::PooledConnection;
use r2d2_sqlite::SqliteConnectionManager;
use std::{
    collections::HashMap,
    path::{Path, PathBuf},
    sync::{
        LazyLock,
        atomic::{AtomicBool, Ordering},
    },
    time::{Duration, Instant},
};
use tari_common::configuration::Network;
use tari_common_types::tari_address::TariAddress;
use tari_common_types::transaction::TxId;
use tauri::{AppHandle, Manager};
use tokio::sync::RwLock;
use tokio::task::JoinHandle;
use tokio_util::sync::CancellationToken;

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
static REQUIRED_CONFIRMATIONS: u64 = 3;

// Blockchain scanning constants
const SCAN_BATCH_SIZE: u64 = 25;
const SCAN_POLL_INTERVAL_SECS: u64 = 30;
const PROGRESS_UPDATE_INTERVAL_SECS: u64 = 5;

pub struct MinotariWalletManager {
    database_manager: MinotariWalletDatabaseManager,
    app_handle: RwLock<Option<AppHandle>>,
    cancel_token: RwLock<Option<CancellationToken>>,
    // ============== |Unified Wallet State| ==============
    last_scanned_height: RwLock<u64>,
    owner_tari_address: RwLock<Option<String>>,
    /// Indicates if initial sync is complete (first Completed event received)
    initial_sync_complete: AtomicBool,
    /// Stores pending transactions by their sent_output_hashes for matching with scanned transactions
    /// Key: comma-separated sorted output hashes, Value: DisplayedTransaction
    pending_transactions: RwLock<HashMap<TxId, DisplayedTransaction>>,
    last_progress_emit_time: RwLock<Instant>,
    unlocker_handle: RwLock<Option<JoinHandle<Result<(), anyhow::Error>>>>,
}

impl MinotariWalletManager {
    pub fn new() -> Self {
        Self {
            database_manager: MinotariWalletDatabaseManager::new(),
            app_handle: RwLock::new(None),
            cancel_token: RwLock::new(None),
            owner_tari_address: RwLock::new(None),
            last_scanned_height: RwLock::new(0),
            initial_sync_complete: AtomicBool::new(false),
            pending_transactions: RwLock::new(HashMap::new()),
            last_progress_emit_time: RwLock::new(
                Instant::now() - Duration::from_secs(PROGRESS_UPDATE_INTERVAL_SECS),
            ),
            unlocker_handle: RwLock::new(None),
        }
    }

    /// Returns true if wallet is currently performing initial sync (catching up to chain tip).
    /// Returns false once the first sync completes and we're just polling for new blocks.
    pub async fn is_syncing() -> bool {
        let scan_running = INSTANCE.cancel_token.read().await.is_some();
        let initial_complete = INSTANCE.initial_sync_complete.load(Ordering::SeqCst);

        // We're syncing if scan is running AND initial sync hasn't completed yet
        scan_running && !initial_complete
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

    pub async fn send_one_sided_transaction(
        address: String,
        amount: u64,
        payment_id: Option<String>,
    ) -> Result<DisplayedTransaction, anyhow::Error> {
        info!(
            "Sending one-sided transaction to address: {}, amount: {}",
            address, amount
        );
        let tari_address = Self::get_owner_address().await;
        let mut transaction_manager = TransactionManager::new(
            INSTANCE.database_manager.get_pool().await?,
            Self::get_owner_address().await,
        )
        .await?;

        let recipient: Recipient = Recipient {
            address: TariAddress::from_base58(&address)?,
            amount: amount.into(),
            payment_id,
        };

        info!(
            "Creating one-sided transaction from {} to {} for amount {}",
            tari_address, address, amount
        );
        let unsigned_one_sided_transaction = transaction_manager
            .create_one_sided_transaction(recipient)
            .await?;

        info!("Signing one-sided transaction...");

        let signed_transaction = transaction_manager
            .sign_one_sided_transaction(
                INSTANCE
                    .app_handle
                    .read()
                    .await
                    .as_ref()
                    .ok_or_else(|| anyhow::anyhow!("App handle not set"))?,
                unsigned_one_sided_transaction,
            )
            .await?;

        info!("Finalizing and broadcasting one-sided transaction...");

        let displayed_transaction = transaction_manager
            .finalize_one_sided_transaction(signed_transaction)
            .await?;

        // Store as pending transaction for later matching with scanned transactions
        Self::store_pending_transaction(&displayed_transaction).await;

        // Emit to frontend immediately so user sees the pending transaction
        EventsEmitter::emit_wallet_transactions_found(vec![displayed_transaction.clone()]).await;

        info!("One-sided transaction sent successfully.");
        Ok(displayed_transaction)
    }

    /// Store a pending transaction for later matching with scanned transactions
    async fn store_pending_transaction(tx: &DisplayedTransaction) {
        let mut pending = INSTANCE.pending_transactions.write().await;
        pending.insert(tx.id, tx.clone());
        info!(
            target:
            LOG_TARGET,
            "Stored pending transaction with id: {}", tx.id
        );
    }

    /// Try to find and remove a pending transaction that matches the given output hashes
    /// Returns the pending transaction if found
    async fn match_and_remove_pending_transaction(tx_id: &TxId) -> Option<DisplayedTransaction> {
        let mut pending = INSTANCE.pending_transactions.write().await;
        let result = pending.remove(tx_id);
        if result.is_some() {
            info!(
                target: LOG_TARGET,
                "Matched and removed pending transaction with id: {}", tx_id
            );
        }
        result
    }

    /// Clear all pending transactions (e.g., on wallet import)
    pub async fn clear_pending_transactions() {
        let mut pending = INSTANCE.pending_transactions.write().await;
        pending.clear();
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

        // Clear balance tracker
        BalanceTracker::current().clear().await;

        // Clear pending transactions since we're starting fresh with new wallet
        Self::clear_pending_transactions().await;

        // Reset initial sync state since we're starting fresh with new wallet
        INSTANCE
            .initial_sync_complete
            .store(false, Ordering::SeqCst);

        info!(
            target: LOG_TARGET,
            "Wallet import side effects handled. Transactions, balance, and pending transactions cleared."
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
    async fn get_db_connection() -> Result<PooledConnection<SqliteConnectionManager>, anyhow::Error>
    {
        INSTANCE.database_manager.get_connection().await
    }

    /// Get the latest scanned tip block for an account
    async fn get_latest_scanned_tip_block(
        account_id: i64,
    ) -> Result<Option<minotari_wallet::models::ScannedTipBlock>, anyhow::Error> {
        let conn = Self::get_db_connection().await?;
        get_latest_scanned_tip_block_by_account(&conn, account_id).map_err(|e| e.into())
    }

    /// Get balance for an account
    pub async fn get_account_balance(account_id: i64) -> Result<AccountBalance, anyhow::Error> {
        let conn = Self::get_db_connection().await?;
        get_balance(&conn, account_id).map_err(|e| e.into())
    }

    /// Get all balance changes for an account
    #[allow(dead_code)]
    async fn get_all_balance_changes(account_id: i64) -> Result<Vec<BalanceChange>, anyhow::Error> {
        let conn = Self::get_db_connection().await?;
        get_all_balance_changes_by_account_id(&conn, account_id).map_err(|e| e.into())
    }

    pub async fn initialize_wallet() -> Result<(), anyhow::Error> {
        let database_path = MinotariWalletDatabaseManager::database_path()?;

        // Initialize database
        INSTANCE.database_manager.initialize(&database_path).await?;

        // Initialize owner address cache
        Self::init_owner_address().await?;

        // Start connection health check
        INSTANCE.database_manager.start_health_check().await;

        if let Err(e) = Self::run_transaction_unlocker().await {
            error!(target: LOG_TARGET, "Failed to start transaction unlocker: {:?}", e);
        }

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
        BalanceTracker::current()
            .initialize_from_account_balance(balance)
            .await;

        // ============== |Fetch and Process All Balance Changes| ==============

        // Use TransactionHistoryService to load and process transaction history
        let db_pool = INSTANCE.database_manager.get_pool().await?;
        let history_service = TransactionHistoryService::new(db_pool);

        match history_service.load_transactions_excluding_reorged(DEFAULT_ACCOUNT_ID) {
            Ok(transactions) => {
                info!(
                    target: LOG_TARGET,
                    "Loaded {} transactions from history (excluding reorged) via TransactionHistoryService", transactions.len()
                );

                // Emit transactions to frontend
                EventsEmitter::emit_wallet_transactions_found(transactions).await;
            }
            Err(e) => {
                error!(
                    target: LOG_TARGET,
                    "Failed to load transaction history: {:?}", e
                );
            }
        }

        Ok(())
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // Blockchain Scanning
    // ─────────────────────────────────────────────────────────────────────────────

    pub async fn initialize_blockchain_scanning() -> Result<(), anyhow::Error> {
        // Check if already running
        if INSTANCE.cancel_token.read().await.is_some() {
            info!(
                target: LOG_TARGET,
                "Blockchain scanning already running, skipping initialization."
            );
            return Ok(());
        }

        let database_path = MinotariWalletDatabaseManager::database_path()?;
        let tari_address = Self::get_owner_address().await;

        info!(
            target: LOG_TARGET,
            "Starting blockchain scan for Minotari wallet at database path: {}", database_path
        );

        // Create cancellation token
        let cancel_token = CancellationToken::new();
        *INSTANCE.cancel_token.write().await = Some(cancel_token.clone());

        // Get shutdown signal for graceful termination
        let mut shutdown_signal = TasksTrackers::current().wallet_phase.get_signal().await;
        let cancel_token_for_shutdown = cancel_token.clone();
        let cancel_token_for_scan = cancel_token.clone();

        let database_path_buf = PathBuf::from(database_path);

        tokio::spawn(async move {
            let (event_rx, scan_future) = Scanner::new(
                DEFAULT_PASSWORD,
                DEFAULT_GRPC_URL.as_str(),
                database_path_buf,
                SCAN_BATCH_SIZE,
                REQUIRED_CONFIRMATIONS,
            )
            .account(&tari_address)
            .mode(ScanMode::Continuous {
                poll_interval: Duration::from_secs(SCAN_POLL_INTERVAL_SECS),
            })
            .cancel_token(cancel_token_for_scan.clone())
            .run_with_events();

            // Process events and run scan concurrently
            tokio::select! {
                _ = Self::process_scan_events(event_rx) => {
                    info!(target: LOG_TARGET_STATUSES, "Scan event processing completed.");
                }
                result = scan_future => {
                    match result {
                        Ok(_) => {
                            info!(target: LOG_TARGET_STATUSES, "Blockchain scan completed successfully.");
                        }
                        Err(e) => {
                            error!(target: LOG_TARGET, "Blockchain scan failed: {:?}", e);
                        }
                    }
                }
            }

            // Ensure token is cancelled when done
            cancel_token_for_scan.cancel();
        });

        // Spawn shutdown listener task
        TasksTrackers::current()
            .wallet_phase
            .get_task_tracker()
            .await
            .spawn(async move {
                shutdown_signal.wait().await;
                info!(target: LOG_TARGET, "Shutdown signal received. Cancelling scan.");
                cancel_token_for_shutdown.cancel();
                *INSTANCE.cancel_token.write().await = None;
            });

        Ok(())
    }

    #[allow(dead_code)]
    pub async fn stop_scanning() {
        if let Some(token) = INSTANCE.cancel_token.write().await.take() {
            token.cancel();
            // Reset initial sync state when scanning is stopped
            INSTANCE
                .initial_sync_complete
                .store(false, Ordering::SeqCst);
            info!(target: LOG_TARGET, "Blockchain scanning stopped.");
        }
    }

    async fn process_scan_events(mut rx: tokio::sync::mpsc::UnboundedReceiver<ProcessingEvent>) {
        while let Some(event) = rx.recv().await {
            match event {
                ProcessingEvent::ScanStatus(status) => {
                    Self::handle_status_event(status).await;
                }
                ProcessingEvent::BlockProcessed(_block_event) => {}
                ProcessingEvent::TransactionsReady(transactions_event) => {
                    let transaction_count = transactions_event.transactions.len();

                    info!(
                        target: LOG_TARGET,
                        "TransactionsReady event received with {} transactions",
                        transaction_count
                    );

                    // Process transactions - check each for pending transaction match
                    let mut transactions_to_emit = Vec::new();

                    for tx in transactions_event.transactions {
                        info!(target: LOG_TARGET, "TransactionsReady event - TX id: {}, status: {:?}", tx.id, tx.status);

                        // Check if this scanned transaction matches any pending transaction
                        if let Some(_pending_tx) =
                            Self::match_and_remove_pending_transaction(&tx.id).await
                        {
                            // Emit update event - the scanned transaction replaces the pending one
                            info!(
                                target: LOG_TARGET,
                                "Found matching pending transaction for scanned tx: {}",
                                tx.id
                            );
                        }

                        transactions_to_emit.push(tx);
                    }

                    // Update balance based on new transactions
                    if !transactions_to_emit.is_empty() {
                        transactions_to_emit.dedup_by(|a, b| {
                            a.id == b.id
                                || a.details.sent_output_hashes == b.details.sent_output_hashes
                        });

                        BalanceTracker::current()
                            .update_from_transactions(&transactions_to_emit)
                            .await;

                        // Emit all transactions to frontend
                        EventsEmitter::emit_wallet_transactions_found(transactions_to_emit).await;
                    }
                }
                ProcessingEvent::ReorgDetected(reorg_event) => {
                    info!(
                        target: LOG_TARGET,
                        "Chain reorganization detected at height {}, {} transactions affected",
                        reorg_event.reorg_from_height,
                        reorg_event.reorganized_displayed_transactions.len()
                    );

                    // Emit updates for each reorganized transaction so frontend can update/remove them
                    for tx in reorg_event.reorganized_displayed_transactions {
                        EventsEmitter::emit_wallet_transaction_updated(tx).await;
                    }
                }
                ProcessingEvent::TransactionsUpdated(update_event) => {
                    let update_count = update_event.updated_transactions.len();
                    info!(
                        target: LOG_TARGET,
                        "TransactionsUpdated event received with {} transactions",
                        update_count
                    );

                    // Emit update event for each transaction with updated confirmations
                    for tx in update_event.updated_transactions {
                        EventsEmitter::emit_wallet_transaction_updated(tx).await;
                    }
                }
            }
        }
    }

    /// Get the current chain tip height from node status
    fn get_chain_tip_height() -> u64 {
        let app_handle = match INSTANCE.app_handle.try_read() {
            Ok(guard) => match guard.as_ref() {
                Some(h) => h.clone(),
                None => return 0,
            },
            Err(_) => return 0,
        };

        let app_state: tauri::State<'_, UniverseAppState> = app_handle.state::<UniverseAppState>();
        app_state.node_status_watch_rx.borrow().block_height
    }

    async fn handle_status_event(event: ScanStatusEvent) {
        match event {
            ScanStatusEvent::Started {
                account_id,
                from_height,
            } => {
                info!(
                    target: LOG_TARGET_STATUSES,
                    "Scan started for account {} from height {}", account_id, from_height
                );
            }
            ScanStatusEvent::Progress { current_height, .. } => {
                // Update last scanned height
                {
                    let mut height = INSTANCE.last_scanned_height.write().await;
                    *height = current_height;
                }

                let should_emit = {
                    let last_emit = INSTANCE.last_progress_emit_time.read().await;
                    last_emit.elapsed() >= Duration::from_secs(PROGRESS_UPDATE_INTERVAL_SECS)
                };
                if should_emit {
                    *INSTANCE.last_progress_emit_time.write().await = Instant::now();

                    // Get chain tip from node status for accurate progress
                    let tip_height = Self::get_chain_tip_height();
                    let progress = if tip_height > 0 {
                        ((current_height as f64 / tip_height as f64) * 100.0).min(100.0)
                    } else {
                        0.0
                    };

                    EventsEmitter::emit_wallet_scanning_progress_update(
                        current_height,
                        tip_height,
                        progress,
                        false, // is_initial_scan_complete - still scanning
                    )
                    .await;
                }
            }
            ScanStatusEvent::Completed {
                final_height,
                total_blocks_scanned,
                ..
            } => {
                info!(
                    target: LOG_TARGET_STATUSES,
                    "Scan completed at height {}, total blocks scanned {}",
                    final_height, total_blocks_scanned
                );
                {
                    let mut height = INSTANCE.last_scanned_height.write().await;
                    *height = final_height;
                }

                // Mark initial sync as complete
                INSTANCE.initial_sync_complete.store(true, Ordering::SeqCst);

                let tip_height = Self::get_chain_tip_height();
                EventsEmitter::emit_wallet_scanning_progress_update(
                    final_height,
                    if tip_height > 0 {
                        tip_height
                    } else {
                        final_height
                    },
                    100.0,
                    true, // is_initial_scan_complete
                )
                .await;

                info!(
                    target: LOG_TARGET_STATUSES,
                    "Scan completed at height {}, {} total blocks scanned",
                    final_height, total_blocks_scanned
                );
            }
            ScanStatusEvent::Waiting { resume_in, .. } => {
                info!(
                    target: LOG_TARGET_STATUSES,
                    "Scan waiting, will resume in {:?}", resume_in
                );
            }
            ScanStatusEvent::MoreBlocksAvailable { .. } => {}
            ScanStatusEvent::Paused { reason, .. } => {
                info!(target: LOG_TARGET_STATUSES, "Scan paused: {:?}", reason);
            }
        }
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
                Path::new(&database_path),
                details.wallet_birthday,
                Some(tari_address.as_str()),
            )?;

            Ok(())
        } else {
            Err(anyhow::anyhow!("Tari wallet details not found"))
        }
    }

    pub async fn run_transaction_unlocker() -> Result<(), anyhow::Error> {
        if INSTANCE.unlocker_handle.read().await.is_some() {
            info!(target: LOG_TARGET, "Transaction unlocker is already running.");
            return Ok(());
        }

        info!(target: LOG_TARGET, "Starting Transaction Unlocker...");

        let pool = INSTANCE.database_manager.get_pool().await?;
        let unlocker = TransactionUnlocker::new(pool);

        let (shutdown_tx, shutdown_rx) = tokio::sync::broadcast::channel(1);
        let handle = unlocker.run(shutdown_rx);

        *INSTANCE.unlocker_handle.write().await = Some(handle);

        let mut app_shutdown_signal = TasksTrackers::current().wallet_phase.get_signal().await;

        TasksTrackers::current()
            .wallet_phase
            .get_task_tracker()
            .await
            .spawn(async move {
                app_shutdown_signal.wait().await;

                info!(target: LOG_TARGET, "Shutdown signal received. Stopping Transaction Unlocker.");

                if let Some(handle) = INSTANCE.unlocker_handle.write().await.take() {
                    if let Err(e) = shutdown_tx.send(()) {
                        error!(target: LOG_TARGET, "Failed to send shutdown signal to unlocker (it might have already stopped): {:?}", e);
                    }
                    if let Err(e) = handle.await {
                        error!(target: LOG_TARGET, "Transaction unlocker task did not complete successfully: {:?}", e);
                    }
                }

                *INSTANCE.unlocker_handle.write().await = None;
            });

        Ok(())
    }
}
