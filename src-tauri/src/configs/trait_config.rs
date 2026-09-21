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

/// Writes `content` to `path` so that a reader only ever sees the complete old
/// or the complete new file.
///
/// `fs::write` truncates in place, so a power loss, a full disk or an `exit()`
/// from another thread mid-write leaves a zero-length or NUL-filled file. For
/// `config_wallet.json` that meant an unparseable file holding the only copy of
/// the wallet id list, which is the origin of the config-load crash loop.
///
/// Instead: a fresh temp file in the *same* directory (so the rename stays on
/// one filesystem and cannot degrade to a copy), fsync it so the bytes are on
/// the medium before anything points at them, then rename over the target.
/// Rename is atomic on POSIX, and `std::fs::rename` uses `MoveFileEx` with
/// `MOVEFILE_REPLACE_EXISTING` on Windows. Every temp file is uniquely named,
/// so two concurrent writers can never share one.
pub(crate) fn atomic_write(path: &Path, content: &[u8]) -> Result<(), Error> {
    let parent = path
        .parent()
        .ok_or_else(|| anyhow::anyhow!("Config path has no parent"))?;
    fs::create_dir_all(parent)?;
    // Dropping a `NamedTempFile` removes it, so an error on any line below
    // leaves no stray temp file next to the config.
    let mut temporary = tempfile::NamedTempFile::new_in(parent)?;
    temporary.write_all(content)?;
    temporary.as_file().sync_all()?;
    temporary.persist(path).map_err(|error| error.error)?;
    // Also persist the directory entry, so the rename itself survives a crash.
    // Best effort by design: the data is already durable and the rename has
    // happened, so failing the save here would report a loss that did not occur.
    #[cfg(unix)]
    if fs::File::open(parent)
        .and_then(|dir| dir.sync_all())
        .is_err()
    {
        debug!(target: LOG_TARGET_APP_LOGIC, "[atomic_write] directory sync unavailable");
    }
    Ok(())
}

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
        atomic_write(&config_path, config_content_serialized.as_bytes())
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
    ///
    /// The write lock is held across both the mutation and the save. It used to
    /// be taken for the setter, dropped, and then a *read* lock taken for the
    /// write to disk, which let two tasks updating different fields be inside
    /// the same file write at once and interleave their bytes. Holding one lock
    /// serializes writers per config.
    ///
    /// The mutation is applied to a copy and only committed to the shared
    /// content once the save succeeded, so a failed save (disk full, file
    /// locked by antivirus) leaves memory and disk agreeing on the old value
    /// instead of silently diverging. The error is returned, not swallowed.
    async fn update_field<F, I>(setter_callback: F, value: I) -> Result<(), Error>
    where
        I: Serialize + Clone,
        F: FnOnce(&mut Self::Config, I) -> &mut Self::Config,
        Self: 'static,
    {
        debug!(target: LOG_TARGET_APP_LOGIC, "[{}] [update_field] with function: {:?} and value of type: {:?}", Self::_get_name(), std::any::type_name::<F>(), std::any::type_name::<I>());
        {
            let mut config = Self::current().write().await;
            let mut updated = config._get_content().clone();
            setter_callback(&mut updated, value);
            Self::_save_config(updated.clone()).inspect_err(|_error|
                warn!(target: LOG_TARGET_APP_LOGIC, "[{}] [update_field] failed to persist config", Self::_get_name())
            )?;
            *config._get_content_mut() = updated;
        }
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

#[cfg(test)]
mod durability_tests {
    use super::*;
    use std::sync::{
        LazyLock,
        atomic::{AtomicBool, Ordering},
    };

    static DIRECTORY: LazyLock<tempfile::TempDir> = LazyLock::new(|| tempfile::tempdir().unwrap());
    static INSTANCE: LazyLock<RwLock<TestConfig>> =
        LazyLock::new(|| RwLock::new(TestConfig::new()));
    static FAIL_SAVE: AtomicBool = AtomicBool::new(false);

    #[derive(Clone, Default, Serialize, Deserialize)]
    struct Content {
        updates: Vec<u32>,
    }
    impl ConfigContentImpl for Content {}
    struct TestConfig(Content);
    impl ConfigImpl for TestConfig {
        type Config = Content;
        fn new() -> Self {
            Self(Content::default())
        }
        fn current() -> &'static RwLock<Self> {
            &INSTANCE
        }
        async fn _get_app_handle(&self) -> Option<AppHandle> {
            None
        }
        async fn load_app_handle(&mut self, _app_handle: AppHandle) {}
        fn _get_name() -> String {
            "durability_test".into()
        }
        fn _get_content(&self) -> &Content {
            &self.0
        }
        fn _get_content_mut(&mut self) -> &mut Content {
            &mut self.0
        }
        fn _get_config_path() -> PathBuf {
            DIRECTORY.path().join("config.json")
        }
        fn _save_config(content: Content) -> Result<(), Error> {
            anyhow::ensure!(!FAIL_SAVE.load(Ordering::SeqCst), "simulated save failure");
            atomic_write(&Self::_get_config_path(), &serde_json::to_vec(&content)?)
        }
    }

    #[tokio::test(flavor = "multi_thread", worker_threads = 4)]
    async fn concurrent_updates_persist_every_mutation_and_failed_saves_do_not_publish() {
        let mut tasks = tokio::task::JoinSet::new();
        for value in 0..32 {
            tasks.spawn(TestConfig::update_field(
                |content, value| {
                    content.updates.push(value);
                    content
                },
                value,
            ));
        }
        while let Some(result) = tasks.join_next().await {
            result.unwrap().unwrap();
        }
        let memory = TestConfig::content().await;
        let disk = TestConfig::_load_config().unwrap();
        assert_eq!(memory.updates, disk.updates);
        let mut updates = disk.updates;
        updates.sort_unstable();
        assert_eq!(updates, (0..32).collect::<Vec<_>>());
        FAIL_SAVE.store(true, Ordering::SeqCst);
        assert!(
            TestConfig::update_field(
                |content, value| {
                    content.updates.push(value);
                    content
                },
                99
            )
            .await
            .is_err()
        );
        assert_eq!(TestConfig::content().await.updates, memory.updates);
        assert_eq!(TestConfig::_load_config().unwrap().updates, memory.updates);
    }
}
