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

use crate::APPLICATION_FOLDER_ID;
use crate::configs::config_wallet::WalletId;
use keyring::{Entry, Error as KeyringError};
use ring::rand::{SecureRandom, SystemRandom};
use serde::{Deserialize, Serialize};
use std::fs::OpenOptions;
use std::io::{self, Read};
use std::path::PathBuf;
use std::sync::atomic::{AtomicBool, Ordering};
use tari_common::configuration::Network;
use tari_utilities::SafePassword;
use thiserror::Error;
use zeroize::Zeroizing;

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
const MINOTARI_DB_ENTRY: &str = "minotari_db_password";
const OOTLE_KEYRING_ENTRY: &str = "ootle_keyring_password";
const MCP_TOKEN_KEY_ENTRY: &str = "mcp_token_key";
const MINOTARI_DB_PASSWORD_BYTES: usize = 32;
const NON_TARI_WALLET_ENTRIES: &[&str] = &[
    crate::internal_wallet::MONERO_WALLET_ID,
    MINOTARI_DB_ENTRY,
    OOTLE_KEYRING_ENTRY,
    MCP_TOKEN_KEY_ENTRY,
];

/// Extracts a Tari `WalletId` for `network_key` from an OS credential store entry name
/// (`inner_wallet_credentials_<network>_<id>` on macOS/Linux, or
/// `inner_wallet_credentials_<network>_<id>.<service>` on Windows). Ignores the non-Tari
/// entries Universe keeps under the same service (`monero`, `minotari_db_password`,
/// `ootle_keyring_password`, `mcp_token_key`) as well as entries for other networks.
pub(crate) fn extract_tari_wallet_id_for_network(
    entry_name: &str,
    network_key: &str,
) -> Option<WalletId> {
    extract_tari_wallet_id_for_service_and_network(entry_name, APPLICATION_FOLDER_ID, network_key)
}

pub(crate) fn extract_tari_wallet_id_for_service_and_network(
    entry_name: &str,
    service_name: &str,
    network_key: &str,
) -> Option<WalletId> {
    let service_suffix = format!(".{service_name}");
    let username = entry_name
        .strip_suffix(&service_suffix)
        .unwrap_or(entry_name);
    let prefix = format!("{KEYCHAIN_USERNAME}_{network_key}_");
    let id = username.strip_prefix(&prefix)?;
    if id.len() != 6
        || NON_TARI_WALLET_ENTRIES.contains(&id)
        || !id.bytes().all(|b| b.is_ascii_alphanumeric())
    {
        return None;
    }
    Some(WalletId::new(id.to_string()))
}

