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

use std::{collections::HashMap, time::Duration};

use log::error;
use tari_core::transactions::tari_amount::MicroMinotari;
use tauri::{AppHandle, Manager};

use crate::airdrop::send_new_block_mined;
use crate::app_in_memory_config::DEFAULT_EXCHANGE_ID;
use crate::configs::config_core::ConfigCore;
use crate::configs::config_mining::ConfigMiningContent;
use crate::configs::config_wallet::ConfigWalletContent;
use crate::configs::trait_config::ConfigImpl;
use crate::events::ConnectionStatusPayload;
#[cfg(target_os = "windows")]
use crate::external_dependencies::RequiredExternalDependency;
use crate::{configs::config_core::ConfigCoreContent, events::CriticalProblemPayload};

use crate::pool_status_watcher::PoolStatus;
use crate::{
    commands::CpuMinerStatus,
    configs::config_ui::ConfigUIContent,
    events::{NodeTypeUpdatePayload, ProgressEvents, ShowReleaseNotesPayload},
    events_emitter::EventsEmitter,
    gpu_status_file::GpuDevice,
    hardware::hardware_status_monitor::GpuDeviceProperties,
    setup::setup_manager::SetupPhase,
    tasks_tracker::TasksTrackers,
    BaseNodeStatus, GpuMinerStatus, UniverseAppState,
};

const LOG_TARGET: &str = "tari::universe::events_manager";

pub struct EventsManager;

impl EventsManager {
    pub async fn handle_new_block_height(app: &AppHandle, block_height: u64) {
        let state = app.state::<UniverseAppState>();
        let in_memory_config = state.in_memory_config.read().await;
        if in_memory_config.exchange_id.ne(DEFAULT_EXCHANGE_ID) {
            return;
        }
        let app_clone = app.clone();
        let wallet_manager = state.wallet_manager.clone();

        TasksTrackers::current().wallet_phase.get_task_tracker().await.spawn(async move {
            // Use a short timeout for processing new blocks
            match wallet_manager.wait_for_scan_to_height(block_height, Some(Duration::from_secs(5))).await {
                Ok(scanned_wallet_state) => {
                    if let Some(balance) = scanned_wallet_state.balance {
                        // Check for coinbase transaction if there's pending balance
                        let coinbase_tx = if balance.pending_incoming_balance.gt(&MicroMinotari::zero()) {
                            match wallet_manager.find_coinbase_transaction_for_block(block_height).await {
                                Ok(tx) => tx,
                                Err(e) => {
                                    error!(target: LOG_TARGET, "Failed to get coinbase transaction: {:?}", e);
                                    None
                                }
                            }
                        } else {
                            None
                        };

                        EventsEmitter::emit_new_block_mined(

                            block_height,
                            coinbase_tx.clone(),
                            Some(balance),
                        )
                        .await;
                        let allow_notifications = *ConfigCore::content().await.allow_notifications();
                        if coinbase_tx.is_some() && allow_notifications {
                            send_new_block_mined(app_clone.clone(), block_height).await;
                        }
                    } else {
                        error!(target: LOG_TARGET, "Wallet balance is None after new block height #{}", block_height);
                        EventsEmitter::emit_new_block_mined(

                            block_height,
                            None,
                            None,
                        )
                        .await;
                    }
                },
                Err(e) => {
                    error!(target: LOG_TARGET, "Error waiting for wallet scan: {}", e);
                    EventsEmitter::emit_new_block_mined(
                        block_height,
                        None,
                        None,
                    )
                    .await;
                }
            }
        });
    }

    pub async fn handle_base_node_update(status: BaseNodeStatus) {
        EventsEmitter::emit_base_node_update(status).await;
    }

    pub async fn handle_connected_peers_update(connected_peers: Vec<String>) {
        EventsEmitter::emit_connected_peers_update(connected_peers).await;
    }

    #[allow(dead_code)]
    pub async fn handle_gpu_devices_update(gpu_devices: Vec<GpuDeviceProperties>) {
        let gpu_public_devices = gpu_devices
            .iter()
            .map(|gpu_device| gpu_device.public_properties.clone())
            .collect();

        EventsEmitter::emit_gpu_devices_update(gpu_public_devices).await;
    }

    pub async fn handle_pool_status_update(status: Option<PoolStatus>) {
        EventsEmitter::emit_pool_status_update(status).await;
    }

    pub async fn handle_cpu_mining_update(status: CpuMinerStatus) {
        EventsEmitter::emit_cpu_mining_update(status).await;
    }

    pub async fn handle_gpu_mining_update(status: GpuMinerStatus) {
        EventsEmitter::emit_gpu_mining_update(status).await;
    }

    pub async fn handle_close_splash_screen() {
        EventsEmitter::emit_close_splashscreen().await;
    }

    pub async fn handle_detected_devices(devices: Vec<GpuDevice>) {
        EventsEmitter::emit_detected_devices(devices).await;
    }

