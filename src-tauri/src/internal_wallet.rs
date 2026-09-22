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

use anyhow::anyhow;
use monero_address_creator::Seed as MoneroSeed;
use monero_address_creator::network::Mainnet;
use serde::{Deserialize, Serialize};
use std::fs::OpenOptions;
use std::io::Write;
use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicBool, Ordering};
use tari_common::configuration::Network;
use tari_common_types::seeds::cipher_seed::CipherSeed;
use tari_common_types::seeds::error::{CipherError, MnemonicError};
use tari_common_types::seeds::mnemonic::Mnemonic;
use tari_common_types::seeds::seed_words::SeedWords;
use tari_common_types::tari_address::{TariAddress, TariAddressFeatures};
use tari_transaction_components::key_manager::wallet_types::{SeedWordsWallet, WalletType};
use tari_transaction_components::key_manager::{KeyManager, TransactionKeyManagerInterface};
use tari_utilities::encoding::MBase58;
use tari_utilities::message_format::MessageFormat;
use tari_utilities::{Hidden, SafePassword};
use tauri::{AppHandle, Manager};
use tauri_plugin_sentry::sentry;
use tokio::sync::{OnceCell, RwLock};

use tari_utilities::hex::Hex;

use crate::configs::config_ui::ConfigUI;
use crate::configs::config_wallet::{ConfigWallet, ConfigWalletContent, WALLET_VERSION, WalletId};
use crate::configs::trait_config::ConfigImpl;
use crate::consts::DEFAULT_MONERO_ADDRESS;
use crate::credential_manager::{
    Credential, CredentialError, CredentialManager, KEYCHAIN_USERNAME, LegacyCredential,
    LegacyCredentialManager,
};
use crate::events::{CriticalProblemPayload, WalletRecoveryPayload};
use crate::events_emitter::EventsEmitter;
use crate::mining::MiningError;
use crate::mining::pools::PoolManagerInterfaceTrait;
use crate::mining::pools::cpu_pool_manager::CpuPoolManager;
use crate::mining::pools::gpu_pool_manager::GpuPoolManager;
use crate::pin::PinManager;
use crate::utils::{cryptography, rand_utils};
use crate::{APPLICATION_FOLDER_ID, LOG_TARGET_APP_LOGIC, UniverseAppState};

/// The wallet's view private key, in hex.
///
/// `Serialize`/`Deserialize` stay transparent because the key lives in
/// `config_wallet.json` as a plain hex string. Only `Debug`/`Display` are
/// masked, so the key can never reach a log line or a telemetry payload through
/// a `{:?}` formatter, and the `Hidden` wrapper zeroizes it on drop.
#[derive(Clone, Deserialize)]
#[serde(transparent)]
pub struct ViewPrivateKeyHex(Hidden<String>);

impl ViewPrivateKeyHex {
    pub fn new(view_private_key_hex: String) -> Self {
        ViewPrivateKeyHex(Hidden::hide(view_private_key_hex))
    }

    /// Read the key. Callers must keep it out of logs and telemetry.
    pub fn reveal(&self) -> &str {
        self.0.reveal().as_str()
    }
}

impl From<String> for ViewPrivateKeyHex {
    fn from(view_private_key_hex: String) -> Self {
        ViewPrivateKeyHex::new(view_private_key_hex)
    }
}

/// Transparent serialization: the config file keeps the plain hex string.
impl Serialize for ViewPrivateKeyHex {
    fn serialize<S: serde::Serializer>(&self, serializer: S) -> Result<S::Ok, S::Error> {
        serializer.serialize_str(self.reveal())
    }
}

impl std::fmt::Debug for ViewPrivateKeyHex {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.write_str("[REDACTED]")
    }
}

impl std::fmt::Display for ViewPrivateKeyHex {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.write_str("[REDACTED]")
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TariWalletDetails {
    pub id: WalletId,
    pub tari_address: TariAddress,
    pub wallet_birthday: u16,
    pub view_private_key_hex: ViewPrivateKeyHex,
    pub spend_public_key_hex: String,
}

#[derive(Debug, Clone)]
pub struct InternalWallet {
    tari_address_type: TariAddressType,
    encrypted_tari_seed: Hidden<Option<Vec<u8>>>,
    encrypted_monero_seed: Hidden<Option<Vec<u8>>>,
    monero_address: String,
    // Only for an external(seedless) wallet
    external_tari_address: Option<TariAddress>,
    // Only for an owned(with seed) wallet
    tari_wallet_details: Option<TariWalletDetails>,
    /// Set by the startup keyring probe when the Tari seed could not be read. The wallet still
    /// works for everything that does not need the seed (address, balance, scanning, pool
    /// mining), which is why the app keeps running; the UI uses this to show the recovery state
    /// at launch instead of at the user's first send.
    seed_unavailable: Option<SeedProbeErrorKind>,
}

static INSTANCE: OnceCell<RwLock<InternalWallet>> = OnceCell::const_new();

impl InternalWallet {
    /// The global wallet instance.
    ///
    /// Fallible by design: the instance only exists once `initialize_with_seed` or
    /// `initialize_seedless` completed, and every failure mode of those (corrupt config,
    /// missing keyring entry, failed legacy migration) leaves it unset. Callers must decide
    /// what "no wallet" means for them - skip a telemetry cycle, refuse to start mining,
    /// return an error to the UI - instead of panicking the task they run on.
    pub fn current() -> Result<&'static RwLock<InternalWallet>, anyhow::Error> {
        INSTANCE
            .get()
            .ok_or_else(|| anyhow!(WALLET_NOT_INITIALIZED))
    }

    pub fn is_initialized() -> bool {
        INSTANCE.get().is_some()
    }

    async fn set_current(new_internal_wallet: InternalWallet) -> Result<(), anyhow::Error> {
        if let Some(instance) = INSTANCE.get() {
            // INSTANCE has been initialized
            let mut internal_wallet_guard = instance.write().await;
            *internal_wallet_guard = new_internal_wallet;
        } else {
            INSTANCE
                .set(RwLock::new(new_internal_wallet))
                .map_err(|_| anyhow!("InternalWallet already initialized"))?;
        }
        Ok(())
    }

    pub async fn is_internal() -> Result<bool, anyhow::Error> {
        let internal_wallet_guard = InternalWallet::current()?.read().await;
        Ok(matches!(
            internal_wallet_guard.tari_address_type,
            TariAddressType::Internal
        ))
    }

    pub async fn initialize_seedless(
        app_handle: &tauri::AppHandle,
        new_external_tari_address: Option<TariAddress>,
    ) -> Result<(), anyhow::Error> {
        // Switching into seedless mode against a recovery placeholder would record an external
        // address over a wallet whose id list is merely missing. `_save_config` refuses the write
        // anyway; refusing here means nothing is mutated in memory either.
        ConfigWallet::content().await.ensure_available()?;
        if let Some(external_tari_address) = new_external_tari_address {
            ConfigWallet::update_field(
                ConfigWalletContent::select_external_tari_address,
                external_tari_address.clone(),
            )
            .await?;
        }

        let wallet_config = ConfigWallet::content().await;
        let external_tari_address = wallet_config.selected_external_tari_address().clone();
        if external_tari_address.is_none() {
            return Err(anyhow::anyhow!(
                "External Tari Address not defined when initializing Seedless InternalWallet"
            ));
        }

        let monero_address = wallet_config.monero_address().clone();
        let mut monero_seed_binary = None;
        if monero_address.is_empty() {
            let monero_seed = MoneroSeed::generate()?;
            monero_seed_binary = Some(InternalWallet::add_monero_wallet(monero_seed).await?);
        };

        let internal_wallet = InternalWallet {
            tari_address_type: TariAddressType::External,
            external_tari_address,
            monero_address,
            encrypted_monero_seed: Hidden::hide(monero_seed_binary),
            encrypted_tari_seed: Hidden::hide(None),
            tari_wallet_details: None,
            seed_unavailable: None,
        };

        internal_wallet.post_init(app_handle).await
    }

    /** Ensures wallet config contains everything needed to initialize the wallet - returns false when impossible */
    pub async fn validate_wallet_config_for_seed(
        app_handle: &AppHandle,
        wallet_config: &ConfigWalletContent,
    ) -> Result<bool, anyhow::Error> {
        if *wallet_config.version_counter() < WALLET_VERSION {
            log::info!(target: LOG_TARGET_APP_LOGIC, "Wallet config version is outdated, migration needed");
            return Ok(false);
        }
        // Latest version confirmed

        if wallet_config.tari_wallets().is_empty()
            && wallet_config.selected_external_tari_address().is_none()
        {
            log::error!(target: LOG_TARGET_APP_LOGIC, "No Tari wallets found");
            // In case of no wallets found, return falls to trigger migration or new wallet creation
            return Ok(false);
        }
        // An owned tari wallet id found

        if wallet_config.tari_wallet_details().is_none() {
            // Try to extract wallet details from seed stored in credentials
            if let Some(wallet_id) = wallet_config.tari_wallets().first() {
                let tari_seed_binary = InternalWallet::get_credentials(
                    app_handle,
                    wallet_id.clone(),
                    true,
                )
                .await
                .map_err(|e| {
                    log::error!(
                        target: LOG_TARGET_APP_LOGIC,
                        "[validate_wallet_config_for_seed] keyring read failed: wallet_id={}",
                        wallet_id.as_str(),
                    );
                    anyhow!("Failed to get credentials: {e}")
                })?;
                let tari_seed_binary = tari_seed_binary.encrypted_seed;
                // These details become the address the whole session mines and receives to, so
                // the decode has to be *proven*: plain `from_binary` also "succeeds" on a
                // PIN-enciphered blob and would record an address that belongs to nobody.
                //
                // There is no recorded address to check an unauthenticated reading against - the
                // missing details are the premise - so the only other reading that may be acted
                // on is an authenticated one, which is what one PIN prompt buys:
                // `CipherSeed::from_enciphered_bytes` verifies a tag. A dismissed or wrong PIN
                // falls through to the error below.
                let pin_locked = PinManager::pin_locked().await;
                let plain_seed = decode_plain_tari_seed(&tari_seed_binary);
                let tari_cipher_seed = match plain_seed {
                    Some(seed) => seed,
                    None => {
                        let prompted = if pin_locked {
                            match PinManager::prompt_pin_unvalidated(app_handle).await {
                                Ok(pin) => {
                                    tari_seed_candidates(&tari_seed_binary, Some(pin), pin_locked)
                                        .into_iter()
                                        .find(|candidate| candidate.authenticated)
                                        .map(|candidate| candidate.seed)
                                }
                                Err(_) => None,
                            }
                        } else {
                            None
                        };
                        prompted.ok_or_else(|| {
                            log::error!(
                                target: LOG_TARGET_APP_LOGIC,
                                "[validate_wallet_config_for_seed] could not parse Tari seed from binary: error=seed_decode wallet_id={} blob_len={} pin_locked={pin_locked}",
                                wallet_id.as_str(),
                                tari_seed_binary.len(),
                            );
                            anyhow!("Could not parse Tari Seed from binary")
                        })?
                    }
                };

                let tari_wallet_details =
                    InternalWallet::get_tari_wallet_details(wallet_id.clone(), tari_cipher_seed)
                        .await?;
                ConfigWallet::update_field(
                    ConfigWalletContent::set_tari_wallet_details,
                    Some(tari_wallet_details),
                )
                .await?;
            }
            // An owned tari wallet data accessible
        }

        Ok(true)
    }

    /// Initialise the wallet from its seed, all-or-nothing.
    ///
    /// The inner routine mutates two config fields before it can know whether it will succeed
    /// (the external-address reset, and the wallet details derived from the keyring blob). Both
    /// are snapshotted here and put back on failure, so a launch that ends in recovery leaves
    /// `config_wallet.json` as it found it.
    ///
    /// Keyring writes are never rolled back, and neither are the Monero address and id written by
    /// `adopt_legacy_monero_seed`: they are the only pointer to the entry holding the migrated
    /// seed, and undoing them would orphan it.
    pub async fn initialize_with_seed(app_handle: &tauri::AppHandle) -> Result<(), anyhow::Error> {
        let config_before = ConfigWallet::content().await;
        let external_address_before = config_before.selected_external_tari_address().clone();
        let wallet_details_before = config_before.tari_wallet_details().clone();
        drop(config_before);

        let result = InternalWallet::initialize_with_seed_inner(app_handle).await;

        if result.is_err() {
            let config_now = ConfigWallet::content().await;
            let external_address_changed =
                config_now.selected_external_tari_address() != &external_address_before;
            let wallet_details_changed = config_now
                .tari_wallet_details()
                .as_ref()
                .map(|d| d.id.clone())
                != wallet_details_before.as_ref().map(|d| d.id.clone());
            drop(config_now);

            if external_address_changed
                && let Err(e) = ConfigWallet::update_field(
                    ConfigWalletContent::set_selected_external_tari_address,
                    external_address_before,
                )
                .await
            {
                log::warn!(target: LOG_TARGET_APP_LOGIC, "Could not roll back the selected external Tari address after a failed wallet init: {e}");
            }
            if wallet_details_changed
                && let Err(e) = ConfigWallet::update_field(
                    ConfigWalletContent::set_tari_wallet_details,
                    wallet_details_before,
                )
                .await
            {
                log::warn!(target: LOG_TARGET_APP_LOGIC, "Could not roll back the cached Tari wallet details after a failed wallet init: {e}");
            }
        }

        result
    }

    // The migration decision tree. Every arm is a distinct on-disk state and the order the
    // states are tested in is the safety property, so it is kept in one place where it can be
    // read top to bottom rather than split across helpers.
    #[allow(clippy::too_many_lines)]
    async fn initialize_with_seed_inner(
        app_handle: &tauri::AppHandle,
    ) -> Result<(), anyhow::Error> {
        ConfigWallet::update_field(
            ConfigWalletContent::set_selected_external_tari_address,
            None,
        )
        .await?;
        let wallet_config = ConfigWallet::content().await;

        // Set by the legacy branch when the wallet could only be brought up view-only. It is
        // applied after `post_init`, so the recovery screen is raised over a wallet that already
        // shows the user's address and balance rather than over nothing at all.
        let mut pending_recovery: Option<WalletRecoveryReason> = None;

        let internal_wallet = if InternalWallet::validate_wallet_config_for_seed(
            app_handle,
            &wallet_config,
        )
        .await?
        {
            InternalWallet::load_latest_version(wallet_config).await?
        } else {
            let monero_address = wallet_config.monero_address().clone();
            let app_config_dir = app_handle
                .path()
                .app_config_dir()
                .map_err(|e| anyhow!("Couldn't get application config directory: {e}"))?;

            // The recovery placeholder has an empty `tari_wallets` list and reaches exactly this
            // branch, which would create a brand new wallet and orphan the user's seed in the
            // keyring. Refuse, and let `setup_manager` show the recovery UI.
            if wallet_config_is_corrupted_recovery(&wallet_config) {
                return Err(anyhow!(
                    "Wallet config was recovered from a corrupt file; refusing to create a new wallet"
                ));
            }

            // The migration decision tree. Every arm either adopts a wallet that already exists
            // or refuses; creating a fresh one is reachable from exactly one arm, and only when
            // nothing on disk suggests this machine ever had a wallet.
            match locate_legacy_wallet(&legacy_network_dir(&app_config_dir)) {
                LegacyWalletEvidence::Migratable(old_wallet_config) => {
                    match InternalWallet::migrate(app_handle, &app_config_dir, &old_wallet_config)
                        .await
                    {
                        Ok((tari_wallet_details, tari_seed_binary, monero_seed_binary)) => {
                            // The details come straight from the decrypted seed inside `migrate`.
                            // Re-deriving them by decoding the blob it just wrote would be
                            // unauthenticated: for a user who already had a PIN that blob is
                            // enciphered and the decode still succeeds, on an address that
                            // belongs to nobody. The keyring write is verified by read-back, so
                            // there is nothing to re-derive anyway.
                            InternalWallet {
                                tari_address_type: TariAddressType::Internal,
                                encrypted_tari_seed: Hidden::hide(Some(tari_seed_binary)),
                                encrypted_monero_seed: Hidden::hide(monero_seed_binary),
                                // Re-read: adopting the legacy Monero seed records the address
                                // it derives, so the value captured before the migration is
                                // stale exactly when it mattered (an empty one).
                                monero_address: ConfigWallet::content()
                                    .await
                                    .monero_address()
                                    .clone(),
                                external_tari_address: None,
                                tari_wallet_details: Some(tari_wallet_details),
                                seed_unavailable: None,
                            }
                        }
                        Err(LegacyMigrationError::SeedUndecryptable) => {
                            // The enciphered seed is on disk but no passphrase this machine has
                            // opens it, and `migrate` has quarantined the file so this is the
                            // last launch that tries. The address and view key in it are enough
                            // to keep the wallet visible.
                            pending_recovery = Some(WalletRecoveryReason::LegacySeedUndecryptable);
                            view_only_wallet_from_legacy(&old_wallet_config, monero_address)?
                        }
                        Err(LegacyMigrationError::Other(e)) => return Err(e),
                    }
                }
                LegacyWalletEvidence::ViewOnly(old_wallet_config) => {
                    // A previous launch already quarantined this file. Re-running the decrypt
                    // would only reproduce the failure, so come straight up view-only.
                    pending_recovery = Some(WalletRecoveryReason::LegacySeedUndecryptable);
                    view_only_wallet_from_legacy(&old_wallet_config, monero_address)?
                }
                LegacyWalletEvidence::Unreadable(problem) => {
                    // A legacy file exists and cannot be used. It may still hold the only copy of
                    // the seed, so the one thing that must not happen here is a new wallet.
                    log::error!(
                        target: LOG_TARGET_APP_LOGIC,
                        "[initialize_with_seed] legacy wallet files unusable: file={} error={}",
                        problem.file.as_tag(),
                        problem.kind.as_tag(),
                    );
                    enter_wallet_recovery(WalletRecoveryReason::LegacyConfigUnreadable).await;
                    return Err(anyhow!(
                        "A legacy wallet is present but its files could not be read; refusing to create a new wallet"
                    ));
                }
                LegacyWalletEvidence::None => {
                    // Create new wallet. The only arm that may, and only when the config is not
                    // a recovery placeholder (checked above) and nothing legacy is on disk.
                    //
                    // One last structural check: a config that *names* a wallet must never be
                    // answered with a new one, whatever led here. The cost of being wrong is the
                    // user's seed orphaned under an id nothing points at.
                    if !wallet_config.tari_wallets().is_empty() {
                        log::error!(
                            target: LOG_TARGET_APP_LOGIC,
                            "[initialize_with_seed] refusing to create a new wallet: the config already lists {} wallet id(s) but could not be validated",
                            wallet_config.tari_wallets().len(),
                        );
                        enter_wallet_recovery(WalletRecoveryReason::InitializationFailed).await;
                        return Err(anyhow!(
                            "The wallet config lists a wallet that could not be loaded; refusing to create a new one"
                        ));
                    }

                    let tari_seed = CipherSeed::random();
                    let (tari_wallet_details, tari_seed_binary) =
                        InternalWallet::add_tari_wallet(app_handle, tari_seed, None, false).await?;

                    let mut monero_seed_binary = None;
                    if monero_address.is_empty() {
                        let monero_seed = MoneroSeed::generate()?;
                        monero_seed_binary =
                            Some(InternalWallet::add_monero_wallet(monero_seed).await?);
                    };

                    InternalWallet {
                        tari_address_type: TariAddressType::Internal,
                        encrypted_tari_seed: Hidden::hide(Some(tari_seed_binary)),
                        encrypted_monero_seed: Hidden::hide(monero_seed_binary),
                        monero_address,
                        external_tari_address: None,
                        tari_wallet_details: Some(tari_wallet_details),
                        seed_unavailable: None,
                    }
                }
            }
        };

        let post_init_result = internal_wallet.post_init(app_handle).await;
        if post_init_result.is_ok()
            && let Some(reason) = pending_recovery
        {
            enter_wallet_recovery(reason).await;
        }
        post_init_result
    }