/// Deduplicates and preserves the caller's ordering (for example `LastWritten` on Windows)
/// while filtering raw OS credential store entry names down to Tari `WalletId`s for `network_key`.
pub(crate) fn filter_tari_wallet_ids_for_network<I, S>(
    entry_names: I,
    service_name: &str,
    network_key: &str,
) -> Vec<WalletId>
where
    I: IntoIterator<Item = S>,
    S: AsRef<str>,
{
    let mut ids = Vec::new();
    for entry_name in entry_names {
        if let Some(wallet_id) = extract_tari_wallet_id_for_service_and_network(
            entry_name.as_ref(),
            service_name,
            network_key,
        ) && !ids.contains(&wallet_id)
        {
            ids.push(wallet_id);
        }
    }
    ids
}

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
        match self.save_to_keyring(credential) {
            Ok(_) => Ok(()),
            Err(CredentialError::Keyring(e)) => Err(e.into()),
            Err(err) => Err(err),
        }
    }

    pub async fn get_credentials(&self) -> Result<Credential, CredentialError> {
        match self.load_from_keyring() {
            Ok(credential) => Ok(credential),
            Err(CredentialError::Keyring(e)) => Err(e.into()),
            Err(err) => Err(err),
        }
    }

    /// Password encrypting the minotari wallet database, whose account blob holds the
    /// view private key. Random per install, minted on first use and kept in the OS
    /// credential store beside the seed.
    ///
    /// Deliberately not keyed by `WalletId`: importing a wallet mints a new id while the
    /// database on disk is deleted and rebuilt on its own schedule, and any window where
    /// the two disagree leaves a database nothing can open.
    pub async fn minotari_db_password() -> Result<Zeroizing<String>, CredentialError> {
        Self::install_password(MINOTARI_DB_ENTRY)
    }

    /// Per-install secret the Ootle (L2) store password starts with, the PIN follows it, so
    /// a copy of the store file is no use without the keyring. Minted on first use and never
    /// rotated: older builds encrypted the store with this secret alone, and moving such a
    /// store onto the new password needs the same value.
    pub fn ootle_keyring_password() -> Result<Zeroizing<String>, CredentialError> {
        Self::install_password(OOTLE_KEYRING_ENTRY)
    }

    /// Random per-install AES key for persisted MCP bearer tokens.
    pub fn mcp_token_key() -> Result<Zeroizing<String>, CredentialError> {
        Self::install_password(MCP_TOKEN_KEY_ENTRY)
    }

    fn install_password(name: &str) -> Result<Zeroizing<String>, CredentialError> {
        Self::read_or_create_password(&Self::install_entry(name)?)
    }

    fn install_entry(name: &str) -> Result<Entry, CredentialError> {
        Ok(Entry::new(
            APPLICATION_FOLDER_ID,
            &format!(
                "{}_{}_{}",
                KEYCHAIN_USERNAME,
                Network::get_current().as_key_str(),
                name
            ),
        )?)
    }

    /// Never overwrites a secret that is already there: the database it opens cannot be
    /// re-keyed, so a second value would lock the wallet out of its own scan history.
    fn read_or_create_password(entry: &Entry) -> Result<Zeroizing<String>, CredentialError> {
        match entry.get_secret() {
            Ok(secret) if !secret.is_empty() => return Ok(Zeroizing::new(hex::encode(secret))),
            Ok(_) | Err(KeyringError::NoEntry) => {}
            Err(e) => return Err(e.into()),
        }

        let mut secret = Zeroizing::new([0u8; MINOTARI_DB_PASSWORD_BYTES]);
        SystemRandom::new()
            .fill(secret.as_mut_slice())
            .map_err(|_| {
                CredentialError::Io(io::Error::other("Failed to generate a keyring password"))
            })?;
        entry.set_secret(secret.as_slice())?;
        Ok(Zeroizing::new(hex::encode(secret.as_slice())))
    }

    pub fn delete_credential(&self) -> Result<(), keyring::Error> {
        let entry = Entry::new(&self.service_name, &self.username)?;
        entry.delete_credential()
    }

    fn save_to_keyring(&self, credential: &Credential) -> Result<(), CredentialError> {
        let entry = Entry::new(&self.service_name, &self.username)?;
        Self::write_credential(&entry, credential)
    }

    /// Overwrites the entry in place: deleting first leaves no credential at all when the write
    /// then fails, and with it the only copy of the seed.
    fn write_credential(entry: &Entry, credential: &Credential) -> Result<(), CredentialError> {
        let serialized = serde_cbor::to_vec(credential)?;
        entry.set_secret(&serialized)?;
        Ok(())
    }

    fn load_from_keyring(&self) -> Result<Credential, CredentialError> {
        let entry = Entry::new(&self.service_name, &self.username)?;
        let encoded = match entry.get_secret() {
            Ok(secret) => secret,
            Err(_e @ KeyringError::NoEntry) => {
                return Err(CredentialError::NoEntry(self.username.clone()));
            }
            Err(e) => return Err(e.into()),
        };
        let credential: Credential = serde_cbor::from_slice(&encoded)?;
        Ok(credential)
    }

    /// Enumerates the OS credential store for Tari wallet ids belonging to the current network.
    pub fn enumerate_tari_wallet_ids() -> Result<Vec<WalletId>, CredentialError> {
        let network = Network::get_current_or_user_setting_or_default();
        Self::enumerate_tari_wallet_ids_for_network(APPLICATION_FOLDER_ID, network.as_key_str())
    }

    pub(crate) fn enumerate_tari_wallet_ids_for_network(
        service_name: &str,
        network_key: &str,
    ) -> Result<Vec<WalletId>, CredentialError> {
        let entry_names = enumerate_platform_entry_names(service_name, network_key)?;
        Ok(filter_tari_wallet_ids_for_network(
            entry_names,
            service_name,
            network_key,
        ))
    }
}

