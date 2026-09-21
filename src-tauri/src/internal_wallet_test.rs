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

//! Unit tests for internal_wallet.rs pure logic functions.
//!
//! # Test Coverage
//!
//! These tests cover pure logic that doesn't require external dependencies:
//! - TariAddressType enum Display trait and serialization
//! - InternalWallet singleton initialization state checking
//!
//! # Future Mocking Requirements
//!
//! For full coverage of InternalWallet, the following would need to be mocked:
//!
//! ## CredentialManager trait extraction
//! The CredentialManager is instantiated directly via `CredentialManager::new_default()`.
//! To mock this:
//! - Extract a trait `CredentialManagerTrait` with `get_credentials` and `set_credentials` methods
//! - Inject the credential manager as a dependency or use a factory pattern
//! - In tests, provide a mock implementation that returns test credentials
//!
//! ## ConfigWallet singleton reset
//! ConfigWallet uses a static OnceCell pattern similar to InternalWallet.
//! To enable testing:
//! - Add a `#[cfg(test)]` method to reset the singleton state between tests
//! - Or use a test-specific initialization that doesn't persist state
//!
//! ## PinManager dependency injection
//! PinManager is called statically (e.g., `PinManager::get_validated_pin_if_defined`).
//! To mock this:
//! - Extract a trait for PIN operations
//! - Pass the PIN manager as a parameter or use a global test override
//!
//! ## AppHandle mock
//! Many methods require `&tauri::AppHandle` for:
//! - Getting app config directory paths
//! - Event emission via Manager trait
//!
//! To mock this:
//! - Use tauri's test utilities: `tauri::test::mock_app()`
//! - Or extract path resolution into a separate trait that can be mocked
//!
//! ## Static INSTANCE reset
//! The InternalWallet uses a static OnceCell for singleton pattern.
//! For isolation between tests:
//! - Add `#[cfg(test)] pub fn reset_instance()` to clear the OnceCell
//! - Use serial test execution with `serial_test` crate
//! - Or refactor to use dependency injection instead of static singleton

use super::internal_wallet::{
    InternalWallet, SeedCandidate, TariAddressType, allocate_monero_wallet_id_with,
    monero_seed_candidates, next_monero_wallet_id, tari_seed_candidates, wipe_and_remove_file,
};
use std::collections::HashSet;
use tari_common_types::seeds::cipher_seed::CipherSeed;
use tari_utilities::SafePassword;
use tari_utilities::message_format::MessageFormat;

#[test]
fn tari_address_type_display_internal() {
    let addr_type = TariAddressType::Internal;
    assert_eq!(format!("{}", addr_type), "Internal");
}

#[test]
fn tari_address_type_display_external() {
    let addr_type = TariAddressType::External;
    assert_eq!(format!("{}", addr_type), "External");
}

#[test]
fn tari_address_type_serialization() {
    let internal = TariAddressType::Internal;
    let external = TariAddressType::External;

    let internal_json = serde_json::to_string(&internal).expect("Failed to serialize Internal");
    let external_json = serde_json::to_string(&external).expect("Failed to serialize External");

    assert_eq!(internal_json, "\"Internal\"");
    assert_eq!(external_json, "\"External\"");
}

#[test]
fn tari_address_type_into_u8() {
    let internal: u8 = TariAddressType::Internal.into();
    let external: u8 = TariAddressType::External.into();

    assert_eq!(internal, 0);
    assert_eq!(external, 1);
}

#[test]
fn internal_wallet_is_initialized_before_set() {
    assert!(
        !InternalWallet::is_initialized(),
        "InternalWallet should not be initialized before set_current is called"
    );
}

/// `current()` is fallible so that a missing wallet cannot take down whichever task touched it
/// first. Before initialisation it must return the error, not panic.
#[test]
fn current_returns_error_before_initialization() {
    let error = InternalWallet::current()
        .expect_err("current() must fail before the wallet is initialized");
    assert_eq!(
        error.to_string(),
        super::internal_wallet::WALLET_NOT_INITIALIZED
    );
}

// --- Redaction of the wallet view private key (GHSA-3wv6-9vwg-865r) ---
//
// The key stays in `config_wallet.json` as a plain hex string, so the JSON
// shape must not change; it may only never show up in `Debug` output.

