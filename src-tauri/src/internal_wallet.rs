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
use log::{info, warn};
use rand::Rng;
use serde::{Deserialize, Serialize};
use std::fs::create_dir_all;
use std::path::PathBuf;
use std::str::FromStr;
use tari_common::configuration::Network;
use tari_common_types::tari_address::{TariAddress, TariAddressError, TariAddressFeatures};
use tari_common_types::types::CompressedPublicKey;
use tari_crypto::ristretto::RistrettoPublicKey;
use tari_key_manager::cipher_seed::CipherSeed;
use tari_key_manager::key_manager::KeyManager;
use tari_key_manager::key_manager_service::KeyDigest;
use tari_utilities::encoding::MBase58;
use tari_utilities::SafePassword;
use tokio::fs;
use urlencoding::encode;

use tari_core::transactions::transaction_key_manager::{
    create_memory_db_key_manager_from_seed, SecretTransactionKeyManagerInterface,
    TransactionKeyManagerInterface,
};
use tari_key_manager::mnemonic::{Mnemonic, MnemonicLanguage};
use tari_key_manager::mnemonic_wordlists::MNEMONIC_ENGLISH_WORDS;
use tari_key_manager::SeedWords;
use tari_utilities::hex::Hex;

use crate::credential_manager::{Credential, CredentialError, CredentialManager};
use crate::wallet_adapter::WalletBalance;

const KEY_MANAGER_COMMS_SECRET_KEY_BRANCH_KEY: &str = "comms";
const LOG_TARGET: &str = "tari::universe::internal_wallet";

pub struct InternalWallet {
    tari_address: TariAddress,
    config: WalletConfig,
}

impl InternalWallet {
    pub async fn load_or_create(config_path: PathBuf) -> Result<Self, anyhow::Error> {
        let network = Network::get_current_or_user_setting_or_default()
            .to_string()
            .to_lowercase();

        let file = config_path.join(network).join("wallet_config.json");

        let file_parent = file
            .parent()
            .ok_or_else(|| anyhow!("Failed to get parent directory of wallet config file"))?;

        create_dir_all(file_parent).unwrap_or_else(|error| {
            warn!(target: LOG_TARGET, "Could not create wallet config file parent directory - {}", error);
        });
        if file.exists() {
            info!(target: LOG_TARGET, "Loading wallet from file: {:?}", file);
            let config = fs::read_to_string(&file).await?;
            match serde_json::from_str::<WalletConfig>(&config) {
                Ok(mut config) => {
                    config.config_path = Some(file_parent.to_path_buf());

                    let cm = CredentialManager::default_with_dir(config_path.clone());
                    if let Err(e) = cm.migrate(&config).await {
                        warn!(target: LOG_TARGET, "Failed to migrate wallet credentials: {}", e.to_string());
                    }

                    return Ok(Self {
                        tari_address: TariAddress::from_base58(&config.tari_address_base58)?,
                        config,
                    });
                }
                Err(e) => {
                    warn!(target: LOG_TARGET, "Failed to parse wallet config: {}", e.to_string());
                }
            }
        }
        info!(target: LOG_TARGET, "Wallet config does not exist or is corrupt. Creating new wallet");
        let (wallet, config) = InternalWallet::create_new_wallet(None, config_path).await?;
        let config = serde_json::to_string(&config)?;
        fs::write(file, config).await?;
        Ok(wallet)
    }

    pub async fn create_from_seed(
        config_path: PathBuf,
        seed_words: Vec<String>,
    ) -> Result<Self, anyhow::Error> {
        let network = Network::get_current_or_user_setting_or_default()
            .to_string()
            .to_lowercase();
        let file = config_path.join(network).join("wallet_config.json");
        let file_parent = file
            .parent()
            .ok_or_else(|| anyhow!("Failed to get parent directory of wallet config file"))?;
        create_dir_all(file_parent).unwrap_or_else(|error| {
            warn!(target: LOG_TARGET, "Could not create wallet config file parent directory - {}", error);
        });

        let (wallet, config) =
            InternalWallet::create_new_wallet(Some(seed_words), config_path).await?;
        let config = serde_json::to_string(&config)?;
        fs::write(file, config).await?;
        Ok(wallet)
    }

    pub fn get_tari_address(&self) -> TariAddress {
        self.tari_address.clone()
    }

    pub async fn get_paper_wallet_details(
        &self,
        anon_id: String,
        wallet_balance: Option<WalletBalance>,
        auth_uuid: Option<String>,
    ) -> Result<PaperWalletConfig, anyhow::Error> {
        let seed = self.get_seed().await?;
        let raw_passphrase = phraze::generate_a_passphrase(5, "-", false, &MNEMONIC_ENGLISH_WORDS);
        let seed_file = seed.encipher(Some(SafePassword::from(&raw_passphrase)))?;
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

        let paper_wallet_details = PaperWalletConfig {
            qr_link: link,
            password: raw_passphrase,
        };

        Ok(paper_wallet_details)
    }

