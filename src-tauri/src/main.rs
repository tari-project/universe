// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use auto_launcher::AutoLauncher;
use hardware::hardware_status_monitor::{HardwareStatusMonitor, PublicDeviceProperties};
use log::trace;
use log::{debug, error, info, warn};
use log4rs::config::RawConfig;
use serde::Serialize;
use std::sync::atomic::AtomicBool;
use std::sync::Arc;
use std::thread::sleep;
use std::time::{Duration, SystemTime};
use tari_common::configuration::Network;
use tari_common_types::tari_address::TariAddress;
use tari_shutdown::Shutdown;
use tauri::async_runtime::{block_on, JoinHandle};
use tauri::{Emitter, Manager, RunEvent};
use tauri_plugin_sentry::{minidump, sentry};
use tokio::sync::RwLock;

use crate::cpu_miner::CpuMiner;
#[cfg(target_os = "windows")]
use crate::external_dependencies::ExternalDependencies;
use crate::feedback::Feedback;
use crate::gpu_miner::GpuMiner;
use crate::internal_wallet::InternalWallet;
use crate::mm_proxy_manager::{MmProxyManager, StartConfig};
use crate::node_manager::NodeManager;
use crate::p2pool::models::Stats;
use crate::p2pool_manager::{P2poolConfig, P2poolManager};
use crate::tor_manager::TorManager;
use crate::utils::auto_rollback::AutoRollback;
use crate::wallet_adapter::WalletBalance;
use crate::wallet_manager::WalletManager;
use app_config::AppConfig;
use app_in_memory_config::AppInMemoryConfig;
use binaries::{binaries_list::Binaries, binaries_resolver::BinaryResolver};
use gpu_miner_adapter::GpuMinerStatus;
use node_manager::NodeManagerError;
use process_utils::set_interval;
use progress_tracker::ProgressTracker;
use setup_status_event::SetupStatusEvent;
use telemetry_manager::TelemetryManager;
use utils::logging_utils::setup_logging;
mod app_config;
mod app_in_memory_config;
mod auto_launcher;
mod binaries;
mod commands;
mod consts;
mod cpu_miner;
mod download_utils;
mod external_dependencies;
mod feedback;
mod github;
mod gpu_miner;
mod gpu_miner_adapter;
mod hardware;
mod hardware_monitor;
mod internal_wallet;
mod mm_proxy_adapter;
mod mm_proxy_manager;
mod network_utils;
mod node_adapter;
mod node_manager;
mod p2pool;
mod p2pool_adapter;
mod p2pool_manager;
mod port_allocator;
mod process_adapter;
mod process_killer;
mod process_utils;
mod process_watcher;
mod progress_tracker;
mod setup_status_event;
mod telemetry_manager;
mod tests;
mod tor_adapter;
mod tor_manager;
mod user_listener;
mod utils;
mod wallet_adapter;
mod wallet_manager;
mod xmrig;
mod xmrig_adapter;

pub const MAX_ACCEPTABLE_COMMAND_TIME: Duration = Duration::from_secs(1);

pub const LOG_TARGET: &str = "tari::universe::main";
pub const LOG_TARGET_WEB: &str = "tari::universe::web";

#[cfg(not(any(feature = "release-ci", feature = "release-ci-beta")))]
const APPLICATION_FOLDER_ID: &str = "com.tari.universe.alpha";
#[cfg(all(feature = "release-ci", feature = "release-ci-beta"))]
const APPLICATION_FOLDER_ID: &str = "com.tari.universe.other";
#[cfg(all(feature = "release-ci", not(feature = "release-ci-beta")))]
const APPLICATION_FOLDER_ID: &str = "com.tari.universe";
#[cfg(all(feature = "release-ci-beta", not(feature = "release-ci")))]
const APPLICATION_FOLDER_ID: &str = "com.tari.universe.beta";

