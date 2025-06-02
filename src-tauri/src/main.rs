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

// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use commands::CpuMinerStatus;
use cpu_miner::CpuMinerConfig;
use events_manager::EventsManager;
use gpu_miner_adapter::GpuMinerStatus;
use log::{error, info, warn};
use mining_status_manager::MiningStatusManager;
use node::local_node_adapter::LocalNodeAdapter;
use node::node_adapter::BaseNodeStatus;
use node::node_manager::NodeType;
use p2pool::models::Connections;
use pool_status_watcher::{PoolStatus, PoolStatusWatcher};
use process_stats_collector::ProcessStatsCollectorBuilder;

use node::remote_node_adapter::RemoteNodeAdapter;

use setup::setup_manager::SetupManager;
use std::fs::{remove_dir_all, remove_file};
use std::path::Path;
use systemtray_manager::SystemTrayManager;
use tasks_tracker::TasksTrackers;
use tauri_plugin_cli::CliExt;
use telemetry_service::TelemetryService;
use tokio::sync::watch::{self};
use tor_control_client::TorStatus;
use updates_manager::UpdatesManager;
use utils::system_status::SystemStatus;
use wallet_adapter::WalletState;
use websocket_events_manager::WebsocketEventsManager;
use websocket_manager::{WebsocketManager, WebsocketManagerStatusMessage, WebsocketMessage};

use log4rs::config::RawConfig;
use std::fs;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use std::time::{Duration, SystemTime};
use tari_common::configuration::Network;
use tari_common_types::tari_address::TariAddress;
use tauri::async_runtime::block_on;
use tauri::{Manager, RunEvent};
use tauri_plugin_sentry::{minidump, sentry};
use tokio::select;
use tokio::sync::{Mutex, RwLock};
use tokio::time;
use utils::logging_utils::setup_logging;

use app_in_memory_config::AppInMemoryConfig;
#[cfg(all(feature = "exchange-ci", not(feature = "release-ci")))]
use app_in_memory_config::EXCHANGE_ID;

use progress_tracker_old::ProgressTracker;
use telemetry_manager::TelemetryManager;

use crate::cpu_miner::CpuMiner;

use crate::commands::CpuMinerConnection;
#[cfg(target_os = "windows")]
use crate::external_dependencies::{ExternalDependencies, RequiredExternalDependency};
use crate::feedback::Feedback;
use crate::gpu_miner::GpuMiner;
use crate::mm_proxy_manager::{MmProxyManager, StartConfig};
use crate::node::node_manager::NodeManager;
use crate::p2pool::models::P2poolStats;
use crate::p2pool_manager::P2poolManager;
use crate::spend_wallet_manager::SpendWalletManager;
use crate::tor_manager::TorManager;
use crate::wallet_manager::WalletManager;

mod ab_test_selector;
mod airdrop;
mod app_in_memory_config;
mod auto_launcher;
mod binaries;
mod commands;
mod configs;
mod consts;
mod cpu_miner;
mod credential_manager;
mod download_utils;
mod events;
mod events_emitter;
mod events_manager;
mod external_dependencies;
mod feedback;
mod github;
mod gpu_miner;
mod gpu_miner_adapter;
mod gpu_status_file;
mod hardware;
mod internal_wallet;
mod mining_status_manager;
mod mm_proxy_adapter;
mod mm_proxy_manager;
mod network_utils;
mod node;
mod p2pool;
mod p2pool_adapter;
mod p2pool_manager;
mod pool_status_watcher;
mod port_allocator;
mod process_adapter;
mod process_killer;
mod process_stats_collector;
mod process_utils;
mod process_watcher;
mod progress_tracker_old;
mod progress_trackers;
mod release_notes;
mod setup;
mod spend_wallet_adapter;
mod spend_wallet_manager;
mod systemtray_manager;
mod tapplets;
mod tasks_tracker;
mod telemetry_manager;
mod telemetry_service;
mod tests;
mod tor_adapter;
mod tor_control_client;
mod tor_manager;
mod updates_manager;
mod utils;
mod wallet_adapter;
mod wallet_manager;
mod websocket_events_manager;
mod websocket_manager;
mod xmrig;
mod xmrig_adapter;

