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

use std::collections::HashMap;
use std::fs::File;
use std::io::{Read, Write};
use std::panic::AssertUnwindSafe;
use std::path::{Path, PathBuf};
use std::sync::{Arc, LazyLock, Mutex};

use anyhow::{Error, Result, anyhow};
use futures::FutureExt;
use log::{error, info};
use regex::Regex;
use reqwest::multipart;
use serde::Serialize;
use tari_common::configuration::Network;
use tokio::sync::RwLock;
use zip::ZipWriter;
use zip::write::SimpleFileOptions;

use crate::app_in_memory_config::AppInMemoryConfig;
use crate::configs::config_core::{ConfigCore, ConfigCoreContent};
use crate::configs::config_mining::ConfigMining;
use crate::configs::config_pools::ConfigPools;
use crate::configs::config_ui::ConfigUI;
use crate::configs::config_wallet::{ConfigWallet, ConfigWalletContent, WalletId};
use crate::configs::trait_config::ConfigImpl;
use crate::credential_manager::{Credential, CredentialError, CredentialManager};
use crate::internal_wallet::{
    LEGACY_FALLBACK_FILE_NAME, LEGACY_WALLET_CONFIG_FILE_NAME, decode_plain_tari_seed,
};
use crate::utils::file_utils::{make_relative_path, path_as_string};
use crate::utils::log_path_scrub::scrub_user_paths_bytes;
use crate::{APPLICATION_FOLDER_ID, LOG_TARGET_APP_LOGIC};

const MAX_FILE_SIZE: u64 = 100 * 1024 * 1024; // 100MB in bytes
/// Path of the diagnostics document inside the support archive.
const DIAGNOSTICS_ARCHIVE_PATH: &str = "configs/diagnostics.json";
/// Path of the redacted wallet status document inside the support archive.
const WALLET_STATUS_ARCHIVE_PATH: &str = "configs/wallet_status.json";

/// The non-secret snapshot of the user's settings that ships with a support bundle.
///
/// The support archive used to copy every config file from the app config
/// directory, which exfiltrated airdrop tokens, the wallet view key, the MCP
/// bearer token and the legacy wallet config to the feedback endpoint. This
/// struct replaces that with an explicit allowlist.
///
/// Rules for anyone editing this struct:
///
/// * Every field is listed and populated **individually**. Never build this
///   type by serializing a whole `Config*Content` struct (or any part of one),
///   so a secret added to a config later can never leak in by accident.
/// * Never add secrets or anything that can contain them: airdrop tokens,
///   `tari_wallet_details` (or any field inside it), PIN/locker data, the MCP
///   bearer token, seed phrases, private/view keys, addresses or address
///   books, filesystem paths (they carry the user name), and user-configured
///   endpoints such as a custom remote node or pool URL (they can expose a
///   private network). Report "is default" booleans or enum names instead.
/// * Wallet state is reported as booleans and counters only.
/// * If in doubt, leave the field out. A reviewer can always add one later.
#[derive(Debug, Serialize)]
#[allow(clippy::struct_excessive_bools)]
pub struct SupportDiagnostics {
    pub app_version: String,
    pub network: String,
    pub anon_id: String,
    pub exchange_id: String,
    pub allow_telemetry: bool,
    pub allow_notifications: bool,
    pub use_tor: bool,
    pub auto_update: bool,
    pub pre_release: bool,
    pub remote_base_node_is_default: bool,
    pub node_type: String,
    pub mmproxy_use_monero_failover: bool,
    pub cpu_mining_enabled: bool,
    pub gpu_mining_enabled: bool,
    pub mine_on_app_start: bool,
    pub selected_mining_mode: String,
    pub available_mining_modes: Vec<String>,
    pub is_lolminer_tested: bool,
    pub is_gpu_mining_recommended: bool,
    pub cpu_pool_enabled: bool,
    pub cpu_pool_type: String,
    pub gpu_pool_enabled: bool,
    pub gpu_pool_type: String,
    pub application_language: String,
    pub should_always_use_system_language: bool,
    pub display_mode: String,
    pub visual_mode: bool,
    pub show_experimental_settings: bool,
    pub wallet_ui_mode: String,
    /// `tari_wallet_details.is_some()` - never the details themselves.
    pub has_internal_wallet: bool,
    pub tari_wallets_count: usize,
    /// `keyring_accessed`
    pub credential_store_accessed: bool,
    /// `seed_backed_up`
    pub wallet_backed_up: bool,
    pub wallet_migration_nonce: u64,
    pub monero_wallet_is_generated: bool,
}

