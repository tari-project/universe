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

use crate::port_allocator::PortAllocator;
use crate::process_adapter::{
    ProcessAdapter, ProcessInstance, ProcessInstanceTrait, ProcessStartupSpec, StatusMonitor,
};
use crate::tasks_tracker::TasksTrackers;
use crate::utils::file_utils::convert_to_string;
use crate::utils::logging_utils::setup_logging;
use crate::UniverseAppState;
use crate::{internal_wallet::InternalWallet, process_adapter::HealthStatus};
use anyhow::Error;
use log::info;
use sentry::protocol::Event;
use std::collections::{BTreeMap, HashMap};
use std::path::PathBuf;
use std::str::FromStr;
use std::time::Duration;
use tari_common::configuration::Network;
use tari_core::transactions::tari_amount::{MicroMinotari, Minotari};
use tari_crypto::ristretto::RistrettoPublicKey;
use tari_shutdown::{Shutdown, ShutdownSignal};
use tari_utilities::hex::Hex;
use tauri_plugin_sentry::sentry;
use tonic::async_trait;
// TODO: Ensure we actually need this
// #[cfg(target_os = "windows")]
// use crate::utils::windows_setup_utils::add_firewall_rule;

const LOG_TARGET: &str = "tari::universe::spend_wallet_adapter";

#[derive(Clone)]
pub struct SpendWalletAdapter {
    pub(crate) base_node_public_key: Option<RistrettoPublicKey>,
    pub(crate) base_node_address: Option<String>,
    pub(crate) tcp_listener_port: u16,
    app_shutdown: Option<ShutdownSignal>,
    data_dir: Option<PathBuf>,
    config_dir: Option<PathBuf>,
    log_dir: Option<PathBuf>,
    wallet_binary: Option<PathBuf>,
    pub(crate) wallet_birthday: Option<u16>,
}

impl SpendWalletAdapter {
    pub fn new() -> Self {
        let tcp_listener_port = PortAllocator::new().assign_port_with_fallback();
        Self {
            base_node_address: None,
            base_node_public_key: None,
            tcp_listener_port,
            app_shutdown: None,
            data_dir: None,
            config_dir: None,
            log_dir: None,
            wallet_binary: None,
            wallet_birthday: None,
        }
    }
}

impl SpendWalletAdapter {
    pub async fn init(
        &mut self,
        app_shutdown: ShutdownSignal,
        data_dir: PathBuf,
        config_dir: PathBuf,
        log_dir: PathBuf,
        wallet_binary: PathBuf,
    ) -> Result<(), Error> {
        info!(target: LOG_TARGET, "Initializing spend wallet adapter");

        self.app_shutdown = Some(app_shutdown);
        self.data_dir = Some(data_dir);
        self.config_dir = Some(config_dir.clone());
        self.log_dir = Some(log_dir);
        self.wallet_binary = Some(wallet_binary);

        // let _unused = self.erase_related_data().await;
        std::fs::create_dir_all(self.get_working_dir())?;
        setup_logging(
            &self.get_log_config_file(),
            &self.get_log_dir(),
            include_str!("../log4rs/spend_wallet_sample.yml"),
        )?;

        let wallet_birthday = self.get_wallet_birthday(config_dir.clone()).await;
        self.wallet_birthday = wallet_birthday.ok();

        Ok(())
    }

    pub async fn send_one_sided_to_stealth_address(
        &mut self,
        _amount: String,
        destination: String,
        payment_id: Option<String>,
        state: tauri::State<'_, UniverseAppState>,
    ) -> Result<(), Error> {
        let seed_words = self.get_seed_words(self.get_config_dir()).await?;
        let t_amount = Minotari::from_str(_amount.as_str())?;
        let converted_amount = MicroMinotari::from(t_amount);
        let amount = converted_amount.to_string();

        self.execute_recovery_command(&seed_words).await?;
        self.execute_sync_command().await?;

        let tx_id = self
            .execute_send_one_sided_command(&amount, &destination, payment_id)
            .await?;

        if let Some(tx_id) = tx_id {
            let exported_tx_path = self.export_transaction(&tx_id).await?;
            state
                .wallet_manager
                .import_transaction(exported_tx_path)
                .await?;
        } else {
            return Err(anyhow::anyhow!("Failed to extract Transaction ID"));
        }

        Ok(())
    }

    async fn execute_recovery_command(
        &self,
        seed_words: &str,
    ) -> Result<(i32, Vec<String>, Vec<String>), Error> {
        let base_node_public_key = self.get_base_node_public_key_hex();
        let base_node_address = self.get_base_node_address();
        let command = ExecutionCommand::new("recovery")
            .with_extra_args(vec![
                "-p".to_string(),
                format!(
                    "wallet.custom_base_node={}::{}",
                    base_node_public_key, base_node_address
                ),
                "--recovery".to_string(),
            ])
            .with_extra_envs(HashMap::from([(
                "MINOTARI_WALLET_SEED_WORDS".to_string(),
                seed_words.to_string(),
            )]));

        self.execute_command(command, vec![0, 109]).await
    }

