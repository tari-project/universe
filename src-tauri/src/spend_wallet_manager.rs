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
use crate::node::node_manager::NodeManager;
use crate::spend_wallet_adapter::SpendWalletAdapter;
use crate::tasks_tracker::TasksTrackers;
use crate::BaseNodeStatus;
use crate::UniverseAppState;
use anyhow::Error;
use log::{debug, info};
use std::path::PathBuf;
use std::sync::{Arc, Mutex};
use tari_shutdown::ShutdownSignal;
use tokio::sync::watch::{self};
use tokio::task::JoinHandle;

const LOG_TARGET: &str = "tari::universe::spend_wallet_manager";
const BLOCKS_THRESHOLD: u64 = 5;

pub struct SpendWalletManager {
    adapter: SpendWalletAdapter,
    node_manager: NodeManager,
    next_wallet_data_erasure_block: Arc<Mutex<Option<u64>>>,
    cleanup_task: Arc<Mutex<Option<JoinHandle<()>>>>,
    base_node_status_rx: watch::Receiver<BaseNodeStatus>,
}

impl Clone for SpendWalletManager {
    fn clone(&self) -> Self {
        Self {
            adapter: self.adapter.clone(),
            node_manager: self.node_manager.clone(),
            next_wallet_data_erasure_block: self.next_wallet_data_erasure_block.clone(),
            cleanup_task: self.cleanup_task.clone(),
            base_node_status_rx: self.base_node_status_rx.clone(),
        }
    }
}

impl SpendWalletManager {
    pub fn new(
        node_manager: NodeManager,
        base_node_status_rx: watch::Receiver<BaseNodeStatus>,
    ) -> Self {
        let adapter = SpendWalletAdapter::new();

        Self {
            adapter,
            node_manager,
            next_wallet_data_erasure_block: Arc::new(Mutex::new(None)),
            cleanup_task: Arc::new(Mutex::new(None)),
            base_node_status_rx,
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
            .resolve_path_to_binary_files(Binaries::Wallet)
            .await?;

        self.spawn_cleanup_task(base_path.clone());
        SpendWalletManager::erase_related_data(base_path.clone())?;

        self.adapter
            .init(app_shutdown, base_path, config_path, log_path, binary_path)
            .await
    }

    fn spawn_cleanup_task(&self, base_path: PathBuf) {
        let self_clone = self.clone();
        let base_node_status_rx = self.base_node_status_rx.clone();

        let task = tokio::spawn(async move {
            self_clone
                .monitor_block_height_for_cleanup(base_node_status_rx, base_path)
                .await;
        });

        if let Ok(mut guard) = self.cleanup_task.lock() {
            *guard = Some(task);
        }
    }

    pub async fn send_one_sided_to_stealth_address(
        &mut self,
        amount: String,
        destination: String,
        payment_id: Option<String>,
        state: tauri::State<'_, UniverseAppState>,
    ) -> Result<(), Error> {
        self.node_manager.wait_ready().await?;
        let (public_key, public_address) = self.node_manager.get_connection_details().await?;
        self.adapter.base_node_public_key = Some(public_key.clone());
        self.adapter.base_node_address = Some(public_address.clone());
        info!(target: LOG_TARGET, "[send_one_sided_to_stealth_address] with node {:?}:{:?}", public_key, public_address);

        // Prevent from erasing wallet data when sending in progress
        self.set_next_wallet_data_erasure_block(None)?;

        let res = self
            .adapter
            .send_one_sided_to_stealth_address(amount, destination, payment_id, state)
            .await;

        let node_status = *self.base_node_status_rx.borrow();
        self.set_next_wallet_data_erasure_block(Some(node_status.block_height + BLOCKS_THRESHOLD))?;

        res
    }

    async fn monitor_block_height_for_cleanup(
        &self,
        mut node_status_rx: watch::Receiver<BaseNodeStatus>,
        base_path: PathBuf,
    ) {
        info!(target: LOG_TARGET, "Starting block height monitoring task for transaction cleanup");
        let mut shutdown_signal = TasksTrackers::current().wallet_phase.get_signal().await;
        loop {
            tokio::select! {
                _ = node_status_rx.changed() => {
                    let node_status = *node_status_rx.borrow();
                    let current_height = node_status.block_height;
                    let erasure_height = self.get_next_wallet_data_erasure_block();

                    if let Some(erasure_height) = erasure_height {
                        if current_height >= erasure_height {
                            info!(
                                target: LOG_TARGET,
                                "Cleanup threshold reached: {} blocks since at height {}. Erasing Spend wallet related data.",
                                BLOCKS_THRESHOLD, current_height
                            );

                            match SpendWalletManager::erase_related_data(base_path.clone()) {
                                Ok(_) => {
                                    info!(target: LOG_TARGET, "Successfully erased related data");
                                    let _unused = self.set_next_wallet_data_erasure_block(None);
                                },
                                Err(e) => {
                                    debug!(target: LOG_TARGET, "Error erasing related data: {:?}", e);
                                }
                            }
                        }
                    }
                },
                _ = shutdown_signal.wait() => {
                    break;
                },
            }
        }
    }

    pub fn erase_related_data(base_path: PathBuf) -> Result<(), Error> {
        let _unused = std::fs::remove_dir_all(base_path.join("spend_wallet"));
        Ok(())
    }

    fn get_next_wallet_data_erasure_block(&self) -> Option<u64> {
        match self.next_wallet_data_erasure_block.lock() {
            Ok(guard) => *guard,
            Err(_) => {
                log::error!(target: LOG_TARGET, "Failed to read next_wallet_data_erasure_block due to poisoned lock");
                None
            }
        }
    }

    fn set_next_wallet_data_erasure_block(&self, height: Option<u64>) -> Result<(), Error> {
        match self.next_wallet_data_erasure_block.lock() {
            Ok(mut guard) => {
                info!(target: LOG_TARGET, "Updating next wallet data erasure block to: {:?}", height);
                *guard = height;
                Ok(())
            }
            Err(_) => Err(anyhow::anyhow!(
                "Failed to write next_wallet_data_erasure_block due to poisoned lock"
            )),
        }
    }
}
