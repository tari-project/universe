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

use std::{sync::LazyLock, time::SystemTime};

use getset::{Getters, Setters};
use serde::{Deserialize, Serialize};
use tokio::sync::Mutex;

use super::trait_config::{ConfigContentImpl, ConfigImpl};

static INSTANCE: LazyLock<Mutex<TestConfig>> = LazyLock::new(|| Mutex::new(TestConfig::new()));

#[derive(Clone)]
struct TestOldConfig {
    some_test_string: String,
    some_test_bool: bool,
}
#[derive(Serialize, Deserialize, PartialEq, Debug)]
#[serde(rename_all = "snake_case")]
#[serde(default)]
#[derive(Getters, Setters)]
#[getset(get = "pub", set = "pub")]
struct NotFullConfigContent {
    created_at: SystemTime,
    some_test_string: String,
}

impl Default for NotFullConfigContent {
    fn default() -> Self {
        Self {
            created_at: SystemTime::now(),
            some_test_string: "".to_string(),
        }
    }
}

#[derive(Serialize, Deserialize, PartialEq, Debug)]
#[serde(rename_all = "snake_case")]
#[serde(default)]
#[derive(Getters, Setters)]
#[getset(get = "pub", set = "pub")]
struct TestConfigContent {
    created_at: SystemTime,
    some_test_string: String,
    some_test_bool: bool,
    some_test_int: i32,
}

impl Default for TestConfigContent {
    fn default() -> Self {
        Self {
            created_at: SystemTime::now(),
            some_test_string: "".to_string(),
            some_test_bool: false,
            some_test_int: 0,
        }
    }
}

impl ConfigContentImpl for TestConfigContent {}

struct TestConfig {
    content: TestConfigContent,
}

impl ConfigImpl for TestConfig {
    type Config = TestConfigContent;
    type OldConfig = TestOldConfig;

    fn current() -> &'static Mutex<Self> {
        &INSTANCE
    }

    fn new() -> Self {
        Self {
            content: TestConfigContent::default(),
        }
    }

    fn get_name() -> String {
        "test_config".to_string()
    }

    fn get_content(&self) -> &Self::Config {
        &self.content
    }

    fn get_content_mut(&mut self) -> &mut Self::Config {
        &mut self.content
    }

    fn migrate_old_config(&mut self, old_config: Self::OldConfig) -> Result<(), anyhow::Error> {
        self.content = TestConfigContent {
            created_at: SystemTime::now(),
            some_test_string: old_config.some_test_string,
            some_test_bool: old_config.some_test_bool,
            some_test_int: 0,
        };
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    #![allow(clippy::unwrap_used)]

    use super::*;
    use std::fs;

    fn clear_config_file() {
        if TestConfig::get_config_path().exists() {
            std::fs::remove_file(TestConfig::get_config_path()).unwrap();
        }
    }

    fn before_each() {
        clear_config_file();
    }

    #[tokio::test]
    async fn test_saving_to_file() {
        let config = TestConfig::current().lock().await;
        before_each();

        config.save_config().unwrap();

        assert!(TestConfig::get_config_path().exists());
    }

    #[tokio::test]
    async fn test_loading_from_file() {
        let config = TestConfig::current().lock().await;
        before_each();

        config.save_config().unwrap();

        let loaded_config = config.load_config().unwrap();
        assert_eq!(config.get_content(), &loaded_config);
    }

    #[tokio::test]
    async fn test_update_field() {
        let mut config = TestConfig::current().lock().await;
        before_each();

        let initial_value = *config.get_content().some_test_bool();
        config
            .update_field(TestConfigContent::set_some_test_bool, !initial_value)
            .unwrap();

        assert_eq!(!initial_value, *config.get_content().some_test_bool());
        assert_eq!(
            !initial_value,
            *config.load_config().unwrap().some_test_bool()
        );
    }
    #[tokio::test]
    async fn test_migrate_old_config() {
        let mut config = TestConfig::current().lock().await;
        before_each();

        let old_config = TestOldConfig {
            some_test_string: "test".to_string(),
            some_test_bool: true,
        };

        config.migrate_old_config(old_config.clone()).unwrap();

        assert_eq!(
            &old_config.some_test_string,
            config.get_content().some_test_string()
        );
        assert_eq!(
            old_config.some_test_bool,
            *config.get_content().some_test_bool()
        );
        assert_eq!(0, *config.get_content().some_test_int());
    }

    #[tokio::test]
    async fn test_if_loading_with_missing_files_is_handled() {
        let config = TestConfig::current().lock().await;
        before_each();

        let not_full_config = NotFullConfigContent {
            created_at: SystemTime::now(),
            some_test_string: "test".to_string(),
        };

        let not_full_config_serialized = serde_json::to_string_pretty(&not_full_config).unwrap();
        fs::write(TestConfig::get_config_path(), not_full_config_serialized).unwrap();

        let loaded_config = config.load_config().unwrap();

        assert_eq!(
            loaded_config.some_test_string,
            not_full_config.some_test_string
        );
        assert_eq!(loaded_config.created_at, not_full_config.created_at);
        assert_eq!(
            loaded_config.some_test_bool,
            TestConfigContent::default().some_test_bool
        );
        assert_eq!(
            loaded_config.some_test_int,
            TestConfigContent::default().some_test_int
        );
    }
}
