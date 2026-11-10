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

use std::{
    env::temp_dir,
    fs,
    io::Write,
    path::{Path, PathBuf},
};

use anyhow::Error;
use dirs::config_dir;
use log::{debug, info, warn};
use serde::{Deserialize, Serialize};
use serde_json::json;
use tari_common::configuration::Network;
use tauri::{AppHandle, Manager};
use tokio::sync::RwLock;

use crate::{
    APPLICATION_FOLDER_ID, LOG_TARGET_APP_LOGIC, UniverseAppState,
    events_emitter::EventsEmitter,
    setup::setup_manager::{SetupManager, SetupPhase},
};

pub const CONFIG_UPDATE_FIELD_EVENT_NAME: &str = "config-update-field";

/// Builds the payload for the `config-update-field` telemetry event.
///
/// Only metadata about *which* config and *which* setter ran is reported. The
/// value passed to the setter is deliberately never included: the generic
/// setters are used for secrets as well (airdrop access/refresh tokens, for
/// example), so any value forwarded here would be exfiltrated to the telemetry
/// endpoint.
pub fn build_config_update_field_event(config_name: &str, field: &str) -> serde_json::Value {
    json!({
        "config": config_name,
        "field": field,
    })
}

/// Writes a temporary file next to `path`, flushes it and renames over `path`. A
/// truncate-in-place write leaves an empty or NUL-filled file behind when the machine
/// dies mid-write, and a config the app cannot parse stops it from starting at all.
pub(crate) fn atomic_write(path: &Path, contents: &[u8]) -> Result<(), Error> {
    let temp_path = path.with_extension("json.tmp");
    // Configs hold secrets (tokens, view key), so on unix the file is owner-only.
    #[cfg(unix)]
    let mut temp_file = {
        use std::os::unix::fs::OpenOptionsExt;
        // `mode` only applies on creation, so drop any stale temp file from an earlier run.
        let _unused = fs::remove_file(&temp_path);
        fs::OpenOptions::new()
            .write(true)
            .create(true)
            .truncate(true)
            .mode(0o600)
            .open(&temp_path)?
    };
    #[cfg(not(unix))]
    let mut temp_file = fs::File::create(&temp_path)?;
    temp_file.write_all(contents)?;
    temp_file.sync_all()?;
    drop(temp_file);
    fs::rename(&temp_path, path)?;
    Ok(())
}

static FILE_WRITE_MUTEX: tokio::sync::Mutex<()> = tokio::sync::Mutex::const_new(());

/// Writes serialized config to the specified path atomically, ensuring parent directory exists.
fn write_serialized_config(path: &Path, bytes: &[u8]) -> Result<(), Error> {
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent)?;
    }
    atomic_write(path, bytes)
}

/// Clamps the app config root, `app_configs/`, each network dir under it to 0700 and the
/// files directly inside each network dir to 0600. Runs on every startup to fix installs
/// that were written world-readable. Best-effort: every failure is logged and skipped.
#[cfg(unix)]
pub(crate) fn harden_app_config_permissions(root: &Path) {
    use std::os::unix::fs::PermissionsExt;

    let chmod = |path: &Path, mode: u32| {
        if let Err(e) = fs::set_permissions(path, fs::Permissions::from_mode(mode)) {
            warn!(target: LOG_TARGET_APP_LOGIC, "Failed to set mode {mode:o} on {}: {e}", path.display());
        }
    };
    let read_dir = |path: &Path| -> Vec<PathBuf> {
        fs::read_dir(path)
            .inspect_err(|e| warn!(target: LOG_TARGET_APP_LOGIC, "Failed to read {}: {e}", path.display()))
            .into_iter()
            .flatten()
            .filter_map(|entry| {
                entry
                    .inspect_err(|e| warn!(target: LOG_TARGET_APP_LOGIC, "Failed to read entry in {}: {e}", path.display()))
                    .ok()
            })
            .map(|entry| entry.path())
            .collect()
    };

    if let Err(e) = fs::create_dir_all(root) {
        warn!(target: LOG_TARGET_APP_LOGIC, "Failed to create {}: {e}", root.display());
        return;
    }
    chmod(root, 0o700);

    let app_configs = root.join("app_configs");
    // symlink_metadata so symlinks are skipped rather than followed.
    if !fs::symlink_metadata(&app_configs).is_ok_and(|m| m.is_dir()) {
        return;
    }
    chmod(&app_configs, 0o700);
    for network_dir in read_dir(&app_configs) {
        if !fs::symlink_metadata(&network_dir).is_ok_and(|m| m.is_dir()) {
            continue;
        }
        chmod(&network_dir, 0o700);
        for file in read_dir(&network_dir) {
            if fs::symlink_metadata(&file).is_ok_and(|m| m.is_file()) {
                chmod(&file, 0o600);
            }
        }
    }
}

