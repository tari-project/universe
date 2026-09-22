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

//! "Find my wallets": list the wallet seeds this machine's credential store still holds and let
//! the user re-link one.
//!
//! The self-service recovery for a seed that is still in the keyring under an id nothing points
//! at, because the config was lost, recreated, or because an import pushed the previous wallet
//! out of view. The config knows one wallet; the store may hold several.
//!
//! What leaves this module: a wallet id, the first 8 characters of the derived Tari address, and
//! whether the config lists it. Never a seed, never a blob, never a view key.

use std::sync::Arc;

use anyhow::anyhow;
use serde::Serialize;
use tari_common_types::seeds::cipher_seed::{
    CIPHER_SEED_BIRTHDAY_BYTES, CIPHER_SEED_CHECKSUM_BYTES, CIPHER_SEED_ENTROPY_BYTES,
    CIPHER_SEED_MAC_BYTES, CIPHER_SEED_MAIN_SALT_BYTES, CipherSeed,
};
use tari_utilities::SafePassword;
use tauri::AppHandle;

use crate::LOG_TARGET_APP_LOGIC;
use crate::configs::config_wallet::{ConfigWallet, ConfigWalletContent, WalletId};
use crate::configs::trait_config::ConfigImpl;
use crate::credential_manager::{
    CredentialManager, KeyringBackend, KeyringListing, WRITE_PROBE_SUFFIX, system_keyring,
};
use crate::internal_wallet::{InternalWallet, MONERO_WALLET_ID_LEGACY, tari_seed_candidates};
use crate::pin::PinManager;

/// How many characters of the address the frontend gets. Enough to recognise a wallet, useless
/// for anything else.
const ADDRESS_PREFIX_LEN: usize = 8;

/// What could be established about one credential in the store.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "snake_case")]
pub enum FoundWalletStatus {
    /// The seed was read and its address derived.
    Readable,
    /// The entry exists and holds an enciphered seed, but no PIN opened it. The wallet is there;
    /// the user needs the right PIN to see which one it is.
    PinRequired,
    /// The entry exists but could not be turned into a wallet: the store would not hand it over
    /// (locked keychain, denied prompt, stopped service), or what it held is not a seed at all.
    Unreadable,
}

impl FoundWalletStatus {
    /// Enum-like tag value, safe for a log line.
    pub fn as_tag(self) -> &'static str {
        match self {
            FoundWalletStatus::Readable => "readable",
            FoundWalletStatus::PinRequired => "pin_required",
            FoundWalletStatus::Unreadable => "unreadable",
        }
    }
}

/// One wallet credential, as the frontend sees it.
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "snake_case")]
pub struct FoundWallet {
    pub wallet_id: String,
    /// First [`ADDRESS_PREFIX_LEN`] characters of the derived Tari address; `None` unless the
    /// status is `Readable`.
    pub address_prefix: Option<String>,
    /// Whether the wallet config already lists this id.
    pub is_linked: bool,
    /// Whether this is the wallet the app is currently using.
    pub is_active: bool,
    pub status: FoundWalletStatus,
}

/// The answer to "find my wallets".
///
/// `Unsupported` is a result, not an error: Linux has no portable credential search in this
/// build and the user is owed a clear answer rather than a failed command.
#[derive(Debug, Clone, Serialize)]
#[serde(tag = "kind", rename_all = "snake_case")]
pub enum FindWalletsResult {
    Found { wallets: Vec<FoundWallet> },
    Unsupported { platform: String },
}

/// Is this id one of the app's own bookkeeping entries rather than a Tari wallet?
///
/// Monero seeds live under `monero`, `monero_2`, ... and are raw seeds with no Tari address, and
/// the write probe of the credential write protocol is a constant, not a secret.
fn is_tari_wallet_id(wallet_id: &WalletId) -> bool {
    let id = wallet_id.as_str();
    !id.contains(WRITE_PROBE_SUFFIX)
        && id != MONERO_WALLET_ID_LEGACY
        && !id.starts_with(&format!("{MONERO_WALLET_ID_LEGACY}_"))
}

