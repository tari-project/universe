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

use std::path::PathBuf;

use crate::{APPLICATION_FOLDER_ID, tasks_tracker::TasksTrackers};
use log::{error, info, warn};
use minotari_wallet::{db::SqlitePool, init_db};
use r2d2::PooledConnection;
use r2d2_sqlite::SqliteConnectionManager;
use tari_common::configuration::Network;
use tokio::sync::RwLock;

const CONNECTION_HEALTH_CHECK_INTERVAL_SECS: u64 = 60;

pub const DEFAULT_ACCOUNT_ID: i64 = 1;

pub struct MinotariWalletDatabaseManager {
    database_pool: RwLock<Option<SqlitePool>>,
}

impl MinotariWalletDatabaseManager {
    pub fn new() -> Self {
        Self {
            database_pool: RwLock::new(None),
        }
    }

    pub async fn initialize(&self, database_path: &str) -> Result<(), anyhow::Error> {
        let pool = init_db(PathBuf::from(database_path))?;
        let mut pool_lock = self.database_pool.write().await;
        *pool_lock = Some(pool);
        Ok(())
    }

    pub fn database_path() -> Result<String, anyhow::Error> {
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

    pub async fn get_pool(&self) -> Result<SqlitePool, anyhow::Error> {
        let pool_lock = self.database_pool.read().await;
        let pool = pool_lock
            .as_ref()
            .ok_or_else(|| anyhow::anyhow!("Database pool not initialized"))?;
        Ok(pool.clone())
    }

    pub async fn get_connection(
        &self,
    ) -> Result<PooledConnection<SqliteConnectionManager>, anyhow::Error> {
        let pool_lock = self.database_pool.read().await;
        let pool = pool_lock
            .as_ref()
            .ok_or_else(|| anyhow::anyhow!("Database pool not initialized"))?;
        let connection = pool.get()?;
        Ok(connection)
    }

    pub async fn start_health_check(&self) {
        let mut shutdown_signal = TasksTrackers::current().wallet_phase.get_signal().await;

        let pool_lock = self.database_pool.read().await;
        let pool_clone = pool_lock.clone();
        drop(pool_lock);

        TasksTrackers::current()
            .wallet_phase
            .get_task_tracker()
            .await
            .spawn(async move {
                let mut interval = tokio::time::interval(tokio::time::Duration::from_secs(
                    CONNECTION_HEALTH_CHECK_INTERVAL_SECS,
                ));
                loop {
                    tokio::select! {
                        _ = interval.tick() => {
                            if let Some(pool) = &pool_clone {
                                match pool.get() {
                                    Ok(_) => {
                                        log::debug!(target: LOG_TARGET, "Database connection health check passed");
                                    }
                                    Err(e) => {
                                        error!(
                                            target: LOG_TARGET,
                                            "Database connection health check failed: {}", e
                                        );
                                        warn!(target: LOG_TARGET, "Database connection unhealthy: {}", e);
                                    }
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

    #[allow(dead_code)]
    pub async fn get_account_by_name(
        &self,
        friendly_name: &str,
    ) -> Result<Option<minotari_wallet::db::AccountRow>, anyhow::Error> {
        let conn = self.get_connection().await?;
        let account = minotari_wallet::db::get_account_by_name(&conn, friendly_name)?;
        Ok(account)
    }
}

impl Default for MinotariWalletDatabaseManager {
    fn default() -> Self {
        Self::new()
    }
}
