// Copyright 2024. The Tari Project
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

use std::{
    future::Future,
    pin::Pin,
    sync::{
        atomic::{AtomicBool, AtomicU64, Ordering},
        Arc,
    },
    time::{Duration, SystemTime},
};

use anyhow::Error;
use log::{debug, warn};
use sqlx::{sqlite::SqlitePool, Row};
use tokio::{sync::RwLock, task::JoinHandle};

use crate::configs::config_database_listener::ConfigDatabaseListener;

static LOG_TARGET: &str = "tari::universe::database_listener";

/// Strategy for detecting changes in database tables
/// Each strategy contains its own cached value
#[derive(Clone)]
pub enum ChangeDetectionStrategy {
    /// Track maximum value (e.g., last highest height value in a table)
    MaxValue {
        query: &'static str,
        cached_value: Arc<RwLock<Option<i64>>>,
    },
}

impl ChangeDetectionStrategy {
    /// Check if the table has changed by comparing current value with cached value
    pub async fn check_change(&self, pool: &SqlitePool, account_id: i64) -> Result<bool, Error> {
        match self {
            Self::MaxValue {
                query,
                cached_value,
            } => {
                let current = Self::query_single_i64(pool, query, account_id).await?;
                let mut cache = cached_value.write().await;

                let changed = match *cache {
                    None => {
                        // First check, initialize cache
                        *cache = current;
                        false
                    }
                    Some(cached) => {
                        if let Some(current_val) = current {
                            if current_val > cached {
                                *cache = Some(current_val);
                                true
                            } else {
                                false
                            }
                        } else {
                            false
                        }
                    }
                };

                Ok(changed)
            }
        }
    }

    /// Get the current cached value as i64 (for simple strategies)
    pub async fn get_cached_value(&self) -> Option<i64> {
        match self {
            Self::MaxValue { cached_value, .. } => *cached_value.read().await,
        }
    }

    /// Update the cached value (used during initialization from config)
    pub async fn update_cached_value(&self, new_value: i64) {
        match self {
            Self::MaxValue { cached_value, .. } => {
                *cached_value.write().await = Some(new_value);
            }
        }
    }

    // Helper to query a single i64 value
    async fn query_single_i64(
        pool: &SqlitePool,
        query: &str,
        account_id: i64,
    ) -> Result<Option<i64>, Error> {
        let row = sqlx::query(query)
            .bind(account_id)
            .fetch_optional(pool)
            .await?;

        Ok(row.and_then(|r| r.try_get::<Option<i64>, _>(0).ok().flatten()))
    }
}

/// Configuration for when to sync in-memory cache to persistent config
#[derive(Clone, Debug)]
pub enum ConfigSyncStrategy {
    /// Persist after N changes detected
    #[allow(dead_code)]
    ChangeThreshold(u64),
    /// Persist every N seconds
    #[allow(dead_code)]
    TimeInterval(Duration),
    /// Only persist on shutdown
    #[allow(dead_code)]
    ShutdownOnly,
    /// Persist after every change (highest I/O)
    Immediate,
}

impl Default for ConfigSyncStrategy {
    fn default() -> Self {
        Self::Immediate
    }
}

impl ConfigSyncStrategy {
    fn should_sync(&self, changes_count: u64, last_sync_elapsed: Duration) -> bool {
        match self {
            Self::ChangeThreshold(threshold) => changes_count >= *threshold,
            Self::TimeInterval(interval) => last_sync_elapsed >= *interval,
            Self::ShutdownOnly => false,
            Self::Immediate => true,
        }
    }
}

type AsyncCallback = Box<dyn Fn() -> Pin<Box<dyn Future<Output = ()> + Send>> + Send + Sync>;
type PerRowTypedCallback<T> =
    Box<dyn Fn(T) -> Pin<Box<dyn Future<Output = ()> + Send>> + Send + Sync>;

/// Callback execution mode
#[derive(Clone)]
enum CallbackMode {
    /// Execute callback once when any change is detected
    OnChange(Arc<AsyncCallback>),
    /// Execute callback for each new row since last cached value
    PerNewRowTyped {
        callback: Arc<dyn std::any::Any + Send + Sync>,
        fetch_query: String,
        executor: Arc<
            dyn Fn(
                    &SqlitePool,
                    &str,
                    i64,
                    i64,
                    Arc<dyn std::any::Any + Send + Sync>,
                ) -> Pin<Box<dyn Future<Output = Result<(), Error>> + Send>>
                + Send
                + Sync,
        >,
    },
}

