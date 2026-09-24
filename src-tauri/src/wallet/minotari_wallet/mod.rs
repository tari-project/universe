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
    credential_manager::CredentialManager,
    events::PinPromptContext,
    events_emitter::EventsEmitter,
    internal_wallet::{InternalWallet, TariAddressType},
    tasks_tracker::TasksTrackers,
    wallet::minotari_wallet::{
        balance_tracker::BalanceTracker,
        database_manager::MinotariWalletDatabaseManager,
        transaction::{TransactionManager, parse_destination_address},
    },
};
use log::{error, info, warn};
use minotari_wallet::{
    DisplayedTransaction, PauseReason, ProcessingEvent, ScanMode, ScanStatusEvent, Scanner,
    TransactionHistoryService,
    db::{AccountBalance, get_account_by_name, get_latest_scanned_tip_block_by_account},
    get_balance, init_db,
    tasks::unlocker::TransactionUnlocker,
    transactions::{TransactionSource, one_sided_transaction::Recipient},
    utils::init_wallet::init_with_view_key,
};
use r2d2::PooledConnection;
use r2d2_sqlite::SqliteConnectionManager;
use std::{
    collections::{HashMap, HashSet},
    path::{Path, PathBuf},
    sync::{
        LazyLock,
        atomic::{AtomicBool, AtomicU64, Ordering},
    },
    time::{Duration, Instant},
};
use tari_common::configuration::Network;
use tari_common_types_wallet::transaction::TxId;
use tari_common_wallet::configuration::Network as WalletNetwork;
use tauri::{AppHandle, Manager};
use tokio::sync::RwLock;
use tokio::task::JoinHandle;
use tokio_util::sync::CancellationToken;

static INSTANCE: LazyLock<MinotariWalletManager> = LazyLock::new(MinotariWalletManager::new);

/// HTTP API of the base node the app is currently using: the local node when one
/// is running, otherwise the remote RPC for the network. Scanning and broadcasting
/// go to the same node the rest of the app talks to, so a local node (and localnet,
/// which has no public RPC) works.
pub(crate) async fn base_node_http_url() -> Result<String, anyhow::Error> {
    let app_handle = INSTANCE
        .app_handle
        .read()
        .await
        .clone()
        .ok_or_else(|| anyhow::anyhow!("App handle not set"))?;
    let app_state = app_handle.state::<UniverseAppState>();
    Ok(app_state.node_manager.get_http_api_url().await)
}

/// The `minotari` wallet crate depends on tari 5.7.0-pre.8, while the rest of the app
/// uses tari v6.0.1-pre.0. Derive the wallet-side network from the app's
/// canonical network so the two can never diverge (e.g. sending to the wrong
/// network). The variant sets are identical across both versions.
pub(crate) fn wallet_network() -> WalletNetwork {
    match Network::get_current_or_user_setting_or_default() {
        Network::MainNet => WalletNetwork::MainNet,
        Network::StageNet => WalletNetwork::StageNet,
        Network::NextNet => WalletNetwork::NextNet,
        Network::LocalNet => WalletNetwork::LocalNet,
        Network::Igor => WalletNetwork::Igor,
        Network::Esmeralda => WalletNetwork::Esmeralda,
    }
}
static REQUIRED_CONFIRMATIONS: u64 = 3;

// Blockchain scanning constants
const SCAN_BATCH_SIZE: u64 = 25;
const SCAN_POLL_INTERVAL_SECS: u64 = 20;
/// Blocks per scan cycle. Like the minotari daemon, each cycle is a fresh
/// `ScanMode::Partial` run that resumes from the database tip; `Continuous` mode
/// re-processes the previous tip block on every poll and trips the unique output
/// constraint as soon as new blocks arrive.
const SCAN_MAX_BLOCKS_PER_CYCLE: u64 = 1000;
const PROGRESS_UPDATE_INTERVAL_SECS: u64 = 10;

