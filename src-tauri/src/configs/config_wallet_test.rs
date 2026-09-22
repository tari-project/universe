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

//! Regression tests for the redaction of the wallet view private key
//! (GHSA-3wv6-9vwg-865r).
//!
//! `ConfigWalletContent` derives `Debug` and holds the view private key, so a
//! single `{:?}` on the config content used to be enough to write the key to a
//! log file. The key still has to be stored as plain hex, so only the `Debug`
//! output is masked.

use std::str::FromStr;

use serde_json::Value;
use tari_common_types::tari_address::TariAddress;
use tari_transaction_components::tari_amount::MicroMinotari;

use super::config_wallet::{ConfigWalletContent, WalletId};
use crate::internal_wallet::{TariWalletDetails, ViewPrivateKeyHex};

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

fn sentinel_config_content() -> ConfigWalletContent {
    let mut content = ConfigWalletContent::default();
    content.set_tari_wallet_details(Some(sentinel_wallet_details()));
    content
}

#[test]
fn config_wallet_content_debug_redacts_view_private_key() {
    let debug_output = format!("{:?}", sentinel_config_content());

    assert!(
        !debug_output.contains("view_key_sentinel"),
        "view private key leaked into Debug output: {debug_output}"
    );
    assert!(debug_output.contains("REDACTED"), "{debug_output}");
}

#[test]
fn config_wallet_content_serialization_keeps_the_plain_key() {
    let serialized =
        serde_json::to_value(sentinel_config_content()).expect("content should serialize");

    assert_eq!(
        serialized
            .get("tari_wallet_details")
            .and_then(|details| details.get("view_private_key_hex"))
            .and_then(serde_json::Value::as_str),
        Some(VIEW_KEY_SENTINEL),
        "config_wallet.json must keep the plain hex key"
    );
}

#[test]
fn frontend_payload_never_carries_the_wallet_details() {
    let content = sentinel_config_content();
    let serialized =
        serde_json::to_string(&content.to_frontend_payload()).expect("payload should serialize");

    assert!(
        !serialized.contains("view_key_sentinel"),
        "view private key leaked into the webview payload: {serialized}"
    );
    assert!(
        !serialized.contains("tari_wallet_details"),
        "wallet details leaked into the webview payload: {serialized}"
    );
    assert!(
        !serialized.contains("view_private_key_hex"),
        "view key field leaked into the webview payload: {serialized}"
    );
}

#[test]
fn frontend_payload_keeps_the_fields_the_frontend_reads() {
    let mut content = sentinel_config_content();
    content.set_user_monero_address("monero_address_for_the_ui".to_string());
    content.set_last_known_balance(MicroMinotari(4242));

    let serialized =
        serde_json::to_value(content.to_frontend_payload()).expect("payload should serialize");

    assert_eq!(
        serialized.get("monero_address").and_then(Value::as_str),
        Some("monero_address_for_the_ui")
    );
    assert_eq!(
        serialized
            .get("monero_address_is_generated")
            .and_then(Value::as_bool),
        Some(false)
    );
    assert_eq!(
        serialized.get("last_known_balance").and_then(Value::as_u64),
        Some(4242)
    );
    assert!(
        serialized.get("wxtm_addresses").is_some(),
        "wxtm_addresses must reach the frontend: {serialized}"
    );
}

#[test]
fn persistence_still_serializes_the_plain_view_key() {
    // The webview payload is sanitized, but `config_wallet.json` must stay
    // byte-identical: `_save_config` serializes the content itself.
    let serialized =
        serde_json::to_value(sentinel_config_content()).expect("content should serialize");

    assert_eq!(
        serialized
            .get("tari_wallet_details")
            .and_then(|details| details.get("view_private_key_hex"))
            .and_then(Value::as_str),
        Some(VIEW_KEY_SENTINEL),
        "on-disk wallet config must keep the plain hex key"
    );
}

use super::config_wallet::ConfigWallet;
use super::trait_config::{ConfigImpl, atomic_write};
use std::fs;