use super::configs::config_wallet::WalletId;
use super::internal_wallet::{TariWalletDetails, ViewPrivateKeyHex};
use std::str::FromStr;
use tari_common_types::tari_address::TariAddress;

/// A valid dual (one-sided) address, same fixture as `utils::address_utils`.
const TEST_TARI_ADDRESS: &str =
    "f25eNHz2YnBVKHaqNuacGyDFB321RwwCnTr4vb2SjQCgDZVXyNNthc7zftQKRDu6evLjvSUD8W5akpPMdhS4HQ9kF3g";
const VIEW_KEY_SENTINEL: &str = "view_key_sentinel_0123";

fn sentinel_wallet_details() -> TariWalletDetails {
    TariWalletDetails {
        id: WalletId::new("wallet_sentinel_id".to_string()),
        tari_address: TariAddress::from_str(TEST_TARI_ADDRESS).expect("valid test address"),
        wallet_birthday: 1234,
        view_private_key_hex: ViewPrivateKeyHex::new(VIEW_KEY_SENTINEL.to_string()),
        spend_public_key_hex: "spend_public_key_not_secret".to_string(),
    }
}

/// The on-disk JSON, exactly as `config_wallet.json` stores it.
fn sentinel_wallet_details_json() -> String {
    format!(
        r#"{{"id":"wallet_sentinel_id","tari_address":"{TEST_TARI_ADDRESS}","wallet_birthday":1234,"view_private_key_hex":"{VIEW_KEY_SENTINEL}","spend_public_key_hex":"spend_public_key_not_secret"}}"#
    )
}

#[test]
fn tari_wallet_details_debug_redacts_view_private_key() {
    let debug_output = format!("{:?}", sentinel_wallet_details());

    assert!(
        !debug_output.contains("view_key_sentinel"),
        "view private key leaked into Debug output: {debug_output}"
    );
    assert!(debug_output.contains("REDACTED"), "{debug_output}");
    // Non-secret fields are still useful for debugging.
    assert!(
        debug_output.contains("wallet_sentinel_id"),
        "{debug_output}"
    );
    assert!(
        debug_output.contains("spend_public_key_not_secret"),
        "{debug_output}"
    );
}

#[test]
fn view_private_key_hex_debug_and_display_redact() {
    let key = ViewPrivateKeyHex::new(VIEW_KEY_SENTINEL.to_string());

    assert!(!format!("{key:?}").contains("view_key_sentinel"));
    assert!(!format!("{key}").contains("view_key_sentinel"));
    assert_eq!(key.reveal(), VIEW_KEY_SENTINEL);
}

#[test]
fn tari_wallet_details_deserializes_the_on_disk_shape() {
    let details: TariWalletDetails =
        serde_json::from_str(&sentinel_wallet_details_json()).expect("fixture should deserialize");

    assert_eq!(details.view_private_key_hex.reveal(), VIEW_KEY_SENTINEL);
    assert_eq!(details.id.as_str(), "wallet_sentinel_id");
    assert_eq!(details.wallet_birthday, 1234);
}

#[test]
fn tari_wallet_details_serializes_the_key_as_a_plain_hex_string() {
    let details: TariWalletDetails =
        serde_json::from_str(&sentinel_wallet_details_json()).expect("fixture should deserialize");

    let value = serde_json::to_value(&details).expect("should serialize");

    assert_eq!(
        value
            .get("view_private_key_hex")
            .and_then(serde_json::Value::as_str),
        Some(VIEW_KEY_SENTINEL),
        "the config file must keep the plain hex string"
    );
    // The whole document must round-trip byte for byte.
    assert_eq!(
        serde_json::to_string(&details).expect("should serialize"),
        sentinel_wallet_details_json()
    );
}

#[test]
fn tari_wallet_details_round_trip_preserves_the_key() {
    let serialized = serde_json::to_string(&sentinel_wallet_details()).expect("should serialize");
    let deserialized: TariWalletDetails =
        serde_json::from_str(&serialized).expect("should deserialize");

    assert_eq!(
        deserialized.view_private_key_hex.reveal(),
        VIEW_KEY_SENTINEL
    );
}

