// Copyright 2026. The Tari Project
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

//! The Ootle (L2) wallet, run in-process from the tari-ootle wallet SDK.
//!
//! Esmeralda only. The store opens during the wallet setup phase. The L2 seed is the
//! L1 seed, so a fresh store stays "not enabled" until the user enables L2 behind the
//! PIN, which restores the SDK seed from the L1 seed words and starts the services.

use std::{
    collections::HashMap,
    future::Future,
    path::{Path, PathBuf},
    str::FromStr,
    sync::{
        LazyLock,
        atomic::{AtomicBool, Ordering},
    },
};

use log::{error, info, warn};
use tari_common::configuration::Network;
use tari_common_types_wallet::seeds::mnemonic::{Mnemonic, MnemonicLanguage};
use tari_crypto::tari_utilities::SafePassword;
use tari_engine_types::resource::Resource;
use tari_ootle_wallet_sdk::{
    CipherSeed, Network as OotleNetwork, OotleAddress, SeedWords, WalletSdk, WalletSdkConfig,
    WalletSdkSpec,
    apis::config::ConfigKey,
    cipher_seed::CipherSeedRestore,
    local_key_store::LocalKeyStore,
    models::{EpochBirthday, WalletEvent},
};
use tari_ootle_wallet_sdk_services::{
    Shutdown, ShutdownSignal,
    account_monitor::AccountMonitor,
    account_recovery::AccountRecoveryService,
    indexer_rest_api::IndexerRestApiNetworkInterface,
    notify::Notify,
    transaction_service::{TransactionService, TransactionServiceHandle},
    utxo_scanner::{StealthUtxoScannerWorker, UtxoRecovery},
};
use tari_ootle_wallet_storage_sqlite::SqliteWalletStore;
use tari_template_lib::{
    prelude::LOCKED,
    types::{
        ComponentAddress, Metadata, ResourceType, SubstateOwnerRule,
        access_rules::ResourceAccessRules,
        constants::{
            PUBLIC_IDENTITY_RESOURCE_ADDRESS, STEALTH_TARI_RESOURCE_ADDRESS, TOKEN_SYMBOL,
        },
        rule,
    },
};
use tauri::AppHandle;
use tokio::sync::{Mutex, broadcast};
use tokio_util::task::TaskTracker;
use url::Url;

use crate::{
    configs::{config_core::ConfigCore, trait_config::ConfigImpl},
    credential_manager::CredentialManager,
    events::PinPromptContext,
    events_emitter::EventsEmitter,
    internal_wallet::{InternalWallet, to_wallet_cipher_seed},
    pin::PinManager,
    setup::setup_manager::{SetupManager, SetupPhase},
    tasks_tracker::TasksTrackers,
    wallet::{
        minotari_wallet::MinotariWalletManager,
        send_gate::{TransactionError, check_l2_allowed, network_supports_l2},
    },
};

mod claim;
mod network_stats;
mod send;
mod state;

pub use claim::{BurnProof, L2Burn, L2ClaimResult};
pub use network_stats::L2NetworkStats;
pub use state::L2WalletState;
use state::SeedSource;

const LOG_TARGET: &str = "tari::universe::ootle";
/// Same as tari_walletd: stop looking for more recovered accounts after this many misses.
const RECOVERY_ABANDON_COUNT: usize = 10;
/// Holds the id of the L1 wallet the store in the same directory belongs to, or
/// [`IMPORTED_SEED`].
const L1_WALLET_ID_FILE: &str = "l1-wallet-id";
/// Owner of a store restored from seed words the user imported for L2 only. Such a store
/// belongs to no L1 wallet, so an L1 wallet change leaves it alone.
const IMPORTED_SEED: &str = "imported";

pub struct OotleWalletSpec;

impl WalletSdkSpec for OotleWalletSpec {
    type KeyStore = LocalKeyStore;
    type NetworkInterface = IndexerRestApiNetworkInterface;
    type Store = SqliteWalletStore;
}

type OotleSdk = WalletSdk<OotleWalletSpec>;

static INSTANCE: LazyLock<OotleWalletManager> = LazyLock::new(|| OotleWalletManager {
    sdk: Mutex::new(None),
    notify: Notify::new(100),
    transactions: Mutex::new(None),
    mined_heights: Mutex::new(HashMap::new()),
    store_dir: Mutex::new(None),
    seed_imported: AtomicBool::new(false),
});