    async fn execute_sync_command(&self) -> Result<(i32, Vec<String>, Vec<String>), Error> {
        let base_node_public_key = self.get_base_node_public_key_hex();
        let base_node_address = self.get_base_node_address();
        let command = ExecutionCommand::new("sync").with_extra_args(vec![
            "-p".to_string(),
            format!(
                "wallet.custom_base_node={}::{}",
                base_node_public_key, base_node_address
            ),
            "sync".to_string(),
        ]);

        self.execute_command(command, vec![0]).await
    }

    async fn execute_send_one_sided_command(
        &self,
        amount: &str,
        destination: &str,
        payment_id: Option<String>,
    ) -> Result<Option<String>, Error> {
        // Allocate an unused port to ensure the transaction is not successfully broadcasted.
        // This is intentional as we want to export the transaction to the view wallet instead.
        let fake_base_node_public_key = self.get_base_node_public_key_hex();
        let fake_base_node_address = format!(
            "/ip4/127.0.0.1/tcp/{:?}",
            PortAllocator::new().assign_port_with_fallback()
        );
        let mut args = vec![
            "-p".to_string(),
            format!(
                "wallet.custom_base_node={}::{}",
                fake_base_node_public_key, fake_base_node_address
            ),
            "send-one-sided-to-stealth-address".to_string(),
        ];
        if let Some(id) = payment_id {
            args.extend(vec!["--payment-id".to_string(), id]);
        }
        args.extend(vec![amount.to_string(), destination.to_string()]);

        let command = ExecutionCommand::new("send-one-sided").with_extra_args(args);

        let (_exit_code, stdout_lines, stderr_lines) =
            self.execute_command(command, vec![0]).await?;
        let tx_id = stdout_lines
            .iter()
            .find(|line| line.starts_with("Transaction ID:"))
            .and_then(|line| line.split("Transaction ID: ").nth(1))
            .map(|id| id.trim());

        if tx_id.is_none() {
            log::error!(
                target: LOG_TARGET,
                "Transaction ID not found. Details: {{ stdout_lines: {:?}, stderr_lines: {:?} }}",
                stdout_lines.join("\n"),
                stderr_lines.join("\n"),
            );
            return Err(anyhow::anyhow!(stderr_lines.join(" | ")));
        };

        Ok(tx_id.map(|id| id.to_string()))
    }

    pub async fn export_transaction(&self, tx_id: &str) -> Result<PathBuf, Error> {
        let fake_base_node_public_key = self.get_base_node_public_key_hex();
        let fake_base_node_address = format!(
            "/ip4/127.0.0.1/tcp/{:?}",
            PortAllocator::new().assign_port_with_fallback()
        );
        let output_path = self.get_working_dir().join(format!("tx-{}.json", tx_id));

        let command = ExecutionCommand::new("export-tx").with_extra_args(vec![
            "-p".to_string(),
            format!(
                "wallet.custom_base_node={}::{}",
                fake_base_node_public_key, fake_base_node_address
            ),
            "export-tx".to_string(),
            "-o".to_string(),
            output_path.to_string_lossy().to_string(),
            tx_id.to_string(),
        ]);

        let (exit_code, _stdout_lines, _stderr_lines) =
            self.execute_command(command, vec![0]).await?;

        if exit_code != 0 {
            return Err(anyhow::anyhow!(
                "Failed to export transaction with ID {}. Exit code: {}",
                tx_id,
                exit_code
            ));
        }

        Ok(output_path)
    }

    async fn execute_command(
        &self,
        command: ExecutionCommand,
        allow_exit_codes: Vec<i32>,
    ) -> Result<(i32, Vec<String>, Vec<String>), Error> {
        let (mut instance, _monitor) = self.spawn(
            self.get_data_dir(),
            self.get_config_dir(),
            self.get_log_dir(),
            self.get_wallet_binary(),
            false,
        )?;

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
            "Command '{}' execution completed with exit code: {}. Details: {{ stdout_lines: {:?}, stderr_lines: {:?}, extra_args: {:?} }}",
            command.name,
            exit_code,
            stdout_lines.join("\n"),
            stderr_lines.join("\n"),
            command.extra_args
        );

        if !allow_exit_codes.contains(&exit_code) {
            sentry::capture_event(Event {
                level: sentry::Level::Error,
                culprit: Some("SpendWallet::ExecuteCommand".to_string()),
                message: Some(format!(
                    "Command '{}' failed with exit code: {}",
                    command.name, exit_code
                )),
                extra: BTreeMap::from([
                    (
                        "exit_code".to_string(),
                        serde_json::Value::String(exit_code.to_string()),
                    ),
                    (
                        "stdout_lines".to_string(),
                        serde_json::Value::String(stdout_lines.join("\n")),
                    ),
                    (
                        "stderr_lines".to_string(),
                        serde_json::Value::String(stderr_lines.join("\n")),
                    ),
                    (
                        "command".to_string(),
                        serde_json::Value::String(command.name.clone()),
                    ),
                    (
                        "extra_args".to_string(),
                        serde_json::Value::String(format!("{:?}", command.extra_args)),
                    ),
                ]),
                ..Default::default()
            });

            // log::error!(
            //     target: LOG_TARGET,
            //     "Command '{}' failed with exit code: {}. Details: {{ stdout_lines: {:?}, stderr_lines: {:?}, extra_args: {:?} }}",
            //     command.name,
            //     exit_code,
            //     stdout_lines.join("\n"),
            //     stderr_lines.join("\n"),
            //     command.extra_args
            // );

            return Err(anyhow::anyhow!(
                "Command '{}' failed with exit code: {}",
                command.name,
                exit_code
            ));
        }