#[test]
fn wipe_and_remove_file_deletes_existing_file_and_is_idempotent() {
    let path = std::env::temp_dir().join(format!(
        "tari_universe_legacy_cred_test_{}_{}.bin",
        std::process::id(),
        std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .expect("clock")
            .as_nanos()
    ));
    std::fs::write(&path, b"SAFE-DEMO-PASSPHRASE").expect("write fixture");
    assert!(path.exists());

    assert!(wipe_and_remove_file(&path).expect("first wipe"));
    assert!(
        !path.exists(),
        "legacy file must not survive a successful wipe"
    );

    assert!(
        !wipe_and_remove_file(&path).expect("second wipe"),
        "absent file is not an error"
    );
}

#[test]
#[cfg(unix)]
fn wipe_and_remove_file_unlinks_symlink_without_touching_target() {
    let unique = format!(
        "{}_{}",
        std::process::id(),
        std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .expect("clock")
            .as_nanos()
    );
    let target =
        std::env::temp_dir().join(format!("tari_universe_symlink_target_test_{}.bin", unique));
    let link = std::env::temp_dir().join(format!("tari_universe_symlink_test_{}.bin", unique));

    const TARGET_CONTENT: &[u8] = b"UNRELATED-USER-FILE";
    std::fs::write(&target, TARGET_CONTENT).expect("write target");
    std::os::unix::fs::symlink(&target, &link).expect("create symlink");

    assert!(
        wipe_and_remove_file(&link).expect("wipe symlink"),
        "symlink is present, so the wipe reports a removal"
    );

    let link_err = std::fs::symlink_metadata(&link).expect_err("symlink must be unlinked");
    assert_eq!(link_err.kind(), std::io::ErrorKind::NotFound);

    assert!(target.exists(), "symlink target must survive the wipe");
    assert_eq!(
        std::fs::read(&target).expect("read target"),
        TARGET_CONTENT,
        "symlink target content must not be zeroed"
    );

    std::fs::remove_file(&target).expect("clean up target");
}

// --- Startup keyring probe (kmbt) ---------------------------------------------------------
//
// The probe itself needs a live keyring, but its two decisions do not: whether to run at all
// (macOS rate limiting) and how to classify a failure. Both are pure functions and are what the
// user-visible behaviour hangs off, so both are covered here.

use super::credential_manager::CredentialError;
use super::internal_wallet::{
    SeedProbeDecision, SeedProbeErrorKind, SeedProbeOutcome, WalletRecoveryReason,
    classify_seed_probe_error, decide_seed_probe, ensure_wallet_usable, wallet_usability,
};

const DAY: u64 = 60 * 60 * 24;

#[test]
fn probe_runs_every_launch_when_not_rate_limited() {
    // Windows and Linux: the read is silent, so a recent probe must not stop the next one.
    assert_eq!(
        decide_seed_probe(false, Some(1_000), 1_001, DAY),
        SeedProbeDecision::Run
    );
    assert_eq!(
        decide_seed_probe(false, None, 1_001, DAY),
        SeedProbeDecision::Run
    );
}

#[test]
fn probe_runs_on_first_launch_when_rate_limited() {
    // macOS with no marker yet: probe once so a missing seed is still found at launch.
    assert_eq!(
        decide_seed_probe(true, None, 10 * DAY, DAY),
        SeedProbeDecision::Run
    );
}

#[test]
fn probe_is_skipped_within_the_interval_when_rate_limited() {
    // The point of the limit: a user who chose "Allow" is not re-prompted on every launch.
    assert_eq!(
        decide_seed_probe(true, Some(10 * DAY), 10 * DAY + 1, DAY),
        SeedProbeDecision::Skip
    );
    assert_eq!(
        decide_seed_probe(true, Some(10 * DAY), 11 * DAY - 1, DAY),
        SeedProbeDecision::Skip
    );
}

#[test]
fn probe_runs_again_once_the_interval_elapsed() {
    assert_eq!(
        decide_seed_probe(true, Some(10 * DAY), 11 * DAY, DAY),
        SeedProbeDecision::Run
    );
}

