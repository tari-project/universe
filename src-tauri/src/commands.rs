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

use crate::airdrop::{get_der_encode_pub_key, get_websocket_key};
use crate::app_in_memory_config::{AppInMemoryConfig, ExchangeMiner, DEFAULT_EXCHANGE_ID};
use crate::auto_launcher::AutoLauncher;
use crate::binaries::{Binaries, BinaryResolver};
use crate::configs::config_core::{AirdropTokens, ConfigCore, ConfigCoreContent};
use crate::configs::config_mining::{
    ConfigMining, ConfigMiningContent, MiningModeType, PauseOnBatteryModeState,
};
use crate::configs::config_pools::{ConfigPools, ConfigPoolsContent};
use crate::configs::config_ui::{ConfigUI, ConfigUIContent, DisplayMode};
use crate::configs::config_wallet::{ConfigWallet, ConfigWalletContent, WalletId};
use crate::configs::pools::BasePoolData;
use crate::configs::pools::{cpu_pools::CpuPool, gpu_pools::GpuPool};
use crate::configs::trait_config::ConfigImpl;
use crate::event_scheduler::{EventScheduler, SchedulerEventTiming, SchedulerEventType};
use crate::events::ConnectionStatusPayload;
use crate::events_emitter::EventsEmitter;
use crate::events_manager::EventsManager;
use crate::internal_wallet::{mnemonic_to_tari_cipher_seed, InternalWallet, PaperWalletConfig};
use crate::mining::cpu::manager::CpuManager;
use crate::mining::gpu::consts::{EngineType, GpuMinerType};
use crate::mining::gpu::manager::GpuManager;
use crate::mining::pools::cpu_pool_manager::CpuPoolManager;
use crate::mining::pools::gpu_pool_manager::GpuPoolManager;
use crate::mining::pools::PoolManagerInterfaceTrait;
use crate::node::node_adapter::BaseNodeStatus;
use crate::node::node_manager::NodeType;
use crate::pin::PinManager;
use crate::release_notes::ReleaseNotes;
use crate::setup::setup_manager::{SetupManager, SetupPhase};
use crate::shutdown_manager::{ShutdownManager, ShutdownMode};
use crate::system_dependencies::system_dependencies_manager::SystemDependenciesManager;
use crate::systemtray_manager::{SystemTrayEvents, SystemTrayManager};
use crate::tapplets::interface::ActiveTapplet;
use crate::tapplets::tapplet_server::start_tapplet;
use crate::tasks_tracker::TasksTrackers;
use crate::tor_adapter::TorConfig;
use crate::utils::address_utils::verify_send;
use crate::utils::app_flow_utils::FrontendReadyChannel;
use crate::wallet::wallet_manager::WalletManagerError;
use crate::wallet::wallet_types::{TariAddressVariants, TransactionInfo};
use crate::{airdrop, UniverseAppState};

use base64::prelude::*;
use log::{debug, error, info, warn};
use regex::Regex;
use serde::{Deserialize, Serialize};
use std::fmt::Debug;
use std::fs::{read_dir, remove_dir_all, remove_file, File};
use std::str::FromStr;
use std::sync::atomic::Ordering;
use std::thread::sleep;
use std::time::{Duration, Instant};
use tari_common::configuration::Network;
use tari_common_types::seeds::mnemonic::{Mnemonic, MnemonicLanguage};
use tari_common_types::seeds::mnemonic_wordlists::MNEMONIC_ENGLISH_WORDS;
use tari_common_types::tari_address::dual_address::DualAddress;
use tari_common_types::tari_address::{TariAddress, TariAddressFeatures};
use tari_transaction_components::tari_amount::{MicroMinotari, Minotari};
use tari_utilities::encoding::MBase58;
use tari_utilities::SafePassword;
use tauri::ipc::InvokeError;
use tauri::Manager;
use urlencoding::encode;

const MAX_ACCEPTABLE_COMMAND_TIME: Duration = Duration::from_secs(1);
const LOG_TARGET: &str = "tari::universe::commands";
const LOG_TARGET_WEB: &str = "tari::universe::web";

#[derive(Debug, Serialize)]
pub struct ApplicationsInformation {
    version: String,
    port: Option<u16>,
}

#[derive(Debug, Serialize)]
pub struct ApplicationsVersions {
    tari_universe: ApplicationsInformation,
    xmrig: ApplicationsInformation,
    minotari_node: ApplicationsInformation,
    mm_proxy: ApplicationsInformation,
    wallet: ApplicationsInformation,
    xtrgpuminer: ApplicationsInformation,
    bridge: ApplicationsInformation,
}

#[derive(Deserialize, Serialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct SignWsDataResponse {
    pub signature: String,
    pub pub_key: String,
}

#[tauri::command]
pub async fn select_exchange_miner(
    app_handle: tauri::AppHandle,
    exchange_miner: ExchangeMiner,
    mining_address: String,
) -> Result<(), String> {
    let new_external_tari_address =
        TariAddress::from_str(&mining_address).map_err(|e| format!("Invalid Tari address: {e}"))?;

    // Validate PIN if pin locked
    let _unused = PinManager::get_validated_pin_if_defined(&app_handle)
        .await
        .map_err(|e| e.to_string())?;

    match InternalWallet::initialize_seedless(&app_handle, Some(new_external_tari_address)).await {
        Ok(_) => {
            log::info!(target: LOG_TARGET, "Internal wallet initialized successfully after \"select_exchange_miner\"");
        }
        Err(e) => {
            // Handle this critical error
            error!(target: LOG_TARGET, "Error loading internal wallet: {e:?}");
        }
    }

    ConfigCore::update_field(
        ConfigCoreContent::set_exchange_id,
        exchange_miner.id.clone(),
    )
    .await
    .map_err(|e| e.to_string())?;

    EventsEmitter::emit_exchange_id_changed(exchange_miner.id.clone()).await;

    SetupManager::get_instance()
        .restart_phases(vec![SetupPhase::Wallet, SetupPhase::CpuMining])
        .await;

    Ok(())
}

#[tauri::command]
pub async fn frontend_ready(
    app: tauri::AppHandle,
    state: tauri::State<'_, UniverseAppState>,
) -> Result<(), String> {
    static FRONTEND_READY_CALLED: std::sync::atomic::AtomicBool =
        std::sync::atomic::AtomicBool::new(false);
    if FRONTEND_READY_CALLED.load(Ordering::SeqCst) {
        return Ok(());
    }
    FRONTEND_READY_CALLED.store(true, Ordering::SeqCst);

    EventsEmitter::load_app_handle(app.clone()).await;
    FrontendReadyChannel::current().set_ready();

    let state_inner = state.inner().clone();

    TasksTrackers::current()
        .common
        .get_task_tracker()
        .await
        .spawn(async move {
            // Give the splash screen a few seconds to show before closing it
            sleep(Duration::from_secs(3));
            EventsEmitter::emit_close_splashscreen().await;
            let _unused = ReleaseNotes::current()
                .handle_release_notes_event_emit(state_inner, app)
                .await;
        });

    Ok(())
}

