use crate::app_config::{AppConfig, GpuThreads};
use crate::app_in_memory_config::AirdropInMemoryConfig;
use crate::auto_launcher::AutoLauncher;
use crate::binaries::{Binaries, BinaryResolver};
use crate::consts::{TAPPLET_ARCHIVE, TAPPLET_DIST_DIR};
use crate::credential_manager::{CredentialError, CredentialManager};
use crate::database::models::{
    CreateDevTapplet, CreateInstalledTapplet, CreateTapplet, CreateTappletAsset,
    CreateTappletVersion, DevTapplet, InstalledTapplet, Tapplet, UpdateInstalledTapplet,
};
use crate::database::store::{SqliteStore, Store};
use crate::download_utils::{download_file_with_retries, extract};
use crate::external_dependencies::{
    ExternalDependencies, ExternalDependency, RequiredExternalDependency,
};
use crate::gpu_miner_adapter::{GpuMinerStatus, GpuNodeSource};
use crate::hardware::hardware_status_monitor::{HardwareStatusMonitor, PublicDeviceProperties};
use crate::interface::{
    DevTappletResponse, InstalledTappletWithName, LaunchedTappResult, TappletPermissions,
};
use crate::internal_wallet::{InternalWallet, PaperWalletConfig};
use crate::node_manager::NodeManagerError;
use crate::ootle::tapplet_installer::delete_tapplet;
use crate::ootle::{
    db_connection::{AssetServer, DatabaseConnection, ShutdownTokens},
    error::{
        Error::{self, RequestError, TappletServerError},
        RequestError::*,
        TappletServerError::*,
    },
    tapplet_installer::{
        check_files_and_validate_checksum, download_asset, fetch_tapp_registry_manifest,
        get_tapp_download_path, get_tapp_permissions,
    },
    tapplet_server::start,
};
use crate::p2pool::models::Stats;
use crate::progress_tracker::ProgressTracker;
use crate::systemtray_manager::{SystemtrayManager, SystrayData};
use crate::tor_adapter::TorConfig;
use crate::utils::shutdown_utils::stop_all_processes;
use crate::wallet_adapter::{TransactionInfo, WalletBalance};
use crate::wallet_manager::WalletManagerError;
use crate::{setup_inner, UniverseAppState, APPLICATION_FOLDER_ID};
use futures_util::TryFutureExt;
use keyring::Entry;
use log::{debug, error, info, warn};
use monero_address_creator::Seed as MoneroSeed;
use regex::Regex;
use sentry::integrations::anyhow::capture_anyhow;
use serde::Serialize;
use std::fs::{read_dir, remove_dir_all, remove_file, File};
use std::sync::atomic::Ordering;
use std::thread::{available_parallelism, sleep};
use std::time::{Duration, Instant, SystemTime};
use tari_common::configuration::Network;
use tari_core::transactions::tari_amount::MicroMinotari;
use tauri::{Manager, PhysicalPosition, PhysicalSize};
use tokio_util::sync::CancellationToken;

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

