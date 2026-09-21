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
use tari_common::configuration::Network;
use tari_common_types::seeds::cipher_seed::CipherSeed;
use tari_common_types::seeds::error::CipherError;
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
    Credential, CredentialError, CredentialManager, LegacyCredential, LegacyCredentialManager,
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
/// The key has to keep living in `config_wallet.json` as a plain hex string, so
/// `Serialize`/`Deserialize` stay transparent and the on-disk shape is exactly
/// what it was before. Only `Debug`/`Display` are masked, so the key can never
/// be written to a log line or a telemetry payload through a `{:?}` formatter.
/// The value is held in a `tari_utilities::Hidden` so it is zeroized on drop as
/// well, matching how the seeds are handled on `InternalWallet`.
///
/// `Hidden` is not used directly on the field because `Hidden` only implements
/// `Deserialize`; serialization is left to the caller by design.
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
                let tari_cipher_seed =
                    CipherSeed::from_binary(&tari_seed_binary).map_err(|_| {
                        log::error!(
                            target: LOG_TARGET_APP_LOGIC,
                            "[validate_wallet_config_for_seed] could not parse Tari seed from binary: error=seed_decode wallet_id={} blob_len={}",
                            wallet_id.as_str(),
                            tari_seed_binary.len(),
                        );
                        anyhow!("Could not parse Tari Seed from binary")
                    })?;

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
    /// (the external-address reset that switches the app into seed mode, and the wallet details
    /// derived from the keyring blob). Both are snapshotted here and put back on failure, so a
    /// launch that ends in the recovery state leaves `config_wallet.json` exactly as it found it.
    /// `INSTANCE` is only published by `post_init`, which is the last step, and the keyring is
    /// only written by `add_tari_wallet` / `add_monero_wallet`, which are the seed's *only*
    /// copies at that point and must therefore never be rolled back.
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
            InternalWallet::load_latest_version(app_handle, wallet_config).await?
        } else {
            let monero_address = wallet_config.monero_address().clone();
            let app_config_dir = app_handle
                .path()
                .app_config_dir()
                .map_err(|e| anyhow!("Couldn't get application config directory: {e}"))?;

            // INTEGRATION POINT (T1, universe-wallet-hardening): once the wallet config
            // carries the `corrupted_recovery` flag that T1 adds to its default, this is
            // where it must be read. A config that was replaced by a marked default has an
            // empty `tari_wallets` list, which reaches exactly this branch and would create
            // a brand new wallet, orphaning the user's seed in the keyring. When the flag is
            // set we must instead return an error so `setup_manager` shows the recovery UI.
            // Replace the body of `wallet_config_is_corrupted_recovery` with the flag read;
            // no other call site has to change.
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
                        Ok((wallet_id, tari_seed_binary, monero_seed_binary)) => {
                            let tari_cipher_seed =
                        CipherSeed::from_binary(&tari_seed_binary).map_err(|_| {
                            log::error!(
                                target: LOG_TARGET_APP_LOGIC,
                                "[initialize_with_seed] migrated seed did not parse: error=seed_decode wallet_id={} blob_len={}",
                                wallet_id.as_str(),
                                tari_seed_binary.len(),
                            );
                            anyhow!("Could not parse Tari Seed from binary")
                        })?;
                            let tari_wallet_details = InternalWallet::get_tari_wallet_details(
                                wallet_id,
                                tari_cipher_seed,
                            )
                            .await?;

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
                        Err(LegacyMigrationError::SeedUndecryptable) => {
                            // The enciphered seed is on disk but no passphrase this machine has
                            // opens it, and `migrate` has quarantined the file so this is the
                            // last launch that tries. The address and view key in it are enough
                            // to keep the wallet visible, which is what the pre-v1.2.24 app was
                            // doing for these users all along.
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
                    // Create new wallet. The only arm that may, and it is reached only when the
                    // config is not a recovery placeholder (checked above) and nothing legacy is
                    // on disk.
                    let tari_seed = CipherSeed::random();
                    let (tari_wallet_details, tari_seed_binary) =
                        InternalWallet::add_tari_wallet(app_handle, tari_seed, None).await?;

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
        let pin_password = PinManager::get_validated_pin_if_defined(app_handle).await?;

        let (tari_wallet_details, tari_seed_binary) =
            InternalWallet::add_tari_wallet(app_handle, tari_cipher_seed, pin_password).await?;

        InternalWallet::initialize_with_seed(app_handle).await?;

        Ok((tari_wallet_details.id, tari_seed_binary))
    }

    // Internal method
    //
    // Support only one wallet fow now
    // * Define if we want to have one PIN for all wallets
    async fn add_tari_wallet(
        app_handle: &AppHandle,
        tari_seed: CipherSeed, // decrypted seed
        pin_password_provided: Option<SafePassword>,
    ) -> Result<(TariWalletDetails, Vec<u8>), anyhow::Error> {
        let wallet_id = rand_utils::get_rand_string(6);
        log::info!(target: LOG_TARGET_APP_LOGIC, "Adding Tari Wallet with id: {wallet_id}");

        let encrypted_seed = if PinManager::pin_locked().await {
            let pin_password = match pin_password_provided {
                Some(p) => p,
                None => PinManager::get_validated_pin(app_handle).await?,
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
        ConfigWallet::update_field(ConfigWalletContent::add_tari_wallet, wallet_details.clone())
            .await?;

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

    async fn add_monero_wallet(monero_seed: MoneroSeed) -> Result<Vec<u8>, anyhow::Error> {
        log::info!(target: LOG_TARGET_APP_LOGIC, "Adding new Monero Wallet");
        let cm = CredentialManager::new_default(WalletId::new("monero".to_string()));
        let monero_seed_binary = (*monero_seed.inner())
            .to_binary()
            .map_err(|e| anyhow!("Could not convert the Monero seed to binary: {e}"))?;

        let credentials = Credential {
            encrypted_seed: monero_seed_binary.clone(),
        };
        cm.set_credentials(&credentials).await?;

        let monero_address = monero_seed
            .to_address::<Mainnet>()
            .unwrap_or(DEFAULT_MONERO_ADDRESS.to_string());
        ConfigWallet::update_field(
            ConfigWalletContent::set_generated_monero_address,
            monero_address,
        )
        .await?;

        Ok(monero_seed_binary)
    }

    fn remove_monero_wallet() -> Result<(), anyhow::Error> {
        log::info!(target: LOG_TARGET_APP_LOGIC, "Removing Monero Wallet");
        let cm = CredentialManager::new_default(WalletId::new("monero".to_string()));
        cm.delete_credential()?;

        Ok(())
    }

    pub async fn recover_forgotten_pin(
        app_handle: &AppHandle,
        tari_seed: CipherSeed,
    ) -> Result<(), anyhow::Error> {
        let pin_password = PinManager::create_pin(app_handle).await?;

        let encrypted_monero_seed = if *ConfigWallet::content().await.monero_address_is_generated()
        {
            // Unfortunately, we cannot recover the Monero seed from the wallet.
            // We need to create a new one at this point.
            let monero_seed = MoneroSeed::generate()?;
            let encrypted_monero_seed = cryptography::encrypt(monero_seed.inner(), &pin_password)?;
            InternalWallet::set_credentials(
                app_handle,
                WalletId::new("monero".to_string()),
                &Credential {
                    encrypted_seed: encrypted_monero_seed.clone(),
                },
                false,
            )
            .await?;
            let monero_address = monero_seed
                .to_address::<Mainnet>()
                .unwrap_or(DEFAULT_MONERO_ADDRESS.to_string());
            log::info!(target: LOG_TARGET_APP_LOGIC, "New Monero Address generated when recover_forgotten_pin: {monero_address}");
            ConfigWallet::update_field(
                ConfigWalletContent::set_generated_monero_address,
                monero_address,
            )
            .await?;

            Some(encrypted_monero_seed)
        } else {
            None // External Monero address, no seed to recover
        };
        let encrypted_tari_seed = {
            // Encrypt Tari Seed with PIN
            let wallet_id = InternalWallet::tari_wallet_details()
                .await?
                .ok_or_else(|| anyhow!("Seedless Wallet does not support PIN enciphering"))?
                .id;
            let encrypted_tari_seed = tari_seed.encipher(Some(pin_password))?;
            InternalWallet::set_credentials(
                app_handle,
                wallet_id.clone(),
                &Credential {
                    encrypted_seed: encrypted_tari_seed.clone(),
                },
                false,
            )
            .await?;
            encrypted_tari_seed
        };
        PinManager::set_pin_locked().await?;

        if let Some(instance) = INSTANCE.get() {
            let mut internal_wallet_guard = instance.write().await;
            internal_wallet_guard.encrypted_monero_seed = Hidden::hide(encrypted_monero_seed);
            internal_wallet_guard.encrypted_tari_seed =
                Hidden::hide(Some(encrypted_tari_seed.clone()));
        }

        Ok(())
    }

    pub async fn create_pin(app_handle: &AppHandle) -> Result<(), anyhow::Error> {
        let pin_password = PinManager::create_pin(app_handle).await?;

        let encrypted_monero_seed = if *ConfigWallet::content().await.monero_address_is_generated()
        {
            // Encrypt Monero Seed with PIN
            let monero_seed = InternalWallet::get_monero_seed(None).await?;
            let encrypted_monero_seed = cryptography::encrypt(monero_seed.inner(), &pin_password)?;
            InternalWallet::set_credentials(
                app_handle,
                WalletId::new("monero".to_string()),
                &Credential {
                    encrypted_seed: encrypted_monero_seed.clone(),
                },
                false,
            )
            .await?;
            if let Some(instance) = INSTANCE.get() {
                let mut internal_wallet_guard = instance.write().await;
                internal_wallet_guard.encrypted_monero_seed =
                    Hidden::hide(Some(encrypted_monero_seed.clone()));
            }
            Some(encrypted_monero_seed)
        } else {
            // External Monero address is used, no seed to encrypt
            None
        };
        let encrypted_tari_seed = {
            // Encrypt Tari Seed with PIN
            let tari_seed = InternalWallet::get_tari_seed(None).await?;
            let wallet_id = InternalWallet::tari_wallet_details()
                .await?
                .ok_or_else(|| anyhow!("Seedless Wallet does not support PIN enciphering"))?
                .id;
            let encrypted_tari_seed = tari_seed.encipher(Some(pin_password))?;
            InternalWallet::set_credentials(
                app_handle,
                wallet_id,
                &Credential {
                    encrypted_seed: encrypted_tari_seed.clone(),
                },
                false,
            )
            .await?;
            encrypted_tari_seed
        };
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
        app_handle: &AppHandle,
        wallet_config: ConfigWalletContent,
    ) -> Result<InternalWallet, anyhow::Error> {
        log::info!(target: LOG_TARGET_APP_LOGIC, "Internal Wallet latest version detected.");
        let monero_address = wallet_config.monero_address().clone();
        let version = *wallet_config.version_counter();
        if monero_address.is_empty() {
            return Err(anyhow!(
                "Monero address should be accessible for wallet config v{version}"
            ));
        }
        let tari_wallet_id = (*wallet_config.tari_wallets())
            .first()
            .cloned()
            .ok_or_else(|| {
                anyhow!("Tari wallets field should be defined in the wallet config v{version}")
            })?;

        // Whether the details were already on disk when this launch started, as opposed to being
        // derived from the keyring moments ago by `validate_wallet_config_for_seed`. Only the
        // former means "nothing on the startup path reads the keyring", which is the case the
        // probe exists for; probing right after a successful forced read would just cost the
        // macOS user a second keychain prompt for an answer we already have.
        let details_were_cached = wallet_config.tari_wallet_details().is_some();

        let mut seed_unavailable = None;
        let (encrypted_tari_seed, tari_wallet_details) = {
            match ConfigWallet::content().await.tari_wallet_details() {
                Some(wallet_details) => {
                    log::info!(target: LOG_TARGET_APP_LOGIC, "Extracted(wallet config file) Tari Wallet Details: {wallet_details:?}");
                    // The cached details make every other startup step (address, balance,
                    // scanning, mining) work without ever opening the keyring, which is how a
                    // deleted or unreadable entry used to stay invisible until the user tried
                    // to spend. Probe it once, read-only, right here.
                    if details_were_cached {
                        seed_unavailable =
                            InternalWallet::probe_tari_seed_at_startup(app_handle, &tari_wallet_id)
                                .await;
                    }
                    (None, wallet_details.clone())
                }
                _ => {
                    // If wallet details are not saved in the config file, extract them from the
                    // decrypted seed. This path already reads the keyring, so it needs no probe.
                    let encrypted_tari_seed =
                        InternalWallet::get_credentials(app_handle, tari_wallet_id.clone(), true)
                            .await
                            .map_err(|e| {
                                log::error!(
                                    target: LOG_TARGET_APP_LOGIC,
                                    "[load_latest_version] keyring read failed: wallet_id={}",
                                    tari_wallet_id.as_str(),
                                );
                                anyhow!("Failed to get credentials: {e}")
                            })?
                            .encrypted_seed;
                    let blob_len = encrypted_tari_seed.len();
                    let tari_cipher_seed = if PinManager::pin_locked().await {
                        let pin_password = PinManager::get_validated_pin(app_handle).await?;
                        match CipherSeed::from_enciphered_bytes(
                            &encrypted_tari_seed,
                            Some(pin_password),
                        ) {
                            Ok(seed) => seed,
                            Err(_) => {
                                // Wrong PIN is a user mistake: warn, never Sentry.
                                log::warn!(
                                    target: LOG_TARGET_APP_LOGIC,
                                    "[load_latest_version] seed did not decipher with the supplied PIN: wallet_id={} blob_len={blob_len} pin_locked=true",
                                    tari_wallet_id.as_str(),
                                );
                                return Err(anyhow!("Wrong PIN entered!"));
                            }
                        }
                    } else {
                        // Seed not yet encrypted with PIN
                        CipherSeed::from_binary(&encrypted_tari_seed).map_err(|_| {
                            log::error!(
                                target: LOG_TARGET_APP_LOGIC,
                                "[load_latest_version] could not parse Tari seed from binary: error=seed_decode wallet_id={} blob_len={blob_len} pin_locked=false",
                                tari_wallet_id.as_str(),
                            );
                            anyhow!("Could not parse Tari Seed from binary")
                        })?
                    };
                    let wallet_details = InternalWallet::get_tari_wallet_details(
                        tari_wallet_id.clone(),
                        tari_cipher_seed,
                    )
                    .await?;
                    log::info!(target: LOG_TARGET_APP_LOGIC, "Extracted(seed from credentials) Tari Wallet Details: {wallet_details:?}");
                    (Some(encrypted_tari_seed), wallet_details)
                }
            }
        };

        Ok(InternalWallet {
            tari_address_type: TariAddressType::Internal,
            encrypted_tari_seed: Hidden::hide(encrypted_tari_seed),
            encrypted_monero_seed: Hidden::hide(None), // Prompt when needed
            monero_address,
            external_tari_address: None,
            tari_wallet_details: Some(tari_wallet_details),
            seed_unavailable,
        })
    }

    /// One read-only keyring probe for `tari_wallets[0]`, run only when the wallet config already
    /// carried the wallet details and nothing else on the startup path would touch the keyring.
    ///
    /// Read-only on purpose: it never creates a wallet, never writes and never deletes. It
    /// returns the failure kind to store on the instance; the caller puts it on the wallet so
    /// the UI and the support bundle can name the cause.
    ///
    /// macOS rate-limiting policy: reading a keychain item the user approved with "Allow"
    /// (rather than "Always Allow") re-shows the system dialog on every read, so an
    /// unconditional probe would re-prompt those users at every launch - which is exactly what
    /// the cached-details path was built to avoid. On macOS the probe therefore runs at most
    /// once per `SEED_PROBE_MIN_INTERVAL` (24h), with the timestamp of the last completed probe
    /// kept in a non-secret marker file (`wallet_seed_probe.json`: a unix timestamp and an
    /// enum-like outcome, no ids, no keys). Windows and Linux reads are silent and
    /// sub-millisecond, so they are probed on every launch.
    async fn probe_tari_seed_at_startup(
        app_handle: &AppHandle,
        wallet_id: &WalletId,
    ) -> Option<SeedProbeErrorKind> {
        let marker_path = app_handle
            .path()
            .app_config_dir()
            .ok()
            .map(|dir| dir.join(SEED_PROBE_MARKER_FILE_NAME));
        let last_probe = marker_path.as_deref().and_then(read_seed_probe_marker);

        if decide_seed_probe(
            SEED_PROBE_IS_RATE_LIMITED,
            last_probe,
            unix_now(),
            SEED_PROBE_MIN_INTERVAL_SECS,
        ) == SeedProbeDecision::Skip
        {
            log::info!(target: LOG_TARGET_APP_LOGIC, "Startup seed probe skipped: rate limited on this platform");
            return None;
        }

        let outcome = match CredentialManager::new_default(wallet_id.clone())
            .get_credentials()
            .await
        {
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
            Err(e) => classify_seed_probe_error(&e, SEED_PROBE_IS_RATE_LIMITED),
        };

        if let Some(path) = marker_path.as_deref() {
            write_seed_probe_marker(path, unix_now(), outcome);
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
    ///
    /// Never fatal. A source that is missing, locked or corrupt costs one candidate and is logged
    /// with an enum-like error kind. The code this replaces branched on
    /// `ConfigWallet.keyring_accessed` and, when a freshly defaulted config said the keyring had
    /// never been touched, refused to look at the keyring at all - returning `Err` on every
    /// launch for users whose keyring entry was sitting right there.
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
    /// Three things changed here, and together they are what ends the crash loop:
    /// * the decrypt is a `Result`, not an `.expect`. A seed no passphrase opens quarantines the
    ///   legacy file and returns `SeedUndecryptable`, so the next launch cannot repeat it;
    /// * every passphrase source is tried, in a fixed order, instead of only the one the legacy
    ///   credential happened to hold;
    /// * the Tari seed is decrypted *before* the Monero credential is written. The old order left
    ///   the Monero entry pointing at a wallet the app never finished adopting, on every launch.
    async fn migrate(
        app_handle: &AppHandle,
        app_config_dir: &Path,
        old_wallet_config: &LegacyWalletConfig,
    ) -> Result<(WalletId, Vec<u8>, Option<Vec<u8>>), LegacyMigrationError> {
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
            let credentials = Credential {
                encrypted_seed: monero_seed.clone(),
            };
            InternalWallet::set_credentials(
                app_handle,
                WalletId::new("monero".to_string()),
                &credentials,
                true,
            )
            .await
            .map_err(LegacyMigrationError::Other)?;
        } else {
            log::info!(target: LOG_TARGET_APP_LOGIC, "Monero Seed not found for migration");
        }

        let (tari_wallet_details, tari_seed_binary) =
            InternalWallet::add_tari_wallet(app_handle, tari_seed, None)
                .await
                .map_err(LegacyMigrationError::Other)?;

        Ok((tari_wallet_details.id, tari_seed_binary, monero_seed_binary))
    }

    /// Removes the plaintext legacy credential files left behind after a successful migration to
    /// the keyring-backed store. Runs on every launch and is a no-op when nothing is left to
    /// clean, so only users who still have the legacy files ever reach the keyring reads below.
    /// Those reads are forced: on macOS that shows the app's standard keychain dialog at the
    /// moment of need instead of silently deferring forever on a locked keychain. A missing
    /// entry is not retried and simply defers the cleanup to a later launch.
    ///
    /// It must be called from a path common to all wallet modes (standard, seedless and exchange),
    /// because a user can switch modes after migrating and would otherwise keep these files
    /// forever; when the config lists no Tari wallet it exits before touching the keyring.
    /// It also requires the global wallet instance to be initialised, as a second line of defence
    /// for callers that reach this point after a failed or half-completed wallet setup.
    ///
    /// Only the current network directory is handled, because the keyring entries used as the
    /// safety gate are network-specific. Other networks are cleaned when the app runs on them.
    pub async fn purge_legacy_credential_files(app_handle: &AppHandle) {
        let app_config_dir = match app_handle.path().app_config_dir() {
            Ok(dir) => dir,
            Err(e) => {
                log::warn!(target: LOG_TARGET_APP_LOGIC, "Legacy credential cleanup skipped, no app config dir: {e}");
                return;
            }
        };
        let legacy_dir = app_config_dir.join(Network::get_current().as_key_str());
        let fallback_file = legacy_dir.join(LEGACY_FALLBACK_FILE_NAME);
        let legacy_wallet_config = legacy_dir.join(LEGACY_WALLET_CONFIG_FILE_NAME);

        if !fallback_file.exists() && !legacy_wallet_config.exists() {
            return;
        }

        if !InternalWallet::is_initialized() {
            log::info!(target: LOG_TARGET_APP_LOGIC, "Legacy credential cleanup deferred, wallet not initialised");
            return;
        }

        // Safety gate: never delete the only remaining copy of a seed. The current config must be
        // at exactly the schema version this code understands and every configured Tari wallet
        // must be readable from the keyring right now: new wallets are prepended to the list, so
        // the migrated wallet is not necessarily the first entry.
        let wallet_config = ConfigWallet::content().await;
        if *wallet_config.version_counter() != WALLET_VERSION {
            return;
        }
        if wallet_config.tari_wallets().is_empty() {
            return;
        }
        for wallet_id in wallet_config.tari_wallets() {
            if let Err(e) =
                InternalWallet::get_credentials(app_handle, wallet_id.clone(), true).await
            {
                let id = wallet_id.as_str();
                log::info!(target: LOG_TARGET_APP_LOGIC, "Legacy credential cleanup deferred, Tari keyring entry for wallet {id} not readable: {e}");
                return;
            }
        }

        // If the legacy file carried a Monero seed, the migrated Monero entry must be readable too.
        // The gate fails closed: an unreadable or undecodable file may still hold the only copy of
        // the Monero seed, so only a genuinely empty file skips the keyring check.
        if fallback_file.exists() {
            let bytes = match std::fs::read(&fallback_file) {
                Ok(bytes) => bytes,
                Err(e) => {
                    log::warn!(target: LOG_TARGET_APP_LOGIC, "Legacy credential cleanup deferred, cannot read {fallback_file:?}: {e}");
                    return;
                }
            };
            if !bytes.is_empty() {
                let legacy_credential = match serde_cbor::from_slice::<LegacyCredential>(&bytes) {
                    Ok(credential) => credential,
                    Err(e) => {
                        log::warn!(target: LOG_TARGET_APP_LOGIC, "Legacy credential cleanup deferred, cannot parse legacy credential file {fallback_file:?}: {e}");
                        return;
                    }
                };
                if legacy_credential.monero_seed.is_some()
                    && let Err(e) = InternalWallet::get_credentials(
                        app_handle,
                        WalletId::new("monero".to_string()),
                        true,
                    )
                    .await
                {
                    log::info!(target: LOG_TARGET_APP_LOGIC, "Legacy credential cleanup deferred, Monero keyring entry not readable: {e}");
                    return;
                }
            }
        }

        for path in [fallback_file, legacy_wallet_config] {
            match wipe_and_remove_file(&path) {
                Ok(true) => {
                    log::info!(target: LOG_TARGET_APP_LOGIC, "Removed legacy credential file {path:?}");
                }
                Ok(false) => {}
                Err(e) => {
                    log::warn!(target: LOG_TARGET_APP_LOGIC, "Could not remove legacy credential file {path:?}: {e}");
                }
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
                            cred.encrypted_seed
                        }
                        Err(e) => {
                            // Diagnostics only: variant name, wallet id, and the config's PIN
                            // flag. Never the blob, the seed words or the view key. Without
                            // this line a support bundle cannot tell a deleted keyring entry
                            // (P1) from an unreadable one (P2).
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
        if let Some(pin_password) = pin_password {
            CipherSeed::from_enciphered_bytes(&encrypted_tari_seed, Some(pin_password)).map_err(
                |_| {
                    // A wrong PIN is a user mistake, not a defect: warn level, never Sentry.
                    log::warn!(
                        target: LOG_TARGET_APP_LOGIC,
                        "[get_tari_seed] seed did not decipher with the supplied PIN: blob_len={blob_len} pin_locked={pin_locked}",
                    );
                    anyhow!("Wrong PIN entered!")
                },
            )
        } else {
            // Seed not yet encrypted with PIN
            CipherSeed::from_binary(&encrypted_tari_seed).map_err(|_| {
                log::error!(
                    target: LOG_TARGET_APP_LOGIC,
                    "[get_tari_seed] could not parse Tari seed from binary: error=seed_decode blob_len={blob_len} pin_locked={pin_locked}",
                );
                anyhow!("Could not parse Tari Seed from binary")
            })
        }
    }

    /** Method safe to use before init - fallbacks to the credential manager */
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
                match CredentialManager::new_default(WalletId::new("monero".to_string()))
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
                            "monero",
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
        let decrypted_monero_seed = if let Some(pin_password) = pin_password {
            cryptography::decrypt(&encrypted_monero_seed, &pin_password).map_err(|_| {
                // Wrong PIN: user mistake, warn level, never Sentry.
                log::warn!(
                    target: LOG_TARGET_APP_LOGIC,
                    "[get_monero_seed] seed did not decrypt with the supplied PIN: wallet_id=monero blob_len={blob_len} pin_locked={pin_locked}",
                );
                anyhow!("Wrong PIN entered!")
            })
        } else {
            // Seed not yet encrypted with PIN
            Ok(encrypted_monero_seed)
        }?;
        let decrypted_monero_seed_bytes: [u8; 32] =
            decrypted_monero_seed.as_slice().try_into().map_err(|_| {
                log::error!(
                    target: LOG_TARGET_APP_LOGIC,
                    "[get_monero_seed] decrypted blob has the wrong length: error=seed_length wallet_id=monero blob_len={blob_len} pin_locked={pin_locked}",
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
        InternalWallet::remove_monero_wallet()?;
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
/// a tag with an enum-like value, never into the message (see the hardening brief).
const SENTRY_SEED_UNAVAILABLE_AT_STARTUP: &str = "wallet.seed_unavailable_at_startup";
/// The legacy migration's one Sentry message, under the same rule: constant text, enum-like tags.
const SENTRY_LEGACY_DECRYPT_FAILED: &str = "wallet.legacy_decrypt_failed";
/// Non-secret marker recording when the startup probe last ran. Holds a unix timestamp and an
/// enum-like outcome only: no wallet ids, no blobs, no keys. It lives next to the app config dir
/// rather than in `config_wallet.json` on purpose - the config crate is owned by the durability
/// work (T1) and this file must not add a field to it.
const SEED_PROBE_MARKER_FILE_NAME: &str = "wallet_seed_probe.json";
/// macOS rate limit for the startup probe: at most one keychain read per 24h. See
/// `InternalWallet::probe_tari_seed_at_startup` for why.
const SEED_PROBE_MIN_INTERVAL_SECS: u64 = 60 * 60 * 24;
/// Only macOS re-prompts the user for each read of an item approved with "Allow", so only macOS
/// needs the rate limit. Windows and Linux reads are silent.
const SEED_PROBE_IS_RATE_LIMITED: bool = cfg!(target_os = "macos");

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
/// Level follows the hardening rule "wrong PIN and user-cancelled keychain prompts are
/// non-fatal": on macOS a keyring platform failure is what a cancelled or denied prompt looks
/// like, so it warns. Everywhere else, and for every other kind, a seed we cannot read is a real
/// problem and logs at error level.
fn log_seed_read_failure(
    context: &str,
    wallet_id: &str,
    kind: SeedProbeErrorKind,
    pin_locked: bool,
) {
    let tag = kind.as_tag();
    if SEED_PROBE_IS_RATE_LIMITED && kind == SeedProbeErrorKind::KeyringPlatform {
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

impl From<&CredentialError> for SeedProbeErrorKind {
    fn from(error: &CredentialError) -> Self {
        match error {
            CredentialError::NoEntry(_) => SeedProbeErrorKind::NoEntry,
            CredentialError::Io(_) => SeedProbeErrorKind::Io,
            CredentialError::Serialization(_) => SeedProbeErrorKind::Decode,
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
    /// seed is gone and not a defect, so it is logged and nothing else: criterion "user-cancelled
    /// keychain prompts are non-fatal, no Sentry".
    Inconclusive(SeedProbeErrorKind),
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

/// Pure classification of a probe failure. `rate_limited` doubles as "this is macOS", the only
/// platform where a platform failure is routinely the user declining a keychain prompt.
pub fn classify_seed_probe_error(error: &CredentialError, rate_limited: bool) -> SeedProbeOutcome {
    let kind = SeedProbeErrorKind::from(error);
    if rate_limited && kind == SeedProbeErrorKind::KeyringPlatform {
        SeedProbeOutcome::Inconclusive(kind)
    } else {
        SeedProbeOutcome::Unavailable(kind)
    }
}

#[derive(Serialize, Deserialize)]
struct SeedProbeMarker {
    last_probe_unix: u64,
    last_outcome: SeedProbeOutcome,
}

fn unix_now() -> u64 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_secs())
        .unwrap_or_default()
}

fn read_seed_probe_marker(path: &Path) -> Option<u64> {
    let bytes = std::fs::read(path).ok()?;
    serde_json::from_slice::<SeedProbeMarker>(&bytes)
        .ok()
        .map(|marker| marker.last_probe_unix)
}

/// Best effort: a marker that cannot be written only means the next launch probes again, which on
/// macOS costs one extra prompt and everywhere else costs nothing.
fn write_seed_probe_marker(path: &Path, now_unix: u64, outcome: SeedProbeOutcome) {
    let marker = SeedProbeMarker {
        last_probe_unix: now_unix,
        last_outcome: outcome,
    };
    let Ok(serialized) = serde_json::to_vec(&marker) else {
        return;
    };
    if let Some(parent) = path.parent()
        && let Err(e) = std::fs::create_dir_all(parent)
    {
        log::debug!(target: LOG_TARGET_APP_LOGIC, "Could not create the directory for the seed probe marker: {e}");
        return;
    }
    if let Err(e) = std::fs::write(path, serialized) {
        log::debug!(target: LOG_TARGET_APP_LOGIC, "Could not write the seed probe marker: {e}");
    }
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

/// Why the app is in the wallet recovery state.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum WalletRecoveryReason {
    /// `initialize_with_seed` / `initialize_seedless` returned an error.
    InitializationFailed,
    /// The wallet initialised, but the startup probe could not read its seed.
    SeedUnavailable,
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
    EventsEmitter::emit_wallet_recovery_required(WalletRecoveryPayload { reason }).await;
}

/// The current recovery reason, if the app is in the recovery state.
pub fn wallet_recovery_reason() -> Option<WalletRecoveryReason> {
    WALLET_RECOVERY_REASON
        .read()
        .ok()
        .and_then(|guard| *guard)
        .or(None)
}

/// Clear the recovery state after the user recovered (imported seed words, re-linked a wallet).
pub fn clear_wallet_recovery() {
    if let Ok(mut guard) = WALLET_RECOVERY_REASON.write() {
        *guard = None;
    }
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
            | WalletRecoveryReason::LegacySeedUndecryptable
            | WalletRecoveryReason::LegacyConfigUnreadable,
        ) => Err(MiningError::WalletNotReady),
    }
}

/// INTEGRATION POINT for T1 (universe-wallet-hardening, config durability).
///
/// T1 adds a `corrupted_recovery` flag to the wallet config default, set when
/// `config_wallet.json` could not be parsed and neither could its backup. A config in that state
/// has an empty `tari_wallets` list, which lands in `initialize_with_seed`'s "create new wallet"
/// branch and would silently replace the user's wallet, orphaning their seed in the keyring.
///
/// To wire it up, replace the body with:
/// ```ignore
/// *wallet_config.corrupted_recovery()
/// ```
/// and delete the `_` on the parameter. Nothing else has to change: the single call site in
/// `initialize_with_seed_inner` already turns `true` into an error, which `setup_manager` turns
/// into the recovery UI.
fn wallet_config_is_corrupted_recovery(wallet_config: &ConfigWalletContent) -> bool {
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
    log::error!(
        target: LOG_TARGET_APP_LOGIC,
        "Unexpected {}! {} --- State: {:?} | Extracted from seed: {:?}",
        address_type,
        title,
        state_wallet_details,
        extracted_wallet_details
    );
    EventsEmitter::emit_critical_problem(CriticalProblemPayload {
        title: Some(title.to_string()),
        description: Some(description.to_string()),
        error_message: Some(format!(
            "State: {:?}, Extracted: {:?}",
            state_wallet_details.map(|d| d.tari_address),
            extracted_wallet_details.map(|d| d.tari_address.clone())
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

pub async fn mnemonic_to_tari_cipher_seed(
    seed_words: Vec<String>,
) -> Result<CipherSeed, anyhow::Error> {
    let hidden_seed_words = seed_words.into_iter().map(Hidden::hide).collect::<Vec<_>>();
    let seed_words_parsed = SeedWords::new(hidden_seed_words);
    // TODO: use pin to encrypt seed words
    CipherSeed::from_mnemonic(&seed_words_parsed, None).map_err(|e| anyhow::anyhow!(e.to_string()))
}

// ** Legacy Wallet Config **

/// The pre-v1.2.24 `wallet_config.json`.
///
/// `passphrase` is back. Era-1 builds (v0.4 - v0.7) wrote the legacy seed's passphrase into this
/// file whenever the keyring was unavailable, and v1.2.24 dropped the field from this struct, so
/// serde silently discarded the last passphrase those machines had - one of the documented ways a
/// wallet ends up permanently undecryptable. In most real files the field is present and `null`.
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
/// Suffix for a legacy wallet config whose seed no known passphrase opens. Renaming is what
/// breaks the migration loop: the next launch finds nothing migratable and comes up view-only
/// instead of attempting - and failing - the same decrypt forever.
pub(crate) const LEGACY_DECRYPT_FAILED_SUFFIX: &str = "decrypt_failed";
/// Suffix for a legacy wallet config that has been proven migrated (T4). The file holds only an
/// enciphered seed, so it is renamed rather than destroyed.
pub(crate) const LEGACY_MIGRATED_SUFFIX: &str = "migrated";
/// Mirrors the private `credential_manager::KEYCHAIN_USERNAME`. Duplicated rather than imported
/// because `credential_manager.rs` is owned by another change in flight; the legacy entry name is
/// frozen history and cannot drift.
const LEGACY_KEYCHAIN_USERNAME: &str = "inner_wallet_credentials";
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
/// the default one. The old code called `get_old_wallet_config(..).ok()`, which collapsed
/// "absent", "locked by antivirus" and "truncated" into `None` and then created a brand new
/// wallet, orphaning the seed the damaged file pointed at.
#[derive(Debug)]
pub(crate) enum LegacyWalletEvidence {
    /// Nothing legacy on disk. The only state in which a new wallet may be created.
    None,
    /// `wallet_config.json` is present and usable: this launch may migrate it.
    Migratable(LegacyWalletConfig),
    /// Only a quarantined config is left (`.decrypt_failed` from a previous launch, or
    /// `.migrated` next to a config that has since lost its wallet list). Its seed is not
    /// reachable from here, so the wallet can only be brought up view-only.
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
    for suffix in [LEGACY_DECRYPT_FAILED_SUFFIX, LEGACY_MIGRATED_SUFFIX] {
        let quarantined = quarantined_path(&primary, suffix);
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
    }

    // No wallet config in any form, but the plaintext credential file is still there: this
    // machine had a wallet. Creating a new one here is exactly the silent replacement the
    // hardening brief forbids.
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
/// The order is the order the sources are tried, and it is the fix for the single-source lookup
/// that made `DecryptionFailed` permanent: the keyring entry first, then the plaintext fallback
/// file (which `LegacyCredentialManager` would otherwise let shadow the keyring), then the
/// in-file Era-1 passphrase that v1.2.24 dropped on the floor, then no passphrase at all.
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
/// Shared by the migration (T3) and the purge gate (T4) so the two can never disagree about
/// whether a legacy seed is readable. Returns the source that worked, for the log line; the
/// passphrase is consumed and dropped either way.
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
        "{LEGACY_KEYCHAIN_USERNAME}_{}",
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
/// There is precedent: `initialize_seedless` already runs the app against an address it holds no
/// seed for. This is the same shape, except the address is the user's own and the legacy file also
/// carries the view key, so balance and scanning keep working - which is exactly what the
/// pre-v1.2.24 app was doing for these users until the migration turned it into a crash loop.
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

/// Best-effort zero-overwrite followed by unlink. Returns `Ok(false)` when the file was absent.
/// The entry is inspected with `symlink_metadata`, so a symlink is unlinked without overwriting
/// anything: following it would zero an unrelated target file. Only a regular file is overwritten,
/// and the overwrite is chunked through a fixed 64 KiB zero buffer so a large file cannot make us
/// allocate unbounded memory.
/// The overwrite is defence in depth only; journaled and copy-on-write filesystems may retain
/// old blocks, which is why deletion (not overwrite) is the primary control. An overwrite
/// failure is logged and the unlink still proceeds.
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
        log::warn!(target: LOG_TARGET_APP_LOGIC, "Could not overwrite {path:?} before removal, deleting anyway: {e}");
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
