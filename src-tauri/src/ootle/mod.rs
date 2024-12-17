use std::{
    collections::HashMap,
    path::PathBuf,
    sync::{Arc, Mutex},
};

use anyhow::Error;
use db_connection::try_get_tokens;
use diesel::SqliteConnection;
use log::{error, info};
use tapplet_server::{setup_log, start};
use tauri::Manager;
use tokio_util::sync::CancellationToken;
use wallet_daemon::start_wallet_daemon;

use crate::{
    consts::{DB_FILE_NAME, TAPPLETS_ASSETS_DIR, WALLET_DAEMON_CONFIG_FILE},
    database,
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

pub async fn setup_tari_universe(
    app: tauri::AppHandle,
    data_dir: PathBuf,
    log_dir: PathBuf,
    config_dir: PathBuf,
) -> Result<(), Box<dyn std::error::Error>> {
    let log_tapp_dir = log_dir.clone();
    let wallet_daemon_config_file = config_dir.join(WALLET_DAEMON_CONFIG_FILE);
    info!(target: LOG_TARGET,"🚨 Start wallet daemon");
    if let Err(e) = start_wallet_daemon(log_dir, data_dir, wallet_daemon_config_file).await {
        error!(target: LOG_TARGET, "Could not start wallet daemon: {:?}", e);
    }

    info!(target: LOG_TARGET, "🚀 Wallet daemon started successfully");

    // app.manage(DatabaseConnection(Arc::new(Mutex::new(
    //     database::establish_connection(db_path.to_str().unwrap()),
    // ))));

    // app.manage(ShutdownTokens::default());
    // app.manage(Tokens {
    //     permission: Mutex::new("".to_string()),
    //     auth: Mutex::new("".to_string()),
    // });

    // let handle = tauri::async_runtime::spawn(try_get_tokens(None));
    // let (permission_token, auth_token) = tauri::async_runtime::block_on(handle)?;
    // let (permission_token, auth_token) = tauri::async_runtime::block_on(try_get_tokens(None));

    let _ = setup_log(log_tapp_dir).await;
    // // let handle_start = tauri::async_runtime::spawn(async move { start(tapp_assets_path).await });
    // let tapp_assets_path = app_data_dir.join(TAPPLETS_ASSETS_DIR);

    // let (addr, cancel_token) = start(tapp_assets_path).await.unwrap(); //TODO unwrap
    // app.manage(AssetServer { addr, cancel_token });
    // info!(target: LOG_TARGET, "🚀 Tari Universe setup completed successfully");

    Ok(())
}

pub async fn setup_tokens(app: tauri::AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    let tokens = app.state::<Tokens>();
    info!(target: LOG_TARGET,"🚨 Try get tokens");
    let (permission_token, auth_token) = try_get_tokens(None).await;
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
