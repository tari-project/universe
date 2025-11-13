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

// use std::time::Duration;

use log::info;
// use tari_transaction_components::tari_amount::MicroMinotari;
use tauri::{AppHandle, Manager};

// use crate::airdrop::send_new_block_mined;
// use crate::configs::config_core::ConfigCore;
// use crate::configs::trait_config::ConfigImpl;
use crate::setup::listeners::SetupFeature;
use crate::setup::setup_manager::SetupManager;
use crate::{
    events::NodeTypeUpdatePayload, events_emitter::EventsEmitter, tasks_tracker::TasksTrackers,
    UniverseAppState,
};

const LOG_TARGET: &str = "tari::universe::events_manager";

pub struct EventsManager;

impl EventsManager {
    pub async fn handle_new_block_height(app: &AppHandle, block_height: u64) {
        let state = app.state::<UniverseAppState>();
        let in_memory_config = state.in_memory_config.read().await;
        if SetupManager::get_instance()
            .features
            .read()
            .await
            .is_feature_enabled(SetupFeature::SeedlessWallet)
        {
            info!(target: LOG_TARGET, "Firing new block height event but skipping wallet scan for seedless wallet feature");
            EventsEmitter::emit_new_block_mined(block_height, None).await;

            return;
        }
        drop(in_memory_config);
        // let app_clone = app.clone();
        // let wallet_manager = state.wallet_manager.clone();

        TasksTrackers::current()
            .wallet_phase
            .get_task_tracker()
            .await
            .spawn(async move {
                // Event does not need to be fired immediately since frontend uses block height from explorer
                // match wallet_manager.wait_for_scan_to_height(block_height, Some(Duration::from_secs(20))).await {
                //     Ok(scanned_wallet_state) => {
                //         if let Some(balance) = scanned_wallet_state.balance {
                //             EventsEmitter::emit_wallet_balance_update(balance.clone()).await;
                //             // Check for coinbase transaction if there's pending balance
                //             let coinbase_tx = if balance.pending_incoming_balance.gt(&MicroMinotari::zero()) {
                //                 wallet_manager.find_coinbase_transaction_for_block(block_height).await.unwrap_or_else(|e| {
                //                     error!(target: LOG_TARGET, "Failed to get coinbase transaction: {e:?}");
                //                     None
                //                 })
                //             } else {
                //                 None
                //             };

                //             EventsEmitter::emit_new_block_mined(
                //                 block_height,
                //                 coinbase_tx.clone(),
                //             )
                //             .await;
                //             let allow_notifications = *ConfigCore::content().await.allow_notifications();
                //             if coinbase_tx.is_some() && allow_notifications {
                //                 send_new_block_mined(app_clone.clone(), block_height).await;
                //             }
                //         } else {
                //             error!(target: LOG_TARGET, "Wallet balance is None after new block height #{block_height}");
                //             EventsEmitter::emit_new_block_mined(
                //                 block_height,
                //                 None,
                //             )
                //             .await;
                //         }
                //     },
                //     Err(e) => {
                //         error!(target: LOG_TARGET, "Error waiting for wallet scan: {e}");
                //         EventsEmitter::emit_new_block_mined(
                //             block_height,
                //             None,
                //         )
                //         .await;
                //     }
                // }
            });
    }

    pub async fn handle_node_type_update(app_handle: &AppHandle) {
        let node_manager = &app_handle.state::<UniverseAppState>().node_manager;
        let node_type = Some(node_manager.get_node_type().await);
        let node_identity = node_manager.get_identity().await.ok();
        let node_connection_address = node_manager
            .get_connection_details()
            .await
            .ok()
            .map(|(_, address)| address);
        let payload = NodeTypeUpdatePayload {
            node_type,
            node_identity,
            node_connection_address,
        };

        EventsEmitter::emit_node_type_update(payload).await;
    }
}
