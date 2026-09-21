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
//! travels is the allowlisted `SupportDiagnostics` document.

use std::fs;
use std::io::Read;
use std::path::Path;

use serde_json::Value;

use crate::feedback::{SupportDiagnostics, create_support_archive};

const AIRDROP_TOKEN_SENTINEL: &str = "airdrop_token_sentinel";
const REFRESH_TOKEN_SENTINEL: &str = "refresh_token_sentinel";
const VIEW_KEY_SENTINEL: &str = "view_key_sentinel";
const MCP_BEARER_SENTINEL: &str = "mcp_bearer_sentinel";
const LEGACY_WALLET_SENTINEL: &str = "legacy_wallet_sentinel";
/// An OS user name embedded in an absolute path inside a log line. It is not a
/// config secret, but uploaded logs must not identify the user either.
const USERNAME_SENTINEL: &str = "doxxed_user_name";

const SENTINELS: [&str; 5] = [
    AIRDROP_TOKEN_SENTINEL,
    REFRESH_TOKEN_SENTINEL,
    VIEW_KEY_SENTINEL,
    MCP_BEARER_SENTINEL,
    LEGACY_WALLET_SENTINEL,
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
        remote_base_node_address: "https://grpc.tari.com:443".to_string(),
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
        cpu_pool_name: "SupportXTMPool".to_string(),
        cpu_pool_url: "https://pool.example/cpu".to_string(),
        gpu_pool_enabled: false,
        gpu_pool_name: "LuckyPoolC29".to_string(),
        gpu_pool_url: "https://pool.example/gpu".to_string(),
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
        monero_address_is_generated: true,
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

    let network_dir = config_dir.join("esmeralda");
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
        create_support_archive(&logs_dir, &diagnostics).expect("archive should be created");

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
        vec!["configs/diagnostics.json"],
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
    const FORBIDDEN_NAME_PARTS: [&str; 5] = ["token", "key", "seed", "pin", "secret"];
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
