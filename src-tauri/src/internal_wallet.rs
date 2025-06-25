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
use std::path::PathBuf;
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
use tari_utilities::Hidden;
use tauri::{AppHandle, Listener, Manager};
use tokio::fs;
use tokio::sync::{OnceCell, RwLock};

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
use crate::events_emitter::EventsEmitter;
use crate::utils::rand_utils;

const KEY_MANAGER_COMMS_SECRET_KEY_BRANCH_KEY: &str = "comms";
const LOG_TARGET: &str = "tari::universe::internal_wallet";

#[derive(Debug, Clone)]
pub struct TariWalletDetails {
    pub id: String,
    pub wallet_birthday: u16,
    pub view_private_key_hex: String,
    pub spend_public_key_hex: String,
}

#[derive(Debug, Clone)]
pub struct InternalWallet {
    encrypted_tari_seed: Option<Vec<u8>>,
    encrypted_monero_seed: Option<Vec<u8>>,
    pub monero_address: String,
    pub tari_address: TariAddress,
    // Available only for an owned(with seed) wallet
    pub tari_wallet_details: Option<TariWalletDetails>,
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
        new_external_tari_address: Option<TariAddress>,
    ) -> Result<Self, anyhow::Error> {
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
        }

        let wallet_config = ConfigWallet::content().await;
        let external_tari_wallet_address = wallet_config.selected_external_tari_address().clone();

        let monero_address = wallet_config.monero_address().clone();
        let mut monero_seed_binary = None;
        if monero_address.is_empty() {
            let monero_seed = MoneroSeed::generate()?;
            monero_seed_binary = Some(InternalWallet::add_monero_wallet(monero_seed).await?);
        };

        let internal_wallet = InternalWallet {
            tari_address: external_tari_wallet_address
                .expect("External Tari Address not defined when Initializing InternalWallet"),
            monero_address,
            encrypted_monero_seed: monero_seed_binary,
            encrypted_tari_seed: None,
            tari_wallet_details: None,
        };

        EventsEmitter::emit_selected_tari_address_changed(
            &internal_wallet.tari_address,
            TariAddressType::External,
        )
        .await;
        ConfigUI::handle_wallet_type_update(TariAddressType::External).await?;
        InternalWallet::set_current(internal_wallet.clone()).await?;
        Ok(internal_wallet)
    }

    pub async fn initialize_with_seed(
        app_handle: &tauri::AppHandle,
    ) -> Result<Self, anyhow::Error> {
        let mut wallet_config = ConfigWallet::content().await;
        if wallet_config.selected_external_tari_address().is_some() {
            // Unselect external tari address if defined
            wallet_config.set_selected_external_tari_address(None);
        }

        let internal_wallet = if *wallet_config.version() >= WALLET_VERSION
            && wallet_config.tari_wallets().len() > 0
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
                let (tari_address, tari_wallet_details) =
                    InternalWallet::get_tari_wallet_details(wallet_id, &tari_seed_binary).await?;

                InternalWallet {
                    encrypted_tari_seed: Some(tari_seed_binary),
                    encrypted_monero_seed: monero_seed_binary,
                    monero_address,
                    tari_address,
                    tari_wallet_details: Some(tari_wallet_details),
                }
            } else {
                // Create new wallet
                let tari_seed = CipherSeed::new();
                let (tari_address, tari_wallet_details, tari_seed_binary) =
                    InternalWallet::add_tari_wallet(app_handle, tari_seed).await?;

                let mut monero_seed_binary = None;
                if monero_address.is_empty() {
                    let monero_seed = MoneroSeed::generate()?;
                    monero_seed_binary =
                        Some(InternalWallet::add_monero_wallet(monero_seed).await?);
                };

                InternalWallet {
                    encrypted_tari_seed: Some(tari_seed_binary),
                    encrypted_monero_seed: monero_seed_binary,
                    monero_address,
                    tari_address,
                    tari_wallet_details: Some(tari_wallet_details),
                }
            }
        };

        EventsEmitter::emit_selected_tari_address_changed(
            &internal_wallet.tari_address,
            TariAddressType::Internal,
        )
        .await;
        ConfigUI::handle_wallet_type_update(TariAddressType::Internal).await?;
        InternalWallet::set_current(internal_wallet.clone()).await?;
        Ok(internal_wallet)
    }

    pub async fn import_tari_seed_words(
        &self,
        seed_words: Vec<String>,
        app_handle: &AppHandle,
    ) -> Result<(String, Vec<u8>), anyhow::Error> {
        let tari_cipher_seed = get_tari_cipher_seed(seed_words).await?;
        let (_tari_address, tari_wallet_details, tari_seed_binary) =
            InternalWallet::add_tari_wallet(app_handle, tari_cipher_seed).await?;

        let local_data_dir: PathBuf = app_handle
            .path()
            .app_local_data_dir()
            .expect("Could not get data dir");
        clear_wallet_data(&local_data_dir).await?;
        InternalWallet::initialize_with_seed(&app_handle).await?;

        Ok((tari_wallet_details.id, tari_seed_binary))
    }

    async fn add_tari_wallet(
        app_handle: &AppHandle,
        tari_seed: CipherSeed,
    ) -> Result<(TariAddress, TariWalletDetails, Vec<u8>), anyhow::Error> {
        let wallet_id = rand_utils::get_rand_string(6);

        let tari_seed_binary = tari_seed
            .to_binary()
            .expect("Failed to convert tari seed to binary");
        let credentials = Credential {
            seed: tari_seed_binary.clone(),
        };
        InternalWallet::set_credentials_forced(app_handle, wallet_id.clone(), &credentials).await?;

        let wallet_config = ConfigWallet::content().await;
        // Currently, we always use the first index
        let mut new_tari_wallets = vec![wallet_id.clone()];
        new_tari_wallets.extend_from_slice(wallet_config.tari_wallets());
        ConfigWallet::update_field(ConfigWalletContent::set_tari_wallets, new_tari_wallets).await?;
        let (tari_address, wallet_details) =
            InternalWallet::get_tari_wallet_details(wallet_id, &tari_seed_binary).await?;
        if INSTANCE.get().is_some() {
            let mut internal_wallet_guard = InternalWallet::current().write().await;
            internal_wallet_guard.tari_address = tari_address.clone();
            internal_wallet_guard.tari_wallet_details = Some(wallet_details.clone());
            internal_wallet_guard.encrypted_tari_seed = Some(tari_seed_binary.clone());
        }
        Ok((tari_address, wallet_details, tari_seed_binary))
    }

    async fn add_monero_wallet(monero_seed: MoneroSeed) -> Result<Vec<u8>, anyhow::Error> {
        let cm = CredentialManager::new_default("monero".to_string());
        let monero_seed_binary = (*monero_seed.inner())
            .to_binary()
            .expect("Failed to convert monero seed to binary");

        let credentials = Credential {
            seed: monero_seed_binary.clone(),
        };
        cm.set_credentials(&credentials).await?;

        let monero_address = monero_seed
            .to_address::<Mainnet>()
            // What should we do here?
            .unwrap_or(DEFAULT_MONERO_ADDRESS.to_string());
        ConfigWallet::update_field(
            ConfigWalletContent::set_generated_monero_address,
            monero_address,
        )
        .await?;

        Ok(monero_seed_binary)
    }

    async fn get_credentials_forced(
        app_handle: &AppHandle,
        entry_id: String,
    ) -> Result<Credential, anyhow::Error> {
        let cm = CredentialManager::new_default(entry_id);
        let seed = retry_with_keyring_dialog(
            app_handle,
            || cm.get_credentials(),
            "Failed to get credentials",
        )
        .await?
        .seed;
        Ok(Credential { seed })
    }

    async fn set_credentials_forced(
        app_handle: &AppHandle,
        entry_id: String,
        credential: &Credential,
    ) -> Result<(), anyhow::Error> {
        let cm = CredentialManager::new_default(entry_id);
        retry_with_keyring_dialog(
            app_handle,
            || cm.set_credentials(credential),
            "Failed to set credentials",
        )
        .await?;
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

        if (*wallet_config.tari_wallets()).len() <= 0 {
            panic!(
                "Unexpected! Tari wallets field should be defined in the config for v{:?}",
                *wallet_config.version()
            );
        }

        let tari_wallet_id = (*wallet_config.tari_wallets())
            .first()
            .expect("Unexpected! Selected wallet not found in the wallet config!");
        let tari_seed_binary = match InternalWallet::get_credentials_forced(
            app_handle,
            tari_wallet_id.clone(),
        )
        .await
        {
            Ok(cred) => cred.seed,
            Err(e) => panic!("Failed to get credentials: {}", e),
        };

        let (tari_address, tari_wallet_details) =
            InternalWallet::get_tari_wallet_details(tari_wallet_id.clone(), &tari_seed_binary)
                .await?;

        return Ok(InternalWallet {
            encrypted_tari_seed: Some(tari_seed_binary),
            encrypted_monero_seed: None, // prompt on demand
            monero_address,
            tari_address,
            tari_wallet_details: Some(tari_wallet_details),
        });
    }

    async fn get_legacy_credentials_forced(
        app_handle: &AppHandle,
        app_config_dir: &PathBuf,
    ) -> Result<LegacyCredential, anyhow::Error> {
        let legacy_cm = LegacyCredentialManager::new_default(app_config_dir.clone());
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
        app_config_dir: &PathBuf,
        old_wallet_config: LegacyWalletConfig,
    ) -> Result<(String, Vec<u8>, Option<Vec<u8>>), anyhow::Error> {
        let legacy_cred =
            InternalWallet::get_legacy_credentials_forced(app_handle, app_config_dir).await?;
        println!("====== LEGACY CRED: {:?}", legacy_cred);
        // Migrate Monero Seed if was generated
        let monero_seed_binary = legacy_cred.monero_seed.map(|seed| seed.to_vec());
        if *ConfigWallet::content().await.monero_address_is_generated() {
            let credentials = Credential {
                seed: monero_seed_binary
                    .as_ref()
                    .expect("Monero seed generated, but not stored in keychain")
                    .clone(),
            };
            InternalWallet::set_credentials_forced(app_handle, "monero".to_string(), &credentials)
                .await?;
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
        let (_tari_address, tari_wallet_details, tari_seed_binary) =
            InternalWallet::add_tari_wallet(app_handle, tari_seed).await?;

        Ok((tari_wallet_details.id, tari_seed_binary, monero_seed_binary))
    }

    async fn get_tari_wallet_details(
        wallet_id: String,
        tari_seed_binary: &Vec<u8>,
    ) -> Result<(TariAddress, TariWalletDetails), anyhow::Error> {
        let tari_cipher_seed =
            CipherSeed::from_binary(tari_seed_binary).expect("Could not parse to cipher seed");

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

        Ok((
            tari_address,
            TariWalletDetails {
                id: wallet_id,
                wallet_birthday,
                spend_public_key_hex: comms_pub_key.to_hex(),
                view_private_key_hex: view_key_private.to_hex(),
            },
        ))
    }

    pub async fn get_tari_seed(&self) -> Result<CipherSeed, anyhow::Error> {
        // TODO: Use Zeroize and decrypt seeds with PIN
        let encrypted_tari_seed = self
            .encrypted_tari_seed
            .as_ref()
            .ok_or_else(|| anyhow!("Internal Wallet not initialized yet!"))?;
        let decrypted_tari_seed: &[u8] = encrypted_tari_seed.as_slice();
        let cipher_seed =
            CipherSeed::from_binary(decrypted_tari_seed).map_err(|err| anyhow!(err.to_string()))?;

        Ok(cipher_seed)
    }

    pub async fn get_monero_seed(&self) -> Result<MoneroSeed, anyhow::Error> {
        let encrypted_monero_seed = if let Some(monero_seed) = &self.encrypted_monero_seed {
            monero_seed.clone()
        } else {
            let credential = match CredentialManager::new_default("monero".to_string())
                .get_credentials()
                .await
            {
                Ok(cred) => cred,
                Err(e) => {
                    // We display only once
                    EventsEmitter::emit_show_keyring_dialog().await;
                    return Err(anyhow!("Failed to get monero seed from keyring: {e}"));
                }
            };
            credential.seed
        };

        let decrypted_monero_seed: [u8; 32] = encrypted_monero_seed
            .as_slice()
            .try_into()
            .map_err(|_| anyhow!("Monero seed is not 32 bytes"))?;

        Ok(MoneroSeed::new(decrypted_monero_seed))
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
                use tokio::sync::oneshot;
                let (tx, rx) = oneshot::channel();
                app_handle.once("keyring-dialog-response", |_event| {
                    let _ = tx.send(true);
                });
                let _ = rx.await.unwrap_or_default();
                // Loop will retry
            }
            Err(err) => {
                log::error!(target: LOG_TARGET, "{}: {}", log_msg, err);
                return Err(err.into());
            }
        }
    }
}

