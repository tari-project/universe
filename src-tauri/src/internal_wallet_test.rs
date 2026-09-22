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
    InternalWallet, TariAddressType, previous_wallet_files, wipe_and_remove_file,
};

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

#[test]
#[should_panic(expected = "InternalWallet is not initialized")]
fn current_panics_before_initialization() {
    let _ = InternalWallet::current();
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

// --- Legacy credential purge gate ---

/// The address a wallet that silently replaced the legacy one would record. The gate compares the
/// recorded strings, so this never has to decode.
const OTHER_TARI_ADDRESS: &str = "a_different_wallet_address";

#[test]
fn legacy_config_is_kept_when_the_wallet_in_use_is_a_different_wallet() {
    let details = sentinel_wallet_details();

    assert_eq!(
        super::internal_wallet::legacy_config_keep_reason(
            OTHER_TARI_ADDRESS,
            Some(&details.id),
            Some(&details),
        ),
        Some("address_mismatch"),
        "a legacy file describing another wallet is the only copy of that wallet's seed"
    );
    assert_eq!(
        super::internal_wallet::legacy_config_keep_reason(
            TEST_TARI_ADDRESS,
            Some(&details.id),
            Some(&details),
        ),
        None,
        "the legacy wallet is the wallet in use, so its file may be removed"
    );
}

/// `create_pin` tells an already enciphered Monero credential from a plain seed by decrypting it,
/// and falls back to the 32-byte plain length. Both only work while enciphering changes the length.
#[test]
fn an_enciphered_monero_seed_is_not_a_plain_one() {
    use tari_utilities::SafePassword;

    let pin = SafePassword::from("123456");
    let enciphered =
        super::utils::cryptography::encrypt(&[7u8; 32], &pin).expect("encipher the seed");

    assert_ne!(enciphered.len(), 32);
    assert!(super::utils::cryptography::decrypt(&enciphered, &pin).is_ok());
}

/// One fixture per evidence kind, plus the fresh install that must still be allowed through.
#[test]
fn previous_wallet_files_reports_each_evidence_kind() {
    let dir = tempfile::tempdir().expect("temp dir");
    let config_backup = dir.path().join("config_wallet.json.backup");
    let legacy_wallet_config = dir.path().join("wallet_config.json");

    assert_eq!(
        previous_wallet_files(&config_backup, &legacy_wallet_config),
        None,
        "a fresh install has no evidence and must be allowed to create a wallet"
    );

    std::fs::write(&legacy_wallet_config, "{}").expect("write legacy config");
    assert_eq!(
        previous_wallet_files(&config_backup, &legacy_wallet_config),
        Some("legacy_wallet_config")
    );

    std::fs::write(&config_backup, r#"{"tari_wallets":["abc123"]}"#).expect("write backup");
    assert_eq!(
        previous_wallet_files(&config_backup, &legacy_wallet_config),
        Some("config_backup")
    );

    std::fs::write(
        dir.path().join("config_wallet.json.corrupt.1790000000"),
        "\0",
    )
    .expect("write the config moved aside");
    assert_eq!(
        previous_wallet_files(&config_backup, &legacy_wallet_config),
        Some("wallet_config_unreadable"),
        "a config moved aside as unreadable outranks the evidence it caused"
    );
}

#[test]
fn previous_wallet_files_reads_the_backup_wallet_list() {
    let dir = tempfile::tempdir().expect("temp dir");
    let config_backup = dir.path().join("config_wallet.json.backup");
    let absent = dir.path().join("absent");

    std::fs::write(&config_backup, r#"{"tari_wallets":[]}"#).expect("write empty backup");
    assert_eq!(
        previous_wallet_files(&config_backup, &absent),
        None,
        "a backup of a config that never held a wallet is not evidence"
    );

    std::fs::write(
        &config_backup,
        r#"{"tari_wallets":[],"tari_wallet_details":{"id":"abc"}}"#,
    )
    .expect("write backup with cached details only");
    assert_eq!(
        previous_wallet_files(&config_backup, &absent),
        Some("config_backup"),
        "cached wallet details name a wallet even when the id list was emptied"
    );

    std::fs::write(&config_backup, "not json").expect("write corrupt backup");
    assert_eq!(
        previous_wallet_files(&config_backup, &absent),
        Some("config_backup"),
        "an unparseable backup fails closed"
    );
}
