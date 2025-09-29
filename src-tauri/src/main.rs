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

use app_in_memory_config::AppInMemoryConfig;
use events_emitter::EventsEmitter;
use log::{error, info, warn};
use mining_status_manager::MiningStatusManager;
use node::local_node_adapter::LocalNodeAdapter;
use node::node_adapter::BaseNodeStatus;
use node::node_manager::NodeType;
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
use websocket_events_manager::WebsocketEventsManager;
use websocket_manager::{WebsocketManager, WebsocketManagerStatusMessage, WebsocketMessage};

use log4rs::config::RawConfig;
use std::fs;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use tari_common::configuration::Network;
use tauri::async_runtime::block_on;
use tauri::{Manager, RunEvent};
use tauri_plugin_sentry::{minidump, sentry};
use tokio::sync::RwLock;
use utils::logging_utils::setup_logging;

#[cfg(all(feature = "exchange-ci", not(feature = "release-ci")))]
use app_in_memory_config::EXCHANGE_ID;

use telemetry_manager::TelemetryManager;

use crate::feedback::Feedback;
use crate::mining::cpu::manager::CpuManager;
use crate::mining::cpu::CpuMinerStatus;
use crate::mining::gpu::consts::GpuMinerStatus;
use crate::mining::gpu::manager::GpuManager;
use crate::mm_proxy_manager::MmProxyManager;
use crate::node::node_manager::NodeManager;
use crate::tor_manager::TorManager;
use crate::wallet::wallet_manager::WalletManager;
use crate::wallet::wallet_types::WalletState;

mod ab_test_selector;
mod airdrop;
mod app_in_memory_config;
mod auto_launcher;
mod binaries;
mod commands;
mod configs;
mod consts;
mod credential_manager;
mod download_utils;
mod events;
mod events_emitter;
mod events_manager;
mod feedback;
mod hardware;
mod internal_wallet;
mod mining;
mod mining_status_manager;
mod mm_proxy_adapter;
mod mm_proxy_manager;
mod network_utils;
mod node;
mod pin;
mod port_allocator;
mod process_adapter;
mod process_adapter_utils;
mod process_killer;
mod process_stats_collector;
mod process_utils;
mod process_watcher;
mod progress_trackers;
mod release_notes;
mod requests;
mod setup;
mod system_dependencies;
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
mod wallet;
mod websocket_events_manager;
mod websocket_manager;

const LOG_TARGET: &str = "tari::universe::main";
const RESTART_EXIT_CODE: i32 = i32::MAX;
const IGNORED_SENTRY_ERRORS: [&str; 2] = [
    "Failed to initialize gtk backend",
    "SIGABRT / SI_TKILL / 0x0",
];

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

#[derive(Clone)]
struct UniverseAppState {
    node_status_watch_rx: Arc<watch::Receiver<BaseNodeStatus>>,
    #[allow(dead_code)]
    wallet_state_watch_rx: Arc<watch::Receiver<Option<WalletState>>>,
    in_memory_config: Arc<RwLock<AppInMemoryConfig>>,
    mm_proxy_manager: MmProxyManager,
    node_manager: NodeManager,
    wallet_manager: WalletManager,
    telemetry_manager: Arc<RwLock<TelemetryManager>>,
    telemetry_service: Arc<RwLock<TelemetryService>>,
    feedback: Arc<RwLock<Feedback>>,
    tor_manager: TorManager,
    updates_manager: UpdatesManager,
    mining_status_manager: Arc<RwLock<MiningStatusManager>>,
    websocket_message_tx: Arc<tokio::sync::mpsc::Sender<WebsocketMessage>>,
    websocket_manager_status_rx: Arc<watch::Receiver<WebsocketManagerStatusMessage>>,
    websocket_manager: Arc<RwLock<WebsocketManager>>,
    websocket_event_manager: Arc<RwLock<WebsocketEventsManager>>,
}