    async fn create_new_wallet(
        seed_words: Option<Vec<String>>,
        path: PathBuf,
    ) -> Result<(Self, WalletConfig), anyhow::Error> {
        let mut config = WalletConfig {
            tari_address_base58: "".to_string(),
            view_key_private_hex: "".to_string(),
            seed_words_encrypted_base58: "".to_string(),
            spend_public_key_hex: "".to_string(),
            config_path: Some(path.to_path_buf()),
            passphrase: None,
        };

        let cm = CredentialManager::default_with_dir(path);
        let passphrase = match cm.get_credentials().await {
            Ok(mut creds) => match creds.tari_seed_passphrase {
                Some(p) => Some(p),
                None => {
                    creds.tari_seed_passphrase = Some(SafePassword::from(generate_password(32)));
                    cm.set_credentials(&creds).await?;
                    creds.tari_seed_passphrase
                }
            },
            Err(CredentialError::NoEntry(_)) => {
                let credentials = Credential {
                    tari_seed_passphrase: Some(SafePassword::from(generate_password(32))),
                    monero_seed: None,
                };
                cm.set_credentials(&credentials).await?;
                credentials.tari_seed_passphrase
            }
            Err(_) => {
                return Err(anyhow!(
                    "Credentials didn't exist, and this shouldn't happen"
                ));
            }
        };

        let seed = match seed_words {
            Some(sw) => {
                let seed_words = SeedWords::from_str(&sw.join(" "))?;
                CipherSeed::from_mnemonic_with_language(
                    &seed_words,
                    MnemonicLanguage::English,
                    None,
                )?
            }
            None => CipherSeed::new(),
        };

        let seed_file = seed.encipher(passphrase)?;
        config.seed_words_encrypted_base58 = seed_file.to_monero_base58();

        let comms_key_manager = KeyManager::<RistrettoPublicKey, KeyDigest>::from(
            seed.clone(),
            KEY_MANAGER_COMMS_SECRET_KEY_BRANCH_KEY.to_string(),
            0,
        );
        let comms_key = comms_key_manager
            .derive_key(0)
            .map_err(|e| anyhow!(e.to_string()))?
            .key;
        let comms_pub_key = CompressedPublicKey::from_secret_key(&comms_key);
        let network = Network::default();

        let tx_key_manager = create_memory_db_key_manager_from_seed(seed.clone(), 64)?;
        let view_key = tx_key_manager.get_view_key().await?;
        let view_key_private = tx_key_manager.get_private_key(&view_key.key_id).await?;
        let view_key_pub = view_key.pub_key;
        let tari_address = TariAddress::new_dual_address(
            view_key_pub.clone(),
            comms_pub_key.clone(),
            network,
            TariAddressFeatures::create_one_sided_only(),
        );

        config.tari_address_base58 = tari_address.to_base58();
        config.view_key_private_hex = view_key_private.to_hex();
        config.spend_public_key_hex = comms_pub_key.to_hex();
        Ok((
            Self {
                tari_address,
                config: config.clone(),
            },
            config,
        ))
    }

    pub async fn decrypt_seed_words(&self) -> Result<SeedWords, anyhow::Error> {
        let seed = self.get_seed().await?;
        let seed_words = seed.to_mnemonic(MnemonicLanguage::English, None)?;
        Ok(seed_words)
    }

    pub fn get_view_key(&self) -> String {
        self.config.view_key_private_hex.clone()
    }
    pub fn get_spend_key(&self) -> String {
        self.config.spend_public_key_hex.clone()
    }

    async fn get_seed(&self) -> Result<CipherSeed, anyhow::Error> {
        let path = match &self.config.config_path {
            Some(p) => p.clone(),
            None => return Err(anyhow!("No config path found")),
        };
        let path_parent = path
            .parent()
            .ok_or_else(|| anyhow!("Failed to get parent directory of wallet config file"))?;
        let passphrase = CredentialManager::default_with_dir(path_parent.to_path_buf())
            .get_credentials()
            .await?
            .tari_seed_passphrase;
        let seed_binary = Vec::<u8>::from_monero_base58(&self.config.seed_words_encrypted_base58)
            .map_err(|e| anyhow!(e.to_string()))?;
        let seed = CipherSeed::from_enciphered_bytes(&seed_binary, passphrase)?;

        Ok(seed)
    }

    pub async fn get_birthday(&self) -> Result<u16, anyhow::Error> {
        let seed = self.get_seed().await?;
        Ok(seed.birthday())
    }

    #[allow(dead_code)]
    pub fn get_network(&self) -> Result<Network, TariAddressError> {
        let address = TariAddress::from_base58(&self.config.tari_address_base58);
        address.map(|a| a.network())
    }

    pub async fn clear_wallet_local_data(cache_path: PathBuf) -> Result<(), anyhow::Error> {
        let network = Network::get_current_or_user_setting_or_default()
            .to_string()
            .to_lowercase();
        let wallet_dir = cache_path.join("wallet").join(network);
        fs::remove_dir_all(wallet_dir).await?;
        Ok(())
    }
}

pub fn generate_password(length: usize) -> String {
    let charset: Vec<char> =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&"
            .chars()
            .collect();

    let mut rng = rand::thread_rng();
    let password: String = (0..length)
        .map(|_| {
            let idx = rng.gen_range(0..charset.len());
            charset[idx]
        })
        .collect();

    password
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct WalletConfig {
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