#[cfg(target_os = "linux")]
fn enumerate_platform_entry_names(
    service_name: &str,
    _network_key: &str,
) -> Result<Vec<String>, CredentialError> {
    use dbus_secret_service::{EncryptionType, SecretService};
    use std::collections::HashMap;

    let ss = SecretService::connect(EncryptionType::Plain)
        .map_err(|e| CredentialError::Io(io::Error::other(e.to_string())))?;
    let search = ss
        .search_items(HashMap::from([("service", service_name)]))
        .map_err(|e| CredentialError::Io(io::Error::other(e.to_string())))?;

    let mut entries_with_mtime: Vec<(String, u64)> = Vec::new();
    for item in search.unlocked.iter().chain(search.locked.iter()) {
        if let Ok(attributes) = item.get_attributes()
            && let Some(username) = attributes.get("username")
        {
            let modified = item.get_modified().unwrap_or(0);
            entries_with_mtime.push((username.clone(), modified));
        }
    }
    entries_with_mtime.sort_by(|a, b| b.1.cmp(&a.1));
    Ok(entries_with_mtime
        .into_iter()
        .map(|(username, _)| username)
        .collect())
}

#[cfg(target_os = "macos")]
fn enumerate_platform_entry_names(
    service_name: &str,
    _network_key: &str,
) -> Result<Vec<String>, CredentialError> {
    use security_framework::item::{ItemClass, ItemSearchOptions, Limit};
    use security_framework::os::macos::keychain::{SecKeychain, SecPreferencesDomain};

    const ERR_SEC_ITEM_NOT_FOUND: i32 = -25300;

    let keychain = SecKeychain::default_for_domain(SecPreferencesDomain::User)
        .map_err(|e| CredentialError::Io(io::Error::other(e.to_string())))?;
    let results = match ItemSearchOptions::new()
        .keychains(&[keychain])
        .class(ItemClass::generic_password())
        .service(service_name)
        .load_attributes(true)
        .limit(Limit::All)
        .search()
    {
        Ok(results) => results,
        Err(err) if err.code() == ERR_SEC_ITEM_NOT_FOUND => return Ok(Vec::new()),
        Err(err) => return Err(CredentialError::Io(io::Error::other(err.to_string()))),
    };

    let mut accounts = Vec::new();
    for result in results {
        if let Some(attributes) = result.simplify_dict()
            && let Some(account) = attributes.get("acct")
        {
            accounts.push(account.clone());
        }
    }
    Ok(accounts)
}

