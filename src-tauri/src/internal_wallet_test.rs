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

use super::internal_wallet::{InternalWallet, TariAddressType, wipe_and_remove_file};

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

// --- Legacy migration and legacy-file purge (c9hf / k5q8) ---------------------------------
//
// The whole point of these two changes is that a machine with a legacy wallet can no longer be
// pushed into a state it cannot leave: the decrypt is tried from every source, a failure
// quarantines the file instead of panicking, an unreadable legacy file never turns into a new
// wallet, and nothing is deleted until the legacy seed is proven to be the wallet in the config.
// Everything below runs against temp directories and in-memory fixtures; no keyring is touched.

use super::credential_manager::LegacyCredential;
use super::internal_wallet::{
    LEGACY_DECRYPT_FAILED_SUFFIX, LEGACY_FALLBACK_FILE_NAME, LEGACY_MIGRATED_SUFFIX,
    LEGACY_WALLET_CONFIG_FILE_NAME, LegacyConfigProblemKind, LegacyDecryptErrorKind,
    LegacyFileKind, LegacyPassphraseSource, LegacyPurgeDecision, LegacySeedProof,
    LegacyWalletEvidence, decrypt_legacy_tari_seed, get_old_wallet_config,
    legacy_passphrase_candidates, legacy_purge_decision, locate_legacy_wallet,
    quarantine_legacy_file, quarantined_path,
};
use tari_common_types::seeds::cipher_seed::CipherSeed;
use tari_utilities::SafePassword;
use tari_utilities::encoding::MBase58;

/// Not a real view key: these two fields are only ever copied through, never used as keys here.
const LEGACY_VIEW_KEY_HEX: &str =
    "0a0b0c0d0e0f00112233445566778899aabbccddeeff00112233445566778899";
const LEGACY_SPEND_KEY_HEX: &str =
    "99887766554433221100ffeeddccbbaa99887766554433221100ffeeddccbbaa";

/// A legacy seed as `wallet_config.json` stored it: `CipherSeed::encipher` output, monero-base58.
fn enciphered_legacy_seed(passphrase: Option<&str>) -> String {
    let seed = CipherSeed::random();
    seed.encipher(passphrase.map(SafePassword::from))
        .expect("encipher the fixture seed")
        .to_monero_base58()
}

/// The on-disk shape of a pre-v1.2.24 `wallet_config.json`, including the `passphrase` field that
/// real Era-1 files carry and that v1.2.24 dropped from the struct.
fn legacy_wallet_config_json(seed_base58: &str, passphrase: Option<&str>) -> String {
    let passphrase = match passphrase {
        Some(passphrase) => format!("\"{passphrase}\""),
        None => "null".to_string(),
    };
    format!(
        r#"{{"tari_address_base58":"{TEST_TARI_ADDRESS}","view_key_private_hex":"{LEGACY_VIEW_KEY_HEX}","spend_public_key_hex":"{LEGACY_SPEND_KEY_HEX}","seed_words_encrypted_base58":"{seed_base58}","passphrase":{passphrase},"config_path":null}}"#
    )
}

fn write_legacy_wallet_config(dir: &std::path::Path, contents: &str) -> std::path::PathBuf {
    let path = dir.join(LEGACY_WALLET_CONFIG_FILE_NAME);
    std::fs::write(&path, contents).expect("write the legacy wallet config fixture");
    path
}

// --- Passphrase sources -------------------------------------------------------------------

#[test]
fn passphrase_candidates_follow_the_documented_order() {
    // Keyring first, then the plaintext fallback file (which the legacy credential manager would
    // otherwise let shadow the keyring), then the in-file Era-1 passphrase, then none at all.
    let candidates = legacy_passphrase_candidates(
        Some(SafePassword::from("from-keyring")),
        Some(SafePassword::from("from-file")),
        Some("from-config".to_string()),
    );

    let sources: Vec<LegacyPassphraseSource> =
        candidates.iter().map(|(source, _)| *source).collect();
    assert_eq!(
        sources,
        vec![
            LegacyPassphraseSource::KeyringCredential,
            LegacyPassphraseSource::FallbackFileCredential,
            LegacyPassphraseSource::LegacyConfigFile,
            LegacyPassphraseSource::NoPassphrase,
        ]
    );
    for (position, (source, _)) in candidates.iter().enumerate() {
        assert_eq!(source.index(), position, "index must match the try order");
        assert!(!source.as_tag().is_empty());
    }
}

#[test]
fn passphrase_candidates_always_end_with_no_passphrase() {
    // A seed enciphered without a passphrase is a legitimate legacy state, so "none" is a source
    // in its own right and must be tried even when nothing else exists.
    let candidates = legacy_passphrase_candidates(None, None, None);

    assert_eq!(candidates.len(), 1);
    assert_eq!(candidates[0].0, LegacyPassphraseSource::NoPassphrase);
    assert!(candidates[0].1.is_none());
}