pub struct OotleWalletManager {
    sdk: Mutex<Option<OotleSdk>>,
    notify: Notify<WalletEvent>,
    /// Set once the services run, which is when L2 is enabled.
    transactions: Mutex<Option<TransactionServiceHandle>>,
    /// L1 heights the node said burns were mined at, by commitment. Kept in memory only,
    /// a restart just asks again.
    mined_heights: Mutex<HashMap<String, u64>>,
    /// Where the open store lives, set on every open.
    store_dir: Mutex<Option<PathBuf>>,
    /// Whether the open store holds imported seed words rather than the L1 seed.
    seed_imported: AtomicBool,
}

impl OotleWalletManager {
    /// Opens the L2 store and starts the services if L2 was enabled before. Does
    /// nothing off Esmeralda.
    pub async fn initialize(data_dir: &Path) -> Result<(), anyhow::Error> {
        let network = Network::get_current_or_user_setting_or_default();
        if !network_supports_l2(network) {
            info!(target: LOG_TARGET, "L2 wallet skipped, not available on {network}");
            return Ok(());
        }
        let indexer_url = ConfigCore::content()
            .await
            .ootle_indexer_url()
            .clone()
            .ok_or_else(|| anyhow::anyhow!("No Ootle indexer configured for {network}"))?;

        let store_dir = data_dir.join("ootle-wallet").join(network.as_key_str());
        // A restart of the wallet phase leaves the old store open; let it go before the
        // directory might be deleted below.
        INSTANCE.sdk.lock().await.take();
        INSTANCE.transactions.lock().await.take();
        let reset = match InternalWallet::tari_wallet_details().await {
            Some(details) => claim_store_for(&store_dir, details.id.as_str())?,
            None => false,
        };
        let owner = std::fs::read_to_string(store_dir.join(L1_WALLET_ID_FILE)).ok();
        INSTANCE
            .seed_imported
            .store(owner.as_deref() == Some(IMPORTED_SEED), Ordering::Relaxed);
        *INSTANCE.store_dir.lock().await = Some(store_dir.clone());
        let password = CredentialManager::ootle_keyring_password().await?;
        let sdk = open_sdk(&store_dir, network, indexer_url.clone(), &password)?;

        if reset {
            info!(target: LOG_TARGET, "L2 store belonged to a replaced L1 wallet, removed it");
            emit_state(&sdk).await;
        } else if sdk.config_api().exists(ConfigKey::CipherSeed)? {
            start_services(&sdk, sdk.is_recovery_needed()?).await?;
            info!(target: LOG_TARGET, "L2 wallet started on {network}, indexer {indexer_url}");
        } else {
            info!(target: LOG_TARGET, "L2 wallet opened on {network}, not enabled yet");
        }
        *INSTANCE.sdk.lock().await = Some(sdk);
        Ok(())
    }

    /// Turns L2 on: asks for the PIN, restores the L2 seed from the L1 seed and starts
    /// the services. Refused without a PIN or off Esmeralda.
    pub async fn enable(app_handle: &AppHandle) -> Result<(), TransactionError> {
        check_l2_allowed(
            Network::get_current_or_user_setting_or_default(),
            PinManager::pin_locked().await,
        )?;
        let mut guard = INSTANCE.sdk.lock().await;
        let sdk = guard.as_mut().ok_or_else(|| {
            TransactionError::Disabled("The L2 wallet has not started yet".to_string())
        })?;
        if sdk
            .config_api()
            .exists(ConfigKey::CipherSeed)
            .map_err(wallet_error)?
        {
            return Ok(());
        }

        let seed = InternalWallet::get_tari_seed_with_prompt(app_handle, None)
            .await
            .map_err(wallet_error)?;
        let seed_words = l2_seed_words(&seed).map_err(wallet_error)?;
        sdk.initialize_cipher_seed(CipherSeedRestore::FromSeedWords(&seed_words))
            .map_err(wallet_error)?;
        start_services(sdk, true).await.map_err(wallet_error)?;
        info!(target: LOG_TARGET, "L2 wallet enabled");
        Ok(())
    }

    /// The L2 seed words, once the user enters their PIN. Refused without a PIN, off
    /// Esmeralda, and before L2 is enabled.
    pub async fn seed_words(app_handle: &AppHandle) -> Result<Vec<String>, TransactionError> {
        check_l2_allowed(
            Network::get_current_or_user_setting_or_default(),
            PinManager::pin_locked().await,
        )?;
        let mut sdk = started_sdk().await?;
        PinManager::get_validated_pin_if_defined(app_handle, None)
            .await
            .map_err(wallet_error)?;
        let words = sdk
            .load_seed_words()
            .map_err(wallet_error)?
            .ok_or_else(|| TransactionError::Disabled("Layer 2 is not enabled".to_string()))?;
        (0..words.len())
            .map(|i| words.get_word(i).cloned().map_err(wallet_error))
            .collect()
    }

