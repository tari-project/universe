use crate::APPLICATION_FOLDER_ID;
use keyring::{Entry, Error as KeyringError};
use serde::{Deserialize, Serialize};
use std::fs::OpenOptions;
use std::io::{self, Read, Write};
use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicBool, Ordering};
use log::info;
use tari_utilities::SafePassword;
use thiserror::Error;
use crate::internal_wallet::WalletConfig;

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
    #[error("Failed to decode safe password: {0}")]
    MessageFormat(String),
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
        let fallback_mode = AtomicBool::new(Self::fallback_exists());
        CredentialManager { service_name, username, fallback_mode, fallback_dir }
    }

    pub fn default_with_dir(fallback_dir: PathBuf) -> Self {
        CredentialManager::new(APPLICATION_FOLDER_ID.into(), KEYCHAIN_USERNAME.into(), fallback_dir)
    }

    pub fn migrate(&self, wallet_config: &WalletConfig) -> Result<(), CredentialError> {
        // Shortcut and do nothing if we already have new credential format
        let creds = self.get_credentials();
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
                Err(_) => {
                    Credential {
                        tari_seed_passphrase: Some(safe_password),
                        monero_seed: None,
                    }
                }
            };

            self.set_credentials(&credential)?;
        }

        Ok(())
    }

    fn fallback_exists() -> bool {
        Path::new(FALLBACK_FILE_PATH).exists()
    }

    fn use_fallback(&self) -> bool {
        self.fallback_mode.load(Ordering::SeqCst) || Self::fallback_exists()
    }

    fn set_fallback_mode(&self) {
        self.fallback_mode.store(true, Ordering::SeqCst);
    }

    pub fn set_credentials(&self, credential: &Credential) -> Result<(), CredentialError> {
        if self.use_fallback() {
            Self::save_to_file(credential)?;
            return Ok(());
        }

        match self.save_to_keyring(credential) {
            Ok(_) => Ok(()),
            Err(CredentialError::Keyring(_)) => {
                self.set_fallback_mode();
                Self::save_to_file(credential)?;
                Ok(())
            }
            Err(err) => Err(err),
        }
    }

    pub fn get_credentials(&self) -> Result<Credential, CredentialError> {
        if self.use_fallback() {
            return Self::load_from_file();
        }

        match self.load_from_keyring() {
            Ok(credential) => Ok(credential),
            Err(CredentialError::Keyring(_)) => {
                self.set_fallback_mode();
                Self::load_from_file()
            }
            Err(err) => Err(err),
        }
    }

    fn save_to_keyring(&self, credential: &Credential) -> Result<(), CredentialError> {
        let entry = Entry::new(&self.service_name, &self.username)?;

        let _ = entry.delete_credential();

        let serialized = serde_cbor::to_vec(credential)?;
        entry.set_secret(&serialized)?;
        Ok(())
    }

    fn load_from_keyring(&self) -> Result<Credential, CredentialError> {
        let entry = Entry::new(&self.service_name, &self.username)?;
        let encoded = match entry.get_secret() {
            Ok(secret) => secret,
            Err(_e @ KeyringError::NoEntry) => return Err(CredentialError::NoEntry(self.username.clone())),
            Err(e) => return Err(e.into())
        };
        let credential: Credential = serde_cbor::from_slice(&encoded)?;
        Ok(credential)
    }

    fn save_to_file(credential: &Credential) -> Result<(), CredentialError> {
        let serialized = serde_cbor::to_vec(credential)?;
        let mut file = OpenOptions::new()
            .write(true)
            .create(true)
            .truncate(true)
            .open(FALLBACK_FILE_PATH)?;
        file.write_all(&serialized)?;
        Ok(())
    }

    fn load_from_file() -> Result<Credential, CredentialError> {
        let mut file = OpenOptions::new().read(true).open(FALLBACK_FILE_PATH)?;
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
}

//#[cfg(test)]
//mod tests {
//    use super::*;
//    use std::fs;
//    use keyring::{set_default_credential_builder, mock};
//
//    const KEYCHAIN_USERNAME: &str = "inner_wallet_credentials_test";
//
//    #[test]
//    fn test_create_new_credentials() {
//        set_default_credential_builder(mock::default_credential_builder());
//        let manager = CredentialManager::new(APPLICATION_FOLDER_ID.into(), KEYCHAIN_USERNAME.into());
//
//        let credential = Credential {
//            seed_passphrase: "tari_pass".to_string(),
//        };
//
//        let result = manager.set_credentials(&credential);
//        assert!(result.is_ok(), "Failed to create new credentials");
//
//        let saved_credential = manager.get_credentials().expect("Failed to get saved credentials");
//        assert_eq!(saved_credential.seed_passphrase, "tari_pass");
//    }
//
//    #[test]
//    fn test_load_existing_credentials_from_keyring() {
//        set_default_credential_builder(mock::default_credential_builder());
//        let manager = CredentialManager::new(APPLICATION_FOLDER_ID.into(), KEYCHAIN_USERNAME.into());
//
//        let credential = Credential {
//            seed_passphrase: "tari_pass".to_string(),
//        };
//        manager.set_credentials(&credential).expect("Failed to set credentials");
//
//        let result = manager.get_credentials();
//        assert!(result.is_ok(), "Failed to load credentials from keyring");
//
//        let creds = result.unwrap();
//        assert_eq!(creds.seed_passphrase, "tari_pass");
//    }
//
//    #[test]
//    fn test_save_and_load_credentials_from_fallback_file() {
//        set_default_credential_builder(mock::default_credential_builder());
//        let manager = CredentialManager::new(APPLICATION_FOLDER_ID.into(), KEYCHAIN_USERNAME.into());
//        manager.set_fallback_mode();
//
//        let credential = Credential {
//            seed_passphrase: "tari_fallback_pass".to_string(),
//        };
//        manager.set_credentials(&credential).expect("Failed to set credentials");
//
//        let result = manager.get_credentials();
//        assert!(result.is_ok(), "Failed to load credentials from fallback file");
//
//        let creds = result.unwrap();
//        assert_eq!(creds.seed_passphrase, "tari_fallback_pass");
//
//        fs::remove_file(FALLBACK_FILE_PATH).unwrap();
//    }
//
//    //#[test]
//    //fn test_migrate_from_legacy() {
//    //    let manager = CredentialManager::new(APPLICATION_FOLDER_ID.into(), KEYCHAIN_USERNAME.into());
//    //    let mut wallet_config = WalletConfig::default();
//
//    //    let legacy_passphrase = "legacy_pass";
//    //    wallet_config.passphrase = Some(SafePassword::from(legacy_passphrase.to_string()));
//
//    //    let result = manager.migrate(wallet_config);
//    //    assert!(result.is_ok(), "Migration failed");
//
//    //    let result = manager.get_credentials();
//    //    assert!(result.is_ok(), "Failed to load migrated credentials");
//
//    //    let creds = result.unwrap();
//    //    assert_eq!(creds.tari_seed_passphrase, legacy_passphrase);
//    //    assert_eq!(creds.monero_seed_passphrase, "");
//    //}
//}