impl SupportDiagnostics {
    /// Reads the live configs and copies out the allowlisted fields one by one.
    pub async fn collect() -> Self {
        let core = ConfigCore::content().await;
        let mining = ConfigMining::content().await;
        let ui = ConfigUI::content().await;
        let pools = ConfigPools::content().await;
        let wallet = ConfigWallet::content().await;

        let cpu_pool = pools.current_cpu_pool();
        let gpu_pool = pools.current_gpu_pool();

        let mut available_mining_modes: Vec<String> =
            mining.mining_modes().keys().cloned().collect();
        available_mining_modes.sort();

        Self {
            app_version: env!("CARGO_PKG_VERSION").to_string(),
            network: Network::get_current_or_user_setting_or_default()
                .as_key_str()
                .to_string(),
            anon_id: core.anon_id().clone(),
            exchange_id: core.exchange_id().clone(),
            allow_telemetry: *core.allow_telemetry(),
            allow_notifications: *core.allow_notifications(),
            use_tor: *core.use_tor(),
            auto_update: *core.auto_update(),
            pre_release: *core.pre_release(),
            remote_base_node_is_default: core.remote_base_node_address()
                == ConfigCoreContent::default().remote_base_node_address(),
            node_type: format!("{:?}", core.node_type()),
            mmproxy_use_monero_failover: *core.mmproxy_use_monero_failover(),
            cpu_mining_enabled: *mining.cpu_mining_enabled(),
            gpu_mining_enabled: *mining.gpu_mining_enabled(),
            mine_on_app_start: *mining.mine_on_app_start(),
            selected_mining_mode: mining.selected_mining_mode().clone(),
            available_mining_modes,
            is_lolminer_tested: *mining.is_lolminer_tested(),
            is_gpu_mining_recommended: *mining.is_gpu_mining_recommended(),
            cpu_pool_enabled: *pools.cpu_pool_enabled(),
            cpu_pool_type: format!("{:?}", cpu_pool.pool_type),
            gpu_pool_enabled: *pools.gpu_pool_enabled(),
            gpu_pool_type: format!("{:?}", gpu_pool.pool_type),
            application_language: ui.application_language().clone(),
            should_always_use_system_language: *ui.should_always_use_system_language(),
            display_mode: format!("{:?}", ui.display_mode()),
            visual_mode: *ui.visual_mode(),
            show_experimental_settings: *ui.show_experimental_settings(),
            wallet_ui_mode: format!("{:?}", ui.wallet_ui_mode()),
            has_internal_wallet: wallet.tari_wallet_details().is_some(),
            tari_wallets_count: wallet.tari_wallets().len(),
            credential_store_accessed: *wallet.keyring_accessed(),
            wallet_backed_up: *wallet.seed_backed_up(),
            wallet_migration_nonce: *wallet.wallet_migration_nonce(),
            monero_wallet_is_generated: *wallet.monero_address_is_generated(),
        }
    }

    /// File name of the archive built for this user.
    fn archive_file_name(&self) -> String {
        format!("logs_config_{}.zip", self.anon_id)
    }
}

// =============================================================================
// Redacted wallet status
// =============================================================================

/// Number of leading characters of a Tari address that may travel in a bundle.
///
/// Enough to match the address a user quotes in a support ticket against the
/// one in their config, and far too little to be an address.
const ADDRESS_PREFIX_LEN: usize = 8;

/// Hard cap on the number of `*.corrupted.*` quarantine files reported.
const MAX_CORRUPTED_FILES_REPORTED: usize = 20;

/// File name of the current wallet config, see `ConfigImpl::_get_config_path`.
const WALLET_CONFIG_FILE_NAME: &str = "config_wallet.json";
/// Backup written next to it by the config loader.
const WALLET_CONFIG_BACKUP_FILE_NAME: &str = "config_wallet.json.backup";
/// Sub-directory of the app config directory that holds the current configs.
const APP_CONFIGS_DIR_NAME: &str = "app_configs";
/// Infix used by the config loader when it quarantines a file it cannot parse.
const CORRUPTED_FILE_INFIX: &str = ".corrupted.";

/// Where a reported file was looked for. A role, never a path: absolute paths
/// carry the OS user name.
const LOCATION_LEGACY_NETWORK_DIR: &str = "legacy_network_dir";
const LOCATION_APP_CONFIGS_NETWORK_DIR: &str = "app_configs_network_dir";