    /// Replaces the L2 wallet with one restored from `seed_words`, which belong to L2
    /// only, once the user enters their PIN. The words are checked before anything is
    /// touched. Refused without a PIN or off Esmeralda.
    pub async fn import_seed_words(
        app_handle: &AppHandle,
        seed_words: Vec<String>,
    ) -> Result<(), TransactionError> {
        check_l2_allowed(
            Network::get_current_or_user_setting_or_default(),
            PinManager::pin_locked().await,
        )?;
        let words = parse_seed_words(&seed_words)?;
        PinManager::get_validated_pin_if_defined(app_handle, None)
            .await
            .map_err(wallet_error)?;
        replace_store(&words, IMPORTED_SEED).await
    }

    /// Replaces the L2 wallet with one restored from the L1 seed, undoing an import, once
    /// the user enters their PIN. Refused without a PIN or off Esmeralda.
    pub async fn use_l1_seed(app_handle: &AppHandle) -> Result<(), TransactionError> {
        check_l2_allowed(
            Network::get_current_or_user_setting_or_default(),
            PinManager::pin_locked().await,
        )?;
        let wallet_id = InternalWallet::tari_wallet_details()
            .await
            .ok_or_else(|| TransactionError::WalletError("No L1 wallet found".to_string()))?
            .id;
        let seed = InternalWallet::get_tari_seed_with_prompt(app_handle, None)
            .await
            .map_err(wallet_error)?;
        let words = l2_seed_words(&seed).map_err(wallet_error)?;
        replace_store(&words, wallet_id.as_str()).await
    }

    /// Everything the L2 panel shows. Refused without a PIN or off Esmeralda, and
    /// before the store has opened. A store that was never enabled reports
    /// `enabled: false` and no accounts.
    pub async fn state() -> Result<L2WalletState, TransactionError> {
        check_l2_allowed(
            Network::get_current_or_user_setting_or_default(),
            PinManager::pin_locked().await,
        )?;
        state::build_state(&started_sdk().await?).map_err(wallet_error)
    }

    /// Parses an Ootle address for the current network. Called before a send touches
    /// the gate, so a typo never reaches the PIN prompt.
    pub fn parse_address(address: &str) -> Result<OotleAddress, TransactionError> {
        parse_address(
            address,
            ootle_network(Network::get_current_or_user_setting_or_default()),
        )
    }

    /// Sends `amount` micro XTR from `account` (a component address) to `destination`
    /// once the user enters their PIN, and returns the L2 transaction id. The caller has
    /// already passed the send gate.
    pub async fn send_xtr(
        app_handle: &AppHandle,
        account: &str,
        destination: OotleAddress,
        amount: u64,
        pin_context: PinPromptContext,
    ) -> Result<String, TransactionError> {
        let sdk = started_sdk().await?;
        let transactions = transaction_service().await?;
        let account = ComponentAddress::from_str(account)
            .map_err(wallet_error)
            .and_then(|component| {
                sdk.accounts_api()
                    .get_account_by_address(&component)
                    .map_err(wallet_error)
            })?;

        PinManager::get_validated_pin(app_handle, Some(pin_context))
            .await
            .map_err(wallet_error)?;
        let id = send::send_xtr(&sdk, &transactions, account, destination, amount)
            .await
            .map_err(|e| TransactionError::WalletError(format!("L2 send failed: {e}")))?;
        info!(target: LOG_TARGET, "L2 send submitted: {id}");
        emit_state(&sdk).await;
        Ok(id.to_string())
    }

    /// Burns to L2 made from this wallet and whether they can be claimed yet. Refused
    /// without a PIN or off Esmeralda.
    pub async fn burns() -> Result<Vec<L2Burn>, TransactionError> {
        check_l2_allowed(
            Network::get_current_or_user_setting_or_default(),
            PinManager::pin_locked().await,
        )?;
        let mut burns = listed_burns().await?;
        claim::mark_foreign(&started_sdk().await?, &mut burns).map_err(wallet_error)?;
        Ok(burns)
    }

    /// The claimable proof for the burn with this commitment, and its file name.
    pub fn find_claimable_burn(commitment: &str) -> Result<(String, BurnProof), TransactionError> {
        claim::find_claimable(&burn_proofs_dir()?, commitment).map_err(wallet_error)
    }