/// Enumerate the app's credentials and describe each one.
///
/// Takes its backend and its context as parameters so the whole thing can be exercised against
/// an in-memory store; the Tauri command below supplies the real ones.
pub async fn find_wallets_with(
    backend: Arc<dyn KeyringBackend>,
    linked: &[WalletId],
    active: Option<&WalletId>,
    pin_password: Option<SafePassword>,
) -> FindWalletsResult {
    let service = CredentialManager::default_service_name();
    let prefix = CredentialManager::username_prefix();

    let usernames = match backend.list_usernames(&service, &prefix) {
        Ok(KeyringListing::Entries(usernames)) => usernames,
        Ok(KeyringListing::Unsupported) => {
            log::info!(
                target: LOG_TARGET_APP_LOGIC,
                "[find_my_wallets] the credential store cannot be enumerated on this platform",
            );
            return FindWalletsResult::Unsupported {
                platform: std::env::consts::OS.to_string(),
            };
        }
        Err(e) => {
            // A store that exists and refused: a locked keychain, a stopped service, a denied
            // prompt. The error carries the platform status code and nothing else, and that code
            // is the one thing a support bundle needs to tell these apart.
            log::warn!(
                target: LOG_TARGET_APP_LOGIC,
                "[find_my_wallets] the credential store could not be enumerated: {e}",
            );
            return FindWalletsResult::Unsupported {
                platform: std::env::consts::OS.to_string(),
            };
        }
    };

    let mut wallets = Vec::new();
    for username in usernames {
        let Some(wallet_id) = CredentialManager::wallet_id_from_username(&username) else {
            continue;
        };
        if !is_tari_wallet_id(&wallet_id) {
            continue;
        }

        let (status, address_prefix) =
            describe_wallet(backend.clone(), &wallet_id, pin_password.clone()).await;
        log::info!(
            target: LOG_TARGET_APP_LOGIC,
            "[find_my_wallets] wallet_id={} status={}",
            wallet_id.as_str(),
            status.as_tag(),
        );
        wallets.push(FoundWallet {
            is_linked: linked.contains(&wallet_id),
            is_active: active == Some(&wallet_id),
            wallet_id: wallet_id.as_str().to_string(),
            address_prefix,
            status,
        });
    }

    wallets.sort_by(|left, right| left.wallet_id.cmp(&right.wallet_id));
    FindWalletsResult::Found { wallets }
}

/// Read one entry and derive its address, without ever returning the seed.
async fn describe_wallet(
    backend: Arc<dyn KeyringBackend>,
    wallet_id: &WalletId,
    pin_password: Option<SafePassword>,
) -> (FoundWalletStatus, Option<String>) {
    let credential = match CredentialManager::with_backend(wallet_id, backend)
        .get_credentials()
        .await
    {
        Ok(credential) => credential,
        Err(_) => return (FoundWalletStatus::Unreadable, None),
    };

    let Some(seed) = read_seed(&credential.encrypted_seed, pin_password) else {
        if is_enciphered_tari_seed(&credential.encrypted_seed) {
            return (FoundWalletStatus::PinRequired, None);
        }
        return (FoundWalletStatus::Unreadable, None);
    };

    match InternalWallet::get_tari_wallet_details(wallet_id.clone(), seed).await {
        Ok(details) => {
            let address = details.tari_address.to_base58();
            let prefix: String = address.chars().take(ADDRESS_PREFIX_LEN).collect();
            (FoundWalletStatus::Readable, Some(prefix))
        }
        Err(_) => (FoundWalletStatus::Unreadable, None),
    }
}

/// Length of a PIN-enciphered `CipherSeed`: version byte, birthday, entropy, salt, MAC and
/// checksum. Built from the crate's own constants rather than written out, so a format change
/// cannot quietly turn every entry in the store into "needs your PIN".
const ENCIPHERED_TARI_SEED_LEN: usize = 1
    + CIPHER_SEED_BIRTHDAY_BYTES
    + CIPHER_SEED_ENTROPY_BYTES
    + CIPHER_SEED_MAIN_SALT_BYTES
    + CIPHER_SEED_MAC_BYTES
    + CIPHER_SEED_CHECKSUM_BYTES;

