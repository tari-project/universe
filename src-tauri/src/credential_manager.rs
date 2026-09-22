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

//! Storage of wallet seed material in the platform credential store.
//!
//! A keyring entry is frequently the *only* copy of a seed on the machine, so nothing here may
//! destroy one unless a replacement has been written and proven readable. The store is reached
//! through a [`KeyringBackend`] trait so that protocol can be tested against an in-memory fake;
//! the production backend ([`SystemKeyring`]) is a thin wrapper over the `keyring` crate.

use crate::APPLICATION_FOLDER_ID;
use crate::LOG_TARGET_APP_LOGIC;
use crate::configs::config_wallet::WalletId;
use keyring::{Entry, Error as KeyringError};
use serde::{Deserialize, Serialize};
use std::fmt::Debug;
use std::fs::OpenOptions;
use std::io::{self, Read};
use std::path::PathBuf;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, LazyLock};
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
    /// The write went through but reading it back did not return the bytes we wrote. The previous
    /// value, if there was one, has been put back. Never carries the blob or the id's contents.
    #[error("Keyring write could not be verified for: {0}")]
    WriteNotVerified(String),
    /// An entry already exists under this id and the store would not hand it over, so nothing
    /// can prove what overwriting it would destroy. The write was refused and the entry is
    /// untouched.
    #[error("An unreadable credential already exists for: {0}")]
    PreviousUnreadable(String),
}

const FALLBACK_FILE_PATH: &str = "credentials_backup.bin";
/// Username stem of every wallet credential this app has ever written, on every platform.
/// Frozen history: `internal_wallet.rs` reads the pre-migration entry built from it directly.
pub(crate) const KEYCHAIN_USERNAME: &str = "inner_wallet_credentials";

/// Constant log/Sentry strings for the write protocol. Enum-like, never interpolated.
const LOG_KEYRING_OVERWRITE_REFUSED: &str = "wallet.keyring_overwrite_refused";
const LOG_KEYRING_WRITE_UNVERIFIED: &str = "wallet.keyring_write_unverified";
const LOG_KEYRING_PREVIOUS_RESTORED: &str = "wallet.keyring_previous_restored";
const LOG_KEYRING_PREVIOUS_LOST: &str = "wallet.keyring_previous_lost";
const LOG_KEYRING_WRITE_REFUSED: &str = "wallet.keyring_write_refused";

/// Scratch id suffix used to test whether the store accepts writes at all. Entries carrying it
/// hold a constant, never a secret, and are removed again immediately; "find my wallets" skips
/// them.
pub const WRITE_PROBE_SUFFIX: &str = ".write_probe";
const WRITE_PROBE_VALUE: &[u8] = b"tari-universe-write-probe";

/// Result of asking the platform to list the app's credentials.
///
/// `Unsupported` is a first-class answer, not an error: Linux secret-service has no portable
/// search in this build, so "find my wallets" has to be able to say so without failing.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum KeyringListing {
    /// Usernames (not target names) of every entry that carried the requested prefix.
    ///
    /// Only Windows and macOS can produce this; on other platforms the variant exists so callers
    /// and tests have one shape to handle, which is what the `allow` below is for.
    #[cfg_attr(not(any(target_os = "windows", target_os = "macos")), allow(dead_code))]
    Entries(Vec<String>),
    /// This platform cannot enumerate its credential store from here.
    Unsupported,
}

/// What step 1 of the write protocol found under the id it is about to write.
#[derive(Debug)]
enum PreviousCredential {
    /// An entry exists and these are its bytes. It can be restored if the write goes wrong.
    Present(Vec<u8>),
    /// No entry exists. Writing cannot destroy anything.
    Absent,
    /// An entry exists and the store refused to show it. Nothing may overwrite it.
    Unknown,
}

/// Service name and username, the pair that addresses one credential.
type CredentialKey = (String, String);

/// One mutex per credential id, created on first use and kept for the life of the process.
///
/// The map is tiny and bounded by the number of wallet ids the app has ever addressed in this
/// run, so the entries are never reclaimed; a `Mutex` is 8 bytes plus the key.
static CREDENTIAL_LOCKS: LazyLock<
    std::sync::Mutex<std::collections::HashMap<CredentialKey, Arc<std::sync::Mutex<()>>>>,
> = LazyLock::new(|| std::sync::Mutex::new(std::collections::HashMap::new()));

/// The lock guarding the write protocol for one credential id.
fn credential_lock(service: &str, username: &str) -> Arc<std::sync::Mutex<()>> {
    let key = (service.to_string(), username.to_string());
    let mut locks = CREDENTIAL_LOCKS
        .lock()
        .unwrap_or_else(|poisoned| poisoned.into_inner());
    Arc::clone(locks.entry(key).or_default())
}

/// The platform credential store, behind a trait so the write protocol can be tested.
///
/// Implementations must be side-effect free on read and must map "no such entry" to
/// [`CredentialError::NoEntry`]; the write protocol distinguishes "nothing was there" from
/// "something was there but we could not read it" and treats only the first as safe.
pub trait KeyringBackend: Send + Sync + Debug {
    fn get_secret(&self, service: &str, username: &str) -> Result<Vec<u8>, CredentialError>;
    fn set_secret(
        &self,
        service: &str,
        username: &str,
        secret: &[u8],
    ) -> Result<(), CredentialError>;
    fn delete_credential(&self, service: &str, username: &str) -> Result<(), CredentialError>;
    /// Usernames of the entries of `service` whose username starts with `username_prefix`.
    fn list_usernames(
        &self,
        service: &str,
        username_prefix: &str,
    ) -> Result<KeyringListing, CredentialError>;
}

