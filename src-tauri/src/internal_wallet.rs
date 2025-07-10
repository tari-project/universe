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
use monero_address_creator::network::Mainnet;
use monero_address_creator::Seed as MoneroSeed;
use serde::{Deserialize, Serialize};
use std::fs::OpenOptions;
use std::io::Read;
use std::path::{Path, PathBuf};
use tari_common::configuration::Network;
use tari_common_types::tari_address::{TariAddress, TariAddressFeatures};
use tari_common_types::types::CompressedPublicKey;
use tari_crypto::ristretto::RistrettoPublicKey;
use tari_key_manager::cipher_seed::CipherSeed;
use tari_key_manager::key_manager::KeyManager;
use tari_key_manager::key_manager_service::KeyDigest;
use tari_key_manager::mnemonic::Mnemonic;
use tari_key_manager::SeedWords;
use tari_utilities::encoding::MBase58;
use tari_utilities::message_format::MessageFormat;
use tari_utilities::{Hidden, SafePassword};
use tauri::async_runtime::block_on;
use tauri::{AppHandle, Listener, Manager};
use tokio::fs;
use tokio::sync::{oneshot, OnceCell, RwLock};

use tari_core::transactions::transaction_key_manager::{
    create_memory_db_key_manager_from_seed, SecretTransactionKeyManagerInterface,
    TransactionKeyManagerInterface,
};
use tari_utilities::hex::Hex;

use crate::configs::config_ui::ConfigUI;
use crate::configs::config_wallet::{ConfigWallet, ConfigWalletContent, WALLET_VERSION};
use crate::configs::trait_config::ConfigImpl;
use crate::consts::DEFAULT_MONERO_ADDRESS;
use crate::credential_manager::{
    Credential, CredentialError, CredentialManager, LegacyCredential, LegacyCredentialManager,
};
use crate::events::CriticalProblemPayload;
use crate::events_emitter::EventsEmitter;
use crate::pin::PinManager;
use crate::utils::{cryptography, rand_utils};
use crate::UniverseAppState;