/// Could a PIN open this blob?
///
/// Only an enciphered seed has a PIN to ask for. Offering the prompt for a blob of any other
/// length - a truncated entry, a Monero seed written under a Tari id - spends the user's real
/// lockout budget on something no PIN will ever open.
fn is_enciphered_tari_seed(blob: &[u8]) -> bool {
    blob.len() == ENCIPHERED_TARI_SEED_LEN
}

/// Decode a blob found in the store.
///
/// There is no recorded address to check a reading against - the whole point is that the config
/// does not know this wallet - so only a reading that proves itself counts: a tag-verified
/// decryption, or a plain seed that round-trips to exactly the stored bytes. A blob that merely
/// deserializes is reported as needing a PIN rather than shown under a made-up address.
fn read_seed(blob: &[u8], pin_password: Option<SafePassword>) -> Option<CipherSeed> {
    tari_seed_candidates(blob, pin_password, false)
        .into_iter()
        .find(|candidate| candidate.authenticated || candidate.proven_encoding)
        .map(|candidate| candidate.seed)
}

/// Run "find my wallets" against the real credential store.
///
/// Enumerates first, and only asks for a PIN if something in the store actually needs one. The
/// config's own `pin_locked` flag is not the question: the wallet this feature exists to find is
/// one the config has lost track of, so a recreated config with no PIN routinely sits in front of
/// a credential enciphered with the PIN the user still remembers. A dismissed prompt simply
/// leaves those entries reported as `PinRequired`.
pub async fn find_my_wallets(app_handle: &AppHandle) -> FindWalletsResult {
    let wallet_config = ConfigWallet::content().await;
    let linked = wallet_config.tari_wallets().clone();
    let active = wallet_config
        .tari_wallet_details()
        .as_ref()
        .map(|details| details.id.clone());
    drop(wallet_config);

    let backend = system_keyring();
    let found = find_wallets_with(backend.clone(), &linked, active.as_ref(), None).await;

    let FindWalletsResult::Found { ref wallets } = found else {
        return found;
    };
    if !wallets
        .iter()
        .any(|wallet| wallet.status == FoundWalletStatus::PinRequired)
    {
        return found;
    }

    let Ok(pin_password) = prompt_recovery_pin(app_handle).await else {
        return found;
    };
    let with_pin = find_wallets_with(backend, &linked, active.as_ref(), Some(pin_password)).await;
    record_recovery_pin_attempt(recovery_pin_opened_something(&found, &with_pin)).await;
    with_pin
}

/// Failed recovery PIN attempts in this process, and when the last one was. The persisted counter
/// in `config_wallet.json` is unreachable in the state that needs it most: while the config is the
/// recovery placeholder every write is refused, so every prompt would start from zero.
static RECOVERY_PIN_ATTEMPTS: std::sync::Mutex<(u32, Option<std::time::Instant>)> =
    std::sync::Mutex::new((0, None));

/// Same schedule as `PinLockerState::pin_lockout_duration`.
fn recovery_lockout_duration(attempts: u32) -> Option<std::time::Duration> {
    match attempts {
        3 => Some(std::time::Duration::from_secs(30)),
        4 => Some(std::time::Duration::from_secs(120)),
        5 => Some(std::time::Duration::from_secs(600)),
        attempts if attempts >= 6 => Some(std::time::Duration::from_secs(3600)),
        _ => None,
    }
}

/// Seconds left on the in-memory recovery lockout.
fn recovery_lockout_seconds() -> Option<u64> {
    let guard = RECOVERY_PIN_ATTEMPTS
        .lock()
        .unwrap_or_else(|poisoned| poisoned.into_inner());
    let (attempts, last) = *guard;
    let duration = recovery_lockout_duration(attempts)?;
    let elapsed = last?.elapsed();
    (elapsed < duration).then(|| (duration - elapsed).as_secs() + 1)
}