/// The shapes `config_wallet.json` was found in on the crashing machines.
///
/// "nul filled" and "truncated" are derived from a *real* serialized config so
/// they have the length NTFS reports after an unclean shutdown, where the
/// metadata is journaled and the data is not.
fn damaged_fixture(kind: &str) -> Vec<u8> {
    let valid = serde_json::to_vec_pretty(&sentinel_config_content()).unwrap();
    match kind {
        "invalid" => b"not json".to_vec(),
        "empty" => Vec::new(),
        "nul filled" => vec![0u8; valid.len()],
        "truncated" => valid[..valid.len() / 2].to_vec(),
        "bom prefixed" => {
            let mut bytes = vec![0xef, 0xbb, 0xbf];
            bytes.extend_from_slice(&valid);
            bytes
        }
        other => unreachable!("unknown fixture {other}"),
    }
}

#[test_case::test_case("invalid")]
#[test_case::test_case("empty")]
#[test_case::test_case("nul filled")]
#[test_case::test_case("truncated")]
#[test_case::test_case("bom prefixed")]
fn corrupt_wallet_config_is_preserved_and_recovery_survives_restart(kind: &str) {
    let corrupt = damaged_fixture(kind);
    let directory = tempfile::tempdir().unwrap();
    let path = directory.path().join("config_wallet.json");
    fs::write(&path, &corrupt).unwrap();
    let config = ConfigWallet::load_from_path(&path);
    assert!(*config.corrupted_recovery());
    assert!(config.ensure_available().is_err());
    // Refused on the flag alone, before `_get_config_path` is consulted, so the
    // recovery placeholder can never be written over a real wallet config.
    assert!(ConfigWallet::_save_config(config).is_err());
    assert!(!path.exists());
    let quarantined = fs::read_dir(directory.path())
        .unwrap()
        .map(|entry| entry.unwrap().path())
        .find(|entry| {
            entry
                .file_name()
                .unwrap()
                .to_string_lossy()
                .contains(".corrupted.")
        })
        .unwrap();
    assert_eq!(fs::read(quarantined).unwrap(), corrupt);
    assert!(*ConfigWallet::load_from_path(&path).corrupted_recovery());
    assert!(
        !path.exists(),
        "restart must not create a replacement wallet config"
    );
}

#[test]
fn valid_backup_restores_wallet_identity_without_overwriting_backup() {
    let directory = tempfile::tempdir().unwrap();
    let path = directory.path().join("config_wallet.json");
    let backup = path.with_extension("json.backup");
    let mut content = sentinel_config_content();
    content.set_tari_wallets(vec![WalletId::new("original".into())]);
    let serialized = serde_json::to_vec_pretty(&content).unwrap();
    fs::write(&path, b"\0\0\0").unwrap();
    fs::write(&backup, &serialized).unwrap();
    let restored = ConfigWallet::load_from_path(&path);
    assert!(!restored.corrupted_recovery());
    assert_eq!(restored.tari_wallets(), content.tari_wallets());
    assert_eq!(fs::read(&path).unwrap(), serialized);
    assert_eq!(fs::read(&backup).unwrap(), serialized);
}

#[test]
fn invalid_backup_is_not_promoted_or_overwritten() {
    let directory = tempfile::tempdir().unwrap();
    let path = directory.path().join("config_wallet.json");
    let backup = path.with_extension("json.backup");
    fs::write(&path, b"truncated").unwrap();
    fs::write(&backup, b"also truncated").unwrap();
    assert!(*ConfigWallet::load_from_path(&path).corrupted_recovery());
    assert_eq!(fs::read(&backup).unwrap(), b"also truncated");
    assert!(*ConfigWallet::load_from_path(&path).corrupted_recovery());
}

#[test]
fn valid_primary_is_not_rewritten_and_replaces_stale_backup() {
    let directory = tempfile::tempdir().unwrap();
    let path = directory.path().join("config_wallet.json");
    let backup = path.with_extension("json.backup");
    let serialized = serde_json::to_vec_pretty(&sentinel_config_content()).unwrap();
    fs::write(&path, &serialized).unwrap();
    fs::write(&backup, b"bad backup").unwrap();
    let file = fs::OpenOptions::new().write(true).open(&path).unwrap();
    let old_time = std::time::SystemTime::UNIX_EPOCH + std::time::Duration::from_secs(1_000_000);
    file.set_modified(old_time).unwrap();
    drop(file);
    let before = fs::metadata(&path).unwrap().modified().unwrap();
    assert!(!ConfigWallet::load_from_path(&path).corrupted_recovery());
    assert_eq!(fs::metadata(&path).unwrap().modified().unwrap(), before);
    assert_eq!(fs::read(&path).unwrap(), serialized);
    assert_eq!(fs::read(&backup).unwrap(), serialized);
}

