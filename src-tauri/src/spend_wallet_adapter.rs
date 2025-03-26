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
use crate::process_adapter::{ProcessAdapter, ProcessInstance, ProcessStartupSpec, StatusMonitor};
use crate::utils::file_utils::convert_to_string;
use crate::utils::logging_utils::setup_logging;
use crate::{internal_wallet::InternalWallet, process_adapter::HealthStatus};
use anyhow::Error;
use log::info;
use std::collections::HashMap;
use std::path::PathBuf;
use tari_common::configuration::Network;
use tari_crypto::ristretto::RistrettoPublicKey;
use tari_shutdown::{Shutdown, ShutdownSignal};
use tari_utilities::hex::Hex;
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
        self.config_dir = Some(config_dir);
        self.log_dir = Some(log_dir);
        self.wallet_binary = Some(wallet_binary);

        std::fs::create_dir_all(self.get_working_dir())?;
        setup_logging(
            &self.get_log_config_file(),
            &self.get_log_dir(),
            include_str!("../log4rs/spend_wallet_sample.yml"),
        )?;

        Ok(())
    }

    pub async fn send_one_sided_to_stealth_address(
        &mut self,
        amount: String,
        destination: String,
        payment_id: Option<String>,
    ) -> Result<(), Error> {
        let seed_words = self.get_seed_words(self.get_config_dir()).await?;
        let commands = vec![
            ExecutionCommand::new("recovery")
                .with_extra_args(vec!["--recovery".to_string()])
                .with_extra_envs(HashMap::from([(
                    "MINOTARI_WALLET_SEED_WORDS".to_string(),
                    seed_words.clone(),
                )])),
            ExecutionCommand::new("sync").with_extra_args(vec!["sync".to_string()]),
            ExecutionCommand::new("send-one-sided").with_extra_args({
                let mut args = vec!["send-one-sided-to-stealth-address".to_string()];
                if let Some(id) = payment_id {
                    args.extend(vec!["--payment-id".to_string(), id]);
                }
                args.extend(vec![amount, destination]);
                args
            }),
        ];

        for command in commands {
            let (mut instance, _monitor) = self.spawn(
                self.get_data_dir(),
                self.get_config_dir(),
                self.get_log_dir(),
                self.get_wallet_binary(),
            )?;

            instance.startup_spec.args.extend(command.extra_args);
            instance
                .startup_spec
                .envs
                .get_or_insert_with(HashMap::new)
                .extend(command.extra_envs);

            instance.start().await?;
            let exit_code = instance.wait().await?;

            if exit_code != 0 {
                return Err(anyhow::anyhow!(
                    "Command '{}' failed with exit code: {}",
                    command.name,
                    exit_code
                ));
            }
        }

        self.erase_related_data().await?;
        Ok(())
    }

    async fn erase_related_data(&self) -> Result<(), Error> {
        std::fs::remove_dir_all(self.get_working_dir())?;
        Ok(())
    }

    fn get_shared_args(&self) -> Result<Vec<String>, Error> {
        let shared_args = vec![
            "-b".to_string(),
            convert_to_string(self.get_working_dir())?,
            "--non-interactive-mode".to_string(),
            "--auto-exit".to_string(),
            format!(
                "--log-config={}",
                convert_to_string(self.get_log_config_file())?
            ),
            "-p".to_string(),
            format!(
                "wallet.custom_base_node={}::{}",
                self.base_node_public_key
                    .as_ref()
                    .map(|k| k.to_hex())
                    .expect("Base node public key not set"),
                self.base_node_address
                    .as_ref()
                    .expect("Base node address not set")
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
            format!(
                "{key}.p2p.seeds.dns_seeds=ip4.seeds.{key}.tari.com,ip6.seeds.{key}.tari.com",
                key = Network::get_current_or_user_setting_or_default().as_key_str(),
            ),
        ];

        Ok(shared_args)
    }

    async fn get_seed_words(&self, config_path: PathBuf) -> Result<String, Error> {
        let internal_wallet = InternalWallet::load_or_create(config_path).await?;
        let seed_words = internal_wallet.decrypt_seed_words()?;
        Ok(seed_words.join(" ").reveal().to_string())
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
    async fn check_health(&self) -> HealthStatus {
        HealthStatus::Healthy
    }
}

impl ProcessAdapter for SpendWalletAdapter {
    type StatusMonitor = DummyStatusMonitor;

    fn spawn_inner(
        &self,
        base_folder: PathBuf,
        _config_folder: PathBuf,
        _log_folder: PathBuf,
        binary_version_path: PathBuf,
    ) -> Result<(ProcessInstance, Self::StatusMonitor), anyhow::Error> {
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