    // Handle all side effects here
    async fn post_init(&self, app_handle: &AppHandle) -> Result<(), anyhow::Error> {
        // Validate before publishing the instance: a wallet without an address must never become
        // the global instance, or every later reader sees a half-built wallet (see `current`).
        let _ = self.extract_tari_address()?;
        InternalWallet::set_current(self.clone()).await?;

        let state = app_handle.state::<UniverseAppState>();
        if let Some(ref wallet_details) = self.tari_wallet_details {
            // Internal(Seed)
            state
                .wallet_manager
                .set_view_private_key_and_spend_key(
                    wallet_details.view_private_key_hex.reveal().to_string(),
                    wallet_details.spend_public_key_hex.clone(),
                )
                .await;
        } else {
            // External(Seedless)
        }

        ConfigUI::handle_wallet_type_update(self.tari_address_type.clone()).await?;
        let tari_address = self.extract_tari_address()?;
        EventsEmitter::emit_selected_tari_address_changed(
            tari_address,
            self.tari_address_type.clone(),
        )
        .await;

        CpuPoolManager::handle_wallet_address_change(tari_address).await;
        GpuPoolManager::handle_wallet_address_change(tari_address).await;

        log::info!(
            "Wallet with {} address initialized successfully",
            self.tari_address_type.clone()
        );
        Ok(())
    }

    // ** Getters

    pub async fn tari_address() -> Result<TariAddress, anyhow::Error> {
        let internal_wallet_guard = InternalWallet::current()?.read().await;
        Ok(internal_wallet_guard.extract_tari_address()?.clone())
    }
    /// An initialised wallet always has exactly one of the two address sources set. Returning an
    /// error instead of panicking keeps an inconsistent instance (e.g. a half-applied mode switch)
    /// from taking down whichever task happened to read the address first.
    fn extract_tari_address(&self) -> Result<&TariAddress, anyhow::Error> {
        if let Some(ref external_tari_address) = self.external_tari_address {
            Ok(external_tari_address)
        } else if let Some(ref details) = self.tari_wallet_details {
            Ok(&details.tari_address)
        } else {
            Err(anyhow!(WALLET_NO_ADDRESS))
        }
    }

    pub async fn tari_wallet_details() -> Result<Option<TariWalletDetails>, anyhow::Error> {
        let internal_wallet_guard = InternalWallet::current()?.read().await;
        Ok(internal_wallet_guard.tari_wallet_details.clone())
    }
    // **

    pub async fn import_tari_seed_words(
        seed_words: Vec<String>,
        app_handle: &AppHandle,
    ) -> Result<(WalletId, Vec<u8>), anyhow::Error> {
        let tari_cipher_seed = mnemonic_to_tari_cipher_seed(seed_words).await?;
        let pin_password = PinManager::get_validated_pin_if_defined(app_handle, None).await?;

        // An import may replace a recovery placeholder: typing the seed words is proof the
        // wallet is the user's, and on Linux - where the credential store cannot be enumerated -
        // it is the only way out of a corrupted config.
        let (tari_wallet_details, tari_seed_binary) =
            InternalWallet::add_tari_wallet(app_handle, tari_cipher_seed, pin_password, true)
                .await?;

        InternalWallet::initialize_with_seed(app_handle).await?;

        Ok((tari_wallet_details.id, tari_seed_binary))
    }

    // Internal method
    //
    // Support only one wallet fow now
    // * Define if we want to have one PIN for all wallets
    /// `adopt_placeholder` is only ever true for a seed-word import, where the typed words prove
    /// the wallet is the user's. Every other caller refuses: writing a generated id into a
    /// recovery placeholder would lose the id the user's seed is actually stored under.
    async fn add_tari_wallet(
        app_handle: &AppHandle,
        tari_seed: CipherSeed, // decrypted seed
        pin_password_provided: Option<SafePassword>,
        adopt_placeholder: bool,
    ) -> Result<(TariWalletDetails, Vec<u8>), anyhow::Error> {
        if !adopt_placeholder {
            ConfigWallet::content().await.ensure_available()?;
        }
        let wallet_id = rand_utils::get_rand_string(6);
        log::info!(target: LOG_TARGET_APP_LOGIC, "Adding Tari Wallet with id: {wallet_id}");

        let encrypted_seed = if PinManager::pin_locked().await {
            let pin_password = match pin_password_provided {
                Some(p) => p,
                None => PinManager::get_validated_pin(app_handle, None).await?,
            };
            tari_seed.encipher(Some(pin_password))?
        } else {
            tari_seed
                .to_binary()
                .map_err(|e| anyhow!("Could not convert the Tari seed to binary: {e}"))?
        };

        let credentials = Credential {
            encrypted_seed: encrypted_seed.clone(),
        };

        InternalWallet::set_credentials(
            app_handle,
            WalletId::new(wallet_id.clone()),
            &credentials,
            true,
        )
        .await?;

        // We always load the first index
        let wallet_details =
            InternalWallet::get_tari_wallet_details(WalletId::new(wallet_id), tari_seed).await?;
        // One save either way, so the placeholder flag can never be cleared without a wallet id
        // landing with it.
        if adopt_placeholder {
            let monero_wallet = InternalWallet::monero_wallet_for_adoption().await?;
            ConfigWallet::adopt_recovered_wallet((wallet_details.clone(), monero_wallet)).await?;
        } else {
            ConfigWallet::update_field(
                ConfigWalletContent::add_tari_wallet,
                wallet_details.clone(),
            )
            .await?;
        }
        // The credential was written and read back, so the rate-limited probe must not keep
        // answering with a verdict about the wallet this one replaces.
        InternalWallet::note_seed_read(&wallet_details.id).await;

        // Modify the instance directly due to circular usage in initialze_seed
        if let Some(instance) = INSTANCE.get() {
            let mut internal_wallet_guard = instance.write().await;
            internal_wallet_guard.external_tari_address = None;
            internal_wallet_guard.tari_wallet_details = Some(wallet_details.clone());
            internal_wallet_guard.encrypted_tari_seed = Hidden::hide(Some(encrypted_seed.clone()));
        }
        Ok((wallet_details, encrypted_seed))
    }

    fn remove_tari_wallet(wallet_id: WalletId) -> Result<(), anyhow::Error> {
        log::info!(target: LOG_TARGET_APP_LOGIC, "Removing Tari Wallet with id: {wallet_id:?}");
        let cm = CredentialManager::new_default(wallet_id);
        cm.delete_credential()?;

        Ok(())
    }

    /// Store a newly generated Monero seed under an id that is not in use.
    ///
    /// Never writes over an existing Monero entry: the keyring blob is the only copy of a Monero
    /// seed there is, so a second generated seed goes to the next id in the sequence and the
    /// previous one stays where it is. Writes the keyring only, so the caller chooses which
    /// config write records the result.
    async fn store_new_monero_wallet(
        monero_seed: &MoneroSeed,
    ) -> Result<(String, WalletId, Vec<u8>), anyhow::Error> {
        let wallet_id = InternalWallet::allocate_monero_wallet_id().await?;
        log::info!(target: LOG_TARGET_APP_LOGIC, "Adding new Monero Wallet with id: {}", wallet_id.as_str());
        let cm = CredentialManager::new_default(wallet_id.clone());
        let monero_seed_binary = (*monero_seed.inner())
            .to_binary()
            .map_err(|e| anyhow!("Could not convert the Monero seed to binary: {e}"))?;

        let credentials = Credential {
            encrypted_seed: monero_seed_binary.clone(),
        };
        // Keyring first, config second. A crash in between leaves an entry the config does not
        // point at, which "find my wallets" can still show; the reverse order would leave the
        // config pointing at an id that holds nothing.
        cm.set_credentials(&credentials).await?;

        let monero_address = monero_seed
            .to_address::<Mainnet>()
            .unwrap_or(DEFAULT_MONERO_ADDRESS.to_string());
        Ok((monero_address, wallet_id, monero_seed_binary))
    }

    /// Generate a Monero wallet and record it in the config.
    async fn add_monero_wallet(monero_seed: MoneroSeed) -> Result<Vec<u8>, anyhow::Error> {
        // Same reason as `add_tari_wallet`: never write a wallet into a placeholder config.
        ConfigWallet::content().await.ensure_available()?;
        let (monero_address, wallet_id, monero_seed_binary) =
            InternalWallet::store_new_monero_wallet(&monero_seed).await?;
        ConfigWallet::update_field(
            ConfigWalletContent::set_generated_monero_wallet,
            (monero_address, wallet_id),
        )
        .await?;

        Ok(monero_seed_binary)
    }

    /// The Monero address and credential id a recovery adoption has to carry, or `None` when the
    /// config already names one.
    ///
    /// A config recovered from a corrupt file has no Monero address, and `load_latest_version`
    /// refuses a config without one, so adopting a wallet into a placeholder has to bring the
    /// Monero side with it. The seed already in the store is preferred - that keeps the user's
    /// payout address across the recovery - and a blob that cannot be read is replaced by a new
    /// seed at a free id rather than overwritten. Writes the keyring only: the config write is
    /// the caller's single adoption save, which is the only write a placeholder accepts.
    pub(crate) async fn monero_wallet_for_adoption()
    -> Result<Option<(String, WalletId)>, anyhow::Error> {
        if !ConfigWallet::content().await.monero_address().is_empty() {
            return Ok(None);
        }

        let linked = InternalWallet::monero_wallet_id().await;
        if let Ok(credential) = CredentialManager::new_default(linked.clone())
            .get_credentials()
            .await
            && let Some(recovered) = monero_wallet_from_blob(&linked, &credential.encrypted_seed)
        {
            log::info!(
                target: LOG_TARGET_APP_LOGIC,
                "[monero_wallet_for_adoption] recovered the stored Monero wallet: wallet_id={}",
                linked.as_str(),
            );
            return Ok(Some(recovered));
        }

        let monero_seed = MoneroSeed::generate()?;
        let (monero_address, wallet_id, _seed_binary) =
            InternalWallet::store_new_monero_wallet(&monero_seed).await?;
        log::info!(
            target: LOG_TARGET_APP_LOGIC,
            "[monero_wallet_for_adoption] generated a Monero wallet for the recovered config: wallet_id={}",
            wallet_id.as_str(),
        );
        Ok(Some((monero_address, wallet_id)))
    }

    /// Deliberately keeps the Monero credential.
    ///
    /// There is no second copy of a generated Monero seed anywhere unless the user exported the
    /// seed words, so deleting the entry makes every Monero payout ever mined to that address
    /// unrecoverable. Superseded ids are kept for the same reason.
    ///
    /// "Find my wallets" does not list these: a Monero seed is 32 raw bytes with no Tari address
    /// to derive, so `wallet_recovery::is_tari_wallet_id` filters Monero ids out. Keeping the
    /// entry preserves the seed for a support-led recovery, not for the UI.
    async fn remove_monero_wallet() -> Result<(), anyhow::Error> {
        let wallet_id = InternalWallet::monero_wallet_id().await;
        log::info!(
            target: LOG_TARGET_APP_LOGIC,
            "{LOG_MONERO_ENTRY_PRESERVED}: keeping the Monero credential wallet_id={}",
            wallet_id.as_str(),
        );

        Ok(())
    }

    /// Credential id the generated Monero seed currently lives under.
    ///
    /// Wallets created before Monero ids were versioned have no id in the config; they use the
    /// original `monero` entry and keep working unchanged.
    pub async fn monero_wallet_id() -> WalletId {
        ConfigWallet::content()
            .await
            .monero_wallet_id()
            .clone()
            .unwrap_or_else(|| WalletId::new(MONERO_WALLET_ID_LEGACY.to_string()))
    }

    /// Are these exact seed bytes stored under one of this app's Monero credential ids?
    ///
    /// The purge gate's proof that destroying `credentials_backup.bin` does not take the last
    /// copy of a Monero seed with it. Walks the id sequence and compares bytes: an entry that is
    /// PIN-enciphered, or that the store will not hand over, cannot be compared and so proves
    /// nothing, which leaves the answer `false` and the files where they are.
    async fn monero_seed_is_in_the_store(monero_seed: &[u8]) -> bool {
        let mut candidate = WalletId::new(MONERO_WALLET_ID_LEGACY.to_string());
        for _ in 0..MONERO_WALLET_ID_MAX_VERSIONS {
            if let Ok(credential) = CredentialManager::new_default(candidate.clone())
                .get_credentials()
                .await
                && credential.encrypted_seed == monero_seed
            {
                return true;
            }
            candidate = next_monero_wallet_id(&candidate);
        }
        false
    }

    /// The first Monero id in the sequence that holds nothing, starting from the linked one.
    ///
    /// An id whose readability cannot be determined counts as taken: the point is never to write
    /// over a seed, and "the store would not tell us" is not proof that an id is free.
    async fn allocate_monero_wallet_id() -> Result<WalletId, anyhow::Error> {
        let start = InternalWallet::monero_wallet_id().await;
        allocate_monero_wallet_id_with(start, |candidate| async move {
            // "The store would not tell us" is not proof that an id is free, so an unreadable
            // entry counts as taken.
            CredentialManager::new_default(candidate)
                .has_credentials()
                .await
                .unwrap_or(true)
        })
        .await
    }