#[test]
fn missing_primary_uses_backup_and_invalid_backup_requires_recovery() {
    let directory = tempfile::tempdir().unwrap();
    let path = directory.path().join("config_wallet.json");
    let backup = path.with_extension("json.backup");
    fs::write(
        &backup,
        serde_json::to_vec(&sentinel_config_content()).unwrap(),
    )
    .unwrap();
    assert!(!ConfigWallet::load_from_path(&path).corrupted_recovery());
    assert!(path.exists());
    fs::remove_file(&path).unwrap();
    fs::write(&backup, b"bad backup").unwrap();
    assert!(*ConfigWallet::load_from_path(&path).corrupted_recovery());
    assert!(!path.exists());
}

#[test]
fn failed_recovery_marker_write_keeps_corrupt_primary() {
    let directory = tempfile::tempdir().unwrap();
    let path = directory.path().join("config_wallet.json");
    fs::write(&path, b"original damaged content").unwrap();
    fs::create_dir_all(path.with_extension("json.recovery_required")).unwrap();
    assert!(*ConfigWallet::load_from_path(&path).corrupted_recovery());
    assert_eq!(fs::read(&path).unwrap(), b"original damaged content");
}

#[test]
fn manually_restored_primary_can_leave_recovery() {
    let directory = tempfile::tempdir().unwrap();
    let path = directory.path().join("config_wallet.json");
    let marker = path.with_extension("json.recovery_required");
    fs::write(&path, b"bad config").unwrap();
    assert!(*ConfigWallet::load_from_path(&path).corrupted_recovery());
    assert!(marker.exists(), "recovery must be recorded durably");
    fs::write(
        &path,
        serde_json::to_vec(&sentinel_config_content()).unwrap(),
    )
    .unwrap();
    assert!(!ConfigWallet::load_from_path(&path).corrupted_recovery());
    assert!(
        !marker.exists(),
        "a valid config must clear the recovery marker"
    );
}

#[test]
fn recovery_flag_is_never_written_into_the_config_file() {
    // The flag lives in memory only; the durable record is the marker file.
    // A serialized `corrupted_recovery: false` in a file that was born out of a
    // recovery would be worse than no flag at all.
    let serialized = serde_json::to_value(ConfigWalletContent::default()).unwrap();
    assert!(
        serialized.get("corrupted_recovery").is_none(),
        "recovery flag must not be a persisted field: {serialized}"
    );

    let directory = tempfile::tempdir().unwrap();
    let path = directory.path().join("config_wallet.json");
    fs::write(&path, br#"{"corrupted_recovery": true}"#).unwrap();
    assert!(
        !ConfigWallet::load_from_path(&path).corrupted_recovery(),
        "a file claiming recovery must not put a parseable config into recovery"
    );
}

#[test]
fn atomic_save_replaces_complete_content_and_cleans_up_failed_temp_files() {
    let directory = tempfile::tempdir().unwrap();
    let path = directory.path().join("config.json");
    atomic_write(&path, b"old complete content").unwrap();
    atomic_write(&path, b"new").unwrap();
    assert_eq!(fs::read(&path).unwrap(), b"new");
    let blocked = directory.path().join("blocked.json");
    fs::create_dir_all(&blocked).unwrap();
    assert!(atomic_write(&blocked, b"cannot replace a directory").is_err());
    assert_eq!(fs::read_dir(directory.path()).unwrap().count(), 2);
}

#[test]
fn payment_id_migration_renames_keys_once_and_preserves_string_values() {
    let directory = tempfile::tempdir().unwrap();
    let path = directory.path().join("config_wallet.json");
    let serialized = br#"{
        "monero_address": "payment_id_user_data",
        "future_field": [{"payment_id_user_data" : [1,2,3]}]
    }"#;
    fs::write(&path, serialized).unwrap();
    assert!(!ConfigWallet::load_from_path(&path).corrupted_recovery());
    let migrated_bytes = fs::read(&path).unwrap();
    let migrated: Value = serde_json::from_slice(&migrated_bytes).unwrap();
    assert_eq!(
        migrated["future_field"][0]["memo_field_payment_id"],
        serde_json::json!([1, 2, 3])
    );
    assert_eq!(migrated["monero_address"], "payment_id_user_data");
    assert!(
        migrated["future_field"][0]
            .get("payment_id_user_data")
            .is_none()
    );
    assert!(!ConfigWallet::load_from_path(&path).corrupted_recovery());
    assert_eq!(fs::read(&path).unwrap(), migrated_bytes);
    assert_eq!(
        fs::read(path.with_extension("json.backup")).unwrap(),
        migrated_bytes
    );
}

