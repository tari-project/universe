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

use crate::internal_wallet::InternalWallet;
use crate::port_allocator::PortAllocator;
use crate::process_utils::launch_child_process;
use crate::utils::file_utils::convert_to_string;
use crate::utils::logging_utils::setup_logging;
use anyhow::Error;
use log::{error, info};
use std::path::PathBuf;
use tari_common::configuration::Network;
use tari_crypto::ristretto::RistrettoPublicKey;
use tari_shutdown::ShutdownSignal;
use tari_utilities::hex::Hex;

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

    #[allow(clippy::too_many_lines)]
    pub async fn send_one_sided_to_stealth_address(
        &mut self,
        amount: String,
        destination: String,
        payment_id: Option<String>,
    ) -> Result<(), Error> {
        let seed_words = self.get_seed_words(self.get_config_dir()).await?;
        let recovery_args = self.get_recovery_args(seed_words);
        let sync_args = self.get_sync_args();
        let send_one_sided_to_stealth_address_args =
            self.get_send_one_sided_to_stealth_address_args(amount, destination, payment_id);

        let executions_args = vec![
            recovery_args,
            sync_args,
            send_one_sided_to_stealth_address_args,
        ];

        for (i, command_args) in executions_args.into_iter().enumerate() {
            match self.execute_command(command_args.clone()).await {
                Ok(status) => {
                    info!(target: LOG_TARGET, "#{} Command({:?}) executed successfully with status: {:?} ", i + 1, command_args.join(" "), status);
                }
                Err(e) => {
                    error!(target: LOG_TARGET, "#{} Command({:?}) Failed to execute: {:?}", i + 1, command_args.join(" "), e);
                    return Err(e);
                }
            }
        }

        self.erase_related_data().await?;

        Ok(())
    }

    async fn execute_command(&self, args: Vec<String>) -> Result<std::process::ExitStatus, Error> {
        let shared_args = self.get_shared_args()?;
        let joined_args = [shared_args.clone(), args].concat();
        let mut child = launch_child_process(
            &self.get_wallet_binary(),
            &self.get_data_dir(),
            None,
            &joined_args,
        )?;

        ////////////////////////////////////////////////////////// Use for debugging
        let stdout = child.stdout.take().unwrap();
        let stderr = child.stderr.take().unwrap();
        use tokio::io::{AsyncBufReadExt, BufReader};
        let mut stdout_reader = BufReader::new(stdout).lines();
        let mut stderr_reader = BufReader::new(stderr).lines();
        tokio::spawn(async move {
            while let Some(line) = stdout_reader.next_line().await.unwrap_or(None) {
                println!("[command stdout] {}", line);
            }
        });
        tokio::spawn(async move {
            while let Some(line) = stderr_reader.next_line().await.unwrap_or(None) {
                println!("[command stderr] {}", line);
            }
        });
        //////////////////////////////////////////////////////////
        let status = child.wait().await?;
        if status.success() {
            Ok(status)
        } else {
            Err(anyhow::anyhow!("Command failed with status: {:?}", status))
        }
    }

    async fn erase_related_data(&self) -> Result<(), Error> {
        std::fs::remove_dir_all(self.get_working_dir())?;
        Ok(())
    }

    fn get_shared_args(&self) -> Result<Vec<String>, Error> {
        let shared_args = vec![
            "-b".to_string(),
            convert_to_string(self.get_working_dir())?,
            "--password".to_string(),
            "asjhfahjajhdfvarehnavrahuyg28397823yauifh24@@$@84y8".to_string(), // TODO: Maybe use a random password per machine
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

    fn get_recovery_args(&self, seed_words: String) -> Vec<String> {
        vec!["--seed-words".to_string(), seed_words]
    }

    fn get_sync_args(&self) -> Vec<String> {
        vec!["sync".to_string()]
    }

    fn get_send_one_sided_to_stealth_address_args(
        &self,
        amount: String,
        destination: String,
        payment_id: Option<String>,
    ) -> Vec<String> {
        let mut args: Vec<String> = vec!["send-one-sided-to-stealth-address".to_string()];
        if let Some(id) = payment_id {
            args.push("--payment-id".to_string());
            args.push(id);
        }
        args.push(amount);
        args.push(destination);
        args
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