/// Watches a specific database table for changes
#[derive(Clone)]
pub struct TableWatcher {
    table_name: String,
    account_id: i64,
    detection_strategy: ChangeDetectionStrategy,
    callback_mode: CallbackMode,
    polling_interval: Duration,
    sync_strategy: ConfigSyncStrategy,
    last_config_sync: Arc<RwLock<SystemTime>>,
    changes_since_sync: Arc<AtomicU64>,
}

impl TableWatcher {
    /// Create a new table watcher and load initial state from config
    pub async fn new(
        table_name: String,
        account_id: i64,
        detection_strategy: ChangeDetectionStrategy,
        polling_interval: Duration,
        sync_strategy: ConfigSyncStrategy,
    ) -> Self {
        // Try to load cached value from ConfigDatabaseListener
        let initial_value = ConfigDatabaseListener::get_cached_state(account_id, &table_name)
            .await
            .map(|state| state.last_known_value);

        // Initialize detection strategy with cached value if available
        if let Some(value) = initial_value {
            debug!(
                target: LOG_TARGET,
                "Loaded cached value {} for table {} (account {})",
                value,
                table_name,
                account_id
            );
            detection_strategy.update_cached_value(value).await;
        }

        Self {
            table_name,
            account_id,
            detection_strategy,
            callback_mode: CallbackMode::OnChange(Arc::new(Box::new(|| Box::pin(async {})))),
            polling_interval,
            sync_strategy,
            last_config_sync: Arc::new(RwLock::new(SystemTime::now())),
            changes_since_sync: Arc::new(AtomicU64::new(0)),
        }
    }

    /// Set the callback function to execute when changes are detected
    pub fn with_callback<F>(mut self, callback: F) -> Self
    where
        F: Fn() -> Pin<Box<dyn Future<Output = ()> + Send>> + Send + Sync + 'static,
    {
        self.callback_mode = CallbackMode::OnChange(Arc::new(Box::new(callback)));
        self
    }

    pub fn with_typed_callback<T>(
        mut self,
        fetch_query: String,
        callback: impl Fn(T) -> Pin<Box<dyn Future<Output = ()> + Send>> + Send + Sync + 'static,
    ) -> Self
    where
        T: for<'r> sqlx::FromRow<'r, sqlx::sqlite::SqliteRow> + Send + Unpin + 'static,
    {
        let callback_arc: Arc<PerRowTypedCallback<T>> = Arc::new(Box::new(callback));
        let callback_any = callback_arc.clone() as Arc<dyn std::any::Any + Send + Sync>;

        // Create an executor function that knows how to deserialize T
        let executor = Arc::new(
            move |pool: &SqlitePool,
                  query: &str,
                  account_id: i64,
                  old_max_id: i64,
                  callback_any: Arc<dyn std::any::Any + Send + Sync>| {
                let pool = pool.clone();
                let query = query.to_string();
                Box::pin(async move {
                    // Downcast the callback back to its concrete type
                    let callback = callback_any
                        .downcast_ref::<PerRowTypedCallback<T>>()
                        .expect("Failed to downcast callback");

                    // Fetch rows and deserialize into T
                    let rows = sqlx::query_as::<_, T>(&query)
                        .bind(account_id)
                        .bind(old_max_id)
                        .fetch_all(&pool)
                        .await?;

                    debug!(
                        target: LOG_TARGET,
                        "Fetched {} typed rows",
                        rows.len()
                    );

                    for row in rows {
                        callback(row).await;
                    }

                    Ok(())
                }) as Pin<Box<dyn Future<Output = Result<(), Error>> + Send>>
            },
        );

        self.callback_mode = CallbackMode::PerNewRowTyped {
            callback: callback_any,
            fetch_query,
            executor,
        };
        self
    }