    pub async fn handle_detected_available_gpu_engines(
        engines: Vec<String>,
        selected_engine: String,
    ) {
        EventsEmitter::emit_detected_available_gpu_engines(engines, selected_engine).await;
    }

    pub async fn handle_restarting_phases(payload: Vec<SetupPhase>) {
        EventsEmitter::emit_restarting_phases(payload).await;
    }

    pub async fn handle_ask_for_restart() {
        EventsEmitter::emit_ask_for_restart().await;
    }

    pub async fn handle_network_status_update(
        download_speed: f64,
        upload_speed: f64,
        latency: f64,
        is_too_low: bool,
    ) {
        EventsEmitter::emit_network_status(download_speed, upload_speed, latency, is_too_low).await;
    }

    pub async fn handle_critical_problem(
        title: Option<String>,
        description: Option<String>,
        error_message: Option<String>,
    ) {
        EventsEmitter::emit_critical_problem(CriticalProblemPayload {
            title,
            description,
            error_message,
        })
        .await;
    }

    #[cfg(target_os = "windows")]
    pub async fn handle_missing_application_files(
        external_dependecies: RequiredExternalDependency,
    ) {
        EventsEmitter::emit_missing_applications(external_dependecies).await;
    }

    pub async fn handle_show_release_notes(payload: ShowReleaseNotesPayload) {
        EventsEmitter::emit_show_release_notes(payload).await;
    }

    pub async fn handle_stuck_on_orphan_chain(is_stuck: bool) {
        EventsEmitter::emit_stuck_on_orphan_chain(is_stuck).await;
    }
    pub async fn handle_progress_tracker_update(
        event_type: ProgressEvents,
        phase_title: String,
        title: String,
        progress: f64,
        title_params: Option<HashMap<String, String>>,
        is_complete: bool,
    ) {
        EventsEmitter::emit_progress_tracker_update(
            event_type,
            phase_title,
            title,
            progress,
            title_params,
            is_complete,
        )
        .await;
    }

    pub async fn handle_core_phase_finished(status: bool) {
        EventsEmitter::emit_core_phase_finished(status).await;
    }

    pub async fn handle_wallet_phase_finished(status: bool) {
        EventsEmitter::emit_wallet_phase_finished(status).await;
    }

    pub async fn handle_hardware_phase_finished(status: bool) {
        EventsEmitter::emit_hardware_phase_finished(status).await;
    }

    pub async fn handle_node_phase_finished(status: bool) {
        EventsEmitter::emit_node_phase_finished(status).await;
    }
    pub async fn handle_unknown_phase_finished(status: bool) {
        EventsEmitter::emit_unknown_phase_finished(status).await;
    }

    pub async fn handle_initial_setup_finished() {
        EventsEmitter::emit_initial_setup_finished().await;
    }

    pub async fn handle_unlock_app() {
        EventsEmitter::emit_unlock_app().await;
    }

    pub async fn handle_unlock_wallet() {
        EventsEmitter::emit_unlock_wallet().await;
    }

    pub async fn handle_unlock_cpu_mining() {
        EventsEmitter::emit_unlock_cpu_mining().await;
    }
    pub async fn handle_unlock_gpu_mining() {
        EventsEmitter::emit_unlock_gpu_mining().await;
    }
    pub async fn handle_lock_wallet() {
        EventsEmitter::emit_lock_wallet().await;
    }

    pub async fn handle_lock_cpu_mining() {
        EventsEmitter::emit_lock_cpu_mining().await;
    }
    pub async fn handle_lock_gpu_mining() {
        EventsEmitter::emit_lock_gpu_mining().await;
    }

    pub async fn handle_node_type_update(app_handle: &AppHandle) {
        let node_manager = &app_handle.state::<UniverseAppState>().node_manager;
        let node_type = node_manager.get_node_type().await.ok();
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

    pub async fn handle_config_core_loaded(payload: ConfigCoreContent) {
        EventsEmitter::emit_core_config_loaded(payload).await;
    }

    pub async fn handle_config_ui_loaded(payload: ConfigUIContent) {
        EventsEmitter::emit_ui_config_loaded(payload).await;
    }

    pub async fn handle_config_mining_loaded(payload: ConfigMiningContent) {
        EventsEmitter::emit_mining_config_loaded(payload).await;
    }

    pub async fn handle_config_wallet_loaded(payload: ConfigWalletContent) {
        EventsEmitter::emit_wallet_config_loaded(payload).await;
    }

    pub async fn handle_background_node_sync_update(progress_params: HashMap<String, String>) {
        EventsEmitter::emit_background_node_sync_update(progress_params).await;
    }

    pub async fn handle_connection_status_changed(status: ConnectionStatusPayload) {
        EventsEmitter::emit_connection_status_changed(status).await;
    }
}