const LOG_TARGET: &str = "tari::universe::main";
const RESTART_EXIT_CODE: i32 = i32::MAX;
#[cfg(not(any(
    feature = "release-ci",
    feature = "release-ci-beta",
    feature = "exchange-ci"
)))]
const APPLICATION_FOLDER_ID: &str = "com.tari.universe.alpha";
#[cfg(all(feature = "release-ci", feature = "release-ci-beta"))]
const APPLICATION_FOLDER_ID: &str = "com.tari.universe.other";
#[cfg(all(feature = "release-ci", not(feature = "release-ci-beta")))]
const APPLICATION_FOLDER_ID: &str = "com.tari.universe";
#[cfg(all(feature = "release-ci-beta", not(feature = "release-ci")))]
const APPLICATION_FOLDER_ID: &str = "com.tari.universe.beta";
#[cfg(all(feature = "exchange-ci", not(feature = "release-ci")))]
const APPLICATION_FOLDER_ID: &str = const_format::formatcp!("com.tari.universe.{}", EXCHANGE_ID);

#[allow(clippy::too_many_lines)]
async fn initialize_frontend_updates(app: &tauri::AppHandle) -> Result<(), anyhow::Error> {
    let move_app = app.clone();
    TasksTrackers::current().common.get_task_tracker().await.spawn(async move {
        let app_state = move_app.state::<UniverseAppState>().clone();

        let mut node_status_watch_rx = (*app_state.node_status_watch_rx).clone();
        let mut shutdown_signal = TasksTrackers::current().common.get_signal().await;

        let init_node_status = *node_status_watch_rx.borrow();
        let _ = EventsManager::handle_base_node_update(&move_app, init_node_status).await;

        let mut latest_updated_block_height = init_node_status.block_height;
        loop {
            select! {
                _ = node_status_watch_rx.changed() => {
                    let node_status = *node_status_watch_rx.borrow();
                    let initial_sync_finished = app_state.wallet_manager.is_initial_scan_completed();

                    if node_status.block_height > latest_updated_block_height && initial_sync_finished {
                        while latest_updated_block_height < node_status.block_height {
                            latest_updated_block_height += 1;
                            let _ = EventsManager::handle_new_block_height(&move_app, latest_updated_block_height).await;
                        }
                    }
                    if node_status.block_height > latest_updated_block_height && !initial_sync_finished {
                        let _ = EventsManager::handle_base_node_update(&move_app, node_status).await;
                        latest_updated_block_height = node_status.block_height;
                    }
                },
                _ = shutdown_signal.wait() => {
                    break;
                },
            }
        }
    });

    let move_app = app.clone();

    TasksTrackers::current().node_phase.get_task_tracker().await.spawn(async move {
        let app_state = move_app.state::<UniverseAppState>().clone();
        let mut shutdown_signal = TasksTrackers::current().node_phase.get_signal().await;
        let mut interval = time::interval(Duration::from_secs(10));

        loop {
            select! {
                _ = interval.tick() => {
                    if let Ok(connected_peers) = app_state
                        .node_manager
                        .list_connected_peers()
                        .await {
                            let _ = EventsManager::handle_connected_peers_update(&move_app, connected_peers).await;
                        } else {
                            let err_msg = "Error getting connected peers";
                            error!(target: LOG_TARGET, "{}", err_msg);
                        }
                },
                _ = shutdown_signal.wait() => {
                    break;
                },
            }
        }
    });

    Ok(())
}

