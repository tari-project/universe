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

//! Regression tests for the "Send Logs" support bundle.
//!
//! The archive used to copy every `*.json`/`*.toml`/... file out of the app
//! config directory, which shipped the airdrop tokens, the wallet view key and
//! the MCP bearer token to the feedback endpoint. Nothing from the config
//! directory may end up in the archive any more: the only configuration that
//! travels is the allowlisted `SupportDiagnostics` document plus the redacted
//! `WalletStatus` document.
//!
//! `WalletStatus` exists so that a "my seeds are gone" report is diagnosable
//! from the bundle alone. It is built from the same wallet config that holds
//! the view private key, so every test below plants sentinel secrets in a
//! fixture config and asserts none of them reach the document.

use std::fs;
use std::io::Read;
use std::path::Path;
use std::str::FromStr;

use serde_json::Value;
use tari_common_types::tari_address::TariAddress;

use crate::configs::config_wallet::{ConfigWalletContent, WalletId};
use crate::credential_manager::{Credential, CredentialError};
use crate::feedback::{
    KeyringEntryReport, KeyringEntryState, ProbeOrigin, SeedBlobKind, SupportDiagnostics,
    WalletStatus, create_support_archive, record_startup_probe_outcome, scan_wallet_files,
    startup_keyring_probe,
};
use crate::internal_wallet::{TariWalletDetails, ViewPrivateKeyHex};
use crate::pin::PinLockerState;

const AIRDROP_TOKEN_SENTINEL: &str = "airdrop_token_sentinel";
const REFRESH_TOKEN_SENTINEL: &str = "refresh_token_sentinel";
const VIEW_KEY_SENTINEL: &str = "view_key_sentinel";
const MCP_BEARER_SENTINEL: &str = "mcp_bearer_sentinel";
const LEGACY_WALLET_SENTINEL: &str = "legacy_wallet_sentinel";
/// Plaintext CBOR seed written by pre-keyring versions.
const LEGACY_FALLBACK_SENTINEL: &str = "legacy_fallback_sentinel";
/// A full Tari address. Only its first 8 characters may travel.
const TEST_TARI_ADDRESS: &str =
    "f25eNHz2YnBVKHaqNuacGyDFB321RwwCnTr4vb2SjQCgDZVXyNNthc7zftQKRDu6evLjvSUD8W5akpPMdhS4HQ9kF3g";
/// Network directory used by the file-scan fixtures.
const TEST_NETWORK: &str = "esmeralda";
/// An OS user name embedded in an absolute path inside a log line. It is not a
/// config secret, but uploaded logs must not identify the user either.
const USERNAME_SENTINEL: &str = "doxxed_user_name";

const SENTINELS: [&str; 6] = [
    AIRDROP_TOKEN_SENTINEL,
    REFRESH_TOKEN_SENTINEL,
    VIEW_KEY_SENTINEL,
    MCP_BEARER_SENTINEL,
    LEGACY_WALLET_SENTINEL,
    LEGACY_FALLBACK_SENTINEL,
];

fn sample_diagnostics() -> SupportDiagnostics {
    SupportDiagnostics {
        app_version: "1.2.3".to_string(),
        network: "esmeralda".to_string(),
        anon_id: "anon_id_for_tests".to_string(),
        exchange_id: "universal".to_string(),
        allow_telemetry: true,
        allow_notifications: false,
        use_tor: true,
        auto_update: true,
        pre_release: false,
        remote_base_node_is_default: true,
        node_type: "Remote".to_string(),
        mmproxy_use_monero_failover: false,
        cpu_mining_enabled: true,
        gpu_mining_enabled: false,
        mine_on_app_start: true,
        selected_mining_mode: "Eco".to_string(),
        available_mining_modes: vec!["Eco".to_string(), "Turbo".to_string()],
        is_lolminer_tested: false,
        is_gpu_mining_recommended: true,
        cpu_pool_enabled: true,
        cpu_pool_type: "SupportXTMPoolRANDOMX".to_string(),
        gpu_pool_enabled: false,
        gpu_pool_type: "LuckyPoolC29".to_string(),
        application_language: "en".to_string(),
        should_always_use_system_language: false,
        display_mode: "System".to_string(),
        visual_mode: true,
        show_experimental_settings: false,
        wallet_ui_mode: "Standard".to_string(),
        has_internal_wallet: true,
        tari_wallets_count: 1,
        credential_store_accessed: true,
        wallet_backed_up: false,
        wallet_migration_nonce: 7,
        monero_wallet_is_generated: true,
    }
}

