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

use crate::configs::config_wallet::WalletId;
use crate::APPLICATION_FOLDER_ID;
use keyring::{Entry, Error as KeyringError};
use serde::{Deserialize, Serialize};
use std::fs::OpenOptions;
use std::io::{self, Read};
use std::path::PathBuf;
use std::sync::atomic::{AtomicBool, Ordering};
use tari_common::configuration::Network;
use tari_utilities::SafePassword;
use thiserror::Error;

#[derive(Serialize, Deserialize, Debug)]
pub struct Credential {
    // It's not PIN encrypted until non-zero balance detected
    pub encrypted_seed: Vec<u8>,
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
}

const FALLBACK_FILE_PATH: &str = "credentials_backup.bin";
const KEYCHAIN_USERNAME: &str = "inner_wallet_credentials";

pub struct CredentialManager {
    service_name: String,
    username: String,
}

impl CredentialManager {
    fn new(service_name: String, username: String) -> Self {
        CredentialManager {
            service_name,
            username,
        }
    }

    pub fn new_default(id: WalletId) -> Self {
        let name = format!(
            "{}_{}_{}",
            KEYCHAIN_USERNAME,
            Network::get_current().as_key_str(),
            id.as_str()
        );

        CredentialManager::new(APPLICATION_FOLDER_ID.into(), name)
    }

    pub async fn set_credentials(&self, credential: &Credential) -> Result<(), CredentialError> {
        self.save_to_keyring(credential)
    }

    pub async fn get_credentials(&self) -> Result<Credential, CredentialError> {
        self.load_from_keyring()
    }

    pub fn delete_credential(&self) -> Result<(), CredentialError> {
        let entry = Entry::new(&self.service_name, &self.username)?;
        entry.delete_credential()?;
        Ok(())
    }

    fn save_to_keyring(&self, credential: &Credential) -> Result<(), CredentialError> {
        let _unused = self.delete_credential();

        let entry = Entry::new(&self.service_name, &self.username)?;
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
}

// =================================================================================
// LEGACY
//==================================================================================

#[derive(Serialize, Deserialize, Debug)]
pub struct LegacyCredential {
    pub tari_seed_passphrase: Option<SafePassword>,
    pub monero_seed: Option<[u8; 32]>,
}

pub struct LegacyCredentialManager {
    service_name: String,
    username: String,
    fallback_mode: AtomicBool,
    fallback_dir: PathBuf,
}

impl LegacyCredentialManager {
    fn new(service_name: String, username: String, fallback_dir: PathBuf) -> Self {
        let file_path = fallback_dir.join(FALLBACK_FILE_PATH);
        let fallback_mode = AtomicBool::new(file_path.exists());

        LegacyCredentialManager {
            service_name,
            username,
            fallback_mode,
            fallback_dir,
        }
    }

    pub fn new_default(app_config_dir: PathBuf) -> Self {
        let network_specific_name = format!(
            "{}_{}",
            KEYCHAIN_USERNAME,
            Network::get_current().as_key_str()
        );

        LegacyCredentialManager::new(
            APPLICATION_FOLDER_ID.into(),
            network_specific_name.clone(),
            app_config_dir.join(Network::get_current().as_key_str()),
        )
    }

    fn use_fallback(&self) -> bool {
        // maybe check just file
        self.fallback_mode.load(Ordering::SeqCst) || self.fallback_file().exists()
    }

    pub async fn get_credentials(&self) -> Result<LegacyCredential, CredentialError> {
        if self.use_fallback() {
            return self.load_from_file();
        }

        self.load_from_keyring()
    }

    fn load_from_keyring(&self) -> Result<LegacyCredential, CredentialError> {
        let entry = Entry::new(&self.service_name, &self.username)?;
        let encoded = match entry.get_secret() {
            Ok(secret) => secret,
            Err(_e @ KeyringError::NoEntry) => {
                return Err(CredentialError::NoEntry(self.username.clone()))
            }
            Err(e) => return Err(e.into()),
        };
        let credential: LegacyCredential = serde_cbor::from_slice(&encoded)?;
        Ok(credential)
    }

    fn load_from_file(&self) -> Result<LegacyCredential, CredentialError> {
        let mut file = OpenOptions::new().read(true).open(self.fallback_file())?;
        let mut buffer = Vec::new();
        file.read_to_end(&mut buffer)?;
        let credential: LegacyCredential = serde_cbor::from_slice(&buffer)?;
        Ok(credential)
    }

    fn fallback_file(&self) -> PathBuf {
        self.fallback_dir.join(FALLBACK_FILE_PATH)
    }
}
