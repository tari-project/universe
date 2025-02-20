use std::{
    collections::HashMap,
    path::PathBuf,
    sync::{Arc, Mutex},
};

use anyhow::Error;
use db_connection::try_get_tokens;
use diesel::SqliteConnection;
use log::{error, info};
use tapplet_server::start;
use tauri::Manager;
use tokio_util::sync::CancellationToken;
use wallet_daemon::spawn_wallet_daemon;

use crate::{
    consts::{DB_FILE_NAME, TAPPLETS_ASSETS_DIR, WALLET_DAEMON_CONFIG_FILE},
    database,
    port_allocator::PortAllocator,
};

pub mod db_connection;
pub mod error;
pub mod hash_calculator;
pub mod rpc;
pub mod tapplet_installer;
pub mod tapplet_server;
pub mod wallet_daemon;

const LOG_TARGET: &str = "tari::universe::main";

pub struct Tokens {
    pub auth: Mutex<String>,
    pub permission: Mutex<String>,
}
#[derive(Default)]
pub struct ShutdownTokens(pub Arc<tokio::sync::Mutex<HashMap<i32, CancellationToken>>>);

pub struct DatabaseConnection(pub Arc<Mutex<SqliteConnection>>);

pub struct AssetServer {
    pub addr: String,
    pub cancel_token: CancellationToken,
}

#[derive(Clone)]
pub struct OotleWallet {
    pub jrpc_port: u16,
    pub jrpc_address: String,
}

impl Default for OotleWallet {
    fn default() -> Self {
        OotleWallet {
            jrpc_port: 18010,
            jrpc_address: format!("127.0.0.1:18010"),
        }
    }
}

pub async fn setup_ootle_wallet(
    jrpc_port: u16,
    data_dir: PathBuf,
    log_dir: PathBuf,
    config_dir: PathBuf,
) -> Result<(), Box<dyn std::error::Error>> {
    let wallet_daemon_config_file = config_dir.join(WALLET_DAEMON_CONFIG_FILE);

    if let Err(e) =
        spawn_wallet_daemon(log_dir, data_dir, wallet_daemon_config_file, jrpc_port).await
    {
        error!(target: LOG_TARGET, "Could not start wallet daemon: {:?}", e);
    }
    info!(target: LOG_TARGET, "🌟 WALLET DAEMON DONE with jrpc_port {:?}", &jrpc_port);
    info!(target: LOG_TARGET, "🚀 Wallet daemon started successfully");

    Ok(())
}

pub async fn setup_tokens(
    app: tauri::AppHandle,
    jrpc_port: Option<u16>,
) -> Result<(), Box<dyn std::error::Error>> {
    let tokens = app.state::<Tokens>();
    let (permission_token, auth_token) = try_get_tokens(jrpc_port).await;
    info!(target: LOG_TARGET, "🚀 Tokens setup successfully");
    tokens
        .permission
        .lock()
        .map_err(|_| error::Error::FailedToObtainPermissionTokenLock)
        .unwrap()
        .replace_range(.., &permission_token);
    tokens
        .auth
        .lock()
        .map_err(|_| error::Error::FailedToObtainAuthTokenLock)
        .unwrap()
        .replace_range(.., &auth_token);
    info!(target: LOG_TARGET, "🚀 Tokens initialized successfully");

    Ok(())
}