#[test]
fn probe_runs_when_the_marker_is_in_the_future() {
    // A clock moved backwards must not lock the check out until the clock catches up.
    assert_eq!(
        decide_seed_probe(true, Some(100 * DAY), 10 * DAY, DAY),
        SeedProbeDecision::Run
    );
}

#[test]
fn no_entry_is_always_reported_as_unavailable() {
    // The "my seeds are gone" case: report it on every platform, macOS included.
    let error = CredentialError::NoEntry("inner_wallet_credentials_esme_abc123".to_string());
    assert_eq!(
        classify_seed_probe_error(&error, false),
        SeedProbeOutcome::Unavailable(SeedProbeErrorKind::NoEntry)
    );
    assert_eq!(
        classify_seed_probe_error(&error, true),
        SeedProbeOutcome::Unavailable(SeedProbeErrorKind::NoEntry)
    );
}

#[test]
fn keyring_platform_failure_is_unavailable_off_macos_and_inconclusive_on_macos() {
    // Windows: VaultSvc down or credentials wiped - a real signal, report it.
    // macOS: the same variant is what a cancelled or denied keychain prompt looks like, and a
    // user declining a prompt must never reach Sentry.
    let error = CredentialError::Keyring(keyring::Error::PlatformFailure(Box::new(
        std::io::Error::other("vault unavailable"),
    )));
    assert_eq!(
        classify_seed_probe_error(&error, false),
        SeedProbeOutcome::Unavailable(SeedProbeErrorKind::KeyringPlatform)
    );
    assert_eq!(
        classify_seed_probe_error(&error, true),
        SeedProbeOutcome::Inconclusive(SeedProbeErrorKind::KeyringPlatform)
    );
}

#[test]
fn locked_credential_store_classifies_as_a_platform_failure() {
    let error = CredentialError::Keyring(keyring::Error::NoStorageAccess(Box::new(
        std::io::Error::other("collection is locked"),
    )));
    assert_eq!(
        classify_seed_probe_error(&error, false),
        SeedProbeOutcome::Unavailable(SeedProbeErrorKind::KeyringPlatform)
    );
}

#[test]
fn other_keyring_errors_are_reported_as_keyring_other() {
    let error = CredentialError::Keyring(keyring::Error::Invalid(
        "service".to_string(),
        "empty".to_string(),
    ));
    assert_eq!(
        classify_seed_probe_error(&error, true),
        SeedProbeOutcome::Unavailable(SeedProbeErrorKind::KeyringOther)
    );
}

#[test]
fn probe_error_tags_are_enum_like_and_carry_no_user_data() {
    // These strings go into Sentry tags, so they must be a fixed, closed set.
    for (kind, tag) in [
        (SeedProbeErrorKind::NoEntry, "no_entry"),
        (SeedProbeErrorKind::KeyringPlatform, "keyring_platform"),
        (SeedProbeErrorKind::KeyringOther, "keyring_other"),
        (SeedProbeErrorKind::Io, "io"),
        (SeedProbeErrorKind::Decode, "decode"),
    ] {
        assert_eq!(kind.as_tag(), tag);
    }
}

#[test]
fn mining_is_allowed_while_the_app_is_not_in_recovery() {
    // The guarded callers: with no recovery state set (the default in a test binary) the gate
    // must not stand in the way of a normal start.
    assert!(ensure_wallet_usable().is_ok());
    assert!(wallet_usability(None).is_ok());
}

#[test]
fn mining_is_refused_in_every_recovery_state() {
    // Both miners call this before doing any work, so both recovery reasons must refuse.
    for reason in [
        WalletRecoveryReason::InitializationFailed,
        WalletRecoveryReason::SeedUnavailable,
    ] {
        let error = wallet_usability(Some(reason))
            .expect_err("mining must be refused while the wallet needs recovery");
        assert!(
            matches!(error, crate::mining::MiningError::WalletNotReady),
            "unexpected error for {reason:?}"
        );
        // The reason is an enum-like tag, fit for a log line or a Sentry tag.
        assert!(!reason.as_tag().is_empty());
    }
}

// ** Monero credential id versioning **