    /// Set a new PIN for a user who lost the old one, proven by their Tari seed words.
    ///
    /// Write order is the same as `create_pin` and for the same reason: the seed blobs first,
    /// the `pin_locked` flag last. The Monero seed cannot be recovered from the Tari seed, so a
    /// new one is generated under a *new* credential id, leaving the previous Monero entry where
    /// it is and anything mined to the old address recoverable from the credential store.
    pub async fn recover_forgotten_pin(
        app_handle: &AppHandle,
        tari_seed: CipherSeed,
    ) -> Result<(), anyhow::Error> {
        let wallet_id = InternalWallet::tari_wallet_details()
            .await?
            .ok_or_else(|| anyhow!("Seedless Wallet does not support PIN enciphering"))?
            .id;
        let pin_password = PinManager::create_pin(app_handle).await?;

        // 1. Tari seed, enciphered with the new PIN.
        let encrypted_tari_seed = tari_seed.encipher(Some(pin_password.clone()))?;
        InternalWallet::set_credentials(
            app_handle,
            wallet_id,
            &Credential {
                encrypted_seed: encrypted_tari_seed.clone(),
            },
            false,
        )
        .await?;

        // 2. A fresh Monero seed under a fresh id; the old entry is left alone.
        let encrypted_monero_seed = if *ConfigWallet::content().await.monero_address_is_generated()
        {
            let monero_wallet_id = InternalWallet::allocate_monero_wallet_id().await?;
            let monero_seed = MoneroSeed::generate()?;
            let encrypted_monero_seed = cryptography::encrypt(monero_seed.inner(), &pin_password)?;
            InternalWallet::set_credentials(
                app_handle,
                monero_wallet_id.clone(),
                &Credential {
                    encrypted_seed: encrypted_monero_seed.clone(),
                },
                false,
            )
            .await?;
            let monero_address = monero_seed
                .to_address::<Mainnet>()
                .unwrap_or(DEFAULT_MONERO_ADDRESS.to_string());
            log::info!(
                target: LOG_TARGET_APP_LOGIC,
                "New Monero wallet generated during PIN recovery: wallet_id={}",
                monero_wallet_id.as_str(),
            );
            ConfigWallet::update_field(
                ConfigWalletContent::set_generated_monero_wallet,
                (monero_address, monero_wallet_id),
            )
            .await?;

            Some(encrypted_monero_seed)
        } else {
            None // External Monero address, no seed to recover
        };

        // 3. Only now the flag.
        PinManager::set_pin_locked().await?;

        if let Some(instance) = INSTANCE.get() {
            let mut internal_wallet_guard = instance.write().await;
            internal_wallet_guard.encrypted_monero_seed = Hidden::hide(encrypted_monero_seed);
            internal_wallet_guard.encrypted_tari_seed =
                Hidden::hide(Some(encrypted_tari_seed.clone()));
        }

        Ok(())
    }

    /// Encipher the wallet's seeds with a new PIN.
    ///
    /// Refuses to run when a PIN is already set: without the check, a second call reads the
    /// already-enciphered Monero blob as plaintext and enciphers it again, which nothing can undo.
    ///
    /// Order of writes, and why:
    ///
    /// 1. Both seeds are read and the PIN is taken *before* anything is written, so a failure to
    ///    read - a missing keyring entry, a cancelled prompt - costs nothing.
    /// 2. The Tari blob, then the Monero blob, then the `pin_locked` flag.
    ///
    /// `pin_locked` is the config's claim about how the blobs are encoded, so the flag must be
    /// written last. A crash before it leaves enciphered blobs with the flag still false, which
    /// the decode path repairs with one PIN prompt. The opposite order would leave the flag true
    /// over plaintext blobs, sending every later PIN entry through the failed-attempt counter.
    /// Each blob is self-describing, so a crash between the two is recoverable the same way.
    pub async fn create_pin(app_handle: &AppHandle) -> Result<(), anyhow::Error> {
        if PinManager::pin_locked().await {
            // Not a defect and not reported: the UI should not have offered this. Returning an
            // error is what keeps the double-encryption path closed.
            log::warn!(
                target: LOG_TARGET_APP_LOGIC,
                "[create_pin] refused: a PIN is already set for this wallet",
            );
            return Err(anyhow!("A PIN is already set for this wallet"));
        }

        let monero_is_generated = *ConfigWallet::content().await.monero_address_is_generated();

        // 1. Read everything first. Nothing has been written at this point, so any failure here
        //    leaves the wallet exactly as it was.
        let tari_seed = InternalWallet::get_tari_seed(None).await?;
        let wallet_id = InternalWallet::tari_wallet_details()
            .await?
            .ok_or_else(|| anyhow!("Seedless Wallet does not support PIN enciphering"))?
            .id;
        let monero_seed = if monero_is_generated {
            Some(InternalWallet::get_monero_seed(None).await?)
        } else {
            // External Monero address is used, no seed to encrypt
            None
        };
        if PinManager::pin_locked().await {
            // Reading the seeds can repair a `pin_locked` flag that was false only because an
            // earlier `create_pin` died before its last write. In that case a PIN already exists
            // and this call must stop rather than encipher the blobs a second time.
            log::warn!(
                target: LOG_TARGET_APP_LOGIC,
                "[create_pin] refused: the recorded PIN state was repaired while reading the seeds",
            );
            return Err(anyhow!("A PIN is already set for this wallet"));
        }
        let pin_password = PinManager::create_pin(app_handle).await?;

        // 2. Tari blob.
        let encrypted_tari_seed = tari_seed.encipher(Some(pin_password.clone()))?;
        InternalWallet::set_credentials(
            app_handle,
            wallet_id,
            &Credential {
                encrypted_seed: encrypted_tari_seed.clone(),
            },
            false,
        )
        .await?;

        // 3. Monero blob, under the id it already lives at: the bytes are the same seed, only
        //    enciphered, so this is not a new wallet and must not consume a new id.
        let encrypted_monero_seed = if let Some(monero_seed) = monero_seed {
            let encrypted_monero_seed = cryptography::encrypt(monero_seed.inner(), &pin_password)?;
            InternalWallet::set_credentials(
                app_handle,
                InternalWallet::monero_wallet_id().await,
                &Credential {
                    encrypted_seed: encrypted_monero_seed.clone(),
                },
                false,
            )
            .await?;
            Some(encrypted_monero_seed)
        } else {
            None
        };

        // 4. Only now the flag, and only now the cached blobs.
        PinManager::set_pin_locked().await?;

        if let Some(instance) = INSTANCE.get() {
            let mut internal_wallet_guard = instance.write().await;
            internal_wallet_guard.encrypted_monero_seed = Hidden::hide(encrypted_monero_seed);
            internal_wallet_guard.encrypted_tari_seed =
                Hidden::hide(Some(encrypted_tari_seed.clone()));
        }

        Ok(())
    }

    async fn get_credentials(
        app_handle: &AppHandle,
        id: WalletId,
        forced: bool,
    ) -> Result<Credential, anyhow::Error> {
        let cm = CredentialManager::new_default(id);
        let seed = if forced {
            // Infinitely retry until the user proceeds with keyring
            retry_with_keyring_dialog(
                app_handle,
                || cm.get_credentials(),
                "Failed to get credentials",
            )
            .await?
            .encrypted_seed
        } else {
            // No retries
            cm.get_credentials().await?.encrypted_seed
        };
        Ok(Credential {
            encrypted_seed: seed,
        })
    }

    async fn set_credentials(
        app_handle: &AppHandle,
        id: WalletId,
        credential: &Credential,
        forced: bool,
    ) -> Result<(), anyhow::Error> {
        let cm = CredentialManager::new_default(id);
        if forced {
            // Infinitely retry until the user proceed with keyring
            retry_with_keyring_dialog(
                app_handle,
                || cm.set_credentials(credential),
                "Failed to set credentials",
            )
            .await?;
        } else {
            // No retries
            cm.set_credentials(credential).await?;
        }
        Ok(())
    }

    async fn load_latest_version(
        wallet_config: ConfigWalletContent,
    ) -> Result<InternalWallet, anyhow::Error> {
        log::info!(target: LOG_TARGET_APP_LOGIC, "Internal Wallet latest version detected.");
        // The same check every write into a recovery placeholder has to pass, so a config this
        // build persists is one this build can open again.
        wallet_config.ensure_loadable()?;
        let monero_address = wallet_config.monero_address().clone();
        let tari_wallet_id = (*wallet_config.tari_wallets())
            .first()
            .cloned()
            .ok_or_else(|| anyhow!("Tari wallets field should be defined in the wallet config"))?;

        // Only details that were already on disk mean "nothing on the startup path reads the
        // keyring", which is the case the probe exists for. Probing right after a successful
        // forced read would cost a macOS user a second keychain prompt for a known answer.
        let details_were_cached = wallet_config.tari_wallet_details().is_some();

        // `validate_wallet_config_for_seed` derives and stores the details for this id before it
        // answers `true`, so the re-read always finds them.
        let tari_wallet_details = ConfigWallet::content()
            .await
            .tari_wallet_details()
            .clone()
            .ok_or_else(|| anyhow!("Wallet details are missing for the configured wallet"))?;
        log_wallet_details("load_latest_version", "wallet_config", &tari_wallet_details);

        // The cached details make every other startup step work without opening the keyring, so
        // a deleted or unreadable entry would otherwise stay invisible until the user tried to
        // spend. Probe it once, read-only, right here.
        let seed_unavailable = if details_were_cached {
            InternalWallet::probe_tari_seed_at_startup(&tari_wallet_id).await
        } else {
            None
        };

        Ok(InternalWallet {
            tari_address_type: TariAddressType::Internal,
            encrypted_tari_seed: Hidden::hide(None), // Prompt when needed
            encrypted_monero_seed: Hidden::hide(None), // Prompt when needed
            monero_address,
            external_tari_address: None,
            tari_wallet_details: Some(tari_wallet_details),
            seed_unavailable,
        })
    }

    /// One read-only keyring probe for `tari_wallets[0]`, run only when the wallet config already
    /// carried the wallet details and nothing else on the startup path would touch the keyring.
    /// It never creates, writes or deletes; it returns the failure kind for the UI and the
    /// support bundle to name.
    ///
    /// macOS re-shows the system dialog on every read of an item approved with "Allow" rather
    /// than "Always Allow", so there the probe runs at most once per `SEED_PROBE_MIN_INTERVAL`
    /// (24h). The non-secret timestamp and outcome tag live in the wallet config, which is the
    /// only store written atomically under a single writer lock. Only the rate-limited platforms
    /// record them: elsewhere the value would never be read and the extra write buys nothing.
    async fn probe_tari_seed_at_startup(wallet_id: &WalletId) -> Option<SeedProbeErrorKind> {
        let wallet_config = ConfigWallet::content().await;
        let last_probe = match *wallet_config.seed_probe_last_unix() {
            0 => None,
            probed_at => Some(probed_at),
        };
        let last_outcome = wallet_config.seed_probe_last_outcome().clone();
        let last_wallet_id = wallet_config.seed_probe_last_wallet_id().clone();
        drop(wallet_config);

        // A record about another wallet cannot rate-limit this one: the read it stands for never
        // touched this entry.
        let record_is_for_this_wallet = last_wallet_id.as_ref() == Some(wallet_id);
        if record_is_for_this_wallet
            && decide_seed_probe(
                SEED_PROBE_IS_RATE_LIMITED,
                last_probe,
                unix_now(),
                SEED_PROBE_MIN_INTERVAL_SECS,
            ) == SeedProbeDecision::Skip
        {
            // Skipping the read must not discard what the last one concluded: a restart inside
            // the rate-limit window would otherwise come up as if the seed were fine and let
            // mining and telemetry run against a wallet whose seed is still gone.
            let remembered = remembered_seed_probe_outcome(
                last_wallet_id.as_ref(),
                last_outcome.as_deref(),
                wallet_id,
            );
            log::info!(
                target: LOG_TARGET_APP_LOGIC,
                "Startup seed probe skipped: rate limited on this platform, last outcome={}",
                last_outcome.as_deref().unwrap_or("none"),
            );
            return remembered;
        }

        let result = CredentialManager::new_default(wallet_id.clone())
            .get_credentials()
            .await;
        // Hand the raw read to the support bundle so `wallet_status.json` reports what the
        // keyring said *at launch* instead of reading - and on macOS prompting - a second time.
        // Only the length and shape of the blob are kept; the blob never leaves here.
        crate::feedback::record_startup_probe_outcome(wallet_id.as_str(), true, &result);
        let outcome = match &result {
            Ok(credential) => {
                log::info!(
                    target: LOG_TARGET_APP_LOGIC,
                    "Startup seed probe: outcome=ok wallet_id={} blob_len={} pin_locked={}",
                    wallet_id.as_str(),
                    credential.encrypted_seed.len(),
                    PinManager::pin_locked().await,
                );
                SeedProbeOutcome::Ok
            }
            Err(e) => classify_seed_probe_error(e, SEED_PROBE_STORE_CAN_DENY),
        };

        // Best effort: a result that cannot be persisted only means the next launch probes
        // again. The write is refused outright while the config is the recovery placeholder,
        // which is correct - that config must never reach the disk.
        if SEED_PROBE_IS_RATE_LIMITED
            && let Err(e) = ConfigWallet::update_field(
                ConfigWalletContent::set_seed_probe_result,
                (unix_now(), outcome.as_tag(), wallet_id.clone()),
            )
            .await
        {
            log::debug!(target: LOG_TARGET_APP_LOGIC, "Could not record the startup seed probe result: {e}");
        }

        match outcome {
            SeedProbeOutcome::Ok => None,
            SeedProbeOutcome::Inconclusive(kind) => {
                // macOS "the user did not let us in" (cancelled prompt, locked keychain). Not a
                // defect and not proof the seed is gone, so: no Sentry, no recovery state.
                log::warn!(
                    target: LOG_TARGET_APP_LOGIC,
                    "Startup seed probe inconclusive: error={} wallet_id={} pin_locked={}",
                    kind.as_tag(),
                    wallet_id.as_str(),
                    PinManager::pin_locked().await,
                );
                None
            }
            SeedProbeOutcome::Unavailable(kind) => {
                log::error!(
                    target: LOG_TARGET_APP_LOGIC,
                    "Startup seed probe failed: error={} wallet_id={} pin_locked={}",
                    kind.as_tag(),
                    wallet_id.as_str(),
                    PinManager::pin_locked().await,
                );
                report_seed_unavailable_at_startup(kind);
                Some(kind)
            }
        }
    }

    /// Records that this wallet's seed was just read from the store.
    ///
    /// The rate-limited probe answers from this record, so a read that succeeded has to replace
    /// whatever an earlier wallet left behind: without it a re-link or an import keeps re-entering
    /// recovery for the rest of the 24h window on the strength of a verdict about another entry.
    /// Best effort - a record that cannot be written only costs one extra probe.
    pub(crate) async fn note_seed_read(wallet_id: &WalletId) {
        if !SEED_PROBE_IS_RATE_LIMITED {
            return;
        }
        if let Err(e) = ConfigWallet::update_field(
            ConfigWalletContent::set_seed_probe_result,
            (unix_now(), SeedProbeOutcome::Ok.as_tag(), wallet_id.clone()),
        )
        .await
        {
            log::debug!(target: LOG_TARGET_APP_LOGIC, "Could not record a successful seed read: {e}");
        }
    }

    /// The failure kind recorded by the startup probe, if the seed could not be read.
    pub async fn seed_unavailable() -> Result<Option<SeedProbeErrorKind>, anyhow::Error> {
        let internal_wallet_guard = InternalWallet::current()?.read().await;
        Ok(internal_wallet_guard.seed_unavailable)
    }

    /// Reads the legacy credential through `LegacyCredentialManager`, with the macOS keychain
    /// dialog loop. Kept for the one case where it is still the right tool: nothing else could be
    /// read and the keyring may only be locked rather than empty.
    async fn get_legacy_credentials_forced(
        app_handle: &AppHandle,
        app_config_dir: &Path,
    ) -> Result<LegacyCredential, anyhow::Error> {
        let legacy_cm = LegacyCredentialManager::new_default(app_config_dir.to_path_buf());
        let legacy_credential = retry_with_keyring_dialog(
            app_handle,
            || legacy_cm.get_credentials(),
            "Failed to get credentials",
        )
        .await?;
        Ok(legacy_credential)
    }

    /// Collects every legacy passphrase this machine still has, plus the legacy Monero seed.
    /// Never fatal: a source that is missing, locked or corrupt costs one candidate and is logged
    /// with an enum-like error kind.
    async fn legacy_credential_parts(
        app_handle: &AppHandle,
        app_config_dir: &Path,
    ) -> LegacyCredentialParts {
        let network_dir = legacy_network_dir(app_config_dir);

        let fallback_credential = match read_legacy_fallback_credential(&network_dir) {
            Ok(credential) => credential,
            Err(kind) => {
                log::warn!(
                    target: LOG_TARGET_APP_LOGIC,
                    "Legacy fallback credential file could not be used: error={}",
                    kind.as_tag(),
                );
                None
            }
        };

        let keyring_credential = match read_legacy_keyring_credential() {
            Ok(credential) => credential,
            Err(kind) => {
                log::warn!(
                    target: LOG_TARGET_APP_LOGIC,
                    "Legacy keyring credential could not be used: error={}",
                    kind.as_tag(),
                );
                None
            }
        };

        // Last resort: the entry may be unreadable only because the keychain is locked, which the
        // standard macOS dialog can fix. Worth a prompt only when nothing else was found.
        let keyring_credential = match keyring_credential {
            Some(credential) => Some(credential),
            None if fallback_credential.is_none() => {
                match InternalWallet::get_legacy_credentials_forced(app_handle, app_config_dir)
                    .await
                {
                    Ok(credential) => Some(credential),
                    Err(_) => {
                        log::warn!(target: LOG_TARGET_APP_LOGIC, "No legacy credential store could be read; continuing with the passphrases left");
                        None
                    }
                }
            }
            None => None,
        };

        let monero_seed = keyring_credential
            .as_ref()
            .and_then(|credential| credential.monero_seed)
            .or_else(|| {
                fallback_credential
                    .as_ref()
                    .and_then(|credential| credential.monero_seed)
            })
            .map(|seed| seed.to_vec());

        LegacyCredentialParts {
            keyring_passphrase: keyring_credential
                .and_then(|credential| credential.tari_seed_passphrase),
            fallback_passphrase: fallback_credential
                .and_then(|credential| credential.tari_seed_passphrase),
            monero_seed,
        }
    }

