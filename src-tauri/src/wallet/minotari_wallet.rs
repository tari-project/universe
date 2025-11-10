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

use minotari_wallet::scan::{init_with_view_key, scan};
use sqlx::sqlite::SqlitePool;
use std::sync::{atomic::AtomicBool, LazyLock};
use tari_common::configuration::Network;
use tokio::sync::Mutex;

use crate::{
    database::utils::database_listener::{predefined_watchers, ConfigSyncStrategy, DatabaseListener},
    internal_wallet::InternalWallet,
    tasks_tracker::TasksTrackers,
    APPLICATION_FOLDER_ID,
};
use log::{error, info, warn};
static LOG_TARGET: &str = "tari::universe::wallet::minotari_wallet_manager";
static INSTANCE: LazyLock<MinotariWalletManager> = LazyLock::new(MinotariWalletManager::new);

static DEFAULT_GRPC_URL: &str = "https://rpc.tari.com";
static DEFAULT_PASSWORD: &str = "test_password";
static DEFAULT_ACCOUNT_ID: i64 = 1; // Default account ID for now

// Structs for typed database rows
#[derive(sqlx::FromRow, Debug)]
struct OutputRow {
    id: i64,
    output_hash: Vec<u8>,
    value: i64,
    mined_in_block_height: i64,
}

#[derive(sqlx::FromRow, Debug)]
struct InputRow {
    id: i64,
    output_id: i64,
    mined_in_block_height: i64,
}

#[derive(sqlx::FromRow, Debug)]
struct EventRow {
    id: i64,
    event_type: String,
    description: String,
}

pub struct MinotariWalletManager {
    was_blockchain_scanned: AtomicBool, // Starts as false, set to true once the blockchain has been scanned so we don't show scanning UI again when block height is updated
    scanning_initiated: AtomicBool,
    db_listener: Mutex<Option<DatabaseListener>>,
}

