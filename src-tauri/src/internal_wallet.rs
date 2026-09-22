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
use std::io::{Read, Write};
use std::path::{Path, PathBuf};
use tari_common::configuration::Network;
use tari_common_types::seeds::cipher_seed::CipherSeed;
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
use tokio::fs;
use tokio::sync::{OnceCell, RwLock};

use tari_utilities::hex::Hex;

use crate::configs::config_ui::ConfigUI;
use crate::configs::config_wallet::{ConfigWallet, ConfigWalletContent, WALLET_VERSION, WalletId};
use crate::configs::trait_config::ConfigImpl;
use crate::consts::DEFAULT_MONERO_ADDRESS;
use crate::credential_manager::{
    Credential, CredentialError, CredentialManager, LegacyCredential, LegacyCredentialManager,
};
use crate::events::CriticalProblemPayload;
use crate::events_emitter::EventsEmitter;
use crate::mining::pools::PoolManagerInterfaceTrait;
use crate::mining::pools::cpu_pool_manager::CpuPoolManager;
use crate::mining::pools::gpu_pool_manager::GpuPoolManager;
use crate::pin::PinManager;
use crate::utils::{cryptography, rand_utils};
use crate::{LOG_TARGET_APP_LOGIC, UniverseAppState};

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
}

static INSTANCE: OnceCell<RwLock<InternalWallet>> = OnceCell::const_new();