pub async fn clear_wallet_data(local_dir_path: &PathBuf) -> Result<(), anyhow::Error> {
    let network = Network::get_current_or_user_setting_or_default()
        .to_string()
        .to_lowercase();
    let wallet_dir = local_dir_path.join("wallet").join(network);
    fs::remove_dir_all(wallet_dir).await?;
    Ok(())
}

pub async fn get_tari_cipher_seed(seed_words: Vec<String>) -> Result<CipherSeed, anyhow::Error> {
    let hidden_seed_words = seed_words.into_iter().map(Hidden::hide).collect::<Vec<_>>();
    let seed_words_parsed = SeedWords::new(hidden_seed_words);
    // TODO: use pin to encrypt seed words
    CipherSeed::from_mnemonic(&seed_words_parsed, None).map_err(|e| anyhow::anyhow!(e.to_string()))
}

#[derive(Debug, Serialize, Clone)]
pub struct PaperWalletConfig {
    pub qr_link: String,
    pub password: String,
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
pub async fn get_old_wallet_config(
    config_dir: &PathBuf,
) -> Result<LegacyWalletConfig, anyhow::Error> {
    let network = Network::get_current_or_user_setting_or_default()
        .to_string()
        .to_lowercase();
    let old_config_file = config_dir.join(network).join("wallet_config.json");
    let old_config_str = fs::read_to_string(old_config_file).await?;
    let old_config: LegacyWalletConfig = serde_json::from_str(&old_config_str)?;
    Ok(old_config)
}