#[allow(clippy::too_many_lines)]
fn main() {
    #[cfg(target_os = "linux")]
    {
        if std::path::Path::new("/dev/dri").exists()
            && std::env::var("WAYLAND_DISPLAY").is_err()
            && std::env::var("XDG_SESSION_TYPE").unwrap_or_default() == "x11"
        {
            std::env::set_var("WEBKIT_DISABLE_DMABUF_RENDERER", "1");
        }
    }
    let _unused = fix_path_env::fix();
    // TODO: Integrate sentry into logs. Because we are using Tari's logging infrastructure, log4rs
    // sets the logger and does not expose a way to add sentry into it.

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
            before_send: Some(Arc::new(|event| {
                if event.logentry.as_ref().is_some_and(|entry| {
                    IGNORED_SENTRY_ERRORS.iter().any(|ignored| entry.message.starts_with(ignored))
                }) {
                    None
                } else {
                    Some(event)
                }
            })),
            ..Default::default()
        },
    ));
    let _guard = minidump::init(&client);

    let mut stats_collector = ProcessStatsCollectorBuilder::new();
    // NOTE: Nothing is started at this point, so ports are not known. You can only start settings ports
    // and addresses once the different services have been started.
    // A better way is to only provide the config when we start the service.
    let (base_node_watch_tx, base_node_watch_rx) = watch::channel(BaseNodeStatus::default());
    let (local_node_watch_tx, local_node_watch_rx) = watch::channel(BaseNodeStatus::default());
    let (remote_node_watch_tx, remote_node_watch_rx) = watch::channel(BaseNodeStatus::default());
    let node_manager = NodeManager::new(
        &mut stats_collector,
        LocalNodeAdapter::new(local_node_watch_tx.clone()),
        RemoteNodeAdapter::new(remote_node_watch_tx.clone()),
        // This value is later overriden when retrieved from config
        NodeType::Local,
        base_node_watch_tx,
        local_node_watch_rx,
        remote_node_watch_rx,
    );
    let (wallet_state_watch_tx, wallet_state_watch_rx) =
        watch::channel::<Option<WalletState>>(None);
    let (websocket_message_tx, websocket_message_rx) =
        tokio::sync::mpsc::channel::<WebsocketMessage>(500);

    //NOTE DONT use websocket_state_tx anywhere else than WebsocketManager
    let (websocket_manager_status_tx, websocket_manager_status_rx) =
        watch::channel::<WebsocketManagerStatusMessage>(WebsocketManagerStatusMessage::Stopped);

    let (gpu_status_tx, gpu_status_rx) = watch::channel(GpuMinerStatus::default());
    let (cpu_miner_status_watch_tx, cpu_miner_status_watch_rx) =
        watch::channel::<CpuMinerStatus>(CpuMinerStatus::default());
    let wallet_manager = WalletManager::new(
        node_manager.clone(),
        wallet_state_watch_tx,
        &mut stats_collector,
        base_node_watch_rx.clone(),
    );

    let app_in_memory_config = Arc::new(RwLock::new(AppInMemoryConfig::default()));

    block_on(GpuManager::initialize(
        stats_collector.take_gpu_miner(),
        gpu_status_tx.clone(),
        Some(base_node_watch_rx.clone()),
    ));

    block_on(CpuManager::initialize(
        stats_collector.take_cpu_miner(),
        cpu_miner_status_watch_tx.clone(),
        Some(base_node_watch_rx.clone()),
    ));

    let (tor_watch_tx, tor_watch_rx) = watch::channel(TorStatus::default());
    let tor_manager = TorManager::new(tor_watch_tx, &mut stats_collector);
    let mm_proxy_manager = MmProxyManager::new(&mut stats_collector);

    let telemetry_manager: TelemetryManager = TelemetryManager::new(
        cpu_miner_status_watch_rx.clone(),
        app_in_memory_config.clone(),
        Some(Network::default()),
        gpu_status_rx.clone(),
        base_node_watch_rx.clone(),
        tor_watch_rx.clone(),
        stats_collector.build(),
        node_manager.clone(),
    );

    let websocket_manager = Arc::new(RwLock::new(WebsocketManager::new(
        app_in_memory_config.clone(),
        websocket_message_rx,
        websocket_manager_status_tx.clone(),
        websocket_manager_status_rx.clone(),
    )));

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
    let app_state = UniverseAppState {
        node_status_watch_rx: Arc::new(base_node_watch_rx),
        wallet_state_watch_rx: Arc::new(wallet_state_watch_rx.clone()),
        in_memory_config: app_in_memory_config.clone(),
        mm_proxy_manager: mm_proxy_manager.clone(),
        node_manager,
        wallet_manager,
        telemetry_manager: Arc::new(RwLock::new(telemetry_manager)),
        telemetry_service: Arc::new(RwLock::new(telemetry_service)),
        feedback: Arc::new(RwLock::new(feedback)),
        tor_manager,
        updates_manager,
        mining_status_manager: Arc::new(RwLock::new(mining_status_manager)),
        websocket_message_tx: Arc::new(websocket_message_tx),
        websocket_manager_status_rx: Arc::new(websocket_manager_status_rx.clone()),
        websocket_manager,
        websocket_event_manager: Arc::new(RwLock::new(websocket_events_manager)),
    };
    let app_state_clone = app_state.clone();
    #[allow(
        deprecated,
        reason = "This is a temporary fix until the new tauri API is released"
    )]
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
                    let _unused = w.show().map_err(|err| {
                        error!(
                            target: LOG_TARGET,
                            "Couldn't show the main window {err:?}"
                        )
                    });
                    let _unused = w.set_focus();
                }
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

            // Do this after logging has started otherwise we can't actually see any errors
            app.manage(app_state_clone);
            match app.cli().matches() {
                Ok(matches) => {
                    if let Some(backup_path) = matches.args.get("import-backup") {
                        if let Some(backup_path) = backup_path.value.as_str() {
                            info!(
                                target: LOG_TARGET,
                                "Trying to copy backup to existing db: {backup_path:?}"
                            );
                            let backup_path = Path::new(backup_path);
                            if backup_path.exists() {
                                let existing_db = app
                                    .path()
                                    .app_local_data_dir()
                                    .map_err(Box::new)?
                                    .join("node")
                                    .join(
                                        Network::get_current_or_user_setting_or_default()
                                            .to_string(),
                                    )
                                    .join("data")
                                    .join("base_node")
                                    .join("db");

                                info!(target: LOG_TARGET, "Existing db path: {existing_db:?}");
                                let _unused = fs::remove_dir_all(&existing_db).inspect_err(|e| {
                                    warn!(
                                        target: LOG_TARGET,
                                        "Could not remove existing db when importing backup: {e:?}"
                                    )
                                });
                                let _unused = fs::create_dir_all(&existing_db).inspect_err(|e| {
                                    error!(
                                        target: LOG_TARGET,
                                        "Could not create existing db when importing backup: {e:?}"
                                    )
                                });
                                let _unused = fs::copy(backup_path, existing_db.join("data.mdb"))
                                    .inspect_err(|e| {
                                        error!(
                                            target: LOG_TARGET,
                                            "Could not copy backup to existing db: {e:?}"
                                        )
                                    });
                            } else {
                                warn!(
                                    target: LOG_TARGET,
                                    "Backup file does not exist: {backup_path:?}"
                                );
                            }
                        }
                    }
                }
                Err(e) => {
                    error!(target: LOG_TARGET, "Could not get cli matches: {e:?}");
                    return Err(Box::new(e));
                }
            };
            // The start of needed restart operations. Break this out into a module if we need n+1
            let tcp_tor_toggled_file = config_path.join("tcp_tor_toggled");
            if tcp_tor_toggled_file.exists() {
                let network = Network::default().as_key_str();

                let local_data_dir = app
                    .path()
                    .app_local_data_dir()
                    .expect("Could not get local data dir");

                let node_peer_db = local_data_dir.join("node").join(network).join("peer_db");
                let wallet_peer_db = local_data_dir.join("wallet").join(network).join("peer_db");

                // They may not exist. This could be first run.
                if node_peer_db.exists() {
                    if let Err(e) = remove_dir_all(node_peer_db) {
                        warn!(
                            target: LOG_TARGET,
                            "Could not clear peer data folder: {e}"
                        );
                    }
                }

                if wallet_peer_db.exists() {
                    if let Err(e) = remove_dir_all(wallet_peer_db) {
                        warn!(
                            target: LOG_TARGET,
                            "Could not clear peer data folder: {e}"
                        );
                    }
                }

                remove_file(tcp_tor_toggled_file).map_err(|e| {
                    error!(
                        target: LOG_TARGET,
                        "Could not remove tcp_tor_toggled file: {e}"
                    );
                    e.to_string()
                })?;
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::download_and_start_installer,
            commands::exit_application,
            commands::fetch_tor_bridges,
            commands::get_app_in_memory_config,
            commands::get_applications_versions,
            commands::get_monero_seed_words,
            commands::get_network,
            commands::get_paper_wallet_details,
            commands::get_seed_words,
            commands::get_tor_config,
            commands::get_transactions,
            commands::import_seed_words,
            commands::revert_to_internal_wallet,
            commands::log_web_message,
            commands::open_log_dir,
            commands::reset_settings,
            commands::restart_application,
            commands::send_feedback,
            commands::set_allow_telemetry,
            commands::set_application_language,
            commands::set_auto_update,
            commands::set_cpu_mining_enabled,
            commands::set_display_mode,
            commands::set_gpu_mining_enabled,
            commands::set_mine_on_app_start,
            commands::set_monero_address,
            commands::set_monerod_config,
            commands::set_external_tari_address,
            commands::confirm_exchange_address,
            commands::select_exchange_miner,
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
            commands::toggle_cpu_pool_mining,
            commands::toggle_gpu_pool_mining,
            commands::proceed_with_update,
            commands::set_pre_release,
            commands::toggle_device_exclusion,
            commands::set_airdrop_tokens,
            commands::get_airdrop_tokens,
            commands::set_selected_engine,
            commands::frontend_ready,
            commands::start_mining_status,
            commands::stop_mining_status,
            commands::websocket_get_status,
            commands::reconnect,
            commands::send_one_sided_to_stealth_address,
            commands::verify_address_for_send,
            commands::validate_minotari_amount,
            commands::trigger_phases_restart,
            commands::set_node_type,
            commands::set_allow_notifications,
            commands::launch_builtin_tapplet,
            commands::get_bridge_envs,
            commands::parse_tari_address,
            commands::refresh_wallet_history,
            commands::get_base_node_status,
            commands::create_pin,
            commands::forgot_pin,
            commands::set_seed_backed_up,
            commands::select_mining_mode,
            commands::update_custom_mining_mode,
            commands::encode_payment_id_to_address,
            commands::save_wxtm_address,
            commands::set_security_warning_dismissed,
            commands::change_cpu_pool,
            commands::change_gpu_pool,
            commands::update_selected_gpu_pool_config,
            commands::update_selected_cpu_pool_config,
            commands::reset_gpu_pool_config,
            commands::reset_cpu_pool_config,
            commands::restart_phases,
            commands::list_connected_peers,
            commands::switch_gpu_miner,
            commands::set_feedback_fields,
        ])
        .build(tauri::generate_context!())
        .inspect_err(|e| {
            error!(
                target: LOG_TARGET,
                "Error while building tauri application: {e:?}"
            )
        })
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
        let _unused = SystemStatus::current()
            .receive_power_event(&power_monitor)
            .inspect_err(|e| error!(target: LOG_TARGET, "Could not receive power event: {e:?}"));

        match event {
            tauri::RunEvent::Ready => {
                info!(target: LOG_TARGET, "RunEvent Ready");
                let handle_clone = app_handle.clone();
                let state = handle_clone.state::<UniverseAppState>();

                block_on(state.updates_manager.initial_try_update(&handle_clone));

                tauri::async_runtime::spawn(async move {
                    SetupManager::get_instance()
                        .start_setup(handle_clone.clone())
                        .await;
                    SetupManager::spawn_sleep_mode_handler().await;
                });
            }
            tauri::RunEvent::ExitRequested { api: _, code, .. } => {
                info!(
                    target: LOG_TARGET,
                    "App shutdown request [ExitRequested] caught with code: {code:#?}"
                );
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
                info!(target: LOG_TARGET, "App shutdown [Exit] caught");
                block_on(TasksTrackers::current().stop_all_processes());
                if is_restart_requested_clone.load(Ordering::SeqCst) {
                    app_handle.cleanup_before_exit();
                    let env = app_handle.env();
                    tauri::process::restart(&env); // this will call exit(0) so we'll not return to the event loop
                }
                info!(
                    target: LOG_TARGET,
                    "Tari Universe v{} shut down successfully",
                    app_handle.package_info().version
                );
            }
            RunEvent::MainEventsCleared => {
                // no need to handle
            }
            _ => {}
        };
    });
}