#[tauri::command]
pub async fn download_and_start_installer(id: String) -> Result<(), String> {
    let timer = Instant::now();

    SystemDependenciesManager::get_instance()
        .download_and_install_missing_dependencies(id)
        .await
        .map_err(|e| e.to_string())?;

    SystemDependenciesManager::get_instance()
        .validate_dependencies()
        .await
        .map_err(|e| e.to_string())?;

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
    app: tauri::AppHandle,
    state: tauri::State<'_, UniverseAppState>,
) -> Result<(), String> {
    // When exit is called from here I can see that it triggers the RunEvent::Exit without triggering the RunEvent::ExitRequested before
    // Cleaning up processes in RunEvent::Exit is not reliable as it does not always get triggered properly so we doing it here

    info!(target: LOG_TARGET, "Exit application command received, shutting down processes...");

    let _unused = GpuManager::write().await.stop_mining().await;
    info!(target: LOG_TARGET, "GPU Mining stopped.");

    let _unused = CpuManager::write().await.stop_mining().await;
    info!(target: LOG_TARGET, "CPU Mining stopped.");

    TasksTrackers::current().stop_all_processes().await;
    GpuManager::read().await.on_app_exit().await;
    CpuManager::read().await.on_app_exit().await;
    state.tor_manager.on_app_exit().await;
    state.wallet_manager.on_app_exit().await;
    state.node_manager.on_app_exit().await;

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
    info!(target: LOG_TARGET, "Fetched default bridges: {bridges:?}");
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
) -> Result<AppInMemoryConfig, ()> {
    let timer = Instant::now();
    let res = state.in_memory_config.read().await.clone();
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
    state: tauri::State<'_, UniverseAppState>,
    app: tauri::AppHandle,
) -> Result<ApplicationsVersions, String> {
    let timer = Instant::now();
    let binary_resolver = BinaryResolver::current();

    let mmp_port = &state.mm_proxy_manager.get_port().await;
    // let cpu_miner = &state.cpu_miner.read().await;
    // let xmrig_port = &cpu_miner.get_port().await;
    // let gpu_miner = &state.gpu_miner.read().await;
    // let xtr_port = gpu_miner.get_port().await;
    let wallet_port = &state.wallet_manager.get_port().await;
    let node_manager = &state.node_manager;
    let node_port = node_manager
        .clone()
        .get_grpc_port()
        .await
        .expect("Could not get grpc_address");

    let tari_universe_version = app.package_info().version.clone();
    let xmrig_version = binary_resolver.get_binary_version(Binaries::Xmrig).await;

    let minotari_node_version = binary_resolver
        .get_binary_version(Binaries::MinotariNode)
        .await;
    let mm_proxy_version = binary_resolver
        .get_binary_version(Binaries::MergeMiningProxy)
        .await;
    let wallet_version = binary_resolver.get_binary_version(Binaries::Wallet).await;
    let xtrgpuminer_version = binary_resolver.get_binary_version(Binaries::Glytex).await;
    let bridge_version = binary_resolver
        .get_binary_version(Binaries::BridgeTapplet)
        .await;

    if timer.elapsed() > MAX_ACCEPTABLE_COMMAND_TIME {
        warn!(target: LOG_TARGET,
            "get_applications_versions took too long: {:?}",
            timer.elapsed()
        );
    }

    Ok(ApplicationsVersions {
        tari_universe: ApplicationsInformation {
            version: tari_universe_version.to_string(),
            port: None,
        },
        minotari_node: ApplicationsInformation {
            version: minotari_node_version,
            port: Some(node_port),
        },
        xmrig: ApplicationsInformation {
            version: xmrig_version,
            // port: Some(*xmrig_port),
            port: Some(0),
        },
        mm_proxy: ApplicationsInformation {
            version: mm_proxy_version,
            port: Some(*mmp_port),
        },
        wallet: ApplicationsInformation {
            version: wallet_version,
            port: Some(*wallet_port),
        },
        xtrgpuminer: ApplicationsInformation {
            version: xtrgpuminer_version,
            port: Some(0),
        },
        bridge: ApplicationsInformation {
            version: bridge_version,
            port: None,
        },
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
pub async fn get_monero_seed_words(app_handle: tauri::AppHandle) -> Result<Vec<String>, String> {
    let timer = Instant::now();

    let pin_password = PinManager::get_validated_pin_if_defined(&app_handle)
        .await
        .map_err(|e| e.to_string())?;
    let monero_seed = InternalWallet::get_monero_seed(pin_password)
        .await
        .map_err(|e| e.to_string())?;

    let result = monero_seed.seed_words().map_err(|e| {
        log::error!(target: LOG_TARGET, "get_monero_seed_words: error getting seed words: {e:?}");
        e.to_string()
    });

    if timer.elapsed() > MAX_ACCEPTABLE_COMMAND_TIME {
        warn!(target: LOG_TARGET, "get_monero_seed_words took too long: {:?}", timer.elapsed());
    }
    result
}

#[tauri::command]
pub async fn get_paper_wallet_details(
    state: tauri::State<'_, UniverseAppState>,
    auth_uuid: Option<String>,
    app_handle: tauri::AppHandle,
) -> Result<PaperWalletConfig, InvokeError> {
    let timer = Instant::now();

    let wallet_balance = state
        .wallet_state_watch_rx
        .borrow()
        .clone()
        .and_then(|state| state.balance);

    warn!(target: LOG_TARGET, "auth_uuid {auth_uuid:?}");
    let anon_id = ConfigCore::content().await.anon_id().clone();

    let pin_password = PinManager::get_validated_pin_if_defined(&app_handle)
        .await
        .map_err(|e| e.to_string())?;
    let tari_cipher_seed = InternalWallet::get_tari_seed(pin_password)
        .await
        .map_err(InvokeError::from_anyhow)?;
    let raw_passphrase = phraze::generate_a_passphrase(5, "-", false, &MNEMONIC_ENGLISH_WORDS);
    let seed_file = tari_cipher_seed
        .encipher(Some(SafePassword::from(&raw_passphrase)))
        .map_err(|e| InvokeError::from_anyhow(anyhow::anyhow!(e.to_string())))?;
    let seed_words_encrypted_base58 = seed_file.to_monero_base58();
    let network = Network::get_current_or_user_setting_or_default()
        .to_string()
        .trim()
        .to_lowercase();

    let mut link = format!(
        "tari://{}/paper_wallet?private_key={}&anon_id={}",
        network,
        seed_words_encrypted_base58,
        encode(&anon_id),
    );
    // Add wallet_balance as a query parameter if it exists
    if let Some(balance) = &wallet_balance {
        let available_balance = balance.available_balance
            + balance.timelocked_balance
            + balance.pending_incoming_balance;

        link.push_str(&format!(
            "&balance={}",
            encode(&available_balance.to_string())
        ));
    }
    // Add auth_uuid as a query parameter if it exists
    if let Some(uuid) = &auth_uuid {
        link.push_str(&format!("&tt={}", encode(uuid)));
    }

    if timer.elapsed() > MAX_ACCEPTABLE_COMMAND_TIME {
        warn!(target: LOG_TARGET, "get_paper_wallet_details took too long: {:?}", timer.elapsed());
    };
    Ok(PaperWalletConfig {
        qr_link: link,
        password: raw_passphrase,
    })
}

#[tauri::command]
pub async fn get_seed_words(app_handle: tauri::AppHandle) -> Result<Vec<String>, String> {
    let timer = Instant::now();

    let pin_password = PinManager::get_validated_pin_if_defined(&app_handle)
        .await
        .map_err(|e| e.to_string())?;
    let tari_cipher_seed = InternalWallet::get_tari_seed(pin_password)
        .await
        .map_err(|e| e.to_string())?;
    let seed_words = tari_cipher_seed
        .to_mnemonic(MnemonicLanguage::English, None)
        .map_err(|e| e.to_string())?;

    let mut res = vec![];
    for i in 0..seed_words.len() {
        match seed_words.get_word(i) {
            Ok(word) => res.push(word.clone()),
            Err(error) => {
                error!(target: LOG_TARGET, "Could not get seed word: {error:?}");
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
    app_handle: tauri::AppHandle,
    address: String,
) -> Result<(), InvokeError> {
    let timer = Instant::now();

    SetupManager::get_instance()
        .shutdown_phases(vec![SetupPhase::Wallet, SetupPhase::CpuMining])
        .await;

    // Validate PIN if pin locked
    let _unused = PinManager::get_validated_pin_if_defined(&app_handle)
        .await
        .map_err(InvokeError::from_anyhow)?;

    let new_external_tari_address =
        TariAddress::from_str(&address).map_err(|e| format!("Invalid Tari address: {e}"))?;
    InternalWallet::initialize_seedless(&app_handle, Some(new_external_tari_address))
        .await
        .map_err(InvokeError::from_anyhow)?;

    if timer.elapsed() > MAX_ACCEPTABLE_COMMAND_TIME {
        warn!(target: LOG_TARGET, "set_tari_address took too long: {:?}", timer.elapsed());
    }
    Ok(())
}

#[tauri::command]
pub async fn confirm_exchange_address(
    app_handle: tauri::AppHandle,
    address: String,
) -> Result<(), InvokeError> {
    let timer = Instant::now();
    let new_external_tari_address =
        TariAddress::from_str(&address).map_err(|e| format!("Invalid Tari address: {e}"))?;

    InternalWallet::initialize_seedless(&app_handle, Some(new_external_tari_address))
        .await
        .map_err(InvokeError::from_anyhow)?;

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
pub async fn get_transactions(
    state: tauri::State<'_, UniverseAppState>,
    offset: Option<u32>,
    limit: Option<u32>,
    status_bitflag: Option<u32>,
) -> Result<Vec<TransactionInfo>, String> {
    let timer = Instant::now();
    let transactions = state
        .wallet_manager
        .get_transactions(offset, limit, status_bitflag)
        .await
        .unwrap_or_else(|e| {
            if !matches!(e, WalletManagerError::WalletNotStarted) {
                warn!(target: LOG_TARGET, "Error getting transactions: {e}");
            }
            vec![]
        });

    if timer.elapsed() > MAX_ACCEPTABLE_COMMAND_TIME {
        warn!(target: LOG_TARGET, "get_transactions took too long: {:?}", timer.elapsed());
    }

    Ok(transactions)
}

#[tauri::command]
pub async fn forgot_pin(
    seed_words: Vec<String>,
    app_handle: tauri::AppHandle,
) -> Result<(), String> {
    let tari_cipher_seed = mnemonic_to_tari_cipher_seed(seed_words)
        .await
        .map_err(|e| e.to_string())?;

    let extracted_wallet_details = InternalWallet::get_tari_wallet_details(
        WalletId::new("nonsense".to_string()),
        tari_cipher_seed.clone(),
    )
    .await
    .map_err(|e| e.to_string())?;

    if extracted_wallet_details.tari_address != InternalWallet::tari_address().await {
        error!(target: LOG_TARGET, "Seed words do not match current wallet address");
        return Err("Seed words do not match".to_string());
    }

    InternalWallet::recover_forgotten_pin(&app_handle, tari_cipher_seed)
        .await
        .map_err(|e| e.to_string())?;

    info!(target: LOG_TARGET, "PIN recovery completed successfully");
    Ok(())
}

#[tauri::command]
pub async fn import_seed_words(
    seed_words: Vec<String>,
    state: tauri::State<'_, UniverseAppState>,
    app_handle: tauri::AppHandle,
) -> Result<(), InvokeError> {
    let timer = Instant::now();

    SetupManager::get_instance()
        .shutdown_phases(vec![SetupPhase::Wallet, SetupPhase::CpuMining])
        .await;

    match InternalWallet::import_tari_seed_words(seed_words, &app_handle).await {
        Ok((wallet_id, _seed_binary)) => {
            ConfigCore::update_field(
                ConfigCoreContent::set_exchange_id,
                DEFAULT_EXCHANGE_ID.to_string(),
            )
            .await
            .map_err(InvokeError::from_anyhow)?;
            EventsEmitter::emit_exchange_id_changed(DEFAULT_EXCHANGE_ID.to_string()).await;
            log::info!(target: LOG_TARGET, "Seed words imported successfully for wallet #{wallet_id:?}");
        }
        Err(e) => {
            error!(target: LOG_TARGET, "Error importing seed words by internal wallet: {e:?}");
            return Err(InvokeError::from_anyhow(e));
        }
    }

    let base_path = app_handle
        .path()
        .app_local_data_dir()
        .map_err(|_| "Could not find wallet data dir".to_string())?;
    state
        .wallet_manager
        .clean_data_folder(&base_path)
        .await
        .map_err(|e| e.to_string())?;

    SetupManager::get_instance()
        .resume_phases(vec![SetupPhase::Wallet, SetupPhase::CpuMining])
        .await;

    if timer.elapsed() > MAX_ACCEPTABLE_COMMAND_TIME {
        warn!(target: LOG_TARGET, "import_seed_words took too long: {:?}", timer.elapsed());
    }
    Ok(())
}

#[tauri::command]
pub async fn revert_to_internal_wallet(
    _window: tauri::Window,
    app_handle: tauri::AppHandle,
) -> Result<(), InvokeError> {
    let timer = Instant::now();

    SetupManager::get_instance()
        .shutdown_phases(vec![SetupPhase::Wallet, SetupPhase::CpuMining])
        .await;

    InternalWallet::initialize_with_seed(&app_handle)
        .await
        .map_err(InvokeError::from_anyhow)?;
    ConfigCore::update_field(
        ConfigCoreContent::set_exchange_id,
        DEFAULT_EXCHANGE_ID.to_string(),
    )
    .await
    .map_err(InvokeError::from_anyhow)?;
    EventsEmitter::emit_exchange_id_changed(DEFAULT_EXCHANGE_ID.to_string()).await;

    SetupManager::get_instance()
        .resume_phases(vec![SetupPhase::Wallet, SetupPhase::CpuMining])
        .await;

    if timer.elapsed() > MAX_ACCEPTABLE_COMMAND_TIME {
        warn!(target: LOG_TARGET, "revert_to_internal_wallet took too long: {:?}", timer.elapsed());
    }
    Ok(())
}

#[tauri::command]
pub fn log_web_message(level: String, message: Vec<String>) {
    let joined_message = message.join(" ");
    match level.as_str() {
        "error" => {
            error!(target: LOG_TARGET_WEB, "{joined_message}")
        }
        _ => info!(target: LOG_TARGET_WEB, "{joined_message}"),
    }
}

#[tauri::command]
pub fn open_log_dir(app: tauri::AppHandle) {
    let log_dir = app.path().app_log_dir().expect("Could not get log dir");
    if let Err(e) = open::that(log_dir) {
        error!(target: LOG_TARGET, "Could not open log dir: {e:?}");
    }
}

async fn reset_app_configs(
    app_handle: &tauri::AppHandle,
    reset_wallet: bool,
) -> Result<(), anyhow::Error> {
    let app_config_dir = app_handle.path().app_config_dir()?;
    let universe_app_configs_dir = app_config_dir
        .join("app_configs")
        .join(Network::get_current().as_key_str());

    if reset_wallet {
        log::info!(target: LOG_TARGET, "[reset_app_configs] Resetting with wallet.");
        remove_dir_all(&universe_app_configs_dir).map_err(|e| {
            error!(target: LOG_TARGET, "[reset_app_configs] Could not remove {universe_app_configs_dir:?} directory: {e:?}");
            anyhow::anyhow!("Could not remove directory: {e}")
        })?;
    } else {
        log::info!(target: LOG_TARGET, "[reset_app_configs] Resetting without wallet.");
        // remove all configs but not "config_wallet.json"
        let config_files = std::fs::read_dir(&universe_app_configs_dir)?;
        for entry in config_files {
            let entry = entry?;
            let path = entry.path();
            if path.is_file() && path.file_name().unwrap_or_default() != "config_wallet.json" {
                std::fs::remove_file(path)?;
            }
        }
    }

    Ok(())
}

#[allow(clippy::too_many_lines)]
#[tauri::command]
pub async fn reset_settings(
    reset_wallet: bool,
    app_handle: tauri::AppHandle,
) -> Result<(), String> {
    if reset_wallet {
        // Validate PIN if pin locked
        let _unused = PinManager::get_validated_pin_if_defined(&app_handle)
            .await
            .map_err(|e| e.to_string())?;
        log::info!(target: LOG_TARGET, "[reset_settings] Pin successfully validated");
    }

    let _unused = GpuManager::write().await.stop_mining().await;
    let _unused = CpuManager::write().await.stop_mining().await;
    TasksTrackers::current().stop_all_processes().await;

    let network = Network::get_current_or_user_setting_or_default().as_key_str();
    let app_config_dir = app_handle.path().app_config_dir();
    let app_cache_dir = app_handle.path().app_cache_dir();
    let app_data_dir = app_handle.path().app_data_dir();
    let app_local_data_dir = app_handle.path().app_local_data_dir();

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
        error!(target: LOG_TARGET, "Could not get app directories for {valid_dir_paths:?}");
        return Err("Could not get app directories".to_string());
    }
    let mut folder_block_list = Vec::new();
    folder_block_list.push("EBWebView");

    let mut files_block_list = Vec::new();
    if reset_wallet {
        debug!(target: LOG_TARGET, "[reset_settings] Clearing all wallets");
        InternalWallet::clear_all_wallets()
            .await
            .map_err(|e| e.to_string())?;
    } else {
        folder_block_list.push("wallet");
        files_block_list.push("credentials_backup.bin");
    }
    // handle App Config reset individually
    folder_block_list.push("app_configs");
    reset_app_configs(&app_handle, reset_wallet)
        .await
        .map_err(|e| e.to_string())?;

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
                                    .map(|e| e.file_name() == "wallet_config.json") // legacy wallet config
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
                        error!(target: LOG_TARGET, "[reset_settings] Could not remove {path:?} directory: {e:?}");
                        format!("Could not remove directory: {e}")
                    })?;
                } else {
                    if let Some(file_name) = path.file_name().and_then(|name| name.to_str()) {
                        if files_block_list.contains(&file_name) {
                            continue;
                        }
                    }

                    remove_file(path.clone()).map_err(|e| {
                        error!(target: LOG_TARGET, "[reset_settings] Could not remove {path:?} file: {e:?}");
                        format!("Could not remove file: {e}")
                    })?;
                }
            }
        }
    }

    info!(target: LOG_TARGET, "[reset_settings] Restarting the app");
    app_handle.restart()
}