    /// Claims a burn into the wallet account its claim key belongs to once the user
    /// enters their PIN, and returns the L2 transaction id. The caller has already
    /// passed the send gate.
    pub async fn claim_burn(
        app_handle: &AppHandle,
        file_name: String,
        proof: BurnProof,
        pin_context: PinPromptContext,
    ) -> Result<String, TransactionError> {
        let sdk = started_sdk().await?;
        let transactions = transaction_service().await?;
        PinManager::get_validated_pin(app_handle, Some(pin_context))
            .await
            .map_err(wallet_error)?;
        let id = claim::claim_burn(&sdk, &transactions, proof, file_name)
            .await
            .map_err(|e| TransactionError::WalletError(format!("L2 claim failed: {e}")))?;
        info!(target: LOG_TARGET, "L2 claim submitted: {id}");
        emit_state(&sdk).await;
        Ok(id.to_string())
    }
}

/// Stops the wallet phase (which runs the L2 services), swaps the store for one restored
/// from `words` and owned by `owner`, then resumes the phase, which reopens the store and
/// starts the services with recovery on and sends the new state. The phase resumes even
/// when the swap fails, so the L1 wallet always comes back.
async fn replace_store(words: &SeedWords, owner: &str) -> Result<(), TransactionError> {
    let store_dir = INSTANCE.store_dir.lock().await.clone().ok_or_else(|| {
        TransactionError::Disabled("The L2 wallet has not started yet".to_string())
    })?;
    let indexer_url = ConfigCore::content()
        .await
        .ootle_indexer_url()
        .clone()
        .ok_or_else(|| TransactionError::Disabled("No Ootle indexer configured".to_string()))?;
    let password = CredentialManager::ootle_keyring_password()
        .await
        .map_err(wallet_error)?;
    let network = Network::get_current_or_user_setting_or_default();

    SetupManager::get_instance()
        .shutdown_phases(vec![SetupPhase::Wallet])
        .await;
    // Nothing may hold the store open when its directory goes.
    INSTANCE.sdk.lock().await.take();
    INSTANCE.transactions.lock().await.take();
    let result = restore_store(&store_dir, network, indexer_url, &password, words, owner);
    SetupManager::get_instance()
        .resume_phases(vec![SetupPhase::Wallet])
        .await;
    result.map_err(wallet_error)?;
    info!(target: LOG_TARGET, "L2 wallet restored from new seed words, owner {owner}");
    Ok(())
}

/// Deletes the store in `store_dir` and creates a new one restored from `words`, marked
/// as owned by `owner`. Does not touch the network.
fn restore_store(
    store_dir: &Path,
    network: Network,
    indexer_url: Url,
    password: &str,
    words: &SeedWords,
    owner: &str,
) -> Result<(), anyhow::Error> {
    if store_dir.exists() {
        std::fs::remove_dir_all(store_dir)?;
    }
    let mut sdk = open_sdk(store_dir, network, indexer_url, password)?;
    sdk.initialize_cipher_seed(CipherSeedRestore::FromSeedWords(words))?;
    std::fs::write(store_dir.join(L1_WALLET_ID_FILE), owner)?;
    Ok(())
}

/// Seed words typed by the user, checked to be a valid seed.
fn parse_seed_words(seed_words: &[String]) -> Result<SeedWords, TransactionError> {
    let mut words = SeedWords::new(vec![]);
    for word in seed_words {
        words.push(word.trim().to_string());
    }
    CipherSeed::from_mnemonic(&words, None)
        .map_err(|e| TransactionError::WalletError(format!("Invalid seed words: {e}")))?;
    Ok(words)
}

/// Whether the open store holds imported seed words or the L1 seed.
fn seed_source() -> SeedSource {
    if INSTANCE.seed_imported.load(Ordering::Relaxed) {
        SeedSource::Imported
    } else {
        SeedSource::L1
    }
}

/// Pending burns from the L1 wallet db and the proof files on disk, before the checks
/// against the L2 wallet.
async fn listed_burns() -> Result<Vec<L2Burn>, TransactionError> {
    let pending = MinotariWalletManager::pending_burns()
        .await
        .map_err(wallet_error)?
        .into_iter()
        .map(|row| {
            let amount = u64::try_from(row.value).unwrap_or_default();
            L2Burn::pending(hex::encode(row.commitment), row.claim_public_key, amount)
        })
        .collect();
    let times = MinotariWalletManager::burn_times()
        .await
        .map_err(wallet_error)?;
    let mut burns =
        claim::list_burns(&burn_proofs_dir()?, pending, &times).map_err(wallet_error)?;
    let heights = INSTANCE.mined_heights.lock().await;
    for burn in &mut burns {
        burn.mined_height = heights.get(&burn.commitment).copied();
    }
    Ok(burns)
}

/// A new burn or proof file is an L1 side change, so no wallet event reports it. Sends
/// the L2 state when the burn list changed since `last`, which makes the panel refetch
/// its burns.
async fn emit_state_on_new_burns(sdk: &OotleSdk, last: &mut Option<Vec<L2Burn>>) {
    match listed_burns().await {
        Ok(mut burns) => {
            find_mined_heights(&mut burns).await;
            if last.as_ref() != Some(&burns) {
                *last = Some(burns);
                emit_state(sdk).await;
            }
        }
        Err(e) => warn!(target: LOG_TARGET, "Could not list burns to L2: {e}"),
    }
}