/// The production backend: the OS credential store via the `keyring` crate.
#[derive(Debug, Default)]
pub struct SystemKeyring;

impl KeyringBackend for SystemKeyring {
    fn get_secret(&self, service: &str, username: &str) -> Result<Vec<u8>, CredentialError> {
        let entry = Entry::new(service, username)?;
        match entry.get_secret() {
            Ok(secret) => Ok(secret),
            Err(_e @ KeyringError::NoEntry) => Err(CredentialError::NoEntry(username.to_string())),
            Err(e) => Err(e.into()),
        }
    }

    fn set_secret(
        &self,
        service: &str,
        username: &str,
        secret: &[u8],
    ) -> Result<(), CredentialError> {
        let entry = Entry::new(service, username)?;
        entry.set_secret(secret)?;
        Ok(())
    }

    fn delete_credential(&self, service: &str, username: &str) -> Result<(), CredentialError> {
        let entry = Entry::new(service, username)?;
        match entry.delete_credential() {
            Ok(()) => Ok(()),
            Err(_e @ KeyringError::NoEntry) => Err(CredentialError::NoEntry(username.to_string())),
            Err(e) => Err(e.into()),
        }
    }

    fn list_usernames(
        &self,
        service: &str,
        username_prefix: &str,
    ) -> Result<KeyringListing, CredentialError> {
        platform_listing::list_usernames(service, username_prefix)
    }
}

static SYSTEM_KEYRING: LazyLock<Arc<dyn KeyringBackend>> =
    LazyLock::new(|| Arc::new(SystemKeyring));

/// The process-wide production backend.
pub fn system_keyring() -> Arc<dyn KeyringBackend> {
    SYSTEM_KEYRING.clone()
}

pub struct CredentialManager {
    service_name: String,
    username: String,
    backend: Arc<dyn KeyringBackend>,
}

impl CredentialManager {
    fn new(service_name: String, username: String, backend: Arc<dyn KeyringBackend>) -> Self {
        CredentialManager {
            service_name,
            username,
            backend,
        }
    }

    pub fn new_default(id: WalletId) -> Self {
        CredentialManager::new(
            CredentialManager::default_service_name(),
            CredentialManager::username_for(&id),
            system_keyring(),
        )
    }

    /// Same addressing as [`CredentialManager::new_default`], against a caller-supplied backend.
    /// Used by the tests and by "find my wallets", which has to read entries that the config does
    /// not list.
    pub fn with_backend(id: &WalletId, backend: Arc<dyn KeyringBackend>) -> Self {
        CredentialManager::new(
            CredentialManager::default_service_name(),
            CredentialManager::username_for(id),
            backend,
        )
    }

    /// The keyring service every wallet credential of this build lives under.
    pub fn default_service_name() -> String {
        APPLICATION_FOLDER_ID.into()
    }

    /// The prefix every wallet credential username of this build and network carries. The wallet
    /// id is whatever follows it.
    pub fn username_prefix() -> String {
        format!(
            "{}_{}_",
            KEYCHAIN_USERNAME,
            Network::get_current().as_key_str()
        )
    }

    /// `inner_wallet_credentials_<network>_<id>`.
    pub fn username_for(id: &WalletId) -> String {
        format!("{}{}", CredentialManager::username_prefix(), id.as_str())
    }

    /// The wallet id encoded in a credential username, if it belongs to this build and network.
    pub fn wallet_id_from_username(username: &str) -> Option<WalletId> {
        username
            .strip_prefix(&CredentialManager::username_prefix())
            .filter(|id| !id.is_empty())
            .map(|id| WalletId::new(id.to_string()))
    }

    pub async fn set_credentials(&self, credential: &Credential) -> Result<(), CredentialError> {
        self.save_to_keyring(credential)
    }

    pub async fn get_credentials(&self) -> Result<Credential, CredentialError> {
        self.load_from_keyring()
    }

    /// True when an entry exists and is readable. Never surfaces the blob.
    pub async fn has_credentials(&self) -> Result<bool, CredentialError> {
        match self.backend.get_secret(&self.service_name, &self.username) {
            Ok(_) => Ok(true),
            Err(CredentialError::NoEntry(_)) => Ok(false),
            Err(e) => Err(e),
        }
    }

    pub fn delete_credential(&self) -> Result<(), CredentialError> {
        self.backend
            .delete_credential(&self.service_name, &self.username)
    }