    /// One-shot migration of a pre-v1.2.24 wallet into the per-wallet keyring store.
    ///
    /// A seed no passphrase opens quarantines the legacy file and returns `SeedUndecryptable`, so
    /// the next launch cannot repeat the failure. Every passphrase source is tried in a fixed
    /// order, and the Tari seed is decrypted *before* the Monero credential is written, so a
    /// failed migration cannot leave a Monero entry pointing at a wallet nothing adopted.
    async fn migrate(
        app_handle: &AppHandle,
        app_config_dir: &Path,
        old_wallet_config: &LegacyWalletConfig,
    ) -> Result<(TariWalletDetails, Vec<u8>, Option<Vec<u8>>), LegacyMigrationError> {
        let parts = InternalWallet::legacy_credential_parts(app_handle, app_config_dir).await;
        let monero_seed_binary = parts.monero_seed;
        let candidates = legacy_passphrase_candidates(
            parts.keyring_passphrase,
            parts.fallback_passphrase,
            old_wallet_config.passphrase.clone(),
        );
        let candidates_tried = candidates.len();

        let (tari_seed, source) = match decrypt_legacy_tari_seed(
            &old_wallet_config.seed_words_encrypted_base58,
            candidates,
        ) {
            Ok(decrypted) => decrypted,
            Err(kind) => {
                log::error!(
                    target: LOG_TARGET_APP_LOGIC,
                    "[migrate] legacy Tari seed did not decrypt: error={} sources_tried={candidates_tried}",
                    kind.as_tag(),
                );
                report_legacy_decrypt_failed(kind);
                // Break the loop. With the file renamed there is nothing migratable left, so the
                // next launch comes up view-only instead of failing the same decrypt again.
                match quarantine_legacy_file(
                    &legacy_network_dir(app_config_dir).join(LEGACY_WALLET_CONFIG_FILE_NAME),
                    LEGACY_DECRYPT_FAILED_SUFFIX,
                ) {
                    Ok(Some(_)) => {
                        log::warn!(target: LOG_TARGET_APP_LOGIC, "Quarantined the legacy wallet config after a failed decrypt");
                    }
                    Ok(None) => {}
                    Err(e) => {
                        log::error!(target: LOG_TARGET_APP_LOGIC, "Could not quarantine the legacy wallet config: {e}");
                    }
                }
                return Err(LegacyMigrationError::SeedUndecryptable);
            }
        };
        log::info!(
            target: LOG_TARGET_APP_LOGIC,
            "[migrate] legacy Tari seed decrypted: passphrase_source_index={} source={}",
            source.index(),
            source.as_tag(),
        );

        // Monero second, and only now. Writing the Monero credential for a migration that then
        // fails leaves the keyring holding a seed for a wallet the app never adopted.
        if let Some(ref monero_seed) = monero_seed_binary {
            InternalWallet::adopt_legacy_monero_seed(app_handle, monero_seed)
                .await
                .map_err(LegacyMigrationError::Other)?;
        } else {
            log::info!(target: LOG_TARGET_APP_LOGIC, "Monero Seed not found for migration");
        }

        let (tari_wallet_details, tari_seed_binary) =
            InternalWallet::add_tari_wallet(app_handle, tari_seed, None, false)
                .await
                .map_err(LegacyMigrationError::Other)?;

        Ok((tari_wallet_details, tari_seed_binary, monero_seed_binary))
    }

    /// Stores the Monero seed carried by a legacy wallet under a credential id that is free.
    ///
    /// The unversioned `monero` id may already hold a different seed - from an earlier migration
    /// attempt, or from a wallet created before the legacy files were found - and an overwrite
    /// there is unrecoverable. Ids come from the same sequence `add_monero_wallet` uses, which
    /// skips any id that is occupied or whose readability cannot be determined; on a clean
    /// machine that still yields exactly `monero`.
    ///
    /// The config is pointed at the id together with the address it derives, so the two can never
    /// diverge. A Monero address the user chose themselves is never replaced.
    async fn adopt_legacy_monero_seed(
        app_handle: &AppHandle,
        monero_seed: &[u8],
    ) -> Result<(), anyhow::Error> {
        let monero_wallet_id = InternalWallet::allocate_monero_wallet_id().await?;
        log::info!(
            target: LOG_TARGET_APP_LOGIC,
            "[migrate] storing the legacy Monero seed: wallet_id={}",
            monero_wallet_id.as_str(),
        );
        InternalWallet::set_credentials(
            app_handle,
            monero_wallet_id.clone(),
            &Credential {
                encrypted_seed: monero_seed.to_vec(),
            },
            true,
        )
        .await?;

        let wallet_config = ConfigWallet::content().await;
        if !wallet_config.monero_address().is_empty()
            && !*wallet_config.monero_address_is_generated()
        {
            log::info!(
                target: LOG_TARGET_APP_LOGIC,
                "[migrate] keeping the Monero address already configured; the legacy seed is stored but not linked",
            );
            return Ok(());
        }

        let Some(monero_address) = <[u8; MONERO_SEED_LENGTH]>::try_from(monero_seed)
            .ok()
            .and_then(|bytes| MoneroSeed::new(bytes).to_address::<Mainnet>().ok())
        else {
            // The seed is kept either way - it is the only copy - but nothing is linked to a
            // wallet whose address could not be derived.
            log::warn!(
                target: LOG_TARGET_APP_LOGIC,
                "[migrate] legacy Monero seed did not yield an address: blob_len={}",
                monero_seed.len(),
            );
            return Ok(());
        };
        ConfigWallet::update_field(
            ConfigWalletContent::set_generated_monero_wallet,
            (monero_address, monero_wallet_id),
        )
        .await
    }

    /// Retires the legacy credential files left behind after a migration to the keyring-backed
    /// store. A no-op when nothing is left to clean, so only users who still have the legacy
    /// files reach the keyring reads below. Those reads are forced: on macOS that shows the
    /// standard keychain dialog at the moment of need rather than deferring forever on a locked
    /// keychain. A missing entry defers the cleanup to a later launch.
    ///
    /// Must be called from a path common to all wallet modes, because a user can switch modes
    /// after migrating and would otherwise keep these files forever. Only the current network
    /// directory is handled, because the keyring entries used as the safety gate are
    /// network-specific.
    ///
    /// The gate has two halves: every wallet the config lists must be readable right now, and the
    /// wallet *these files describe* must be one of them - the legacy seed is decrypted with the
    /// same multi-source passphrase logic the migration uses and the address it derives must
    /// match. Anything unprovable leaves both files exactly where they are.
    // A sequence of gates that must all pass before an irreversible deletion. Splitting it
    // would let a future edit reorder or skip one without that being obvious at the call site.
    #[allow(clippy::too_many_lines)]
    pub async fn purge_legacy_credential_files(app_handle: &AppHandle) {
        let app_config_dir = match app_handle.path().app_config_dir() {
            Ok(dir) => dir,
            Err(e) => {
                log::warn!(target: LOG_TARGET_APP_LOGIC, "Legacy credential cleanup skipped, no app config dir: {e}");
                return;
            }
        };
        let legacy_dir = legacy_network_dir(&app_config_dir);
        let fallback_file = legacy_dir.join(LEGACY_FALLBACK_FILE_NAME);
        let legacy_wallet_config = legacy_dir.join(LEGACY_WALLET_CONFIG_FILE_NAME);

        if !fallback_file.exists() && !legacy_wallet_config.exists() {
            return;
        }

        if !InternalWallet::is_initialized() {
            log::info!(target: LOG_TARGET_APP_LOGIC, "Legacy credential cleanup deferred, wallet not initialised");
            return;
        }

        // Safety gate, first half: never delete the only remaining copy of a seed. The current
        // config must be at exactly the schema version this code understands and every configured
        // Tari wallet must be readable from the keyring right now: new wallets are prepended to
        // the list, so the migrated wallet is not necessarily the first entry.
        let wallet_config = ConfigWallet::content().await;
        if *wallet_config.version_counter() != WALLET_VERSION {
            return;
        }
        if wallet_config.tari_wallets().is_empty() {
            return;
        }

        // The addresses the config can vouch for. The cached details cover the PIN-enciphered
        // case; every blob that is not enciphered contributes its own derived address too, so a
        // migrated wallet pushed down the list by an import still matches.
        let mut configured_addresses: Vec<TariAddress> = Vec::new();
        if let Some(details) = wallet_config.tari_wallet_details() {
            configured_addresses.push(details.tari_address.clone());
        }
        for wallet_id in wallet_config.tari_wallets() {
            let credential = match InternalWallet::get_credentials(
                app_handle,
                wallet_id.clone(),
                true,
            )
            .await
            {
                Ok(credential) => credential,
                Err(e) => {
                    let id = wallet_id.as_str();
                    log::info!(target: LOG_TARGET_APP_LOGIC, "Legacy credential cleanup deferred, Tari keyring entry for wallet {id} not readable: {e}");
                    return;
                }
            };
            // Only a blob that proves it is a plain seed contributes an address: an enciphered
            // blob also decodes under plain `from_binary`, deriving an address that belongs to no
            // wallet, which must never enter the list the purge is decided against.
            if let Some(seed) = decode_plain_tari_seed(&credential.encrypted_seed)
                && let Ok(details) =
                    InternalWallet::get_tari_wallet_details(wallet_id.clone(), seed).await
            {
                configured_addresses.push(details.tari_address);
            }
        }

        // A Monero seed in the legacy file must itself be somewhere in the credential store, so
        // the bytes are compared: the currently linked entry may hold a different seed after a
        // "forgot PIN" recovery. Fails closed - only a genuinely empty file skips the check.
        if fallback_file.exists() {
            let bytes = match std::fs::read(&fallback_file) {
                Ok(bytes) => bytes,
                Err(e) => {
                    log::warn!(target: LOG_TARGET_APP_LOGIC, "Legacy credential cleanup deferred, cannot read the legacy credential file: {e}");
                    return;
                }
            };
            if !bytes.is_empty() {
                let legacy_credential = match serde_cbor::from_slice::<LegacyCredential>(&bytes) {
                    Ok(credential) => credential,
                    Err(e) => {
                        log::warn!(target: LOG_TARGET_APP_LOGIC, "Legacy credential cleanup deferred, cannot parse the legacy credential file: {e}");
                        return;
                    }
                };
                if let Some(monero_seed) = legacy_credential.monero_seed
                    && !InternalWallet::monero_seed_is_in_the_store(&monero_seed).await
                {
                    log::info!(target: LOG_TARGET_APP_LOGIC, "Legacy credential cleanup deferred, the legacy Monero seed is not in the credential store");
                    return;
                }
            }
        }

        // Safety gate, second half: the address the legacy seed derives must be one the config
        // owns. Without this, a user whose migration failed and who then created or imported a
        // different wallet passes everything above, and the last copy of their original seed is
        // destroyed on the next launch.
        let proof = match get_old_wallet_config(&legacy_wallet_config) {
            Err(kind) => {
                log::warn!(
                    target: LOG_TARGET_APP_LOGIC,
                    "Legacy credential cleanup deferred, legacy wallet config unusable: error={}",
                    kind.as_tag(),
                );
                return;
            }
            Ok(None) => LegacySeedProof::NoLegacyConfig,
            Ok(Some(legacy_config)) => {
                let parts =
                    InternalWallet::legacy_credential_parts(app_handle, &app_config_dir).await;
                let candidates = legacy_passphrase_candidates(
                    parts.keyring_passphrase,
                    parts.fallback_passphrase,
                    legacy_config.passphrase.clone(),
                );
                match decrypt_legacy_tari_seed(
                    &legacy_config.seed_words_encrypted_base58,
                    candidates,
                ) {
                    Err(kind) => {
                        log::info!(
                            target: LOG_TARGET_APP_LOGIC,
                            "Legacy seed could not be decrypted for the cleanup gate: error={}",
                            kind.as_tag(),
                        );
                        LegacySeedProof::Undecryptable
                    }
                    Ok((seed, _source)) => {
                        match InternalWallet::get_tari_wallet_details(
                            WalletId::new(LEGACY_VIEW_ONLY_WALLET_ID.to_string()),
                            seed,
                        )
                        .await
                        {
                            Ok(details) => LegacySeedProof::Address(details.tari_address),
                            Err(e) => {
                                log::warn!(target: LOG_TARGET_APP_LOGIC, "Could not derive the legacy address for the cleanup gate: {e}");
                                LegacySeedProof::Undecryptable
                            }
                        }
                    }
                }
            }
        };

        let quarantined_config_present =
            quarantined_path(&legacy_wallet_config, LEGACY_DECRYPT_FAILED_SUFFIX).exists();
        match legacy_purge_decision(&proof, &configured_addresses, quarantined_config_present) {
            LegacyPurgeDecision::Defer(reason) => {
                log::info!(target: LOG_TARGET_APP_LOGIC, "Legacy credential cleanup deferred: reason={reason}");
                return;
            }
            LegacyPurgeDecision::Purge => {}
        }

        // Destroyed, not renamed: an Era-1 `wallet_config.json` holds an enciphered seed and the
        // passphrase that opens it in the same document, so a renamed copy is self-decrypting
        // recovery material left on disk. Everything above has already proven the seed is in the
        // credential store under an address this config owns.
        match wipe_and_remove_file(&legacy_wallet_config) {
            Ok(true) => {
                log::info!(target: LOG_TARGET_APP_LOGIC, "Removed the migrated legacy wallet config");
            }
            Ok(false) => {}
            Err(e) => {
                log::warn!(target: LOG_TARGET_APP_LOGIC, "Could not remove the legacy wallet config: {e}");
            }
        }
        match wipe_and_remove_file(&fallback_file) {
            Ok(true) => {
                log::info!(target: LOG_TARGET_APP_LOGIC, "Removed the plaintext legacy credential file");
            }
            Ok(false) => {}
            Err(e) => {
                log::warn!(target: LOG_TARGET_APP_LOGIC, "Could not remove the plaintext legacy credential file: {e}");
            }
        }
    }

    pub async fn get_tari_wallet_details(
        wallet_id: WalletId,
        tari_cipher_seed: CipherSeed,
    ) -> Result<TariWalletDetails, anyhow::Error> {
        let wallet_birthday = tari_cipher_seed.birthday();

        // Get a real error up in here
        let seed_words_wallet =
            SeedWordsWallet::construct_new(tari_cipher_seed).map_err(|e| anyhow!(e.to_string()))?;
        let wallet = WalletType::SeedWords(seed_words_wallet);
        let key_manager = KeyManager::new(wallet)?;

        let comms_pub_key = key_manager.get_spend_key().pub_key;
        let view_key = key_manager.get_view_key();
        let view_key_public = view_key.pub_key;
        let view_key_private = key_manager.get_private_view_key();

        let network = Network::get_current_or_user_setting_or_default();
        let tari_address = TariAddress::new_dual_address(
            view_key_public.clone(),
            comms_pub_key.clone(),
            network,
            TariAddressFeatures::create_one_sided_only(),
            None,
        )
        .map_err(|e| anyhow!(e.to_string()))?;

        Ok(TariWalletDetails {
            id: wallet_id,
            tari_address,
            wallet_birthday,
            spend_public_key_hex: comms_pub_key.to_hex(),
            view_private_key_hex: ViewPrivateKeyHex::new(view_key_private.to_hex()),
        })
    }