/// Asks the L1 node where each claimable burn without a height was mined, and remembers
/// the answer. A failed query, or one the node doesn't have mined, leaves the height
/// unknown until the next tick.
async fn find_mined_heights(burns: &mut [L2Burn]) {
    let Ok(dir) = burn_proofs_dir() else {
        return;
    };
    let unknown = burns
        .iter_mut()
        .filter(|b| b.status == "claimable" && b.mined_height.is_none());
    for burn in unknown {
        let Some(file) = &burn.proof_file else {
            continue;
        };
        match mined_height(&dir.join(file)).await {
            Ok(Some(height)) => {
                INSTANCE
                    .mined_heights
                    .lock()
                    .await
                    .insert(burn.commitment.clone(), height);
                burn.mined_height = Some(height);
            }
            Ok(None) => {}
            Err(e) => {
                warn!(target: LOG_TARGET, "Could not ask the node where {file} was mined: {e}")
            }
        }
    }
}

/// The L1 height the burn in this proof file was mined at, going by its kernel signature.
async fn mined_height(proof_file: &Path) -> Result<Option<u64>, anyhow::Error> {
    let sig = claim::read_proof(proof_file)?.claim_proof.kernel.excess_sig;
    MinotariWalletManager::mined_height(sig.public_nonce().as_bytes(), sig.signature().as_bytes())
        .await
}

fn burn_proofs_dir() -> Result<std::path::PathBuf, TransactionError> {
    MinotariWalletManager::burn_proofs_dir().map_err(wallet_error)
}

async fn transaction_service() -> Result<TransactionServiceHandle, TransactionError> {
    INSTANCE
        .transactions
        .lock()
        .await
        .clone()
        .ok_or_else(|| TransactionError::Disabled("Layer 2 is not enabled".to_string()))
}

async fn started_sdk() -> Result<OotleSdk, TransactionError> {
    INSTANCE
        .sdk
        .lock()
        .await
        .clone()
        .ok_or_else(|| TransactionError::Disabled("The L2 wallet has not started yet".to_string()))
}

fn parse_address(address: &str, network: OotleNetwork) -> Result<OotleAddress, TransactionError> {
    let invalid =
        |reason: String| TransactionError::InvalidAddress(format!("Invalid L2 address: {reason}"));
    let parsed = OotleAddress::from_str(address.trim()).map_err(|e| invalid(e.to_string()))?;
    if parsed.network() != network {
        return Err(invalid(format!(
            "it is for {}, not {network}",
            parsed.network()
        )));
    }
    parsed.validate().map_err(|e| invalid(e.to_string()))?;
    Ok(parsed)
}

/// Makes `store_dir` belong to the L1 wallet `l1_wallet_id`. The L2 seed is the L1 seed,
/// so a store left from another L1 wallet (seed words import) holds the wrong keys and is
/// deleted, as is a store with no owner on record (older build, or a delete cut short).
/// Returns whether it deleted one. Runs on every open, so a crash between the L1 import
/// and the next start still ends with the store gone. A store holding imported seed words
/// is kept as it is.
fn claim_store_for(store_dir: &Path, l1_wallet_id: &str) -> Result<bool, anyhow::Error> {
    let owner_file = store_dir.join(L1_WALLET_ID_FILE);
    let owner = std::fs::read_to_string(&owner_file).ok();
    if owner.as_deref() == Some(IMPORTED_SEED) {
        return Ok(false);
    }
    let reset = owner.as_deref() != Some(l1_wallet_id) && store_dir.join("wallet.sqlite").exists();
    if reset {
        std::fs::remove_dir_all(store_dir)?;
    }
    std::fs::create_dir_all(store_dir)?;
    std::fs::write(owner_file, l1_wallet_id)?;
    Ok(reset)
}

/// Opens (or creates) the store in `store_dir` and wraps it in the SDK. Does not touch
/// the network.
fn open_sdk(
    store_dir: &Path,
    network: Network,
    indexer_url: Url,
    password: &str,
) -> Result<OotleSdk, anyhow::Error> {
    std::fs::create_dir_all(store_dir)?;
    let store = SqliteWalletStore::try_open(store_dir.join("wallet.sqlite"))?;
    store.run_migrations()?;
    let config = WalletSdkConfig {
        network: ootle_network(network),
        override_keyring_password: Some(SafePassword::from(password)),
    };
    let indexer = IndexerRestApiNetworkInterface::new(indexer_url);
    let sdk = OotleSdk::initialize_with_local_key_store(
        store,
        indexer,
        config,
        EpochBirthday::far_future(),
    )?;
    upsert_genesis_resources(&sdk)?;
    Ok(sdk)
}