    /// Write a credential without ever leaving the user without one.
    ///
    /// The whole protocol runs under a lock held for this credential id (see
    /// [`credential_lock`]). Without it two concurrent saves can both read the old value, one
    /// can verify and report success, and the other can then see a mismatch and put the old
    /// blob back - silently undoing a write its caller was told had succeeded.
    ///
    /// Protocol, in order:
    ///
    /// 1. Read whatever is stored today, as a tri-state ([`PreviousCredential`]). `Unknown` -
    ///    an entry exists and the store would not hand it over - is fatal: a backend can allow
    ///    writes while refusing reads, so overwriting would destroy a seed nothing can prove is
    ///    stored elsewhere.
    /// 2. Write the new value **under the same id**, in place. Never delete first: a delete
    ///    followed by a failed write leaves the user with no credential at all.
    /// 3. Read the entry back and compare it byte for byte with what we wrote.
    /// 4. Only a verified read-back counts as success, so at no point do both copies go missing.
    ///
    /// If a platform refuses an in-place overwrite, step 2 falls back to delete-then-write, but
    /// only *after* step 1 captured the old blob, and it writes that blob back if the retry
    /// fails. A failed verification in step 3 restores the previous value and errors.
    fn save_to_keyring(&self, credential: &Credential) -> Result<(), CredentialError> {
        let serialized = serde_cbor::to_vec(credential)?;
        let lock = credential_lock(&self.service_name, &self.username);
        // A poisoned lock means another writer panicked mid-protocol. Carry on with the entry it
        // left behind rather than refusing every later write for the life of the process; the
        // read-back verification below is what actually decides the outcome.
        let _guard = lock.lock().unwrap_or_else(|poisoned| poisoned.into_inner());

        let previous = match self.read_previous() {
            PreviousCredential::Present(previous) => Some(previous),
            PreviousCredential::Absent => None,
            PreviousCredential::Unknown => {
                log::error!(
                    target: LOG_TARGET_APP_LOGIC,
                    "{LOG_KEYRING_WRITE_REFUSED}: an entry exists that could not be read, refusing to overwrite it",
                );
                return Err(CredentialError::PreviousUnreadable(self.username.clone()));
            }
        };

        if previous.as_deref() == Some(serialized.as_slice()) {
            // Identical bytes: writing would only risk the entry for no gain.
            return Ok(());
        }

        if let Err(write_error) =
            self.backend
                .set_secret(&self.service_name, &self.username, &serialized)
        {
            let Some(previous_blob) = previous.as_deref() else {
                // Nothing was there, so nothing was lost. Report the write failure as-is.
                return Err(write_error);
            };
            // Either this platform refuses to overwrite in place, or the store is refusing every
            // write (a stopped service, a locked keychain, no logon session). Only the first case
            // may be retried as delete-then-write; in the second the delete would throw the
            // user's only seed away and the write that followed would fail too. A scratch entry
            // under a separate id - never a secret, always removed again - tells the two apart.
            if !self.store_accepts_writes() {
                log::error!(
                    target: LOG_TARGET_APP_LOGIC,
                    "{LOG_KEYRING_WRITE_REFUSED}: the credential store is refusing writes, keeping the existing entry",
                );
                return Err(write_error);
            }
            log::warn!(
                target: LOG_TARGET_APP_LOGIC,
                "{LOG_KEYRING_OVERWRITE_REFUSED}: retrying as replace",
            );
            if let Err(delete_error) = self
                .backend
                .delete_credential(&self.service_name, &self.username)
            {
                log::warn!(
                    target: LOG_TARGET_APP_LOGIC,
                    "{LOG_KEYRING_OVERWRITE_REFUSED}: entry could not be cleared for replacement",
                );
                let _unused = delete_error;
                return Err(write_error);
            }
            if let Err(retry_error) =
                self.backend
                    .set_secret(&self.service_name, &self.username, &serialized)
            {
                self.restore_previous(previous_blob);
                return Err(retry_error);
            }
        }

        match self.backend.get_secret(&self.service_name, &self.username) {
            Ok(stored) if stored == serialized => Ok(()),
            _ => {
                log::error!(
                    target: LOG_TARGET_APP_LOGIC,
                    "{LOG_KEYRING_WRITE_UNVERIFIED}: stored credential did not read back",
                );
                if let Some(previous_blob) = previous.as_deref() {
                    self.restore_previous(previous_blob);
                }
                Err(CredentialError::WriteNotVerified(self.username.clone()))
            }
        }
    }

    /// Does this store accept writes at all?
    ///
    /// Writes and removes a constant, non-secret value under a scratch id derived from this
    /// entry's. Used only to decide whether a failed overwrite may be retried as a replace: if
    /// the store refuses even this, the existing entry must be left exactly where it is.
    fn store_accepts_writes(&self) -> bool {
        let probe_username = format!("{}{WRITE_PROBE_SUFFIX}", self.username);
        match self
            .backend
            .set_secret(&self.service_name, &probe_username, WRITE_PROBE_VALUE)
        {
            Ok(()) => {
                let _unused = self
                    .backend
                    .delete_credential(&self.service_name, &probe_username);
                true
            }
            Err(_) => false,
        }
    }

    /// Step 1 of the write protocol.
    ///
    /// Three outcomes, and the difference between the last two is the whole point: "there is no
    /// entry" is safe to write over, "there is an entry and the store would not show it to us"
    /// is not.
    fn read_previous(&self) -> PreviousCredential {
        match self.backend.get_secret(&self.service_name, &self.username) {
            Ok(previous) => PreviousCredential::Present(previous),
            Err(CredentialError::NoEntry(_)) => PreviousCredential::Absent,
            Err(_) => {
                // Unreadable: a locked keychain, a stopped service, a denied prompt. The entry may
                // still hold the user's only seed, and nothing here can prove otherwise.
                log::warn!(
                    target: LOG_TARGET_APP_LOGIC,
                    "{LOG_KEYRING_WRITE_UNVERIFIED}: existing credential could not be read before writing",
                );
                PreviousCredential::Unknown
            }
        }
    }

