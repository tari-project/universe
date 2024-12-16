use std::{
    path::PathBuf,
    sync::{Arc, Mutex},
};

use db_connection::{try_get_tokens, AssetServer, DatabaseConnection};
use log::info;
use log4rs::config::RawConfig;
use tapplet_server::{setup_log, start};
use tauri::Manager;
use wallet_daemon::start_wallet_daemon;

use crate::{
    commands::Tokens,
    consts::{DB_FILE_NAME, TAPPLETS_ASSETS_DIR},
    database,
    utils::logging_utils::setup_logging,
};

pub mod db_connection;
pub mod error;
pub mod hash_calculator;
pub mod rpc;
pub mod tapplet_installer;
pub mod tapplet_server;
pub mod wallet_daemon;

const LOG_TARGET: &str = "tari::universe::main";

pub fn setup_tari_universe(
    app: tauri::AppHandle,
    data_dir: PathBuf,
    log_dir: PathBuf,
    config_dir: PathBuf,
) -> Result<(), Box<dyn std::error::Error>> {
    let log_tapp_dir = log_dir.clone();
    let app_data_dir = app
        .path_resolver()
        .app_data_dir()
        .expect("Could not get app data dir");
    let wallet_daemon_config_file = config_dir.join("wallet_daemon.config.toml");

    // setup universe logging
    let log_config_file = &log_dir
        .join("universe")
        .join("configs")
        .join("log4rs_config_universe.yml");
    let contents = setup_logging(
        &log_config_file,
        &log_dir,
        include_str!("../../log4rs/universe_sample.yml"),
    )?;
    let config: RawConfig = serde_yaml::from_str(&contents)
        .expect("Could not parse the contents of the log file as yaml");
    // global logger init
    log4rs::init_raw_config(config).expect("Could not initialize logging");

    tauri::async_runtime::spawn(async move {
        start_wallet_daemon(log_dir, data_dir, wallet_daemon_config_file)
            .await
            .unwrap();
    });
    let db_path = app_data_dir.join(DB_FILE_NAME);

    app.manage(DatabaseConnection(Arc::new(Mutex::new(
        database::establish_connection(db_path.to_str().unwrap()),
    ))));

    let tokens = app.state::<Tokens>();
    let handle = tauri::async_runtime::spawn(try_get_tokens(None));
    let (permission_token, auth_token) = tauri::async_runtime::block_on(handle)?;
    tokens
        .permission
        .lock()
        .map_err(|_| error::Error::FailedToObtainPermissionTokenLock)?
        .replace_range(.., &permission_token);
    tokens
        .auth
        .lock()
        .map_err(|_| error::Error::FailedToObtainAuthTokenLock)?
        .replace_range(.., &auth_token);

    let tapp_assets_path = app_data_dir.join(TAPPLETS_ASSETS_DIR);
    let _handle_setup_log =
        tauri::async_runtime::spawn(async move { setup_log(log_tapp_dir).await });
    let handle_start = tauri::async_runtime::spawn(async move { start(tapp_assets_path).await });
    let (addr, cancel_token) = tauri::async_runtime::block_on(handle_start)?.unwrap();
    app.manage(AssetServer { addr, cancel_token });
    info!(target: LOG_TARGET, "🚀 Tari Universe setup completed successfully");

    Ok(())
}
