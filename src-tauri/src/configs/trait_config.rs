use std::{any::Any, env::temp_dir, fmt::Debug, fs, path::PathBuf, sync::Mutex};

use anyhow::Error;
use dirs::config_dir;
use log::debug;
use serde::{Deserialize, Serialize};

use crate::APPLICATION_FOLDER_ID;

pub trait ConfigContentImpl: Default + Serialize + for<'de> Deserialize<'de> {}

static LOG_TARGET: &str = "config_trait";

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
        let config_dir = config_path.parent().unwrap();
        fs::create_dir_all(config_dir)?;
        let config_content = self.get_content();
        let config_content_serialized = serde_json::to_string_pretty(config_content)?;
        fs::write(config_path, config_content_serialized)?;
        Ok(())
    }
    fn load_config(&self) -> Result<Self::Config, Error> {
        let config_path = Self::get_config_path();
        let config_content_serialized = fs::read_to_string(config_path)?;
        let config_content: Self::Config = serde_json::from_str(&config_content_serialized)?;
        Ok(config_content)
    }
    fn migrate_old_config(&mut self, old_config: Self::OldConfig) -> Result<(), Error>;

    fn update_field<F, I: Debug>(&mut self, setter_callback: F, value: I) -> Result<(), Error>
    where
        F: FnOnce(&mut Self::Config, I),
    {
        debug!(target: LOG_TARGET, "[{}] [update_field] with function: {:?} and value: {:?}", Self::get_name(), std::any::type_name::<F>(), value);
        let mut content = self.get_content_mut();
        setter_callback(&mut content, value);
        self.save_config()?;
        Ok(())
    }

    fn get_field<F, T>(&self, getter_callback: F) -> T
    where
        F: FnOnce(&Self::Config) -> T,
    {
        debug!(target: LOG_TARGET, "[{}] [get_field] with function: {:?}", Self::get_name(), std::any::type_name::<F>());
        let content = self.get_content();
        getter_callback(content)
    }
}
