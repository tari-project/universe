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

/// What the UI gets back from a broadcast burn.
#[derive(Debug, Clone, Serialize)]
pub struct BurnReceipt {
    pub tx_id: String,
    pub output_hash: String,
    /// Where the complete L2 claim proof will be written once the burn is mined.
    pub proof_file: String,
    /// False when the node hasn't accepted the burn yet. It is recorded either way and
    /// rebroadcast automatically, so it must not be burned again.
    pub accepted_by_node: bool,
}

/// A send or burn the node keeps refusing (stalled), which the user may abandon.
#[derive(Debug, Clone, PartialEq, Serialize)]
pub struct StalledTransaction {
    /// A string: a u64 doesn't always fit a JavaScript number.
    pub tx_id: String,
    /// µT sent or burned.
    pub amount: u64,
    /// Hex commitment when it is a burn: burns are listed by it, not by transaction id.
    pub burn_commitment: Option<String>,
}

/// What the UI gets back from a send. A send is recorded whether or not the node
/// accepted it; one it hasn't accepted yet is rebroadcast automatically and must not
/// be sent again.
#[derive(Debug, Clone, Serialize)]
pub struct SendReceipt {
    /// The send's transaction id, as a string: a u64 doesn't always fit a JavaScript number.
    pub tx_id: String,
    pub accepted_by_node: bool,
    /// The node's answer when it hasn't accepted the send.
    pub node_reason: Option<String>,
}

use crate::configs::config_core::ConfigCore;
use crate::configs::trait_config::ConfigImpl;
use crate::{
    APPLICATION_FOLDER_ID, LOG_TARGET_STATUSES, UniverseAppState,
    credential_manager::CredentialManager,
    events::PinPromptContext,
    events_emitter::EventsEmitter,
    internal_wallet::{InternalWallet, TariAddressType},
    tasks_tracker::TasksTrackers,
    wallet::minotari_wallet::{
        balance_tracker::BalanceTracker,
        database_manager::MinotariWalletDatabaseManager,
        transaction::{
            CONFIRMATION_WINDOW, SEND_FEE_PER_GRAM, TransactionManager, UTXO_LOCK_DURATION_SECS,
            parse_destination_address, resolve_payment_id,
        },
    },
};
use anyhow::Context;
use log::{error, info, warn};
use minotari_wallet::{
    DisplayedTransaction, PauseReason, ProcessingEvent, ScanMode, ScanStatusEvent, Scanner,
    TransactionHistoryService,
    db::{
        AccountBalance, AccountRow, CompletedTransactionStatus, DbBurnProof, fetch_unspent_outputs,
        get_account_by_name, get_change_output_hash_for_request, get_completed_transaction_by_id,
        get_completed_transactions_by_status, get_displayed_transaction_by_id,
        get_displayed_transactions_by_status, get_latest_scanned_tip_block_by_account,
        get_output_spend, get_pending_burn_proofs,
    },
    get_balance,
    http::WalletHttpClient,
    init_db,
    tasks::{burn_proof_worker::BurnProofWorker, unlocker::TransactionUnlocker},
    transactions::{
        TransactionDisplayStatus, TransactionSource,
        abandon::{ABANDONED_REASON, AbandonedSend, abandon_send},
        burn::{BurnTxParams, BurnTxResult, create_burn_tx, persist_burn_records},
        fee_estimator::estimated_output_size_for_payment_id,
        manager::record_first_broadcast,
        monitor::MAX_BROADCAST_ATTEMPTS,
        one_sided_transaction::Recipient,
    },
    utils::{
        crypto::{encrypt_data, parse_claimable_public_key_hex},
        fingerprint::calculate_fingerprint,
        init_wallet::init_with_view_key,
    },
};
use r2d2::PooledConnection;
use r2d2_sqlite::{SqliteConnectionManager, rusqlite::Connection};
use serde::Serialize;
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
use tari_common_types::transaction::TxId;
use tari_transaction_components::fee::Fee;
use tari_transaction_components::rpc::models::TxSubmissionResponse;
use tari_transaction_components::tari_amount::MicroMinotari;
use tari_transaction_components::transaction_components::{MAX_TRANSACTION_INPUTS, Transaction};
use tari_transaction_components::weight::TransactionWeight;
use tauri::{AppHandle, Manager};
use tokio::sync::RwLock;
use tokio::task::JoinHandle;
use tokio_util::sync::CancellationToken;
use zeroize::Zeroizing;

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

/// The network the minotari wallet sends, burns and scans on: the app's own.
pub(crate) fn wallet_network() -> Network {
    Network::get_current_or_user_setting_or_default()
}
static REQUIRED_CONFIRMATIONS: u64 = 3;