/// Whether the keyring handed over the entry for a wallet id.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "snake_case")]
pub enum KeyringEntryState {
    /// The entry was read and decoded. The seed is physically present.
    Readable,
    /// The keyring has no entry under this id at all.
    NoEntry,
    /// The entry exists but the platform refused to hand it over (locked
    /// keychain, denied prompt, stopped credential service, ACL mismatch).
    Unreadable,
    /// No probe ran, or the probe itself failed in a way we could not classify.
    Unknown,
}

/// Shape of the stored blob, as far as it can be told without a PIN.
///
/// A `CipherSeed` that decodes without a PIN while the config says
/// `pin_locked = true` (or the reverse) is the signature of an interrupted
/// "create PIN", which presents to the user as a permanently wrong PIN.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "snake_case")]
pub enum SeedBlobKind {
    /// Decodes as a `CipherSeed` without a PIN.
    Plain,
    /// Does not decode without a PIN: PIN-enciphered, or corrupt.
    PinEncipheredOrCorrupt,
    /// Not classified (entry unreadable, or not a `CipherSeed` blob).
    Unknown,
}

/// Which launch the keyring report describes.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "snake_case")]
pub enum ProbeOrigin {
    /// Recorded by the startup probe, i.e. true "at last launch".
    Startup,
    /// Probed read-only while this bundle was assembled, because no startup
    /// record existed.
    BundleAssembly,
}

/// What the keyring said about one wallet id. Never the blob itself.
#[derive(Debug, Clone, Serialize)]
pub struct KeyringEntryReport {
    /// The random 6-character id from `tari_wallets`, or `monero`. Not a secret;
    /// it is already written to the log at wallet creation.
    pub wallet_id: String,
    pub state: KeyringEntryState,
    /// `CredentialError` variant name only. Never the error message: platform
    /// errors quote OS text that can contain paths.
    pub error_kind: Option<String>,
    /// Length of the stored blob in bytes. Never the bytes. A Monero entry that
    /// is not 32 bytes has been double-encrypted.
    pub blob_len: Option<usize>,
    pub blob_kind: SeedBlobKind,
    pub origin: ProbeOrigin,
}

/// Presence and size of one file. Never its contents, never its full path.
#[derive(Debug, Clone, Serialize)]
pub struct FileReport {
    /// File name only.
    pub name: String,
    /// Role of the directory it was looked for in.
    pub location: String,
    pub present: bool,
    /// `None` when absent or not a regular file.
    pub len_bytes: Option<u64>,
}

/// The redacted wallet status document shipped as `configs/wallet_status.json`.
///
/// Its job is to make a "my seeds are gone" report diagnosable from the bundle
/// alone. Today a bundle carries no trace of *why* a seed-dependent operation
/// failed: startup never opens the keyring once `tari_wallet_details` is cached
/// in the config, so a missing or unreadable keyring entry is invisible until
/// the user tries to spend.
///
/// Rules for anyone editing this struct, same as `SupportDiagnostics`:
///
/// * Every field is populated **individually** from an explicit read. Never
///   build it by serializing `ConfigWalletContent`, `TariWalletDetails` or any
///   part of either: both carry the view private key.
/// * Never add seed words, private keys, the view private key, enciphered seed
///   bytes, passphrases, PINs, a Tari or Monero address beyond
///   [`ADDRESS_PREFIX_LEN`] characters, the contents of any config or legacy
///   file, or any filesystem path (paths carry the OS user name).
/// * Lengths, counts, booleans and enum names only.
/// * `None` means "could not be determined", never "false".
#[derive(Debug, Clone, Serialize)]
#[allow(clippy::struct_excessive_bools)]
pub struct WalletStatus {
    pub app_version: String,
    /// `std::env::consts::OS`, e.g. `macos`.
    pub os: String,
    /// `std::env::consts::ARCH`, e.g. `aarch64`.
    pub os_arch: String,
    pub network: String,
    /// False when the wallet config could not be read at all; every config
    /// derived field below is then `None`.
    pub config_readable: bool,
    pub config_version_counter: Option<u32>,
    /// Ids listed in `tari_wallets`, in config order. The first entry is the
    /// only one the app ever uses.
    pub wallet_ids: Vec<String>,
    /// `tari_wallet_details.is_some()`. True means the app can show an address
    /// and scan a balance without ever opening the keyring.
    pub tari_wallet_details_cached: Option<bool>,
    /// First [`ADDRESS_PREFIX_LEN`] characters of the cached Tari address.
    pub tari_address_prefix: Option<String>,
    pub external_tari_address_selected: Option<bool>,
    /// `pin_locker_state.pin_locked`.
    pub pin_locked: Option<bool>,
    pub failed_pin_attempts: Option<u32>,
    /// `keyring_accessed`.
    pub keyring_accessed: Option<bool>,
    pub seed_backed_up: Option<bool>,
    pub monero_address_is_generated: Option<bool>,
    pub wallet_migration_nonce: Option<u64>,
    /// One entry per configured wallet id, plus `monero` when the Monero
    /// address was generated by the app.
    pub keyring_entries: Vec<KeyringEntryReport>,
    /// Presence and size of the files that decide a recovery: the two legacy
    /// files, the current wallet config, its backup, and any quarantined copy.
    pub files: Vec<FileReport>,
}

