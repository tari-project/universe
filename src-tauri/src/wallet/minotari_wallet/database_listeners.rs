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

use crate::tasks_tracker::TasksTrackers;
use log::{info, warn};
use minotari_wallet::{
    db::{BALANCE_CHANGE_CHANNEL, SCANNED_TIP_BLOCK_CHANNEL},
    models::{BalanceChange, ScannedTipBlock},
};
use std::future::Future;

static LOG_TARGET: &str = "tari::universe::wallet::minotari_wallet::database_listeners";

/// Listen to balance changes and invoke the provided callback for each change
pub async fn listen_to_balance_changes<F, Fut>(callback: F) -> Result<(), anyhow::Error>
where
    F: Fn(BalanceChange) -> Fut + Send + Sync + 'static,
    Fut: Future<Output = ()> + Send,
{
    let mut shutdown_signal = TasksTrackers::current().wallet_phase.get_signal().await;
    let mut balance_change_receiver = BALANCE_CHANGE_CHANNEL.1.lock().await;

    TasksTrackers::current()
        .wallet_phase
        .get_task_tracker()
        .await
        .spawn(async move {
            loop {
                tokio::select! {
                    result = balance_change_receiver.recv() => {
                        match result {
                            Some(change) => {
                                info!(
                                    target: LOG_TARGET,
                                    "New balance change: {:?}", change
                                );
                                callback(change).await;
                            }
                            None => {
                                warn!(
                                    target: LOG_TARGET,
                                    "Balance change channel closed."
                                );
                            }
                        }
                    }
                    _ = shutdown_signal.wait() => {
                        info!(
                            target: LOG_TARGET,
                            "Shutdown signal received. Terminating balance change listener."
                        );
                        break;
                    }
                }
            }
        });

    Ok(())
}

/// Listen to scanned tip blocks and invoke the provided callback for each block
pub async fn listen_to_scanned_tip_blocks<F, Fut>(callback: F) -> Result<(), anyhow::Error>
where
    F: Fn(ScannedTipBlock) -> Fut + Send + Sync + 'static,
    Fut: Future<Output = ()> + Send,
{
    let mut shutdown_signal = TasksTrackers::current().wallet_phase.get_signal().await;
    let mut scanned_tip_block_receiver = SCANNED_TIP_BLOCK_CHANNEL.1.lock().await;

    TasksTrackers::current()
        .wallet_phase
        .get_task_tracker()
        .await
        .spawn(async move {
            loop {
                tokio::select! {
                    result = scanned_tip_block_receiver.recv() => {
                        match result {
                            Some(block) => {
                                callback(block).await;
                            }
                            None => {
                                warn!(
                                    target: LOG_TARGET,
                                    "Scanned tip block channel closed."
                                );
                            }
                        }
                    }
                    _ = shutdown_signal.wait() => {
                        info!(
                            target: LOG_TARGET,
                            "Shutdown signal received. Terminating scanned tip block listener."
                        );
                        break;
                    }
                }
            }
        });

    Ok(())
}