// --- Decrypting the legacy seed (c9hf criteria 1 and 3) -----------------------------------

#[test]
fn legacy_seed_decrypts_with_the_passphrase_from_the_credential() {
    let seed_base58 = enciphered_legacy_seed(Some("correct horse"));
    let credential = LegacyCredential {
        tari_seed_passphrase: Some(SafePassword::from("correct horse")),
        monero_seed: None,
    };

    let candidates =
        legacy_passphrase_candidates(credential.tari_seed_passphrase, None, Some("wrong".into()));
    let (_seed, source) =
        decrypt_legacy_tari_seed(&seed_base58, candidates).expect("credential passphrase works");

    assert_eq!(source, LegacyPassphraseSource::KeyringCredential);
    assert_eq!(source.index(), 0);
}

#[test]
fn legacy_seed_decrypts_with_the_passphrase_from_the_legacy_file() {
    // The Era-1 case: the passphrase only ever lived in `wallet_config.json`, and v1.2.24 threw
    // it away by dropping the field from the struct. Nothing else on the machine can open this.
    let seed_base58 = enciphered_legacy_seed(Some("in-file passphrase"));
    let json = legacy_wallet_config_json(&seed_base58, Some("in-file passphrase"));
    let parsed: super::internal_wallet::LegacyWalletConfig =
        serde_json::from_str(&json).expect("legacy fixture parses");

    let candidates = legacy_passphrase_candidates(
        Some(SafePassword::from("stale keyring passphrase")),
        None,
        parsed.passphrase.clone(),
    );
    let (_seed, source) = decrypt_legacy_tari_seed(&parsed.seed_words_encrypted_base58, candidates)
        .expect("the in-file passphrase works");

    assert_eq!(source, LegacyPassphraseSource::LegacyConfigFile);
    assert_eq!(source.index(), 2);
}

#[test]
fn legacy_seed_decrypts_with_no_passphrase_at_all() {
    let seed_base58 = enciphered_legacy_seed(None);

    let (_seed, source) =
        decrypt_legacy_tari_seed(&seed_base58, legacy_passphrase_candidates(None, None, None))
            .expect("a seed enciphered without a passphrase opens with none");

    assert_eq!(source, LegacyPassphraseSource::NoPassphrase);
}

#[test]
fn legacy_seed_that_no_source_opens_reports_decryption_failed() {
    // This is panic 4: every source is wrong. It must be an error, not an `.expect`.
    let seed_base58 = enciphered_legacy_seed(Some("the passphrase this machine lost"));

    let error = decrypt_legacy_tari_seed(
        &seed_base58,
        legacy_passphrase_candidates(
            Some(SafePassword::from("wrong one")),
            Some(SafePassword::from("wrong two")),
            Some("wrong three".to_string()),
        ),
    )
    .expect_err("no passphrase should open this seed");

    assert_eq!(error, LegacyDecryptErrorKind::DecryptionFailed);
    // The tag is what reaches a Sentry tag, so it must be a fixed, closed value.
    assert_eq!(error.as_tag(), "decryption_failed");
}

#[test]
fn a_damaged_enciphered_seed_is_reported_as_damage_not_as_a_wrong_passphrase() {
    // Worth separating: "the bytes are corrupt" is a different support answer from "the
    // passphrase is gone", and trying the remaining passphrases cannot change the outcome.
    let error = decrypt_legacy_tari_seed(
        "not base58 at all !!!",
        legacy_passphrase_candidates(None, None, None),
    )
    .expect_err("a non-base58 seed field cannot decrypt");

    assert_eq!(error, LegacyDecryptErrorKind::Base58);
}

// --- The migration decision tree (c9hf criterion 4) ---------------------------------------

#[test]
fn an_empty_config_dir_is_the_only_state_that_allows_a_new_wallet() {
    let dir = tempfile::tempdir().expect("temp dir");

    assert!(matches!(
        locate_legacy_wallet(dir.path()),
        LegacyWalletEvidence::None
    ));
}

#[test]
fn a_readable_legacy_config_is_migratable() {
    let dir = tempfile::tempdir().expect("temp dir");
    let seed_base58 = enciphered_legacy_seed(Some("passphrase"));
    write_legacy_wallet_config(dir.path(), &legacy_wallet_config_json(&seed_base58, None));

    match locate_legacy_wallet(dir.path()) {
        LegacyWalletEvidence::Migratable(config) => {
            assert_eq!(config.seed_words_encrypted_base58, seed_base58);
        }
        other => panic!("expected a migratable legacy wallet, got {other:?}"),
    }
}