fn wallet_error(e: impl std::fmt::Display) -> TransactionError {
    TransactionError::WalletError(e.to_string())
}

fn ootle_network(network: Network) -> OotleNetwork {
    match network {
        Network::MainNet => OotleNetwork::MainNet,
        Network::StageNet => OotleNetwork::StageNet,
        Network::NextNet => OotleNetwork::NextNet,
        Network::LocalNet => OotleNetwork::LocalNet,
        Network::Igor => OotleNetwork::Igor,
        Network::Esmeralda => OotleNetwork::Esmeralda,
    }
}

/// The L1 seed as seed words the wallet SDK can restore from.
fn l2_seed_words(
    seed: &tari_common_types::seeds::cipher_seed::CipherSeed,
) -> Result<SeedWords, anyhow::Error> {
    let seed: CipherSeed = to_wallet_cipher_seed(seed)?;
    Ok(seed.to_mnemonic(MnemonicLanguage::English, None)?)
}

/// The XTR and public identity resources every wallet knows about, copied from
/// tari_ootle_app_utilities::genesis_resources (which pulls in the engine).
fn upsert_genesis_resources(sdk: &OotleSdk) -> Result<(), anyhow::Error> {
    let symbol = if sdk.network().is_testnet() {
        "tTARI"
    } else {
        "TARI"
    };
    let xtr = Resource::new(
        ResourceType::Stealth,
        SubstateOwnerRule::None,
        ResourceAccessRules::new()
            .mintable(rule!(deny_all), LOCKED)
            .burnable(rule!(deny_all), LOCKED)
            .recallable(rule!(deny_all), LOCKED)
            .freezable(rule!(deny_all), LOCKED),
        Metadata::from([(TOKEN_SYMBOL, symbol)]),
        None,
        None,
        6,
        false,
    );
    let identity = Resource::new(
        ResourceType::NonFungible,
        SubstateOwnerRule::None,
        ResourceAccessRules::new(),
        Metadata::from([(TOKEN_SYMBOL, "ID".to_string())]),
        None,
        None,
        0,
        false,
    );
    let resources = sdk.resources_api();
    resources.upsert_resource(&STEALTH_TARI_RESOURCE_ADDRESS, &xtr)?;
    resources.upsert_resource(&PUBLIC_IDENTITY_RESOURCE_ADDRESS, &identity)?;
    Ok(())
}

/// Spawns the wallet services the way tari_walletd does, minus the template monitor,
/// automatic burn claiming and the wasm optimizer. They run on the wallet phase tracker
/// so they stop with the L1 wallet.
async fn start_services(sdk: &OotleSdk, needs_recovery: bool) -> Result<(), anyhow::Error> {
    let phase = &TasksTrackers::current().wallet_phase;
    let tracker = phase.get_task_tracker().await;
    let mut phase_signal = phase.get_signal().await;
    // The SDK services take the tari 5.x shutdown signal, so relay the phase's one to it.
    let mut shutdown = Shutdown::new();
    let signal = shutdown.to_signal();
    tracker.spawn(async move {
        phase_signal.wait().await;
        shutdown.trigger();
    });

    if let Some(indexer) = ConfigCore::content().await.ootle_indexer_url().clone() {
        let network = Network::get_current_or_user_setting_or_default();
        let poll = network_stats::poll(sdk.clone(), indexer, network);
        spawn_service(&tracker, &signal, "network poller", poll);
    }

    let notify = INSTANCE.notify.clone();
    let events = emit_state_on_events(sdk.clone(), notify.subscribe());
    spawn_service(&tracker, &signal, "state events", events);
    let (transactions, handle) =
        TransactionService::new(notify.clone(), sdk.clone(), signal.clone());
    spawn_service(&tracker, &signal, "transaction service", transactions.run());
    *INSTANCE.transactions.lock().await = Some(handle);

    let (scanner, scanner_handle) =
        StealthUtxoScannerWorker::new(sdk.clone(), notify.clone()).spawn();
    spawn_service(&tracker, &signal, "utxo scanner", async { scanner.await? });
    let recovery = UtxoRecovery::new(sdk.clone()).with_notify(notify.clone());
    let waker = scanner_handle.subscribe_notifications();
    spawn_service(&tracker, &signal, "utxo recovery", recovery.run(waker));

    let (monitor, monitor_handle) =
        AccountMonitor::new(notify, sdk.clone(), scanner_handle, signal.clone());
    spawn_service(&tracker, &signal, "account monitor", monitor.run());

    if needs_recovery {
        let birthday = sdk.key_manager_api().get_cipher_seed_birthday_epoch()?;
        let scanner = AccountRecoveryService::new(
            sdk.clone(),
            monitor_handle,
            RECOVERY_ABANDON_COUNT,
            birthday,
        );
        // Recovery adds the accounts (index 0 becomes the default) without an event.
        let sdk = sdk.clone();
        spawn_service(&tracker, &signal, "account recovery", async move {
            scanner.scan().await;
            emit_state(&sdk).await;
            Ok(())
        });
    }
    Ok(())
}