async fn stop_all_miners(state: UniverseAppState, sleep_secs: u64) -> Result<(), String> {
    state
        .cpu_miner
        .write()
        .await
        .stop()
        .await
        .map_err(|e| e.to_string())?;
    state
        .gpu_miner
        .write()
        .await
        .stop()
        .await
        .map_err(|e| e.to_string())?;
    let exit_code = state
        .wallet_manager
        .stop()
        .await
        .map_err(|e| e.to_string())?;
    info!(target: LOG_TARGET, "Wallet manager stopped with exit code: {}", exit_code);
    state
        .mm_proxy_manager
        .stop()
        .await
        .map_err(|e| e.to_string())?;
    let exit_code = state.node_manager.stop().await.map_err(|e| e.to_string())?;
    info!(target: LOG_TARGET, "Node manager stopped with exit code: {}", exit_code);
    let exit_code = state
        .p2pool_manager
        .stop()
        .await
        .map_err(|e| e.to_string())?;
    info!(target: LOG_TARGET, "P2Pool manager stopped with exit code: {}", exit_code);

    let exit_code = state.tor_manager.stop().await.map_err(|e| e.to_string())?;
    info!(target: LOG_TARGET, "Tor manager stopped with exit code: {}", exit_code);
    state.shutdown.clone().trigger();

    // TODO: Find a better way of knowing that all miners have stopped
    sleep(std::time::Duration::from_secs(sleep_secs));
    Ok(())
}

