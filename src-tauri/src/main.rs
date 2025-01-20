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

use auto_launcher::AutoLauncher;
use gpu_miner_adapter::GpuMinerStatus;
use hardware::hardware_status_monitor::HardwareStatusMonitor;
use log::{debug, error, info, warn};
use node_adapter::BaseNodeStatus;
use p2pool::models::Connections;
use serde_json::json;
use std::fs::{remove_dir_all, remove_file};
use std::path::Path;
use tauri_plugin_cli::CliExt;
use telemetry_service::TelemetryService;
use tokio::sync::watch::{self};
use updates_manager::UpdatesManager;
use wallet_adapter::WalletBalance;

use log4rs::config::RawConfig;
use serde::Serialize;
use std::fs;
use std::sync::atomic::AtomicBool;
use std::sync::Arc;
use std::thread::sleep;
use std::time::{Duration, SystemTime};
use tari_common::configuration::Network;
use tari_common_types::tari_address::TariAddress;
use tari_shutdown::Shutdown;
use tauri::async_runtime::{block_on, JoinHandle};
use tauri::{Emitter, Listener, Manager, RunEvent};
use tauri_plugin_sentry::{minidump, sentry};
use tokio::select;
use tokio::sync::{Mutex, RwLock};
use tokio::time;
use utils::logging_utils::setup_logging;

use app_config::AppConfig;
use app_in_memory_config::AppInMemoryConfig;
use binaries::{binaries_list::Binaries, binaries_resolver::BinaryResolver};

use events::SetupStatusEvent;
use node_manager::NodeManagerError;
use progress_tracker::ProgressTracker;
use telemetry_manager::TelemetryManager;

use crate::cpu_miner::CpuMiner;

use crate::commands::{CpuMinerConnection, MinerMetrics};
#[allow(unused_imports)]
use crate::external_dependencies::ExternalDependencies;
use crate::feedback::Feedback;
use crate::gpu_miner::GpuMiner;
use crate::internal_wallet::InternalWallet;
use crate::mm_proxy_manager::{MmProxyManager, StartConfig};
use crate::node_manager::NodeManager;
use crate::p2pool::models::P2poolStats;
use crate::p2pool_manager::{P2poolConfig, P2poolManager};
use crate::tor_manager::TorManager;
use crate::wallet_manager::WalletManager;
#[cfg(target_os = "macos")]
use utils::macos_utils::is_app_in_applications_folder;
use utils::shutdown_utils::stop_all_processes;

mod app_config;
mod app_in_memory_config;
mod auto_launcher;
mod binaries;
mod commands;
mod consts;
mod cpu_miner;
mod credential_manager;
mod download_utils;
mod events;
mod external_dependencies;
mod feedback;
mod github;
mod gpu_miner;
mod gpu_miner_adapter;
mod hardware;
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
mod telemetry_manager;
mod telemetry_service;
mod tests;
mod tor_adapter;
mod tor_manager;
mod updates_manager;
mod utils;
mod wallet_adapter;
mod wallet_manager;
mod xmrig;
mod xmrig_adapter;

const LOG_TARGET: &str = "tari::universe::main";
#[cfg(not(any(feature = "release-ci", feature = "release-ci-beta")))]
const APPLICATION_FOLDER_ID: &str = "com.tari.universe.alpha";
#[cfg(all(feature = "release-ci", feature = "release-ci-beta"))]
const APPLICATION_FOLDER_ID: &str = "com.tari.universe.other";
#[cfg(all(feature = "release-ci", not(feature = "release-ci-beta")))]
const APPLICATION_FOLDER_ID: &str = "com.tari.universe";
#[cfg(all(feature = "release-ci-beta", not(feature = "release-ci")))]
const APPLICATION_FOLDER_ID: &str = "com.tari.universe.beta";

