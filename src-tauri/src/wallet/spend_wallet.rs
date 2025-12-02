// Copyright 2025. The Tari Project
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
use std::path::PathBuf;
use std::time::Duration;

use anyhow::{Context, Error, Result};
use axum::async_trait;
use log::{debug, info};
use tari_common::configuration::Network;
use tari_common_types::seeds::mnemonic::{Mnemonic, MnemonicLanguage};
use tari_shutdown::Shutdown;
use tauri::{AppHandle, Manager};

use crate::binaries::{Binaries, BinaryResolver};
use crate::internal_wallet::InternalWallet;
use crate::pin::PinManager;
use crate::process_adapter::{
    HealthStatus, ProcessAdapter, ProcessInstance, ProcessInstanceTrait, ProcessStartupSpec,
    StatusMonitor,
};
use crate::tasks_tracker::TasksTrackers;
use crate::utils::commands_builder::CommandBuilder;
use crate::utils::logging_utils::setup_logging;
use crate::LOG_TARGET_APP_LOGIC;

/// Log target for spend wallet module
const EXIT_CODE_ZERO: i32 = 0;

/// SpendWallet provides functionality to handle one-sided transaction signing
/// and related operations for the Tari wallet.
#[derive(Debug, Clone, Default)]
pub struct SpendWallet {
    /// Optional configuration for wallet commands
    config: SpendWalletConfig,
}

/// Configuration options for the SpendWallet
#[derive(Debug, Clone, Default)]
pub struct SpendWalletConfig {
    /// Custom environment variables to pass to wallet commands
    pub custom_envs: HashMap<String, String>,
}

impl SpendWallet {
    pub fn new() -> Self {
        Self::default()
    }

    /// Syncs the wallet with the network using the provided seed words(Required to execute other cli commands)
    async fn sync_wallet(&self, app_handle: &AppHandle, seed_words: &str) -> Result<(), Error> {
        let sync_command = CommandBuilder::new("sync")
            .add_args(&["--skip-recovery", "sync"])
            .add_env("MINOTARI_WALLET_SEED_WORDS", seed_words);

        self.execute_command(app_handle, sync_command, vec![EXIT_CODE_ZERO])
            .await
            .map_err(|e| anyhow::anyhow!("Failed to execute sync command: {}", e))?;

        Ok(())
    }

    /// Signs a one-sided transaction from the provided input file and writes the result to the output file
    ///
    /// # Arguments
    /// * `input_file` - Path to the input transaction file to be signed
    /// * `output_file` - Path where the signed transaction will be written
    /// * `app_handle` - Tauri AppHandle for accessing application paths
    ///
    /// # Returns
    /// * `Result<(), Error>` - Ok if the transaction was successfully signed, otherwise an error
    pub async fn sign_one_sided_transaction(
        &self,
        input_file: PathBuf,
        output_file: PathBuf,
        app_handle: &AppHandle,
    ) -> Result<(), Error> {
        let seed_words = self
            .get_seed_words(app_handle)
            .await
            .context("Failed to retrieve wallet seed words")?;

        // Required step
        self.sync_wallet(app_handle, &seed_words).await?;

        let sign_command = CommandBuilder::new("sign-one-sided-transaction")
            .add_args(&[
                "--skip-recovery",
                "sign-one-sided-transaction",
                "--input-file",
                &input_file.to_string_lossy(),
                "--output-file",
                &output_file.to_string_lossy(),
            ])
            .add_env("MINOTARI_WALLET_SEED_WORDS", &seed_words);

        let (exit_code, _stdout, _stderr) = self
            .execute_command(app_handle, sign_command, vec![EXIT_CODE_ZERO])
            .await
            .map_err(|e| anyhow::anyhow!("Failed to execute signing command: {}", e))?;

        info!(
            target: LOG_TARGET_APP_LOGIC,
            "Transaction signing completed with exit code: {exit_code}"
        );

        let data_dir = self.get_data_dir(app_handle)?;
        let working_dir = data_dir.join("spend_wallet");
        // Clean up spend wallet working directory
        std::fs::remove_dir_all(&working_dir)
            .and_then(|_| std::fs::create_dir_all(&working_dir))
            .context("Failed to clean up Spend Wallet working directory")?;

        Ok(())
    }

