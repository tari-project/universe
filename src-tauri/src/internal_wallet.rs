use anyhow::anyhow;
use keyring::{Entry, Error as KeyringError};
use log::{info, warn};
use rand::Rng;
use serde::{Deserialize, Serialize};
use std::fs::create_dir_all;
use std::path::PathBuf;
use tari_common::configuration::Network;
use tari_common_types::tari_address::{TariAddress, TariAddressError, TariAddressFeatures};
use tari_crypto::keys::PublicKey;
use tari_crypto::ristretto::RistrettoPublicKey;
use tari_key_manager::cipher_seed::CipherSeed;
use tari_key_manager::key_manager::KeyManager;
use tari_key_manager::key_manager_service::KeyDigest;
use tari_utilities::encoding::Base58;
use tari_utilities::SafePassword;
use tokio::fs;

use tari_core::transactions::key_manager::{
    create_memory_db_key_manager_from_seed, SecretTransactionKeyManagerInterface,
    TransactionKeyManagerInterface,
};
use tari_key_manager::mnemonic::{Mnemonic, MnemonicLanguage};
use tari_key_manager::SeedWords;
use tari_utilities::hex::Hex;

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

        create_dir_all(file.parent().unwrap())?;
        if file.exists() {
            info!(target: LOG_TARGET, "Loading wallet from file: {:?}", file);
            let config = fs::read_to_string(&file).await?;
            match serde_json::from_str::<WalletConfig>(&config) {
                Ok(config) => {
                    return Ok(Self {
                        tari_address: TariAddress::from_base58(&config.tari_address_base58)?,
                        config,
                    })
                }
                Err(e) => {
                    warn!(target: LOG_TARGET, "Failed to parse wallet config: {}", e.to_string());
                }
            }
        }
        info!(target: LOG_TARGET, "Wallet config does not exist or is corrupt. Creating new wallet");
        let (wallet, config) = InternalWallet::create_new_wallet().await?;
        let config = serde_json::to_string(&config)?;
        fs::write(file, config).await?;
        Ok(wallet)
    }

    pub fn get_tari_address(&self) -> TariAddress {
        self.tari_address.clone()
    }

    async fn create_new_wallet() -> Result<(Self, WalletConfig), anyhow::Error> {
        let mut config = WalletConfig {
            tari_address_base58: "".to_string(),
            view_key_private_hex: "".to_string(),
            seed_words_encrypted_base58: "".to_string(),
            spend_public_key_hex: "".to_string(),
            passphrase: None,
        };

        let passphrase = match Entry::new("com.tari.universe", "internal_wallet") {
            Ok(entry) => match entry.get_password() {
                Ok(pass) => SafePassword::from(pass),
                Err(_err @ KeyringError::PlatformFailure(_))
                | Err(_err @ KeyringError::NoStorageAccess(_)) => {
                    warn!(target: LOG_TARGET, "Failed to gain access to keyring storage. Storing generated passphrase insecurely");
                    let passphrase = SafePassword::from(generate_password(32));
                    config.passphrase = Some(passphrase.clone());
                    passphrase
                }
                Err(_) => {
                    let passphrase = SafePassword::from(generate_password(32));
                    let _unused = entry.delete_credential();
                    entry.set_password(&String::from_utf8(passphrase.reveal().clone())?)?;
                    passphrase
                }
            },
            Err(_err @ KeyringError::PlatformFailure(_))
            | Err(_err @ KeyringError::NoStorageAccess(_)) => {
                warn!(target: LOG_TARGET, "Failed to gain access to keyring storage. Storing generated passphrase insecurely");
                let passphrase = SafePassword::from(generate_password(32));
                config.passphrase = Some(passphrase.clone());
                passphrase
            }
            Err(e) => return Err(anyhow!(e.to_string())),
        };

        let seed = CipherSeed::new();

        let seed_file = seed.encipher(Some(passphrase))?;
        config.seed_words_encrypted_base58 = seed_file.to_base58();

        let comms_key_manager = KeyManager::<RistrettoPublicKey, KeyDigest>::from(
            seed.clone(),
            KEY_MANAGER_COMMS_SECRET_KEY_BRANCH_KEY.to_string(),
            0,
        );
        let comms_key = comms_key_manager
            .derive_key(0)
            .map_err(|e| anyhow!(e.to_string()))?
            .key;
        let comms_pub_key = RistrettoPublicKey::from_secret_key(&comms_key);
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

    pub fn decrypt_seed_words(&self) -> Result<SeedWords, anyhow::Error> {
        let passphrase = match &self.config.passphrase {
            Some(passphrase) => passphrase.clone(),
            None => {
                let entry = Entry::new("com.tari.universe", "internal_wallet")?;
                SafePassword::from(entry.get_password()?)
            }
        };

        let seed_binary = Vec::<u8>::from_base58(&self.config.seed_words_encrypted_base58)
            .map_err(|e| anyhow!(e.to_string()))?;
        let seed = CipherSeed::from_enciphered_bytes(&seed_binary, Some(passphrase))?;
        let seed_words = seed.to_mnemonic(MnemonicLanguage::English, None)?;
        Ok(seed_words)
    }

    pub fn get_view_key(&self) -> String {
        self.config.view_key_private_hex.clone()
    }
    pub fn get_spend_key(&self) -> String {
        self.config.spend_public_key_hex.clone()
    }

    pub fn get_network(&self) -> Result<Network, TariAddressError> {
        let address = TariAddress::from_base58(&self.config.tari_address_base58);
        address.map(|a| a.network())
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
    passphrase: Option<SafePassword>,
}