// Blockchain scanning constants
const SCAN_BATCH_SIZE: u64 = 25;
const SCAN_POLL_INTERVAL_SECS: u64 = 20;
/// Blocks per scan cycle. Like the minotari daemon, each cycle is a fresh
/// `ScanMode::Partial` run that resumes from the database tip; `Continuous` mode
/// re-processes the previous tip block on every poll and trips the unique output
/// constraint as soon as new blocks arrive.
///
/// Each cycle rebuilds the scanner: two Argon2id decrypts of the account, a new
/// HTTP client and a reorg check, about two seconds against three seconds of
/// scanning per 1000 blocks. The size only sets how often that is paid; the
/// library commits every 25-block batch and resumes from the last committed
/// block, so a failure loses no more at 20,000 than at 1000.
const SCAN_MAX_BLOCKS_PER_CYCLE: u64 = 20_000;
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
    /// Coinbases the scan has already shown. The monitor re-sends a coinbase on every
    /// status change, and only the first sighting may be reported as a block won.
    seen_coinbases: RwLock<HashSet<TxId>>,
    /// History entries the UI has been told were reorganized. A Partial scan rolls a reorg
    /// back at the start of its cycle without emitting `ReorgDetected`, so every cycle
    /// compares the database's reorganized entries with this.
    reorged_ids: RwLock<HashSet<TxId>>,
    last_progress_emit_time: RwLock<Instant>,
    unlocker_handle: RwLock<Option<JoinHandle<Result<(), anyhow::Error>>>>,
    burn_proof_handle: RwLock<Option<JoinHandle<Result<(), anyhow::Error>>>>,
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
            seen_coinbases: RwLock::new(HashSet::new()),
            reorged_ids: RwLock::new(HashSet::new()),
            last_progress_emit_time: RwLock::new(
                Instant::now() - Duration::from_secs(PROGRESS_UPDATE_INTERVAL_SECS),
            ),
            unlocker_handle: RwLock::new(None),
            burn_proof_handle: RwLock::new(None),
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
    ) -> Result<SendReceipt, anyhow::Error> {
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
        let payment_id = resolve_payment_id(&destination_address, payment_id)?;

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

        let sent = transaction_manager
            .finalize_one_sided_transaction(signed_transaction)
            .await?;
        let displayed_transaction = sent.displayed_transaction;
        let tx_id = displayed_transaction.id.to_string();

        // Re-read the balance the database now reports rather than guessing at it: the
        // spent inputs are locked, so `available` already reflects the send, fee
        // included. Subtracting the amount from `total` alone left `available` (what
        // send validation checks) untouched, so the same funds could be spent twice
        // before the next scan snapped the number back.
        BalanceTracker::current()
            .update_from_transactions(Self::get_latest_account_balance().await)
            .await;

        // Emit to frontend immediately so user sees the pending transaction
        EventsEmitter::emit_wallet_transactions_found(vec![displayed_transaction]).await;

        info!("One-sided transaction sent successfully.");
        Ok(SendReceipt {
            tx_id,
            accepted_by_node: sent.accepted_by_node,
            node_reason: sent.node_reason,
        })
    }

    /// Burn `amount` µT so it can be claimed on L2 by `claim_public_key`.
    ///
    /// The partial burn proof is persisted before broadcast; [`Self::run_burn_proof_worker`]
    /// completes it with the output inclusion proof once the burn is mined and writes the
    /// claim file named in the returned [`BurnReceipt`].
    pub async fn burn_to_l2(
        claim_public_key: String,
        amount: u64,
        payment_id: Option<String>,
        pin_context: Option<PinPromptContext>,
    ) -> Result<BurnReceipt, anyhow::Error> {
        if amount == 0 {
            return Err(anyhow::anyhow!("Burn amount must be greater than zero"));
        }
        let claim_key = parse_claimable_public_key_hex(&claim_public_key)
            .map_err(|e| anyhow::anyhow!("Invalid L2 claim public key: {e}"))?;
        info!(target: LOG_TARGET, "Burning funds to L2.");

        // PIN prompt first, before anything locks UTXOs (same ordering as a send).
        let app_handle = INSTANCE
            .app_handle
            .read()
            .await
            .clone()
            .ok_or_else(|| anyhow::anyhow!("App handle not set"))?;
        let signing_wallet = InternalWallet::get_signing_wallet(&app_handle, pin_context).await?;

        let owner_address = Self::get_owner_address().await?;
        let password = CredentialManager::minotari_db_password().await?;
        let mut conn = Self::get_db_connection().await?;
        let account = get_account_by_name(&conn, &owner_address)?.ok_or_else(|| {
            anyhow::anyhow!("No wallet account found for address {owner_address}")
        })?;

        // The stored account is view-only, and `create_burn_tx` signs with the key manager
        // it derives from the account row. Hand it an in-memory row holding the seed
        // wallet under the same id, so locking and bookkeeping hit the real account while
        // signing uses the PIN-unlocked seed. Nothing here is written to the database.
        // This shim goes away once minotari-cli offers a create_burn_tx that takes a key manager.
        let wallet_json = Zeroizing::new(serde_json::to_vec(&signing_wallet)?);
        let encrypted = encrypt_data(&wallet_json, &password)?;
        let signing_account = AccountRow {
            id: account.id,
            friendly_name: account.friendly_name.clone(),
            fingerprint: calculate_fingerprint(&signing_wallet),
            encrypted_wallet: encrypted.ciphertext,
            cipher_nonce: encrypted.nonce,
            salt: encrypted.salt_bytes,
            birthday: account.birthday,
        };
        drop(signing_wallet);

        // Everything that can fail happens before the burn is recorded: once
        // `persist_burn_records` commits, the monitor broadcasts it, so an error after
        // that would invite the user to burn again.
        let proofs_dir = Self::burn_proofs_dir()?;
        let client = WalletHttpClient::new(base_node_http_url().await?.parse()?)?;

        let idempotency_key = uuid::Uuid::new_v4().to_string();
        let params = BurnTxParams {
            account_id: account.id,
            amount: MicroMinotari::from(amount),
            claim_public_key: Some(claim_key),
            sidechain_deployment_key: None,
            fee_per_gram: MicroMinotari::from(SEND_FEE_PER_GRAM),
            payment_id,
            idempotency_key: Some(idempotency_key.clone()),
            seconds_to_lock: UTXO_LOCK_DURATION_SECS,
            confirmation_window: CONFIRMATION_WINDOW,
        };
        let result = create_burn_tx(
            &signing_account,
            &mut conn,
            wallet_network(),
            &password,
            params,
        )
        .context("Failed to build burn transaction")?;
        // Proof first, broadcast second: a burn whose proof is lost is money gone for good.
        persist_burn_records(&mut conn, &result, account.id, &idempotency_key)?;

        let proof_file = proofs_dir.join(format!(
            "{}-{}.json",
            result.new_burn_proof.claim_public_key,
            hex::encode(&result.new_burn_proof.commitment)
        ));
        let BurnTxResult {
            transaction,
            output_hash,
            tx_id,
            ..
        } = result;

        let submitted = client.submit_transaction(transaction).await;
        let accepted_by_node = record_burn_broadcast(&conn, tx_id, submitted);
        drop(conn);

        BalanceTracker::current()
            .update_from_transactions(Self::get_latest_account_balance().await)
            .await;
        info!(target: LOG_TARGET, "Burn transaction broadcast.");

        Ok(BurnReceipt {
            tx_id: tx_id.to_string(),
            output_hash: hex::encode(output_hash),
            proof_file: proof_file.to_string_lossy().into_owned(),
            accepted_by_node,
        })
    }

    /// `<app local data>/burn_proofs/<network>`. Kept out of the minotari wallet folder
    /// because a history refresh or seed import deletes that folder, and these files are
    /// what the L2 claim needs. Proofs left in the old place inside it move on first use.
    pub fn burn_proofs_dir() -> Result<PathBuf, anyhow::Error> {
        let network = Network::get_current_or_user_setting_or_default()
            .to_string()
            .to_lowercase();
        let dir = dirs::data_local_dir()
            .ok_or_else(|| anyhow::anyhow!("Failed to get local data directory"))?
            .join(APPLICATION_FOLDER_ID)
            .join("burn_proofs")
            .join(network);
        let legacy = MinotariWalletDatabaseManager::minotari_wallet_dir()?.join("burn_proofs");
        Ok(move_legacy_burn_proofs(legacy, dir))
    }

    /// Refuses while a burn is broadcast but not yet mined. Its proof is only a row in
    /// wallet.db until the worker writes the claim file, and that row can't be moved, so
    /// deleting the wallet folder now would make the burn unclaimable.
    pub fn ensure_no_pending_burns() -> Result<(), anyhow::Error> {
        pending_burns_guard(Path::new(&MinotariWalletDatabaseManager::database_path()?))
    }

    /// Burns broadcast but not yet mined deep enough for their claim proof to be written.
    pub async fn pending_burns() -> Result<Vec<DbBurnProof>, anyhow::Error> {
        pending_burns(&*Self::get_db_connection().await?)
    }

    /// Whether send or burn `tx_id` is still waiting to be mined (completed or broadcast),
    /// so one missing from the stalled list just hasn't been refused often enough yet.
    pub async fn is_unmined_send(tx_id: &str) -> Result<bool, anyhow::Error> {
        let Ok(id) = tx_id.parse::<u64>() else {
            return Ok(false);
        };
        let conn = Self::get_db_connection().await?;
        Ok(
            get_completed_transaction_by_id(&conn, TxId::from(id))?.is_some_and(|tx| {
                matches!(
                    tx.status,
                    CompletedTransactionStatus::Completed | CompletedTransactionStatus::Broadcast
                )
            }),
        )
    }

    /// Commitments of the burns the user abandoned. One still listed by
    /// [`Self::pending_burns`] may yet be mined, but isn't simply waiting any more.
    pub async fn abandoned_burn_commitments() -> Result<HashSet<Vec<u8>>, anyhow::Error> {
        abandoned_burn_commitments(&*Self::get_db_connection().await?)
    }

    /// When each of this wallet's burns was made, unix seconds by commitment (hex).
    pub async fn burn_times() -> Result<HashMap<String, u64>, anyhow::Error> {
        burn_times(&*Self::get_db_connection().await?)
    }

    /// Completes pending burn proofs with their output inclusion proof once the burn is
    /// mined, writing the L2 claim file. Same lifecycle as the transaction unlocker.
    pub async fn run_burn_proof_worker() -> Result<(), anyhow::Error> {
        if INSTANCE.burn_proof_handle.read().await.is_some() {
            return Ok(());
        }
        let pool = INSTANCE.database_manager.get_pool().await?;
        // The node URL is captured at start; a node switch takes effect on the next wallet phase restart.
        let client = WalletHttpClient::new(base_node_http_url().await?.parse()?)?;
        let (shutdown_tx, shutdown_rx) = tokio::sync::broadcast::channel(1);
        let handle = BurnProofWorker::new(pool, client, Self::burn_proofs_dir()?, wallet_network())
            .run(shutdown_rx);
        *INSTANCE.burn_proof_handle.write().await = Some(handle);
        info!(target: LOG_TARGET, "Burn proof worker spawned.");

        let mut app_shutdown_signal = TasksTrackers::current().wallet_phase.get_signal().await;
        TasksTrackers::current()
            .wallet_phase
            .get_task_tracker()
            .await
            .spawn(async move {
                app_shutdown_signal.wait().await;
                if let Some(handle) = INSTANCE.burn_proof_handle.write().await.take() {
                    drop(shutdown_tx.send(()));
                    if let Err(e) = handle.await {
                        error!(target: LOG_TARGET, "Burn proof worker did not stop cleanly: {e:?}");
                    }
                }
            });
        Ok(())
    }

    /// Forget everything the previous wallet's scan produced so a refresh or an
    /// import starts from a blank slate instead of inheriting stale sync flags,
    /// progress heights, balance and pending sends.
    pub async fn reset_for_rescan() {
        INSTANCE
            .initial_sync_complete
            .store(false, Ordering::SeqCst);
        *INSTANCE.last_scanned_height.write().await = 0;
        INSTANCE.seen_coinbases.write().await.clear();
        INSTANCE.reorged_ids.write().await.clear();
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

    /// Get the latest scanned tip block for the owner's account
    async fn get_latest_scanned_tip_block()
    -> Result<Option<minotari_wallet::models::ScannedTipBlock>, anyhow::Error> {
        let account_id = Self::owner_account_id().await?;
        let conn = Self::get_db_connection().await?;
        get_latest_scanned_tip_block_by_account(&conn, account_id).map_err(|e| e.into())
    }

    /// The largest amount a send carrying `payment_id` can have, in µT.
    pub async fn max_sendable_amount(payment_id: Option<String>) -> Result<u64, anyhow::Error> {
        let account_id = Self::owner_account_id().await?;
        let conn = Self::get_db_connection().await?;
        max_sendable(&conn, account_id, payment_id.as_deref())
    }

    /// The sends and burns the node keeps refusing (stalled).
    pub async fn stalled_transactions() -> Result<Vec<StalledTransaction>, anyhow::Error> {
        let account_id = Self::owner_account_id().await?;
        let conn = Self::get_db_connection().await?;
        stalled_transactions(&conn, account_id)
    }

    /// Gives up stalled send or burn `tx_id` and releases its inputs. Only a stalled one
    /// can be abandoned, and one without a change output only with
    /// `accept_unreconcilable`. The PIN, when one is set, is asked for first.
    pub async fn abandon_stalled_transaction(
        tx_id: &str,
        accept_unreconcilable: bool,
        pin_context: Option<PinPromptContext>,
    ) -> Result<(), anyhow::Error> {
        let app_handle = INSTANCE
            .app_handle
            .read()
            .await
            .clone()
            .ok_or_else(|| anyhow::anyhow!("App handle not set"))?;
        // Only proves the PIN; nothing is signed.
        drop(InternalWallet::get_tari_seed_with_prompt(&app_handle, pin_context).await?);

        let account_id = Self::owner_account_id().await?;
        let mut conn = Self::get_db_connection().await?;
        let abandoned = abandon_stalled(&mut conn, account_id, tx_id, accept_unreconcilable)?;
        drop(conn);
        info!(target: LOG_TARGET, "Transaction {tx_id} abandoned by the user.");

        if let Some(tx) = abandoned.displayed_transaction {
            EventsEmitter::emit_wallet_transaction_updated(tx).await;
        }
        BalanceTracker::current()
            .update_from_transactions(Self::get_latest_account_balance().await)
            .await;
        Ok(())
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
        if let Err(e) = Self::run_burn_proof_worker().await {
            error!(target: LOG_TARGET, "Failed to start burn proof worker: {:?}", e);
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

                // Coinbases already in the database were seen before this start.
                INSTANCE.seen_coinbases.write().await.extend(
                    transactions
                        .iter()
                        .filter(|tx| tx.source == TransactionSource::Coinbase)
                        .map(|tx| tx.id),
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

        // Everything that can fail comes before the token is stored: a token left behind with
        // no shutdown listener to clear it would make every later start a no-op.
        let db_password = CredentialManager::minotari_db_password().await?;
        let mut shutdown_signal = TasksTrackers::current().wallet_phase.get_signal().await;

        let cancel_token = CancellationToken::new();
        {
            let mut slot = INSTANCE.cancel_token.write().await;
            if slot.is_some() {
                return Ok(()); // Another start won the race since the check above.
            }
            *slot = Some(cancel_token.clone());
        }
        let cancel_token_for_shutdown = cancel_token.clone();
        let cancel_token_for_scan = cancel_token.clone();

        let database_path_buf = PathBuf::from(database_path);
        let generation = INSTANCE.scan_generation.fetch_add(1, Ordering::SeqCst) + 1;

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
                        Self::announce_new_reorgs().await;
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

    /// Tells the UI about history entries a reorg rolled back since the last cycle. Updates
    /// only touch rows the UI already shows, so re-announcing old ones after a restart is
    /// harmless.
    async fn announce_new_reorgs() {
        let reorged = match Self::reorganized_transactions().await {
            Ok(reorged) => reorged,
            Err(e) => {
                warn!(target: LOG_TARGET, "Couldn't read reorganized transactions: {e:?}");
                return;
            }
        };
        let fresh_ids = newly_reorged(
            &mut *INSTANCE.reorged_ids.write().await,
            reorged.iter().map(|tx| tx.id),
        );
        let fresh: Vec<DisplayedTransaction> = reorged
            .into_iter()
            .filter(|tx| fresh_ids.contains(&tx.id))
            .collect();
        if fresh.is_empty() {
            return;
        }
        info!(target: LOG_TARGET, "{} transactions were reorganized out of the chain", fresh.len());
        for tx in fresh {
            EventsEmitter::emit_wallet_transaction_updated(tx).await;
        }
    }

    async fn reorganized_transactions() -> Result<Vec<DisplayedTransaction>, anyhow::Error> {
        let account_id = Self::owner_account_id().await?;
        let conn = Self::get_db_connection().await?;
        Ok(get_displayed_transactions_by_status(
            &conn,
            account_id,
            TransactionDisplayStatus::Reorganized,
        )?)
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
                // One per block, so progress moves within a batch; `ScanStatusEvent::Progress`
                // only arrives once per batch.
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

                    let mut transactions_to_emit = transactions_event.transactions;

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
        let coinbases: Vec<(TxId, u64)> = transactions
            .iter()
            .filter(|tx| tx.source == TransactionSource::Coinbase)
            .map(|tx| (tx.id, tx.blockchain.block_height))
            .collect();
        let allow_notifications = *ConfigCore::content().await.allow_notifications();
        let coinbase_heights = blocks_to_report(
            &mut *INSTANCE.seen_coinbases.write().await,
            INSTANCE.initial_sync_complete.load(Ordering::SeqCst),
            allow_notifications,
            coinbases,
        );
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
        let should_emit = {
            let last_emit = INSTANCE.last_progress_emit_time.read().await;
            last_emit.elapsed() >= Duration::from_secs(PROGRESS_UPDATE_INTERVAL_SECS)
        };
        if !should_emit {
            return;
        }
        *INSTANCE.last_progress_emit_time.write().await = Instant::now();

        let tip_height = Self::get_chain_tip_height();
        let progress = scan_progress_percent(current_height, tip_height);

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

                // The library also reports Completed when the node's tip query fails or the
                // node is behind, so only a scan that reached the tip counts as synced.
                // Otherwise every older coinbase found later would be reported as a new win.
                let tip_height = Self::get_chain_tip_height();
                if !scan_reached_tip(final_height, tip_height) {
                    warn!(
                        target: LOG_TARGET_STATUSES,
                        "Scan stopped at height {final_height}, short of the node tip {tip_height}; still syncing"
                    );
                    return;
                }
                INSTANCE.initial_sync_complete.store(true, Ordering::SeqCst);

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
            // A cycle that hit its block limit ends with `MaxBlocksReached` (a caught-up one
            // with `Completed`): the loop starts the next at once, so it isn't a stall.
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
            "Minotari wallet account cannot be decrypted with the stored password; discarding {} and rescanning from the wallet birthday",
            wallet_dir.display()
        );
        if let Some(aside) = discard_wallet_dir(&wallet_dir, Path::new(database_path))? {
            warn!(
                target: LOG_TARGET,
                "It may hold the only proof of an unsettled burn to Layer 2, so it was moved to {} instead",
                aside.display()
            );
        }
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

/// Coinbase heights worth reporting as blocks won. Each coinbase counts once, the
/// first time it is seen, whether or not it is reported then. Nothing until the
/// initial sync has caught up (a rescan would replay years of history), and nothing
/// unless the user allows notifications: the report leaves the machine, as the
/// pre-minotari path also required.
fn blocks_to_report(
    seen: &mut HashSet<TxId>,
    synced: bool,
    allow_notifications: bool,
    coinbases: Vec<(TxId, u64)>,
) -> Vec<u64> {
    let mut heights = Vec::new();
    for (id, height) in coinbases {
        if seen.insert(id) && synced && allow_notifications {
            heights.push(height);
        }
    }
    heights
}

/// Scanned height as a percentage of the node's tip: the same ratio as the
/// "scanned / total" heights the wallet shows next to it, so the three numbers
/// agree. A wallet born well after genesis therefore starts above 0%. `0` when
/// the tip is unknown, so a wallet whose node has not reported a height yet does
/// not show a nonsense percentage.
/// The ids in `current` not in `known`, which then becomes `current`. An entry that leaves
/// the reorganized set (re-mined) is announced again if it is reorganized again.
fn newly_reorged(known: &mut HashSet<TxId>, current: impl Iterator<Item = TxId>) -> HashSet<TxId> {
    let current: HashSet<TxId> = current.collect();
    let fresh = current.difference(known).copied().collect();
    *known = current;
    fresh
}

/// Whether a scan that ended at `final_height` reached the node tip, allowing for blocks
/// mined since it finished. An unknown tip (0) proves nothing.
fn scan_reached_tip(final_height: u64, tip_height: u64) -> bool {
    tip_height > 0 && final_height.saturating_add(REQUIRED_CONFIRMATIONS) >= tip_height
}

fn scan_progress_percent(current_height: u64, tip_height: u64) -> f64 {
    if tip_height == 0 {
        return 0.0;
    }
    ((current_height as f64 / tip_height as f64) * 100.0).min(100.0)
}

/// The largest amount a one-sided send with `payment_id` can carry: the spendable
/// inputs, less the fee for a recipient and a change output and the smallest change
/// the library's input selector accepts (what spending the change would cost, at
/// least 1 µT). Uses the selector's fee terms so the result is exactly what
/// `InputSelector::fetch_unspent_outputs` will select for; one µT more fails with
/// `ChangeNotAffordable`.
///
/// This mirrors minotari's `minotari/src/transactions/input_selector.rs` at v0.5.0 (query,
/// fee terms, minimum change, dust rule, input cap). Re-check it against that file on every
/// minotari bump; `the_max_sendable_amount_sends_with_change_and_one_micro_tari_more_does_not`
/// is the guard.
fn max_sendable(
    conn: &Connection,
    account_id: i64,
    payment_id: Option<&str>,
) -> Result<u64, anyhow::Error> {
    let tip_height =
        get_latest_scanned_tip_block_by_account(conn, account_id)?.map_or(0, |block| block.height);
    let min_height = tip_height.saturating_sub(CONFIRMATION_WINDOW);
    let outputs = fetch_unspent_outputs(conn, account_id, min_height, tip_height)?;

    let fee_per_gram = MicroMinotari::from(SEND_FEE_PER_GRAM);
    let output_size = estimated_output_size_for_payment_id(payment_id.map_or(0, str::len))?;
    let fee = Fee::new(TransactionWeight::latest());
    let kernel_fee = fee.calculate(fee_per_gram, 1, 0, 0, 0).as_u64();
    let input_fee = fee.calculate(fee_per_gram, 0, 1, 0, 0).as_u64();
    let output_fee = fee.calculate(fee_per_gram, 0, 0, 1, output_size).as_u64();
    let min_change = input_fee.max(1);

    // Outputs come largest first. One worth no more than its input fee only lowers
    // the amount, and a transaction takes at most MAX_TRANSACTION_INPUTS inputs.
    let mut inputs_value: u64 = 0;
    for output in outputs.iter().take(MAX_TRANSACTION_INPUTS) {
        let value = output.output.value().as_u64();
        if value <= input_fee {
            break;
        }
        inputs_value = inputs_value.saturating_add(value - input_fee);
    }

    // Two outputs: the recipient's and the change.
    let costs = kernel_fee
        .saturating_add(output_fee.saturating_mul(2))
        .saturating_add(min_change);
    Ok(inputs_value.saturating_sub(costs))
}

/// Sends and burns not mined yet that the node has refused `MAX_BROADCAST_ATTEMPTS`
/// times in a row: only these can be abandoned. A burn has no displayed transaction
/// until it is mined, so its amount comes from its burn proof.
fn stalled_transactions(
    conn: &Connection,
    account_id: i64,
) -> Result<Vec<StalledTransaction>, anyhow::Error> {
    let mut stalled_txs = Vec::new();
    for status in [
        CompletedTransactionStatus::Completed,
        CompletedTransactionStatus::Broadcast,
    ] {
        for tx in get_completed_transactions_by_status(conn, account_id, status)? {
            if tx.broadcast_attempts >= MAX_BROADCAST_ATTEMPTS {
                stalled_txs.push(tx);
            }
        }
    }
    // Usually nothing is stalled: then nothing more is read.
    if stalled_txs.is_empty() {
        return Ok(Vec::new());
    }

    let burns = get_pending_burn_proofs(conn)?;
    let mut stalled = Vec::new();
    for tx in stalled_txs {
        let burn = burns
            .iter()
            .find(|b| tx.sent_output_hash.as_deref() == Some(hex::encode(b.output_hash).as_str()));
        let amount = match burn {
            Some(b) => u64::try_from(b.value).ok(),
            None => get_displayed_transaction_by_id(conn, &tx.id.to_string())?
                .map(|d| d.amount.as_u64()),
        };
        // The abandon prompt shows this amount; without it the user would approve "0 XTM".
        let Some(amount) = amount else {
            warn!(
                target: LOG_TARGET,
                "Stalled transaction {} has no readable amount, so it isn't offered for abandoning",
                tx.id
            );
            continue;
        };
        stalled.push(StalledTransaction {
            tx_id: tx.id.to_string(),
            amount,
            burn_commitment: burn.map(|b| hex::encode(&b.commitment)),
        });
    }
    Ok(stalled)
}

/// Abandons stalled send or burn `tx_id`, never forced: one the node hasn't refused
/// often enough is refused.
fn abandon_stalled(
    conn: &mut Connection,
    account_id: i64,
    tx_id: &str,
    accept_unreconcilable: bool,
) -> Result<AbandonedSend, anyhow::Error> {
    let id = TxId::from(
        tx_id
            .parse::<u64>()
            .map_err(|_| anyhow::anyhow!("Invalid transaction id '{tx_id}'"))?,
    );
    Ok(abandon_send(
        conn,
        account_id,
        id,
        false,
        accept_unreconcilable,
        None,
    )?)
}

/// When each of the wallet's burns was made, unix seconds by commitment (hex).
fn burn_times(conn: &Connection) -> Result<HashMap<String, u64>, anyhow::Error> {
    let mut stmt = conn.prepare(
        "SELECT commitment, CAST(strftime('%s', created_at) AS INTEGER) FROM burn_proofs",
    )?;
    let rows = stmt.query_map([], |row| {
        Ok((row.get::<_, Vec<u8>>(0)?, row.get::<_, i64>(1)?))
    })?;
    rows.map(|row| {
        let (commitment, created_at) = row?;
        Ok((hex::encode(commitment), u64::try_from(created_at)?))
    })
    .collect()
}

/// Returns `dir`, first renaming `legacy` to it when only the old folder exists. On a
/// failed rename the old folder stays in use so no proof goes missing.
fn move_legacy_burn_proofs(legacy: PathBuf, dir: PathBuf) -> PathBuf {
    if !legacy.is_dir() || dir.exists() {
        return dir;
    }
    let moved = dir
        .parent()
        .map_or(Ok(()), std::fs::create_dir_all)
        .and_then(|()| std::fs::rename(&legacy, &dir));
    match moved {
        Ok(()) => {
            info!(target: LOG_TARGET, "Moved burn proofs from {} to {}", legacy.display(), dir.display());
            dir
        }
        Err(e) => {
            warn!(target: LOG_TARGET, "Could not move burn proofs to {}, still using {}: {e}", dir.display(), legacy.display());
            legacy
        }
    }
}

/// Records the burn's first broadcast the way the library records a send's, and says
/// whether the node accepted it. A burn the node refused, or that got no answer, stays
/// completed with its inputs locked: the monitor that runs after each scan cycle
/// rebroadcasts it, and only the scan (or the user abandoning it) can reject it.
fn record_burn_broadcast(
    conn: &Connection,
    tx_id: TxId,
    submitted: Result<TxSubmissionResponse, anyhow::Error>,
) -> bool {
    record_first_broadcast(Some(conn), tx_id, submitted).accepted_by_node
}

/// Pending burn proofs, less those whose transaction can never be mined: one the scan
/// rejected because its inputs were spent elsewhere, and one the user abandoned whose
/// inputs the scan has since seen spent (by another transaction: the burn itself would
/// have been marked mined by its change row). An abandoned burn with unspent inputs, or
/// with no change row, still counts: a node may still mine it, and this database holds
/// its only proof row.
fn pending_burns(conn: &Connection) -> Result<Vec<DbBurnProof>, anyhow::Error> {
    let mut stmt = conn.prepare(
        "SELECT b.id, c.account_id, c.pending_tx_id, c.last_rejected_reason,
                c.serialized_transaction
           FROM burn_proofs b JOIN completed_transactions c
             ON c.sent_output_hash = lower(hex(b.output_hash))
          WHERE c.status = 'rejected'",
    )?;
    let rows = stmt.query_map([], |row| {
        Ok((
            row.get::<_, i64>(0)?,
            row.get::<_, i64>(1)?,
            row.get::<_, String>(2)?,
            row.get::<_, Option<String>>(3)?,
            row.get::<_, Vec<u8>>(4)?,
        ))
    })?;
    let mut dead = HashSet::new();
    for row in rows {
        let (id, account_id, pending_tx_id, reason, serialized_transaction) = row?;
        let dead_burn = match reason.as_deref() {
            // Without a change row (a burn from before this version) the scan can't
            // tell it landing from its inputs going elsewhere, so it stays guarded.
            Some(ABANDONED_REASON) => {
                get_change_output_hash_for_request(conn, &pending_tx_id)?.is_some()
                    && any_input_spent(conn, account_id, &serialized_transaction)?
            }
            _ => true,
        };
        if dead_burn {
            dead.insert(id);
        }
    }
    Ok(get_pending_burn_proofs(conn)?
        .into_iter()
        .filter(|b| !dead.contains(&b.id))
        .collect())
}

fn abandoned_burn_commitments(conn: &Connection) -> Result<HashSet<Vec<u8>>, anyhow::Error> {
    let mut stmt = conn.prepare(
        "SELECT b.commitment
           FROM burn_proofs b JOIN completed_transactions c
             ON c.sent_output_hash = lower(hex(b.output_hash))
          WHERE c.status = 'rejected' AND c.last_rejected_reason = ?1",
    )?;
    let rows = stmt.query_map([ABANDONED_REASON], |row| row.get::<_, Vec<u8>>(0))?;
    Ok(rows.collect::<Result<_, _>>()?)
}

/// Whether the scan has seen any input of this transaction spent on chain. One that
/// can't be read counts as unspent, so its burn stays guarded.
fn any_input_spent(
    conn: &Connection,
    account_id: i64,
    serialized_transaction: &[u8],
) -> Result<bool, anyhow::Error> {
    let Ok(transaction) = serde_json::from_slice::<Transaction>(serialized_transaction) else {
        return Ok(false);
    };
    for input in transaction.body().inputs() {
        if get_output_spend(conn, account_id, &input.output_hash())?.is_some() {
            return Ok(true);
        }
    }
    Ok(false)
}

/// Reads the database file directly so the check works whether or not the wallet phase
/// has the pool open. Fails closed: a database that can't be read might still hold an
/// unmined burn's only proof row.
/// Deletes `wallet_dir`, unless its database may hold an unmined burn's proof (or can't be
/// checked): then it is renamed beside itself and the new name returned, so the proof isn't lost.
fn discard_wallet_dir(
    wallet_dir: &Path,
    database_path: &Path,
) -> Result<Option<PathBuf>, std::io::Error> {
    if pending_burns_guard(database_path).is_ok() {
        std::fs::remove_dir_all(wallet_dir)?;
        return Ok(None);
    }
    let secs = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map_or(0, |d| d.as_secs());
    let mut name = wallet_dir.file_name().unwrap_or_default().to_os_string();
    name.push(format!(".undecryptable-{secs}"));
    let aside = wallet_dir.with_file_name(name);
    std::fs::rename(wallet_dir, &aside)?;
    Ok(Some(aside))
}

fn pending_burns_guard(database_path: &Path) -> Result<(), anyhow::Error> {
    if !database_path.exists() {
        return Ok(());
    }
    let pending = init_db(database_path.to_path_buf())
        .map_err(anyhow::Error::from)
        .and_then(|pool| pending_burns(&*pool.get()?))
        .map_err(|e| {
            anyhow::anyhow!("Couldn't check for unsettled burns to Layer 2, so nothing was changed. Try again. ({e})")
        })?;
    match pending.len() {
        0 => Ok(()),
        1 => Err(anyhow::anyhow!(
            "1 burn to Layer 2 isn't settled yet (waiting to be mined or for its claim proof). This wallet holds the only proof needed to claim it, so it can't be reset or re-imported until it settles, which may need a later app update."
        )),
        n => Err(anyhow::anyhow!(
            "{n} burns to Layer 2 aren't settled yet (waiting to be mined or for their claim proofs). This wallet holds the only proofs needed to claim them, so it can't be reset or re-imported until they settle, which may need a later app update."
        )),
    }
}

#[cfg(test)]
mod tests {
    use super::{
        SendReceipt, StalledTransaction, abandon_stalled, abandoned_burn_commitments,
        blocks_to_report, burn_times, discard_wallet_dir, max_sendable, move_legacy_burn_proofs,
        newly_reorged, pending_burns, pending_burns_guard, record_burn_broadcast,
        scan_progress_percent, scan_reached_tip, stalled_transactions,
    };
    use crate::wallet::minotari_wallet::transaction::{CONFIRMATION_WINDOW, SEND_FEE_PER_GRAM};
    use minotari_wallet::db::{
        SqlitePool, create_account, get_account_by_name, init_db, insert_input,
        insert_scanned_tip_block, insert_unconfirmed_change_output,
        mark_completed_transaction_as_rejected_in_block, update_output_status,
    };
    use minotari_wallet::models::OutputStatus;
    use minotari_wallet::transactions::{
        abandon::AbandonSendError,
        burn::{BurnTxParams, create_burn_tx},
        input_selector::UtxoSelectionError,
        manager::{TransactionSender, record_first_broadcast},
        monitor::MAX_BROADCAST_ATTEMPTS,
        one_sided_transaction::Recipient,
    };
    use r2d2_sqlite::rusqlite::named_params;
    use std::collections::HashSet;
    use tari_common::configuration::Network;
    use tari_common_types::seeds::cipher_seed::CipherSeed;
    use tari_common_types::types::{CompressedPublicKey, FixedHash, PrivateKey};
    use tari_transaction_components::key_manager::wallet_types::{SeedWordsWallet, WalletType};
    use tari_transaction_components::rpc::models::{
        TxSubmissionRejectionReason, TxSubmissionResponse,
    };
    use tari_transaction_components::tari_amount::MicroMinotari;
    use tari_transaction_components::transaction_components::{
        MemoField, Transaction, TransactionInput, WalletOutput,
    };
    use zeroize::Zeroizing;

    const PASSWORD: &str = "pass";

    /// An output worth `value`, told apart from others by `seed`.
    fn test_output(value: u64, seed: u8) -> WalletOutput {
        WalletOutput::new_from_parts(
            Default::default(),
            MicroMinotari::from(value),
            Default::default(),
            Default::default(),
            Default::default(),
            Default::default(),
            Default::default(),
            Default::default(),
            Default::default(),
            0,
            Default::default(),
            Default::default(),
            MicroMinotari::from(0),
            None,
            MemoField::new_empty(),
            FixedHash::from([seed; 32]),
            Default::default(),
        )
    }

    /// A wallet database with one account holding a spendable output of each value.
    fn funded_wallet(values: &[u64]) -> (SqlitePool, i64, tempfile::TempDir) {
        let dir = tempfile::tempdir().expect("temp dir");
        let pool = init_db(dir.path().join("wallet.db")).expect("db");
        let conn = pool.get().expect("connection");
        let wallet = WalletType::SeedWords(
            SeedWordsWallet::construct_new(CipherSeed::random()).expect("wallet"),
        );
        create_account(&conn, "test", &wallet, PASSWORD).expect("account");
        let account_id = get_account_by_name(&conn, "test")
            .expect("account")
            .expect("account exists")
            .id;
        insert_scanned_tip_block(&conn, account_id, 200, &[0u8; 32]).expect("tip");
        for (i, value) in values.iter().enumerate() {
            let seed = u8::try_from(i + 1).expect("few outputs");
            let output = test_output(*value, seed);
            conn.execute(
                "INSERT INTO outputs (account_id, tx_id, output_hash, mined_in_block_height,
                   mined_in_block_hash, value, mined_timestamp, wallet_output_json, status,
                   confirmed_height, confirmed_hash, is_burn, maturity)
                 VALUES (:account_id, :tx_id, :hash, 100, :hash, :value, :ts, :json, 'UNSPENT',
                   100, :hash, 0, 0)",
                named_params! {
                    ":account_id": account_id,
                    ":tx_id": i64::from(seed),
                    ":hash": vec![seed; 32],
                    ":value": i64::try_from(*value).expect("value"),
                    ":ts": chrono::Utc::now(),
                    ":json": serde_json::to_string(&output).expect("json"),
                },
            )
            .expect("output");
        }
        (pool, account_id, dir)
    }

    /// A wallet holding one burn as `persist_burn_records` leaves it (the input locked
    /// by the burn's request, the completed burn, its proof and its unconfirmed change),
    /// refused by the node `attempts` times in a row.
    fn recorded_burn(attempts: i32) -> (SqlitePool, i64, tempfile::TempDir) {
        let (pool, account_id, dir) = funded_wallet(&[1_000_000]);
        let conn = pool.get().expect("connection");
        conn.execute_batch("PRAGMA foreign_keys = OFF")
            .expect("pragma");
        conn.execute(
            "UPDATE outputs SET status = 'LOCKED', locked_by_request_id = 'p'",
            [],
        )
        .expect("locked input");
        // The burn spends the wallet's one output.
        let transaction = Transaction::new(
            vec![TransactionInput::new_with_output_hash(
                FixedHash::from([1u8; 32]),
                Default::default(),
                Default::default(),
            )],
            Vec::new(),
            Vec::new(),
            PrivateKey::default(),
            PrivateKey::default(),
        );
        conn.execute(
            "INSERT INTO completed_transactions (id, account_id, pending_tx_id, status,
               kernel_excess, sent_output_hash, serialized_transaction, broadcast_attempts)
             VALUES (12, ?1, 'p', 'completed', x'', ?2, ?3, ?4)",
            (
                account_id,
                hex::encode([6u8; 32]),
                serde_json::to_vec(&transaction).expect("transaction"),
                attempts,
            ),
        )
        .expect("burn transaction");
        conn.execute(
            "INSERT INTO burn_proofs (account_id, output_hash, commitment, claim_public_key,
               ownership_proof_nonce, ownership_proof_sig, kernel_excess, kernel_excess_nonce,
               kernel_excess_sig, sender_offset_public_key, encrypted_data, value)
             VALUES (?1, ?2, ?2, '', zeroblob(32), zeroblob(32), zeroblob(32),
               zeroblob(32), zeroblob(32), zeroblob(32), x'', 1)",
            (account_id, [6u8; 32].as_slice()),
        )
        .expect("burn proof");
        insert_unconfirmed_change_output(
            &conn,
            account_id,
            &PrivateKey::default(),
            "p",
            &test_output(400_000, 7),
        )
        .expect("change");
        drop(conn);
        (pool, account_id, dir)
    }

    /// Prepares a send of `amount` to the wallet itself, as `TransactionManager` does.
    fn prepare_send(
        pool: &SqlitePool,
        amount: u64,
        payment_id: Option<&str>,
    ) -> Result<tari_transaction_components::offline_signing::models::PrepareOneSidedTransactionForSigningResult, anyhow::Error>
{
        let password = Zeroizing::new(PASSWORD.to_string());
        let mut sender = TransactionSender::new(
            pool.clone(),
            "test".to_string(),
            password.clone(),
            Network::LocalNet,
            CONFIRMATION_WINDOW,
        )
        .expect("sender");
        sender.fee_per_gram = MicroMinotari::from(SEND_FEE_PER_GRAM);
        let recipient = Recipient {
            address: sender
                .account
                .get_address(Network::LocalNet, &password)
                .expect("address"),
            amount: MicroMinotari::from(amount),
            payment_id: payment_id.map(str::to_string),
        };
        sender.start_new_transaction(uuid::Uuid::new_v4().to_string(), recipient, 300)
    }

    #[test]
    fn burn_proofs_move_out_of_the_wallet_folder_once() {
        let root = tempfile::tempdir().expect("temp dir");
        let legacy = root.path().join("minotari-wallet/esmeralda/burn_proofs");
        let dir = root.path().join("burn_proofs/esmeralda");
        std::fs::create_dir_all(&legacy).expect("legacy dir");
        std::fs::write(legacy.join("proof.json"), "{}").expect("proof");

        assert_eq!(move_legacy_burn_proofs(legacy.clone(), dir.clone()), dir);
        assert!(dir.join("proof.json").exists());
        assert!(!legacy.exists());
        // Deleting the wallet folder, as a refresh does, leaves the proofs alone.
        std::fs::remove_dir_all(root.path().join("minotari-wallet")).expect("refresh");
        assert_eq!(move_legacy_burn_proofs(legacy, dir.clone()), dir);
        assert!(dir.join("proof.json").exists());
    }

    #[test]
    fn each_reorganized_entry_is_announced_once_per_reorg() {
        let id = |n: u64| tari_common_types::transaction::TxId::from(n);
        let mut known = HashSet::new();
        assert_eq!(
            newly_reorged(&mut known, [id(1), id(2)].into_iter()),
            HashSet::from([id(1), id(2)])
        );
        assert!(newly_reorged(&mut known, [id(1), id(2)].into_iter()).is_empty());
        // 2 was re-mined, then reorganized again.
        assert!(newly_reorged(&mut known, [id(1)].into_iter()).is_empty());
        assert_eq!(
            newly_reorged(&mut known, [id(1), id(2)].into_iter()),
            HashSet::from([id(2)])
        );
    }

    #[test]
    fn only_a_scan_that_reached_the_tip_counts_as_synced() {
        assert!(scan_reached_tip(1000, 1000));
        assert!(scan_reached_tip(997, 1000));
        assert!(!scan_reached_tip(996, 1000));
        // The library reports Completed at the start height when the tip query fails.
        assert!(!scan_reached_tip(12, 380_000));
        assert!(!scan_reached_tip(1000, 0));
    }

    #[test]
    fn an_undecryptable_wallet_with_a_pending_burn_is_moved_aside_not_deleted() {
        let root = tempfile::tempdir().expect("temp dir");
        let wallet_dir = root.path().join("minotari-wallet");
        std::fs::create_dir_all(&wallet_dir).expect("wallet dir");
        let path = wallet_dir.join("wallet.db");

        // Nothing pending: deleted.
        drop(minotari_wallet::db::init_db(path.clone()).expect("db"));
        assert_eq!(
            discard_wallet_dir(&wallet_dir, &path).expect("discard"),
            None
        );
        assert!(!wallet_dir.exists());

        // A burn not yet mined: kept under another name.
        std::fs::create_dir_all(&wallet_dir).expect("wallet dir");
        let pool = minotari_wallet::db::init_db(path.clone()).expect("db");
        let conn = pool.get().expect("connection");
        conn.execute_batch("PRAGMA foreign_keys = OFF")
            .expect("pragma");
        conn.execute(
            "INSERT INTO burn_proofs (account_id, output_hash, commitment, claim_public_key,
               ownership_proof_nonce, ownership_proof_sig, kernel_excess, kernel_excess_nonce,
               kernel_excess_sig, sender_offset_public_key, encrypted_data, value)
             VALUES (1, ?1, ?1, '', zeroblob(32), zeroblob(32), zeroblob(32),
               zeroblob(32), zeroblob(32), zeroblob(32), x'', 1)",
            [[1u8; 32].as_slice()],
        )
        .expect("burn proof");
        drop(conn);
        drop(pool);
        let aside = discard_wallet_dir(&wallet_dir, &path)
            .expect("discard")
            .expect("moved aside");
        assert!(!wallet_dir.exists());
        assert!(aside.join("wallet.db").exists());
        assert!(pending_burns_guard(&aside.join("wallet.db")).is_err());
    }

    #[test]
    fn a_pending_burn_blocks_deleting_the_wallet_db() {
        let dir = tempfile::tempdir().expect("temp dir");
        let path = dir.path().join("wallet.db");
        assert!(pending_burns_guard(&path).is_ok());
        let pool = minotari_wallet::db::init_db(path.clone()).expect("db");
        assert!(pending_burns_guard(&path).is_ok());

        let conn = pool.get().expect("connection");
        conn.execute_batch("PRAGMA foreign_keys = OFF")
            .expect("pragma");
        for id in [1u8, 2] {
            conn.execute(
                "INSERT INTO burn_proofs (account_id, output_hash, commitment, claim_public_key,
                   ownership_proof_nonce, ownership_proof_sig, kernel_excess, kernel_excess_nonce,
                   kernel_excess_sig, sender_offset_public_key, encrypted_data, value)
                 VALUES (1, ?1, ?1, '', zeroblob(32), zeroblob(32), zeroblob(32),
                   zeroblob(32), zeroblob(32), zeroblob(32), x'', 1)",
                [[id; 32].as_slice()],
            )
            .expect("burn proof");
        }
        let err = pending_burns_guard(&path).expect_err("refused");
        assert!(err.to_string().starts_with("2 burns to Layer 2"), "{err}");

        // The second burn was rejected: it will never be mined.
        conn.execute(
            "INSERT INTO completed_transactions (id, account_id, pending_tx_id, status,
               kernel_excess, sent_output_hash, serialized_transaction)
             VALUES (7, 1, 'p', 'rejected', x'', ?1, x'')",
            [hex::encode([2u8; 32])],
        )
        .expect("rejected burn");
        let err = pending_burns_guard(&path).expect_err("refused");
        assert!(err.to_string().starts_with("1 burn to Layer 2"), "{err}");
        // The panel's list leaves the rejected burn out too.
        let listed = pending_burns(&conn).expect("pending burns");
        assert_eq!(listed.len(), 1);
        assert_eq!(listed[0].commitment, vec![1u8; 32]);

        conn.execute("UPDATE burn_proofs SET status = 'complete'", [])
            .expect("mined");
        assert!(pending_burns_guard(&path).is_ok());
    }

    #[test]
    fn a_burn_whose_broadcast_errored_stays_pending() {
        let dir = tempfile::tempdir().expect("temp dir");
        let path = dir.path().join("wallet.db");
        let pool = minotari_wallet::db::init_db(path.clone()).expect("db");
        let conn = pool.get().expect("connection");
        conn.execute_batch("PRAGMA foreign_keys = OFF")
            .expect("pragma");
        conn.execute(
            "INSERT INTO burn_proofs (account_id, output_hash, commitment, claim_public_key,
               ownership_proof_nonce, ownership_proof_sig, kernel_excess, kernel_excess_nonce,
               kernel_excess_sig, sender_offset_public_key, encrypted_data, value)
             VALUES (1, ?1, ?1, '', zeroblob(32), zeroblob(32), zeroblob(32),
               zeroblob(32), zeroblob(32), zeroblob(32), x'', 1)",
            [[3u8; 32].as_slice()],
        )
        .expect("burn proof");
        conn.execute(
            "INSERT INTO completed_transactions (id, account_id, pending_tx_id, status,
               kernel_excess, sent_output_hash, serialized_transaction)
             VALUES (9, 1, 'p', 'completed', x'', ?1, x'')",
            [hex::encode([3u8; 32])],
        )
        .expect("burn transaction");

        assert!(!record_burn_broadcast(
            &conn,
            9u64.into(),
            Err(anyhow::anyhow!("timed out"))
        ));
        let status: String = conn
            .query_row(
                "SELECT status FROM completed_transactions WHERE id = 9",
                [],
                |r| r.get(0),
            )
            .expect("status");
        assert_eq!(status, "completed");
        assert_eq!(pending_burns(&conn).expect("pending burns").len(), 1);
        assert!(pending_burns_guard(&path).is_err());
    }

    #[test]
    fn a_burn_the_node_refused_stays_pending_for_the_scan_to_settle() {
        let (pool, _account_id, _dir) = recorded_burn(0);
        let conn = pool.get().expect("connection");
        let refused = TxSubmissionResponse {
            accepted: false,
            rejection_reason: TxSubmissionRejectionReason::DoubleSpend,
            is_synced: true,
            details: None,
        };
        assert!(!record_burn_broadcast(&conn, 12u64.into(), Ok(refused)));

        let status: String = conn
            .query_row(
                "SELECT status FROM completed_transactions WHERE id = 12",
                [],
                |r| r.get(0),
            )
            .expect("status");
        assert_eq!(status, "completed");
        let output_statuses: Vec<String> = conn
            .prepare("SELECT status FROM outputs ORDER BY status")
            .expect("query")
            .query_map([], |r| r.get(0))
            .expect("rows")
            .collect::<Result<_, _>>()
            .expect("statuses");
        assert_eq!(output_statuses, vec!["LOCKED", "UNCONFIRMED"]);
        assert_eq!(pending_burns(&conn).expect("pending burns").len(), 1);
    }

    #[test]
    fn an_abandoned_burn_blocks_the_wallet_db_until_the_scan_rejects_it() {
        let (pool, account_id, dir) = recorded_burn(MAX_BROADCAST_ATTEMPTS);
        let path = dir.path().join("wallet.db");
        let mut conn = pool.get().expect("connection");
        // A burn has no history entry until it is mined; the stalled list still has it.
        assert_eq!(
            stalled_transactions(&conn, account_id).expect("stalled"),
            vec![StalledTransaction {
                tx_id: "12".to_string(),
                amount: 1,
                burn_commitment: Some(hex::encode([6u8; 32])),
            }]
        );
        assert!(pending_burns_guard(&path).is_err());

        abandon_stalled(&mut conn, account_id, "12", false).expect("abandoned");

        let status: String = conn
            .query_row(
                "SELECT status FROM completed_transactions WHERE id = 12",
                [],
                |r| r.get(0),
            )
            .expect("status");
        assert_eq!(status, "rejected");
        assert!(
            stalled_transactions(&conn, account_id)
                .expect("stalled")
                .is_empty()
        );
        // A node may still mine it, and this database holds its only proof row.
        assert_eq!(pending_burns(&conn).expect("pending burns").len(), 1);
        assert!(pending_burns_guard(&path).is_err());

        // Another transaction spends the released input, and the scan records it as it
        // does for any spent output: an input row and the output marked spent. The
        // burn's own row stays as abandon left it.
        let output_id: i64 = conn
            .query_row(
                "SELECT id FROM outputs WHERE output_hash = ?1",
                [[1u8; 32].as_slice()],
                |r| r.get(0),
            )
            .expect("output");
        insert_input(&conn, account_id, output_id, 150, &[5u8; 32], 1_700_000_000).expect("input");
        update_output_status(&conn, output_id, OutputStatus::Spent).expect("spent");
        assert!(pending_burns(&conn).expect("pending burns").is_empty());
        assert!(pending_burns_guard(&path).is_ok());
    }

    #[test]
    fn an_abandoned_burn_is_listed_as_abandoned() {
        let (pool, account_id, _dir) = recorded_burn(MAX_BROADCAST_ATTEMPTS);
        let mut conn = pool.get().expect("connection");
        assert!(abandoned_burn_commitments(&conn).expect("read").is_empty());

        abandon_stalled(&mut conn, account_id, "12", false).expect("abandoned");
        let abandoned = abandoned_burn_commitments(&conn).expect("read");
        let pending = pending_burns(&conn).expect("pending burns");
        assert_eq!(pending.len(), 1, "still guarded: it may yet be mined");
        assert!(abandoned.contains(&pending[0].commitment));
    }

    #[test]
    fn an_abandoned_burn_without_a_change_row_stays_guarded_once_its_input_is_spent() {
        let (pool, account_id, dir) = recorded_burn(MAX_BROADCAST_ATTEMPTS);
        let path = dir.path().join("wallet.db");
        let mut conn = pool.get().expect("connection");
        // A burn made before this version: no change row.
        conn.execute("DELETE FROM outputs WHERE created_by_request_id = 'p'", [])
            .expect("no change row");
        abandon_stalled(&mut conn, account_id, "12", true).expect("abandoned");

        // Its input recorded spent: it may be the burn itself that landed.
        let output_id: i64 = conn
            .query_row(
                "SELECT id FROM outputs WHERE output_hash = ?1",
                [[1u8; 32].as_slice()],
                |r| r.get(0),
            )
            .expect("output");
        insert_input(&conn, account_id, output_id, 150, &[5u8; 32], 1_700_000_000).expect("input");
        update_output_status(&conn, output_id, OutputStatus::Spent).expect("spent");

        assert_eq!(pending_burns(&conn).expect("pending burns").len(), 1);
        assert!(pending_burns_guard(&path).is_err());
    }

    #[test]
    fn a_burn_that_is_not_stalled_cannot_be_abandoned() {
        let (pool, account_id, _dir) = recorded_burn(1);
        let mut conn = pool.get().expect("connection");
        assert!(
            stalled_transactions(&conn, account_id)
                .expect("stalled")
                .is_empty()
        );

        let err = abandon_stalled(&mut conn, account_id, "12", false).expect_err("not stalled");
        assert!(
            matches!(
                err.downcast_ref::<AbandonSendError>(),
                Some(AbandonSendError::NotStalled { .. })
            ),
            "{err:#}"
        );
        assert_eq!(pending_burns(&conn).expect("pending burns").len(), 1);
    }

    #[test]
    fn a_burn_the_scan_rejected_does_not_block_deleting_the_wallet_db() {
        let dir = tempfile::tempdir().expect("temp dir");
        let path = dir.path().join("wallet.db");
        let pool = init_db(path.clone()).expect("db");
        let conn = pool.get().expect("connection");
        conn.execute_batch("PRAGMA foreign_keys = OFF")
            .expect("pragma");
        conn.execute(
            "INSERT INTO burn_proofs (account_id, output_hash, commitment, claim_public_key,
               ownership_proof_nonce, ownership_proof_sig, kernel_excess, kernel_excess_nonce,
               kernel_excess_sig, sender_offset_public_key, encrypted_data, value)
             VALUES (1, ?1, ?1, '', zeroblob(32), zeroblob(32), zeroblob(32),
               zeroblob(32), zeroblob(32), zeroblob(32), x'', 1)",
            [[4u8; 32].as_slice()],
        )
        .expect("burn proof");
        conn.execute(
            "INSERT INTO completed_transactions (id, account_id, pending_tx_id, status,
               kernel_excess, sent_output_hash, serialized_transaction)
             VALUES (11, 1, 'p', 'broadcast', x'', ?1, x'')",
            [hex::encode([4u8; 32])],
        )
        .expect("burn transaction");
        assert!(pending_burns_guard(&path).is_err());

        // The scan saw the burn's inputs spent by another transaction: it can never be mined.
        mark_completed_transaction_as_rejected_in_block(
            &conn,
            11u64.into(),
            "inputs spent by a different transaction",
            150,
            &[5u8; 32],
        )
        .expect("rejected by the scan");
        assert!(pending_burns(&conn).expect("pending burns").is_empty());
        assert!(pending_burns_guard(&path).is_ok());
    }

    #[test]
    fn the_max_sendable_amount_sends_with_change_and_one_micro_tari_more_does_not() {
        // With and without a payment id: the recipient memo carries it next to the sender's address.
        for payment_id in [None, Some("invoice-42")] {
            // The last output is worth less than the fee to spend it, so it adds nothing.
            let (pool, account_id, _dir) = funded_wallet(&[3_000_000, 1_250_000, 40]);
            let max = max_sendable(&pool.get().expect("connection"), account_id, payment_id)
                .expect("max");
            assert!(max > 4_000_000 && max < 4_250_000, "max {max}");

            let err = prepare_send(&pool, max + 1, payment_id).expect_err("no room for change");
            assert!(
                matches!(
                    err.downcast_ref::<UtxoSelectionError>(),
                    Some(UtxoSelectionError::ChangeNotAffordable { .. })
                ),
                "got: {err}"
            );

            let prepared = prepare_send(&pool, max, payment_id).expect("the max amount sends");
            let inputs: u64 = prepared
                .info
                .inputs
                .iter()
                .map(|input| input.value().as_u64())
                .sum();
            let change = inputs - max - prepared.info.fee.as_u64();
            assert!(change > 0, "the send carries change");
            assert!(
                prepared.info.recipients[0]
                    .payment_id
                    .claimed_sender_address()
                    .is_some(),
                "the recipient memo names the sender"
            );
        }
    }

    #[test]
    fn a_burn_without_room_for_change_reads_as_the_change_error() {
        let value = 1_000_000;
        let (pool, _account_id, _dir) = funded_wallet(&[value]);
        let mut conn = pool.get().expect("connection");
        let account = get_account_by_name(&conn, "test")
            .expect("account")
            .expect("account exists");
        let claim_key = CompressedPublicKey::from_secret_key(&PrivateKey::from(7u64));

        // Walk down from the whole balance until the burn covers its fee; that first
        // amount leaves no room for change.
        let mut amount = value - 1;
        let error = loop {
            let params = BurnTxParams {
                account_id: account.id,
                amount: MicroMinotari::from(amount),
                claim_public_key: Some(claim_key.clone()),
                sidechain_deployment_key: None,
                fee_per_gram: MicroMinotari::from(SEND_FEE_PER_GRAM),
                payment_id: None,
                idempotency_key: Some(uuid::Uuid::new_v4().to_string()),
                seconds_to_lock: 300,
                confirmation_window: CONFIRMATION_WINDOW,
            };
            let Err(err) = create_burn_tx(&account, &mut conn, Network::LocalNet, PASSWORD, params)
            else {
                panic!("a burn of {amount} built without room for change");
            };
            match err.downcast_ref::<UtxoSelectionError>() {
                Some(UtxoSelectionError::InsufficientFunds { .. }) => amount -= 100,
                _ => break err,
            }
        };
        // The type the send gate turns into the `change_not_affordable` code.
        assert!(
            matches!(
                error.downcast_ref::<UtxoSelectionError>(),
                Some(UtxoSelectionError::ChangeNotAffordable { .. })
            ),
            "{error:#}"
        );
    }

    #[test]
    fn a_send_the_node_refused_reaches_the_ui_as_not_accepted() {
        let refused = TxSubmissionResponse {
            accepted: false,
            rejection_reason: TxSubmissionRejectionReason::Orphan,
            is_synced: true,
            details: None,
        };
        let first = record_first_broadcast(None, 3u64.into(), Ok(refused));
        let receipt = SendReceipt {
            tx_id: "7".to_string(),
            accepted_by_node: first.accepted_by_node,
            node_reason: first.node_reason,
        };
        // The field names SendModal reads.
        let json = serde_json::to_value(&receipt).expect("json");
        assert_eq!(json["accepted_by_node"], serde_json::json!(false));
        assert!(
            json["node_reason"].as_str().is_some_and(|r| !r.is_empty()),
            "{json}"
        );
    }

    #[test]
    fn an_unreadable_wallet_db_blocks_deleting_it() {
        let dir = tempfile::tempdir().expect("temp dir");
        let path = dir.path().join("wallet.db");
        std::fs::write(&path, "not a database").expect("file");
        let err = pending_burns_guard(&path).expect_err("refused");
        assert!(err.to_string().starts_with("Couldn't check"), "{err}");
    }

    #[test]
    fn a_burn_is_timed_by_when_it_was_made() {
        let dir = tempfile::tempdir().expect("temp dir");
        let pool = minotari_wallet::db::init_db(dir.path().join("wallet.db")).expect("db");
        let conn = pool.get().expect("connection");
        conn.execute_batch("PRAGMA foreign_keys = OFF")
            .expect("pragma");
        for id in [1u8, 3] {
            conn.execute(
                "INSERT INTO burn_proofs (account_id, output_hash, commitment, claim_public_key,
                   ownership_proof_nonce, ownership_proof_sig, kernel_excess, kernel_excess_nonce,
                   kernel_excess_sig, sender_offset_public_key, encrypted_data, value, created_at)
                 VALUES (1, ?1, ?2, '', x'', x'', x'', x'', x'', x'', x'', 1, '2026-09-24 12:00:00')",
                ([id; 32].as_slice(), [id + 1; 32].as_slice()),
            )
            .expect("burn proof");
        }

        let times = burn_times(&conn).expect("times");
        assert_eq!(times.len(), 2);
        assert_eq!(times.get(&hex::encode([2u8; 32])), Some(&1_790_251_200));
        assert_eq!(times.get(&hex::encode([4u8; 32])), Some(&1_790_251_200));
    }

    #[test]
    fn blocks_won_are_reported_only_when_synced_and_notifications_are_allowed() {
        let coinbases = vec![(7u64.into(), 7), (9u64.into(), 9)];
        assert_eq!(
            blocks_to_report(&mut HashSet::new(), true, true, coinbases.clone()),
            vec![7, 9]
        );
        assert!(blocks_to_report(&mut HashSet::new(), true, false, coinbases.clone()).is_empty());
        assert!(blocks_to_report(&mut HashSet::new(), false, true, coinbases).is_empty());
    }

    #[test]
    fn a_coinbase_is_reported_once_however_often_its_status_changes() {
        let mut seen = HashSet::new();
        let coinbase = vec![(5u64.into(), 120)];
        // Found Unconfirmed by the scan.
        assert_eq!(
            blocks_to_report(&mut seen, true, true, coinbase.clone()),
            vec![120]
        );
        // Re-sent by the monitor as Locked, then as Confirmed.
        assert!(blocks_to_report(&mut seen, true, true, coinbase.clone()).is_empty());
        assert!(blocks_to_report(&mut seen, true, true, coinbase).is_empty());
    }

    #[test]
    fn a_coinbase_seen_while_syncing_is_not_reported_when_its_status_changes_later() {
        let mut seen = HashSet::new();
        assert!(blocks_to_report(&mut seen, false, true, vec![(5u64.into(), 120)]).is_empty());
        assert!(blocks_to_report(&mut seen, true, true, vec![(5u64.into(), 120)]).is_empty());
        assert_eq!(
            blocks_to_report(&mut seen, true, true, vec![(6u64.into(), 121)]),
            vec![121]
        );
    }

    #[test]
    fn progress_matches_the_scanned_over_total_heights_shown_beside_it() {
        // "300,000 / 400,000" reads as 75%, so that is what the bar shows.
        assert_eq!(scan_progress_percent(300_000, 400_000), 75.0);
    }

    #[test]
    fn progress_clamps_at_100_when_the_tip_is_stale() {
        // The cached node tip lags the blocks the scanner is reporting.
        assert_eq!(scan_progress_percent(500, 400), 100.0);
    }

    #[test]
    fn progress_is_zero_without_a_usable_tip() {
        // No node status yet.
        assert_eq!(scan_progress_percent(350_000, 0), 0.0);
    }
}