    /// Check for changes and trigger callback if detected
    pub async fn check_and_trigger(&self, pool: &SqlitePool) -> Result<bool, Error> {
        let old_cached_value = match &self.callback_mode {
            CallbackMode::PerNewRowTyped { .. } => self.detection_strategy.get_cached_value().await,
            CallbackMode::OnChange(_) => None,
        };

        let changed = self
            .detection_strategy
            .check_change(pool, self.account_id)
            .await?;

        if changed {
            debug!(
                target: LOG_TARGET,
                "Change detected in table {} for account {}",
                self.table_name,
                self.account_id
            );

            let changes = self.changes_since_sync.fetch_add(1, Ordering::SeqCst) + 1;

            match &self.callback_mode {
                CallbackMode::OnChange(callback) => {
                    callback().await;
                }
                CallbackMode::PerNewRowTyped {
                    callback,
                    fetch_query,
                    executor,
                } => {
                    if let Some(old_max_id) = old_cached_value {
                        if let Err(e) = executor(
                            pool,
                            fetch_query,
                            self.account_id,
                            old_max_id,
                            callback.clone(),
                        )
                        .await
                        {
                            warn!(
                                target: LOG_TARGET,
                                "Failed to execute typed per-row callbacks for table {}: {:?}",
                                self.table_name,
                                e
                            );
                        }
                    }
                }
            }

            if self.should_sync_to_config(changes).await {
                if let Err(e) = self.sync_to_config().await {
                    warn!(
                        target: LOG_TARGET,
                        "Failed to sync table {} to config: {:?}",
                        self.table_name,
                        e
                    );
                }
            }
        }

        Ok(changed)
    }

    /// Determine if we should persist to disk based on sync strategy
    async fn should_sync_to_config(&self, changes_count: u64) -> bool {
        let last_sync = *self.last_config_sync.read().await;
        let elapsed = last_sync.elapsed().unwrap_or_default();

        self.sync_strategy.should_sync(changes_count, elapsed)
    }

    /// Persist current in-memory state to ConfigDatabaseListener
    async fn sync_to_config(&self) -> Result<(), Error> {
        if let Some(value) = self.detection_strategy.get_cached_value().await {
            debug!(
                target: LOG_TARGET,
                "Syncing table {} (account {}) to config with value {}",
                self.table_name,
                self.account_id,
                value
            );

            ConfigDatabaseListener::update_cached_state(
                self.account_id,
                self.table_name.clone(),
                value,
            )
            .await?;

            // Reset counters
            *self.last_config_sync.write().await = SystemTime::now();
            self.changes_since_sync.store(0, Ordering::SeqCst);
        }
        Ok(())
    }

    /// Force immediate sync to config (called on shutdown)
    pub async fn flush(&self) -> Result<(), Error> {
        self.sync_to_config().await
    }

    pub fn get_polling_interval(&self) -> Duration {
        self.polling_interval
    }

    pub fn get_table_name(&self) -> &str {
        &self.table_name
    }
}

/// Main database listener that manages multiple table watchers
pub struct DatabaseListener {
    pool: SqlitePool,
    table_watchers: Vec<TableWatcher>,
    is_running: Arc<AtomicBool>,
    task_handles: Vec<JoinHandle<()>>,
}

impl DatabaseListener {
    /// Create a new database listener with the given SQLite connection pool
    pub fn new(pool: SqlitePool) -> Self {
        Self {
            pool,
            table_watchers: Vec::new(),
            is_running: Arc::new(AtomicBool::new(false)),
            task_handles: Vec::new(),
        }
    }

    /// Add a table watcher to the listener
    pub fn add_watcher(&mut self, watcher: TableWatcher) {
        self.table_watchers.push(watcher);
    }

    /// Start listening for changes on all registered watchers
    pub async fn start(&mut self) -> Result<(), Error> {
        if self.is_running.load(Ordering::SeqCst) {
            warn!(target: LOG_TARGET, "Database listener already running");
            return Ok(());
        }

        debug!(
            target: LOG_TARGET,
            "Starting database listener with {} watchers",
            self.table_watchers.len()
        );

        self.is_running.store(true, Ordering::SeqCst);

        for watcher in &self.table_watchers {
            let pool = self.pool.clone();
            let watcher = watcher.clone();
            let is_running = self.is_running.clone();

            let handle = tokio::spawn(async move {
                let mut interval = tokio::time::interval(watcher.get_polling_interval());
                interval.set_missed_tick_behavior(tokio::time::MissedTickBehavior::Skip);

                debug!(
                    target: LOG_TARGET,
                    "Started watcher for table: {}",
                    watcher.get_table_name()
                );

                while is_running.load(Ordering::SeqCst) {
                    interval.tick().await;

                    if let Err(e) = watcher.check_and_trigger(&pool).await {
                        warn!(
                            target: LOG_TARGET,
                            "Error checking table {}: {:?}",
                            watcher.get_table_name(),
                            e
                        );
                    }
                }

                debug!(
                    target: LOG_TARGET,
                    "Stopped watcher for table: {}",
                    watcher.get_table_name()
                );
            });

            self.task_handles.push(handle);
        }

        Ok(())
    }