/// A config that parsed is a config we can run on. Only *persisting* the `payment_id_user_data`
/// rename failed here (a read-only directory stands in for a full disk or an antivirus lock),
/// and the rename is idempotent: the next successful save writes the new form, and a launch that
/// never saves migrates again. Returning the recovery placeholder instead would put a user whose
/// wallet id list is intact and in hand behind the recovery screen.
#[cfg(unix)]
#[test]
fn unwritable_directory_does_not_turn_a_readable_config_into_recovery() {
    use std::os::unix::fs::PermissionsExt;

    let directory = tempfile::tempdir().unwrap();
    let path = directory.path().join("config_wallet.json");
    let serialized = br#"{"tari_wallets": ["abc123"], "payment_id_user_data": "x"}"#;
    fs::write(&path, serialized).unwrap();

    let original = fs::metadata(directory.path()).unwrap().permissions();
    let mut readonly = original.clone();
    readonly.set_mode(0o555);
    fs::set_permissions(directory.path(), readonly).unwrap();

    let content = ConfigWallet::load_from_path(&path);

    fs::set_permissions(directory.path(), original).unwrap();

    assert!(
        !content.corrupted_recovery(),
        "a config that parsed must not be replaced by the recovery placeholder"
    );
    assert_eq!(
        content.tari_wallets().len(),
        1,
        "the wallet id list survives the failed write"
    );
    assert_eq!(
        fs::read(&path).unwrap(),
        serialized,
        "nothing was written, so the original file is untouched"
    );
}

#[test]
fn failed_backup_write_does_not_poison_valid_primary() {
    let directory = tempfile::tempdir().unwrap();
    let path = directory.path().join("config_wallet.json");
    let serialized = serde_json::to_vec(&sentinel_config_content()).unwrap();
    fs::write(&path, &serialized).unwrap();
    fs::create_dir_all(path.with_extension("json.backup")).unwrap();
    assert!(!ConfigWallet::load_from_path(&path).corrupted_recovery());
    assert_eq!(fs::read(path).unwrap(), serialized);
}

#[test]
fn failed_backup_restore_preserves_backup_and_requires_recovery() {
    let directory = tempfile::tempdir().unwrap();
    let path = directory.path().join("config_wallet.json");
    fs::create_dir_all(&path).unwrap();
    let backup = path.with_extension("json.backup");
    let serialized = serde_json::to_vec(&sentinel_config_content()).unwrap();
    fs::write(&backup, &serialized).unwrap();
    assert!(*ConfigWallet::load_from_path(&path).corrupted_recovery());
    assert_eq!(fs::read(backup).unwrap(), serialized);
}

/// Re-linking back and forth between two wallets must not grow `tari_wallets` without bound;
/// the purge gate reads that list and every id in it has to stay distinct.
#[test]
fn selecting_a_wallet_twice_does_not_list_it_twice() {
    let mut content = ConfigWalletContent::default();
    let first = sentinel_wallet_details();
    let mut second = sentinel_wallet_details();
    second.id = WalletId::new("second_wallet".to_string());

    content.add_tari_wallet(first.clone());
    content.add_tari_wallet(second.clone());
    content.add_tari_wallet(first.clone());

    assert_eq!(
        content.tari_wallets(),
        &vec![first.id.clone(), second.id.clone()],
        "the re-selected wallet moves to the front, the other one stays exactly once"
    );
}