#[cfg(not(unix))]
pub(crate) fn harden_app_config_permissions(_root: &Path) {}

#[allow(dead_code)]
pub trait ConfigContentImpl: Clone + Default + Serialize + for<'de> Deserialize<'de> {}

#[allow(dead_code)]
pub trait ConfigImpl {
    type Config: ConfigContentImpl;

    fn new() -> Self;
    fn current() -> &'static RwLock<Self>;
    async fn _get_app_handle(&self) -> Option<AppHandle>;
    fn _get_name() -> String;
    fn _get_content(&self) -> &Self::Config;
    fn _get_content_mut(&mut self) -> &mut Self::Config;
    fn _get_config_path() -> PathBuf {
        let config_dir = config_dir().unwrap_or_else(|| {
            debug!("Failed to get config directory, using temp dir");
            temp_dir()
        });
        config_dir
            .join(APPLICATION_FOLDER_ID)
            .join("app_configs")
            .join(Network::get_current_or_user_setting_or_default().as_key_str())
            .join(format!("{}.json", Self::_get_name()))
    }
    async fn _send_telemetry_event(&self, event_name: &str, event_data: serde_json::Value) {
        if let Some(app_handle) = self._get_app_handle().await {
            let app_state = app_handle.state::<UniverseAppState>();
            let _unused = app_state
                .telemetry_service
                .read()
                .await
                .send(event_name.to_string(), event_data)
                .await;
        }
    }

    async fn _send_restart_event(&self) -> Result<(), Error> {
        EventsEmitter::emit_ask_for_restart().await;
        Ok(())
    }

    fn _load_or_create() -> Self::Config {
        match Self::_load_config() {
            Ok(config_content) => {
                info!(target: LOG_TARGET_APP_LOGIC, "[{}] [load_config] loaded config content", Self::_get_name());
                config_content
            }
            Err(_) => {
                debug!(target: LOG_TARGET_APP_LOGIC, "[{}] [load_config] creating new config content", Self::_get_name());
                let config_content = Self::Config::default();
                let _unused = Self::_save_config(config_content.clone()).inspect_err(|error| {
                    warn!(target: LOG_TARGET_APP_LOGIC, "[{}] [save_config] error: {:?}", Self::_get_name(), error);
                });
                config_content
            }
        }
    }

    fn _save_config(config_content: Self::Config) -> Result<(), Error> {
        let config_path = Self::_get_config_path();
        let config_content_serialized = serde_json::to_string_pretty(&config_content)?;
        write_serialized_config(&config_path, config_content_serialized.as_bytes())
    }
    fn _load_config() -> Result<Self::Config, Error> {
        let config_path = Self::_get_config_path();
        let config_content_serialized = fs::read_to_string(config_path)?;
        let config_content: Self::Config = serde_json::from_str(&config_content_serialized)?;
        Ok(config_content)
    }
    async fn content() -> Self::Config
    where
        Self: 'static,
    {
        Self::current().read().await._get_content().clone()
    }
    async fn load_app_handle(&mut self, app_handle: AppHandle);
    /// Applies `setter_callback` to the config content and persists it.
    ///
    /// The value is never logged or reported: setters carry user secrets such
    /// as airdrop tokens. Only the config name and the setter type name are
    /// recorded.
    async fn update_field<F, I>(setter_callback: F, value: I) -> Result<(), Error>
    where
        I: Serialize + Clone,
        F: FnOnce(&mut Self::Config, I) -> &mut Self::Config,
        Self: 'static,
    {
        debug!(target: LOG_TARGET_APP_LOGIC, "[{}] [update_field] with function: {:?} and value of type: {:?}", Self::_get_name(), std::any::type_name::<F>(), std::any::type_name::<I>());
        let _queue_guard = FILE_WRITE_MUTEX.lock().await;
        let (config_path, config_content_serialized, config_name) = {
            let mut config = Self::current().write().await;
            setter_callback(config._get_content_mut(), value.clone());
            let config_path = Self::_get_config_path();
            let config_content_serialized = serde_json::to_string_pretty(config._get_content())?;
            (config_path, config_content_serialized, Self::_get_name())
        };

        tokio::task::spawn_blocking(move || {
            write_serialized_config(&config_path, config_content_serialized.as_bytes())
        })
        .await
        .map_err(|e| anyhow::anyhow!("spawn_blocking join error: {e}"))?
        .inspect_err(|error| {
            debug!(target: LOG_TARGET_APP_LOGIC, "[{config_name}] [update_field] error: {error:?}")
        })?;
        drop(_queue_guard);

        Self::current()
            .read()
            .await
            ._send_telemetry_event(
                CONFIG_UPDATE_FIELD_EVENT_NAME,
                build_config_update_field_event(&Self::_get_name(), std::any::type_name::<F>()),
            )
            .await;
        Ok(())
    }

