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

use log::error;
use std::{sync::Arc, time::Duration};

use crate::{
    wallet_adapter::{ConnectivityStatus, TransactionInfo, WalletState},
    wallet_manager::WalletManager,
};
use tokio::sync::watch::Receiver;

const LOG_TARGET: &str = "tari::universe::events_service";

#[derive(Clone)]
pub struct EventsService {
    pub wallet_state_watch_rx: Arc<Receiver<Option<WalletState>>>,
}

impl EventsService {
    pub fn new(wallet_state_watch_rx: Receiver<Option<WalletState>>) -> Self {
        Self {
            wallet_state_watch_rx: Arc::new(wallet_state_watch_rx),
        }
    }

    pub async fn wait_for_wallet_scan(
        &self,
        block_height: u64,
        timeout_duration: Duration,
    ) -> Result<WalletState, String> {
        let mut wallet_state_watch_rx = (*self.wallet_state_watch_rx).clone();
        loop {
            tokio::select! {
                // Wait for a change in the wallet state
                result = wallet_state_watch_rx.changed() => {
                    match result {
                        Ok(_) => {
                            let wallet_state = wallet_state_watch_rx.borrow().clone();
                            if let Some(wallet_state) = wallet_state {
                                if wallet_state.scanned_height >= block_height && block_height > 0 {
                                    return Ok(wallet_state); // Scan is completed
                                }
                                if wallet_state.scanned_height == 0 {
                                    let wallet_network = wallet_state.network.unwrap_or_default();
                                    if let ConnectivityStatus::Online(_) = wallet_network.status {
                                        // Scan completed before the wallet grpc server started
                                        // scanned_height will be updated with the next mined block
                                        return Ok(wallet_state);
                                    };
                                }
                                continue;
                            }
                        }
                        Err(_) => {
                            return Err("Wallet state watch channel closed".to_string());
                        }
                    }
                }
                _ = tokio::time::sleep(timeout_duration) => {
                    return Err("Timeout while waiting for wallet scan to complete".to_string());
                }
            }
        }
    }

    pub async fn get_coinbase_transaction_for_last_mined_block(
        &self,
        wallet_manager: &WalletManager,
        current_block_height: u64,
    ) -> Option<TransactionInfo> {
        match wallet_manager
            .get_coinbase_transactions(false, Some(10))
            .await
        {
            Ok(txs) => txs
                .into_iter()
                .find(|tx| tx.mined_in_block_height == current_block_height),
            Err(e) => {
                error!(target: LOG_TARGET, "Failed to get latest coinbase transaction: {:?}", e);
                None
            }
        }
    }
}