/// Non-secret record of what a startup keyring probe saw, keyed by wallet id.
///
/// Filled by the startup probe in
/// `internal_wallet::InternalWallet::probe_tari_seed_at_startup`, through
/// [`record_startup_probe_outcome`], so this document reports what was true *at
/// launch* rather than at the moment the user clicked "Send Logs".
///
/// [`WalletStatus::collect`] still falls back to its own read-only, non-forced
/// probe during bundle assembly for any id the startup probe did not cover,
/// tagged [`ProbeOrigin::BundleAssembly`]. That is every id but
/// `tari_wallets[0]`, plus `tari_wallets[0]` itself on the launches where the
/// startup probe did not run at all: a fresh install, a wallet whose details
/// were not cached (the keyring was read anyway), or a macOS launch inside the
/// probe's 24h rate-limit window. The fallback is equivalent on Windows and
/// Linux (the read is silent and sub-millisecond); on macOS it can raise one
/// keychain prompt per entry for users who chose "Allow" rather than "Always
/// Allow".
static STARTUP_KEYRING_PROBE: LazyLock<Mutex<HashMap<String, KeyringEntryReport>>> =
    LazyLock::new(|| Mutex::new(HashMap::new()));

/// Records what one startup keyring read saw, so the support bundle can report
/// it without opening the keyring a second time.
///
/// Takes the raw read result rather than a built report so that the mapping
/// from `CredentialError` to [`KeyringEntryState`] lives in one place and the
/// startup probe cannot drift from the bundle-assembly fallback. Only the blob
/// *length* and shape are kept; the blob itself is never copied, logged or
/// stored. `classify_blob` is false for the raw 32-byte Monero seed, which is
/// not a `CipherSeed`.
pub fn record_startup_probe_outcome(
    wallet_id: &str,
    classify_blob: bool,
    result: &Result<Credential, CredentialError>,
) {
    let mut report = KeyringEntryReport {
        wallet_id: wallet_id.to_string(),
        state: KeyringEntryState::Unknown,
        error_kind: None,
        blob_len: None,
        blob_kind: SeedBlobKind::Unknown,
        origin: ProbeOrigin::Startup,
    };
    match result {
        Ok(credential) => {
            report.state = KeyringEntryState::Readable;
            report.blob_len = Some(credential.encrypted_seed.len());
            if classify_blob {
                // Round-trip proven, not just "bincode accepted it": plain `from_binary`
                // succeeds on a PIN-enciphered blob too, which would report every enciphered
                // entry as `plain` in the one document support reads to tell the two apart.
                report.blob_kind = if decode_plain_tari_seed(&credential.encrypted_seed).is_some() {
                    SeedBlobKind::Plain
                } else {
                    SeedBlobKind::PinEncipheredOrCorrupt
                };
            }
        }
        Err(error @ CredentialError::NoEntry(_)) => {
            report.state = KeyringEntryState::NoEntry;
            report.error_kind = Some(credential_error_kind(error).to_string());
        }
        Err(error) => {
            report.state = KeyringEntryState::Unreadable;
            report.error_kind = Some(credential_error_kind(error).to_string());
        }
    }
    record_startup_keyring_probe(report);
}

/// Records the outcome of the startup keyring probe for one wallet id.
pub fn record_startup_keyring_probe(mut report: KeyringEntryReport) {
    report.origin = ProbeOrigin::Startup;
    // A poisoned lock must never take the support bundle (or startup) down.
    if let Ok(mut guard) = STARTUP_KEYRING_PROBE.lock() {
        guard.insert(report.wallet_id.clone(), report);
    }
}

pub(crate) fn startup_keyring_probe(wallet_id: &str) -> Option<KeyringEntryReport> {
    STARTUP_KEYRING_PROBE
        .lock()
        .ok()
        .and_then(|guard| guard.get(wallet_id).cloned())
}