#[cfg(target_os = "windows")]
fn enumerate_platform_entry_names(
    service_name: &str,
    network_key: &str,
) -> Result<Vec<String>, CredentialError> {
    use std::iter::once;
    use windows_sys::Win32::Foundation::{ERROR_NOT_FOUND, GetLastError};
    use windows_sys::Win32::Security::Credentials::{
        CRED_TYPE_GENERIC, CREDENTIALW, CredEnumerateW, CredFree,
    };

    // `keyring` on Windows formats generic credential target names as `<username>.<service>`.
    let filter_str = format!("{KEYCHAIN_USERNAME}_{network_key}_*");
    let filter_wide: Vec<u16> = filter_str.encode_utf16().chain(once(0)).collect();
    let service_suffix = format!(".{service_name}");

    let mut count: u32 = 0;
    let mut credentials_ptr: *mut *mut CREDENTIALW = std::ptr::null_mut();
    let ok = unsafe { CredEnumerateW(filter_wide.as_ptr(), 0, &mut count, &mut credentials_ptr) };
    if ok == 0 {
        let err = unsafe { GetLastError() };
        if err == ERROR_NOT_FOUND {
            return Ok(Vec::new());
        }
        return Err(CredentialError::Io(io::Error::from_raw_os_error(
            err as i32,
        )));
    }

    let mut entries_with_time: Vec<(String, u64)> = Vec::new();
    unsafe {
        let slice = std::slice::from_raw_parts(credentials_ptr, count as usize);
        for &cred_ptr in slice {
            if cred_ptr.is_null() {
                continue;
            }
            let cred = &*cred_ptr;
            if cred.Type != CRED_TYPE_GENERIC || cred.TargetName.is_null() {
                continue;
            }
            let mut len = 0usize;
            while *cred.TargetName.add(len) != 0 {
                len += 1;
            }
            let target_slice = std::slice::from_raw_parts(cred.TargetName, len);
            if let Ok(target_name) = String::from_utf16(target_slice)
                && target_name.ends_with(&service_suffix)
            {
                let last_written = (u64::from(cred.LastWritten.dwHighDateTime) << 32)
                    | u64::from(cred.LastWritten.dwLowDateTime);
                entries_with_time.push((target_name, last_written));
            }
        }
        CredFree(credentials_ptr as *const _);
    }

    entries_with_time.sort_by(|a, b| b.1.cmp(&a.1));
    Ok(entries_with_time
        .into_iter()
        .map(|(target_name, _)| target_name)
        .collect())
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
                return Err(CredentialError::NoEntry(self.username.clone()));
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

#[cfg(test)]
mod tests {
    use super::*;
    use keyring::mock::MockCredential;

    #[test]
    fn a_failed_write_keeps_the_previous_credential() {
        let entry = Entry::new_with_credential(Box::new(MockCredential::default()));
        let previous = Credential {
            encrypted_seed: vec![1, 2, 3],
        };
        CredentialManager::write_credential(&entry, &previous).expect("first write");

        let mock: &MockCredential = entry
            .get_credential()
            .downcast_ref()
            .expect("mock credential");
        mock.set_error(KeyringError::Invalid(
            "mock".to_string(),
            "write refused".to_string(),
        ));
        let replacement = Credential {
            encrypted_seed: vec![4, 5, 6],
        };
        CredentialManager::write_credential(&entry, &replacement)
            .expect_err("the mock refuses this write");

        let stored: Credential =
            serde_cbor::from_slice(&entry.get_secret().expect("the entry must still be present"))
                .expect("stored credential decodes");
        assert_eq!(stored.encrypted_seed, previous.encrypted_seed);
    }

    #[test]
    fn the_minotari_db_password_is_minted_once_and_then_reused() {
        let entry = Entry::new_with_credential(Box::new(MockCredential::default()));

        let first = CredentialManager::read_or_create_password(&entry).expect("first read");
        assert_eq!(first.len(), MINOTARI_DB_PASSWORD_BYTES * 2);
        assert!(first.chars().all(|c| c.is_ascii_hexdigit()));

        let second = CredentialManager::read_or_create_password(&entry).expect("second read");
        assert_eq!(*first, *second, "a stored password must never be replaced");
    }

    #[test]
    fn extract_tari_wallet_id_accepts_current_network_ids_and_ignores_non_wallet_entries() {
        assert_eq!(
            extract_tari_wallet_id_for_network(
                "inner_wallet_credentials_mainnet_Ab12Cd",
                "mainnet"
            ),
            Some(WalletId::new("Ab12Cd".to_string()))
        );
        // Windows `keyring` target format: `<username>.<service>`
        assert_eq!(
            extract_tari_wallet_id_for_network(
                &format!("inner_wallet_credentials_mainnet_Xy98Zw.{APPLICATION_FOLDER_ID}"),
                "mainnet"
            ),
            Some(WalletId::new("Xy98Zw".to_string()))
        );
        assert_eq!(
            extract_tari_wallet_id_for_service_and_network(
                "inner_wallet_credentials_mainnet_Xy98Zw.com.tari.universe",
                "com.tari.universe",
                "mainnet"
            ),
            Some(WalletId::new("Xy98Zw".to_string()))
        );

        // Non-Tari entries kept under the same service must be ignored
        for ignored in [
            "inner_wallet_credentials_mainnet_monero",
            "inner_wallet_credentials_mainnet_monero.com.tari.universe",
            "inner_wallet_credentials_mainnet_minotari_db_password",
            "inner_wallet_credentials_mainnet_ootle_keyring_password",
            "inner_wallet_credentials_mainnet_mcp_token_key",
            "inner_wallet_credentials_esmeralda_Ab12Cd",
            "inner_wallet_credentials_mainnet_short",
            "inner_wallet_credentials_mainnet_toolong7",
            "inner_wallet_credentials_mainnet_bad-id",
            "unrelated_entry",
        ] {
            assert_eq!(
                extract_tari_wallet_id_for_network(ignored, "mainnet"),
                None,
                "{ignored} must not be treated as a Tari wallet id"
            );
        }
    }

    #[test]
    fn filter_tari_wallet_ids_preserves_order_and_deduplicates() {
        let newest_win = format!("inner_wallet_credentials_mainnet_Newest.{APPLICATION_FOLDER_ID}");
        let entries = [
            "inner_wallet_credentials_mainnet_monero",
            newest_win.as_str(),
            "inner_wallet_credentials_mainnet_minotari_db_password",
            "inner_wallet_credentials_esmeralda_OtherN",
            "inner_wallet_credentials_mainnet_Older1",
            "inner_wallet_credentials_mainnet_Newest",
            "inner_wallet_credentials_mainnet_ootle_keyring_password",
            "inner_wallet_credentials_mainnet_mcp_token_key",
        ];
        let ids = filter_tari_wallet_ids_for_network(entries, APPLICATION_FOLDER_ID, "mainnet");
        assert_eq!(
            ids,
            vec![
                WalletId::new("Newest".to_string()),
                WalletId::new("Older1".to_string()),
            ]
        );
    }
    #[cfg(feature = "test-mode")]
    #[test]
    fn test_headless_credential_store_persists_mcp_key_and_token() {
        use crate::configs::config_mcp::{ConfigMcpContent, token_cipher};
        let temp = tempfile::tempdir().expect("tempdir");
        crate::file_credential_store::set_store_dir(temp.path().to_path_buf());
        let builder = crate::file_credential_store::default_credential_builder();
        let entry = Entry::new_with_credential(
            builder
                .build(None, "mcp-test", MCP_TOKEN_KEY_ENTRY)
                .expect("file credential"),
        );
        let first = CredentialManager::read_or_create_password(&entry).expect("create key");
        let mut bytes = [0u8; 32];
        hex::decode_to_slice(first.as_str(), &mut bytes).expect("32-byte key");
        let _key = token_cipher::test_key(Some(bytes));
        let mut content = ConfigMcpContent::default();
        content.set_enabled(true);
        let token = content.ensure_token().to_string();
        let config_path = temp.path().join("config_mcp.json");
        std::fs::write(
            &config_path,
            serde_json::to_vec(&content).expect("serialize"),
        )
        .expect("save config");
        let second = CredentialManager::read_or_create_password(&entry).expect("reload key");
        assert_eq!(*first, *second);
        let loaded: ConfigMcpContent =
            serde_json::from_slice(&std::fs::read(config_path).expect("read config"))
                .expect("load config");
        assert!(*loaded.enabled());
        assert_eq!(loaded.bearer_token().as_deref(), Some(token.as_str()));
    }
}
