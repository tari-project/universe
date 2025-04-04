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

use crate::binaries::Binaries;
use crate::binaries::BinaryResolver;
use crate::node_manager::NodeManager;
use crate::spend_wallet_adapter::SpendWalletAdapter;
use anyhow::Error;
use log::info;
use std::path::PathBuf;
use tari_shutdown::ShutdownSignal;

const LOG_TARGET: &str = "tari::universe::spend_wallet_manager";

pub struct SpendWalletManager {
    adapter: SpendWalletAdapter,
    node_manager: NodeManager,
}

impl Clone for SpendWalletManager {
    fn clone(&self) -> Self {
        Self {
            adapter: self.adapter.clone(),
            node_manager: self.node_manager.clone(),
        }
    }
}

impl SpendWalletManager {
    pub fn new(node_manager: NodeManager) -> Self {
        let adapter = SpendWalletAdapter::new();

        Self {
            adapter,
            node_manager,
        }
    }

    pub async fn init(
        &mut self,
        app_shutdown: ShutdownSignal,
        base_path: PathBuf,
        config_path: PathBuf,
        log_path: PathBuf,
    ) -> Result<(), Error> {
        let binary_path = BinaryResolver::current()
            .read()
            .await
            .resolve_path_to_binary_files(Binaries::Wallet)?;
        self.adapter
            .init(app_shutdown, base_path, config_path, log_path, binary_path)
            .await
    }

    pub async fn send_one_sided_to_stealth_address(
        &mut self,
        amount: String,
        destination: String,
        payment_id: Option<String>,
    ) -> Result<(), Error> {
        self.node_manager.wait_ready().await?;
        let node_type = self.node_manager.get_node_type().await?;
        let node_identity = self.node_manager.get_identity().await?;
        let node_connection_address = self.node_manager.get_connection_address().await?;
        self.adapter.base_node_public_key = Some(node_identity.public_key.clone());
        self.adapter.base_node_address = Some(node_connection_address);
        info!(target: LOG_TARGET, "[send_one_sided_to_stealth_address] with {:?} Node", node_type);

        self.adapter
            .send_one_sided_to_stealth_address(amount, destination, payment_id)
            .await
    }
}