        if exit_code == 109 {
            log::info!(target: LOG_TARGET, "Spend wallet recovery skipped since it was already recovered");
        }

        Ok((exit_code, stdout_lines, stderr_lines))
    }

    fn get_shared_args(&self) -> Result<Vec<String>, Error> {
        let network = Network::get_current_or_user_setting_or_default();
        let dns_seeds = match network {
            Network::MainNet => "ip4.seeds.tari.com,ip6.seeds.tari.com".to_string(),
            _ => {
                format!(
                    "ip4.seeds.{key}.tari.com,ip6.seeds.{key}.tari.com",
                    key = network.as_key_str(),
                )
            }
        };

        let mut shared_args = vec![
            "-b".to_string(),
            convert_to_string(self.get_working_dir())?,
            "--non-interactive-mode".to_string(),
            "--auto-exit".to_string(),
            format!(
                "--log-config={}",
                convert_to_string(self.get_log_config_file())?
            ),
            "-p".to_string(),
            "wallet.p2p.transport.type=tcp".to_string(),
            "-p".to_string(),
            format!(
                "wallet.p2p.public_addresses=/ip4/127.0.0.1/tcp/{}",
                self.tcp_listener_port
            ),
            "-p".to_string(),
            format!(
                "wallet.p2p.transport.tcp.listener_address=/ip4/0.0.0.0/tcp/{}",
                self.tcp_listener_port
            ),
            "-p".to_string(),
            format!("{}.p2p.seeds.dns_seeds={}", network.as_key_str(), dns_seeds),
        ];

        match self.wallet_birthday {
            Some(wallet_birthday) => {
                shared_args.push("--birthday".to_string());
                shared_args.push(wallet_birthday.to_string());
            }
            None => {
                log::warn!(target: LOG_TARGET, "Wallet birthday not specified - wallet will scan from genesis block");
            }
        }

        Ok(shared_args)
    }

    fn get_base_node_public_key_hex(&self) -> String {
        self.base_node_public_key
            .as_ref()
            .map(|k| k.to_hex())
            .expect("Base node public key not set")
    }

    fn get_base_node_address(&self) -> &str {
        self.base_node_address
            .as_ref()
            .expect("Base node address not set")
    }

    async fn get_seed_words(&self, config_path: PathBuf) -> Result<String, Error> {
        let internal_wallet = InternalWallet::load_or_create(config_path).await?;
        let seed_words = internal_wallet.decrypt_seed_words().await?;
        Ok(seed_words.join(" ").reveal().to_string())
    }

    pub async fn get_wallet_birthday(&self, config_path: PathBuf) -> Result<u16, anyhow::Error> {
        let internal_wallet = InternalWallet::load_or_create(config_path).await?;
        internal_wallet.get_birthday().await
    }

    fn get_config_dir(&self) -> PathBuf {
        self.config_dir.clone().expect("Config dir not defined")
    }

    fn get_wallet_binary(&self) -> PathBuf {
        self.wallet_binary
            .clone()
            .expect("Wallet binary not defined")
    }

    fn get_data_dir(&self) -> PathBuf {
        self.data_dir.clone().expect("Data dir not defined")
    }

    fn get_log_dir(&self) -> PathBuf {
        self.log_dir.clone().expect("Log dir not defined")
    }

    fn get_working_dir(&self) -> PathBuf {
        self.get_data_dir().join("spend_wallet")
    }

    fn get_log_config_file(&self) -> PathBuf {
        self.get_log_dir()
            .join("spend_wallet")
            .join("configs")
            .join("log4rs_config_spend_wallet.yml")
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

impl ProcessAdapter for SpendWalletAdapter {
    type StatusMonitor = DummyStatusMonitor;
    type ProcessInstance = ProcessInstance;

    fn spawn_inner(
        &self,
        base_folder: PathBuf,
        _config_folder: PathBuf,
        _log_folder: PathBuf,
        binary_version_path: PathBuf,
        _is_first_start: bool,
    ) -> Result<(Self::ProcessInstance, Self::StatusMonitor), anyhow::Error> {
        let shared_args = self.get_shared_args()?;
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
                data_dir: base_folder,
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

    #[allow(dead_code)]
    fn with_extra_envs(mut self, extra_envs: HashMap<String, String>) -> Self {
        self.extra_envs.extend(extra_envs);
        self
    }
}