    /// Put the old blob back after a failed write. Best effort by definition - if this fails
    /// there is nothing left to try - but it is logged loudly because it is the one situation in
    /// which this module can still lose a seed.
    fn restore_previous(&self, previous: &[u8]) {
        match self
            .backend
            .set_secret(&self.service_name, &self.username, previous)
        {
            Ok(()) => log::warn!(
                target: LOG_TARGET_APP_LOGIC,
                "{LOG_KEYRING_PREVIOUS_RESTORED}: previous credential restored after a failed write",
            ),
            Err(_) => log::error!(
                target: LOG_TARGET_APP_LOGIC,
                "{LOG_KEYRING_PREVIOUS_LOST}: previous credential could not be restored after a failed write",
            ),
        }
    }

    fn load_from_keyring(&self) -> Result<Credential, CredentialError> {
        let encoded = self
            .backend
            .get_secret(&self.service_name, &self.username)?;
        let credential: Credential = serde_cbor::from_slice(&encoded)?;
        Ok(credential)
    }
}

// =================================================================================
// PLATFORM ENUMERATION
//==================================================================================

/// Listing the app's own credentials, per platform. Only usernames are ever returned; no secret
/// is read here.
mod platform_listing {
    use super::{CredentialError, KeyringListing};

    #[cfg(target_os = "windows")]
    pub(super) fn list_usernames(
        service: &str,
        username_prefix: &str,
    ) -> Result<KeyringListing, CredentialError> {
        use std::ffi::c_void;
        use windows_sys::Win32::Foundation::ERROR_NOT_FOUND;
        use windows_sys::Win32::Security::Credentials::{
            CRED_TYPE_GENERIC, CREDENTIALW, CredEnumerateW, CredFree,
        };

        // The `keyring` crate formats the target name of a generic credential as
        // "{username}.{service}", so the username prefix is a real prefix of the target name and
        // the trailing `*` that `CredEnumerateW` supports is enough. If a future keyring release
        // flips the order this filter matches nothing and the search reports an empty list.
        let filter: Vec<u16> = format!("{username_prefix}*")
            .encode_utf16()
            .chain(std::iter::once(0))
            .collect();
        let suffix = format!(".{service}");

        let mut count: u32 = 0;
        let mut credentials: *mut *mut CREDENTIALW = std::ptr::null_mut();
        // SAFETY: `filter` is a NUL-terminated UTF-16 buffer that outlives the call; `count` and
        // `credentials` are only read after the call reports success.
        let ok = unsafe { CredEnumerateW(filter.as_ptr(), 0, &mut count, &mut credentials) };
        if ok == 0 {
            // SAFETY: no arguments, no state.
            let last_error = unsafe { windows_sys::Win32::Foundation::GetLastError() };
            if last_error == ERROR_NOT_FOUND {
                // No credential matches the filter. That is an answer, not a failure.
                return Ok(KeyringListing::Entries(Vec::new()));
            }
            return Ok(KeyringListing::Unsupported);
        }

        let mut usernames = Vec::new();
        for index in 0..count as usize {
            // SAFETY: the call above reported `count` valid pointers in `credentials`.
            let credential = unsafe { &**credentials.add(index) };
            if credential.Type != CRED_TYPE_GENERIC || credential.TargetName.is_null() {
                continue;
            }
            // SAFETY: `TargetName` is a NUL-terminated wide string owned by the credential.
            let target_name = unsafe { wide_to_string(credential.TargetName) };
            if let Some(username) = target_name.strip_suffix(&suffix)
                && username.starts_with(username_prefix)
            {
                usernames.push(username.to_string());
            }
        }
        // SAFETY: `credentials` was allocated by `CredEnumerateW` and is not used afterwards.
        unsafe { CredFree(credentials as *mut c_void) };
        Ok(KeyringListing::Entries(usernames))
    }

    #[cfg(target_os = "windows")]
    unsafe fn wide_to_string(pointer: *const u16) -> String {
        let mut length = 0usize;
        // SAFETY: the caller guarantees a NUL-terminated buffer.
        while unsafe { *pointer.add(length) } != 0 {
            length += 1;
        }
        // SAFETY: `length` stops at the NUL terminator.
        let slice = unsafe { std::slice::from_raw_parts(pointer, length) };
        String::from_utf16_lossy(slice)
    }

