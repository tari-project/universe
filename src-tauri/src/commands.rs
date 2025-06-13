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

use crate::app_in_memory_config::{
    get_der_encode_pub_key, get_websocket_key, AirdropInMemoryConfig, ExchangeMiner,
    DEFAULT_EXCHANGE_ID,
};
use crate::auto_launcher::AutoLauncher;
use crate::binaries::{Binaries, BinaryResolver};
use crate::configs::config_core::{AirdropTokens, ConfigCore, ConfigCoreContent};
use crate::configs::config_mining::{ConfigMining, ConfigMiningContent, GpuThreads, MiningMode};
use crate::configs::config_ui::{ConfigUI, ConfigUIContent, DisplayMode};
use crate::configs::config_wallet::{ConfigWallet, ConfigWalletContent};
use crate::configs::trait_config::ConfigImpl;
use crate::credential_manager::{CredentialError, CredentialManager};
use crate::events::ConnectionStatusPayload;
use crate::events_emitter::EventsEmitter;
use crate::events_manager::EventsManager;
use crate::external_dependencies::{
    ExternalDependencies, ExternalDependency, RequiredExternalDependency,
};
use crate::gpu_miner::EngineType;
use crate::gpu_miner_adapter::{GpuMinerStatus, GpuNodeSource};
use crate::gpu_status_file::GpuStatus;
use crate::internal_wallet::{InternalWallet, PaperWalletConfig};
use crate::node::node_manager::NodeType;
use crate::p2pool::models::{Connections, P2poolStats};
use crate::progress_tracker_old::ProgressTracker;
use crate::setup::setup_manager::{SetupManager, SetupPhase};
use crate::tapplets::interface::ActiveTapplet;
use crate::tapplets::tapplet_server::start_tapplet;
use crate::tapplets::{TappletResolver, Tapplets};
use crate::tasks_tracker::TasksTrackers;
use crate::tor_adapter::TorConfig;
use crate::utils::address_utils::verify_send;
use crate::utils::app_flow_utils::FrontendReadyChannel;
use crate::wallet_adapter::{TariAddressVariants, TransactionInfo, WalletBalance};
use crate::wallet_manager::WalletManagerError;
use crate::websocket_manager::WebsocketManagerStatusMessage;
use crate::{airdrop, PoolStatus, UniverseAppState, APPLICATION_FOLDER_ID};

use base64::prelude::*;
use keyring::Entry;
use log::{debug, error, info, warn};
use monero_address_creator::Seed as MoneroSeed;
use regex::Regex;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::fmt::Debug;
use std::fs::{read_dir, remove_dir_all, remove_file, File};
use std::str::FromStr;
use std::sync::atomic::Ordering;
use std::thread::{available_parallelism, sleep};
use std::time::{Duration, Instant, SystemTime};
use tari_common::configuration::Network;
use tari_common_types::tari_address::{TariAddress, TariAddressFeatures};
use tari_core::transactions::tari_amount::{MicroMinotari, Minotari};
use tauri::ipc::InvokeError;
use tauri::{Manager, PhysicalPosition, PhysicalSize};
use tauri_plugin_sentry::sentry;

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
    Pool,
    #[allow(dead_code)]
    MergeMinedPool,
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
    bridge: String,
}

#[derive(Debug, Serialize, Clone)]
pub struct GpuMinerMetrics {
    hardware: Vec<GpuStatus>,
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
    pub pool_status: Option<PoolStatus>,
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
            pool_status: None,
        }
    }
}
#[derive(Debug, Serialize, Clone, Default)]
pub struct CpuMinerConnectionStatus {
    pub is_connected: bool,
    // pub error: Option<String>,
}

#[derive(Deserialize, Serialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct SignWsDataResponse {
    pub signature: String,
    pub pub_key: String,
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
pub async fn select_exchange_miner(
    app_handle: tauri::AppHandle,
    exchange_miner: ExchangeMiner,
    mining_address: String,
) -> Result<(), InvokeError> {
    ConfigCore::update_field(
        ConfigCoreContent::set_exchange_id,
        exchange_miner.clone().id,
    )
    .await
    .map_err(InvokeError::from_anyhow)?;
    let new_external_tari_address = TariAddress::from_str(&mining_address)
        .map_err(|e| format!("Invalid Tari address: {}", e))?;
    ConfigWallet::update_field(
        ConfigWalletContent::set_external_tari_address,
        Some(new_external_tari_address.clone()),
    )
    .await
    .map_err(InvokeError::from_anyhow)?;

    ConfigCore::update_field(
        ConfigCoreContent::set_exchange_id,
        exchange_miner.id.clone(),
    )
    .await
    .map_err(InvokeError::from_anyhow)?;

    EventsEmitter::emit_external_tari_address_changed(Some(new_external_tari_address)).await;
    EventsEmitter::emit_exchange_id_changed(exchange_miner.id.clone()).await;

    SetupManager::get_instance()
        .restart_phases(app_handle, vec![SetupPhase::Wallet, SetupPhase::Mining])
        .await;

    Ok(())
}

