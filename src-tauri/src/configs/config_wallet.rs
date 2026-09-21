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

use std::{collections::HashMap, fs, path::Path, sync::LazyLock, time::SystemTime};

use getset::{Getters, Setters};
use serde::{Deserialize, Serialize};
use tari_common_types::tari_address::TariAddress;
use tari_transaction_components::tari_amount::MicroMinotari;
use tauri::AppHandle;
use tokio::sync::RwLock;

use crate::{
    LOG_TARGET_APP_LOGIC,
    configs::config_ui::{ConfigUI, ConfigUIContent},
    internal_wallet::TariWalletDetails,
    pin::PinLockerState,
};

use super::trait_config::{ConfigContentImpl, ConfigImpl, atomic_write};

static EXCHANGES_RECORD_NAME_FOR_EXTERNAL_ADDRESS_BOOK: &str = "Exchanges";

static INSTANCE: LazyLock<RwLock<ConfigWallet>> =
    LazyLock::new(|| RwLock::new(ConfigWallet::new()));

pub const WALLET_VERSION: u32 = 2;

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct ExternalTariAddressBookRecord {
    pub name: String,
    pub address: TariAddress,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct WalletId(String);
impl WalletId {
    pub fn new(id: String) -> Self {
        WalletId(id)
    }
    pub fn as_str(&self) -> &str {
        &self.0
    }
}

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "snake_case")]
#[serde(default)]
#[derive(Getters, Setters)]
#[allow(clippy::struct_excessive_bools)]
pub struct ConfigWalletContent {
    #[getset(get = "pub")]
    corrupted_recovery: bool,
    #[getset(get = "pub", set = "pub")]
    version_counter: u32,
    #[getset(get = "pub", set = "pub")]
    tari_wallets: Vec<WalletId>,
    #[getset(get = "pub")]
    monero_address: String,
    #[getset(get = "pub", set = "pub")]
    wxtm_addresses: HashMap<String, String>, // This is the Ethereum address used for WXTm mode | Maps exchange ID to address
    #[getset(get = "pub")]
    monero_address_is_generated: bool,
    #[getset(get = "pub", set = "pub")]
    keyring_accessed: bool, // backward compatibility
    #[getset(get = "pub", set = "pub")]
    wallet_migration_nonce: u64,
    created_at: SystemTime,
    #[getset(get = "pub", set = "pub")]
    external_tari_addresses_book: HashMap<String, ExternalTariAddressBookRecord>,
    #[getset(get = "pub", set = "pub")]
    selected_external_tari_address: Option<TariAddress>,
    #[getset(get = "pub", set = "pub")]
    tari_wallet_details: Option<TariWalletDetails>,
    #[getset(get = "pub", set = "pub")]
    pin_locker_state: PinLockerState,
    #[getset(get = "pub", set = "pub")]
    seed_backed_up: bool,
    #[getset(get = "pub", set = "pub")]
    last_known_balance: MicroMinotari,
    #[getset(get = "pub", set = "pub")]
    security_warning_dismissed: bool,
}

impl Default for ConfigWalletContent {
    fn default() -> Self {
        Self {
            corrupted_recovery: false,
            version_counter: WALLET_VERSION,
            tari_wallets: Vec::new(), // Owned wallets` ids
            monero_address: "".to_string(),
            monero_address_is_generated: false,
            keyring_accessed: false,
            wxtm_addresses: HashMap::new(), // Ethereum addresses used for WXTm mode
            wallet_migration_nonce: 0,
            created_at: SystemTime::now(),
            selected_external_tari_address: None, // Takes precedence over an owned address
            external_tari_addresses_book: HashMap::new(),
            tari_wallet_details: None, // Owned tari address details
            pin_locker_state: PinLockerState::default(),
            seed_backed_up: false,
            last_known_balance: MicroMinotari(0),
            security_warning_dismissed: false,
        }
    }
}
impl ConfigContentImpl for ConfigWalletContent {}

/// The wallet config as the webview receives it.
///
/// `ConfigWalletContent` carries `tari_wallet_details`, and therefore the
/// wallet view private key, so the content must never be emitted to the
/// frontend wholesale. This payload copies only the fields the frontend's
/// `ConfigWallet` TypeScript interface actually reads, under the same names and
/// casing, so nothing on the frontend has to change.
///
/// `Serialize` on `ConfigWalletContent` is shared with `_save_config`, so the
/// key cannot simply be skipped there: `config_wallet.json` has to keep it.
#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "snake_case")]
pub struct ConfigWalletFrontend<'a> {
    monero_address: &'a str,
    monero_address_is_generated: bool,
    wxtm_addresses: &'a HashMap<String, String>,
    last_known_balance: &'a MicroMinotari,
}