/// `CredentialError` variant name. Never the message.
fn credential_error_kind(error: &CredentialError) -> &'static str {
    match error {
        CredentialError::Keyring(_) => "keyring",
        CredentialError::Io(_) => "io",
        CredentialError::Serialization(_) => "serialization",
        CredentialError::NoEntry(_) => "no_entry",
        CredentialError::WriteNotVerified(_) => "write_not_verified",
    }
}

/// Root of the app config directory, `<os config dir>/<APPLICATION_FOLDER_ID>`.
///
/// Same directory Tauri reports as `app_config_dir()`, recomputed here so the
/// bundle can be assembled without an `AppHandle`.
fn app_config_root() -> Option<PathBuf> {
    dirs::config_dir().map(|dir| dir.join(APPLICATION_FOLDER_ID))
}

fn file_report(dir: &Path, name: &str, location: &str) -> FileReport {
    let (present, len_bytes) = match std::fs::metadata(dir.join(name)) {
        Ok(metadata) if metadata.is_file() => (true, Some(metadata.len())),
        Ok(_) => (true, None),
        Err(_) => (false, None),
    };
    FileReport {
        name: name.to_string(),
        location: location.to_string(),
        present,
        len_bytes,
    }
}

/// Names of the `*.corrupted.*` quarantine files in `dir`, sorted, capped.
fn corrupted_file_reports(dir: &Path, location: &str) -> Vec<FileReport> {
    let Ok(entries) = std::fs::read_dir(dir) else {
        return Vec::new();
    };
    let mut reports: Vec<FileReport> = entries
        .flatten()
        .filter_map(|entry| {
            let name = entry.file_name().to_str()?.to_string();
            if !name.contains(CORRUPTED_FILE_INFIX) {
                return None;
            }
            let len_bytes = entry
                .metadata()
                .ok()
                .filter(fs_meta_is_file)
                .map(|m| m.len());
            Some(FileReport {
                name,
                location: location.to_string(),
                present: true,
                len_bytes,
            })
        })
        .collect();
    reports.sort_by(|a, b| a.name.cmp(&b.name));
    reports.truncate(MAX_CORRUPTED_FILES_REPORTED);
    reports
}

fn fs_meta_is_file(metadata: &std::fs::Metadata) -> bool {
    metadata.is_file()
}

/// Presence and size of every file that decides a wallet recovery.
///
/// Reads metadata only. The contents of a legacy `wallet_config.json` (an
/// enciphered seed) or of `credentials_backup.bin` (a plaintext CBOR seed)
/// never enter the bundle.
pub(crate) fn scan_wallet_files(app_config_root: &Path, network: &str) -> Vec<FileReport> {
    let legacy_dir = app_config_root.join(network);
    let configs_dir = app_config_root.join(APP_CONFIGS_DIR_NAME).join(network);

    let mut reports = vec![
        file_report(
            &legacy_dir,
            LEGACY_WALLET_CONFIG_FILE_NAME,
            LOCATION_LEGACY_NETWORK_DIR,
        ),
        file_report(
            &legacy_dir,
            LEGACY_FALLBACK_FILE_NAME,
            LOCATION_LEGACY_NETWORK_DIR,
        ),
        file_report(
            &configs_dir,
            WALLET_CONFIG_FILE_NAME,
            LOCATION_APP_CONFIGS_NETWORK_DIR,
        ),
        file_report(
            &configs_dir,
            WALLET_CONFIG_BACKUP_FILE_NAME,
            LOCATION_APP_CONFIGS_NETWORK_DIR,
        ),
    ];
    reports.extend(corrupted_file_reports(
        &configs_dir,
        LOCATION_APP_CONFIGS_NETWORK_DIR,
    ));
    reports.extend(corrupted_file_reports(
        &legacy_dir,
        LOCATION_LEGACY_NETWORK_DIR,
    ));
    reports
}