#[derive(Clone)]
struct UniverseAppState {
    cpu_miner_timestamp_mutex: Arc<Mutex<SystemTime>>,
    cpu_miner_stop_start_mutex: Arc<Mutex<()>>,
    gpu_miner_stop_start_mutex: Arc<Mutex<()>>,
    node_status_watch_rx: Arc<watch::Receiver<BaseNodeStatus>>,
    #[allow(dead_code)]
    wallet_state_watch_rx: Arc<watch::Receiver<Option<WalletState>>>,
    cpu_miner_status_watch_rx: Arc<watch::Receiver<CpuMinerStatus>>,
    gpu_latest_status: Arc<watch::Receiver<GpuMinerStatus>>,
    p2pool_latest_status: Arc<watch::Receiver<Option<P2poolStats>>>,
    is_getting_p2pool_connections: Arc<AtomicBool>,
    is_getting_transactions_history: Arc<AtomicBool>,
    is_getting_coinbase_history: Arc<AtomicBool>,
    in_memory_config: Arc<RwLock<AppInMemoryConfig>>,
    tari_address: Arc<RwLock<TariAddress>>,
    cpu_miner: Arc<RwLock<CpuMiner>>,
    gpu_miner: Arc<RwLock<GpuMiner>>,
    cpu_miner_config: Arc<RwLock<CpuMinerConfig>>,
    mm_proxy_manager: MmProxyManager,
    node_manager: NodeManager,
    wallet_manager: WalletManager,
    spend_wallet_manager: Arc<RwLock<SpendWalletManager>>,
    telemetry_manager: Arc<RwLock<TelemetryManager>>,
    telemetry_service: Arc<RwLock<TelemetryService>>,
    feedback: Arc<RwLock<Feedback>>,
    p2pool_manager: P2poolManager,
    tor_manager: TorManager,
    updates_manager: UpdatesManager,
    cached_p2pool_connections: Arc<RwLock<Option<Option<Connections>>>>,
    systemtray_manager: Arc<RwLock<SystemTrayManager>>,
    mining_status_manager: Arc<RwLock<MiningStatusManager>>,
    websocket_message_tx: Arc<tokio::sync::mpsc::Sender<WebsocketMessage>>,
    websocket_manager_status_rx: Arc<watch::Receiver<WebsocketManagerStatusMessage>>,
    websocket_manager: Arc<RwLock<WebsocketManager>>,
    websocket_event_manager: Arc<RwLock<WebsocketEventsManager>>,
}

#[derive(Clone, serde::Serialize, serde::Deserialize)]
struct FEPayload {
    token: Option<String>,
}

// Helper function to create managers with AppHandle
#[allow(clippy::too_many_arguments)]
async fn create_managers_with_app_handle(
    app_handle: tauri::AppHandle,
    stats_collector: &mut ProcessStatsCollectorBuilder,
    base_node_watch_rx: watch::Receiver<BaseNodeStatus>,
    wallet_state_watch_tx: watch::Sender<Option<WalletState>>,
    websocket_message_tx: tokio::sync::mpsc::Sender<WebsocketMessage>,
    websocket_manager_status_tx: watch::Sender<WebsocketManagerStatusMessage>,
    websocket_manager_status_rx: watch::Receiver<WebsocketManagerStatusMessage>,
    gpu_status_tx: watch::Sender<GpuMinerStatus>,
    cpu_miner_status_watch_tx: watch::Sender<CpuMinerStatus>,
    p2pool_stats_tx: watch::Sender<Option<P2poolStats>>,
    tor_watch_tx: watch::Sender<TorStatus>,
    app_in_memory_config: Arc<RwLock<AppInMemoryConfig>>,
    _cpu_config: Arc<RwLock<CpuMinerConfig>>, // Prefix with _ to silence warning
) -> (
    NodeManager,
    WalletManager,
    SpendWalletManager,
    CpuMiner,
    GpuMiner,
    TorManager,
    MmProxyManager,
    P2poolManager,
    TelemetryManager,
    WebsocketManager,
    WebsocketEventsManager,
    UpdatesManager,
    TelemetryService,
    Feedback,
    MiningStatusManager,
) {
    // Create receivers before passing senders to constructors
    let gpu_status_rx = gpu_status_tx.subscribe();
    let cpu_miner_status_watch_rx = cpu_miner_status_watch_tx.subscribe();
    let p2pool_stats_rx = p2pool_stats_tx.subscribe();
    let tor_watch_rx = tor_watch_tx.subscribe();

    // Create node manager components
    let (local_node_watch_tx, local_node_watch_rx) = watch::channel(BaseNodeStatus::default());
    let (remote_node_watch_tx, remote_node_watch_rx) = watch::channel(BaseNodeStatus::default());
    let (base_node_watch_tx, _) = watch::channel(BaseNodeStatus::default());

    let node_manager = NodeManager::new(
        stats_collector,
        LocalNodeAdapter::new(local_node_watch_tx.clone()),
        RemoteNodeAdapter::new(remote_node_watch_tx.clone()),
        NodeType::Local,
        base_node_watch_tx,
        local_node_watch_rx,
        remote_node_watch_rx,
        app_handle.clone(),
    );

    let wallet_manager = WalletManager::new(
        node_manager.clone(),
        wallet_state_watch_tx,
        stats_collector,
        app_handle.clone(),
    );

    let spend_wallet_manager = SpendWalletManager::new(node_manager.clone());

    let cpu_miner = CpuMiner::new(
        stats_collector,
        cpu_miner_status_watch_tx.clone(), // Clone here
        base_node_watch_rx.clone(),
        app_handle.clone(),
    );

    let gpu_miner = GpuMiner::new(
        gpu_status_tx.clone(), // Clone here
        base_node_watch_rx.clone(),
        stats_collector,
        app_handle.clone(),
    );

    let tor_manager = TorManager::new(
        tor_watch_tx.clone(), // Clone here
        stats_collector,
        app_handle.clone(),
    );

    let mm_proxy_manager = MmProxyManager::new(stats_collector, app_handle.clone());

    let p2pool_manager = P2poolManager::new(
        p2pool_stats_tx.clone(), // Clone here
        stats_collector,
        app_handle.clone(),
    );

    // Build stats collector before creating telemetry manager
    let stats_collector_built = ProcessStatsCollectorBuilder::new().build();

    let telemetry_manager = TelemetryManager::new(
        cpu_miner_status_watch_rx.clone(),
        app_in_memory_config.clone(),
        Some(Network::default()),
        gpu_status_rx.clone(),
        base_node_watch_rx.clone(),
        p2pool_stats_rx.clone(),
        tor_watch_rx.clone(),
        stats_collector_built, // Use the built version
        node_manager.clone(),
    );

    let websocket_manager = WebsocketManager::new(
        app_in_memory_config.clone(),
        tokio::sync::mpsc::channel::<WebsocketMessage>(500).1,
        websocket_manager_status_tx.clone(),
        websocket_manager_status_rx.clone(),
    );

    let websocket_events_manager = WebsocketEventsManager::new(
        cpu_miner_status_watch_rx.clone(),
        gpu_status_rx.clone(),
        base_node_watch_rx.clone(),
        websocket_message_tx.clone(),
    );

    let updates_manager = UpdatesManager::new();
    let telemetry_service = TelemetryService::new(app_in_memory_config.clone());
    let feedback = Feedback::new(app_in_memory_config.clone());

    let mining_status_manager = MiningStatusManager::new(
        cpu_miner_status_watch_rx.clone(),
        gpu_status_rx.clone(),
        base_node_watch_rx.clone(),
        app_in_memory_config.clone(),
    );

    (
        node_manager,
        wallet_manager,
        spend_wallet_manager,
        cpu_miner,
        gpu_miner,
        tor_manager,
        mm_proxy_manager,
        p2pool_manager,
        telemetry_manager,
        websocket_manager,
        websocket_events_manager,
        updates_manager,
        telemetry_service,
        feedback,
        mining_status_manager,
    )
}