#[test]
fn monero_ids_are_versioned_without_ever_reusing_the_previous_one() {
    let legacy = WalletId::new("monero".to_string());
    let second = next_monero_wallet_id(&legacy);
    assert_eq!(second.as_str(), "monero_2");
    assert_eq!(next_monero_wallet_id(&second).as_str(), "monero_3");
    assert_eq!(
        next_monero_wallet_id(&WalletId::new("monero_11".to_string())).as_str(),
        "monero_12"
    );
    // Anything unrecognised restarts at 2 rather than colliding with the id it came from.
    assert_eq!(
        next_monero_wallet_id(&WalletId::new("monero_nonsense".to_string())).as_str(),
        "monero_2"
    );
}

#[tokio::test]
async fn a_fresh_wallet_keeps_the_original_monero_id() {
    let allocated = allocate_monero_wallet_id_with(WalletId::new("monero".to_string()), |_id| {
        std::future::ready(false)
    })
    .await
    .expect("an empty store leaves the first id free");
    assert_eq!(allocated.as_str(), "monero");
}

#[tokio::test]
async fn a_new_monero_seed_never_lands_on_an_occupied_id() {
    let occupied: HashSet<String> = ["monero", "monero_2"]
        .iter()
        .map(|id| (*id).to_string())
        .collect();
    let allocated = allocate_monero_wallet_id_with(WalletId::new("monero".to_string()), |id| {
        let occupied = occupied.clone();
        async move { occupied.contains(id.as_str()) }
    })
    .await
    .expect("a free id exists");
    assert_eq!(
        allocated.as_str(),
        "monero_3",
        "the existing Monero seeds must be left where they are"
    );
}

#[tokio::test]
async fn an_unreadable_monero_entry_counts_as_occupied() {
    // `has_credentials` returning an error is mapped to "occupied" by the caller. Here the
    // closure models a store that refuses to say: the allocation must move past it, never
    // through it.
    let allocated = allocate_monero_wallet_id_with(WalletId::new("monero".to_string()), |id| {
        std::future::ready(id.as_str() == "monero")
    })
    .await
    .expect("a free id exists");
    assert_eq!(allocated.as_str(), "monero_2");
}

#[tokio::test]
async fn allocation_gives_up_instead_of_overwriting() {
    let result = allocate_monero_wallet_id_with(WalletId::new("monero".to_string()), |_id| {
        std::future::ready(true)
    })
    .await;
    assert!(
        result.is_err(),
        "a store where every id is taken must error, not reuse one"
    );
}

// ** Self-healing PIN state **

fn test_pin() -> SafePassword {
    SafePassword::from("123456".to_string())
}

fn other_pin() -> SafePassword {
    SafePassword::from("654321".to_string())
}

/// The candidate a caller would take first.
fn best<T>(candidates: &[SeedCandidate<T>]) -> &SeedCandidate<T> {
    candidates.first().expect("a blob that can be read at all")
}

#[test]
fn a_plain_tari_blob_under_a_locked_config_is_offered_unauthenticated() {
    // Path P4 with a plaintext blob: the config claims a PIN, the keyring holds a plain seed.
    // Before the repair this was "Wrong PIN entered!" forever, with a lockout after three tries.
    let seed = CipherSeed::random();
    let blob = seed.to_binary().expect("serialize");

    let candidates = tari_seed_candidates(&blob, Some(test_pin()), true);
    let candidate = best(&candidates);
    assert_eq!(candidate.seed.entropy(), seed.entropy());
    assert!(
        !candidate.authenticated,
        "a bincode decode proves nothing and must be address-checked"
    );
    assert!(
        !candidate.pin_locked_actual,
        "the recorded state must be corrected to unlocked"
    );
}

#[test]
fn a_plain_decode_is_never_trusted_on_its_own() {
    // The reason `authenticated` exists. `to_binary`/`from_binary` is bincode with no tag, so an
    // *enciphered* blob deserializes into a structurally valid seed that is not the user's.
    // Acting on it without checking the derived address would hand a user who mistyped their PIN
    // a different, empty wallet - and, before this change, the no-PIN path returned exactly that
    // seed to the caller.
    let seed = CipherSeed::random();
    let enciphered = seed.encipher(Some(test_pin())).expect("encipher");

    let decoded =
        CipherSeed::from_binary(&enciphered).expect("bincode accepts the enciphered blob");
    assert_ne!(
        decoded.entropy(),
        seed.entropy(),
        "the unauthenticated decode of an enciphered blob is the wrong seed"
    );
    // ... and the candidate list flags it as unauthenticated rather than returning it as fact.
    let candidates = tari_seed_candidates(&enciphered, None, false);
    assert!(candidates.iter().all(|candidate| !candidate.authenticated));
}