/// Ask for a PIN on a recovery path, under the same lockout as every other PIN entry. These
/// prompts decrypt an orphaned credential rather than the configured wallet, so
/// `PinManager::validate_pin` cannot check them, but they are still PIN guesses: without the
/// lockout anyone at the running app could sit on "Search again" and walk a six-digit space.
async fn prompt_recovery_pin(app_handle: &AppHandle) -> Result<SafePassword, anyhow::Error> {
    let remaining_seconds = recovery_lockout_seconds()
        .into_iter()
        .chain(PinManager::locked_out_seconds().await)
        .max();
    if let Some(remaining_seconds) = remaining_seconds {
        return Err(anyhow!(
            "Pin is locked out. Remaining seconds: {remaining_seconds}"
        ));
    }
    PinManager::prompt_pin_unvalidated(app_handle).await
}

/// Did the PIN open anything? Pure, so the accounting can be tested without a config.
fn recovery_pin_opened_something(before: &FindWalletsResult, after: &FindWalletsResult) -> bool {
    let locked = |result: &FindWalletsResult| match result {
        FindWalletsResult::Found { wallets } => wallets
            .iter()
            .filter(|wallet| wallet.status == FoundWalletStatus::PinRequired)
            .count(),
        FindWalletsResult::Unsupported { .. } => 0,
    };
    matches!(after, FindWalletsResult::Found { .. }) && locked(after) < locked(before)
}

/// Count a recovery PIN attempt against the same lockout as every other PIN entry.
///
/// Failures count; successes do not clear the counter. The store can hold wallets enciphered
/// under different historical PINs, so clearing on any success would give someone who knows one
/// PIN an unlimited oracle over the others. The in-memory mirror is updated first and
/// unconditionally, because the persisted one is refused while the config is a placeholder.
async fn record_recovery_pin_attempt(opened: bool) {
    if opened {
        return;
    }
    {
        let mut guard = RECOVERY_PIN_ATTEMPTS
            .lock()
            .unwrap_or_else(|poisoned| poisoned.into_inner());
        guard.0 = guard.0.saturating_add(1);
        guard.1 = Some(std::time::Instant::now());
    }
    if let Err(e) = PinManager::register_failed_pin_attempt().await {
        log::warn!(
            target: LOG_TARGET_APP_LOGIC,
            "[find_my_wallets] could not persist the PIN attempt, the in-memory lockout still applies: {e}",
        );
    }
}