    #[cfg(target_os = "macos")]
    pub(super) fn list_usernames(
        service: &str,
        username_prefix: &str,
    ) -> Result<KeyringListing, CredentialError> {
        use core_foundation_sys::array::{
            CFArrayGetCount, CFArrayGetTypeID, CFArrayGetValueAtIndex, CFArrayRef,
        };
        use core_foundation_sys::base::{CFGetTypeID, CFRelease, CFTypeRef, kCFAllocatorDefault};
        use core_foundation_sys::dictionary::{
            CFDictionaryCreate, CFDictionaryGetTypeID, CFDictionaryGetValue, CFDictionaryRef,
            kCFTypeDictionaryKeyCallBacks, kCFTypeDictionaryValueCallBacks,
        };
        use core_foundation_sys::number::kCFBooleanTrue;
        use core_foundation_sys::string::{CFStringGetTypeID, CFStringRef};
        use std::ffi::c_void;

        /// `errSecItemNotFound`: the query is valid, nothing matched.
        const ERR_SEC_ITEM_NOT_FOUND: i32 = -25300;

        #[link(name = "Security", kind = "framework")]
        unsafe extern "C" {
            static kSecClass: CFStringRef;
            static kSecClassGenericPassword: CFStringRef;
            static kSecAttrService: CFStringRef;
            static kSecAttrAccount: CFStringRef;
            static kSecMatchLimit: CFStringRef;
            static kSecMatchLimitAll: CFStringRef;
            static kSecReturnAttributes: CFStringRef;
            fn SecItemCopyMatching(query: CFDictionaryRef, result: *mut CFTypeRef) -> i32;
        }

        // SAFETY: every pointer below is either a CoreFoundation constant or an object this
        // function created and releases itself. `kSecReturnAttributes` without `kSecReturnData`
        // means the keychain hands back attributes only: no secret is read, so this cannot
        // trigger the "allow access to your secret" prompt.
        unsafe {
            let Some(service_string) = cf_string(service) else {
                return Ok(KeyringListing::Unsupported);
            };
            let keys: [*const c_void; 4] = [
                kSecClass as *const c_void,
                kSecAttrService as *const c_void,
                kSecMatchLimit as *const c_void,
                kSecReturnAttributes as *const c_void,
            ];
            let values: [*const c_void; 4] = [
                kSecClassGenericPassword as *const c_void,
                service_string as *const c_void,
                kSecMatchLimitAll as *const c_void,
                kCFBooleanTrue as *const c_void,
            ];
            let query = CFDictionaryCreate(
                kCFAllocatorDefault,
                keys.as_ptr(),
                values.as_ptr(),
                keys.len() as isize,
                &kCFTypeDictionaryKeyCallBacks,
                &kCFTypeDictionaryValueCallBacks,
            );
            CFRelease(service_string as CFTypeRef);
            if query.is_null() {
                return Ok(KeyringListing::Unsupported);
            }

            let mut result: CFTypeRef = std::ptr::null();
            let status = SecItemCopyMatching(query, &mut result);
            CFRelease(query as CFTypeRef);

            if status == ERR_SEC_ITEM_NOT_FOUND {
                return Ok(KeyringListing::Entries(Vec::new()));
            }
            if status != 0 || result.is_null() {
                return Ok(KeyringListing::Unsupported);
            }

            // `kSecMatchLimitAll` is documented to return a CFArray of CFDictionaries, but the
            // cast is what decides whether the loop below walks a real array or arbitrary memory,
            // so it is checked rather than assumed. A result of any other shape is reported as
            // "cannot enumerate", which is the fail-closed answer.
            if CFGetTypeID(result) != CFArrayGetTypeID() {
                CFRelease(result);
                return Ok(KeyringListing::Unsupported);
            }
            let mut usernames = Vec::new();
            let array = result as CFArrayRef;
            for index in 0..CFArrayGetCount(array) {
                let entry = CFArrayGetValueAtIndex(array, index);
                if entry.is_null() || CFGetTypeID(entry as CFTypeRef) != CFDictionaryGetTypeID() {
                    continue;
                }
                let entry = entry as CFDictionaryRef;
                let account = CFDictionaryGetValue(entry, kSecAttrAccount as *const c_void);
                if account.is_null() || CFGetTypeID(account as CFTypeRef) != CFStringGetTypeID() {
                    continue;
                }
                if let Some(username) = cf_string_to_rust(account as CFStringRef)
                    && username.starts_with(username_prefix)
                {
                    usernames.push(username);
                }
            }
            CFRelease(result);
            Ok(KeyringListing::Entries(usernames))
        }
    }

    #[cfg(target_os = "macos")]
    unsafe fn cf_string(value: &str) -> Option<core_foundation_sys::string::CFStringRef> {
        use core_foundation_sys::base::kCFAllocatorDefault;
        use core_foundation_sys::string::{CFStringCreateWithBytes, kCFStringEncodingUTF8};

        // SAFETY: `value` outlives the call and CoreFoundation copies the bytes.
        let string = unsafe {
            CFStringCreateWithBytes(
                kCFAllocatorDefault,
                value.as_ptr(),
                value.len() as isize,
                kCFStringEncodingUTF8,
                0,
            )
        };
        if string.is_null() { None } else { Some(string) }
    }

    #[cfg(target_os = "macos")]
    unsafe fn cf_string_to_rust(value: core_foundation_sys::string::CFStringRef) -> Option<String> {
        use core_foundation_sys::string::{
            CFStringGetCString, CFStringGetLength, kCFStringEncodingUTF8,
        };

        // SAFETY: `value` is a live CFString owned by the caller.
        let length = unsafe { CFStringGetLength(value) };
        // Worst case for UTF-8 is 4 bytes per UTF-16 unit, plus the NUL.
        let capacity = (length * 4 + 1) as usize;
        let mut buffer = vec![0i8; capacity];
        // SAFETY: `buffer` has `capacity` writable bytes.
        let ok = unsafe {
            CFStringGetCString(
                value,
                buffer.as_mut_ptr(),
                capacity as isize,
                kCFStringEncodingUTF8,
            )
        };
        if ok == 0 {
            return None;
        }
        let bytes: Vec<u8> = buffer
            .iter()
            .take_while(|byte| **byte != 0)
            .map(|byte| *byte as u8)
            .collect();
        String::from_utf8(bytes).ok()
    }