#[allow(clippy::too_many_lines)]
async fn setup_inner(
    window: tauri::Window,
    state: tauri::State<'_, UniverseAppState>,
    app: tauri::AppHandle,
) -> Result<(), anyhow::Error> {
    app.emit(
        "message",
        SetupStatusEvent {
            event_type: "setup_status".to_string(),
            title: "starting-up".to_string(),
            title_params: None,
            progress: 0.0,
        },
    )
    .inspect_err(|e| error!(target: LOG_TARGET, "Could not emit event 'message': {:?}", e))?;

    let data_dir = app
        .path()
        .app_local_data_dir()
        .expect("Could not get data dir");
    let config_dir = app
        .path()
        .app_config_dir()
        .expect("Could not get config dir");
    let log_dir = app.path().app_log_dir().expect("Could not get log dir");

    #[cfg(target_os = "windows")]
    if cfg!(target_os = "windows") && !cfg!(dev) {
        ExternalDependencies::current()
            .read_registry_installed_applications()
            .await?;
        let is_missing = ExternalDependencies::current()
            .check_if_some_dependency_is_not_installed()
            .await;
        let external_dependencies = ExternalDependencies::current()
            .get_external_dependencies()
            .await;

        if is_missing {
            app
                .emit(
                    "missing-applications",
                    external_dependencies
                ).inspect_err(|e| error!(target: LOG_TARGET, "Could not emit event 'missing-applications': {:?}", e))?;
            return Ok(());
        }
    }

    let cpu_miner_config = state.cpu_miner_config.read().await;
    let app_config = state.config.read().await;
    let use_tor = app_config.use_tor();
    drop(app_config);
    let mm_proxy_manager = state.mm_proxy_manager.clone();

    let is_auto_launcher_enabled = state.config.read().await.should_auto_launch();
    AutoLauncher::current()
        .initialize_auto_launcher(is_auto_launcher_enabled)
        .await?;

    let progress = ProgressTracker::new(app.clone());

    let last_binaries_update_timestamp = state.config.read().await.last_binaries_update_timestamp();
    let now = SystemTime::now();

    state
        .telemetry_manager
        .write()
        .await
        .initialize(state.airdrop_access_token.clone(), window.clone())
        .await?;

    let mut binary_resolver = BinaryResolver::current().write().await;
    let should_check_for_update = now
        .duration_since(last_binaries_update_timestamp)
        .unwrap_or(Duration::from_secs(0))
        > Duration::from_secs(60 * 60 * 6);

    if use_tor && !cfg!(target_os = "macos") {
        progress.set_max(5).await;
        progress
            .update("checking-latest-version-tor".to_string(), None, 0)
            .await;
        binary_resolver
            .initalize_binary(Binaries::Tor, progress.clone(), should_check_for_update)
            .await?;
        sleep(Duration::from_secs(1));
    }

    progress.set_max(10).await;
    progress
        .update("checking-latest-version-node".to_string(), None, 0)
        .await;
    binary_resolver
        .initalize_binary(
            Binaries::MinotariNode,
            progress.clone(),
            should_check_for_update,
        )
        .await?;
    sleep(Duration::from_secs(1));

    progress.set_max(15).await;
    progress
        .update("checking-latest-version-mmproxy".to_string(), None, 0)
        .await;
    binary_resolver
        .initalize_binary(
            Binaries::MergeMiningProxy,
            progress.clone(),
            should_check_for_update,
        )
        .await?;
    sleep(Duration::from_secs(1));
    progress.set_max(20).await;
    progress
        .update("checking-latest-version-wallet".to_string(), None, 0)
        .await;
    binary_resolver
        .initalize_binary(Binaries::Wallet, progress.clone(), should_check_for_update)
        .await?;

    sleep(Duration::from_secs(1));
    progress.set_max(25).await;
    progress
        .update("checking-latest-version-gpuminer".to_string(), None, 0)
        .await;
    binary_resolver
        .initalize_binary(
            Binaries::GpuMiner,
            progress.clone(),
            should_check_for_update,
        )
        .await?;
    sleep(Duration::from_secs(1));

    progress.set_max(30).await;
    progress
        .update("checking-latest-version-xmrig".to_string(), None, 0)
        .await;
    binary_resolver
        .initalize_binary(Binaries::Xmrig, progress.clone(), should_check_for_update)
        .await?;
    sleep(Duration::from_secs(1));
    progress.set_max(35).await;
    progress
        .update("checking-latest-version-sha-p2pool".to_string(), None, 0)
        .await;
    binary_resolver
        .initalize_binary(
            Binaries::ShaP2pool,
            progress.clone(),
            should_check_for_update,
        )
        .await?;
    sleep(Duration::from_secs(1));
    if should_check_for_update {
        state
            .config
            .write()
            .await
            .set_last_binaries_update_timestamp(now)
            .await?;
    }

    //drop binary resolver to release the lock
    drop(binary_resolver);

    let _unused = state
        .gpu_miner
        .write()
        .await
        .detect(config_dir.clone())
        .await
        .inspect_err(|e| error!(target: LOG_TARGET, "Could not detect gpu miner: {:?}", e));

    HardwareStatusMonitor::current()
        .initialize(config_dir.clone())
        .await?;

    let mut tor_control_port = None;
    if use_tor && !cfg!(target_os = "macos") {
        state
            .tor_manager
            .ensure_started(
                state.shutdown.to_signal(),
                data_dir.clone(),
                config_dir.clone(),
                log_dir.clone(),
            )
            .await?;
        tor_control_port = state.tor_manager.get_control_port().await?;
    }
    for _i in 0..2 {
        match state
            .node_manager
            .ensure_started(
                state.shutdown.to_signal(),
                data_dir.clone(),
                config_dir.clone(),
                log_dir.clone(),
                use_tor,
                tor_control_port,
            )
            .await
        {
            Ok(_) => {}
            Err(e) => {
                if let NodeManagerError::ExitCode(code) = e {
                    if code == 114 {
                        warn!(target: LOG_TARGET, "Database for node is corrupt or needs a reset, deleting and trying again.");
                        state.node_manager.clean_data_folder(&data_dir).await?;
                        continue;
                    }
                }
                error!(target: LOG_TARGET, "Could not start node manager: {:?}", e);

                app.exit(-1);
                return Err(e.into());
            }
        }
    }

    info!(target: LOG_TARGET, "Node has started and is ready");

    progress.set_max(40).await;
    progress
        .update("waiting-for-wallet".to_string(), None, 0)
        .await;
    state
        .wallet_manager
        .ensure_started(
            state.shutdown.to_signal(),
            data_dir.clone(),
            config_dir.clone(),
            log_dir.clone(),
        )
        .await?;

    progress.set_max(75).await;
    progress
        .update("preparing-for-initial-sync".to_string(), None, 0)
        .await;
    state.node_manager.wait_synced(progress.clone()).await?;

    if state.config.read().await.p2pool_enabled() {
        progress.set_max(85).await;
        progress
            .update("starting-p2pool".to_string(), None, 0)
            .await;

        let base_node_grpc = state.node_manager.get_grpc_port().await?;
        let p2pool_config = P2poolConfig::builder()
            .with_base_node(base_node_grpc)
            .build()?;

        state
            .p2pool_manager
            .ensure_started(
                state.shutdown.to_signal(),
                p2pool_config,
                data_dir.clone(),
                config_dir.clone(),
                log_dir.clone(),
            )
            .await?;
    }

    progress.set_max(100).await;
    progress
        .update("starting-mmproxy".to_string(), None, 0)
        .await;

    let base_node_grpc_port = state.node_manager.get_grpc_port().await?;

    let mut telemetry_id = state
        .telemetry_manager
        .read()
        .await
        .get_unique_string()
        .await;
    if telemetry_id.is_empty() {
        telemetry_id = "unknown_miner_tari_universe".to_string();
    }

    let config = state.config.read().await;
    let p2pool_port = state.p2pool_manager.grpc_port().await;
    mm_proxy_manager
        .start(StartConfig {
            base_node_grpc_port,
            p2pool_port,
            app_shutdown: state.shutdown.to_signal().clone(),
            base_path: data_dir.clone(),
            config_path: config_dir.clone(),
            log_path: log_dir.clone(),
            tari_address: cpu_miner_config.tari_address.clone(),
            coinbase_extra: telemetry_id,
            p2pool_enabled: config.p2pool_enabled(),
            monero_nodes: config.mmproxy_monero_nodes().clone(),
            use_monero_fail: config.mmproxy_use_monero_fail(),
        })
        .await?;
    mm_proxy_manager.wait_ready().await?;

    let mvhandle = app.clone();
    tauri::async_runtime::spawn(async move {
        loop {
            // TODO: REMOVE THIS INFO IT'S JUST FOR TESTING
            info!(target: LOG_TARGET, "Checking for MINER METRICS");
            let app_state = mvhandle.state::<UniverseAppState>().clone();
            if let Ok(ret) = commands::get_miner_metrics(app_state, mvhandle.clone()).await {
                if mvhandle.emit("miner_metrics", &ret).is_ok() {
                    // TODO: REMOVE THIS INFO IT'S JUST FOR TESTING
                    info!(target: LOG_TARGET, "METRICS SENT");
                }
            };
            tokio::time::sleep(Duration::from_secs(1)).await;
        }
    });

    *state.is_setup_finished.write().await = true;
    drop(
        app.emit(
            "message",
            SetupStatusEvent {
                event_type: "setup_status".to_string(),
                title: "application-started".to_string(),
                title_params: None,
                progress: 1.0,
            },
        )
        .inspect_err(|e| error!(target: LOG_TARGET, "Could not emit event 'message': {:?}", e)),
    );

    let app_handle_clone: tauri::AppHandle = app.clone();
    tauri::async_runtime::spawn(async move {
        set_interval(
            move || check_if_is_orphan_chain(app_handle_clone.clone()),
            Duration::from_secs(30),
        );
    });
    Ok(())
}