#[allow(clippy::too_many_lines)]
fn main() {
    let _unused = fix_path_env::fix();

    #[cfg(debug_assertions)]
    {
        if cfg!(tokio_unstable) {
            console_subscriber::init();
        } else {
            println!(
                "Tokio console disabled. To enable, run with: RUSTFLAGS=\"--cfg tokio_unstable\""
            );
        }
    }

    let client = sentry::init((
        "https://edd6b9c1494eb7fda6ee45590b80bcee@o4504839079002112.ingest.us.sentry.io/4507979991285760",
        sentry::ClientOptions {
            release: sentry::release_name!(),
            attach_stacktrace: true,
            ..Default::default()
        },
    ));
    let _guard = minidump::init(&client);

    #[allow(deprecated, reason = "This is a temporary fix until the new tauri API is released")]
    let app = tauri::Builder::default()
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_sentry::init_with_no_injection(&client))
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_single_instance::init(|app, argv, cwd| {
            println!("{}, {argv:?}, {cwd}", app.package_info().name);

            match app.get_webview_window("main") {
                Some(w) => {
                    let _unused = w.show().map_err(|err| error!(target: LOG_TARGET, "Couldn't show the main window {:?}", err));
                    let _unused = w.set_focus();
                },
                None => {
                    error!(target: LOG_TARGET, "Could not find main window");
                }
            };
        }))
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_cli::init())
        .plugin(tauri_plugin_http::init())
        .setup(|app| {
            let config_path = app
                .path()
                .app_config_dir()
                .expect("Could not get config dir");

            // Remove this after it's been rolled out for a few versions
            let log_path = app.path().app_log_dir().map_err(|e| e.to_string())?;
            let logs_cleared_file = log_path.join("logs_cleared");
            if logs_cleared_file.exists() {
                remove_file(&logs_cleared_file).map_err(|e| e.to_string())?;
            }

            let contents = setup_logging(
                &log_path
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

            // Get app handle for manager creation
            let app_handle = app.handle().clone();

            // Create channels for communication between components
            let (_base_node_watch_tx, base_node_watch_rx) = watch::channel(BaseNodeStatus::default());
            let (wallet_state_watch_tx, wallet_state_watch_rx) = watch::channel::<Option<WalletState>>(None);
            let (websocket_message_tx, _websocket_message_rx) = tokio::sync::mpsc::channel::<WebsocketMessage>(500);
            let (websocket_manager_status_tx, websocket_manager_status_rx) = watch::channel::<WebsocketManagerStatusMessage>(WebsocketManagerStatusMessage::Stopped);
            let (gpu_status_tx, gpu_status_rx) = watch::channel(GpuMinerStatus::default());
            let (cpu_miner_status_watch_tx, cpu_miner_status_watch_rx) = watch::channel::<CpuMinerStatus>(CpuMinerStatus::default());
            let (p2pool_stats_tx, p2pool_stats_rx) = watch::channel(None);
            let (tor_watch_tx, _tor_watch_rx) = watch::channel(TorStatus::default());

            let cpu_config = Arc::new(RwLock::new(CpuMinerConfig {
                node_connection: CpuMinerConnection::BuiltInProxy,
                eco_mode_xmrig_options: vec![],
                ludicrous_mode_xmrig_options: vec![],
                custom_mode_xmrig_options: vec![],
                eco_mode_cpu_percentage: None,
                ludicrous_mode_cpu_percentage: None,
                pool_host_name: None,
                pool_port: None,
                monero_address: "".to_string(),
                pool_status_url: None,
            }));

            let app_in_memory_config = Arc::new(RwLock::new(app_in_memory_config::AppInMemoryConfig::init()));

            let mut stats_collector = ProcessStatsCollectorBuilder::new();

            // Create managers synchronously but pass app_handle to each
            let (
                node_manager,
                wallet_manager,
                spend_wallet_manager,
                cpu_miner,
                gpu_miner,
                tor_manager,
                mm_proxy_manager,
                p2pool_manager,
                telemetry_manager,
                websocket_manager,
                websocket_events_manager,
                updates_manager,
                telemetry_service,
                feedback,
                mining_status_manager,
            ) = tauri::async_runtime::block_on(create_managers_with_app_handle(
                app_handle.clone(),
                &mut stats_collector,
                base_node_watch_rx.clone(),
                wallet_state_watch_tx.clone(),
                websocket_message_tx.clone(),
                websocket_manager_status_tx.clone(),
                websocket_manager_status_rx.clone(),
                gpu_status_tx.clone(),
                cpu_miner_status_watch_tx.clone(),
                p2pool_stats_tx.clone(),
                tor_watch_tx.clone(),
                app_in_memory_config.clone(),
                cpu_config.clone(),
            ));

            // Create app state with all properly initialized managers
            let app_state = UniverseAppState {
                cpu_miner_timestamp_mutex: Arc::new(Mutex::new(SystemTime::now())),
                cpu_miner_stop_start_mutex: Arc::new(Mutex::new(())),
                gpu_miner_stop_start_mutex: Arc::new(Mutex::new(())),
                is_getting_p2pool_connections: Arc::new(AtomicBool::new(false)),
                node_status_watch_rx: Arc::new(base_node_watch_rx),
                wallet_state_watch_rx: Arc::new(wallet_state_watch_rx.clone()),
                cpu_miner_status_watch_rx: Arc::new(cpu_miner_status_watch_rx),
                gpu_latest_status: Arc::new(gpu_status_rx),
                p2pool_latest_status: Arc::new(p2pool_stats_rx),
                is_getting_transactions_history: Arc::new(AtomicBool::new(false)),
                is_getting_coinbase_history: Arc::new(AtomicBool::new(false)),
                in_memory_config: app_in_memory_config.clone(),
                tari_address: Arc::new(RwLock::new(TariAddress::default())),
                cpu_miner: Arc::new(RwLock::new(cpu_miner)),
                gpu_miner: Arc::new(RwLock::new(gpu_miner)),
                cpu_miner_config: cpu_config.clone(),
                mm_proxy_manager,
                node_manager,
                wallet_manager,
                spend_wallet_manager: Arc::new(RwLock::new(spend_wallet_manager)),
                p2pool_manager,
                telemetry_manager: Arc::new(RwLock::new(telemetry_manager)),
                telemetry_service: Arc::new(RwLock::new(telemetry_service)),
                feedback: Arc::new(RwLock::new(feedback)),
                tor_manager,
                updates_manager,
                cached_p2pool_connections: Arc::new(RwLock::new(None)),
                systemtray_manager: Arc::new(RwLock::new(SystemTrayManager::new())),
                mining_status_manager: Arc::new(RwLock::new(mining_status_manager)),
                websocket_message_tx: Arc::new(websocket_message_tx),
                websocket_manager_status_rx: Arc::new(websocket_manager_status_rx.clone()),
                websocket_manager: Arc::new(RwLock::new(websocket_manager)),
                websocket_event_manager: Arc::new(RwLock::new(websocket_events_manager)),
            };

            // Manage the state synchronously - this is critical for invoke handlers to work
            app.manage(app_state);

            // Handle CLI arguments
            match app.cli().matches() {
                Ok(matches) => {
                    if let Some(backup_path) = matches.args.get("import-backup") {
                        if let Some(backup_path)  = backup_path.value.as_str() {
                            info!(target: LOG_TARGET, "Trying to copy backup to existing db: {:?}", backup_path);
                            let backup_path = Path::new(backup_path);
                            if backup_path.exists() {
                               let existing_db = app.path()
                                    .app_local_data_dir()
                                    .map_err(Box::new)?
                                    .join("node")
                                    .join(Network::get_current_or_user_setting_or_default().to_string())
                                    .join("data").join("base_node").join("db");

                                info!(target: LOG_TARGET, "Existing db path: {:?}", existing_db);
                                let _unused = fs::remove_dir_all(&existing_db).inspect_err(|e| warn!(target: LOG_TARGET, "Could not remove existing db when importing backup: {:?}", e));
                                let _unused=fs::create_dir_all(&existing_db).inspect_err(|e| error!(target: LOG_TARGET, "Could not create existing db when importing backup: {:?}", e));
                                let _unused = fs::copy(backup_path, existing_db.join("data.mdb")).inspect_err(|e| error!(target: LOG_TARGET, "Could not copy backup to existing db: {:?}", e));
                            } else {
                                warn!(target: LOG_TARGET, "Backup file does not exist: {:?}", backup_path);
                            }
                        }
                    }
                },
                Err(e) => {
                    error!(target: LOG_TARGET, "Could not get cli matches: {:?}", e);
                   return Err(Box::new(e));
                }
            };

            // Handle restart operations
            let tcp_tor_toggled_file = config_path.join("tcp_tor_toggled");
            if tcp_tor_toggled_file.exists() {
                let network = Network::default().as_key_str();

                let node_peer_db = config_path.join("node").join(network).join("peer_db");
                let wallet_peer_db = config_path.join("wallet").join(network).join("peer_db");

                // They may not exist. This could be first run.
                if node_peer_db.exists() {
                    if let Err(e) = remove_dir_all(node_peer_db) {
                        warn!(target: LOG_TARGET, "Could not clear peer data folder: {}", e);
                    }
                }

                if wallet_peer_db.exists() {
                    if let Err(e) = remove_dir_all(wallet_peer_db) {
                        warn!(target: LOG_TARGET, "Could not clear peer data folder: {}", e);
                    }
                }

                remove_file(tcp_tor_toggled_file).map_err(|e| {
                    error!(target: LOG_TARGET, "Could not remove tcp_tor_toggled file: {}", e);
                    e.to_string()
                })?;
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::close_splashscreen,
            commands::download_and_start_installer,
            commands::exit_application,
            commands::fetch_tor_bridges,
            commands::get_app_in_memory_config,
            commands::get_applications_versions,
            commands::get_external_dependencies,
            commands::get_max_consumption_levels,
            commands::get_monero_seed_words,
            commands::get_network,
            commands::get_p2pool_stats,
            commands::get_paper_wallet_details,
            commands::get_seed_words,
            commands::get_tor_config,
            commands::get_tor_entry_guards,
            commands::get_transactions_history,
            commands::get_coinbase_transactions,
            commands::import_seed_words,
            commands::log_web_message,
            commands::open_log_dir,
            commands::reset_settings,
            commands::restart_application,
            commands::send_feedback,
            commands::set_allow_telemetry,
            commands::send_data_telemetry_service,
            commands::set_application_language,
            commands::set_auto_update,
            commands::set_cpu_mining_enabled,
            commands::set_display_mode,
            commands::set_gpu_mining_enabled,
            commands::set_mine_on_app_start,
            commands::set_mode,
            commands::set_monero_address,
            commands::set_monerod_config,
            commands::set_tari_address,
            commands::confirm_exchange_address,
            commands::set_p2pool_enabled,
            commands::set_show_experimental_settings,
            commands::set_should_always_use_system_language,
            commands::set_should_auto_launch,
            commands::set_tor_config,
            commands::set_use_tor,
            commands::set_visual_mode,
            commands::start_cpu_mining,
            commands::start_gpu_mining,
            commands::stop_cpu_mining,
            commands::stop_gpu_mining,
            commands::update_applications,
            commands::get_p2pool_connections,
            commands::set_p2pool_stats_server_port,
            commands::get_used_p2pool_stats_server_port,
            commands::proceed_with_update,
            commands::set_pre_release,
            commands::check_for_updates,
            commands::try_update,
            commands::toggle_device_exclusion,
            commands::get_network,
            commands::sign_ws_data,
            commands::set_airdrop_tokens,
            commands::get_airdrop_tokens,
            commands::set_selected_engine,
            commands::frontend_ready,
            commands::start_mining_status,
            commands::stop_mining_status,
            commands::websocket_connect,
            commands::websocket_close,
            commands::reconnect,
            commands::send_one_sided_to_stealth_address,
            commands::verify_address_for_send,
            commands::validate_minotari_amount,
            commands::trigger_phases_restart,
            commands::set_node_type,
            commands::set_warmup_seen,
            commands::set_allow_notifications,
            commands::launch_builtin_tapplet,
            commands::get_tari_wallet_address,
            commands::get_tari_wallet_balance,
            commands::get_bridge_envs
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

    let power_monitor = SystemStatus::current().start_listener();

    let is_restart_requested = Arc::new(AtomicBool::new(false));
    let is_restart_requested_clone = is_restart_requested.clone();

    app.run(move |app_handle, event| {
        // We can only receive system events from the event loop so this needs to be here
        let _unused = SystemStatus::current().receive_power_event(&power_monitor).inspect_err(|e| {
            error!(target: LOG_TARGET, "Could not receive power event: {:?}", e)
        });

        match event {
        tauri::RunEvent::Ready  => {
            info!(target: LOG_TARGET, "RunEvent Ready");
            let handle_clone = app_handle.clone();
            tauri::async_runtime::spawn(async move {
                SetupManager::get_instance().start_setup(handle_clone.clone()).await;
                SetupManager::spawn_sleep_mode_handler(handle_clone.clone()).await;
                // Initialize frontend updates after setup is complete
                if let Err(e) = initialize_frontend_updates(&handle_clone).await {
                    error!(target: LOG_TARGET, "Failed to initialize frontend updates: {:?}", e);
                }
            });
        }
        tauri::RunEvent::ExitRequested { api: _, code, .. } => {
            info!(target: LOG_TARGET, "App shutdown request caught with code: {:#?}", code);
            if let Some(exit_code) = code {
                if exit_code == RESTART_EXIT_CODE {
                    // RunEvent does not hold the exit code so we store it separately
                    is_restart_requested.store(true, Ordering::SeqCst);
                }
            }
            block_on(TasksTrackers::current().stop_all_processes());
            info!(target: LOG_TARGET, "App shutdown complete");
        }
        tauri::RunEvent::Exit => {
            info!(target: LOG_TARGET, "App shutdown caught");
            block_on(TasksTrackers::current().stop_all_processes());
            if is_restart_requested_clone.load(Ordering::SeqCst) {
                app_handle.cleanup_before_exit();
                let env = app_handle.env();
                tauri::process::restart(&env); // this will call exit(0) so we'll not return to the event loop
            }
            info!(target: LOG_TARGET, "Tari Universe v{} shut down successfully", app_handle.package_info().version);
        }
        RunEvent::MainEventsCleared => {
            // no need to handle
        }
        _ => {}
    };
    });
}
