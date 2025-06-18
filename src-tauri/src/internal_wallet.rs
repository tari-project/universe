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
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use tari_common::configuration::Network;
use tari_common_types::tari_address::{TariAddress, TariAddressFeatures};
use tari_common_types::types::CompressedPublicKey;
use tari_crypto::ristretto::RistrettoPublicKey;
use tari_key_manager::cipher_seed::CipherSeed;
use tari_key_manager::key_manager::KeyManager;
use tari_key_manager::key_manager_service::KeyDigest;
use tari_utilities::encoding::MBase58;
use tari_utilities::message_format::MessageFormat;
use tari_utilities::SafePassword;
use tauri::Manager;
use tokio::fs;

use tari_core::transactions::transaction_key_manager::{
    create_memory_db_key_manager_from_seed, SecretTransactionKeyManagerInterface,
    TransactionKeyManagerInterface,
};
use tari_utilities::hex::Hex;

use crate::configs::config_wallet::ConfigWallet;
use crate::configs::trait_config::ConfigImpl;
use crate::credential_manager::{Credential, CredentialManager, LegacyCredentialManager};
use crate::utils::rand_utils;

const KEY_MANAGER_COMMS_SECRET_KEY_BRANCH_KEY: &str = "comms";
const LOG_TARGET: &str = "tari::universe::internal_wallet";
const DEFAULT_PIN: &str = "123456";

// maybe remove derive
#[derive(Debug, Clone)]
pub struct InternalWallet {
    pub id: String,
    encrypted_tari_seed: Option<Vec<u8>>,
    encrypted_monero_seed: Option<Vec<u8>>,
    pub tari_address: TariAddress,
    pub tari_wallet_birthday: u16,
    pub tari_view_private_key_hex: String,
    pub tari_spend_public_key_hex: String,
    pub monero_address: String,
}

impl InternalWallet {
    pub async fn initialize(
        // config_path: PathBuf,
        app_handle: &tauri::AppHandle,
    ) -> Result<Self, anyhow::Error> {
        let app_config_dir = app_handle
            .path()
            .app_config_dir()
            .expect("Could not get config dir");

        // 1. Check configs/wallet config if new version(2) already applied
        let wallet_config = ConfigWallet::content().await;
        let current_version = *wallet_config.version();
        if current_version >= 2 {
            log::info!("==== Internal Wallet already migrated to version2");
            let monero_address = ConfigWallet::content().await.monero_address().clone();
            // ALREADY MIGRATED
            return Ok(InternalWallet {
                id: todo!(),
                encrypted_tari_seed: None,
                encrypted_monero_seed: None,
                monero_address: monero_address,
                tari_address: todo!(),
                tari_wallet_birthday: todo!(),
                tari_view_private_key_hex: todo!(),
                tari_spend_public_key_hex: todo!(),
            });
        }

        let (wallet_id, tari_seed) = InternalWallet::migrate(app_config_dir.clone()).await?;
        let tari_cipher_seed =
            CipherSeed::from_binary(&tari_seed).expect("Could not parse to cipher seed");

        // tari_spend_public_key_hex
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

        //tari wallet birthday
        let tari_wallet_birthday = tari_cipher_seed.birthday();

        // tari_view_private_key_hex
        let tx_key_manager = create_memory_db_key_manager_from_seed(tari_cipher_seed, 64)?;
        let view_key = tx_key_manager.get_view_key().await?;
        let view_key_private = tx_key_manager.get_private_key(&view_key.key_id).await?;
        let view_key_public = view_key.pub_key;

        //tari address
        let network = Network::default();
        let tari_address = TariAddress::new_dual_address(
            view_key_public.clone(),
            comms_pub_key.clone(),
            network,
            TariAddressFeatures::create_one_sided_only(),
            None,
        )
        .map_err(|e| anyhow!(e.to_string()))?;

        //monero address
        let monero_address = ConfigWallet::content().await.monero_address().clone();

        Ok(InternalWallet {
            id: wallet_id,
            encrypted_tari_seed: Some(tari_seed),
            encrypted_monero_seed: None,
            tari_address,
            tari_wallet_birthday,
            tari_spend_public_key_hex: comms_pub_key.to_hex(),
            tari_view_private_key_hex: view_key_private.to_hex(),
            monero_address,
        })
    }

