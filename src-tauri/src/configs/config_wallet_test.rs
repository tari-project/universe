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

use std::{fs, str::FromStr};

use serde_json::Value;
use tari_common_types::tari_address::TariAddress;
use tari_transaction_components::tari_amount::MicroMinotari;

use super::config_wallet::{ConfigWallet, ConfigWalletContent, WalletId};
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

/// The shapes `config_wallet.json` was found in on the crash-looping machines.
/// The NUL-filled and truncated ones are derived from a real serialized config:
/// after an unclean shutdown NTFS restores the file length but not the data.
fn damaged_fixture(kind: &str) -> Vec<u8> {
    match kind {
        "invalid" => b"not json".to_vec(),
        "empty" => Vec::new(),
        "nul filled" => vec![0u8; valid_config_bytes().len()],
        "truncated" => {
            let valid = valid_config_bytes();
            valid[..valid.len() / 2].to_vec()
        }
        other => unreachable!("unknown fixture {other}"),
    }
}

fn valid_config_bytes() -> Vec<u8> {
    serde_json::to_vec_pretty(&sentinel_config_content()).expect("content should serialize")
}

#[test_case::test_case("invalid")]
#[test_case::test_case("empty")]
#[test_case::test_case("nul filled")]
#[test_case::test_case("truncated")]
fn an_unreadable_wallet_config_falls_back_to_defaults(kind: &str) {
    let directory = tempfile::tempdir().expect("temp dir");
    let path = directory.path().join("config_wallet.json");
    fs::write(&path, damaged_fixture(kind)).expect("fixture written");

    let content = ConfigWallet::load_or_recover(&path);

    assert!(content.tari_wallet_details().is_none(), "{kind} was parsed");
    assert!(
        !directory.path().join("config_wallet.json.backup").exists(),
        "{kind} must never become the backup"
    );
    assert!(!path.exists(), "{kind} must be moved aside");
    assert!(
        fs::read_dir(directory.path())
            .expect("temp dir readable")
            .any(|entry| {
                entry
                    .expect("dir entry")
                    .file_name()
                    .to_string_lossy()
                    .contains(".corrupt.")
            }),
        "{kind} must be kept under a .corrupt. name"
    );
}

#[test]
fn a_corrupt_wallet_config_is_recovered_from_the_backup() {
    let directory = tempfile::tempdir().expect("temp dir");
    let path = directory.path().join("config_wallet.json");
    let backup_path = directory.path().join("config_wallet.json.backup");
    let valid = valid_config_bytes();
    fs::write(&backup_path, &valid).expect("backup written");
    fs::write(&path, damaged_fixture("nul filled")).expect("fixture written");

    let content = ConfigWallet::load_or_recover(&path);

    assert_eq!(
        content
            .tari_wallet_details()
            .as_ref()
            .map(|details| details.id.as_str()),
        Some("wallet_sentinel_id"),
        "the backup should have been used"
    );
    assert_eq!(
        fs::read(&backup_path).expect("backup readable"),
        valid,
        "the backup must survive a corrupt primary"
    );
}