    /** Method safe to use before init - fallbacks to the credential manager */
    pub async fn get_tari_seed(
        pin_password: Option<SafePassword>,
    ) -> Result<CipherSeed, anyhow::Error> {
        let encrypted_tari_seed = {
            let state_result = if let Some(instance) = INSTANCE.get() {
                let internal_wallet = instance.read().await;
                internal_wallet.encrypted_tari_seed.reveal().clone()
            } else {
                None
            };

            // Try to get from state
            if let Some(encrypted_tari_seed) = state_result {
                encrypted_tari_seed
            }
            // Try to get from credentials
            else {
                let wallets = ConfigWallet::content().await.tari_wallets().clone();
                if let Some(wallet_id) = wallets.first() {
                    let result = CredentialManager::new_default(wallet_id.clone())
                        .get_credentials()
                        .await;

                    match result {
                        Ok(cred) => {
                            // Update store if not yet set to store. The instance may not exist
                            // yet (this method is documented as usable before init), in which
                            // case there is simply nothing to cache into.
                            if let Some(instance) = INSTANCE.get() {
                                let mut internal_wallet_guard = instance.write().await;
                                internal_wallet_guard.encrypted_tari_seed =
                                    Hidden::hide(Some(cred.encrypted_seed.clone()));
                            }
                            InternalWallet::note_seed_read(wallet_id).await;
                            cred.encrypted_seed
                        }
                        Err(e) => {
                            // Diagnostics only: variant name, wallet id and the config's PIN
                            // flag, never the blob or the seed. Without it a support bundle
                            // cannot tell a deleted keyring entry from an unreadable one.
                            log_seed_read_failure(
                                "get_tari_seed",
                                wallet_id.as_str(),
                                SeedProbeErrorKind::from(&e),
                                PinManager::pin_locked().await,
                            );
                            // Only display once
                            #[cfg(target_os = "macos")]
                            EventsEmitter::emit_show_keyring_dialog().await;

                            return Err(anyhow!("Failed to get tari seed from keyring: {e}"));
                        }
                    }
                } else {
                    log::error!(
                        target: LOG_TARGET_APP_LOGIC,
                        "[get_tari_seed] no Tari wallet id in the wallet config",
                    );
                    handle_critical_problem("Can't access seed", "[get_tari_seed]", None).await;
                    return Err(anyhow!("Can't access Tari seed"));
                }
            }
        };

        let blob_len = encrypted_tari_seed.len();
        let pin_locked = PinManager::pin_locked().await;
        // Read the blob, trying the interpretation the config recorded first and the other one
        // only if the first does not hold up. Anything unauthenticated has to derive the
        // recorded address before it is believed; see `SeedCandidate`.
        let mut pin_password = pin_password;
        let supplied_pin = pin_password.is_some();
        let mut prompted = false;
        loop {
            for candidate in
                tari_seed_candidates(&encrypted_tari_seed, pin_password.clone(), pin_locked)
            {
                if !candidate.authenticated {
                    if !candidate.proven_encoding {
                        // An enciphered blob read as plain: `from_binary` accepts it and hands
                        // back a structurally valid seed carrying the wrong entropy.
                        continue;
                    }
                    // Well-encoded, but a plain seed belonging to some other wallet is equally
                    // well-encoded. Only the recorded address settles it.
                    if !tari_seed_matches_recorded_address(&candidate.seed).await {
                        continue;
                    }
                }
                if candidate.pin_locked_actual != pin_locked {
                    repair_pin_state(candidate.pin_locked_actual, SEED_TAG_TARI).await;
                }
                return Ok(candidate.seed);
            }

            // Nothing read the blob. Without a PIN it may be enciphered while the config says no
            // PIN is set, which is what a `create_pin` that died between the blob and the flag
            // leaves behind. Ask once per run, never in a loop.
            if supplied_pin || prompted {
                break;
            }
            match prompt_pin_for_repair(SEED_TAG_TARI).await {
                Some(prompted_pin) => {
                    pin_password = Some(prompted_pin);
                    prompted = true;
                }
                None => break,
            }
        }

        if supplied_pin {
            // A wrong PIN is a user mistake, not a defect: warn level, never Sentry.
            log::warn!(
                target: LOG_TARGET_APP_LOGIC,
                "[get_tari_seed] seed did not decipher with the supplied PIN: blob_len={blob_len} pin_locked={pin_locked}",
            );
            Err(anyhow!("Wrong PIN entered!"))
        } else {
            log::error!(
                target: LOG_TARGET_APP_LOGIC,
                "[get_tari_seed] could not parse Tari seed from binary: error=seed_decode blob_len={blob_len} pin_locked={pin_locked}",
            );
            Err(anyhow!("Could not parse Tari Seed from binary"))
        }
    }

    /** Method safe to use before init - fallbacks to the credential manager */
    // Read, then decode, then self-heal the recorded PIN state, then length-check. Each step
    // depends on the one before it and every early return is a distinct user-facing error.
    #[allow(clippy::too_many_lines)]
    pub async fn get_monero_seed(
        pin_password: Option<SafePassword>,
    ) -> Result<MoneroSeed, anyhow::Error> {
        if !*ConfigWallet::content().await.monero_address_is_generated() {
            return Err(anyhow!(
                "Can't retrieve seed words from an imported monero address!"
            ));
        }

        let state_result = if let Some(instance) = INSTANCE.get() {
            let internal_wallet = instance.read().await;
            internal_wallet.encrypted_monero_seed.reveal().clone()
        } else {
            None
        };

        // Try to get the encrypted Monero seed from memory first, otherwise fallback to credentials manager.
        let encrypted_monero_seed = {
            if let Some(monero_seed) = state_result {
                monero_seed
            } else {
                // Fallback to credentials manager
                let monero_wallet_id = InternalWallet::monero_wallet_id().await;
                match CredentialManager::new_default(monero_wallet_id.clone())
                    .get_credentials()
                    .await
                {
                    Ok(cred) => {
                        // Update store if not yet set
                        if let Some(instance) = INSTANCE.get() {
                            let mut internal_wallet_guard = instance.write().await;
                            internal_wallet_guard.encrypted_monero_seed =
                                Hidden::hide(Some(cred.encrypted_seed.clone()));
                        }
                        cred.encrypted_seed
                    }
                    Err(e) => {
                        // Same redaction rules as `get_tari_seed`: variant name, id and flag only.
                        log_seed_read_failure(
                            "get_monero_seed",
                            monero_wallet_id.as_str(),
                            SeedProbeErrorKind::from(&e),
                            PinManager::pin_locked().await,
                        );
                        #[cfg(target_os = "macos")]
                        EventsEmitter::emit_show_keyring_dialog().await;

                        return Err(anyhow!("Failed to get monero seed from keyring: {e}"));
                    }
                }
            }
        };

        let blob_len = encrypted_monero_seed.len();
        let pin_locked = PinManager::pin_locked().await;
        // A Monero seed is 32 raw bytes and a ciphertext never is, so the blob is
        // self-describing and `monero_seed_candidates` ignores the recorded flag entirely.
        //
        // The flag is shared between the two credentials while their contents are not, so only
        // the Tari path may repair it. If both did, a `create_pin` that died between the two
        // writes would have them take turns flipping it, and the Tari seed - whose reading really
        // does depend on the flag - would be unreadable once its one-shot prompt was spent.
        let mut pin_password = pin_password;
        let supplied_pin = pin_password.is_some();
        let mut prompted = false;
        let decrypted_monero_seed = loop {
            let mut accepted = None;
            for candidate in
                monero_seed_candidates(&encrypted_monero_seed, pin_password.clone(), pin_locked)
            {
                if !candidate.authenticated
                    && !monero_seed_matches_recorded_address(&candidate.seed).await
                {
                    continue;
                }
                accepted = Some(candidate.seed);
                break;
            }
            if let Some(seed) = accepted {
                break seed;
            }

            if supplied_pin || prompted {
                if supplied_pin {
                    // Wrong PIN: user mistake, warn level, never Sentry.
                    log::warn!(
                        target: LOG_TARGET_APP_LOGIC,
                        "[get_monero_seed] seed did not decrypt with the supplied PIN: blob_len={blob_len} pin_locked={pin_locked}",
                    );
                    return Err(anyhow!("Wrong PIN entered!"));
                }
                log::error!(
                    target: LOG_TARGET_APP_LOGIC,
                    "[get_monero_seed] blob is not a plain Monero seed: error=seed_length blob_len={blob_len} pin_locked={pin_locked}",
                );
                return Err(anyhow!("Monero seed is not 32 bytes"));
            }
            match prompt_pin_for_repair(SEED_TAG_MONERO).await {
                Some(prompted_pin) => {
                    pin_password = Some(prompted_pin);
                    prompted = true;
                }
                None => {
                    log::error!(
                        target: LOG_TARGET_APP_LOGIC,
                        "[get_monero_seed] blob is not a plain Monero seed: error=seed_length blob_len={blob_len} pin_locked={pin_locked}",
                    );
                    return Err(anyhow!("Monero seed is not 32 bytes"));
                }
            }
        };

        let decrypted_monero_seed_bytes: [u8; MONERO_SEED_LENGTH] =
            decrypted_monero_seed.as_slice().try_into().map_err(|_| {
                log::error!(
                    target: LOG_TARGET_APP_LOGIC,
                    "[get_monero_seed] decrypted blob has the wrong length: error=seed_length blob_len={blob_len} pin_locked={pin_locked}",
                );
                anyhow!("Monero seed is not 32 bytes")
            })?;
        Ok(MoneroSeed::new(decrypted_monero_seed_bytes))
    }

    pub async fn set_external_monero_address(monero_address: String) -> Result<(), anyhow::Error> {
        ConfigWallet::update_field(
            ConfigWalletContent::set_user_monero_address,
            monero_address.clone(),
        )
        .await?;

        if let Some(instance) = INSTANCE.get() {
            let mut internal_wallet_guard = instance.write().await;
            internal_wallet_guard.monero_address = monero_address;
        }

        Ok(())
    }

    pub async fn clear_all_wallets() -> Result<(), anyhow::Error> {
        let wallet_config = ConfigWallet::content().await;
        for wallet_id in wallet_config.tari_wallets() {
            InternalWallet::remove_tari_wallet(wallet_id.clone())?
        }
        InternalWallet::remove_monero_wallet().await?;
        Ok(())
    }
}

// ** Wallet availability, startup seed probe and recovery state **

/// Error text for "there is no wallet". A constant so callers can match on it and so it can
/// never accidentally carry a path, an id or a secret.
pub const WALLET_NOT_INITIALIZED: &str = "InternalWallet is not initialized";
/// Error text for an initialised-but-addressless wallet. Should be unreachable; see `post_init`.
pub const WALLET_NO_ADDRESS: &str = "Internal wallet has no Tari address defined";
/// The only Sentry message this module sends. Constant by policy: every varying detail goes into
/// a tag with an enum-like value, never into the message.
const SENTRY_SEED_UNAVAILABLE_AT_STARTUP: &str = "wallet.seed_unavailable_at_startup";
/// The legacy migration's one Sentry message, under the same rule: constant text, enum-like tags.
const SENTRY_LEGACY_DECRYPT_FAILED: &str = "wallet.legacy_decrypt_failed";
/// macOS rate limit for the startup probe: at most one keychain read per 24h. See
/// `InternalWallet::probe_tari_seed_at_startup` for why.
const SEED_PROBE_MIN_INTERVAL_SECS: u64 = 60 * 60 * 24;
/// Only macOS re-prompts the user for each read of an item approved with "Allow", so only macOS
/// needs the rate limit. Windows and Linux reads are silent once the store is unlocked.
const SEED_PROBE_IS_RATE_LIMITED: bool = cfg!(target_os = "macos");
/// Whether this platform's credential store can refuse a read because the *user* said no, as
/// opposed to because something is broken.
///
/// macOS shows the keychain dialog on every read of an item approved with "Allow", and a locked
/// login keychain refuses outright. Linux secret-service does the same. On both, "the store would
/// not hand it over" says nothing about whether the seed is still there, so it must not raise the
/// recovery UI, stop mining or reach Sentry. Windows has no such prompt: a platform failure there
/// is a stopped `VaultSvc` or a broken DPAPI state, which is worth surfacing.
const SEED_PROBE_STORE_CAN_DENY: bool = cfg!(target_os = "macos") || cfg!(target_os = "linux");

/// Why a keyring read failed, as an enum-like value fit for a log line or a Sentry tag.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum SeedProbeErrorKind {
    /// The entry is gone: deleted, never written, or the profile was copied without it.
    NoEntry,
    /// The store itself refused: service stopped, keychain locked, prompt denied, ACL mismatch.
    KeyringPlatform,
    /// Any other keyring-level failure (ambiguous entry, bad encoding, invalid attribute).
    KeyringOther,
    /// The fallback file could not be read.
    Io,
    /// The entry was readable but its contents did not decode.
    Decode,
}

impl SeedProbeErrorKind {
    /// Enum-like tag value. Never contains user data.
    pub fn as_tag(self) -> &'static str {
        match self {
            SeedProbeErrorKind::NoEntry => "no_entry",
            SeedProbeErrorKind::KeyringPlatform => "keyring_platform",
            SeedProbeErrorKind::KeyringOther => "keyring_other",
            SeedProbeErrorKind::Io => "io",
            SeedProbeErrorKind::Decode => "decode",
        }
    }
}

/// Log a failed seed read with the fields a support bundle needs and nothing else.
///
/// Where the store can deny a read on the user's say-so (macOS, Linux) a keyring platform failure
/// is what a cancelled or denied prompt looks like, so it warns. Everywhere else, and for every
/// other kind, a seed that cannot be read is a real problem and logs at error level.
fn log_seed_read_failure(
    context: &str,
    wallet_id: &str,
    kind: SeedProbeErrorKind,
    pin_locked: bool,
) {
    let tag = kind.as_tag();
    if SEED_PROBE_STORE_CAN_DENY && kind == SeedProbeErrorKind::KeyringPlatform {
        log::warn!(
            target: LOG_TARGET_APP_LOGIC,
            "[{context}] keyring read not permitted: error={tag} wallet_id={wallet_id} pin_locked={pin_locked}",
        );
    } else {
        log::error!(
            target: LOG_TARGET_APP_LOGIC,
            "[{context}] keyring read failed: error={tag} wallet_id={wallet_id} pin_locked={pin_locked}",
        );
    }
}

/// How many characters of a Tari address may appear in a log line or a UI error string.
///
/// Enough to tell two wallets apart - which is the only question any of these lines is asking -
/// and not an address. Same length the support bundle and "find my wallets" use.
pub(crate) const ADDRESS_LOG_PREFIX_LEN: usize = 8;

/// First [`ADDRESS_LOG_PREFIX_LEN`] characters of an address, for a log line.
pub(crate) fn address_prefix(address: &TariAddress) -> String {
    address
        .to_base58()
        .chars()
        .take(ADDRESS_LOG_PREFIX_LEN)
        .collect()
}

/// Log that wallet details were established, without printing them.
///
/// `TariWalletDetails` redacts the view private key in its `Debug`, but `{wallet_details:?}` still
/// prints the full Tari address and the spend public key. The wallet id and an address prefix
/// answer the only question these lines ask: which wallet came up, and from where.
fn log_wallet_details(context: &str, source: &str, details: &TariWalletDetails) {
    log::info!(
        target: LOG_TARGET_APP_LOGIC,
        "[{context}] Tari wallet details established: source={source} wallet_id={} birthday={} address_prefix={}",
        details.id.as_str(),
        details.wallet_birthday,
        address_prefix(&details.tari_address),
    );
}

impl From<&CredentialError> for SeedProbeErrorKind {
    fn from(error: &CredentialError) -> Self {
        match error {
            CredentialError::NoEntry(_) => SeedProbeErrorKind::NoEntry,
            CredentialError::Io(_) => SeedProbeErrorKind::Io,
            CredentialError::Serialization(_) => SeedProbeErrorKind::Decode,
            // A write we could not verify says nothing about a later read; it is a store-level
            // fault like any other and is never produced by the probe itself.
            CredentialError::WriteNotVerified(_) => SeedProbeErrorKind::KeyringOther,
            // "The entry exists and the store would not show it to us" - which is what the probe
            // itself would have reported as a platform failure, so classify it the same way.
            CredentialError::PreviousUnreadable(_) => SeedProbeErrorKind::KeyringPlatform,
            // Enumeration failures are the store refusing to answer, never the probe's own read.
            CredentialError::ListingFailed(_) | CredentialError::ListingUnusable => {
                SeedProbeErrorKind::KeyringPlatform
            }
            CredentialError::Keyring(keyring_error) => match keyring_error {
                // `load_from_keyring` maps `NoEntry` before it gets here, but keep the arm so a
                // future caller that passes the raw error through still classifies it correctly.
                keyring::Error::NoEntry => SeedProbeErrorKind::NoEntry,
                keyring::Error::PlatformFailure(_) | keyring::Error::NoStorageAccess(_) => {
                    SeedProbeErrorKind::KeyringPlatform
                }
                _ => SeedProbeErrorKind::KeyringOther,
            },
        }
    }
}

/// What the startup probe concluded.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum SeedProbeOutcome {
    /// The seed blob was read. Nothing to report.
    Ok,
    /// The seed could not be read and that is worth reporting and surfacing.
    Unavailable(SeedProbeErrorKind),
    /// The read did not happen on the user's terms (macOS denied/locked keychain). Not proof the
    /// seed is gone and not a defect, so it is logged and nothing else: no Sentry, no recovery.
    Inconclusive(SeedProbeErrorKind),
}

impl SeedProbeOutcome {
    /// Enum-like tag value for the config field and for logs. Never contains user data.
    pub fn as_tag(self) -> &'static str {
        match self {
            SeedProbeOutcome::Ok => "ok",
            SeedProbeOutcome::Unavailable(SeedProbeErrorKind::NoEntry) => "unavailable_no_entry",
            SeedProbeOutcome::Unavailable(SeedProbeErrorKind::KeyringPlatform) => {
                "unavailable_keyring_platform"
            }
            SeedProbeOutcome::Unavailable(SeedProbeErrorKind::KeyringOther) => {
                "unavailable_keyring_other"
            }
            SeedProbeOutcome::Unavailable(SeedProbeErrorKind::Io) => "unavailable_io",
            SeedProbeOutcome::Unavailable(SeedProbeErrorKind::Decode) => "unavailable_decode",
            SeedProbeOutcome::Inconclusive(SeedProbeErrorKind::NoEntry) => "inconclusive_no_entry",
            SeedProbeOutcome::Inconclusive(SeedProbeErrorKind::KeyringPlatform) => {
                "inconclusive_keyring_platform"
            }
            SeedProbeOutcome::Inconclusive(SeedProbeErrorKind::KeyringOther) => {
                "inconclusive_keyring_other"
            }
            SeedProbeOutcome::Inconclusive(SeedProbeErrorKind::Io) => "inconclusive_io",
            SeedProbeOutcome::Inconclusive(SeedProbeErrorKind::Decode) => "inconclusive_decode",
        }
    }
}