impl<'a> From<&'a ConfigWalletContent> for ConfigWalletFrontend<'a> {
    fn from(content: &'a ConfigWalletContent) -> Self {
        Self {
            monero_address: &content.monero_address,
            monero_address_is_generated: content.monero_address_is_generated,
            wxtm_addresses: &content.wxtm_addresses,
            last_known_balance: &content.last_known_balance,
        }
    }
}

impl ConfigWalletContent {
    pub fn ensure_available(&self) -> Result<(), anyhow::Error> {
        anyhow::ensure!(
            !self.corrupted_recovery,
            "Wallet configuration needs recovery. Restore a valid wallet configuration backup before continuing."
        );
        Ok(())
    }

    /// Builds the sanitized payload sent to the webview. Never includes
    /// `tari_wallet_details` or anything derived from it.
    pub fn to_frontend_payload(&self) -> ConfigWalletFrontend<'_> {
        ConfigWalletFrontend::from(self)
    }

    pub fn add_wxtm_address(&mut self, payload: (String, String)) -> &mut Self {
        let (exchange_id, address) = payload;
        self.wxtm_addresses.insert(exchange_id, address);
        self
    }

    pub fn set_user_monero_address(&mut self, address: String) -> &mut Self {
        self.monero_address = address;
        self.monero_address_is_generated = false;
        self
    }

    pub fn set_generated_monero_address(&mut self, address: String) -> &mut Self {
        self.monero_address = address;
        self.monero_address_is_generated = true;

        self
    }

    pub fn select_external_tari_address(&mut self, address: TariAddress) -> &mut Self {
        self.selected_external_tari_address = Some(address.clone());
        self.external_tari_addresses_book.insert(
            EXCHANGES_RECORD_NAME_FOR_EXTERNAL_ADDRESS_BOOK.to_string(),
            ExternalTariAddressBookRecord {
                name: EXCHANGES_RECORD_NAME_FOR_EXTERNAL_ADDRESS_BOOK.to_string(),
                address,
            },
        );
        // Don't clear tari_wallet_details
        self
    }

    // Auto select the first wallet
    pub fn add_tari_wallet(&mut self, selected_wallet_details: TariWalletDetails) -> &mut Self {
        // Deselect the external Tari address because a new address is now selected by default
        self.selected_external_tari_address = None;
        self.tari_wallets
            .insert(0, selected_wallet_details.id.clone());
        self.tari_wallet_details = Some(selected_wallet_details);

        // Remove when we decide not to autoselect
        self.seed_backed_up = false;

        self
    }
}

pub struct ConfigWallet {
    content: ConfigWalletContent,
    app_handle: RwLock<Option<AppHandle>>,
}

impl ConfigWallet {
    /// Load only validated data. The marker is persisted before quarantine so a
    /// crash between renaming the damaged file and the next launch cannot look
    /// like a fresh installation. A manually restored valid primary takes priority.
    pub(super) fn load_from_path(path: &Path) -> ConfigWalletContent {
        let backup = path.with_extension("json.backup");
        let marker = path.with_extension("json.recovery_required");
        match Self::read_validated(path) {
            Ok((content, serialized, migrated)) => {
                if migrated && atomic_write(path, serialized.as_bytes()).is_err() {
                    log::warn!(target: LOG_TARGET_APP_LOGIC, "wallet.config_migration_save_failed");
                    return Self::recovery_content();
                }
                if atomic_write(&backup, serialized.as_bytes()).is_err() {
                    log::warn!(target: LOG_TARGET_APP_LOGIC, "wallet.config_backup_failed");
                }
                return content;
            }
            Err(_) => {
                // Do not log parser errors: they can quote secret-bearing values.
                if let Ok((content, serialized, _)) = Self::read_validated(&backup) {
                    if atomic_write(path, serialized.as_bytes()).is_ok() {
                        log::warn!(target: LOG_TARGET_APP_LOGIC, "wallet.config_restored_from_backup");
                        return content;
                    }
                    log::error!(target: LOG_TARGET_APP_LOGIC, "wallet.config_restore_failed");
                    return Self::recovery_content();
                }
            }
        }

        let primary_missing = matches!(fs::metadata(path), Err(error) if error.kind() == std::io::ErrorKind::NotFound);
        let backup_missing = matches!(fs::metadata(&backup), Err(error) if error.kind() == std::io::ErrorKind::NotFound);
        let marker_missing = matches!(fs::metadata(&marker), Err(error) if error.kind() == std::io::ErrorKind::NotFound);
        if primary_missing && backup_missing && marker_missing {
            let content = ConfigWalletContent::default();
            if serde_json::to_vec_pretty(&content)
                .map_err(anyhow::Error::from)
                .and_then(|serialized| atomic_write(path, &serialized))
                .is_ok()
            {
                return content;
            }
            log::error!(target: LOG_TARGET_APP_LOGIC, "wallet.config_create_failed");
            return Self::recovery_content();
        }

        log::error!(target: LOG_TARGET_APP_LOGIC, "wallet.config_corrupted");
        if atomic_write(&marker, b"recovery required\n").is_ok() {
            let timestamp = SystemTime::now()
                .duration_since(SystemTime::UNIX_EPOCH)
                .unwrap_or_default()
                .as_nanos();
            let quarantine = path.with_extension(format!("json.corrupted.{timestamp}"));
            if fs::metadata(path).is_ok_and(|metadata| metadata.is_file())
                && fs::rename(path, quarantine).is_err()
            {
                log::warn!(target: LOG_TARGET_APP_LOGIC, "wallet.config_quarantine_failed");
            }
        } else {
            // Keep the original in place if we cannot durably mark recovery.
            log::warn!(target: LOG_TARGET_APP_LOGIC, "wallet.config_recovery_marker_failed");
        }
        Self::recovery_content()
    }