/// One read-only, non-forced keyring read. Never retries and never forces a
/// dialog loop, so a denied or cancelled prompt is reported, not repeated.
async fn probe_keyring_entry(wallet_id: &WalletId, classify_blob: bool) -> KeyringEntryReport {
    let id = wallet_id.as_str().to_string();
    let mut report = KeyringEntryReport {
        wallet_id: id,
        state: KeyringEntryState::Unknown,
        error_kind: None,
        blob_len: None,
        blob_kind: SeedBlobKind::Unknown,
        origin: ProbeOrigin::BundleAssembly,
    };

    // A panic inside a keyring backend must not take the support bundle down.
    let result =
        AssertUnwindSafe(CredentialManager::new_default(wallet_id.clone()).get_credentials())
            .catch_unwind()
            .await;

    match result {
        Ok(Ok(credential)) => {
            report.state = KeyringEntryState::Readable;
            report.blob_len = Some(credential.encrypted_seed.len());
            if classify_blob {
                // Round-trip proven, not just "bincode accepted it": plain `from_binary`
                // succeeds on a PIN-enciphered blob too, which would report every enciphered
                // entry as `plain` in the one document support reads to tell the two apart.
                report.blob_kind = if decode_plain_tari_seed(&credential.encrypted_seed).is_some() {
                    SeedBlobKind::Plain
                } else {
                    SeedBlobKind::PinEncipheredOrCorrupt
                };
            }
        }
        Ok(Err(error @ CredentialError::NoEntry(_))) => {
            report.state = KeyringEntryState::NoEntry;
            report.error_kind = Some(credential_error_kind(&error).to_string());
        }
        Ok(Err(error)) => {
            report.state = KeyringEntryState::Unreadable;
            report.error_kind = Some(credential_error_kind(&error).to_string());
        }
        Err(_panic) => {
            report.error_kind = Some("panic".to_string());
        }
    }

    report
}

impl WalletStatus {
    /// Everything that can be known without reading the wallet config.
    fn unknown(network: &str) -> Self {
        Self {
            app_version: env!("CARGO_PKG_VERSION").to_string(),
            os: std::env::consts::OS.to_string(),
            os_arch: std::env::consts::ARCH.to_string(),
            network: network.to_string(),
            config_readable: false,
            config_version_counter: None,
            wallet_ids: Vec::new(),
            tari_wallet_details_cached: None,
            tari_address_prefix: None,
            external_tari_address_selected: None,
            pin_locked: None,
            failed_pin_attempts: None,
            keyring_accessed: None,
            seed_backed_up: None,
            monero_address_is_generated: None,
            wallet_migration_nonce: None,
            keyring_entries: Vec::new(),
            files: Vec::new(),
        }
    }

    /// Copies the allowlisted wallet config fields out, one by one.
    ///
    /// The only value taken from `tari_wallet_details` is the first
    /// [`ADDRESS_PREFIX_LEN`] characters of the address; the view private key it
    /// also holds is never touched.
    pub fn from_config_content(content: &ConfigWalletContent, network: &str) -> Self {
        let mut status = Self::unknown(network);
        status.config_readable = true;
        status.config_version_counter = Some(*content.version_counter());
        status.wallet_ids = content
            .tari_wallets()
            .iter()
            .map(|id| id.as_str().to_string())
            .collect();
        status.tari_wallet_details_cached = Some(content.tari_wallet_details().is_some());
        status.tari_address_prefix = content.tari_wallet_details().as_ref().map(|details| {
            details
                .tari_address
                .to_base58()
                .chars()
                .take(ADDRESS_PREFIX_LEN)
                .collect()
        });
        status.external_tari_address_selected =
            Some(content.selected_external_tari_address().is_some());
        status.pin_locked = Some(*content.pin_locker_state().pin_locked());
        status.failed_pin_attempts = Some(*content.pin_locker_state().failed_pin_attempts());
        status.keyring_accessed = Some(*content.keyring_accessed());
        status.seed_backed_up = Some(*content.seed_backed_up());
        status.monero_address_is_generated = Some(*content.monero_address_is_generated());
        status.wallet_migration_nonce = Some(*content.wallet_migration_nonce());
        status
    }

    /// Builds the document for the current install.
    ///
    /// Every read degrades to "unknown" instead of failing: a bundle from a
    /// machine whose wallet never initialised is exactly the bundle worth
    /// having, so nothing here may return `Err` or panic.
    pub async fn collect() -> Self {
        let network = Network::get_current_or_user_setting_or_default()
            .as_key_str()
            .to_string();

        // The config singleton is a `LazyLock`; an earlier panic inside its
        // initializer poisons it and every later access panics.
        let content = AssertUnwindSafe(ConfigWallet::content())
            .catch_unwind()
            .await
            .map_err(|_panic| {
                error!(target: LOG_TARGET_APP_LOGIC, "[wallet_status] wallet config unreadable, reporting unknown");
            })
            .ok();

        let mut status = match content.as_ref() {
            Some(content) => Self::from_config_content(content, &network),
            None => Self::unknown(&network),
        };

        if let Some(root) = app_config_root() {
            status.files = scan_wallet_files(&root, &network);
        }

        if let Some(content) = content.as_ref() {
            status.keyring_entries = Self::collect_keyring_entries(content).await;
        }

        status
    }