struct CpuMinerConfig {
    node_connection: CpuMinerConnection,
    tari_address: TariAddress,
    eco_mode_xmrig_options: Vec<String>,
    ludicrous_mode_xmrig_options: Vec<String>,
    custom_mode_xmrig_options: Vec<String>,
    eco_mode_cpu_percentage: Option<u32>,
    ludicrous_mode_cpu_percentage: Option<u32>,
}

#[derive(Debug, Serialize, Clone)]
#[allow(dead_code)]
struct CriticalProblemEvent {
    title: Option<String>,
    description: Option<String>,
}

#[allow(clippy::too_many_lines)]
async fn setup_inner(
    state: tauri::State<'_, UniverseAppState>,
    app: tauri::AppHandle,
) -> Result<(), anyhow::Error> {
    app.emit(
        "setup_message",
        SetupStatusEvent {
            event_type: "setup_status".to_string(),
            title: "starting-up".to_string(),
            title_params: None,
            progress: 0.0,
        },
    )
    .inspect_err(|e| error!(target: LOG_TARGET, "Could not emit event 'setup_message': {:?}", e))?;

    #[cfg(target_os = "macos")]
    if !cfg!(dev) && !is_app_in_applications_folder() {
        app.emit(
            "critical_problem",
            CriticalProblemEvent {
                title: None,
                description: Some("not-installed-in-applications-directory".to_string()),
            },
        )
        .inspect_err(
            |e| error!(target: LOG_TARGET, "Could not emit event 'critical_problem': {:?}", e),
        )?;
        return Ok(());
    }

    state
        .updates_manager
        .init_periodic_updates(app.clone())
        .await?;

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
            app.emit(
                    "missing-applications",
                    external_dependencies
                ).inspect_err(|e| error!(target: LOG_TARGET, "Could not emit event 'missing-applications': {:?}", e))?;
            return Ok(());
        }
    }

    let cpu_miner_config = state.cpu_miner_config.read().await;
    let app_config = state.config.read().await;
    let use_tor = app_config.use_tor();
    let p2pool_enabled = app_config.p2pool_enabled();
    drop(app_config);
    let mm_proxy_manager = state.mm_proxy_manager.clone();

    let is_auto_launcher_enabled = state.config.read().await.should_auto_launch();
    AutoLauncher::current()
        .initialize_auto_launcher(is_auto_launcher_enabled)
        .await?;

    let (tx, rx) = watch::channel("".to_string());
    let progress = ProgressTracker::new(app.clone(), Some(tx));

    let last_binaries_update_timestamp = state.config.read().await.last_binaries_update_timestamp();
    let now = SystemTime::now();

    state
        .telemetry_manager
        .write()
        .await
        .initialize(state.airdrop_access_token.clone(), app.clone())
        .await?;

    let mut telemetry_id = state
        .telemetry_manager
        .read()
        .await
        .get_unique_string()
        .await;
    if telemetry_id.is_empty() {
        telemetry_id = "unknown_miner_tari_universe".to_string();
    }

    let app_version = app.package_info().version.clone();
    state
        .telemetry_service
        .write()
        .await
        .init(app_version.to_string(), telemetry_id.clone())
        .await?;
    let telemetry_service = state.telemetry_service.clone();
    let telemetry_service = &telemetry_service.read().await;

    let mut binary_resolver = BinaryResolver::current().write().await;
    let should_check_for_update = now
        .duration_since(last_binaries_update_timestamp)
        .unwrap_or(Duration::from_secs(0))
        > Duration::from_secs(60 * 60 * 6);

    if use_tor && !cfg!(target_os = "macos") {
        telemetry_service
            .send(
                "checking-latest-version-tor".to_string(),
                json!({
                    "service": "tor_manager",
                    "percentage": 0,
                }),
            )
            .await?;
        progress.set_max(5).await;
        progress
            .update("checking-latest-version-tor".to_string(), None, 0)
            .await;
        binary_resolver
            .initialize_binary_timeout(
                Binaries::Tor,
                progress.clone(),
                should_check_for_update,
                rx.clone(),
            )
            .await?;
        sleep(Duration::from_secs(1));
    }

    let _unused = telemetry_service
        .send(
            "checking-latest-version-node".to_string(),
            json!({
                "service": "node_manager",
                "percentage": 5,
            }),
        )
        .await;
    progress.set_max(10).await;
    progress
        .update("checking-latest-version-node".to_string(), None, 0)
        .await;
    binary_resolver
        .initialize_binary_timeout(
            Binaries::MinotariNode,
            progress.clone(),
            should_check_for_update,
            rx.clone(),
        )
        .await?;
    sleep(Duration::from_secs(1));

    let _unused = telemetry_service
        .send(
            "checking-latest-version-mmproxy".to_string(),
            json!({
                "service": "mmproxy",
                "percentage": 10,
            }),
        )
        .await;
    progress.set_max(15).await;
    progress
        .update("checking-latest-version-mmproxy".to_string(), None, 0)
        .await;
    binary_resolver
        .initialize_binary_timeout(
            Binaries::MergeMiningProxy,
            progress.clone(),
            should_check_for_update,
            rx.clone(),
        )
        .await?;
    sleep(Duration::from_secs(1));

    let _unused = telemetry_service
        .send(
            "checking-latest-version-wallet".to_string(),
            json!({
                "service": "wallet",
                "percentage": 15,
            }),
        )
        .await;
    progress.set_max(20).await;
    progress
        .update("checking-latest-version-wallet".to_string(), None, 0)
        .await;
    binary_resolver
        .initialize_binary_timeout(
            Binaries::Wallet,
            progress.clone(),
            should_check_for_update,
            rx.clone(),
        )
        .await?;
    sleep(Duration::from_secs(1));

    let _unused = telemetry_service
        .send(
            "checking-latest-version-gpuminer".to_string(),
            json!({
                "service": "gpuminer",
                "percentage":20,
            }),
        )
        .await;
    progress.set_max(25).await;
    progress
        .update("checking-latest-version-gpuminer".to_string(), None, 0)
        .await;
    binary_resolver
        .initialize_binary_timeout(
            Binaries::GpuMiner,
            progress.clone(),
            should_check_for_update,
            rx.clone(),
        )
        .await?;
    sleep(Duration::from_secs(1));

    let _unused = telemetry_service
        .send(
            "checking-latest-version-xmrig".to_string(),
            json!({
                "service": "xmrig",
                "percentage":25,
            }),
        )
        .await;
    progress.set_max(30).await;
    progress
        .update("checking-latest-version-xmrig".to_string(), None, 0)
        .await;
    binary_resolver
        .initialize_binary_timeout(
            Binaries::Xmrig,
            progress.clone(),
            should_check_for_update,
            rx.clone(),
        )
        .await?;
    sleep(Duration::from_secs(1));

    let _unused = telemetry_service
        .send(
            "checking-latest-version-sha-p2pool".to_string(),
            json!({
                "service": "sha_p2pool",
                "percentage":30,
            }),
        )
        .await;
    progress.set_max(35).await;
    progress
        .update("checking-latest-version-sha-p2pool".to_string(), None, 0)
        .await;
    binary_resolver
        .initialize_binary_timeout(
            Binaries::ShaP2pool,
            progress.clone(),
            should_check_for_update,
            rx.clone(),
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

    HardwareStatusMonitor::current().initialize().await?;

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
    let _unused = telemetry_service
        .send(
            "waiting-for-minotari-node-to-start".to_string(),
            json!({
                "service": "minotari_node",
                "percentage":35,
            }),
        )
        .await;
    progress.set_max(37).await;
    progress
        .update("waiting-for-minotari-node-to-start".to_string(), None, 0)
        .await;
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
                        let _unused = telemetry_service
                            .send(
                                "resetting-minotari-node-database".to_string(),
                                json!({
                                    "service": "minotari_node",
                                    "percentage":37,
                                }),
                            )
                            .await;
                        progress.set_max(38).await;
                        progress
                            .update("minotari-node-restarting".to_string(), None, 0)
                            .await;
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

    let _unused = telemetry_service
        .send(
            "waiting-for-wallet".to_string(),
            json!({
                "service": "wallet",
                "percentage":35,
            }),
        )
        .await;
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

    let _unused = telemetry_service
        .send(
            "wallet-started".to_string(),
            json!({
                "service": "wallet",
                "percentage":40,
            }),
        )
        .await;
    progress.set_max(45).await;
    progress.update("wallet-started".to_string(), None, 0).await;
    progress
        .update("waiting-for-node".to_string(), None, 0)
        .await;
    let _unused = telemetry_service
        .send(
            "preparing-for-initial-sync".to_string(),
            json!({
                "service": "initial_sync",
                "percentage":45,
            }),
        )
        .await;
    progress.set_max(75).await;
    state.node_manager.wait_synced(progress.clone()).await?;
    let mut telemetry_id = state
        .telemetry_manager
        .read()
        .await
        .get_unique_string()
        .await;
    if telemetry_id.is_empty() {
        telemetry_id = "unknown_miner_tari_universe".to_string();
    }

    if p2pool_enabled {
        let _unused = telemetry_service
            .send(
                "starting-p2pool".to_string(),
                json!({
                    "service": "starting_p2pool",
                    "percentage":75,
                }),
            )
            .await;
        progress.set_max(85).await;
        progress
            .update("starting-p2pool".to_string(), None, 0)
            .await;

        let base_node_grpc = state.node_manager.get_grpc_port().await?;
        let p2pool_config = P2poolConfig::builder()
            .with_base_node(base_node_grpc)
            .with_stats_server_port(state.config.read().await.p2pool_stats_server_port())
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

    let _unused = telemetry_service
        .send(
            "starting-mmproxy".to_string(),
            json!({
                "service": "starting_mmproxy",
                "percentage":85,
            }),
        )
        .await;
    progress.set_max(100).await;
    progress
        .update("starting-mmproxy".to_string(), None, 0)
        .await;

    let base_node_grpc_port = state.node_manager.get_grpc_port().await?;

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
            p2pool_enabled,
            monero_nodes: config.mmproxy_monero_nodes().clone(),
            use_monero_fail: config.mmproxy_use_monero_fail(),
        })
        .await?;
    mm_proxy_manager.wait_ready().await?;
    *state.is_setup_finished.write().await = true;
    let _unused = telemetry_service
        .send(
            "setup-finished".to_string(),
            json!({
                "service": "setup_finished",
                "percentage":100,
            }),
        )
        .await;
    drop(
        app.clone()
            .emit(
                "setup_message",
                SetupStatusEvent {
                    event_type: "setup_status".to_string(),
                    title: "application-started".to_string(),
                    title_params: None,
                    progress: 1.0,
                },
            )
            .inspect_err(
                |e| error!(target: LOG_TARGET, "Could not emit event 'setup_message': {:?}", e),
            ),
    );

    let move_handle = app.clone();
    tauri::async_runtime::spawn(async move {
        let app_state = move_handle.state::<UniverseAppState>().clone();
        let mut interval: time::Interval = time::interval(Duration::from_secs(1));
        let mut shutdown_signal = app_state.shutdown.to_signal();
        loop {
            select! {
                _ = interval.tick() => {
                    if let Ok(metrics_ret) = commands::get_miner_metrics(app_state.clone()).await {
                        drop(move_handle.emit("miner_metrics", metrics_ret));
                    }
                },
                _ = shutdown_signal.wait() => {
                    break;
                },
            }
        }
    });

    let w_move_handle = app.clone();
    tauri::async_runtime::spawn(async move {
        let app_state = w_move_handle.state::<UniverseAppState>().clone();
        let mut interval = time::interval(Duration::from_secs(10));
        let mut shutdown_signal = app_state.shutdown.to_signal();

        loop {
            select! {
                _ = interval.tick() => {
                    if let Ok(wallet) = commands::emit_tari_wallet_details(app_state.clone()).await {
                        drop(w_move_handle.emit("wallet_details", wallet));
                    }
                },
                _ = shutdown_signal.wait() => {
                    break;
                },
            }
        }
    });

    let app_handle_clone: tauri::AppHandle = app.clone();
    tauri::async_runtime::spawn(async move {
        let mut interval: time::Interval = time::interval(Duration::from_secs(30));
        let mut has_send_error = false;

        loop {
            let state = app_handle_clone.state::<UniverseAppState>().inner();
            if state.shutdown.is_triggered() {
                break;
            }

            interval.tick().await;
            let check_if_orphan = state
                .node_manager
                .check_if_is_orphan_chain(!has_send_error)
                .await;
            match check_if_orphan {
                Ok(is_stuck) => {
                    if is_stuck {
                        error!(target: LOG_TARGET, "Miner is stuck on orphan chain");
                    }
                    if is_stuck && !has_send_error {
                        has_send_error = true;
                    }
                    drop(app_handle_clone.emit("is_stuck", is_stuck));
                }
                Err(ref e) => {
                    error!(target: LOG_TARGET, "{}", e);
                }
            }
        }
    });

    Ok(())
}