/// Point the wallet config at a wallet the store already holds, and restart the wallet on it.
///
/// Writes nothing to the keyring: the seed is already there, and this is a recovery path, so it
/// must not be able to destroy anything. The config gains the id and the details derived from
/// the seed itself, which is also the proof that the entry really is a wallet.
pub async fn relink_tari_wallet(
    app_handle: &AppHandle,
    wallet_id: WalletId,
) -> Result<String, anyhow::Error> {
    if !is_tari_wallet_id(&wallet_id) {
        return Err(anyhow!("Not a Tari wallet id"));
    }

    let credential = CredentialManager::new_default(wallet_id.clone())
        .get_credentials()
        .await
        .map_err(|e| {
            log::error!(
                target: LOG_TARGET_APP_LOGIC,
                "[relink_tari_wallet] keyring read failed: wallet_id={}",
                wallet_id.as_str(),
            );
            anyhow!("Failed to read the wallet from the keyring: {e}")
        })?;

    // Try the entry as it stands first. Only a blob that needs a PIN is worth prompting for, and
    // whether *this* entry needs one has nothing to do with the current config's `pin_locked`
    // flag - the entry may well predate the config in front of it.
    let seed = match read_seed(&credential.encrypted_seed, None) {
        Some(seed) => seed,
        None if !is_enciphered_tari_seed(&credential.encrypted_seed) => {
            log::error!(
                target: LOG_TARGET_APP_LOGIC,
                "[relink_tari_wallet] the entry does not hold a Tari seed: wallet_id={} blob_len={}",
                wallet_id.as_str(),
                credential.encrypted_seed.len(),
            );
            return Err(anyhow!("Could not read this wallet's seed"));
        }
        None => {
            let pin_password = prompt_recovery_pin(app_handle).await?;
            let seed = read_seed(&credential.encrypted_seed, Some(pin_password));
            record_recovery_pin_attempt(seed.is_some()).await;
            seed.ok_or_else(|| {
                log::error!(
                    target: LOG_TARGET_APP_LOGIC,
                    "[relink_tari_wallet] could not read the seed: wallet_id={} blob_len={}",
                    wallet_id.as_str(),
                    credential.encrypted_seed.len(),
                );
                anyhow!("Could not read this wallet's seed")
            })?
        }
    };

    let details = InternalWallet::get_tari_wallet_details(wallet_id.clone(), seed).await?;
    let address_prefix: String = details
        .tari_address
        .to_base58()
        .chars()
        .take(ADDRESS_PREFIX_LEN)
        .collect();

    // Leaves the previously selected id in the list rather than removing it: re-linking must
    // never be the thing that loses a wallet. This is also the way out of a corrupted config, and
    // it is safe because nothing before this point wrote anything and the seed has by now been
    // read and its address derived.
    let previous = ConfigWallet::content().await;
    let was_placeholder = previous.ensure_available().is_err();
    let previous_details = previous.tari_wallet_details().clone();
    drop(previous);

    // A placeholder config has no Monero address, and `load_latest_version` refuses a config
    // without one, so the adoption carries the Monero side with it in the same save.
    let monero_wallet = InternalWallet::monero_wallet_for_adoption().await?;
    ConfigWallet::adopt_recovered_wallet((details, monero_wallet)).await?;
    // This entry was just read, so the rate-limited startup probe must stop answering with the
    // verdict recorded for the wallet being re-linked away from.
    InternalWallet::note_seed_read(&wallet_id).await;
    if let Err(e) = InternalWallet::initialize_with_seed(app_handle).await {
        // `initialize_with_seed` snapshots the config *after* this write, so its own rollback
        // cannot undo it; put the previous selection back here instead. Not when the config was
        // the recovery placeholder though: restoring that would leave a valid config listing no
        // wallet, which the next launch reads as a fresh install.
        if !was_placeholder
            && let Err(rollback) = ConfigWallet::update_field(
                ConfigWalletContent::set_tari_wallet_details,
                previous_details,
            )
            .await
        {
            log::warn!(target: LOG_TARGET_APP_LOGIC, "Could not restore the previous wallet selection after a failed re-link: {rollback}");
        }
        return Err(e);
    }

    log::info!(
        target: LOG_TARGET_APP_LOGIC,
        "{LOG_WALLET_RELINKED}: wallet_id={}",
        wallet_id.as_str(),
    );
    Ok(address_prefix)
}

/// Constant log string for a completed re-link.
const LOG_WALLET_RELINKED: &str = "wallet.relinked";

#[cfg(test)]
mod tests {
    use super::*;
    use crate::credential_manager::{Credential, CredentialError, FakeKeyring};
    use std::sync::atomic::Ordering;
    use tari_utilities::message_format::MessageFormat;

    fn store_wallet(keyring: &FakeKeyring, wallet_id: &str, blob: Vec<u8>) {
        let credential = Credential {
            encrypted_seed: blob,
        };
        keyring.insert(
            &CredentialManager::default_service_name(),
            &CredentialManager::username_for(&WalletId::new(wallet_id.to_string())),
            serde_cbor::to_vec(&credential).expect("serialize"),
        );
    }

