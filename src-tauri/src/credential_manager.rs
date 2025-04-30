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

use crate::configs::config_wallet::{ConfigWallet, ConfigWalletContent};
use crate::configs::trait_config::ConfigImpl;
use crate::internal_wallet::WalletConfig;
use crate::APPLICATION_FOLDER_ID;
use keyring::{Entry, Error as KeyringError};
use log::info;
use serde::{Deserialize, Serialize};
use std::fs::OpenOptions;
use std::io::{self, Read, Write};
use std::path::PathBuf;
use std::sync::atomic::{AtomicBool, Ordering};
use tari_common::configuration::Network;
use tari_utilities::SafePassword;
use thiserror::Error;

const LOG_TARGET: &str = "tari::universe::credential_manager";

#[derive(Serialize, Deserialize, Debug)]
pub struct Credential {
    pub tari_seed_passphrase: Option<SafePassword>,
    pub monero_seed: Option<[u8; 32]>,
}

#[derive(Error, Debug)]
pub enum CredentialError {
    #[error("Keyring operation failed: {0}")]
    Keyring(#[from] KeyringError),
    #[error("I/O operation failed: {0}")]
    Io(#[from] io::Error),
    #[error("Serialization error: {0}")]
    Serialization(#[from] serde_cbor::Error),
    #[error("Keyring had no entry for: {0}")]
    NoEntry(String),
    #[error("Data previously stored in Keychain.\nKeychain access is now required to continue")]
    PreviouslyUsedKeyring,
}

const FALLBACK_FILE_PATH: &str = "credentials_backup.bin";

const KEYCHAIN_USERNAME_LEGACY: &str = "internal_wallet";
const KEYCHAIN_USERNAME: &str = "inner_wallet_credentials";

pub struct CredentialManager {
    service_name: String,
    username: String,
    fallback_mode: AtomicBool,
    fallback_dir: PathBuf,
}

impl CredentialManager {
    fn new(service_name: String, username: String, fallback_dir: PathBuf) -> Self {
        let new_path = fallback_dir
            .join(Network::get_current().as_key_str())
            .join(FALLBACK_FILE_PATH);

        if fallback_dir.join(FALLBACK_FILE_PATH).exists() {
            if !new_path.exists() {
                std::fs::copy(fallback_dir.join(FALLBACK_FILE_PATH), new_path.clone())
                    .expect("Failed to rename fallback file");
            }
        }

        let fallback_mode = AtomicBool::new(new_path.exists());

        CredentialManager {
            service_name,
            username,
            fallback_mode,
            fallback_dir,
        }
    }

    pub fn default_with_dir(fallback_dir: PathBuf) -> Self {
        let network_specific_name = format!(
            "{}_{}",
            KEYCHAIN_USERNAME,
            Network::get_current().as_key_str()
        );

        let new_credential_manager = CredentialManager::new(
            APPLICATION_FOLDER_ID.into(),
            network_specific_name.clone(),
            fallback_dir.clone(),
        );

        let old_credential_manager = CredentialManager::new(
            APPLICATION_FOLDER_ID.into(),
            KEYCHAIN_USERNAME.into(),
            fallback_dir.clone(),
        );

        if new_credential_manager.load_from_keyring().is_err() {
            if let Ok(credential) = old_credential_manager.load_from_keyring() {
                new_credential_manager
                    .save_to_keyring(&credential)
                    .expect("Failed to migrate credentials");
            }
        }

        new_credential_manager
    }

    pub async fn migrate(&self, wallet_config: &WalletConfig) -> Result<(), CredentialError> {
        // Shortcut and do nothing if we already have new credential format
        let creds = self.get_credentials().await;
        if let Ok(creds) = &creds {
            info!(target: LOG_TARGET, "Found credentials");
            if creds.tari_seed_passphrase.is_some() {
                info!(target: LOG_TARGET, "Credentials already migrated. Skipping.");
                return Ok(());
            }
        }

        let passphrase = if wallet_config.passphrase.is_some() {
            info!(target: LOG_TARGET, "Found wallet passphrase");
            wallet_config.passphrase.clone()
        } else if let Ok(legacy) = self.load_from_legacy() {
            info!(target: LOG_TARGET, "Found legacy keyring passphrase");
            Some(legacy)
        } else {
            info!(target: LOG_TARGET, "No credentials in a new format, and no legacy passphrase found, skipping migration");
            None
        };

        if let Some(safe_password) = passphrase {
            info!(target: LOG_TARGET, "Migrating passphrase to new credential format");
            let credential = match creds {
                Ok(mut cred) => {
                    cred.tari_seed_passphrase = Some(safe_password);
                    cred
                }
                Err(_) => Credential {
                    tari_seed_passphrase: Some(safe_password),
                    monero_seed: None,
                },
            };

            self.set_credentials(&credential).await?;
        }

        Ok(())
    }

    fn use_fallback(&self) -> bool {
        self.fallback_mode.load(Ordering::SeqCst) || self.fallback_file().exists()
    }

    async fn set_fallback_mode(&self) -> bool {
        // Only allow shifting to fallback mode if the keyring hasn't been successfully stored to.
        // If it already contains data, the user must provide access to the existing data.
        if !*ConfigWallet::content().await.keyring_accessed() {
            self.fallback_mode.store(true, Ordering::SeqCst);
            return true;
        }

        false
    }

    pub async fn set_credentials(&self, credential: &Credential) -> Result<(), CredentialError> {
        if self.use_fallback() {
            self.save_to_file(credential)?;
            return Ok(());
        }

        match self.save_to_keyring(credential) {
            Ok(_) => {
                let _unused =
                    ConfigWallet::update_field(ConfigWalletContent::set_keyring_accessed, true)
                        .await;
                Ok(())
            }
            Err(CredentialError::Keyring(e)) => {
                if self.set_fallback_mode().await {
                    self.save_to_file(credential)?;
                    Ok(())
                } else {
                    Err(e.into())
                }
            }
            Err(err) => Err(err),
        }
    }

    pub async fn get_credentials(&self) -> Result<Credential, CredentialError> {
        if self.use_fallback() {
            return self.load_from_file();
        }

        match self.load_from_keyring() {
            Ok(credential) => {
                let _unused =
                    ConfigWallet::update_field(ConfigWalletContent::set_keyring_accessed, true)
                        .await;
                Ok(credential)
            }
            Err(CredentialError::Keyring(_)) => {
                if self.set_fallback_mode().await {
                    self.load_from_file()
                } else {
                    Err(CredentialError::PreviouslyUsedKeyring)
                }
            }
            Err(err) => Err(err),
        }
    }

    fn save_to_keyring(&self, credential: &Credential) -> Result<(), CredentialError> {
        let entry = Entry::new(&self.service_name, &self.username)?;

        let _unused = entry.delete_credential();

        let serialized = serde_cbor::to_vec(credential)?;
        entry.set_secret(&serialized)?;
        Ok(())
    }

    fn load_from_keyring(&self) -> Result<Credential, CredentialError> {
        let entry = Entry::new(&self.service_name, &self.username)?;
        let encoded = match entry.get_secret() {
            Ok(secret) => secret,
            Err(_e @ KeyringError::NoEntry) => {
                return Err(CredentialError::NoEntry(self.username.clone()))
            }
            Err(e) => return Err(e.into()),
        };
        let credential: Credential = serde_cbor::from_slice(&encoded)?;
        Ok(credential)
    }

    fn save_to_file(&self, credential: &Credential) -> Result<(), CredentialError> {
        let serialized = serde_cbor::to_vec(credential)?;
        if let Some(parent) = self.fallback_file().parent() {
            if !parent.exists() {
                std::fs::create_dir_all(parent)?;
            }
        }
        let mut file = OpenOptions::new()
            .write(true)
            .create(true)
            .truncate(true)
            .open(self.fallback_file())?;
        file.write_all(&serialized)?;
        Ok(())
    }

    fn load_from_file(&self) -> Result<Credential, CredentialError> {
        let mut file = OpenOptions::new().read(true).open(self.fallback_file())?;
        let mut buffer = Vec::new();
        file.read_to_end(&mut buffer)?;
        let credential: Credential = serde_cbor::from_slice(&buffer)?;
        Ok(credential)
    }

    fn load_from_legacy(&self) -> Result<SafePassword, CredentialError> {
        let entry = Entry::new(&self.service_name, KEYCHAIN_USERNAME_LEGACY)?;
        let pw = SafePassword::from(entry.get_password()?);
        Ok(pw)
    }

    fn fallback_file(&self) -> PathBuf {
        self.fallback_dir
            .join(Network::get_current().as_key_str())
            .join(FALLBACK_FILE_PATH)
    }
}