    async fn migrate(app_config_dir: PathBuf) -> Result<(String, Vec<u8>), anyhow::Error> {
        let old_wallet_config =
            LegacyInternalWallet::get_old_wallet_config(app_config_dir.clone()).await?;

        // LEGACY WALLET EXISTS -> MIGRATION NEEDED
        let legacy_cm = LegacyCredentialManager::new_default(app_config_dir.clone());
        let legacy_cred = match legacy_cm.get_credentials().await {
            Ok(cred) => cred,
            Err(e) => {
                log::error!(target: LOG_TARGET, "Could not get legacy credentials: {:?}", e);
                return Err(anyhow::anyhow!("Could not get legacycredentials: {:?}", e));
            }
        };

        // Extract Monero Seed
        if *ConfigWallet::content().await.monero_address_is_generated() {
            let monero_seed_binary = legacy_cred
                .monero_seed
                .expect("Couldn't get seed from legacy credentials");

            // use "monero" as wallet_id
            let cm = CredentialManager::new_default("monero".to_string());
            let credentials = Credential {
                seed: monero_seed_binary.into(),
            };
            cm.set_credentials(&credentials).await?;
        }

        // Extract Tari Seed
        let tari_seed_enciphered_bytes =
            Vec::<u8>::from_monero_base58(&old_wallet_config.seed_words_encrypted_base58)
                .map_err(|e| anyhow!(e.to_string()))?;
        let tari_seed = CipherSeed::from_enciphered_bytes(
            &tari_seed_enciphered_bytes,
            legacy_cred.tari_seed_passphrase,
        )
        .expect("Failed to decrypt legacy Tari seed");

        // MIGRATE SEEDS(and encrypt with default pin)
        let wallet_id = rand_utils::get_rand_string(6);
        let cm = CredentialManager::new_default(wallet_id.clone());
        let tari_seed_binary_vec = tari_seed
            .to_binary()
            .expect("Failed to convert tari_seed to binary");
        let tari_seed_binary: Vec<u8> = tari_seed_binary_vec
            .try_into()
            .expect("tari_seed_binary_vec is not 24 bytes");

        let credentials = Credential {
            seed: tari_seed_binary.clone(),
        };
        cm.set_credentials(&credentials).await?;
        // let _unused =
        //     ConfigWallet::update_field(ConfigWalletContent::set_id, Some(wallet_id)).await;

        return Ok((wallet_id, tari_seed_binary));
    }

    pub async fn get_monero_seed(&self) -> Result<MoneroSeed, anyhow::Error> {
        // TODO: Use Zeroize and decrypt seeds with PIN
        let encrypted_monero_seed = self
            .encrypted_monero_seed
            .as_ref()
            .ok_or_else(|| anyhow!("Internal Wallet not initialized yet!"))?;

        let decrypted_monero: [u8; 32] = encrypted_monero_seed
            .as_slice()
            .try_into()
            .map_err(|_| anyhow!("Monero seed is not 32 bytes"))?;

        Ok(MoneroSeed::new(decrypted_monero))
    }
}

pub struct LegacyInternalWallet {
    tari_address: TariAddress,
    config: LegacyWalletConfig,
}

impl LegacyInternalWallet {
    // Migration logic below
    pub fn get_old_wallet_config_file(config_dir: PathBuf) -> PathBuf {
        let network = Network::get_current_or_user_setting_or_default()
            .to_string()
            .to_lowercase();
        config_dir.join(network).join("wallet_config.json")
    }

    pub async fn get_old_wallet_config(
        config_dir: PathBuf,
    ) -> Result<LegacyWalletConfig, anyhow::Error> {
        let old_config_file = LegacyInternalWallet::get_old_wallet_config_file(config_dir);
        let old_config_str = fs::read_to_string(old_config_file).await?;
        let old_config: LegacyWalletConfig = serde_json::from_str(&old_config_str)?;
        Ok(old_config)
    }

    // pub async fn get_encrypted_seed_words_base58(
    //     config_dir: PathBuf,
    // ) -> Result<String, anyhow::Error> {
    //     let old_config = Internal::walget_old_wallet_config
    //     Ok(old_config.seed_words_encrypted_base58)
    // }
}

pub fn generate_password() -> String {
    rand_utils::get_rand_string(32)
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct LegacyWalletConfig {
    tari_address_base58: String,
    view_key_private_hex: String,
    spend_public_key_hex: String,
    seed_words_encrypted_base58: String,
    // TODO: "This is for Universe users < v0.5.x who wouldn't be migrated yet. Once we're confident that all users have been migrated, we can remove this."
    pub(crate) passphrase: Option<SafePassword>,
    config_path: Option<PathBuf>,
}

#[derive(Debug, Serialize, Clone)]
pub struct PaperWalletConfig {
    qr_link: String,
    password: String,
}