    fn recovery_content() -> ConfigWalletContent {
        ConfigWalletContent {
            corrupted_recovery: true,
            ..ConfigWalletContent::default()
        }
    }

    fn read_validated(path: &Path) -> Result<(ConfigWalletContent, String, bool), anyhow::Error> {
        let serialized = fs::read_to_string(path)?;
        let mut value: serde_json::Value = serde_json::from_str(&serialized)?;
        let migrated = migrate_payment_id(&mut value);
        let serialized = if migrated {
            serde_json::to_string_pretty(&value)?
        } else {
            serialized
        };
        let content: ConfigWalletContent = serde_json::from_str(&serialized)?;
        content.ensure_available()?;
        Ok((content, serialized, migrated))
    }

    pub async fn initialize(app_handle: AppHandle) {
        let mut config = Self::current().write().await;
        config.load_app_handle(app_handle.clone()).await;
        drop(config);
    }

    pub async fn migrate() -> Result<(), anyhow::Error> {
        let config = ConfigWallet::content().await;
        let current_version = *config.version_counter();

        if current_version < WALLET_VERSION {
            log::info!(target: LOG_TARGET_APP_LOGIC,"Wallet Config needs migration {current_version:?} => {WALLET_VERSION}");

            ConfigWallet::update_field(ConfigWalletContent::set_version_counter, WALLET_VERSION)
                .await?;

            return Ok(());
        }

        if *ConfigUI::content().await.was_staged_security_modal_shown() {
            log::info!(target: LOG_TARGET_APP_LOGIC,"Wallet Config needs 'set_was_staged_security_modal_shown' flag migration");
            // Rename and move this flag here
            ConfigWallet::update_field(ConfigWalletContent::set_seed_backed_up, true).await?;
            // Clear this flag to prevent from re-migrating
            ConfigUI::update_field(ConfigUIContent::set_was_staged_security_modal_shown, false)
                .await?;
        }

        Ok(())
    }
}

/// Rename JSON keys only, including older files with whitespace before the
/// colon. User-entered string values containing the old name are untouched.
fn migrate_payment_id(value: &mut serde_json::Value) -> bool {
    let mut migrated = false;
    match value {
        serde_json::Value::Object(fields) => {
            if let Some(old) = fields.remove("payment_id_user_data") {
                fields.entry("memo_field_payment_id").or_insert(old);
                migrated = true;
            }
            for child in fields.values_mut() {
                migrated |= migrate_payment_id(child);
            }
        }
        serde_json::Value::Array(values) => {
            for child in values {
                migrated |= migrate_payment_id(child);
            }
        }
        _ => {}
    }
    migrated
}

impl ConfigImpl for ConfigWallet {
    type Config = ConfigWalletContent;

    fn current() -> &'static RwLock<Self> {
        &INSTANCE
    }

    fn new() -> Self {
        Self {
            content: ConfigWallet::_load_or_create(),
            app_handle: RwLock::new(None),
        }
    }

    fn _load_or_create() -> Self::Config {
        Self::load_from_path(&Self::_get_config_path())
    }

    fn _save_config(content: Self::Config) -> Result<(), anyhow::Error> {
        content.ensure_available()?;
        atomic_write(
            &Self::_get_config_path(),
            &serde_json::to_vec_pretty(&content)?,
        )
    }

    async fn _get_app_handle(&self) -> Option<AppHandle> {
        self.app_handle.read().await.clone()
    }

    async fn load_app_handle(&mut self, app_handle: AppHandle) {
        *self.app_handle.write().await = Some(app_handle);
    }

    fn _get_name() -> String {
        "config_wallet".to_string()
    }

    fn _get_content(&self) -> &Self::Config {
        &self.content
    }

    fn _get_content_mut(&mut self) -> &mut Self::Config {
        &mut self.content
    }
}