pub struct MinotariWalletManager {
    database_manager: MinotariWalletDatabaseManager,
    app_handle: RwLock<Option<AppHandle>>,
    cancel_token: RwLock<Option<CancellationToken>>,
    // ============== |Unified Wallet State| ==============
    last_scanned_height: RwLock<u64>,
    owner_tari_address: RwLock<Option<String>>,
    /// Indicates if initial sync is complete (first Completed event received)
    initial_sync_complete: AtomicBool,
    /// Height the wallet's scan began at: its oldest scanned block, or the first
    /// block reported when nothing has been scanned yet (0 until then). Progress is
    /// measured from here rather than from genesis, so a wallet born at block 300k
    /// does not open at "50% scanned", and a restart part-way through resumes at
    /// the same percentage rather than dropping back to 0%.
    scan_start_height: AtomicU64,
    /// Stores pending transactions by their sent_output_hashes for matching with scanned transactions
    /// Key: comma-separated sorted output hashes, Value: DisplayedTransaction
    pending_transactions: RwLock<HashMap<TxId, DisplayedTransaction>>,
    last_progress_emit_time: RwLock<Instant>,
    unlocker_handle: RwLock<Option<JoinHandle<Result<(), anyhow::Error>>>>,
    /// Bumped every time a scan loop starts. The loop captures its value and
    /// anything it produces is dropped once this moves on, so a cycle still
    /// winding down after a refresh/import cannot write the old wallet's blocks
    /// and balances into the replacement wallet's state.
    scan_generation: AtomicU64,
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
            scan_start_height: AtomicU64::new(0),
            pending_transactions: RwLock::new(HashMap::new()),
            last_progress_emit_time: RwLock::new(
                Instant::now() - Duration::from_secs(PROGRESS_UPDATE_INTERVAL_SECS),
            ),
            unlocker_handle: RwLock::new(None),
            scan_generation: AtomicU64::new(0),
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
        let address = InternalWallet::tari_address().await?.to_base58();
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
        pin_context: Option<PinPromptContext>,
    ) -> Result<DisplayedTransaction, anyhow::Error> {
        if amount == 0 {
            return Err(anyhow::anyhow!(
                "Transaction amount must be greater than zero"
            ));
        }
        // No address or amount in the log: these lines end up in user-submitted feedback
        // bundles, where they would hand over the recipient and the value of every send.
        info!(target: LOG_TARGET, "Sending a one-sided transaction.");
        let tari_address = Self::get_owner_address().await?;
        let destination_address = parse_destination_address(&address)?;

        // Build the key manager (and so raise the PIN prompt) before anything locks
        // UTXOs: a cancelled, mistyped or timed-out PIN returns from here having locked
        // nothing, instead of leaving the selected inputs unspendable until the lock
        // expires.
        let app_handle = INSTANCE
            .app_handle
            .read()
            .await
            .clone()
            .ok_or_else(|| anyhow::anyhow!("App handle not set"))?;
        let key_manager = InternalWallet::get_key_manager(&app_handle, pin_context).await?;

        let mut transaction_manager = TransactionManager::new(
            INSTANCE.database_manager.get_pool().await?,
            tari_address.clone(),
        )
        .await?;

        let recipient: Recipient = Recipient {
            address: destination_address,
            amount: amount.into(),
            payment_id,
        };

        log::debug!(
            target: LOG_TARGET,
            "Creating one-sided transaction from {} to {} for amount {}",
            tari_address, address, amount
        );
        let unsigned_one_sided_transaction = transaction_manager
            .create_one_sided_transaction(recipient)
            .await?;

        info!("Signing one-sided transaction...");

        let signed_transaction = transaction_manager
            .sign_one_sided_transaction(&key_manager, unsigned_one_sided_transaction)
            .await?;

        info!("Finalizing and broadcasting one-sided transaction...");

        let displayed_transaction = transaction_manager
            .finalize_one_sided_transaction(signed_transaction)
            .await?;

        // Store as pending transaction for later matching with scanned transactions
        Self::store_pending_transaction(&displayed_transaction).await;

        // Re-read the balance the database now reports rather than guessing at it: the
        // spent inputs are locked, so `available` already reflects the send, fee
        // included. Subtracting the amount from `total` alone left `available` (what
        // send validation checks) untouched, so the same funds could be spent twice
        // before the next scan snapped the number back.
        BalanceTracker::current()
            .update_from_transactions(Self::get_latest_account_balance().await)
            .await;

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

    /// Forget everything the previous wallet's scan produced so a refresh or an
    /// import starts from a blank slate instead of inheriting stale sync flags,
    /// progress heights, balance and pending sends.
    pub async fn reset_for_rescan() {
        INSTANCE
            .initial_sync_complete
            .store(false, Ordering::SeqCst);
        INSTANCE.scan_start_height.store(0, Ordering::SeqCst);
        *INSTANCE.last_scanned_height.write().await = 0;
        Self::clear_pending_transactions().await;
        BalanceTracker::current().clear().await;
        EventsEmitter::emit_wallet_transactions_cleared().await;
        info!(target: LOG_TARGET, "Wallet scan state reset for rescan.");
    }

    /// Release the database pool so the wallet data folder can be deleted.
    pub async fn close_database() {
        INSTANCE.database_manager.close().await;
    }

    pub async fn handle_side_effects_after_wallet_import(
        tari_wallet_type: TariAddressType,
    ) -> Result<(), anyhow::Error> {
        info!(
            target: LOG_TARGET,
            "Handling side effects after wallet import for wallet type: {:?}", tari_wallet_type
        );

        if tari_wallet_type == TariAddressType::Internal {
            let new_address = InternalWallet::tari_address().await?.to_base58();
            Self::update_owner_address(&new_address).await?;
        }

        Self::reset_for_rescan().await;

        info!(
            target: LOG_TARGET,
            "Wallet import side effects handled. Transactions, balance, and pending transactions cleared."
        );
        Ok(())
    }

    /// Get cached owner address or fetch if not cached
    async fn get_owner_address() -> Result<String, anyhow::Error> {
        // Fast path: read lock
        {
            let owner_address_lock = INSTANCE.owner_tari_address.read().await;
            if let Some(address) = owner_address_lock.as_ref() {
                return Ok(address.clone());
            }
        }

        // Slow path: acquire write lock to check-and-init atomically
        let mut owner_address_lock = INSTANCE.owner_tari_address.write().await;
        // Double-check after acquiring write lock (another task may have initialized)
        if let Some(address) = owner_address_lock.as_ref() {
            return Ok(address.clone());
        }

        let address = InternalWallet::tari_address().await?.to_base58();
        *owner_address_lock = Some(address.clone());
        Ok(address)
    }

    /// Acquire database connection with retry logic
    async fn get_db_connection() -> Result<PooledConnection<SqliteConnectionManager>, anyhow::Error>
    {
        INSTANCE.database_manager.get_connection().await
    }

    /// Database id of the account that holds this app's wallet.
    ///
    /// `import_view_key` names accounts after the owner's Tari address, and the
    /// database keeps every account it has ever seen (a re-import, a wallet that was
    /// later replaced). The first row is therefore not necessarily ours, so the
    /// account is always looked up by address.
    async fn owner_account_id() -> Result<i64, anyhow::Error> {
        let address = Self::get_owner_address().await?;
        let conn = Self::get_db_connection().await?;
        let account = get_account_by_name(&conn, &address)?
            .ok_or_else(|| anyhow::anyhow!("No wallet account found for address {address}"))?;
        Ok(account.id)
    }

    /// Oldest block the owner's account has scanned, `None` for a wallet that has
    /// not scanned anything yet. Pruning keeps every block on the pruning interval,
    /// so this stays within a few blocks of where the scan first started.
    async fn first_scanned_height() -> Result<Option<u64>, anyhow::Error> {
        let account_id = Self::owner_account_id().await?;
        let conn = Self::get_db_connection().await?;
        let height: Option<i64> = conn.query_row(
            "SELECT MIN(height) FROM scanned_tip_blocks WHERE account_id = ?1",
            [account_id],
            |row| row.get(0),
        )?;
        Ok(height.map(|h| u64::try_from(h).unwrap_or(0)))
    }

    /// Get the latest scanned tip block for the owner's account
    async fn get_latest_scanned_tip_block()
    -> Result<Option<minotari_wallet::models::ScannedTipBlock>, anyhow::Error> {
        let account_id = Self::owner_account_id().await?;
        let conn = Self::get_db_connection().await?;
        get_latest_scanned_tip_block_by_account(&conn, account_id).map_err(|e| e.into())
    }

    /// Get balance for the owner's account
    pub async fn get_account_balance() -> Result<AccountBalance, anyhow::Error> {
        let account_id = Self::owner_account_id().await?;
        let conn = Self::get_db_connection().await?;
        get_balance(&conn, account_id).map_err(|e| e.into())
    }

    pub async fn get_latest_account_balance() -> Option<AccountBalance> {
        let mut updated_balance: Option<AccountBalance> = None;
        if let Ok(bal) = Self::get_account_balance().await {
            updated_balance = Some(bal)
        };
        updated_balance
    }

    /// Load the owner's transaction history excluding reorged transactions
    pub async fn get_transaction_history() -> Result<Vec<DisplayedTransaction>, anyhow::Error> {
        let account_id = Self::owner_account_id().await?;
        let db_pool = INSTANCE.database_manager.get_pool().await?;
        let history_service = TransactionHistoryService::new(db_pool);
        history_service
            .load_transactions_excluding_reorged(account_id)
            .map_err(|e| e.into())
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

        let latest_scanned_block = Self::get_latest_scanned_tip_block().await?;
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
        let balance = Self::get_account_balance().await?;
        BalanceTracker::current()
            .initialize_from_account_balance(balance)
            .await;

        // ============== |Fetch and Process All Balance Changes| ==============

        match Self::get_transaction_history().await {
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
        let tari_address = Self::get_owner_address().await?;

        info!(
            target: LOG_TARGET,
            "Starting blockchain scan for Minotari wallet at database path: {}", database_path
        );

        // Create cancellation token
        let cancel_token = CancellationToken::new();
        *INSTANCE.cancel_token.write().await = Some(cancel_token.clone());
        let scan_start_height = match Self::first_scanned_height().await {
            Ok(height) => height.unwrap_or(0),
            Err(e) => {
                error!(target: LOG_TARGET, "Could not read the first scanned height, progress starts from the first block reported: {e:?}");
                0
            }
        };
        INSTANCE
            .scan_start_height
            .store(scan_start_height, Ordering::SeqCst);

        // Get shutdown signal for graceful termination
        let mut shutdown_signal = TasksTrackers::current().wallet_phase.get_signal().await;
        let cancel_token_for_shutdown = cancel_token.clone();
        let cancel_token_for_scan = cancel_token.clone();

        let database_path_buf = PathBuf::from(database_path);
        let generation = INSTANCE.scan_generation.fetch_add(1, Ordering::SeqCst) + 1;
        let db_password = CredentialManager::minotari_db_password().await?;

        // Tracked, not a bare `tokio::spawn`: `shutdown_phases(Wallet)` only awaits
        // tasks on this tracker, and a refresh/import deletes the database folder the
        // moment it returns.
        TasksTrackers::current()
            .wallet_phase
            .get_task_tracker()
            .await
            .spawn(async move {
                while !cancel_token_for_scan.is_cancelled() {
                    // Re-read per cycle: switching between the local node and the remote
                    // RPC changes this URL, and a scanner pinned to the old one is dead.
                    let base_url = match base_node_http_url().await {
                        Ok(url) => url,
                        Err(e) => {
                            error!(target: LOG_TARGET, "No base node URL for the scan cycle, retrying after {SCAN_POLL_INTERVAL_SECS}s: {e:?}");
                            tokio::select! {
                                _ = tokio::time::sleep(Duration::from_secs(SCAN_POLL_INTERVAL_SECS)) => {}
                                _ = cancel_token_for_scan.cancelled() => {}
                            }
                            continue;
                        }
                    };

                    let (event_rx, scan_future) = Scanner::new(
                        db_password.as_str(),
                        &base_url,
                        database_path_buf.clone(),
                        SCAN_BATCH_SIZE,
                        REQUIRED_CONFIRMATIONS,
                    )
                    .account(&tari_address)
                    .mode(ScanMode::Partial {
                        max_blocks: SCAN_MAX_BLOCKS_PER_CYCLE,
                    })
                    .cancel_token(cancel_token_for_scan.clone())
                    .run_with_events();

                    // The event stream ends when the scan future drops its sender.
                    let (_, result) = tokio::join!(
                        Self::process_scan_events(event_rx, generation),
                        scan_future
                    );

                    // Confirmations, coinbase maturity and lock expiry all move money
                    // between available/locked/immature without a single transaction
                    // event, so the balance is re-read once per cycle regardless.
                    if generation == INSTANCE.scan_generation.load(Ordering::SeqCst) {
                        BalanceTracker::current()
                            .update_from_transactions(Self::get_latest_account_balance().await)
                            .await;

                        Self::restart_unlocker_if_dead().await;
                    }

                    let caught_up = match result {
                        Ok((_, more_blocks)) => !more_blocks,
                        Err(e) => {
                            // Keep polling: a dead scanner would silently freeze the balance
                            // and history until the next app start.
                            error!(target: LOG_TARGET, "Blockchain scan cycle failed, retrying after {SCAN_POLL_INTERVAL_SECS}s: {e:?}");
                            true
                        }
                    };

                    if caught_up {
                        tokio::select! {
                            _ = tokio::time::sleep(Duration::from_secs(SCAN_POLL_INTERVAL_SECS)) => {}
                            _ = cancel_token_for_scan.cancelled() => {}
                        }
                    }
                }
                info!(target: LOG_TARGET_STATUSES, "Blockchain scan loop stopped.");
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

    async fn process_scan_events(
        mut rx: tokio::sync::mpsc::UnboundedReceiver<ProcessingEvent>,
        generation: u64,
    ) {
        while let Some(event) = rx.recv().await {
            // A superseded loop's blocks and balances belong to a wallet that no
            // longer exists. Keep draining so the scan future is not left writing
            // into a closed channel, but act on nothing.
            if generation != INSTANCE.scan_generation.load(Ordering::SeqCst) {
                continue;
            }
            match event {
                ProcessingEvent::ScanStatus(status) => {
                    Self::handle_status_event(status).await;
                }
                // The library emits one of these per block. Its `ScanStatusEvent::Progress`
                // never fires in continuous mode (the emit is behind a condition that
                // cannot hold), so this is the only per-block signal during the initial
                // scan and it drives the progress shown in the wallet.
                ProcessingEvent::BlockProcessed(block_event) => {
                    Self::record_scanned_height(block_event.height).await;
                }
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
                        let mut seen_ids = HashSet::new();
                        transactions_to_emit.retain(|tx| seen_ids.insert(tx.id));
                        let updated_balance = Self::get_latest_account_balance().await;

                        BalanceTracker::current()
                            .update_from_transactions(updated_balance)
                            .await;

                        Self::notify_blocks_won(&transactions_to_emit).await;

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

                    BalanceTracker::current()
                        .update_from_transactions(Self::get_latest_account_balance().await)
                        .await;
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

                    // A confirmation moves funds from unconfirmed to available
                    // without changing the total.
                    BalanceTracker::current()
                        .update_from_transactions(Self::get_latest_account_balance().await)
                        .await;
                }
            }
        }
    }

    /// Tell the airdrop backend about every block this wallet just mined.
    ///
    /// Only once the wallet has caught up to the tip: the initial scan (and every
    /// refresh/import rescan) walks the whole mining history, and reporting those
    /// blocks again would replay years of rewards to the airdrop API.
    async fn notify_blocks_won(transactions: &[DisplayedTransaction]) {
        if !INSTANCE.initial_sync_complete.load(Ordering::SeqCst) {
            return;
        }
        let coinbase_heights: Vec<u64> = transactions
            .iter()
            .filter(|tx| tx.source == TransactionSource::Coinbase)
            .map(|tx| tx.blockchain.block_height)
            .collect();
        if coinbase_heights.is_empty() {
            return;
        }
        let Some(app_handle) = INSTANCE.app_handle.read().await.clone() else {
            return;
        };
        for height in coinbase_heights {
            crate::airdrop::send_new_block_mined(app_handle.clone(), height).await;
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

    /// Records a scanned block height and, at most once per
    /// `PROGRESS_UPDATE_INTERVAL_SECS`, pushes progress to the frontend.
    ///
    /// Progress is the share of the range this scan has to cover (its first block
    /// to the node's tip), not of the whole chain.
    async fn record_scanned_height(current_height: u64) {
        {
            let mut height = INSTANCE.last_scanned_height.write().await;
            *height = current_height;
        }
        // The first height reported is where this scan started from.
        let _unused = INSTANCE.scan_start_height.compare_exchange(
            0,
            current_height,
            Ordering::SeqCst,
            Ordering::SeqCst,
        );

        let should_emit = {
            let last_emit = INSTANCE.last_progress_emit_time.read().await;
            last_emit.elapsed() >= Duration::from_secs(PROGRESS_UPDATE_INTERVAL_SECS)
        };
        if !should_emit {
            return;
        }
        *INSTANCE.last_progress_emit_time.write().await = Instant::now();

        let tip_height = Self::get_chain_tip_height();
        let start_height = INSTANCE.scan_start_height.load(Ordering::SeqCst);
        let progress = scan_progress_percent(start_height, current_height, tip_height);

        // Continuous mode keeps reporting blocks after the first Completed (every
        // new block); reporting `false` there would flip the wallet UI back into
        // its syncing state and hide send/receive/history.
        EventsEmitter::emit_wallet_scanning_progress_update(
            current_height,
            tip_height,
            progress,
            INSTANCE.initial_sync_complete.load(Ordering::SeqCst),
        )
        .await;
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
                Self::record_scanned_height(current_height).await;
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
            // Every cycle ends with `MaxBlocksReached`: the loop above starts the next
            // one at once, so it is a progress marker, not a stall.
            ScanStatusEvent::Paused {
                last_scanned_height,
                reason: PauseReason::MaxBlocksReached { limit },
                ..
            } => {
                let tip_height = Self::get_chain_tip_height();
                info!(
                    target: LOG_TARGET_STATUSES,
                    "Scan cycle of {limit} blocks done at height {last_scanned_height} of {tip_height}, starting the next cycle"
                );
            }
            ScanStatusEvent::Paused {
                last_scanned_height,
                reason: PauseReason::Cancelled,
                ..
            } => {
                info!(
                    target: LOG_TARGET_STATUSES,
                    "Scan cancelled at height {last_scanned_height}"
                );
            }
            ScanStatusEvent::FastSyncPhaseStarted {
                phase,
                from_height,
                to_height,
                ..
            } => {
                info!(target: LOG_TARGET_STATUSES, "Fast sync phase {phase:?} started: {from_height} -> {to_height:?}");
            }
            ScanStatusEvent::FastSyncPhaseCompleted { phase, .. } => {
                info!(target: LOG_TARGET_STATUSES, "Fast sync phase {phase:?} completed");
            }
        }
    }
    /// Drop a database whose account no longer opens with the password we hold.
    ///
    /// Builds before this one encrypted the account blob with a hard-coded password, and
    /// nothing can re-key it. Without this the scan fails on every cycle forever, so the
    /// directory goes and the caller re-imports the view key and rescans from the wallet
    /// birthday — the same work a fresh install does, no funds involved.
    ///
    /// Safe to delete here: the caller runs before `initialize_wallet` opens the pool.
    async fn discard_undecryptable_database(
        database_path: &str,
        tari_address: &str,
        password: &str,
    ) -> Result<(), anyhow::Error> {
        if !Path::new(database_path).exists() {
            return Ok(());
        }

        let pool = init_db(PathBuf::from(database_path))?;
        let decrypts = {
            let conn = pool.get()?;
            match get_account_by_name(&conn, tari_address)? {
                Some(account) => account.get_keys_hex(password).is_ok(),
                None => true,
            }
        };
        drop(pool);

        if decrypts {
            return Ok(());
        }

        let wallet_dir = MinotariWalletDatabaseManager::minotari_wallet_dir()?;
        warn!(
            target: LOG_TARGET,
            "Minotari wallet account cannot be decrypted with the stored password; removing {} and rescanning from the wallet birthday",
            wallet_dir.display()
        );
        tokio::fs::remove_dir_all(&wallet_dir).await?;
        Ok(())
    }

    pub async fn import_view_key() -> Result<(), anyhow::Error> {
        let tari_wallet_details = InternalWallet::tari_wallet_details().await;
        if let Some(details) = tari_wallet_details {
            let database_path = MinotariWalletDatabaseManager::database_path()?;
            let tari_address = Self::get_owner_address().await?;
            let password = CredentialManager::minotari_db_password().await?;

            Self::discard_undecryptable_database(&database_path, &tari_address, &password).await?;

            init_with_view_key(
                details.view_private_key_hex.reveal(),
                &details.spend_public_key_hex,
                &password,
                Path::new(&database_path),
                details.wallet_birthday,
                Some(tari_address.as_str()),
            )?;

            Ok(())
        } else {
            Err(anyhow::anyhow!("Tari wallet details not found"))
        }
    }

    /// The unlocker's own loop returns on the first transient pool error but leaves
    /// its handle behind, so `run_transaction_unlocker` would answer "already running"
    /// forever and time-locked funds would never unlock again. Reap the dead task and
    /// start a new one.
    async fn restart_unlocker_if_dead() {
        let dead = INSTANCE
            .unlocker_handle
            .write()
            .await
            .take_if(|handle| handle.is_finished());
        if let Some(handle) = dead {
            error!(target: LOG_TARGET, "Transaction unlocker exited ({:?}), restarting it.", handle.await);
            if let Err(e) = Self::run_transaction_unlocker().await {
                error!(target: LOG_TARGET, "Could not restart the transaction unlocker: {e:?}");
            }
        }
    }

    pub async fn run_transaction_unlocker() -> Result<(), anyhow::Error> {
        if INSTANCE.unlocker_handle.read().await.is_some() {
            info!(target: LOG_TARGET, "Transaction unlocker is already running.");
            return Ok(());
        }

        info!(target: LOG_TARGET, "Starting Transaction Unlocker...");

        let pool = INSTANCE.database_manager.get_pool().await.map_err(|e| {
            error!(target: LOG_TARGET, "Failed to get database pool for transaction unlocker: {:?}", e);
            e
        })?;
        let unlocker = TransactionUnlocker::new(pool);

        let (shutdown_tx, shutdown_rx) = tokio::sync::broadcast::channel(1);
        let handle = unlocker.run(shutdown_rx);

        if handle.is_finished() {
            let result = handle.await;
            let err_msg = match result {
                Ok(Ok(())) => "Transaction unlocker exited immediately without error".to_string(),
                Ok(Err(e)) => format!("Transaction unlocker failed to start: {:?}", e),
                Err(e) => format!("Transaction unlocker task panicked: {:?}", e),
            };
            error!(target: LOG_TARGET, "{}", err_msg);
            return Err(anyhow::anyhow!(err_msg));
        }

        info!(target: LOG_TARGET, "Transaction unlocker spawned successfully.");
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
                    match handle.await {
                        Ok(Ok(())) => info!(target: LOG_TARGET, "Transaction unlocker stopped cleanly."),
                        Ok(Err(e)) => error!(target: LOG_TARGET, "Transaction unlocker finished with error: {:?}", e),
                        Err(e) => error!(target: LOG_TARGET, "Transaction unlocker task did not complete successfully: {:?}", e),
                    }
                }

                *INSTANCE.unlocker_handle.write().await = None;
                info!(target: LOG_TARGET, "Transaction unlocker shutdown complete.");
            });

        Ok(())
    }
}

/// Share of the range this scan has to cover (`start_height` to the node's tip)
/// that has been scanned, as a percentage. `0` when the tip is unknown (0) or not
/// yet past the start, so a wallet whose node has not reported a height yet does
/// not show a nonsense percentage.
fn scan_progress_percent(start_height: u64, current_height: u64, tip_height: u64) -> f64 {
    if tip_height <= start_height {
        return 0.0;
    }
    let scanned = current_height.saturating_sub(start_height) as f64;
    let span = (tip_height - start_height) as f64;
    ((scanned / span) * 100.0).min(100.0)
}

#[cfg(test)]
mod tests {
    use super::scan_progress_percent;

    #[test]
    fn progress_is_measured_from_the_scan_start_not_genesis() {
        // A wallet born at block 300k, half way to a tip of 400k, is at 50%.
        assert_eq!(scan_progress_percent(300_000, 350_000, 400_000), 50.0);
    }

    #[test]
    fn progress_clamps_at_100_when_the_tip_is_stale() {
        // The cached node tip lags the blocks the scanner is reporting.
        assert_eq!(scan_progress_percent(100, 500, 400), 100.0);
    }

    #[test]
    fn progress_is_zero_without_a_usable_tip() {
        // No node status yet, and a tip that has not moved past the start.
        assert_eq!(scan_progress_percent(300_000, 350_000, 0), 0.0);
        assert_eq!(scan_progress_percent(400, 400, 400), 0.0);
    }
}