    /// Linux (secret-service) and everything else: no portable search in this build. "Find my
    /// wallets" reports this as unsupported rather than as a failure.
    #[cfg(not(any(target_os = "windows", target_os = "macos")))]
    pub(super) fn list_usernames(
        _service: &str,
        _username_prefix: &str,
    ) -> Result<KeyringListing, CredentialError> {
        Ok(KeyringListing::Unsupported)
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

// =================================================================================
// TEST SUPPORT
//==================================================================================

/// An in-memory keyring with switchable failure modes.
///
/// Lives outside `mod tests` so the wallet-recovery tests can use it too. It is the only way to
/// exercise the write protocol: the real store cannot be made to fail on demand, and the failure
/// modes that matter (a write that is refused, a write that does not read back) are exactly the
/// ones that cost users their seeds.
#[cfg(test)]
#[derive(Debug, Default)]
pub(crate) struct FakeKeyring {
    entries: std::sync::Mutex<std::collections::HashMap<(String, String), Vec<u8>>>,
    /// Every `set_secret` fails.
    pub fail_writes: AtomicBool,
    /// Only an overwrite of an existing entry fails, as a platform that refuses in-place writes
    /// would behave. A write after a delete succeeds.
    pub refuse_in_place_overwrite: AtomicBool,
    /// How many of the next writes are accepted but store different bytes, so that the read-back
    /// verification fails. Counted rather than a flag so a test can corrupt the write under test
    /// and still let the restore that follows it through.
    pub corrupt_writes: std::sync::atomic::AtomicUsize,
    /// Reads fail with a platform error rather than `NoEntry`.
    pub fail_reads: AtomicBool,
    /// `list_usernames` reports the platform cannot enumerate.
    pub listing_unsupported: AtomicBool,
}

#[cfg(test)]
impl FakeKeyring {
    pub(crate) fn new() -> Self {
        Self::default()
    }

    pub(crate) fn insert(&self, service: &str, username: &str, secret: Vec<u8>) {
        self.entries
            .lock()
            .expect("fake keyring poisoned")
            .insert((service.to_string(), username.to_string()), secret);
    }

    pub(crate) fn raw(&self, service: &str, username: &str) -> Option<Vec<u8>> {
        self.entries
            .lock()
            .expect("fake keyring poisoned")
            .get(&(service.to_string(), username.to_string()))
            .cloned()
    }
}

#[cfg(test)]
impl KeyringBackend for FakeKeyring {
    fn get_secret(&self, service: &str, username: &str) -> Result<Vec<u8>, CredentialError> {
        if self.fail_reads.load(Ordering::SeqCst) {
            return Err(CredentialError::Keyring(KeyringError::PlatformFailure(
                "fake read failure".into(),
            )));
        }
        self.raw(service, username)
            .ok_or_else(|| CredentialError::NoEntry(username.to_string()))
    }

    fn set_secret(
        &self,
        service: &str,
        username: &str,
        secret: &[u8],
    ) -> Result<(), CredentialError> {
        let exists = self.raw(service, username).is_some();
        if self.fail_writes.load(Ordering::SeqCst)
            || (exists && self.refuse_in_place_overwrite.load(Ordering::SeqCst))
        {
            return Err(CredentialError::Keyring(KeyringError::PlatformFailure(
                "fake write failure".into(),
            )));
        }
        let stored = if self
            .corrupt_writes
            .fetch_update(Ordering::SeqCst, Ordering::SeqCst, |remaining| {
                remaining.checked_sub(1)
            })
            .is_ok()
        {
            let mut corrupted = secret.to_vec();
            corrupted.push(0xff);
            corrupted
        } else {
            secret.to_vec()
        };
        self.insert(service, username, stored);
        Ok(())
    }

    fn delete_credential(&self, service: &str, username: &str) -> Result<(), CredentialError> {
        self.entries
            .lock()
            .expect("fake keyring poisoned")
            .remove(&(service.to_string(), username.to_string()))
            .map(|_| ())
            .ok_or_else(|| CredentialError::NoEntry(username.to_string()))
    }

    fn list_usernames(
        &self,
        service: &str,
        username_prefix: &str,
    ) -> Result<KeyringListing, CredentialError> {
        if self.listing_unsupported.load(Ordering::SeqCst) {
            return Ok(KeyringListing::Unsupported);
        }
        let mut usernames: Vec<String> = self
            .entries
            .lock()
            .expect("fake keyring poisoned")
            .keys()
            .filter(|(entry_service, username)| {
                entry_service == service && username.starts_with(username_prefix)
            })
            .map(|(_, username)| username.clone())
            .collect();
        usernames.sort();
        Ok(KeyringListing::Entries(usernames))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    const SERVICE: &str = "com.tari.universe.test";
    const USERNAME: &str = "inner_wallet_credentials_testnet_abc123";

    fn manager(backend: Arc<dyn KeyringBackend>) -> CredentialManager {
        CredentialManager::new(SERVICE.to_string(), USERNAME.to_string(), backend)
    }

    fn credential(byte: u8) -> Credential {
        Credential {
            encrypted_seed: vec![byte; 16],
        }
    }

    fn stored_credential(keyring: &FakeKeyring) -> Option<Credential> {
        keyring
            .raw(SERVICE, USERNAME)
            .and_then(|bytes| serde_cbor::from_slice(&bytes).ok())
    }

    #[test]
    fn write_into_an_empty_store_is_verified_and_kept() {
        let keyring = Arc::new(FakeKeyring::new());
        manager(keyring.clone())
            .save_to_keyring(&credential(1))
            .expect("first write should succeed");

        assert_eq!(
            stored_credential(&keyring).map(|c| c.encrypted_seed),
            Some(vec![1u8; 16])
        );
    }

    #[test]
    fn overwrite_happens_in_place_without_deleting_first() {
        let keyring = Arc::new(FakeKeyring::new());
        let manager = manager(keyring.clone());
        manager
            .save_to_keyring(&credential(1))
            .expect("first write");
        // This backend accepts deletes, so a delete-then-write would also pass; the assertion
        // below is the stronger one, that the value is simply replaced.
        manager
            .save_to_keyring(&credential(2))
            .expect("in-place overwrite");

        assert_eq!(
            stored_credential(&keyring).map(|c| c.encrypted_seed),
            Some(vec![2u8; 16])
        );
    }

    #[test]
    fn a_failed_write_leaves_the_previous_credential_readable() {
        let keyring = Arc::new(FakeKeyring::new());
        let manager = manager(keyring.clone());
        manager
            .save_to_keyring(&credential(1))
            .expect("first write");

        // A store that refuses every write: the old entry must not be deleted in the hope that a
        // retry will succeed.
        keyring.fail_writes.store(true, Ordering::SeqCst);
        let error = manager
            .save_to_keyring(&credential(2))
            .expect_err("the write must fail");
        assert!(matches!(error, CredentialError::Keyring(_)));

        // The whole point of the protocol: the old seed is still there.
        assert_eq!(
            stored_credential(&keyring).map(|c| c.encrypted_seed),
            Some(vec![1u8; 16])
        );
    }

    #[test]
    fn a_failed_first_write_reports_the_error_and_stores_nothing() {
        let keyring = Arc::new(FakeKeyring::new());
        keyring.fail_writes.store(true, Ordering::SeqCst);

        manager(keyring.clone())
            .save_to_keyring(&credential(1))
            .expect_err("the write must fail");
        assert!(keyring.raw(SERVICE, USERNAME).is_none());
    }

    #[test]
    fn an_in_place_refusal_falls_back_to_replace_and_keeps_the_value() {
        let keyring = Arc::new(FakeKeyring::new());
        let manager = manager(keyring.clone());
        manager
            .save_to_keyring(&credential(1))
            .expect("first write");

        keyring
            .refuse_in_place_overwrite
            .store(true, Ordering::SeqCst);
        manager
            .save_to_keyring(&credential(2))
            .expect("replace fallback should succeed");

        assert_eq!(
            stored_credential(&keyring).map(|c| c.encrypted_seed),
            Some(vec![2u8; 16])
        );
    }

    #[test]
    fn a_replace_that_fails_after_the_delete_restores_the_previous_value() {
        let keyring = Arc::new(FakeKeyring::new());
        manager(keyring.clone())
            .save_to_keyring(&credential(1))
            .expect("first write");

        // Every write of the *new* value fails, both in place and after the delete. The protocol
        // has to come out of that with the old seed still in the store.
        let previous_bytes = serde_cbor::to_vec(&credential(1)).expect("serialize");
        let failing = FailAfterDelete {
            inner: keyring.clone(),
            allow_only: previous_bytes,
        };
        let failing_manager =
            CredentialManager::new(SERVICE.to_string(), USERNAME.to_string(), Arc::new(failing));
        failing_manager
            .save_to_keyring(&credential(2))
            .expect_err("the retry must fail");

        assert_eq!(
            stored_credential(&keyring).map(|c| c.encrypted_seed),
            Some(vec![1u8; 16]),
            "the previous credential must be restored after a failed replace"
        );
    }

    #[test]
    fn an_unverifiable_write_errors_and_restores_the_previous_value() {
        let keyring = Arc::new(FakeKeyring::new());
        let manager = manager(keyring.clone());
        manager
            .save_to_keyring(&credential(1))
            .expect("first write");

        // Corrupt the write under test only; the restore that follows it goes through cleanly.
        keyring.corrupt_writes.store(1, Ordering::SeqCst);
        let error = manager
            .save_to_keyring(&credential(2))
            .expect_err("an unverifiable write must fail");
        assert!(matches!(error, CredentialError::WriteNotVerified(_)));

        // The restore is written through the same backend, so the old value is back.
        assert_eq!(
            stored_credential(&keyring).map(|c| c.encrypted_seed),
            Some(vec![1u8; 16])
        );
    }

    /// A store that accepts writes while refusing reads must not be able to blow away a seed.
    #[test]
    fn a_write_is_refused_while_the_existing_entry_cannot_be_read() {
        let keyring = Arc::new(FakeKeyring::new());
        let manager = manager(keyring.clone());
        manager
            .save_to_keyring(&credential(1))
            .expect("first write");

        // Reads denied, writes still accepted: the entry is there and nothing can prove what
        // overwriting it would destroy.
        keyring.fail_reads.store(true, Ordering::SeqCst);
        let error = manager
            .save_to_keyring(&credential(2))
            .expect_err("an unreadable entry must not be overwritten");
        assert!(
            matches!(error, CredentialError::PreviousUnreadable(_)),
            "{error:?}"
        );

        keyring.fail_reads.store(false, Ordering::SeqCst);
        assert_eq!(
            stored_credential(&keyring).map(|c| c.encrypted_seed),
            Some(vec![1u8; 16]),
            "the original seed is untouched"
        );
    }

    #[test]
    fn concurrent_writes_to_one_id_do_not_undo_each_other() {
        let keyring = Arc::new(FakeKeyring::new());
        manager(keyring.clone())
            .save_to_keyring(&credential(1))
            .expect("first write");

        let handles: Vec<_> = (2u8..10)
            .map(|value| {
                let backend: Arc<dyn KeyringBackend> = keyring.clone();
                std::thread::spawn(move || manager(backend).save_to_keyring(&credential(value)))
            })
            .collect();
        for handle in handles {
            handle.join().expect("thread").expect("write");
        }

        // Whichever write landed last, the entry holds exactly one of the values written and
        // never the superseded one: no writer may restore the old blob over a peer's success.
        let stored = stored_credential(&keyring)
            .map(|c| c.encrypted_seed)
            .expect("an entry");
        assert_eq!(stored.len(), 16);
        assert!(
            (2u8..10).contains(&stored[0]),
            "unexpected value {stored:?}"
        );
    }

    #[test]
    fn an_unreadable_existing_entry_is_never_deleted() {
        let keyring = Arc::new(FakeKeyring::new());
        let manager = manager(keyring.clone());
        manager
            .save_to_keyring(&credential(1))
            .expect("first write");

        // The store holds something we cannot read (locked keychain, denied prompt). The write
        // may fail, but the entry must survive.
        keyring.fail_reads.store(true, Ordering::SeqCst);
        keyring
            .refuse_in_place_overwrite
            .store(true, Ordering::SeqCst);
        manager
            .save_to_keyring(&credential(2))
            .expect_err("the write must fail");

        keyring.fail_reads.store(false, Ordering::SeqCst);
        assert_eq!(
            stored_credential(&keyring).map(|c| c.encrypted_seed),
            Some(vec![1u8; 16])
        );
    }

    #[test]
    fn writing_identical_bytes_does_not_touch_the_store() {
        let keyring = Arc::new(FakeKeyring::new());
        let manager = manager(keyring.clone());
        manager
            .save_to_keyring(&credential(1))
            .expect("first write");

        keyring.fail_writes.store(true, Ordering::SeqCst);
        manager
            .save_to_keyring(&credential(1))
            .expect("an identical write is a no-op");
        assert_eq!(
            stored_credential(&keyring).map(|c| c.encrypted_seed),
            Some(vec![1u8; 16])
        );
    }

    #[test]
    fn usernames_round_trip_through_wallet_ids() {
        let id = WalletId::new("abc123".to_string());
        let username = CredentialManager::username_for(&id);
        assert!(username.starts_with(&CredentialManager::username_prefix()));
        assert_eq!(
            CredentialManager::wallet_id_from_username(&username),
            Some(id)
        );
        assert_eq!(
            CredentialManager::wallet_id_from_username("something_else"),
            None
        );
        assert_eq!(
            CredentialManager::wallet_id_from_username(&CredentialManager::username_prefix()),
            None,
            "an empty id is not a wallet"
        );
    }

    #[test]
    fn listing_filters_by_service_and_prefix() {
        let keyring = FakeKeyring::new();
        keyring.insert(SERVICE, "inner_wallet_credentials_testnet_a", vec![1]);
        keyring.insert(SERVICE, "inner_wallet_credentials_testnet_b", vec![2]);
        keyring.insert(SERVICE, "something_else", vec![3]);
        keyring.insert(
            "other.service",
            "inner_wallet_credentials_testnet_c",
            vec![4],
        );

        let listing = keyring
            .list_usernames(SERVICE, "inner_wallet_credentials_testnet_")
            .expect("listing");
        assert_eq!(
            listing,
            KeyringListing::Entries(vec![
                "inner_wallet_credentials_testnet_a".to_string(),
                "inner_wallet_credentials_testnet_b".to_string(),
            ])
        );
    }

    /// A backend that accepts deletes and reads but refuses every write except one exact blob:
    /// the restore of the previous value. Reproduces "the new value can never be written".
    #[derive(Debug)]
    struct FailAfterDelete {
        inner: Arc<FakeKeyring>,
        allow_only: Vec<u8>,
    }

    impl KeyringBackend for FailAfterDelete {
        fn get_secret(&self, service: &str, username: &str) -> Result<Vec<u8>, CredentialError> {
            self.inner.get_secret(service, username)
        }

        fn set_secret(
            &self,
            service: &str,
            username: &str,
            secret: &[u8],
        ) -> Result<(), CredentialError> {
            if secret == self.allow_only.as_slice() {
                return self.inner.set_secret(service, username, secret);
            }
            Err(CredentialError::Keyring(KeyringError::PlatformFailure(
                "fake write failure".into(),
            )))
        }

        fn delete_credential(&self, service: &str, username: &str) -> Result<(), CredentialError> {
            self.inner.delete_credential(service, username)
        }

        fn list_usernames(
            &self,
            service: &str,
            username_prefix: &str,
        ) -> Result<KeyringListing, CredentialError> {
            self.inner.list_usernames(service, username_prefix)
        }
    }
}
