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

use std::{any::Any, env::temp_dir, fmt::Debug, fs, path::PathBuf, sync::Mutex};

use anyhow::Error;
use dirs::config_dir;
use log::debug;
use serde::{Deserialize, Serialize};

use crate::APPLICATION_FOLDER_ID;

#[allow(dead_code)]
pub trait ConfigContentImpl: Default + Serialize + for<'de> Deserialize<'de> {}

#[allow(dead_code)]
static LOG_TARGET: &str = "config_trait";

#[allow(dead_code)]
pub trait ConfigImpl {
    type Config: ConfigContentImpl;
    type OldConfig: Any;

    fn new() -> Self;
    fn current() -> &'static Mutex<Self>;
    fn get_name() -> String;
    fn get_content(&self) -> &Self::Config;
    fn get_content_mut(&mut self) -> &mut Self::Config;
    fn get_config_path() -> PathBuf {
        let config_dir = config_dir().unwrap_or_else(|| {
            debug!("Failed to get config directory, using temp dir");
            temp_dir()
        });
        config_dir
            .join(APPLICATION_FOLDER_ID)
            .join(Self::get_name())
    }
    fn save_config(&self) -> Result<(), Error> {
        let config_path = Self::get_config_path();
        if let Some(parent) = config_path.parent() {
            fs::create_dir_all(parent)?;
        }
        let config_content = self.get_content();
        let config_content_serialized = serde_json::to_string_pretty(config_content)?;
        fs::write(config_path, config_content_serialized)?;
        Ok(())
    }
    fn load_config(&self) -> Result<Self::Config, Error> {
        let config_path = Self::get_config_path();
        println!("config_path: {:?}", config_path);
        let config_content_serialized = fs::read_to_string(config_path)?;
        let config_content: Self::Config = serde_json::from_str(&config_content_serialized)?;
        Ok(config_content)
    }
    fn migrate_old_config(&mut self, old_config: Self::OldConfig) -> Result<(), Error>;

    fn update_field<F, I: Debug>(&mut self, setter_callback: F, value: I) -> Result<(), Error>
    where
        F: FnOnce(&mut Self::Config, I) -> &mut Self::Config,
    {
        debug!(target: LOG_TARGET, "[{}] [update_field] with function: {:?} and value: {:?}", Self::get_name(), std::any::type_name::<F>(), value);
        let content = self.get_content_mut();
        setter_callback(content, value);
        self.save_config()?;
        Ok(())
    }
}
