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

use crate::app_config::{AirdropTokens, AppConfig, GpuThreads};
use crate::app_in_memory_config::{
    get_der_encode_pub_key, get_websocket_key, AirdropInMemoryConfig,
};
use crate::auto_launcher::AutoLauncher;
use crate::binaries::{Binaries, BinaryResolver};
use crate::credential_manager::{CredentialError, CredentialManager};
use crate::external_dependencies::{
    ExternalDependencies, ExternalDependency, RequiredExternalDependency,
};
use crate::gpu_miner_adapter::{GpuMinerStatus, GpuNodeSource};
use crate::hardware::hardware_status_monitor::PublicDeviceProperties;
use crate::internal_wallet::{InternalWallet, PaperWalletConfig};
use crate::p2pool::models::{Connections, P2poolStats};
use crate::progress_tracker::ProgressTracker;
use crate::tor_adapter::TorConfig;
use crate::utils::shutdown_utils::stop_all_processes;
use crate::utils::system_status::SystemStatus;
use crate::wallet_adapter::TransactionInfo;
use crate::wallet_manager::WalletManagerError;
use crate::{airdrop, UniverseAppState, APPLICATION_FOLDER_ID};

use base64::prelude::*;
use keyring::Entry;
use log::{debug, error, info, warn};
use monero_address_creator::Seed as MoneroSeed;
use regex::Regex;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::fmt::Debug;
use std::fs::{read_dir, remove_dir_all, remove_file, File};
use std::sync::atomic::Ordering;
use std::thread::{available_parallelism, sleep};
use std::time::{Duration, Instant, SystemTime};
use tari_common::configuration::Network;
use tauri::{Emitter, Manager, PhysicalPosition, PhysicalSize};
use tauri_plugin_sentry::sentry;
use tokio::time;

const MAX_ACCEPTABLE_COMMAND_TIME: Duration = Duration::from_secs(1);
const LOG_TARGET: &str = "tari::universe::commands";
const LOG_TARGET_WEB: &str = "tari::universe::web";

#[derive(Debug, Serialize, Clone)]
pub struct MaxUsageLevels {
    max_cpu_threads: i32,
    max_gpus_threads: Vec<GpuThreads>,
}

