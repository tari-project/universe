use std::{
    fs,
    net::{IpAddr, Ipv4Addr, SocketAddr},
    panic,
    path::PathBuf,
    process,
};

use crate::{
    consts::WALLET_DAEMON_CONFIG_FILE, port_allocator::PortAllocator,
    utils::logging_utils::setup_logging,
};
use log::{info, warn};
use tari_common_dan2::configuration::Network;
use tari_dan_app_utilities::configuration::load_configuration;
use tari_dan_wallet_daemon::{
    cli::Cli,
    config::{ApplicationConfig, WalletDaemonConfig},
    run_tari_dan_wallet_daemon,
};
use tari_shutdown_dan2::Shutdown;
use tauri::Url;

const LOG_TARGET: &str = "tari::dan::wallet_daemon";

pub async fn spawn_wallet_daemon(
    port: u16,
    data_dir: PathBuf,
    config_dir: PathBuf,
    log_dir: PathBuf,
) -> Result<(), anyhow::Error> {
    let default_hook = panic::take_hook();
    panic::set_hook(Box::new(move |info| {
        default_hook(info);
        process::exit(1);
    }));
    let wallet_daemon_config_file = config_dir.join(WALLET_DAEMON_CONFIG_FILE);
    info!(target: LOG_TARGET, "🌟 WALLET DAEMON config file {:?}", &wallet_daemon_config_file);
    let wallet_daemon_config_file = wallet_daemon_config_file.to_str().unwrap().to_owned();
    let log_config_file = log_dir
        .join("wallet_daemon")
        .join("configs")
        .join("log4rs_config_wallet.yml");
    let _contents = setup_logging(
        &log_config_file.clone(),
        &log_dir,
        include_str!("../../log4rs/universe_sample.yml"),
    )?;

    let mut cli = Cli::init();
    let network = Network::get_current_or_user_setting_or_default();
    info!(target: LOG_TARGET, "🌟 WALLET DAEMON NETWORK {:?}", &network);
    cli.common.network = Some(network);
    cli.common.base_path = data_dir.to_str().unwrap().to_owned();
    cli.common.config = wallet_daemon_config_file.clone();
    cli.common.log_config = Some(log_config_file.clone());

    let cfg = load_configuration(wallet_daemon_config_file, true, &cli, None).unwrap();

    let mut config = ApplicationConfig::load_from(&cfg).unwrap();
    config.dan_wallet_daemon = WalletDaemonConfig::default();
    let listening_json_rpc_address = SocketAddr::new(IpAddr::V4(Ipv4Addr::new(127, 0, 0, 1)), port);

    config.dan_wallet_daemon.indexer_json_rpc_url =
        Url::parse("http://18.217.22.26:12006/json_rpc").unwrap(); // TODO get from config
    config.dan_wallet_daemon.json_rpc_address = Some(listening_json_rpc_address);
    let ui_port = PortAllocator::new().assign_port_with_fallback();
    config.dan_wallet_daemon.ui_connect_address = Some(format!("127.0.0.1:{}", ui_port)); //TODO get from config
    let signaling_server_port = PortAllocator::new().assign_port_with_fallback();
    let signaling_server_addr = SocketAddr::new(
        IpAddr::V4(Ipv4Addr::new(127, 0, 0, 1)),
        signaling_server_port,
    );
    config.dan_wallet_daemon.signaling_server_address = Some(signaling_server_addr);

    info!(target: LOG_TARGET, "🌟 WALLET DAEMON CONFIG: {:?}", &config);

    // Remove the file if it was left behind by a previous run
    let _file = fs::remove_file(data_dir.join("pid"));

    let shutdown = Shutdown::new();
    let shutdown_signal = shutdown.to_signal();

    match run_tari_dan_wallet_daemon(config, shutdown_signal).await {
        Ok(_) => {
            info!(target: LOG_TARGET, "🚀 Running wallet daemon");
            return Ok(());
        }
        Err(e) => {
            warn!(target: LOG_TARGET, "Error running wallet daemon: {}", e);
            return Err(e);
        }
    }
}