/// Whether the probe should run at all on this launch.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum SeedProbeDecision {
    Run,
    Skip,
}

/// Pure decision: a rate-limited platform probes only when the last probe is older than
/// `min_interval_secs` (or never happened). Everywhere else the probe is free, so it always runs.
/// A marker timestamp in the future (clock moved backwards) is treated as "probe now" rather than
/// locking the user out of the check until the clock catches up.
pub fn decide_seed_probe(
    rate_limited: bool,
    last_probe_unix: Option<u64>,
    now_unix: u64,
    min_interval_secs: u64,
) -> SeedProbeDecision {
    if !rate_limited {
        return SeedProbeDecision::Run;
    }
    match last_probe_unix {
        None => SeedProbeDecision::Run,
        Some(last) if last > now_unix => SeedProbeDecision::Run,
        Some(last) if now_unix.saturating_sub(last) >= min_interval_secs => SeedProbeDecision::Run,
        Some(_) => SeedProbeDecision::Skip,
    }
}

/// Pure classification of a probe failure.
///
/// `store_can_deny` is [`SEED_PROBE_STORE_CAN_DENY`]: on a platform whose credential store
/// prompts the user, a platform failure is routinely just a declined or dismissed prompt, and a
/// declined prompt is not evidence that a seed is gone. Reporting it as `Unavailable` would put
/// a Linux user with a locked keyring collection into the recovery UI, stop their mining and
/// send a Sentry event on every launch, for a seed that is sitting right there.
pub fn classify_seed_probe_error(
    error: &CredentialError,
    store_can_deny: bool,
) -> SeedProbeOutcome {
    let kind = SeedProbeErrorKind::from(error);
    if store_can_deny && kind == SeedProbeErrorKind::KeyringPlatform {
        SeedProbeOutcome::Inconclusive(kind)
    } else {
        SeedProbeOutcome::Unavailable(kind)
    }
}

/// The failure kind behind a recorded `unavailable_*` tag, if it was one.
///
/// The inverse of the `unavailable_*` arms of [`SeedProbeOutcome::as_tag`]. `ok` and
/// `inconclusive_*` deliberately map to `None`: neither is a reason to hold the wallet in
/// recovery, and an unrecognised tag - written by a newer build - is treated the same way.
pub fn seed_probe_outcome_from_tag(tag: &str) -> Option<SeedProbeErrorKind> {
    match tag {
        "unavailable_no_entry" => Some(SeedProbeErrorKind::NoEntry),
        "unavailable_keyring_platform" => Some(SeedProbeErrorKind::KeyringPlatform),
        "unavailable_keyring_other" => Some(SeedProbeErrorKind::KeyringOther),
        "unavailable_io" => Some(SeedProbeErrorKind::Io),
        "unavailable_decode" => Some(SeedProbeErrorKind::Decode),
        _ => None,
    }
}

/// The verdict a rate-limited launch may reuse for `wallet_id`.
///
/// Only a record that names this same wallet counts. The record left by the wallet the user has
/// just re-linked away from describes an entry this launch never looks at, and reusing it would
/// put a perfectly readable wallet back into recovery for the rest of the interval.
pub fn remembered_seed_probe_outcome(
    recorded_wallet_id: Option<&WalletId>,
    recorded_outcome: Option<&str>,
    wallet_id: &WalletId,
) -> Option<SeedProbeErrorKind> {
    if recorded_wallet_id? != wallet_id {
        return None;
    }
    seed_probe_outcome_from_tag(recorded_outcome?)
}

fn unix_now() -> u64 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_secs())
        .unwrap_or_default()
}

/// Constant message, details as enum-like tags only. Never `format!`s an error into the message.
fn report_seed_unavailable_at_startup(kind: SeedProbeErrorKind) {
    sentry::with_scope(
        |scope| {
            scope.set_tag("platform", std::env::consts::OS);
            scope.set_tag("wallet.seed_probe_error", kind.as_tag());
        },
        || {
            sentry::capture_message(SENTRY_SEED_UNAVAILABLE_AT_STARTUP, sentry::Level::Error);
        },
    );
}

// ** Monero credential ids and PIN-state repair **

/// The original, unversioned Monero credential id. Wallets created before ids were versioned
/// store their seed here and keep using it; only a *new* seed gets a new id.
pub const MONERO_WALLET_ID_LEGACY: &str = "monero";
/// Upper bound on the `monero`, `monero_2`, ... sequence. Reaching it means something is wrong
/// with the store, not that the user has 32 Monero wallets, so it errors instead of overwriting.
const MONERO_WALLET_ID_MAX_VERSIONS: u32 = 32;
/// A Monero seed is exactly this many raw bytes; anything else is ciphertext.
const MONERO_SEED_LENGTH: usize = 32;
/// Constant log string for the Monero entry that is deliberately not deleted.
const LOG_MONERO_ENTRY_PRESERVED: &str = "wallet.monero_entry_preserved";
/// Constant message for a repaired `pin_locked` flag. Details go in tags, never in the message.
const SENTRY_PIN_STATE_REPAIRED: &str = "wallet.pin_state_repaired";
/// Enum-like tag values naming which seed a repair or prompt concerned.
const SEED_TAG_TARI: &str = "tari";
const SEED_TAG_MONERO: &str = "monero";

/// `monero` -> `monero_2` -> `monero_3` ... Anything unrecognised restarts the sequence at 2, so
/// a hand-edited config can never produce a collision with the id it started from.
/// The address and id to record for the Monero blob stored under `wallet_id`, or `None` when the
/// blob is not a plain 32-byte seed.
///
/// A Monero seed is 32 raw bytes and a ciphertext never is, so the length is the whole proof. An
/// enciphered or truncated blob cannot be turned into an address here, and recovery generates a
/// new seed under a free id rather than recording an address it cannot derive.
pub fn monero_wallet_from_blob(wallet_id: &WalletId, blob: &[u8]) -> Option<(String, WalletId)> {
    let seed_bytes: [u8; MONERO_SEED_LENGTH] = blob.try_into().ok()?;
    let address = MoneroSeed::new(seed_bytes).to_address::<Mainnet>().ok()?;
    Some((address, wallet_id.clone()))
}

pub fn next_monero_wallet_id(current: &WalletId) -> WalletId {
    let version = current
        .as_str()
        .strip_prefix(MONERO_WALLET_ID_LEGACY)
        .and_then(|rest| rest.strip_prefix('_'))
        .and_then(|version| version.parse::<u32>().ok())
        .unwrap_or(1);
    WalletId::new(format!(
        "{MONERO_WALLET_ID_LEGACY}_{}",
        version.saturating_add(1)
    ))
}

/// Walk the `monero`, `monero_2`, ... sequence from `start` and return the first id that
/// `is_occupied` says is free.
///
/// Separate from its only caller so the sequence and the "occupied means skip" rule can be
/// tested without a keyring.
pub async fn allocate_monero_wallet_id_with<F, Fut>(
    start: WalletId,
    is_occupied: F,
) -> Result<WalletId, anyhow::Error>
where
    F: Fn(WalletId) -> Fut,
    Fut: std::future::Future<Output = bool>,
{
    let mut candidate = start;
    for _ in 0..MONERO_WALLET_ID_MAX_VERSIONS {
        if !is_occupied(candidate.clone()).await {
            return Ok(candidate);
        }
        candidate = next_monero_wallet_id(&candidate);
    }
    Err(anyhow!(
        "Could not find a free Monero credential id after {MONERO_WALLET_ID_MAX_VERSIONS} attempts"
    ))
}

/// The seed whose recorded PIN state is being repaired. Enum-like tag value, never user data.
fn repair_prompt_flag(seed_tag: &str) -> &'static AtomicBool {
    /// One prompt per seed per run. The point of the limit is that a user whose config and
    /// keyring disagree is asked once and then left alone, rather than being prompted on every
    /// balance refresh.
    static TARI_PROMPTED: AtomicBool = AtomicBool::new(false);
    static MONERO_PROMPTED: AtomicBool = AtomicBool::new(false);
    if seed_tag == SEED_TAG_MONERO {
        &MONERO_PROMPTED
    } else {
        &TARI_PROMPTED
    }
}

/// Record that the config's `pin_locked` flag disagreed with the blob, and correct it.
///
/// The correction goes through the normal config update path, which is atomic, so a crash during
/// the repair leaves either the old flag or the new one and never a truncated file.
async fn repair_pin_state(should_be_locked: bool, seed_tag: &'static str) {
    log::warn!(
        target: LOG_TARGET_APP_LOGIC,
        "{SENTRY_PIN_STATE_REPAIRED}: seed={seed_tag} pin_locked={should_be_locked}",
    );
    if let Err(e) = PinManager::repair_pin_locked(should_be_locked).await {
        log::error!(
            target: LOG_TARGET_APP_LOGIC,
            "[repair_pin_state] could not persist the repaired PIN state: seed={seed_tag} error={e}",
        );
        return;
    }
    report_pin_state_repaired(seed_tag, should_be_locked);
}

/// Constant message, enum-like tags only.
fn report_pin_state_repaired(seed_tag: &'static str, pin_locked: bool) {
    sentry::with_scope(
        |scope| {
            scope.set_tag("platform", std::env::consts::OS);
            scope.set_tag("wallet.pin_repair_seed", seed_tag);
            scope.set_tag(
                "wallet.pin_repair_to",
                if pin_locked { "locked" } else { "unlocked" },
            );
        },
        || {
            sentry::capture_message(SENTRY_PIN_STATE_REPAIRED, sentry::Level::Warning);
        },
    );
}

/// Ask for a PIN once per seed per run, for the self-healing decode only.
///
/// Deliberately not `PinManager::get_validated_pin`: validation reads the seed, which is the very
/// thing that is failing here. A cancelled prompt is a normal answer - `None`, no Sentry, no
/// retry.
async fn prompt_pin_for_repair(seed_tag: &str) -> Option<SafePassword> {
    if repair_prompt_flag(seed_tag).swap(true, Ordering::SeqCst) {
        return None;
    }
    let app_handle = EventsEmitter::try_get_app_handle().await?;
    match PinManager::prompt_pin_unvalidated(&app_handle).await {
        Ok(pin) => Some(pin),
        Err(_) => {
            log::info!(
                target: LOG_TARGET_APP_LOGIC,
                "[prompt_pin_for_repair] PIN prompt dismissed, leaving the recorded state alone: seed={seed_tag}",
            );
            None
        }
    }
}

/// One way a seed blob could be read.
///
/// Two different questions, kept apart:
///
/// * `authenticated` - a tag was verified, which proves the blob was read the right way *and*
///   that whoever wrote it knew the PIN.
/// * `proven_encoding` - the bytes re-serialize to themselves, which rules out reading an
///   enciphered blob as a plain one and nothing more: a plain seed belonging to a *different*
///   wallet passes it too.
///
/// Only `authenticated` may be acted on without further proof. A merely well-encoded candidate
/// has to derive the address the config recorded, or the app spends from one wallet while the UI
/// shows another.
#[derive(Debug)]
pub struct SeedCandidate<T> {
    pub seed: T,
    pub authenticated: bool,
    /// The bytes round-trip as this kind of seed. Says nothing about whose seed it is.
    pub proven_encoding: bool,
    /// What `pin_locked` would have to be for this reading to be the correct one.
    pub pin_locked_actual: bool,
}

/// Does this seed re-serialize to exactly the bytes it was decoded from?
///
/// The only proof available that a blob really is a *plain*, un-enciphered `CipherSeed`. A
/// serialized seed is 24 bytes and a PIN-enciphered one 60, so an enciphered blob can never
/// re-serialize to itself.
fn plain_tari_seed_round_trips(seed: &CipherSeed, blob: &[u8]) -> bool {
    seed.to_binary()
        .map(|round_trip| round_trip == blob)
        .unwrap_or(false)
}

/// Decode a blob that is believed to hold a plain, un-enciphered `CipherSeed`, refusing anything
/// that cannot prove it is one.
///
/// `CipherSeed::from_binary` is bincode with no authentication tag: handed a PIN-enciphered blob
/// it *succeeds* and returns a structurally valid seed carrying the wrong entropy, and so a wrong
/// address. Every site that decodes a blob it believes is plain goes through here.
///
/// This proves the *interpretation* of the bytes, not whose wallet they are. A caller holding a
/// recorded address must still check the seed derives it - see
/// [`tari_seed_matches_recorded_address`].
pub(crate) fn decode_plain_tari_seed(blob: &[u8]) -> Option<CipherSeed> {
    let seed = CipherSeed::from_binary(blob).ok()?;
    plain_tari_seed_round_trips(&seed, blob).then_some(seed)
}

/// Every reading of a Tari blob worth trying, the recorded interpretation first.
///
/// Pure: no config, no keyring, no prompt, which is what makes both directions of the repair
/// testable. An empty result means the blob cannot be read at all with what was supplied.
pub fn tari_seed_candidates(
    blob: &[u8],
    pin_password: Option<SafePassword>,
    pin_locked_recorded: bool,
) -> Vec<SeedCandidate<CipherSeed>> {
    let mut candidates = Vec::new();
    if let Some(pin_password) = pin_password
        && let Ok(seed) = CipherSeed::from_enciphered_bytes(blob, Some(pin_password))
    {
        candidates.push(SeedCandidate {
            seed,
            authenticated: true,
            proven_encoding: true,
            pin_locked_actual: true,
        });
    }
    if let Ok(seed) = CipherSeed::from_binary(blob) {
        // Bincode carries no tag. A round-trip proves the bytes really are a serialized
        // `CipherSeed` rather than an enciphered one read the wrong way - a serialized seed is
        // 24 bytes and an enciphered one 60 - but it proves nothing about whose seed it is, so
        // this never counts as authenticated.
        let proven_encoding = plain_tari_seed_round_trips(&seed, blob);
        candidates.push(SeedCandidate {
            seed,
            authenticated: false,
            proven_encoding,
            pin_locked_actual: false,
        });
    }
    if pin_locked_recorded {
        // The recorded interpretation goes first; with a PIN that is already the order above.
        candidates.sort_by_key(|candidate| !candidate.pin_locked_actual);
    }
    candidates
}

/// The same for a Monero blob.
///
/// A Monero seed is exactly [`MONERO_SEED_LENGTH`] raw bytes and a ciphertext never is - it
/// carries a nonce and a tag - so the length is what distinguishes the two readings here.
pub fn monero_seed_candidates(
    blob: &[u8],
    pin_password: Option<SafePassword>,
    _pin_locked_recorded: bool,
) -> Vec<SeedCandidate<Vec<u8>>> {
    let mut candidates = Vec::new();
    if let Some(pin_password) = pin_password
        && let Ok(seed) = cryptography::decrypt(blob, &pin_password)
        && seed.len() == MONERO_SEED_LENGTH
    {
        candidates.push(SeedCandidate {
            seed,
            authenticated: true,
            proven_encoding: true,
            pin_locked_actual: true,
        });
    }
    if blob.len() == MONERO_SEED_LENGTH {
        // Any 32 bytes look like a Monero seed, so there is nothing to prove here either way.
        candidates.push(SeedCandidate {
            seed: blob.to_vec(),
            authenticated: false,
            proven_encoding: false,
            pin_locked_actual: false,
        });
    }
    candidates
}

/// Does this seed derive the Tari address the config recorded?
///
/// The check that makes an unauthenticated decode safe to act on. `None` recorded details means
/// there is nothing to check against - the pre-init path - and the caller accepts the decode.
async fn tari_seed_matches_recorded_address(seed: &CipherSeed) -> bool {
    let Some(recorded) = ConfigWallet::content().await.tari_wallet_details().clone() else {
        return true;
    };
    match InternalWallet::get_tari_wallet_details(recorded.id.clone(), seed.clone()).await {
        Ok(derived) => derived.tari_address == recorded.tari_address,
        Err(_) => false,
    }
}

/// Does this seed derive the Monero address the config recorded? Same role as its Tari twin.
async fn monero_seed_matches_recorded_address(seed: &[u8]) -> bool {
    let recorded = ConfigWallet::content().await.monero_address().clone();
    if recorded.is_empty() {
        return true;
    }
    let Ok(seed_bytes) = <[u8; MONERO_SEED_LENGTH]>::try_from(seed) else {
        return false;
    };
    match MoneroSeed::new(seed_bytes).to_address::<Mainnet>() {
        Ok(derived) => derived == recorded,
        Err(_) => false,
    }
}

/// Why the app is in the wallet recovery state.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum WalletRecoveryReason {
    /// `initialize_with_seed` / `initialize_seedless` returned an error.
    InitializationFailed,
    /// The wallet initialised, but the startup probe could not read its seed.
    SeedUnavailable,
    /// `config_wallet.json` could not be parsed and neither could its `.backup`, so the config in
    /// memory is the recovery placeholder. The damaged file is kept as
    /// `config_wallet.json.corrupted.<ts>` and a `config_wallet.json.recovery_required` marker
    /// stops the next launch from looking like a fresh install. Distinct from
    /// `InitializationFailed` because nothing was attempted: the seed is untouched in the keyring.
    ConfigCorrupted,
    /// A pre-v1.2.24 wallet was found, no known passphrase opens its seed, and the app is running
    /// view-only from the address and view key in the legacy file. Distinct from
    /// `SeedUnavailable`: the seed is provably on disk, it just cannot be opened here, and the
    /// legacy file has been quarantined so the migration will not be attempted again.
    LegacySeedUndecryptable,
    /// A legacy wallet file exists but could not be read or parsed. No wallet was created: the
    /// damaged file may still be the only copy of the seed.
    LegacyConfigUnreadable,
}