pub enum CpuMinerConnection {
    BuiltInProxy,
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
pub struct BaseNodeStatus {
    block_height: u64,
    block_time: u64,
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

impl Default for CpuMinerStatus {
    fn default() -> Self {
        Self {
            is_mining: false,
            hash_rate: 0.0,
            estimated_earnings: 0,
            connection: CpuMinerConnectionStatus {
                is_connected: false,
            },
        }
    }
}

impl Default for CpuMinerConnectionStatus {
    fn default() -> Self {
        Self {
            is_connected: false,
        }
    }
}

#[derive(Debug, Serialize, Clone)]
pub struct CpuMinerConnectionStatus {
    pub is_connected: bool,
    // pub error: Option<String>,
}

#[derive(Deserialize, Serialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct SignWsDataResponse {
    signature: String,
    pub_key: String,
}

#[tauri::command]
pub async fn close_splashscreen(app: tauri::AppHandle) {
    let close_max_retries: u32 = 10; // Maximum number of retries
    let retry_delay_ms: u64 = 100; // Delay between retries in milliseconds

    let mut retries = 0;

    let (splashscreen_window, main_window) = loop {
        let splashscreen_window = app.get_webview_window("splashscreen");
        let main_window = app.get_webview_window("main");

        if let (Some(splashscreen), Some(main)) = (splashscreen_window, main_window) {
            break (splashscreen, main);
        }

        retries += 1;
        if retries >= close_max_retries {
            error!(target: "LOG_TARGET", "Failed to fetch both 'splashscreen' and 'main' windows after {} retries", close_max_retries);
            return;
        }

        info!(target: "LOG_TARGET", "Failed to fetch both 'splashscreen' and 'main' windows. Retrying in {}ms", retry_delay_ms);
        tokio::time::sleep(Duration::from_millis(retry_delay_ms)).await;
    };

    if let (Ok(window_position), Ok(window_size)) = (
        splashscreen_window.outer_position(),
        splashscreen_window.inner_size(),
    ) {
        splashscreen_window.close().expect("could not close");
        main_window.show().expect("could not show");
        if let Err(e) = main_window
            .set_position(PhysicalPosition::new(window_position.x, window_position.y))
            .and_then(|_| {
                main_window.set_size(PhysicalSize::new(window_size.width, window_size.height))
            })
        {
            error!(target: LOG_TARGET, "Could not set window position or size: {:?}", e);
        }
    } else {
        error!(target: LOG_TARGET, "Could not get window position or size");
        splashscreen_window.close().expect("could not close");
        main_window.show().expect("could not show");
    }
}

#[tauri::command]
pub async fn frontend_ready(app: tauri::AppHandle) {
    let app_handle = app.clone();
    tauri::async_runtime::spawn(async move {
        let state = app_handle.state::<UniverseAppState>().clone();
        let setup_complete_clone = state.is_setup_finished.read().await;
        let missing_dependencies = state.missing_dependencies.read().await;
        let setup_complete_value = *setup_complete_clone;

        let prog = ProgressTracker::new(app_handle.clone(), None);
        prog.send_last_action("".to_string()).await;

        time::sleep(Duration::from_secs(3)).await;
        app_handle
            .emit("app_ready", setup_complete_value)
            .expect("Could not emit event 'app_ready'");

        let has_missing = missing_dependencies.is_some();
        let external_dependencies = missing_dependencies.clone();
        if has_missing {
            app_handle
                .emit("missing-applications", external_dependencies)
                .expect("Could not emit event 'missing-applications");
        }
    });
}

#[tauri::command]
pub async fn download_and_start_installer(
    _missing_dependency: ExternalDependency,
) -> Result<(), String> {
    let timer = Instant::now();

    #[cfg(target_os = "windows")]
    if cfg!(target_os = "windows") {
        ExternalDependencies::current()
            .install_missing_dependencies(_missing_dependency)
            .await
            .map_err(|e| {
                error!(target: LOG_TARGET, "Could not install missing dependency: {:?}", e);
                e.to_string()
            })?;
    }

    if timer.elapsed() > MAX_ACCEPTABLE_COMMAND_TIME {
        warn!(target: LOG_TARGET,
            "download_and_start_installer took too long: {:?}",
            timer.elapsed()
        );
    }
    Ok(())
}

#[tauri::command]
pub async fn exit_application(_window: tauri::Window, app: tauri::AppHandle) -> Result<(), String> {
    stop_all_processes(app.clone(), true).await?;

    app.exit(0);
    Ok(())
}

#[tauri::command]
pub async fn fetch_tor_bridges() -> Result<Vec<String>, String> {
    let timer = Instant::now();
    let res_html = reqwest::get("https://bridges.torproject.org/bridges?transport=obfs4")
        .await
        .map_err(|e| e.to_string())?
        .text()
        .await
        .map_err(|e| e.to_string())?;

    let re = Regex::new(r"obfs4.*?<br/>").map_err(|e| e.to_string())?;
    let bridges: Vec<String> = re
        .find_iter(&res_html)
        .map(|m| m.as_str().trim_end_matches(" <br/>").to_string())
        .collect();
    info!(target: LOG_TARGET, "Fetched default bridges: {:?}", bridges);
    if timer.elapsed() > MAX_ACCEPTABLE_COMMAND_TIME {
        warn!(target: LOG_TARGET, "fetch_default_tor_bridges took too long: {:?}", timer.elapsed());
    }
    Ok(bridges)
}

#[tauri::command]
pub async fn get_app_config(
    _window: tauri::Window,
    state: tauri::State<'_, UniverseAppState>,
    _app: tauri::AppHandle,
) -> Result<AppConfig, String> {
    Ok(state.config.read().await.clone())
}

#[tauri::command]
pub async fn get_app_in_memory_config(
    _window: tauri::Window,
    state: tauri::State<'_, UniverseAppState>,
    _app: tauri::AppHandle,
) -> Result<AirdropInMemoryConfig, ()> {
    let timer = Instant::now();
    let res = state.in_memory_config.read().await.clone().into();
    if timer.elapsed() > MAX_ACCEPTABLE_COMMAND_TIME {
        warn!(target: LOG_TARGET,
            "get_app_in_memory_config took too long: {:?}",
            timer.elapsed()
        );
    }
    Ok(res)
}

#[tauri::command]
pub async fn get_applications_versions(
    app: tauri::AppHandle,
) -> Result<ApplicationsVersions, String> {
    let timer = Instant::now();
    let binary_resolver = BinaryResolver::current().read().await;

    let tari_universe_version = app.package_info().version.clone();
    let xmrig_version = binary_resolver
        .get_binary_version_string(Binaries::Xmrig)
        .await;

    let minotari_node_version = binary_resolver
        .get_binary_version_string(Binaries::MinotariNode)
        .await;
    let mm_proxy_version = binary_resolver
        .get_binary_version_string(Binaries::MergeMiningProxy)
        .await;
    let wallet_version = binary_resolver
        .get_binary_version_string(Binaries::Wallet)
        .await;
    let sha_p2pool_version = binary_resolver
        .get_binary_version_string(Binaries::ShaP2pool)
        .await;
    let xtrgpuminer_version = binary_resolver
        .get_binary_version_string(Binaries::GpuMiner)
        .await;

    if timer.elapsed() > MAX_ACCEPTABLE_COMMAND_TIME {
        warn!(target: LOG_TARGET,
            "get_applications_versions took too long: {:?}",
            timer.elapsed()
        );
    }

    drop(binary_resolver);

    Ok(ApplicationsVersions {
        tari_universe: tari_universe_version.to_string(),
        minotari_node: minotari_node_version,
        xmrig: xmrig_version,
        mm_proxy: mm_proxy_version,
        wallet: wallet_version,
        sha_p2pool: sha_p2pool_version,
        xtrgpuminer: xtrgpuminer_version,
    })
}

#[tauri::command]
pub async fn get_external_dependencies() -> Result<RequiredExternalDependency, String> {
    let timer = Instant::now();
    let external_dependencies = ExternalDependencies::current()
        .get_external_dependencies()
        .await;
    if timer.elapsed() > MAX_ACCEPTABLE_COMMAND_TIME {
        warn!(target: LOG_TARGET,
            "get_external_dependencies took too long: {:?}",
            timer.elapsed()
        );
    }
    Ok(external_dependencies)
}

#[tauri::command]
pub async fn get_max_consumption_levels(
    state: tauri::State<'_, UniverseAppState>,
) -> Result<MaxUsageLevels, String> {
    // CPU Detection
    let timer = Instant::now();
    let max_cpu_available = available_parallelism()
        .map(|cores| i32::try_from(cores.get()).unwrap_or(1))
        .map_err(|e| e.to_string())?;

    if timer.elapsed() > MAX_ACCEPTABLE_COMMAND_TIME {
        warn!(target: LOG_TARGET, "get_available_cpu_cores took too long: {:?}", timer.elapsed());
    }

    let gpu_devices = state
        .gpu_miner
        .read()
        .await
        .get_gpu_devices()
        .await
        .map_err(|e| e.to_string())?;

    let mut max_gpus_threads = Vec::new();
    for gpu_device in gpu_devices {
        // let max_gpu_threads = gpu_device.max_grid_size;
        // For some reason this is always return 256, even when the cards can do more like
        // 4096 or 8192
        let max_gpu_threads = 8192;
        max_gpus_threads.push(GpuThreads {
            gpu_name: gpu_device.device_name,
            max_gpu_threads,
        });
    }

    Ok(MaxUsageLevels {
        max_cpu_threads: max_cpu_available,
        max_gpus_threads,
    })
}

#[tauri::command]
pub async fn get_network(
    _window: tauri::Window,
    _state: tauri::State<'_, UniverseAppState>,
    _app: tauri::AppHandle,
) -> Result<String, ()> {
    Ok(Network::get_current_or_user_setting_or_default().to_string())
}

#[tauri::command]
pub async fn get_monero_seed_words(
    state: tauri::State<'_, UniverseAppState>,
    app: tauri::AppHandle,
) -> Result<Vec<String>, String> {
    let timer = Instant::now();

    if !state.config.read().await.monero_address_is_generated() {
        return Err(
            "Monero seed words are not available when a Monero address is provided".to_string(),
        );
    }

    let config_path = app
        .path()
        .app_config_dir()
        .expect("Could not get config dir");

    let cm = CredentialManager::default_with_dir(config_path);
    let cred = match cm.get_credentials() {
        Ok(cred) => cred,
        Err(e @ CredentialError::PreviouslyUsedKeyring) => {
            return Err(e.to_string());
        }
        Err(e) => {
            error!(target: LOG_TARGET, "Could not get credentials: {:?}", e);
            return Err(e.to_string());
        }
    };

    let seed = cred
        .monero_seed
        .expect("Couldn't get seed from credentials");

    let seed = MoneroSeed::new(seed);

    if timer.elapsed() > MAX_ACCEPTABLE_COMMAND_TIME {
        warn!(target: LOG_TARGET, "get_seed_words took too long: {:?}", timer.elapsed());
    }

    seed.seed_words().map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_p2pool_stats(
    state: tauri::State<'_, UniverseAppState>,
) -> Result<Option<P2poolStats>, String> {
    let timer = Instant::now();
    let p2pool_stats = state.p2pool_latest_status.borrow().clone();

    if timer.elapsed() > MAX_ACCEPTABLE_COMMAND_TIME {
        warn!(target: LOG_TARGET, "get_p2pool_stats took too long: {:?}", timer.elapsed());
    }
    Ok(p2pool_stats)
}

#[tauri::command]
pub async fn get_p2pool_connections(
    state: tauri::State<'_, UniverseAppState>,
) -> Result<Option<Connections>, String> {
    let timer = Instant::now();
    if state.is_getting_p2pool_connections.load(Ordering::SeqCst) {
        let read = state.cached_p2pool_connections.read().await;
        if let Some(connections) = &*read {
            warn!(target: LOG_TARGET, "Already getting p2pool connections, returning cached value");
            return Ok(connections.clone());
        }
        warn!(target: LOG_TARGET, "Already getting p2pool connections");
        return Err("Already getting p2pool connections".to_string());
    }
    state
        .is_getting_p2pool_connections
        .store(true, Ordering::SeqCst);
    let p2pool_connections = state
        .p2pool_manager
        .get_connections()
        .await
        .unwrap_or_else(|e| {
            warn!(target: LOG_TARGET, "Error getting p2pool connections: {}", e);
            None
        });

    if timer.elapsed() > MAX_ACCEPTABLE_COMMAND_TIME {
        warn!(target: LOG_TARGET, "get_p2pool_connections took too long: {:?}", timer.elapsed());
    }
    let mut lock = state.cached_p2pool_connections.write().await;
    *lock = Some(p2pool_connections.clone());
    state
        .is_getting_p2pool_connections
        .store(false, Ordering::SeqCst);
    Ok(p2pool_connections)
}

#[tauri::command]
pub async fn set_p2pool_stats_server_port(
    port: Option<u16>,
    state: tauri::State<'_, UniverseAppState>,
) -> Result<(), String> {
    state
        .config
        .write()
        .await
        .set_p2pool_stats_server_port(port)
        .await
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub async fn get_used_p2pool_stats_server_port(
    state: tauri::State<'_, UniverseAppState>,
) -> Result<u16, String> {
    Ok(state.p2pool_manager.stats_server_port().await)
}

#[tauri::command]
pub async fn get_paper_wallet_details(
    app: tauri::AppHandle,
    state: tauri::State<'_, UniverseAppState>,
    auth_uuid: Option<String>,
) -> Result<PaperWalletConfig, String> {
    let timer = Instant::now();
    let config_path = app
        .path()
        .app_config_dir()
        .expect("Could not get config dir");
    let balance = state
        .wallet_state_watch_rx
        .borrow()
        .clone()
        .and_then(|state| state.balance);
    let anon_id = state.config.read().await.anon_id().to_string();
    let internal_wallet = InternalWallet::load_or_create(config_path)
        .await
        .map_err(|e| e.to_string())?;

    warn!(target: LOG_TARGET, "auth_uuid {:?}", auth_uuid);
    let result = internal_wallet
        .get_paper_wallet_details(anon_id, balance, auth_uuid)
        .await
        .map_err(|e| e.to_string())?;

    if timer.elapsed() > MAX_ACCEPTABLE_COMMAND_TIME {
        warn!(target: LOG_TARGET, "get_paper_wallet_details took too long: {:?}", timer.elapsed());
    }
    Ok(result)
}

#[tauri::command]
pub async fn get_seed_words(
    _window: tauri::Window,
    _state: tauri::State<'_, UniverseAppState>,
    app: tauri::AppHandle,
) -> Result<Vec<String>, String> {
    let timer = Instant::now();
    let config_path = app
        .path()
        .app_config_dir()
        .expect("Could not get config dir");
    let internal_wallet = InternalWallet::load_or_create(config_path)
        .await
        .map_err(|e| e.to_string())?;
    let seed_words = internal_wallet
        .decrypt_seed_words()
        .map_err(|e| e.to_string())?;
    let mut res = vec![];
    for i in 0..seed_words.len() {
        match seed_words.get_word(i) {
            Ok(word) => res.push(word.clone()),
            Err(error) => {
                error!(target: LOG_TARGET, "Could not get seed word: {:?}", error);
            }
        }
    }
    if timer.elapsed() > MAX_ACCEPTABLE_COMMAND_TIME {
        warn!(target: LOG_TARGET, "get_seed_words took too long: {:?}", timer.elapsed());
    }
    Ok(res)
}

#[tauri::command]
pub async fn get_tor_config(
    _window: tauri::Window,
    state: tauri::State<'_, UniverseAppState>,
    _app: tauri::AppHandle,
) -> Result<TorConfig, String> {
    let timer = Instant::now();
    let tor_config = state.tor_manager.get_tor_config().await;
    if timer.elapsed() > MAX_ACCEPTABLE_COMMAND_TIME {
        warn!(target: LOG_TARGET, "get_tor_config took too long: {:?}", timer.elapsed());
    }
    Ok(tor_config)
}

#[allow(clippy::too_many_lines)]
#[tauri::command]
pub async fn get_tor_entry_guards(
    state: tauri::State<'_, UniverseAppState>,
) -> Result<Vec<String>, String> {
    let timer = Instant::now();
    let res = state
        .tor_manager
        .get_entry_guards()
        .await
        .map_err(|e| e.to_string())?;
    if timer.elapsed() > MAX_ACCEPTABLE_COMMAND_TIME {
        warn!(target: LOG_TARGET, "get_tor_entry_guards took too long: {:?}", timer.elapsed());
    }
    Ok(res)
}

#[tauri::command]
pub async fn get_airdrop_tokens(
    _window: tauri::Window,
    state: tauri::State<'_, UniverseAppState>,
    _app: tauri::AppHandle,
) -> Result<Option<AirdropTokens>, String> {
    let timer = Instant::now();
    let airdrop_access_token = state.config.read().await.airdrop_tokens();
    if timer.elapsed() > MAX_ACCEPTABLE_COMMAND_TIME {
        warn!(target: LOG_TARGET, "get_airdrop_tokens took too long: {:?}", timer.elapsed());
    }
    Ok(airdrop_access_token)
}

#[tauri::command]
pub async fn get_coinbase_transactions(
    state: tauri::State<'_, UniverseAppState>,
    continuation: bool,
    limit: Option<u32>,
) -> Result<Vec<TransactionInfo>, String> {
    let timer = Instant::now();
    if state.is_getting_transaction_history.load(Ordering::SeqCst) {
        warn!(target: LOG_TARGET, "Already getting transaction history");
        return Err("Already getting transaction history".to_string());
    }
    state
        .is_getting_transaction_history
        .store(true, Ordering::SeqCst);
    let transactions = state
        .wallet_manager
        .get_coinbase_transactions(continuation, limit)
        .await
        .unwrap_or_else(|e| {
            if !matches!(e, WalletManagerError::WalletNotStarted) {
                warn!(target: LOG_TARGET, "Error getting transaction history: {}", e);
            }
            vec![]
        });

    if timer.elapsed() > MAX_ACCEPTABLE_COMMAND_TIME {
        warn!(target: LOG_TARGET, "get_coinbase_transactions took too long: {:?}", timer.elapsed());
    }

    state
        .is_getting_transaction_history
        .store(false, Ordering::SeqCst);
    Ok(transactions)
}

#[tauri::command]
pub async fn import_seed_words(
    seed_words: Vec<String>,
    _window: tauri::Window,
    app: tauri::AppHandle,
) -> Result<(), String> {
    let timer = Instant::now();
    let config_path = app
        .path()
        .app_config_dir()
        .expect("Could not get config dir");
    let data_dir = app
        .path()
        .app_local_data_dir()
        .expect("Could not get data dir");

    stop_all_processes(app.clone(), false).await?;

    match InternalWallet::create_from_seed(config_path, seed_words).await {
        Ok(_wallet) => {
            InternalWallet::clear_wallet_local_data(data_dir)
                .await
                .map_err(|e| e.to_string())?;
            info!(target: LOG_TARGET, "[import_seed_words] Restarting the app");
            app.restart();
        }
        Err(e) => {
            error!(target: LOG_TARGET, "Error loading internal wallet: {:?}", e);
            e.to_string();
        }
    }

    if timer.elapsed() > MAX_ACCEPTABLE_COMMAND_TIME {
        warn!(target: LOG_TARGET, "import_seed_words took too long: {:?}", timer.elapsed());
    }
    Ok(())
}

#[tauri::command]
pub fn log_web_message(level: String, message: Vec<String>) {
    let joined_message = message.join(" ");
    match level.as_str() {
        "error" => {
            error!(target: LOG_TARGET_WEB, "{}", joined_message)
        }
        _ => info!(target: LOG_TARGET_WEB, "{}", joined_message),
    }
}

#[tauri::command]
pub fn open_log_dir(app: tauri::AppHandle) {
    let log_dir = app.path().app_log_dir().expect("Could not get log dir");
    if let Err(e) = open::that(log_dir) {
        error!(target: LOG_TARGET, "Could not open log dir: {:?}", e);
    }
}

#[tauri::command]
pub async fn reset_settings<'r>(
    reset_wallet: bool,
    _window: tauri::Window,
    app: tauri::AppHandle,
) -> Result<(), String> {
    stop_all_processes(app.clone(), true).await?;
    let network = Network::get_current_or_user_setting_or_default().as_key_str();

    let app_config_dir = app.path().app_config_dir();
    let app_cache_dir = app.path().app_cache_dir();
    let app_data_dir = app.path().app_data_dir();
    let app_local_data_dir = app.path().app_local_data_dir();

    let dirs_to_remove = [
        app_config_dir,
        app_cache_dir,
        app_data_dir,
        app_local_data_dir,
    ];
    let valid_dir_paths: Vec<String> = dirs_to_remove
        .iter()
        .filter_map(|dir| {
            if let Ok(path) = dir {
                path.to_str().map(|s| s.to_string())
            } else {
                None
            }
        })
        .collect();

    if valid_dir_paths.is_empty() {
        error!(target: LOG_TARGET, "Could not get app directories for {:?}", valid_dir_paths);
        return Err("Could not get app directories".to_string());
    }
    let mut folder_block_list = Vec::new();
    folder_block_list.push("EBWebView");

    let mut files_block_list = Vec::new();

    if !reset_wallet {
        folder_block_list.push("wallet");
        files_block_list.push("credentials_backup.bin");
    }

    for dir_path in dirs_to_remove.iter().flatten() {
        if dir_path.exists() {
            for entry in read_dir(dir_path).map_err(|e| e.to_string())? {
                let entry = entry.map_err(|e| e.to_string())?;
                let path = entry.path();
                if path.is_dir() {
                    if let Some(file_name) = path.file_name().and_then(|name| name.to_str()) {
                        if folder_block_list.contains(&file_name) {
                            debug!(target: LOG_TARGET, "[reset_settings] Skipping {:?} directory", path);
                            continue;
                        }
                    }

                    let contains_wallet_config =
                        read_dir(&path)
                            .map_err(|e| e.to_string())?
                            .any(|inner_entry| {
                                inner_entry
                                    .map(|e| e.file_name() == "wallet_config.json")
                                    .unwrap_or(false)
                            });

                    let is_network_dir = path
                        .file_name()
                        .and_then(|name| name.to_str())
                        .map(|name| name == network)
                        .unwrap_or(false);

                    if !reset_wallet && contains_wallet_config {
                        debug!(target: LOG_TARGET, "[reset_settings] Skipping {:?} directory because it contains wallet_config.json and reset_wallet is false", path);
                        continue;
                    }
                    if reset_wallet && contains_wallet_config && !is_network_dir {
                        debug!(target: LOG_TARGET, "[reset_settings] Skipping {:?} directory because it contains wallet_config.json and does not matches network name", path);
                        continue;
                    }

                    debug!(target: LOG_TARGET, "[reset_settings] Removing {:?} directory", path);
                    remove_dir_all(path.clone()).map_err(|e| {
                        error!(target: LOG_TARGET, "[reset_settings] Could not remove {:?} directory: {:?}", path, e);
                        format!("Could not remove directory: {}", e)
                    })?;
                } else {
                    if let Some(file_name) = path.file_name().and_then(|name| name.to_str()) {
                        if files_block_list.contains(&file_name) {
                            debug!(target: LOG_TARGET, "[reset_settings] Skipping {:?} file", path);
                            continue;
                        }
                    }

                    debug!(target: LOG_TARGET, "[reset_settings] Removing {:?} file", path);
                    remove_file(path.clone()).map_err(|e| {
                        error!(target: LOG_TARGET, "[reset_settings] Could not remove {:?} file: {:?}", path, e);
                        format!("Could not remove file: {}", e)
                    })?;
                }
            }
        }
    }

    if reset_wallet {
        debug!(target: LOG_TARGET, "[reset_settings] Removing keychain items");
        if let Ok(entry) = Entry::new(APPLICATION_FOLDER_ID, "inner_wallet_credentials") {
            let _unused = entry.delete_credential();
        }
    }

    info!(target: LOG_TARGET, "[reset_settings] Restarting the app");
    app.restart();

    Ok(())
}

#[tauri::command]
pub async fn resolve_application_language(
    state: tauri::State<'_, UniverseAppState>,
) -> Result<String, String> {
    let mut config = state.config.write().await;
    let _unused = config.propose_system_language().await;

    Ok(config.application_language().to_string())
}

#[tauri::command]
pub async fn restart_application(
    should_stop_miners: bool,
    _window: tauri::Window,
    app: tauri::AppHandle,
) -> Result<(), String> {
    if should_stop_miners {
        stop_all_processes(app.clone(), true).await?;
    }

    app.restart();
}

#[tauri::command]
pub async fn send_feedback(
    feedback: String,
    include_logs: bool,
    _window: tauri::Window,
    state: tauri::State<'_, UniverseAppState>,
    app: tauri::AppHandle,
) -> Result<String, String> {
    let timer = Instant::now();
    let app_log_dir = Some(app.path().app_log_dir().expect("Could not get log dir."));

    let reference = state
        .feedback
        .read()
        .await
        .send_feedback(feedback, include_logs, app_log_dir.clone())
        .await
        .inspect_err(|e| error!("error at send_feedback {:?}", e))
        .map_err(|e| e.to_string())?;
    if timer.elapsed() > Duration::from_secs(60) {
        warn!(target: LOG_TARGET, "send_feedback took too long: {:?}", timer.elapsed());
    }
    Ok(reference)
}

#[tauri::command]
pub async fn set_allow_telemetry(
    allow_telemetry: bool,
    _window: tauri::Window,
    state: tauri::State<'_, UniverseAppState>,
    _app: tauri::AppHandle,
) -> Result<(), String> {
    state
        .config
        .write()
        .await
        .set_allow_telemetry(allow_telemetry)
        .await
        .inspect_err(|e| error!(target: LOG_TARGET, "error at set_allow_telemetry {:?}", e))
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub async fn send_data_telemetry_service(
    state: tauri::State<'_, UniverseAppState>,
    event_name: String,
    data: Value,
) -> Result<(), String> {
    state
        .telemetry_service
        .read()
        .await
        .send(event_name, data)
        .await
        .inspect_err(|e| error!(target: LOG_TARGET, "error at send_data_telemetry_service {:?}", e))
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub async fn set_application_language(
    state: tauri::State<'_, UniverseAppState>,
    application_language: String,
) -> Result<(), String> {
    state
        .config
        .write()
        .await
        .set_application_language(application_language.clone())
        .await
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub async fn set_auto_update(
    auto_update: bool,
    state: tauri::State<'_, UniverseAppState>,
) -> Result<(), String> {
    let timer = Instant::now();
    state
        .config
        .write()
        .await
        .set_auto_update(auto_update)
        .await
        .inspect_err(|e| error!(target: LOG_TARGET, "error at set_auto_update {:?}", e))
        .map_err(|e| e.to_string())?;

    if timer.elapsed() > MAX_ACCEPTABLE_COMMAND_TIME {
        warn!(target: LOG_TARGET, "set_auto_update took too long: {:?}", timer.elapsed());
    }

    Ok(())
}

#[tauri::command]
pub async fn set_cpu_mining_enabled<'r>(
    enabled: bool,
    state: tauri::State<'_, UniverseAppState>,
) -> Result<(), String> {
    let timer = Instant::now();
    let mut config = state.config.write().await;
    config
        .set_cpu_mining_enabled(enabled)
        .await
        .inspect_err(|e| error!("error at set_cpu_mining_enabled {:?}", e))
        .map_err(|e| e.to_string())?;
    if timer.elapsed() > MAX_ACCEPTABLE_COMMAND_TIME {
        warn!(target: LOG_TARGET,
            "set_cpu_mining_enabled took too long: {:?}",
            timer.elapsed()
        );
    }
    Ok(())
}

#[tauri::command]
pub async fn sign_ws_data(data: String) -> Result<SignWsDataResponse, String> {
    let key: ring::signature::Ed25519KeyPair = get_websocket_key().map_err(|e| {
        warn!(target: LOG_TARGET,
            "error ws key handling:{:?}",
            e.to_string()
        );
        "sign_ws_data: error ws key handling"
    })?;
    let pub_key = get_der_encode_pub_key(&key).map_err(|e| {
        warn!(target: LOG_TARGET,
            "error ws pub key handling:{:?}",
            e.to_string()
        );
        "sign_ws_data: error ws pub key handling"
    })?;

    let signature = key.sign(data.as_bytes());

    Ok(SignWsDataResponse {
        signature: BASE64_STANDARD.encode(signature.as_ref()),
        pub_key,
    })
}

#[tauri::command]
pub async fn set_display_mode(
    display_mode: String,
    state: tauri::State<'_, UniverseAppState>,
) -> Result<(), String> {
    let timer = Instant::now();
    state
        .config
        .write()
        .await
        .set_display_mode(display_mode)
        .await
        .inspect_err(|e| error!(target: LOG_TARGET, "error at set_display_mode {:?}", e))
        .map_err(|e| e.to_string())?;
    if timer.elapsed() > MAX_ACCEPTABLE_COMMAND_TIME {
        warn!(target: LOG_TARGET, "set_display_mode took too long: {:?}", timer.elapsed());
    }

    Ok(())
}

#[tauri::command]
pub async fn set_excluded_gpu_devices(
    excluded_gpu_devices: Vec<u8>,
    state: tauri::State<'_, UniverseAppState>,
) -> Result<(), String> {
    let mut gpu_miner = state.gpu_miner.write().await;
    gpu_miner
        .set_excluded_device(excluded_gpu_devices)
        .await
        .inspect_err(|e| error!("error at set_excluded_gpu_devices {:?}", e))
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub async fn set_gpu_mining_enabled(
    enabled: bool,
    state: tauri::State<'_, UniverseAppState>,
) -> Result<(), String> {
    let timer = Instant::now();
    let mut config = state.config.write().await;
    config
        .set_gpu_mining_enabled(enabled)
        .await
        .inspect_err(|e| error!("error at set_gpu_mining_enabled {:?}", e))
        .map_err(|e| e.to_string())?;
    if timer.elapsed() > MAX_ACCEPTABLE_COMMAND_TIME {
        warn!(target: LOG_TARGET,
            "set_gpu_mining_enabled took too long: {:?}",
            timer.elapsed()
        );
    }

    Ok(())
}

#[tauri::command]
pub async fn set_mine_on_app_start(
    mine_on_app_start: bool,
    state: tauri::State<'_, UniverseAppState>,
) -> Result<(), String> {
    let timer = Instant::now();

    state
        .config
        .write()
        .await
        .set_mine_on_app_start(mine_on_app_start)
        .await
        .inspect_err(|e| error!("error at set_mine_on_app_start {:?}", e))
        .map_err(|e| e.to_string())?;

    if timer.elapsed() > MAX_ACCEPTABLE_COMMAND_TIME {
        warn!(target: LOG_TARGET, "set_mine_on_app_start took too long: {:?}", timer.elapsed());
    }

    Ok(())
}

#[tauri::command]
pub async fn set_mode(
    mode: String,
    custom_cpu_usage: Option<u32>,
    custom_gpu_usage: Vec<GpuThreads>,
    state: tauri::State<'_, UniverseAppState>,
) -> Result<(), String> {
    let timer = Instant::now();
    info!(target: LOG_TARGET, "set_mode called with mode: {:?}, custom_max_cpu_usage: {:?}, custom_max_gpu_usage: {:?}", mode, custom_cpu_usage, custom_gpu_usage);

    state
        .config
        .write()
        .await
        .set_mode(mode, custom_cpu_usage, custom_gpu_usage)
        .await
        .inspect_err(|e| error!(target: LOG_TARGET, "error at set_mode {:?}", e))
        .map_err(|e| e.to_string())?;
    if timer.elapsed() > MAX_ACCEPTABLE_COMMAND_TIME {
        warn!(target: LOG_TARGET, "set_mode took too long: {:?}", timer.elapsed());
    }

    Ok(())
}

#[tauri::command]
pub async fn set_monero_address(
    monero_address: String,
    state: tauri::State<'_, UniverseAppState>,
) -> Result<(), String> {
    let timer = Instant::now();
    let mut app_config = state.config.write().await;
    app_config
        .set_monero_address(monero_address)
        .await
        .map_err(|e| e.to_string())?;
    if timer.elapsed() > MAX_ACCEPTABLE_COMMAND_TIME {
        warn!(target: LOG_TARGET, "set_monero_address took too long: {:?}", timer.elapsed());
    }
    Ok(())
}

#[tauri::command]
pub async fn set_monerod_config(
    use_monero_fail: bool,
    monero_nodes: Vec<String>,
    state: tauri::State<'_, UniverseAppState>,
) -> Result<(), String> {
    let timer = Instant::now();
    state
        .config
        .write()
        .await
        .set_monerod_config(use_monero_fail, monero_nodes)
        .await
        .inspect_err(|e| error!(target: LOG_TARGET, "error at set_monerod_config {:?}", e))
        .map_err(|e| e.to_string())?;
    if timer.elapsed() > MAX_ACCEPTABLE_COMMAND_TIME {
        warn!(target: LOG_TARGET, "set_monerod_config took too long: {:?}", timer.elapsed());
    }

    Ok(())
}

#[tauri::command]
pub async fn set_p2pool_enabled(
    p2pool_enabled: bool,
    state: tauri::State<'_, UniverseAppState>,
) -> Result<(), String> {
    let timer = Instant::now();
    state
        .config
        .write()
        .await
        .set_p2pool_enabled(p2pool_enabled)
        .await
        .inspect_err(|e| error!("error at set_p2pool_enabled {:?}", e))
        .map_err(|e| e.to_string())?;

    let origin_config = state.mm_proxy_manager.config().await;
    let p2pool_grpc_port = state.p2pool_manager.grpc_port().await;

    match origin_config {
        None => {
            warn!(target: LOG_TARGET, "Tried to set p2pool_enabled but mmproxy has not been initialized yet");
            return Ok(());
        }
        Some(mut origin_config) => {
            if origin_config.p2pool_enabled != p2pool_enabled {
                if p2pool_enabled {
                    origin_config.set_to_use_p2pool(p2pool_grpc_port);
                } else {
                    let base_node_grpc_port = state
                        .node_manager
                        .get_grpc_port()
                        .await
                        .map_err(|error| error.to_string())?;
                    origin_config.set_to_use_base_node(base_node_grpc_port);
                }
                state
                    .mm_proxy_manager
                    .change_config(origin_config)
                    .await
                    .map_err(|error| error.to_string())?;
            }
        }
    }

    if timer.elapsed() > MAX_ACCEPTABLE_COMMAND_TIME {
        warn!(target: LOG_TARGET, "set_p2pool_enabled took too long: {:?}", timer.elapsed());
    }
    Ok(())
}

#[tauri::command]
pub async fn set_show_experimental_settings(
    show_experimental_settings: bool,
    state: tauri::State<'_, UniverseAppState>,
) -> Result<(), String> {
    state
        .config
        .write()
        .await
        .set_show_experimental_settings(show_experimental_settings)
        .await
        .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn set_should_always_use_system_language(
    should_always_use_system_language: bool,
    state: tauri::State<'_, UniverseAppState>,
) -> Result<(), String> {
    state
        .config
        .write()
        .await
        .set_should_always_use_system_language(should_always_use_system_language)
        .await
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub async fn set_should_auto_launch(
    should_auto_launch: bool,
    state: tauri::State<'_, UniverseAppState>,
) -> Result<(), String> {
    match state
        .config
        .write()
        .await
        .set_should_auto_launch(should_auto_launch)
        .await
    {
        Ok(_) => {
            AutoLauncher::current()
                .update_auto_launcher(should_auto_launch)
                .await
                .map_err(|e| {
                    error!(target: LOG_TARGET, "Error setting should_auto_launch: {:?}", e);
                    e.to_string()
                })?;
        }
        Err(e) => {
            error!(target: LOG_TARGET, "Error setting should_auto_launch: {:?}", e);
            return Err(e.to_string());
        }
    }

    Ok(())
}

#[tauri::command]
pub async fn set_tor_config(
    config: TorConfig,
    _window: tauri::Window,
    state: tauri::State<'_, UniverseAppState>,
    _app: tauri::AppHandle,
) -> Result<TorConfig, String> {
    let timer = Instant::now();
    let tor_config = state
        .tor_manager
        .set_tor_config(config)
        .await
        .map_err(|e| e.to_string())?;

    if timer.elapsed() > MAX_ACCEPTABLE_COMMAND_TIME {
        warn!(target: LOG_TARGET, "set_tor_config took too long: {:?}", timer.elapsed());
    }
    Ok(tor_config)
}

#[tauri::command]
pub async fn set_use_tor(
    use_tor: bool,
    state: tauri::State<'_, UniverseAppState>,
    app: tauri::AppHandle,
) -> Result<(), String> {
    let timer = Instant::now();
    state
        .config
        .write()
        .await
        .set_use_tor(use_tor)
        .await
        .inspect_err(|e| error!(target: LOG_TARGET, "error at set_use_tor {:?}", e))
        .map_err(|e| e.to_string())?;

    let config_dir = app
        .path()
        .app_config_dir()
        .expect("Could not get config dir");

    if config_dir.exists() {
        let tcp_tor_toggled_file = config_dir.join("tcp_tor_toggled");
        File::create(tcp_tor_toggled_file).map_err(|e| e.to_string())?;
    }

    if timer.elapsed() > MAX_ACCEPTABLE_COMMAND_TIME {
        warn!(target: LOG_TARGET, "set_use_tor took too long: {:?}", timer.elapsed());
    }

    Ok(())
}

#[tauri::command]
pub async fn set_visual_mode<'r>(
    enabled: bool,
    state: tauri::State<'_, UniverseAppState>,
) -> Result<(), String> {
    let timer = Instant::now();
    let mut config = state.config.write().await;
    config
        .set_visual_mode(enabled)
        .await
        .inspect_err(|e| error!("error at set_visual_mode {:?}", e))
        .map_err(|e| e.to_string())?;
    if timer.elapsed() > MAX_ACCEPTABLE_COMMAND_TIME {
        warn!(target: LOG_TARGET,
            "set_visual_mode took too long: {:?}",
            timer.elapsed()
        );
    }
    Ok(())
}

#[allow(clippy::too_many_lines)]
#[tauri::command]
pub async fn set_airdrop_tokens<'r>(
    airdrop_tokens: Option<AirdropTokens>,
    state: tauri::State<'_, UniverseAppState>,
    app: tauri::AppHandle,
) -> Result<(), String> {
    let old_tokens = state.config.clone().read().await.airdrop_tokens();
    let old_id = old_tokens.clone().and_then(|tokens| {
        airdrop::decode_jwt_claims_without_exp(&tokens.token).map(|claim| claim.id)
    });
    let new_id = airdrop_tokens.clone().and_then(|tokens| {
        airdrop::decode_jwt_claims_without_exp(&tokens.token).map(|claim| claim.id)
    });

    let user_id_changed = old_id != new_id;

    let mut app_config_lock = state.config.write().await;
    app_config_lock
        .set_airdrop_tokens(airdrop_tokens)
        .await
        .map_err(|e| e.to_string())?;
    drop(app_config_lock);

    info!(target: LOG_TARGET, "New Airdrop tokens saved, user id changed:{:?}", user_id_changed);
    if user_id_changed {
        let currently_mining = {
            let cpu_mining_status = state.cpu_miner_status_watch_rx.borrow().clone();
            let gpu_mining_status = state.gpu_latest_status.borrow().clone();
            cpu_mining_status.is_mining || gpu_mining_status.is_mining
        };

        if currently_mining {
            stop_mining(state.clone())
                .await
                .map_err(|e| e.to_string())?;

            airdrop::restart_mm_proxy_with_new_telemetry_id(state.clone()).await?;

            start_mining(state.clone(), app.clone())
                .await
                .map_err(|e| e.to_string())?;
        } else {
            airdrop::restart_mm_proxy_with_new_telemetry_id(state.clone()).await?;
        }
    }
    Ok(())
}

#[allow(clippy::too_many_lines)]
#[tauri::command]
pub async fn start_mining<'r>(
    state: tauri::State<'_, UniverseAppState>,
    app: tauri::AppHandle,
) -> Result<(), String> {
    let timer = Instant::now();
    let _lock = state.stop_start_mutex.lock().await;

    let config = state.config.read().await;
    let cpu_mining_enabled = config.cpu_mining_enabled();
    let gpu_mining_enabled = config.gpu_mining_enabled();
    let mode = config.mode();
    let custom_cpu_usage = config.custom_cpu_usage();
    let custom_gpu_usage = config.custom_gpu_usage();
    let p2pool_enabled = config.p2pool_enabled();
    let monero_address = config.monero_address().to_string();
    drop(config);

    let mut telemetry_id = state
        .telemetry_manager
        .read()
        .await
        .get_unique_string()
        .await;

    let cpu_miner = state.cpu_miner.read().await;
    let cpu_miner_running = cpu_miner.is_running().await;
    drop(cpu_miner);

    if cpu_mining_enabled && !cpu_miner_running {
        let mm_proxy_port = state
            .mm_proxy_manager
            .get_monero_port()
            .await
            .map_err(|e| e.to_string())?;

        {
            let cpu_miner_config = state.cpu_miner_config.read().await;
            let mut cpu_miner = state.cpu_miner.write().await;
            let res = cpu_miner
                .start(
                    state.shutdown.to_signal(),
                    &cpu_miner_config,
                    monero_address.to_string(),
                    mm_proxy_port,
                    app.path()
                        .app_local_data_dir()
                        .expect("Could not get data dir"),
                    app.path()
                        .app_config_dir()
                        .expect("Could not get config dir"),
                    app.path().app_log_dir().expect("Could not get log dir"),
                    mode,
                    custom_cpu_usage,
                )
                .await;
            drop(cpu_miner_config);

            if let Err(e) = res {
                let err_msg = format!("Could not start CPU mining: {}", e);
                error!(target: LOG_TARGET, "{}", err_msg);
                sentry::capture_message(&err_msg, sentry::Level::Error);
                cpu_miner
                    .stop()
                    .await
                    .inspect_err(|e| {
                        let stop_err = format!("Error stopping CPU miner: {}", e);
                        error!(target: LOG_TARGET, "{}", stop_err);
                    })
                    .ok();
                return Err(e.to_string());
            }
        }
    }

    let gpu_miner = state.gpu_miner.read().await;
    let gpu_miner_running = gpu_miner.is_running().await;
    let gpu_available = gpu_miner.is_gpu_mining_available();
    drop(gpu_miner);

    info!(target: LOG_TARGET, "GPU availability {:?} gpu_mining_enabled {}", gpu_available.clone(), gpu_mining_enabled);

    if gpu_mining_enabled && gpu_available && !gpu_miner_running {
        info!(target: LOG_TARGET, "1. Starting gpu miner");

        let source = if p2pool_enabled {
            let p2pool_port = state.p2pool_manager.grpc_port().await;
            GpuNodeSource::P2Pool { port: p2pool_port }
        } else {
            let grpc_port = state
                .node_manager
                .get_grpc_port()
                .await
                .map_err(|e| e.to_string())?;

            GpuNodeSource::BaseNode { port: grpc_port }
        };

        info!(target: LOG_TARGET, "2 Starting gpu miner");

        if telemetry_id.is_empty() {
            telemetry_id = "tari-universe".to_string();
        }

        info!(target: LOG_TARGET, "3. Starting gpu miner");

        let cpu_miner_config = state.cpu_miner_config.read().await;
        let tari_address = cpu_miner_config.tari_address.clone();
        drop(cpu_miner_config);

        let mut gpu_miner = state.gpu_miner.write().await;
        let res = gpu_miner
            .start(
                state.shutdown.to_signal(),
                tari_address,
                source,
                app.path()
                    .app_local_data_dir()
                    .expect("Could not get data dir"),
                app.path()
                    .app_config_dir()
                    .expect("Could not get config dir"),
                app.path().app_log_dir().expect("Could not get log dir"),
                mode,
                telemetry_id,
                custom_gpu_usage,
            )
            .await;

        info!(target: LOG_TARGET, "4. Starting gpu miner");
        if let Err(e) = res {
            let err_msg = format!("Could not start GPU mining: {}", e);
            error!(target: LOG_TARGET, "{}", err_msg);
            sentry::capture_message(&err_msg, sentry::Level::Error);

            if let Err(stop_err) = gpu_miner.stop().await {
                error!(target: LOG_TARGET, "Could not stop GPU miner: {}", stop_err);
            }

            return Err(e.to_string());
        }
    }
    if timer.elapsed() > MAX_ACCEPTABLE_COMMAND_TIME {
        warn!(target: LOG_TARGET, "start_mining took too long: {:?}", timer.elapsed());
    }
    Ok(())
}

#[tauri::command]
pub async fn stop_mining<'r>(state: tauri::State<'_, UniverseAppState>) -> Result<(), String> {
    let _lock = state.stop_start_mutex.lock().await;
    let timer = Instant::now();
    state
        .cpu_miner
        .write()
        .await
        .stop()
        .await
        .map_err(|e| e.to_string())?;
    info!(target:LOG_TARGET, "cpu miner stopped");

    state
        .gpu_miner
        .write()
        .await
        .stop()
        .await
        .map_err(|e| e.to_string())?;
    info!(target:LOG_TARGET, "gpu miner stopped");

    if timer.elapsed() > MAX_ACCEPTABLE_COMMAND_TIME {
        warn!(target: LOG_TARGET, "stop_mining took too long: {:?}", timer.elapsed());
    }
    Ok(())
}

#[tauri::command]
pub async fn update_applications(
    app: tauri::AppHandle,
    state: tauri::State<'_, UniverseAppState>,
) -> Result<(), String> {
    let timer = Instant::now();
    let mut binary_resolver = BinaryResolver::current().write().await;

    state
        .config
        .write()
        .await
        .set_last_binaries_update_timestamp(SystemTime::now())
        .await
        .inspect_err(
            |e| error!(target: LOG_TARGET, "Could not set last binaries update timestamp: {:?}", e),
        )
        .map_err(|e| e.to_string())?;

    let progress_tracker = ProgressTracker::new(app.clone(), None);
    binary_resolver
        .update_binary(Binaries::Xmrig, progress_tracker.clone())
        .await
        .map_err(|e| e.to_string())?;
    sleep(Duration::from_secs(1));
    binary_resolver
        .update_binary(Binaries::MinotariNode, progress_tracker.clone())
        .await
        .map_err(|e| e.to_string())?;
    sleep(Duration::from_secs(1));
    binary_resolver
        .update_binary(Binaries::MergeMiningProxy, progress_tracker.clone())
        .await
        .map_err(|e| e.to_string())?;
    sleep(Duration::from_secs(1));
    binary_resolver
        .update_binary(Binaries::Wallet, progress_tracker.clone())
        .await
        .map_err(|e| e.to_string())?;
    binary_resolver
        .update_binary(Binaries::ShaP2pool, progress_tracker.clone())
        .await
        .map_err(|e| e.to_string())?;
    sleep(Duration::from_secs(1));

    if timer.elapsed() > MAX_ACCEPTABLE_COMMAND_TIME {
        warn!(target: LOG_TARGET, "update_applications took too long: {:?}", timer.elapsed());
    }

    drop(binary_resolver);

    Ok(())
}

#[tauri::command]
pub async fn set_pre_release(
    app: tauri::AppHandle,
    pre_release: bool,
    state: tauri::State<'_, UniverseAppState>,
) -> Result<(), String> {
    let timer = Instant::now();
    state
        .config
        .write()
        .await
        .set_pre_release(pre_release)
        .await
        .map_err(|e| e.to_string())?;

    info!(target: LOG_TARGET, "Pre-release set to {}, try_update called", pre_release);

    state
        .updates_manager
        .try_update(app.clone(), true, !pre_release)
        .await
        .map_err(|e| e.to_string())?;

    if timer.elapsed() > MAX_ACCEPTABLE_COMMAND_TIME {
        warn!(target: LOG_TARGET, "set_pre_release took too long: {:?}", timer.elapsed());
    }

    Ok(())
}

#[tauri::command]
pub async fn check_for_updates(
    app: tauri::AppHandle,
    state: tauri::State<'_, UniverseAppState>,
) -> Result<Option<String>, String> {
    let timer = Instant::now();

    let update = state
        .updates_manager
        .check_for_update(app.clone(), false)
        .await
        .map_err(|e| e.to_string())?;

    if timer.elapsed() > MAX_ACCEPTABLE_COMMAND_TIME {
        warn!(target: LOG_TARGET, "check_for_updates took too long: {:?}", timer.elapsed());
    }

    Ok(update.map(|u| u.version))
}

#[tauri::command]
pub async fn try_update(
    force: Option<bool>,
    app: tauri::AppHandle,
    state: tauri::State<'_, UniverseAppState>,
) -> Result<(), String> {
    let timer = Instant::now();

    state
        .updates_manager
        .try_update(app.clone(), force.unwrap_or(false), false)
        .await
        .map_err(|e| e.to_string())?;

    if timer.elapsed() > MAX_ACCEPTABLE_COMMAND_TIME {
        warn!(target: LOG_TARGET, "check_for_updates took too long: {:?}", timer.elapsed());
    }

    Ok(())
}

#[tauri::command]
pub async fn proceed_with_update(
    app: tauri::AppHandle,
    state: tauri::State<'_, UniverseAppState>,
) -> Result<(), String> {
    let timer = Instant::now();
    state
        .updates_manager
        .proceed_with_update(app.clone())
        .await
        .map_err(|e| e.to_string())?;
    if timer.elapsed() > MAX_ACCEPTABLE_COMMAND_TIME {
        warn!(target: LOG_TARGET, "proceed_with_update took too long: {:?}", timer.elapsed());
    }
    Ok(())
}
