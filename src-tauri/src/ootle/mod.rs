use std::{
    collections::HashMap,
    path::PathBuf,
    sync::{Arc, Mutex},
};

use db_connection::try_get_tokens;
use diesel::SqliteConnection;
use log::{error, info};
use tauri::Manager;
use tokio_util::sync::CancellationToken;
use wallet_daemon::spawn_wallet_daemon;

use crate::{commands::get_ootle_wallet_jrpc_port, consts::WALLET_DAEMON_CONFIG_FILE};

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
}

impl Default for OotleWallet {
    fn default() -> Self {
        OotleWallet { jrpc_port: 18010 }
    }
}

pub async fn setup_tokens(app: tauri::AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    let jrpc_port = get_ootle_wallet_jrpc_port(app.state()).unwrap_or_default();
    let tokens = app.state::<Tokens>();
    let (permission_token, auth_token) = try_get_tokens(Some(jrpc_port)).await;
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