impl WalletRecoveryReason {
    pub fn as_tag(self) -> &'static str {
        match self {
            WalletRecoveryReason::InitializationFailed => "initialization_failed",
            WalletRecoveryReason::SeedUnavailable => "seed_unavailable",
            WalletRecoveryReason::ConfigCorrupted => "config_corrupted",
            WalletRecoveryReason::LegacySeedUndecryptable => "legacy_seed_undecryptable",
            WalletRecoveryReason::LegacyConfigUnreadable => "legacy_config_unreadable",
        }
    }
}

/// Set once during startup and read by the mining managers. A plain `std::sync::RwLock` around a
/// `Copy` enum: no `await` is held across it, so it cannot deadlock the async runtime.
static WALLET_RECOVERY_REASON: std::sync::RwLock<Option<WalletRecoveryReason>> =
    std::sync::RwLock::new(None);

/// Enter the recovery state and tell the frontend. Idempotent: the first reason wins, so a probe
/// failure cannot mask an earlier initialisation failure.
pub async fn enter_wallet_recovery(reason: WalletRecoveryReason) {
    {
        let Ok(mut guard) = WALLET_RECOVERY_REASON.write() else {
            log::error!(target: LOG_TARGET_APP_LOGIC, "Wallet recovery state lock poisoned");
            return;
        };
        if guard.is_some() {
            return;
        }
        *guard = Some(reason);
    }
    log::error!(target: LOG_TARGET_APP_LOGIC, "Entering wallet recovery state: reason={}", reason.as_tag());
    EventsEmitter::emit_wallet_recovery_required(WalletRecoveryPayload {
        reason: Some(reason),
    })
    .await;
}

/// The current recovery reason, if the app is in the recovery state.
pub fn wallet_recovery_reason() -> Option<WalletRecoveryReason> {
    WALLET_RECOVERY_REASON
        .read()
        .ok()
        .and_then(|guard| *guard)
        .or(None)
}

/// Leave the recovery state after the user recovered (imported seed words, re-linked a wallet).
///
/// Three things have to happen together: the backend gate lets mining start again, the event
/// closes the recovery screen (nothing else clears it), and telemetry is started because the
/// launch that entered recovery skipped it.
pub async fn leave_wallet_recovery(app_handle: &AppHandle) {
    let was_in_recovery = {
        match WALLET_RECOVERY_REASON.write() {
            Ok(mut guard) => guard.take().is_some(),
            Err(_) => false,
        }
    };
    if !was_in_recovery {
        return;
    }
    log::info!(target: LOG_TARGET_APP_LOGIC, "Leaving wallet recovery state");
    EventsEmitter::emit_wallet_recovery_required(WalletRecoveryPayload { reason: None }).await;
    crate::setup::setup_manager::SetupManager::start_telemetry(app_handle).await;
}

/// Gate for anything that must not run against an unverified wallet. Both mining managers call
/// this before they start a miner, so a launch that ended in recovery cannot be turned into a
/// mining session by clicking "Start".
pub fn ensure_wallet_usable() -> Result<(), MiningError> {
    wallet_usability(wallet_recovery_reason())
}

/// Pure half of `ensure_wallet_usable`, split out so both branches are testable without touching
/// the process-wide recovery state. Every recovery reason refuses: an initialisation failure
/// means there is no wallet at all, an unreadable seed means the app cannot prove it owns the
/// address it would mine to, and the legacy reasons mean the wallet on screen is one the app
/// cannot vouch for yet.
pub fn wallet_usability(reason: Option<WalletRecoveryReason>) -> Result<(), MiningError> {
    match reason {
        None => Ok(()),
        Some(
            WalletRecoveryReason::InitializationFailed
            | WalletRecoveryReason::SeedUnavailable
            | WalletRecoveryReason::ConfigCorrupted
            | WalletRecoveryReason::LegacySeedUndecryptable
            | WalletRecoveryReason::LegacyConfigUnreadable,
        ) => Err(MiningError::WalletNotReady),
    }
}

/// Whether the wallet config in hand is the recovery placeholder rather than the user's real one.
///
/// The placeholder has an empty `tari_wallets` list, which lands in `initialize_with_seed`'s
/// "create new wallet" branch and would replace the user's wallet, orphaning their seed in the
/// keyring. `setup_manager` checks the same condition before wallet init starts, so this is the
/// second line of defence.
pub(crate) fn wallet_config_is_corrupted_recovery(wallet_config: &ConfigWalletContent) -> bool {
    wallet_config.ensure_available().is_err()
}

// ** Utils **

#[derive(Debug, Clone, Serialize)]
#[repr(u8)]
pub enum TariAddressType {
    Internal = 0,
    External = 1,
}
impl From<TariAddressType> for u8 {
    fn from(val: TariAddressType) -> Self {
        val as u8
    }
}
impl std::fmt::Display for TariAddressType {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            TariAddressType::Internal => write!(f, "Internal"),
            TariAddressType::External => write!(f, "External"),
        }
    }
}

#[derive(Debug, Serialize, Clone)]
pub struct PaperWalletConfig {
    pub qr_link: String,
    pub password: String,
}

async fn handle_critical_problem(
    title: &str,
    description: &str,
    extracted_wallet_details: Option<&TariWalletDetails>,
) {
    let state_wallet_details = InternalWallet::tari_wallet_details().await.ok().flatten();
    let address_type = match InternalWallet::current() {
        Ok(instance) => instance.read().await.tari_address_type.to_string(),
        Err(_) => "Uninitialized".to_string(),
    };
    // Prefixes only, in the log and in the payload alike: the question is whether the two
    // addresses differ, and the full address would reach the log file, the webview and every
    // support bundle built from them.
    let state_prefix = state_wallet_details
        .as_ref()
        .map(|d| address_prefix(&d.tari_address));
    let extracted_prefix = extracted_wallet_details.map(|d| address_prefix(&d.tari_address));
    log::error!(
        target: LOG_TARGET_APP_LOGIC,
        "Unexpected {address_type}! {title} --- state_wallet_id={:?} state_address_prefix={:?} | extracted_wallet_id={:?} extracted_address_prefix={:?}",
        state_wallet_details.as_ref().map(|d| d.id.as_str()),
        state_prefix,
        extracted_wallet_details.map(|d| d.id.as_str()),
        extracted_prefix,
    );
    EventsEmitter::emit_critical_problem(CriticalProblemPayload {
        title: Some(title.to_string()),
        description: Some(description.to_string()),
        error_message: Some(format!(
            "State: {state_prefix:?}, Extracted: {extracted_prefix:?}"
        )),
    })
    .await;
}

async fn retry_with_keyring_dialog<F, Fut, T>(
    _app_handle: &AppHandle,
    mut operation: F,
    log_msg: &'static str,
) -> Result<T, anyhow::Error>
where
    F: FnMut() -> Fut,
    Fut: std::future::Future<Output = Result<T, CredentialError>>,
{
    // Skip the keyring dialog for non-macos platforms(only mac os prompts for a keyring)
    #[cfg(not(target_os = "macos"))]
    {
        operation().await.map_err(|e| {
            log::error!(target: LOG_TARGET_APP_LOGIC, "{log_msg}: {e}");
            e.into()
        })
    }

    #[cfg(target_os = "macos")]
    loop {
        match operation().await {
            Ok(result) => return Ok(result),
            Err(CredentialError::Keyring(_)) => {
                use tauri::Listener;
                use tokio::sync::oneshot;
                EventsEmitter::emit_show_keyring_dialog().await;
                let (tx, rx) = oneshot::channel();
                _app_handle.once("keyring-dialog-response", |_event| {
                    let _unused = tx.send(true);
                });
                let _unused = rx.await.unwrap_or_default();
                // Loop will retry
            }
            Err(err) => {
                log::error!(target: LOG_TARGET_APP_LOGIC, "{log_msg}: {err}");
                return Err(err.into());
            }
        }
    }
}

/// Why a set of seed words was rejected: an enum-like tag for the log and a message that quotes
/// nothing.
///
/// `MnemonicError::WordNotFound` prints the word it did not recognise, and a word that is "not
/// found" is usually a real seed word with one character wrong, so neither the log line nor the
/// message the user sees may carry the error's own text.
pub fn seed_word_rejection(error: &CipherError) -> (&'static str, &'static str) {
    match error {
        CipherError::MnemonicError(MnemonicError::WordNotFound(_)) => (
            "word_not_found",
            "One of these words is not a Tari seed word. Check the spelling of each word and try again.",
        ),
        CipherError::MnemonicError(MnemonicError::EncodeInvalidLength) => (
            "word_count",
            "A Tari seed is exactly 24 words. Check that every word was entered.",
        ),
        CipherError::MnemonicError(_) => (
            "mnemonic",
            "These seed words could not be read. Check each word and try again.",
        ),
        _ => (
            "seed_decode",
            "These seed words are not a Tari wallet seed.",
        ),
    }
}

pub async fn mnemonic_to_tari_cipher_seed(
    seed_words: Vec<String>,
) -> Result<CipherSeed, anyhow::Error> {
    let hidden_seed_words = seed_words.into_iter().map(Hidden::hide).collect::<Vec<_>>();
    let seed_words_parsed = SeedWords::new(hidden_seed_words);
    CipherSeed::from_mnemonic(&seed_words_parsed, None).map_err(|e| {
        let (tag, message) = seed_word_rejection(&e);
        log::error!(
            target: LOG_TARGET_APP_LOGIC,
            "[mnemonic_to_tari_cipher_seed] seed words rejected: error={tag}",
        );
        anyhow!(message)
    })
}

// ** Legacy Wallet Config **

/// The pre-v1.2.24 `wallet_config.json`.
///
/// Era-1 builds (v0.4 - v0.7) wrote the legacy seed's passphrase into this file whenever the
/// keyring was unavailable, so `passphrase` has to stay in the struct or serde discards the last
/// passphrase those machines had. In most real files the field is present and `null`.
///
/// `#[serde(default)]` on the container keeps a file written by any era parseable; the fields that
/// have to be there for the file to mean anything are checked by `validate` instead, so a JSON
/// document that happens to parse but carries no wallet is treated as damaged rather than empty.
#[derive(Clone, Serialize, Deserialize, Default)]
#[serde(default)]
pub struct LegacyWalletConfig {
    pub(crate) tari_address_base58: String,
    pub(crate) view_key_private_hex: String,
    pub(crate) spend_public_key_hex: String,
    pub(crate) seed_words_encrypted_base58: String,
    /// Era-1 in-file passphrase for `seed_words_encrypted_base58`. Usually `null`.
    pub(crate) passphrase: Option<String>,
    pub(crate) config_path: Option<PathBuf>,
}

/// Hand-written: this struct holds an enciphered seed, a view private key and possibly a
/// passphrase, none of which may reach a log line through a `{:?}`. Only presence is reported.
impl std::fmt::Debug for LegacyWalletConfig {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("LegacyWalletConfig")
            .field("has_address", &!self.tari_address_base58.is_empty())
            .field("has_view_key", &!self.view_key_private_hex.is_empty())
            .field("has_seed", &!self.seed_words_encrypted_base58.is_empty())
            .field("has_passphrase", &self.passphrase.is_some())
            .finish()
    }
}

impl LegacyWalletConfig {
    /// A legacy config is only usable if it names a wallet. Anything less is damage, and damage
    /// must never be mistaken for "no previous wallet here".
    fn validate(self) -> Result<Self, LegacyConfigProblemKind> {
        if self.tari_address_base58.is_empty() || self.seed_words_encrypted_base58.is_empty() {
            return Err(LegacyConfigProblemKind::Incomplete);
        }
        Ok(self)
    }
}

/// Plaintext (CBOR) seed fallback written by pre-keyring versions, see `LegacyCredentialManager`.
pub(crate) const LEGACY_FALLBACK_FILE_NAME: &str = "credentials_backup.bin";
/// Pre-migration wallet config holding the Tari seed enciphered with the passphrase above.
pub(crate) const LEGACY_WALLET_CONFIG_FILE_NAME: &str = "wallet_config.json";
/// Suffix for a legacy wallet config whose seed no known passphrase opens. Renaming breaks the
/// migration loop: the next launch finds nothing migratable and comes up view-only.
///
/// Unlike a migrated file this one is kept rather than destroyed. Nothing can prove its seed
/// exists anywhere else - by definition, since it could not be read - so this file is the only
/// copy and destroying it is worse than leaving it on the user's own disk.
pub(crate) const LEGACY_DECRYPT_FAILED_SUFFIX: &str = "decrypt_failed";
/// Wallet id carried by the view-only fallback wallet. It never enters `config_wallet.json` and
/// never names a keyring entry: there is no seed to point at, which is the whole reason the
/// wallet is view-only.
const LEGACY_VIEW_ONLY_WALLET_ID: &str = "legacy_view_only";

/// The network subdirectory the legacy files live in.
pub(crate) fn legacy_network_dir(app_config_dir: &Path) -> PathBuf {
    app_config_dir.join(Network::get_current().as_key_str())
}

/// Which legacy file a problem refers to. Enum-like, safe for a log line: never a path, because a
/// path carries the user's account name.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum LegacyFileKind {
    WalletConfig,
    QuarantinedWalletConfig,
    FallbackCredential,
}

impl LegacyFileKind {
    pub(crate) fn as_tag(self) -> &'static str {
        match self {
            LegacyFileKind::WalletConfig => "wallet_config",
            LegacyFileKind::QuarantinedWalletConfig => "quarantined_wallet_config",
            LegacyFileKind::FallbackCredential => "fallback_credential",
        }
    }
}

/// What is wrong with a legacy file. Every variant means "do not create a new wallet".
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum LegacyConfigProblemKind {
    /// The file is there but the OS would not hand it over (locked by AV or an indexer,
    /// permissions, a transient sharing violation on Windows).
    Unreadable,
    /// The file is there and readable but is not the JSON this code understands.
    Unparseable,
    /// The file parsed but does not name a wallet.
    Incomplete,
    /// A plaintext credential file survives with no wallet config of any kind next to it.
    EvidenceWithoutConfig,
}