    /// Stop listening and flush all watchers to config
    pub async fn stop(&mut self) -> Result<(), Error> {
        if !self.is_running.load(Ordering::SeqCst) {
            return Ok(());
        }

        debug!(target: LOG_TARGET, "Stopping database listener");

        self.is_running.store(false, Ordering::SeqCst);

        for handle in self.task_handles.drain(..) {
            let _ = handle.await;
        }

        debug!(target: LOG_TARGET, "Flushing all watchers to config");
        for watcher in &self.table_watchers {
            if let Err(e) = watcher.flush().await {
                warn!(
                    target: LOG_TARGET,
                    "Failed to flush watcher for table {}: {:?}",
                    watcher.get_table_name(),
                    e
                );
            }
        }

        debug!(target: LOG_TARGET, "Database listener stopped");

        Ok(())
    }

    #[allow(dead_code)]
    /// Check if the listener is running
    pub fn is_running(&self) -> bool {
        self.is_running.load(Ordering::SeqCst)
    }

    #[allow(dead_code)]
    /// Get the number of registered watchers
    pub fn watcher_count(&self) -> usize {
        self.table_watchers.len()
    }
}

/// Predefined watchers for common minotari-wallet tables
pub mod predefined_watchers {
    use super::*;

    #[allow(dead_code)]
    /// Create a watcher for the balance_changes table
    /// Tracks changes by monitoring the maximum effective_height
    pub async fn balance_changes_watcher(account_id: i64) -> TableWatcher {
        TableWatcher::new(
            "balance_changes".to_string(),
            account_id,
            ChangeDetectionStrategy::MaxValue {
                query: "SELECT MAX(effective_height) FROM balance_changes WHERE account_id = ?",
                cached_value: Arc::new(RwLock::new(None)),
            },
            Duration::from_secs(2), // Check every 2 seconds
            ConfigSyncStrategy::default(),
        )
        .await
    }

    /// Create a watcher for the scanned_tip_blocks table
    /// Tracks changes by monitoring the maximum height
    pub async fn scanned_tip_blocks_watcher(account_id: i64) -> TableWatcher {
        TableWatcher::new(
            "scanned_tip_blocks".to_string(),
            account_id,
            ChangeDetectionStrategy::MaxValue {
                query: "SELECT MAX(height) FROM scanned_tip_blocks WHERE account_id = ?",
                cached_value: Arc::new(RwLock::new(None)),
            },
            Duration::from_secs(1), // Check every 1 second for fast updates
            ConfigSyncStrategy::default(),
        )
        .await
    }

    pub async fn typed_watcher(
        table_name: &str,
        account_id: i64,
        max_id_query: &'static str,
        polling_interval: Duration,
        sync_strategy: ConfigSyncStrategy,
    ) -> TableWatcher {
        TableWatcher::new(
            table_name.to_string(),
            account_id,
            ChangeDetectionStrategy::MaxValue {
                query: max_id_query,
                cached_value: Arc::new(RwLock::new(None)),
            },
            polling_interval,
            sync_strategy,
        )
        .await
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use tokio::time::sleep;

    async fn setup_test_db() -> Result<SqlitePool, Error> {
        let pool = SqlitePool::connect("sqlite::memory:").await?;

        // Create test tables
        sqlx::query(
            r#"
            CREATE TABLE balance_changes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                account_id INTEGER NOT NULL,
                effective_height INTEGER
            )
            "#,
        )
        .execute(&pool)
        .await?;

        sqlx::query(
            r#"
            CREATE TABLE events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                account_id INTEGER NOT NULL,
                event_type TEXT
            )
            "#,
        )
        .execute(&pool)
        .await?;