#[test]
fn an_unparseable_legacy_config_is_a_recovery_case_never_a_new_wallet() {
    // The `.ok()` this replaces turned "locked by antivirus" and "truncated" into "no legacy
    // wallet here", and the next step created a brand new wallet over the top of the old one.
    let dir = tempfile::tempdir().expect("temp dir");
    write_legacy_wallet_config(dir.path(), "{ this is not json");

    match locate_legacy_wallet(dir.path()) {
        LegacyWalletEvidence::Unreadable(problem) => {
            assert_eq!(problem.file, LegacyFileKind::WalletConfig);
            assert_eq!(problem.kind, LegacyConfigProblemKind::Unparseable);
        }
        other => panic!("an unparseable legacy config must not allow a new wallet: {other:?}"),
    }
}

#[test]
fn a_legacy_config_without_a_wallet_in_it_is_a_recovery_case() {
    // Valid JSON, no wallet: a truncated or half-written file, not a fresh install.
    let dir = tempfile::tempdir().expect("temp dir");
    write_legacy_wallet_config(dir.path(), "{}");

    match locate_legacy_wallet(dir.path()) {
        LegacyWalletEvidence::Unreadable(problem) => {
            assert_eq!(problem.kind, LegacyConfigProblemKind::Incomplete);
        }
        other => panic!("expected a recovery case, got {other:?}"),
    }
}

#[test]
fn a_surviving_credential_file_alone_still_blocks_a_new_wallet() {
    // The wallet config is gone but the machine demonstrably had a wallet. Creating a new one
    // here is the silent replacement the hardening brief forbids.
    let dir = tempfile::tempdir().expect("temp dir");
    std::fs::write(dir.path().join(LEGACY_FALLBACK_FILE_NAME), b"\x00\x01")
        .expect("write the fallback fixture");

    match locate_legacy_wallet(dir.path()) {
        LegacyWalletEvidence::Unreadable(problem) => {
            assert_eq!(problem.file, LegacyFileKind::FallbackCredential);
            assert_eq!(problem.kind, LegacyConfigProblemKind::EvidenceWithoutConfig);
        }
        other => panic!("expected a recovery case, got {other:?}"),
    }
}

#[test]
fn a_quarantined_legacy_config_comes_back_as_view_only_not_as_migratable() {
    // After a failed decrypt the file is renamed, so the next launch finds nothing to migrate and
    // cannot repeat the failure - this is what makes the crash loop impossible - but the address
    // and view key are still there, so the wallet stays visible.
    let dir = tempfile::tempdir().expect("temp dir");
    let seed_base58 = enciphered_legacy_seed(Some("lost"));
    let path =
        write_legacy_wallet_config(dir.path(), &legacy_wallet_config_json(&seed_base58, None));

    let quarantined = quarantine_legacy_file(&path, LEGACY_DECRYPT_FAILED_SUFFIX)
        .expect("quarantine the legacy config")
        .expect("the file was there");

    assert!(!path.exists(), "the migratable name must be gone");
    assert_eq!(
        quarantined,
        quarantined_path(&path, LEGACY_DECRYPT_FAILED_SUFFIX)
    );
    assert!(quarantined.exists(), "the file itself must survive");

    match locate_legacy_wallet(dir.path()) {
        LegacyWalletEvidence::ViewOnly(config) => {
            assert_eq!(config.seed_words_encrypted_base58, seed_base58);
        }
        other => panic!("expected a view-only legacy wallet, got {other:?}"),
    }
}

#[test]
fn quarantining_never_overwrites_an_earlier_quarantined_file() {
    // A previous quarantine may hold a different wallet's enciphered seed.
    let dir = tempfile::tempdir().expect("temp dir");
    let path = dir.path().join(LEGACY_WALLET_CONFIG_FILE_NAME);
    std::fs::write(&path, b"first").expect("write the first fixture");
    quarantine_legacy_file(&path, LEGACY_MIGRATED_SUFFIX).expect("first quarantine");

    std::fs::write(&path, b"second").expect("write the second fixture");
    let second = quarantine_legacy_file(&path, LEGACY_MIGRATED_SUFFIX)
        .expect("second quarantine")
        .expect("the file was there");

    let first = quarantined_path(&path, LEGACY_MIGRATED_SUFFIX);
    assert_ne!(second, first);
    assert_eq!(std::fs::read(&first).expect("read the first"), b"first");
    assert_eq!(std::fs::read(&second).expect("read the second"), b"second");
}

