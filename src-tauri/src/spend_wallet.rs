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

use crate::binaries::{Binaries, BinaryResolver};
use crate::internal_wallet::InternalWallet;
use crate::pin::PinManager;
use crate::process_adapter::{
    HealthStatus, ProcessAdapter, ProcessInstance, ProcessInstanceTrait, ProcessStartupSpec,
    StatusMonitor,
};
use crate::tasks_tracker::TasksTrackers;
use crate::utils::file_utils::convert_to_string;
use anyhow::Error;
use axum::async_trait;
use log::info;
use std::collections::HashMap;
use std::path::PathBuf;
use std::time::Duration;
use tari_key_manager::mnemonic::{Mnemonic, MnemonicLanguage};
use tari_shutdown::Shutdown;
use tauri::{AppHandle, Manager};

const LOG_TARGET: &str = "tari::universe::wallet_adapter";

pub struct SpendWallet {}

impl SpendWallet {
    pub fn new() -> Self {
        Self {}
    }

    pub async fn sign_one_sided_transaction(
        &self,
        input_file: PathBuf,
        output_file: PathBuf,
        app_handle: &AppHandle,
    ) -> Result<(), Error> {
        let seed_words = self.get_seed_words(app_handle).await?;

        let sign_command = ExecutionCommand::new("sign-one-sided-transaction")
            .with_extra_args(vec![
                "sign-one-sided-transaction".to_string(),
                "--input-file".to_string(),
                input_file.to_string_lossy().into_owned(),
                "--output-file".to_string(),
                output_file.to_string_lossy().into_owned(),
            ])
            .with_extra_envs(HashMap::from([(
                "MINOTARI_WALLET_SEED_WORDS".to_string(),
                seed_words,
            )]));

        let (exit_code, stdout, stderr) = self
            .execute_command(app_handle, sign_command, vec![0])
            .await?;

        info!(
            target: LOG_TARGET,
            "Transaction signing completed with exit code: {}",
            exit_code
        );

        Ok(())
    }

    async fn execute_command(
        &self,
        app_handle: &AppHandle,
        command: ExecutionCommand,
        allow_exit_codes: Vec<i32>,
    ) -> Result<(i32, Vec<String>, Vec<String>), Error> {
        let data_dir = app_handle
            .path()
            .app_local_data_dir()
            .expect("Could not get data dir");
        let config_dir = app_handle
            .path()
            .app_config_dir()
            .expect("Could not get config dir");
        let log_dir = app_handle
            .path()
            .app_log_dir()
            .expect("Could not get log dir");
        let binary_path = BinaryResolver::current()
            .resolve_path_to_binary_files(Binaries::Wallet)
            .await?;

        let working_dir = data_dir.join("spend_wallet");
        if !working_dir.exists() {
            std::fs::create_dir_all(&working_dir)?;
        }

        let (mut instance, _monitor) =
            self.spawn(data_dir, config_dir, log_dir, binary_path, false)?;

        instance
            .startup_spec
            .args
            .extend(command.extra_args.clone());
        instance
            .startup_spec
            .envs
            .get_or_insert_with(HashMap::new)
            .extend(command.extra_envs);

        let (exit_code, stdout_lines, stderr_lines) = instance
            .start_and_wait_for_output(
                TasksTrackers::current()
                    .wallet_phase
                    .get_task_tracker()
                    .await,
            )
            .await?;

        log::info!(
            target: LOG_TARGET,
            "Spend Wallet command '{}' execution completed with exit code: {}. Details: {{ stdout_lines: {:?}, stderr_lines: {:?}, extra_args: {:?} }}",
            command.name,
            exit_code,
            stdout_lines.join("\n"),
            stderr_lines.join("\n"),
            command.extra_args
        );

        if !allow_exit_codes.contains(&exit_code) {
            return Err(anyhow::anyhow!(
                "Command '{}' failed with exit code: {}",
                command.name,
                exit_code
            ));
        }

        Ok((exit_code, stdout_lines, stderr_lines))
    }

    fn get_shared_args(&self, data_dir: PathBuf, log_dir: PathBuf) -> Result<Vec<String>, Error> {
        let working_dir = data_dir.join("spend_wallet");
        let log_config_file = log_dir
            .join("spend_wallet")
            .join("configs")
            .join("log4rs_config_spend_wallet.yml");
        let shared_args = vec![
            "-b".to_string(),
            convert_to_string(working_dir)?,
            "--non-interactive-mode".to_string(),
            "--auto-exit".to_string(),
            format!("--log-config={}", convert_to_string(log_config_file)?),
        ];
        Ok(shared_args)
    }

    async fn get_seed_words(&self, app_handle: &AppHandle) -> Result<String, Error> {
        let pin_password = PinManager::get_validated_pin_if_defined(app_handle).await?;
        let tari_cipher_seed = InternalWallet::get_tari_seed(pin_password).await?;
        let seed_words = tari_cipher_seed.to_mnemonic(MnemonicLanguage::English, None)?;
        Ok(seed_words.join(" ").reveal().to_string())
    }
}

#[derive(Debug)]
struct ExecutionCommand {
    name: String,
    extra_args: Vec<String>,
    extra_envs: HashMap<String, String>,
}

impl ExecutionCommand {
    fn new(name: impl Into<String>) -> Self {
        Self {
            name: name.into(),
            extra_args: Vec::new(),
            extra_envs: HashMap::new(),
        }
    }

    fn with_extra_args(mut self, extra_args: Vec<String>) -> Self {
        self.extra_args.extend(extra_args);
        self
    }

    fn with_extra_envs(mut self, extra_envs: HashMap<String, String>) -> Self {
        self.extra_envs.extend(extra_envs);
        self
    }
}

#[derive(Clone)]
pub struct DummyStatusMonitor;

#[async_trait]
impl StatusMonitor for DummyStatusMonitor {
    // Question: What actually should be here?
    async fn check_health(&self, _uptime: Duration, _timeout_duration: Duration) -> HealthStatus {
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
        let shared_args = self.get_shared_args(data_dir.clone(), log_dir)?;
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