const KEY_MANAGER_COMMS_SECRET_KEY_BRANCH_KEY: &str = "comms";
const LOG_TARGET: &str = "tari::universe::internal_wallet";

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TariWalletDetails {
    pub id: String,
    pub tari_address: TariAddress,
    pub wallet_birthday: u16,
    pub view_private_key_hex: String,
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

    pub async fn initialize_seedless(
        app_handle: &tauri::AppHandle,
        new_external_tari_address: Option<TariAddress>,
    ) -> Result<(), anyhow::Error> {
        if let Some(external_tari_address) = new_external_tari_address {
            ConfigWallet::update_field(
                ConfigWalletContent::set_selected_external_tari_address,
                Some(external_tari_address.clone()),
            )
            .await?;
            ConfigWallet::update_field(
                ConfigWalletContent::update_external_tari_address_book,
                external_tari_address,
            )
            .await?;
            ConfigWallet::update_field(ConfigWalletContent::set_tari_wallet_details, None).await?;
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

    pub async fn initialize_with_seed(app_handle: &tauri::AppHandle) -> Result<(), anyhow::Error> {
        ConfigWallet::update_field(
            ConfigWalletContent::set_selected_external_tari_address,
            None,
        )
        .await?;
        let wallet_config = ConfigWallet::content().await;
        let internal_wallet = if *wallet_config.version() >= WALLET_VERSION
            && !wallet_config.tari_wallets().is_empty()
        {
            // Load latest version of wallet, no action required
            InternalWallet::load_latest_version(app_handle, wallet_config).await?
        } else {
            let monero_address = wallet_config.monero_address().clone();
            let app_config_dir = app_handle
                .path()
                .app_config_dir()
                .expect("Couldn't get application config directory!");

            let old_wallet_config = get_old_wallet_config(&app_config_dir).await.ok();
            if let Some(old_wallet_config) = old_wallet_config {
                // Migrate old wallet config
                let (wallet_id, tari_seed_binary, monero_seed_binary) =
                    InternalWallet::migrate(app_handle, &app_config_dir, old_wallet_config).await?;
                let tari_wallet_details = InternalWallet::get_tari_wallet_details(
                    wallet_id,
                    CipherSeed::from_binary(&tari_seed_binary)
                        .expect("Could not convert Tari Seed to binary"),
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
                // Create new wallet
                let tari_seed = CipherSeed::new();
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
                    wallet_details.view_private_key_hex.clone(),
                    wallet_details.spend_public_key_hex.clone(),
                )
                .await;
        } else {
            // External(Seedless)
        }

        let mut cpu_config = state.cpu_miner_config.write().await;
        cpu_config.load_from_config_wallet(&ConfigWallet::content().await);

        ConfigUI::handle_wallet_type_update(self.tari_address_type.clone()).await?;
        EventsEmitter::emit_selected_tari_address_changed(
            self.extract_tari_address(),
            self.tari_address_type.clone(),
        )
        .await;

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
    ) -> Result<(String, Vec<u8>), anyhow::Error> {
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

        let encrypted_seed = if PinManager::pin_locked().await {
            let pin_password = match pin_password_provided {
                Some(p) => p,
                None => PinManager::get_validated_pin(app_handle).await?,
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

        InternalWallet::set_credentials(app_handle, wallet_id.clone(), &credentials, true).await?;

        // We always load the first index
        let new_tari_wallets = vec![wallet_id.clone()];

        ConfigWallet::update_field(ConfigWalletContent::set_tari_wallets, new_tari_wallets).await?;

        let wallet_details = InternalWallet::get_tari_wallet_details(wallet_id, tari_seed).await?;

        ConfigWallet::update_field(
            ConfigWalletContent::set_tari_wallet_details,
            Some(wallet_details.clone()),
        )
        .await?;

        // Deselect the external Tari address because a new address is now selected by default
        ConfigWallet::update_field(
            ConfigWalletContent::set_selected_external_tari_address,
            None,
        )
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

    async fn add_monero_wallet(monero_seed: MoneroSeed) -> Result<Vec<u8>, anyhow::Error> {
        let cm = CredentialManager::new_default("monero".to_string());
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
                "monero".to_string(),
                &Credential {
                    encrypted_seed: encrypted_monero_seed.clone(),
                },
                false,
            )
            .await?;
            let monero_address = monero_seed
                .to_address::<Mainnet>()
                .unwrap_or(DEFAULT_MONERO_ADDRESS.to_string());
            log::info!(target: LOG_TARGET, "New Monero Address generated when recover_forgotten_pin: {monero_address}");
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
                .await
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

        if InternalWallet::is_initialized() {
            let mut internal_wallet_guard = InternalWallet::current().write().await;
            internal_wallet_guard.encrypted_monero_seed = Hidden::hide(encrypted_monero_seed);
            internal_wallet_guard.encrypted_tari_seed =
                Hidden::hide(Some(encrypted_tari_seed.clone()));
        }

        Ok(())
    }

    pub async fn create_pin(app_handle: &AppHandle) -> Result<(), anyhow::Error> {
        let pin_password = PinManager::create_pin(app_handle).await?;

        let encrypted_monero_seed = {
            // Encrypt Monero Seed with PIN
            let monero_seed = InternalWallet::get_monero_seed(None).await?;
            let encrypted_monero_seed = cryptography::encrypt(monero_seed.inner(), &pin_password)?;
            InternalWallet::set_credentials(
                app_handle,
                "monero".to_string(),
                &Credential {
                    encrypted_seed: encrypted_monero_seed.clone(),
                },
                false,
            )
            .await?;
            if InternalWallet::is_initialized() {
                let mut internal_wallet_guard = InternalWallet::current().write().await;
                internal_wallet_guard.encrypted_monero_seed =
                    Hidden::hide(Some(encrypted_monero_seed.clone()));
            }
            encrypted_monero_seed
        };
        let encrypted_tari_seed = {
            // Encrypt Tari Seed with PIN
            let tari_seed = InternalWallet::get_tari_seed(None).await?;
            let wallet_id = InternalWallet::tari_wallet_details()
                .await
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

        if InternalWallet::is_initialized() {
            let mut internal_wallet_guard = InternalWallet::current().write().await;
            internal_wallet_guard.encrypted_monero_seed =
                Hidden::hide(Some(encrypted_monero_seed.clone()));
            internal_wallet_guard.encrypted_tari_seed =
                Hidden::hide(Some(encrypted_tari_seed.clone()));
        }

        Ok(())
    }

    async fn get_credentials(
        app_handle: &AppHandle,
        entry_id: String,
        forced: bool,
    ) -> Result<Credential, anyhow::Error> {
        let cm = CredentialManager::new_default(entry_id);
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
        entry_id: String,
        credential: &Credential,
        forced: bool,
    ) -> Result<(), anyhow::Error> {
        let cm = CredentialManager::new_default(entry_id);
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
        log::info!(target: LOG_TARGET, "Internal Wallet latest version detected.");
        let monero_address = wallet_config.monero_address().clone();
        if monero_address.is_empty() {
            panic!(
                "Unexpected! Monero address should be accessible for v{:?}",
                *wallet_config.version()
            );
        }
        if (*wallet_config.tari_wallets()).is_empty() {
            panic!(
                "Unexpected! Tari wallets field should be defined in the config for v{:?}",
                *wallet_config.version()
            );
        }

        let (encrypted_tari_seed, tari_wallet_details) = {
            if let Some(wallet_details) = ConfigWallet::content().await.tari_wallet_details() {
                log::info!(target: LOG_TARGET, "Extracted(wallet config file) Tari Wallet Details: {wallet_details:?}");
                (None, wallet_details.clone())
            } else {
                // If wallet details are not saved in the config file, extract them from the decrypted seed.
                let tari_wallet_id = (*wallet_config.tari_wallets())
                    .first()
                    .expect("Unexpected! Selected wallet not found in the wallet config!");
                let encrypted_tari_seed =
                    match InternalWallet::get_credentials(app_handle, tari_wallet_id.clone(), true)
                        .await
                    {
                        Ok(cred) => cred.encrypted_seed,
                        Err(e) => {
                            panic!("Failed to get credentials: {e}")
                        }
                    };
                let tari_cipher_seed = if PinManager::pin_locked().await {
                    let pin_password = PinManager::get_validated_pin(app_handle).await?;
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
                        .expect("Could not parse Tari Seed from binary")
                };
                let wallet_details = InternalWallet::get_tari_wallet_details(
                    tari_wallet_id.clone(),
                    tari_cipher_seed,
                )
                .await?;
                log::info!(target: LOG_TARGET, "Extracted(seed from credentials) Tari Wallet Details: {wallet_details:?}");
                (Some(encrypted_tari_seed), wallet_details)
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
    ) -> Result<(String, Vec<u8>, Option<Vec<u8>>), anyhow::Error> {
        let legacy_cred: LegacyCredential = if *ConfigWallet::content().await.keyring_accessed() {
            let cred =
                InternalWallet::get_legacy_credentials_forced(app_handle, app_config_dir).await?;
            cred
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
            InternalWallet::set_credentials(app_handle, "monero".to_string(), &credentials, true)
                .await?;
        } else {
            log::info!(target: LOG_TARGET, "Monero Seed not found for migration");
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

    pub async fn get_tari_wallet_details(
        wallet_id: String,
        tari_cipher_seed: CipherSeed,
    ) -> Result<TariWalletDetails, anyhow::Error> {
        let wallet_birthday = tari_cipher_seed.birthday();

        let comms_key_manager = KeyManager::<RistrettoPublicKey, KeyDigest>::from(
            tari_cipher_seed.clone(),
            KEY_MANAGER_COMMS_SECRET_KEY_BRANCH_KEY.to_string(),
            0,
        );
        let comms_key = comms_key_manager
            .derive_key(0)
            .map_err(|e| anyhow!(e.to_string()))?
            .key;
        let comms_pub_key = CompressedPublicKey::from_secret_key(&comms_key);
        let tx_key_manager = create_memory_db_key_manager_from_seed(tari_cipher_seed, 64)?;
        let view_key = tx_key_manager.get_view_key().await?;
        let view_key_private = tx_key_manager.get_private_key(&view_key.key_id).await?;
        let view_key_public = view_key.pub_key;

        let network = Network::default();
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
            view_private_key_hex: view_key_private.to_hex(),
        })
    }

    pub async fn get_tari_seed(
        pin_password: Option<SafePassword>,
    ) -> Result<CipherSeed, anyhow::Error> {
        let encrypted_tari_seed = {
            let internal_wallet = InternalWallet::current().read().await;
            // Try to get from state first
            if let Some(encrypted_tari_seed) = internal_wallet.encrypted_tari_seed.reveal() {
                encrypted_tari_seed.clone()
            }
            // Try to get from credentials
            else {
                let wallets = ConfigWallet::content().await.tari_wallets().clone();
                if let Some(wallet_id) = wallets.first() {
                    CredentialManager::new_default(wallet_id.clone())
                        .get_credentials()
                        .await
                        .map(|cred| cred.encrypted_seed)
                        .map_err(|e| {
                            // Only display once
                            block_on(EventsEmitter::emit_show_keyring_dialog());
                            anyhow!("Failed to get tari seed from keyring: {e}")
                        })?
                } else {
                    drop(internal_wallet); // Release lock before await
                    handle_critical_problem("Can't access seed", "[get_tari_seed]", None).await;
                    return Err(anyhow!("Can't access Tari seed"));
                }
            }
        };

        // Update store if not yet set to store
        let internal_wallet_guard = InternalWallet::current().read().await;
        if internal_wallet_guard.encrypted_tari_seed.reveal().is_none() {
            drop(internal_wallet_guard);
            let mut internal_wallet_guard = InternalWallet::current().write().await;
            internal_wallet_guard.encrypted_tari_seed =
                Hidden::hide(Some(encrypted_tari_seed.clone()));
        }

        if let Some(pin_password) = pin_password {
            match CipherSeed::from_enciphered_bytes(&encrypted_tari_seed, Some(pin_password)) {
                Ok(seed) => {
                    {
                        // Temporary block for testing crucial part
                        // Remove before rolling out
                        // Maybe log to sentry
                        log::info!(target: LOG_TARGET, "[get_tari_seed] Comparing extracted Tari wallet details for debugging.");
                        compare_extracted_tari_wallet_details(&seed).await;
                    }
                    Ok(seed)
                }
                Err(_) => Err(anyhow!("Wrong PIN entered!")),
            }
        } else {
            // Seed not yet encrypted with PIN
            CipherSeed::from_binary(&encrypted_tari_seed).map_err(|_| {
                log::error!(target: LOG_TARGET, "[get_tari_seed] Could not parse Tari Seed from binary.");
                anyhow!("Could not parse Tari Seed from binary")
            })
        }
    }

    pub async fn get_monero_seed(
        pin_password: Option<SafePassword>,
    ) -> Result<MoneroSeed, anyhow::Error> {
        if !*ConfigWallet::content().await.monero_address_is_generated() {
            return Err(anyhow!(
                "Can't retrieve seed words from an imported monero address!"
            ));
        }

        // Try to get the encrypted Monero seed from memory first, otherwise fallback to credentials manager.
        let encrypted_monero_seed = {
            let internal_wallet = InternalWallet::current().read().await;
            if let Some(monero_seed) = internal_wallet.encrypted_monero_seed.reveal() {
                monero_seed.clone()
            } else {
                drop(internal_wallet); // Release lock before await
                match CredentialManager::new_default("monero".to_string())
                    .get_credentials()
                    .await
                {
                    Ok(cred) => cred.encrypted_seed,
                    Err(e) => {
                        // Only display the dialog once
                        EventsEmitter::emit_show_keyring_dialog().await;
                        return Err(anyhow!("Failed to get monero seed from keyring: {e}"));
                    }
                }
            }
        };

        // Update store if not yet set
        let internal_wallet_guard = InternalWallet::current().read().await;
        if internal_wallet_guard
            .encrypted_monero_seed
            .reveal()
            .is_none()
        {
            drop(internal_wallet_guard);
            let mut internal_wallet_guard = InternalWallet::current().write().await;
            internal_wallet_guard.encrypted_monero_seed =
                Hidden::hide(Some(encrypted_monero_seed.clone()));
        }

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
    let state_wallet_details = InternalWallet::tari_wallet_details().await;
    log::error!(
        target: LOG_TARGET,
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
    app_handle: &AppHandle,
    mut operation: F,
    log_msg: &'static str,
) -> Result<T, anyhow::Error>
where
    F: FnMut() -> Fut,
    Fut: std::future::Future<Output = Result<T, CredentialError>>,
{
    loop {
        match operation().await {
            Ok(result) => return Ok(result),
            Err(CredentialError::Keyring(_)) => {
                EventsEmitter::emit_show_keyring_dialog().await;
                let (tx, rx) = oneshot::channel();
                app_handle.once("keyring-dialog-response", |_event| {
                    let _unused = tx.send(true);
                });
                let _unused = rx.await.unwrap_or_default();
                // Loop will retry
            }
            Err(err) => {
                log::error!(target: LOG_TARGET, "{log_msg}: {err}");
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

// temporary for catching errors
async fn compare_extracted_tari_wallet_details(seed: &CipherSeed) {
    match InternalWallet::get_tari_wallet_details("42069".to_string(), seed.clone()).await {
        Ok(extracted_wallet_detals) => {
            if InternalWallet::tari_address().await != extracted_wallet_detals.tari_address {
                let _unused = handle_critical_problem(
                    "Tari address mismatch",
                    "[get_tari_seed]",
                    Some(&extracted_wallet_detals),
                )
                .await;
            }
        }
        Err(e) => {
            let _unused =
                handle_critical_problem("Could not extract wallet details", &e.to_string(), None)
                    .await;
        }
    }
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
pub async fn get_old_wallet_config(config_dir: &Path) -> Result<LegacyWalletConfig, anyhow::Error> {
    let network = Network::get_current_or_user_setting_or_default()
        .to_string()
        .to_lowercase();
    let old_config_file = config_dir.join(network).join("wallet_config.json");
    let old_config_str = fs::read_to_string(old_config_file).await?;
    let old_config: LegacyWalletConfig = serde_json::from_str(&old_config_str)?;
    Ok(old_config)
}

async fn get_legacy_fallback_file(app_config_dir: &Path) -> Result<PathBuf, anyhow::Error> {
    const FALLBACK_FILE_PATH: &str = "credentials_backup.bin";
    let network = Network::get_current().as_key_str();
    let old_fallback_file = app_config_dir.join(network).join(FALLBACK_FILE_PATH);
    Ok(old_fallback_file)
}