#[derive(Debug, Serialize, Clone)]
pub struct CpuMinerMetrics {
    // hardware: Vec<PublicDeviceProperties>,
    mining: CpuMinerStatus,
}

#[derive(Debug, Serialize, Clone)]
pub struct GpuMinerMetrics {
    hardware: Vec<PublicDeviceProperties>,
    mining: GpuMinerStatus,
}

#[derive(Debug, Serialize, Clone)]
pub struct MinerMetrics {
    sha_network_hash_rate: u64,
    randomx_network_hash_rate: u64,
    cpu: CpuMinerMetrics,
    gpu: GpuMinerMetrics,
    base_node: BaseNodeStatus,
}

#[derive(Debug, Serialize, Clone)]
pub struct TariWalletDetails {
    wallet_balance: Option<WalletBalance>,
    tari_address_base58: String,
    tari_address_emoji: String,
}

#[derive(Debug, Serialize)]
pub struct ApplicationsVersions {
    tari_universe: String,
    xmrig: String,
    minotari_node: String,
    mm_proxy: String,
    wallet: String,
    sha_p2pool: String,
    xtrgpuminer: String,
}

#[derive(Debug, Serialize, Clone)]
pub struct BaseNodeStatus {
    block_height: u64,
    block_time: u64,
    is_synced: bool,
    is_connected: bool,
    connected_peers: Vec<String>,
}
#[derive(Debug, Serialize, Clone)]
pub struct CpuMinerStatus {
    pub is_mining: bool,
    pub hash_rate: f64,
    pub estimated_earnings: u64,
    pub connection: CpuMinerConnectionStatus,
}

#[derive(Debug, Serialize, Clone)]
pub struct CpuMinerConnectionStatus {
    pub is_connected: bool,
    // pub error: Option<String>,
}

pub enum CpuMinerConnection {
    BuiltInProxy,
}