/// The wallet-init guard reads this flag through
/// `internal_wallet::wallet_config_is_corrupted_recovery`. Nothing else in the suite notices if
/// that reader starts answering `false` unconditionally.
#[test]
fn wallet_init_refuses_a_recovery_placeholder_config() {
    use crate::internal_wallet::wallet_config_is_corrupted_recovery;

    let directory = tempfile::tempdir().unwrap();
    let path = directory.path().join("config_wallet.json");
    fs::write(&path, damaged_fixture("nul filled")).unwrap();
    let recovered = ConfigWallet::load_from_path(&path);
    assert!(
        wallet_config_is_corrupted_recovery(&recovered),
        "a config recovered from a corrupt file must never reach the create-a-new-wallet branch"
    );

    let valid_path = directory.path().join("valid_config_wallet.json");
    fs::write(
        &valid_path,
        serde_json::to_vec(&sentinel_config_content()).unwrap(),
    )
    .unwrap();
    assert!(
        !wallet_config_is_corrupted_recovery(&ConfigWallet::load_from_path(&valid_path)),
        "a config that parsed must not be treated as a recovery placeholder"
    );
}

/// The startup probe's rate-limit record lives in this config, so two things have to hold: a
/// config written before the fields existed must still parse, and the timestamp and its outcome
/// must be written together.
#[test]
fn seed_probe_result_is_recorded_without_breaking_older_configs() {
    let older_config = serde_json::to_value(ConfigWalletContent::default()).unwrap();
    let mut older_config = older_config.as_object().unwrap().clone();
    older_config.remove("seed_probe_last_unix");
    older_config.remove("seed_probe_last_outcome");
    older_config.remove("seed_probe_last_wallet_id");
    let parsed: ConfigWalletContent =
        serde_json::from_value(Value::Object(older_config)).expect("older configs must parse");
    assert_eq!(*parsed.seed_probe_last_unix(), 0);
    assert_eq!(parsed.seed_probe_last_outcome(), &None);

    let mut content = ConfigWalletContent::default();
    content.set_seed_probe_result((
        1_700_000_000,
        "unavailable_no_entry",
        WalletId::new("probed_wallet".to_string()),
    ));
    assert_eq!(*content.seed_probe_last_unix(), 1_700_000_000);
    assert_eq!(
        content.seed_probe_last_outcome().as_deref(),
        Some("unavailable_no_entry")
    );
    assert_eq!(
        content
            .seed_probe_last_wallet_id()
            .as_ref()
            .map(WalletId::as_str),
        Some("probed_wallet"),
        "a verdict without the wallet it is about gets reused for a wallet it never looked at"
    );

    // A tag written by a newer version must not take the whole config down with it: an unknown
    // value here would otherwise quarantine a perfectly good config.
    let mut future_config = serde_json::to_value(&content).unwrap();
    future_config["seed_probe_last_outcome"] = Value::String("something_new".to_string());
    let parsed: ConfigWalletContent =
        serde_json::from_value(future_config).expect("unknown outcome tags must still parse");
    assert_eq!(
        parsed.seed_probe_last_outcome().as_deref(),
        Some("something_new")
    );
}

/// Both advertised ways out of a corrupted config - re-linking a wallet from the credential store
/// and importing seed words - end in this one write, and `load_latest_version` opens the result on
/// the next launch. Neither entry point can be driven here (both need an `AppHandle`, a real
/// keyring and a PIN manager), so the test drives the write itself and asserts the exact check
/// `load_latest_version` runs first.
#[test]
fn adopting_a_wallet_out_of_a_recovery_placeholder_yields_a_loadable_config() {
    let directory = tempfile::tempdir().unwrap();
    let path = directory.path().join("config_wallet.json");
    fs::write(&path, damaged_fixture("nul filled")).unwrap();
    let mut placeholder = ConfigWallet::load_from_path(&path);
    assert!(placeholder.ensure_loadable().is_err());

    let details = sentinel_wallet_details();
    placeholder.adopt_recovered_tari_wallet((
        details.clone(),
        Some((
            "44AFFq5kSiGBoZ4NMDwYtN18obc8AemS33DBLWs3H7otXft3XjrpDtQGv7SqSsaBYBb98uNbr2VBBEt7f2wfn3RVGQBEP3A".to_string(),
            WalletId::new("monero_2".to_string()),
        )),
    ));

    assert!(!placeholder.corrupted_recovery());
    assert!(
        placeholder.ensure_loadable().is_ok(),
        "the adopted config has to pass the check `load_latest_version` starts with"
    );
    assert_eq!(placeholder.tari_wallets(), &vec![details.id.clone()]);
    assert!(placeholder.monero_address_is_generated());
}