    async fn collect_keyring_entries(content: &ConfigWalletContent) -> Vec<KeyringEntryReport> {
        let mut ids: Vec<(WalletId, bool)> = content
            .tari_wallets()
            .iter()
            .map(|id| (id.clone(), true))
            .collect();
        // The Monero seed lives under a fixed id and is a raw 32-byte seed, not
        // a `CipherSeed`, so it is reported by length only. Skipped when the
        // user supplied their own address: there is then no generated seed.
        if *content.monero_address_is_generated() {
            // Monero ids are versioned (`monero`, `monero_2`, ...); `None` means the original
            // unversioned entry, which is what pre-versioning wallets use.
            ids.push((
                content
                    .monero_wallet_id()
                    .clone()
                    .unwrap_or_else(|| WalletId::new("monero".to_string())),
                false,
            ));
        }

        let mut reports = Vec::with_capacity(ids.len());
        for (id, classify_blob) in ids {
            match startup_keyring_probe(id.as_str()) {
                Some(recorded) => reports.push(recorded),
                None => reports.push(probe_keyring_entry(&id, classify_blob).await),
            }
        }
        reports
    }
}

/// Builds the support archive: the log files, `configs/diagnostics.json` and
/// `configs/wallet_status.json`.
///
/// Deliberately free of config singletons and network access so it can be
/// tested in isolation. No file from the app config directory is ever read
/// here - the only things shipped about the configuration are the allowlisted
/// `diagnostics` and `wallet_status` values.
///
/// What ends up in the archive:
///
/// * `logs/**/*.log`, with home-directory paths scrubbed of the OS user name.
///   Only `.log` is matched, so a `.zip` left behind by a failed upload is not
///   nested into the next bundle.
/// * `configs/diagnostics.json` - [`SupportDiagnostics`], an explicit
///   allowlist of non-secret settings.
/// * `configs/wallet_status.json` - [`WalletStatus`], presence/verdict/length
///   metadata about the wallet.
///
/// What never does, and must not be added: `config_wallet.json`, its
/// `.backup`, any `*.corrupted.*` copy, the legacy `wallet_config.json`, the
/// legacy `credentials_backup.bin`, or any other file from the app config
/// directory. Those four wallet files are reported by name, presence and byte
/// length only, through [`WalletStatus::files`].
///
/// Returns the path of the archive and its file name.
pub fn create_support_archive(
    logs_dir: &Path,
    diagnostics: &SupportDiagnostics,
    wallet_status: &WalletStatus,
) -> Result<(PathBuf, String)> {
    let zip_filename = diagnostics.archive_file_name();
    let archive_file = logs_dir.join(&zip_filename);
    let documents = vec![
        (
            DIAGNOSTICS_ARCHIVE_PATH,
            serde_json::to_string_pretty(diagnostics)?,
        ),
        (
            WALLET_STATUS_ARCHIVE_PATH,
            serde_json::to_string_pretty(wallet_status)?,
        ),
    ];

    // Only log files. `.zip` is deliberately not matched: a bundle left behind
    // by a failed upload must not be nested into the next one, and the archive
    // being written must not match its own walk.
    let log_regex_filter =
        Regex::new(r"^.*\.log$").map_err(|e| anyhow!("Failed to create log file filter: {}", e))?;

    let directories_and_filters =
        vec![(logs_dir.to_path_buf(), log_regex_filter, "logs".to_string())];

    zip_create_from_directories(&archive_file, &directories_and_filters, &documents)?;

    Ok((archive_file, zip_filename))
}