/// Sends the whole L2 state to the frontend now and again whenever the wallet reports
/// an account, balance or transaction change, and marks accepted burn claims claimed.
async fn emit_state_on_events(
    sdk: OotleSdk,
    mut events: broadcast::Receiver<WalletEvent>,
) -> Result<(), anyhow::Error> {
    let proof_dir = MinotariWalletManager::burn_proofs_dir()?;
    // Claims submitted before a restart or while events were missed are settled from
    // the wallet's own record of them.
    let status = |id| {
        let found = sdk.transaction_api().get(id);
        tari_ootle_common_types::optional::Optional::optional(found)
            .map(|tx| tx.map(|tx| tx.status))
            .map_err(anyhow::Error::from)
    };
    let mut claims = claim::load_claims(&proof_dir);
    claim::reconcile_claims(&proof_dir, &mut claims, status);
    emit_state(&sdk).await;
    loop {
        match events.recv().await {
            Ok(
                WalletEvent::AuthLoginRequest(_)
                | WalletEvent::TransactionRequestCreated(_)
                | WalletEvent::UtxoRecoveryStarted(_),
            ) => {}
            // A claim's proof file moves before the state goes out, so the panel's burn
            // list refreshes with it gone.
            Ok(event) => {
                let result = claim::track_claim(&proof_dir, &mut claims, &event);
                emit_state(&sdk).await;
                if let Some(result) = result {
                    EventsEmitter::emit_l2_claim_result(result).await;
                }
            }
            Err(broadcast::error::RecvError::Lagged(_)) => {
                claim::reconcile_claims(&proof_dir, &mut claims, status);
                emit_state(&sdk).await;
            }
            Err(broadcast::error::RecvError::Closed) => return Ok(()),
        }
    }
}

async fn emit_state(sdk: &OotleSdk) {
    match state::build_state(sdk) {
        Ok(state) => EventsEmitter::emit_l2_wallet_state(state).await,
        Err(e) => error!(target: LOG_TARGET, "Could not read the L2 wallet state: {e}"),
    }
}