    #[tokio::test]
    async fn every_wallet_in_the_store_is_listed_with_its_link_state() {
        let keyring = Arc::new(FakeKeyring::new());
        let plain = CipherSeed::random().to_binary().expect("serialize");
        let orphan = CipherSeed::random().to_binary().expect("serialize");
        store_wallet(&keyring, "linked1", plain);
        store_wallet(&keyring, "orphan1", orphan);
        // Neither of these is a Tari wallet and neither may appear in the list.
        store_wallet(&keyring, "monero", vec![1u8; 32]);
        store_wallet(&keyring, "monero_2", vec![2u8; 32]);
        keyring.insert(
            &CredentialManager::default_service_name(),
            &format!(
                "{}{WRITE_PROBE_SUFFIX}",
                CredentialManager::username_for(&WalletId::new("linked1".to_string()))
            ),
            b"tari-universe-write-probe".to_vec(),
        );

        let linked = vec![WalletId::new("linked1".to_string())];
        let active = WalletId::new("linked1".to_string());
        let result = find_wallets_with(keyring, &linked, Some(&active), None).await;

        let FindWalletsResult::Found { wallets } = result else {
            panic!("the fake store can be enumerated");
        };
        assert_eq!(
            wallets.len(),
            2,
            "Monero entries and the write probe are not wallets: {wallets:?}"
        );

        let linked_wallet = &wallets[0];
        assert_eq!(linked_wallet.wallet_id, "linked1");
        assert!(linked_wallet.is_linked);
        assert!(linked_wallet.is_active);
        assert_eq!(linked_wallet.status, FoundWalletStatus::Readable);
        assert_eq!(
            linked_wallet
                .address_prefix
                .as_ref()
                .map(|prefix| prefix.len()),
            Some(ADDRESS_PREFIX_LEN),
            "only a prefix of the address ever leaves the backend"
        );

        let orphan_wallet = &wallets[1];
        assert_eq!(orphan_wallet.wallet_id, "orphan1");
        assert!(
            !orphan_wallet.is_linked,
            "the orphaned seed is exactly what this feature is for"
        );
        assert!(!orphan_wallet.is_active);
        assert_eq!(orphan_wallet.status, FoundWalletStatus::Readable);
        assert_ne!(orphan_wallet.address_prefix, linked_wallet.address_prefix);
    }

    #[tokio::test]
    async fn an_enciphered_entry_is_listed_as_needing_a_pin_not_as_a_wrong_address() {
        let keyring = Arc::new(FakeKeyring::new());
        let seed = CipherSeed::random();
        let pin = SafePassword::from("123456".to_string());
        store_wallet(
            &keyring,
            "locked1",
            seed.encipher(Some(pin.clone())).expect("encipher"),
        );

        // Without the PIN: no address is invented for it.
        let result = find_wallets_with(keyring.clone(), &[], None, None).await;
        let FindWalletsResult::Found { wallets } = result else {
            panic!("enumerable");
        };
        assert_eq!(wallets.len(), 1);
        assert_eq!(wallets[0].status, FoundWalletStatus::PinRequired);
        assert_eq!(wallets[0].address_prefix, None);

        // With it, the same entry resolves.
        let result = find_wallets_with(keyring, &[], None, Some(pin)).await;
        let FindWalletsResult::Found { wallets } = result else {
            panic!("enumerable");
        };
        assert_eq!(wallets[0].status, FoundWalletStatus::Readable);
        assert!(wallets[0].address_prefix.is_some());
    }

    /// A blob that is neither a plain nor an enciphered seed can never be opened by a PIN, and
    /// listing it as "needs your PIN" walks the user into the real lockout on their own wallet.
    #[tokio::test]
    async fn a_blob_that_is_not_a_seed_is_not_reported_as_needing_a_pin() {
        let keyring = Arc::new(FakeKeyring::new());
        // A Monero seed written under a Tari id, and a truncated entry.
        store_wallet(&keyring, "corrupt1", vec![9u8; 32]);
        store_wallet(&keyring, "corrupt2", vec![9u8; 7]);

        let FindWalletsResult::Found { wallets } =
            find_wallets_with(keyring, &[], None, None).await
        else {
            panic!("enumerable");
        };
        assert_eq!(wallets.len(), 2);
        for wallet in &wallets {
            assert_eq!(
                wallet.status,
                FoundWalletStatus::Unreadable,
                "{} must not ask for a PIN",
                wallet.wallet_id
            );
        }

        // Only the enciphered length is worth a prompt.
        assert!(is_enciphered_tari_seed(&vec![
            0u8;
            ENCIPHERED_TARI_SEED_LEN
        ]));
        assert!(!is_enciphered_tari_seed(&vec![0u8; 24]));
        assert!(!is_enciphered_tari_seed(&[]));
    }

    #[tokio::test]
    async fn an_unreadable_entry_is_reported_rather_than_skipped() {
        let keyring = Arc::new(FakeKeyring::new());
        store_wallet(
            &keyring,
            "locked1",
            CipherSeed::random().to_binary().expect("serialize"),
        );
        keyring.fail_reads.store(true, Ordering::SeqCst);

        let FindWalletsResult::Found { wallets } =
            find_wallets_with(keyring, &[], None, None).await
        else {
            panic!("enumerable");
        };
        assert_eq!(wallets.len(), 1);
        assert_eq!(wallets[0].status, FoundWalletStatus::Unreadable);
        assert_eq!(wallets[0].address_prefix, None);
    }

