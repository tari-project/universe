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

use std::{env::temp_dir, fmt::Debug, fs, path::PathBuf};

use anyhow::Error;
use dirs::config_dir;
use log::{debug, info, warn};
use serde::{Deserialize, Serialize};
use serde_json::json;
use tari_common::configuration::Network;
use tauri::{AppHandle, Manager};
use tokio::sync::RwLock;

use crate::{
    events_manager::EventsManager,
    setup::setup_manager::{SetupManager, SetupPhase},
    UniverseAppState, APPLICATION_FOLDER_ID,
};

#[allow(dead_code)]
pub trait ConfigContentImpl: Clone + Default + Serialize + for<'de> Deserialize<'de> {}

#[allow(dead_code)]
static LOG_TARGET: &str = "config_trait";

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
        if let Some(app_handle) = self._get_app_handle().await {
            EventsManager::handle_ask_for_restart(&app_handle).await;
        }
        Ok(())
    }

    fn _load_or_create() -> Self::Config {
        match Self::_load_config() {
            Ok(config_content) => {
                info!(target: LOG_TARGET, "[{}] [load_config] loaded config content", Self::_get_name());
                config_content
            }
            Err(_) => {
                debug!(target: LOG_TARGET, "[{}] [load_config] creating new config content", Self::_get_name());
                let config_content = Self::Config::default();
                let _unused = Self::_save_config(config_content.clone()).inspect_err(|error| {
                    warn!(target: LOG_TARGET, "[{}] [save_config] error: {:?}", Self::_get_name(), error);
                });
                config_content
            }
        }
    }

    fn _save_config(config_content: Self::Config) -> Result<(), Error> {
        let config_path = Self::_get_config_path();
        if let Some(parent) = config_path.parent() {
            fs::create_dir_all(parent)?;
        }
        let config_content_serialized = serde_json::to_string_pretty(&config_content)?;
        fs::write(config_path, config_content_serialized)?;
        Ok(())
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
    async fn update_field<F, I>(setter_callback: F, value: I) -> Result<(), Error>
    where
        I: Serialize + Clone + Debug,
        F: FnOnce(&mut Self::Config, I) -> &mut Self::Config,
        Self: 'static,
    {
        debug!(target: LOG_TARGET, "[{}] [update_field] with function: {:?} and value: {:?}", Self::_get_name(), std::any::type_name::<F>(), value);
        setter_callback(
            Self::current().write().await._get_content_mut(),
            value.clone(),
        );
        Self::_save_config(Self::current().read().await._get_content().clone()).inspect_err(|error|
            debug!(target: LOG_TARGET, "[{}] [update_field] error: {:?}", Self::_get_name(), error)
        )?;
        Self::current()
            .read()
            .await
            ._send_telemetry_event(
                "config-update-field",
                json!({
                    "config": Self::_get_name(),
                    "field": std::any::type_name::<F>(),
                    "value": value,
                }),
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
        I: Serialize + Clone + Debug,
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