#[tauri::command]
pub async fn frontend_ready(app: tauri::AppHandle) {
    static FRONTEND_READY_CALLED: std::sync::atomic::AtomicBool =
        std::sync::atomic::AtomicBool::new(false);
    if FRONTEND_READY_CALLED.load(Ordering::SeqCst) {
        return;
    }
    FRONTEND_READY_CALLED.store(true, Ordering::SeqCst);

    EventsEmitter::load_app_handle(app.clone()).await;
    FrontendReadyChannel::current().set_ready();
    TasksTrackers::current()
        .common
        .get_task_tracker()
        .await
        .spawn(async move {
            // Give the splash screen a few seconds to show before closing it
            sleep(Duration::from_secs(3));
            EventsEmitter::emit_close_splashscreen().await;
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
    TasksTrackers::current().stop_all_processes().await;

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
    let tapplet_resolver = TappletResolver::current().read().await;

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
    let bridge_version = tapplet_resolver
        .get_tapplet_version_string(Tapplets::Bridge)
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
        bridge: bridge_version,
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
pub async fn get_monero_seed_words(app: tauri::AppHandle) -> Result<Vec<String>, String> {
    let timer = Instant::now();

    if !*ConfigWallet::content().await.monero_address_is_generated() {
        return Err(
            "Monero seed words are not available when a Monero address is provided".to_string(),
        );
    }

    let config_path = app
        .path()
        .app_config_dir()
        .expect("Could not get config dir");

    let cm = CredentialManager::default_with_dir(config_path);
    let cred = match cm.get_credentials().await {
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
    app_handle: tauri::AppHandle,
) -> Result<(), InvokeError> {
    if let Some(port) = port {
        if port.le(&1024) || port.gt(&65535) {
            return Err(InvokeError::from("Port must be between 1024 and 65535"));
        }
    };

    ConfigCore::update_field_requires_restart(
        ConfigCoreContent::set_p2pool_stats_server_port,
        port,
        vec![SetupPhase::Mining],
    )
    .await
    .map_err(InvokeError::from_anyhow)?;

    SetupManager::get_instance()
        .restart_phases_from_queue(app_handle)
        .await;
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
) -> Result<PaperWalletConfig, InvokeError> {
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

    let internal_wallet = InternalWallet::load_or_create(config_path)
        .await
        .map_err(|e| e.to_string())?;

    warn!(target: LOG_TARGET, "auth_uuid {:?}", auth_uuid);
    let anon_id = ConfigCore::content().await.anon_id().clone();
    let result = internal_wallet
        .get_paper_wallet_details(anon_id, balance, auth_uuid)
        .await
        .map_err(InvokeError::from_anyhow)?;

    if timer.elapsed() > MAX_ACCEPTABLE_COMMAND_TIME {
        warn!(target: LOG_TARGET, "get_paper_wallet_details took too long: {:?}", timer.elapsed());
    };

    Ok(result)
}

#[tauri::command]
pub async fn get_seed_words(app: tauri::AppHandle) -> Result<Vec<String>, String> {
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
        .await
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
pub async fn set_external_tari_address(
    address: String,
    app_handle: tauri::AppHandle,
) -> Result<(), InvokeError> {
    let timer = Instant::now();

    let new_external_tari_address =
        TariAddress::from_str(&address).map_err(|e| format!("Invalid Tari address: {}", e))?;

    ConfigWallet::update_field(
        ConfigWalletContent::set_external_tari_address,
        Some(new_external_tari_address.clone()),
    )
    .await
    .map_err(InvokeError::from_anyhow)?;

    EventsEmitter::emit_external_tari_address_changed(Some(new_external_tari_address)).await;

    // For non exchange miner cases to stop wallet services
    SetupManager::get_instance()
        .shutdown_phases(vec![SetupPhase::Wallet])
        .await;

    // mm_proxy is using wallet address
    SetupManager::get_instance()
        .restart_phases(app_handle.clone(), vec![SetupPhase::Mining])
        .await;

    if timer.elapsed() > MAX_ACCEPTABLE_COMMAND_TIME {
        warn!(target: LOG_TARGET, "set_tari_address took too long: {:?}", timer.elapsed());
    }
    Ok(())
}

#[tauri::command]
pub async fn confirm_exchange_address(address: String) -> Result<(), InvokeError> {
    let timer = Instant::now();
    let new_external_tari_address =
        TariAddress::from_str(&address).map_err(|e| format!("Invalid Tari address: {}", e))?;
    EventsEmitter::emit_external_tari_address_changed(Some(new_external_tari_address)).await;
    SetupManager::get_instance()
        .mark_exchange_modal_as_completed()
        .await
        .map_err(InvokeError::from_anyhow)?;
    if timer.elapsed() > MAX_ACCEPTABLE_COMMAND_TIME {
        warn!(target: LOG_TARGET, "set_exchange_address took too long: {:?}", timer.elapsed());
    }
    Ok(())
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
    _app: tauri::AppHandle,
) -> Result<Option<AirdropTokens>, String> {
    let timer = Instant::now();
    let airdrop_access_token = ConfigCore::content().await.airdrop_tokens().clone();
    if timer.elapsed() > MAX_ACCEPTABLE_COMMAND_TIME {
        warn!(target: LOG_TARGET, "get_airdrop_tokens took too long: {:?}", timer.elapsed());
    }
    Ok(airdrop_access_token)
}

#[tauri::command]
pub async fn get_transactions_history(
    state: tauri::State<'_, UniverseAppState>,
    offset: Option<i32>,
    limit: Option<i32>,
) -> Result<Vec<TransactionInfo>, String> {
    let timer = Instant::now();
    if state.is_getting_transactions_history.load(Ordering::SeqCst) {
        warn!(target: LOG_TARGET, "Already getting transfers history");
        return Err("Already getting transfers history".to_string());
    }
    state
        .is_getting_transactions_history
        .store(true, Ordering::SeqCst);
    let transactions = state
        .wallet_manager
        .get_transactions_history(offset, limit)
        .await
        .unwrap_or_else(|e| {
            if !matches!(e, WalletManagerError::WalletNotStarted) {
                warn!(target: LOG_TARGET, "Error getting transaction history: {}", e);
            }
            vec![]
        });

    if timer.elapsed() > MAX_ACCEPTABLE_COMMAND_TIME {
        warn!(target: LOG_TARGET, "get_transactions_history took too long: {:?}", timer.elapsed());
    }

    state
        .is_getting_transactions_history
        .store(false, Ordering::SeqCst);
    Ok(transactions)
}

#[tauri::command]
pub async fn get_coinbase_transactions(
    state: tauri::State<'_, UniverseAppState>,
    continuation: bool,
    limit: Option<u32>,
) -> Result<Vec<TransactionInfo>, String> {
    let timer = Instant::now();
    if state.is_getting_coinbase_history.load(Ordering::SeqCst) {
        warn!(target: LOG_TARGET, "Already getting coinbase history");
        return Err("Already getting coinbase history".to_string());
    }
    state
        .is_getting_coinbase_history
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
        .is_getting_coinbase_history
        .store(false, Ordering::SeqCst);
    Ok(transactions)
}

#[tauri::command]
pub async fn import_seed_words(
    seed_words: Vec<String>,
    _window: tauri::Window,
    app: tauri::AppHandle,
) -> Result<(), InvokeError> {
    let timer = Instant::now();
    let config_path = app
        .path()
        .app_config_dir()
        .expect("Could not get config dir");
    let data_dir = app
        .path()
        .app_local_data_dir()
        .expect("Could not get data dir");

    match InternalWallet::create_from_seed(config_path, seed_words).await {
        Ok(wallet) => {
            SetupManager::get_instance()
                .shutdown_phases(vec![SetupPhase::Wallet, SetupPhase::Mining])
                .await;
            InternalWallet::clear_wallet_local_data(data_dir)
                .await
                .map_err(|e| e.to_string())?;
            ConfigWallet::update_field(ConfigWalletContent::set_external_tari_address, None)
                .await
                .map_err(InvokeError::from_anyhow)?;
            EventsEmitter::emit_external_tari_address_changed(None).await;
            ConfigWallet::update_field(
                ConfigWalletContent::set_tari_address,
                Some(wallet.get_tari_address()),
            )
            .await
            .map_err(InvokeError::from_anyhow)?;
            EventsEmitter::emit_base_tari_address_changed(wallet.get_tari_address()).await;
            ConfigCore::update_field(
                ConfigCoreContent::set_exchange_id,
                DEFAULT_EXCHANGE_ID.to_string(),
            )
            .await
            .map_err(InvokeError::from_anyhow)?;
            EventsEmitter::emit_exchange_id_changed(DEFAULT_EXCHANGE_ID.to_string()).await;

            SetupManager::get_instance()
                .resume_phases(app, vec![SetupPhase::Wallet, SetupPhase::Mining])
                .await;
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
pub async fn reset_settings(
    reset_wallet: bool,
    _window: tauri::Window,
    app: tauri::AppHandle,
) -> Result<(), String> {
    TasksTrackers::current().stop_all_processes().await;
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
                        continue;
                    }
                    if reset_wallet && contains_wallet_config && !is_network_dir {
                        continue;
                    }

                    remove_dir_all(path.clone()).map_err(|e| {
                        error!(target: LOG_TARGET, "[reset_settings] Could not remove {:?} directory: {:?}", path, e);
                        format!("Could not remove directory: {}", e)
                    })?;
                } else {
                    if let Some(file_name) = path.file_name().and_then(|name| name.to_str()) {
                        if files_block_list.contains(&file_name) {
                            continue;
                        }
                    }

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
    app.restart()
}

#[tauri::command]
pub async fn restart_application(
    should_stop_miners: bool,
    _window: tauri::Window,
    app: tauri::AppHandle,
) -> Result<(), String> {
    if should_stop_miners {
        TasksTrackers::current().stop_all_processes().await;
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
pub async fn set_allow_telemetry(allow_telemetry: bool) -> Result<(), InvokeError> {
    ConfigCore::update_field(ConfigCoreContent::set_allow_telemetry, allow_telemetry)
        .await
        .map_err(InvokeError::from_anyhow)?;
    Ok(())
}

#[tauri::command]
pub async fn set_allow_notifications(allow_notifications: bool) -> Result<(), InvokeError> {
    ConfigCore::update_field(
        ConfigCoreContent::set_allow_notifications,
        allow_notifications,
    )
    .await
    .map_err(InvokeError::from_anyhow)?;
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
pub async fn set_application_language(application_language: String) -> Result<(), String> {
    ConfigUI::update_field(
        ConfigUIContent::set_application_language,
        application_language,
    )
    .await
    .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn set_auto_update(auto_update: bool) -> Result<(), InvokeError> {
    let timer = Instant::now();
    ConfigCore::update_field(ConfigCoreContent::set_auto_update, auto_update)
        .await
        .map_err(InvokeError::from_anyhow)?;

    if timer.elapsed() > MAX_ACCEPTABLE_COMMAND_TIME {
        warn!(target: LOG_TARGET, "set_auto_update took too long: {:?}", timer.elapsed());
    }

    Ok(())
}

#[tauri::command]
pub async fn set_cpu_mining_enabled(enabled: bool) -> Result<(), String> {
    let timer = Instant::now();
    let _unused =
        ConfigMining::update_field(ConfigMiningContent::set_cpu_mining_enabled, enabled).await;

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
pub async fn set_display_mode(display_mode: &str) -> Result<(), InvokeError> {
    let timer = Instant::now();

    if let Some(display_mode) = DisplayMode::from_str(display_mode) {
        ConfigUI::update_field(ConfigUIContent::set_display_mode, display_mode)
            .await
            .map_err(InvokeError::from_anyhow)?;
    } else {
        return Err(InvokeError::from("Invalid display mode".to_string()));
    }

    if timer.elapsed() > MAX_ACCEPTABLE_COMMAND_TIME {
        warn!(target: LOG_TARGET, "set_display_mode took too long: {:?}", timer.elapsed());
    }

    Ok(())
}
#[tauri::command]
pub async fn toggle_device_exclusion(
    device_index: u32,
    excluded: bool,
    app: tauri::AppHandle,
    state: tauri::State<'_, UniverseAppState>,
) -> Result<(), String> {
    let mut gpu_miner = state.gpu_miner.write().await;
    let config_dir = app
        .path()
        .app_config_dir()
        .expect("Could not get config dir");
    gpu_miner
        .toggle_device_exclusion(config_dir, device_index, excluded)
        .await
        .inspect_err(|e| error!("error at toggle_device_exclusion {:?}", e))
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub async fn set_gpu_mining_enabled(enabled: bool) -> Result<(), InvokeError> {
    let timer = Instant::now();

    ConfigMining::update_field(ConfigMiningContent::set_gpu_mining_enabled, enabled)
        .await
        .map_err(InvokeError::from_anyhow)?;

    if timer.elapsed() > MAX_ACCEPTABLE_COMMAND_TIME {
        warn!(target: LOG_TARGET,
            "set_gpu_mining_enabled took too long: {:?}",
            timer.elapsed()
        );
    }

    Ok(())
}

#[tauri::command]
pub async fn set_mine_on_app_start(mine_on_app_start: bool) -> Result<(), InvokeError> {
    let timer = Instant::now();
    ConfigMining::update_field(
        ConfigMiningContent::set_mine_on_app_start,
        mine_on_app_start,
    )
    .await
    .map_err(InvokeError::from_anyhow)?;

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
) -> Result<(), InvokeError> {
    let timer = Instant::now();
    info!(target: LOG_TARGET, "[set_mode] called with mode: {:?}", mode);
    if let Some(mode) = MiningMode::from_str(&mode) {
        ConfigMining::update_field(ConfigMiningContent::set_mode, mode)
            .await
            .map_err(InvokeError::from_anyhow)?;
    } else {
        return Err(InvokeError::from("Invalid mode".to_string()));
    }

    ConfigMining::update_field(
        ConfigMiningContent::set_custom_max_cpu_usage,
        custom_cpu_usage,
    )
    .await
    .map_err(InvokeError::from_anyhow)?;

    ConfigMining::update_field(
        ConfigMiningContent::set_custom_max_gpu_usage,
        custom_gpu_usage,
    )
    .await
    .map_err(InvokeError::from_anyhow)?;

    if timer.elapsed() > MAX_ACCEPTABLE_COMMAND_TIME {
        warn!(target: LOG_TARGET, "set_mode took too long: {:?}", timer.elapsed());
    }

    Ok(())
}

#[tauri::command]
pub async fn set_monero_address(
    monero_address: String,
    app_handle: tauri::AppHandle,
) -> Result<(), InvokeError> {
    let timer = Instant::now();
    ConfigWallet::update_field_requires_restart(
        ConfigWalletContent::set_user_monero_address,
        monero_address,
        vec![SetupPhase::Mining],
    )
    .await
    .map_err(InvokeError::from_anyhow)?;

    SetupManager::get_instance()
        .restart_phases_from_queue(app_handle)
        .await;
    if timer.elapsed() > MAX_ACCEPTABLE_COMMAND_TIME {
        warn!(target: LOG_TARGET, "set_monero_address took too long: {:?}", timer.elapsed());
    }
    Ok(())
}

#[tauri::command]
pub async fn set_monerod_config(
    use_monero_fail: bool,
    monero_nodes: Vec<String>,
    app_handle: tauri::AppHandle,
) -> Result<(), InvokeError> {
    let timer = Instant::now();
    info!(target: LOG_TARGET, "[set_monerod_config] called with use_monero_fail: {:?}, monero_nodes: {:?}", use_monero_fail, monero_nodes);
    ConfigCore::update_field_requires_restart(
        ConfigCoreContent::set_mmproxy_monero_nodes,
        monero_nodes.clone(),
        vec![SetupPhase::Mining],
    )
    .await
    .map_err(InvokeError::from_anyhow)?;

    ConfigCore::update_field_requires_restart(
        ConfigCoreContent::set_mmproxy_use_monero_failover,
        use_monero_fail,
        vec![SetupPhase::Mining],
    )
    .await
    .map_err(InvokeError::from_anyhow)?;

    SetupManager::get_instance()
        .restart_phases_from_queue(app_handle)
        .await;

    if timer.elapsed() > MAX_ACCEPTABLE_COMMAND_TIME {
        warn!(target: LOG_TARGET, "set_monerod_config took too long: {:?}", timer.elapsed());
    }

    Ok(())
}

#[tauri::command]
pub async fn set_p2pool_enabled(
    p2pool_enabled: bool,
    app_handle: tauri::AppHandle,
) -> Result<(), InvokeError> {
    let timer = Instant::now();
    ConfigCore::update_field_requires_restart(
        ConfigCoreContent::set_is_p2pool_enabled,
        p2pool_enabled,
        vec![SetupPhase::Mining],
    )
    .await
    .map_err(InvokeError::from_anyhow)?;

    SetupManager::get_instance()
        .restart_phases_from_queue(app_handle)
        .await;

    if timer.elapsed() > MAX_ACCEPTABLE_COMMAND_TIME {
        warn!(target: LOG_TARGET, "set_p2pool_enabled took too long: {:?}", timer.elapsed());
    }
    Ok(())
}

#[tauri::command]
pub async fn set_show_experimental_settings(
    show_experimental_settings: bool,
) -> Result<(), InvokeError> {
    ConfigUI::update_field(
        ConfigUIContent::set_show_experimental_settings,
        show_experimental_settings,
    )
    .await
    .map_err(InvokeError::from_anyhow)?;

    Ok(())
}

#[tauri::command]
pub async fn set_should_always_use_system_language(
    should_always_use_system_language: bool,
) -> Result<(), InvokeError> {
    ConfigUI::update_field(
        ConfigUIContent::set_should_always_use_system_language,
        should_always_use_system_language,
    )
    .await
    .map_err(InvokeError::from_anyhow)?;

    Ok(())
}

#[tauri::command]
pub async fn set_should_auto_launch(should_auto_launch: bool) -> Result<(), InvokeError> {
    ConfigCore::update_field(
        ConfigCoreContent::set_should_auto_launch,
        should_auto_launch,
    )
    .await
    .map_err(InvokeError::from_anyhow)?;

    AutoLauncher::current()
        .update_auto_launcher(should_auto_launch)
        .await
        .map_err(InvokeError::from_anyhow)?;

    Ok(())
}

#[tauri::command]
pub async fn set_tor_config(
    config: TorConfig,
    _window: tauri::Window,
    state: tauri::State<'_, UniverseAppState>,
    app_handle: tauri::AppHandle,
) -> Result<TorConfig, String> {
    let timer = Instant::now();
    info!(target: LOG_TARGET, "[set_tor_config] called with config: {:?}", config);
    let tor_config = state
        .tor_manager
        .set_tor_config(config)
        .await
        .map_err(|e| e.to_string())?;

    SetupManager::get_instance()
        .restart_phases(
            app_handle,
            vec![SetupPhase::Node, SetupPhase::Wallet, SetupPhase::Mining],
        )
        .await;

    if timer.elapsed() > MAX_ACCEPTABLE_COMMAND_TIME {
        warn!(target: LOG_TARGET, "set_tor_config took too long: {:?}", timer.elapsed());
    }
    Ok(tor_config)
}

#[tauri::command]
pub async fn set_use_tor(use_tor: bool, app_handle: tauri::AppHandle) -> Result<(), InvokeError> {
    let timer = Instant::now();
    ConfigCore::update_field_requires_restart(
        ConfigCoreContent::set_use_tor,
        use_tor,
        vec![SetupPhase::Node, SetupPhase::Wallet, SetupPhase::Mining],
    )
    .await
    .map_err(InvokeError::from_anyhow)?;

    SetupManager::get_instance()
        .restart_phases_from_queue(app_handle.clone())
        .await;

    let config_dir = app_handle
        .path()
        .app_config_dir()
        .expect("Could not get config dir");

    //TODO: Do we still need this?
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
pub async fn set_visual_mode(enabled: bool) -> Result<(), InvokeError> {
    let timer = Instant::now();
    ConfigUI::update_field(ConfigUIContent::set_visual_mode, enabled)
        .await
        .map_err(InvokeError::from_anyhow)?;

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
pub async fn set_airdrop_tokens(
    airdrop_tokens: Option<AirdropTokens>,
    app_handle: tauri::AppHandle,
) -> Result<(), InvokeError> {
    let old_id = ConfigCore::content()
        .await
        .airdrop_tokens()
        .clone()
        .and_then(|tokens| {
            airdrop::decode_jwt_claims_without_exp(&tokens.token).map(|claim| claim.id)
        });
    let new_id = airdrop_tokens.clone().and_then(|tokens| {
        airdrop::decode_jwt_claims_without_exp(&tokens.token).map(|claim| claim.id)
    });

    let user_id_changed = old_id != new_id;

    ConfigCore::update_field(ConfigCoreContent::set_airdrop_tokens, airdrop_tokens)
        .await
        .map_err(InvokeError::from_anyhow)?;

    info!(target: LOG_TARGET, "New Airdrop tokens saved, user id changed:{:?}", user_id_changed);
    if user_id_changed {
        // If the user id changed, we need to restart the mining phases to ensure that the new telemetry_id ( unique_string value )is used
        SetupManager::get_instance()
            .restart_phases(app_handle.clone(), vec![SetupPhase::Mining])
            .await;
    }
    Ok(())
}

#[tauri::command]
pub async fn start_cpu_mining(
    state: tauri::State<'_, UniverseAppState>,
    app: tauri::AppHandle,
) -> Result<(), String> {
    let timer = Instant::now();
    let _lock = state.cpu_miner_stop_start_mutex.lock().await;
    let mut timestamp_lock = state.cpu_miner_timestamp_mutex.lock().await;
    *timestamp_lock = SystemTime::now();

    let cpu_mining_enabled = *ConfigMining::content().await.cpu_mining_enabled();
    let mode = *ConfigMining::content().await.mode();
    let custom_cpu_usage = *ConfigMining::content().await.custom_max_cpu_usage();

    let cpu_miner = state.cpu_miner.read().await;
    let cpu_miner_running = cpu_miner.is_running().await;
    drop(cpu_miner);
    let cpu_miner_config = state.cpu_miner_config.read().await;
    let tari_address = ConfigWallet::content()
        .await
        .get_current_used_tari_address();
    drop(cpu_miner_config);

    if cpu_mining_enabled && !cpu_miner_running {
        let cpu_miner_config = state.cpu_miner_config.read().await;
        let mmproxy_manager = &state.mm_proxy_manager;
        let mut cpu_miner = state.cpu_miner.write().await;
        let res = cpu_miner
            .start(
                TasksTrackers::current().hardware_phase.get_signal().await,
                &cpu_miner_config,
                mmproxy_manager,
                app.path()
                    .app_local_data_dir()
                    .expect("Could not get data dir"),
                app.path()
                    .app_config_dir()
                    .expect("Could not get config dir"),
                app.path().app_log_dir().expect("Could not get log dir"),
                mode,
                custom_cpu_usage,
                &tari_address,
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
    if timer.elapsed() > MAX_ACCEPTABLE_COMMAND_TIME {
        warn!(target: LOG_TARGET, "start_cpu_mining took too long: {:?}", timer.elapsed());
    }
    Ok(())
}
#[tauri::command]
pub async fn start_gpu_mining(
    state: tauri::State<'_, UniverseAppState>,
    app: tauri::AppHandle,
) -> Result<(), String> {
    let timer = Instant::now();
    let _lock = state.gpu_miner_stop_start_mutex.lock().await;

    let gpu_mining_enabled = *ConfigMining::content().await.gpu_mining_enabled();
    let mode = *ConfigMining::content().await.mode();
    let custom_gpu_usage = ConfigMining::content().await.custom_max_gpu_usage().clone();
    let p2pool_enabled = *ConfigCore::content().await.is_p2pool_enabled();

    let mut telemetry_id = state
        .telemetry_manager
        .read()
        .await
        .get_unique_string()
        .await;

    let tari_address = ConfigWallet::content()
        .await
        .get_current_used_tari_address();
    let gpu_miner = state.gpu_miner.read().await;
    let gpu_miner_running = gpu_miner.is_running().await;
    let gpu_available = gpu_miner.is_gpu_mining_available();
    drop(gpu_miner);

    info!(target: LOG_TARGET, "GPU availability {:?} gpu_mining_enabled {}", gpu_available.clone(), gpu_mining_enabled);

    if gpu_mining_enabled && gpu_available && !gpu_miner_running {
        info!(target: LOG_TARGET, "1. Starting gpu miner");

        let source = if p2pool_enabled {
            let use_local = state.node_manager.is_local_current().await.unwrap_or(false);
            let grpc_address = state.p2pool_manager.get_grpc_address(use_local).await;
            GpuNodeSource::P2Pool { grpc_address }
        } else {
            let grpc_address = state
                .node_manager
                .get_grpc_address()
                .await
                .map_err(|e| e.to_string())?;
            GpuNodeSource::BaseNode { grpc_address }
        };

        info!(target: LOG_TARGET, "2 Starting gpu miner");

        if telemetry_id.is_empty() {
            telemetry_id = "tari-universe".to_string();
        }

        info!(target: LOG_TARGET, "3. Starting gpu miner");

        let mut gpu_miner = state.gpu_miner.write().await;
        let res = gpu_miner
            .start(
                tari_address.clone(),
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
        warn!(target: LOG_TARGET, "start_gpu_mining took too long: {:?}", timer.elapsed());
    }

    let mining_time = *ConfigMining::content().await.mining_time();
    EventsEmitter::emit_mining_time_update(mining_time).await;
    Ok(())
}

#[tauri::command]
pub async fn stop_cpu_mining(state: tauri::State<'_, UniverseAppState>) -> Result<(), String> {
    let _lock = state.cpu_miner_stop_start_mutex.lock().await;
    let timer = Instant::now();
    state
        .cpu_miner
        .write()
        .await
        .stop()
        .await
        .map_err(|e| e.to_string())?;
    info!(target:LOG_TARGET, "cpu miner stopped");

    let timestamp_lock = state.cpu_miner_timestamp_mutex.lock().await;
    let current_mining_time_ms = *ConfigMining::content().await.mining_time();

    let now = SystemTime::now();
    let mining_time_duration = now
        .duration_since(*timestamp_lock)
        .unwrap_or_default()
        .as_millis();

    let mining_time = current_mining_time_ms + mining_time_duration;
    let _unused =
        ConfigMining::update_field(ConfigMiningContent::set_mining_time, mining_time).await;
    EventsEmitter::emit_mining_time_update(mining_time).await;

    if timer.elapsed() > MAX_ACCEPTABLE_COMMAND_TIME {
        warn!(target: LOG_TARGET, "stop_cpu_mining took too long: {:?}", timer.elapsed());
    }

    Ok(())
}
#[tauri::command]
pub async fn stop_gpu_mining(state: tauri::State<'_, UniverseAppState>) -> Result<(), String> {
    let _lock = state.gpu_miner_stop_start_mutex.lock().await;
    let timer = Instant::now();

    state
        .gpu_miner
        .write()
        .await
        .stop()
        .await
        .map_err(|e| e.to_string())?;
    info!(target:LOG_TARGET, "gpu miner stopped");

    if timer.elapsed() > MAX_ACCEPTABLE_COMMAND_TIME {
        warn!(target: LOG_TARGET, "stop_cpu_mining took too long: {:?}", timer.elapsed());
    }
    Ok(())
}

#[tauri::command]
pub async fn update_applications(app: tauri::AppHandle) -> Result<(), InvokeError> {
    let timer = Instant::now();
    let binary_resolver = BinaryResolver::current().read().await;
    let tapplet_resolver = TappletResolver::current().read().await;

    ConfigCore::update_field(
        ConfigCoreContent::set_last_binaries_update_timestamp,
        SystemTime::now(),
    )
    .await
    .map_err(InvokeError::from_anyhow)?;

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
    tapplet_resolver
        .update_tapplet(Tapplets::Bridge, progress_tracker.clone())
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
) -> Result<(), InvokeError> {
    let timer = Instant::now();
    ConfigCore::update_field(ConfigCoreContent::set_pre_release, pre_release)
        .await
        .map_err(InvokeError::from_anyhow)?;

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

#[tauri::command]
pub async fn start_mining_status(state: tauri::State<'_, UniverseAppState>) -> Result<(), String> {
    let timer = Instant::now();
    info!(target: LOG_TARGET, "start_mining_status called");
    state
        .mining_status_manager
        .write()
        .await
        .start_polling()
        .await
        .map_err(|e| e.to_string())?;
    if timer.elapsed() > MAX_ACCEPTABLE_COMMAND_TIME {
        warn!(target: LOG_TARGET, "start_mining_status_sending took too long: {:?}", timer.elapsed());
    }
    Ok(())
}

#[tauri::command]
pub async fn stop_mining_status(state: tauri::State<'_, UniverseAppState>) -> Result<(), String> {
    info!(target: LOG_TARGET, "stop_mining_status called");
    let timer = Instant::now();
    state
        .mining_status_manager
        .write()
        .await
        .stop_polling()
        .await;
    if timer.elapsed() > MAX_ACCEPTABLE_COMMAND_TIME {
        warn!(target: LOG_TARGET, "stop_mining_status_sending took too long: {:?}", timer.elapsed());
    }
    Ok(())
}

#[tauri::command]
pub async fn set_selected_engine(
    selected_engine: &str,
    state: tauri::State<'_, UniverseAppState>,
    app: tauri::AppHandle,
) -> Result<(), InvokeError> {
    info!(target: LOG_TARGET, "set_selected_engine called with engine: {:?}", selected_engine);
    let timer = Instant::now();

    let engine_type = EngineType::from_string(selected_engine).map_err(InvokeError::from_anyhow)?;
    let config = app
        .path()
        .app_config_dir()
        .expect("Could not get config dir");

    state
        .gpu_miner
        .write()
        .await
        .set_selected_engine(engine_type.clone(), config)
        .await
        .map_err(|e| e.to_string())?;

    ConfigMining::update_field(ConfigMiningContent::set_gpu_engine, engine_type)
        .await
        .map_err(InvokeError::from_anyhow)?;

    if timer.elapsed() > MAX_ACCEPTABLE_COMMAND_TIME {
        warn!(target: LOG_TARGET, "proceed_with_update took too long: {:?}", timer.elapsed());
    }

    Ok(())
}

#[tauri::command]
pub async fn websocket_connect(
    _: tauri::AppHandle,
    state: tauri::State<'_, UniverseAppState>,
) -> Result<(), String> {
    let timer = Instant::now();
    let last_state = state.websocket_manager_status_rx.borrow().clone();
    info!(target: LOG_TARGET, "websocket_connect command accepted");

    if matches!(
        last_state,
        WebsocketManagerStatusMessage::Connected | WebsocketManagerStatusMessage::Reconnecting
    ) {
        return Ok(());
    }

    let mut websocket_manger_guard = state.websocket_manager.write().await;

    if !websocket_manger_guard.is_websocket_manager_ready() {
        warn!(target: LOG_TARGET, "websocket_connect cannot be done as websocket_manager is not ready yet");
        return Err("websocket manager is not ready".into());
    }

    websocket_manger_guard
        .connect()
        .await
        .map_err(|e| e.to_string())?;

    state
        .websocket_event_manager
        .write()
        .await
        .emit_interval_ws_events()
        .await
        .map_err(|e| e.to_string())?;

    if timer.elapsed() > MAX_ACCEPTABLE_COMMAND_TIME {
        warn!(target: LOG_TARGET, "websocket_connect took too long: {:?}", timer.elapsed());
    }
    info!(target: LOG_TARGET, "websocket_connect command finished");
    Ok(())
}

#[tauri::command]
pub async fn reconnect(app_handle: tauri::AppHandle) -> Result<(), String> {
    EventsEmitter::emit_connection_status_changed(ConnectionStatusPayload::InProgress).await;
    let setup_manager = SetupManager::get_instance();
    setup_manager
        .restart_phases(app_handle, SetupPhase::all())
        .await;
    Ok(())
}

#[tauri::command]
pub async fn send_one_sided_to_stealth_address(
    state: tauri::State<'_, UniverseAppState>,
    amount: String,
    destination: String,
    payment_id: Option<String>,
) -> Result<(), String> {
    let timer = Instant::now();
    info!(target: LOG_TARGET, "[send_one_sided_to_stealth_address] called with args: (amount: {:?}, destination: {:?}, payment_id: {:?})", amount, destination, payment_id);
    let state_clone = state.clone();
    let mut spend_wallet_manager = state_clone.spend_wallet_manager.write().await;
    spend_wallet_manager
        .send_one_sided_to_stealth_address(amount, destination, payment_id, state.clone())
        .await
        .map_err(|e| e.to_string())?;

    let balance = state.wallet_manager.get_balance().await;
    if let Ok(balance) = balance {
        EventsEmitter::emit_wallet_balance_update(balance).await;
    }

    if timer.elapsed() > MAX_ACCEPTABLE_COMMAND_TIME {
        warn!(target: LOG_TARGET, "send_one_sided_to_stealth_address took too long: {:?}", timer.elapsed());
    }
    Ok(())
}

#[tauri::command]
pub async fn websocket_close(
    _: tauri::AppHandle,
    state: tauri::State<'_, UniverseAppState>,
) -> Result<(), String> {
    let timer = Instant::now();
    info!(target: LOG_TARGET, "websocket_close command started");

    let last_state = state.websocket_manager_status_rx.borrow().clone();

    if matches!(last_state, WebsocketManagerStatusMessage::Stopped) {
        return Ok(());
    }

    state
        .websocket_event_manager
        .write()
        .await
        .stop_emitting_message()
        .await;

    state
        .websocket_manager
        .write()
        .await
        .close_connection()
        .await;

    if timer.elapsed() > MAX_ACCEPTABLE_COMMAND_TIME {
        warn!(target: LOG_TARGET, "websocket_close took too long: {:?}", timer.elapsed());
    }
    info!(target: LOG_TARGET, "websocket_close command finished");
    Ok(())
}

#[tauri::command]
pub fn verify_address_for_send(
    address: String,
    sending_method: Option<TariAddressFeatures>,
) -> Result<(), String> {
    let sending_method = sending_method.unwrap_or(TariAddressFeatures::ONE_SIDED);

    verify_send(address, sending_method)
}

#[tauri::command]
pub fn validate_minotari_amount(
    amount: String,
    state: tauri::State<'_, UniverseAppState>,
) -> Result<(), InvokeError> {
    let t_amount = Minotari::from_str(&amount).map_err(|e| e.to_string())?;
    let m_amount = MicroMinotari::from(t_amount);

    let balance = state
        .wallet_state_watch_rx
        .borrow()
        .clone()
        .and_then(|state| state.balance);

    let available_balance = balance.expect("Could not get balance").available_balance;
    match m_amount.cmp(&available_balance) {
        std::cmp::Ordering::Less => Ok(()),
        _ => Err(InvokeError::from("Insufficient balance".to_string())),
    }
}

#[tauri::command]
pub async fn trigger_phases_restart(app_handle: tauri::AppHandle) -> Result<(), InvokeError> {
    SetupManager::get_instance()
        .restart_phases_from_queue(app_handle)
        .await;

    Ok(())
}

#[tauri::command]
pub async fn set_node_type(
    mut node_type: NodeType,
    app_handle: tauri::AppHandle,
    state: tauri::State<'_, UniverseAppState>,
) -> Result<(), InvokeError> {
    // map LocalAfterRemote or unknown value to Local
    if node_type != NodeType::Local
        && node_type != NodeType::RemoteUntilLocal
        && node_type != NodeType::Remote
    {
        node_type = NodeType::Local;
    }

    let prev_node_type = state
        .node_manager
        .get_node_type()
        .await
        .map_err(|e| e.to_string())?;
    info!(target: LOG_TARGET, "[set_node_type] from {:?} to: {:?}", prev_node_type, node_type);

    let is_current_local = matches!(prev_node_type, NodeType::Local | NodeType::LocalAfterRemote);
    if is_current_local && node_type != NodeType::Remote {
        info!(target: LOG_TARGET, "[set_node_type] Local node is already running, no restart needed for node_type: {:?}", node_type);
        ConfigCore::update_field(ConfigCoreContent::set_node_type, node_type.clone())
            .await
            .map_err(InvokeError::from_anyhow)?;

        if node_type == NodeType::RemoteUntilLocal {
            info!(target: LOG_TARGET, "[set_node_type] Converting RemoteUntilLocal to LocalAfterRemote since local node is running");
            node_type = NodeType::LocalAfterRemote
        }
    } else {
        info!(target: LOG_TARGET, "[set_node_type] Restarting required phases for node_type: {:?}", node_type);
        ConfigCore::update_field_requires_restart(
            ConfigCoreContent::set_node_type,
            node_type.clone(),
            vec![SetupPhase::Node, SetupPhase::Wallet, SetupPhase::Mining],
        )
        .await
        .map_err(InvokeError::from_anyhow)?;
    }

    state.node_manager.set_node_type(node_type.clone()).await;
    EventsManager::handle_node_type_update(&app_handle).await;

    SetupManager::get_instance()
        .restart_phases_from_queue(app_handle)
        .await;

    Ok(())
}

#[tauri::command]
pub async fn set_warmup_seen(warmup_seen: bool) -> Result<(), String> {
    ConfigUI::update_field(ConfigUIContent::set_warmup_seen, warmup_seen)
        .await
        .map_err(|e| e.to_string())?;

    Ok(())
}

/*
 ********** TAPPLETS SECTION **********
*/

#[tauri::command]
pub async fn launch_builtin_tapplet() -> Result<ActiveTapplet, String> {
    let tapplet_resolver = TappletResolver::current().read().await;

    let tapp_dest_dir = tapplet_resolver
        .resolve_path_to_tapplet_files(Tapplets::Bridge)
        .await
        .map_err(|e| e.to_string())?;

    let handle_start =
        tauri::async_runtime::spawn(async move { start_tapplet(tapp_dest_dir).await });

    let (addr, _cancel_token) = match handle_start.await {
        Ok(result) => result.map_err(|e| e.to_string())?,
        Err(e) => {
            error!(target: LOG_TARGET, "❌ Error handling tapplet start: {:?}", e);
            return Err(e.to_string());
        }
    };

    Ok(ActiveTapplet {
        tapplet_id: 0,
        display_name: "Bridge-wXTM".to_string(),
        source: format!("http://{}", addr),
        version: "1.0.0".to_string(),
    })
}

#[tauri::command]
pub async fn get_tari_wallet_balance(
    state: tauri::State<'_, UniverseAppState>,
) -> Result<WalletBalance, String> {
    let balance = state
        .wallet_state_watch_rx
        .borrow()
        .clone()
        .and_then(|state| state.balance);

    match balance {
        Some(balance) => Ok(balance),
        None => Ok(WalletBalance {
            available_balance: MicroMinotari(0),
            timelocked_balance: MicroMinotari(0),
            pending_incoming_balance: MicroMinotari(0),
            pending_outgoing_balance: MicroMinotari(0),
        }),
    }
}

#[tauri::command]
pub async fn get_bridge_envs() -> Result<(String, String), String> {
    let walletconnect_id = option_env!("BRIDGE_WALLET_CONNECT_PROJECT_ID")
        .unwrap_or("")
        .to_string();
    let backend_api = option_env!("BRIDGE_BACKEND_API_URL")
        .unwrap_or("")
        .to_string();

    Ok((walletconnect_id, backend_api))
}

#[tauri::command]
pub async fn parse_tari_address(address: String) -> Result<TariAddressVariants, String> {
    let tari_address = TariAddress::from_str(&address).map_err(|e| e.to_string())?;

    Ok(TariAddressVariants {
        emoji_string: tari_address.to_emoji_string(),
        base58: tari_address.to_base58(),
        hex: tari_address.to_hex(),
    })
}

#[tauri::command]
pub async fn refresh_wallet_history(
    state: tauri::State<'_, UniverseAppState>,
    app_handle: tauri::AppHandle,
) -> Result<(), String> {
    SetupManager::get_instance()
        .shutdown_phases(vec![SetupPhase::Wallet])
        .await;

    let base_path = app_handle
        .path()
        .app_local_data_dir()
        .map_err(|_| "Could not find wallet data dir".to_string())?;
    state
        .wallet_manager
        .clean_data_folder(&base_path)
        .await
        .map_err(|e| e.to_string())?;

    // Trigger it manually to immediately update the UI
    let node_status_watch_rx = state.node_status_watch_rx.clone();
    let node_status = *node_status_watch_rx.borrow();
    EventsEmitter::emit_init_wallet_scanning_progress(0, node_status.block_height, 0.0).await;

    SetupManager::get_instance()
        .resume_phases(app_handle, vec![SetupPhase::Wallet])
        .await;

    Ok(())
}