struct CpuMinerConfig {
    node_connection: CpuMinerConnection,
    tari_address: TariAddress,
    eco_mode_xmrig_options: Vec<String>,
    ludicrous_mode_xmrig_options: Vec<String>,
    custom_mode_xmrig_options: Vec<String>,
    eco_mode_cpu_percentage: Option<u32>,
    ludicrous_mode_cpu_percentage: Option<u32>,
}

#[derive(Clone)]
struct UniverseAppState {
    is_getting_wallet_balance: Arc<AtomicBool>,
    is_getting_p2pool_stats: Arc<AtomicBool>,
    is_getting_miner_metrics: Arc<AtomicBool>,
    is_getting_transaction_history: Arc<AtomicBool>,
    is_setup_finished: Arc<RwLock<bool>>,
    config: Arc<RwLock<AppConfig>>,
    in_memory_config: Arc<RwLock<AppInMemoryConfig>>,
    shutdown: Shutdown,
    tari_address: Arc<RwLock<TariAddress>>,
    cpu_miner: Arc<RwLock<CpuMiner>>,
    gpu_miner: Arc<RwLock<GpuMiner>>,
    cpu_miner_config: Arc<RwLock<CpuMinerConfig>>,
    mm_proxy_manager: MmProxyManager,
    node_manager: NodeManager,
    wallet_manager: WalletManager,
    telemetry_manager: Arc<RwLock<TelemetryManager>>,
    feedback: Arc<RwLock<Feedback>>,
    airdrop_access_token: Arc<RwLock<Option<String>>>,
    p2pool_manager: P2poolManager,
    tor_manager: TorManager,
    cached_p2pool_stats: Arc<RwLock<Option<Option<Stats>>>>,
    cached_wallet_details: Arc<RwLock<Option<TariWalletDetails>>>,
    cached_miner_metrics: Arc<RwLock<Option<MinerMetrics>>>,
    setup_counter: Arc<RwLock<AutoRollback<bool>>>,
}

#[derive(Clone, serde::Serialize)]
struct Payload {
    args: Vec<String>,
    cwd: String,
}