fn zip_create_from_directories(
    archive_file: &Path,
    directories_and_filters: &[(PathBuf, Regex, String)],
    documents: &[(&str, String)],
) -> Result<(), Error> {
    let file_options = SimpleFileOptions::default();

    let zip_file_name = archive_file
        .file_name()
        .and_then(|name| name.to_str())
        .ok_or_else(|| anyhow!("Failed to get archive file name"))?
        .to_string();

    let file = File::create(archive_file)?;

    let mut zip = ZipWriter::new(file);
    let mut buffer = Vec::new();

    for (archive_path, document) in documents {
        zip.start_file(*archive_path, file_options)?;
        zip.write_all(document.as_bytes())?;
    }

    for (directory, regex_filter, folder_name) in directories_and_filters {
        if !directory.exists() {
            continue; // Skip non-existent directories
        }

        let mut paths_queue: Vec<PathBuf> = vec![];
        paths_queue.push(directory.to_path_buf());

        while let Some(next) = paths_queue.pop() {
            let directory_entry_iterator = std::fs::read_dir(next)?;

            for entry in directory_entry_iterator {
                let entry_path = entry?.path();
                let entry_metadata = std::fs::metadata(entry_path.clone())?;
                let entry_file_name_as_str = entry_path
                    .file_name()
                    .and_then(|name| name.to_str())
                    .ok_or_else(|| anyhow!("Failed to get file name"))?;

                if entry_metadata.is_file()
                    && regex_filter.is_match(entry_file_name_as_str)
                    && !entry_file_name_as_str.eq(&zip_file_name)
                    && entry_path != archive_file
                {
                    // Skip files larger than 100MB
                    if entry_metadata.len() > MAX_FILE_SIZE {
                        info!(target: LOG_TARGET_APP_LOGIC, "Skipping file {} (size: {} bytes) - exceeds 100MB limit",
                              entry_file_name_as_str, entry_metadata.len());
                        continue;
                    }

                    let mut f = File::open(&entry_path)?;
                    f.read_to_end(&mut buffer)?;
                    let relative_path = make_relative_path(directory, &entry_path);
                    let prefixed_path =
                        format!("{}/{}", folder_name, path_as_string(&relative_path));
                    zip.start_file(prefixed_path, file_options)?;
                    zip.write_all(&scrub_user_paths_bytes(&buffer))?;
                    buffer.clear();
                } else if entry_metadata.is_dir() {
                    let relative_path = make_relative_path(directory, &entry_path);
                    let prefixed_path =
                        format!("{}/{}", folder_name, path_as_string(&relative_path));
                    zip.add_directory(prefixed_path, file_options)?;
                    paths_queue.push(entry_path.clone());
                } else {
                    info!(target: LOG_TARGET_APP_LOGIC, "Skipping file {} - does not match filter",
                          entry_file_name_as_str);
                }
            }
        }
    }

    zip.finish()?;
    Ok(())
}

pub struct Feedback {
    in_memory_config: Arc<RwLock<AppInMemoryConfig>>,
}

impl Feedback {
    pub fn new(in_memory_config: Arc<RwLock<AppInMemoryConfig>>) -> Self {
        Self { in_memory_config }
    }

    pub async fn send_feedback(
        &self,
        feedback_message: String,
        include_logs: bool,
        app_log_dir: PathBuf,
    ) -> Result<String> {
        if feedback_message.is_empty() {
            return Err(anyhow!("Feedback not sent. No message provided"));
        }

        let feedback_url = format!(
            "{}/feedback",
            self.in_memory_config.read().await.airdrop_api_url.clone()
        );

        // Create a multipart form
        let anon_id = ConfigCore::content().await.anon_id().clone();
        let mut form = multipart::Form::new()
            .text("feedback", feedback_message.clone())
            .text("appId", anon_id.clone());

        let upload_zip_path = if include_logs {
            let diagnostics = SupportDiagnostics::collect().await;
            let wallet_status = WalletStatus::collect().await;
            let (archive_file, zip_filename) =
                create_support_archive(&app_log_dir, &diagnostics, &wallet_status)?;
            let metadata = std::fs::metadata(&archive_file)?;
            let file_size = metadata.len();
            info!(target: LOG_TARGET_APP_LOGIC, "Uploading {} ({} bytes)", zip_filename.clone(), file_size);
            let mut file = File::open(&archive_file)?;
            let mut file_contents = Vec::new();
            file.read_to_end(&mut file_contents)?;
            form = form.part(
                "logs",
                multipart::Part::bytes(file_contents)
                    .file_name(zip_filename.clone())
                    .mime_str("application/x-compressed")?,
            );
            Some(archive_file)
        } else {
            None
        };

        let airdrop_tokens = ConfigCore::content().await.airdrop_tokens().clone();
        let jwt = airdrop_tokens.map(|tokens| tokens.token);

        // Send the POST request
        let mut req = reqwest::Client::new().post(feedback_url).multipart(form);
        if let Some(jwt) = jwt {
            req = req.header("Authorization", format!("Bearer {jwt}"));
        }
        let response = req.send().await?;

        // Delete the ZIP file
        if let Some(archive_file) = upload_zip_path {
            std::fs::remove_file(archive_file)?;
        }
        if response.status().is_success() {
            info!(target: LOG_TARGET_APP_LOGIC, "Feedback sent successfully");
            Ok(response.text().await?)
        } else {
            error!(target: LOG_TARGET_APP_LOGIC, "Failed to upload file: {}", response.status());
            Err(anyhow!("Failed to upload file: {}", response.status()))
        }
    }
}