impl MinotariWalletManager {
    pub fn new() -> Self {
        Self {
            was_blockchain_scanned: AtomicBool::new(false),
            scanning_initiated: AtomicBool::new(false),
            db_listener: Mutex::new(None),
        }
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

        Self::start_database_listener().await?;

        let mut shutdown_signal = TasksTrackers::current().common.get_signal().await;

        TasksTrackers::current().common.get_task_tracker().await.spawn(
            async move {
                loop {
                    tokio::select! {
                        result = Self::execute_blockchain_scan() => {
                            match result {
                                Ok(_) => {
                                    info!(
                                        target: LOG_TARGET,
                                        "Blockchain scan completed successfully."
                                    );
                                    INSTANCE.was_blockchain_scanned.store(true, std::sync::atomic::Ordering::SeqCst);
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
                            
                            // Stop listener on shutdown
                            if let Err(e) = Self::stop_database_listener().await {
                                error!(target: LOG_TARGET, "Failed to stop database listener: {:?}", e);
                            }
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
                    tokio::runtime::Handle::current().block_on(        scan(
            DEFAULT_PASSWORD,
            DEFAULT_GRPC_URL,
            database_path.as_str(),
            None,
            1000,
            100,
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

    async fn start_database_listener() -> Result<(), anyhow::Error> {
        let database_path = Self::database_path().await?;
        let db_url = format!("sqlite:///{}", database_path);
        let pool = SqlitePool::connect(&db_url).await?;

        info!(
            target: LOG_TARGET,
            "Starting database listener for wallet monitoring"
        );

        let mut listener = DatabaseListener::new(pool.clone());

        let tip_value = pool.clone();
        let scanned_blocks_watcher =
            predefined_watchers::scanned_tip_blocks_watcher(DEFAULT_ACCOUNT_ID)
                .await
                .with_callback(move || {
                    let pool = tip_value.clone();
                    Box::pin(async move {
                        if let Err(e) =
                            Self::log_scanned_tip_blocks(&pool, DEFAULT_ACCOUNT_ID).await
                        {
                            error!(target: LOG_TARGET, "Failed to log scanned tip blocks: {:?}", e);
                        }
                    })
                });
        listener.add_watcher(scanned_blocks_watcher);

        let outputs_watcher = predefined_watchers::typed_watcher(
            "outputs",
            DEFAULT_ACCOUNT_ID,
            "SELECT MAX(id) FROM outputs WHERE account_id = ?",
            std::time::Duration::from_secs(1),
            ConfigSyncStrategy::default(),
        )
        .await
        .with_typed_callback::<OutputRow>(
            "SELECT id, output_hash, value, mined_in_block_height FROM outputs WHERE account_id = ? AND id > ? ORDER BY id".to_string(),
            |output: OutputRow| {
                Box::pin(async move {
                    info!(
                        target: LOG_TARGET,
                        "💰 New Output - ID: {}, Hash: {}, Value: {}, Height: {}",
                        output.id,
                        hex::encode(&output.output_hash),
                        output.value,
                        output.mined_in_block_height
                    );
                })
            },
        );
        listener.add_watcher(outputs_watcher);

        let inputs_watcher = predefined_watchers::typed_watcher(
            "inputs",
            DEFAULT_ACCOUNT_ID,
            "SELECT MAX(id) FROM inputs WHERE account_id = ?",
            std::time::Duration::from_secs(1),
            ConfigSyncStrategy::default(),
        )
        .await
        .with_typed_callback::<InputRow>(
            "SELECT id, output_id, mined_in_block_height FROM inputs WHERE account_id = ? AND id > ? ORDER BY id".to_string(),
            |input: InputRow| {
                Box::pin(async move {
                    info!(
                        target: LOG_TARGET,
                        "📤 New Input - ID: {}, Output ID: {}, Height: {}",
                        input.id,
                        input.output_id,
                        input.mined_in_block_height
                    );
                })
            },
        );
        listener.add_watcher(inputs_watcher);

        let events_watcher = predefined_watchers::typed_watcher(
            "events",
            DEFAULT_ACCOUNT_ID,
            "SELECT MAX(id) FROM events WHERE account_id = ?",
            std::time::Duration::from_secs(1),
            ConfigSyncStrategy::default(),
        )
        .await
        .with_typed_callback::<EventRow>(
            "SELECT id, event_type, description FROM events WHERE account_id = ? AND id > ? ORDER BY id".to_string(),
            |event: EventRow| {
                Box::pin(async move {
                    info!(
                        target: LOG_TARGET,
                        "📝 New Event - ID: {}, Type: {}, Description: {}",
                        event.id,
                        event.event_type,
                        event.description
                    );
                })
            },
        );
        listener.add_watcher(events_watcher);

        // Start the listener
        listener.start().await?;

        // Store the listener in the instance
        *INSTANCE.db_listener.lock().await = Some(listener);

        info!(
            target: LOG_TARGET,
            "Database listener started successfully with {} watchers",
            4
        );

        Ok(())
    }

    async fn stop_database_listener() -> Result<(), anyhow::Error> {
        let mut listener_guard = INSTANCE.db_listener.lock().await;
        if let Some(mut listener) = listener_guard.take() {
            info!(target: LOG_TARGET, "Stopping database listener");
            listener.stop().await?;
            info!(target: LOG_TARGET, "Database listener stopped");
        }
        Ok(())
    }

    async fn log_scanned_tip_blocks(
        pool: &SqlitePool,
        account_id: i64,
    ) -> Result<(), anyhow::Error> {
        use sqlx::Row;

        let result = sqlx::query(
            r#"
            SELECT height, hash
            FROM scanned_tip_blocks
            WHERE account_id = ?
            ORDER BY height DESC
            LIMIT 1
            "#,
        )
        .bind(account_id)
        .fetch_optional(pool)
        .await?;

        if let Some(row) = result {
            let height: i64 = row.get("height");
            let hash: Vec<u8> = row.get("hash");
            info!(
                target: LOG_TARGET,
                "📊 Scanned Tip Block - Height: {}, Hash: {}",
                height,
                hex::encode(&hash)
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
            return Err(anyhow::anyhow!("Tari wallet details not found"));
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