#[test]
fn quarantining_an_absent_file_is_not_an_error() {
    let dir = tempfile::tempdir().expect("temp dir");

    assert!(
        quarantine_legacy_file(
            &dir.path().join(LEGACY_WALLET_CONFIG_FILE_NAME),
            LEGACY_DECRYPT_FAILED_SUFFIX,
        )
        .expect("absent is not an error")
        .is_none()
    );
}

#[test]
fn an_absent_legacy_config_file_is_reported_as_absent_not_as_damage() {
    let dir = tempfile::tempdir().expect("temp dir");

    assert!(
        get_old_wallet_config(&dir.path().join(LEGACY_WALLET_CONFIG_FILE_NAME))
            .expect("absent is not an error")
            .is_none()
    );
}

// --- The purge gate (k5q8) ----------------------------------------------------------------

/// Two independent wallets, as the gate sees them: an address derived from a seed.
async fn address_for_a_random_wallet() -> TariAddress {
    InternalWallet::get_tari_wallet_details(
        WalletId::new("gate_fixture".to_string()),
        CipherSeed::random(),
    )
    .await
    .expect("derive the fixture address")
    .tari_address
}

#[tokio::test]
async fn purge_proceeds_when_the_legacy_seed_derives_a_configured_address() {
    let legacy = address_for_a_random_wallet().await;
    let other = address_for_a_random_wallet().await;

    assert_eq!(
        legacy_purge_decision(
            &LegacySeedProof::Address(legacy.clone()),
            &[other, legacy],
            false,
        ),
        LegacyPurgeDecision::Purge
    );
}

#[tokio::test]
async fn purge_is_refused_when_the_legacy_wallet_is_not_the_configured_one() {
    // The #3353 hole: the config's wallets are readable, but they are a different wallet. Before
    // this gate, the last copy of the user's original enciphered seed was zero-filled here.
    let legacy = address_for_a_random_wallet().await;
    let configured = address_for_a_random_wallet().await;

    assert_eq!(
        legacy_purge_decision(&LegacySeedProof::Address(legacy), &[configured], false),
        LegacyPurgeDecision::Defer("address_mismatch")
    );
}

#[tokio::test]
async fn purge_is_refused_when_the_legacy_seed_cannot_be_decrypted() {
    // Nothing is proven, so nothing is touched - even though every configured wallet is readable.
    let configured = address_for_a_random_wallet().await;

    assert_eq!(
        legacy_purge_decision(&LegacySeedProof::Undecryptable, &[configured], false),
        LegacyPurgeDecision::Defer("legacy_seed_undecryptable")
    );
}

#[test]
fn purge_is_refused_while_a_quarantined_config_still_needs_its_passphrase() {
    // No wallet config left to match, but a `.decrypt_failed` one is sitting next to the
    // credential file: that passphrase is the only thing that could ever open it.
    assert_eq!(
        legacy_purge_decision(&LegacySeedProof::NoLegacyConfig, &[], true),
        LegacyPurgeDecision::Defer("quarantined_config_present")
    );
}

#[test]
fn purge_proceeds_when_the_passphrase_can_no_longer_open_anything() {
    assert_eq!(
        legacy_purge_decision(&LegacySeedProof::NoLegacyConfig, &[], false),
        LegacyPurgeDecision::Purge
    );
}

#[test]
fn the_enciphered_legacy_config_is_renamed_while_the_plaintext_file_is_destroyed() {
    // The two files get different treatment on purpose: `wallet_config.json` is enciphered and
    // may be the last copy of a seed, `credentials_backup.bin` is plaintext CBOR.
    let dir = tempfile::tempdir().expect("temp dir");
    let seed_base58 = enciphered_legacy_seed(Some("passphrase"));
    let config =
        write_legacy_wallet_config(dir.path(), &legacy_wallet_config_json(&seed_base58, None));
    let fallback = dir.path().join(LEGACY_FALLBACK_FILE_NAME);
    std::fs::write(&fallback, b"PLAINTEXT-CBOR-CREDENTIAL").expect("write the fallback fixture");

    quarantine_legacy_file(&config, LEGACY_MIGRATED_SUFFIX).expect("rename the legacy config");
    assert!(wipe_and_remove_file(&fallback).expect("wipe the plaintext credential file"));

    assert!(!config.exists(), "the migration path must be clear");
    assert!(
        !fallback.exists(),
        "the plaintext credential file must be gone"
    );
    let migrated = quarantined_path(&config, LEGACY_MIGRATED_SUFFIX);
    assert!(
        migrated.exists(),
        "the enciphered seed must be kept, not destroyed"
    );
    assert!(
        String::from_utf8_lossy(&std::fs::read(&migrated).expect("read the renamed config"))
            .contains(&seed_base58),
        "the renamed file must still carry the enciphered seed"
    );
}