        Ok(pool)
    }

    #[tokio::test]
    async fn test_change_detection_strategy_max_height() -> Result<(), Error> {
        let pool = setup_test_db().await?;
        let account_id = 1;

        // Insert initial row
        sqlx::query("INSERT INTO balance_changes (account_id, effective_height) VALUES (?, ?)")
            .bind(account_id)
            .bind(100)
            .execute(&pool)
            .await?;

        let strategy = ChangeDetectionStrategy::MaxValue {
            query: "SELECT MAX(effective_height) FROM balance_changes WHERE account_id = ?",
            cached_value: Arc::new(RwLock::new(None)),
        };

        // First check - should initialize cache with current value, no change
        let changed = strategy.check_change(&pool, account_id).await?;
        assert!(
            !changed,
            "First check should not detect change, just initialize"
        );

        // Second check - no new data
        let changed = strategy.check_change(&pool, account_id).await?;
        assert!(!changed, "Should not detect change when no new data");

        // Insert row with higher height
        sqlx::query("INSERT INTO balance_changes (account_id, effective_height) VALUES (?, ?)")
            .bind(account_id)
            .bind(200)
            .execute(&pool)
            .await?;

        // Should detect change
        let changed = strategy.check_change(&pool, account_id).await?;
        assert!(changed, "Should detect higher height");

        // Check again - no new changes
        let changed = strategy.check_change(&pool, account_id).await?;
        assert!(!changed, "Should not detect change after already detected");

        Ok(())
    }

    #[tokio::test]
    async fn test_change_detection_strategy_max_id() -> Result<(), Error> {
        let pool = setup_test_db().await?;
        let account_id = 1;

        // Insert initial event
        sqlx::query("INSERT INTO events (account_id, event_type) VALUES (?, ?)")
            .bind(account_id)
            .bind("initial")
            .execute(&pool)
            .await?;

        let strategy = ChangeDetectionStrategy::MaxValue {
            query: "SELECT MAX(id) FROM events WHERE account_id = ?",
            cached_value: Arc::new(RwLock::new(None)),
        };

        // First check - initialize with existing data
        let changed = strategy.check_change(&pool, account_id).await?;
        assert!(!changed, "First check initializes, no change");

        // Insert another event
        sqlx::query("INSERT INTO events (account_id, event_type) VALUES (?, ?)")
            .bind(account_id)
            .bind("new_event")
            .execute(&pool)
            .await?;

        // Should detect change
        let changed = strategy.check_change(&pool, account_id).await?;
        assert!(changed, "Should detect new event");

        // Check again - no new changes
        let changed = strategy.check_change(&pool, account_id).await?;
        assert!(!changed, "No new changes");

        Ok(())
    }

    #[tokio::test]
    async fn test_table_watcher_callback() -> Result<(), Error> {
        let pool = setup_test_db().await?;
        let account_id = 1;

        // Insert initial data
        sqlx::query("INSERT INTO balance_changes (account_id, effective_height) VALUES (?, ?)")
            .bind(account_id)
            .bind(100)
            .execute(&pool)
            .await?;

        let callback_triggered = Arc::new(std::sync::atomic::AtomicBool::new(false));
        let callback_clone = callback_triggered.clone();

        let watcher = TableWatcher::new(
            "balance_changes".to_string(),
            account_id,
            ChangeDetectionStrategy::MaxValue {
                query: "SELECT MAX(effective_height) FROM balance_changes WHERE account_id = ?",
                cached_value: Arc::new(RwLock::new(None)),
            },
            Duration::from_millis(100),
            ConfigSyncStrategy::ShutdownOnly,
        )
        .await
        .with_callback(move || {
            let flag = callback_clone.clone();
            Box::pin(async move {
                flag.store(true, std::sync::atomic::Ordering::SeqCst);
            })
        });

        // First check - initialize, no callback
        watcher.check_and_trigger(&pool).await?;
        assert!(!callback_triggered.load(std::sync::atomic::Ordering::SeqCst));

        // Insert new data with higher height
        sqlx::query("INSERT INTO balance_changes (account_id, effective_height) VALUES (?, ?)")
            .bind(account_id)
            .bind(200)
            .execute(&pool)
            .await?;

        // Check again - should trigger callback
        watcher.check_and_trigger(&pool).await?;
        assert!(callback_triggered.load(std::sync::atomic::Ordering::SeqCst));

        Ok(())
    }

    #[tokio::test]
    async fn test_database_listener_lifecycle() -> Result<(), Error> {
        let pool = setup_test_db().await?;
        let mut listener = DatabaseListener::new(pool.clone());

        assert!(!listener.is_running());
        assert_eq!(listener.watcher_count(), 0);

        // Add a watcher
        let watcher = predefined_watchers::balance_changes_watcher(1).await;
        listener.add_watcher(watcher);

        assert_eq!(listener.watcher_count(), 1);

        // Start listening
        listener.start().await?;
        assert!(listener.is_running());

        // Let it run briefly
        sleep(Duration::from_millis(100)).await;

        // Stop
        listener.stop().await?;
        assert!(!listener.is_running());

        Ok(())
    }

    #[tokio::test]
    async fn test_config_sync_strategy() {
        let duration = ConfigSyncStrategy::TimeInterval(Duration::from_secs(10));

        assert!(duration.should_sync(1, Duration::from_secs(10)));
        assert!(!duration.should_sync(1, Duration::from_secs(5)));

        let threshold = ConfigSyncStrategy::ChangeThreshold(10);
        assert!(threshold.should_sync(10, Duration::from_secs(1)));
        assert!(!threshold.should_sync(9, Duration::from_secs(1000)));

        let immediate = ConfigSyncStrategy::Immediate;
        assert!(immediate.should_sync(1, Duration::from_secs(0)));

        let shutdown_only = ConfigSyncStrategy::ShutdownOnly;
        assert!(!shutdown_only.should_sync(100, Duration::from_secs(1000)));
    }

    #[tokio::test]
    async fn test_typed_callback() -> Result<(), Error> {
        use sqlx::FromRow;

        let pool = setup_test_db().await?;
        let account_id = 1;

        // Define a struct that matches the events table
        #[derive(FromRow, Debug, Clone)]
        struct EventRow {
            id: i64,
            event_type: String,
        }

        // Insert initial events
        sqlx::query("INSERT INTO events (account_id, event_type) VALUES (?, ?)")
            .bind(account_id)
            .bind("event1")
            .execute(&pool)
            .await?;

        sqlx::query("INSERT INTO events (account_id, event_type) VALUES (?, ?)")
            .bind(account_id)
            .bind("event2")
            .execute(&pool)
            .await?;

        // Create a counter and vector to track callback executions
        let callback_count = Arc::new(AtomicU64::new(0));
        let count_clone = callback_count.clone();
        let events = Arc::new(tokio::sync::Mutex::new(Vec::new()));
        let events_clone = events.clone();

        // Create watcher with typed callback
        let watcher = predefined_watchers::typed_watcher(
            "events",
            account_id,
            "SELECT MAX(id) FROM events WHERE account_id = ?",
            Duration::from_secs(1),
            ConfigSyncStrategy::default(),
        )
        .await
        .with_typed_callback::<EventRow>(
            "SELECT id, event_type FROM events WHERE account_id = ? AND id > ? ORDER BY id"
                .to_string(),
            move |event: EventRow| {
                let count = count_clone.clone();
                let events = events_clone.clone();
                Box::pin(async move {
                    count.fetch_add(1, Ordering::SeqCst);
                    events.lock().await.push(event);
                })
            },
        );

        // First check - should initialize but not trigger callbacks
        let changed = watcher.check_and_trigger(&pool).await?;
        assert!(!changed, "First check should initialize");
        assert_eq!(
            callback_count.load(Ordering::SeqCst),
            0,
            "No callbacks on first check"
        );

        // Insert new events
        sqlx::query("INSERT INTO events (account_id, event_type) VALUES (?, ?)")
            .bind(account_id)
            .bind("event3")
            .execute(&pool)
            .await?;

        sqlx::query("INSERT INTO events (account_id, event_type) VALUES (?, ?)")
            .bind(account_id)
            .bind("event4")
            .execute(&pool)
            .await?;

        // Second check - should detect change and execute callback for each new row
        let changed = watcher.check_and_trigger(&pool).await?;
        assert!(changed, "Should detect new events");
        assert_eq!(
            callback_count.load(Ordering::SeqCst),
            2,
            "Should execute callback twice (once per new row)"
        );

        // Verify we got the correct events
        let captured_events = events.lock().await;
        assert_eq!(captured_events.len(), 2);
        assert_eq!(captured_events[0].id, 3);
        assert_eq!(captured_events[0].event_type, "event3");
        assert_eq!(captured_events[1].id, 4);
        assert_eq!(captured_events[1].event_type, "event4");

        Ok(())
    }
}