#[tauri::command]
pub async fn close_splashscreen(window: tauri::Window) {
    let splashscreen_window = window
        .get_window("splashscreen")
        .expect("no window labeled 'splashscreen' found");
    let main_window = window
        .get_window("main")
        .expect("no window labeled 'main' found");

    if let (Ok(window_position), Ok(window_size)) = (
        splashscreen_window.outer_position(),
        splashscreen_window.outer_size(),
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
pub async fn exit_application(
    _window: tauri::Window,
    state: tauri::State<'_, UniverseAppState>,
    app: tauri::AppHandle,
) -> Result<(), String> {
    stop_all_processes(state.inner().clone(), true).await?;

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

#[allow(clippy::too_many_lines)]
#[tauri::command]
pub async fn get_miner_metrics(
    state: tauri::State<'_, UniverseAppState>,
    app: tauri::AppHandle,
) -> Result<MinerMetrics, String> {
    let timer = Instant::now();
    if state.is_getting_miner_metrics.load(Ordering::SeqCst) {
        let read = state.cached_miner_metrics.read().await;
        if let Some(metrics) = &*read {
            warn!(target: LOG_TARGET, "Already getting miner metrics, returning cached value");
            return Ok(metrics.clone());
        }
        warn!(target: LOG_TARGET, "Already getting miner metrics");
        return Err("Already getting miner metrics".to_string());
    }
    state.is_getting_miner_metrics.store(true, Ordering::SeqCst);

    // info!(target: LOG_TARGET, "1 elapsed {:?}", timer.elapsed());
    let (sha_hash_rate, randomx_hash_rate, block_reward, block_height, block_time, is_synced) =
        state
            .node_manager
            .get_network_hash_rate_and_block_reward()
            .await
            .unwrap_or_else(|e| {
                if !matches!(e, NodeManagerError::NodeNotStarted) {
                    warn!(target: LOG_TARGET, "Error getting network hash rate and block reward: {}", e);
                }
                (0, 0, MicroMinotari(0), 0, 0, false)
            });
    // info!(target: LOG_TARGET, "2 elapsed {:?}", timer.elapsed());

    let cpu_miner = state.cpu_miner.read().await;
    let cpu_mining_status = match cpu_miner
        .status(randomx_hash_rate, block_reward)
        .await
        .map_err(|e| e.to_string())
    {
        Ok(cpu) => cpu,
        Err(e) => {
            warn!(target: LOG_TARGET, "Error getting cpu miner status: {:?}", e);
            state
                .is_getting_miner_metrics
                .store(false, Ordering::SeqCst);
            return Err(e);
        }
    };
    drop(cpu_miner);

    // info!(target: LOG_TARGET, "3 elapsed {:?}", timer.elapsed());

    let gpu_miner = state.gpu_miner.read().await;
    let gpu_mining_status = match gpu_miner.status(sha_hash_rate, block_reward).await {
        Ok(gpu) => gpu,
        Err(e) => {
            warn!(target: LOG_TARGET, "Error getting gpu miner status: {:?}", e);
            state
                .is_getting_miner_metrics
                .store(false, Ordering::SeqCst);
            return Err(e.to_string());
        }
    };
    drop(gpu_miner);

    // let config_path = app
    //     .path_resolver()
    //     .app_config_dir()
    //     .expect("Could not get config dir");
    // let _unused = HardwareMonitor::current()
    //     .write()
    //     .await
    //     .load_status_file(config_path);
    // let hardware_status = HardwareMonitor::current()
    //     .write()
    //     .await
    //     .read_hardware_parameters();

    // info!(target: LOG_TARGET, "4 elapsed {:?}", timer.elapsed());
    let gpu_public_parameters = HardwareStatusMonitor::current()
        .get_gpu_devices_public_properties()
        .await
        .map_err(|e| e.to_string())?;
    //     .map_err(|e| e.to_string())?;
    // info!(target: LOG_TARGET, "5 elapsed {:?}", timer.elapsed());
    // let cpu_public_parameters = HardwareStatusMonitor::current()
    //     .get_cpu_public_properties()
    //     .await
    //     .map_err(|e| e.to_string())?;

    // info!(target: LOG_TARGET, "6 elapsed {:?}", timer.elapsed());

    let new_systemtray_data: SystrayData = SystemtrayManager::current().create_systemtray_data(
        cpu_mining_status.hash_rate,
        gpu_mining_status.hash_rate as f64,
        // gpu_public_parameters.clone(),
        // cpu_public_parameters.clone(),
        (cpu_mining_status.estimated_earnings + gpu_mining_status.estimated_earnings) as f64,
    );

    // info!(target: LOG_TARGET, "7 elapsed {:?}", timer.elapsed());
    SystemtrayManager::current().update_systray(app, new_systemtray_data);

    // info!(target: LOG_TARGET, "8 elapsed {:?}", timer.elapsed());
    let connected_peers = state
        .node_manager
        .list_connected_peers()
        .await
        .unwrap_or_default();

    if timer.elapsed() > MAX_ACCEPTABLE_COMMAND_TIME {
        warn!(target: LOG_TARGET, "get_miner_metrics took too long: {:?}", timer.elapsed());
    }

    let ret = MinerMetrics {
        sha_network_hash_rate: sha_hash_rate,
        randomx_network_hash_rate: randomx_hash_rate,
        cpu: CpuMinerMetrics {
            // hardware: cpu_public_parameters.clone(),
            mining: cpu_mining_status,
        },
        gpu: GpuMinerMetrics {
            hardware: gpu_public_parameters.clone(),
            mining: gpu_mining_status,
        },
        base_node: BaseNodeStatus {
            block_height,
            block_time,
            is_synced,
            is_connected: !connected_peers.is_empty(),
            connected_peers,
        },
    };
    let mut lock = state.cached_miner_metrics.write().await;
    *lock = Some(ret.clone());
    state
        .is_getting_miner_metrics
        .store(false, Ordering::SeqCst);

    Ok(ret)
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
        .path_resolver()
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
) -> Result<Option<Stats>, String> {
    let timer = Instant::now();
    if state.is_getting_p2pool_stats.load(Ordering::SeqCst) {
        let read = state.cached_p2pool_stats.read().await;
        if let Some(stats) = &*read {
            warn!(target: LOG_TARGET, "Already getting p2pool stats, returning cached value");
            return Ok(stats.clone());
        }
        warn!(target: LOG_TARGET, "Already getting p2pool stats");
        return Err("Already getting p2pool stats".to_string());
    }
    state.is_getting_p2pool_stats.store(true, Ordering::SeqCst);
    let p2pool_stats = state.p2pool_manager.get_stats().await.unwrap_or_else(|e| {
        warn!(target: LOG_TARGET, "Error getting p2pool stats: {}", e);
        None
    });

    if timer.elapsed() > MAX_ACCEPTABLE_COMMAND_TIME {
        warn!(target: LOG_TARGET, "get_p2pool_stats took too long: {:?}", timer.elapsed());
    }
    let mut lock = state.cached_p2pool_stats.write().await;
    *lock = Some(p2pool_stats.clone());
    state.is_getting_p2pool_stats.store(false, Ordering::SeqCst);
    Ok(p2pool_stats)
}

#[tauri::command]
pub async fn get_paper_wallet_details(app: tauri::AppHandle) -> Result<PaperWalletConfig, String> {
    let timer = Instant::now();
    let config_path = app
        .path_resolver()
        .app_config_dir()
        .expect("Could not get config dir");
    let internal_wallet = InternalWallet::load_or_create(config_path)
        .await
        .map_err(|e| e.to_string())?;
    let result = internal_wallet
        .get_paper_wallet_details()
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
        .path_resolver()
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
pub async fn get_tari_wallet_details(
    state: tauri::State<'_, UniverseAppState>,
) -> Result<TariWalletDetails, String> {
    let timer = Instant::now();
    if state.is_getting_wallet_balance.load(Ordering::SeqCst) {
        let read = state.cached_wallet_details.read().await;
        if let Some(details) = &*read {
            warn!(target: LOG_TARGET, "Already getting wallet balance, returning cached value");
            return Ok(details.clone());
        }
        warn!(target: LOG_TARGET, "Already getting wallet balance");
        return Err("Already getting wallet balance".to_string());
    }
    state
        .is_getting_wallet_balance
        .store(true, Ordering::SeqCst);
    let wallet_balance = match state.wallet_manager.get_balance().await {
        Ok(w) => Some(w),
        Err(e) => {
            if !matches!(e, WalletManagerError::WalletNotStarted) {
                warn!(target: LOG_TARGET, "Error getting wallet balance: {}", e);
            }

            None
        }
    };
    let tari_address = state.tari_address.read().await;

    if timer.elapsed() > MAX_ACCEPTABLE_COMMAND_TIME {
        warn!(target: LOG_TARGET, "get_tari_wallet_details took too long: {:?}", timer.elapsed());
    }
    let result = TariWalletDetails {
        wallet_balance,
        tari_address_base58: tari_address.to_base58(),
        tari_address_emoji: tari_address.to_emoji_string(),
    };
    let mut lock = state.cached_wallet_details.write().await;
    *lock = Some(result.clone());
    state
        .is_getting_wallet_balance
        .store(false, Ordering::SeqCst);

    Ok(result)
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
pub async fn get_transaction_history(
    state: tauri::State<'_, UniverseAppState>,
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
        .get_transaction_history()
        .await
        .unwrap_or_else(|e| {
            if !matches!(e, WalletManagerError::WalletNotStarted) {
                warn!(target: LOG_TARGET, "Error getting transaction history: {}", e);
            }
            vec![]
        });

    if timer.elapsed() > MAX_ACCEPTABLE_COMMAND_TIME {
        warn!(target: LOG_TARGET, "get_transaction_history took too long: {:?}", timer.elapsed());
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
    state: tauri::State<'_, UniverseAppState>,
    app: tauri::AppHandle,
) -> Result<(), String> {
    let timer = Instant::now();
    let config_path = app
        .path_resolver()
        .app_config_dir()
        .expect("Could not get config dir");
    let data_dir = app
        .path_resolver()
        .app_local_data_dir()
        .expect("Could not get data dir");

    stop_all_processes(state.inner().clone(), false).await?;

    tauri::async_runtime::spawn(async move {
        match InternalWallet::create_from_seed(config_path, seed_words).await {
            Ok(_wallet) => {
                InternalWallet::clear_wallet_local_data(data_dir).await?;
                info!(target: LOG_TARGET, "[import_seed_words] Restarting the app");
                app.restart();
                Ok(())
            }
            Err(e) => {
                error!(target: LOG_TARGET, "Error loading internal wallet: {:?}", e);
                Err(e)
            }
        }
    });

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
    let log_dir = app
        .path_resolver()
        .app_log_dir()
        .expect("Could not get log dir");
    if let Err(e) = open::that(log_dir) {
        error!(target: LOG_TARGET, "Could not open log dir: {:?}", e);
    }
}

#[tauri::command]
pub async fn reset_settings<'r>(
    reset_wallet: bool,
    _window: tauri::Window,
    state: tauri::State<'_, UniverseAppState>,
    app: tauri::AppHandle,
) -> Result<(), String> {
    stop_all_processes(state.inner().clone(), true).await?;
    let network = Network::get_current_or_user_setting_or_default().as_key_str();

    let app_config_dir = app.path_resolver().app_config_dir();
    let app_cache_dir = app.path_resolver().app_cache_dir();
    let app_data_dir = app.path_resolver().app_data_dir();
    let app_local_data_dir = app.path_resolver().app_local_data_dir();

    let dirs_to_remove = [
        app_config_dir,
        app_cache_dir,
        app_data_dir,
        app_local_data_dir,
    ];
    let valid_dir_paths: Vec<String> = dirs_to_remove
        .iter()
        .filter_map(|dir| {
            if let Some(path) = dir {
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
    // Exclude EBWebView because it is still being used.
    let folder_block_list = ["EBWebView"];

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
                    debug!(target: LOG_TARGET, "[reset_settings] Removing {:?} file", path);
                    remove_file(path.clone()).map_err(|e| {
                        error!(target: LOG_TARGET, "[reset_settings] Could not remove {:?} file: {:?}", path, e);
                        format!("Could not remove file: {}", e)
                    })?;
                }
            }
        }
    }

    debug!(target: LOG_TARGET, "[reset_settings] Removing keychain items");
    if let Ok(entry) = Entry::new(APPLICATION_FOLDER_ID, "inner_wallet_credentials") {
        let _unused = entry.delete_credential();
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
    state: tauri::State<'_, UniverseAppState>,
    app: tauri::AppHandle,
) -> Result<(), String> {
    if should_stop_miners {
        stop_all_processes(state.inner().clone(), true).await?;
    }

    app.restart();
    Ok(())
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
    let reference = state
        .feedback
        .read()
        .await
        .send_feedback(
            feedback,
            include_logs,
            app.path_resolver().app_log_dir().clone(),
        )
        .await
        .inspect_err(|e| error!("error at send_feedback {:?}", e))
        .map_err(|e| e.to_string())?;
    if timer.elapsed() > Duration::from_secs(60) {
        warn!(target: LOG_TARGET, "send_feedback took too long: {:?}", timer.elapsed());
    }
    Ok(reference)
}

#[tauri::command]
pub async fn set_airdrop_access_token(
    token: String,
    _window: tauri::Window,
    state: tauri::State<'_, UniverseAppState>,
    _app: tauri::AppHandle,
) -> Result<(), String> {
    let timer = Instant::now();
    let mut write_lock = state.airdrop_access_token.write().await;
    *write_lock = Some(token.clone());
    if timer.elapsed() > MAX_ACCEPTABLE_COMMAND_TIME {
        warn!(target: LOG_TARGET,
            "set_airdrop_access_token took too long: {:?}",
            timer.elapsed()
        );
    }
    let mut in_memory_app_config = state.in_memory_config.write().await;
    in_memory_app_config.airdrop_access_token = Some(token);
    Ok(())
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
                };
                state
                    .mm_proxy_manager
                    .change_config(origin_config)
                    .await
                    .map_err(|error| error.to_string())?;
            }
        }
    };

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
        .path_resolver()
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

#[tauri::command]
pub async fn setup_application(
    window: tauri::Window,
    state: tauri::State<'_, UniverseAppState>,
    app: tauri::AppHandle,
) -> Result<bool, String> {
    let timer = Instant::now();
    let rollback = state.setup_counter.write().await;
    if rollback.get_value() {
        warn!(target: LOG_TARGET, "setup_application has already been initialized, debouncing");
        let res = state.config.read().await.auto_mining();
        return Ok(res);
    }
    rollback.set_value(true, Duration::from_millis(1000)).await;
    setup_inner(window, state.clone(), app).await.map_err(|e| {
        warn!(target: LOG_TARGET, "Error setting up application: {:?}", e);
        capture_anyhow(&e);
        e.to_string()
    })?;

    let res = state.config.read().await.auto_mining();
    if timer.elapsed() > MAX_ACCEPTABLE_COMMAND_TIME {
        warn!(target: LOG_TARGET, "setup_application took too long: {:?}", timer.elapsed());
    }
    Ok(res)
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

    let cpu_miner_config = state.cpu_miner_config.read().await;
    let tari_address = cpu_miner_config.tari_address.clone();
    let p2pool_enabled = config.p2pool_enabled();
    let monero_address = config.monero_address().to_string();
    let mut telemetry_id = state
        .telemetry_manager
        .read()
        .await
        .get_unique_string()
        .await;
    if cpu_mining_enabled {
        let mm_proxy_port = state
            .mm_proxy_manager
            .get_monero_port()
            .await
            .map_err(|e| e.to_string())?;

        let res = state
            .cpu_miner
            .write()
            .await
            .start(
                state.shutdown.to_signal(),
                &cpu_miner_config,
                monero_address.to_string(),
                mm_proxy_port,
                app.path_resolver()
                    .app_local_data_dir()
                    .expect("Could not get data dir"),
                app.path_resolver()
                    .app_config_dir()
                    .expect("Could not get config dir"),
                app.path_resolver()
                    .app_log_dir()
                    .expect("Could not get log dir"),
                mode,
                custom_cpu_usage,
            )
            .await;

        if let Err(e) = res {
            error!(target: LOG_TARGET, "Could not start mining: {:?}", e);
            state
                .cpu_miner
                .write()
                .await
                .stop()
                .await
                .inspect_err(|e| error!("error at stopping cpu miner {:?}", e))
                .ok();
            return Err(e.to_string());
        }
    }

    let gpu_available = state.gpu_miner.read().await.is_gpu_mining_available();
    info!(target: LOG_TARGET, "Gpu availability {:?} gpu_mining_enabled {}", gpu_available.clone(), gpu_mining_enabled);

    if gpu_mining_enabled && gpu_available {
        info!(target: LOG_TARGET, "1. Starting gpu miner");
        // let tari_address = state.cpu_miner_config.read().await.tari_address.clone();
        // let p2pool_enabled = state.config.read().await.p2pool_enabled();
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
        let res = state
            .gpu_miner
            .write()
            .await
            .start(
                state.shutdown.to_signal(),
                tari_address,
                source,
                app.path_resolver()
                    .app_local_data_dir()
                    .expect("Could not get data dir"),
                app.path_resolver()
                    .app_config_dir()
                    .expect("Could not get config dir"),
                app.path_resolver()
                    .app_log_dir()
                    .expect("Could not get log dir"),
                mode,
                telemetry_id,
                custom_gpu_usage,
            )
            .await;

        info!(target: LOG_TARGET, "4. Starting gpu miner");
        if let Err(e) = res {
            error!(target: LOG_TARGET, "Could not start gpu mining: {:?}", e);
            drop(
                state.gpu_miner.write().await.stop().await.inspect_err(
                    |e| error!(target: LOG_TARGET, "Could not stop gpu miner: {:?}", e),
                ),
            );
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

    state
        .gpu_miner
        .write()
        .await
        .stop()
        .await
        .map_err(|e| e.to_string())?;
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

    let progress_tracker = ProgressTracker::new(
        app.get_window("main")
            .expect("Could not get main window")
            .clone(),
    );
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
pub async fn launch_tapplet(
    installed_tapplet_id: i32,
    shutdown_tokens: tauri::State<'_, ShutdownTokens>,
    db_connection: tauri::State<'_, DatabaseConnection>,
    app_handle: tauri::AppHandle,
) -> Result<LaunchedTappResult, String> {
    let mut locked_tokens = shutdown_tokens.0.lock().await;
    let mut store = SqliteStore::new(db_connection.0.clone());

    let (_installed_tapp, registered_tapp, tapp_version) = store
        .get_installed_tapplet_full_by_id(installed_tapplet_id)
        .map_err(|e| e.to_string())?;
    // get download path
    let tapplet_path = get_tapp_download_path(
        registered_tapp.registry_id,
        tapp_version.version.clone(),
        app_handle.clone(),
    )
    .map_err(|e| e.to_string())?;
    let file_path = tapplet_path.join(TAPPLET_ARCHIVE);

    // Extract the tapplet archieve each time before launching
    // This way make sure that local files have not been replaced and are not malicious
    let _ = extract(&file_path, &tapplet_path.clone())
        .await
        .inspect_err(|e| error!(target: LOG_TARGET, "❌ Error extracting file: {:?}", e))
        .map_err(|e| e.to_string())?;

    //TODO should compare integrity field with the one stored in db or from github manifest?
    match check_files_and_validate_checksum(tapp_version, tapplet_path.clone()) {
        Ok(is_valid) => {
            info!(target: LOG_TARGET,"✅ Checksum validation successfully with test result: {:?}", is_valid);
        }
        Err(e) => {
            error!(target: LOG_TARGET,"❌ Error validating checksum: {:?}", e);
            return Err(e.to_string());
        }
    }

    let permissions: TappletPermissions = match get_tapp_permissions(tapplet_path.clone()) {
        Ok(p) => p,
        Err(e) => {
            error!(target: LOG_TARGET,"Error getting permissions: {:?}", e);
            return Err(e.to_string());
        }
    };

    let dist_path = tapplet_path.join(TAPPLET_DIST_DIR);
    let handle_start = tauri::async_runtime::spawn(async move { start(dist_path).await });

    let (addr, cancel_token) = match handle_start.await {
        Ok(result) => result.map_err(|e| e.to_string())?,
        Err(e) => {
            error!(target: LOG_TARGET, "❌ Error handling tapplet start: {:?}", e);
            return Err(e.to_string());
        }
    };

    match locked_tokens.insert(installed_tapplet_id.clone(), cancel_token) {
        Some(_) => {
            return Err(TappletServerError(AlreadyRunning)).map_err(|e| e.to_string())?;
        }
        None => {}
    }

    Ok(LaunchedTappResult {
        endpoint: format!("http://{}", addr),
        permissions,
    })
}

/**
 *  REGISTERED TAPPLETS - FETCH DATA FROM MANIFEST JSON
 */
#[tauri::command]
pub async fn fetch_tapplets(
    app_handle: tauri::AppHandle,
    db_connection: tauri::State<'_, DatabaseConnection>,
) -> Result<(), String> {
    let tapplets = match fetch_tapp_registry_manifest().await {
        Ok(tapp) => tapp,
        Err(e) => {
            return Err(e.to_string());
        }
    };

    let mut store = SqliteStore::new(db_connection.0.clone());

    for tapplet_manifest in tapplets.registered_tapplets.values() {
        let inserted_tapplet = store
            .create(&CreateTapplet::from(tapplet_manifest))
            .map_err(|e| e.to_string())?;

        // TODO uncomment if audit data in manifest
        // for audit_data in tapplet_manifest.metadata.audits.iter() {
        //   store.create(
        //     &(CreateTappletAudit {
        //       tapplet_id: inserted_tapplet.id,
        //       auditor: &audit_data.auditor,
        //       report_url: &audit_data.report_url,
        //     })
        //   )?;
        // }

        for (version, version_data) in tapplet_manifest.versions.iter() {
            let _ = store
                .create(
                    &(CreateTappletVersion {
                        tapplet_id: inserted_tapplet.id,
                        version: &version,
                        integrity: &version_data.integrity,
                        registry_url: &version_data.registry_url,
                    }),
                )
                .map_err(|e| e.to_string());
        }
        match store.get_tapplet_assets_by_tapplet_id(inserted_tapplet.id.unwrap()) {
            Ok(Some(_)) => {}
            Ok(None) => {
                match download_asset(app_handle.clone(), inserted_tapplet.registry_id).await {
                    Ok(tapplet_assets) => {
                        let _ = store
                            .create(
                                &(CreateTappletAsset {
                                    tapplet_id: inserted_tapplet.id,
                                    icon_url: &tapplet_assets.icon_url,
                                    background_url: &tapplet_assets.background_url,
                                }),
                            )
                            .map_err(|e| e.to_string());
                    }
                    Err(e) => {
                        error!(target: LOG_TARGET, "Could not download tapplet assets: {}", e);
                    }
                }
            }
            Err(e) => {
                return Err(e.to_string());
            }
        }
    }
    Ok(())
}

/**
 * TAPPLETS REGISTRY - STORES ALL REGISTERED TAPPLETS IN THE TARI UNIVERSE
 */

#[tauri::command]
pub fn insert_tapp_registry_db(
    tapplet: CreateTapplet,
    db_connection: tauri::State<'_, DatabaseConnection>,
) -> Result<Tapplet, String> {
    let mut tapplet_store = SqliteStore::new(db_connection.0.clone());
    tapplet_store.create(&tapplet).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn read_tapp_registry_db(
    db_connection: tauri::State<'_, DatabaseConnection>,
) -> Result<Vec<Tapplet>, String> {
    let mut tapplet_store = SqliteStore::new(db_connection.0.clone());
    tapplet_store.get_all().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_assets_server_addr(state: tauri::State<'_, AssetServer>) -> Result<String, String> {
    Ok(format!("http://{}", state.addr))
}

#[tauri::command]
pub async fn download_and_extract_tapp(
    tapplet_id: i32,
    db_connection: tauri::State<'_, DatabaseConnection>,
    app_handle: tauri::AppHandle,
) -> Result<Tapplet, String> {
    let mut tapplet_store = SqliteStore::new(db_connection.0.clone());
    // let (tapp, tapp_version) = tapplet_store.get_registered_tapplet_with_version(tapplet_id);
    let (tapp, tapp_version) = match tapplet_store.get_registered_tapplet_with_version(tapplet_id) {
        Ok(tapp) => tapp,
        Err(e) => {
            return Err(e.to_string());
        }
    };

    // get download path
    let tapplet_path = get_tapp_download_path(
        tapp.registry_id.clone(),
        tapp_version.version.clone(),
        app_handle.clone(),
    )
    .unwrap_or_default();
    // download tarball
    let url = tapp_version.registry_url.clone();
    let file_path = tapplet_path.join(TAPPLET_ARCHIVE);
    let destination_dir = file_path.clone();
    let progress_tracker = ProgressTracker::new(
        app_handle
            .get_window("main")
            .expect("Could not get main window")
            .clone(),
    );
    let handle_download = tauri::async_runtime::spawn(async move {
        download_file_with_retries(&url, &destination_dir, progress_tracker).await
    });
    let _ = handle_download
        .await
        .inspect_err(|e| error!(target: LOG_TARGET, "❌ Error downloading file: {:?}", e))
        .map_err(|_| {
            Error::RequestError(FailedToDownload {
                url: tapp_version.registry_url.clone(),
            })
        });

    let _ = extract(&file_path, &tapplet_path.clone())
        .await
        .inspect_err(|e| error!(target: LOG_TARGET, "❌ Error extracting file: {:?}", e));
    //TODO should compare integrity field with the one stored in db or from github manifest?
    match check_files_and_validate_checksum(tapp_version, tapplet_path.clone()) {
        Ok(is_valid) => {
            info!(target: LOG_TARGET,"✅ Checksum validation successfully with test result: {:?}", is_valid);
        }
        Err(e) => {
            error!(target: LOG_TARGET,"🚨 Error validating checksum: {:?}", e);
            return Err(e.to_string());
        }
    }
    Ok(tapp)
}

/**
 * INSTALLED TAPPLETS - STORES ALL THE USER'S INSTALLED TAPPLETS
 */

#[tauri::command]
pub fn insert_installed_tapp_db(
    tapplet_id: i32,
    db_connection: tauri::State<'_, DatabaseConnection>,
) -> Result<InstalledTapplet, Error> {
    let mut tapplet_store = SqliteStore::new(db_connection.0.clone());
    let (tapp, version_data) = tapplet_store.get_registered_tapplet_with_version(tapplet_id)?;

    let installed_tapplet = CreateInstalledTapplet {
        tapplet_id: tapp.id,
        tapplet_version_id: version_data.id,
    };
    tapplet_store.create(&installed_tapplet)
}

#[tauri::command]
pub fn read_installed_tapp_db(
    db_connection: tauri::State<'_, DatabaseConnection>,
) -> Result<Vec<InstalledTappletWithName>, Error> {
    let mut tapplet_store = SqliteStore::new(db_connection.0.clone());
    tapplet_store.get_installed_tapplets_with_display_name()
}

#[tauri::command]
pub fn update_installed_tapp_db(
    tapplet: UpdateInstalledTapplet,
    db_connection: tauri::State<'_, DatabaseConnection>,
) -> Result<usize, Error> {
    let mut tapplet_store = SqliteStore::new(db_connection.0.clone());
    let tapplets: Vec<InstalledTapplet> = tapplet_store.get_all()?;
    let first: InstalledTapplet = tapplets.into_iter().next().unwrap();
    tapplet_store.update(first, &tapplet)
}

#[tauri::command]
pub fn delete_installed_tapp(
    tapplet_id: i32,
    db_connection: tauri::State<'_, DatabaseConnection>,
    app_handle: tauri::AppHandle,
) -> Result<usize, Error> {
    let mut store = SqliteStore::new(db_connection.0.clone());
    let (_installed_tapp, registered_tapp, tapp_version) =
        store.get_installed_tapplet_full_by_id(tapplet_id)?;
    let tapplet_path = get_tapp_download_path(
        registered_tapp.registry_id,
        tapp_version.version,
        app_handle,
    )
    .unwrap();
    delete_tapplet(tapplet_path)?;

    let installed_tapplet: InstalledTapplet = store.get_by_id(tapplet_id)?;
    store.delete(installed_tapplet)
}

#[tauri::command]
pub async fn add_dev_tapplet(
    endpoint: String,
    db_connection: tauri::State<'_, DatabaseConnection>,
) -> Result<DevTapplet, Error> {
    let manifest_endpoint = format!("{}/tapplet.manifest.json", endpoint);
    let manifest_res = reqwest::get(&manifest_endpoint)
        .await
        .map_err(|_| {
            RequestError(FetchManifestError {
                endpoint: endpoint.clone(),
            })
        })?
        .json::<DevTappletResponse>()
        .await
        .map_err(|_| {
            RequestError(ManifestResponseError {
                endpoint: endpoint.clone(),
            })
        })?;
    let mut store = SqliteStore::new(db_connection.0.clone());
    let new_dev_tapplet = CreateDevTapplet {
        endpoint: &endpoint,
        package_name: &manifest_res.package_name,
        display_name: &manifest_res.display_name,
    };
    let dev_tapplet = store.create(&new_dev_tapplet);
    info!(target: LOG_TARGET,"✅ Dev tapplet added to db successfully: {:?}", new_dev_tapplet);
    dev_tapplet
}

#[tauri::command]
pub fn read_dev_tapplets(
    db_connection: tauri::State<'_, DatabaseConnection>,
) -> Result<Vec<DevTapplet>, Error> {
    let mut store = SqliteStore::new(db_connection.0.clone());
    store.get_all()
}

#[tauri::command]
pub fn delete_dev_tapplet(
    dev_tapplet_id: i32,
    db_connection: tauri::State<'_, DatabaseConnection>,
) -> Result<usize, Error> {
    let mut store = SqliteStore::new(db_connection.0.clone());
    let dev_tapplet: DevTapplet = store.get_by_id(dev_tapplet_id)?;
    store.delete(dev_tapplet)
}