fn spawn_service(
    tracker: &TaskTracker,
    signal: &ShutdownSignal,
    name: &'static str,
    service: impl Future<Output = Result<(), anyhow::Error>> + Send + 'static,
) {
    let mut signal = signal.clone();
    tracker.spawn(async move {
        tokio::select! {
            result = service => match result {
                Ok(()) => info!(target: LOG_TARGET, "L2 {name} stopped"),
                Err(e) => error!(target: LOG_TARGET, "L2 {name} failed: {e}"),
            },
            _ = signal.wait() => {}
        }
    });
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn l2_seed_words_are_the_l1_seed_words() {
        let l1_seed = tari_common_types::seeds::cipher_seed::CipherSeed::random();
        let l1_words = tari_common_types::seeds::mnemonic::Mnemonic::to_mnemonic(
            &l1_seed,
            tari_common_types::seeds::mnemonic::MnemonicLanguage::English,
            None,
        )
        .expect("l1 words");
        let l2_words = l2_seed_words(&l1_seed).expect("l2 words");
        assert_eq!(l1_words.len(), l2_words.len());
        for i in 0..l1_words.len() {
            assert_eq!(l1_words.get_word(i).unwrap(), l2_words.get_word(i).unwrap());
        }
    }

    #[test]
    fn a_replaced_l1_wallet_leaves_l2_not_enabled() {
        let dir = tempfile::tempdir().expect("temp dir");
        let store_dir = dir.path().join("esmeralda");
        let url = Url::parse("http://127.0.0.1:1").expect("url");
        let enabled = |store_dir: &Path| {
            let sdk = open_sdk(store_dir, Network::Esmeralda, url.clone(), "test").expect("sdk");
            sdk.config_api()
                .exists(ConfigKey::CipherSeed)
                .expect("exists")
        };

        assert!(!claim_store_for(&store_dir, "first").expect("claim"));
        let mut sdk = open_sdk(&store_dir, Network::Esmeralda, url.clone(), "test").expect("sdk");
        sdk.initialize_cipher_seed(CipherSeedRestore::CreateNewIfRequired)
            .expect("seed");
        drop(sdk);

        assert!(!claim_store_for(&store_dir, "first").expect("same wallet"));
        assert!(enabled(&store_dir));
        assert!(claim_store_for(&store_dir, "second").expect("replaced wallet"));
        assert!(!enabled(&store_dir));
        assert!(!claim_store_for(&store_dir, "second").expect("new owner"));
    }

    #[test]
    fn imported_seed_words_replace_the_seed_and_survive_an_l1_wallet_change() {
        let dir = tempfile::tempdir().expect("temp dir");
        let store_dir = dir.path().join("esmeralda");
        let url = Url::parse("http://127.0.0.1:1").expect("url");
        let stored_words = |store_dir: &Path| {
            let mut sdk =
                open_sdk(store_dir, Network::Esmeralda, url.clone(), "test").expect("sdk");
            sdk.load_seed_words()
                .expect("load")
                .map(|w| w.join(" ").reveal().clone())
        };
        let owner = |store_dir: &Path| {
            std::fs::read_to_string(store_dir.join(L1_WALLET_ID_FILE)).expect("owner")
        };

        assert!(!claim_store_for(&store_dir, "first").expect("claim"));
        let mut sdk = open_sdk(&store_dir, Network::Esmeralda, url.clone(), "test").expect("sdk");
        sdk.initialize_cipher_seed(CipherSeedRestore::CreateNewIfRequired)
            .expect("seed");
        let old = sdk.load_seed_words().expect("load").expect("words");
        drop(sdk);

        let typed: Vec<String> = CipherSeed::random()
            .to_mnemonic(MnemonicLanguage::English, None)
            .expect("words")
            .join(" ")
            .reveal()
            .split(' ')
            .map(|w| format!(" {w} "))
            .collect();
        let mut bad = typed.clone();
        bad.swap(0, 1);
        assert!(parse_seed_words(&bad).is_err());
        assert!(parse_seed_words(&typed[1..]).is_err());
        let new = parse_seed_words(&typed).expect("valid words");
        assert_ne!(old.join(" ").reveal(), new.join(" ").reveal());

        restore_store(
            &store_dir,
            Network::Esmeralda,
            url.clone(),
            "test",
            &new,
            IMPORTED_SEED,
        )
        .expect("import over a seeded store");
        assert_eq!(
            stored_words(&store_dir),
            Some(new.join(" ").reveal().clone())
        );
        assert!(!claim_store_for(&store_dir, "second").expect("l1 wallet changed"));
        assert_eq!(owner(&store_dir), IMPORTED_SEED);
        assert_eq!(
            stored_words(&store_dir),
            Some(new.join(" ").reveal().clone())
        );

        // Back on the L1 seed the store follows the L1 wallet again.
        restore_store(
            &store_dir,
            Network::Esmeralda,
            url.clone(),
            "test",
            &old,
            "second",
        )
        .expect("use l1 seed");
        assert!(!claim_store_for(&store_dir, "second").expect("same wallet"));
        assert_eq!(
            stored_words(&store_dir),
            Some(old.join(" ").reveal().clone())
        );
        assert!(claim_store_for(&store_dir, "third").expect("replaced wallet"));
        assert_eq!(stored_words(&store_dir), None);
        assert_eq!(owner(&store_dir), "third");
    }

    #[test]
    fn parse_address_takes_only_valid_addresses_for_this_network() {
        let dir = tempfile::tempdir().expect("temp dir");
        let url = Url::parse("http://127.0.0.1:1").expect("url");
        let mut sdk = open_sdk(dir.path(), Network::Esmeralda, url, "test").expect("sdk");
        sdk.initialize_cipher_seed(CipherSeedRestore::CreateNewIfRequired)
            .expect("seed");
        let key = sdk.key_manager_api().next_account_address().expect("key");
        sdk.accounts_api()
            .create_account(Some("default"), true, key)
            .expect("account");
        let state = state::build_state(&sdk).expect("state");
        let address = state.accounts[0].address.clone();

        let parsed = parse_address(&format!(" {address} "), OotleNetwork::Esmeralda);
        assert_eq!(parsed.expect("valid").to_string(), address);
        assert!(matches!(
            parse_address(&address, OotleNetwork::MainNet),
            Err(TransactionError::InvalidAddress(_))
        ));
        let mut typo = address.clone();
        typo.pop();
        for bad in ["", "not an address", typo.as_str()] {
            assert!(matches!(
                parse_address(bad, OotleNetwork::Esmeralda),
                Err(TransactionError::InvalidAddress(_))
            ));
        }
    }
}
