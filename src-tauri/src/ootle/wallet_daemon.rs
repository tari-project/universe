use std::{
    fs,
    net::{IpAddr, Ipv4Addr, SocketAddr},
    panic,
    path::PathBuf,
    process,
    str::FromStr,
};

use crate::{consts::DAN_WALLET_JSON_ADDRESS, utils::logging_utils::setup_logging};
use log::{info, warn};
use tari_common_dan2::configuration::Network;
use tari_dan_app_utilities::configuration::load_configuration;
use tari_dan_wallet_daemon::{cli::Cli, config::ApplicationConfig, run_tari_dan_wallet_daemon};
use tari_shutdown_dan2::Shutdown;

const LOG_TARGET: &str = "tari::dan::wallet_daemon";

pub async fn start_wallet_daemon(
    log_dir: PathBuf,
    data_dir_path: PathBuf,
    wallet_daemon_config_file: PathBuf,
) -> Result<(), anyhow::Error> {
    let default_hook = panic::take_hook();
    panic::set_hook(Box::new(move |info| {
        default_hook(info);
        process::exit(1);
    }));
    println!(
        "------> 🚀 WALLET DAEMON CONFIG FILE {:?}",
        &wallet_daemon_config_file,
    );
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
    println!("------> 🌟 WALLET DAEMON NETWORK {:?}", &network);
    cli.common.network = Some(network);
    cli.common.base_path = data_dir_path.to_str().unwrap().to_owned();
    cli.common.config = wallet_daemon_config_file.clone();
    cli.common.log_config = Some(log_config_file.clone());

    let cfg = load_configuration(wallet_daemon_config_file, true, &cli, None).unwrap();
    let mut config = ApplicationConfig::load_from(&cfg).unwrap();
    // ======= LOCAL SWARM CONFIG
    // let contractnet_json_rpc_address =
    //     SocketAddr::new(IpAddr::V4(Ipv4Addr::new(18, 216, 193, 9)), 12028);

    // config.dan_wallet_daemon.indexer_node_json_rpc_url =
    //     "http://18.216.193.9:12026/json_rpc".to_string();
    // config.dan_wallet_daemon.json_rpc_address = Some(contractnet_json_rpc_address);

    // ======= LOCAL SWARM CONFIG
    let json_rpc_port = 18010; //TODO set port from the swarm config
    let jrpc_address = format!("127.0.0.1:{}", json_rpc_port);

    config.dan_wallet_daemon.indexer_node_json_rpc_url =
        "http://localhost:18007/json_rpc".to_string();
    config.dan_wallet_daemon.json_rpc_address = SocketAddr::from_str(&DAN_WALLET_JSON_ADDRESS).ok(); //TODO: get free port from OS https://github.com/tari-project/tari-universe/issues/70
    config.dan_wallet_daemon.ui_connect_address = Some("127.0.0.1:5100".to_string());

    println!("------> 🌟 WALLET DAEMON CONFIG: {:?}", &config);

    // Remove the file if it was left behind by a previous run
    let _file = fs::remove_file(data_dir_path.join("pid"));

    let shutdown = Shutdown::new();
    let shutdown_signal = shutdown.to_signal();

    tokio::spawn(async move {
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
    });
    Ok(())
}