    async fn update_field_requires_restart<F, I>(
        setter_callback: F,
        value: I,
        phases_to_restart: Vec<SetupPhase>,
    ) -> Result<(), Error>
    where
        I: Serialize + Clone,
        F: FnOnce(&mut Self::Config, I) -> &mut Self::Config,
        Self: 'static,
    {
        Self::update_field(setter_callback, value).await?;
        SetupManager::get_instance()
            .add_phases_to_restart_queue(phases_to_restart)
            .await;
        Ok(())
    }
}

#[cfg(all(test, unix))]
mod permission_tests {
    #![allow(clippy::unwrap_used)]

    use std::os::unix::fs::PermissionsExt;

    use super::*;

    fn mode(path: &Path) -> u32 {
        fs::metadata(path).unwrap().permissions().mode() & 0o777
    }

    fn set_mode(path: &Path, mode: u32) {
        fs::set_permissions(path, fs::Permissions::from_mode(mode)).unwrap();
    }

    #[test]
    fn test_atomic_write_stale_world_readable_temp_file_writes_owner_only() {
        let dir = tempfile::tempdir().unwrap();
        let path = dir.path().join("config_core.json");
        let stale_temp = path.with_extension("json.tmp");
        fs::write(&stale_temp, b"stale").unwrap();
        set_mode(&stale_temp, 0o644);

        atomic_write(&path, b"{}").unwrap();

        assert_eq!(mode(&path), 0o600);
        assert_eq!(fs::read(&path).unwrap(), b"{}");
    }

    #[test]
    fn test_harden_app_config_permissions_open_tree_is_clamped_to_owner() {
        let dir = tempfile::tempdir().unwrap();
        let root = dir.path().join("app");
        let app_configs = root.join("app_configs");
        let network = app_configs.join("mainnet");
        let file = network.join("config_core.json");
        fs::create_dir_all(&network).unwrap();
        fs::write(&file, b"{}").unwrap();
        for d in [&root, &app_configs, &network] {
            set_mode(d, 0o755);
        }
        set_mode(&file, 0o644);

        harden_app_config_permissions(&root);

        assert_eq!(mode(&root), 0o700);
        assert_eq!(mode(&app_configs), 0o700);
        assert_eq!(mode(&network), 0o700);
        assert_eq!(mode(&file), 0o600);
    }

    #[test]
    fn test_harden_app_config_permissions_missing_root_is_created_owner_only() {
        let dir = tempfile::tempdir().unwrap();
        let root = dir.path().join("missing");

        harden_app_config_permissions(&root);

        assert_eq!(mode(&root), 0o700);
        assert!(!root.join("app_configs").exists());
    }

    #[test]
    fn test_harden_app_config_permissions_unusable_root_logs_without_panicking() {
        let dir = tempfile::tempdir().unwrap();
        let root = dir.path().join("not_a_dir");
        fs::write(&root, b"").unwrap();
        set_mode(&root, 0o644);

        harden_app_config_permissions(&root);

        assert_eq!(mode(&root), 0o644);
    }
}