    /// A store that exists and refused is not a platform without a store. The user still sees one
    /// message, but the status code has to reach the log, because it is the only thing that tells
    /// a locked keychain from a stopped service.
    #[tokio::test]
    async fn a_store_that_refuses_to_enumerate_reports_its_status_code() {
        let keyring = Arc::new(FakeKeyring::new());
        keyring.listing_fails.store(true, Ordering::SeqCst);

        let error = keyring
            .list_usernames(&CredentialManager::default_service_name(), "")
            .expect_err("a refusing store errors rather than answering `unsupported`");
        assert!(matches!(error, CredentialError::ListingFailed(-25308)));
        let rendered = error.to_string();
        assert!(rendered.contains("-25308"), "{rendered}");
        assert!(
            !rendered.contains("inner_wallet_credentials"),
            "the message names no entry: {rendered}"
        );

        // The user is still not shown a red toast; the list is simply empty.
        assert!(matches!(
            find_wallets_with(keyring, &[], None, None).await,
            FindWalletsResult::Unsupported { .. }
        ));
    }

    #[tokio::test]
    async fn a_store_that_cannot_be_enumerated_says_so_instead_of_failing() {
        let keyring = Arc::new(FakeKeyring::new());
        keyring.listing_unsupported.store(true, Ordering::SeqCst);

        assert!(matches!(
            find_wallets_with(keyring, &[], None, None).await,
            FindWalletsResult::Unsupported { .. }
        ));
    }

    fn result_with(statuses: &[FoundWalletStatus]) -> FindWalletsResult {
        FindWalletsResult::Found {
            wallets: statuses
                .iter()
                .enumerate()
                .map(|(index, status)| FoundWallet {
                    wallet_id: format!("w{index}"),
                    address_prefix: None,
                    is_linked: false,
                    is_active: false,
                    status: *status,
                })
                .collect(),
        }
    }

    /// A recovery PIN is still a PIN guess; a wrong one has to count towards the lockout or
    /// "Search again" becomes an unmetered oracle.
    #[test]
    fn only_a_pin_that_opened_something_counts_as_correct() {
        let locked = result_with(&[FoundWalletStatus::PinRequired, FoundWalletStatus::Readable]);
        let opened = result_with(&[FoundWalletStatus::Readable, FoundWalletStatus::Readable]);

        assert!(recovery_pin_opened_something(&locked, &opened));
        assert!(!recovery_pin_opened_something(&locked, &locked));
        assert!(!recovery_pin_opened_something(
            &locked,
            &FindWalletsResult::Unsupported {
                platform: "linux".to_string()
            }
        ));
    }

    /// The persisted counter is unreachable while the config is a recovery placeholder, which is
    /// exactly when "find my wallets" is offered, so the in-memory mirror has to hold the line on
    /// its own.
    #[test]
    fn the_recovery_lockout_schedule_matches_the_persisted_one() {
        assert_eq!(recovery_lockout_duration(0), None);
        assert_eq!(recovery_lockout_duration(2), None);
        assert_eq!(
            recovery_lockout_duration(3),
            Some(std::time::Duration::from_secs(30))
        );
        assert_eq!(
            recovery_lockout_duration(4),
            Some(std::time::Duration::from_secs(120))
        );
        assert_eq!(
            recovery_lockout_duration(5),
            Some(std::time::Duration::from_secs(600))
        );
        assert_eq!(
            recovery_lockout_duration(99),
            Some(std::time::Duration::from_secs(3600))
        );
    }

    #[test]
    fn bookkeeping_entries_are_not_wallets() {
        for id in ["monero", "monero_2", "abc123.write_probe"] {
            assert!(!is_tari_wallet_id(&WalletId::new(id.to_string())));
        }
        assert!(is_tari_wallet_id(&WalletId::new("abc123".to_string())));
    }
}