#[tauri::command]
pub async fn restart_application(
    _window: tauri::Window,
    app: tauri::AppHandle,
) -> Result<(), String> {
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
    let app_log_dir = app.path().app_log_dir().expect("Could not get log dir.");
    let app_config_dir = app
        .path()
        .app_config_dir()
        .expect("Could not get app config dir.");

    let reference = state
        .feedback
        .read()
        .await
        .send_feedback(
            feedback,
            include_logs,
            app_log_dir.clone(),
            app_config_dir.clone(),
        )
        .await
        .inspect_err(|e| error!("error at send_feedback {e:?}"))
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
pub async fn set_cpu_mining_enabled(enabled: bool) -> Result<(), InvokeError> {
    let timer = Instant::now();
    let _unused =
        ConfigMining::update_field(ConfigMiningContent::set_cpu_mining_enabled, enabled).await;

    SystemTrayManager::send_event(SystemTrayEvents::CpuMiningState(enabled)).await;

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
pub async fn toggle_device_exclusion(device_index: u32, excluded: bool) -> Result<(), String> {
    if excluded {
        info!(target: LOG_TARGET, "Excluding device {device_index}");
        ConfigMining::update_field(
            ConfigMiningContent::enable_gpu_device_exclusion,
            device_index,
        )
        .await
        .map_err(|e| e.to_string())?;
    } else {
        info!(target: LOG_TARGET, "Including device {device_index}");
        ConfigMining::update_field(
            ConfigMiningContent::disable_gpu_device_exclusion,
            device_index,
        )
        .await
        .map_err(|e| e.to_string())?;
    }

    Ok(())
}

#[tauri::command]
pub async fn set_gpu_mining_enabled(enabled: bool) -> Result<(), InvokeError> {
    let timer = Instant::now();

    ConfigMining::update_field(ConfigMiningContent::set_gpu_mining_enabled, enabled)
        .await
        .map_err(InvokeError::from_anyhow)?;

    SystemTrayManager::send_event(SystemTrayEvents::GpuMiningState(enabled)).await;

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
pub async fn select_mining_mode(mode: String) -> Result<(), InvokeError> {
    let timer = Instant::now();
    info!(target: LOG_TARGET, "[select_mining_mode] called with mode: {mode:?}");

    ConfigMining::update_field(ConfigMiningContent::set_selected_mining_mode, mode.clone())
        .await
        .map_err(InvokeError::from_anyhow)?;

    if mode != "Eco" {
        ConfigMining::update_field(ConfigMiningContent::set_eco_alert_needed, false)
            .await
            .map_err(InvokeError::from_anyhow)?;
    }

    SystemTrayManager::send_event(SystemTrayEvents::MiningMode(MiningModeType::from(
        mode.clone(),
    )))
    .await;

    if timer.elapsed() > MAX_ACCEPTABLE_COMMAND_TIME {
        warn!(target: LOG_TARGET, "select_mining_mode took too long: {:?}", timer.elapsed());
    }
    Ok(())
}

#[tauri::command]
pub async fn update_custom_mining_mode(
    custom_cpu_usage: u32,
    custom_gpu_usage: u32,
) -> Result<(), InvokeError> {
    let timer = Instant::now();
    info!(target: LOG_TARGET, "[update_custom_mining_mode] called with custom_cpu_usage: {custom_cpu_usage:?}, custom_gpu_usage: {custom_gpu_usage:?}");

    ConfigMining::update_field(
        ConfigMiningContent::update_custom_mode_cpu_usage,
        custom_cpu_usage,
    )
    .await
    .map_err(InvokeError::from_anyhow)?;

    ConfigMining::update_field(
        ConfigMiningContent::update_custom_mode_gpu_usage,
        custom_gpu_usage,
    )
    .await
    .map_err(InvokeError::from_anyhow)?;

    if timer.elapsed() > MAX_ACCEPTABLE_COMMAND_TIME {
        warn!(target: LOG_TARGET, "update_custom_mining_mode took too long: {:?}", timer.elapsed());
    }
    Ok(())
}

#[tauri::command]
pub async fn set_monero_address(monero_address: String) -> Result<(), InvokeError> {
    let timer = Instant::now();
    SetupManager::get_instance()
        .add_phases_to_restart_queue(vec![SetupPhase::CpuMining])
        .await;

    InternalWallet::set_external_monero_address(monero_address)
        .await
        .map_err(InvokeError::from_anyhow)?;

    SetupManager::get_instance()
        .restart_phases_from_queue()
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
) -> Result<(), InvokeError> {
    let timer = Instant::now();
    info!(target: LOG_TARGET, "[set_monerod_config] called with use_monero_fail: {use_monero_fail:?}, monero_nodes: {monero_nodes:?}");
    ConfigCore::update_field_requires_restart(
        ConfigCoreContent::set_mmproxy_monero_nodes,
        monero_nodes.clone(),
        vec![SetupPhase::CpuMining],
    )
    .await
    .map_err(InvokeError::from_anyhow)?;

    ConfigCore::update_field_requires_restart(
        ConfigCoreContent::set_mmproxy_use_monero_failover,
        use_monero_fail,
        vec![SetupPhase::CpuMining],
    )
    .await
    .map_err(InvokeError::from_anyhow)?;

    SetupManager::get_instance()
        .restart_phases_from_queue()
        .await;

    if timer.elapsed() > MAX_ACCEPTABLE_COMMAND_TIME {
        warn!(target: LOG_TARGET, "set_monerod_config took too long: {:?}", timer.elapsed());
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
) -> Result<TorConfig, String> {
    let timer = Instant::now();
    info!(target: LOG_TARGET, "[set_tor_config] called with config: {config:?}");
    let tor_config = state
        .tor_manager
        .set_tor_config(config)
        .await
        .map_err(|e| e.to_string())?;

    SetupManager::get_instance()
        .restart_phases(vec![SetupPhase::Node, SetupPhase::Wallet])
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
        vec![SetupPhase::Node, SetupPhase::Wallet],
    )
    .await
    .map_err(InvokeError::from_anyhow)?;

    SetupManager::get_instance()
        .restart_phases_from_queue()
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
pub async fn set_airdrop_tokens(airdrop_tokens: Option<AirdropTokens>) -> Result<(), InvokeError> {
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

    info!(target: LOG_TARGET, "New Airdrop tokens saved, user id changed:{user_id_changed:?}");
    if user_id_changed {
        // If the user id changed, we need to restart the cpu mining phases to ensure that the new telemetry_id ( unique_string value )is used
        SetupManager::get_instance()
            .restart_phases(vec![SetupPhase::CpuMining])
            .await;
    }
    Ok(())
}

#[tauri::command]
pub async fn start_cpu_mining() -> Result<(), String> {
    let timer = Instant::now();

    CpuManager::write()
        .await
        .start_mining()
        .await
        .map_err(|e| e.to_string())?;

    if timer.elapsed() > MAX_ACCEPTABLE_COMMAND_TIME {
        warn!(target: LOG_TARGET, "start_cpu_mining took too long: {:?}", timer.elapsed());
    }
    Ok(())
}
#[allow(clippy::too_many_lines)]
#[tauri::command]
pub async fn start_gpu_mining() -> Result<(), String> {
    let timer = Instant::now();

    GpuManager::write()
        .await
        .start_mining()
        .await
        .map_err(|e| e.to_string())?;

    if timer.elapsed() > MAX_ACCEPTABLE_COMMAND_TIME {
        warn!(target: LOG_TARGET, "start_gpu_mining took too long: {:?}", timer.elapsed());
    }

    Ok(())
}

#[tauri::command]
pub async fn stop_cpu_mining() -> Result<(), String> {
    let timer = Instant::now();

    CpuManager::write()
        .await
        .stop_mining()
        .await
        .map_err(|e| e.to_string())?;

    if timer.elapsed() > MAX_ACCEPTABLE_COMMAND_TIME {
        warn!(target: LOG_TARGET, "stop_cpu_mining took too long: {:?}", timer.elapsed());
    }

    Ok(())
}
#[tauri::command]
pub async fn stop_gpu_mining() -> Result<(), String> {
    let timer = Instant::now();

    GpuManager::write()
        .await
        .stop_mining()
        .await
        .map_err(|e| e.to_string())?;

    if timer.elapsed() > MAX_ACCEPTABLE_COMMAND_TIME {
        warn!(target: LOG_TARGET, "stop_cpu_mining took too long: {:?}", timer.elapsed());
    }
    Ok(())
}

#[tauri::command]
pub async fn switch_gpu_miner(gpu_miner_type: GpuMinerType) -> Result<(), String> {
    let timer = Instant::now();

    ConfigMining::update_field(
        ConfigMiningContent::set_gpu_miner_type,
        gpu_miner_type.clone(),
    )
    .await
    .map_err(|e| e.to_string())?;

    GpuManager::write()
        .await
        .switch_miner(gpu_miner_type.clone())
        .await
        .map_err(|e| e.to_string())?;

    if timer.elapsed() > MAX_ACCEPTABLE_COMMAND_TIME {
        warn!(target: LOG_TARGET, "switch_gpu_miner took too long: {:?}", timer.elapsed());
    }

    Ok(())
}

#[tauri::command]
pub async fn toggle_cpu_pool_mining(enabled: bool) -> Result<(), String> {
    let timer = Instant::now();

    if enabled {
        SetupManager::get_instance()
            .turn_on_cpu_pool_feature()
            .await
            .map_err(|e| e.to_string())?;
    } else {
        SetupManager::get_instance()
            .turn_off_cpu_pool_feature()
            .await
            .map_err(|e| e.to_string())?;
    }

    if timer.elapsed() > MAX_ACCEPTABLE_COMMAND_TIME {
        warn!(target: LOG_TARGET, "toggle_cpu_pool_mining took too long: {:?}", timer.elapsed());
    }

    Ok(())
}

#[tauri::command]
pub async fn toggle_gpu_pool_mining(enabled: bool) -> Result<(), String> {
    let timer = Instant::now();

    if enabled {
        SetupManager::get_instance()
            .turn_on_gpu_pool_feature()
            .await
            .map_err(|e| e.to_string())?;
    } else {
        SetupManager::get_instance()
            .turn_off_gpu_pool_feature()
            .await
            .map_err(|e| e.to_string())?;
    }

    if timer.elapsed() > MAX_ACCEPTABLE_COMMAND_TIME {
        warn!(target: LOG_TARGET, "toggle_gpu_pool_mining took too long: {:?}", timer.elapsed());
    }

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
        .try_update(app.clone(), true, !pre_release, Duration::from_secs(30))
        .await
        .map_err(|e| e.to_string())?;

    if timer.elapsed() > MAX_ACCEPTABLE_COMMAND_TIME {
        warn!(target: LOG_TARGET, "set_pre_release took too long: {:?}", timer.elapsed());
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
    _state: tauri::State<'_, UniverseAppState>,
    _app: tauri::AppHandle,
) -> Result<(), InvokeError> {
    info!(target: LOG_TARGET, "set_selected_engine called with engine: {selected_engine:?}");
    let timer = Instant::now();

    let engine_type = EngineType::from_string(selected_engine).map_err(InvokeError::from_anyhow)?;

    ConfigMining::update_field(ConfigMiningContent::set_gpu_engine, engine_type)
        .await
        .map_err(InvokeError::from_anyhow)?;

    if timer.elapsed() > MAX_ACCEPTABLE_COMMAND_TIME {
        warn!(target: LOG_TARGET, "proceed_with_update took too long: {:?}", timer.elapsed());
    }

    Ok(())
}

#[tauri::command]
pub async fn websocket_get_status(
    _: tauri::AppHandle,
    state: tauri::State<'_, UniverseAppState>,
) -> Result<String, String> {
    let status = state.websocket_manager_status_rx.borrow().clone();
    Ok(format!("{status:?}"))
}

#[tauri::command]
pub async fn reconnect() -> Result<(), String> {
    EventsEmitter::emit_connection_status_changed(ConnectionStatusPayload::InProgress).await;
    let setup_manager = SetupManager::get_instance();
    setup_manager.restart_phases(SetupPhase::all()).await;
    Ok(())
}

#[tauri::command]
pub async fn send_one_sided_to_stealth_address(
    state: tauri::State<'_, UniverseAppState>,
    app_handle: tauri::AppHandle,
    amount: String,
    destination: String,
    payment_id: Option<String>,
) -> Result<(), String> {
    let timer = Instant::now();
    info!(target: LOG_TARGET, "[send_one_sided_to_stealth_address] called with args: (amount: {amount:?}, destination: {destination:?}, payment_id: {payment_id:?})");
    state
        .wallet_manager
        .send_one_sided_to_stealth_address(amount, destination, payment_id, &app_handle)
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

    let mut available_balance = MicroMinotari::from(0);

    if let Some(wallet_balance) = &balance {
        available_balance = wallet_balance.available_balance
    }

    match m_amount.cmp(&available_balance) {
        std::cmp::Ordering::Less => Ok(()),
        _ => Err(InvokeError::from("Insufficient balance".to_string())),
    }
}

#[tauri::command]
pub async fn trigger_phases_restart() -> Result<(), InvokeError> {
    SetupManager::get_instance()
        .restart_phases_from_queue()
        .await;

    Ok(())
}

#[tauri::command]
pub async fn restart_phases(phases: Vec<SetupPhase>) -> Result<(), InvokeError> {
    SetupManager::get_instance().restart_phases(phases).await;

    Ok(())
}

#[tauri::command]
pub async fn set_node_type(
    mut node_type: NodeType,
    state: tauri::State<'_, UniverseAppState>,
    app_handle: tauri::AppHandle,
) -> Result<(), InvokeError> {
    // map LocalAfterRemote or unknown value to Local
    if node_type != NodeType::Local
        && node_type != NodeType::RemoteUntilLocal
        && node_type != NodeType::Remote
    {
        node_type = NodeType::Local;
    }

    let prev_node_type = state.node_manager.get_node_type().await;
    info!(target: LOG_TARGET, "[set_node_type] from {prev_node_type:?} to: {node_type:?}");

    let is_current_local = matches!(prev_node_type, NodeType::Local | NodeType::LocalAfterRemote);
    if is_current_local && node_type != NodeType::Remote {
        info!(target: LOG_TARGET, "[set_node_type] Local node is already running, no restart needed for node_type: {node_type:?}");
        ConfigCore::update_field(ConfigCoreContent::set_node_type, node_type.clone())
            .await
            .map_err(InvokeError::from_anyhow)?;

        if node_type == NodeType::RemoteUntilLocal {
            info!(target: LOG_TARGET, "[set_node_type] Converting RemoteUntilLocal to LocalAfterRemote since local node is running");
            node_type = NodeType::LocalAfterRemote
        }
    } else {
        info!(target: LOG_TARGET, "[set_node_type] Restarting required phases for node_type: {node_type:?}");
        ConfigCore::update_field_requires_restart(
            ConfigCoreContent::set_node_type,
            node_type.clone(),
            vec![SetupPhase::Node, SetupPhase::Wallet, SetupPhase::CpuMining],
        )
        .await
        .map_err(InvokeError::from_anyhow)?;
    }

    state.node_manager.set_node_type(node_type.clone()).await;
    EventsManager::handle_node_type_update(&app_handle).await;

    SetupManager::get_instance()
        .restart_phases_from_queue()
        .await;

    Ok(())
}

#[tauri::command]
pub async fn change_cpu_pool(cpu_pool: String) -> Result<(), InvokeError> {
    let timer = Instant::now();
    info!(target: LOG_TARGET, "[change_cpu_pool] called with cpu_pool: {cpu_pool:?}");

    ConfigPools::update_field(
        ConfigPoolsContent::set_current_cpu_pool,
        CpuPool::from_string(&cpu_pool).map_err(InvokeError::from_anyhow)?,
    )
    .await
    .map_err(InvokeError::from_anyhow)?;

    let cpu_pool_content = ConfigPools::content().await.current_cpu_pool();

    CpuPoolManager::handle_new_selected_pool(cpu_pool_content).await;

    if timer.elapsed() > MAX_ACCEPTABLE_COMMAND_TIME {
        warn!(target: LOG_TARGET, "change_cpu_pool took too long: {:?}", timer.elapsed());
    }
    Ok(())
}

#[tauri::command]
pub async fn change_gpu_pool(gpu_pool: String) -> Result<(), InvokeError> {
    let timer = Instant::now();
    info!(target: LOG_TARGET, "[change_gpu_pool] called with gpu_pool: {gpu_pool:?}");

    ConfigPools::update_field(
        ConfigPoolsContent::set_current_gpu_pool,
        GpuPool::from_string(&gpu_pool).map_err(InvokeError::from_anyhow)?,
    )
    .await
    .map_err(InvokeError::from_anyhow)?;

    let gpu_pool_content = ConfigPools::content().await.current_gpu_pool();

    GpuPoolManager::handle_new_selected_pool(gpu_pool_content).await;

    if timer.elapsed() > MAX_ACCEPTABLE_COMMAND_TIME {
        warn!(target: LOG_TARGET, "change_gpu_pool took too long: {:?}", timer.elapsed());
    }
    Ok(())
}

#[tauri::command]
pub async fn update_selected_gpu_pool_config(
    updated_config: BasePoolData<GpuPool>,
) -> Result<(), InvokeError> {
    let timer = Instant::now();
    info!(target: LOG_TARGET, "[update_selected_gpu_pool_config] called with updated_config: {updated_config:?}");

    ConfigPools::update_field(
        ConfigPoolsContent::update_current_gpu_config,
        updated_config,
    )
    .await
    .map_err(InvokeError::from_anyhow)?;

    if timer.elapsed() > MAX_ACCEPTABLE_COMMAND_TIME {
        warn!(target: LOG_TARGET, "update_selected_gpu_pool_config took too long: {:?}", timer.elapsed());
    }

    Ok(())
}

#[tauri::command]
pub async fn update_selected_cpu_pool_config(
    updated_config: BasePoolData<CpuPool>,
) -> Result<(), InvokeError> {
    let timer = Instant::now();
    info!(target: LOG_TARGET, "[update_selected_cpu_pool_config] called with updated_config: {updated_config:?}");

    ConfigPools::update_field(
        ConfigPoolsContent::update_current_cpu_config,
        updated_config,
    )
    .await
    .map_err(InvokeError::from_anyhow)?;

    if timer.elapsed() > MAX_ACCEPTABLE_COMMAND_TIME {
        warn!(target: LOG_TARGET, "update_selected_cpu_pool_config took too long: {:?}", timer.elapsed());
    }

    Ok(())
}

#[tauri::command]
pub async fn reset_gpu_pool_config(gpu_pool_type: String) -> Result<(), InvokeError> {
    let timer = Instant::now();
    info!(target: LOG_TARGET, "[reset_pool_gpu_pool_config] called with gpu_pool_name: {gpu_pool_type:?}");

    let gpu_pool = GpuPool::from_string(&gpu_pool_type).map_err(InvokeError::from_anyhow)?;

    ConfigPools::update_field(
        ConfigPoolsContent::update_current_gpu_config,
        gpu_pool.default_content(),
    )
    .await
    .map_err(InvokeError::from_anyhow)?;
    EventsEmitter::emit_pools_config_loaded(&ConfigPools::content().await.clone()).await;
    GpuPoolManager::handle_new_selected_pool(gpu_pool.default_content()).await;

    if timer.elapsed() > MAX_ACCEPTABLE_COMMAND_TIME {
        warn!(target: LOG_TARGET, "reset_pool_gpu_pool_config took too long: {:?}", timer.elapsed());
    }
    Ok(())
}

#[tauri::command]
pub async fn reset_cpu_pool_config(cpu_pool_type: String) -> Result<(), InvokeError> {
    let timer = Instant::now();
    info!(target: LOG_TARGET, "[reset_pool_cpu_pool_config] called with cpu_pool_name: {cpu_pool_type:?}");

    let cpu_pool = CpuPool::from_string(&cpu_pool_type).map_err(InvokeError::from_anyhow)?;

    ConfigPools::update_field(
        ConfigPoolsContent::update_current_cpu_config,
        cpu_pool.default_content(),
    )
    .await
    .map_err(InvokeError::from_anyhow)?;
    EventsEmitter::emit_pools_config_loaded(&ConfigPools::content().await.clone()).await;
    CpuPoolManager::handle_new_selected_pool(cpu_pool.default_content()).await;

    if timer.elapsed() > MAX_ACCEPTABLE_COMMAND_TIME {
        warn!(target: LOG_TARGET, "reset_pool_cpu_pool_config took too long: {:?}", timer.elapsed());
    }
    Ok(())
}

#[tauri::command]
pub async fn create_pin(app_handle: tauri::AppHandle) -> Result<(), String> {
    InternalWallet::create_pin(&app_handle)
        .await
        .map_err(|e| e.to_string())?;
    info!(target: LOG_TARGET, "PIN created successfully");

    EventsEmitter::emit_pin_locked(true).await;

    Ok(())
}

#[tauri::command]
pub async fn set_seed_backed_up() -> Result<(), String> {
    ConfigWallet::update_field(ConfigWalletContent::set_seed_backed_up, true)
        .await
        .map_err(|e| e.to_string())?;

    EventsEmitter::emit_seed_backed_up(true).await;

    Ok(())
}

/*
 ********** TAPPLETS SECTION **********
*/

#[tauri::command]
pub async fn launch_builtin_tapplet() -> Result<ActiveTapplet, String> {
    let binaries_resolver = BinaryResolver::current();

    let tapp_dest_dir = binaries_resolver
        .get_binary_path(Binaries::BridgeTapplet)
        .await
        .map_err(|e| e.to_string())?;

    let handle_start =
        tauri::async_runtime::spawn(async move { start_tapplet(tapp_dest_dir).await });

    let (addr, _cancel_token) = match handle_start.await {
        Ok(result) => result.map_err(|e| e.to_string())?,
        Err(e) => {
            error!(target: LOG_TARGET, "❌ Error handling tapplet start: {e:?}");
            return Err(e.to_string());
        }
    };

    Ok(ActiveTapplet {
        tapplet_id: 0,
        display_name: "Bridge-wXTM".to_string(),
        source: format!("http://{addr}"),
        version: "1.0.0".to_string(),
    })
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
pub async fn list_connected_peers(
    state: tauri::State<'_, UniverseAppState>,
) -> Result<Vec<String>, String> {
    state
        .node_manager
        .list_connected_peers()
        .await
        .map_err(|e| e.to_string())
}

// ================ Event Scheduler Commands ==================
#[tauri::command]
pub async fn add_scheduler_event(
    event_id: String,
    event_time: SchedulerEventTiming,
    event_type: SchedulerEventType,
) -> Result<(), String> {
    info!(target: LOG_TARGET, "add_scheduler_event called with event_id: {event_id:?}, event_time: {event_time:?}, event_type: {event_type:?}");

    EventScheduler::instance()
        .schedule_event(event_type, event_id, event_time)
        .await
        .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn remove_scheduler_event(event_id: String) -> Result<(), String> {
    info!(target: LOG_TARGET, "remove_scheduler_event called with event_id: {event_id:?}");

    EventScheduler::instance()
        .remove_event(event_id)
        .await
        .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn pause_scheduler_event(event_id: String) -> Result<(), String> {
    info!(target: LOG_TARGET, "pause_scheduler_event called with event_id: {event_id:?}");

    EventScheduler::instance()
        .pause_event(event_id)
        .await
        .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn resume_scheduler_event(event_id: String) -> Result<(), String> {
    info!(target: LOG_TARGET, "resume_scheduler_event called with event_id: {event_id:?}");

    EventScheduler::instance()
        .resume_event(event_id)
        .await
        .map_err(|e| e.to_string())?;

    Ok(())
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
        .resume_phases(vec![SetupPhase::Wallet])
        .await;

    Ok(())
}

// Used in convertEthAddressToTariAddress [bridgeApiActions.ts]
// This function encodes a payment ID into a Tari address creating new address for mining
// It easier to encode it here as Bridge backend is not written in rust
#[tauri::command]
pub async fn encode_payment_id_to_address(
    payment_id: String,
    tari_address: String,
) -> Result<String, String> {
    info!(target: LOG_TARGET, "encode_payment_id_to_address called with payment_id: {payment_id:?}, tari_address: {tari_address:?}");
    let mut address_with_memo_field =
        DualAddress::from_base58(tari_address.as_str()).map_err(|e| {
            error!(target: LOG_TARGET, "Failed to parse Tari address: {e}");
            e.to_string()
        })?;
    address_with_memo_field
        .add_memo_field_payment_id(payment_id.as_bytes().to_vec())
        .map_err(|e| {
            error!(target: LOG_TARGET, "Failed to add payment ID to Tari address: {e}");
            e.to_string()
        })?;
    let address_base58 = address_with_memo_field.to_base58();
    info!(target: LOG_TARGET, "Encoded Tari address with payment ID: {address_base58:?}");

    Ok(address_base58)
}

#[tauri::command]
pub async fn save_wxtm_address(address: String, exchange_id: String) -> Result<(), String> {
    ConfigWallet::update_field(
        ConfigWalletContent::add_wxtm_address,
        (exchange_id, address),
    )
    .await
    .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn get_base_node_status(
    state: tauri::State<'_, UniverseAppState>,
) -> Result<BaseNodeStatus, String> {
    Ok(*state.node_status_watch_rx.borrow())
}

#[tauri::command]
pub async fn set_security_warning_dismissed() -> Result<(), String> {
    ConfigWallet::update_field(ConfigWalletContent::set_security_warning_dismissed, true)
        .await
        .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn set_pause_on_battery_mode(
    pause_on_battery_mode: PauseOnBatteryModeState,
) -> Result<(), InvokeError> {
    let timer = Instant::now();
    ConfigMining::update_field(
        ConfigMiningContent::set_pause_on_battery_mode,
        pause_on_battery_mode,
    )
    .await
    .map_err(InvokeError::from_anyhow)?;
    if timer.elapsed() > MAX_ACCEPTABLE_COMMAND_TIME {
        warn!(target: LOG_TARGET, "set_pause_on_battery_mode took too long: {:?}", timer.elapsed());
    }
    Ok(())
}

#[tauri::command]
pub async fn set_feedback_fields(feedback_type: String, was_sent: bool) -> Result<(), InvokeError> {
    let timer = Instant::now();
    if was_sent {
        ConfigUI::update_field(ConfigUIContent::update_feedback_sent, feedback_type)
            .await
            .map_err(InvokeError::from_anyhow)?;
    } else {
        ConfigUI::update_field(ConfigUIContent::update_feedback_dismissed, feedback_type)
            .await
            .map_err(InvokeError::from_anyhow)?;
    }
    if timer.elapsed() > MAX_ACCEPTABLE_COMMAND_TIME {
        warn!(target: LOG_TARGET, "set_feedback_fields took too long: {:?}", timer.elapsed());
    }

    Ok(())
}

#[tauri::command]
pub async fn set_mode_mining_time(mode: MiningModeType, duration: u64) -> Result<(), InvokeError> {
    let timer = Instant::now();

    ConfigMining::update_mining_times(mode, duration)
        .await
        .map_err(InvokeError::from_anyhow)?;
    if timer.elapsed() > MAX_ACCEPTABLE_COMMAND_TIME {
        warn!(target: LOG_TARGET, "set_mode_mining_time took too long: {:?}", timer.elapsed());
    }
    Ok(())
}

#[tauri::command]
pub async fn set_eco_alert_needed() -> Result<(), InvokeError> {
    let timer = Instant::now();
    ConfigMining::update_field(ConfigMiningContent::set_eco_alert_needed, false)
        .await
        .map_err(InvokeError::from_anyhow)?;
    if timer.elapsed() > MAX_ACCEPTABLE_COMMAND_TIME {
        warn!(target: LOG_TARGET, "set_eco_alert_needed took too long: {:?}", timer.elapsed());
    }
    Ok(())
}

#[tauri::command]
pub async fn mark_shutdown_selection_as_completed(dont_ask_again: bool) -> Result<(), InvokeError> {
    let timer = Instant::now();

    ConfigUI::update_field(ConfigUIContent::set_shutdown_mode_selected, dont_ask_again)
        .await
        .map_err(InvokeError::from_anyhow)?;

    ShutdownManager::instance()
        .mark_shutdown_mode_selection_as_completed()
        .await;

    if timer.elapsed() > MAX_ACCEPTABLE_COMMAND_TIME {
        warn!(target: LOG_TARGET, "mark_shutdown_selection_as_completed took too long: {:?}", timer.elapsed());
    }
    Ok(())
}

#[tauri::command]
pub async fn mark_feedback_survey_as_completed() -> Result<(), InvokeError> {
    let timer = Instant::now();

    ShutdownManager::instance()
        .mark_feedback_survey_as_completed()
        .await;

    if timer.elapsed() > MAX_ACCEPTABLE_COMMAND_TIME {
        warn!(target: LOG_TARGET, " mark_feedback_survey_as_completed took too long: {:?}", timer.elapsed());
    }
    Ok(())
}

#[tauri::command]
pub async fn update_shutdown_mode_selection(
    shutdown_mode: ShutdownMode,
) -> Result<(), InvokeError> {
    let timer = Instant::now();

    ConfigCore::update_field(ConfigCoreContent::set_shutdown_mode, shutdown_mode)
        .await
        .map_err(InvokeError::from_anyhow)?;

    if timer.elapsed() > MAX_ACCEPTABLE_COMMAND_TIME {
        warn!(target: LOG_TARGET, "update_shutdown_mode_selection took too long: {:?}", timer.elapsed());
    }
    Ok(())
}
