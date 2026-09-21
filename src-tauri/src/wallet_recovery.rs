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
//! This is the self-service recovery for the states the investigation calls P7 and P8 - a wallet
//! seed that is still in the keyring under an id nothing points at, because the config was lost,
//! recreated, or because an import pushed the previous wallet out of view. The config knows one
//! wallet; the store may hold several.
//!
//! What leaves this module: a wallet id, the first 8 characters of the derived Tari address, and
//! whether the config lists it. Never a seed, never a blob, never a view key.

use std::sync::Arc;

use anyhow::anyhow;
use serde::Serialize;
use tari_common_types::seeds::cipher_seed::CipherSeed;
use tari_utilities::SafePassword;
use tauri::AppHandle;

use crate::LOG_TARGET_APP_LOGIC;
use crate::configs::config_wallet::{ConfigWallet, ConfigWalletContent, WalletId};
use crate::configs::trait_config::ConfigImpl;
use crate::credential_manager::{
    CredentialManager, KeyringBackend, KeyringListing, WRITE_PROBE_SUFFIX, system_keyring,
};
use crate::internal_wallet::{
    InternalWallet, MONERO_WALLET_ID_LEGACY, clear_wallet_recovery, tari_seed_candidates,
};
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
    /// The entry exists but the store would not hand it over (locked keychain, denied prompt,
    /// stopped service). Says nothing about the seed itself.
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
            // The platform helpers answer `Unsupported` rather than erroring, so this is a
            // genuine store failure. Still not an error to the user: an empty list with the
            // reason logged is more useful than a red toast.
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
        return (FoundWalletStatus::PinRequired, None);
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

/// Decode a blob found in the store.
///
/// Only an authenticated reading counts. There is no recorded address to check an unauthenticated
/// one against - the whole point is that the config does not know this wallet - so a blob that
/// merely deserializes is treated as "needs a PIN" rather than shown under a made-up address.
fn read_seed(blob: &[u8], pin_password: Option<SafePassword>) -> Option<CipherSeed> {
    tari_seed_candidates(blob, pin_password, false)
        .into_iter()
        .find(|candidate| candidate.authenticated)
        .map(|candidate| candidate.seed)
}

/// Run "find my wallets" against the real credential store.
///
/// Asks for a PIN first when one is set, so enciphered entries can be identified too; a dismissed
/// prompt simply means those come back as `PinRequired`.
pub async fn find_my_wallets(app_handle: &AppHandle) -> FindWalletsResult {
    let wallet_config = ConfigWallet::content().await;
    let linked = wallet_config.tari_wallets().clone();
    let active = wallet_config
        .tari_wallet_details()
        .as_ref()
        .map(|details| details.id.clone());
    drop(wallet_config);

    let pin_password = if PinManager::pin_locked().await {
        PinManager::prompt_pin_unvalidated(app_handle).await.ok()
    } else {
        None
    };

    find_wallets_with(system_keyring(), &linked, active.as_ref(), pin_password).await
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
    // A placeholder config must never be written; re-linking into one would lose the id again.
    ConfigWallet::content().await.ensure_available()?;
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

    let pin_password = if PinManager::pin_locked().await {
        Some(PinManager::prompt_pin_unvalidated(app_handle).await?)
    } else {
        None
    };
    let seed = read_seed(&credential.encrypted_seed, pin_password).ok_or_else(|| {
        log::error!(
            target: LOG_TARGET_APP_LOGIC,
            "[relink_tari_wallet] could not read the seed: wallet_id={} blob_len={}",
            wallet_id.as_str(),
            credential.encrypted_seed.len(),
        );
        anyhow!("Could not read this wallet's seed")
    })?;

    let details = InternalWallet::get_tari_wallet_details(wallet_id.clone(), seed).await?;
    let address_prefix: String = details
        .tari_address
        .to_base58()
        .chars()
        .take(ADDRESS_PREFIX_LEN)
        .collect();

    // Selects the wallet, drops any external address, and leaves the previously selected id in
    // the list rather than removing it: re-linking must never be the thing that loses a wallet.
    ConfigWallet::update_field(ConfigWalletContent::add_tari_wallet, details).await?;
    InternalWallet::initialize_with_seed(app_handle).await?;
    // The backend recovery gate is lifted here; the dialog that started this flow closes itself
    // when the command returns, so no extra event is needed.
    clear_wallet_recovery();

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
    use crate::credential_manager::{Credential, FakeKeyring};
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

    #[tokio::test]
    async fn a_store_that_cannot_be_enumerated_says_so_instead_of_failing() {
        let keyring = Arc::new(FakeKeyring::new());
        keyring.listing_unsupported.store(true, Ordering::SeqCst);

        assert!(matches!(
            find_wallets_with(keyring, &[], None, None).await,
            FindWalletsResult::Unsupported { .. }
        ));
    }

    #[test]
    fn bookkeeping_entries_are_not_wallets() {
        for id in ["monero", "monero_2", "abc123.write_probe"] {
            assert!(!is_tari_wallet_id(&WalletId::new(id.to_string())));
        }
        assert!(is_tari_wallet_id(&WalletId::new("abc123".to_string())));
    }
}