#[test]
fn an_enciphered_tari_blob_is_authenticated_by_the_pin() {
    // Path P3: `create_pin` wrote the enciphered blob and died before writing the flag. The MAC
    // in the enciphered format proves the answer, so no address check is needed for this one.
    let seed = CipherSeed::random();
    let blob = seed.encipher(Some(test_pin())).expect("encipher");

    let candidates = tari_seed_candidates(&blob, Some(test_pin()), false);
    let candidate = best(&candidates);
    assert_eq!(candidate.seed.entropy(), seed.entropy());
    assert!(candidate.authenticated);
    assert!(
        candidate.pin_locked_actual,
        "the recorded state must be corrected to locked"
    );
}

#[test]
fn the_recorded_interpretation_is_tried_first() {
    let seed = CipherSeed::random();
    let enciphered = seed.encipher(Some(test_pin())).expect("encipher");

    // Recorded as locked: the enciphered reading comes first even though the plain one also
    // "succeeds" (see above).
    let candidates = tari_seed_candidates(&enciphered, Some(test_pin()), true);
    assert!(best(&candidates).authenticated);
    assert!(best(&candidates).pin_locked_actual);

    let plain = seed.to_binary().expect("serialize");
    let candidates = tari_seed_candidates(&plain, None, false);
    assert!(!best(&candidates).pin_locked_actual);
}

#[test]
fn a_wrong_pin_leaves_only_the_unauthenticated_reading() {
    // A wrong PIN must never produce an authenticated candidate; the address check is then the
    // only thing standing between the user and someone else's empty wallet.
    let seed = CipherSeed::random();
    let blob = seed.encipher(Some(test_pin())).expect("encipher");
    let candidates = tari_seed_candidates(&blob, Some(other_pin()), true);
    assert!(candidates.iter().all(|candidate| !candidate.authenticated));
}

#[test]
fn a_plain_monero_blob_under_a_locked_config_is_offered_unauthenticated() {
    let seed = vec![7u8; 32];
    let candidates = monero_seed_candidates(&seed, Some(test_pin()), true);
    let candidate = best(&candidates);
    assert_eq!(candidate.seed, seed);
    assert!(!candidate.authenticated);
    assert!(!candidate.pin_locked_actual);
}

#[test]
fn an_encrypted_monero_blob_is_authenticated_by_the_pin() {
    let seed = vec![9u8; 32];
    let blob = crate::utils::cryptography::encrypt(&seed, &test_pin()).expect("encrypt");

    // Without a PIN there is no reading at all: the caller prompts once.
    assert!(monero_seed_candidates(&blob, None, false).is_empty());

    // AES-GCM authenticates, so this direction needs no address check either.
    let candidates = monero_seed_candidates(&blob, Some(test_pin()), false);
    let candidate = best(&candidates);
    assert_eq!(candidate.seed, seed);
    assert!(candidate.authenticated);
    assert!(candidate.pin_locked_actual);
}

#[test]
fn a_consistent_monero_state_is_left_alone() {
    let seed = vec![3u8; 32];
    let candidates = monero_seed_candidates(&seed, None, false);
    assert!(!best(&candidates).pin_locked_actual);

    let blob = crate::utils::cryptography::encrypt(&seed, &test_pin()).expect("encrypt");
    let candidates = monero_seed_candidates(&blob, Some(test_pin()), true);
    assert!(best(&candidates).pin_locked_actual);
}

#[test]
fn a_wrong_monero_pin_reads_nothing() {
    // The ciphertext is longer than a seed, so there is no plain reading to fall back to.
    let seed = vec![5u8; 32];
    let blob = crate::utils::cryptography::encrypt(&seed, &test_pin()).expect("encrypt");
    assert!(monero_seed_candidates(&blob, Some(other_pin()), true).is_empty());
}