impl InternalWallet {
    pub fn current() -> &'static RwLock<InternalWallet> {
        INSTANCE.get().expect("InternalWallet is not initialized")
    }

    pub fn is_initialized() -> bool {
        INSTANCE.get().is_some()
    }

    async fn set_current(new_internal_wallet: InternalWallet) -> Result<(), anyhow::Error> {
        if INSTANCE.get().is_some() {
            // INSTANCE has been initialized
            let mut internal_wallet_guard = InternalWallet::current().write().await;
            *internal_wallet_guard = new_internal_wallet;
        } else {
            INSTANCE
                .set(RwLock::new(new_internal_wallet))
                .map_err(|_| anyhow!("InternalWallet already initialized"))?;
        }
        Ok(())
    }

    pub async fn is_internal() -> bool {
        let internal_wallet_guard = InternalWallet::current().read().await;
        matches!(
            internal_wallet_guard.tari_address_type,
            TariAddressType::Internal
        )
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
                let tari_seed_binary = match InternalWallet::get_credentials(
                    app_handle,
                    wallet_id.clone(),
                    true,
                )
                .await
                {
                    Ok(cred) => cred.encrypted_seed,
                    Err(e) => return Err(anyhow!("Failed to get credentials: {e}")),
                };
                let tari_cipher_seed = CipherSeed::from_binary(&tari_seed_binary)
                    .map_err(|e| anyhow!("Could not parse Tari Seed from binary: {e}"))?;

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

    pub async fn initialize_with_seed(app_handle: &tauri::AppHandle) -> Result<(), anyhow::Error> {
        ConfigWallet::update_field(
            ConfigWalletContent::set_selected_external_tari_address,
            None,
        )
        .await?;
        let wallet_config = ConfigWallet::content().await;

        let internal_wallet =
            if InternalWallet::validate_wallet_config_for_seed(app_handle, &wallet_config).await? {
                InternalWallet::load_latest_version(app_handle, wallet_config).await?
            } else {
                let monero_address = wallet_config.monero_address().clone();
                let app_config_dir = app_handle
                    .path()
                    .app_config_dir()
                    .map_err(|e| anyhow!("Couldn't get application config directory: {e}"))?;

                let old_wallet_config = get_old_wallet_config(&app_config_dir).await?;
                if let Some(old_wallet_config) = old_wallet_config {
                    // Migrate old wallet config
                    let (wallet_id, tari_seed_binary, monero_seed_binary) =
                        InternalWallet::migrate(app_handle, &app_config_dir, old_wallet_config)
                            .await?;
                    let tari_wallet_details = InternalWallet::get_tari_wallet_details(
                        wallet_id,
                        CipherSeed::from_binary(&tari_seed_binary)
                            .map_err(|e| anyhow!("Could not parse Tari Seed from binary: {e}"))?,
                    )
                    .await?;

                    InternalWallet {
                        tari_address_type: TariAddressType::Internal,
                        encrypted_tari_seed: Hidden::hide(Some(tari_seed_binary)),
                        encrypted_monero_seed: Hidden::hide(monero_seed_binary),
                        monero_address,
                        external_tari_address: None,
                        tari_wallet_details: Some(tari_wallet_details),
                    }
                } else {
                    refuse_if_previous_wallet_evident(&app_config_dir)?;
                    // Checked before anything is persisted: a new Tari wallet written to the
                    // config and then a Monero failure leaves a config the next launch cannot
                    // load. A custom Monero address generates no seed, so it still passes.
                    if monero_address.is_empty() && monero_credential_exists().await {
                        return Err(anyhow!("{MONERO_SEED_ALREADY_EXISTS}"));
                    }

                    // Create new wallet
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
                    }
                }
            };

        internal_wallet.post_init(app_handle).await
    }

    // Handle all side effects here
    async fn post_init(&self, app_handle: &AppHandle) -> Result<(), anyhow::Error> {
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
        EventsEmitter::emit_selected_tari_address_changed(
            self.extract_tari_address(),
            self.tari_address_type.clone(),
        )
        .await;

        CpuPoolManager::handle_wallet_address_change(self.extract_tari_address()).await;
        GpuPoolManager::handle_wallet_address_change(self.extract_tari_address()).await;

        log::info!(
            "Wallet with {} address initialized successfully",
            self.tari_address_type.clone()
        );
        Ok(())
    }

    // ** Getters

    pub async fn tari_address() -> TariAddress {
        let internal_wallet_guard = InternalWallet::current().read().await;
        internal_wallet_guard.extract_tari_address().clone()
    }
    fn extract_tari_address(&self) -> &TariAddress {
        if let Some(ref external_tari_address) = self.external_tari_address {
            external_tari_address
        } else if let Some(ref details) = self.tari_wallet_details {
            &details.tari_address
        } else {
            // TODO(testing): This panic can occur if wallet is in invalid state.
            // Consider returning Result<&TariAddress, WalletError> instead.
            // See TESTING_ISSUES.md for full analysis.
            panic!("Internal wallet must have a Tari Address defined!")
        }
    }

    pub async fn tari_wallet_details() -> Option<TariWalletDetails> {
        let internal_wallet_guard = InternalWallet::current().read().await;
        internal_wallet_guard.tari_wallet_details.clone()
    }
    // **

    pub async fn import_tari_seed_words(
        seed_words: Vec<String>,
        app_handle: &AppHandle,
    ) -> Result<(WalletId, Vec<u8>), anyhow::Error> {
        let tari_cipher_seed = mnemonic_to_tari_cipher_seed(seed_words).await?;
        let pin_password = PinManager::get_validated_pin_if_defined(app_handle, None).await?;

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
                None => PinManager::get_validated_pin(app_handle, None).await?,
            };
            tari_seed.encipher(Some(pin_password))?
        } else {
            tari_seed
                .to_binary()
                .expect("[add_tari_wallet] Failed to convert tari seed to binary")
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
        if INSTANCE.get().is_some() {
            let mut internal_wallet_guard = InternalWallet::current().write().await;
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
        // A generated seed must never overwrite the Monero credential already in the keyring.
        if monero_credential_exists().await {
            return Err(anyhow!("{MONERO_SEED_ALREADY_EXISTS}"));
        }
        let monero_seed_binary = (*monero_seed.inner())
            .to_binary()
            .expect("Failed to convert monero seed to binary");

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
        monero_seed: Option<MoneroSeed>,
    ) -> Result<(), anyhow::Error> {
        let pin_password = PinManager::create_pin(app_handle).await?;

        let encrypted_monero_seed = if *ConfigWallet::content().await.monero_address_is_generated()
        {
            // The old Monero blob is enciphered with the forgotten PIN, so it is replaced here:
            // either with the seed the caller proved derives the recorded address, or, when the
            // user asked for that, with a new Monero wallet.
            let (monero_seed, new_monero_address) = match monero_seed {
                Some(monero_seed) => (monero_seed, None),
                None => {
                    let monero_seed = MoneroSeed::generate()?;
                    let monero_address = monero_seed
                        .to_address::<Mainnet>()
                        .unwrap_or(DEFAULT_MONERO_ADDRESS.to_string());
                    (monero_seed, Some(monero_address))
                }
            };
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
            if let Some(monero_address) = new_monero_address {
                log::info!(target: LOG_TARGET_APP_LOGIC, "New Monero wallet created during PIN recovery");
                ConfigWallet::update_field(
                    ConfigWalletContent::set_generated_monero_address,
                    monero_address,
                )
                .await?;
            }
            Some(encrypted_monero_seed)
        } else {
            None // External Monero address, no seed to recover
        };
        let encrypted_tari_seed = {
            // Encrypt Tari Seed with PIN
            let wallet_id = InternalWallet::tari_wallet_details()
                .await
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

        if InternalWallet::is_initialized() {
            let mut internal_wallet_guard = InternalWallet::current().write().await;
            internal_wallet_guard.encrypted_monero_seed = Hidden::hide(encrypted_monero_seed);
            internal_wallet_guard.encrypted_tari_seed =
                Hidden::hide(Some(encrypted_tari_seed.clone()));
        }

        Ok(())
    }

    pub async fn create_pin(app_handle: &AppHandle) -> Result<(), anyhow::Error> {
        if PinManager::pin_locked().await {
            // The stored seeds are already enciphered with a PIN and nothing decrypts twice.
            return Err(anyhow!("A PIN is already set for this wallet"));
        }
        let pin_password = PinManager::create_pin(app_handle).await?;

        // Read the Tari seed before any credential is rewritten, so a wallet whose Tari seed is
        // unreadable keeps its Monero seed as it is.
        let tari_seed = InternalWallet::get_tari_seed(None).await?;
        let wallet_id = InternalWallet::tari_wallet_details()
            .await
            .ok_or_else(|| anyhow!("Seedless Wallet does not support PIN enciphering"))?
            .id;

        let encrypted_monero_seed = if *ConfigWallet::content().await.monero_address_is_generated()
        {
            // Encrypt Monero Seed with PIN. An earlier run can have written this credential and
            // then failed, so a blob that already decrypts with this PIN is kept as it is:
            // encrypting it again would bury the seed.
            let stored_monero_seed = InternalWallet::get_credentials(
                app_handle,
                WalletId::new("monero".to_string()),
                false,
            )
            .await?
            .encrypted_seed;
            let encrypted_monero_seed =
                if cryptography::decrypt(&stored_monero_seed, &pin_password).is_ok() {
                    stored_monero_seed
                } else if stored_monero_seed.len() == 32 {
                    // A plain Monero seed, as written before any PIN existed.
                    let encrypted_monero_seed =
                        cryptography::encrypt(&stored_monero_seed, &pin_password)?;
                    InternalWallet::set_credentials(
                        app_handle,
                        WalletId::new("monero".to_string()),
                        &Credential {
                            encrypted_seed: encrypted_monero_seed.clone(),
                        },
                        false,
                    )
                    .await?;
                    encrypted_monero_seed
                } else {
                    return Err(anyhow!(
                        "Stored Monero seed is neither plain nor enciphered with this PIN"
                    ));
                };
            if InternalWallet::is_initialized() {
                let mut internal_wallet_guard = InternalWallet::current().write().await;
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

        if InternalWallet::is_initialized() {
            let mut internal_wallet_guard = InternalWallet::current().write().await;
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

    /// Reads the Tari credential once at startup so a lost or unreadable keyring entry is
    /// reported now instead of at the user's first spend. Read-only and never forced.
    async fn probe_tari_credential(wallet_id: WalletId) -> Result<(), anyhow::Error> {
        // Skipped on macOS: a keychain read there can raise a prompt, and a denied or cancelled
        // prompt is not a lost seed. The seed is still checked on first use.
        if cfg!(target_os = "macos") {
            return Ok(());
        }

        match CredentialManager::new_default(wallet_id)
            .get_credentials()
            .await
        {
            Ok(_) => Ok(()),
            Err(e) => {
                let kind = credential_error_tag(&e);
                log::error!(target: LOG_TARGET_APP_LOGIC, "[probe_tari_credential] Tari seed credential is unreadable: {kind}");
                sentry::with_scope(
                    |scope| scope.set_tag("wallet.seed_probe", kind),
                    || {
                        sentry::capture_message(
                            "Tari seed credential unreadable at startup",
                            sentry::Level::Error,
                        )
                    },
                );
                Err(anyhow!(
                    "Tari seed credential is unreadable at startup: {kind}"
                ))
            }
        }
    }

    async fn load_latest_version(
        app_handle: &AppHandle,
        wallet_config: ConfigWalletContent,
    ) -> Result<InternalWallet, anyhow::Error> {
        log::info!(target: LOG_TARGET_APP_LOGIC, "Internal Wallet latest version detected.");
        let monero_address = wallet_config.monero_address().clone();
        // An inconsistent wallet config is reported, not fatal: the error reaches the critical
        // problem dialog instead of killing every launch.
        if monero_address.is_empty() {
            return Err(anyhow!(
                "Monero address should be accessible for v{:?}",
                *wallet_config.version_counter()
            ));
        }
        if (*wallet_config.tari_wallets()).is_empty() {
            return Err(anyhow!(
                "Tari wallets field should be defined in the config for v{:?}",
                *wallet_config.version_counter()
            ));
        }

        let (encrypted_tari_seed, tari_wallet_details) = {
            match ConfigWallet::content().await.tari_wallet_details() {
                Some(wallet_details) => {
                    log::info!(target: LOG_TARGET_APP_LOGIC, "Extracted(wallet config file) Tari Wallet Details: {wallet_details:?}");
                    // The cached details make the keyring unnecessary for startup, so without this
                    // probe a missing seed stays invisible until the user first spends.
                    if let Some(tari_wallet_id) = (*wallet_config.tari_wallets()).first() {
                        InternalWallet::probe_tari_credential(tari_wallet_id.clone()).await?;
                    }
                    (None, wallet_details.clone())
                }
                _ => {
                    // If wallet details are not saved in the config file, extract them from the decrypted seed.
                    let tari_wallet_id =
                        (*wallet_config.tari_wallets()).first().ok_or_else(|| {
                            anyhow!("Selected wallet not found in the wallet config!")
                        })?;
                    let encrypted_tari_seed = match InternalWallet::get_credentials(
                        app_handle,
                        tari_wallet_id.clone(),
                        true,
                    )
                    .await
                    {
                        Ok(cred) => cred.encrypted_seed,
                        Err(e) => return Err(anyhow!("Failed to get credentials: {e}")),
                    };
                    let tari_cipher_seed = if PinManager::pin_locked().await {
                        let pin_password = PinManager::get_validated_pin(app_handle, None).await?;
                        match CipherSeed::from_enciphered_bytes(
                            &encrypted_tari_seed,
                            Some(pin_password),
                        ) {
                            Ok(seed) => seed,
                            Err(_) => {
                                return Err(anyhow!("Wrong PIN entered!"));
                            }
                        }
                    } else {
                        // Seed not yet encrypted with PIN
                        CipherSeed::from_binary(&encrypted_tari_seed)
                            .map_err(|e| anyhow!("Could not parse Tari Seed from binary: {e}"))?
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
        })
    }

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

    async fn migrate(
        app_handle: &AppHandle,
        app_config_dir: &Path,
        old_wallet_config: LegacyWalletConfig,
    ) -> Result<(WalletId, Vec<u8>, Option<Vec<u8>>), anyhow::Error> {
        let legacy_cred: LegacyCredential = if *ConfigWallet::content().await.keyring_accessed() {
            InternalWallet::get_legacy_credentials_forced(app_handle, app_config_dir).await?
        } else {
            let legacy_fallback_file = get_legacy_fallback_file(app_config_dir).await?;
            if !legacy_fallback_file.exists() {
                return Err(anyhow!(
                    "Legacy fallback file not found even though keyring not accessed! Path: {:?}",
                    legacy_fallback_file
                ));
            }
            let mut file = OpenOptions::new().read(true).open(legacy_fallback_file)?;
            let mut buffer = Vec::new();
            file.read_to_end(&mut buffer)?;
            let cred: LegacyCredential = serde_cbor::from_slice(&buffer)?;
            cred
        };

        // Migrate Monero Seed if exists in the LegacyCredential
        let monero_seed_binary = legacy_cred.monero_seed.map(|seed| seed.to_vec());
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
            .await?;
        } else {
            log::info!(target: LOG_TARGET_APP_LOGIC, "Monero Seed not found for migration");
        }

        // Migrate Tari Seed
        let tari_seed_enciphered_bytes =
            Vec::<u8>::from_monero_base58(&old_wallet_config.seed_words_encrypted_base58)
                .map_err(|e| anyhow!(e.to_string()))?;
        let tari_seed = CipherSeed::from_enciphered_bytes(
            &tari_seed_enciphered_bytes,
            legacy_cred.tari_seed_passphrase,
        )
        .expect("Failed to decrypt legacy Tari seed");
        let (tari_wallet_details, tari_seed_binary) =
            InternalWallet::add_tari_wallet(app_handle, tari_seed, None).await?;

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

        // The legacy config holds the only copy of the legacy wallet's seed, so it is removed only
        // when the wallet in use is that same wallet. After a silent replacement the addresses
        // differ and both files stay: the fallback file holds the passphrase that decrypts it.
        if legacy_wallet_config.exists() {
            let legacy_address = std::fs::read_to_string(&legacy_wallet_config)
                .ok()
                .and_then(|raw| serde_json::from_str::<LegacyWalletConfig>(&raw).ok())
                .map(|legacy| legacy.tari_address_base58);
            let keep_reason = match legacy_address {
                Some(address) => legacy_config_keep_reason(
                    &address,
                    wallet_config.tari_wallets().first(),
                    wallet_config.tari_wallet_details().as_ref(),
                ),
                None => Some("legacy_config_unreadable"),
            };
            if let Some(reason) = keep_reason {
                log::info!(target: LOG_TARGET_APP_LOGIC, "Legacy credential cleanup deferred, reason={reason}");
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
            let state_result = if InternalWallet::is_initialized() {
                let internal_wallet = InternalWallet::current().read().await;
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
                            // Update store if not yet set to store
                            let mut internal_wallet_guard = InternalWallet::current().write().await;
                            internal_wallet_guard.encrypted_tari_seed =
                                Hidden::hide(Some(cred.encrypted_seed.clone()));
                            cred.encrypted_seed
                        }
                        Err(e) => {
                            log::error!(target: LOG_TARGET_APP_LOGIC, "[get_tari_seed] Failed to read the Tari seed from the keyring: {}", credential_error_tag(&e));
                            // Only display once
                            #[cfg(target_os = "macos")]
                            EventsEmitter::emit_show_keyring_dialog().await;

                            return Err(anyhow!("Failed to get tari seed from keyring: {e}"));
                        }
                    }
                } else {
                    handle_critical_problem("Can't access seed", "[get_tari_seed]", None).await;
                    return Err(anyhow!("Can't access Tari seed"));
                }
            }
        };

        if let Some(pin_password) = pin_password {
            CipherSeed::from_enciphered_bytes(&encrypted_tari_seed, Some(pin_password))
                .map_err(|_| anyhow!("Wrong PIN entered!"))
        } else {
            // Seed not yet encrypted with PIN
            CipherSeed::from_binary(&encrypted_tari_seed).map_err(|_| {
                log::error!(target: LOG_TARGET_APP_LOGIC, "[get_tari_seed] Could not parse Tari Seed from binary.");
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

        let state_result = if InternalWallet::is_initialized() {
            let internal_wallet = InternalWallet::current().read().await;
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
                        if InternalWallet::is_initialized() {
                            let mut internal_wallet_guard = InternalWallet::current().write().await;
                            internal_wallet_guard.encrypted_monero_seed =
                                Hidden::hide(Some(cred.encrypted_seed.clone()));
                        }
                        cred.encrypted_seed
                    }
                    Err(e) => {
                        log::error!(target: LOG_TARGET_APP_LOGIC, "[get_monero_seed] Failed to read the Monero seed from the keyring: {}", credential_error_tag(&e));
                        #[cfg(target_os = "macos")]
                        EventsEmitter::emit_show_keyring_dialog().await;

                        return Err(anyhow!("Failed to get monero seed from keyring: {e}"));
                    }
                }
            }
        };

        let decrypted_monero_seed = if let Some(pin_password) = pin_password {
            cryptography::decrypt(&encrypted_monero_seed, &pin_password)
                .map_err(|_| anyhow!("Wrong PIN entered!"))
        } else {
            // Seed not yet encrypted with PIN
            Ok(encrypted_monero_seed)
        }?;
        let decrypted_monero_seed_bytes: [u8; 32] = decrypted_monero_seed
            .as_slice()
            .try_into()
            .map_err(|_| anyhow!("Monero seed is not 32 bytes"))?;
        Ok(MoneroSeed::new(decrypted_monero_seed_bytes))
    }

    pub async fn set_external_monero_address(monero_address: String) -> Result<(), anyhow::Error> {
        ConfigWallet::update_field(
            ConfigWalletContent::set_user_monero_address,
            monero_address.clone(),
        )
        .await?;

        if INSTANCE.get().is_some() {
            let mut internal_wallet_guard = InternalWallet::current().write().await;
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

/// Enum-like tag for a credential failure, safe to log and to send as a Sentry tag.
/// Carries the kind of failure only, never the error's contents.
pub fn credential_error_tag(error: &CredentialError) -> &'static str {
    match error {
        CredentialError::NoEntry(_) => "missing_entry",
        CredentialError::Keyring(_) => "platform_error",
        CredentialError::Serialization(_) => "decode_error",
        CredentialError::Io(_) => "io_error",
    }
}

async fn handle_critical_problem(
    title: &str,
    description: &str,
    extracted_wallet_details: Option<&TariWalletDetails>,
) {
    let state_wallet_details = InternalWallet::tari_wallet_details().await;
    log::error!(
        target: LOG_TARGET_APP_LOGIC,
        "Unexpected {}! {} --- State: {:?} | Extracted from seed: {:?}",
        InternalWallet::current().read().await.tari_address_type,
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

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct LegacyWalletConfig {
    tari_address_base58: String,
    view_key_private_hex: String,
    spend_public_key_hex: String,
    seed_words_encrypted_base58: String,
    config_path: Option<PathBuf>,
}
/// Reads the pre-keyring wallet config. `Ok(None)` means the file is absent; a file that
/// cannot be read or parsed is an error, never a reason to create a new wallet.
pub async fn get_old_wallet_config(
    config_dir: &Path,
) -> Result<Option<LegacyWalletConfig>, anyhow::Error> {
    let network = Network::get_current_or_user_setting_or_default()
        .to_string()
        .to_lowercase();
    let old_config_file = config_dir
        .join(network)
        .join(LEGACY_WALLET_CONFIG_FILE_NAME);
    if !old_config_file.exists() {
        return Ok(None);
    }
    let old_config_str = fs::read_to_string(old_config_file).await?;
    let old_config: LegacyWalletConfig = serde_json::from_str(&old_config_str)?;
    Ok(Some(old_config))
}

const MONERO_SEED_ALREADY_EXISTS: &str =
    "A Monero seed already exists in the keyring, refusing to generate a new one";

/// True when the keyring already holds a Monero seed. A keyring error is not proof of one:
/// generating a seed would fail on the same keyring anyway.
async fn monero_credential_exists() -> bool {
    CredentialManager::new_default(WalletId::new("monero".to_string()))
        .get_credentials()
        .await
        .is_ok()
}

/// Constant Sentry message; the evidence kind travels as a tag.
const PREVIOUS_WALLET_EVIDENT: &str =
    "Refusing to create a new wallet, a previous wallet is evident";

/// Fails when a previous Tari wallet is evident on this machine, so a new one never replaces it
/// and leaves the old seed in the keyring under an id nothing records. The error reaches the
/// critical problem dialog through the caller in `setup_manager`.
fn refuse_if_previous_wallet_evident(app_config_dir: &Path) -> Result<(), anyhow::Error> {
    let config_backup = ConfigWallet::_get_config_path().with_extension("json.backup");
    let legacy_wallet_config = app_config_dir
        .join(Network::get_current().as_key_str())
        .join(LEGACY_WALLET_CONFIG_FILE_NAME);
    let Some(evidence) = previous_wallet_files(&config_backup, &legacy_wallet_config) else {
        return Ok(());
    };

    log::error!(target: LOG_TARGET_APP_LOGIC, "{PREVIOUS_WALLET_EVIDENT}: {evidence}");
    sentry::with_scope(
        |scope| scope.set_tag("previous_wallet_evidence", evidence),
        || sentry::capture_message(PREVIOUS_WALLET_EVIDENT, sentry::Level::Error),
    );
    Err(anyhow!("{PREVIOUS_WALLET_EVIDENT}: {evidence}"))
}

/// Evidence that this machine already held a Tari wallet, as an enum-like tag. Only files that
/// name a Tari wallet count: a seedless user reverting to an internal wallet has a Monero
/// credential and a wallet data directory but no seed to lose, and must still be let through.
pub(crate) fn previous_wallet_files(
    config_backup: &Path,
    legacy_wallet_config: &Path,
) -> Option<&'static str> {
    if backup_names_a_wallet(config_backup) {
        return Some("config_backup");
    }
    if legacy_wallet_config.exists() {
        return Some("legacy_wallet_config");
    }
    None
}

/// True when the wallet config backup names a Tari wallet, by id or by cached details, or
/// cannot be parsed at all. A first launch that failed before creating a wallet names neither,
/// which is not evidence.
fn backup_names_a_wallet(config_backup: &Path) -> bool {
    let Ok(contents) = std::fs::read_to_string(config_backup) else {
        return false;
    };
    match serde_json::from_str::<serde_json::Value>(&contents) {
        Ok(content) => {
            let has_wallet_id = content
                .get("tari_wallets")
                .and_then(serde_json::Value::as_array)
                .is_some_and(|wallets| !wallets.is_empty());
            has_wallet_id
                || content
                    .get("tari_wallet_details")
                    .is_some_and(|d| !d.is_null())
        }
        Err(_) => true,
    }
}

/// Names why the legacy wallet config must be kept, or `None` when the wallet the config now uses
/// is the legacy wallet itself and the file is no longer the only copy of its seed.
pub(crate) fn legacy_config_keep_reason(
    legacy_address_base58: &str,
    first_wallet: Option<&WalletId>,
    selected: Option<&TariWalletDetails>,
) -> Option<&'static str> {
    let Some(selected) = selected else {
        return Some("no_selected_wallet_details");
    };
    if first_wallet != Some(&selected.id) {
        return Some("selected_wallet_is_not_the_first_wallet");
    }
    if selected.tari_address.to_base58() != legacy_address_base58 {
        return Some("address_mismatch");
    }
    None
}

/// Plaintext (CBOR) seed fallback written by pre-keyring versions, see `LegacyCredentialManager`.
pub(crate) const LEGACY_FALLBACK_FILE_NAME: &str = "credentials_backup.bin";
/// Pre-migration wallet config holding the Tari seed enciphered with the passphrase above.
pub(crate) const LEGACY_WALLET_CONFIG_FILE_NAME: &str = "wallet_config.json";

async fn get_legacy_fallback_file(app_config_dir: &Path) -> Result<PathBuf, anyhow::Error> {
    let network = Network::get_current().as_key_str();
    let old_fallback_file = app_config_dir.join(network).join(LEGACY_FALLBACK_FILE_NAME);
    Ok(old_fallback_file)
}

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