async fn listen_to_frontend_ready(app: tauri::AppHandle) -> Result<(), anyhow::Error> {
    app.clone().listen("frontend_ready", move |event| {
        info!(target: LOG_TARGET, "Frontend is ready");
        let app_clone: tauri::AppHandle = app.clone();
        tauri::async_runtime::spawn(async move {
            time::sleep(Duration::from_secs(3)).await;
            app_clone
                .emit("app_ready", ())
                .expect("Could not emit event 'app_ready'");
        });
    });

    Ok(())
}

#[derive(Clone)]
struct UniverseAppState {
    stop_start_mutex: Arc<Mutex<()>>,
    base_node_latest_status: Arc<watch::Receiver<BaseNodeStatus>>,
    wallet_latest_balance: Arc<watch::Receiver<Option<WalletBalance>>>,
    gpu_latest_status: Arc<watch::Receiver<GpuMinerStatus>>,
    p2pool_latest_status: Arc<watch::Receiver<Option<P2poolStats>>>,
    is_getting_p2pool_connections: Arc<AtomicBool>,
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
    telemetry_service: Arc<RwLock<TelemetryService>>,
    feedback: Arc<RwLock<Feedback>>,
    airdrop_access_token: Arc<RwLock<Option<String>>>,
    p2pool_manager: P2poolManager,
    tor_manager: TorManager,
    updates_manager: UpdatesManager,
    cached_p2pool_connections: Arc<RwLock<Option<Option<Connections>>>>,
    cached_miner_metrics: Arc<RwLock<Option<MinerMetrics>>>,
}

