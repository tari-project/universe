pub mod models;
pub mod store;

use log::{error, info};
use sqlx::{migrate::MigrateDatabase, sqlite::SqlitePoolOptions, SqlitePool};
use std::{fs, path::PathBuf};

pub const LOG_TARGET: &str = "tari::universe::database";

pub async fn initialize_database(db_path: &str) -> Result<SqlitePool, sqlx::Error> {
    let db_file = PathBuf::from(db_path);

    if let Some(parent) = db_file.parent() {
        if !parent.exists() {
            fs::create_dir_all(parent).map_err(|e| {
                error!(target: LOG_TARGET, "Failed to create database directory: {}", e);
                sqlx::Error::Io(e)
            })?;
        }
    }

    if !sqlx::Sqlite::database_exists(db_path)
        .await
        .unwrap_or(false)
    {
        info!(target: LOG_TARGET, "Creating database at: {}", db_path);
        sqlx::Sqlite::create_database(db_path).await?;
    }

    info!(target: LOG_TARGET, "Establishing database connection: {}", db_path);
    let pool = SqlitePoolOptions::new()
        .max_connections(5)
        .connect(db_path)
        .await?;

    info!(target: LOG_TARGET, "Running database migrations");
    sqlx::migrate!("./sqlite/migrations")
        .run(&pool)
        .await
        .map_err(|e| {
            error!(target: LOG_TARGET, "Failed to run migrations: {}", e);
            e
        })?;

    info!(target: LOG_TARGET, "Database initialization completed successfully");
    Ok(pool)
}