async fn check_if_is_orphan_chain(app_handle: tauri::AppHandle) {
    let state = app_handle.state::<UniverseAppState>().inner();
    let check_if_orphan = state.node_manager.check_if_is_orphan_chain().await;
    match check_if_orphan {
        Ok(is_stuck) => {
            if is_stuck {
                error!(target: LOG_TARGET, "Miner is stuck on orphan chain");
                drop(app_handle.emit("is_stuck", is_stuck));
            }
        }
        Err(e) => {
            error!(target: LOG_TARGET, "{}", e);
            drop(app_handle.emit("is_stuck", true));
        }
    }
}
#[allow(clippy::too_many_lines)]
fn main() {
    // TODO: Integrate sentry into logs. Because we are using Tari's logging infrastructure, log4rs
    // sets the logger and does not expose a way to add sentry into it.
    let client = sentry::init((
        "https://edd6b9c1494eb7fda6ee45590b80bcee@o4504839079002112.ingest.us.sentry.io/4507979991285760",
        sentry::ClientOptions {
            release: sentry::release_name!(),
            ..Default::default()
        },
    ));
    let _guard = minidump::init(&client);

    let shutdown = Shutdown::new();

    // NOTE: Nothing is started at this point, so ports are not known. You can only start settings ports
    // and addresses once the different services have been started.
    // A better way is to only provide the config when we start the service.
    let node_manager = NodeManager::new();
    let wallet_manager = WalletManager::new(node_manager.clone());
    let wallet_manager2 = wallet_manager.clone();
    let p2pool_manager = P2poolManager::new();

    let cpu_config = Arc::new(RwLock::new(CpuMinerConfig {
        node_connection: CpuMinerConnection::BuiltInProxy,
        tari_address: TariAddress::default(),
        eco_mode_xmrig_options: vec![],
        ludicrous_mode_xmrig_options: vec![],
        custom_mode_xmrig_options: vec![],
        eco_mode_cpu_percentage: None,
        ludicrous_mode_cpu_percentage: None,
    }));

    let app_in_memory_config = Arc::new(RwLock::new(AppInMemoryConfig::init()));

    let cpu_miner: Arc<RwLock<CpuMiner>> = Arc::new(CpuMiner::new().into());
    let gpu_miner: Arc<RwLock<GpuMiner>> = Arc::new(GpuMiner::new().into());

    let app_config_raw = AppConfig::new();
    let app_config = Arc::new(RwLock::new(app_config_raw.clone()));

    let telemetry_manager: TelemetryManager = TelemetryManager::new(
        node_manager.clone(),
        cpu_miner.clone(),
        gpu_miner.clone(),
        app_config.clone(),
        app_in_memory_config.clone(),
        Some(Network::default()),
        p2pool_manager.clone(),
    );

    let feedback = Feedback::new(app_in_memory_config.clone(), app_config.clone());

    let mm_proxy_manager = MmProxyManager::new();
    let app_state = UniverseAppState {
        is_getting_miner_metrics: Arc::new(AtomicBool::new(false)),
        is_getting_p2pool_stats: Arc::new(AtomicBool::new(false)),
        is_getting_wallet_balance: Arc::new(AtomicBool::new(false)),
        is_setup_finished: Arc::new(RwLock::new(false)),
        is_getting_transaction_history: Arc::new(AtomicBool::new(false)),
        config: app_config.clone(),
        in_memory_config: app_in_memory_config.clone(),
        shutdown: shutdown.clone(),
        tari_address: Arc::new(RwLock::new(TariAddress::default())),
        cpu_miner: cpu_miner.clone(),
        gpu_miner: gpu_miner.clone(),
        cpu_miner_config: cpu_config.clone(),
        mm_proxy_manager: mm_proxy_manager.clone(),
        node_manager,
        wallet_manager,
        p2pool_manager,
        telemetry_manager: Arc::new(RwLock::new(telemetry_manager)),
        feedback: Arc::new(RwLock::new(feedback)),
        airdrop_access_token: Arc::new(RwLock::new(None)),
        tor_manager: TorManager::new(),
        cached_p2pool_stats: Arc::new(RwLock::new(None)),
        cached_wallet_details: Arc::new(RwLock::new(None)),
        cached_miner_metrics: Arc::new(RwLock::new(None)),
        setup_counter: Arc::new(RwLock::new(AutoRollback::new(false))),
    };

    let app = tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_single_instance::init(|app, argv, cwd| {
            println!("{}, {argv:?}, {cwd}", app.package_info().name);

            app.emit("single-instance", Payload { args: argv, cwd })
                .unwrap_or_else(
                    |e| error!(target: LOG_TARGET, "Could not emit single-instance event: {:?}", e),
                );
        }))
        .plugin(tauri_plugin_updater::Builder::new().build())
        .manage(app_state.clone())
        .setup(|app| {
            let contents = setup_logging(
                &app.path()
                    .app_config_dir()
                    .expect("Could not get config dir")
                    .join("logs")
                    .join("universe")
                    .join("configs")
                    .join("log4rs_config_universe.yml"),
                &app.path().app_log_dir().expect("Could not get log dir"),
                include_str!("../log4rs/universe_sample.yml"),
            )
            .expect("Could not set up logging");
            let config: RawConfig = serde_yaml::from_str(&contents)
                .expect("Could not parse the contents of the log file as yaml");
            log4rs::init_raw_config(config).expect("Could not initialize logging");

            let config_path = app
                .path()
                .app_config_dir()
                .expect("Could not get config dir");
            let cpu_config2 = cpu_config.clone();
            let thread_config: JoinHandle<Result<(), anyhow::Error>> =
                tauri::async_runtime::spawn(async move {
                    let mut app_conf = app_config.write().await;
                    app_conf.load_or_create(config_path).await?;

                    let mut cpu_conf = cpu_config2.write().await;
                    cpu_conf.eco_mode_cpu_percentage = app_conf.eco_mode_cpu_threads();
                    cpu_conf.ludicrous_mode_cpu_percentage = app_conf.ludicrous_mode_cpu_threads();
                    cpu_conf.eco_mode_xmrig_options = app_conf.eco_mode_cpu_options().clone();
                    cpu_conf.ludicrous_mode_xmrig_options =
                        app_conf.ludicrous_mode_cpu_options().clone();
                    cpu_conf.custom_mode_xmrig_options = app_conf.custom_mode_cpu_options().clone();
                    Ok(())
                });

            match block_on(thread_config) {
                Ok(_) => {}
                Err(e) => {
                    error!(target: LOG_TARGET, "Error setting up app state: {:?}", e);
                }
            };

            let config_path = app
                .path()
                .app_config_dir()
                .expect("Could not get config dir");
            let address = app.state::<UniverseAppState>().tari_address.clone();
            let thread = tauri::async_runtime::spawn(async move {
                match InternalWallet::load_or_create(config_path).await {
                    Ok(wallet) => {
                        cpu_config.write().await.tari_address = wallet.get_tari_address();
                        wallet_manager2
                            .set_view_private_key_and_spend_key(
                                wallet.get_view_key(),
                                wallet.get_spend_key(),
                            )
                            .await;
                        let mut lock = address.write().await;
                        *lock = wallet.get_tari_address();
                        Ok(())
                        //app.state::<UniverseAppState>().tari_address = wallet.get_tari_address();
                    }
                    Err(e) => {
                        error!(target: LOG_TARGET, "Error loading internal wallet: {:?}", e);
                        // TODO: If this errors, the application does not exit properly.
                        // So temporarily we are going to kill it here

                        Err(e)
                    }
                }
            });

            match block_on(thread).expect("Could not start task") {
                Ok(_) => {
                    // let mut lock = app.state::<UniverseAppState>().tari_address.write().await;
                    // *lock = address;
                    Ok(())
                }
                Err(e) => {
                    error!(target: LOG_TARGET, "Error setting up internal wallet: {:?}", e);
                    Err(e.into())
                }
            }
        })
        .invoke_handler(tauri::generate_handler![
            commands::download_and_start_installer,
            commands::exit_application,
            commands::fetch_tor_bridges,
            commands::get_app_config,
            commands::get_app_id,
            commands::get_app_in_memory_config,
            commands::get_applications_versions,
            commands::get_external_dependencies,
            commands::get_miner_metrics,
            commands::get_p2pool_stats,
            commands::get_paper_wallet_details,
            commands::get_seed_words,
            commands::get_tari_wallet_details,
            commands::get_tor_config,
            commands::get_tor_entry_guards,
            commands::get_transaction_history,
            commands::import_seed_words,
            commands::log_web_message,
            commands::open_log_dir,
            commands::reset_settings,
            commands::resolve_application_language,
            commands::restart_application,
            commands::send_feedback,
            commands::set_airdrop_access_token,
            commands::set_allow_telemetry,
            commands::set_application_language,
            commands::set_auto_update,
            commands::set_cpu_mining_enabled,
            commands::set_display_mode,
            commands::set_excluded_gpu_devices,
            commands::set_gpu_mining_enabled,
            commands::set_mine_on_app_start,
            commands::set_mode,
            commands::set_monero_address,
            commands::set_monerod_config,
            commands::set_p2pool_enabled,
            commands::set_should_always_use_system_language,
            commands::set_should_auto_launch,
            commands::set_tor_config,
            commands::set_use_tor,
            commands::setup_application,
            commands::start_mining,
            commands::stop_mining,
            commands::update_applications,
            commands::get_max_consumption_levels,
            commands::close_splashscreen,
            commands::set_visual_mode
        ])
        .build(tauri::generate_context!())
        .inspect_err(
            |e| error!(target: LOG_TARGET, "Error while building tauri application: {:?}", e),
        )
        .expect("error while running tauri application");

    info!(
        target: LOG_TARGET,
        "Starting Tari Universe version: {}",
        app.package_info().version
    );

    // let mut downloaded: u64 = 0;
    app.run(move |_app_handle, event| match event {
        tauri::RunEvent::ExitRequested { api: _, .. } => {
            info!(target: LOG_TARGET, "App shutdown request caught");
            let _unused = block_on(stop_all_miners(app_state.clone(), 2));
            info!(target: LOG_TARGET, "App shutdown complete");
        }
        tauri::RunEvent::Exit => {
            info!(target: LOG_TARGET, "App shutdown caught");
            let _unused = block_on(stop_all_miners(app_state.clone(), 2));
            info!(target: LOG_TARGET, "Tari Universe v{} shut down successfully", _app_handle.package_info().version);
        }
        RunEvent::MainEventsCleared => {
            // no need to handle
        }
        RunEvent::WindowEvent { label, event, .. } => {
            trace!(target: LOG_TARGET, "Window event: {:?} {:?}", label, event);
        }
        _ => {
            debug!(target: LOG_TARGET, "Unhandled event: {:?}", event);
        }
    });
}