/// The adoption is the only write a placeholder accepts, so an incomplete one must not reach the
/// disk: the previous release panics on a config whose `monero_address` is empty, and this one
/// fails to load it on every launch.
#[test]
fn an_adoption_without_a_monero_address_is_refused_rather_than_persisted() {
    let directory = tempfile::tempdir().unwrap();
    let path = directory.path().join("config_wallet.json");
    fs::write(&path, damaged_fixture("empty")).unwrap();
    let mut placeholder = ConfigWallet::load_from_path(&path);

    placeholder.adopt_recovered_tari_wallet((sentinel_wallet_details(), None));

    assert!(
        placeholder.corrupted_recovery(),
        "an adoption that cannot be loaded back must leave the placeholder flag alone"
    );
    assert!(placeholder.ensure_loadable().is_err());
    assert!(ConfigWallet::_save_config(placeholder).is_err());
}

/// A config written by a recovery exit is opened by the previous release too, and that build
/// panics on an empty `monero_address`.
#[test]
fn the_config_a_recovery_exit_writes_carries_every_field_an_older_build_reads() {
    let directory = tempfile::tempdir().unwrap();
    let path = directory.path().join("config_wallet.json");
    fs::write(&path, damaged_fixture("truncated")).unwrap();
    let mut placeholder = ConfigWallet::load_from_path(&path);
    placeholder.adopt_recovered_tari_wallet((
        sentinel_wallet_details(),
        Some((
            "44AFFq5kSiGBoZ4NMDwYtN18obc8AemS33DBLWs3H7otXft3XjrpDtQGv7SqSsaBYBb98uNbr2VBBEt7f2wfn3RVGQBEP3A".to_string(),
            WalletId::new("monero".to_string()),
        )),
    ));

    let serialized = serde_json::to_value(&placeholder).unwrap();
    assert!(
        !serialized["monero_address"].as_str().unwrap().is_empty(),
        "an empty monero_address panics the previous release's loader"
    );
    assert_eq!(serialized["tari_wallets"].as_array().unwrap().len(), 1);
    assert_eq!(
        serialized["version_counter"].as_u64(),
        Some(u64::from(super::config_wallet::WALLET_VERSION))
    );
    assert!(
        serialized.get("corrupted_recovery").is_none(),
        "the in-memory recovery flag is never written to disk"
    );
    let reparsed: ConfigWalletContent = serde_json::from_value(serialized).unwrap();
    assert!(reparsed.ensure_loadable().is_ok());
}

/// A re-link that fails to initialise puts the previous selection back. The wallet it tried is
/// deliberately left in the list: re-linking must never be the thing that loses a wallet id, and
/// the purge gate reads that list.
#[test]
fn a_failed_relink_restores_the_previous_selection_without_dropping_the_id() {
    let previous = sentinel_wallet_details();
    let mut attempted = sentinel_wallet_details();
    attempted.id = WalletId::new("relinked_wallet".to_string());

    let mut content = ConfigWalletContent::default();
    content.add_tari_wallet(previous.clone());
    content.add_tari_wallet(attempted.clone());
    assert_eq!(
        content.tari_wallet_details().as_ref().map(|d| d.id.clone()),
        Some(attempted.id.clone())
    );

    content.set_tari_wallet_details(Some(previous.clone()));

    assert_eq!(
        content.tari_wallet_details().as_ref().map(|d| d.id.clone()),
        Some(previous.id.clone()),
        "the wallet the app was using is selected again"
    );
    assert_eq!(
        content.tari_wallets(),
        &vec![attempted.id, previous.id],
        "both ids stay listed; the rollback only moves the selection"
    );
}