    /// Executes a wallet command and waits for its output
    ///
    /// # Arguments
    /// * `app_handle` - Tauri AppHandle for accessing application paths
    /// * `command` - Command to execute
    /// * `allow_exit_codes` - List of exit codes that are considered successful
    ///
    /// # Returns
    /// * `Result<(i32, Vec<String>, Vec<String>), Error>` - Exit code, stdout lines, and stderr lines
    async fn execute_command(
        &self,
        app_handle: &AppHandle,
        command: CommandBuilder,
        allow_exit_codes: Vec<i32>,
    ) -> Result<(i32, Vec<String>, Vec<String>), Error> {
        let data_dir = self.get_data_dir(app_handle)?;
        let config_dir = self.get_config_dir(app_handle)?;
        let log_dir = self.get_log_dir(app_handle)?;
        let binary_path = self.get_binary_path().await?;

        let network = Network::get_current_or_user_setting_or_default().to_string();
        // Ensure working directory exists
        let working_dir = data_dir.join("spend_wallet").join(network);
        if !working_dir.exists() {
            std::fs::create_dir_all(&working_dir)
                .context("Failed to create Spend Wallet working directory")?;
        }

        // Create process instance and monitor
        let (mut instance, _monitor) =
            self.spawn(data_dir.clone(), config_dir, log_dir, binary_path, false)?;

        // Add command-specific arguments and environment variables
        instance.startup_spec.args.extend(command.args.clone());

        let envs = instance.startup_spec.envs.get_or_insert_with(HashMap::new);
        envs.extend(command.envs);
        envs.extend(self.config.custom_envs.clone());

        // Start process and wait for completion
        let (exit_code, stdout_lines, stderr_lines) = instance
            .start_and_wait_for_output(
                TasksTrackers::current()
                    .wallet_phase
                    .get_task_tracker()
                    .await,
            )
            .await
            .context("Failed to start wallet process or collect output")?;

        debug!(
            target: LOG_TARGET_APP_LOGIC,
            "Spend Wallet command '{}' execution completed with exit code: {}",
            command.name,
            exit_code
        );

        if !allow_exit_codes.contains(&exit_code) {
            log::error!(
                target: LOG_TARGET_APP_LOGIC,
                "Command '{}' failed with exit code: {}.\n* Error: {}\n* Stdout: {}\n* Args: {:?}",
                command.name,
                exit_code,
                stdout_lines.join("\n"),
                stderr_lines.join("\n"),
                command.args
            );
            return Err(anyhow::anyhow!(
                "Command '{}' failed with exit code: {}. Error: {}",
                command.name,
                exit_code,
                stderr_lines.join("\n")
            ));
        }

        Ok((exit_code, stdout_lines, stderr_lines))
    }

    /// Gets the shared command line arguments for all commands
    fn get_shared_args(&self, data_dir: PathBuf, log_dir: PathBuf) -> Result<Vec<String>, Error> {
        let working_dir = data_dir.join("spend_wallet");
        let log_config_file = log_dir
            .join("spend_wallet")
            .join("configs")
            .join("log4rs_config_spend_wallet.yml");

        let working_dir_str = working_dir.to_string_lossy().to_string();
        let log_config_str = log_config_file.to_string_lossy().to_string();

        Ok(vec![
            "-b".to_string(),
            working_dir_str,
            format!("--log-config={}", log_config_str),
            "--non-interactive-mode".to_string(),
            "--auto-exit".to_string(),
        ])
    }

    async fn get_seed_words(&self, app_handle: &AppHandle) -> Result<String, Error> {
        let pin_password = PinManager::get_validated_pin_if_defined(app_handle)
            .await
            .context("Failed to validate PIN")?;
        let tari_cipher_seed = InternalWallet::get_tari_seed(pin_password)
            .await
            .context("Failed to get Tari seed")?;
        let seed_words = tari_cipher_seed
            .to_mnemonic(MnemonicLanguage::English, None)
            .context("Failed to convert seed to mnemonic")?;

        Ok(seed_words.join(" ").reveal().to_string())
    }

    pub fn get_data_dir(&self, app_handle: &AppHandle) -> Result<PathBuf, Error> {
        app_handle
            .path()
            .app_local_data_dir()
            .context("Could not get application data directory")
    }

    pub fn get_config_dir(&self, app_handle: &AppHandle) -> Result<PathBuf, Error> {
        app_handle
            .path()
            .app_config_dir()
            .context("Could not get application config directory")
    }

    pub fn get_log_dir(&self, app_handle: &AppHandle) -> Result<PathBuf, Error> {
        app_handle
            .path()
            .app_log_dir()
            .context("Could not get application log directory")
    }

    pub async fn get_binary_path(&self) -> Result<PathBuf, Error> {
        BinaryResolver::current()
            .get_binary_path(Binaries::Wallet)
            .await
            .context("Failed to resolve wallet binary path")
    }
}

/// Status monitor for the spend wallet process
#[derive(Clone, Debug)]
pub struct DummyStatusMonitor;

#[async_trait]
impl StatusMonitor for DummyStatusMonitor {
    async fn check_health(&self, _uptime: Duration, _timeout_duration: Duration) -> HealthStatus {
        // Since this is a short-lived command-line process, it's always considered healthy
        HealthStatus::Healthy
    }
}

impl ProcessAdapter for SpendWallet {
    type StatusMonitor = DummyStatusMonitor;
    type ProcessInstance = ProcessInstance;

    fn spawn_inner(
        &self,
        data_dir: PathBuf,
        _config_folder: PathBuf,
        log_dir: PathBuf,
        binary_version_path: PathBuf,
        _is_first_start: bool,
    ) -> Result<(Self::ProcessInstance, Self::StatusMonitor), anyhow::Error> {
        let log4rs_config = log_dir
            .join("spend_wallet")
            .join("configs")
            .join("log4rs_config_spend_wallet.yml");
        setup_logging(
            &log4rs_config,
            &log_dir,
            include_str!("../../log4rs/spend_wallet_sample.yml"),
        )?;

        let shared_args = self
            .get_shared_args(data_dir.clone(), log_dir)
            .context("Failed to build shared arguments")?;
        let envs = HashMap::from([(
            "MINOTARI_WALLET_PASSWORD".to_string(),
            "asjhfahjajhdfvarehnavrahuyg28397823yauifh24@@$@84y8".to_string(),
        )]);

        let instance = ProcessInstance {
            shutdown: Shutdown::new(),
            handle: None,
            startup_spec: ProcessStartupSpec {
                file_path: binary_version_path,
                envs: Some(envs),
                args: shared_args,
                pid_file_name: self.pid_file_name().to_string(),
                data_dir,
                name: self.name().to_string(),
            },
        };

        Ok((instance, DummyStatusMonitor))
    }

    fn name(&self) -> &str {
        "spend_wallet"
    }

    fn pid_file_name(&self) -> &str {
        "spend_wallet.pid"
    }
}