#[derive(Clone, serde::Serialize)]
struct Payload {
    args: Vec<String>,
    cwd: String,
}

#[derive(Clone, serde::Serialize, serde::Deserialize)]
struct FEPayload {
    token: String,
}

#[allow(clippy::too_many_lines)]
fn main() {
    let _unused = fix_path_env::fix();
    // TODO: Integrate sentry into logs. Because we are using Tari's logging infrastructure, log4rs
    // sets the logger and does not expose a way to add sentry into it.

    let client = sentry::init((
        "https://edd6b9c1494eb7fda6ee45590b80bcee@o4504839079002112.ingest.us.sentry.io/4507979991285760",
        sentry::ClientOptions {
            release: sentry::release_name!(),
            attach_stacktrace: true,
            ..Default::default()
        },
    ));
    let _guard = minidump::init(&client);

    let shutdown = Shutdown::new();

    // NOTE: Nothing is started at this point, so ports are not known. You can only start settings ports
    // and addresses once the different services have been started.
    // A better way is to only provide the config when we start the service.
    let (base_node_watch_tx, base_node_watch_rx) = watch::channel(BaseNodeStatus::default());
    let node_manager = NodeManager::new(base_node_watch_tx);
    let (wallet_watch_tx, wallet_watch_rx) = watch::channel::<Option<WalletBalance>>(None);
    let wallet_manager = WalletManager::new(node_manager.clone(), wallet_watch_tx);
    let wallet_manager2 = wallet_manager.clone();
    let (p2pool_stats_tx, p2pool_stats_rx) = watch::channel(None);
    let p2pool_manager = P2poolManager::new(p2pool_stats_tx);

    let cpu_config = Arc::new(RwLock::new(CpuMinerConfig {
        node_connection: CpuMinerConnection::BuiltInProxy,
        tari_address: TariAddress::default(),
        eco_mode_xmrig_options: vec![],
        ludicrous_mode_xmrig_options: vec![],
        custom_mode_xmrig_options: vec![],
        eco_mode_cpu_percentage: None,
        ludicrous_mode_cpu_percentage: None,
    }));

    let app_in_memory_config =
        Arc::new(RwLock::new(app_in_memory_config::AppInMemoryConfig::init()));

    let (gpu_status_tx, gpu_status_rx) = watch::channel(GpuMinerStatus::default());
    let cpu_miner: Arc<RwLock<CpuMiner>> = Arc::new(CpuMiner::new().into());
    let gpu_miner: Arc<RwLock<GpuMiner>> = Arc::new(GpuMiner::new(gpu_status_tx).into());

    let app_config_raw = AppConfig::new();
    let app_config = Arc::new(RwLock::new(app_config_raw.clone()));

    let telemetry_manager: TelemetryManager = TelemetryManager::new(
        cpu_miner.clone(),
        app_config.clone(),
        app_in_memory_config.clone(),
        Some(Network::default()),
        gpu_status_rx.clone(),
        base_node_watch_rx.clone(),
        p2pool_stats_rx.clone(),
    );
    let telemetry_service = TelemetryService::new(
        app_config_raw.anon_id().to_string(),
        app_config.clone(),
        app_in_memory_config.clone(),
    );
    let updates_manager = UpdatesManager::new(app_config.clone(), shutdown.to_signal());

    let feedback = Feedback::new(app_in_memory_config.clone(), app_config.clone());

    let mm_proxy_manager = MmProxyManager::new();
    let app_state = UniverseAppState {
        stop_start_mutex: Arc::new(Mutex::new(())),
        is_getting_miner_metrics: Arc::new(AtomicBool::new(false)),
        is_getting_p2pool_connections: Arc::new(AtomicBool::new(false)),
        base_node_latest_status: Arc::new(base_node_watch_rx),
        wallet_latest_balance: Arc::new(wallet_watch_rx),
        gpu_latest_status: Arc::new(gpu_status_rx),
        p2pool_latest_status: Arc::new(p2pool_stats_rx),
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
        telemetry_service: Arc::new(RwLock::new(telemetry_service)),
        feedback: Arc::new(RwLock::new(feedback)),
        airdrop_access_token: Arc::new(RwLock::new(None)),
        tor_manager: TorManager::new(),
        updates_manager,
        cached_p2pool_connections: Arc::new(RwLock::new(None)),
        cached_miner_metrics: Arc::new(RwLock::new(None)),
    };

    let app_state2 = app_state.clone();

    let app = tauri::Builder::default()
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_sentry::init_with_no_injection(&client))
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_single_instance::init(|app, argv, cwd| {
            println!("{}, {argv:?}, {cwd}", app.package_info().name);

            app.emit("single-instance", Payload { args: argv, cwd })
                .unwrap_or_else(
                    |e| error!(target: LOG_TARGET, "Could not emit single-instance event: {:?}", e),
                );
        }))
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_cli::init())
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
            app.manage(app_state2);
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

            let token_state_clone = app.state::<UniverseAppState>().airdrop_access_token.clone();
            let memory_state_clone = app.state::<UniverseAppState>().in_memory_config.clone();
            app.listen("airdrop_token", move |event| {
                let token_value = token_state_clone.clone();
                let memory_value = memory_state_clone.clone();
                tauri::async_runtime::spawn(async move {
                    info!(target: LOG_TARGET, "Getting token from Frontend");
                    let payload = event.payload();
                    let res = serde_json::from_str::<FEPayload>(payload).expect("No token");

                    let token = res.token;
                    let mut lock = token_value.write().await;
                    *lock = Some(token.clone());

                    let mut in_memory_app_config = memory_value.write().await;
                    in_memory_app_config.airdrop_access_token =  Some(token);
                });
            });
            // The start of needed restart operations. Break this out into a module if we need n+1
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

            match tauri::async_runtime::block_on(thread_config) {
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

            match tauri::async_runtime::block_on(thread).expect("Could not start task") {
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
            commands::close_splashscreen,
            commands::download_and_start_installer,
            commands::exit_application,
            commands::fetch_tor_bridges,
            commands::get_app_config,
            commands::get_app_in_memory_config,
            commands::get_applications_versions,
            commands::get_external_dependencies,
            commands::get_max_consumption_levels,
            commands::get_miner_metrics,
            commands::get_monero_seed_words,
            commands::get_network,
            commands::get_p2pool_stats,
            commands::get_paper_wallet_details,
            commands::get_seed_words,
            commands::emit_tari_wallet_details,
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
            commands::set_allow_telemetry,
            commands::send_data_telemetry_service,
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
            commands::set_show_experimental_settings,
            commands::set_should_always_use_system_language,
            commands::set_should_auto_launch,
            commands::set_tor_config,
            commands::set_use_tor,
            commands::set_visual_mode,
            commands::start_mining,
            commands::stop_mining,
            commands::update_applications,
            commands::get_p2pool_connections,
            commands::set_p2pool_stats_server_port,
            commands::get_used_p2pool_stats_server_port,
            commands::proceed_with_update,
            commands::set_pre_release,
            commands::check_for_updates,
            commands::try_update,
            commands::get_network,
            commands::sign_ws_data,
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

    app.run(move |app_handle, event| match event {
        tauri::RunEvent::Ready  => {
            info!(target: LOG_TARGET, "App is ready");
            let a = app_handle.clone();
            let app_handle_clone = app_handle.clone();
            tauri::async_runtime::spawn( async move  {
                let state = app_handle_clone.state::<UniverseAppState>().clone();
                let _unused = listen_to_frontend_ready(app_handle_clone.clone()).await;
                let _res = setup_inner(state, a.clone()).await
                    .inspect_err(|e| error!(target: LOG_TARGET, "Could not setup app: {:?}", e));

            });
        }
        tauri::RunEvent::ExitRequested { api: _, .. } => {
            info!(target: LOG_TARGET, "App shutdown request caught");
            let _unused = block_on(stop_all_processes(app_handle.clone(), true));
            info!(target: LOG_TARGET, "App shutdown complete");
        }
        tauri::RunEvent::Exit => {
            info!(target: LOG_TARGET, "App shutdown caught");
            let _unused = block_on(stop_all_processes(app_handle.clone(), true));
            info!(target: LOG_TARGET, "Tari Universe v{} shut down successfully", app_handle.package_info().version);
        }
        RunEvent::MainEventsCleared => {
            // no need to handle
        }
        _ => {
            debug!(target: LOG_TARGET, "Unhandled event: {:?}", event);
        }
    });
}