impl LegacyConfigProblemKind {
    pub(crate) fn as_tag(self) -> &'static str {
        match self {
            LegacyConfigProblemKind::Unreadable => "unreadable",
            LegacyConfigProblemKind::Unparseable => "unparseable",
            LegacyConfigProblemKind::Incomplete => "incomplete",
            LegacyConfigProblemKind::EvidenceWithoutConfig => "evidence_without_config",
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct LegacyConfigProblem {
    pub(crate) file: LegacyFileKind,
    pub(crate) kind: LegacyConfigProblemKind,
}

/// What this launch found where a pre-v1.2.24 wallet would have left its files.
///
/// The point of the enum is that "there is no legacy wallet" is one specific answer rather than
/// the default one: collapsing "absent", "locked by antivirus" and "truncated" into a single
/// `None` ends in a brand new wallet and an orphaned seed.
#[derive(Debug)]
pub(crate) enum LegacyWalletEvidence {
    /// Nothing legacy on disk. The only state in which a new wallet may be created.
    None,
    /// `wallet_config.json` is present and usable: this launch may migrate it.
    Migratable(LegacyWalletConfig),
    /// Only a `.decrypt_failed` config is left, quarantined by a previous launch. Its seed is
    /// not reachable from here, so the wallet can only be brought up view-only.
    ViewOnly(LegacyWalletConfig),
    /// A legacy file is present but unusable. Recovery case: never a new wallet.
    Unreadable(LegacyConfigProblem),
}

/// Reads one legacy wallet config file.
///
/// `Ok(None)` means the file is simply not there - the only outcome that may lead to creating a
/// wallet. Every other failure is reported, never swallowed.
pub(crate) fn get_old_wallet_config(
    path: &Path,
) -> Result<Option<LegacyWalletConfig>, LegacyConfigProblemKind> {
    let contents = match std::fs::read_to_string(path) {
        Ok(contents) => contents,
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => return Ok(None),
        Err(_) => return Err(LegacyConfigProblemKind::Unreadable),
    };
    let parsed: LegacyWalletConfig =
        serde_json::from_str(&contents).map_err(|_| LegacyConfigProblemKind::Unparseable)?;
    parsed.validate().map(Some)
}

/// Walks the legacy files in priority order and says what the launch is dealing with.
///
/// Takes the network directory rather than the app config dir so it can be exercised against a
/// temp directory without a Tauri app handle or a `Network` global.
pub(crate) fn locate_legacy_wallet(network_dir: &Path) -> LegacyWalletEvidence {
    let primary = network_dir.join(LEGACY_WALLET_CONFIG_FILE_NAME);
    match get_old_wallet_config(&primary) {
        Ok(Some(config)) => return LegacyWalletEvidence::Migratable(config),
        Err(kind) => {
            return LegacyWalletEvidence::Unreadable(LegacyConfigProblem {
                file: LegacyFileKind::WalletConfig,
                kind,
            });
        }
        Ok(None) => {}
    }

    // A quarantined config still names the wallet and carries its view key, so the app can keep
    // showing it. It is never migrated again: the rename is the record that the decrypt was
    // already tried and failed.
    let quarantined = quarantined_path(&primary, LEGACY_DECRYPT_FAILED_SUFFIX);
    match get_old_wallet_config(&quarantined) {
        Ok(Some(config)) => return LegacyWalletEvidence::ViewOnly(config),
        Err(kind) => {
            return LegacyWalletEvidence::Unreadable(LegacyConfigProblem {
                file: LegacyFileKind::QuarantinedWalletConfig,
                kind,
            });
        }
        Ok(None) => {}
    }

    // No wallet config in any form, but the plaintext credential file is still there: this
    // machine had a wallet, so a new one here would silently replace it.
    if network_dir.join(LEGACY_FALLBACK_FILE_NAME).exists() {
        return LegacyWalletEvidence::Unreadable(LegacyConfigProblem {
            file: LegacyFileKind::FallbackCredential,
            kind: LegacyConfigProblemKind::EvidenceWithoutConfig,
        });
    }

    LegacyWalletEvidence::None
}

/// `<path>.<suffix>`, keeping the original name intact so the file is still recognisable.
pub(crate) fn quarantined_path(path: &Path, suffix: &str) -> PathBuf {
    let mut name = path.as_os_str().to_os_string();
    name.push(".");
    name.push(suffix);
    PathBuf::from(name)
}

/// Renames a legacy file out of the way, never over the top of an existing quarantined file.
///
/// A previous quarantine may hold a different wallet's enciphered seed, so the name is uniquified
/// rather than replaced. Returns the new path, or `Ok(None)` when there was nothing to rename.
pub(crate) fn quarantine_legacy_file(
    path: &Path,
    suffix: &str,
) -> std::io::Result<Option<PathBuf>> {
    if !path.exists() {
        return Ok(None);
    }
    let base = quarantined_path(path, suffix);
    let mut target = base.clone();
    let mut attempt = 1u32;
    while target.exists() {
        attempt += 1;
        target = quarantined_path(&base, &attempt.to_string());
        if attempt > 50 {
            // Pathological, but never fail closed on a name clash: the point of the rename is to
            // get the file out of the migration path.
            target = quarantined_path(&base, &unix_now().to_string());
            break;
        }
    }
    std::fs::rename(path, &target)?;
    Ok(Some(target))
}

// ** Legacy passphrases **

/// Where a legacy passphrase came from. The index and the tag are safe to log; the passphrase
/// itself never leaves this module.
///
/// The variant order is the order the sources are tried: the keyring entry first, then the
/// plaintext fallback file (which `LegacyCredentialManager` would otherwise let shadow the
/// keyring), then the in-file Era-1 passphrase, then no passphrase at all.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum LegacyPassphraseSource {
    KeyringCredential,
    FallbackFileCredential,
    LegacyConfigFile,
    NoPassphrase,
}

impl LegacyPassphraseSource {
    pub(crate) fn index(self) -> usize {
        match self {
            LegacyPassphraseSource::KeyringCredential => 0,
            LegacyPassphraseSource::FallbackFileCredential => 1,
            LegacyPassphraseSource::LegacyConfigFile => 2,
            LegacyPassphraseSource::NoPassphrase => 3,
        }
    }

    pub(crate) fn as_tag(self) -> &'static str {
        match self {
            LegacyPassphraseSource::KeyringCredential => "keyring_credential",
            LegacyPassphraseSource::FallbackFileCredential => "fallback_file_credential",
            LegacyPassphraseSource::LegacyConfigFile => "legacy_config_file",
            LegacyPassphraseSource::NoPassphrase => "no_passphrase",
        }
    }
}

/// Why a legacy seed would not decrypt, as an enum-like value fit for a log line or a Sentry tag.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum LegacyDecryptErrorKind {
    /// The enciphered seed is not valid monero-base58: the field is damaged, not the passphrase.
    Base58,
    /// Wrong length for a CipherSeed.
    InvalidData,
    /// Enciphered by a CipherSeed version this build does not know.
    VersionMismatch,
    /// Checksum mismatch: the bytes are corrupt rather than merely locked.
    Crc,
    /// The bytes are a well-formed CipherSeed and no passphrase we have opens it.
    DecryptionFailed,
    Other,
}

impl LegacyDecryptErrorKind {
    pub(crate) fn as_tag(self) -> &'static str {
        match self {
            LegacyDecryptErrorKind::Base58 => "base58",
            LegacyDecryptErrorKind::InvalidData => "invalid_data",
            LegacyDecryptErrorKind::VersionMismatch => "version_mismatch",
            LegacyDecryptErrorKind::Crc => "crc",
            LegacyDecryptErrorKind::DecryptionFailed => "decryption_failed",
            LegacyDecryptErrorKind::Other => "other",
        }
    }
}

impl From<&CipherError> for LegacyDecryptErrorKind {
    fn from(error: &CipherError) -> Self {
        match error {
            CipherError::InvalidData => LegacyDecryptErrorKind::InvalidData,
            CipherError::VersionMismatch => LegacyDecryptErrorKind::VersionMismatch,
            CipherError::CrcError => LegacyDecryptErrorKind::Crc,
            CipherError::DecryptionFailed => LegacyDecryptErrorKind::DecryptionFailed,
            _ => LegacyDecryptErrorKind::Other,
        }
    }
}

/// Whatever the legacy credential stores still hold, split into the parts the migration needs.
/// Passing the parts around instead of the credential keeps the passphrase away from anything
/// that could format it.
pub(crate) struct LegacyCredentialParts {
    pub(crate) keyring_passphrase: Option<SafePassword>,
    pub(crate) fallback_passphrase: Option<SafePassword>,
    pub(crate) monero_seed: Option<Vec<u8>>,
}

/// The passphrase candidates, in the fixed order above. Always ends with "no passphrase", which
/// is a legitimate answer for a seed that was enciphered without one.
pub(crate) fn legacy_passphrase_candidates(
    keyring_passphrase: Option<SafePassword>,
    fallback_passphrase: Option<SafePassword>,
    config_passphrase: Option<String>,
) -> Vec<(LegacyPassphraseSource, Option<SafePassword>)> {
    let mut candidates = Vec::with_capacity(4);
    if let Some(passphrase) = keyring_passphrase {
        candidates.push((LegacyPassphraseSource::KeyringCredential, Some(passphrase)));
    }
    if let Some(passphrase) = fallback_passphrase {
        candidates.push((
            LegacyPassphraseSource::FallbackFileCredential,
            Some(passphrase),
        ));
    }
    if let Some(passphrase) = config_passphrase {
        candidates.push((
            LegacyPassphraseSource::LegacyConfigFile,
            Some(SafePassword::from(passphrase)),
        ));
    }
    candidates.push((LegacyPassphraseSource::NoPassphrase, None));
    candidates
}

/// Decrypts the legacy enciphered seed, trying each candidate until one works.
///
/// Shared by the migration and the purge gate so the two can never disagree about whether a
/// legacy seed is readable. Returns the source that worked, for the log line; the passphrase is
/// consumed and dropped either way.
pub(crate) fn decrypt_legacy_tari_seed(
    seed_words_encrypted_base58: &str,
    candidates: Vec<(LegacyPassphraseSource, Option<SafePassword>)>,
) -> Result<(CipherSeed, LegacyPassphraseSource), LegacyDecryptErrorKind> {
    let enciphered = Vec::<u8>::from_monero_base58(seed_words_encrypted_base58)
        .map_err(|_| LegacyDecryptErrorKind::Base58)?;

    let mut last_error = LegacyDecryptErrorKind::Other;
    for (source, passphrase) in candidates {
        match CipherSeed::from_enciphered_bytes(&enciphered, passphrase) {
            Ok(seed) => return Ok((seed, source)),
            Err(e) => {
                let kind = LegacyDecryptErrorKind::from(&e);
                // A structural failure (wrong length, unknown version, bad checksum) is the same
                // for every candidate, so there is nothing to learn from the rest.
                if kind != LegacyDecryptErrorKind::DecryptionFailed {
                    return Err(kind);
                }
                last_error = kind;
            }
        }
    }
    Err(last_error)
}

/// Reads the plaintext CBOR fallback credential directly.
///
/// `LegacyCredentialManager` prefers this file over the keyring whenever it exists, so reading it
/// separately is what allows both sources to be tried instead of the file silently shadowing a
/// keyring entry holding a different - and possibly the only working - passphrase.
fn read_legacy_fallback_credential(
    network_dir: &Path,
) -> Result<Option<LegacyCredential>, SeedProbeErrorKind> {
    let path = network_dir.join(LEGACY_FALLBACK_FILE_NAME);
    let bytes = match std::fs::read(&path) {
        Ok(bytes) => bytes,
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => return Ok(None),
        Err(_) => return Err(SeedProbeErrorKind::Io),
    };
    if bytes.is_empty() {
        return Ok(None);
    }
    serde_cbor::from_slice::<LegacyCredential>(&bytes)
        .map(Some)
        .map_err(|_| SeedProbeErrorKind::Decode)
}

/// Reads the legacy keyring entry directly, without the fallback-file preference.
fn read_legacy_keyring_credential() -> Result<Option<LegacyCredential>, SeedProbeErrorKind> {
    let username = format!(
        "{KEYCHAIN_USERNAME}_{}",
        Network::get_current().as_key_str()
    );
    let entry = keyring::Entry::new(APPLICATION_FOLDER_ID, &username)
        .map_err(|e| SeedProbeErrorKind::from(&CredentialError::Keyring(e)))?;
    match entry.get_secret() {
        Ok(encoded) => serde_cbor::from_slice::<LegacyCredential>(&encoded)
            .map(Some)
            .map_err(|_| SeedProbeErrorKind::Decode),
        Err(keyring::Error::NoEntry) => Ok(None),
        Err(e) => Err(SeedProbeErrorKind::from(&CredentialError::Keyring(e))),
    }
}

/// Constant message, details as enum-like tags only. Never formats a path or an error into it.
fn report_legacy_decrypt_failed(kind: LegacyDecryptErrorKind) {
    sentry::with_scope(
        |scope| {
            scope.set_tag("platform", std::env::consts::OS);
            scope.set_tag("wallet.legacy_decrypt_error", kind.as_tag());
        },
        || {
            sentry::capture_message(SENTRY_LEGACY_DECRYPT_FAILED, sentry::Level::Error);
        },
    );
}

/// Brings the wallet up read-only from a legacy config whose seed cannot be opened.
///
/// Same shape as `initialize_seedless`, except the address is the user's own and the legacy file
/// also carries the view key, so balance and scanning keep working.
///
/// Nothing is written: no wallet id reaches `config_wallet.json`, no keyring entry is created and
/// no Monero wallet is generated. Replacing this wallet requires the user's explicit consent.
fn view_only_wallet_from_legacy(
    legacy: &LegacyWalletConfig,
    monero_address: String,
) -> Result<InternalWallet, anyhow::Error> {
    let tari_address = TariAddress::from_base58(&legacy.tari_address_base58)
        .map_err(|e| anyhow!("Legacy wallet address could not be parsed: {e}"))?;
    if legacy.view_key_private_hex.is_empty() || legacy.spend_public_key_hex.is_empty() {
        return Err(anyhow!(
            "Legacy wallet config carries no view key, cannot run the wallet view-only"
        ));
    }

    Ok(InternalWallet {
        tari_address_type: TariAddressType::Internal,
        encrypted_tari_seed: Hidden::hide(None),
        encrypted_monero_seed: Hidden::hide(None),
        monero_address,
        external_tari_address: None,
        tari_wallet_details: Some(TariWalletDetails {
            id: WalletId::new(LEGACY_VIEW_ONLY_WALLET_ID.to_string()),
            tari_address,
            // The legacy file never stored a birthday. Zero means "scan from the start": slower
            // than the real birthday, but it cannot miss an output.
            wallet_birthday: 0,
            view_private_key_hex: ViewPrivateKeyHex::new(legacy.view_key_private_hex.clone()),
            spend_public_key_hex: legacy.spend_public_key_hex.clone(),
        }),
        // The seed exists on disk but nothing here can decode it, which is what the recovery
        // screen and the support bundle need to say.
        seed_unavailable: Some(SeedProbeErrorKind::Decode),
    })
}

/// Why the migration could not complete.
#[derive(Debug)]
pub(crate) enum LegacyMigrationError {
    /// No known passphrase opens the legacy seed. The config file has been quarantined, so this
    /// is the last launch that tries; the caller brings the wallet up view-only instead.
    SeedUndecryptable,
    /// Anything else (keyring write refused, seed conversion failed). Propagated as-is.
    Other(anyhow::Error),
}

impl std::fmt::Display for LegacyMigrationError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            LegacyMigrationError::SeedUndecryptable => {
                f.write_str("Legacy Tari seed could not be decrypted with any known passphrase")
            }
            LegacyMigrationError::Other(e) => write!(f, "{e}"),
        }
    }
}

impl std::error::Error for LegacyMigrationError {}

// ** Legacy file purge **

/// Whether the legacy files may be retired.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum LegacyPurgeDecision {
    /// Proven: the files describe a wallet this config owns.
    Purge,
    /// Not proven. Carries an enum-like reason for the log line.
    Defer(&'static str),
}

/// What this launch could prove about the wallet the legacy files describe.
#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) enum LegacySeedProof {
    /// The legacy seed decrypted and derives this address.
    Address(TariAddress),
    /// A legacy wallet config is present but its seed could not be opened, or the address could
    /// not be derived from it. Nothing about it is proven.
    Undecryptable,
    /// There is no legacy wallet config left at all; only the plaintext credential file.
    NoLegacyConfig,
}

/// Proves the blobs the config lists really are the wallet these files describe, not merely that
/// they are readable: a user whose migration failed and who then created or imported a different
/// wallet would otherwise have the last copy of their original seed destroyed.
///
/// With no `wallet_config.json` left the plaintext credential file holds a passphrase for a file
/// that no longer exists, so it may go - unless a `.decrypt_failed` config is sitting next to it,
/// in which case that passphrase is the only thing that could ever open the quarantined seed.
pub(crate) fn legacy_purge_decision(
    proof: &LegacySeedProof,
    configured_addresses: &[TariAddress],
    quarantined_config_present: bool,
) -> LegacyPurgeDecision {
    match proof {
        LegacySeedProof::Address(address) => {
            if configured_addresses.iter().any(|known| known == address) {
                LegacyPurgeDecision::Purge
            } else {
                LegacyPurgeDecision::Defer("address_mismatch")
            }
        }
        LegacySeedProof::Undecryptable => LegacyPurgeDecision::Defer("legacy_seed_undecryptable"),
        LegacySeedProof::NoLegacyConfig if quarantined_config_present => {
            LegacyPurgeDecision::Defer("quarantined_config_present")
        }
        LegacySeedProof::NoLegacyConfig => LegacyPurgeDecision::Purge,
    }
}

/// Best-effort zero-overwrite followed by unlink. Returns `Ok(false)` when the file was absent.
/// The entry is inspected with `symlink_metadata`, so a symlink is unlinked without overwriting
/// anything: following it would zero an unrelated target file.
///
/// The overwrite is defence in depth only - journaled and copy-on-write filesystems may retain old
/// blocks - so deletion is the primary control and an overwrite failure does not stop the unlink.
///
/// Reserved for the *plaintext* `credentials_backup.bin`. The enciphered `wallet_config.json` is
/// renamed instead: destroying it would take the last copy of a seed with it.
pub(crate) fn wipe_and_remove_file(path: &Path) -> std::io::Result<bool> {
    const ZERO_CHUNK_LEN: usize = 64 * 1024;

    let metadata = match std::fs::symlink_metadata(path) {
        Ok(m) => m,
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => return Ok(false),
        Err(e) => return Err(e),
    };
    // `is_file()` on symlink metadata is false for a symlink, so links fall straight through to
    // the unlink below.
    if metadata.is_file()
        && metadata.len() > 0
        && let Err(e) = zero_fill(path, metadata.len(), ZERO_CHUNK_LEN)
    {
        // The overwrite is best effort. Deletion is the primary control, so an overwrite failure
        // must never leave the plaintext file in place.
        // The path is deliberately not logged: it is under the user's home directory and
        // therefore carries their OS account name.
        log::warn!(target: LOG_TARGET_APP_LOGIC, "Could not overwrite the legacy credential file before removal, deleting anyway: {e}");
    }
    std::fs::remove_file(path)?;
    Ok(true)
}

fn zero_fill(path: &Path, len: u64, chunk_len: usize) -> std::io::Result<()> {
    let mut file = OpenOptions::new().write(true).open(path)?;
    let zeros = vec![0u8; chunk_len];
    let mut remaining = len;
    while remaining > 0 {
        let chunk = usize::try_from(remaining)
            .unwrap_or(chunk_len)
            .min(chunk_len);
        file.write_all(&zeros[..chunk])?;
        remaining -= chunk as u64;
    }
    file.sync_all()
}