/// Lays out a realistic app directory: logs next to the app config directory,
/// every config file stuffed with a sentinel secret.
fn setup_app_dirs(root: &Path) -> std::io::Result<std::path::PathBuf> {
    let logs_dir = root.join("logs");
    let config_dir = root.join("configs");
    fs::create_dir_all(&logs_dir)?;
    fs::create_dir_all(&config_dir)?;

    fs::write(
        logs_dir.join("universe.log"),
        format!(
            "INFO harmless log line, nothing secret here\n\
             INFO config path: \"C:\\\\Users\\\\{USERNAME_SENTINEL}\\\\AppData\\\\Local\\\\com.tari.universe\"\n"
        ),
    )?;
    // A bundle left behind by a failed upload must not be nested into the next one.
    fs::write(
        logs_dir.join("logs_config_old.zip"),
        b"PK\x03\x04stale-bundle",
    )?;

    fs::write(
        config_dir.join("config_core.json"),
        format!(
            r#"{{"anon_id":"anon","airdrop_tokens":{{"token":"{AIRDROP_TOKEN_SENTINEL}","refresh_token":"{REFRESH_TOKEN_SENTINEL}"}}}}"#
        ),
    )?;
    fs::write(
        config_dir.join("config_wallet.json"),
        format!(r#"{{"tari_wallet_details":{{"view_private_key_hex":"{VIEW_KEY_SENTINEL}"}}}}"#),
    )?;
    fs::write(
        config_dir.join("config_mcp.json"),
        format!(r#"{{"bearer_token":"{MCP_BEARER_SENTINEL}"}}"#),
    )?;

    let network_dir = config_dir.join(TEST_NETWORK);
    fs::create_dir_all(&network_dir)?;
    fs::write(
        network_dir.join("wallet_config.json"),
        format!(r#"{{"seed_words":"{LEGACY_WALLET_SENTINEL}"}}"#),
    )?;

    Ok(logs_dir)
}

struct ArchiveContents {
    names: Vec<String>,
    files: Vec<(String, Vec<u8>)>,
}

fn read_archive(archive_file: &Path) -> ArchiveContents {
    let file = fs::File::open(archive_file).expect("archive should exist");
    let mut archive = zip::ZipArchive::new(file).expect("archive should be a valid zip");

    let mut names = Vec::new();
    let mut files = Vec::new();
    for index in 0..archive.len() {
        let mut entry = archive
            .by_index(index)
            .expect("zip entry should be readable");
        let name = entry.name().to_string();
        names.push(name.clone());
        if entry.is_file() {
            let mut bytes = Vec::new();
            entry
                .read_to_end(&mut bytes)
                .expect("zip entry should read");
            files.push((name, bytes));
        }
    }

    ArchiveContents { names, files }
}

#[test]
fn support_archive_contains_no_config_files_or_secrets() {
    let temp_dir = tempfile::tempdir().expect("temp dir");
    let logs_dir = setup_app_dirs(temp_dir.path()).expect("app dirs");

    let diagnostics = sample_diagnostics();
    let (archive_file, zip_filename) =
        create_support_archive(&logs_dir, &diagnostics, &sample_wallet_status())
            .expect("archive should be created");

    assert_eq!(zip_filename, "logs_config_anon_id_for_tests.zip");
    assert_eq!(archive_file, logs_dir.join(&zip_filename));

    let contents = read_archive(&archive_file);

    // No member of the archive may carry any of the config secrets.
    for (name, bytes) in &contents.files {
        let as_text = String::from_utf8_lossy(bytes);
        for sentinel in SENTINELS {
            assert!(
                !as_text.contains(sentinel),
                "secret `{sentinel}` leaked into archive member `{name}`"
            );
        }
    }

    // The only thing under `configs/` is the allowlisted diagnostics document.
    let config_members: Vec<&String> = contents
        .names
        .iter()
        .filter(|name| name.starts_with("configs/"))
        .collect();
    assert_eq!(
        config_members,
        vec!["configs/diagnostics.json", "configs/wallet_status.json"],
        "unexpected members under configs/: {config_members:?}"
    );

    // Logs are still collected...
    assert!(
        contents.names.contains(&"logs/universe.log".to_string()),
        "log file missing from archive: {:?}",
        contents.names
    );
    // ...with the OS user name scrubbed out of any absolute paths they contain...
    let (_, log_bytes) = contents
        .files
        .iter()
        .find(|(name, _)| name == "logs/universe.log")
        .expect("log member present");
    let log_text = String::from_utf8_lossy(log_bytes);
    assert!(
        !log_text.contains(USERNAME_SENTINEL),
        "OS user name leaked into archived log: {log_text}"
    );
    assert!(
        log_text.contains("C:\\\\Users\\\\<user>\\\\AppData"),
        "scrubbed path placeholder missing from archived log: {log_text}"
    );
    // ...but a stale bundle from a failed upload is not nested into this one,
    // and neither is the archive being written.
    assert!(
        !contents.names.iter().any(|name| name.ends_with(".zip")),
        "a zip was nested into the archive: {:?}",
        contents.names
    );

    let diagnostics_bytes = contents
        .files
        .iter()
        .find(|(name, _)| name == "configs/diagnostics.json")
        .map(|(_, bytes)| bytes.clone())
        .expect("diagnostics document should be present");
    let parsed: Value =
        serde_json::from_slice(&diagnostics_bytes).expect("diagnostics should be valid JSON");
    assert_eq!(parsed["app_version"], "1.2.3");
    assert_eq!(parsed["network"], "esmeralda");
    assert_eq!(parsed["anon_id"], "anon_id_for_tests");
    assert_eq!(parsed["has_internal_wallet"], true);
    assert_eq!(parsed["cpu_mining_enabled"], true);
}

#[test]
fn diagnostics_never_serializes_secret_shaped_fields() {
    let serialized =
        serde_json::to_string(&sample_diagnostics()).expect("diagnostics should serialize");

    for sentinel in SENTINELS {
        assert!(
            !serialized.contains(sentinel),
            "secret `{sentinel}` leaked into the diagnostics document"
        );
    }

    let parsed: Value = serde_json::from_str(&serialized).expect("diagnostics should be JSON");
    let object = parsed
        .as_object()
        .expect("diagnostics should be a JSON object");

    // A new field whose name looks like a credential is almost certainly a
    // secret that must not travel in a support bundle.
    const FORBIDDEN_NAME_PARTS: [&str; 8] = [
        "token", "key", "seed", "pin", "secret", "url", "address", "host",
    ];
    for field_name in object.keys() {
        let lowercased = field_name.to_lowercase();
        for forbidden in FORBIDDEN_NAME_PARTS {
            assert!(
                !lowercased.contains(forbidden),
                "diagnostics field `{field_name}` looks like a secret (contains `{forbidden}`)"
            );
        }
    }
}

// =============================================================================
// Redacted wallet status document
// =============================================================================

/// A wallet config whose every secret-carrying field holds a sentinel.
fn sentinel_wallet_config() -> ConfigWalletContent {
    let mut content = ConfigWalletContent::default();
    content.set_version_counter(2);
    content.set_tari_wallets(vec![
        WalletId::new("abc123".to_string()),
        WalletId::new("def456".to_string()),
    ]);
    content.set_tari_wallet_details(Some(TariWalletDetails {
        id: WalletId::new("abc123".to_string()),
        tari_address: TariAddress::from_str(TEST_TARI_ADDRESS).expect("valid test address"),
        wallet_birthday: 1234,
        view_private_key_hex: ViewPrivateKeyHex::new(VIEW_KEY_SENTINEL.to_string()),
        spend_public_key_hex: LEGACY_WALLET_SENTINEL.to_string(),
    }));
    content.set_generated_monero_address(LEGACY_FALLBACK_SENTINEL.to_string());
    content.set_keyring_accessed(true);
    content.set_seed_backed_up(false);
    content.set_wallet_migration_nonce(3);

    let mut pin_locker_state = PinLockerState::default();
    pin_locker_state.set_pin_locked(true);
    pin_locker_state.set_failed_pin_attempts(2);
    content.set_pin_locker_state(pin_locker_state);

    content
}

fn sample_wallet_status() -> WalletStatus {
    let mut status = WalletStatus::from_config_content(&sentinel_wallet_config(), TEST_NETWORK);
    status.keyring_entries = vec![
        KeyringEntryReport {
            wallet_id: "abc123".to_string(),
            state: KeyringEntryState::NoEntry,
            error_kind: Some("no_entry".to_string()),
            blob_len: None,
            blob_kind: SeedBlobKind::Unknown,
            origin: ProbeOrigin::Startup,
        },
        KeyringEntryReport {
            wallet_id: "monero".to_string(),
            state: KeyringEntryState::Readable,
            error_kind: None,
            blob_len: Some(48),
            blob_kind: SeedBlobKind::Unknown,
            origin: ProbeOrigin::BundleAssembly,
        },
    ];
    status
}

/// Every key a support engineer reads off the document. Renaming one of these
/// silently breaks the "seeds lost" triage, so they are pinned here.
const WALLET_STATUS_KEYS: [&str; 18] = [
    "app_version",
    "os",
    "os_arch",
    "network",
    "config_readable",
    "config_version_counter",
    "wallet_ids",
    "tari_wallet_details_cached",
    "tari_address_prefix",
    "external_tari_address_selected",
    "pin_locked",
    "failed_pin_attempts",
    "keyring_accessed",
    "seed_backed_up",
    "monero_address_is_generated",
    "wallet_migration_nonce",
    "keyring_entries",
    "files",
];

#[test]
fn wallet_status_reports_the_expected_keys() {
    let status = sample_wallet_status();
    let parsed: Value = serde_json::to_value(&status).expect("wallet status should serialize");
    let object = parsed
        .as_object()
        .expect("wallet status should be a JSON object");

    for key in WALLET_STATUS_KEYS {
        assert!(
            object.contains_key(key),
            "wallet status is missing `{key}`: {:?}",
            object.keys().collect::<Vec<_>>()
        );
    }
    // Unknown must be reported as `null`, never silently dropped: a missing key
    // and a `false` both read as "fine" during triage.
    assert_eq!(
        object.len(),
        WALLET_STATUS_KEYS.len(),
        "unexpected wallet status field: {:?}",
        object.keys().collect::<Vec<_>>()
    );

    assert_eq!(parsed["config_readable"], true);
    assert_eq!(parsed["config_version_counter"], 2);
    assert_eq!(parsed["network"], TEST_NETWORK);
    assert_eq!(parsed["wallet_ids"][0], "abc123");
    assert_eq!(parsed["wallet_ids"][1], "def456");
    assert_eq!(parsed["tari_wallet_details_cached"], true);
    assert_eq!(parsed["pin_locked"], true);
    assert_eq!(parsed["failed_pin_attempts"], 2);
    assert_eq!(parsed["keyring_accessed"], true);
    assert_eq!(parsed["seed_backed_up"], false);
    assert_eq!(parsed["monero_address_is_generated"], true);
    assert_eq!(parsed["wallet_migration_nonce"], 3);
    assert_eq!(parsed["os"], std::env::consts::OS);

    // The keyring verdict per wallet id is the whole point of the document.
    assert_eq!(parsed["keyring_entries"][0]["wallet_id"], "abc123");
    assert_eq!(parsed["keyring_entries"][0]["state"], "no_entry");
    assert_eq!(parsed["keyring_entries"][0]["origin"], "startup");
    assert_eq!(parsed["keyring_entries"][1]["blob_len"], 48);
}

#[test]
fn wallet_status_truncates_the_tari_address() {
    let status = WalletStatus::from_config_content(&sentinel_wallet_config(), TEST_NETWORK);

    let prefix = status
        .tari_address_prefix
        .as_deref()
        .expect("address prefix should be reported");
    assert_eq!(prefix, &TEST_TARI_ADDRESS[..8]);
    assert_eq!(prefix.chars().count(), 8);

    let serialized = serde_json::to_string(&status).expect("wallet status should serialize");
    assert!(
        !serialized.contains(&TEST_TARI_ADDRESS[..9]),
        "more than 8 characters of the address leaked: {serialized}"
    );
}

#[test]
fn wallet_status_never_serializes_config_secrets() {
    let serialized =
        serde_json::to_string(&sample_wallet_status()).expect("wallet status should serialize");

    for sentinel in SENTINELS {
        assert!(
            !serialized.contains(sentinel),
            "secret `{sentinel}` leaked into the wallet status document"
        );
    }
    assert!(
        !serialized.contains(TEST_TARI_ADDRESS),
        "the full Tari address leaked into the wallet status document"
    );
}

#[test]
fn wallet_status_degrades_to_unknown_when_the_wallet_is_uninitialized() {
    // A default config is what an install whose wallet never initialised has:
    // no wallet ids, no cached details. Nothing here may fail or panic, and
    // every unknown has to read as `null` rather than as a plausible `false`.
    let status = WalletStatus::from_config_content(&ConfigWalletContent::default(), TEST_NETWORK);
    let parsed: Value = serde_json::to_value(&status).expect("wallet status should serialize");

    assert_eq!(parsed["wallet_ids"], serde_json::json!([]));
    assert_eq!(parsed["tari_wallet_details_cached"], false);
    assert_eq!(parsed["tari_address_prefix"], Value::Null);
    assert_eq!(parsed["keyring_entries"], serde_json::json!([]));
    assert_eq!(parsed["files"], serde_json::json!([]));
}

#[test]
fn wallet_status_file_scan_reports_metadata_not_contents() {
    let temp_dir = tempfile::tempdir().expect("temp dir");
    let root = temp_dir.path();

    let legacy_dir = root.join(TEST_NETWORK);
    fs::create_dir_all(&legacy_dir).expect("legacy dir");
    fs::write(
        legacy_dir.join("wallet_config.json"),
        format!(r#"{{"seed_words_encrypted_base58":"{LEGACY_WALLET_SENTINEL}"}}"#),
    )
    .expect("legacy wallet config");
    fs::write(
        legacy_dir.join("credentials_backup.bin"),
        LEGACY_FALLBACK_SENTINEL,
    )
    .expect("legacy fallback file");

    let configs_dir = root.join("app_configs").join(TEST_NETWORK);
    fs::create_dir_all(&configs_dir).expect("configs dir");
    fs::write(
        configs_dir.join("config_wallet.json"),
        format!(r#"{{"view_private_key_hex":"{VIEW_KEY_SENTINEL}"}}"#),
    )
    .expect("wallet config");
    fs::write(
        configs_dir.join("config_wallet.json.backup"),
        format!(r#"{{"view_private_key_hex":"{VIEW_KEY_SENTINEL}"}}"#),
    )
    .expect("wallet config backup");
    fs::write(
        configs_dir.join("config_wallet.json.corrupted.1700000000"),
        vec![0u8; 12],
    )
    .expect("quarantined config");

    let reports = scan_wallet_files(root, TEST_NETWORK);
    let named = |name: &str| {
        reports
            .iter()
            .find(|report| report.name == name)
            .unwrap_or_else(|| panic!("`{name}` missing from {reports:?}"))
    };

    assert!(named("wallet_config.json").present);
    assert_eq!(named("wallet_config.json").location, "legacy_network_dir");
    assert_eq!(
        named("credentials_backup.bin").len_bytes,
        Some(LEGACY_FALLBACK_SENTINEL.len() as u64)
    );
    assert!(named("config_wallet.json").present);
    assert!(named("config_wallet.json.backup").present);
    assert_eq!(
        named("config_wallet.json.corrupted.1700000000").len_bytes,
        Some(12)
    );

    // Contents, and the absolute paths that carry the OS user name, stay out.
    let serialized = serde_json::to_string(&reports).expect("reports should serialize");
    for sentinel in SENTINELS {
        assert!(
            !serialized.contains(sentinel),
            "file contents leaked into the wallet status document: {serialized}"
        );
    }
    assert!(
        !serialized.contains(&root.to_string_lossy().to_string()),
        "an absolute path leaked into the wallet status document: {serialized}"
    );
}

#[test]
fn wallet_status_file_scan_reports_absent_files_without_failing() {
    // An install with none of these files must still produce a document.
    let temp_dir = tempfile::tempdir().expect("temp dir");
    let reports = scan_wallet_files(temp_dir.path(), TEST_NETWORK);

    assert_eq!(reports.len(), 4, "{reports:?}");
    for report in &reports {
        assert!(!report.present, "{report:?}");
        assert_eq!(report.len_bytes, None, "{report:?}");
    }
}

#[test]
fn wallet_status_travels_in_the_support_archive() {
    let temp_dir = tempfile::tempdir().expect("temp dir");
    let logs_dir = setup_app_dirs(temp_dir.path()).expect("app dirs");

    let (archive_file, _) =
        create_support_archive(&logs_dir, &sample_diagnostics(), &sample_wallet_status())
            .expect("archive should be created");

    let contents = read_archive(&archive_file);
    let (_, bytes) = contents
        .files
        .iter()
        .find(|(name, _)| name == "configs/wallet_status.json")
        .expect("wallet status document should be present");

    let parsed: Value = serde_json::from_slice(bytes).expect("wallet status should be valid JSON");
    for key in WALLET_STATUS_KEYS {
        assert!(
            parsed.get(key).is_some(),
            "wallet status in the archive is missing `{key}`"
        );
    }

    let as_text = String::from_utf8_lossy(bytes);
    for sentinel in SENTINELS {
        assert!(
            !as_text.contains(sentinel),
            "secret `{sentinel}` leaked into the archived wallet status document"
        );
    }
}

// --- Startup probe hand-off (T2 -> T6) ----------------------------------------------------
//
// The startup probe reads the keyring once, at launch. What it saw has to reach the bundle
// without a second read: on macOS a second read is a second keychain prompt, and by then the
// answer can differ from the one the user actually lived with at startup.

const STARTUP_PROBE_SEED: &[u8] = b"not-a-cipher-seed-blob";

#[test]
fn a_recorded_startup_read_is_reported_as_origin_startup() {
    let wallet_id = "t7a_ok";
    record_startup_probe_outcome(
        wallet_id,
        true,
        &Ok(Credential {
            encrypted_seed: STARTUP_PROBE_SEED.to_vec(),
        }),
    );

    let report = startup_keyring_probe(wallet_id).expect("the startup read must be recorded");
    assert_eq!(report.origin, ProbeOrigin::Startup);
    assert_eq!(report.state, KeyringEntryState::Readable);
    assert_eq!(report.blob_len, Some(STARTUP_PROBE_SEED.len()));
    // Not a `CipherSeed`, so it reads as PIN-enciphered-or-corrupt rather than plain.
    assert_eq!(report.blob_kind, SeedBlobKind::PinEncipheredOrCorrupt);
    assert_eq!(report.error_kind, None);

    // The blob itself must never be anywhere in the serialized report.
    let serialized = serde_json::to_string(&report).expect("serialize report");
    assert!(!serialized.contains(std::str::from_utf8(STARTUP_PROBE_SEED).expect("utf8 fixture")));
}

#[test]
fn a_missing_entry_seen_at_startup_is_recorded_as_no_entry() {
    let wallet_id = "t7a_missing";
    record_startup_probe_outcome(
        wallet_id,
        true,
        &Err(CredentialError::NoEntry(wallet_id.to_string())),
    );

    let report = startup_keyring_probe(wallet_id).expect("the startup read must be recorded");
    assert_eq!(report.origin, ProbeOrigin::Startup);
    assert_eq!(report.state, KeyringEntryState::NoEntry);
    assert_eq!(report.error_kind.as_deref(), Some("no_entry"));
    assert_eq!(report.blob_len, None);
}

#[test]
fn an_id_the_startup_probe_never_saw_falls_back_to_bundle_assembly() {
    // The fallback is what keeps the Monero entry and any extra wallet id in the document.
    assert!(startup_keyring_probe("t7a_never_probed").is_none());
}
